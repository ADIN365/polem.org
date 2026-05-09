import { spawn } from "node:child_process";

import type { AiCallOptions, AiProvider } from "@/lib/ai/types";

/**
 * `claude -p` 헤드리스 subprocess provider. Max 구독 안에서 비용 0.
 * 단 *Vercel 서버리스에선 사용 불가* (CLI 없음 + 10분 timeout).
 * 로컬 launchd cron 안 batch 작업 (의제 정제, 블라인드 변환, 50:50 요약) 에서만 호출.
 *
 * 환경변수:
 *   CLAUDE_BIN   — claude 실행파일 경로 (기본: which claude)
 *   CLAUDE_MODEL — claude-haiku-4-5-20251001 (기본)
 */
export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

class ClaudeCliProvider implements AiProvider {
  readonly name = "claude-cli";

  async call(prompt: string, options: AiCallOptions = {}): Promise<string> {
    const args = ["-p", "--model", CLAUDE_MODEL, "--output-format", "text"];
    if (options.system) {
      args.push("--append-system-prompt", options.system);
    }
    args.push(prompt);

    return await new Promise<string>((resolve, reject) => {
      const proc = spawn(CLAUDE_BIN, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}` },
      });
      let out = "";
      let err = "";
      proc.stdout.on("data", (d) => (out += d.toString()));
      proc.stderr.on("data", (d) => (err += d.toString()));
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve(out.trim());
        else reject(new Error(`claude exit ${code}: ${err.slice(0, 400)}`));
      });
    });
  }
}

export const claudeCli = new ClaudeCliProvider();
