import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMacroMonitor } from "@/hooks/useMacroMonitor";
import { tabUrl } from "@/lib/tabs";

/**
 * 인사이트 통찰 — 시장을 움직이는 관계 12가지
 * 금리·채권·주식·달러·금·원유·경기 사이클의 관계와 투자 심리를 정리한 자체 학습 콘텐츠입니다.
 */

type Rel = { up: string; then: string; note?: string };

interface Section {
  id: string;
  icon: string;
  title: string;
  lead: string;
  body: string[];
  rels?: Rel[];
  example?: string;
  tip: string;
}

const SECTIONS: Section[] = [
  {
    id: "rate-stock",
    icon: "🏦",
    title: "금리와 주식 — 돈의 가격이 주가의 중력이다",
    lead: "금리는 ‘돈의 가격’입니다. 돈이 비싸지면 주식의 매력은 떨어지고, 돈이 싸지면 주식으로 돈이 흘러갑니다.",
    body: [
      "주식의 가치는 미래에 벌어들일 이익을 지금 가치로 바꾼(할인한) 값입니다. 이때 쓰는 할인율의 바탕이 금리입니다. 금리가 오르면 같은 미래 이익도 지금 가치가 작아지고, 금리가 내리면 커집니다.",
      "또 금리가 높으면 예금·채권만으로도 안전하게 이자를 받을 수 있어 굳이 위험한 주식을 살 이유가 줄어듭니다. 기업 입장에서는 대출 이자 부담이 늘어 이익이 줄어듭니다.",
      "다만 ‘금리 인상 = 무조건 주가 하락’은 아닙니다. 경기가 좋아서 금리가 오르는 초반에는 이익 증가가 금리 부담보다 커 주가가 함께 오르기도 합니다. 문제는 금리가 ‘너무 빨리, 너무 높이’ 오를 때입니다.",
    ],
    rels: [
      { up: "금리 ↑ (빠르게)", then: "주가 ↓", note: "할인율 상승·대출 부담·예금 매력 증가" },
      { up: "금리 ↓", then: "주가 ↑", note: "단, 경기 침체 때문에 내리는 금리는 주가에 악재일 수 있음" },
    ],
    example: "2022년 미국 연준이 1년 만에 기준금리를 0%대에서 4%대로 올리자, 나스닥 100은 그해 30% 넘게 하락했습니다.",
    tip: "금리의 ‘수준’보다 ‘속도’와 ‘방향 전환’을 보세요. 인상 사이클이 끝나는 시점이 주식시장의 중요한 전환점이 되곤 합니다.",
  },
  {
    id: "rate-bond",
    icon: "📜",
    title: "금리와 채권 — 시소처럼 반대로 움직인다",
    lead: "채권 가격과 금리(수익률)는 정확히 반대로 움직입니다. 이것은 경향이 아니라 계산 원리입니다.",
    body: [
      "연 3% 이자를 주는 채권을 갖고 있는데 시장 금리가 5%로 오르면, 누구도 3%짜리 채권을 원래 값에 사려 하지 않습니다. 그래서 그 채권 가격이 떨어져야 새로 사는 사람의 수익률이 5%에 맞춰집니다.",
      "만기가 길수록(‘듀레이션’이 길수록) 금리 변화에 가격이 더 크게 흔들립니다. 대략 듀레이션이 10년인 채권은 금리가 1%p 오르면 가격이 약 10% 떨어집니다.",
      "장기 금리와 단기 금리의 차이(장단기 금리차)도 중요합니다. 보통은 장기 금리가 더 높지만, 단기 금리가 장기 금리보다 높아지는 ‘역전’은 과거 미국 경기 침체 앞에 자주 나타났습니다.",
    ],
    rels: [
      { up: "금리 ↑", then: "채권 가격 ↓", note: "만기 길수록 더 크게" },
      { up: "금리 ↓", then: "채권 가격 ↑", note: "금리 인하기에 장기채 수익 큼" },
    ],
    example: "미국 20년 이상 장기 국채 ETF(TLT)는 금리가 급등한 2022년 한 해 약 30% 하락했습니다. ‘안전 자산’도 금리 위험은 피할 수 없습니다.",
    tip: "금리가 정점 근처라고 판단될 때 장기채, 아직 오를 것 같으면 단기채나 예금이 상대적으로 안전합니다.",
  },
  {
    id: "bond-stock",
    icon: "⚖️",
    title: "채권과 주식 — 서로를 지켜 주는 짝, 하지만 늘 그런 건 아니다",
    lead: "경기 걱정이 클 때 주식은 떨어지고 채권은 오르는 경우가 많아, 둘을 섞으면 계좌의 흔들림이 줄어듭니다.",
    body: [
      "경기 침체가 오면 기업 이익이 줄어 주가가 떨어지고, 중앙은행은 금리를 내려 경기를 살리려 합니다. 금리가 내려가면 채권 가격은 오릅니다. 그래서 2000년대 이후 오랫동안 주식과 채권은 반대 방향으로 움직이는 일이 많았습니다.",
      "하지만 ‘물가’가 문제일 때는 다릅니다. 인플레이션 때문에 금리가 오르면 채권도 떨어지고 주식도 떨어집니다. 1970년대와 2022년이 그랬습니다.",
      "그래서 주식·채권 6:4 같은 전통적인 배분은 ‘경기 충격’에는 강하지만 ‘물가 충격’에는 약합니다. 현금·금·물가연동채 등을 일부 섞는 이유입니다.",
    ],
    rels: [
      { up: "경기 침체 공포", then: "주식 ↓ · 채권 ↑", note: "분산 효과 작동" },
      { up: "인플레이션 공포", then: "주식 ↓ · 채권 ↓", note: "분산 효과 약해짐" },
    ],
    tip: "내 포트폴리오가 ‘경기 침체’와 ‘물가 급등’ 두 가지 상황에서 각각 어떻게 될지 한 번씩 상상해 보세요.",
  },
  {
    id: "growth-rate",
    icon: "🚀",
    title: "성장주와 금리 — 먼 미래의 이익일수록 금리에 민감하다",
    lead: "성장주는 ‘지금’보다 ‘10년 뒤’에 돈을 많이 버는 회사입니다. 먼 미래의 돈일수록 금리 변화에 가치가 크게 흔들립니다.",
    body: [
      "100원을 1년 뒤에 받는 것과 10년 뒤에 받는 것을 생각해 보세요. 금리가 오르면 10년 뒤 100원의 지금 가치가 훨씬 더 많이 줄어듭니다. 성장주는 이익의 대부분이 먼 미래에 있어 ‘듀레이션이 긴 자산’, 즉 장기 채권과 비슷하게 금리에 민감합니다.",
      "그래서 금리가 내려가는 시기에는 기술주·바이오·신생 성장주가 크게 오르고, 금리가 빠르게 오르는 시기에는 이익이 아직 없거나 적은 성장주가 가장 크게 떨어집니다.",
      "반대로 지금 당장 꾸준히 현금을 버는 가치주(은행·보험·필수소비재 등)는 금리 상승기에 상대적으로 잘 버팁니다. 은행은 금리가 오르면 예대마진이 커지는 경우도 많습니다.",
    ],
    rels: [
      { up: "금리 ↓", then: "성장주 > 가치주", note: "할인율 하락의 혜택이 큼" },
      { up: "금리 ↑ (빠르게)", then: "가치주 > 성장주", note: "이익 없는 성장주가 가장 취약" },
    ],
    tip: "같은 성장주라도 ‘지금 이익을 내는 회사’와 ‘아직 적자인 회사’는 금리에 대한 체력이 전혀 다릅니다.",
  },
  {
    id: "dollar-gold",
    icon: "🥇",
    title: "달러와 금 — 이자를 주지 않는 금의 라이벌은 달러와 실질금리",
    lead: "금은 달러로 값이 매겨지고 이자를 주지 않습니다. 그래서 달러가 강하고 실질금리가 높을수록 금의 매력은 줄어드는 경향이 있습니다.",
    body: [
      "국제 금값은 달러로 표시됩니다. 달러가 강해지면 다른 나라 사람에게 금이 비싸져 수요가 줄고, 달러가 약해지면 반대가 됩니다. 그래서 보통 달러 인덱스와 금값은 반대로 움직입니다.",
      "더 중요한 변수는 ‘실질금리(명목 금리 − 물가 상승률)’입니다. 예금·국채로 물가보다 높은 이자를 받을 수 있으면 이자 없는 금을 들고 있을 이유가 줄어듭니다. 실질금리가 마이너스일 때 금이 강했던 이유입니다.",
      "예외도 있습니다. 전쟁·금융위기처럼 공포가 극심하면 달러와 금이 ‘둘 다’ 오르기도 하고, 최근 몇 년처럼 여러 나라 중앙은행이 금을 대량으로 사들이면 달러가 강해도 금값이 오를 수 있습니다.",
    ],
    rels: [
      { up: "달러 ↑ · 실질금리 ↑", then: "금 ↓ (경향)" },
      { up: "달러 ↓ · 실질금리 ↓", then: "금 ↑ (경향)" },
      { up: "위기·공포 극대", then: "달러 ↑ · 금 ↑ 동시 가능" },
    ],
    tip: "금은 ‘수익을 내는 자산’이라기보다 ‘화폐 가치와 위기에 대한 보험’입니다. 전체 자산의 일부(예: 5~10%)로 담는 경우가 많습니다.",
  },
  {
    id: "oil-stock",
    icon: "🛢️",
    title: "원유와 주식 — 왜 올랐는지가 더 중요하다",
    lead: "유가 상승이 주식에 좋은지 나쁜지는 ‘수요 때문인지, 공급 충격 때문인지’에 따라 정반대가 됩니다.",
    body: [
      "경기가 좋아 공장이 돌고 사람들이 많이 움직이면 원유 수요가 늘어 유가가 오릅니다. 이런 ‘수요형’ 유가 상승기에는 주가도 함께 오르는 경우가 많습니다.",
      "반면 전쟁·감산 같은 ‘공급 충격’으로 유가가 급등하면 기업의 원가와 물가가 오르고, 중앙은행이 금리를 올려야 하는 압박이 생겨 주식에 악재가 됩니다. 1970년대 석유 파동이 대표적입니다.",
      "한국은 원유를 거의 전량 수입하는 나라라 유가 급등은 무역수지·환율·물가에 부담입니다. 업종별로는 정유·에너지가 유리하고, 항공·화학·운송은 불리한 경향이 있습니다.",
    ],
    rels: [
      { up: "유가 ↑ (수요 증가)", then: "주가 ↑ 동반 가능" },
      { up: "유가 ↑ (공급 충격)", then: "물가 ↑ · 금리 ↑ · 주가 ↓" },
      { up: "유가 급락 (수요 붕괴)", then: "경기 침체 신호" },
    ],
    example: "2020년 4월 코로나로 수요가 급감하자 미국 WTI 원유 선물 가격이 사상 처음 마이너스(배럴당 약 −37달러)를 기록했습니다.",
    tip: "유가 뉴스를 보면 ‘누가 더 많이 쓰려고 해서’인지, ‘공급이 막혀서’인지를 먼저 구분하세요.",
  },
  {
    id: "cyclical",
    icon: "🏭",
    title: "경기민감주와 사이클 — PER이 높을 때 사고 낮을 때 판다는 역설",
    lead: "철강·화학·조선·해운·자동차·반도체·건설처럼 경기에 따라 이익이 크게 출렁이는 업종을 경기민감주(시클리컬)라고 합니다.",
    body: [
      "경기민감주는 경기가 좋을 때 이익이 폭발하고, 나쁠 때 적자로 돌아서기도 합니다. 주가는 이익보다 먼저 움직여서 보통 경기 바닥보다 6~12개월 앞서 오르고, 경기 정점보다 먼저 꺾입니다.",
      "그래서 생기는 역설이 있습니다. 이익이 바닥이라 PER(주가÷이익)이 매우 높거나 계산이 안 될 때가 오히려 매수 기회이고, 이익이 사상 최대라 PER이 아주 낮아 보일 때가 고점인 경우가 많습니다.",
      "반도체 업종은 메모리 가격(DRAM·낸드), 재고, 설비투자 계획이 사이클의 핵심 신호입니다. 재고가 쌓이고 가격이 꺾이기 시작하면 주가가 먼저 반응합니다.",
    ],
    rels: [
      { up: "경기 바닥 · 이익 최저 (PER 높음)", then: "경기민감주 매수 구간" },
      { up: "경기 정점 · 이익 최대 (PER 낮음)", then: "경기민감주 경계 구간" },
    ],
    tip: "경기민감주는 ‘사서 묻어 두는’ 종목이 아닙니다. 사이클 위치를 확인하는 습관이 필요합니다. 천기누설 메뉴의 반도체 사이클 신호도 함께 보세요.",
  },
];

