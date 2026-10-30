import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend, Scatter,
} from "recharts";
import { useSemiSignal, type SignalPoint } from "@/hooks/useSemiSignal";

/* ─── 공통 ────────────────────────────────────────────────────────────── */
type SigLevel = "safe" | "caution" | "danger" | "sell";

const SIG = {
  safe:    { label: "🟢 보유 신호",      bg: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-700", light: "#10b981" },
  caution: { label: "🟡 주의 신호",      bg: "bg-yellow-400",  ring: "ring-yellow-300",  text: "text-yellow-700", light: "#facc15" },
  danger:  { label: "🔴 위험 신호",      bg: "bg-orange-500",  ring: "ring-orange-400",  text: "text-orange-700", light: "#f97316" },
  sell:    { label: "💀 매도 신호 발동!", bg: "bg-red-600 animate-pulse", ring: "ring-red-500", text: "text-red-700", light: "#dc2626" },
};

function fmtK(v: number) {
  return v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v);
}
function fmtPct(v: number | null) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

/* ─── 신호등 배지 ─────────────────────────────────────────────────────── */
function SignalLight({ level, size = "md" }: { level: SigLevel; size?: "sm" | "md" | "lg" }) {
  const s = SIG[level];
  const sz = { sm: "w-3 h-3", md: "w-5 h-5", lg: "w-7 h-7" }[size];
  return (
    <span className={`inline-flex items-center gap-1.5`}>
      <span className={`${sz} rounded-full ${s.bg} ring-2 ${s.ring} shadow-lg`} />
      <span className="font-black text-sm">{s.label}</span>
    </span>
  );
}

/* ─── 이격도 게이지 ───────────────────────────────────────────────────── */
function DevGauge({ label, dev, trend }: { label: string; dev: number | null; trend: number }) {
  if (dev == null) return null;
  const pct = Math.min(Math.max(((dev + 50) / 270) * 100, 0), 100);
  const color = dev >= 120 ? "#dc2626" : dev >= 80 ? "#f97316" : dev >= 30 ? "#eab308" : "#10b981";
  const sig: SigLevel = dev >= 120 ? "sell" : dev >= 80 ? "danger" : dev >= 30 ? "caution" : "safe";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color }}>{fmtPct(dev)}</span>
          <span className={`text-[10px] ${trend > 0 ? "text-red-500" : "text-emerald-600"}`}>
            {trend > 0 ? `▲${trend.toFixed(1)}%` : `▼${Math.abs(trend).toFixed(1)}%`} (8주)
          </span>
          <SignalLight level={sig} size="sm" />
        </div>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-emerald-100 via-yellow-100 to-red-100 rounded-full overflow-hidden border border-slate-200">
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, opacity: 0.85 }} />
        <div className="absolute top-0 h-full w-px bg-yellow-500 opacity-70" style={{ left: "29.6%" }} />
        <div className="absolute top-0 h-full w-px bg-orange-500 opacity-70" style={{ left: "48.1%" }} />
        <div className="absolute top-0 h-full w-px bg-red-600 opacity-70" style={{ left: "63%" }} />
      </div>
      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
        <span>-50%</span><span className="text-yellow-600">+30%</span>
        <span className="text-orange-600">+80%</span><span className="text-red-600">+120%</span><span>+220%</span>
      </div>
    </div>
  );
}

