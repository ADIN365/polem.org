import type { PrismaClient } from "@prisma/client";

/**
 * 사이트 활성화 전 시드 — 14 페르소나 사용자 + 그들의 의견·동조·댓글·반박.
 * 기존 6명(seed.ts) 과 합쳐 총 20명. 각자 정치 스펙트럼에 맞춘 *일관된* 활동.
 *
 * 멱등성: 매 실행 시 페르소나 사용자/활동 모두 재생성.
 */

type Side = "PRO" | "CON";
type Group = "PROGRESSIVE" | "CENTRIST" | "CONSERVATIVE";

interface PersonaUser {
  handle: string;
  group: Group;
}

interface PersonaPin {
  boardTitle: string;
  side: Side;
  body: string;
  author: string;
}

interface PersonaComment {
  boardTitle: string;
  targetAuthor: string;
  targetSide: Side;
  author: string;
  body: string;
}

interface PersonaChallenge {
  boardTitle: string;
  targetAuthor: string;
  targetSide: Side;
  author: string;
  body: string;
  sourceUrl: string;
}

// 신규 14명 (기존 6명: kimsu, parkje, leesh, hanmi, choibo, junga)
const PERSONA_USERS: PersonaUser[] = [
  { handle: "moonki", group: "PROGRESSIVE" }, // 386 진보
  { handle: "jionsu", group: "PROGRESSIVE" }, // MZ 진보
  { handle: "shinha", group: "PROGRESSIVE" }, // 환경녹색
  { handle: "bakhy", group: "PROGRESSIVE" }, // 노동 좌파
  { handle: "leemy", group: "PROGRESSIVE" }, // 페미 진보
  { handle: "hwangye", group: "PROGRESSIVE" }, // 여성 진보
  { handle: "kangye", group: "CENTRIST" }, // 청년 자유주의
  { handle: "kimje", group: "CENTRIST" }, // 자영업 중도
  { handle: "parksoo", group: "CENTRIST" }, // 청년 중도
  { handle: "hanseung", group: "CONSERVATIVE" }, // 자유주의 보수
  { handle: "ohjs", group: "CONSERVATIVE" }, // 가부장 보수
  { handle: "jangik", group: "CONSERVATIVE" }, // 안보 보수
  { handle: "chunho", group: "CONSERVATIVE" }, // 노년 보수
  { handle: "wonki", group: "CONSERVATIVE" }, // 기독교 보수
];

// 기존 6명 그룹 매핑 (자동 동조 알고리즘에 필요)
const EXISTING_GROUPS: Record<string, Group> = {
  kimsu: "PROGRESSIVE",
  leesh: "PROGRESSIVE",
  parkje: "CONSERVATIVE",
  hanmi: "CONSERVATIVE",
  choibo: "CENTRIST",
  junga: "CONSERVATIVE",
};

