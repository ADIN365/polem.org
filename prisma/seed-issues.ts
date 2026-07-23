// 시드 쟁점 — 사이트가 바로 채워지도록 사회쟁점 + 일상 밸런스 혼합.
// 근거는 양측 균형(각 4개), 중립 톤. 초기 투표수는 0 (실제 참여로 채움).
import { PrismaClient, type Category } from "@prisma/client";

const prisma = new PrismaClient();

interface Seed {
  slug: string;
  title: string;
  question: string;
  summary: string;
  body: string;
  category: Category;
  proLabel: string;
  conLabel: string;
  proArgs: string[];
  conArgs: string[];
  aiBalance: string;
  tags: string[];
}

const ISSUES: Seed[] = [
  {
    slug: "death-penalty",
    title: "사형제 유지 vs 폐지, 찬반 근거 정리",
    question: "사형제, 유지해야 할까?",
    summary: "흉악범죄 응보와 예방이냐, 오판 불가역성과 인권이냐.",
    body: "한국은 1997년 이후 사형을 집행하지 않아 '실질적 사형 폐지국'으로 분류되지만, 법에는 사형제가 남아 있다. 흉악범죄가 발생할 때마다 존폐 논쟁이 반복된다.",
    category: "SOCIETY",
    proLabel: "유지",
    conLabel: "폐지",
    proArgs: [
      "흉악범죄에 대한 응보(應報)로서 피해자·유족의 정의 감정에 부합한다.",
      "극형의 존재가 강력범죄를 억제하는 예방 효과가 있다는 주장이 있다.",
      "재범이 원천 차단되어 사회를 확실히 보호할 수 있다.",
      "여론조사에서 다수 국민이 제도 유지에 찬성해 왔다.",
    ],
    conArgs: [
      "오판 시 되돌릴 수 없다 — 무고한 사람의 생명을 국가가 앗을 위험.",
      "사형의 범죄 억제 효과는 통계적으로 명확히 입증되지 않았다.",
      "생명권은 국가가 박탈할 수 없는 기본권이라는 인권적 반론.",
      "국제 인권 규범과 다수 선진국은 사형 폐지 추세다.",
    ],
    aiBalance:
      "유지 측은 응보와 사회 보호를, 폐지 측은 오판의 불가역성과 생명권을 근거로 든다. 억제 효과의 실증은 양측 모두 결정적이지 않다.",
    tags: ["사형제", "형벌", "인권"],
  },
  {
    slug: "basic-income",
    title: "기본소득 도입 찬반 근거 정리",
    question: "전 국민 기본소득, 도입해야 할까?",
    summary: "복지 사각지대 해소와 자동화 대비냐, 재원 부담과 근로의욕이냐.",
    body: "기본소득은 소득·재산·근로 여부와 무관하게 모든 국민에게 일정액을 지급하는 제도다. AI·자동화로 인한 일자리 변화 논의와 함께 관심이 커졌다.",
    category: "SOCIETY",
    proLabel: "도입",
    conLabel: "반대",
    proArgs: [
      "복지 사각지대를 없애고 모두에게 최소한의 소득 안전망을 제공한다.",
      "자동화로 일자리가 줄어드는 시대에 대비하는 소득 기반이 된다.",
      "선별 복지의 행정비용·낙인효과를 줄일 수 있다.",
      "안정적 소득이 창업·교육 등 도전을 가능하게 한다.",
    ],
    conArgs: [
      "막대한 재원이 필요해 증세나 기존 복지 축소가 불가피하다.",
      "근로 의욕을 떨어뜨릴 수 있다는 우려가 있다.",
      "부자에게도 지급하는 것은 비효율적이라는 비판.",
      "물가 상승으로 지급액의 실질 가치가 상쇄될 수 있다.",
    ],
    aiBalance:
      "도입 측은 보편적 안전망과 미래 대비를, 반대 측은 재원과 근로유인 문제를 강조한다. 핵심 쟁점은 '재원을 어떻게, 얼마나'로 모인다.",
    tags: ["기본소득", "복지", "재정"],
  },
  {
    slug: "retirement-age-65",
    title: "정년 65세 연장, 찬반 근거 정리",
    question: "법정 정년, 65세로 올려야 할까?",
    summary: "고령 빈곤·연금 공백 해소냐, 청년 일자리·기업 부담이냐.",
    body: "현재 법정 정년은 60세다. 고령화와 국민연금 수급 개시 연령 상향에 맞춰 정년을 65세로 늘리자는 논의가 있다.",
    category: "WORK",
    proLabel: "연장",
    conLabel: "반대",
    proArgs: [
      "연금 수급 개시 전 '소득 공백기'를 줄여 고령 빈곤을 완화한다.",
      "숙련 인력을 더 오래 활용해 생산성을 유지할 수 있다.",
      "고령화로 줄어드는 생산가능인구를 보완한다.",
      "일할 의사와 능력이 있는 사람의 기회를 보장한다.",
    ],
    conArgs: [
      "청년 신규 채용이 줄어드는 '세대 간 일자리 충돌' 우려.",
      "연공서열 임금체계에서 기업의 인건비 부담이 커진다.",
      "임금피크제 등 보완 없이는 기업 반발이 크다.",
      "직무·성과 중심 개편이 선행돼야 한다는 반론.",
    ],
    aiBalance:
      "연장 측은 고령 소득 공백과 인력 활용을, 반대 측은 청년 고용과 기업 부담을 든다. 임금체계 개편이 함께 논의되는 게 보통이다.",
    tags: ["정년", "고용", "연금"],
  },
  {
    slug: "jeonse-vs-wolse",
    title: "전세 vs 월세, 뭐가 나을까",
    question: "지금 집 구한다면, 전세 vs 월세?",
    summary: "목돈 묶고 주거비 아끼느냐, 유동성 지키고 리스크 줄이느냐.",
    body: "전세는 큰 보증금을 맡기고 매달 임대료가 거의 없는 한국 특유의 제도, 월세는 적은 보증금에 매달 임대료를 낸다. 금리와 전세사기 우려에 따라 선택이 갈린다.",
    category: "MONEY",
    proLabel: "전세",
    conLabel: "월세",
    proArgs: [
      "매달 나가는 주거비가 관리비 수준으로 적다.",
      "보증금을 나중에 돌려받아 '거주비 0'에 가깝게 볼 수 있다.",
      "장기 거주 시 월세 누적보다 유리할 수 있다.",
      "계약 갱신으로 안정적으로 오래 살 수 있다.",
    ],
    conArgs: [
      "큰 목돈이 묶여 다른 투자·비상금 활용이 어렵다.",
      "전세사기·보증금 미반환 리스크가 있다.",
      "대출 이자가 높으면 월세보다 실부담이 클 수 있다.",
      "이사·이직이 잦다면 유동성 낮은 전세가 불리하다.",
    ],
    aiBalance:
      "전세는 주거비 절감과 안정, 월세는 유동성과 리스크 회피가 강점이다. 금리 수준과 거주 기간, 목돈 규모에 따라 답이 달라진다.",
    tags: ["전세", "월세", "부동산"],
  },
  {
    slug: "worklife-vs-salary",
    title: "워라밸 vs 고연봉, 무엇을 택할까",
    question: "이직한다면, 워라밸 vs 고연봉?",
    summary: "삶의 질과 지속가능성이냐, 자산 형성 속도냐.",
    body: "같은 시기에 '칼퇴 보장되지만 연봉이 낮은 곳'과 '연봉은 높지만 야근이 잦은 곳' 사이에서 고민하는 상황을 가정한 밸런스.",
    category: "WORK",
    proLabel: "워라밸",
    conLabel: "고연봉",
    proArgs: [
      "여유 시간이 건강·관계·취미 등 삶의 질을 높인다.",
      "번아웃 위험이 낮아 오래 일할 수 있다.",
      "자기계발·부업 등 다른 기회를 만들 시간이 생긴다.",
      "돈으로 살 수 없는 시간의 가치를 우선한다.",
    ],
    conArgs: [
      "높은 소득이 내 집 마련·투자 등 자산 형성을 앞당긴다.",
      "젊을 때 바짝 벌어 선택지를 넓히는 전략도 유효하다.",
      "커리어 초반의 고강도 경험이 이후 몸값을 키운다.",
      "경제적 여유가 오히려 스트레스를 줄이기도 한다.",
    ],
    aiBalance:
      "워라밸은 지속가능성과 삶의 질, 고연봉은 자산 형성 속도가 강점이다. 생애주기(부양·목표)와 개인 가치관에 따라 갈린다.",
    tags: ["워라밸", "연봉", "커리어"],
  },
  {
    slug: "save-vs-invest",
    title: "저축 vs 투자, 지금은 어느 쪽",
    question: "여윳돈, 저축 vs 투자?",
    summary: "원금 지키는 안정이냐, 인플레이션 이기는 수익이냐.",
    body: "매달 남는 돈을 예·적금에 넣을지, 주식·ETF 등에 투자할지에 대한 오래된 선택. 금리와 시장 상황에 따라 무게추가 바뀐다.",
    category: "MONEY",
    proLabel: "저축",
    conLabel: "투자",
    proArgs: [
      "원금이 보장되어 잃을 걱정이 없다.",
      "예측 가능한 이자로 계획을 세우기 쉽다.",
      "비상금·단기 목표 자금으로 적합하다.",
      "금리가 높은 시기엔 저축 수익률도 쏠쏠하다.",
    ],
    conArgs: [
      "물가 상승률을 못 따라가면 실질 가치가 준다.",
      "장기적으로 투자 수익률이 저축을 앞선 사례가 많다.",
      "복리 효과는 일찍 시작한 투자에서 크게 난다.",
      "분산 투자로 리스크를 관리하며 자산을 키울 수 있다.",
    ],
    aiBalance:
      "저축은 안정과 확실성, 투자는 장기 수익과 인플레 방어가 강점이다. 목표 시점과 감내 가능한 위험에 따라 비중을 나누는 게 일반적이다.",
    tags: ["저축", "투자", "재테크"],
  },
  {
    slug: "pineapple-pizza",
    title: "파인애플 피자, 찬성 vs 반대",
    question: "피자에 파인애플, 올려도 될까?",
    summary: "단짠의 조화냐, 넘지 말아야 할 선이냐.",
    body: "하와이안 피자로 대표되는 '파인애플 토핑' 논쟁. 가벼운 취향 밸런스로, 부담 없이 한 표.",
    category: "LIFE",
    proLabel: "찬성",
    conLabel: "반대",
    proArgs: [
      "단맛과 짠맛의 대비가 독특한 풍미를 만든다.",
      "느끼함을 잡아주는 상큼함이 있다.",
      "취향은 다양하고 정답은 없다.",
      "전 세계적으로 하나의 정식 메뉴로 자리 잡았다.",
    ],
    conArgs: [
      "따뜻한 피자에 과일의 물컹한 식감이 안 어울린다는 반응.",
      "치즈·도우 본연의 맛을 해친다는 의견.",
      "단맛이 짭짤한 피자와 충돌한다는 취향.",
      "전통 이탈리아 피자와는 거리가 멀다.",
    ],
    aiBalance:
      "결국 취향의 문제다. 찬성은 단짠 조화를, 반대는 식감·정통성을 든다. 가볍게 즐기는 논쟁.",
    tags: ["음식", "취향"],
  },
  {
    slug: "long-distance-relationship",
    title: "장거리 연애, 할 만한가",
    question: "장거리 연애, 해볼 만할까?",
    summary: "신뢰와 자기 시간이냐, 외로움과 현실의 벽이냐.",
    body: "유학·취업·이사 등으로 떨어져 지내는 연애. 지속 가능성에 대한 생각이 사람마다 크게 갈린다.",
    category: "LOVE",
    proLabel: "할 만하다",
    conLabel: "힘들다",
    proArgs: [
      "각자의 시간과 독립성을 존중하며 성장할 수 있다.",
      "만남이 드문 만큼 소중함과 설렘이 유지된다.",
      "영상통화 등으로 예전보다 거리를 좁히기 쉬워졌다.",
      "신뢰가 깊어지면 오히려 관계가 단단해진다.",
    ],
    conArgs: [
      "외로움과 불안이 쌓이기 쉽다.",
      "사소한 일상을 공유하기 어려워 거리감이 생긴다.",
      "이동에 드는 시간·비용 부담이 크다.",
      "오해가 생겼을 때 즉시 풀기 어렵다.",
    ],
    aiBalance:
      "장거리 연애는 신뢰와 자기 시간이 강점, 외로움과 현실적 부담이 약점이다. 두 사람의 소통 방식과 목표 시점 합의가 관건이다.",
    tags: ["연애", "관계"],
  },
];

async function main() {
  for (const s of ISSUES) {
    await prisma.issue.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        question: s.question,
        summary: s.summary,
        body: s.body,
        category: s.category,
        proLabel: s.proLabel,
        conLabel: s.conLabel,
        proArgs: s.proArgs,
        conArgs: s.conArgs,
        aiBalance: s.aiBalance,
        tags: s.tags,
        status: "PUBLISHED",
      },
      create: {
        slug: s.slug,
        title: s.title,
        question: s.question,
        summary: s.summary,
        body: s.body,
        category: s.category,
        proLabel: s.proLabel,
        conLabel: s.conLabel,
        proArgs: s.proArgs,
        conArgs: s.conArgs,
        aiBalance: s.aiBalance,
        tags: s.tags,
        status: "PUBLISHED",
      },
    });
    console.log("seeded:", s.slug);
  }
  console.log(`\n총 ${ISSUES.length}개 쟁점 시드 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
