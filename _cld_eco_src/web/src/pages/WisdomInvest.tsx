import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── 챕터 데이터 ─────────────────────────────────────────────────────────────
const chapters = [
  {
    num: "제 1장",
    icon: "🌱",
    title: "풍족한 마음이 먼저다",
    subtitle: "투자는 종목을 고르기 전에 마음을 고르는 일이다",
    category: "마음가짐",
    color: "#2d6a4f",
    bg: "from-emerald-50/80 to-teal-50/60",
    border: "border-emerald-300",
    narrative: `주식을 처음 시작하는 사람은 종목을 먼저 찾는다. 어떤 주식이 오를까, 언제 사야 할까. 그러나 오래된 투자자들이 이구동성으로 말하는 것이 있다. 종목보다 마음이 먼저라고.

불안한 마음으로 산 주식은 주가가 올라도 두렵고, 내려도 두렵다. 올랐을 때는 '지금 팔아야 하나' 조마조마하고, 내렸을 때는 '더 내리면 어떡하나' 겁이 난다. 결국 어느 쪽이든 감정이 매매를 지배한다.

풍족한 마음이란 모든 것이 충족된 절대 만족의 상태가 아니다. 부족함도 있고, 목표도 있고, 욕심도 있다. 단지 시선의 방향이 다르다. 없는 70에 집중하는 것이 결핍이라면, 있는 30을 먼저 보는 것이 풍족이다. 같은 현실, 다른 해석. 그 차이가 10년 수익률을 만든다.

지금 내 투자 계좌를 보라. 손실이 나 있다면 그것이 나를 정의하지 않는다. 지금 내가 살아있고, 다음 기회가 있다는 것. 그것이 풍족한 투자자의 출발점이다.`,
    quote: "주식이 반토막 나도 잠을 잘 잘 수 있어야 한다.",
    author: "워런 버핏",
    kospi: "코스피 200주선 이격 +158%. 이 수치 앞에서 공포에 떠는 것이 결핍이고, '내 분할매수 계획을 지킬 기회가 왔다'고 읽는 것이 풍족이다.",
  },
  {
    num: "제 2장",
    icon: "⏳",
    title: "조급증은 가장 비싼 수수료다",
    subtitle: "시장이 가져가는 돈보다 내 조급함이 가져가는 돈이 더 많다",
    category: "조급증",
    color: "#c0392b",
    bg: "from-red-50/80 to-orange-50/60",
    border: "border-red-300",
    narrative: `증권사는 매매 수수료를 받는다. 요즘은 0.015%로 낮아졌다. 그런데 정말 비싼 수수료는 눈에 보이지 않는다. 바로 조급증이 가져가는 수수료다.

주가가 오를 것 같아서 서둘러 산다. 조금 내리면 불안해서 판다. 다시 오르면 '그때 왜 팔았나' 후회하며 더 비싼 가격에 다시 산다. 이 세 번의 매매에서 시장은 거의 변하지 않았는데, 내 계좌는 조금씩 줄어있다. 조급함이 수수료로 나간 것이다.

단기 1주일 매매에서도 마찬가지다. 결핍 마인드의 조급증이 예민함과 집중력으로 연결될 것 같지만, 실제로는 신호를 왜곡해서 읽게 만든다. 공포에 질린 눈으로 보는 차트는 항상 더 나빠 보인다. 욕심으로 가득 찬 눈으로 보는 차트는 항상 더 좋아 보인다. 조급증은 판단력의 적이다.

반면 여유 있는 투자자는 기다린다. 진입 신호가 올 때까지. 손절 기준이 올 때까지. 익절 목표가 올 때까지. 그 기다림이 수수료를 절약하고, 수익을 지킨다.`,
    quote: "주식시장은 조급한 사람에게서 인내심 있는 사람에게로 돈을 이전시키는 장치다.",
    author: "피터 린치",
    kospi: "강세장에서 추격 매수하고 싶은 조급함이 든다면, 코스피가 이미 200주선 위 158%라는 사실을 떠올려라. 가장 비싼 수수료를 지불할 시점일 수 있다.",
  },
  {
    num: "제 3장",
    icon: "⚖️",
    title: "분할이란 겸손이다",
    subtitle: "한 번에 모든 것을 거는 자는 확신이 아니라 오만을 가진 것이다",
    category: "분할매수",
    color: "#1a5276",
    bg: "from-blue-50/80 to-indigo-50/60",
    border: "border-blue-300",
    narrative: `몰빵 매수는 용기처럼 보인다. 확신이 있어야 할 수 있는 것처럼 보인다. 하지만 오래된 투자자들은 말한다. 몰빵은 확신이 아니라 오만이라고.

시장은 아무도 모른다. 버핏도 모르고, 소로스도 모른다. 내일 주가가 오를지 내릴지, 그 누구도 확실히 알 수 없다. 그것을 아는 사람이 분할매수를 한다. '나는 틀릴 수 있다'는 겸손이 분할매수의 철학이다.

코스피가 지금 8,097이라면, 8,100에서 15%만 산다. 7,300으로 내려오면 20% 더 산다. 6,500에서 25%, 5,800에서 25%, 4,900 전후에서 마지막 15%를 산다. 처음 산 가격보다 훨씬 싸게 평균 매수가가 형성된다. 틀려도 살아남고, 맞으면 더 많이 번다.

분할은 결과적으로 복리다. 코스피가 한 번에 4,900까지 내려갈 수도 있고, 7,300까지만 내려갔다가 다시 오를 수도 있다. 어느 쪽이든 분할매수를 한 사람은 손해를 최소화하고 기회를 최대화한다.`,
    quote: "분산과 분할은 무지에 대한 가장 합리적인 대응이다.",
    author: "벤저민 그레이엄",
    kospi: "지금 당장 코스피 ETF를 전량 매수하고 싶다면, 분할매수 표를 다시 펼쳐라. 7,300 / 6,500 / 5,800 / 4,900. 이것이 겸손한 투자자의 지도다.",
  },
  {
    num: "제 4장",
    icon: "💰",
    title: "현금은 패배가 아니라 기회다",
    subtitle: "지키는 것도 투자다. 현금은 내일의 실탄이다",
    category: "현금 전략",
    color: "#7d6608",
    bg: "from-amber-50/80 to-yellow-50/60",
    border: "border-amber-300",
    narrative: `현금을 쥐고 있는 투자자는 종종 이런 말을 듣는다. "지금 안 샀다가 올라가면 어떡해?" 이 말의 무게가 현금 보유자를 불안하게 만든다. 기회를 놓친다는 두려움. 이것이 결핍 마인드의 전형적인 함정이다.

그러나 풍족한 투자자는 다르게 생각한다. 주식을 사지 않은 날은 쉰 날이 아니다. 내일의 더 좋은 기회를 위해 실탄을 아껴둔 날이다. 지금 50%의 현금이 있다는 것은, 코스피가 7,300으로 내려왔을 때 살 수 있다는 뜻이다.

역사는 이를 증명한다. 2020년 코로나 폭락 때 현금이 없었던 투자자는 그저 버티기만 했다. 현금이 있었던 투자자는 주가가 반토막 난 자리에서 적극적으로 샀다. 같은 시장을 경험했지만, 결과는 전혀 달랐다.

지금 코스피 200주선 이격이 +158%다. 이 말은 시장이 역사적으로 매우 과열되어 있다는 뜻이다. 이때 현금을 지키는 것은 두려움이 아니라 전략이다. 기회는 반드시 온다. 그때 쏠 실탄을 아껴두는 것이다.`,
    quote: "기회가 왔을 때 행동할 수 있으려면, 항상 현금을 준비해두어야 한다.",
    author: "워런 버핏",
    kospi: "현재 균형 포트폴리오 권고: 현금·MMF 40~50%, 미국 ETF 20~30%, 한국 ETF 소액 10~20%. 현금이 가장 큰 비중인 것은 두려움이 아니라 지혜다.",
  },
  {
    num: "제 5장",
    icon: "🌊",
    title: "이격도는 시장의 체온계다",
    subtitle: "너무 뜨거운 몸은 반드시 식는다. 중력을 이길 수는 없다",
    category: "평균회귀",
    color: "#4a235a",
    bg: "from-purple-50/80 to-violet-50/60",
    border: "border-purple-300",
    narrative: `사람의 체온이 39도가 넘으면 열이 있다고 한다. 39도가 영구적으로 지속될 수는 없다. 몸은 반드시 정상 체온으로 돌아간다. 시장도 마찬가지다.

200일 이동평균선은 시장의 정상 체온이다. 현재가가 그 평균선보다 얼마나 멀리 있는지를 이격도라 한다. 코스피의 200일선 이격이 +64%다. 200주선 이격은 +158%다. 역사적으로 이런 고이격 구간에서 매수한 투자자들은 예외 없이 큰 고통을 겪었다.

물론 예외는 있다. AI 반도체라는 새 산업이 과거의 평균을 바꿀 수도 있다. SK하이닉스의 HBM 독점이 지속될 수도 있다. 그러나 예외는 평균회귀를 늦추거나 약화시킬 뿐, 완전히 사라지게 하지는 못한다. 사과는 반드시 땅에 떨어진다. 다만 언제 떨어질지 모를 뿐이다.

평균회귀를 믿는 투자자는 두려움이 아니라 수학을 믿는 것이다. 역사가 5번 있었고, 5번 모두 평균으로 돌아왔다. 6번째도 예외일 수 없다는 냉철한 확률 판단이다.`,
    quote: "강세장은 비관 속에서 태어나고, 회의 속에서 자라며, 낙관 속에서 성숙하고, 도취 속에서 죽는다.",
    author: "존 템플턴",
    kospi: "지금 코스피는 '낙관'을 지나 '도취'에 가까운 구간일 수 있다. 체온계는 +158%를 가리키고 있다. 체온계를 무시하지 마라.",
  },
  {
    num: "제 6장",
    icon: "🔥",
    title: "작심삼일은 결핍에서 온다",
    subtitle: "해야 한다는 마음으로 시작한 계획은 3일을 넘기기 어렵다",
    category: "꾸준함",
    color: "#784212",
    bg: "from-orange-50/80 to-red-50/60",
    border: "border-orange-300",
    narrative: `새해가 되면 많은 사람이 결심을 한다. 매일 운동하겠다, 책을 읽겠다, 주식 공부를 하겠다. 그런데 대부분 3일을 넘기지 못한다. 왜일까.

이유는 하나다. '해야 한다'는 마음으로 시작했기 때문이다. 안 하면 뒤처진다, 못 하면 손해다. 이것이 결핍 마인드의 동기다. 결핍의 동기는 강렬하지만 짧다. 불안에서 나온 에너지는 금방 소진된다.

반면 '하고 싶다'는 마음으로 시작한 일은 다르다. 주식이 재미있어서, 경제를 이해하고 싶어서, 나의 돈을 내가 직접 관리하고 싶어서. 이 동기는 느리지만 오래 간다. 하루 쉬어도 죄책감이 없고, 틀려도 '다시 하면 되지'로 돌아온다.

투자도 마찬가지다. 불안에서 시작한 투자는 시장이 조금만 흔들려도 포기하게 된다. 호기심에서 시작한 투자는 폭락장도 공부의 기회로 본다. 꾸준함은 의지력이 아니라 마인드셋에서 나온다. 오늘 조금이라도 어제보다 나은 투자자가 되겠다는 기대감. 그것이 10년을 버티는 힘이다.`,
    quote: "매일 조금씩 어제보다 나은 사람이 되려고 노력하라. 하루하루가 쌓이면 결과는 무섭다.",
    author: "찰리 멍거",
    kospi: "매일 이격도를 확인하고, 분할매수 계획을 점검하는 것. 대단한 일이 아니다. 3분이면 충분하다. 그 3분을 매일 반복하는 것이 투자 실력이 된다.",
  },
  {
    num: "제 7장",
    icon: "🪞",
    title: "같은 시장, 다른 눈",
    subtitle: "마인드셋이 수익률을 만든다. 시장이 아니라 내가 결과를 만든다",
    category: "두 마인드",
    color: "#1c2833",
    bg: "from-slate-50/80 to-gray-50/60",
    border: "border-slate-300",
    narrative: `2020년 3월, 코스피는 1,400대까지 폭락했다. 같은 날, 같은 시장을 보면서 두 종류의 투자자가 있었다.

첫 번째 투자자는 패닉에 빠졌다. '다 잃겠다, 지금이라도 팔아야 한다.' 결핍 마인드로 없어질 70을 먼저 봤다. 그는 1,400대에 팔았다. 이후 코스피는 3,300까지 회복했다. 두 배가 넘는 기회를 눈앞에서 놓쳤다.

두 번째 투자자는 침착했다. '역사적 저점이다. 내 분할매수 계획을 실행할 때다.' 풍족 마인드로 있는 30을 먼저 봤다. 그는 1,400~1,600대에 나눠 샀다. 2년 후 두 배의 수익을 거뒀다.

같은 시장이었다. 같은 수치를 봤다. 같은 뉴스를 읽었다. 그러나 결과는 정반대였다. 차이는 마인드셋 하나였다. 결핍의 눈으로 본 시장은 위기였고, 풍족한 눈으로 본 시장은 기회였다.

지금 코스피 고이격 구간. 결핍 마인드는 '지금 안 사면 영영 못 산다'며 추격 매수를 부른다. 풍족 마인드는 '지금은 소액만, 조정이 오면 그때 더 크게 산다'며 계획을 지킨다.`,
    quote: "투자자의 가장 큰 적은 시장이 아니라 자기 자신이다.",
    author: "벤저민 그레이엄",
    kospi: "같은 코스피 8,097을 보면서 어떤 눈으로 보고 있는가. 두려움의 눈인가, 계획의 눈인가. 그 답이 5년 후 수익률을 결정한다.",
  },
  {
    num: "제 8장",
    icon: "✨",
    title: "꾸준함이 가장 강력한 복리다",
    subtitle: "대박 한 방보다 원칙 천 번이 더 강하다",
    category: "복리의 힘",
    color: "#0e6655",
    bg: "from-teal-50/80 to-cyan-50/60",
    border: "border-teal-300",
    narrative: `복리의 마법을 수학으로 보자. 매일 1%씩 나아지는 사람은 1년 후 어떻게 될까. 1.01의 365승. 답은 37.8배다. 반대로 매일 1%씩 나빠지는 사람은 1년 후 0.025배, 즉 97.5%를 잃는다. 방향의 차이가 결과의 하늘과 땅 차이를 만든다.

투자도 같다. 17년간 매월 S&P500 ETF를 꾸준히 매수한 투자자의 수익률은 +248%였다. 200일선이 이평선 아래로 내려올 때만 기다렸다가 사는 전략은 +241%였다. 큰 차이가 없어 보이지만, 핵심은 이것이다. 꾸준히 사는 사람은 심리적 고통이 적었고, 기회를 놓치는 두려움도 없었다.

대박을 좇는 투자자는 한 번의 큰 수익을 노리다가 한 번의 큰 손실로 모두 잃는다. 원칙을 지키는 투자자는 소소한 수익과 관리된 손실을 반복하며, 시간이 지날수록 복리로 쌓인다.

꾸준함은 화려하지 않다. 매달 자동이체처럼 적립하는 것은 드라마틱하지 않다. 하지만 30년 후 은퇴할 때, 그 꾸준함이 가장 큰 재산이 되어 있다.`,
    quote: "복리는 세계 8번째 불가사의다. 이해하는 자는 얻고, 이해 못 하는 자는 낸다.",
    author: "워런 버핏",
    kospi: "DCA 17년 +248%. 지금 당장 타이밍을 맞추려 하기보다, 매월 꾸준히 미국 ETF에 적립하는 것이 대부분의 투자자에게 가장 강력한 전략이다.",
  },
  {
    num: "제 9장",
    icon: "🛡️",
    title: "살아남는 자가 이긴다",
    subtitle: "완벽한 수익보다 생존 구조가 먼저다",
    category: "생존 전략",
    color: "#196f3d",
    bg: "from-green-50/80 to-emerald-50/60",
    border: "border-green-300",
    narrative: `투자에서 가장 중요한 목표는 수익을 극대화하는 것이 아니다. 살아남는 것이다. 단 한 번의 큰 손실이 수십 년의 수익을 지울 수 있기 때문이다.

-50% 손실을 회복하려면 +100% 수익이 필요하다. 1,000만원이 500만원이 되면, 다시 1,000만원이 되려면 두 배가 되어야 한다. 이것이 손실 회복의 비대칭성이다. 잃지 않는 것이 버는 것보다 더 중요한 이유다.

지금 코스피 고이격 구간에서 최선의 전략은 완벽한 타이밍을 찾는 것이 아니다. 틀려도 살아남을 구조를 만드는 것이다. 소액 참여로 기회를 열어두고, 충분한 현금으로 생존을 지키며, 분할매수로 평균 단가를 낮춘다. 어느 시나리오가 와도 살아남는 포트폴리오. 그것이 현명한 투자자의 진짜 목표다.

인버스도, 몰빵도, 전액 현금도 아닌. 소액 참여 + 현금 대기 + 분할매수. 이 세 가지가 서로 보완하며 어떤 폭풍에도 버티는 구조를 만든다.`,
    quote: "단 한 번의 큰 손실이 수십 년의 수익을 지울 수 있다. 먼저 살아남아라.",
    author: "나심 탈레브",
    kospi: "지금 포트폴리오의 질문은 '얼마나 벌까'가 아니라 '코스피가 4,900까지 내려가도 내 계획은 살아있는가'여야 한다.",
  },
  {
    num: "제 10장",
    icon: "🌟",
    title: "현명한 투자자의 하루",
    subtitle: "평범하게 위대한 하루. 원칙이 있는 사람의 일상",
    category: "결론",
    color: "#7d6608",
    bg: "from-yellow-50/80 to-amber-50/60",
    border: "border-yellow-400",
    narrative: `현명한 투자자의 하루는 드라마틱하지 않다.

아침에 일어나 KOSPI가 올랐는지 내렸는지 확인한다. 이격도를 본다. 200일선, 200주선. 내 분할매수 계획과 비교한다. 지금 사야 할 구간인가, 기다려야 할 구간인가. 3분이면 충분하다.

뉴스는 참고만 한다. 흥분하지 않는다. "AI가 반도체를 바꾼다"는 기사를 읽어도 흥분하지 않고, "경기침체가 온다"는 기사를 읽어도 공포에 떨지 않는다. 모든 뉴스는 이미 가격에 반영되어 있거나, 반영되지 않은 것은 아무도 모른다.

계획을 지킨다. 7,300이 오면 1차 분할매수. 6,500이 오면 2차. 그 전까지는 기다린다. 미국 ETF는 매월 꾸준히 적립한다. 현금은 충분히 유지한다.

그것이 전부다. 화려하지 않다. 하지만 그 평범한 하루하루가 쌓여 10년 후에는 가장 위대한 결과가 된다. 현명함이란 복잡한 것이 아니다. 단순한 원칙을 꾸준히 지키는 것. 그것이 현명한 투자자의 가장 평범하고 위대한 하루다.`,
    quote: "현명한 투자자는 비관론자에게서 사고 낙관론자에게 판다.",
    author: "벤저민 그레이엄",
    kospi: "오늘 당신의 투자 하루는 어떤가. 원칙이 있는 하루인가, 감정이 이끄는 하루인가. 그 차이가 10년을 만든다.",
  },
];