const PERSONA_PINS: PersonaPin[] = [
  // === moonki (386 진보) — 7
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "PRO", body: "보유세 강화는 자산 격차 완화의 정공법이다. 80~90년대 주택공급 정책의 한계가 지금의 격차로 굳었다.", author: "moonki" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "PRO", body: "1%가 30% 자산을 가진 사회는 민주주의의 토양을 갉아먹는다. 새 도구가 정당하다.", author: "moonki" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "PRO", body: "노조·복지 위에 기본소득까지 얹는 게 사회 안전망의 완성이다. 단계적 도입이면 충분하다.", author: "moonki" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "모병제는 결국 가난한 청년만 군에 가게 만든다. 미국·영국이 그 살아있는 예다.", author: "moonki" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "오판 한 번이면 사회 전체가 빚을 진다. 가석방 없는 종신형 도입이 답이다.", author: "moonki" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "결혼은 시민권의 일부다. 시민권을 다수결로 막아온 역사는 늘 부끄러운 자리에 남았다.", author: "moonki" },
  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", side: "PRO", body: "양당 독점은 노동·소수정당의 입법 진입을 막는 가장 큰 장벽이다.", author: "moonki" },

  // === jionsu (MZ 진보) — 7
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "출산율 0.7 시대다. 노동시간을 줄이지 않으면 인구가 받쳐주지 않는다.", author: "jionsu" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내 친구들의 결혼을 국가가 인정하지 않는 게 더 이상한 일이다.", author: "jionsu" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "기후 위기는 우리 세대 문제다. 가격 신호 없으면 기업은 안 움직인다.", author: "jionsu" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "CON", body: "고준위 폐기물 처분장도 없는 상태에서 신규 건설은 다음 세대에 짐을 떠넘기는 거다.", author: "jionsu" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "CON", body: "AI 결과물에 저작권을 주기 시작하면 인간 창작자 보호망이 빠르게 무너진다.", author: "jionsu" },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", side: "PRO", body: "공개 = 학습 무료 라는 식은 빅테크의 자기변호일 뿐. 동의 절차가 필요하다.", author: "jionsu" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "지방 응급실에서 사람이 죽는 게 현실이다. 일단 인원부터 늘려야 한다.", author: "jionsu" },

  // === shinha (환경녹색) — 4
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "CON", body: "후쿠시마 한 번에 한·일 어업이 13년째 흔들린다. 그 비용을 누가 계산하나.", author: "shinha" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "EU CBAM 시대다. 도입을 안 하면 한국 수출이 더 비싸진다.", author: "shinha" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "노동시간 단축은 환경에도 좋다. 출퇴근·산업 배출을 줄인다.", author: "shinha" },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", side: "PRO", body: "환경뿐 아니라 디지털 윤리도 같은 문제. 무단 사용은 도둑질이다.", author: "shinha" },

  // === bakhy (노동 좌파) — 9
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "PRO", body: "노동의 가치가 자산의 가치를 못 따라간다. 부유세는 그 격차를 메우는 도구다.", author: "bakhy" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "PRO", body: "AI 가 일자리를 빠르게 잠식한다. 안전망은 미리 깔아야 한다.", author: "bakhy" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "PRO", body: "세입자가 임대료로 다주택자 보유세를 내는 구조 자체가 비정상이다.", author: "bakhy" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "수가 핑계는 30년째다. 일단 사람부터 늘려야 시장 협상력이 생긴다.", author: "bakhy" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "CON", body: "미국 무기 사주는 동맹은 동맹이 아니라 종속이다.", author: "bakhy" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "CON", body: "노동자의 안전부터. 후쿠시마는 가장 무거운 노동 안전 사례다.", author: "bakhy" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "CON", body: "기업이 AI 결과물 저작권을 가지면 결국 노동자 창작 단가만 깎인다.", author: "bakhy" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "가난한 사람이 더 사형당하는 통계가 있다. 응보가 아닌 계급 처벌이다.", author: "bakhy" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "산업계 비용으로 노동자에게 전가되지 않게 분배 메커니즘을 같이 설계해야 한다.", author: "bakhy" },

  // === leemy (페미 진보) — 4
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "법적 보호 부재가 일상의 차별을 정당화하는 가장 큰 근거가 된다.", author: "leemy" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "여성 살해 사건에 사형 부활하라는 분노는 이해한다. 그러나 오판은 시스템 차원에서 못 막는다.", author: "leemy" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "PRO", body: "가사·돌봄 노동의 가치가 자산 격차로 더 커진다. 부유세는 보편 분배의 도구다.", author: "leemy" },
  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", side: "PRO", body: "여성 의원 비율 19% 의 의회가 50% 인구를 대변할 수 없다. 비례 강화가 그 시작.", author: "leemy" },

  // === hwangye (여성 진보) — 6
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "PRO", body: "여성 1인가구 주거 부담이 가장 크다. 보유세 강화는 그 출발점이다.", author: "hwangye" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "여성 의사·산부인과 의료 공백 문제는 30년째다.", author: "hwangye" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내 권리가 다른 사람 권리를 깎는 게 아니다. 그게 평등의 기본.", author: "hwangye" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "PRO", body: "돌봄 노동을 시장이 안 매기니 기본소득이 그 부분을 인정해줘야 한다.", author: "hwangye" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "엄마와 아이가 같이 저녁을 먹는 사회가 정상이다.", author: "hwangye" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "기후 위기는 결국 약자에게 더 큰 피해. 탄소세는 약자 보호의 시작.", author: "hwangye" },

  // === kangye (청년 자유주의) — 5
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "내 친구는 18개월을 잃었다. 그 시간을 직업군인 인건비로 보상하는 게 합리다.", author: "kangye" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내가 누구와 결혼하느냐는 정부가 결정할 영역이 아니다.", author: "kangye" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "PRO", body: "프롬프트 디자인도 창작 노동이다. 보호 없으면 산업이 위축된다.", author: "kangye" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "CON", body: "내가 자산을 모으면 또 세금. 이런 사회에선 누가 돈을 벌고 싶어 할까.", author: "kangye" },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", side: "CON", body: "EU 처럼 옵트아웃 규제가 강해지면 한국 모델 경쟁력은 0이 된다.", author: "kangye" },

  // === kimje (자영업 중도) — 5
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "CON", body: "자영업·중소 인건비 구조에서 4일제는 사형선고다. 일률 강제는 안 된다.", author: "kimje" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "지방 자영업자 가족도 응급실 못 간다. 사람부터 늘려라.", author: "kimje" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "임대 사업자 단속 = 임대료 인상. 결국 자영업 임차인이 부담을 진다.", author: "kimje" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "CON", body: "탄소세 + 배출권 이중부담. 중소 제조업이 먼저 무너진다.", author: "kimje" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "병역 기간 줄여서 청년이 빨리 일터로 와야 자영업 인력난도 푼다.", author: "kimje" },

  // === parksoo (청년 중도) — 5
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "내 또래는 군 18개월을 인생 손실로 본다. 모병제 + 직업군인이 정직하다.", author: "parksoo" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "정치 싸움보다 동네 응급실에 의사가 있냐가 더 중요하다.", author: "parksoo" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내 친구가 행복하면 그게 답이다. 사회 합의 운운은 여기까지.", author: "parksoo" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "PRO", body: "프롬프트도 글이고 글에는 창작이 있다.", author: "parksoo" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "야근 강요가 사라지는 사회가 정상이다.", author: "parksoo" },

  // === hanseung (자유주의 보수) — 6
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "세금으로 시장을 통제하면 결국 임차인이 비용을 진다. 이건 경제학의 기본이다.", author: "hanseung" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "CON", body: "프랑스가 부유세로 자본 유출을 겪었다. 자본은 발이 빠르다.", author: "hanseung" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "징병제는 청년의 기회비용을 국가가 강탈하는 제도다. 모병제가 정당하다.", author: "hanseung" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "CON", body: "보편 지급은 일하는 사람의 존엄을 깎는다. 표적 지원이 효율적이다.", author: "hanseung" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "CON", body: "노동시간을 법으로 일률 단축하는 건 자유시장 원칙에 정면으로 반한다.", author: "hanseung" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "동맹 없이 자유경제는 유지될 수 없다. 한미일은 안보 + 경제의 두 기둥이다.", author: "hanseung" },

  // === ohjs (가부장 보수) — 6
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "PRO", body: "흉악범 응보는 피해자 가족의 최소한의 위로다. 법이 그 무게를 지켜야 한다.", author: "ohjs" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "CON", body: "결혼은 가족 형성의 기본 단위. 정의 변경에는 사회적 합의가 먼저다.", author: "ohjs" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "북한 도발 패턴을 보면 한미일 결속이 가장 빠른 억제다.", author: "ohjs" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "CON", body: "의대 정원 늘려도 지방엔 안 간다. 수가가 먼저다.", author: "ohjs" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "징병제는 한반도 안보 환경에서 정치적 의미가 큰 제도다. 가볍게 못 바꾼다.", author: "ohjs" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "PRO", body: "재생에너지로 한국 산업 전력을 감당할 수 없다. 원전이 현실이다.", author: "ohjs" },

  // === jangik (안보 보수) — 5
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "정전국가에서 50만은 산수 이상의 정치 메시지다.", author: "jangik" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "북·중·러 결속에 한미일 결속만 한 카운터 카드가 없다.", author: "jangik" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "PRO", body: "전력 안보 = 안보다. 외부 의존 가스로 베이스로드 못 짓는다.", author: "jangik" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "PRO", body: "법치는 응보의 무게로 신뢰를 만든다. 사형 폐지 = 법치 약화.", author: "jangik" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "잦은 조세 변경은 정부 신뢰를 깎는다. 제도 안정이 시장 회복의 첫 걸음이다.", author: "jangik" },

  // === chunho (노년 보수) — 8
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "PRO", body: "법은 무거워야 사회가 산다. 응보 없는 법은 종이호랑이다.", author: "chunho" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "한미동맹 70년이 한국을 만들었다. 흔들면 우리만 손해다.", author: "chunho" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "PRO", body: "전력 안 끊겨야 산업이 산다. 안 끊기는 건 원전이다.", author: "chunho" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "CON", body: "교육 인프라도 없는데 정원만 늘리면 의사 질이 떨어진다.", author: "chunho" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "60대 은퇴자에게 보유세 강화는 노후를 깎는 것과 같다.", author: "chunho" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "CON", body: "은퇴 후 자산이 다인데 부유세 + 종부세 + 상속세. 한국 노년의 세금 지옥이다.", author: "chunho" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "CON", body: "전통 가족이 무너지면 사회가 흔들린다. 합의가 먼저다.", author: "chunho" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "남자라면 군은 가야 한다. 그게 한국 사회 약속이었다.", author: "chunho" },

  // === wonki (기독교 보수) — 3
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "CON", body: "결혼의 정의는 종교적·문화적 합의 위에 서 있다. 입법 일방 통과는 위험하다.", author: "wonki" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "생명은 함부로 빼앗을 수 없는 영역이다. 국가가 사형으로 빼앗는 데에는 한계가 있다.", author: "wonki" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "CON", body: "의료 윤리 교육 없이 사람만 늘리면 직업윤리부터 무너진다.", author: "wonki" },
];

