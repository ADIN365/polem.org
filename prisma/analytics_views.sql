-- =========================================================
-- polem.org — analytics views (DRAFT, pre-Board sign-off)
--
-- Purpose: expose a curated, PII-stripped, hashed read-only surface
-- of Neon Postgres to a dedicated `polem_readonly` role consumed by
-- the (future) Analytics Lead and other read-only agents.
--
-- Constitution refs:
--   CLAUDE.md §2.3 Private-by-Design
--   CLAUDE.md §2.4 진영 색 회피 (no party-coloured aggregates)
--   plan §6 R2 / §8.5 (Tech Lead 단독 위임)
--
-- DO NOT APPLY until POL-7 Board sign-off. After sign-off, fold this
-- file into a Prisma migration named ...add_analytics_readonly_views.
-- =========================================================

-- Required extension (Neon supports pgcrypto by default).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1. Schema + salt storage
-- =========================================================
--
-- We isolate the analytics surface in its own schema. The salt that
-- pseudonymizes user_id values lives in a private table that ONLY the
-- view-owner role can read. The read-only consumer never sees the salt.
-- =========================================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- Private salt table. Populated once at deploy time; rotated only via
-- documented procedure (see analytics_views.README.md §"Salt rotation").
CREATE TABLE IF NOT EXISTS analytics._secrets (
  key   text PRIMARY KEY,
  value text NOT NULL,
  rotated_at timestamptz NOT NULL DEFAULT now()
);

-- The salt itself is INSERTed out-of-band by an operator (Tech Lead)
-- right after this migration runs. Do NOT commit the literal salt to git.
-- Example one-shot:
--   INSERT INTO analytics._secrets (key, value)
--   VALUES ('user_id_salt', '<32-byte random hex>')
--   ON CONFLICT (key) DO NOTHING;

