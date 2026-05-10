import { PrismaClient, Category, PinSide } from "@prisma/client";

import { seedPersonas } from "./seed-personas";

const prisma = new PrismaClient();

/**
 * Phase 2/3 시드 — 토론 주제 14개 + 의견 70+개 + 동조/댓글 일부.
 * 실행: `npm run db:seed` (DATABASE_URL 필요)
 *
 * 토론 주제 데이터는 한국 사회에서 *실제로 찬반이 갈리는* 사안 위주로,
 * 헌법 2.4(진영색 회피)에 따라 진영을 한쪽으로 몰지 않게 다양화.
 */

type Side = "PRO" | "CON";
type SeedPin = { side: Side; body: string; author: string };

interface SeedBoard {
  title: string;
  body: string;
  category: Category;
  pins: SeedPin[];
}

// 페르소나별 말투:
//   kimsu (진보 개혁) — ~다, 단호·논리·날카로움. 가끔 의문 단정.
//   leesh (진보 환경, 연구자) — ~이다/~한다, 차분·학문·인용 톤.
//   parkje (중도-보수) — ~다/~라고 본다, 균형·실용·신중.
//   hanmi (현상유지 보수) — ~다/~지 않을까/~게 현실이다, 회의·현실 점검.
//   choibo (재정 보수, 회계 톤) — 짧고 차가움. 숫자·비용 중심.
//   junga (사회 보수) — ~다/~여야 한다, 가치·권위·신중.

