import { useState, useEffect } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area,
} from "recharts";

interface DramPoint {
  date: string;
  spot: number;
  contract: number;
  spread: number;
  status: "healthy" | "danger";
  crossType: "dead" | "golden" | null;
  estimated?: boolean;
  deadCross?: boolean;
}

interface SamStock { date: string; close: number; }

interface DramData {
  series: DramPoint[];
  samStock: SamStock[];
  latest: DramPoint;
  currentStatus: string;
  lastDeadCross: string | null;
  note: string;
  updatedAt: string;
  cached: boolean;
}

/* ── 커스텀 툴팁 ─────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const spot     = payload.find((p: any) => p.dataKey === "spot");
  const contract = payload.find((p: any) => p.dataKey === "contract");
  const sam      = payload.find((p: any) => p.dataKey === "samClose");
  const pt: DramPoint | undefined = payload[0]?.payload;
  const isDead   = pt?.crossType === "dead";
  const isGolden = pt?.crossType === "golden";

  return (
    <div className="bg-white border border-border/40 rounded-xl shadow-xl p-3 text-xs min-w-[180px]">
      <div className="font-black text-sm mb-2">{label}{pt?.estimated ? " ⚙️ 추정치" : ""}</div>
      {spot     && <div className="flex justify-between gap-4"><span className="text-red-500 font-bold">🔴 현물(Spot)</span><span className="font-mono">${spot.value?.toFixed(2)}</span></div>}
      {contract && <div className="flex justify-between gap-4"><span className="text-emerald-600 font-bold">🟢 고정(Contract)</span><span className="font-mono">${contract.value?.toFixed(2)}</span></div>}
      {spot && contract && (
        <div className={`flex justify-between gap-4 mt-1 pt-1 border-t font-bold ${(spot.value??0) < (contract.value??0) ? "text-red-600" : "text-emerald-600"}`}>
          <span>스프레드</span>
          <span className="font-mono">${((spot.value??0) - (contract.value??0)).toFixed(2)}</span>
        </div>
      )}
      {sam && <div className="flex justify-between gap-4 mt-1 pt-1 border-t text-blue-600 font-bold"><span>삼성전자</span><span className="font-mono">₩{Math.round(sam.value??0).toLocaleString()}</span></div>}
      {isDead   && <div className="mt-2 text-red-700 font-black bg-red-50 rounded px-2 py-1">💀 데드크로스 발생!</div>}
      {isGolden && <div className="mt-2 text-emerald-700 font-black bg-emerald-50 rounded px-2 py-1">⭐ 골든크로스 발생!</div>}
    </div>
  );
}

export function DramSpotContractChart() {
  const [data, setData] = useState<DramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSam, setShowSam] = useState(true);

  useEffect(() => {
    fetch("/api/stocks/dram-history")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-border/30 p-8 text-center text-slate-400 text-sm shadow-sm">
      📡 DRAM 가격 데이터 로딩 중...
    </div>
  );
  if (error || !data) return (
    <div className="bg-red-50 rounded-2xl border border-red-200 p-5 text-red-600 text-sm shadow-sm">
      ⚠️ 데이터 로딩 실패: {error}
    </div>
  );

  // Merge samStock into series by date key
  const samMap = new Map(data.samStock.map(s => [s.date, s.close]));

  // Compute max samsung for secondary axis scaling
  const samMax  = Math.max(...data.samStock.map(s => s.close));
  const dramMax = Math.max(...data.series.map(d => Math.max(d.spot, d.contract)));
  const samScale = dramMax / samMax; // scale sam to fit dram axis

  const chartData = data.series.map(d => ({
    ...d,
    samClose: samMap.has(d.date) ? (samMap.get(d.date)! * samScale) : undefined,
    samRaw:   samMap.get(d.date) ?? null,
    // estimated 구간만 spotEst에 값, 확정 구간은 null (점선 표현)
    spotEst:  d.estimated ? d.spot : null,
  }));

  const deadCrossPoints = data.series.filter(d => d.crossType === "dead");
  const currentDead = data.currentStatus === "danger";
  const latestEst   = data.series.findIndex(d => d.estimated);
  const splitDate   = latestEst > 0 ? data.series[latestEst].date : null;

  return (
    <div className="space-y-4">

      {/* ── 현재 상태 배너 ─────────────────────────────────────────── */}
      <div className={`rounded-2xl p-4 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3
        ${currentDead
          ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-400"
          : "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-400"}`}>
        <div>
          <div className={`text-lg font-black ${currentDead ? "text-red-700" : "text-emerald-700"}`}>
            {currentDead ? "💀 DRAM 데드크로스 — 위험 신호 진행 중" : "✅ DRAM 정상 — Spot ≥ Contract"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            최신 ({data.latest.date}{data.latest.estimated ? " 추정" : ""})&nbsp;·&nbsp;
            Spot <span className="font-bold text-red-600">${data.latest.spot.toFixed(2)}</span>
            &nbsp;vs&nbsp;
            Contract <span className="font-bold text-emerald-700">${data.latest.contract.toFixed(2)}</span>
            &nbsp;·&nbsp;스프레드 <span className={`font-bold ${currentDead ? "text-red-600" : "text-emerald-600"}`}>
              ${(data.latest.spot - data.latest.contract).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="font-bold text-slate-700">데드크로스 이력</div>
          {deadCrossPoints.map(p => (
            <div key={p.date} className="text-red-600 font-mono">
              💀 {p.date}{p.estimated ? " (추정)" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* ── 차트 ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
          <div>
            <h3 className="font-black text-base">
              📊 DRAM Spot vs Contract 가격 — 역사적 데드크로스 & 현재 상태
            </h3>
            <p className="text-xs text-slate-500">DDR4 8Gb (1Gx8) 분기 평균 | 단위: USD | 출처: TrendForce/DRAMeXchange 공개 리포트 | <span className="text-green-600 font-bold">현재 2026-Q2: 골든크로스 ✅</span></p>
          </div>
          <button
            onClick={() => setShowSam(v => !v)}
            className={`text-xs px-3 py-1 rounded-full border font-bold transition-all
              ${showSam ? "bg-blue-500 text-white border-blue-500" : "bg-white text-blue-600 border-blue-300"}`}>
            {showSam ? "📈 삼성 주가 숨기기" : "📈 삼성 주가 보기"}
          </button>
        </div>

        {/* 구간 범례 */}
        <div className="flex gap-3 flex-wrap mb-3 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"/> Spot {">"} Contract (정상)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"/> Spot {"<"} Contract (데드크로스 ⚠️)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block w-5"/> 2025~ 추정치</span>
          {showSam && <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-blue-400 inline-block w-5"/> 삼성전자 주가 (우축 스케일)</span>}
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            {/* 데드크로스 수직선 */}
            {deadCrossPoints.map(p => (
              <ReferenceLine
                key={p.date}
                x={p.date}
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{ value: "💀 데드크로스", position: "insideTopLeft", fontSize: 9, fill: "#dc2626" }}
              />
            ))}

            {/* 추정 구간 시작선 */}
            {splitDate && (
              <ReferenceLine
                x={splitDate}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="6 3"
                label={{ value: "← 실데이터 | 추정→", position: "center", fontSize: 9, fill: "#94a3b8" }}
              />
            )}

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={v => `$${v.toFixed(1)}`}
              domain={[0, "auto"]}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => {
                if (value === "spot") return "🔴 현물가(Spot)";
                if (value === "contract") return "🟢 고정가(Contract)";
                if (value === "samClose") return "🔵 삼성전자 주가 (스케일)";
                return value;
              }}
            />

            {/* Spot vs Contract 사이 채우기 */}
            <Area
              dataKey="contract"
              stroke="none"
              fill="#dcfce7"
              fillOpacity={0.4}
              type="monotone"
              legendType="none"
              name="contract_bg"
              connectNulls
            />
            <Area
              dataKey="spot"
              stroke="none"
              fill="#fee2e2"
              fillOpacity={0.3}
              type="monotone"
              legendType="none"
              name="spot_bg"
              connectNulls
            />

            {/* 삼성 주가 (스케일) */}
            {showSam && (
              <Line
                dataKey="samClose"
                name="samClose"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
                type="monotone"
              />
            )}

            {/* 고정가(Contract) */}
            <Line
              dataKey="contract"
              name="contract"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={(props: any) => {
                const pt = props.payload as DramPoint;
                if (pt.crossType === "golden") {
                  return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#10b981" stroke="#fff" strokeWidth={2}/>;
                }
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={0} fill="none"/>;
              }}
              connectNulls
              type="monotone"
            />

            {/* 현물가(Spot) — 확정 구간 */}
            <Line
              dataKey="spot"
              name="spot"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={(props: any) => {
                const pt = props.payload as DramPoint;
                if (pt.crossType === "dead") {
                  return <circle key={props.key} cx={props.cx} cy={props.cy} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2}/>;
                }
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={0} fill="none"/>;
              }}
              connectNulls
              type="monotone"
            />
            {/* 현물가(Spot) — 추정 구간 (점선 표현을 위해 별도 Line) */}
            <Line
              dataKey="spotEst"
              name="spotEst"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 3"
              strokeOpacity={0.7}
              dot={false}
              connectNulls
              type="monotone"
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 해석 */}
        <div className="mt-3 text-[11px] text-slate-500 space-y-1">
          <div>⚠️ {data.note}</div>
          <div>📌 데드크로스 = 현물(Spot)이 고정(Contract) 아래로 하락하는 시점 → 다음 분기 계약 가격 하락 예고 → 실적 급감 선행지표</div>
        </div>
      </div>

      {/* ── 데드크로스 이력 & 주가 영향 ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
        <h3 className="font-black text-base mb-3">💀 역대 데드크로스 발생 & 주가 영향 (실증)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              num: "①",
              when: "2018 Q3",
              desc: "삼성전자 최고가 89,000원(2018.01) → 데드크로스 후 1년 내 35,000원(-61%) 폭락",
              color: "border-red-400 bg-red-50",
              badge: "bg-red-500",
              result: "📉 -61% (1년 내)",
              signal: "확정 데이터",
            },
            {
              num: "②",
              when: "2021 Q3",
              desc: "삼성전자 96,800원 고점(2021.01) → 데드크로스 후 2022년 52,700원(-45%) 하락",
              color: "border-orange-400 bg-orange-50",
              badge: "bg-orange-500",
              result: "📉 -45% (14개월)",
              signal: "확정 데이터",
            },
            {
              num: "③",
              when: "2025 Q1~",
              desc: "CXMT 공급 과잉 + HBM 집중으로 일반 DDR4 Spot 하락. 삼성 현재 +74% 이격 — 주가 반응 모니터링 중",
              color: "border-yellow-400 bg-yellow-50",
              badge: "bg-yellow-500",
              result: "⚠️ 진행 중",
              signal: "추정치 (요주의)",
            },
          ].map(d => (
            <div key={d.num} className={`rounded-xl border-l-4 ${d.color} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`${d.badge} text-white text-xs font-black px-2 py-0.5 rounded-full`}>
                  데드크로스 {d.num}
                </span>
                <span className="text-xs text-slate-500">{d.when}</span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed mb-2">{d.desc}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black">{d.result}</span>
                <span className="text-[10px] text-slate-400">{d.signal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DRAMeXchange 가이드 ──────────────────────────────────── */}
      <div className="bg-slate-800 text-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-black text-sm mb-3">🔍 DRAMeXchange 직접 확인법</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="font-bold text-slate-300">Spot 가격 확인 (매주)</div>
            <ol className="space-y-1 text-slate-400 list-decimal list-inside">
              <li>dramexchange.com 접속</li>
              <li>상단 "Price" → "DRAM Spot Price" 클릭</li>
              <li>DDR4 8Gb 현물가 주간 추이 확인</li>
              <li>고정가(Contract)와 비교 — Spot이 Contract 아래면 위험</li>
            </ol>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-slate-300">체크 시점 (분기말)</div>
            <div className="grid grid-cols-2 gap-2">
              {["3월말 (Q1)", "6월말 (Q2)", "9월말 (Q3)", "12월말 (Q4)"].map(m => (
                <div key={m} className="bg-slate-700 rounded-lg p-2 text-center font-bold text-slate-200">{m}</div>
              ))}
            </div>
            <div className="text-slate-400 mt-2">
              ⚠️ 실시간 DRAM 가격 데이터는 TrendForce 유료 구독 필요.<br/>
              무료로는 주간 뉴스 기사 통해 간접 확인 가능.
            </div>
          </div>
        </div>
        <a
          href="https://www.dramexchange.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          🔗 DRAMeXchange 바로가기 →
        </a>
      </div>
    </div>
  );
}