const EGG = [
  { pos: "A1", name: "조정 국면 (바닥)", vol: "거래량 적음", holders: "주식 보유자 적음", act: "🟢 매수 시작", color: "bg-emerald-50 border-emerald-300", rate: "금리 정점 → 인하 기대" },
  { pos: "A2", name: "동행 국면 (상승)", vol: "거래량 증가", holders: "보유자 늘어남", act: "🔵 보유", color: "bg-blue-50 border-blue-300", rate: "금리 인하·유동성 증가" },
  { pos: "A3", name: "과장 국면 (과열)", vol: "거래량 폭발", holders: "모두가 주식 보유", act: "🟠 매도 시작", color: "bg-orange-50 border-orange-300", rate: "저금리 바닥 · 인상 시작" },
  { pos: "B1", name: "조정 국면 (천장)", vol: "거래량 감소", holders: "보유자 줄기 시작", act: "🔴 매도", color: "bg-red-50 border-red-300", rate: "금리 인상" },
  { pos: "B2", name: "동행 국면 (하락)", vol: "거래량 증가", holders: "보유자 계속 감소", act: "⚪ 현금 보유·관망", color: "bg-slate-50 border-slate-300", rate: "고금리 지속" },
  { pos: "B3", name: "과장 국면 (투매)", vol: "거래량 폭발 (공포 매도)", holders: "소수만 보유", act: "🟢 분할 매수 준비", color: "bg-teal-50 border-teal-300", rate: "금리 정점 부근" },
];