const categoryList = ["전체", ...Array.from(new Set(chapters.map(c => c.category)))];

export function WisdomInvest() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [readMode, setReadMode] = useState(false);

  const filtered = activeCategory === "전체" ? chapters : chapters.filter(c => c.category === activeCategory);

  return (
    <div className="space-y-8">

      {/* 헤더 — 서사적 스타일 */}
      <div className="text-center py-8 border-b-2 border-amber-200">
        <div className="text-3xl mb-3">✦</div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3"
          style={{ fontFamily: "'Noto Serif KR', Georgia, serif", color: "#7d6608" }}>
          현명투자 — 대가의 서사
        </h2>
        <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed italic"
          style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
          투자 대가들의 통찰과 마음의 철학을 한 권의 책처럼 엮었습니다.<br />
          풍족한 마음으로 시작해, 겸손한 손으로 분할하며, 인내로 마무리하는 이야기.
        </p>
        <div className="inline-flex items-center gap-3 mt-5">
          <span className="text-xs px-3 py-1.5 rounded-full border border-amber-300 text-amber-800 bg-amber-50 font-bold">
            총 10장 · 버핏·멍거·그레이엄·린치 외
          </span>
          <button
            onClick={() => setReadMode(!readMode)}
            className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${readMode ? "bg-amber-700 text-white border-amber-700" : "border-amber-300 text-amber-800 bg-amber-50"}`}>
            {readMode ? "📖 독서 모드 ON" : "📖 독서 모드"}
          </button>
        </div>
      </div>

      {/* 핵심 한 문장 */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
        <div className="absolute top-4 right-4 text-4xl opacity-20">✦</div>
        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">— 핵심 한 문장 —</div>
        <p className="text-white text-xl md:text-2xl font-black leading-relaxed"
          style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
          "풍족한 마음으로 시장을 바라보고,<br />
          <span className="text-amber-400">겸손한 손으로 분할하며,</span><br />
          인내하는 자가 결국 이긴다."
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["몰빵 금지", "인버스 금지", "조급증 금지", "분할매수", "현금 유지", "꾸준히"].map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">{tag}</span>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      {!readMode && (
        <div className="flex flex-wrap gap-2">
          {categoryList.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                ${activeCategory === cat ? "bg-amber-700 text-white border-amber-700" : "bg-white/70 text-muted-foreground border-border hover:border-amber-300"}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 독서 모드 — 전체 텍스트 스크롤 */}
      {readMode ? (
        <div className="space-y-12 max-w-2xl mx-auto">
          {chapters.map((ch, idx) => (
            <motion.div key={ch.num}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`pl-6 border-l-4`}
              style={{ borderColor: ch.color }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: ch.color }}>{ch.num} — {ch.category}</div>
              <div className="text-xl font-black mb-1" style={{ color: ch.color, fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                {ch.icon} {ch.title}
              </div>
              <div className="text-sm italic text-muted-foreground mb-4">{ch.subtitle}</div>
              <p className="text-base leading-8 text-foreground/85 whitespace-pre-line"
                style={{ fontFamily: "'Noto Serif KR', Georgia, serif", fontSize: "1.05rem" }}>
                {ch.narrative}
              </p>
              <div className="mt-5 p-4 rounded-xl" style={{ background: `${ch.color}12`, border: `1px solid ${ch.color}30` }}>
                <p className="text-base italic font-bold leading-relaxed" style={{ color: ch.color, fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                  "{ch.quote}"
                </p>
                <div className="text-sm text-muted-foreground mt-1 font-bold">— {ch.author}</div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                <strong>지금 KOSPI 적용:</strong> {ch.kospi}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* 카드 모드 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((ch, i) => (
              <motion.div key={ch.num}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={`rounded-2xl border-2 bg-gradient-to-br ${ch.bg} ${ch.border} cursor-pointer transition-shadow hover:shadow-md`}
                onClick={() => setExpanded(expanded === i ? null : i)}>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: ch.color }}>{ch.num} · {ch.category}</div>
                      <span className="text-2xl">{ch.icon}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-1">{expanded === i ? "▲" : "▼"}</span>
                  </div>

                  <h3 className="text-lg font-black tracking-tight mb-1" style={{ color: ch.color, fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                    {ch.title}
                  </h3>
                  <p className="text-xs italic text-muted-foreground mb-3">{ch.subtitle}</p>

                  <p className="text-sm leading-relaxed text-foreground/80"
                    style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                    {expanded === i
                      ? ch.narrative
                      : ch.narrative.split("\n")[0].slice(0, 80) + "…"}
                  </p>

                  <AnimatePresence>
                    {expanded === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden mt-4 space-y-3">
                        <div className="p-4 rounded-xl" style={{ background: `${ch.color}12`, border: `1px solid ${ch.color}30` }}>
                          <p className="text-base italic font-bold leading-relaxed" style={{ color: ch.color, fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                            "{ch.quote}"
                          </p>
                          <div className="text-xs text-muted-foreground mt-1 font-bold">— {ch.author}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                          <strong>지금 KOSPI 적용:</strong> {ch.kospi}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 현명투자 10계명 */}
      <div className="rounded-2xl overflow-hidden border-2 border-amber-300">
        <div className="px-6 py-4 bg-amber-700">
          <div className="text-white font-black text-lg" style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
            📜 현명투자 10계명
          </div>
          <div className="text-amber-200 text-xs mt-0.5">대가들의 통찰을 열 줄로 압축한 투자의 법칙</div>
        </div>
        <div className="p-6 bg-gradient-to-b from-amber-50 to-yellow-50">
          <ol className="space-y-3">
            {[
              { n: 1,  text: "풍족한 마음이 먼저다 — 마음이 흔들리면 주가도 흔들려 보인다" },
              { n: 2,  text: "조급증은 가장 비싼 수수료 — 서두름이 손실을 만든다" },
              { n: 3,  text: "분할은 겸손이다 — 한 번에 모든 것을 걸지 마라" },
              { n: 4,  text: "현금은 기회다 — 지키는 것도 훌륭한 전략이다" },
              { n: 5,  text: "이격도를 확인하라 — 시장의 체온계를 무시하지 마라" },
              { n: 6,  text: "작심삼일은 결핍에서 온다 — 하고 싶어야 지속된다" },
              { n: 7,  text: "같은 시장, 다른 눈 — 마인드셋이 수익률을 만든다" },
              { n: 8,  text: "꾸준함이 복리다 — 대박 한 번보다 원칙 천 번이 강하다" },
              { n: 9,  text: "살아남는 자가 이긴다 — 생존 구조를 먼저 만들어라" },
              { n: 10, text: "현명한 투자자는 평범하게 위대하다 — 원칙 있는 하루하루" },
            ].map(item => (
              <li key={item.n} className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center">
                  {item.n}
                </span>
                <span className="text-sm leading-relaxed text-foreground/80 pt-0.5"
                  style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                  {item.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

    </div>
  );
}