-- Pseudonymization function. SECURITY DEFINER so it can read the salt
-- table even when invoked by polem_readonly through a view.
CREATE OR REPLACE FUNCTION analytics.hash_user_id(uid text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = analytics, pg_temp
AS $$
  SELECT encode(
    digest(
      uid || (SELECT value FROM analytics._secrets WHERE key = 'user_id_salt'),
      'sha256'
    ),
    'hex'
  );
$$;

-- Lock down the salt table — only the function owner can read it.
REVOKE ALL ON analytics._secrets FROM PUBLIC;

-- =========================================================
-- 2. Views — PII-stripped, hashed surface
-- =========================================================
--
-- Naming convention: analytics.<entity> for row-level (hashed user_id),
-- analytics.<entity>_agg for pre-aggregated (no user dimension).
--
-- Every view explicitly enumerates exposed columns. NEVER use SELECT *
-- against public.* — that would silently leak future PII columns.
-- =========================================================

-- 2.1 users — hashed id, no email/name/image/nickname
CREATE OR REPLACE VIEW analytics.users AS
SELECT
  analytics.hash_user_id(u.id)                     AS user_hash,
  u.role::text                                     AS role,
  u."prismPublic"                                  AS prism_public,
  u."warningCount"                                 AS warning_count,
  (u."suspendedUntil" IS NOT NULL
   AND u."suspendedUntil" > now())                 AS suspended,
  u.banned                                         AS banned,
  u."aiCitationCount"                              AS ai_citation_count,
  date_trunc('day', u."createdAt")                 AS created_day,
  date_trunc('day', u."updatedAt")                 AS updated_day,
  (u."nicknameUpdatedAt" IS NOT NULL)              AS has_changed_nickname
FROM public."User" u;

-- 2.2 boards — public content; expose proposer as hash
CREATE OR REPLACE VIEW analytics.boards AS
SELECT
  b.id                                             AS board_id,
  b.title                                          AS title,
  b.category::text                                 AS category,
  b.status::text                                   AS status,
  CASE WHEN b."proposerId" IS NULL THEN NULL
       ELSE analytics.hash_user_id(b."proposerId") END AS proposer_hash,
  b."proCount"                                     AS pro_count,
  b."conCount"                                     AS con_count,
  b."viewCount"                                    AS view_count,
  b."participantCount"                             AS participant_count,
  (b."aiSummaryPro" IS NOT NULL)                   AS has_ai_summary,
  b."aiSummaryAt"                                  AS ai_summary_at,
  b."createdAt"                                    AS created_at,
  b."updatedAt"                                    AS updated_at
FROM public."Board" b;

-- 2.3 pins — content site is public, but analytics surface excludes raw
-- body. Expose body_length only. Authors are hashed.
CREATE OR REPLACE VIEW analytics.pins AS
SELECT
  p.id                                             AS pin_id,
  p."boardId"                                      AS board_id,
  analytics.hash_user_id(p."authorId")             AS author_hash,
  p.side::text                                     AS side,
  length(p.body)                                   AS body_length,
  p."quotedPinId"                                  AS quoted_pin_id,
  p."quotedRelation"::text                         AS quoted_relation,
  p."quoteAgreeCount"                              AS quote_agree_count,
  p."quoteRebutCount"                              AS quote_rebut_count,
  (p."blindQuestion" IS NOT NULL)                  AS has_blind_question,
  p."blindAgreeCount"                              AS blind_agree_count,
  p."blindDisagreeCount"                           AS blind_disagree_count,
  p.hidden                                         AS hidden,
  p.deleted                                        AS deleted,
  p."createdAt"                                    AS created_at,
  p."updatedAt"                                    AS updated_at
FROM public."Pin" p;

-- 2.4 endorsements — hashed user, hashed pin author NOT joined here
CREATE OR REPLACE VIEW analytics.endorsements AS
SELECT
  e.id                                             AS endorsement_id,
  e."pinId"                                        AS pin_id,
  analytics.hash_user_id(e."userId")               AS user_hash,
  e."createdAt"                                    AS created_at
FROM public."Endorsement" e;

-- 2.5 reports — exclude free-text body (user-authored, may contain PII)
CREATE OR REPLACE VIEW analytics.reports AS
SELECT
  r.id                                             AS report_id,
  analytics.hash_user_id(r."reporterId")           AS reporter_hash,
  r."targetType"::text                             AS target_type,
  r."targetId"                                     AS target_id,
  r."pinId"                                        AS pin_id,
  r.reason::text                                   AS reason,
  r.status::text                                   AS status,
  CASE WHEN r."resolvedById" IS NULL THEN NULL
       ELSE analytics.hash_user_id(r."resolvedById") END AS resolver_hash,
  r."resolvedAt"                                   AS resolved_at,
  r."createdAt"                                    AS created_at
FROM public."Report" r;

-- 2.6 proposals — exclude raw user input (rawTitle/rawBody); expose AI
-- output and approval metadata only.
CREATE OR REPLACE VIEW analytics.proposals AS
SELECT
  p.id                                             AS proposal_id,
  analytics.hash_user_id(p."proposerId")           AS proposer_hash,
  p."aiTitle"                                      AS ai_title,
  p."aiCategory"::text                             AS ai_category,
  p."aiDuplicateOfBoardId"                         AS ai_duplicate_of_board_id,
  p."aiFiltered"                                   AS ai_filtered,
  p.status::text                                   AS status,
  CASE WHEN p."reviewerId" IS NULL THEN NULL
       ELSE analytics.hash_user_id(p."reviewerId") END AS reviewer_hash,
  p."reviewedAt"                                   AS reviewed_at,
  (p."rejectionReason" IS NOT NULL)                AS was_rejected_with_reason,
  p."createdBoardId"                               AS created_board_id,
  p."createdAt"                                    AS created_at
FROM public."Proposal" p;

-- 2.7 prism_scores — STRICTLY opt-in (prismPublic = true). Per §2.3 the
-- 4-axis prism is private by default. The schema's User.prismPublic flag
-- is the explicit opt-in surface.
CREATE OR REPLACE VIEW analytics.prism_scores_optin AS
SELECT
  analytics.hash_user_id(ps."userId")              AS user_hash,
  ps.society                                       AS society,
  ps.ethics                                        AS ethics,
  ps.economy                                       AS economy,
  ps.change                                        AS change,
  (ps."likertCompletedAt" IS NOT NULL)             AS likert_completed,
  ps."blindCount"                                  AS blind_count,
  ps."updatedAt"                                   AS updated_at
FROM public."PrismScore" ps
JOIN public."User" u ON u.id = ps."userId"
WHERE u."prismPublic" = true;

-- 2.7b prism_scores_agg — distribution stats over the FULL population
-- (opt-in + opt-out). No row-level access; no user dimension.
CREATE OR REPLACE VIEW analytics.prism_scores_agg AS
SELECT
  count(*)                                         AS n,
  avg(ps.society)                                  AS society_mean,
  stddev_samp(ps.society)                          AS society_sd,
  avg(ps.ethics)                                   AS ethics_mean,
  stddev_samp(ps.ethics)                           AS ethics_sd,
  avg(ps.economy)                                  AS economy_mean,
  stddev_samp(ps.economy)                          AS economy_sd,
  avg(ps.change)                                   AS change_mean,
  stddev_samp(ps.change)                           AS change_sd
FROM public."PrismScore" ps;

-- 2.8 blind_answers — Per §2.3 these are body-only-visible at the user
-- level. Analytics consumes only the aggregate per pin.
CREATE OR REPLACE VIEW analytics.blind_answers_agg AS
SELECT
  ba."pinId"                                       AS pin_id,
  count(*) FILTER (WHERE ba.answer = 'AGREE')      AS agree_count,
  count(*) FILTER (WHERE ba.answer = 'DISAGREE')   AS disagree_count,
  count(*) FILTER (WHERE ba.answer = 'UNSURE')     AS unsure_count,
  count(*)                                         AS total_count
FROM public."BlindAnswer" ba
GROUP BY ba."pinId";

-- 2.9 likert_answers_agg — distribution per question, no user dimension
CREATE OR REPLACE VIEW analytics.likert_answers_agg AS
SELECT
  la."questionId"                                  AS question_id,
  la.axis                                          AS axis,
  la.value                                         AS value,
  count(*)                                         AS n
FROM public."LikertAnswer" la
GROUP BY la."questionId", la.axis, la.value;

-- 2.10 ai_summary_citations — no PII
CREATE OR REPLACE VIEW analytics.ai_summary_citations AS
SELECT
  c.id                                             AS citation_id,
  c."boardId"                                      AS board_id,
  c.side::text                                     AS side,
  c."pinId"                                        AS pin_id,
  c."order"                                        AS order_,
  c."createdAt"                                    AS created_at
FROM public."AISummaryCitation" c;

-- 2.11 ai_summary_requests — operational/health metric; truncate error
CREATE OR REPLACE VIEW analytics.ai_summary_requests AS
SELECT
  r.id                                             AS request_id,
  r."boardId"                                      AS board_id,
  analytics.hash_user_id(r."requestedById")        AS requested_by_hash,
  r.status::text                                   AS status,
  (r.error IS NOT NULL)                            AS had_error,
  r."createdAt"                                    AS created_at,
  r."processedAt"                                  AS processed_at
FROM public."AISummaryRequest" r;

-- =========================================================
-- 3. Read-only role: polem_readonly
-- =========================================================
--
-- LOGIN, no inherit, no DDL, no CREATEDB, no CREATEROLE, no REPLICATION.
-- The role is the *only* identity by which the Analytics Lead adapter
-- (and any future read-only agent) connects to Neon.
--
-- The role's *password* is provisioned in the Neon dashboard and stored
-- ONLY in the Analytics Lead's adapter env (POL governance level), never
-- in the app role's env, never in git, never in launchd plists.
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'polem_readonly') THEN
    CREATE ROLE polem_readonly
      LOGIN
      NOINHERIT
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END$$;

