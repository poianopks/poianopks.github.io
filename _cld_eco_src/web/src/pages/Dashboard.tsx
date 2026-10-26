import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComposedChart, Area, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Quote } from "@/hooks/useStockData";
import { usePbrData, type PbrItem } from "@/hooks/usePbrData";
import { useAliveAth } from "@/hooks/useAliveAth";
import { useGapAnalysis, type GapBucket, type GapAnalysisData } from "@/hooks/useGapAnalysis";
import { motion } from "framer-motion";

interface Props {
  stockData: {
    kospi: Quote | undefined;
    sp500: Quote | undefined;
    ndx: Quote | undefined;
    sam: Quote | undefined;
    sk: Quote | undefined;
    tsm: Quote | undefined;
    mu: Quote | undefined;
    nvda: Quote | undefined;
    loading: boolean;
    error: string | null;
    data: { updatedAt: string };
  };
}

function fmt(v: number | null | undefined, dec = 2) {
  if (v == null) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: dec });
}
function fmtDev(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function marketStatus(dev: number | null | undefined) {
  if (dev == null) {
    return { label: "데이터 준비 중", badge: "bg-slate-100 text-slate-500", value: "text-slate-700" };
  }
  if (dev >= 25) {
    return { label: "🔴 극심한 과열", badge: "bg-red-600 text-white", value: "text-red-600" };
  }
  if (dev >= 15) {
    return { label: "🟠 과열 주의", badge: "bg-orange-100 text-orange-700", value: "text-orange-600" };
  }
  if (dev >= 5) {
    return { label: "🟢 강세 추세", badge: "bg-emerald-100 text-emerald-700", value: "text-emerald-600" };
  }
  if (dev >= -5) {
    return { label: "🔵 정상 범위", badge: "bg-blue-100 text-blue-700", value: "text-blue-600" };
  }
  return { label: "🟣 조정 구간", badge: "bg-violet-100 text-violet-700", value: "text-violet-600" };
}

function riskFromDeviation(dev: number | null | undefined) {
  if (dev == null) return 0;
  return Math.min(99, Math.max(5, Math.round(50 + (Math.abs(dev) - 25) * 0.88)));
}

function IndexMirror({ quote, name }: { quote: Quote | undefined; name: string }) {
  const status = marketStatus(quote?.dev200d);
  const risk = riskFromDeviation(quote?.dev200d);

  return (
    <Card className="overflow-hidden border-blue-200 shadow-sm">
      <CardHeader className="pb-3 bg-blue-50/40 border-b border-blue-100">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          🇺🇸 {name}
          <span className={`text-xs font-normal flex items-center gap-1 ${quote ? "text-emerald-600" : "text-amber-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${quote ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {quote ? "Yahoo 최근 시세" : "데이터 확인 중"}
          </span>
        </CardTitle>
        <CardDescription>KOSPI와 동일한 200주·200일 이동평균선 기준 진단</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-xs text-muted-foreground mb-1">현재가</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{fmt(quote?.price, 2)}</div>
            <div className={`text-xs mt-1 ${(quote?.changePct ?? 0) >= 0 ? "text-red-500" : "text-blue-600"}`}>
              전일 대비 {quote?.changePct == null ? "—" : `${quote.changePct >= 0 ? "▲ +" : "▼ "}${Math.abs(quote.changePct).toFixed(2)}%`}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] text-muted-foreground">200주 이평선</div>
            <div className="text-xl font-black mt-1">{fmt(quote?.ma200w, 0)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">장기 기준선</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] text-muted-foreground">200주 이격도</div>
            <div className={`text-xl font-black mt-1 ${status.value}`}>{fmtDev(quote?.dev200w)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">장기 추세</div>
          </div>
          <div className="col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-muted-foreground">200일 이평선</span>
              <span className="font-bold">{fmt(quote?.ma200d, 2)}</span>
            </div>
            <div className="flex justify-between gap-2 text-xs mt-1.5">
              <span className="text-muted-foreground">200일 이격도</span>
              <span className={`font-black ${status.value}`}>{fmtDev(quote?.dev200d)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`border-0 ${status.badge}`}>{status.label}</Badge>
          <span className="text-[11px] text-muted-foreground">200일 이격도 기준 자동 판정</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>안전 구간</span>
            <span className="font-bold text-slate-700">현재 위험도 {risk}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" style={{ width: `${risk}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SemiconductorMirror({ quote, label, note }: { quote: Quote | undefined; label: string; note: string }) {
  const status = marketStatus(quote?.dev200d);

  return (
    <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-xl">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <div className="font-black text-lg">{label}</div>
          <div className="text-sm text-muted-foreground">{quote?.symbol ?? "데이터 연결 중"}</div>
        </div>
        <Badge className={`text-xs shrink-0 border-0 ${quote ? status.badge : "bg-amber-100 text-amber-700"}`}>
          {quote ? status.label : "데이터 확인 중"}
        </Badge>
      </div>
      <div className="text-2xl font-black tracking-tight text-slate-900">
        {fmt(quote?.price, 2)}
        <span className="ml-1 text-xs text-muted-foreground font-medium">USD</span>
      </div>
      <div className="space-y-1.5 mt-3 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>200일 이격도</span>
          <span className={`font-black text-base ${status.value}`}>{fmtDev(quote?.dev200d)}</span>
        </div>
        <div className="flex justify-between">
          <span>MA200</span>
          <span className="font-medium text-slate-700">{fmt(quote?.ma200d, 2)} USD</span>
        </div>
        <div className="flex justify-between">
          <span>전일 대비</span>
          <span className={(quote?.changePct ?? 0) >= 0 ? "text-red-500" : "text-blue-600"}>
            {quote?.changePct == null ? "—" : `${quote.changePct >= 0 ? "▲ +" : "▼ "}${Math.abs(quote.changePct).toFixed(2)}%`}
          </span>
        </div>
      </div>
      <p className="mt-3 pt-3 border-t border-violet-200 text-[10px] text-muted-foreground leading-relaxed">{note}</p>
    </div>
  );
}

const deviationHistory = [
  { year: "2019", kospi: 2200, ma200: 2100 },
  { year: "2020저", kospi: 1440, ma200: 2050 },
  { year: "2021", kospi: 3300, ma200: 2200 },
  { year: "2022", kospi: 2200, ma200: 2400 },
  { year: "2023", kospi: 2600, ma200: 2350 },
  { year: "2024", kospi: 2800, ma200: 2450 },
  { year: "2025초", kospi: 3200, ma200: 2550 },
  { year: "2025말", kospi: 5500, ma200: 2700 },
];

// min: 이 구간의 하한(이상). 현재 위치는 실시간 200일 이격도로 자동 판정합니다.
const deviationGuide = [
  { range: "+20% 이상",    min: 20,        color: "bg-destructive",  textColor: "text-destructive",  action: "🔴 신규 매수 자제, 일부 익절 고려" },
  { range: "+5% ~ +20%",  min: 5,         color: "bg-amber-500",    textColor: "text-amber-400",    action: "🟡 정기적립(DCA) 유지" },
  { range: "-5% ~ +5%",   min: -5,        color: "bg-blue-500",     textColor: "text-blue-400",     action: "🔵 분할 매수 시작 (좋은 구간)" },
  { range: "-15% ~ -5%",  min: -15,       color: "bg-sky-500",      textColor: "text-sky-500",      action: "🔷 조정 진행 — 계획한 분할매수를 천천히 이어가기" },
  { range: "-15% 이하",   min: -Infinity, color: "bg-emerald-500",  textColor: "text-emerald-400",  action: "🟢 적극 매수 기회 (핵심 구간)" },
];

function guideIndexFor(dev: number | null | undefined) {
  if (dev == null || Number.isNaN(dev)) return -1;
  return deviationGuide.findIndex((g) => dev >= g.min);
}

const analogies = [
  { icon: "🪢", title: "고무줄",        desc: "너무 늘리면 반드시 튕겨 돌아옵니다. 늘어날수록 복원력이 기하급수적으로 강해집니다.", color: "border-destructive/40" },
  { icon: "🐕", title: "강아지와 산책자", desc: "코스톨라니: 강아지(주가)는 산책자(이평선) 곁을 떠나지 못합니다. 멀리 달려도 결국 돌아옵니다.", color: "border-amber-500/40" },
  { icon: "⏰", title: "시계추",         desc: "탐욕과 공포 사이를 진동하지만 결국 중앙(평균)으로 수렴합니다. 극단일수록 반전 가능성 높아집니다.", color: "border-blue-500/40" },
  { icon: "🌡️", title: "체온계",         desc: "체온이 42도까지 올라가면 반드시 내려옵니다. 극단의 열기 이후 식는 것은 자연의 법칙입니다.", color: "border-purple-500/40" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const k = payload.find((p: any) => p.dataKey === "kospi")?.value;
  const m = payload.find((p: any) => p.dataKey === "ma200")?.value;
  const dev = k && m ? (((k - m) / m) * 100).toFixed(1) : null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>)}
      {dev && <p className="text-destructive font-bold mt-1">이격도: +{dev}%</p>}
    </div>
  );
};

// ── PBR 밸류에이션 미터 컴포넌트 ─────────────────────────────────────────────
function PbrMeter({ item, isLive }: { item: PbrItem; isLive: boolean }) {
  const { pbr, thresholds: t, verdict, name, note, isEstimate } = item;
  if (pbr == null || verdict == null) {
    return (
      <div className="p-4 border border-border/30 rounded-xl bg-muted/20">
        <div className="font-bold text-sm mb-1">{name}</div>
        <div className="text-xs text-muted-foreground">데이터 로딩 중…</div>
      </div>
    );
  }

  // Map PBR to a 0~100% gauge position
  // Low anchor = t.low * 0.5 (very cheap), High anchor = t.high * 1.5 (extreme)
  const scaleMin = t.low * 0.5;
  const scaleMax = t.high * 1.5;
  const pct = Math.min(100, Math.max(0, ((pbr - scaleMin) / (scaleMax - scaleMin)) * 100));

  const gradeEmoji = verdict.grade === "cheap" ? "🟢" : verdict.grade === "fair" ? "🔵" : verdict.grade === "pricey" ? "🟡" : "🔴";
  const gradeTextColor = verdict.grade === "cheap" ? "text-emerald-600" : verdict.grade === "fair" ? "text-blue-600" : verdict.grade === "pricey" ? "text-amber-600" : "text-red-600";
  const gradeBorderColor = verdict.grade === "cheap" ? "border-emerald-300" : verdict.grade === "fair" ? "border-blue-300" : verdict.grade === "pricey" ? "border-amber-300" : "border-red-400";

  return (
    <div className={`p-4 border-2 rounded-xl space-y-3 ${gradeBorderColor} bg-white/60`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-black text-base flex items-center gap-1.5">
            {isLive && !isEstimate && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
            {isEstimate && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="추정값" />}
            {name}
            {isEstimate && <span className="text-[9px] font-medium bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full">추정</span>}
          </div>
          {note && <div className="text-[10px] text-muted-foreground mt-0.5">{note}</div>}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${gradeTextColor}`}>{pbr.toFixed(2)}배</div>
          <div className="text-[10px] text-muted-foreground">역사 범위 {t.histRange}배</div>
        </div>
      </div>

      {/* Verdict badge */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${gradeBorderColor} ${gradeTextColor} bg-white/80`}>
        {gradeEmoji} {verdict.label}
      </div>

      {/* Gauge bar */}
      <div className="space-y-1">
        <div className="relative h-5 rounded-full overflow-hidden bg-gradient-to-r from-emerald-400 via-blue-400 via-amber-400 to-red-500">
          <motion.div
            className="absolute top-0 h-full w-1 bg-white border-2 border-gray-700 rounded-full shadow-lg"
            style={{ left: `calc(${pct}% - 2px)` }}
            initial={{ left: "0%" }}
            animate={{ left: `calc(${pct}% - 2px)` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>저평가 &lt;{t.low}배</span>
          <span>평균 {t.histAvg}배</span>
          <span>고평가 &gt;{t.high}배</span>
        </div>
      </div>

      {/* Reason */}
      <p className={`text-xs leading-relaxed ${gradeTextColor} font-medium`}>{verdict.reason}</p>

      {/* Zone labels */}
      <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
        {[
          { label: "저평가", color: "bg-emerald-100 text-emerald-700 border-emerald-200", active: verdict.grade === "cheap" },
          { label: "적정", color: "bg-blue-100 text-blue-700 border-blue-200", active: verdict.grade === "fair" },
          { label: "고평가", color: "bg-amber-100 text-amber-700 border-amber-200", active: verdict.grade === "pricey" },
          { label: "극단과열", color: "bg-red-100 text-red-700 border-red-200", active: verdict.grade === "extreme" },
        ].map(({ label, color, active }) => (
          <div key={label} className={`py-1 rounded border font-bold ${color} ${active ? "ring-2 ring-offset-1 ring-current" : "opacity-50"}`}>
            {active ? "▶ " : ""}{label}
          </div>
        ))}
      </div>
    </div>
  );
}

function pct(count: number, total: number) {
  return total ? `${((count / total) * 100).toFixed(1)}%` : "0.0%";
}

function formatGapDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function GapDateList({ label, dates, tone }: { label: string; dates: string[]; tone: "red" | "blue" | "slate" }) {
  const tones = {
    red: "border-red-100 bg-red-50/60 text-red-800",
    blue: "border-blue-100 bg-blue-50/60 text-blue-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-lg border p-2 ${tones[tone]}`}>
      <div className="font-bold">{label} · {dates.length}일</div>
      <div className="mt-1 leading-relaxed break-words">
        {dates.length ? dates.map(formatGapDate).join(" · ") : "해당 없음"}
      </div>
    </div>
  );
}

function GapDirection({ title, icon, bucket }: { title: string; icon: string; bucket: GapBucket }) {
  const winner = bucket.total === 0
    ? "발생 없음"
    : bucket.bullish > bucket.bearish ? "양봉 우세" : bucket.bearish > bucket.bullish ? "음봉 우세" : "양봉·음봉 동일";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <strong className="text-sm text-slate-800">{icon} {title}</strong>
        <span className="text-[11px] font-bold text-slate-500">총 {bucket.total}건</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
          <div className="text-[11px] font-bold text-red-700">빨강 · 양봉</div>
          <div className="text-2xl font-black text-red-600">{bucket.bullish}건</div>
          <div className="text-[10px] text-red-700/70">{pct(bucket.bullish, bucket.total)}</div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center">
          <div className="text-[11px] font-bold text-blue-700">파랑 · 음봉</div>
          <div className="text-2xl font-black text-blue-600">{bucket.bearish}건</div>
          <div className="text-[10px] text-blue-700/70">{pct(bucket.bearish, bucket.total)}</div>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-500">
        <span>보합 {bucket.doji}건</span>
        <strong className={bucket.bullish >= bucket.bearish ? "text-red-600" : "text-blue-600"}>{winner}</strong>
      </div>
      <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-600">
        <summary className="cursor-pointer font-bold text-slate-700">
          합계·날짜 보기 (갭 발생 {bucket.total}일)
        </summary>
        <div className="mt-2 space-y-2">
          <GapDateList label="빨강 양봉 합계" dates={bucket.bullishDates} tone="red" />
          <GapDateList label="파랑 음봉 합계" dates={bucket.bearishDates} tone="blue" />
          {bucket.doji > 0 && <GapDateList label="보합 합계" dates={bucket.dojiDates} tone="slate" />}
        </div>
      </details>
    </div>
  );
}

function GapAnalysisSection({ data, loading, error }: { data: GapAnalysisData | null; loading: boolean; error: string | null }) {
  if (loading && !data) {
    return (
      <Card className="border-2 border-orange-200">
        <CardHeader className="pb-3 bg-orange-50/60">
          <CardTitle className="text-base">🕯️ KOSPI 갭 발생 후 캔들 방향 조사</CardTitle>
          <CardDescription>Python으로 2024·2025·2026년 일봉 캔들을 계산하고 있습니다…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-700">🕯️ KOSPI 갭 캔들 조사</CardTitle>
          <CardDescription>조사 데이터를 불러오지 못했습니다: {error ?? "알 수 없는 오류"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const updatedAt = new Date(data.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          🕯️ KOSPI 갭 발생 후 캔들 방향 조사
          <span className="text-xs text-emerald-600 font-normal flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />매일 동적 갱신
          </span>
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          전일 종가 대비 갭 발생 당일의 캔들 색상만 집계합니다. 빨강 = 양봉(종가 &gt; 시가) · 파랑 = 음봉(종가 &lt; 시가)
          <span className="ml-2 text-[10px] text-muted-foreground/70">기준 일봉: {data.asOfDate} · 계산: {updatedAt}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {data.years.map((yearData) => (
            <div key={yearData.year} className="rounded-xl border border-orange-200 bg-orange-50/30 p-3">
              <div className="flex justify-between items-center gap-2 mb-3">
                <h3 className="font-black text-base text-slate-900">{yearData.year}년{yearData.year === 2026 ? " (오늘까지)" : ""}</h3>
                <span className="text-[10px] text-muted-foreground">KOSPI 일봉</span>
              </div>
              <div className="space-y-2">
                <GapDirection title="갭상승 후" icon="⬆️" bucket={yearData.gapUp} />
                <GapDirection title="갭하락 후" icon="⬇️" bucket={yearData.gapDown} />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 leading-relaxed">
          <strong className="text-slate-800">판정 기준:</strong> 갭상승은 당일 시가가 전일 종가보다 높은 날, 갭하락은 당일 시가가 전일 종가보다 낮은 날입니다.
          단순 전일 종가 대비 등락이 아니라, 시가·종가로 정한 실제 캔들 색상으로 집계합니다. 보합은 별도로 표시합니다.
        </div>
        {error && <div className="text-[11px] text-amber-700">다음 자동 갱신 전 마지막 정상 데이터를 표시 중입니다: {error}</div>}
      </CardContent>
    </Card>
  );
}

export function Dashboard({ stockData }: Props) {
  const { kospi, sp500, ndx, sam, sk, tsm, mu, nvda, loading, error, data } = stockData;
  const isLive = !loading && !error && kospi?.price != null;
  const pbrData = usePbrData();
  const gapAnalysis = useGapAnalysis();
  const { data: athData } = useAliveAth();

  const kospiPrice   = kospi?.price;
  const ma200w       = kospi?.ma200w;
  const dev200w      = kospi?.dev200w;
  const dev200d      = kospi?.dev200d;
  const ma200d_kospi = kospi?.ma200d;
  const kospiStatus  = marketStatus(dev200d);
  const liveDeviationHistory = [
    ...deviationHistory,
    ...(kospiPrice != null && ma200w != null
      ? [{ year: "현재", kospi: kospiPrice, ma200: ma200w }]
      : []),
  ];

  // 살아있는 ATH 방어선 경고
  const minAlivePrice = athData.minAlivePrice;
  const minAliveDate  = athData.minAliveDate;
  const athBreached   = minAlivePrice != null && kospiPrice != null && kospiPrice < minAlivePrice;

  const updatedAt = data.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  const globalIndexes = [
    { flag: "🇰🇷", name: "KOSPI", quote: kospi },
    { flag: "🇺🇸", name: "S&P 500", quote: sp500 },
    { flag: "🇺🇸", name: "NASDAQ 100", quote: ndx },
  ].map(({ flag, name, quote }) => {
    const status = marketStatus(quote?.dev200d);
    return {
      flag,
      name,
      price: fmt(quote?.price, 2),
      ma200: fmt(quote?.ma200d, 0),
      deviation: fmtDev(quote?.dev200d),
      rawDeviation: quote?.dev200d ?? null,
      status: status.label,
      danger: (quote?.dev200d ?? 0) >= 25,
    };
  });

  // Risk gauge: map dev200d to % (25% dev = 50% risk, 70% dev = ~94%)
  const riskPct = dev200d == null ? null : Math.min(99, Math.max(5, Math.round(50 + (dev200d - 25) * 0.88)));

  return (
    <div className="space-y-8">

      <div className={`flex items-center gap-2 text-xs ${isLive ? "text-muted-foreground" : "text-amber-700"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
        <span>
          {isLive
            ? <>Yahoo Finance 최근 시세 · 확인: <strong className="text-foreground">{updatedAt}</strong> · 약 1시간마다 자동 갱신 (실시간 아님)</>
            : <>시세 연결 확인 중{error ? ` · ${error}` : ""}</>}
        </span>
      </div>

      {/* 살아있는 ATH 방어선 붕괴 경고 카드 */}
      {athBreached && minAlivePrice != null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border-2 border-red-500 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-start gap-3 shadow-lg"
        >
          <div className="text-3xl shrink-0">🚨</div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-red-700 text-base">살아있는 ATH 방어선 위험</span>
              <Badge variant="destructive" className="animate-pulse text-xs">실시간 경고</Badge>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              코스피 현재가 <strong>{fmt(kospiPrice, 2)}</strong>가 살아있는 ATH 최솟값{" "}
              <strong>{fmt(minAlivePrice, 2)}</strong>
              {minAliveDate ? ` (${minAliveDate})` : ""} 아래로 이탈했습니다.
            </p>
            <p className="text-xs text-red-600">
              ⚠️ 이 방어선이 종가 기준으로 무너지면 현재 살아있는 <strong>{athData.aliveCount}개</strong> ATH가{" "}
              <strong>동시에 전부 무효화</strong>되는 중대 시그널입니다.
            </p>
          </div>
        </motion.div>
      )}

      {/* 핵심 지표 카드 — 실시간 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="col-span-2 md:col-span-1 bg-red-50 border-destructive/30 shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              KOSPI 현재가
            </div>
            <div className={`text-5xl font-black tracking-tighter ${kospiStatus.value}`}>
              {fmt(kospiPrice, 0)}
            </div>
            <div className={`text-xs mt-1 ${(kospi?.changePct ?? 0) >= 0 ? "text-red-500" : "text-blue-600"}`}>
              {kospi?.changePct != null ? `전일 대비 ${kospi.changePct >= 0 ? "+" : ""}${kospi.changePct.toFixed(2)}%` : "데이터 확인 중"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-xs text-muted-foreground mb-1">200주 이평선 (기준선)</div>
            <div className="text-4xl font-bold tracking-tight">{fmt(ma200w, 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">장기 기준선 (지지선)</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-destructive/40 shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="text-xs text-destructive mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />200주 이격도
            </div>
            <div className="text-4xl font-black text-destructive tracking-tight">{fmtDev(dev200w)}</div>
            <div className="text-xs text-destructive/70 mt-1">역사적 극단치</div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/30">
          <CardContent className="pt-5 pb-4">
            <div className="text-xs text-destructive/80 mb-1">200일 이격도</div>
            <div className="text-4xl font-bold text-destructive tracking-tight">{fmtDev(dev200d)}</div>
            <div className="text-xs text-muted-foreground mt-1">MA200: {fmt(ma200d_kospi, 0)} | 과열 기준 3배+</div>
          </CardContent>
        </Card>
      </div>

      {/* 위험 배지 */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={`text-sm px-4 py-1.5 font-bold border-0 ${kospiStatus.badge}`}>
          {kospiStatus.label}
        </Badge>
        <span className="text-muted-foreground text-sm">
          현재 200일 이격도 <strong className={kospiStatus.value}>{fmtDev(dev200d)}</strong> 기준 자동 판정
        </span>
      </div>

      {/* 위험도 게이지 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>안전 구간</span>
          <span className={`font-bold ${kospiStatus.value}`}>현재 위험도 {riskPct == null ? "—" : `${riskPct}%`}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden border border-border/30">
          {riskPct != null && (
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-destructive rounded-full flex items-center justify-end pr-3 transition-all duration-1000"
              style={{ width: `${riskPct}%` }}
            >
              <span className="text-xs font-black text-white drop-shadow">{riskPct}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-right">200일 이격도 기준 과열 위험도 척도 (실시간 계산)</p>
      </div>

      {/* KOSPI 200주선 과거 기준점 + 현재 시세 차트 */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="bg-slate-50/80 border-b border-border/30 pb-3">
          <CardTitle>KOSPI & 200주 이동평균선 — 현재 시세 반영</CardTitle>
          <CardDescription>
            현재가 {fmt(kospiPrice, 2)} | MA200주: {fmt(ma200w, 0)} | 이격도 {fmtDev(dev200w)} (양수 = 강세 추세 / 매수 부당)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={liveDeviationHistory} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="kospi" fill="url(#gapGrad)" stroke="none" />
                <Line type="monotone" dataKey="kospi" stroke="#ef4444" strokeWidth={2.5} name="KOSPI" />
                <Line type="monotone" dataKey="ma200" stroke="#f97316" strokeWidth={2} strokeDasharray="6 3" name="MA200주" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">2019~2025는 역사적 기준점 · 마지막 ‘현재’ 값은 Yahoo Finance 최근 시세</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-center">
              <span className="text-emerald-400 font-bold">양수 = 지지선 위</span>
              <br /><span className="text-muted-foreground">강세 추세 / 신규 매수 부담</span>
            </div>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-center">
              <span className="text-blue-400 font-bold">음수 = 지지선 아래</span>
              <br /><span className="text-muted-foreground">약세 추세 / 매수 기회</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 삼성 + SK 실시간 */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            📈 개별 종목 현재 진단 — 삼성전자 · SK하이닉스
            {isLive && <span className="text-xs text-emerald-600 font-normal flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Yahoo 최근 시세</span>}
          </CardTitle>
          <CardDescription>현재가와 200일 이동평균선의 이격도를 종목별로 자동 판정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "삼성전자", q: sam },
              { name: "SK하이닉스", q: sk },
            ].map(({ name, q }) => {
              const stockStatus = marketStatus(q?.dev200d);
              return (
              <div key={name} className="p-4 bg-white border border-slate-200 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-black text-lg">{name}</div>
                    <div className="text-sm text-muted-foreground">
                      {q?.price ? `${fmt(q.price, 0)}원` : "데이터 확인 중"}
                    </div>
                  </div>
                  <Badge className={`text-xs shrink-0 border-0 ${q ? stockStatus.badge : "bg-amber-100 text-amber-700"}`}>
                    {q ? stockStatus.label : "데이터 확인 중"}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>200일 이격도</span>
                      <span className={`font-black text-base ${stockStatus.value}`}>
                       {fmtDev(q?.dev200d)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MA200</span>
                    <span className="text-muted-foreground font-medium">
                       {q?.ma200d ? `${fmt(q.ma200d, 0)}원` : "—"}
                    </span>
                  </div>
                  {q?.changePct != null && (
                    <div className="flex justify-between">
                      <span>전일 대비</span>
                      <span className={q.changePct >= 0 ? "text-red-500" : "text-blue-600"}>
                        {q.changePct >= 0 ? "+" : ""}{q.changePct.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
            <strong className="text-amber-400">쏠림 진단:</strong>{" "}
            <span className="text-muted-foreground">코스피 시총 상위 2종목 극단 과열 → 지수 전체 이격 왜곡. 2000년 나스닥 시스코(+140%→-90%) 패턴과 동일 구조.</span>
          </div>
        </CardContent>
      </Card>

      {/* ── PBR 밸류에이션 섹션 ── */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white border-b border-border/20">
          <CardTitle className="flex items-center gap-2 text-base">
            📊 PBR 밸류에이션 현재 진단 — KOSPI · 미국 · AI 반도체
            {!pbrData.loading && <span className="text-xs text-amber-600 font-normal flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />실제·추정 구분 표시</span>}
          </CardTitle>
          <CardDescription className="text-xs">
            PBR(주가순자산비율) = 주가 ÷ 1주당 순자산 · KOSPI·미국 지수·반도체 핵심주를 같은 카드 기준으로 비교 · 역사적 고점 = 고평가 버블 신호
            {pbrData.data.updatedAt && (
              <span className="ml-2 text-[10px] text-muted-foreground/60">
                업데이트: {new Date(pbrData.data.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* KOSPI·국내 대표주·미국 지수·글로벌 반도체: 동일한 PBR 미터 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pbrData.data.items.map((item) => (
              <PbrMeter key={item.symbol} item={item} isLive={!pbrData.loading} />
            ))}
          </div>

          {/* 종합 판정 */}
          {(() => {
            const allVerdicts = pbrData.data.items.map(i => i.verdict?.grade).filter(Boolean);
            const extremeCount = allVerdicts.filter(g => g === "extreme").length;
            const priceyCount  = allVerdicts.filter(g => g === "pricey").length;
            const overallGrade = extremeCount >= 2 ? "extreme" : extremeCount >= 1 && priceyCount >= 1 ? "extreme" : priceyCount >= 2 ? "pricey" : "fair";
            const overallMsg = overallGrade === "extreme"
              ? "🔴 전체 시장 극단 과열 — 역사적으로 대규모 조정 전 패턴과 일치. 신규 매수 자제 권고."
              : overallGrade === "pricey"
              ? "🟡 전반적 고평가 — 밸류에이션 부담 구간. 분할 매수 유지, 신규 진입 신중."
              : "🔵 전반적 적정 수준 — 정상적 밸류에이션 구간.";
            const overallBg  = overallGrade === "extreme" ? "bg-red-50 border-red-300" : overallGrade === "pricey" ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200";
            return (
              <div className={`p-3 rounded-lg border text-sm font-medium ${overallBg}`}>
                {overallMsg}
              </div>
            );
          })()}

          {/* PBR 해설 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-border/30">
              <p className="font-bold text-slate-700 mb-1">📖 PBR이란?</p>
              <p className="text-muted-foreground leading-relaxed">주가 ÷ 1주당 순자산. <strong>1배 미만</strong>은 회사 문 닫고 자산 팔면 주가보다 많이 받음(저평가). <strong>역사 평균 대비 높을수록</strong> 시장이 미래 기대를 과다하게 반영한 것.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-border/30">
              <p className="font-bold text-slate-700 mb-1">⚠️ PBR의 한계</p>
              <p className="text-muted-foreground leading-relaxed">반도체(삼성전자·SK하이닉스·TSMC·마이크론)와 성장주(엔비디아)는 사이클·성장 기대에 따라 PBR 변동 폭이 매우 큼. 미국 지수는 SPY·QQQ ETF 구성 기업 기준 참고치입니다. 단순 수치만으로 매도·매수 결정은 금물.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이격도 행동 가이드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📏 이격도 수준별 행동 가이드</CardTitle>
          <CardDescription>Mebane Faber 연구 기반 | 200일 이동평균선 활용 실전 기준</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deviationGuide.map((guide, gi) => ({ ...guide, current: gi === guideIndexFor(dev200d) })).map((guide) => (
            <div key={guide.range}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border ${
                guide.current
                  ? "border-destructive/50 bg-destructive/8 ring-1 ring-destructive/30"
                  : "border-border/30 bg-muted/10"
              }`}>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`w-3 h-3 rounded-full ${guide.color} shrink-0`} />
                <span className={`font-black text-sm w-28 ${guide.textColor}`}>{guide.range}</span>
              </div>
              <span className="text-sm text-foreground/80">{guide.action}</span>
              {guide.current && (
                <Badge variant="destructive" className="shrink-0 text-xs ml-auto animate-pulse">← 현재 위치 ({fmtDev(dev200d)})</Badge>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center">
            Mebane Faber: 200일선 전략은 "수익률 향상"보다 <strong className="text-foreground">"리스크 관리"</strong>용으로 활용
          </p>
        </CardContent>
      </Card>

      {/* 평균회귀 비유 */}
      <div>
        <h3 className="text-base font-bold mb-4">평균회귀란? — 4가지 직관적 비유 (코스톨라니 포함)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {analogies.map((a) => (
            <Card key={a.title} className={`border ${a.color}`}>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl mb-2">{a.icon}</div>
                <h4 className="font-bold text-sm mb-1.5">{a.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 글로벌 3대 지수 — 실시간 테이블 + 차트 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            🌐 글로벌 3대 지수 200일선 비교
            {isLive && <span className="text-xs text-emerald-600 font-normal flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Yahoo 최근 시세</span>}
          </CardTitle>
          <CardDescription>Yahoo Finance 최근 시세 · 현재가와 200일 이동평균선을 동일 기준으로 비교</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>지수</TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                  <TableHead className="text-right">MA200일</TableHead>
                  <TableHead className="text-right font-bold">이격도</TableHead>
                  <TableHead className="hidden md:table-cell text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalIndexes.map((idx) => (
                  <TableRow key={idx.name} className={idx.danger ? "bg-destructive/8" : ""}>
                    <TableCell className="font-bold text-sm">{idx.flag} {idx.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{idx.price}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">{idx.ma200}</TableCell>
                    <TableCell className={`text-right font-black ${idx.danger ? "text-destructive" : "text-emerald-400"}`}>{idx.deviation}</TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <Badge variant={idx.danger ? "destructive" : "outline"} className={idx.danger ? "text-xs" : "border-emerald-500/50 text-emerald-400 text-xs"}>
                        {idx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="h-56 rounded-lg border border-border/30 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalIndexes.filter((item) => item.rawDeviation != null)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "200일 이격도"]} />
                <Bar dataKey="rawDeviation" radius={[6, 6, 0, 0]}>
                  {globalIndexes.filter((item) => item.rawDeviation != null).map((item) => (
                    <Cell key={item.name} fill={item.danger ? "#ef4444" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
            <strong className="text-blue-700">현재 비교:</strong>{" "}
            KOSPI {fmtDev(dev200d)} · S&P 500 {fmtDev(sp500?.dev200d)} · NASDAQ 100 {fmtDev(ndx?.dev200d)}.
            각 지수의 상태는 현재 200일선 이격도로 자동 판정하며 고정된 과거 결론을 사용하지 않습니다.
          </div>
        </CardContent>
      </Card>

      {/* 미국 대표 지수 — KOSPI와 같은 방식의 개별 진단 */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900">🇺🇸 미국 대표 지수 현재 분석</h2>
            <p className="text-xs text-muted-foreground mt-1">KOSPI와 동일하게 현재가 · 200주선 · 200일선 · 이격도 · 위험도를 함께 진단합니다.</p>
          </div>
          <span className={`text-xs font-medium flex items-center gap-1 ${isLive ? "text-emerald-600" : "text-amber-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {isLive ? "Yahoo 최근 시세" : "데이터 확인 중"}
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <IndexMirror name="S&P 500" quote={sp500} />
          <IndexMirror name="NASDAQ 100" quote={ndx} />
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 leading-relaxed">
          <strong>읽는 법:</strong> 지수가 200일선·200주선 위에 있으면 장기 상승 추세입니다.
          이격도가 커질수록 평균회귀 위험도도 높아지므로, KOSPI와 같은 기준으로 과열 여부를 비교할 수 있습니다.
        </div>
      </section>

      {/* 글로벌 반도체 3종 — 삼성전자·SK하이닉스와 같은 방식의 개별 진단 */}
      <Card className="border-violet-200">
        <CardHeader className="pb-3 bg-violet-50/50 border-b border-violet-100">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            🧠 글로벌 AI 반도체 핵심주 현재 분석
            <span className={`text-xs font-normal flex items-center gap-1 ${isLive ? "text-emerald-600" : "text-amber-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isLive ? "Yahoo 최근 시세" : "데이터 확인 중"}
            </span>
          </CardTitle>
          <CardDescription>삼성전자·SK하이닉스 분석과 동일하게 현재가 · MA200 · 200일 이격도 · 전일 대비를 진단합니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SemiconductorMirror
              quote={tsm}
              label="TSMC"
              note="NYSE ADR · 세계 최대 파운드리 · 삼성전자 파운드리의 핵심 경쟁 지표"
            />
            <SemiconductorMirror
              quote={mu}
              label="마이크론"
              note="NASDAQ · 메모리 반도체 · SK하이닉스·삼성전자 메모리 업황 참고 지표"
            />
            <SemiconductorMirror
              quote={nvda}
              label="엔비디아"
              note="NASDAQ · AI 가속기 · HBM 수요와 글로벌 AI 투자 흐름의 핵심 지표"
            />
          </div>
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-sm text-violet-900">
            <strong>반도체 연동 진단:</strong>{" "}
            TSMC는 파운드리, 마이크론은 메모리, 엔비디아는 AI 수요를 보여줍니다.
            세 종목의 MA200 이격도와 등락을 삼성전자·SK하이닉스의 선행·동행 지표로 함께 확인하세요.
          </div>
        </CardContent>
      </Card>

      <GapAnalysisSection
        data={gapAnalysis.data}
        loading={gapAnalysis.loading}
        error={gapAnalysis.error}
      />
    </div>
  );
}
