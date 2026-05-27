# Analytics read-only surface — design (DRAFT)

> Status: **DRAFT, awaiting Board sign-off via [POL-7](/POL/issues/POL-7).**
> Owner: Tech Lead (sole, per plan §8.5).
> Companion file: `prisma/analytics_views.sql`.

## Why this exists

Future agents (Analytics Lead — POL P2, plus any read-only research role) need to query Neon to study debate dynamics, prism distributions, moderation health, and AI-summary quality. The app role (`DATABASE_URL`) has full read/write on every PII column — sharing it would be a constitution violation (CLAUDE.md §2.3 Private-by-Design) and a regulatory risk (개인정보보호법).

This file defines a **separate Postgres login** (`polem_readonly`) that can ONLY see a curated `analytics` schema of pseudonymized views — never raw `public.*`, never `Account.*` (OAuth tokens), never email/name/image.

## Design principles

1. **Least privilege at the SQL layer, not the app layer.** `REVOKE ALL ON public.*` means even a buggy ORM wired to the wrong DSN can't leak. Defence at the DB.
2. **Hashed user_id, never raw.** Every per-user view substitutes `analytics.hash_user_id(user_id)` — `sha256(user_id || salt)`. Salt is stored in `analytics._secrets`, readable only by the function owner (SECURITY DEFINER).
3. **Two-tier exposure for sensitive surfaces.**
   - `prism_scores_optin` — row-level, but ONLY for `User.prismPublic = true`.
   - `prism_scores_agg` — aggregate stats over the full population.
   - `blind_answers_agg` — per-pin aggregates only; **no row-level user dimension**, ever.
4. **Explicit grants.** Every view is `GRANT SELECT`-ed by name. `ALTER DEFAULT PRIVILEGES … REVOKE ALL` ensures a new internal table in `analytics` won't auto-leak.
5. **Adding a column requires a code review.** Views explicitly enumerate columns — never `SELECT *`. A future PII column on `public.User` won't be exposed silently.
6. **Audit-friendly.** Read-only role connects with `default_transaction_read_only = on` and a `statement_timeout`, so a runaway analytics query can't lock the app DB.

## What `polem_readonly` CAN see

| View                                | Granularity      | Notes                                                                  |
| ----------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `analytics.users`                   | per-user, hashed | role, prism_public flag, warning_count, suspended, banned, ai_citation |
| `analytics.boards`                  | per-board        | title (public), category, counts, AI-summary presence + timestamp      |
| `analytics.pins`                    | per-pin, hashed  | side, **body_length only** (no raw body), quote+blind counters         |
| `analytics.endorsements`            | per-row, hashed  | pin_id + user_hash + created_at                                        |
| `analytics.reports`                 | per-row, hashed  | reporter + resolver hashed; **free-text body excluded**                |
| `analytics.proposals`               | per-row, hashed  | AI output only; **raw user input (rawTitle/rawBody) excluded**         |
| `analytics.prism_scores_optin`      | per-user, hashed | **Only `prismPublic = true` users**                                    |
| `analytics.prism_scores_agg`        | aggregate        | Full-population mean/SD per axis, no user dim                          |
| `analytics.blind_answers_agg`       | per-pin agg      | Counts only; **no per-user row exposure**                              |
| `analytics.likert_answers_agg`      | per-question agg | Question × axis × value × count                                        |
| `analytics.ai_summary_citations`    | per-row          | No PII                                                                 |
| `analytics.ai_summary_requests`     | per-row, hashed  | Operational metric; error text replaced with had_error boolean         |

## What `polem_readonly` CANNOT see (by design)

- `public.User.email`, `name`, `image`, `nickname`, `nicknameUpdatedAt` raw timestamp
- `public.Account.*` (OAuth tokens, refresh tokens, Kakao providerAccountId)
- `public.Session.*` (session tokens)
- `public.VerificationToken.*`
- `public.Pin.body`, `public.Pin.blindQuestion` (raw text)
- `public.Report.body` (free-text reporter input)
- `public.Proposal.rawTitle`, `public.Proposal.rawBody` (pre-AI user input)
- `public.Notification.*` (the notification body references specific user actions; not useful for analytics, real risk for cross-correlation)
- Any row-level `public."BlindAnswer"` data — only aggregates per pin
- Any row-level `public."LikertAnswer"` data — only aggregates per question
- `analytics._secrets` (the salt)
- Direct EXECUTE on `analytics.hash_user_id` (consumer must go through views)

