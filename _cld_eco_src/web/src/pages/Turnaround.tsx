import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart, Line, Bar, YAxis, XAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchList() {
  const r = await fetch("/api/turnaround/list");
  if (!r.ok) throw new Error("목록 로딩 실패");
  return r.json() as Promise<{ ranked: RankedItem[]; screeningMethod: string; updatedAt: string }>;
}
async function fetchChart(code: string, period: string) {
  const r = await fetch(`/api/turnaround/chart/${code}?period=${period}`);
  if (!r.ok) throw new Error("차트 로딩 실패");
  return r.json() as Promise<ChartData>;
}
async function fetchWatchlist() {
  const r = await fetch("/api/turnaround/watchlist");
  if (!r.ok) throw new Error("관심종목 로딩 실패");
  return r.json() as Promise<{ items: WatchlistItem[]; updatedAt: string }>;
}
async function fetchWatchlistChart(code: string, period: string) {
  const r = await fetch(`/api/turnaround/watchlist/chart/${code}?period=${period}`);
  if (!r.ok) throw new Error("차트 로딩 실패");
  return r.json() as Promise<ChartData>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface RankedItem {
  rank: number; code: string; name: string; sector: string; theme: string;
  currentPrice: number | null;
  fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
  ret1m: number | null; ret3m: number | null; ret6m: number | null;
  positionIn52w: number | null; score: number;
  volExpansion: number | null; ma20: number | null; ma60: number | null;
  pros: string[]; cons: string[];
  dataAvailable: boolean;
}
interface WatchlistItem {
  code: string; name: string; sector: string; theme: string;
  currentPrice: number | null;
  fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
  ret1m: number | null; ret3m: number | null; ret6m: number | null;
  positionIn52w: number | null;
  volExpansion: number | null; ma20: number | null; ma60: number | null;
  pros: string[]; cons: string[];
  dataAvailable: boolean;
}
interface ChartRow { date: string; label: string; price: number | null; volume: number | null; ma20: number | null; ma60: number | null }
interface ChartData {
  code: string; name: string; sector: string; theme: string;
  pros: string[]; cons: string[];
  currentPrice: number | null;
  fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
  ret1m: number | null; ret3m: number | null; ret6m: number | null;
  positionIn52w: number | null;
  ma20: number | null; ma60: number | null;
  volExpansion: number | null;
  chartData: ChartRow[];
  dataAvailable: boolean; updatedAt: string;
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtWon(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("ko-KR") + "원";
}
function fmtPct(n: number | null, digits = 1) {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}
function fmtVol(n: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M주";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K주";
  return n.toLocaleString("ko-KR") + "주";
}

// 네이버 금융 URL
function naverNewsUrl(code: string) {
  return `https://finance.naver.com/item/news.nhn?code=${code}`;
}
function naverMainUrl(code: string) {
  return `https://finance.naver.com/item/main.nhn?code=${code}`;
}

// ── Periods ───────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-xl space-y-0.5">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        p.value != null && (
          <p key={p.dataKey} style={{ color: p.color ?? p.fill }}>
            {p.name}: {p.dataKey === "volume" ? fmtVol(p.value) : p.value.toLocaleString("ko-KR") + "원"}
          </p>
        )
      ))}
    </div>
  );
}

// ── 52w Range bar ─────────────────────────────────────────────────────────────
function RangeBar({ position, high, low, current }: { position: number | null; high: number; low: number; current: number | null }) {
  const pct = position != null ? Math.max(0, Math.min(1, position)) : 0.5;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{fmtWon(low)}</span>
        <span className="font-bold text-foreground">{fmtWon(current)}</span>
        <span>{fmtWon(high)}</span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-rose-400 rounded-full" style={{ width: "100%" }} />
        <div
          className="absolute top-0 w-2 h-2 bg-white border-2 border-foreground rounded-full -translate-x-1/2 shadow"
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>52주 저점</span>
        <span className="text-foreground font-semibold">현재 {(pct * 100).toFixed(0)}% 위치</span>
        <span>52주 고점</span>
      </div>
    </div>
  );
}