const BOARDS: SeedBoard[] = [
  {
    title: "다주택자 보유세 강화에 찬성하십니까?",
    category: "ECONOMY",
    body: "다주택 보유에 대한 세부담 강화 정책의 효과·부작용을 어떻게 볼지.",
    pins: [
      { side: "PRO", body: "주거 안정이 시장 자율로 풀린 적이 있는가. 보유세는 가장 직접적인 가격 신호다.", author: "kimsu" },
      { side: "PRO", body: "임대 수익이 목적인 다주택과 거주 목적 자가는 분명히 구분해 과세하는 게 맞다고 본다.", author: "parkje" },
      { side: "PRO", body: "OECD 평균과 비교하면 한국 보유세 비중은 여전히 절반 수준이다. 강화 여지가 객관적으로 존재한다.", author: "leesh" },
      { side: "CON", body: "전월세 임대 공급의 60% 이상이 개인 다주택자다. 강화는 결국 임대료 전가로 흐르지 않을까.", author: "hanmi" },
      { side: "CON", body: "조세는 일관성이 생명이다. 잦은 변경은 신뢰를 깎는다.", author: "choibo" },
      { side: "CON", body: "다주택을 곧 투기로 단정하는 건 단순화다. 상속·이전 거주지 등 다양한 사정이 있는 거다.", author: "junga" },
    ],
  },
  {
    title: "의대 정원 확대에 찬성하십니까?",
    category: "SOCIETY",
    body: "지역·필수의료 의사 부족 문제를 의대 정원 확대로 해결할 수 있을까.",
    pins: [
      { side: "PRO", body: "지역·필수의료 공백의 근본 원인은 의사 절대 수의 부족이다. 정원 확대 없이 풀리지 않는다.", author: "leesh" },
      { side: "PRO", body: "정원 동결 27년은 비정상이다. 그동안 의료 수요는 폭증했다.", author: "kimsu" },
      { side: "CON", body: "정원만 늘려도 결국 지방엔 안 간다. 수가·근무 환경 개선이 먼저 아닌가.", author: "hanmi" },
      { side: "CON", body: "필수의료 보상 체계 개편 없이 머릿수만 늘리면 미용·피부로 빠지게 돼 있다.", author: "junga" },
      { side: "CON", body: "교육 인프라가 받쳐주지 않은 상태의 급증은 의대 교육 질을 떨어뜨린다고 본다.", author: "parkje" },
    ],
  },
  {
    title: "모병제 전환에 찬성하십니까?",
    category: "POLITICS",
    body: "징병제와 모병제 사이의 트레이드오프, 한반도 안보 환경에서의 적합성.",
    pins: [
      { side: "PRO", body: "현대전은 드론·전자전 운용 비중이 크다. 18개월 징집병으로 감당할 군대가 아니다.", author: "kimsu" },
      { side: "PRO", body: "병력 *수* 만 따지는 건 옛 군대의 논리다. 5만의 정예가 50만 징집을 압도하는 시대라고 본다.", author: "parkje" },
      { side: "PRO", body: "청년 1인당 1,800일의 기회비용이다. 그 시간이 산업·교육으로 흘러가는 게 사회 전체의 이익이다.", author: "leesh" },
      { side: "CON", body: "정전국가에서 병력 격차를 무시할 수 있겠는가. 50만은 산수 이상의 정치적 의미다.", author: "hanmi" },
      { side: "CON", body: "연 5~12조 추가 재정. 인구 절벽 시기에 군 예산이 복지 예산을 잠식한다.", author: "choibo" },
      { side: "CON", body: "미국·영국 사례를 보라. 군이 저소득층 일자리로 고착되는 건 결국 사회 통합에도 좋지 않은 거다.", author: "junga" },
    ],
  },
  {
    title: "사형제 부활(집행 재개)에 찬성하십니까?",
    category: "SOCIETY",
    body: "1997년 이후 사실상 폐지 상태인 사형 집행을 재개해야 하는가.",
    pins: [
      { side: "PRO", body: "흉악범에 대한 응보는 사회의 기본적 정의 감각이다. 그것을 잃으면 법은 빈 말이 되는 거다.", author: "junga" },
      { side: "PRO", body: "가석방 없는 종신형은 법제화돼 있지 않다. 현실적으로 무기수는 25년 후 가석방이 가능하다고 본다.", author: "parkje" },
      { side: "CON", body: "오판 가능성을 0으로 만들 수 없다. 무고한 사형 단 1건도 회복할 방법이 없다.", author: "kimsu" },
      { side: "CON", body: "범죄 억제 효과가 통계적으로 입증된 적이 없다. 그 부재 위에 사형 부활을 쌓을 수는 없다.", author: "leesh" },
      { side: "CON", body: "가석방 없는 종신형 도입이 먼저다. 사형보다 결과적으로 더 무거운 처벌이 될 수 있는 게 현실이다.", author: "hanmi" },
    ],
  },
  {
    title: "AI 생성물에 저작권을 부여해야 하는가?",
    category: "CULTURE",
    body: "사람의 창작 개입 정도와 AI 모델·데이터 사용에 따른 저작권 인정 범위.",
    pins: [
      { side: "PRO", body: "프롬프트·후처리에도 충분한 창작적 기여가 인정되는 사례가 누적되고 있다. 보호하지 않을 이유가 없다고 본다.", author: "leesh" },
      { side: "PRO", body: "보호 장치 없이는 AI 산업 자체가 위축된다. 보호와 책임을 함께 설계하면 된다.", author: "kimsu" },
      { side: "CON", body: "결국 원천 데이터(훈련셋)의 저작권자 보상이 먼저 풀려야 하지 않을까.", author: "hanmi" },
      { side: "CON", body: "*창작자* 정의를 인간으로 한정해온 100년의 전제를 가볍게 깨는 건 위험한 거다.", author: "junga" },
      { side: "CON", body: "사람이 창작 결정의 *충분한* 부분을 입증 가능한 경우만 예외로 두는 게 합리적이라고 본다.", author: "parkje" },
    ],
  },
  {
    title: "부유세 신설에 찬성하십니까?",
    category: "ECONOMY",
    body: "일정 자산 이상에 대한 부유세 신설의 분배 효과·자본 유출 우려.",
    pins: [
      { side: "PRO", body: "자산 격차가 소득 격차의 두 배 이상이다. 새 도구가 필요한 시점이다.", author: "kimsu" },
      { side: "PRO", body: "조세 형평성 측면에서 자본소득·자산에 대한 추가 과세는 정당한 영역이라고 본다.", author: "parkje" },
      { side: "CON", body: "프랑스·스웨덴 사례에서 자본 유출과 행정 비용 대비 세수가 빈약했다는 게 결국 결론 아닌가.", author: "hanmi" },
      { side: "CON", body: "이미 상속세·종부세가 있다. 또 하나의 부유 과세는 중첩이다.", author: "choibo" },
    ],
  },
  {
    title: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?",
    category: "POLITICS",
    body: "거대 양당 구도 완화 vs 군소정당 난립 우려, 비례성 강화 방안.",
    pins: [
      { side: "PRO", body: "현행 제도는 사표를 과하게 만든다. 비례성 강화가 정상화의 출발이라고 본다.", author: "leesh" },
      { side: "PRO", body: "양당 독점이 이념적·지역적 분열을 고착화한다. 그 구조 자체를 손봐야 한다.", author: "kimsu" },
      { side: "CON", body: "독일도 5% 봉쇄조항을 두고 있다. 비례성만 늘리면 군소정당 난립으로 결국 정부 구성이 어려워지지 않을까.", author: "hanmi" },
      { side: "CON", body: "위성정당 사태에서 보듯, 제도 변경의 효과는 결국 정당의 선택에 흡수되는 거다.", author: "junga" },
    ],
  },
  {
    title: "원전 신규 건설에 찬성하십니까?",
    category: "ENVIRONMENT",
    body: "탈탄소·전력 안보 vs 사고 위험·고준위 폐기물 처리.",
    pins: [
      { side: "PRO", body: "재생에너지만으로 산업·데이터센터 전력을 감당할 수 없다. 원전이 베이스로드다.", author: "kimsu" },
      { side: "PRO", body: "탈탄소 시한을 맞추려면 원전 비중 유지·확대가 사실상 불가피하다고 본다.", author: "parkje" },
      { side: "CON", body: "고준위 폐기물 영구 처분장이 한국엔 아직 없다. 저장 한계 임박이 현실 아닌가.", author: "hanmi" },
      { side: "CON", body: "후쿠시마 이후 *안전 비용* 까지 포함해 단가를 다시 계산하면 *가장 싼 전력* 이라는 전제가 무너진다.", author: "leesh" },
    ],
  },
  {
    title: "주 4일제 도입에 찬성하십니까?",
    category: "ECONOMY",
    body: "노동시간 단축의 생산성·삶의 질 효과 vs 산업·임금 영향.",
    pins: [
      { side: "PRO", body: "OECD 최장 노동시간 국가의 생산성은 평균 이하다. 시간 단축이 생산성 개선으로 이어지는 사례가 누적되고 있다.", author: "leesh" },
      { side: "PRO", body: "출산율 0.7 시대에 주 5일은 실효적 한계다. 시간을 비워주지 않으면 인구가 받쳐주지 않는다.", author: "kimsu" },
      { side: "CON", body: "중소·서비스업의 인건비 구조는 대기업과 다르다. 일률 도입은 자영업자에게 치명적이지 않을까.", author: "hanmi" },
      { side: "CON", body: "도입 사례(아이슬란드 등)는 공공부문 위주다. 한국 제조업에 그대로 적용하는 건 무리인 거다.", author: "junga" },
    ],
  },
  {
    title: "동성결혼 법제화에 찬성하십니까?",
    category: "SOCIETY",
    body: "결혼 평등권 vs 전통적 가족 정의의 변화에 대한 합의 형성.",
    pins: [
      { side: "PRO", body: "결혼은 시민권의 일부다. 시민권은 다수결로 제한될 수 있는 영역이 아니다.", author: "leesh" },
      { side: "PRO", body: "법적 보호 부재 자체가 일상의 차별을 정당화하는 근거로 쓰인다. 그 고리를 끊어야 한다.", author: "kimsu" },
      { side: "CON", body: "사회적 합의 수준을 충분히 본 입법이 결국 안정성에 유리한 거다.", author: "junga" },
      { side: "CON", body: "결혼이 아닌 *시민결합* 같은 별도 제도로 권리 보장도 가능하지 않을까.", author: "hanmi" },
    ],
  },
  {
    title: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?",
    category: "CULTURE",
    body: "공개된 콘텐츠를 AI 학습에 사용하는 행위에 저작권자 동의·보상이 필요한가.",
    pins: [
      { side: "PRO", body: "공개 = 학습 무료 라는 등식은 깨야 한다. 저작권자 동의 절차가 기본이라고 본다.", author: "parkje" },
      { side: "PRO", body: "EU·일본도 옵트아웃 권리를 명문화하는 추세다. 한국만 외면할 이유가 없다.", author: "kimsu" },
      { side: "CON", body: "표현의 인용·연구 자유와 충돌이 큰 영역이다. 한국만 규제하면 결국 모델 경쟁력만 빠지지 않을까.", author: "hanmi" },
      { side: "CON", body: "학습 단계가 아닌 *출력물 유사성* 을 규제 대상으로 삼는 게 더 현실적이라고 본다.", author: "leesh" },
    ],
  },
  {
    title: "기본소득 도입에 찬성하십니까?",
    category: "ECONOMY",
    body: "보편적 현금 지급의 노동·재정 효과에 대한 평가.",
    pins: [
      { side: "PRO", body: "AI·자동화로 일자리가 줄어드는 추세에 대비한 안전망이다. 미리 깔지 않으면 늦는다.", author: "kimsu" },
      { side: "PRO", body: "복지 행정 비용을 크게 줄일 수 있는 구조라는 점이 보편 지급의 강점이다.", author: "leesh" },
      { side: "CON", body: "재원 마련 방안이 모호하다. 증세 없이는 불가능한 게 현실 아닌가.", author: "hanmi" },
      { side: "CON", body: "보편 현금보다는 *필요한 곳에* 표적 지원이 효율적이다. 그게 분배의 정공법인 거다.", author: "junga" },
    ],
  },
  {
    title: "한미일 군사협력 강화에 찬성하십니까?",
    category: "FOREIGN_AFFAIRS",
    body: "북한·중국 위협 대응 vs 동북아 진영 대립 격화 우려.",
    pins: [
      { side: "PRO", body: "북·중·러 결속이 강화되는 상황에서 한미일 결속은 균형의 필수라고 본다.", author: "parkje" },
      { side: "PRO", body: "정보 공유·미사일 방어에서 3국 공조의 효율은 단독 대비 압도적이다.", author: "kimsu" },
      { side: "CON", body: "중국 의존도가 큰 한국 경제에 외교적·경제적 보복 비용이 결국 크게 돌아오지 않을까.", author: "hanmi" },
      { side: "CON", body: "역사 문제 미해결 상태의 군사 일체화는 국내 정치적 갈등만 심화시키는 거다.", author: "junga" },
    ],
  },
  {
    title: "탄소세 도입에 찬성하십니까?",
    category: "ENVIRONMENT",
    body: "온실가스 배출에 대한 명시적 가격 부과의 효과·산업 영향.",
    pins: [
      { side: "PRO", body: "*가장 단순하고 효율적인* 감축 도구라는 점에 경제학자 다수가 동의한다는 게 학계의 주류 결론이다.", author: "leesh" },
      { side: "PRO", body: "EU CBAM 시대다. 도입을 늦출수록 한국 수출 단가만 불리해진다.", author: "kimsu" },
      { side: "CON", body: "현행 배출권거래제(K-ETS) 와 중복이다. 이중 부담 우려가 결국 풀리지 않은 채 남아 있지 않은가.", author: "hanmi" },
      { side: "CON", body: "탄소집약 산업 비중이 높은 한국은 단독 도입 시 제조업 경쟁력 타격이 크다.", author: "choibo" },
    ],
  },
];