## Credential storage plan

| Where                                | What                                  | Allowed?       |
| ------------------------------------ | ------------------------------------- | -------------- |
| App `DATABASE_URL` (Vercel env)      | App role connection string            | **app only**   |
| Analytics Lead adapter env (POL)     | `polem_readonly` connection string    | **here only**  |
| Tech Lead local `.env`               | App role for local dev                | **app only**   |
| `prisma/analytics_views.sql` (repo)  | DDL **without** the salt value        | OK             |
| `analytics._secrets` table (Neon)    | Salt value                            | **only place** |
| Git, launchd plists, GitHub Actions  | `polem_readonly` credential           | **NEVER**      |

The Analytics Lead agent (POL P2, when hired) receives the connection string ONLY through its adapter env, set by the CEO/Board at hire time. The Tech Lead does not retain a personal copy past provisioning.

## Salt rotation procedure (when needed)

1. Open an issue titled `[보안] analytics user_id salt rotation`.
2. Coordinate window with Analytics Lead — any cached `user_hash` values in their downstream stores will become orphaned.
3. Generate new 32-byte hex salt offline.
4. In Neon prod, in a single transaction:
   ```sql
   UPDATE analytics._secrets SET value = '<new>', rotated_at = now() WHERE key = 'user_id_salt';
   ```
5. Notify Analytics Lead to invalidate their cohort caches.
6. Document the rotation date in `CHANGELOG.md`.

The salt is **not** committed to git, so this file does not leak it. The initial salt is INSERTed by the Tech Lead in a separate operator command immediately after the migration runs (see `analytics_views.sql` §1 comment).

## Apply plan (post-Board sign-off)

1. Convert `analytics_views.sql` into a Prisma migration:
   `npx prisma migrate dev --name add_analytics_readonly_views --create-only`
   then paste the SQL into the generated `migration.sql` (Prisma will record it as applied alongside its own schema state).
2. Run the migration against Neon **dev branch first** via `prisma migrate deploy`.
3. Insert the salt (operator command, not in migration).
4. Smoke-test (see §5 in the SQL file).
5. Set `polem_readonly` password via Neon dashboard.
6. Open a follow-up issue: prod migration apply gated on `[배포 승인]` per AGENTS.md production-deploy rule.

## Open questions for Board

1. **Aggregate granularity for blind_answers.** The current draft exposes only `(pin_id → agree/disagree/unsure counts)`. Analytics Lead may eventually want cohort breakdowns (e.g. "how do prism-quadrant A users blindly answer side-CON pins?"). Cohort joins through hashed user_id would re-enable cross-correlation; doing it server-side (materialized view per quadrant) keeps the hash private. **Recommendation: defer until Analytics Lead is hired and can request specifics.**
2. **Pin body exposure.** Pin body is public on the site, but bulk-extracting all pin bodies into an analytics warehouse is a different threat model (scraping, model-training without consent). **Recommendation: keep body OUT of the view, expose body_length only; expand via a separate explicit view (e.g. `pins_with_body`) only if Analytics Lead requests and Board re-approves.**
3. **Audit logging.** Should `polem_readonly` queries be logged separately? Neon supports per-role query log shipping. **Recommendation: enable after first non-test use; tracked as follow-up.**

## Constitution checks (CLAUDE.md §2)

- §2.1 AI 사서: views are descriptive only, no judgement. ✅
- §2.2 점수 합산 거부: no "score" or "ranking" view; `ai_citation_count` is exposed as-is per the 2026-05-12 exception. ✅
- §2.3 Private-by-Design: 4축 prism only when `prismPublic = true`; blind answers aggregate-only; PII columns SQL-revoked. ✅
- §2.4 4대 함정: no personalization signal, no gamification leaderboard table. ✅