-- 3.1 Hard-revoke EVERYTHING on the live application schema.
REVOKE ALL ON SCHEMA public                                  FROM polem_readonly;
REVOKE ALL ON ALL TABLES IN SCHEMA public                    FROM polem_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public                 FROM polem_readonly;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public                 FROM polem_readonly;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public                  FROM polem_readonly;

-- Default privileges — future tables in public must also be inaccessible.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM polem_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM polem_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM polem_readonly;

-- 3.2 Lock down the salt table and helper schema bookkeeping.
REVOKE ALL ON analytics._secrets         FROM polem_readonly;
REVOKE ALL ON FUNCTION analytics.hash_user_id(text) FROM polem_readonly;
-- The function is SECURITY DEFINER, so polem_readonly invokes it via
-- the view layer only. Direct EXECUTE is not granted.

-- 3.3 Grant the read-only surface.
GRANT USAGE  ON SCHEMA analytics                              TO polem_readonly;

-- Explicit per-view grants (NOT "ALL TABLES" — we never want a future
-- internal table in analytics to leak to the consumer).
GRANT SELECT ON analytics.users                               TO polem_readonly;
GRANT SELECT ON analytics.boards                              TO polem_readonly;
GRANT SELECT ON analytics.pins                                TO polem_readonly;
GRANT SELECT ON analytics.endorsements                        TO polem_readonly;
GRANT SELECT ON analytics.reports                             TO polem_readonly;
GRANT SELECT ON analytics.proposals                           TO polem_readonly;
GRANT SELECT ON analytics.prism_scores_optin                  TO polem_readonly;
GRANT SELECT ON analytics.prism_scores_agg                    TO polem_readonly;
GRANT SELECT ON analytics.blind_answers_agg                   TO polem_readonly;
GRANT SELECT ON analytics.likert_answers_agg                  TO polem_readonly;
GRANT SELECT ON analytics.ai_summary_citations                TO polem_readonly;
GRANT SELECT ON analytics.ai_summary_requests                 TO polem_readonly;

-- Default privileges in analytics schema — also restrictive. Adding a
-- new view requires an explicit GRANT line above (auditable in PRs).
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics REVOKE ALL ON TABLES FROM polem_readonly;

-- =========================================================
-- 4. Connection-time safety (optional, recommend after sign-off)
-- =========================================================
-- ALTER ROLE polem_readonly SET statement_timeout = '30s';
-- ALTER ROLE polem_readonly SET idle_in_transaction_session_timeout = '60s';
-- ALTER ROLE polem_readonly SET default_transaction_read_only = on;

-- =========================================================
-- 5. Smoke test (run as superuser after applying)
-- =========================================================
--   SET ROLE polem_readonly;
--   SELECT count(*) FROM analytics.users;                  -- should work
--   SELECT email FROM public."User" LIMIT 1;               -- must ERROR
--   SELECT value FROM analytics._secrets;                  -- must ERROR
--   SELECT analytics.hash_user_id('test');                 -- must ERROR (no EXECUTE)
--   RESET ROLE;