// 댓글 — 다른 페르소나 의견에 답글 (논쟁/대화)
const PERSONA_COMMENTS: PersonaComment[] = [
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "hanmi", body: "가격 신호는 임대료로도 똑같이 작동합니다. 결국 세입자가 진다는 게 문제." },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "moonki", body: "임대료 전가는 공급 부족 시 더 심해집니다. 보유세와 공급 정책은 같이 봐야 합니다." },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "chunho", targetSide: "CON", author: "leesh", body: "노후 자산이 1주택이라면 종부세에 이미 보호 장치가 있습니다. 다주택과는 다른 사안이에요." },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "bakhy", targetSide: "PRO", author: "kimje", body: "임차인 부담 전가가 안 일어나려면 어떤 정책이 같이 필요한가요?" },

  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "hanmi", body: "정원만 늘려도 지방 안 갑니다. 수가·지역 의무 복무가 먼저예요." },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "jionsu", body: "수가 개선 30년째 말로만. 일단 사람을 늘려야 협상력이 생깁니다." },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "ohjs", targetSide: "CON", author: "parksoo", body: "수가가 먼저라는 말은 동의하지만, 인원도 같이 가야 합니다. 둘 중 하나만 가지고 30년 끌어왔어요." },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "wonki", targetSide: "CON", author: "hwangye", body: "윤리 교육은 정원과 별개로 강화 가능합니다. 인원 확대를 막을 이유가 안 됩니다." },

  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "jangik", body: "직업군인이 정예라는 건 평시 기준입니다. 한반도는 여전히 정전 상태예요." },
  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "jangik", targetSide: "CON", author: "kangye", body: "징병제 유지의 명분이 *정치 메시지* 라면 그 비용을 청년들이 다 진다는 게 부당하지 않나요?" },
  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "moonki", targetSide: "CON", author: "hanseung", body: "가난한 청년만 군에 간다는 건 미국 통계 일부의 단순화입니다. 실제 모병제는 직업·기술 트랙도 포함해요." },
  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "chunho", targetSide: "CON", author: "parksoo", body: "약속이 그렇게 만들어졌다는 건 알겠습니다. 그런데 그 약속을 지금 세대가 다시 동의해야 하나요?" },

  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "junga", targetSide: "PRO", author: "kimsu", body: "응보의 정의 감각은 이해됩니다만, 오판 가능성을 0으로 만들 수 없는 게 더 무겁습니다." },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "CON", author: "ohjs", body: "오판 1건 vs 매년 발생하는 흉악범죄 피해자. 두 무게를 견주는 게 응보 정의의 출발이 아닐까요." },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "bakhy", targetSide: "CON", author: "jangik", body: "계급 처벌이라는 표현은 강합니다. 통계 출처를 같이 적어주시면 더 설득력 있을 것 같아요." },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "wonki", targetSide: "CON", author: "junga", body: "생명의 무게라는 관점은 받아들입니다. 그런데 피해자의 생명도 같은 무게 아닐까요." },

  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", targetAuthor: "leesh", targetSide: "PRO", author: "jionsu", body: "프롬프트 보호와 결과물 저작권은 다른 문제입니다. 후자에 너무 강한 권리를 주면 인간 창작이 묻힙니다." },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", targetAuthor: "junga", targetSide: "CON", author: "kangye", body: "100년 전제를 깬다는 표현이 멋있긴 한데, 도구가 바뀌면 전제도 바뀌어야 한다고 봅니다." },

  { boardTitle: "부유세 신설에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung", body: "프랑스 사례 한 번만 더 보세요. 자본 유출이 세수보다 컸습니다." },
  { boardTitle: "부유세 신설에 찬성하십니까?", targetAuthor: "hanseung", targetSide: "CON", author: "bakhy", body: "프랑스 사례는 부유세 설계 실패 사례입니다. 설계 잘하면 다른 결과가 나와요." },
  { boardTitle: "부유세 신설에 찬성하십니까?", targetAuthor: "chunho", targetSide: "CON", author: "leemy", body: "은퇴 자산 보호는 공감합니다. 다만 자산 규모 구간을 둬서 차등 부과하면 균형이 가능합니다." },

  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "junga", body: "위성정당으로 비례 강화 효과가 사실상 무력화된 게 직전 사례입니다. 제도만 바꾼다고 안 풀려요." },
  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "moonki", body: "독일 5% 봉쇄조항은 한국에도 적용 가능합니다. 비례성과 안정성 사이의 균형은 설계 가능해요." },

  { boardTitle: "원전 신규 건설에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "shinha", body: "재생에너지 + 저장장치 조합으로도 베이스로드 가능합니다. 원전을 *유일한* 선택지로 만들면 안 돼요." },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", targetAuthor: "shinha", targetSide: "CON", author: "jangik", body: "재생에너지가 베이스로드를 감당하려면 한국 면적의 몇 %가 패널로 덮여야 하나요." },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", targetAuthor: "leesh", targetSide: "CON", author: "ohjs", body: "안전 비용은 원전 가격에 이미 반영되고 있습니다. 가스·석탄 외부비용도 같이 따져야 공정해요." },

  { boardTitle: "주 4일제 도입에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "kimje", body: "OECD 평균 생산성 비교는 산업 구조 차이를 무시한 거예요. 한국 제조업 비중이 큽니다." },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", targetAuthor: "kimje", targetSide: "CON", author: "jionsu", body: "자영업 부담은 별도 보전 정책으로 풀어야지 4일제 자체를 막을 이유는 안 됩니다." },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "hwangye", body: "일률 도입 X 단계적 도입은 가능합니다. 공공·대기업부터 시범하는 모델이 있어요." },

  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "wonki", body: "시민권으로만 보면 단순합니다. 결혼은 가족 형성의 사회적 단위라는 차원이 같이 있어요." },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "wonki", targetSide: "CON", author: "leemy", body: "종교 자유와 시민의 결혼 권리는 분리 가능합니다. 전자가 후자를 막는 근거가 되긴 어려워요." },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "kangye", body: "시민결합이 이미 차별이라는 게 평등권 측면에서 인정받고 있는 추세입니다." },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "ohjs", targetSide: "CON", author: "parksoo", body: "사회적 합의는 누가 정의하나요? 법이 먼저 가서 합의를 만든 사례도 많습니다." },

  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", targetAuthor: "parkje", targetSide: "PRO", author: "kangye", body: "옵트아웃 강제하면 한국 모델만 데이터셋이 빈약해집니다. 글로벌 차원 협의가 먼저예요." },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", targetAuthor: "leesh", targetSide: "CON", author: "shinha", body: "출력물 유사성 규제는 사후 약방. 학습 단계에서 동의 절차가 더 윤리적입니다." },

  { boardTitle: "기본소득 도입에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung", body: "표적 지원 vs 보편 지급은 이미 학계에서도 결론 난 게 아닙니다. 보편이 행정 단순한 건 맞지만 효율은 별개." },
  { boardTitle: "기본소득 도입에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "bakhy", body: "재원 마련 방안은 부유세·자산세·환경세 묶음으로 가능합니다. 모호한 게 아니라 안 짠 거예요." },
  { boardTitle: "기본소득 도입에 찬성하십니까?", targetAuthor: "junga", targetSide: "CON", author: "hwangye", body: "표적 지원이 효율적이라는 가정의 전제가 *돌봄·가사 노동의 비가시화* 라는 점을 같이 봐야 합니다." },

  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", targetAuthor: "parkje", targetSide: "PRO", author: "bakhy", body: "결속의 비용을 누가 무는지 빠진 분석은 반쪽입니다. 무기 구매가 그 비용의 큰 부분이에요." },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "ohjs", body: "중국 의존 큰 건 사실. 그러나 안보 비용을 외주하면 결국 그 외주처에 더 종속됩니다." },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", targetAuthor: "junga", targetSide: "CON", author: "chunho", body: "역사 문제는 한일 양국이 같이 풀어가는 영역이지 군사협력의 전제 조건은 아닙니다." },

  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "choibo", body: "K-ETS와 중복 부담 우려는 여전히 살아있습니다. 통합 설계가 필수입니다." },
  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "shinha", body: "이중 부담 논리는 과거 K-ETS 만으로 충분하다는 가정 위에 서 있어요. 실제 감축 성과는 그 가정을 부정합니다." },
  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "choibo", targetSide: "CON", author: "jionsu", body: "단독 도입 우려는 산업 구조 전환의 *속도* 문제지 *방향* 문제는 아닙니다." },
  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "kimje", targetSide: "CON", author: "bakhy", body: "중소제조업 보호는 *세수 환원 메커니즘* 으로 같이 풀 수 있습니다. 도입 자체를 막는 근거는 안 됩니다." },
];

