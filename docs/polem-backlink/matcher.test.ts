// Run: npx tsx --test docs/polem-backlink/matcher.test.ts
//
// Mock-fetch unit test for the canonical polem backlink matcher.
// Covers: lexical cosine ranking, category gate, POLEM_ELECTION_FREEZE
// branch, and network-failure fallback (must not throw).

import { test } from "node:test";
import assert from "node:assert/strict";

import { findBoardMatches, __test } from "./matcher";

type MockBoard = { id: string; title: string; category: string };

function mockFetch(boards: MockBoard[]): typeof fetch {
  return (async () =>
    ({
      ok: true,
      status: 200,
      async json() {
        return { boards };
      },
    }) as unknown as Response) as unknown as typeof fetch;
}

const BOARDS: MockBoard[] = [
  { id: "b1", title: "대통령 탄핵 청원 절차", category: "POLITICS" },
  { id: "b2", title: "청년 주거 정책 개편", category: "ECONOMY" },
  { id: "b3", title: "서울 출퇴근 시간 단축 방안", category: "SOCIETY" },
];

test("cosine ranks politics board first on matching text", async () => {
  __test.cache.clear();
  const results = await findBoardMatches("대통령 탄핵 청원과 권한 정지", {
    fetchFn: mockFetch(BOARDS),
    minScore: 0.3,
  });
  assert.ok(results.length >= 1, "expected at least one match");
  assert.equal(results[0].boardId, "b1");
  assert.equal(results[0].category, "politics");
  assert.ok(
    results[0].score >= 0.3,
    `expected score >= 0.3, got ${results[0].score}`,
  );
});

test("category gate keeps only politics + policy", async () => {
  __test.cache.clear();
  const results = await findBoardMatches(
    "대통령 정책 청년 주거 출퇴근 단축",
    {
      fetchFn: mockFetch(BOARDS),
      minScore: 0.1,
      categories: ["politics", "policy"],
    },
  );
  assert.ok(results.length >= 1, "expected at least one gated match");
  for (const r of results) {
    assert.ok(
      r.category === "politics" || r.category === "policy",
      `unexpected category ${r.category}`,
    );
  }
});

test("POLEM_ELECTION_FREEZE drops politics matches to empty", async () => {
  __test.cache.clear();
  const prev = process.env.POLEM_ELECTION_FREEZE;
  process.env.POLEM_ELECTION_FREEZE = "1";
  try {
    const results = await findBoardMatches("대통령 탄핵 청원", {
      fetchFn: mockFetch([BOARDS[0]]),
      minScore: 0.1,
      categories: ["politics"],
    });
    assert.deepEqual(results, []);
  } finally {
    if (prev === undefined) delete process.env.POLEM_ELECTION_FREEZE;
    else process.env.POLEM_ELECTION_FREEZE = prev;
  }
});

test("network failure returns empty array, never throws", async () => {
  __test.cache.clear();
  const failingFetch = (async () => {
    throw new Error("network down");
  }) as unknown as typeof fetch;
  const results = await findBoardMatches("아무 텍스트나 매칭 시도", {
    fetchFn: failingFetch,
    minScore: 0.1,
  });
  assert.deepEqual(results, []);
});
