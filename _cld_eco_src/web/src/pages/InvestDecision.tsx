import { useState, useMemo, useEffect, useRef } from "react";
import type { useStockData } from "@/hooks/useStockData";

type StockDataT = ReturnType<typeof useStockData>;

// 실시간 시세(GitHub Actions가 1시간마다 갱신)에서 계산기·현재 위치에 쓰는 값
interface LiveValues { kospi: number; ma200: number; ma200w: number; samDev: number; skDev: number; dev200d: number; dev200w: number }

function liveFrom(stockData?: StockDataT): LiveValues | null {
  const k = stockData?.kospi;
  if (!k || !(k.price > 0) || !k.ma200d || !k.ma200w) return null;
  return {
    kospi: Math.round(k.price),
    ma200: Math.round(k.ma200d),
    ma200w: Math.round(k.ma200w),
    samDev: Number((stockData?.sam?.dev200d ?? 0).toFixed(2)),
    skDev: Number((stockData?.sk?.dev200d ?? 0).toFixed(2)),
    dev200d: k.dev200d ?? ((k.price - k.ma200d) / k.ma200d) * 100,
    dev200w: k.dev200w ?? ((k.price - k.ma200w) / k.ma200w) * 100,
  };
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

// ─── 6가지 선택지 ────────────────────────────────────────────────────────────
const choices = [
  { id: 1, label: "지금 전액 몰빵 매수", icon: "💸",
    genspark: "🔴 비추천", balanced: "🔴 비추천", verdict: "비추천",
    color: "bg-red-50 border-destructive/30",
    reason: (l: LiveValues | null) => l
      ? `지금은 200일선 이격 ${fmtPct(l.dev200d)}, 200주선 이격 ${fmtPct(l.dev200w)}. 어느 구간이든 한 번에 전액 매수하면 판단이 틀렸을 때 회복할 수단이 없습니다. (작성 당시 6~7월 고점에는 200일 +67%, 200주 +162%였고 이후 큰 폭으로 조정됐습니다.)`
      : "200일선 이격 +67%, 200주선 이격 +162% 구간(6~7월 고점 당시)에서 전액 매수는 역사적으로 손익비가 최악. 평균회귀 확률 70~80%.",
    risk: "최대 -50% 이상 손실 가능" },
  { id: 2, label: "지금 전액 인버스(숏)", icon: "📉",
    genspark: "🔴 강하게 비추천", balanced: "🔴 강하게 비추천", verdict: "강비추",
    color: "bg-red-50 border-destructive/30",
    reason: "강세장에서 숏은 방향보다 타이밍이 훨씬 어렵습니다. 틀린 타이밍에 물리면 수익이 나도 못 버팁니다.",
    risk: "방향 맞아도 타이밍 틀리면 큰 손실" },
  { id: 3, label: "전액 현금 대기", icon: "💰",
    genspark: "🟡 일부 동의", balanced: "🟡 일부만 동의", verdict: "부분동의",
    color: "bg-amber-50 border-amber-400/30",
    reason: "현금 확보 자체는 옳습니다. 하지만 전액 현금은 기회비용이 큽니다. 미국 S&P500은 정상 강세장이므로 일부 참여가 균형적.",
    risk: "기회비용 발생, S&P 정상권 상승 놓침" },
  { id: 4, label: "소액 참여 + 현금 대기 + 분할매수", icon: "⚖️",
    genspark: "🟢 추천 (소액 한정)", balanced: "🟢 가장 균형적", verdict: "추천",
    color: "bg-emerald-50 border-emerald-400/30",
    reason: "1억 중 1,000~2,000만원만 한국 ETF 소액 참여, 나머지 현금·미국 ETF 보유. 틀려도 살아남고, 맞으면 추가 수익.",
    risk: "가장 낮은 리스크 구조" },
  { id: 5, label: "코스피 2,000 대기 후 전량 매수", icon: "⏳",
    genspark: "🔴 비현실적", balanced: "🔴 비현실적", verdict: "비추천",
    color: "bg-red-50 border-destructive/30",
    reason: (l: LiveValues | null) => l
      ? `현재 ${fmt(l.kospi)}에서 ${fmtPct((2000 - l.kospi) / l.kospi * 100)} 하락해야 하는 수준. 전쟁·IMF 수준. 기다리다 영영 매수 못할 가능성.`
      : "코스피 2,000은 고점(약 9,385) 대비 -79% 수준. 전쟁·IMF 수준. 기다리다 영영 매수 못할 가능성.",
    risk: "영구적 기회 손실" },
  { id: 6, label: "코스피 10,000 돌파 후 추격 매수", icon: "🚀",
    genspark: "🔴 비추천", balanced: "🔴 비추천", verdict: "비추천",
    color: "bg-red-50 border-destructive/30",
    reason: "이미 과열된 곳에서 더 오른 뒤 진입. 이격도가 더욱 확대된 시점에 고점 매수하는 최악의 타이밍.",
    risk: "이격 극단 확대 구간 고점 진입" },
];

// ─── 두 관점 비교 ────────────────────────────────────────────────────────────
const viewComparison = [
  { item: "코스피 상태",    genspark: "200일·200주선 극단 이격, 평균회귀 위험 70~80%", balanced: "과열 부담 크지만 예외 가능성 열어둠", gap: "많이 비슷 ✅" },
  { item: "삼성·SK 쏠림",  genspark: "닷컴버블식 집중 위험",  balanced: "건강한 상승으로 단정 불가", gap: "거의 같음 ✅" },
  { item: "인버스·숏",      genspark: "강하게 비추천",          balanced: "초보자에게 강하게 비추천", gap: "완전 일치 ✅" },
  { item: "한국 ETF",       genspark: "0% (완전 배제·대기)",    balanced: "1,000~2,000만원 소액 참여 가능", gap: "⚠️ 핵심 차이" },
  { item: "미국 ETF",       genspark: "S&P 25% + 나스닥 10%",  balanced: "미국 ETF 적극 유지",       gap: "방향 같음 ✅" },
  { item: "현금",            genspark: "50%",                    balanced: "40~50%",                  gap: "거의 같음 ✅" },
  { item: "전략 핵심",      genspark: "평균회귀 철저 대비",      balanced: "평균회귀 + AI 예외 동시 대비", gap: "조금 다름 ⚠️" },
];

// ─── 평균회귀 예외 5가지 ─────────────────────────────────────────────────────
const exceptions = [
  { title: "산업 구조 완전히 바뀜",    icon: "🏭", kospi: "AI 반도체 실적이 실제로 따라온다면 부분 예외 가능", verdict: "🟡 부분 해당 가능" },
  { title: "독점적 승자 기업 탄생",    icon: "👑", kospi: "SK하이닉스 HBM 독점 지위가 지속된다면 예외 가능",   verdict: "🟡 가능성 있음" },
  { title: "가치 함정",                icon: "⚠️", kospi: "고평가 함정 역방향 — '비싸도 계속 오른다' 착각",    verdict: "🔴 역방향 함정" },
  { title: "금리·환율 체제 변화",      icon: "📊", kospi: "한국 기준금리·달러/원이 외국인 수급에 큰 영향",       verdict: "🟡 주시 필요" },
  { title: "지수 구성 변화",           icon: "🔄", kospi: "삼성·SK 합산 30%+ → 전체 이격도 왜곡 가능",         verdict: "🔴 핵심 주의" },
];

// ─── 왕초보 행동 규칙 ────────────────────────────────────────────────────────
const actionRules = [
  { level: "KOSPI 8,000 위", situation: "계속 상승 중", dont: "FOMO 몰빵 · 레버리지", do: "기존 소액 보유, 신규매수 속도 축소", color: "bg-red-50 border-destructive/20" },
  { level: "KOSPI 7,300",    situation: "1차 조정",     dont: "공포 매도",             do: "1차 분할매수 검토 시작",             color: "bg-amber-50 border-amber-300" },
  { level: "KOSPI 6,500",    situation: "2차 조정 (-20%)", dont: "뉴스 보고 전액 매도",do: "실적 전망 유지 시 2차 분할매수",    color: "bg-amber-50 border-amber-400" },
  { level: "KOSPI 5,800",    situation: "3차 급락 (-29%)", dont: "인버스 뒤늦게 추격", do: "현금으로 천천히 추가매수, 업황 재점검", color: "bg-blue-50 border-blue-300" },
  { level: "삼성·SK 실적 하향", situation: "예외 시나리오 붕괴", dont: "'언젠가 회복' 맹신", do: "방어 비중 확대, 예외 시나리오 폐기", color: "bg-purple-50 border-purple-300" },
];

// ─── 단계별 분할매수 ─────────────────────────────────────────────────────────
const defaultStages = [
// top: 이 단계 구간의 위쪽 끝. 현재 위치는 실시간 코스피로 자동 표시합니다.
const defaultStages = [
  { range: "8,100~8,300", top: Infinity, label: "고점권 (계획 시작)", pct: 15, action: "소액 참여 (한국 ETF)", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-300" },
  { range: "7,300~7,400",  top: 7400, label: "1차 조정",        pct: 20, action: "1차 분할매수",         color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-300"  },
  { range: "6,500~6,600",  top: 6600, label: "2차 조정 (-20%)", pct: 25, action: "2차 분할매수",         color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-400"  },
  { range: "5,700~5,800",  top: 5800, label: "3차 조정 (-29%)", pct: 25, action: "3차 분할매수",         color: "text-indigo-700",bg: "bg-indigo-50",border: "border-indigo-400"},
  { range: "4,900 전후",   top: 5000, label: "최후 예비 (-40%)", pct: 15, action: "마지막 예비자금",      color: "text-emerald-700",bg:"bg-emerald-50",border:"border-emerald-400"},
];

/** 코스피 값이 들어 있는 가장 깊은 단계 (예: 5,550 → 3차 조정 단계) */
function currentStageIndex(kospi: number) {
  let idx = 0;
  defaultStages.forEach((s, i) => { if (kospi <= s.top) idx = i; });
  return idx;
}

/** 행동 규칙 표의 현재 줄 — 8,000 위 / 7,300 / 6,500 / 5,800 중 가장 가까운 단계 */
function currentRuleIndex(kospi: number | null) {
  if (kospi == null) return -1;
  if (kospi > 7650) return 0;
  if (kospi > 6900) return 1;
  if (kospi > 6150) return 2;
  return 3;
}

// ─── 1억 운용 예시 ───────────────────────────────────────────────────────────
const allocationPlan = [
  { name: "현금·예금·MMF",      range: "4,000~5,000만", role: "코스피 7,300·6,500·5,800 하락 대응 탄약", color: "bg-slate-100 border-slate-300" },
  { name: "미국 S&P500·나스닥", range: "2,000~3,000만", role: "한국 반도체 쏠림 완화, 정상 강세장 참여",   color: "bg-blue-50 border-blue-200"   },
  { name: "한국 코스피 ETF",    range: "1,000~2,000만", role: "상승 지속 시 소외 방지. 단 몰빵 금지",    color: "bg-amber-50 border-amber-200" },
  { name: "금·달러·단기채",     range: "500~1,000만",   role: "환율·위기 방어, 인플레 헤지",              color: "bg-yellow-50 border-yellow-200"},
  { name: "예비자금",           range: "500만+",        role: "판단 실수·생활 리스크 방어",              color: "bg-emerald-50 border-emerald-200"},
];

// ─── 유틸 ────────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 }); }
function fmtPct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; }

// ─── 5단계 동적 판정 ─────────────────────────────────────────────────────────
function getVerdict(gap: number) {
  if (gap >= 60) return { text: "극단 과열 · 평균회귀 경계", color: "text-destructive", bg: "bg-red-50 border-destructive/40", explain: "현재가가 200일선에서 역사적으로 가장 멀리 떨어졌습니다. 숏보다 위험한 것은 몰빵이며, 현금과 분할매수가 핵심입니다." };
  if (gap >= 30) return { text: "과열 강세장 · 방어적 참여", color: "text-amber-600", bg: "bg-amber-50 border-amber-400/60", explain: "추세는 강하지만 신규 진입 가격 부담이 큽니다. 소액 참여와 조정 대기가 균형적입니다." };
  if (gap >= 10) return { text: "강세장 정상권 · 분할 가능", color: "text-blue-600", bg: "bg-blue-50 border-blue-400/40", explain: "200일선 위 건강한 강세장. 업종 쏠림과 실적 확인 후 분할 진입 가능합니다." };
  if (gap >= 0)  return { text: "정상 강세장 · 적극 검토", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-400/40", explain: "이격도가 높지 않아 추세 참여와 분할매수를 병행할 수 있습니다." };
  return { text: "약세·조정권 · 리스크 점검", color: "text-blue-700", bg: "bg-blue-50 border-blue-400/40", explain: "200일선 아래에서는 강세장 가정이 약해집니다. 더 천천히 접근해야 합니다." };
}

// ─── 인터랙티브 계산기 ───────────────────────────────────────────────────────
function Calculator({ live }: { live: LiveValues | null }) {
  const [total,  setTotal]  = useState(10000);
  const [kospi,  setKospi]  = useState(live?.kospi  ?? 5550);
  const [ma200,  setMa200]  = useState(live?.ma200  ?? 6450);
  const [ma200w, setMa200w] = useState(live?.ma200w ?? 3564);
  const [samDev, setSamDev] = useState(live?.samDev ?? -8.21);
  const [skDev,  setSkDev]  = useState(live?.skDev  ?? -13.37);

  // 사용자가 직접 숫자를 바꾸기 전까지는 실시간 시세를 따라갑니다.
  const edited = useRef(false);
  useEffect(() => {
    if (!live || edited.current) return;
    setKospi(live.kospi); setMa200(live.ma200); setMa200w(live.ma200w);
    setSamDev(live.samDev); setSkDev(live.skDev);
  }, [live?.kospi, live?.ma200, live?.ma200w, live?.samDev, live?.skDev]);

  const dev200d = ma200  ? ((kospi - ma200)  / ma200  * 100) : 0;
  const dev200w = ma200w ? ((kospi - ma200w) / ma200w * 100) : 0;

  // 가중 리스크 점수: KOSPI이격×0.85 + 개별주최대×0.18 (manus_new.html 공식)
  const riskScore = Math.min(100, Math.max(0, dev200d * 0.85 + Math.max(samDev, skDev) * 0.18));
  const verdict = getVerdict(dev200d);

  const stages = defaultStages.map(s => ({
    ...s, amount: Math.round(total * s.pct / 100 / 100) * 100,
  }));

  // 막대 차트 데이터
  const barData = useMemo(() => [
    { name: "KOSPI\n200일", value: parseFloat(dev200d.toFixed(2)), fill: dev200d >= 60 ? "#ef4444" : dev200d >= 30 ? "#f59e0b" : "#3b82f6" },
    { name: "KOSPI\n200주", value: parseFloat(dev200w.toFixed(2)), fill: dev200w >= 100 ? "#ef4444" : "#f97316" },
    { name: "삼성전자\n200일", value: samDev, fill: samDev >= 80 ? "#ef4444" : "#8b5cf6" },
    { name: "SK하이닉스\n200일", value: skDev, fill: skDev >= 80 ? "#ef4444" : "#ec4899" },
  ], [dev200d, dev200w, samDev, skDev]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-bold mb-1">{label?.replace("\n", " ")}</p>
        <p style={{ color: payload[0].payload.fill }} className="font-black text-base">
          {fmtPct(payload[0].value)}
        </p>
        <p className="text-muted-foreground mt-0.5">
          {payload[0].value >= 60 ? "🔴 극단 과열" : payload[0].value >= 30 ? "🟡 과열" : payload[0].value >= 10 ? "🔵 정상" : "🟢 매수 기회"}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 입력 패널 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "총 투자액 (만원)", value: total,  set: setTotal,  min: 100,  max: 100000, step: 100  },
          { label: "KOSPI 현재가",     value: kospi,  set: setKospi,  min: 1000, max: 15000,  step: 1    },
          { label: "200일 이평선",     value: ma200,  set: setMa200,  min: 1000, max: 12000,  step: 1    },
          { label: "200주 이평선",     value: ma200w, set: setMa200w, min: 500,  max: 8000,   step: 1    },
          { label: "삼성전자 이격%",   value: samDev, set: setSamDev, min: -50,  max: 500,    step: 0.1  },
          { label: "SK하이닉스 이격%", value: skDev,  set: setSkDev,  min: -50,  max: 1000,   step: 0.1  },
        ].map(({ label, value, set, min, max, step }) => (
          <div key={label} className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium block">{label}</label>
            <input type="number" value={value} min={min} max={max} step={step}
              onChange={e => { if (label !== "총 투자액 (만원)") edited.current = true; set(Number(e.target.value)); }}
              className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-border bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        ))}
      </div>

      {/* 5단계 동적 판정 */}
      <div className={`p-4 rounded-2xl border-2 ${verdict.bg} transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1 font-medium">현재 판단 (입력값 실시간 반영)</div>
            <div className={`text-2xl font-black tracking-tight ${verdict.color}`}>{verdict.text}</div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{verdict.explain}</p>
          </div>
          <div className="shrink-0 space-y-1 sm:text-right">
            <div className="text-xs text-muted-foreground">가중 위험 점수</div>
            <div className={`text-4xl font-black ${riskScore >= 70 ? "text-destructive" : riskScore >= 40 ? "text-amber-600" : "text-emerald-700"}`}>
              {riskScore.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">= 이격×0.85 + 개별주×0.18</div>
          </div>
        </div>
        <div className="mt-3 w-full bg-white/60 rounded-full h-3 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-destructive transition-all duration-500"
            style={{ width: `${riskScore}%` }} />
        </div>
      </div>

      {/* 막대 차트 — 4가지 이격도 비교 */}
      <div>
        <div className="text-sm font-bold mb-3 text-muted-foreground flex items-center gap-2">
          📊 4가지 이격도 한눈에 비교
          <span className="text-xs font-normal">(수치를 바꾸면 차트가 실시간 업데이트됩니다)</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={20}  stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "과열 기준 +20%",  position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }} />
              <ReferenceLine y={60}  stroke="#ef4444" strokeDasharray="4 4" label={{ value: "극단 기준 +60%",  position: "insideTopRight", fontSize: 10, fill: "#ef4444" }} />
              <ReferenceLine y={100} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: "200주 100%선",    position: "insideTopRight", fontSize: 10, fill: "#7c3aed" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center mt-1">
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive mr-1" />+60% 이상: 극단 과열</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500 mr-1" />+20~60%: 과열 주의</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500 mr-1" />+10~20%: 정상 강세</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1" />0~10%: 매수 기회</span>
        </div>
      </div>

      {/* 핵심 계산 결과 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "200일 이격도", val: fmtPct(dev200d), sub: `MA200일: ${fmt(ma200)}`, danger: dev200d >= 30 },
          { label: "200주 이격도", val: fmtPct(dev200w), sub: `MA200주: ${fmt(ma200w)}`, danger: dev200w >= 60 },
          { label: "-10% 조정 후", val: fmt(kospi * 0.9), sub: "약한 평균회귀", danger: false },
          { label: "200일선 완전회귀", val: fmt(ma200), sub: `현재 대비 ${(((ma200-kospi)/kospi)*100).toFixed(1)}%`, danger: false },
        ].map(c => (
          <div key={c.label} className={`p-3 rounded-xl border ${c.danger ? "bg-red-50 border-destructive/30" : "bg-white/70 border-border/40"}`}>
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className={`text-2xl font-black tracking-tight ${c.danger ? "text-destructive" : "text-foreground"}`}>{c.val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* 단계별 분할매수 플랜 */}
      <div>
        <div className="text-sm font-bold mb-3 text-muted-foreground">
          💰 총 {fmt(total)}만원 기준 — 코스피 레벨별 분할매수 플랜
        </div>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-sm font-black ${s.color}`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-black text-sm ${s.color}`}>코스피 {s.range}</span>
                  <span className="text-xs text-muted-foreground">({s.label})</span>
                  {i === currentStageIndex(kospi) && <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 animate-pulse">← 현재 ({fmt(kospi)})</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{s.action}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xl font-black ${s.color}`}>{fmt(s.amount)}만원</div>
                <div className="text-xs text-muted-foreground">{s.pct}%</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">코스피가 하락할수록 더 많은 금액 투입 → 평균 매수가 자동 낮아지는 구조</p>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export function InvestDecision({ stockData }: { stockData?: StockDataT }) {
  const [activeChoice, setActiveChoice] = useState<number | null>(null);
  const live = liveFrom(stockData);
  const ruleIdx = currentRuleIndex(live?.kospi ?? null);
  const liveVerdict = live ? getVerdict(live.dev200d) : null;

  return (
    <div className="space-y-8">

      {/* 헤더 */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700 mb-3">
          🧭 젠스파크 앱 + Manus 균형 의견 통합 분석
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2">실전 투자 판단 센터</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          두 분석의 공통점과 차이점을 비교하고, 인터랙티브 계산기로 내 상황에 맞는 분할매수 플랜을 설계합니다.<br />
          <strong className="text-foreground">한국 증시를 무조건 피하라가 아니라 — 작은 금액으로 참여하고, 큰 돈은 조정 구간에 나눠 쓰는 것</strong>이 두 분석의 공통 결론입니다.
        </p>
      </div>

      {/* 공통 결론 배너 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-5 pb-5">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">📌 두 분석 공통 결론 (75~85% 일치)</div>
          <p className="font-bold text-base leading-relaxed">
            지금 코스피는 <span className="text-destructive">강세장이지만 쏠림·고이격 과열</span> 상태. 전액 매수도, 전액 숏도, 전액 현금도 아닌 —{" "}
            <span className="text-blue-700">소액 참여 + 현금 대기 + 하락 구간별 분할매수</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">※ 위 결론은 6~7월 고점(코스피 8,000대, 200일 이격 +60% 이상) 때 작성한 분석입니다.</p>
          {live && liveVerdict && (
            <div className={`mt-3 p-3 rounded-xl border-2 ${liveVerdict.bg}`}>
              <div className="text-xs font-bold text-muted-foreground mb-1">📡 지금 자동 판정 (GitHub Actions 1시간마다 갱신)</div>
              <div className="text-sm font-bold">
                코스피 {fmt(live.kospi)} · 200일 이격 {fmtPct(live.dev200d)} · 200주 이격 {fmtPct(live.dev200w)} →{" "}
                <span className={liveVerdict.color}>{liveVerdict.text}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{liveVerdict.explain}</p>
            </div>
          )}
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-bold">⚡ 일치: 몰빵 비추</span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-bold">⚡ 일치: 인버스 비추</span>
            <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-bold">⚠️ 차이: 한국 ETF 0% vs 소액 참여</span>
            <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-bold">⚡ 일치: 미국 ETF 유지</span>
          </div>
        </CardContent>
      </Card>

      {/* 인터랙티브 계산기 */}
      <Card>
        <CardHeader className="bg-slate-50/80 border-b border-border/30 pb-3">
          <CardTitle className="flex items-center gap-2">
            🔢 실시간 이격도 계산기 · 막대 비교 · 분할매수 플랜
          </CardTitle>
          <CardDescription>수치를 직접 바꾸면 판정·차트·분할금액이 즉시 재계산됩니다</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <Calculator live={live} />
        </CardContent>
      </Card>

      {/* 왕초보 행동 규칙 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📋 왕초보 행동 규칙 — 코스피 레벨별 할 것 / 말 것</CardTitle>
          <CardDescription>Manus AI 분석 기준 | 상황별 명확한 행동 가이드</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {actionRules.map((rule, i) => (
              <div key={i} className={`p-3 rounded-xl border ${rule.color} ${i === ruleIdx ? "ring-2 ring-primary/50" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <div className="font-black text-sm">{rule.level}</div>
                    {i === ruleIdx && live && <Badge variant="outline" className="text-xs mt-1 animate-pulse">← 현재 ({fmt(live.kospi)})</Badge>}
                    <div className="text-xs text-muted-foreground">{rule.situation}</div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-destructive font-black shrink-0">✗ 하지 말 것:</span>
                      <span className="text-foreground/80">{rule.dont}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-700 font-black shrink-0">✓ 할 만한 것:</span>
                      <span className="text-foreground/80">{rule.do}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 1억 운용 예시 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>💼 1억원 운용 예시 — 몰빵 대신 생존 구조</CardTitle>
          <CardDescription>균형 의견 기준 | 젠스파크 앱과 핵심 차이는 한국 ETF 소액 포함 여부</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allocationPlan.map(a => (
            <div key={a.name} className={`flex items-center gap-3 p-3 rounded-xl border ${a.color}`}>
              <div className="flex-1">
                <div className="font-bold text-sm">{a.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.role}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-base text-foreground">{a.range}</div>
              </div>
            </div>
          ))}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800">
            ⚠️ 이 표는 개인 맞춤 투자자문이 아닌 의사결정 프레임입니다. 연령·소득·손실 감내력·투자기간에 따라 비중은 크게 달라져야 합니다.
          </div>
        </CardContent>
      </Card>

      {/* 6가지 선택지 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>⚖️ 6가지 선택지 완전 비교</CardTitle>
          <CardDescription>카드를 클릭하면 상세 이유를 확인할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {choices.map(c => (
            <div key={c.id}
              className={`border-2 rounded-xl cursor-pointer transition-all duration-150 ${c.color} ${activeChoice === c.id ? "ring-2 ring-primary/40" : "hover:shadow-sm"}`}
              onClick={() => setActiveChoice(activeChoice === c.id ? null : c.id)}>
              <div className="flex items-center gap-3 p-3">
                <span className="text-xl shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{c.label}</div>
                  <div className="flex gap-3 mt-0.5 text-xs flex-wrap">
                    <span className="text-muted-foreground">젠스파크: <strong className="text-foreground">{c.genspark}</strong></span>
                    <span className="text-muted-foreground">균형의견: <strong className="text-foreground">{c.balanced}</strong></span>
                  </div>
                </div>
                <Badge variant={c.verdict === "추천" ? "outline" : c.verdict === "부분동의" ? "secondary" : "destructive"}
                  className={`shrink-0 text-xs font-bold ${c.verdict === "추천" ? "border-emerald-400 text-emerald-700 bg-emerald-50" : c.verdict === "부분동의" ? "border-amber-400 text-amber-700 bg-amber-50" : ""}`}>
                  {c.verdict}
                </Badge>
              </div>
              {activeChoice === c.id && (
                <div className="px-4 pb-4 border-t border-current/10 pt-3 space-y-1.5">
                  <p className="text-sm text-foreground/80 leading-relaxed">{typeof c.reason === "function" ? c.reason(live) : c.reason}</p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/60 border border-border/40 rounded-lg text-xs text-muted-foreground">
                    ⚠️ 리스크: {c.risk}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 두 관점 비교표 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📊 젠스파크 앱 vs 균형 의견 — 항목별 비교</CardTitle>
          <CardDescription>75~85% 일치 · 핵심 차이는 단 하나 — 한국 ETF 비중</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead>젠스파크 앱 (극보수)</TableHead>
                  <TableHead>균형 의견</TableHead>
                  <TableHead className="text-center">판정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewComparison.map(row => (
                  <TableRow key={row.item} className={row.gap.includes("핵심") ? "bg-amber-50" : ""}>
                    <TableCell className="font-bold text-sm">{row.item}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.genspark}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.balanced}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.gap.includes("핵심") ? "destructive" : "outline"}
                        className={`text-xs ${row.gap.includes("핵심") ? "" : "border-emerald-400 text-emerald-700"}`}>
                        {row.gap}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 평균회귀 예외 5가지 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🚨 평균회귀 예외 5가지 — 한국 증시 적용</CardTitle>
          <CardDescription>예외가 평균회귀를 늦출 수 있지만 제거하지는 못합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {exceptions.map((ex, i) => (
            <div key={i} className="p-3 border rounded-xl bg-white/70 border-border/40 flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">{ex.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-sm">예외 {i+1}: {ex.title}</span>
                  <Badge variant="outline" className={`text-xs ${ex.verdict.includes("🔴") ? "border-destructive/40 text-destructive" : "border-amber-400 text-amber-700"}`}>
                    {ex.verdict}
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5">
                  <strong>한국 적용:</strong> {ex.kospi}
                </p>
              </div>
            </div>
          ))}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-muted-foreground">
            <strong className="text-foreground">결론:</strong> 예외 중 일부는 한국에 해당할 수 있지만, 이격도 +162%를 정당화하지는 않습니다.
            예외는 평균회귀를 <strong className="text-foreground">늦추거나 약화</strong>시킬 뿐, <strong className="text-destructive">제거하지 못합니다.</strong>
          </div>
        </CardContent>
      </Card>

      {/* 최종 판단표 */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle>✅ 최종 판단표 — 5가지 핵심 질문</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>질문</TableHead><TableHead>답</TableHead></TableRow></TableHeader>
              <TableBody>
                {[
                  { q: "지금 코스피 ETF를 전액 사야 하나?",  a: "❌ 아니오. 과열·쏠림 구간 몰빵은 위험.", danger: true },
                  { q: "그럼 지금 숏을 쳐야 하나?",           a: "❌ 아니오. 강세장 숏은 타이밍이 매우 어렵습니다.", danger: true },
                  { q: "현금을 지켜야 하나?",                  a: "✅ 예. 단 전액보다 일부 참여 병행이 균형적.", danger: false },
                  { q: "평균회귀는 올 가능성이 있나?",         a: "⚠️ 70~80% 가능성. AI 반도체 실적 시 예외 가능.", danger: false },
                  { q: "가장 무난한 방식은?",                  a: "💡 소액 참여 + 현금 대기 + 하락 구간별 분할매수", danger: false },
                ].map(row => (
                  <TableRow key={row.q} className={row.danger ? "bg-red-50/50" : ""}>
                    <TableCell className="text-sm font-medium">{row.q}</TableCell>
                    <TableCell className={`text-sm font-bold ${row.danger ? "text-destructive" : row.a.startsWith("✅") ? "text-emerald-700" : "text-foreground"}`}>{row.a}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