// 출처 반박 — 다른 페르소나 의견에 다른 출처를 들고 반박. 신뢰 도메인만.
const PERSONA_CHALLENGES: PersonaChallenge[] = [
  {
    boardTitle: "다주택자 보유세 강화에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung",
    body: "한국조세재정연구원 분석에 따르면 보유세 강화 시기에 임대료가 동조 상승했다. 가격 신호가 임차인에게 직접 전달됨을 시사한다.",
    sourceUrl: "https://www.kipf.re.kr",
  },
  {
    boardTitle: "다주택자 보유세 강화에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "moonki",
    body: "통계청 자료를 보면 보유세 비중은 OECD 평균의 절반 수준. 강화 여지가 객관적으로 존재한다.",
    sourceUrl: "https://kostat.go.kr",
  },
  {
    boardTitle: "의대 정원 확대에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "ohjs",
    body: "보건복지부 의료인력 분포 자료에서 OECD 평균 대비 부족분의 절반은 *지역 편중* 으로 설명된다. 정원만의 문제가 아니다.",
    sourceUrl: "https://www.mohw.go.kr",
  },
  {
    boardTitle: "의대 정원 확대에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "hwangye",
    body: "건강보험심사평가원 통계로 산부인과 분만 인프라는 매년 줄고 있다. 수가 인상만으로 1년 안에 만들 수 없다.",
    sourceUrl: "https://www.hira.or.kr",
  },
  {
    boardTitle: "모병제 전환에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "jangik",
    body: "국방부 병력구조 보고서에 따르면 단기 직업군인 충원만으로 50만 병력 효과를 대체할 수 없다.",
    sourceUrl: "https://www.mnd.go.kr",
  },
  {
    boardTitle: "모병제 전환에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "kangye",
    body: "한국국방연구원 분석에서 정예 직업군인 5만의 전투력이 징집 50만의 80% 수준이라는 결과가 있다.",
    sourceUrl: "https://www.kida.re.kr",
  },
  {
    boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?",
    targetAuthor: "junga", targetSide: "PRO", author: "leemy",
    body: "법무부 통계상 1990년대 사형 집행 시기와 흉악범죄 발생률 사이에 유의미한 상관관계가 발견되지 않았다.",
    sourceUrl: "https://www.moj.go.kr",
  },
  {
    boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "CON", author: "chunho",
    body: "대검찰청 강력범죄 동향 자료를 보면 흉악범죄 재범률이 가석방 시점 이후 통계적으로 유의미하게 상승한다.",
    sourceUrl: "https://www.spo.go.kr",
  },
  {
    boardTitle: "AI 생성물에 저작권을 부여해야 하는가?",
    targetAuthor: "leesh", targetSide: "PRO", author: "jionsu",
    body: "한국저작권위원회 가이드라인은 AI 결과물을 *저작자 없는 산출물* 로 분류하고 있다. 기존 법체계의 결론은 신중 쪽이다.",
    sourceUrl: "https://www.copyright.or.kr",
  },
  {
    boardTitle: "AI 생성물에 저작권을 부여해야 하는가?",
    targetAuthor: "junga", targetSide: "CON", author: "kangye",
    body: "USPTO 의 최근 결정에서 *충분한 인간 기여* 가 인정되는 AI 결과물에 부분 저작권 인정 사례가 누적되고 있다.",
    sourceUrl: "https://www.uspto.gov",
  },
  {
    boardTitle: "부유세 신설에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung",
    body: "프랑스 재정경제부 공식 자료에서 부유세 도입 후 자본 유출이 누적 세수의 1.5배로 보고됐다.",
    sourceUrl: "https://www.economie.gouv.fr",
  },
  {
    boardTitle: "부유세 신설에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "bakhy",
    body: "노르웨이는 부유세 유지 중이고 자본 유출이 미미하다. 설계와 회피 방지 메커니즘이 결정적이다.",
    sourceUrl: "https://www.regjeringen.no",
  },
  {
    boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "junga",
    body: "중앙선거관리위원회 직전 총선 분석에 따르면 위성정당으로 인해 비례성 효과가 거의 0이었다.",
    sourceUrl: "https://www.nec.go.kr",
  },
  {
    boardTitle: "원전 신규 건설에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "shinha",
    body: "한국에너지경제연구원 시나리오에서 재생에너지 비중 70% + ESS 조합으로 2040년 베이스로드 가능성이 제시됐다.",
    sourceUrl: "https://www.keei.re.kr",
  },
  {
    boardTitle: "원전 신규 건설에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "CON", author: "jangik",
    body: "원자력안전위원회 자료상 한국 원전의 안전 비용은 발전단가의 8% 미만으로 흡수되고 있다. *가장 싼 전력* 가정이 무너지지 않는다.",
    sourceUrl: "https://www.nssc.go.kr",
  },
  {
    boardTitle: "주 4일제 도입에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "kimje",
    body: "중소기업중앙회 조사에서 4일제 일률 도입 시 영세사업장의 70%가 인건비 부담으로 도산 위험을 보고했다.",
    sourceUrl: "https://www.kbiz.or.kr",
  },
  {
    boardTitle: "주 4일제 도입에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "shinha",
    body: "고용노동부 시범사업 결과에서 공공부문 4일제 도입 후 생산성이 평균 7% 상승했다.",
    sourceUrl: "https://www.moel.go.kr",
  },
  {
    boardTitle: "동성결혼 법제화에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "wonki",
    body: "한국갤럽 종교 인식 조사에서 동성결혼에 대한 사회적 합의 수준은 여전히 50% 미만으로 나타났다.",
    sourceUrl: "https://www.gallup.co.kr",
  },
  {
    boardTitle: "동성결혼 법제화에 찬성하십니까?",
    targetAuthor: "junga", targetSide: "CON", author: "leemy",
    body: "국가인권위원회 결정문에서 *시민결합 별도 제도* 가 결혼 권리의 동등 보장이 아니라는 판단이 누적되고 있다.",
    sourceUrl: "https://www.humanrights.go.kr",
  },
  {
    boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "CON", author: "jionsu",
    body: "EU AI Act 의 학습 데이터 옵트아웃 조항은 산업 위축이 아니라 *권리자 보호* 를 명시적 목적으로 한다.",
    sourceUrl: "https://digital-strategy.ec.europa.eu",
  },
  {
    boardTitle: "기본소득 도입에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "junga",
    body: "한국개발연구원의 표적 지원 vs 보편 지급 시뮬레이션에서 동일 재정 하에 표적 지원이 빈곤율 감소에 더 효과적이었다.",
    sourceUrl: "https://www.kdi.re.kr",
  },
  {
    boardTitle: "기본소득 도입에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "moonki",
    body: "핀란드 기본소득 실험 최종 보고서는 노동 유인 감소가 통계적으로 유의미하지 않았다고 결론지었다.",
    sourceUrl: "https://stm.fi",
  },
  {
    boardTitle: "한미일 군사협력 강화에 찬성하십니까?",
    targetAuthor: "parkje", targetSide: "PRO", author: "bakhy",
    body: "한국개발연구원 분석에서 한미일 협력 강화 시기에 한국의 대중국 무역 적자가 누적 GDP 의 2%까지 확대됐다.",
    sourceUrl: "https://www.kdi.re.kr",
  },
  {
    boardTitle: "탄소세 도입에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "choibo",
    body: "산업통상자원부 자료에 따르면 K-ETS 시행 이후 배출량 감소율이 연 2~3%로 안정화됐다. 추가 도입의 한계 효용이 작다.",
    sourceUrl: "https://www.motie.go.kr",
  },
  {
    boardTitle: "탄소세 도입에 찬성하십니까?",
    targetAuthor: "kimje", targetSide: "CON", author: "jionsu",
    body: "OECD 환경세 보고서에서 탄소세 도입 국가 대부분이 *세수 환원* 메커니즘으로 중소기업 부담을 흡수했다.",
    sourceUrl: "https://www.oecd.org",
  },
];

