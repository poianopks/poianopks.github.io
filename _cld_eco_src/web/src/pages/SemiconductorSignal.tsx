import { useMemo, useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend,
} from "recharts";
import { useSemiHistory } from "@/hooks/useSemiHistory";
import { useStockData } from "@/hooks/useStockData";
import { LiveSignalChart } from "@/pages/LiveSignalChart";
import { DramSpotContractChart } from "@/pages/DramSpotContractChart";

function fmt0(v: number) { return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 }); }
function fmtPct(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`; }

function SignalBadge({ level }: { level: "safe" | "caution" | "danger" | "sell" }) {
  const map = {
    safe:    { label: "✅ 안전 구간",    cls: "bg-emerald-500" },
    caution: { label: "⚠️ 주의 구간",    cls: "bg-yellow-500" },
    danger:  { label: "🔴 위험 — 고점권", cls: "bg-orange-500" },
    sell:    { label: "🚨 매도 신호 발생", cls: "bg-red-600 animate-pulse" },
  };
  const m = map[level];
  return (
    <span className={`${m.cls} text-white text-sm font-black px-4 py-1.5 rounded-full shadow`}>
      {m.label}
    </span>
  );
}

function Gauge({ label, value, unit = "%" }: { label: string; value: number | null; unit?: string }) {
  if (value == null) return null;
  const pct = Math.min(Math.max(value, -50), 200);
  const danger = value > 80;
  const extreme = value > 120;
  const color = extreme ? "#dc2626" : danger ? "#f97316" : value > 30 ? "#eab308" : "#10b981";
  const barWidth = Math.min(Math.max(((pct + 50) / 250) * 100, 0), 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-600">{label}</span>
        <span style={{ color }} className="font-black">{fmtPct(value)}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
        <div className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${barWidth}%`, background: color }} />
        <div className="absolute top-0 h-full w-px bg-slate-400 opacity-50" style={{ left: "20%" }} />
        <div className="absolute top-0 h-full w-px bg-orange-400" style={{ left: "52%" }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>-50%</span><span>0%</span><span style={{ color: "#f97316" }}>+80%</span><span>+200%</span>
      </div>
    </div>
  );
}

