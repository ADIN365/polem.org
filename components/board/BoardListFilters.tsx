"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { CATEGORY_OPTIONS } from "@/lib/constants";

const SORT_OPTIONS = [
  { value: "active", label: "활동순" },
  { value: "recent", label: "최신순" },
  { value: "tight", label: "팽팽한 순" },
  { value: "popular", label: "참여 많은 순" },
] as const;

export default function BoardListFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "active";

  const setParam = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    startTransition(() => {
      router.push(`/?${sp.toString()}`);
    });
  };

  return (
    <div className="px-6 py-[14px] border-b-[0.5px] border-border-soft flex gap-3 items-center flex-wrap">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam({ q: q.trim() });
        }}
        className="flex-1 min-w-[220px] relative"
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="토론 주제 검색"
          className="w-full pl-14 pr-3 py-[9px] border-[0.5px] border-border bg-card text-small text-ink rounded-md outline-none focus:border-ink"
        />
        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-eyebrow-tight tracking-wider text-ink-3 font-medium uppercase pointer-events-none">
          검색
        </span>
      </form>

      <select
        value={category}
        onChange={(e) => setParam({ category: e.target.value || null })}
        className="px-[14px] py-[9px] border-[0.5px] border-border bg-card text-meta text-ink rounded-md outline-none cursor-pointer"
      >
        <option value="">전체 분야</option>
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => setParam({ sort: e.target.value })}
        className="px-[14px] py-[9px] border-[0.5px] border-border bg-card text-meta text-ink rounded-md outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