async function main() {
  console.log("[seed] 시작");

  // 0) 활동 데이터 사전 청소 — Pin 삭제 시 FK 위반 방지.
  // 활성화 전 시드 전제. 진짜 사용자 활동 누적 시점부터는 db:seed 호출 금지 (메모리 노트 참조).
  await prisma.endorsement.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.blindAnswer.deleteMany({});

  // 1) 시스템 시드 사용자 (proposer 표시용). 카카오 OAuth 로 만들어진 게 아닌 BOT 계정.
  const seedUserMap = new Map<string, string>();
  for (const handle of ["kimsu", "parkje", "leesh", "hanmi", "choibo", "junga"]) {
    const user = await prisma.user.upsert({
      where: { nickname: handle },
      update: {},
      create: {
        nickname: handle,
        name: handle,
        email: `${handle}@seed.polem.org`,
      },
    });
    seedUserMap.set(handle, user.id);
  }

  // 2) 토론 주제 + 의견
  for (const board of BOARDS) {
    const proCount = board.pins.filter((p) => p.side === "PRO").length;
    const conCount = board.pins.filter((p) => p.side === "CON").length;
    const participantSet = new Set(board.pins.map((p) => p.author));

    const created = await prisma.board.upsert({
      where: { id: slugify(board.title) },
      update: {
        proCount,
        conCount,
        participantCount: participantSet.size,
        viewCount: 100 + Math.floor(Math.random() * 4000),
      },
      create: {
        id: slugify(board.title),
        title: board.title,
        body: board.body,
        category: board.category,
        proCount,
        conCount,
        participantCount: participantSet.size,
        viewCount: 100 + Math.floor(Math.random() * 4000),
      },
    });

    // 의견 — 기존 의견 모두 삭제 후 재생성 (멱등성)
    await prisma.pin.deleteMany({ where: { boardId: created.id } });
    for (const pin of board.pins) {
      const authorId = seedUserMap.get(pin.author);
      if (!authorId) continue;
      await prisma.pin.create({
        data: {
          boardId: created.id,
          authorId,
          side: pin.side as PinSide,
          body: pin.body,
        },
      });
    }
  }

  console.log(`[seed] 기본 시드 완료: ${BOARDS.length} 토론 주제, ${BOARDS.reduce((a, b) => a + b.pins.length, 0)} 의견`);

  // 페르소나 시드 — 14명 추가 + 동조·댓글·반박
  await seedPersonas(prisma);
}

function slugify(title: string): string {
  // 토론 주제 ID 안정화 — 동일 제목이면 동일 ID 로 upsert.
  const base = title
    .replace(/[\s?·,.()]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `seed-${base}`.slice(0, 40);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
