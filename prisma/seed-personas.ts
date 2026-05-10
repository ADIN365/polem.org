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

interface ChainStep {
  // 첫 step 은 신규 의견, 그 이후는 직전 step 에 대한 AGREE/REBUT
  author: string;
  body: string;
  relation: "ROOT" | "AGREE" | "REBUT";
  initialSide?: Side; // ROOT 일 때만
}

interface PersonaChain {
  boardTitle: string;
  steps: ChainStep[];
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

// 5단계 chain 테스트 데이터 — "다주택자 보유세 강화" 게시판에 동의·반박 chain 두 개
const PERSONA_CHAINS: PersonaChain[] = [
  {
    boardTitle: "다주택자 보유세 강화에 찬성하십니까?",
    steps: [
      { author: "kimsu", relation: "ROOT", initialSide: "PRO", body: "주거 안정이 시장 자율로 풀린 적이 있는가. 보유세는 가장 직접적인 가격 신호다." },
      { author: "moonki", relation: "AGREE", body: "정확히 그 지점이지요. 80년대부터 누적된 정책의 한계가 결국 지금의 격차로 굳어진 것입니다." },
      { author: "hwangye", relation: "AGREE", body: "맞아요. 여성 1인가구 친구들이 그 영향을 가장 먼저 그리고 가장 크게 받고 있어요." },
      { author: "bakhy", relation: "AGREE", body: "결국 임대료가 보유세를 대신 내는 구조가 그렇게 만들어진 거다. 본질이 거기 있다." },
      { author: "leesh", relation: "AGREE", body: "OECD 비교에서도 한국 보유세 비중은 평균의 절반 수준이라는 점을 다시 확인할 필요가 있다." },
    ],
  },
  {
    boardTitle: "다주택자 보유세 강화에 찬성하십니까?",
    steps: [
      { author: "kimsu", relation: "ROOT", initialSide: "PRO", body: "주거 안정이 시장 자율로 풀린 적이 있는가. 보유세는 가장 직접적인 가격 신호다." },
      { author: "hanmi", relation: "REBUT", body: "결국 임대료 전가로 흐르지 않을까. 가격 신호가 임차인에게 가는 게 늘 맹점이다." },
      { author: "moonki", relation: "REBUT", body: "임대료 전가는 공급 부족 시기에 더 심해지는 거지요. 보유세와 공급 정책은 묶어서 봐야 합니다." },
      { author: "hanseung", relation: "REBUT", body: "공급 정책의 효과는 시장이 결정한다. 정부가 손대면 결국 왜곡이 더 커진다." },
      { author: "bakhy", relation: "REBUT", body: "시장 신화는 늘 그렇게 약자에게 손해를 떠넘겨왔다. 본질은 안 바뀐다." },
      { author: "jangik", relation: "REBUT", body: "그 *늘 그렇다* 는 단순화가 결국 정책 다당화의 출발이다. 한 진영의 본질론으로 정책을 결정할 수는 없다." },
    ],
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

  // 5단계 chain 시드 — 동의·반박 깊이 쌓기
  let chainPinsCreated = 0;
  for (const chain of PERSONA_CHAINS) {
    const boardId = slugify(chain.boardTitle);
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      console.warn(`[seed-personas] chain 게시판 없음: ${chain.boardTitle}`);
      continue;
    }
    let prevPinId: string | null = null;
    let prevSide: Side | null = null;
    for (const step of chain.steps) {
      const authorId = userMap.get(step.author);
      if (!authorId) continue;

      if (step.relation === "ROOT") {
        // 기존 의견을 root 로 찾음 (boardTitle + author + initialSide)
        const root = pinByKey.get(`${chain.boardTitle}::${step.author}::${step.initialSide}`);
        if (!root) {
          console.warn(`[seed-personas] chain root 없음: ${chain.boardTitle} ${step.author} ${step.initialSide}`);
          break;
        }
        prevPinId = root.id;
        prevSide = step.initialSide ?? null;
        continue;
      }

      if (!prevPinId || !prevSide) break;
      const newSide: Side =
        step.relation === "AGREE" ? prevSide : prevSide === "PRO" ? "CON" : "PRO";

      const created: { id: string } = await prisma.pin.create({
        data: {
          boardId,
          authorId,
          side: newSide,
          body: step.body,
          quotedPinId: prevPinId,
          quotedRelation: step.relation,
        },
        select: { id: true },
      });
      // 부모 카운트 캐시 갱신
      await prisma.pin.update({
        where: { id: prevPinId },
        data: step.relation === "AGREE"
          ? { quoteAgreeCount: { increment: 1 } }
          : { quoteRebutCount: { increment: 1 } },
      });
      prevPinId = created.id;
      prevSide = newSide;
      chainPinsCreated++;
    }
  }

  // chain 으로 추가된 Pin 반영해서 board 카운터 다시
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

  const [totalUsers, totalPins, totalEndorsements] = await Promise.all([
    prisma.user.count(),
    prisma.pin.count(),
    prisma.endorsement.count(),
  ]);
  console.log(`[seed-personas] 완료
  사용자:   ${totalUsers}
  의견:     ${totalPins}
  동조:     ${totalEndorsements}
  chain:    ${chainPinsCreated} step (root 제외)`);
}