const PROVERBS = [
  { q: "다른 사람들이 탐욕스러울 때 두려워하고, 다른 사람들이 두려워할 때 탐욕스러워져라.", who: "워런 버핏 (1986년 주주서한, 2008년 뉴욕타임스 기고)" },
  { q: "강세장은 비관 속에서 태어나, 회의 속에서 자라고, 낙관 속에서 성숙하며, 행복감 속에서 죽는다.", who: "존 템플턴" },
  { q: "경제와 주식시장의 관계는 산책하는 주인과 강아지와 같다. 강아지는 앞서거니 뒤서거니 하지만 결국 주인을 따라온다.", who: "앙드레 코스톨라니" },
  { q: "주식을 사라. 그리고 수면제를 먹고 몇 년 동안 푹 자라.", who: "앙드레 코스톨라니" },
  { q: "단기적으로 시장은 투표 기계지만, 장기적으로는 저울이다.", who: "벤저민 그레이엄" },
  { q: "무릎에서 사서 어깨에서 팔아라.", who: "주식 격언 — 바닥과 꼭대기를 맞히려 하지 말라" },
  { q: "떨어지는 칼날을 잡지 마라.", who: "주식 격언 — 하락이 멈춘 것을 확인하고 나눠 사라" },
  { q: "달걀을 한 바구니에 담지 마라.", who: "주식 격언 — 분산 투자" },
  { q: "소문에 사고 뉴스에 팔아라.", who: "주식 격언 — 기대는 미리 가격에 반영된다" },
  { q: "거리에 피가 낭자할 때 사라.", who: "로스차일드 가문에서 유래했다고 전해지는 격언" },
];

