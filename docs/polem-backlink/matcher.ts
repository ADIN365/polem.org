// Canonical polem.org backlink matcher for self-site bots (POL-20 / POL-39).
//
// Source of truth lives in the polem repo at this path. Bots vendor-copy this
// file into their own repo as `lib/polem-matcher.ts` and import from there.
// Do NOT add polem-internal dependencies here — the file must stay drop-in
// portable to any Node 18+ TypeScript bot.
//
// Public contract:
//   findBoardMatches(text, opts?) -> Promise<BoardMatch[]>
//
// Failure semantics:
//   On any network/API failure the matcher returns []. It MUST NOT throw —
//   bots use this at publish time and a polem outage must not stop publishing.
//
// Election freeze:
//   When `POLEM_ELECTION_FREEZE=1` is set in the bot's env, every match whose
//   category resolves to 'politics' is dropped before returning. See POL-18.

export type MatchCategory = "politics" | "policy" | "social" | "other";

export type BoardMatch = {
  boardId: string;
  title: string;
  url: string;
  /** Cosine similarity on tokenized board title vs source text. 0..1. */
  score: number;
  category: MatchCategory;
};

export type FindOptions = {
  /** Minimum cosine score to keep. Default 0.6. Tier 1 bots use 0.65. */
  minScore?: number;
  /** If set, only matches in these buckets are returned. */
  categories?: MatchCategory[];
  /** Cap on returned matches after sorting by score desc. Default 5. */
  limit?: number;
  /** Polem base URL. Default https://polem.org. */
  apiBase?: string;
  /** Injectable fetch for tests. Defaults to globalThis.fetch. */
  fetchFn?: typeof fetch;
  /** Injectable clock for cache TTL tests. Defaults to Date.now. */
  now?: () => number;
};

type ApiBoard = {
  id: string;
  title: string;
  category: string;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h, per POL-20 §4
const MAX_QUERY_TOKENS = 8;
const cache = new Map<string, { at: number; data: ApiBoard[] }>();

export async function findBoardMatches(
  text: string,
  opts: FindOptions = {},
): Promise<BoardMatch[]> {
  const {
    minScore = 0.6,
    categories,
    limit = 5,
    apiBase = "https://polem.org",
    fetchFn = globalThis.fetch,
    now = Date.now,
  } = opts;

  if (!text || text.trim().length === 0) return [];
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const q = uniq(tokens).slice(0, MAX_QUERY_TOKENS).join(" ");

  let boards: ApiBoard[];
  try {
    boards = await fetchSearch(apiBase, q, fetchFn, now);
  } catch {
    return [];
  }

  const electionFreeze =
    typeof process !== "undefined" && process.env?.POLEM_ELECTION_FREEZE === "1";

  const textVec = vectorize(tokens);
  const scored: BoardMatch[] = boards.map((b) => ({
    boardId: b.id,
    title: b.title,
    url: `${apiBase}/boards/${b.id}`,
    score: cosine(textVec, vectorize(tokenize(b.title))),
    category: mapCategory(b.category),
  }));

  return scored
    .filter((m) => m.score >= minScore)
    .filter((m) => !categories || categories.includes(m.category))
    .filter((m) => !(electionFreeze && m.category === "politics"))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function fetchSearch(
  apiBase: string,
  q: string,
  fetchFn: typeof fetch,
  now: () => number,
): Promise<ApiBoard[]> {
  const key = q.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && now() - hit.at < CACHE_TTL_MS) return hit.data;

  const url = `${apiBase}/api/boards/search?q=${encodeURIComponent(q)}`;
  const res = await fetchFn(url, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`polem search ${res.status}`);
  const json = (await res.json()) as { boards?: ApiBoard[] };
  const data = Array.isArray(json.boards) ? json.boards : [];
  cache.set(key, { at: now(), data });
  return data;
}

// Korean+English stopwords kept tiny — titles are short and over-filtering
// hurts cosine recall more than it helps precision.
const STOPWORDS = new Set([
  "그리고",
  "그러나",
  "그런데",
  "하지만",
  "그래서",
  "그러므로",
  "따라서",
  "이것",
  "저것",
  "그것",
  "and",
  "or",
  "the",
  "an",
  "is",
  "are",
  "of",
  "to",
  "in",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\p{P}]+/u)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function vectorize(tokens: string[]): Map<string, number> {
  const v = new Map<string, number>();
  for (const t of tokens) v.set(t, (v.get(t) ?? 0) + 1);
  return v;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const v of a.values()) normA += v * v;
  for (const v of b.values()) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  for (const [k, va] of a) {
    const vb = b.get(k);
    if (vb !== undefined) dot += va * vb;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function mapCategory(raw: string): MatchCategory {
  switch (raw) {
    case "POLITICS":
      return "politics";
    case "ECONOMY":
    case "ENVIRONMENT":
    case "FOREIGN_AFFAIRS":
      return "policy";
    case "SOCIETY":
      return "social";
    default:
      return "other";
  }
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

// Test seam — not part of the public bot-facing API.
export const __test = { tokenize, vectorize, cosine, mapCategory, cache };
