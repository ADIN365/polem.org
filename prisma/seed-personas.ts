import type { PrismaClient } from "@prisma/client";

/**
 * 사이트 활성화 전 시드 — 14 페르소나 사용자 + 그들의 의견·동조·댓글·반박.
 * 기존 6명(seed.ts) 과 합쳐 총 20명.
 *
 * 페르소나별 *말투/어조* 도 차별화 — 한 사람이 다 쓴 듯한 톤 회피.
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

const PERSONA_USERS: PersonaUser[] = [
  { handle: "moonki", group: "PROGRESSIVE" },
  { handle: "jionsu", group: "PROGRESSIVE" },
  { handle: "shinha", group: "PROGRESSIVE" },
  { handle: "bakhy", group: "PROGRESSIVE" },
  { handle: "leemy", group: "PROGRESSIVE" },
  { handle: "hwangye", group: "PROGRESSIVE" },
  { handle: "kangye", group: "CENTRIST" },
  { handle: "kimje", group: "CENTRIST" },
  { handle: "parksoo", group: "CENTRIST" },
  { handle: "hanseung", group: "CONSERVATIVE" },
  { handle: "ohjs", group: "CONSERVATIVE" },
  { handle: "jangik", group: "CONSERVATIVE" },
  { handle: "chunho", group: "CONSERVATIVE" },
  { handle: "wonki", group: "CONSERVATIVE" },
];

const EXISTING_GROUPS: Record<string, Group> = {
  kimsu: "PROGRESSIVE",
  leesh: "PROGRESSIVE",
  parkje: "CONSERVATIVE",
  hanmi: "CONSERVATIVE",
  choibo: "CENTRIST",
  junga: "CONSERVATIVE",
};

const PERSONA_PINS: PersonaPin[] = [
  // === moonki (386 진보) — 정중·격식, "~입니다/~죠", 연대·분배 어휘 — 7
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "PRO", body: "보유세 강화는 자산 격차를 메우는 가장 정공법입니다. 80년대부터 누적된 주택 정책의 한계가 지금의 격차로 굳어진 것이지요.", author: "moonki" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "PRO", body: "1%가 30%의 자산을 쥐고 있는 사회는 결국 민주주의의 토양 자체를 갉아먹습니다. 새 도구가 정당하다고 봅니다.", author: "moonki" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "PRO", body: "노조와 복지 위에 기본소득이 얹어져야 사회 안전망이 비로소 완성됩니다. 단계적 도입이면 충분하지요.", author: "moonki" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "모병제는 결국 가난한 청년만 군에 가게 만드는 제도입니다. 미국·영국이 그 살아있는 사례지요.", author: "moonki" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "오판 한 번이면 사회 전체가 그 빚을 집니다. 가석방 없는 종신형 도입이 우선입니다.", author: "moonki" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "결혼은 시민권의 일부입니다. 시민권을 다수결로 막아온 역사는 늘 부끄러운 자리에 남아왔지요.", author: "moonki" },
  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", side: "PRO", body: "양당 독점이 노동·소수정당의 입법 진입을 막는 가장 큰 장벽입니다. 비례성 강화는 정상화의 출발이지요.", author: "moonki" },

  // === jionsu (MZ 진보) — 짧고 직설, 영어 섞임, 가끔 ㄴㄴ ㅇㅇ — 7
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "출산율 0.7 시대인데 주 5일제는 진짜 ㄴㄴ. 시간 자체가 없는데 애를 어떻게 낳음.", author: "jionsu" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내 친구들 결혼하는 걸 국가가 인정 안 한다는 게 더 이상함. 그냥 평범한 일이잖아.", author: "jionsu" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "기후 위기는 우리 세대 직격탄임. 가격 신호 없으면 기업 절대 안 움직임. 글로벌 트렌드도 그쪽임.", author: "jionsu" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "CON", body: "고준위 폐기물 처분장도 없는데 신규 건설? 다음 세대한테 짐 떠넘기는 거잖음.", author: "jionsu" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "CON", body: "AI 결과물에 저작권 주기 시작하면 인간 창작자 보호망 진짜 빠르게 무너짐. 이건 신중해야 함.", author: "jionsu" },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", side: "PRO", body: "공개=학습 무료 라는 식은 빅테크 자기변호임. 동의 절차가 기본 매너 아님?", author: "jionsu" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "지방 응급실에서 사람이 죽는 게 현실임. 일단 인원부터 늘려야지 ㅡㅡ", author: "jionsu" },

  // === shinha (환경녹색) — 차분·데이터, "~다/~로 본다" — 4
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "CON", body: "후쿠시마 사고 한 번에 한·일 어업이 13년째 영향을 받고 있다. 이 외부비용을 단가에 포함하면 가장 싼 전력이라는 전제가 흔들린다.", author: "shinha" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "EU CBAM 시행 후 한국의 철강·시멘트 수출 단가에 이미 추가 부담이 매겨지고 있다. 도입을 늦출수록 손실이 커진다고 본다.", author: "shinha" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "노동시간 단축은 출퇴근·산업 배출량 감소로도 이어진다. 환경·노동 두 축에서 동시에 효과가 누적되는 구조다.", author: "shinha" },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", side: "PRO", body: "에너지 윤리뿐 아니라 디지털 윤리도 같은 결의 문제다. 무단 사용은 권리자에 대한 도둑질로 본다.", author: "shinha" },

  // === bakhy (노동 좌파) — 직선·강한, "~다", 분노 섞임 — 9
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "PRO", body: "노동의 가치가 자산의 가치를 못 따라가는 시대다. 부유세는 그 격차를 메우는 도구다. 이건 선택이 아니라 의무다.", author: "bakhy" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "PRO", body: "AI가 일자리를 빠르게 잠식한다. 안전망은 무너지기 전에 깔아야 한다. 늦으면 더 큰 비용을 치른다.", author: "bakhy" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "PRO", body: "세입자가 임대료로 다주택자 보유세를 대신 내는 구조 자체가 비정상이다. 본질은 거기 있다.", author: "bakhy" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "수가 핑계는 30년째다. 일단 사람부터 늘려야 시장 협상력이 생긴다. 협상 없이 수가 안 오른다.", author: "bakhy" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "CON", body: "미국 무기 사주는 동맹은 동맹이 아니라 종속이다. 누가 비용을 무는지가 본질이다.", author: "bakhy" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "CON", body: "노동자 안전부터다. 후쿠시마는 가장 무거운 노동 안전 사례다. 잊으면 다음 사고가 한국에서 난다.", author: "bakhy" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "CON", body: "기업이 AI 결과물 저작권을 가지면 결국 노동자 창작 단가만 깎인다. 누가 이득 보는지 보면 답이 보인다.", author: "bakhy" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "가난한 사람이 더 사형당한다. 통계가 그렇다. 응보가 아니라 계급 처벌이다.", author: "bakhy" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "산업계 부담이 노동자에게 전가되지 않게 분배 메커니즘을 같이 설계해야 한다. 이게 빠지면 또 노동자 손해다.", author: "bakhy" },

  // === leemy (페미 진보) — 분석·성찰, "~다", 시스템·구조 어휘 — 4
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "법적 보호 부재 자체가 일상의 차별을 정당화하는 가장 큰 구조적 근거가 된다. 법은 그래서 먼저 가야 한다.", author: "leemy" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "여성 살해 사건 앞에서 사형 부활을 원하는 분노는 이해된다. 다만 오판은 시스템 차원에서 0이 될 수 없는 변수다.", author: "leemy" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "PRO", body: "가사·돌봄 노동의 가치를 시장이 외면해온 결과가 자산 격차의 한 측면이다. 부유세는 보편 분배의 도구다.", author: "leemy" },
  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", side: "PRO", body: "여성 의원 비율 19%의 의회가 50% 인구를 대변할 수 있는 구조가 아니다. 비례 강화는 그 시작점이다.", author: "leemy" },

  // === hwangye (여성 진보) — 따뜻·공감, "~네요/~예요", 일상 사례 — 6
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "PRO", body: "여성 1인가구 친구들 주거 부담이 진짜 심해요. 보유세 강화가 시작점은 돼야 하지 않을까요.", author: "hwangye" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "산부인과 없는 동네가 한둘이 아니에요. 30년째 같은 얘기 반복되는 게 더 답답하네요.", author: "hwangye" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내 친구가 행복할 권리가 다른 사람 권리를 깎는 게 아니에요. 그게 평등이지요.", author: "hwangye" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "PRO", body: "돌봄 노동을 시장이 안 매기니까, 기본소득이 그 가치를 인정해주는 작은 출발이 될 수 있어요.", author: "hwangye" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "엄마와 아이가 같이 저녁 먹는 사회가 정상이에요. 지금은 그게 사치예요.", author: "hwangye" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "PRO", body: "기후 위기는 결국 약자한테 더 큰 피해예요. 탄소세는 약자 보호의 시작이라고 보네요.", author: "hwangye" },

  // === kangye (청년 자유주의) — 시니컬·짧음, "~네/~죠", 비꼼 — 5
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "친구는 18개월 잃었네. 그 시간을 인건비로 보상하는 게 그렇게 안 될 일인가.", author: "kangye" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "내가 누구랑 결혼하는지 정부가 결정할 일은 아니죠.", author: "kangye" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "PRO", body: "프롬프트 디자인도 노동인데 보호 안 한다? 그러면 누가 만드나.", author: "kangye" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "CON", body: "자산 모으면 또 세금. 이런 사회에서 누가 돈 벌고 싶을까요.", author: "kangye" },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", side: "CON", body: "EU 처럼 옵트아웃 강제? 그러면 한국 모델 경쟁력은 0이네요. 그게 목적인가요.", author: "kangye" },

  // === kimje (자영업 중도) — 한숨·실무, "~예요/~해요", 가게·매출 어휘 — 5
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "CON", body: "자영업·중소 인건비 구조에서 4일제는 솔직히 사형선고예요. 일률 강제는 진짜 안 돼요.", author: "kimje" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "지방 자영업자 가족도 응급실 못 가요. 이게 현실이에요. 사람부터 늘려주세요.", author: "kimje" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "임대 사업자 단속하면 임대료 오릅니다. 결국 가게 임차인이 또 부담을 져요. 본 적 있는 분 다 알아요.", author: "kimje" },
  { boardTitle: "탄소세 도입에 찬성하십니까?", side: "CON", body: "탄소세에 배출권까지 이중부담이면 중소 제조업이 먼저 무너져요. 그 다음 우리 가게에 영향 와요.", author: "kimje" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "병역 기간 줄여서 청년이 빨리 일터로 와야 자영업 인력난도 풀려요. 진짜 사람이 없어요.", author: "kimje" },

  // === parksoo (청년 중도) — 솔직·가볍게, "~네요/~같아요" — 5
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "내 또래는 군 18개월을 그냥 인생 손실로 봐요. 모병제로 가면서 직업군인 인건비 보장하는 게 정직한 것 같네요.", author: "parksoo" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "PRO", body: "정치 싸움 말고 동네 응급실에 의사가 있냐가 더 중요한 것 같아요.", author: "parksoo" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "PRO", body: "친구가 행복하면 그게 답이라고 생각해요. 사회 합의 운운은 좀 그만해도 될 것 같네요.", author: "parksoo" },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", side: "PRO", body: "프롬프트도 어쨌든 글이고 글에는 창작이 있는 것 같아요.", author: "parksoo" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "PRO", body: "야근 강요가 사라지는 게 정상 사회 아닐까요.", author: "parksoo" },

  // === hanseung (자유주의 보수) — 차가움·논리, "~다", 시장·자유 어휘 — 6
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "세금으로 시장을 통제하면 결국 임차인이 비용을 진다. 경제학의 기본 결론이다.", author: "hanseung" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "CON", body: "프랑스가 이미 부유세로 자본 유출을 겪었다. 자본은 발이 빠르다는 점은 데이터가 말한다.", author: "hanseung" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "PRO", body: "징병제는 청년의 기회비용을 국가가 무상으로 가져가는 제도다. 자유주의 관점에서 모병제가 정당하다.", author: "hanseung" },
  { boardTitle: "기본소득 도입에 찬성하십니까?", side: "CON", body: "보편 지급은 노동의 존엄성과 자기 책임을 약화시킨다. 표적 지원이 더 효율적이다.", author: "hanseung" },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", side: "CON", body: "노동시간을 법으로 일률 단축하는 건 자유시장 원칙에 정면으로 반한다. 노사 자율로 풀어야 한다.", author: "hanseung" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "동맹 없이 자유경제는 유지되지 않는다. 한미일은 안보와 경제의 두 축이다.", author: "hanseung" },

  // === ohjs (가부장 보수) — 권위·단정, "~지/~해야지/~다" — 6
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "PRO", body: "흉악범에게 응보를 주는 건 피해자 가족의 최소한의 위로지. 법이 그 무게를 안 지면 무엇을 지나.", author: "ohjs" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "CON", body: "결혼은 가족 형성의 기본 단위다. 정의를 바꾸려면 사회적 합의가 먼저 있어야지.", author: "ohjs" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "북한 도발 패턴 보면 답은 명확하지. 한미일 결속이 가장 빠른 억제력이다.", author: "ohjs" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "CON", body: "정원 늘려도 지방 안 가지. 수가부터 손봐야 하는 게 순서다.", author: "ohjs" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "징병제는 한반도 안보 환경의 정치적 메시지다. 가볍게 바꿀 일이 아니지.", author: "ohjs" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "PRO", body: "재생에너지로 한국 산업 전력을 감당할 수 없지. 원전이 현실적인 답이다.", author: "ohjs" },

  // === jangik (안보 보수) — 확신, "~다", 군·동맹 어휘 — 5
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "정전국가에서 50만 병력은 산수 이상의 정치 메시지다. 안보 환경이 받쳐줄 때 다시 봐야 한다.", author: "jangik" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "북·중·러 결속에 대응할 카운터 카드는 한미일 결속뿐이다. 다른 선택지가 없다.", author: "jangik" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "PRO", body: "전력 안보가 곧 안보다. 외부 의존 가스로는 베이스로드를 짤 수 없다.", author: "jangik" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "PRO", body: "법치는 응보의 무게로 신뢰를 만든다. 사형 폐지는 곧 법치 약화로 본다.", author: "jangik" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "잦은 조세 변경은 정부 신뢰를 깎는다. 제도 안정이 시장 회복의 첫 걸음이다.", author: "jangik" },

  // === chunho (노년 보수) — 회상·훈계, "~지 않은가/~지" — 8
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "PRO", body: "법은 무거워야 사회가 사는 게 아닌가. 응보 없는 법은 그저 종이호랑이지.", author: "chunho" },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", side: "PRO", body: "한미동맹 70년이 한국을 이만큼 만들어 온 거지. 그걸 흔들면 우리만 손해 아닌가.", author: "chunho" },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", side: "PRO", body: "전력이 끊어지면 산업이 어떻게 살아남나. 안 끊기는 건 결국 원전이지.", author: "chunho" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "CON", body: "교육 인프라도 없는 마당에 정원만 늘리면 의사 질이 떨어지는 게 당연하지 않은가.", author: "chunho" },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", side: "CON", body: "60대 은퇴자한테 보유세 강화는 노후를 깎는 일이지. 우리 세대는 어디로 가나.", author: "chunho" },
  { boardTitle: "부유세 신설에 찬성하십니까?", side: "CON", body: "은퇴 후 자산이 다인 사람한테 부유세에 종부세에 상속세까지. 한국 노년의 세금 지옥 아닌가.", author: "chunho" },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "CON", body: "전통 가족이 무너지면 사회가 흔들리는 거지. 합의가 먼저 있어야 하지 않나.", author: "chunho" },
  { boardTitle: "모병제 전환에 찬성하십니까?", side: "CON", body: "남자라면 군은 가야 하는 게 우리 사회 약속이었지. 그게 그렇게 가벼운 약속인가.", author: "chunho" },

  // === wonki (기독교 보수) — 사려깊은, "~인 것이지요/~합니다" — 3
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", side: "CON", body: "결혼의 정의는 종교적·문화적 합의 위에 서 있는 것이지요. 입법으로 일방 통과시키는 것은 위험한 시도라고 봅니다.", author: "wonki" },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", side: "CON", body: "생명을 거두는 일에는 인간이 함부로 들어설 수 없는 영역이 있는 것이지요. 국가의 사형 집행에는 분명한 한계가 있다고 봅니다.", author: "wonki" },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", side: "CON", body: "윤리 교육 없이 사람만 늘리면 직업윤리부터 무너지는 것이지요. 의료는 기술 이전에 사람을 다루는 일입니다.", author: "wonki" },
];

// 페르소나 간 논쟁 — 답글에도 각 페르소나 말투 유지
const PERSONA_COMMENTS: PersonaComment[] = [
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "hanmi", body: "가격 신호는 임대료로도 똑같이 작동한다. 결국 세입자가 진다는 게 늘 맹점이다." },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "moonki", body: "임대료 전가는 공급 부족 시기에 더 심해지는 거지요. 보유세와 공급 정책은 묶어서 봐야 합니다." },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "chunho", targetSide: "CON", author: "leesh", body: "1주택 은퇴자는 종부세에 이미 보호 장치가 있다. 다주택과는 분명 다른 사안이다." },
  { boardTitle: "다주택자 보유세 강화에 찬성하십니까?", targetAuthor: "bakhy", targetSide: "PRO", author: "kimje", body: "임차인 부담 전가가 안 일어나려면 어떤 정책이 같이 필요한가요? 진짜 궁금해요." },

  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "hanmi", body: "정원만 늘려도 지방엔 안 간다. 수가·지역 의무 복무 설계가 먼저다." },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "jionsu", body: "수가 개선 30년째 말로만 함. 일단 사람을 늘려야 협상력이 생기지." },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "ohjs", targetSide: "CON", author: "parksoo", body: "수가가 먼저라는 건 동의해요. 근데 인원도 같이 가야 하는 것 같네요. 둘 중 하나만 들고 30년 끌어왔잖아요." },
  { boardTitle: "의대 정원 확대에 찬성하십니까?", targetAuthor: "wonki", targetSide: "CON", author: "hwangye", body: "윤리 교육은 정원과 별개로 강화 가능해요. 인원 확대 자체를 막을 이유는 안 되네요." },

  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "jangik", body: "직업군인이 정예라는 건 평시 기준의 분석이다. 한반도는 여전히 정전 상태다." },
  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "jangik", targetSide: "CON", author: "kangye", body: "징병제 유지 명분이 *정치 메시지* 라면 그 비용을 청년이 다 지는 게 부당하잖아요." },
  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "moonki", targetSide: "CON", author: "hanseung", body: "가난한 청년만 군에 간다는 명제는 미국 통계의 단순화다. 실제 모병제는 직업·기술 트랙도 포함한다." },
  { boardTitle: "모병제 전환에 찬성하십니까?", targetAuthor: "chunho", targetSide: "CON", author: "parksoo", body: "그렇게 약속이 만들어진 건 알겠어요. 근데 그 약속을 지금 세대가 다시 동의해야 하는 거 아닐까요." },

  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "junga", targetSide: "PRO", author: "kimsu", body: "응보의 정의 감각은 이해된다. 다만 오판 가능성을 0으로 만들 수 없다는 게 더 무겁다." },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "CON", author: "ohjs", body: "오판 1건과 매년 발생하는 흉악범죄 피해자. 두 무게를 견주는 게 응보의 출발이지." },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "bakhy", targetSide: "CON", author: "jangik", body: "계급 처벌이라는 표현은 강한 주장이다. 통계 출처를 같이 적어주면 더 설득력 있을 것이다." },
  { boardTitle: "사형제 부활(집행 재개)에 찬성하십니까?", targetAuthor: "wonki", targetSide: "CON", author: "junga", body: "생명의 무게라는 관점은 받아들인다. 그런데 피해자의 생명도 같은 무게 아닌가." },

  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", targetAuthor: "leesh", targetSide: "PRO", author: "jionsu", body: "프롬프트 보호랑 결과물 저작권은 다른 문제임. 후자에 강한 권리 주면 인간 창작이 묻힘." },
  { boardTitle: "AI 생성물에 저작권을 부여해야 하는가?", targetAuthor: "junga", targetSide: "CON", author: "kangye", body: "100년 전제를 깬다는 표현이 멋있긴 하네요. 도구가 바뀌면 전제도 바뀌는 거 아닌가요." },

  { boardTitle: "부유세 신설에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung", body: "프랑스 사례 한 번만 더 보라. 자본 유출이 누적 세수보다 컸다." },
  { boardTitle: "부유세 신설에 찬성하십니까?", targetAuthor: "hanseung", targetSide: "CON", author: "bakhy", body: "프랑스는 부유세 설계 실패 사례다. 회피 경로 막은 노르웨이는 다른 결과를 보였다." },
  { boardTitle: "부유세 신설에 찬성하십니까?", targetAuthor: "chunho", targetSide: "CON", author: "leemy", body: "은퇴 자산 보호 측면은 공감한다. 다만 자산 규모 구간 차등 부과로 균형이 가능한 영역이다." },

  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "junga", body: "위성정당으로 비례 강화 효과가 사실상 무력화된 게 직전 사례다. 제도만 바꾼다고 풀리지 않는다." },
  { boardTitle: "선거제도 개편(연동형 비례 강화)에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "moonki", body: "독일 5% 봉쇄조항은 한국에도 적용 가능합니다. 비례성과 안정성 사이의 균형은 설계 가능한 영역이지요." },

  { boardTitle: "원전 신규 건설에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "shinha", body: "재생에너지에 ESS 조합으로도 베이스로드는 짤 수 있다. 원전을 *유일* 선택지로 만드는 건 분석을 좁힌다." },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", targetAuthor: "shinha", targetSide: "CON", author: "jangik", body: "재생에너지가 베이스로드를 감당하려면 한국 면적의 몇 %가 패널로 덮여야 하는지 같이 봐야 한다." },
  { boardTitle: "원전 신규 건설에 찬성하십니까?", targetAuthor: "leesh", targetSide: "CON", author: "ohjs", body: "안전 비용은 원전 가격에 이미 반영되고 있지. 가스·석탄 외부비용도 같이 따져야 공정하다." },

  { boardTitle: "주 4일제 도입에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "kimje", body: "OECD 평균 생산성 비교는 산업 구조 차이를 무시한 거예요. 한국 제조업 비중이 큰 거 잊으면 안 돼요." },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", targetAuthor: "kimje", targetSide: "CON", author: "jionsu", body: "자영업 부담은 보전 정책으로 풀면 됨. 4일제 자체를 막을 이유는 안 됨." },
  { boardTitle: "주 4일제 도입에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "hwangye", body: "일률 도입이 아니라 공공·대기업부터 시범 도입하는 모델이 있어요. 단계적이면 충분히 가능해요." },

  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "wonki", body: "시민권으로만 보면 단순한 문제이지요. 결혼은 가족 형성의 사회적 단위라는 차원이 함께 있는 것입니다." },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "wonki", targetSide: "CON", author: "leemy", body: "종교 자유와 시민의 결혼 권리는 분리 가능한 영역이다. 전자가 후자를 막는 근거는 안 된다." },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "kangye", body: "시민결합이 이미 차별이라는 게 평등권 측면에서 인정받는 추세죠." },
  { boardTitle: "동성결혼 법제화에 찬성하십니까?", targetAuthor: "ohjs", targetSide: "CON", author: "parksoo", body: "사회적 합의는 누가 정의하는 건가요. 법이 먼저 가서 합의를 만든 사례도 많은 것 같아요." },

  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", targetAuthor: "parkje", targetSide: "PRO", author: "kangye", body: "옵트아웃 강제하면 한국 모델만 데이터셋이 빈약해지죠. 글로벌 협의가 먼저라고 봐요." },
  { boardTitle: "AI 학습용 데이터 무단 사용 규제에 찬성하십니까?", targetAuthor: "leesh", targetSide: "CON", author: "shinha", body: "출력물 유사성 규제는 사후 약방이다. 학습 단계에서 동의 절차가 있는 게 더 윤리적인 구조다." },

  { boardTitle: "기본소득 도입에 찬성하십니까?", targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung", body: "표적 지원 vs 보편 지급은 학계에서도 결론 난 게 아니다. 보편이 행정 단순한 건 맞지만 효율은 별개의 문제다." },
  { boardTitle: "기본소득 도입에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "bakhy", body: "재원 마련은 부유세·자산세·환경세 묶음으로 가능하다. 모호한 게 아니라 안 짠 거다." },
  { boardTitle: "기본소득 도입에 찬성하십니까?", targetAuthor: "junga", targetSide: "CON", author: "hwangye", body: "표적 지원이 효율적이라는 가정의 전제가 *돌봄·가사 노동의 비가시화* 라는 점을 같이 봐야 해요." },

  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", targetAuthor: "parkje", targetSide: "PRO", author: "bakhy", body: "결속의 비용을 누가 무는지가 빠진 분석은 반쪽이다. 무기 구매가 그 비용의 큰 부분이다." },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "ohjs", body: "중국 의존이 큰 건 사실이지. 그러나 안보 비용을 외주하면 결국 그 외주처에 더 종속되는 거다." },
  { boardTitle: "한미일 군사협력 강화에 찬성하십니까?", targetAuthor: "junga", targetSide: "CON", author: "chunho", body: "역사 문제는 한일 양국이 같이 풀어가는 영역이지. 군사협력의 전제 조건은 아닌 게 아닌가." },

  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "leesh", targetSide: "PRO", author: "choibo", body: "K-ETS와 중복 부담 우려는 여전하다. 통합 설계가 필수다." },
  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "hanmi", targetSide: "CON", author: "shinha", body: "이중 부담 논리는 K-ETS 만으로 충분하다는 가정 위에 서 있다. 실제 감축 성과는 그 가정을 부정한다." },
  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "choibo", targetSide: "CON", author: "jionsu", body: "단독 도입 우려는 산업 구조 전환 *속도* 문제지 *방향* 문제는 아님." },
  { boardTitle: "탄소세 도입에 찬성하십니까?", targetAuthor: "kimje", targetSide: "CON", author: "bakhy", body: "중소제조업 보호는 *세수 환원 메커니즘* 으로 같이 풀 수 있다. 도입 자체를 막을 근거는 안 된다." },
];

// 출처 반박 — 페르소나 말투 유지 + sourceUrl 은 신뢰 가능 도메인
const PERSONA_CHALLENGES: PersonaChallenge[] = [
  {
    boardTitle: "다주택자 보유세 강화에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "hanseung",
    body: "한국조세재정연구원 분석에 따르면 보유세 강화 시기에 임대료가 동조 상승했다. 가격 신호가 임차인에게 직접 전달된다는 의미다.",
    sourceUrl: "https://www.kipf.re.kr",
  },
  {
    boardTitle: "다주택자 보유세 강화에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "moonki",
    body: "통계청 자료를 보면 한국의 보유세 비중은 OECD 평균의 절반 수준입니다. 강화 여지가 객관적으로 존재하지요.",
    sourceUrl: "https://kostat.go.kr",
  },
  {
    boardTitle: "의대 정원 확대에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "ohjs",
    body: "보건복지부 의료인력 분포 자료에서 OECD 평균 대비 부족분의 절반은 *지역 편중* 으로 설명되지. 정원만의 문제가 아니다.",
    sourceUrl: "https://www.mohw.go.kr",
  },
  {
    boardTitle: "의대 정원 확대에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "hwangye",
    body: "건강보험심사평가원 통계 보면 산부인과 분만 인프라가 매년 줄어요. 수가 인상만으로 1년 안에 만들 수 있는 게 아니에요.",
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
    body: "한국국방연구원 분석에서 정예 직업군인 5만의 전투력이 징집 50만의 80% 수준이라는 결과가 나오네요.",
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
    body: "대검찰청 강력범죄 동향을 보면 흉악범죄 재범률이 가석방 시점 이후 유의미하게 올라가지 않은가.",
    sourceUrl: "https://www.spo.go.kr",
  },
  {
    boardTitle: "AI 생성물에 저작권을 부여해야 하는가?",
    targetAuthor: "leesh", targetSide: "PRO", author: "jionsu",
    body: "한국저작권위원회 가이드라인이 AI 결과물을 *저작자 없는 산출물* 로 분류함. 기존 법체계 결론은 신중 쪽임.",
    sourceUrl: "https://www.copyright.or.kr",
  },
  {
    boardTitle: "AI 생성물에 저작권을 부여해야 하는가?",
    targetAuthor: "junga", targetSide: "CON", author: "kangye",
    body: "USPTO 최근 결정에서 *충분한 인간 기여* 가 인정되는 AI 결과물에 부분 저작권 인정 사례가 누적되네요.",
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
    body: "원자력안전위원회 자료상 한국 원전의 안전 비용은 발전단가의 8% 미만으로 흡수되고 있다. *가장 싼 전력* 가정은 무너지지 않는다.",
    sourceUrl: "https://www.nssc.go.kr",
  },
  {
    boardTitle: "주 4일제 도입에 찬성하십니까?",
    targetAuthor: "leesh", targetSide: "PRO", author: "kimje",
    body: "중소기업중앙회 조사에서 4일제 일률 도입 시 영세사업장 70%가 인건비 부담으로 도산 위험이라고 답해요.",
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
    body: "한국갤럽 종교 인식 조사에서 동성결혼에 대한 사회적 합의 수준이 여전히 50% 미만으로 보고되는 것이지요.",
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
    body: "EU AI Act 의 학습 데이터 옵트아웃 조항은 산업 위축이 아니라 *권리자 보호* 가 명시 목적임.",
    sourceUrl: "https://digital-strategy.ec.europa.eu",
  },
  {
    boardTitle: "기본소득 도입에 찬성하십니까?",
    targetAuthor: "kimsu", targetSide: "PRO", author: "junga",
    body: "한국개발연구원 표적 지원 vs 보편 지급 시뮬레이션에서 동일 재정 하에 표적 지원이 빈곤율 감소에 더 효과적이었다.",
    sourceUrl: "https://www.kdi.re.kr",
  },
  {
    boardTitle: "기본소득 도입에 찬성하십니까?",
    targetAuthor: "hanmi", targetSide: "CON", author: "moonki",
    body: "핀란드 기본소득 실험 최종 보고서는 노동 유인 감소가 통계적으로 유의미하지 않았다고 결론지은 것이지요.",
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
    body: "OECD 환경세 보고서에 보면 탄소세 도입 국가 대부분이 *세수 환원* 메커니즘으로 중소기업 부담을 흡수했음.",
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

  const pinByKey = new Map<string, { id: string; authorHandle: string }>();
  const idToHandle = new Map<string, string>();
  userMap.forEach((id, handle) => idToHandle.set(id, handle));

  const existingPins = await prisma.pin.findMany({
    select: { id: true, boardId: true, side: true, authorId: true },
  });
  for (const p of existingPins) {
    const handle = idToHandle.get(p.authorId);
    if (!handle) continue;
    const board = await prisma.board.findUnique({ where: { id: p.boardId }, select: { title: true } });
    if (!board) continue;
    const key = `${board.title}::${handle}::${p.side}`;
    if (!pinByKey.has(key)) pinByKey.set(key, { id: p.id, authorHandle: handle });
  }

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
      else prob = 0.04;
      if (deterministicCoin(pin.id + handle, prob)) {
        await prisma.endorsement.create({ data: { pinId: pin.id, userId } });
      }
    }
  }

  await prisma.comment.deleteMany({});
  for (const c of PERSONA_COMMENTS) {
    const authorId = userMap.get(c.author);
    if (!authorId) continue;
    const target = pinByKey.get(`${c.boardTitle}::${c.targetAuthor}::${c.targetSide}`);
    if (!target) {
      console.warn(`[seed-personas] 댓글 target 없음: ${c.boardTitle} ${c.targetAuthor} ${c.targetSide}`);
      continue;
    }
    await prisma.comment.create({ data: { pinId: target.id, authorId, body: c.body } });
  }

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