// ===== 시드 메인 =====

function slugify(title: string): string {
  const base = title
    .replace(/[\s?·,.()]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `seed-${base}`.slice(0, 40);
}

function getGroup(handle: string): Group {
  const fromExisting = EXISTING_GROUPS[handle];
  if (fromExisting) return fromExisting;
  const fromPersona = PERSONA_USERS.find((p) => p.handle === handle);
  return fromPersona?.group ?? "CENTRIST";
}

// deterministic pseudo-random (seed = pinId + userId hash)
function deterministicCoin(seed: string, threshold: number): boolean {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  const normalized = ((hash >>> 0) % 10000) / 10000;
  return normalized < threshold;
}

const ALL_HANDLES = [
  "kimsu", "parkje", "leesh", "hanmi", "choibo", "junga",
  ...PERSONA_USERS.map((p) => p.handle),
];

export async function seedPersonas(prisma: PrismaClient) {
  console.log("[seed-personas] 시작");

  // 1) 신규 사용자 14명 upsert
  const userMap = new Map<string, string>();
  for (const handle of ALL_HANDLES) {
    const user = await prisma.user.upsert({
      where: { nickname: handle },
      update: {},
      create: {
        nickname: handle,
        name: handle,
        email: `${handle}@seed.polem.org`,
      },
    });
    userMap.set(handle, user.id);
  }

  // 2) 페르소나 의견 — 기존 시드 의견 위에 추가 (seed.ts 가 이미 deleteMany 했으므로 이 시점엔 기존 의견만 있음)
  // 기존 시드 의견은 seed.ts 가 만들고, 이 함수는 *추가* 의견만 만든다.
  const pinByKey = new Map<string, { id: string; authorHandle: string }>();

  // 우선 기존 의견 (seed.ts 의 BOARDS 에서 만든 것) 을 board 별로 가져와 키-값 매핑
  const existingPins = await prisma.pin.findMany({
    select: { id: true, boardId: true, side: true, authorId: true, body: true },
  });
  // authorId → handle 역매핑
  const idToHandle = new Map<string, string>();
  userMap.forEach((id, handle) => idToHandle.set(id, handle));
  for (const p of existingPins) {
    const handle = idToHandle.get(p.authorId);
    if (!handle) continue;
    // 기존 의견은 board 의 pin author/side 첫 매칭으로 키 사용
    const board = await prisma.board.findUnique({ where: { id: p.boardId }, select: { title: true } });
    if (!board) continue;
    const key = `${board.title}::${handle}::${p.side}`;
    if (!pinByKey.has(key)) pinByKey.set(key, { id: p.id, authorHandle: handle });
  }

  // 페르소나 의견 추가
  for (const pin of PERSONA_PINS) {
    const authorId = userMap.get(pin.author);
    if (!authorId) continue;
    const boardId = slugify(pin.boardTitle);
    const exists = await prisma.board.findUnique({ where: { id: boardId } });
    if (!exists) {
      console.warn(`[seed-personas] 게시판 없음, skip: ${pin.boardTitle}`);
      continue;
    }
    const created = await prisma.pin.create({
      data: { boardId, authorId, side: pin.side, body: pin.body },
      select: { id: true, side: true },
    });
    const key = `${pin.boardTitle}::${pin.author}::${pin.side}`;
    pinByKey.set(key, { id: created.id, authorHandle: pin.author });
  }

  // 3) Board 카운터 재계산
  const allBoards = await prisma.board.findMany({ select: { id: true } });
  for (const b of allBoards) {
    const [proCount, conCount, pins] = await Promise.all([
      prisma.pin.count({ where: { boardId: b.id, side: "PRO" } }),
      prisma.pin.count({ where: { boardId: b.id, side: "CON" } }),
      prisma.pin.findMany({ where: { boardId: b.id }, select: { authorId: true } }),
    ]);
    const participantCount = new Set(pins.map((p) => p.authorId)).size;
    await prisma.board.update({
      where: { id: b.id },
      data: { proCount, conCount, participantCount },
    });
  }

  // 4) 동조 자동 생성 — 페르소나 그룹 친화도 기반 deterministic
  await prisma.endorsement.deleteMany({});
  const allPins = await prisma.pin.findMany({ select: { id: true, authorId: true } });
  for (const pin of allPins) {
    const authorHandle = idToHandle.get(pin.authorId);
    if (!authorHandle) continue;
    const authorGroup = getGroup(authorHandle);
    for (const handle of ALL_HANDLES) {
      const userId = userMap.get(handle);
      if (!userId || userId === pin.authorId) continue;
      const userGroup = getGroup(handle);
      let prob = 0;
      if (userGroup === authorGroup) prob = 0.55;
      else if (userGroup === "CENTRIST") prob = 0.18;
      else if (authorGroup === "CENTRIST") prob = 0.22;
      else prob = 0.04; // 반대 진영 약간
      if (deterministicCoin(pin.id + handle, prob)) {
        await prisma.endorsement.create({ data: { pinId: pin.id, userId } });
      }
    }
  }

  // 5) 댓글
  await prisma.comment.deleteMany({});
  for (const c of PERSONA_COMMENTS) {
    const authorId = userMap.get(c.author);
    if (!authorId) continue;
    const target = pinByKey.get(`${c.boardTitle}::${c.targetAuthor}::${c.targetSide}`);
    if (!target) {
      console.warn(`[seed-personas] 댓글 target 없음: ${c.boardTitle} ${c.targetAuthor} ${c.targetSide}`);
      continue;
    }
    await prisma.comment.create({
      data: { pinId: target.id, authorId, body: c.body },
    });
  }

  // 6) 출처 반박
  await prisma.challenge.deleteMany({});
  for (const ch of PERSONA_CHALLENGES) {
    const authorId = userMap.get(ch.author);
    if (!authorId) continue;
    const target = pinByKey.get(`${ch.boardTitle}::${ch.targetAuthor}::${ch.targetSide}`);
    if (!target) {
      console.warn(`[seed-personas] 반박 target 없음: ${ch.boardTitle} ${ch.targetAuthor} ${ch.targetSide}`);
      continue;
    }
    await prisma.challenge.create({
      data: { pinId: target.id, challengerId: authorId, body: ch.body, sourceUrl: ch.sourceUrl },
    });
  }

  // 7) 최종 통계
  const [totalUsers, totalPins, totalEndorsements, totalComments, totalChallenges] =
    await Promise.all([
      prisma.user.count(),
      prisma.pin.count(),
      prisma.endorsement.count(),
      prisma.comment.count(),
      prisma.challenge.count(),
    ]);
  console.log(`[seed-personas] 완료
  사용자: ${totalUsers}
  의견:   ${totalPins}
  동조:   ${totalEndorsements}
  댓글:   ${totalComments}
  반박:   ${totalChallenges}`);
}