/* ─── 커스텀 툴팁 ─────────────────────────────────────────────────────── */
const PriceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cross = payload[0]?.payload?.crossType;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[160px]">
      <p className="font-black text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => p.value != null && (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-mono font-bold">{p.value?.toLocaleString("ko-KR")}</span>
        </p>
      ))}
      {cross && (
        <div className={`mt-2 px-2 py-1 rounded font-black text-center text-[11px] ${cross === "dead" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          {cross === "dead" ? "🔴 데드크로스 발생" : "🟢 골든크로스 발생"}
        </div>
      )}
    </div>
  );
};

const DevTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const dev = payload[0]?.value;
  const sig: SigLevel = dev >= 120 ? "sell" : dev >= 80 ? "danger" : dev >= 30 ? "caution" : "safe";
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-black text-slate-700 mb-1">{label}</p>
      <p className={`font-bold ${SIG[sig].text}`}>{SIG[sig].label}</p>
      <p className="font-mono text-slate-600">이격도: {fmtPct(dev)}</p>
    </div>
  );
};

/* ─── 주가 + MA40 복합 차트 ───────────────────────────────────────────── */
function PriceMAChart({ series, label, color }: { series: SignalPoint[]; label: string; color: string }) {
  const data = series.slice(-60).map(p => ({
    date: p.date.slice(5),
    주가: p.close,
    MA40: p.ma40,
    crossType: (p as any).crossType,
  }));

  const yMin = Math.min(...data.map(d => Math.min(d.주가, d.MA40 ?? d.주가))) * 0.94;
  const yMax = Math.max(...data.map(d => Math.max(d.주가, d.MA40 ?? d.주가))) * 1.04;

  // Find dead/golden cross points for scatter
  const deadCrosses = data.filter(d => d.crossType === "dead");
  const goldenCrosses = data.filter(d => d.crossType === "golden");

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(data.length / 7)} />
        <YAxis tick={{ fontSize: 9 }} tickFormatter={fmtK} domain={[yMin, yMax]} width={50} />
        <Tooltip content={<PriceTooltip />} />
        <Line type="monotone" dataKey="주가" stroke={color} strokeWidth={2} dot={false} name="주가" />
        <Line type="monotone" dataKey="MA40" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="MA40(200일)" />
        {/* Dead cross markers */}
        {deadCrosses.map((d, i) => (
          <ReferenceLine key={`dead-${i}`} x={d.date} stroke="#dc2626" strokeDasharray="4 2" label={{ value: "💀", position: "top", fontSize: 12 }} />
        ))}
        {goldenCrosses.map((d, i) => (
          <ReferenceLine key={`golden-${i}`} x={d.date} stroke="#10b981" strokeDasharray="4 2" label={{ value: "⭐", position: "top", fontSize: 12 }} />
        ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─── 이격도 히스토리 차트 ────────────────────────────────────────────── */
function DevHistoryChart({ series, label, color }: { series: SignalPoint[]; label: string; color: string }) {
  const data = series.slice(-60).map(p => ({
    date: p.date.slice(5),
    이격도: p.dev,
  }));

  return (
    <ResponsiveContainer width="100%" height={150}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(data.length / 7)} />
        <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} width={40} />
        <Tooltip content={<DevTooltip />} />
        {/* Colored zone backgrounds */}
        <ReferenceArea y1={0}   y2={30}  fill="#d1fae5" fillOpacity={0.4} />
        <ReferenceArea y1={30}  y2={80}  fill="#fef9c3" fillOpacity={0.5} />
        <ReferenceArea y1={80}  y2={120} fill="#fed7aa" fillOpacity={0.5} />
        <ReferenceArea y1={120} y2={250} fill="#fee2e2" fillOpacity={0.6} />
        {/* Reference lines */}
        <ReferenceLine y={0}   stroke="#10b981" strokeDasharray="4 2" label={{ value: "0%",    position: "right", fontSize: 9, fill: "#10b981" }} />
        <ReferenceLine y={30}  stroke="#eab308" strokeDasharray="4 2" label={{ value: "+30%",  position: "right", fontSize: 9, fill: "#eab308" }} />
        <ReferenceLine y={80}  stroke="#f97316" strokeWidth={1.5}     label={{ value: "+80%",  position: "right", fontSize: 9, fill: "#f97316" }} />
        <ReferenceLine y={120} stroke="#dc2626" strokeWidth={1.5}     label={{ value: "+120%", position: "right", fontSize: 9, fill: "#dc2626" }} />
        <Area type="monotone" dataKey="이격도" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─── 신호 카드 ───────────────────────────────────────────────────────── */
function SignalCard({ label, dev, trend, price, ma40, color }:
  { label: string; dev: number | null; trend: number; price: number; ma40: number | null; color: string }) {
  const sig: SigLevel = (dev ?? 0) >= 120 ? "sell" : (dev ?? 0) >= 80 ? "danger" : (dev ?? 0) >= 30 ? "caution" : "safe";
  const vs = [
    { th: "💀 매도", range: "120%+", active: (dev ?? 0) >= 120 },
    { th: "🔴 위험", range: "80~120%", active: (dev ?? 0) >= 80 && (dev ?? 0) < 120 },
    { th: "🟡 주의", range: "30~80%", active: (dev ?? 0) >= 30 && (dev ?? 0) < 80 },
    { th: "🟢 보유", range: "0~30%", active: (dev ?? 0) < 30 },
  ];
  return (
    <div className={`rounded-2xl border-2 p-4 space-y-3 ${sig === "sell" ? "border-red-400 bg-red-50" : sig === "danger" ? "border-orange-300 bg-orange-50" : sig === "caution" ? "border-yellow-300 bg-yellow-50" : "border-emerald-300 bg-emerald-50"}`}>
      <div className="flex items-center justify-between">
        <div className="font-black text-sm" style={{ color }}>{label}</div>
        <SignalLight level={sig} size="sm" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-500">현재가</div>
          <div className="font-black text-slate-800">{price.toLocaleString("ko-KR")}원</div>
        </div>
        <div>
          <div className="text-slate-500">MA40 (200일)</div>
          <div className="font-mono text-slate-600">{ma40 ? ma40.toLocaleString("ko-KR") : "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">이격도</div>
          <div className={`font-black ${sig === "sell" ? "text-red-700" : sig === "danger" ? "text-orange-700" : sig === "caution" ? "text-yellow-700" : "text-emerald-700"}`}>{fmtPct(dev)}</div>
        </div>
        <div>
          <div className="text-slate-500">8주 추세</div>
          <div className={`font-bold ${trend > 5 ? "text-red-600" : trend > 0 ? "text-orange-500" : "text-emerald-600"}`}>
            {trend > 0 ? `▲${trend.toFixed(1)}%` : `▼${Math.abs(trend).toFixed(1)}%`}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {vs.map(v => (
          <div key={v.th} className={`flex justify-between items-center px-2 py-0.5 rounded text-[10px] font-medium ${v.active ? "bg-slate-800 text-white" : "text-slate-400"}`}>
            <span>{v.th}</span><span>{v.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 메인 컴포넌트 ───────────────────────────────────────────────────── */
export function LiveSignalChart() {
  const { data, loading, error, refetch } = useSemiSignal();
  const [activeStock, setActiveStock] = useState<"both" | "sam" | "sk">("both");

  const sig = (data?.compositeSignal ?? "safe") as SigLevel;
  const samDev = data?.sam.last?.dev ?? null;
  const skDev  = data?.sk.last?.dev ?? null;
  const samPrice = data?.sam.last?.close ?? 0;
  const skPrice  = data?.sk.last?.close ?? 0;
  const samMA40  = data?.sam.last?.ma40 ?? null;
  const skMA40   = data?.sk.last?.ma40 ?? null;
  const samTrend = data?.sam.devTrend ?? 0;
  const skTrend  = data?.sk.devTrend ?? 0;
  const diverge  = data?.divergenceWeeks ?? 0;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">신호 차트 데이터 로딩 중... (30초 소요)</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-bold mb-2">데이터 로드 실패</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">재시도</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── 종합 신호 상단 배너 ─────────────────────────────────── */}
      <div className={`rounded-2xl p-5 text-white ${
        sig === "sell"    ? "bg-gradient-to-r from-red-800 to-red-600" :
        sig === "danger"  ? "bg-gradient-to-r from-orange-700 to-orange-500" :
        sig === "caution" ? "bg-gradient-to-r from-yellow-600 to-yellow-400" :
                            "bg-gradient-to-r from-emerald-700 to-emerald-500"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold opacity-80 mb-1">📡 실시간 통합 신호 (5분마다 갱신)</div>
            <div className="text-2xl font-black">{SIG[sig].label}</div>
            <div className="text-sm opacity-80 mt-1">
              삼성 이격도 {fmtPct(samDev)} · 하이닉스 이격도 {fmtPct(skDev)} ·{" "}
              다이버전스 {diverge > 0 ? `${diverge}주+` : "없음"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            {[
              { label: "삼성 vs MA40", val: fmtPct(samDev), danger: (samDev ?? 0) > 80 },
              { label: "하이닉스 vs MA40", val: fmtPct(skDev), danger: (skDev ?? 0) > 80 },
              { label: "데드크로스", val: (samDev ?? 0) < 0 || (skDev ?? 0) < 0 ? "발생" : "없음", danger: (samDev ?? 0) < 0 || (skDev ?? 0) < 0 },
              { label: "다이버전스", val: diverge > 0 ? `${diverge}주+` : "정상", danger: diverge >= 6 },
            ].map(({ label, val, danger }) => (
              <div key={label} className="bg-white/15 rounded-xl px-3 py-2">
                <div className="text-[10px] opacity-70">{label}</div>
                <div className={`font-black ${danger ? "text-yellow-200" : "text-white"}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 신호 설명 카드 ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data && (
          <>
            <SignalCard label="삼성전자 (005930.KS)" dev={samDev} trend={samTrend} price={samPrice} ma40={samMA40} color="#2563eb" />
            <SignalCard label="SK하이닉스 (000660.KS)" dev={skDev} trend={skTrend} price={skPrice} ma40={skMA40} color="#dc2626" />
          </>
        )}
      </div>

      {/* ── 이격도 게이지 ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm space-y-4">
        <h3 className="font-black text-sm">📏 실시간 이격도 게이지 (주가 vs 40주 이동평균)</h3>
        <DevGauge label="삼성전자 이격도" dev={samDev} trend={samTrend} />
        <DevGauge label="SK하이닉스 이격도" dev={skDev} trend={skTrend} />
        <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-medium pt-1">
          {[
            { zone: "🟢 보유", range: "0~30%", cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { zone: "🟡 주의", range: "30~80%", cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { zone: "🔴 위험", range: "80~120%", cls: "bg-orange-50 border-orange-200 text-orange-700" },
            { zone: "💀 매도", range: "120%+", cls: "bg-red-50 border-red-200 text-red-700" },
          ].map(z => (
            <div key={z.zone} className={`border rounded-lg p-1.5 ${z.cls}`}>
              <div className="font-bold">{z.zone}</div>
              <div className="opacity-70">{z.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 주가 + MA40 차트 ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-sm">📈 주가 vs 40주 이동평균 (MA40 ≈ MA200일)</h3>
            <p className="text-xs text-slate-400">💀 데드크로스 = 주가가 MA40 아래로 이탈 · ⭐ 골든크로스 = 주가가 MA40 위로 복귀</p>
          </div>
          <div className="flex gap-1 text-[10px]">
            {(["both", "sam", "sk"] as const).map(k => (
              <button key={k} onClick={() => setActiveStock(k)}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${activeStock === k ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"}`}>
                {k === "both" ? "둘다" : k === "sam" ? "삼성" : "하이닉스"}
              </button>
            ))}
          </div>
        </div>
        {data && (
          <div className="space-y-4">
            {(activeStock === "both" || activeStock === "sam") && (
              <div>
                <div className="text-xs font-bold text-blue-600 mb-1">삼성전자</div>
                <PriceMAChart series={data.sam.series} label="삼성전자" color="#2563eb" />
              </div>
            )}
            {(activeStock === "both" || activeStock === "sk") && (
              <div>
                <div className="text-xs font-bold text-red-600 mb-1">SK하이닉스</div>
                <PriceMAChart series={data.sk.series} label="SK하이닉스" color="#dc2626" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 이격도 히스토리 차트 ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h3 className="font-black text-sm mb-1">📊 이격도 히스토리 차트 (색상 구간 = 신호 구간)</h3>
        <p className="text-xs text-slate-400 mb-4">초록=보유 · 노랑=주의 · 주황=위험 · 빨강=매도 구간</p>
        {data && (
          <div className="space-y-4">
            {(activeStock === "both" || activeStock === "sam") && (
              <div>
                <div className="text-xs font-bold text-blue-600 mb-1">삼성전자 이격도</div>
                <DevHistoryChart series={data.sam.series} label="삼성전자" color="#2563eb" />
              </div>
            )}
            {(activeStock === "both" || activeStock === "sk") && (
              <div>
                <div className="text-xs font-bold text-red-600 mb-1">SK하이닉스 이격도</div>
                <DevHistoryChart series={data.sk.series} label="SK하이닉스" color="#dc2626" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 신호 범례 ─────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <h3 className="font-black text-sm mb-3">📖 신호 해석 가이드</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <div className="font-bold text-slate-700">📏 이격도 기준 (주가 vs 40주 MA)</div>
            <div className="flex items-start gap-2"><span>🟢</span><span><strong>0~30%:</strong> 정상 — 매수 or 보유 구간. 반등 가능성 높음</span></div>
            <div className="flex items-start gap-2"><span>🟡</span><span><strong>30~80%:</strong> 주의 — 보유하되 추가 매수 자제. 이격 확대 중</span></div>
            <div className="flex items-start gap-2"><span>🔴</span><span><strong>80~120%:</strong> 위험 — 분할 매도 시작. 역사적 과열 구간</span></div>
            <div className="flex items-start gap-2"><span>💀</span><span><strong>120%+:</strong> 매도 — 즉시 매도 검토. 극단적 과열</span></div>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-slate-700">🔀 크로스 신호</div>
            <div className="flex items-start gap-2"><span>💀</span><span><strong>데드크로스:</strong> 주가가 MA40 아래로 이탈 → 하락 추세 전환 신호</span></div>
            <div className="flex items-start gap-2"><span>⭐</span><span><strong>골든크로스:</strong> 주가가 MA40 위로 복귀 → 상승 추세 복귀 신호</span></div>
            <div className="flex items-start gap-2"><span>⚡</span><span><strong>다이버전스:</strong> 하이닉스 강세 & 삼성 정체 3개월+ → 고점 근접 경고</span></div>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <strong>⚠️ 핵심:</strong> 이 신호들은 DRAM Spot/Contract 데드크로스의 <em>주가 선행 반응</em>을 추적합니다
            </div>
          </div>
        </div>
        {data?.updatedAt && (
          <p className="mt-3 text-[10px] text-slate-400 text-right">
            마지막 갱신: {new Date(data.updatedAt).toLocaleString("ko-KR")} · 5분마다 자동갱신
          </p>
        )}
      </div>
    </div>
  );
}
