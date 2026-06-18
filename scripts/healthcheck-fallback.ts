#!/usr/bin/env tsx
/**
 * polem.org health-check ROUTINE-DOWN FALLBACK — launchd dead-man's-switch.
 *
 * Why this exists (see POL-209 / POL-194):
 *   The hourly Paperclip health-check routine was silently suppressed for 11 days
 *   (2026-05-16 → 2026-05-27) because a non-terminal run issue jammed the routine's
 *   `skip_if_active` concurrency policy. When the Paperclip scheduler/adapter is
 *   degraded, NOTHING independently verifies polem.org is up. This script is the
 *   independent backstop: it runs hourly under launchd (outside any Paperclip
 *   heartbeat) and opens a P0 incident issue ONLY when something is degraded.
 *
 * Design goals:
 *   - Zero noise on green. It is a dead-man's-switch, not a heartbeat. No issue,
 *     no comment, no Slack ping when everything is healthy.
 *   - Exactly one open incident at a time (dedup via local state + API search), so a
 *     multi-hour outage produces one incident with follow-up comments, not 1/hour.
 *   - Graceful degradation: if the durable Paperclip credential is not yet
 *     provisioned, the script still runs all checks and, on degradation, writes a
 *     LOUD local alert (its own log + stderr, captured by launchd) and exits
 *     non-zero. It is useful before the credential lands; it just cannot auto-open
 *     a Paperclip issue until then.
 *
 * The four checks (mirror the routine — AGENTS.md → Hourly health-check):
 *   1. curl prod root            → expect HTTP 200
 *   2. Neon `SELECT 1` liveness  → expect success
 *   3. tail launchd/*.log        → fatal/error in the last hour (WARN only, see below)
 *   4. latest Vercel prod deploy → expect not ERROR/CANCELED
 *
 * Severity policy (low false-positive by design):
 *   HARD failures that open a P0: prod curl != 200, or DB SELECT 1 fails. These are
 *   the authoritative "is polem.org actually up?" signals.
 *   WARN (attached to an incident opened for another reason, but never open a P0 on
 *   their own — a dead-man's-switch must not cry wolf):
 *     - latest Vercel prod deploy ERROR/CANCELED. A failed deploy that was NOT
 *       promoted does not take the live site down (the previous READY deploy keeps
 *       serving); curl 200 is the authoritative availability signal. A failed deploy
 *       is a pipeline problem worth surfacing, not a site outage. Promote to hard
 *       only alongside a failing curl. Override with HEALTHCHECK_VERCEL_IS_HARD=1.
 *     - recent fatal/error lines in launchd/*.log (worker logs routinely contain
 *       transient error lines). Override with HEALTHCHECK_LOG_ERRORS_ARE_HARD=1.
 *
 * Credentials (no secret is committed — secret-rotation lens, every location):
 *   - DATABASE_URL          ← ~/polem/.env (loaded via dotenv)
 *   - VERCEL_TOKEN          ← ~/.secrets/vercel.env
 *   - Paperclip incident credential ← ~/.secrets/polem-healthcheck.env (NEW; CEO/
 *     operator provisions — see POL-209). Keys:
 *       PAPERCLIP_API_URL
 *       PAPERCLIP_COMPANY_ID
 *       PAPERCLIP_HEALTHCHECK_API_KEY            (durable agent key, issue-create scope)
 *       PAPERCLIP_HEALTHCHECK_ASSIGNEE_AGENT_ID  (TechLead agent id)
 *     Optional out-of-band fallback (used only if the Paperclip API itself is
 *     unreachable — the deeper failure mode):
 *       HEALTHCHECK_SLACK_WEBHOOK_URL
 *
 * Flags:
 *   --dry-run   run all checks, print what WOULD be alerted, never POST to Paperclip/Slack.
 *   --verbose   print per-check detail even on green.
 *
 * Test overrides (for the forced-failure dry run in the done-criteria):
 *   HEALTHCHECK_FORCE_DB_URL=<bad-url>   force the DB check to use a bad URL.
 *   HEALTHCHECK_FORCE_PROD_URL=<url>     force the curl check to hit a bad URL.
 *
 * KST cadence: launchd StartCalendarInterval Minute=0 → top of every hour (the Mac
 * mini runs in KST). Documented in plan §4 schedule.
 */
import "dotenv/config";

import { existsSync, readFileSync, writeFileSync, statSync, unlinkSync, appendFileSync, mkdirSync } from "node:fs";
import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

import { PrismaClient } from "@prisma/client";

