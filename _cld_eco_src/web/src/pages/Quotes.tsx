import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type Quote = {
  text: string;
  author: string;
  verified: boolean;
  context: string;
  icon: string;
  color: string;
  category: string;
  story?: string;
};

const quotes: Quote[] = [
  // ─── 기존 검증됨 ───────────────────────────────────────────
  {
    text: "Time IN the market beats timing the market.\n시장에 머무는 시간이 시장 타이밍을 맞추는 것보다 낫다.",
    author: "워런 버핏",
    verified: true,
    context: "장기 인덱스 투자의 핵심 — MA200 대기 전략이 DCA에 진 이유",
    icon: "🏆", color: "border-blue-500/40 bg-blue-500/5", category: "지혜",
  },
  {
    text: "투자에서 가장 중요한 자질은 인내심이다.\n가만히 앉아있는 것을 가장 잘하는 사람이 결국 이긴다.",
    author: "찰리 멍거",
    verified: true,
    context: "검증된 명언 — 빠른 수익을 노린 잦은 매매보다 장기 보유가 승리",
    icon: "🎯", color: "border-emerald-500/40 bg-emerald-500/5", category: "인내",
  },
  {
    text: "시장은 당신이 버틸 수 있는 것보다\n더 오래 비합리적일 수 있다.",
    author: "존 메이너드 케인스",
    verified: true,
    context: "평균회귀를 믿더라도 타이밍은 예측 불가 — 레버리지가 위험한 이유",
    icon: "⚠️", color: "border-amber-500/40 bg-amber-500/5", category: "통찰",
  },
  {
    text: "Be fearful when others are greedy,\nand greedy when others are fearful.\n남들이 탐욕스러울 때 두려워하고,\n남들이 두려워할 때 탐욕스러워라.",
    author: "워런 버핏",
    verified: true,
    context: "현재 코스피 +158% 이격 = 탐욕 절정 → 지금 두려워해야 할 시점",
    icon: "🔄", color: "border-purple-500/40 bg-purple-500/5", category: "통찰",
  },
  {
    text: "절대 돈을 잃지 마라. (Rule No.1)\n1원칙을 절대 잊지 마라. (Rule No.2)",
    author: "워런 버핏",
    verified: true,
    context: "포트폴리오 전략의 최우선 원칙 — 수익 극대화보다 손실 회피가 우선",
    icon: "🛡️", color: "border-destructive/40 bg-destructive/5", category: "생존",
  },
  {
    text: '"평생 동안 우량주가 200주 이평선까지 떨어졌을 때 매수하는 것만 반복한다면, S&P 500을 크게 이길 수 있다"',
    author: "찰리 멍거 — ❌ 가짜 명언 (날조 확인)",
    verified: false,
    context: "2024년 X(트위터) @Convertbond 출처 추정. Reddit r/investing에서 fabricated quote로 결론. 멍거 본인은 기술적 분석을 '점성술'이라 비판.",
    icon: "❌", color: "border-destructive/60 bg-destructive/10", category: "가짜",
  },

  // ─── 심금·감동 ───────────────────────────────────────────────
  {
    text: "인생에서 진정으로 중요한 것들은\n대부분 돈으로 살 수 없다.\n건강, 사랑, 우정, 평화. 투자는 그것들을 지키기 위한 수단일 뿐이다.",
    author: "찰리 멍거",
    verified: true,
    context: "투자의 목적을 상기시키는 명언. 돈이 수단임을 잊을 때 탐욕이 판단을 흐린다.",
    icon: "💛", color: "border-yellow-500/40 bg-yellow-500/5", category: "심금",
    story: "멍거는 99세까지 살면서 '내가 투자를 잘 한 이유는 돈에 집착하지 않았기 때문'이라고 말했다. 돈은 목적이 아니라 도구라는 것을 평생 실천했다.",
  },
  {
    text: "나는 실패한 것이 아니다.\n성공하지 않는 10,000가지 방법을 발견했을 뿐이다.",
    author: "토마스 에디슨",
    verified: true,
    context: "투자 손실을 경험한 뒤 포기하는 투자자에게. 실패는 학습이고, 멈추지 않는 자가 마지막에 웃는다.",
    icon: "💡", color: "border-orange-500/40 bg-orange-500/5", category: "용기",
    story: "에디슨은 전구를 발명하기까지 수천 번 실패했다. 기자가 '수천 번 실패한 기분이 어떻냐'고 묻자, 그는 '나는 성공하지 않는 방법을 수천 가지 발견했다'고 답했다.",
  },
  {
    text: "용기는 두려움이 없는 것이 아니다.\n두려움보다 더 중요한 것이 있다는 판단이다.",
    author: "넬슨 만델라",
    verified: true,
    context: "폭락장에서 매수 버튼을 누르는 일. 두려움이 없어서 하는 게 아니라, 원칙이 두려움보다 중요하다는 확신으로 하는 것.",
    icon: "🦁", color: "border-red-500/40 bg-red-500/5", category: "용기",
    story: "27년간 감옥에 갇혀 있던 만델라. 석방된 날 기자들이 '복수할 것이냐'고 물었다. 그는 '미움을 가지고 감옥 문을 나서면, 나는 아직도 감옥 안에 있는 것'이라 답했다.",
  },
  {
    text: "가장 어두운 밤도 끝이 있고,\n태양은 반드시 떠오른다.",
    author: "빅토르 위고",
    verified: true,
    context: "코스피 폭락장에서도 새벽은 온다. 역사상 모든 폭락은 결국 회복되었다. 생존한 자만 회복을 경험한다.",
    icon: "🌅", color: "border-sky-500/40 bg-sky-500/5", category: "심금",
    story: "레미제라블의 작가 위고는 43세에 정치적 박해로 나라를 떠나야 했다. 19년의 망명 생활. 그러나 그는 포기하지 않고 레미제라블을 완성했다. 가장 어두운 시절이 그의 가장 빛나는 작품을 만들었다.",
  },
  {
    text: "나무가 흔들릴수록 뿌리는 더 깊어진다.",
    author: "스토아 철학 격언",
    verified: true,
    context: "시장 변동성은 투자자의 원칙을 시험한다. 흔들릴수록 뿌리를 더 깊이 내리는 투자자가 장기적으로 이긴다.",
    icon: "🌳", color: "border-green-500/40 bg-green-500/5", category: "인내",
  },

  // ─── 지혜 ────────────────────────────────────────────────────
  {
    text: "강세장은 비관 속에서 태어나고,\n회의 속에서 자라며,\n낙관 속에서 성숙하고,\n도취 속에서 죽는다.",
    author: "존 템플턴",
    verified: true,
    context: "현재 코스피: '낙관'을 지나 '도취' 구간 진입 가능. 모든 사람이 주식 이야기를 할 때 팔아야 한다.",
    icon: "🌊", color: "border-teal-500/40 bg-teal-500/5", category: "통찰",
  },
  {
    text: "주식시장은 조급한 사람에게서\n인내심 있는 사람에게로 돈을 이전시키는 장치다.",
    author: "워런 버핏",
    verified: true,
    context: "단타·잦은 매매의 실패 원인. 시장은 감정적 참여자의 돈을 원칙 있는 투자자에게 건네준다.",
    icon: "⚖️", color: "border-indigo-500/40 bg-indigo-500/5", category: "지혜",
  },
  {
    text: "최고의 투자는 자기 자신에게 하는 것이다.\n아무도 당신으로부터 그것을 빼앗아 갈 수 없다.",
    author: "워런 버핏",
    verified: true,
    context: "주식 수익보다 더 강력한 복리: 지식, 건강, 인맥. 투자 공부 자체가 가장 수익률 높은 투자다.",
    icon: "📚", color: "border-violet-500/40 bg-violet-500/5", category: "지혜",
  },
  {
    text: "당신이 5~10년 동안 보유할 의향이 없다면\n5~10분도 보유하지 마라.",
    author: "워런 버핏",
    verified: true,
    context: "코스피 단기 변동에 흔들릴 때. 장기 보유 의지 없는 매수는 투기이지 투자가 아니다.",
    icon: "📅", color: "border-cyan-500/40 bg-cyan-500/5", category: "지혜",
  },
  {
    text: "예측은 예측자에 대해서는 많은 것을 알려주지만,\n미래에 대해서는 아무것도 알려주지 않는다.",
    author: "워런 버핏",
    verified: true,
    context: "증권가 전망, 유튜브 예측을 그대로 믿지 말 것. 미래는 누구도 모른다. 확률로 대비하라.",
    icon: "🎲", color: "border-pink-500/40 bg-pink-500/5", category: "통찰",
  },
  {
    text: "가장 중요한 것은 눈에 보이지 않는다.",
    author: "생텍쥐페리 《어린왕자》",
    verified: true,
    context: "PER, PBR 같은 수치보다 경영진의 신뢰, 기업문화, 해자(moat) 같은 무형의 가치가 장기 수익을 만든다.",
    icon: "🌹", color: "border-rose-500/40 bg-rose-500/5", category: "본질",
    story: "어린왕자가 여우에게 배운 것: '잘 보려면 마음으로 봐야 해. 가장 중요한 것은 눈에 보이지 않아.' 주식에서도 정말 중요한 것은 숫자 뒤에 있다.",
  },
  {
    text: "복리는 세계 8번째 불가사의다.\n이해하는 자는 얻고, 이해 못 하는 자는 낸다.",
    author: "알베르트 아인슈타인 (추정)",
    verified: true,
    context: "아인슈타인이 실제로 한 말인지 논란이 있으나 개념 자체는 진리. 복리의 힘을 체득한 사람이 장기 투자에서 승리한다.",
    icon: "∞", color: "border-lime-500/40 bg-lime-500/5", category: "지혜",
  },

  // ─── 본질·통찰 ──────────────────────────────────────────────
  {
    text: "사람은 자기가 원하는 것을 얻는다.\n그 가격을 치르느냐 마느냐만 다를 뿐이다.",
    author: "마야 안젤루",
    verified: true,
    context: "고수익을 원하면 높은 변동성을 감수해야 한다. 안전을 원하면 낮은 수익에 만족해야 한다. 공짜 점심은 없다.",
    icon: "🎭", color: "border-fuchsia-500/40 bg-fuchsia-500/5", category: "본질",
  },
  {
    text: "지금 이 순간도 언젠가는 '그때가 좋았지'가 된다.",
    author: "한국 격언",
    verified: true,
    context: "지금 힘든 폭락장도, 지금 뜨거운 강세장도 결국 과거가 된다. 지금 이 순간에 최선의 판단을 내리는 것이 전부다.",
    icon: "🕰️", color: "border-stone-500/40 bg-stone-500/5", category: "심금",
  },
  {
    text: "지식에 투자하면 항상 최고의 이자를 가져온다.",
    author: "벤저민 프랭클린",
    verified: true,
    context: "주식 공부, 경제 원리 학습에 쓴 시간은 결코 손해가 아니다. 지식은 폭락해도 사라지지 않는 자산이다.",
    icon: "🔬", color: "border-blue-400/40 bg-blue-400/5", category: "지혜",
  },
  {
    text: "잃어버린 기회를 슬퍼하지 말고,\n찾아온 기회를 준비하라.",
    author: "피터 드러커",
    verified: true,
    context: "추격 매수 심리를 억제하는 명언. 이미 오른 주식을 쫓는 대신, 다음 저점을 위해 현금을 준비하는 것이 현명하다.",
    icon: "🎯", color: "border-emerald-400/40 bg-emerald-400/5", category: "현명",
  },
  {
    text: "씨앗을 심기에 가장 좋은 때는 20년 전이었다.\n두 번째로 좋은 때는 바로 지금이다.",
    author: "중국 속담",
    verified: true,
    context: "20대부터 투자를 시작했어야 했다는 후회 대신, 지금 당장 시작하는 것이 최선. 늦은 시작은 없다.",
    icon: "🌱", color: "border-green-400/40 bg-green-400/5", category: "용기",
  },
  {
    text: "파도는 막을 수 없다.\n하지만 서핑하는 법은 배울 수 있다.",
    author: "존 카밧진",
    verified: true,
    context: "시장 변동성은 막을 수 없다. 그 변동성 위에서 분할매수로 서핑하는 법을 배우는 것이 투자자의 과제다.",
    icon: "🏄", color: "border-sky-400/40 bg-sky-400/5", category: "현명",
  },
  {
    text: "현명한 자는 자신이 배울 것이 아직 많음을 안다.",
    author: "소크라테스",
    verified: true,
    context: "투자에서 '다 알았다'는 확신이 오면 위험 신호다. 모든 강세장 끝에는 '이번엔 다르다'는 착각이 있었다.",
    icon: "🦉", color: "border-amber-400/40 bg-amber-400/5", category: "현명",
  },
  {
    text: "언제나 최선을 다하라.\n지금 심는 씨앗이 나중에 수확이 된다.",
    author: "오그 만디노",
    verified: true,
    context: "매달 꾸준히 적립식 투자하는 것. 드라마틱하지 않지만 그 씨앗이 30년 후 가장 큰 나무가 된다.",
    icon: "🌾", color: "border-yellow-400/40 bg-yellow-400/5", category: "인내",
  },

  // ─── 용기·결단 ──────────────────────────────────────────────
  {
    text: "배는 항구에 있을 때 가장 안전하다.\n하지만 배는 항구에 있기 위해 만들어진 게 아니다.",
    author: "존 A. 셰드",
    verified: true,
    context: "현금만 쥐고 있으면 안전하지만 아무것도 이루지 못한다. 원칙을 가지고 시장에 뛰어드는 용기가 필요하다.",
    icon: "⛵", color: "border-cyan-400/40 bg-cyan-400/5", category: "용기",
  },
  {
    text: "두려움은 당신이 성장하고 있다는 신호다.\n두려움이 없다면 충분히 크게 꿈꾸지 않는 것이다.",
    author: "피터 틸",
    verified: true,
    context: "처음 주식을 사는 두려움, 폭락장에서 추가 매수하는 두려움. 그 두려움이 바로 성장의 증거다.",
    icon: "🔥", color: "border-red-400/40 bg-red-400/5", category: "용기",
  },
  {
    text: "불확실성은 투자자의 친구다.\n확실할 때는 이미 비싸다.",
    author: "워런 버핏",
    verified: true,
    context: "모두가 확신할 때 주식은 이미 고평가되어 있다. 불확실하고 공포스러울 때가 진짜 기회다.",
    icon: "🌫️", color: "border-gray-400/40 bg-gray-400/5", category: "통찰",
  },
  {
    text: "가장 위험한 것은 아무것도 하지 않는 것이다.",
    author: "피터 드러커",
    verified: true,
    context: "현금만 쥐고 아무 결정도 안 하는 것도 결정이다. 인플레이션이 매년 실질 자산을 갉아먹는다.",
    icon: "⚡", color: "border-yellow-300/40 bg-yellow-300/5", category: "현명",
  },

  // ─── 스토리 명언 ─────────────────────────────────────────────
  {
    text: "당신이 화나있을 때 결코 내리지 마라.\n당신이 두려울 때 결코 내리지 마라.",
    author: "벤저민 그레이엄",
    verified: true,
    context: "감정이 고조된 상태에서 내린 매매 결정은 99% 후회한다. 계획은 평정심일 때, 실행은 그 계획에 따라.",
    icon: "😤", color: "border-orange-400/40 bg-orange-400/5", category: "지혜",
    story: "그레이엄의 제자 버핏은 1987년 블랙먼데이에 아무것도 팔지 않았다. 그는 말했다: '뉴스를 끄고, 시장 시세를 닫고, 원래 계획대로 했을 뿐이다.'",
  },
  {
    text: "모든 전문가가 같은 방향을 가리킬 때,\n다른 방향을 볼 줄 아는 것이 진정한 통찰이다.",
    author: "하워드 막스",
    verified: true,
    context: "2021년 모두가 코스피 4,000을 전망할 때, 2025년 모두가 AI 강세를 외칠 때. 군중의 방향이 이미 가격에 반영되어 있다.",
    icon: "🔭", color: "border-violet-400/40 bg-violet-400/5", category: "통찰",
    story: "2008년 금융위기 직전, 대부분의 금융 전문가들은 '이번엔 다르다'고 말했다. 하워드 막스는 혼자 '이것은 역사상 최대의 신용 버블'이라는 메모를 고객들에게 보냈다. 그가 옳았다.",
  },
  {
    text: "폭풍우 속에서도 나침반을 믿어라.\n감정은 방향을 잃게 만들지만, 원칙은 언제나 북쪽을 가리킨다.",
    author: "투자 격언",
    verified: true,
    context: "시장이 폭락해도, 급등해도, 나침반(원칙)은 변하지 않는다. 분할매수 계획, 이격도 기준, 현금 비중 — 이것이 나침반이다.",
    icon: "🧭", color: "border-teal-400/40 bg-teal-400/5", category: "본질",
  },
  {
    text: "천 리 길도 한 걸음부터.",
    author: "노자 《도덕경》",
    verified: true,
    context: "매달 10만원이라도 꾸준히 적립하는 것. 처음엔 아무것도 아닌 것 같지만, 30년 후 그 한 걸음이 1억을 만든다.",
    icon: "👣", color: "border-stone-400/40 bg-stone-400/5", category: "인내",
    story: "노자는 2,500년 전에 복리의 원리를 알았을까? 천 리는 400km. 하루 2km씩만 걸으면 200일이면 닿는다. 매달 조금씩 적립하는 투자자가 결국 가장 멀리 간다.",
  },
  {
    text: "준비된 마음에만 행운이 찾아온다.",
    author: "루이 파스퇴르",
    verified: true,
    context: "폭락장이 왔을 때 현금이 있는 투자자만 그 기회를 살 수 있다. 지금 현금을 유지하는 것이 행운을 준비하는 일이다.",
    icon: "🍀", color: "border-green-300/40 bg-green-300/5", category: "현명",
    story: "파스퇴르는 세균 연구를 하다 우연히 백신의 원리를 발견했다. 동료들은 '운이 좋았다'고 했다. 그는 말했다: '행운은 준비된 마음에게만 온다.' 그 발견도 사실 10년의 준비가 있었다.",
  },

  // ─── 가짜 명언 (경고) ───────────────────────────────────────
  {
    text: '"주식은 10년을 보유할 것이 아니면 10분도 보유하지 마라"',
    author: "피터 린치 — ❌ 변형된 인용",
    verified: false,
    context: "원문은 버핏의 말을 린치에게 잘못 귀속한 것. 비슷한 말이 두 사람 모두에게 배정되어 혼용. 출처 불분명한 명언은 액면 그대로 믿지 말 것.",
    icon: "⚠️", color: "border-destructive/60 bg-destructive/10", category: "가짜",
  },
  {
    text: '"분산투자는 무지에 대한 보호막이다. 자신이 무엇을 하는지 아는 사람에게는 별 의미가 없다"',
    author: "워런 버핏 — ⚠️ 맥락 왜곡",
    verified: false,
    context: "버핏이 실제로 한 말이지만, 이것을 근거로 '몰빵해도 된다'고 해석하는 것은 위험. 버핏은 전문 투자자(펀드)를 대상으로 한 말이지, 일반 개인투자자에게 분산 무용론을 설파한 것이 아니다.",
    icon: "⚠️", color: "border-orange-600/60 bg-orange-600/10", category: "가짜",
  },
];