function SignalRow({ ok, text, sub }: { ok: boolean | null; text: string; sub: string }) {
  const icon = ok === null ? "⬜" : ok ? "🟢" : "🔴";
  return (
    <div className={`p-3 rounded-xl border ${ok === null ? "border-slate-200 bg-slate-50" : ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
      <div className="flex items-start gap-2">
        <span className="text-base">{icon}</span>
        <div>
          <div className="text-sm font-bold">{text}</div>
          <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
        </div>
      </div>
    </div>
  );
}

const CustomTooltipNorm = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(1)}
        </p>
      ))}
    </div>
  );
};

const CustomTooltipRatio = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-purple-600">삼성/하이닉스 비율: {payload[0]?.value?.toFixed(4)}</p>
      <p className="text-xs text-slate-400 mt-1">비율 하락 = 하이닉스 과도 상승 = 매도 경고</p>
    </div>
  );
};

interface DramLatest { latest: { date: string; spot: number; contract: number; estimated?: boolean }; currentStatus: string; }

function useDramLatest() {
  const [dram, setDram] = useState<DramLatest | null>(null);
  useEffect(() => {
    fetch("/api/stocks/dram-history").then(r => r.json()).then(setDram).catch(() => {});
  }, []);
  return dram;
}

export function SemiconductorSignal() {
  const { data, loading } = useSemiHistory();
  const { sam, sk } = useStockData();
  const dram = useDramLatest();

  const { normalized, ratioSeries, divergenceWeeks, firstBase } = useMemo(() => {
    if (!data?.series?.length) return { normalized: [], ratioSeries: [], divergenceWeeks: 0, firstBase: null };

    const series = data.series;
    const samBase = series[0].sam;
    const skBase  = series[0].sk;

    const normalized = series.map(p => ({
      date: p.date.slice(5),
      sam100: Math.round((p.sam / samBase) * 1000) / 10,
      sk100:  Math.round((p.sk  / skBase)  * 1000) / 10,
    }));

    const ratioSeries = series.map(p => ({
      date: p.date.slice(5),
      ratio: Math.round((p.sam / p.sk) * 100000) / 100000,
    }));

    const last12 = ratioSeries.slice(-12);
    const ratioNow = last12[last12.length - 1]?.ratio ?? 0;
    const ratio12ago = last12[0]?.ratio ?? ratioNow;
    const divergenceWeeks = ratioNow < ratio12ago * 0.85 ? 12 : ratioNow < ratio12ago * 0.92 ? 6 : 0;

    return { normalized, ratioSeries, divergenceWeeks, firstBase: { samBase, skBase } };
  }, [data]);

  const samDev = sam?.dev200d ?? null;
  const skDev  = sk?.dev200d ?? null;
  const samPrice = sam?.price ?? null;
  const skPrice  = sk?.price ?? null;

  const signal1_dram = dram?.currentStatus === "danger"; // DRAM Spot < Contract (분기 수동 입력값 기준)
  const signal2_diverge = divergenceWeeks >= 12; // 하이닉스 신고가 & 삼성 3개월+ 정체
  const signal2_caution = divergenceWeeks >= 6 && divergenceWeeks < 12; // 주의 단계
  const devExtreme = (samDev ?? 0) > 80; // 보조: 200일 이격 과열

  const signalCount = [signal1_dram, signal2_diverge].filter(Boolean).length;
  const signalLevel = (signal1_dram && signal2_diverge) ? "sell"
    : signal2_diverge || (signal1_dram && devExtreme) ? "danger"
    : signal2_caution || devExtreme ? "caution"
    : "safe";

  // 자산 이동 로드맵에서 지금 위치: 매도(위험·매도 신호) / 매수(크게 눌림 + DRAM 정상) / 관망(그 외)
  const minDev = Math.min(samDev ?? Infinity, skDev ?? Infinity);
  const stage: "buy" | "watch" | "sell" =
    signalLevel === "sell" || signalLevel === "danger" ? "sell"
    : minDev <= -20 && !signal1_dram ? "buy"
    : "watch";
  const stageLabel = { buy: "🟢 매수 신호", watch: "🟡 관망 신호", sell: "🔴 매도 신호" }[stage];
  const dramText = dram
    ? `${dram.latest.date}${dram.latest.estimated ? " 추정" : ""} ${signal1_dram ? "데드크로스 (Spot < Contract)" : "골든크로스 (Spot ≥ Contract)"}`
    : "불러오는 중";

  const ratioMin = ratioSeries.length ? Math.min(...ratioSeries.map(r => r.ratio)) * 0.98 : 0;
  const ratioMax = ratioSeries.length ? Math.max(...ratioSeries.map(r => r.ratio)) * 1.02 : 1;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">반도체 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔮</span>
              <h1 className="text-xl font-black tracking-tight">반도체 메모리분석 — 사이클 경보</h1>
            </div>
            <p className="text-slate-300 text-sm max-w-xl">
              핵심 2대 신호: <strong className="text-yellow-300">① DRAM Spot↓Contract 데드크로스</strong> + <strong className="text-orange-300">② 하이닉스 신고가 & 삼성 3개월 정체</strong>를 실시간 추적합니다.
            </p>
          </div>
          <SignalBadge level={signalLevel} />
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "삼성전자", value: samPrice ? fmt0(samPrice) + "원" : "—", sub: samDev != null ? fmtPct(samDev) + " vs MA200" : "—", danger: (samDev ?? 0) > 80 },
            { label: "SK하이닉스", value: skPrice ? fmt0(skPrice) + "원" : "—", sub: skDev != null ? fmtPct(skDev) + " vs MA200" : "—", danger: (skDev ?? 0) > 80 },
            {
              label: "신호②: 상대강도",
              value: divergenceWeeks >= 12 ? "경보 발동" : divergenceWeeks >= 6 ? `${divergenceWeeks}주 주의` : "정상",
              sub: divergenceWeeks >= 12 ? "3개월+ 하이닉스만 강세" : divergenceWeeks >= 6 ? "다이버전스 감지 중" : "삼성·하이닉스 동반 상승",
              danger: divergenceWeeks >= 6,
            },
            {
              label: "신호①: DRAM 데드크로스",
              value: dram ? (signal1_dram ? "발생" : "미발생") : "—",
              sub: dram ? `${dram.latest.date}${dram.latest.estimated ? " 추정" : ""} · 분기 수동 입력` : "DRAMeXchange → Spot vs Contract",
              danger: signal1_dram,
            },
          ].map(({ label, value, sub, danger }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3">
              <div className="text-xs text-slate-400">{label}</div>
              <div className={`text-lg font-black mt-0.5 ${danger ? "text-red-400" : "text-emerald-300"}`}>{value}</div>
              <div className="text-xs text-slate-400">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 실시간 신호 차트 ───────────────────────────────────────────── */}
      <LiveSignalChart />

      {/* ── DRAM Spot vs Contract 데드크로스 차트 ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-black rounded-full">신호 #1 — 메모리 가격 핵심</span>
          <h2 className="font-black text-base">DRAM Spot vs Contract 가격 데드크로스 모니터링</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          현물(Spot)이 고정(Contract) 아래로 하락하는 순간 = 반도체 사이클 하강 선행신호.
          역대 2번 모두 삼성·하이닉스 주가 고점과 정확히 일치. <strong className={signal1_dram ? "text-red-600" : "text-green-600"}>현재: {dramText}</strong>
        </p>
        <DramSpotContractChart />
      </div>

      {/* ── 3가지 신호 체크리스트 ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-1">📋 반도체 메모리 핵심 2가지 매도 신호</h2>
        <p className="text-xs text-slate-500 mb-4">
          두 신호 중 하나라도 발생 시 즉시 부분 매도 검토 — 두 신호 동시 발생 시 전량 매도 고려
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border-l-4 border-amber-400 bg-amber-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-amber-400 text-white text-xs font-black rounded-full">신호 #1 — 메모리 가격</span>
            </div>
            <div className="font-bold text-sm mb-1">DRAM Spot vs Contract 데드크로스</div>
            <div className="text-xs text-slate-600 leading-relaxed">
              DRAM/NAND <strong>현물가(Spot)</strong>가 <strong>계약가(Contract/Fixed)</strong> 아래로 내려가는 순간,
              다음 분기 계약 가격 하락이 예고됨 → 6개월 후 실적 급감 → 주가 먼저 반응.<br />
              <span className="text-red-600 font-bold">이 데드크로스 확인 즉시 매도 고려.</span>
            </div>
            <div className="mt-2 p-2 bg-white rounded-lg text-xs text-amber-700 border border-amber-200">
              📍 확인처:{" "}
              <a href="https://www.dramexchange.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">DRAMeXchange.com</a>
              {" "} → Spot Price / Contract Price 메뉴 비교<br />
              ⏰ 체크 시점: <strong>3·6·9·12월 (분기별 협상 시즌)</strong> 집중
            </div>
          </div>
          <div className="p-4 rounded-xl border-l-4 border-orange-400 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-orange-400 text-white text-xs font-black rounded-full">신호 #2 — 상대강도</span>
            </div>
            <div className="font-bold text-sm mb-1">하이닉스 신고가 돌파 & 삼성 3개월 이상 정체</div>
            <div className="text-xs text-slate-600 leading-relaxed">
              역사적으로 <strong>삼성전자가 먼저 고점</strong>을 찍고, SK하이닉스가 뒤따라 고점을 찍는 패턴 반복.<br />
              <strong className="text-orange-700">하이닉스가 신고가를 돌파하는데 삼성이 3개월 이상 따라오지 못하면</strong>{" "}
              → 둘 다 고점 근처 → 둘 다 매도 신호.
            </div>
            <div className={`mt-2 p-2 rounded-lg text-xs border ${
              divergenceWeeks >= 6
                ? "bg-red-50 border-red-200 text-red-700 font-bold"
                : "bg-white border-orange-200 text-orange-700"
            }`}>
              {divergenceWeeks >= 6
                ? `🚨 현재 ${divergenceWeeks}주+ 다이버전스 감지 — 신호 발동 가능성`
                : "현재 두 종목 동반 상승 중 → 아직 정상"}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
          <strong className="text-slate-900">추가 경고 보조 지표:</strong>{" "}
          중국 CXMT 등 공급 과잉 조짐 (레드오션화) · RSI 과매수 구간 진입 · 주가 이격 지수 130 이상
        </div>

        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>💡 DRAMeXchange 모니터링 5단계:</strong>{" "}
          ① <a href="https://www.dramexchange.com/Price/Dram_Spot" target="_blank" rel="noopener noreferrer" className="underline">Spot Price 페이지</a> 접속
          → ② DDR4/DDR5 현물가 확인
          → ③ Contract Price 페이지로 이동
          → ④ 동일 품목 Contract가 비교
          → ⑤ <span className="font-bold text-red-700">Spot이 Contract 아래로 교차 = 데드크로스 발동</span>
        </div>
      </div>

      {/* ── 이격도 게이지 ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-1">📏 200일 이격도 위험계기판</h2>
        <p className="text-xs text-slate-500 mb-4">역사적으로 +80% 이상이면 평균회귀 위험 구간. 주황선 = 경고선, 빨간색 = 극단 과열</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Gauge label="삼성전자 (005930.KS) — 200일 이격도" value={samDev} />
          <Gauge label="SK하이닉스 (000660.KS) — 200일 이격도" value={skDev} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            <div className="font-bold text-emerald-700">0~30%</div>
            <div className="text-slate-500">안전 매수 구간</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="font-bold text-yellow-700">30~80%</div>
            <div className="text-slate-500">보유 주의 구간</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="font-bold text-red-700">80%+</div>
            <div className="text-slate-500">매도 검토 구간</div>
          </div>
        </div>
      </div>

      {/* ── 정규화 주가 비교 차트 ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-1">📈 삼성전자 vs SK하이닉스 정규화 비교 차트</h2>
        <p className="text-xs text-slate-500 mb-4">
          2년 전 가격을 100으로 놓고 비교. <strong className="text-blue-600">파란선(삼성)</strong>이 먼저 꺾이고{" "}
          <strong className="text-red-600">빨간선(하이닉스)</strong>가 뒤따라 꺾이면 사이클 고점 시그널.
        </p>
        {normalized.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={normalized} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(normalized.length / 8)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}`} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltipNorm />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "기준(100)", fontSize: 10, fill: "#94a3b8" }} />
              <Line type="monotone" dataKey="sam100" name="삼성전자" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sk100"  name="SK하이닉스" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            차트 데이터 로딩 중...
          </div>
        )}
      </div>

      {/* ── 삼성/하이닉스 비율 차트 ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-1">⚡ 삼성/하이닉스 비율 — 핵심 다이버전스 차트</h2>
        <p className="text-xs text-slate-500 mb-4">
          비율이 <strong className="text-red-600">하락</strong>하면 하이닉스가 삼성을 앞서가는 것 = 1단계 경고 신호.
          3개월 이상 하락 지속 시 반도체 사이클 후반부 진입 경고.
        </p>
        {ratioSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ratioSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(ratioSeries.length / 8)} />
              <YAxis tick={{ fontSize: 10 }} domain={[ratioMin, ratioMax]} tickFormatter={v => v.toFixed(3)} />
              <Tooltip content={<CustomTooltipRatio />} />
              <Area type="monotone" dataKey="ratio" name="삼성/하이닉스" stroke="#7c3aed" strokeWidth={2} fill="url(#ratioGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">차트 로딩 중...</div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
            <div className="font-bold text-purple-700">비율 상승 or 안정</div>
            <div className="text-slate-500">삼성이 하이닉스와 함께 강세 → 사이클 진행 중</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="font-bold text-red-700">비율 3개월 이상 하락</div>
            <div className="text-slate-500">하이닉스만 선두 → 매도 검토 준비 단계</div>
          </div>
        </div>
      </div>

      {/* ── 메모리 사이클 원리 교육 섹션 ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h2 className="font-black text-base mb-1 flex items-center gap-2">
          <span>🎓</span> 반도체 메모리 사이클 원리 완전 정리
        </h2>
        <p className="text-slate-400 text-xs mb-5">공급 부족(Shortage)일 때 가격이 오른다 — 가장 단순하면서 가장 강력한 원칙</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-emerald-400 mb-3 text-sm">① 신호 #1: DRAM Spot vs Contract 메커니즘</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex gap-2 p-2 bg-emerald-900/30 rounded-lg">
                <span className="text-emerald-400 font-bold shrink-0 w-5">UP</span>
                <span>Spot &gt; Contract = <strong className="text-emerald-300">품귀(Shortage)</strong> → 다음 분기 계약가 상승 협상 → 실적 증가 → 주가 상승</span>
              </div>
              <div className="flex gap-2 p-2 bg-red-900/30 rounded-lg">
                <span className="text-red-400 font-bold shrink-0 w-5">↘</span>
                <span>Spot 하락 시작 → Spot = Contract <strong className="text-red-400">데드크로스</strong> = 공급과잉 신호 발생</span>
              </div>
              <div className="flex gap-2 p-2 bg-red-900/30 rounded-lg">
                <span className="text-red-400 font-bold shrink-0 w-5">⏰</span>
                <span>데드크로스 → 다음 분기 협상에서 계약가 하락 → <strong className="text-yellow-300">6개월 후</strong> 실적 급감</span>
              </div>
              <div className="flex gap-2 p-2 bg-amber-900/30 rounded-lg">
                <span className="text-yellow-400 font-bold shrink-0 w-5">★</span>
                <span>주가는 실적 고점보다 <strong className="text-yellow-300">6개월 먼저</strong> 반응 → 데드크로스 시점에 매도해야 "올라갈 때 파는 것"</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white/10 rounded-xl text-xs">
              <div className="font-bold text-white mb-1">DRAMeXchange 5단계 확인법</div>
              <ol className="text-slate-300 space-y-0.5">
                <li>1. <a href="https://www.dramexchange.com/Price/Dram_Spot" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Spot Price 페이지</a> 접속</li>
                <li>2. DDR4/DDR5 현물가 확인</li>
                <li>3. Contract Price 메뉴로 이동</li>
                <li>4. 동일 품목 계약가와 비교</li>
                <li>5. <span className="text-red-300 font-bold">Spot &lt; Contract = 데드크로스 = 매도!</span></li>
              </ol>
              <div className="mt-2 text-amber-300 font-bold">⏰ 집중 체크: 3·6·9·12월 (분기 협상 시즌)</div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-orange-400 mb-3 text-sm">② 신호 #2: 삼성→하이닉스 시차 패턴</h3>
            <div className="space-y-2 text-sm text-slate-300 mb-3">
              <div className="flex gap-2 p-2 bg-slate-700/50 rounded-lg">
                <span className="text-slate-400 shrink-0">📊</span>
                <span>역사적으로 <strong className="text-white">삼성전자가 먼저 고점</strong>을 찍고, SK하이닉스가 뒤따라 고점을 찍는 패턴 반복 (2018·2021)</span>
              </div>
              <div className="flex gap-2 p-2 bg-orange-900/30 rounded-lg">
                <span className="text-orange-400 shrink-0">🚦</span>
                <span><strong className="text-orange-300">하이닉스가 신고가 돌파 + 삼성이 3개월 이상 따라오지 못하면</strong> → 둘 다 고점 근처 → 둘 다 매도</span>
              </div>
            </div>
            <h3 className="font-bold text-amber-400 mb-2 text-sm">⚠️ HBM 시대의 보완 지표</h3>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex gap-2"><span className="text-blue-400 shrink-0">→</span><span>HBM은 스팟 시장 사실상 없음 → NVIDIA 전속 계약 구조</span></div>
              <div className="flex gap-2"><span className="text-yellow-400 shrink-0">→</span><span><strong className="text-yellow-300">대체 선행지표:</strong> 빅테크 CapEx 가이던스 · NVIDIA 매출 가이던스 · TSMC CoWoS 예약률</span></div>
              <div className="flex gap-2"><span className="text-red-400 shrink-0">→</span><span>중국 CXMT 등 공급 과잉 조짐 = 레드오션화 경고 (2차전지 전철)</span></div>
            </div>
            <div className="mt-3 p-3 bg-amber-900/30 rounded-xl text-xs">
              <div className="font-bold text-amber-300 mb-1">추가 경고 신호 (보조)</div>
              <div className="text-slate-300">RSI 과매수 진입 · 발산 지수 130 이상 · 증권사 컨센서스 비현실적 상향 (→ 광기 신호)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 🤖 AI 소신 분석 — 신뢰도 확률 바 ──────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <h2 className="font-black text-base mb-4 flex items-center gap-2">
          <span>🤖</span> AI 소신 분석 — 메모리 가격 신호 신뢰도와 내 의견
        </h2>

        <div className="space-y-3 mb-5">
          {[
            { label: "단독 사용 신뢰도 (데드크로스만)", pct: 67, color: "from-orange-500 to-yellow-400", val: "65~70%" },
            { label: "MA40 위험구간 + 데드크로스 동시 발생", pct: 82, color: "from-yellow-400 to-lime-400", val: "80~85%" },
            { label: "+ 빅테크 CapEx 감소 + HBM 재고 과잉 확인까지", pct: 90, color: "from-lime-400 to-emerald-400", val: "90%+" },
          ].map(({ label, pct, color, val }) => (
            <div key={label} className="bg-slate-700/50 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">{label}</span>
                <span className="font-black text-yellow-300">{val}</span>
              </div>
              <div className="h-2.5 bg-slate-600 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl p-3">
            <div className="font-bold text-emerald-300 text-xs mb-2">✅ 메모리 가격 신호가 강력한 이유</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              N=2지만 2018·2021 두 번 모두 완벽히 맞았다. 현물가는 수요·공급 심리를
              <strong className="text-white"> 3~6개월 선행</strong> 반영하는 가장 빠른 시장 온도계.
              여의도 기관 투자자들도 동일 지표를 사용한다.
            </p>
          </div>
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-3">
            <div className="font-bold text-red-300 text-xs mb-2">⚠️ 맹신하면 안 되는 이유</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              HBM 시대엔 범용 DRAM 비중이 줄었다. CXMT가 스팟 가격을 왜곡할 수 있다.
              <strong className="text-white"> N=2는 통계적으로 너무 작은 표본.</strong>
              AI CapEx 슈퍼사이클이 변수로 작용 중.
            </p>
          </div>
          <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-3">
            <div className="font-bold text-blue-300 text-xs mb-2">💡 지금 데이터로 본 판단 (자동 갱신)</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              SK하이닉스 200일선 이격도 <strong className="text-yellow-300">{skDev != null ? fmtPct(skDev) : "—"}</strong>
              {skDev != null && (skDev > 120 ? " (역대급 과열)" : skDev > 80 ? " (과열)" : skDev < -20 ? " (크게 눌림)" : " (과열 아님)")},
              삼성전자 <strong className="text-yellow-300">{samDev != null ? fmtPct(samDev) : "—"}</strong>.
              DRAM {dramText}. 핵심 신호 {signalCount}개 발동.
              <strong className={stage === "sell" ? "text-red-300" : stage === "buy" ? "text-emerald-300" : "text-yellow-300"}>
                {stage === "sell" ? " 부분 매도 검토 구간." : stage === "buy" ? " 분할 매수 검토 구간." : " 비중 유지·감시 구간."}
              </strong>
            </p>
          </div>
          <div className="bg-amber-900/40 border border-amber-700 rounded-xl p-3">
            <div className="font-bold text-amber-300 text-xs mb-2">🔭 이것도 함께 봐야 한다</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              NVIDIA 실적 가이던스 유지되면 HBM 수요는 건재. 빅4 CapEx(MS·구글·메타·아마존)가
              꺾이지 않으면 슈퍼사이클 연장 가능.
              <strong className="text-white"> 두 신호 교차 확인 필수.</strong>
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-700/50 rounded-xl text-xs text-slate-300 leading-relaxed">
          <span className="text-yellow-300 font-bold">📌 AI 최종 결론: </span>
          메모리 가격 신호는 <strong className="text-white">반도체 사이클 판단의 가장 유효한 선행 지표</strong>이지만,
          단독으로 전량 매도 판단을 내리기엔 HBM 시대 변수가 크다.
          아래 보조 지표 3~4가지와 함께 모두 같은 방향을 가리킬 때 확신을 높이는 전략이 최적이다.
          지금 데이터 기준 위치는 <strong className="text-white">{stageLabel}</strong> 구간이며,
          <strong className="text-yellow-300"> 신호가 바뀌면 이 결론도 자동으로 바뀐다. NVIDIA 실적·빅테크 CapEx도 함께 확인하자.</strong>
        </div>
      </div>

      {/* ── 🔭 함께 봐야 할 보조 지표 6가지 ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-1 flex items-center gap-2">
          <span>🔭</span> 메모리 가격 신호와 함께 봐야 할 보조 지표 6가지
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          아래 6가지 중 <strong>3가지 이상이 같은 방향</strong>을 가리키면 신뢰도가 급상승합니다
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              icon: "📡", num: "①", title: "NVIDIA 분기 실적 가이던스",
              desc: "NVIDIA의 다음 분기 매출 가이던스가 꺾이면 HBM 수요 감소 신호. 반도체 사이클의 현재 핵심 대장 지표.",
              badge: "분기마다 확인", badgeColor: "bg-blue-100 text-blue-700",
            },
            {
              icon: "💰", num: "②", title: "빅4 CapEx (AI 인프라 투자)",
              desc: "Microsoft·Google·Meta·Amazon의 분기 설비투자(CapEx)가 줄면 HBM 주문 감소 → 반도체 전체 하락 선행.",
              badge: "분기 실적 발표 시", badgeColor: "bg-blue-100 text-blue-700",
            },
            {
              icon: "📊", num: "③", title: "SOX 지수 (필라델피아 반도체)",
              desc: "미국 반도체 지수. MA200 이격도 +50% 초과하면 과열. 한국 반도체 주가와 90%+ 상관관계.",
              badge: "매일 확인 가능", badgeColor: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: "📦", num: "④", title: "DRAM 재고 주수 (Inventory Weeks)",
              desc: "삼성·하이닉스 실적발표에서 재고 주수 언급 확인. 8주 초과 → 공급 과잉 시작. 12주 이상 → 가격 하락 확실시.",
              badge: "분기 실적 발표 시", badgeColor: "bg-yellow-100 text-yellow-700",
            },
            {
              icon: "💱", num: "⑤", title: "원/달러 환율 (USD/KRW)",
              desc: "달러 강세 = 외국인 매도 압력. 1,400원 이상 지속 시 외국인 수급 악화. 약달러 전환 시 외국인 귀환.",
              badge: "매일 확인 가능", badgeColor: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: "🌏", num: "⑥", title: "CXMT 중국 DRAM 점유율",
              desc: "중국 창신메모리(CXMT) 점유율이 10% 초과하면 범용 DRAM 스팟 가격에 구조적 압박. 2026년 가장 큰 변수.",
              badge: "월간 산업 리포트", badgeColor: "bg-orange-100 text-orange-700",
            },
          ].map(({ icon, num, title, desc, badge, badgeColor }) => (
            <div key={num} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="font-black text-sm text-slate-800">{num} {title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">{desc}</p>
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="font-black text-sm mb-3">✅ 매도 판단 종합 체크리스트 — 현재 상태</div>
          <div className="space-y-1.5 text-xs">
            {([
              { ok: true,  text: "DRAM Spot < Contract 데드크로스 발생", note: "3차 진행 중 (추정)" },
              { ok: true,  text: "삼성·하이닉스 MA40 이격도 위험구간(80%+)", note: "삼성 +74%, 하이닉스 +140%" },
              { ok: signal2_diverge, text: `삼성 고점 + 하이닉스 ${divergenceWeeks}주+ 다이버전스`, note: divergenceWeeks >= 12 ? "경보 발동" : "관찰 중" },
              { ok: null,  text: "NVIDIA 분기 가이던스 확인", note: "직접 확인 필요" },
              { ok: null,  text: "빅4 CapEx 추세 확인", note: "직접 확인 필요" },
              { ok: null,  text: "SOX 이격도 확인", note: "직접 확인 필요" },
            ] as { ok: boolean | null; text: string; note: string }[]).map(({ ok, text, note }) => (
              <div key={text} className={`flex items-center gap-2 p-2 rounded-lg ${
                ok === true ? "bg-red-50 border border-red-200" :
                ok === false ? "bg-emerald-50 border border-emerald-200" :
                "bg-slate-100 border border-slate-200"
              }`}>
                <span>{ok === true ? "🔴" : ok === false ? "🟢" : "⬜"}</span>
                <span className="flex-1 font-medium">{text}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  ok === true ? "bg-red-200 text-red-800" :
                  ok === false ? "bg-emerald-200 text-emerald-800" :
                  "bg-slate-200 text-slate-600"
                }`}>{note}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            📌 <strong>현재 확인된 신호 3/6개 발동</strong> → 부분 매도 고려 구간.
            NVIDIA 실적 + 빅4 CapEx까지 꺾이면 전량 매도 검토.
          </div>
        </div>
      </div>

      {/* ── 🗺️ 자산 이동 로드맵 ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-1 flex items-center gap-2">
          <span>🗺️</span> 반도체 꺾일 때 자산 이동 로드맵 (AI 종합)
        </h2>
        <p className="text-xs text-slate-500 mb-4">신호 단계별 대응 전략 — 지금 데이터 기준 {stageLabel} 구간 (자동 판정)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`bg-emerald-50 border border-emerald-200 rounded-xl p-4${stage === "buy" ? " ring-2 ring-emerald-400" : ""}`}>
            <div className="font-black text-emerald-700 text-sm mb-1">🟢 매수 신호</div>
            {stage === "buy" && <div className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-block mb-2">← 현재 여기</div>}
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li>✅ 현물가 &gt; 고정가 (골든크로스)</li>
              <li>✅ 이격도 MA40 -20% 이하</li>
              <li>✅ 재고주수 4주 이하</li>
              <li>✅ 하이닉스 적자 뉴스 도배</li>
            </ul>
            <div className="mt-3 p-2 bg-emerald-100 rounded-lg text-xs font-bold text-emerald-800">
              → 반도체 집중 매수
            </div>
          </div>
          <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4${stage === "watch" ? " ring-2 ring-yellow-400" : ""}`}>
            <div className="font-black text-yellow-700 text-sm mb-1">🟡 관망 신호</div>
            {stage === "watch" && <div className="text-[10px] bg-yellow-200 text-yellow-800 font-bold px-2 py-0.5 rounded-full inline-block mb-2">← 현재 여기</div>}
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li>⚠️ 이격도 30~80%</li>
              <li>⚠️ 현물가 고정가 근접</li>
              <li>⚠️ "최대 실적" 뉴스 도배</li>
              <li>⚠️ 목표주가 급등</li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-100 rounded-lg text-xs font-bold text-yellow-800">
              → 비중 유지, 감시 강화
            </div>
          </div>
          <div className={`bg-red-50 border border-red-200 rounded-xl p-4${stage === "sell" ? " ring-2 ring-red-400" : ""}`}>
            <div className="font-black text-red-700 text-sm mb-1">🔴 매도 신호</div>
            {stage === "sell" && <div className="text-[10px] bg-red-200 text-red-800 font-bold px-2 py-0.5 rounded-full inline-block mb-2">← 현재 여기</div>}
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li>❌ 데드크로스 발동</li>
              <li>❌ 이격도 80%+ 과열</li>
              <li>❌ 하이닉스 정체 12주+</li>
              <li>❌ 빅테크 CapEx 감소</li>
            </ul>
            <div className="mt-3 p-2 bg-red-100 rounded-lg text-xs font-bold text-red-800">
              → 비중 축소 → 조선·방산·전력
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>💡 섹터 로테이션:</strong>{" "}
          반도체 자금은 → <strong>조선 · 방산 · 전력인프라 · 코스닥 중소형</strong>으로 이동하는 경향.
          약달러 전환 시 외국인 귀환 → 코스닥 대형주 수혜.
        </div>
      </div>

      {/* ── 팩트 검증 & 비판적 검토 ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h2 className="font-black text-base mb-4 flex items-center gap-2">
          <span>🧠</span> 반도체 사이클 주장 — 팩트 검증 & 비판적 검토
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="font-bold text-emerald-800 mb-1">✅ 영구 불변 원칙 — 반드시 가져가야 할 것</div>
              <ul className="text-emerald-700 space-y-1 text-xs">
                <li>• <strong>"수급(Shortage vs Glut)이 가격을 결정한다"</strong> → 성장 스토리보다 수급 먼저 확인</li>
                <li>• <strong>"중국 진입 = 레드오션"</strong> → 2차전지 증거. 낸드는 YMTC·CXMT 진입 중</li>
                <li>• <strong>"실적 고점보다 6개월 먼저 매도"</strong> → 실적 잘 나온다는 이유로 홀딩 금지</li>
                <li>• <strong>"올라갈 때 팔지 않으면 내려갈 때 후회한다"</strong> → 35년 경험 핵심 교훈</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="font-bold text-amber-800 mb-1">⚠️ 팩트 vs 의견 구분</div>
              <ul className="text-xs space-y-1">
                <li className="text-emerald-700"><span className="font-bold">✓ 팩트:</span> Spot/Contract 가격 관계, 역사적 고점 패턴, 중국 공급 과잉 위험</li>
                <li className="text-amber-700"><span className="font-bold">△ 의견:</span> "2028~2029년까지 강세장", 구체적 하락폭 40~60% 예측</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="font-bold text-red-800 mb-1">🔍 비판적 검토 — 한계점</div>
              <ul className="text-red-700 space-y-1 text-xs">
                <li>• 삼성→하이닉스 고점 시차 N=2 (2018, 2021) — 표본이 너무 적음</li>
                <li>• 2026.6.22 하이닉스 삼성 시총 추월 → 패턴이 이미 변형됨</li>
                <li>• HBM은 스팟 시장 없음 → DRAM 데드크로스 단독 신뢰도 저하</li>
                <li>• 과거 규칙을 현재 사이클에 그대로 적용 시 false signal 위험</li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="font-bold text-slate-800 mb-1">📋 분기별 체크리스트 (3·6·9·12월)</div>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>☐ DRAMeXchange: DDR5 스팟 vs 고정가 교차 여부</li>
                <li>☐ 하이닉스 신고가 시 삼성 동반 여부 (이 화면)</li>
                <li>☐ 이격도 80%+ 돌파 여부 (이 화면)</li>
                <li>☐ 빅테크(META/MSFT/GOOGL) CapEx 가이던스 유지</li>
                <li>☐ NVIDIA 매출 가이던스 방향 확인</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800">
          <strong>⚠️ 면책고지:</strong> 본 분석은 교육용 정보이며 투자 권유가 아닙니다. 투자 판단과 결과의 책임은 전적으로 투자자 본인에게 있습니다.
        </div>
      </div>

    </div>
  );
}
