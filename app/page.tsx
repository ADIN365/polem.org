import Link from "next/link";

import BoardListFilters from "@/components/board/BoardListFilters";
import { BoardRow, type BoardRowData } from "@/components/board/BoardRow";
import { prisma } from "@/lib/prisma";
import { Prisma, type Category } from "@prisma/client";

export const metadata = { title: "의제 색인" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface Props {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  };
}

export default async function HomePage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.BoardWhereInput = {
    status: "ACTIVE",
    ...(searchParams.q
      ? {
          OR: [
            { title: { contains: searchParams.q, mode: "insensitive" } },
            { body: { contains: searchParams.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(searchParams.category && isCategory(searchParams.category)
      ? { category: searchParams.category }
      : {}),
  };

  const sort = searchParams.sort ?? "active";
  let boards: BoardRowData[];
  let total: number;

  if (sort === "tight") {
    // 팽팽한 순 — abs(pro-con)/total ASC. ORM 표현 한계로 raw query.
    const filterCat =
      searchParams.category && isCategory(searchParams.category)
        ? Prisma.sql`AND "category"::text = ${searchParams.category}`
        : Prisma.empty;
    const filterQ = searchParams.q
      ? Prisma.sql`AND ("title" ILIKE ${"%" + searchParams.q + "%"} OR "body" ILIKE ${"%" + searchParams.q + "%"})`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      category: string;
      proCount: number;
      conCount: number;
      participantCount: number;
      viewCount: number;
      updatedAt: Date;
      createdAt: Date;
      status: string;
    }>>(Prisma.sql`
      SELECT id, title, category::text, "proCount", "conCount", "participantCount", "viewCount", "updatedAt", "createdAt", status::text
      FROM "Board"
      WHERE status::text = 'ACTIVE'
        AND ("proCount" + "conCount") > 0
        ${filterCat}
        ${filterQ}
      ORDER BY ABS("proCount" - "conCount")::float / NULLIF("proCount" + "conCount", 0) ASC,
               "participantCount" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${skip}
    `);

    total = await prisma.board.count({ where: { ...where, NOT: { proCount: 0, conCount: 0 } } });
    boards = rows.map((r, i) => ({
      ...r,
      number: skip + i + 1,
      isNew: isWithinHours(r.createdAt, 48),
    })) as BoardRowData[];
  } else {
    const orderBy = ((): Prisma.BoardOrderByWithRelationInput => {
      switch (sort) {
        case "recent":
          return { createdAt: "desc" };
        case "popular":
          return { participantCount: "desc" };
        case "active":
        default:
          return { updatedAt: "desc" };
      }
    })();

    const [rows, count] = await prisma.$transaction([
      prisma.board.findMany({
        where,
        orderBy,
        take: PAGE_SIZE,
        skip,
        select: {
          id: true,
          title: true,
          category: true,
          proCount: true,
          conCount: true,
          participantCount: true,
          viewCount: true,
          updatedAt: true,
          createdAt: true,
          status: true,
        },
      }),
      prisma.board.count({ where }),
    ]);

    total = count;
    boards = rows.map((b, i) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      proCount: b.proCount,
      conCount: b.conCount,
      participantCount: b.participantCount,
      viewCount: b.viewCount,
      updatedAt: b.updatedAt,
      status: b.status,
      number: skip + i + 1,
      isNew: isWithinHours(b.createdAt, 48),
    }));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-site mx-auto px-6 pt-8 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex justify-between items-end flex-wrap gap-3">
          <div>
            <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-[5px]">의제 색인</div>
            <h1
              className="font-serif font-semibold tracking-tight text-ink m-0"
              style={{ fontSize: "var(--fs-title-h1)" }}
            >
              지금 진행 중인 토론
            </h1>
            <div className="text-meta text-ink-3 mt-[6px] tracking-wide">
              총 {total.toLocaleString()}개 의제
            </div>
          </div>
          <Link
            href="/proposal"
            className="px-[22px] py-[14px] text-button-large font-medium bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
          >
            ＋ 의제 제안
          </Link>
        </div>

        <BoardListFilters />

        <div>
          <div className="grid grid-cols-[1fr_64px] md:grid-cols-[60px_1fr_180px_110px_70px] gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-[10px] border-b-[0.5px] border-border-soft text-eyebrow-tight tracking-wider text-ink-3 uppercase bg-soft">
            <div className="hidden md:block">번호</div>
            <div>의제</div>
            <div className="hidden md:block">찬·반 비율</div>
            <div className="text-right hidden md:block">참여</div>
            <div className="text-right">활동</div>
          </div>

          {boards.length > 0 ? (
            boards.map((b) => <BoardRow key={b.id} board={b} />)
          ) : (
            <div className="px-6 py-16 text-center text-meta text-ink-3">
              조건에 맞는 의제가 없어요. 검색어를 줄이거나 카테고리를 풀어보세요.
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            sort={searchParams.sort}
            q={searchParams.q}
            category={searchParams.category}
            shown={boards.length}
            total={total}
          />
        ) : null}
      </div>
    </div>
  );
}

function isCategory(value: string): value is Category {
  return ["POLITICS", "ECONOMY", "SOCIETY", "CULTURE", "FOREIGN_AFFAIRS", "ENVIRONMENT"].includes(value);
}

function isWithinHours(date: Date, hours: number) {
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000;
}

function buildHref(page: number, base: { sort?: string; q?: string; category?: string }) {
  const sp = new URLSearchParams();
  if (base.sort) sp.set("sort", base.sort);
  if (base.q) sp.set("q", base.q);
  if (base.category) sp.set("category", base.category);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

function Pagination({
  page,
  totalPages,
  sort,
  q,
  category,
  shown,
  total,
}: {
  page: number;
  totalPages: number;
  sort?: string;
  q?: string;
  category?: string;
  shown: number;
  total: number;
}) {
  const base = { sort, q, category };
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = start + shown - 1;
  const pages: (number | "…")[] = computePages(page, totalPages);

  return (
    <div className="px-6 py-[18px] border-t-[0.5px] border-border-soft flex justify-between items-center bg-soft">
      <div className="text-tiny text-ink-3">
        {start}~{end} / {total.toLocaleString()}개 표시 중
      </div>
      <div className="flex gap-[3px] items-center">
        <PageBtn href={buildHref(Math.max(1, page - 1), base)} disabled={page === 1}>
          ←
        </PageBtn>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="text-ink-3 px-1">
              ···
            </span>
          ) : (
            <PageBtn key={p} href={buildHref(p, base)} active={p === page}>
              {p}
            </PageBtn>
          ),
        )}
        <PageBtn href={buildHref(Math.min(totalPages, page + 1), base)} disabled={page === totalPages}>
          →
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-[5px] text-meta text-ink-3 rounded-sm">{children}</span>
    );
  }
  return (
    <Link
      href={href}
      className={[
        "px-3 py-[5px] text-meta rounded-sm border-[0.5px]",
        active
          ? "border-border bg-dark text-paper-cream"
          : "border-transparent text-ink hover:bg-card",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function computePages(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}