// ─── constants ──────────────────────────────────────────────────────────────
const REPO_DIR = "/Users/ddgeet/polem";
const SECRETS_FILE = join(homedir(), ".secrets", "polem-healthcheck.env");
const VERCEL_SECRETS_FILE = join(homedir(), ".secrets", "vercel.env");
const LOCK = "/tmp/polem-healthcheck-fallback.lock";
const STATE_FILE = "/tmp/polem-healthcheck-incident.json"; // last open incident dedup
const OWN_LOG = join(REPO_DIR, "launchd", "healthcheck-fallback.log");
const OWN_LOG_MAX_BYTES = 1_000_000; // self-rotation cap (≈1 MB)

const PROD_URL = process.env.HEALTHCHECK_FORCE_PROD_URL || process.env.POLEM_PROD_URL || "https://polem.org";
const VERCEL_PROJECT_ID = "prj_3H0y9srOIndPzHwIooB8HEN5qfAJ"; // .vercel/project.json
const VERCEL_TEAM_ID = "team_a5zihvTZ0u0bJxl7Ond9TX3e"; // .vercel/project.json orgId
const HTTP_TIMEOUT_MS = 10_000;
const DB_TIMEOUT_MS = 10_000;
const INCIDENT_TITLE_MARKER = "auto/health-fallback"; // stable dedup marker in the title
const CEO_AGENT_ID = "813cf739-6de4-4b83-b459-0c1ae07842d4"; // for the P0 mention/wake

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// ─── tiny KEY=VALUE .env loader (for ~/.secrets/*.env, no override of process.env) ──
function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// ─── own-log helper (concise, self-rotating) ─────────────────────────────────
function log(line: string) {
  const stamped = `${new Date().toISOString()} ${line}`;
  // stdout/stderr is captured by launchd; the own-log is the durable trail.
  console.log(stamped);
  try {
    mkdirSync(dirname(OWN_LOG), { recursive: true });
    if (existsSync(OWN_LOG) && statSync(OWN_LOG).size > OWN_LOG_MAX_BYTES) {
      // rotate: keep one previous generation
      writeFileSync(`${OWN_LOG}.1`, readFileSync(OWN_LOG));
      writeFileSync(OWN_LOG, "");
    }
    appendFileSync(OWN_LOG, stamped + "\n");
  } catch {
    /* logging must never crash the check */
  }
}

// ─── check result type ───────────────────────────────────────────────────────
type Severity = "ok" | "warn" | "hard";
interface CheckResult {
  name: string;
  severity: Severity;
  detail: string;
}