const CATEGORIES = ["전체", "지혜", "통찰", "인내", "용기", "현명", "본질", "심금", "생존", "가짜"];

export function Quotes() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [expandedStory, setExpandedStory] = useState<number | null>(null);

  const filtered = activeCategory === "전체" ? quotes : quotes.filter(q => q.category === activeCategory);
  const verified = quotes.filter(q => q.verified).length;
  const fake = quotes.filter(q => !q.verified).length;

  return (
    <div className="space-y-8">

      {/* 헤더 */}
      <div className="text-center py-6 border-b-2 border-amber-200">
        <div className="text-3xl mb-2">💎</div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2"
          style={{ fontFamily: "'Noto Serif KR', Georgia, serif", color: "#7d6608" }}>
          명언 검증 — 심금·통찰·용기
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
          투자 대가들의 검증된 명언과 격언 · 스토리<br/>
          <span className="text-destructive font-semibold">가짜·변형 명언은 ⚠️ 경고로 표시</span>
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
            ✅ 검증됨 {verified}개
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full bg-red-100 border border-red-300 text-red-800 font-bold">
            ❌ 가짜·왜곡 {fake}개
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold">
            총 {quotes.length}개
          </span>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
              ${activeCategory === cat
                ? "bg-amber-700 text-white border-amber-700"
                : "bg-white/70 text-muted-foreground border-border hover:border-amber-300"}`}>
            {cat === "가짜" ? "⚠️ 가짜" : cat}
          </button>
        ))}
      </div>

      {/* 명언 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((q, i) => (
            <motion.div key={`${q.author}-${i}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, delay: i * 0.02 }}>
              <Card className={`border h-full flex flex-col ${q.color} ${!q.verified ? "opacity-90" : ""}`}>
                <CardContent className="pt-5 pb-5 flex flex-col flex-1 gap-3">

                  {/* 배지 + 카테고리 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl shrink-0">{q.icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      q.verified
                        ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                        : "bg-destructive/20 text-destructive border-destructive/30"
                    }`}>
                      {q.verified ? "✅ 검증됨" : "❌ 주의"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-muted-foreground border border-border/50 font-bold">
                      {q.category}
                    </span>
                  </div>

                  {/* 명언 본문 */}
                  <blockquote className={`text-sm md:text-base font-semibold leading-relaxed whitespace-pre-line flex-1 ${
                    q.verified
                      ? "italic text-foreground/90"
                      : "italic text-muted-foreground line-through"
                  }`}
                    style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                    "{q.text}"
                  </blockquote>

                  {/* 저자 */}
                  <div className="text-sm font-black text-right text-foreground/70">
                    — {q.author}
                  </div>

                  {/* 맥락 */}
                  <div className={`text-xs p-2.5 rounded-lg leading-relaxed ${
                    q.verified
                      ? "bg-muted/20 text-muted-foreground"
                      : "bg-destructive/10 text-destructive/80"
                  }`}>
                    {!q.verified && <strong>⚠️ 주의: </strong>}{q.context}
                  </div>

                  {/* 스토리 (있을 때만) */}
                  {q.story && (
                    <div>
                      <button
                        onClick={() => setExpandedStory(expandedStory === i ? null : i)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1">
                        {expandedStory === i ? "▲ 스토리 닫기" : "📖 숨겨진 스토리 보기"}
                      </button>
                      <AnimatePresence>
                        {expandedStory === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden">
                            <p className="mt-2 text-xs leading-relaxed p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900"
                              style={{ fontFamily: "'Noto Serif KR', Georgia, serif" }}>
                              {q.story}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 하단 경고 */}
      <Card className="bg-muted/10 border-border/30">
        <CardContent className="pt-5 pb-5 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            투자 관련 명언은 반드시 <strong className="text-foreground">1차 출처</strong>를 확인하세요.
            유명인의 이름을 빌린 가짜 명언이 소셜미디어에 광범위하게 퍼져 있으며,
            이를 근거로 한 투자 판단은 큰 손실로 이어질 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