function RelTable({ rels }: { rels: Rel[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rels.map((r) => (
        <div key={r.up} className="p-3 rounded-lg bg-slate-50 border border-border/50 text-sm">
          <div className="font-black">{r.up} <span className="text-slate-400">→</span> <span className="text-blue-700">{r.then}</span></div>
          {r.note && <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function fmt(v: number | null | undefined, d = 2) {
  return v === null || v === undefined || isNaN(v) ? "-" : v.toFixed(d);
}
function pct(v: number | null | undefined) {
  return v === null || v === undefined || isNaN(v) ? "-" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

/** 지금 시장의 숫자 — 사이트가 1시간마다 모으는 공개 데이터 */
function NowNumbers() {
  const { data } = useMacroMonitor();
  if (!data) return null;
  const spread = data.rates.spreadNow;
  const items = [
    { label: "미국 10년물 금리", value: `${fmt(data.rates.us10y)}%`, read: "주식 할인율·성장주 부담의 기준" },
    { label: "미국 3개월물 금리", value: `${fmt(data.rates.us3m)}%`, read: "현금(단기 예금)의 매력" },
    { label: "장단기 금리차 (10Y−3M)", value: `${fmt(spread)}%p`, read: spread !== null && spread < 0 ? "⚠️ 역전 — 과거 침체 전 자주 등장" : "정상 — 장기 금리가 더 높음" },
    { label: "원/달러 환율", value: `${fmt(data.fx.usdkrwNow, 1)}원`, read: `1개월 ${pct(data.fx.usdkrwChange1mo)} · 상승 시 외국인 매도 압력` },
    { label: "달러 인덱스 (DXY)", value: fmt(data.liquidity.dxyNow, 1), read: `1개월 ${pct(data.liquidity.dxyChange1mo)} · 달러 강세는 금·신흥국에 부담` },
  ];
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">📡 지금 숫자로 보는 관계</CardTitle>
        <CardDescription>
          배운 관계를 지금 시장에 대입해 보세요. ({new Date(data.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 기준 · 약 1시간마다 갱신)
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="p-3 rounded-lg bg-white border border-border/60">
            <div className="text-[11px] text-muted-foreground">{it.label}</div>
            <div className="text-xl font-black">{it.value}</div>
            <div className="text-xs mt-0.5">{it.read}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const TOC = [
  ...SECTIONS.map((s) => ({ id: s.id, label: `${s.icon} ${s.title.split(" — ")[0]}` })),
  { id: "egg", label: "🥚 코스톨라니 달걀" },
  { id: "mr-mom", label: "🔄 평균회귀와 모멘텀" },
  { id: "asym", label: "📐 주식의 비대칭" },
  { id: "value", label: "🏛️ 안 망할 회사 고르기" },
  { id: "mind", label: "🧭 군중과 반대로" },
];

export function Insight() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-indigo-900 via-blue-800 to-cyan-800 shadow">
        <div className="text-3xl mb-1">💡</div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">인사이트 통찰 — 시장을 움직이는 관계 12가지</h2>
        <p className="text-sm text-blue-100 mt-2 leading-relaxed">
          금리가 오르면 왜 성장주가 먼저 떨어질까? 달러가 강하면 금은? 유가 상승은 호재일까 악재일까?
          시장은 서로 연결된 톱니바퀴입니다. 하나가 움직이면 다른 것이 따라 움직이는 원리를 알면, 뉴스 한 줄도 다르게 읽힙니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" }); }}
              className="px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold">{t.label}</a>
          ))}
        </div>
      </div>

      {/* 한눈에 보는 관계표 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🗺️ 한눈에 보는 관계표</CardTitle>
          <CardDescription>‘대체로 그렇다’는 경향입니다. 예외가 생기는 이유는 아래 각 장에서 설명합니다.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-2">이것이 오르면</th><th className="py-2 pr-2">주식</th><th className="py-2 pr-2">채권 가격</th><th className="py-2 pr-2">금</th><th className="py-2">핵심 이유</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["금리(빠르게)", "↓ 성장주 특히", "↓", "↓", "할인율·기회비용 상승"],
                ["달러", "↓ 신흥국·한국", "—", "↓", "외국인 자금 이탈·금의 달러 가격"],
                ["물가(인플레이션)", "↓", "↓", "↑", "금리 인상 압력·화폐 가치 하락"],
                ["유가(공급 충격)", "↓", "↓", "↑", "원가·물가 상승"],
                ["경기 기대", "↑ 경기민감주 특히", "↓", "—", "이익 증가·안전 자산 수요 감소"],
                ["공포·위기", "↓", "↑ 국채", "↑", "안전 자산 선호"],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-border/40">
                  <td className="py-2 pr-2 font-black">{r[0]}</td>
                  {r.slice(1, 4).map((c, i) => (
                    <td key={i} className={`py-2 pr-2 font-bold ${c.startsWith("↑") ? "text-red-600" : c.startsWith("↓") ? "text-blue-600" : "text-slate-400"}`}>{c}</td>
                  ))}
                  <td className="py-2 text-xs text-muted-foreground">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <NowNumbers />

      {/* 1~7장 */}
      {SECTIONS.map((s, i) => (
        <Card key={s.id} id={s.id} className="scroll-mt-28">
          <CardHeader>
            <div className="text-xs font-bold text-indigo-600">제 {i + 1}장</div>
            <CardTitle className="text-lg">{s.icon} {s.title}</CardTitle>
            <CardDescription className="text-sm text-slate-700 font-medium">{s.lead}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            {s.body.map((p, j) => <p key={j}>{p}</p>)}
            {s.rels && <RelTable rels={s.rels} />}
            {s.example && <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs"><b>📌 실제 사례:</b> {s.example}</p>}
            <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs"><b>💡 투자 포인트:</b> {s.tip}</p>
          </CardContent>
        </Card>
      ))}

      {/* 8장 코스톨라니 달걀 */}
      <Card id="egg" className="scroll-mt-28">
        <CardHeader>
          <div className="text-xs font-bold text-indigo-600">제 8장</div>
          <CardTitle className="text-lg">🥚 경기순환과 금리, 그리고 코스톨라니의 달걀</CardTitle>
          <CardDescription className="text-sm text-slate-700 font-medium">
            헝가리 출신의 전설적 투자자 앙드레 코스톨라니(1906~1999)는 주식시장의 순환을 달걀 모양으로 설명했습니다. 핵심은 “돈(유동성)과 심리가 주가를 움직인다”는 것입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            경기는 회복 → 확장 → 과열 → 수축을 되풀이하고, 중앙은행은 경기가 뜨거우면 금리를 올리고 차가우면 내립니다.
            금리가 내려 돈이 풀리면 그 돈이 결국 주식으로 흘러들고, 금리가 올라 돈이 마르면 주식에서 빠져나갑니다.
            코스톨라니는 여기에 <b>거래량</b>과 <b>주식을 가진 사람의 수</b>라는 심리 지표를 더했습니다.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EGG.map((e) => (
              <div key={e.pos} className={`p-3 rounded-xl border ${e.color}`}>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black">{e.pos}</span>
                  <span className="font-black">{e.name}</span>
                </div>
                <div className="text-xs mt-1">📊 {e.vol} · 👥 {e.holders}</div>
                <div className="text-xs text-muted-foreground">🏦 {e.rate}</div>
                <div className="text-sm font-black mt-1">{e.act}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-border/50 text-xs space-y-1">
            <div><b>🥚 달걀 그림으로 기억하기:</b> 달걀의 맨 아래(A1)가 바닥, 왼쪽을 따라 올라가며(A2) 맨 위(A3)가 과열 꼭대기, 오른쪽을 따라 내려오며(B1→B2) 맨 아래 직전(B3)이 투매 구간입니다.</div>
            <div><b>매매 원칙:</b> A1·B3에서 사고, A2에서 들고 있고, A3·B1에서 팔고, B2에서는 기다립니다. 즉 <b>모두가 팔 때 사고 모두가 살 때 판다</b>는 역발상입니다.</div>
            <div className="text-muted-foreground">※ 국내에서는 금리에 따라 예금 → 채권 → 부동산 → 주식으로 돈이 옮겨 가는 ‘금리 달걀’ 그림도 널리 쓰이는데, 이는 코스톨라니의 생각을 바탕으로 후대에 응용된 해석입니다.</div>
          </div>
          <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <b>💡 투자 포인트:</b> 지금이 달걀의 어디쯤인지 정확히 맞히기는 어렵습니다. 대신 ‘거래량이 폭발하고 주변 모두가 주식 이야기를 할 때’(A3)와
            ‘아무도 주식 이야기를 하지 않을 때’(A1·B3)를 구분하는 것만으로도 큰 실수를 피할 수 있습니다.
            <a href={tabUrl("econocycle")} className="text-blue-600 underline ml-1">경기순환 사이클</a> 메뉴에서 현재 경기 위치를 함께 확인해 보세요.
          </p>
        </CardContent>
      </Card>

      {/* 9장 평균회귀와 모멘텀 */}
      <Card id="mr-mom" className="scroll-mt-28">
        <CardHeader>
          <div className="text-xs font-bold text-indigo-600">제 9장</div>
          <CardTitle className="text-lg">🔄 평균회귀와 모멘텀 — 서로 반대 같지만 둘 다 맞다</CardTitle>
          <CardDescription className="text-sm text-slate-700 font-medium">
            “오른 것은 내려온다”(평균회귀)와 “오르는 것이 더 오른다”(모멘텀). 정반대 같은 두 원리는 서로 다른 ‘시간’에서 작동합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="font-black">📈 모멘텀 (추세 지속)</div>
              <div className="text-xs text-muted-foreground mb-1">주로 3~12개월</div>
              <p className="text-xs">최근 몇 달 강했던 종목이 이후 몇 달도 강한 경향. 좋은 소식이 가격에 천천히 반영되고, 투자자들이 뒤늦게 따라 사기 때문입니다. (제가디시·티트먼, 1993 연구)</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="font-black">🔁 평균회귀 (제자리 찾기)</div>
              <div className="text-xs text-muted-foreground mb-1">주로 3~5년</div>
              <p className="text-xs">수년간 크게 오른 종목·시장은 이후 부진하고, 크게 빠진 쪽은 회복하는 경향. 지나친 낙관과 비관이 시간이 지나 바로잡히기 때문입니다. (드봉·세일러, 1985 연구)</p>
            </div>
          </div>
          <p>
            실전에서는 이렇게 씁니다. <b>단기·중기에는 추세를 거스르지 말고</b>(강한 종목·시장의 흐름을 존중), <b>장기 이동평균에서 지나치게 멀어진 극단에서는 평균회귀를 경계</b>합니다.
            200일·200주 이동평균과의 거리(이격도)가 바로 그 ‘멀어진 정도’를 재는 자입니다.
          </p>
          <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <b>💡 투자 포인트:</b> “추세는 친구다, 그 추세가 끝날 때까지는.” 지금의 이격도는
            <a href={tabUrl("dashboard")} className="text-blue-600 underline mx-1">현재 상황</a>, 과거 극단 이격도 이후의 결과는
            <a href={tabUrl("history")} className="text-blue-600 underline ml-1">역사 분석</a>에서 볼 수 있어요.
          </p>
        </CardContent>
      </Card>

      {/* 10장 비대칭 */}
      <Card id="asym" className="scroll-mt-28">
        <CardHeader>
          <div className="text-xs font-bold text-indigo-600">제 10장</div>
          <CardTitle className="text-lg">📐 주식의 비대칭 — 잃는 것은 한정, 얻는 것은 무한</CardTitle>
          <CardDescription className="text-sm text-slate-700 font-medium">
            주식 투자의 수학은 대칭이 아닙니다. 이 비대칭을 이해하면 왜 ‘크게 잃지 않는 것’이 가장 중요한지 알게 됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <div className="font-black">① 손실과 회복의 비대칭</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {[[-10, 11.1], [-20, 25], [-30, 42.9], [-50, 100], [-80, 400]].map(([l, g]) => (
              <div key={l} className="p-2 rounded-lg bg-slate-50 border border-border/50">
                <div className="text-blue-600 font-black">{l}%</div>
                <div className="text-[10px] text-muted-foreground">회복에 필요한 상승</div>
                <div className="text-red-600 font-black">+{g}%</div>
              </div>
            ))}
          </div>
          <p>50% 잃으면 원금을 되찾는 데 100%가 필요합니다. 그래서 몰빵·과도한 빚 투자처럼 ‘한 번에 크게 잃을 수 있는 구조’를 피하는 것이 수익률을 높이는 것보다 먼저입니다.</p>
          <div className="font-black">② 수익의 비대칭</div>
          <p>
            주식 한 종목에서 잃을 수 있는 최대 금액은 투자금의 100%이지만, 오를 수 있는 폭에는 한계가 없습니다(10배, 100배).
            실제로 미국 주식 약 2만6천 종목을 분석한 헨드릭 베셈바인더 교수의 연구(2018)에 따르면, 1926~2016년 미국 주식시장이 만든 순자산 증가의 전부를 상위 약 4% 종목이 만들어 냈습니다.
          </p>
          <div className="font-black">③ 실전에 쓰는 법</div>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>손실은 짧게:</b> 산 이유가 깨지면 손실이 작을 때 정리합니다.</li>
            <li><b>이익은 길게:</b> 좋은 회사가 계속 좋으면 조금 올랐다고 서둘러 팔지 않습니다.</li>
            <li><b>분산 + 분할:</b> 소수의 대박 종목을 놓치지 않으려면 여러 개를 나눠 담는 것이 유리합니다(지수 ETF가 가장 간단한 방법).</li>
            <li><b>비대칭 베팅:</b> ‘틀리면 조금 잃고, 맞으면 크게 버는’ 자리를 찾습니다. 예: 바닥권에서 작은 비중으로 시작하는 분할 매수.</li>
          </ul>
        </CardContent>
      </Card>

      {/* 11장 가치·성장·안 망할 회사 */}
      <Card id="value" className="scroll-mt-28">
        <CardHeader>
          <div className="text-xs font-bold text-indigo-600">제 11장</div>
          <CardTitle className="text-lg">🏛️ 가치주와 성장주, 그리고 ‘안 망할 회사’ 고르기</CardTitle>
          <CardDescription className="text-sm text-slate-700 font-medium">
            어떤 스타일이든 첫 번째 원칙은 같습니다. “망하지 않을 회사를 산다.” 망하지 않으면 시간이 내 편이 됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="font-black">💰 가치주</div>
              <p className="text-xs mt-1">지금 버는 돈·가진 자산에 비해 싸게 거래되는 주식. PER·PBR이 낮고 배당이 많은 편. 금리 상승기·경기 회복 초기에 강한 경향.</p>
              <p className="text-xs mt-1 text-red-700"><b>함정:</b> 싼 데는 이유가 있을 수 있습니다(‘가치 함정’). 이익이 계속 줄어드는 회사는 PBR 0.3도 비쌉니다.</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="font-black">🚀 성장주</div>
              <p className="text-xs mt-1">매출·이익이 빠르게 늘어 미래 가치가 큰 주식. PER이 높고 배당은 적은 편. 금리 하락기에 강한 경향.</p>
              <p className="text-xs mt-1 text-red-700"><b>함정:</b> 성장 기대가 꺾이는 순간 높은 PER이 한꺼번에 무너집니다. ‘좋은 회사’와 ‘좋은 가격’은 다릅니다.</p>
            </div>
          </div>
          <div className="font-black pt-1">✅ 안 망할 회사 체크리스트</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead><tr className="text-left text-muted-foreground border-b"><th className="py-2 pr-2">항목</th><th className="py-2 pr-2">보는 법</th><th className="py-2">일반적인 참고 기준</th></tr></thead>
              <tbody>
                {[
                  ["영업현금흐름", "장부상 이익이 실제 현금으로 들어오는가", "여러 해 꾸준히 플러스, 순이익과 비슷하거나 많음"],
                  ["잉여현금흐름(FCF)", "영업현금흐름 − 설비투자. 배당·빚 상환에 쓸 수 있는 돈", "플러스가 꾸준할수록 좋음"],
                  ["유동비율", "1년 안에 갚을 빚 대비 1년 안에 현금화할 자산", "100% 이상, 150~200%면 여유"],
                  ["부채비율", "자기자본 대비 부채", "업종마다 다르나 제조업은 100~150% 이하가 무난"],
                  ["이자보상배율", "영업이익 ÷ 이자비용. 번 돈으로 이자를 감당하는가", "1배 미만이 계속되면 위험 신호"],
                  ["PBR", "주가 ÷ 1주당 순자산. 1보다 낮으면 장부상 자산보다 싸게 거래", "낮을수록 싸지만 ROE와 함께 볼 것"],
                  ["ROE", "자기자본으로 1년에 몇 % 이익을 내는가", "꾸준히 10% 이상이면 우량한 편"],
                ].map((r) => (
                  <tr key={r[0]} className="border-b border-border/40">
                    <td className="py-2 pr-2 font-black whitespace-nowrap">{r[0]}</td><td className="py-2 pr-2">{r[1]}</td><td className="py-2 text-muted-foreground">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="p-3 rounded-lg bg-slate-50 border border-border/50 text-xs">
            <b>📏 PBR과 ROE의 관계:</b> PBR = PER × ROE 입니다. ROE가 높은(돈을 잘 버는) 회사는 PBR이 높아도 정당화될 수 있고,
            ROE가 낮은 회사는 PBR이 낮아도 싸지 않을 수 있습니다. 코스피 전체의 PBR 위치는
            <a href={tabUrl("dashboard")} className="text-blue-600 underline ml-1">현재 상황</a> 메뉴에서 볼 수 있어요.
          </p>
          <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <b>💡 투자 포인트:</b> 위기 때 회사를 살리는 것은 이익이 아니라 <b>현금과 유동성</b>입니다. 경기가 나빠져도 1~2년 버틸 현금이 있는 회사는
            하락장에서 오히려 경쟁자를 제치고 더 강해집니다.
          </p>
        </CardContent>
      </Card>

      {/* 12장 심리와 격언 */}
      <Card id="mind" className="scroll-mt-28">
        <CardHeader>
          <div className="text-xs font-bold text-indigo-600">제 12장</div>
          <CardTitle className="text-lg">🧭 모두가 환호할 때 조심하고, 모두가 흐느낄 때 용기 내기</CardTitle>
          <CardDescription className="text-sm text-slate-700 font-medium">
            모든 관계를 알아도 마지막 버튼은 사람의 마음이 누릅니다. 시장의 고점과 바닥은 숫자보다 분위기로 먼저 옵니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="font-black">🎉 FOMO·환호의 신호 → 조심</div>
              <ul className="list-disc pl-5 text-xs mt-1 space-y-0.5">
                <li>주식을 하지 않던 지인이 종목을 추천한다</li>
                <li>“이번엔 다르다”, “안 사면 바보”라는 말이 흔하다</li>
                <li>빚 투자(신용융자)와 거래량이 사상 최대</li>
                <li>장기 이동평균과의 이격도가 역사적 극단</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="font-black">😢 공포·절망의 신호 → 용기</div>
              <ul className="list-disc pl-5 text-xs mt-1 space-y-0.5">
                <li>뉴스가 “끝이 안 보인다”로 도배된다</li>
                <li>주식 앱을 지웠다는 사람이 많다</li>
                <li>좋은 회사도 이유 없이 함께 폭락한다</li>
                <li>투매로 거래량이 폭발한 뒤 하락 폭이 줄어든다</li>
              </ul>
            </div>
          </div>
          <p>
            용기 있는 매수는 ‘한 번에 다 사는 용기’가 아니라 <b>‘계획대로 나눠 사는 용기’</b>입니다. 바닥은 아무도 모르기 때문에,
            미리 정한 가격·조건마다 조금씩 사는 사람만이 공포 속에서도 계속 행동할 수 있습니다.
            <a href={tabUrl("decision")} className="text-blue-600 underline ml-1">실전 판단</a>의 분할매수 계산기를 활용해 보세요.
          </p>
          <div className="font-black">📜 시장을 꿰뚫는 격언</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROVERBS.map((p) => (
              <figure key={p.q} className="p-3 rounded-lg bg-white border border-border/60">
                <blockquote className="text-sm font-bold leading-snug">“{p.q}”</blockquote>
                <figcaption className="text-[11px] text-muted-foreground mt-1">— {p.who}</figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            더 많은 명언의 진짜·가짜 여부는 <a href={tabUrl("quotes")} className="text-blue-600 underline">명언 검증</a>, 투자자의 마음가짐은
            <a href={tabUrl("mindset")} className="text-blue-600 underline ml-1">마인드</a> 메뉴에서 이어집니다.
          </p>
        </CardContent>
      </Card>

      {/* 맺음말 */}
      <Card className="border-indigo-200">
        <CardContent className="pt-6 space-y-3 text-sm leading-relaxed">
          <div className="font-black text-base">🔑 12가지 관계를 한 문장으로</div>
          <p className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <b>돈의 가격(금리)이 방향을 정하고, 경기가 속도를 정하며, 사람의 마음이 극단을 만든다.</b>
            관계를 알면 덜 놀라고, 덜 놀라면 계획을 지킬 수 있습니다.
          </p>
          <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            참고: André Kostolany 『Kostolanys Börsenpsychologie』 · Jegadeesh &amp; Titman(1993) · De Bondt &amp; Thaler(1985) ·
            Bessembinder(2018) “Do Stocks Outperform Treasury Bills?” · 미국 연준·재무부 공개 금리 자료.
            이 페이지는 투자 교육용 자체 학습 자료이며 특정 종목·자산의 매수·매도 권유가 아닙니다. 시장의 관계는 경향일 뿐 언제나 예외가 있으며, 투자 판단과 책임은 본인에게 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