// ─── 1. prod curl ─────────────────────────────────────────────────────────────
async function checkProd(): Promise<CheckResult> {
  const name = "prod-http";
  try {
    const res = await fetch(PROD_URL, { redirect: "manual", signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
    const ok = res.status === 200;
    return { name, severity: ok ? "ok" : "hard", detail: `${PROD_URL} → HTTP ${res.status}` };
  } catch (e) {
    return { name, severity: "hard", detail: `${PROD_URL} → fetch failed: ${errMsg(e)}` };
  }
}

// ─── 2. Neon SELECT 1 liveness ────────────────────────────────────────────────
async function checkDb(): Promise<CheckResult> {
  const name = "db-select1";
  const forced = process.env.HEALTHCHECK_FORCE_DB_URL;
  const url = forced || process.env.DATABASE_URL;
  if (!url) return { name, severity: "hard", detail: "DATABASE_URL not set" };
  const prisma = new PrismaClient({ datasources: { db: { url } }, log: ["error"] });
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_TIMEOUT_MS, "db SELECT 1");
    return { name, severity: "ok", detail: `SELECT 1 ok${forced ? " (FORCED URL)" : ""}` };
  } catch (e) {
    return { name, severity: "hard", detail: `SELECT 1 failed: ${errMsg(e)}` };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// ─── 3. tail launchd/*.log for fatal/error in the last hour (WARN by default) ──
function checkLogs(): CheckResult {
  const name = "launchd-logs";
  const logDir = join(REPO_DIR, "launchd");
  const hardThreshold = process.env.HEALTHCHECK_LOG_ERRORS_ARE_HARD === "1";
  const oneHourAgo = Date.now() - 65 * 60 * 1000; // 65 min slack
  const errRe = /(fatal|error|치명|에러|unhandled|ECONNREFUSED|exited with)/i;
  const offenders: string[] = [];
  try {
    for (const f of readdirSync(logDir)) {
      if (!f.endsWith(".log")) continue;
      if (f === "healthcheck-fallback.log") continue; // don't scan our own log
      const p = join(logDir, f);
      const st = statSync(p);
      if (st.mtimeMs < oneHourAgo) continue; // only logs touched in the last hour
      const tail = readTail(p, 200);
      const hits = tail.split("\n").filter((l) => errRe.test(l));
      if (hits.length) offenders.push(`${f}: ${hits.length} err line(s) — e.g. "${hits[hits.length - 1].slice(0, 120)}"`);
    }
  } catch (e) {
    return { name, severity: "warn", detail: `log scan error: ${errMsg(e)}` };
  }
  if (!offenders.length) return { name, severity: "ok", detail: "no recent error lines" };
  return { name, severity: hardThreshold ? "hard" : "warn", detail: offenders.join(" | ") };
}

// ─── 4. latest Vercel prod deploy status ──────────────────────────────────────
async function checkVercel(): Promise<CheckResult> {
  const name = "vercel-deploy";
  const token = loadEnvFile(VERCEL_SECRETS_FILE).VERCEL_TOKEN || process.env.VERCEL_TOKEN;
  if (!token) return { name, severity: "warn", detail: "VERCEL_TOKEN not available — skipped" };
  const u = `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&target=production&limit=1`;
  try {
    const res = await fetch(u, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!res.ok) return { name, severity: "warn", detail: `Vercel API HTTP ${res.status} — skipped` };
    const body = (await res.json()) as {
      deployments?: Array<{ state?: string; readyState?: string; url?: string; created?: number; createdAt?: number }>;
    };
    const d = body.deployments?.[0];
    if (!d) return { name, severity: "warn", detail: "no prod deployments returned" };
    const state = (d.state || d.readyState || "UNKNOWN").toUpperCase();
    const bad = state === "ERROR" || state === "CANCELED";
    // Only a RECENT failed deploy is actionable. A stale failed/non-promoted deploy
    // (the previous READY one keeps serving; curl 200 is authoritative) is not a
    // health signal — treat as ok-with-note to avoid a permanent WARN.
    const createdMs = d.created ?? d.createdAt ?? 0;
    const ageHrs = createdMs ? (Date.now() - createdMs) / 3_600_000 : Infinity;
    const recentWindowHrs = Number(process.env.HEALTHCHECK_VERCEL_RECENT_HRS ?? "6");
    if (bad && ageHrs <= recentWindowHrs) {
      const sev: Severity = process.env.HEALTHCHECK_VERCEL_IS_HARD === "1" ? "hard" : "warn";
      return { name, severity: sev, detail: `RECENT prod deploy ${d.url ?? ""} → ${state} (${ageHrs.toFixed(1)}h ago)` };
    }
    if (bad) {
      return { name, severity: "ok", detail: `latest prod deploy ${state} but stale (${ageHrs.toFixed(0)}h ago); serving deploy healthy` };
    }
    return { name, severity: "ok", detail: `latest prod deploy ${d.url ?? ""} → ${state}` };
  } catch (e) {
    // Network failure reaching Vercel is not itself a polem.org outage → warn, not hard.
    return { name, severity: "warn", detail: `Vercel check failed: ${errMsg(e)}` };
  }
}

// ─── incident creation / dedup ────────────────────────────────────────────────
interface PaperclipCfg {
  apiUrl: string;
  companyId: string;
  apiKey: string;
  assigneeAgentId?: string;
}

function loadPaperclipCfg(): PaperclipCfg | null {
  const s = loadEnvFile(SECRETS_FILE);
  const apiUrl = s.PAPERCLIP_API_URL || process.env.PAPERCLIP_API_URL;
  const companyId = s.PAPERCLIP_COMPANY_ID || process.env.PAPERCLIP_COMPANY_ID;
  const apiKey = s.PAPERCLIP_HEALTHCHECK_API_KEY || process.env.PAPERCLIP_HEALTHCHECK_API_KEY;
  const assigneeAgentId = s.PAPERCLIP_HEALTHCHECK_ASSIGNEE_AGENT_ID || process.env.PAPERCLIP_HEALTHCHECK_ASSIGNEE_AGENT_ID;
  if (!apiUrl || !companyId || !apiKey) return null;
  return { apiUrl, companyId, apiKey, assigneeAgentId };
}

interface IncidentState {
  issueId: string;
  identifier?: string;
  openedAt: string;
}

function readState(): IncidentState | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as IncidentState;
  } catch {
    return null;
  }
}

function writeState(s: IncidentState | null) {
  try {
    if (s === null) {
      if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
    } else {
      writeFileSync(STATE_FILE, JSON.stringify(s));
    }
  } catch {
    /* state is best-effort */
  }
}