// ── Returns grid ──────────────────────────────────────────────────────────────
function ReturnsGrid({ ret1m, ret3m, ret6m }: { ret1m: number | null; ret3m: number | null; ret6m: number | null }) {
  const cells = [
    { label: "1개월 수익률", val: ret1m },
    { label: "3개월 수익률", val: ret3m },
    { label: "6개월 수익률", val: ret6m },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map(({ label, val }) => (
        <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-[9px] text-muted-foreground">{label}</p>
          <p className={`font-black text-sm mt-0.5 ${val == null ? "text-muted-foreground" : val >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {fmtPct(val)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Price + Volume chart ──────────────────────────────────────────────────────
function PriceChart({ chartData, period, onPeriodChange }: {
  chartData: ChartRow[];
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  const hasMA20 = chartData.some(r => r.ma20 != null);
  const hasMA60 = chartData.some(r => r.ma60 != null);

  const n = chartData.length;
  const step = n > 80 ? 15 : n > 40 ? 8 : 4;
  const display = chartData.map((r, i) => ({ ...r, labelTick: i % step === 0 ? r.label : "" }));

  const validPrices = chartData.map(r => r.price).filter((price): price is number => price != null && isFinite(price));
  if (validPrices.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => onPeriodChange(p.key)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                period === p.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">가격 데이터 없음</div>
      </div>
    );
  }

  const priceMin = Math.min(...validPrices);
  const priceMax = Math.max(...validPrices);
  const pricePad = (priceMax - priceMin) * 0.05;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => onPeriodChange(p.key)}
            className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
              period === p.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}>
            {p.label}
          </button>
        ))}
      </div>
      {chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">데이터 없음</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={display} margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="labelTick" tick={{ fontSize: 9, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="price" domain={[priceMin - pricePad, priceMax + pricePad]}
              tickFormatter={v => (v / 1000).toFixed(0) + "K"}
              tick={{ fontSize: 9, fill: "#9E9E9E" }} axisLine={false} tickLine={false} width={40} />
            <YAxis yAxisId="volume" orientation="right"
              tickFormatter={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + "M" : (v / 1_000).toFixed(0) + "K"}
              tick={{ fontSize: 9, fill: "#9E9E9E" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<ChartTooltip />} />
            <Bar yAxisId="volume" dataKey="volume" name="거래량" fill="#CBD5E1" opacity={0.5} radius={[1, 1, 0, 0]} />
            <Line yAxisId="price" type="monotone" dataKey="price" name="주가"
              stroke="#1E293B" dot={false} strokeWidth={2} connectNulls />
            {hasMA20 && (
              <Line yAxisId="price" type="monotone" dataKey="ma20" name="MA20"
                stroke="#2563EB" dot={false} strokeWidth={1.5} strokeDasharray="4 2" connectNulls />
            )}
            {hasMA60 && (
              <Line yAxisId="price" type="monotone" dataKey="ma60" name="MA60"
                stroke="#16A34A" dot={false} strokeWidth={1.5} strokeDasharray="4 2" connectNulls />
            )}
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(v, e: any) => <span style={{ color: e.color ?? "#888" }}>{v}</span>} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
      <div className="text-[10px] text-muted-foreground text-center">
        ■ 주가 · <span style={{ color: "#2563EB" }}>-- MA20</span> · <span style={{ color: "#16A34A" }}>-- MA60</span> · 회색 바 = 거래량
      </div>
    </div>
  );
}

// ── Rank card (TOP10) ─────────────────────────────────────────────────────────
function RankCard({ item, selected, onClick }: { item: RankedItem; selected: boolean; onClick: () => void }) {
  const border = selected ? "border-primary shadow-md" : "border-border/40 hover:border-border/70";
  const scoreColor = item.score >= 70 ? "text-rose-600" : item.score >= 40 ? "text-amber-600" : "text-slate-500";

  return (
    <Card className={`cursor-pointer transition-all duration-200 border-2 ${border}`} onClick={onClick}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
            item.rank <= 3 ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {item.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{item.name}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{item.theme}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{item.sector}</p>
            {(item.ret1m != null || item.ret3m != null) && (
              <div className="flex gap-3 mt-1 text-[10px]">
                {item.ret1m != null && (
                  <span className={item.ret1m >= 0 ? "text-emerald-600" : "text-rose-600"}>1M {fmtPct(item.ret1m)}</span>
                )}
                {item.ret3m != null && (
                  <span className={item.ret3m >= 0 ? "text-emerald-600" : "text-rose-600"}>3M {fmtPct(item.ret3m)}</span>
                )}
                {item.ret6m != null && (
                  <span className={item.ret6m >= 0 ? "text-emerald-600" : "text-rose-600"}>6M {fmtPct(item.ret6m)}</span>
                )}
              </div>
            )}
          </div>
          <div className="text-right shrink-0 space-y-1">
            {item.currentPrice != null && (
              <p className="text-sm font-black">{item.currentPrice.toLocaleString("ko-KR")}원</p>
            )}
            <p className={`text-xs font-black ${scoreColor}`}>점수 {item.score}</p>
          </div>
        </div>
        {item.positionIn52w != null && (
          <div className="mt-2">
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-rose-400 rounded-full" />
              <div
                className="absolute top-0 w-2 h-2 bg-white border border-slate-400 rounded-full -translate-y-0.5 shadow-sm"
                style={{ left: `${Math.max(0, Math.min(1, item.positionIn52w)) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5 text-right">
              52주 저점↔고점 {(item.positionIn52w * 100).toFixed(0)}% 위치
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Detail panel (TOP10) ──────────────────────────────────────────────────────
function DetailPanel({ item }: { item: RankedItem }) {
  const [period, setPeriod] = useState("6m");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["turnaround-chart", item.code, period],
    queryFn: () => fetchChart(item.code, period),
    staleTime: 8 * 60 * 1000,
  });

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{item.sector} · KOSPI {item.code}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={naverNewsUrl(item.code)} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-[#03C75A] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#02a84d] transition-colors flex items-center gap-1">
              📰 네이버 뉴스
            </a>
            <a href={naverMainUrl(item.code)} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-1">
              📊 종목 상세
            </a>
          </div>
        </div>
        {item.currentPrice != null && (
          <p className="text-2xl font-black mt-1">{item.currentPrice.toLocaleString("ko-KR")}원</p>
        )}
        <p className="text-xs text-muted-foreground">{item.theme}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
            <span className="animate-pulse">📈 차트 로딩 중...</span>
          </div>
        )}
        {isError && (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Yahoo Finance 연결 오류</div>
        )}
        {data && (
          <PriceChart chartData={data.chartData} period={period} onPeriodChange={setPeriod} />
        )}

        <ReturnsGrid
          ret1m={data?.ret1m ?? item.ret1m}
          ret3m={data?.ret3m ?? item.ret3m}
          ret6m={data?.ret6m ?? item.ret6m}
        />

        {item.currentPrice != null && item.fiftyTwoWeekHigh > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-muted-foreground">52주 가격 범위</p>
            <RangeBar
              position={data?.positionIn52w ?? item.positionIn52w}
              high={item.fiftyTwoWeekHigh}
              low={item.fiftyTwoWeekLow}
              current={item.currentPrice}
            />
          </div>
        )}

        {data && (data.ma20 != null || data.ma60 != null || data.volExpansion != null) && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            {data.ma20 != null && (
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-[9px] text-blue-600">MA20</p>
                <p className="font-black text-blue-700">{data.ma20.toLocaleString("ko-KR")}원</p>
                <p className={`text-[10px] ${data.currentPrice && data.currentPrice > data.ma20 ? "text-emerald-600" : "text-rose-600"}`}>
                  {data.currentPrice ? fmtPct((data.currentPrice - data.ma20) / data.ma20 * 100) : "—"}
                </p>
              </div>
            )}
            {data.ma60 != null && (
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-[9px] text-green-600">MA60</p>
                <p className="font-black text-green-700">{data.ma60.toLocaleString("ko-KR")}원</p>
                <p className={`text-[10px] ${data.currentPrice && data.currentPrice > data.ma60 ? "text-emerald-600" : "text-rose-600"}`}>
                  {data.currentPrice ? fmtPct((data.currentPrice - data.ma60) / data.ma60 * 100) : "—"}
                </p>
              </div>
            )}
            {data.volExpansion != null && (
              <div className={`rounded-lg p-2 text-center ${data.volExpansion > 1.3 ? "bg-amber-50" : "bg-slate-50"}`}>
                <p className="text-[9px] text-muted-foreground">거래량</p>
                <p className={`font-black text-sm ${data.volExpansion > 1.3 ? "text-amber-700" : "text-slate-600"}`}>
                  {data.volExpansion > 1 ? "+" : ""}{((data.volExpansion - 1) * 100).toFixed(0)}%
                </p>
                <p className="text-[9px] text-muted-foreground">20D vs 6M</p>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border/40 pt-3" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-emerald-700 mb-2">✅ 실시간 긍정 신호</p>
            {(data?.pros ?? item.pros).map((p, i) => (
              <div key={i} className="flex gap-2 text-xs text-slate-700 mb-1.5">
                <span className="text-emerald-600 shrink-0 font-bold">→</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-rose-700 mb-2">⚠️ 실시간 리스크 신호</p>
            {(data?.cons ?? item.cons).map((c, i) => (
              <div key={i} className="flex gap-2 text-xs text-slate-700 mb-1.5">
                <span className="text-rose-500 shrink-0 font-bold">→</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Yahoo Finance 기반 · 10분 캐시 · 갱신: {data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString("ko-KR") : "—"}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Deep analysis card (관심종목·턴어라운드 공통) ────────────────────────────────
type AnalysisItem = WatchlistItem | RankedItem;

function DeepAnalysisCard({
  item,
  rank,
  score,
  chartKey,
  chartFetcher,
}: {
  item: AnalysisItem;
  rank?: number;
  score?: number;
  chartKey: string;
  chartFetcher: (code: string, period: string) => Promise<ChartData>;
}) {
  const [period, setPeriod] = useState("6m");
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: [chartKey, item.code, period],
    queryFn: () => chartFetcher(item.code, period),
    staleTime: 8 * 60 * 1000,
    enabled: expanded,
  });

  const posColor = item.positionIn52w != null
    ? item.positionIn52w < 0.3 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : item.positionIn52w > 0.7 ? "text-rose-700 bg-rose-50 border-rose-200"
    : "text-amber-700 bg-amber-50 border-amber-200"
    : "text-slate-600 bg-slate-50 border-slate-200";

  // 거래량 수급 신호
  const volSignal = item.volExpansion != null
    ? item.volExpansion > 1.5 ? { label: "거래량 급증 🔥", color: "text-rose-600" }
    : item.volExpansion > 1.2 ? { label: "거래량 증가 📈", color: "text-amber-600" }
    : item.volExpansion < 0.7 ? { label: "거래량 위축 📉", color: "text-slate-400" }
    : { label: "거래량 보통", color: "text-slate-500" }
    : null;
  const displayedMa20 = data?.ma20 ?? item.ma20;
  const displayedMa60 = data?.ma60 ?? item.ma60;
  const displayedVolExpansion = data?.volExpansion ?? item.volExpansion;
  const hasYahooData = item.dataAvailable && item.currentPrice != null;

  return (
    <Card className="border border-border/50 hover:border-border/80 transition-all duration-200">
      <CardContent className="pt-4 pb-3 px-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          {rank != null && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
              rank <= 3 ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {rank}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-base">{item.name}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{item.theme}</span>
              {score != null && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  score >= 70 ? "bg-rose-50 text-rose-600" : score >= 40 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                }`}>
                  점수 {score}
                </span>
              )}
              {volSignal && (
                <span className={`text-[10px] font-bold ${volSignal.color}`}>{volSignal.label}</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{item.sector} · {item.code}</p>
          </div>
          <div className="text-right shrink-0">
            {item.currentPrice != null
              ? <p className="text-lg font-black">{item.currentPrice.toLocaleString("ko-KR")}원</p>
              : <p className="text-sm text-amber-600 font-bold">데이터 없음</p>
            }
            <p className={`text-[9px] ${hasYahooData ? "text-emerald-600" : "text-amber-600"}`}>
              {hasYahooData ? "Yahoo 최근 시세" : "Yahoo 시세 확인 필요"}
            </p>
          </div>
        </div>

        {/* Returns */}
        <div className="flex gap-3 text-xs">
          {[
            { l: "1M", v: item.ret1m },
            { l: "3M", v: item.ret3m },
            { l: "6M", v: item.ret6m },
          ].map(({ l, v }) => (
            <div key={l} className="text-center">
              <p className="text-[9px] text-muted-foreground">{l}</p>
              <p className={`font-black ${v == null ? "text-muted-foreground" : v >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {fmtPct(v)}
              </p>
            </div>
          ))}
          {item.positionIn52w != null && (
            <div className={`ml-auto text-[10px] px-2 py-0.5 rounded border font-bold ${posColor}`}>
              52주 {(item.positionIn52w * 100).toFixed(0)}% 위치
            </div>
          )}
        </div>

        {/* 52w mini bar */}
        {item.positionIn52w != null && (
          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-rose-400 rounded-full" />
            <div
              className="absolute top-0 w-2 h-2 bg-white border border-slate-400 rounded-full -translate-y-0.5 shadow-sm"
              style={{ left: `${Math.max(0, Math.min(1, item.positionIn52w)) * 100}%` }}
            />
          </div>
        )}

        {/* MA info */}
        {(displayedMa20 != null || displayedMa60 != null || displayedVolExpansion != null) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
            {displayedMa20 != null && (
              <span>
                <span className="text-blue-600 font-bold">MA20</span>
                <span className="text-muted-foreground ml-1">{fmtWon(displayedMa20)}</span>
                {item.currentPrice != null && (
                  <span className={`ml-1 font-bold ${item.currentPrice > displayedMa20 ? "text-emerald-600" : "text-rose-600"}`}>
                    ({fmtPct((item.currentPrice - displayedMa20) / displayedMa20 * 100)})
                  </span>
                )}
              </span>
            )}
            {displayedMa60 != null && (
              <span>
                <span className="text-green-600 font-bold">MA60</span>
                <span className="text-muted-foreground ml-1">{fmtWon(displayedMa60)}</span>
                {item.currentPrice != null && (
                  <span className={`ml-1 font-bold ${item.currentPrice > displayedMa60 ? "text-emerald-600" : "text-rose-600"}`}>
                    ({fmtPct((item.currentPrice - displayedMa60) / displayedMa60 * 100)})
                  </span>
                )}
              </span>
            )}
            {displayedVolExpansion != null && (
              <span className={`font-bold ${displayedVolExpansion > 1.3 ? "text-amber-700" : "text-slate-600"}`}>
                거래량 {displayedVolExpansion > 1 ? "+" : ""}{((displayedVolExpansion - 1) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}

        {/* Pros / Cons compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold text-emerald-700 mb-1">✅ 긍정 신호</p>
            {item.pros.slice(0, 2).map((p, i) => (
              <div key={i} className="flex gap-1.5 text-[10px] text-slate-700 mb-1">
                <span className="text-emerald-500 shrink-0">→</span>
                <span className="leading-tight">{p}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-700 mb-1">⚠️ 리스크</p>
            {item.cons.slice(0, 2).map((c, i) => (
              <div key={i} className="flex gap-1.5 text-[10px] text-slate-700 mb-1">
                <span className="text-rose-400 shrink-0">→</span>
                <span className="leading-tight">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap items-center">
          <a href={naverNewsUrl(item.code)} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-[#03C75A] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#02a84d] transition-colors">
            📰 네이버 뉴스·전망
          </a>
          <a href={naverMainUrl(item.code)} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors">
            📊 종목 상세
          </a>
          <button onClick={() => setExpanded(v => !v)}
            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-colors ml-auto">
            {expanded ? "▲ 차트 닫기" : "▼ 가격 차트 보기"}
          </button>
        </div>

        {/* Expandable chart */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-border/40">
                {isLoading ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
                    차트 로딩 중...
                  </div>
                ) : isError ? (
                  <div className="h-40 flex items-center justify-center text-amber-700 text-sm">
                    Yahoo Finance 차트 연결 오류
                  </div>
                ) : data ? (
                  <PriceChart chartData={data.chartData} period={period} onPeriodChange={setPeriod} />
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    가격 데이터 없음
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function Turnaround() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["turnaround-list"],
    queryFn: fetchList,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 20 * 60 * 1000,
  });

  const { data: watchlistData, isLoading: wLoading } = useQuery({
    queryKey: ["turnaround-watchlist"],
    queryFn: fetchWatchlist,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 20 * 60 * 1000,
  });

  const ranked = data?.ranked ?? [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-l-4 border-primary pl-6 py-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          📈 턴어라운드 — 저가권 + 회복 모멘텀 TOP 10
        </h2>
        <p className="text-muted-foreground mt-1">
            52주 저점 근처에서 반등 모멘텀이 살아나는 종목 자동 스크리닝 · Yahoo Finance 최근 시세
        </p>
      </div>

      {/* ── 쌍끌이/한끌이 안내 배너 ────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-bold mb-1.5">📡 수급(쌍끌이·한끌이) 데이터에 대해</p>
        <p className="leading-relaxed text-xs">
          KRX·네이버금융의 <strong>개인/외국인/기관 실제 매수 데이터</strong>는 서버사이드에서 세션 인증 없이 접근이 차단되어 있어
          쌍끌이(외국인+기관 동시 매수)·한끌이(한쪽만 매수) 여부를 <strong>직접 확인할 수 없습니다</strong>.{" "}
          대신 <strong>거래량 급증(20일 평균이 6개월 평균의 1.5배 이상)</strong>을 기관·외국인 수급 유입의
          프록시 신호로 활용하고 있습니다. <span className="font-bold">MTS의 투자자 탭을 반드시 병행 확인</span>하여 쌍끌이 여부를 직접 검증하세요.
        </p>
      </div>

      {/* ── Scoring explanation ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: "📉", title: "저가권 점수 (40점)", desc: "52주 고점 대비 많이 내려올수록 높음 — 역발상 매수 기회" },
          { icon: "🔄", title: "반등 모멘텀 (30점)", desc: "3개월 하락 후 최근 1개월 반등 시작 시 최고점 — 바닥 확인 신호" },
          { icon: "📊", title: "거래량 수급 (30점)", desc: "20일 거래량이 6개월 평균 대비 급증 → 기관·외국인 매집 추정 신호" },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-slate-50 border border-border/50 rounded-xl p-4">
            <p className="text-lg mb-1">{icon} <span className="font-bold text-sm">{title}</span></p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Loading / Error ─────────────────────────────────────────────────── */}
      {isLoading && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-4xl mb-3 animate-pulse">📊</p>
            <p className="font-bold">20개 종목 Yahoo Finance 데이터 스크리닝 중...</p>
            <p className="text-xs mt-1">가격·이동평균·모멘텀·거래량 분석 중입니다 (최대 30초)</p>
          </CardContent>
        </Card>
      )}
      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-destructive font-bold">데이터 로딩 실패</p>
            <button onClick={() => refetch()}
              className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold">
              다시 시도
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── TOP 10 Main ─────────────────────────────────────────────────────── */}
      {ranked.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>📅 스크리닝: {data?.screeningMethod} · 20종목 → TOP 10</span>
            <button onClick={() => refetch()} disabled={isRefetching}
              className="text-primary font-bold disabled:opacity-50">
              {isRefetching ? "갱신 중..." : "↻ 새로고침"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ranked.map((item) => (
              <DeepAnalysisCard
                key={item.code}
                item={item}
                rank={item.rank}
                score={item.score}
                chartKey="turnaround-chart"
                chartFetcher={fetchChart}
              />
            ))}
          </div>
        </>
      )}

      {/* ── 관심종목 6종목 섹션 ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-5 py-1">
          <h3 className="text-xl font-black tracking-tight">📌 관심 종목 심층 분석</h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            LG생활건강 · LG화학 · 아모레퍼시픽 · 포스코홀딩스 · NAVER · LG디스플레이 — 순위 없음, 네이버 뉴스 바로가기
          </p>
        </div>

        {wLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <p className="animate-pulse">관심종목 데이터 불러오는 중...</p>
            </CardContent>
          </Card>
        ) : watchlistData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchlistData.items.map(item => (
              <DeepAnalysisCard
                key={item.code}
                item={item}
                chartKey="watchlist-chart"
                chartFetcher={fetchWatchlistChart}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      <div className="text-xs text-muted-foreground border-t border-border/40 pt-4 leading-relaxed">
        ⚠️ 본 스크리닝은 기술적 지표(가격·거래량·이동평균) 기반 참고 정보이며 투자 권유가 아닙니다.
        실제 쌍끌이·한끌이 확인은 MTS 투자자 탭을 직접 확인하세요.
        모든 투자 결정의 책임은 본인에게 있습니다.
      </div>
    </div>
  );
}