const OPEN_STATUSES = new Set(["todo", "backlog", "in_progress", "in_review", "blocked"]);

async function findExistingOpenIncident(cfg: PaperclipCfg): Promise<IncidentState | null> {
  // 1) trust local state if the recorded incident is still open
  const local = readState();
  if (local) {
    try {
      const res = await fetch(`${cfg.apiUrl}/api/issues/${local.issueId}`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });
      if (res.ok) {
        const issue = (await res.json()) as { id: string; identifier?: string; status?: string };
        if (issue.status && OPEN_STATUSES.has(issue.status)) {
          return { issueId: issue.id, identifier: issue.identifier, openedAt: local.openedAt };
        }
      }
    } catch {
      /* fall through to API search */
    }
  }
  // 2) API search by stable marker
  try {
    const res = await fetch(
      `${cfg.apiUrl}/api/companies/${cfg.companyId}/issues?q=${encodeURIComponent(INCIDENT_TITLE_MARKER)}&status=todo,in_progress,in_review,blocked`,
      { headers: { Authorization: `Bearer ${cfg.apiKey}` }, signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) },
    );
    if (res.ok) {
      const list = (await res.json()) as Array<{ id: string; identifier?: string; title?: string; status?: string }>;
      const hit = (Array.isArray(list) ? list : []).find(
        (i) => i.title?.includes(INCIDENT_TITLE_MARKER) && i.status && OPEN_STATUSES.has(i.status),
      );
      if (hit) return { issueId: hit.id, identifier: hit.identifier, openedAt: new Date().toISOString() };
    }
  } catch {
    /* no existing incident found / search unavailable */
  }
  return null;
}

async function createIncident(cfg: PaperclipCfg, title: string, body: string): Promise<IncidentState | null> {
  const res = await fetch(`${cfg.apiUrl}/api/companies/${cfg.companyId}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description: body,
      priority: "critical",
      status: "todo",
      ...(cfg.assigneeAgentId ? { assigneeAgentId: cfg.assigneeAgentId } : {}),
    }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!res.ok) {
    log(`[fallback] incident create FAILED: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const issue = (await res.json()) as { id: string; identifier?: string };
  return { issueId: issue.id, identifier: issue.identifier, openedAt: new Date().toISOString() };
}

async function commentOnIncident(cfg: PaperclipCfg, issueId: string, body: string): Promise<boolean> {
  const res = await fetch(`${cfg.apiUrl}/api/issues/${issueId}/comments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ body }), // API field is `body` (Zod-required)
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  // Best-effort: a follow-up comment may 409 if the incident is actively checked out
  // by the run working it. That is acceptable — the incident already exists and no
  // duplicate is created. We only need to avoid opening a second incident.
  return res.ok;
}

// ─── Slack out-of-band fallback (only when Paperclip API is unreachable) ────────
async function slackAlert(text: string): Promise<boolean> {
  // 텔레그램 동시 발송 (~/.secrets/telegram.env). 미설정 시 조용히 skip.
  try {
    const tg = loadEnvFile(`${process.env.HOME}/.secrets/telegram.env`);
    const tok = tg.TELEGRAM_BOT_TOKEN, chat = tg.TELEGRAM_CHAT_ID;
    if (tok && chat) {
      await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });
    }
  } catch { /* ignore */ }
  const url = loadEnvFile(SECRETS_FILE).HEALTHCHECK_SLACK_WEBHOOK_URL || process.env.HEALTHCHECK_SLACK_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────────
function errMsg(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  // collapse whitespace/newlines so it renders as a single tidy line in the incident
  return raw.replace(/\s+/g, " ").trim().slice(0, 300);
}
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}
function readTail(path: string, lines: number): string {
  const content = readFileSync(path, "utf8");
  const arr = content.split("\n");
  return arr.slice(Math.max(0, arr.length - lines)).join("\n");
}

function buildIncidentBody(hard: CheckResult[], all: CheckResult[]): string {
  const now = new Date().toISOString();
  const rows = all
    .map((c) => `- **${c.name}** — ${c.severity.toUpperCase()}: ${c.detail}`)
    .join("\n");
  return [
    "## P0 — polem.org 헬스체크 실패 (launchd dead-man's-switch)",
    "",
    "이 인시던트는 **시간별 헬스체크 routine 의 폴백**(launchd `com.polem.healthcheck-fallback`)이 자동 생성했습니다.",
    "폴백이 떴다는 것은 **Paperclip routine 자체가 멈췄을 가능성**(routine-down)을 시사하므로,",
    "routine `12b5362b` ([POL-194](/POL/issues/POL-194)) 상태도 함께 확인하세요.",
    "",
    `**발생 시각:** ${now}`,
    `**실패 항목(HARD):** ${hard.map((h) => h.name).join(", ")}`,
    "",
    "### 4대 점검 결과",
    rows,
    "",
    "### 다음 행동",
    "1. polem.org 접속/로그인 직접 확인 → 다운이면 `vercel rollback` 가능성 검토 (AGENTS.md 롤백 규칙).",
    "2. Neon 콘솔에서 DB 상태 확인.",
    "3. Paperclip routine `12b5362b` 가 멈췄는지 확인하고 unjam.",
    "4. 원인 파악 후 이 이슈에 사후 분석 기록.",
    "",
    // HEALTHCHECK_SUPPRESS_MENTION=1 omits the wake during verification runs.
    process.env.HEALTHCHECK_SUPPRESS_MENTION === "1"
      ? "(자동 P0 알림 — 멘션 생략됨/테스트)"
      : `[@CEO](agent://${CEO_AGENT_ID}) — 자동 P0 알림.`,
  ].join("\n");
}

// ─── main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (existsSync(LOCK)) {
    log("[fallback] another run in progress; skip.");
    return;
  }
  writeFileSync(LOCK, `${process.pid} ${new Date().toISOString()}\n`);
  try {
    const results: CheckResult[] = [];
    results.push(await checkProd());
    results.push(await checkDb());
    results.push(checkLogs());
    results.push(await checkVercel());

    const hard = results.filter((r) => r.severity === "hard");
    const degraded = hard.length > 0;

    if (VERBOSE || degraded) {
      for (const r of results) log(`[fallback] ${r.severity.toUpperCase()} ${r.name}: ${r.detail}`);
    }

    if (!degraded) {
      log("[fallback] ALL GREEN — staying silent (no issue, no ping).");
      return; // dead-man's-switch: zero noise on green
    }

    // ── degraded ──────────────────────────────────────────────────────────────
    const title = `[P0][${INCIDENT_TITLE_MARKER}] polem.org 헬스체크 실패 — ${hard.map((h) => h.name).join("/")}`;
    const body = buildIncidentBody(hard, results);

    if (DRY_RUN) {
      log("[fallback] DRY-RUN — would open/append a P0 incident:");
      log(`[fallback] title: ${title}`);
      log(`[fallback] body:\n${body}`);
      process.exitCode = 2;
      return;
    }

    const cfg = loadPaperclipCfg();
    if (!cfg) {
      // Credential not provisioned yet → loud local alert, exit non-zero.
      log("[fallback] DEGRADED but no Paperclip credential at " + SECRETS_FILE + " — cannot auto-open incident.");
      log("[fallback] DEGRADED title: " + title);
      const slacked = await slackAlert(`:rotating_light: polem.org 헬스체크 실패 (credential 미설정)\n${title}`);
      log(`[fallback] out-of-band Slack: ${slacked ? "sent" : "not configured"}`);
      process.exitCode = 3;
      return;
    }

    const existing = await findExistingOpenIncident(cfg);
    if (existing) {
      const ok = await commentOnIncident(
        cfg,
        existing.issueId,
        `## 헬스체크 폴백 — 여전히 DEGRADED (${new Date().toISOString()})\n\n` +
          results.map((c) => `- **${c.name}** — ${c.severity.toUpperCase()}: ${c.detail}`).join("\n"),
      );
      writeState(existing);
      log(`[fallback] existing incident ${existing.identifier ?? existing.issueId} still open → commented (${ok ? "ok" : "FAILED"}).`);
      process.exitCode = 2;
      return;
    }

    const created = await createIncident(cfg, title, body);
    if (created) {
      writeState(created);
      log(`[fallback] opened P0 incident ${created.identifier ?? created.issueId}.`);
      process.exitCode = 2;
    } else {
      // Paperclip API unreachable → out-of-band Slack (deeper failure mode).
      const slacked = await slackAlert(`:rotating_light: polem.org 헬스체크 실패 — Paperclip API 도달 불가\n${title}`);
      log(`[fallback] incident create failed; out-of-band Slack: ${slacked ? "sent" : "not configured"}.`);
      process.exitCode = 3;
    }
  } finally {
    if (existsSync(LOCK)) unlinkSync(LOCK);
  }
}

main().catch((e) => {
  log(`[fallback] FATAL: ${errMsg(e)}`);
  if (existsSync(LOCK)) {
    try {
      unlinkSync(LOCK);
    } catch {
      /* ignore */
    }
  }
  process.exit(1);
});
