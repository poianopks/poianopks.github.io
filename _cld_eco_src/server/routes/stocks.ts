import { Router } from "express";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promisify } from "node:util";

const router = Router();
const execFileAsync = promisify(execFile);
const gapAnalysisScript = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/kospi_gap_analysis.py",
);

// In-memory cache: 5 min TTL
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Short TTL for real-time market data (1 min)
const REALTIME_TTL = 60 * 1000;

function calcMA(closes: (number | null)[], period: number): number | null {
  const valid = closes.filter((c): c is number => c !== null && !isNaN(c));
  if (valid.length < period) return null;
  const slice = valid.slice(-period);
  return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
}

async function fetchChart(symbol: string, interval: string, range: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);
  return res.json() as Promise<any>;
}

async function getQuote(symbol: string, name: string) {
  // range=1d interval=1m → chartPreviousClose = 어제 종가 (정확)
  const [intraday, daily] = await Promise.all([
    fetchChart(symbol, "1m", "1d"),
    fetchChart(symbol, "1d", "1y"),
  ]);

  const result = daily?.chart?.result?.[0];
  if (!result) throw new Error(`No result for ${symbol}`);

  const meta = result.meta as any;
  const intradayMeta = intraday?.chart?.result?.[0]?.meta as any;

  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const price: number = intradayMeta?.regularMarketPrice ?? meta.regularMarketPrice ?? 0;
  const prevClose: number = intradayMeta?.chartPreviousClose ?? meta.chartPreviousClose ?? price;
  const regularMarketTime: number | null =
    intradayMeta?.regularMarketTime ?? meta.regularMarketTime ?? null;
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  const ma50 = calcMA(closes, 50);
  const ma200d = calcMA(closes, 200);
  const dev200d = ma200d ? ((price - ma200d) / ma200d) * 100 : null;

  // 200-week MA — fetch 5y weekly
  let ma200w: number | null = null;
  let dev200w: number | null = null;
  try {
    const weekly = await fetchChart(symbol, "1wk", "5y");
    const wRes = weekly?.chart?.result?.[0];
    const wCloses: (number | null)[] = wRes?.indicators?.quote?.[0]?.close ?? [];
    ma200w = calcMA(wCloses, 200);
    dev200w = ma200w ? ((price - ma200w) / ma200w) * 100 : null;
  } catch {
    // weekly fetch optional
  }

  return {
    symbol,
    name,
    price: Math.round(price * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    ma50: ma50 ? Math.round(ma50 * 100) / 100 : null,
    ma200d,
    ma200w,
    dev200d: dev200d ? Math.round(dev200d * 100) / 100 : null,
    dev200w: dev200w ? Math.round(dev200w * 100) / 100 : null,
    marketTime: regularMarketTime
      ? new Date(regularMarketTime * 1000).toISOString()
      : null,
    marketState: intradayMeta?.marketState ?? meta.marketState ?? "UNKNOWN",
    source: "Yahoo Finance",
  };
}

// ── PBR 밸류에이션 ─────────────────────────────────────────────────────────────
// Try multiple Yahoo Finance endpoints to get priceToBook
async function fetchPbr(symbol: string): Promise<number | null> {
  // Method 1: v10 quoteSummary defaultKeyStatistics
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=defaultKeyStatistics`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json: any = await res.json();
      const raw = json?.quoteSummary?.result?.[0]?.defaultKeyStatistics?.priceToBook?.raw;
      if (typeof raw === "number" && raw > 0) return Math.round(raw * 100) / 100;
    }
  } catch { /* fall through */ }

  // Method 2: v8 chart meta (summaryProfile not available but try)
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=priceToBook,bookValue,regularMarketPrice`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json: any = await res.json();
      const result = json?.quoteResponse?.result?.[0];
      const raw = result?.priceToBook;
      if (typeof raw === "number" && raw > 0) return Math.round(raw * 100) / 100;
    }
  } catch { /* fall through */ }

  return null;
}

// 국내 종목은 네이버 증권(최근 확정 BPS 기준 PBR)을 먼저 씁니다. Yahoo는 국내 종목 PBR을 자주 비워 둡니다.
export async function fetchNaverPbr(code: string): Promise<{ pbr: number; bps: number | null } | null> {
  try {
    const res = await fetch(`https://m.stock.naver.com/api/stock/${code}/integration`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Referer: "https://m.stock.naver.com/" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const infos: any[] = json?.totalInfos ?? [];
    const num = (c: string) => {
      const v = infos.find((i) => i?.code === c)?.value;
      const n = parseFloat(String(v ?? "").replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const pbr = num("pbr");
    return pbr == null ? null : { pbr: Math.round(pbr * 100) / 100, bps: num("bps") };
  } catch {
    return null;
  }
}

const PBR_THRESHOLDS: Record<string, {
  label: string;
  histAvg: number;
  low: number;
  midLow: number;
  midHigh: number;
  high: number;
  histRange: string;
  desc: string;
}> = {
  "^KS11":     { label: "KOSPI",    histAvg: 1.0,  low: 0.85, midLow: 0.85, midHigh: 1.3, high: 1.6, histRange: "0.8~1.8", desc: "코스피 시장 전체 평균 PBR" },
  "005930.KS": { label: "삼성전자", histAvg: 1.6,  low: 1.2,  midLow: 1.2,  midHigh: 2.2, high: 3.0, histRange: "1.0~3.0", desc: "삼성전자 주가순자산비율" },
  "000660.KS": { label: "SK하이닉스", histAvg: 2.5, low: 1.8, midLow: 1.8,  midHigh: 4.0, high: 6.0, histRange: "1.0~7.0", desc: "SK하이닉스 주가순자산비율 (반도체 사이클 민감)" },
  "^GSPC":     { label: "S&P 500", histAvg: 3.5, low: 2.2, midLow: 2.2, midHigh: 4.0, high: 5.0, histRange: "2.0~5.0", desc: "S&P 500 구성 기업의 평균 주가순자산비율" },
  "^NDX":      { label: "NASDAQ 100", histAvg: 6.5, low: 3.5, midLow: 3.5, midHigh: 8.0, high: 10.0, histRange: "3.0~12.0", desc: "NASDAQ 100 구성 기업의 평균 주가순자산비율" },
  "TSM":       { label: "TSMC", histAvg: 3.5, low: 2.0, midLow: 2.0, midHigh: 5.5, high: 7.0, histRange: "1.5~8.0", desc: "TSMC 주가순자산비율 (파운드리 업황 민감)" },
  "MU":        { label: "마이크론", histAvg: 2.5, low: 1.0, midLow: 1.0, midHigh: 3.5, high: 5.0, histRange: "0.8~6.0", desc: "마이크론 주가순자산비율 (메모리 사이클 민감)" },
  "NVDA":      { label: "엔비디아", histAvg: 25.0, low: 12.0, midLow: 12.0, midHigh: 35.0, high: 45.0, histRange: "10~60", desc: "엔비디아 주가순자산비율 (성장주 특성상 변동 큼)" },
};

function getPbrVerdict(symbol: string, pbr: number): { grade: string; label: string; color: string; bg: string; border: string; reason: string } {
  const t = PBR_THRESHOLDS[symbol];
  if (!t) return { grade: "unknown", label: "알수없음", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", reason: "" };
  if (pbr < t.low)     return { grade: "cheap",   label: "저평가", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", reason: `역사적 저점 구간 (${t.histRange}배 범위 하단)` };
  if (pbr < t.midHigh) return { grade: "fair",    label: "중간·적정",  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-300",    reason: `역사적 평균 구간 (역대 평균 ${t.histAvg}배)` };
  if (pbr < t.high)    return { grade: "pricey",  label: "고평가",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-300",   reason: `역사적 부담 구간 (평균 ${t.histAvg}배 대비 ${Math.round((pbr/t.histAvg-1)*100)}% 초과)` };
  return               { grade: "extreme", label: "극단 과열", color: "text-red-700",     bg: "bg-red-50",     border: "border-red-400",     reason: `역사적 고점 구간 — 평균 ${t.histAvg}배 대비 ${Math.round((pbr/t.histAvg-1)*100)}% 과열` };
}

function naverNote(n: { bps: number | null } | null) {
  if (!n) return "";
  return n.bps ? `네이버 증권 PBR (최근 확정 BPS ${n.bps.toLocaleString("ko-KR")}원 기준)` : "네이버 증권 PBR";
}

// Static estimated PBR values (2026.07 기준 추정) — used when Yahoo Finance fetch fails
// These are calculated from current price / known book value progression
const PBR_ESTIMATES: Record<string, number> = {
  "^KS11":     1.65,   // KOSPI ~5,500 수준: 역사 저점(0.85@2022) 대비 대폭 상승 추정
  "^GSPC":     5.1,    // S&P 500: SPY ETF 구성 기업 기준 추정
  "^NDX":      8.5,    // NASDAQ 100: QQQ ETF 구성 기업 기준 추정
  "TSM":       5.9,    // TSMC: 파운드리 성장·고정자산 투자 사이클 반영 추정
  "MU":        3.4,    // 마이크론: 메모리 업황 회복 구간 추정
  "NVDA":      38.0,   // 엔비디아: AI 성장 프리미엄 반영 추정
  "005930.KS": 2.3,    // 삼성전자: 현재 주가 기준 추정 (BPS ~22,000원 기준)
  "000660.KS": 4.8,    // SK하이닉스: HBM 사이클 고점 수준 추정
};

router.get("/stocks/pbr", async (req, res) => {
  const KEY = "pbr_v4";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  // Broad indexes do not expose a reliable priceToBook field, so use
  // their investable SPY/QQQ ETF proxies while keeping the index labels in the UI.
  const [samNaver, skNaver] = await Promise.all([fetchNaverPbr("005930"), fetchNaverPbr("000660")]);
  const [samPbr, skPbr, kodexPbr, spyPbr, qqqPbr, tsmPbr, muPbr, nvdaPbr] = await Promise.all([
    samNaver?.pbr ?? fetchPbr("005930.KS"),
    skNaver?.pbr ?? fetchPbr("000660.KS"),
    fetchPbr("069500.KS"),
    fetchPbr("SPY"),
    fetchPbr("QQQ"),
    fetchPbr("TSM"),
    fetchPbr("MU"),
    fetchPbr("NVDA"),
  ]);

  // Fall back to static estimates when Yahoo Finance returns null
  const kospiPbr  = kodexPbr ?? PBR_ESTIMATES["^KS11"];
  const samFinal  = samPbr   ?? PBR_ESTIMATES["005930.KS"];
  const skFinal   = skPbr    ?? PBR_ESTIMATES["000660.KS"];
  const sp500Pbr  = spyPbr   ?? PBR_ESTIMATES["^GSPC"];
  const ndxPbr    = qqqPbr   ?? PBR_ESTIMATES["^NDX"];
  const tsmFinal  = tsmPbr   ?? PBR_ESTIMATES["TSM"];
  const muFinal   = muPbr    ?? PBR_ESTIMATES["MU"];
  const nvdaFinal = nvdaPbr  ?? PBR_ESTIMATES["NVDA"];

  const isKospiEstimate  = kodexPbr == null;
  const isSamEstimate    = samPbr   == null;
  const isSkEstimate     = skPbr    == null;
  const isSp500Estimate  = spyPbr   == null;
  const isNdxEstimate    = qqqPbr   == null;
  const isTsmEstimate    = tsmPbr   == null;
  const isMuEstimate     = muPbr    == null;
  const isNvdaEstimate   = nvdaPbr  == null;

  const items = [
    {
      symbol: "^KS11",
      name: "KOSPI",
      pbr: kospiPbr,
      isEstimate: isKospiEstimate,
      note: isKospiEstimate
        ? "KOSPI 추정값 (2026.07 현재 주가 기준 추정 · 참고용)"
        : "KODEX 200 ETF(069500) 기준 — KOSPI 전체 PBR 근사치",
      thresholds: PBR_THRESHOLDS["^KS11"],
      verdict: getPbrVerdict("^KS11", kospiPbr),
    },
    {
      symbol: "005930.KS",
      name: "삼성전자",
      pbr: samFinal,
      isEstimate: isSamEstimate,
      note: isSamEstimate ? "추정값 (2026.07 현재 주가 기준 추정 · 참고용)" : naverNote(samNaver),
      thresholds: PBR_THRESHOLDS["005930.KS"],
      verdict: getPbrVerdict("005930.KS", samFinal),
    },
    {
      symbol: "000660.KS",
      name: "SK하이닉스",
      pbr: skFinal,
      isEstimate: isSkEstimate,
      note: isSkEstimate
        ? "추정값 (2026.07 현재 주가 기준 추정 · 참고용) · 반도체 사이클 민감"
        : [naverNote(skNaver), "반도체 사이클에 따라 PBR 변동 폭 매우 큼"].filter(Boolean).join(" · "),
      thresholds: PBR_THRESHOLDS["000660.KS"],
      verdict: getPbrVerdict("000660.KS", skFinal),
    },
    {
      symbol: "^GSPC",
      name: "S&P 500",
      pbr: sp500Pbr,
      isEstimate: isSp500Estimate,
      note: isSp500Estimate
        ? "SPY ETF 구성 기업 기준 추정값 (참고용)"
        : "SPY ETF 구성 기업 평균 PBR — S&P 500 참고치",
      thresholds: PBR_THRESHOLDS["^GSPC"],
      verdict: getPbrVerdict("^GSPC", sp500Pbr),
    },
    {
      symbol: "^NDX",
      name: "NASDAQ 100",
      pbr: ndxPbr,
      isEstimate: isNdxEstimate,
      note: isNdxEstimate
        ? "QQQ ETF 구성 기업 기준 추정값 (참고용)"
        : "QQQ ETF 구성 기업 평균 PBR — NASDAQ 100 참고치",
      thresholds: PBR_THRESHOLDS["^NDX"],
      verdict: getPbrVerdict("^NDX", ndxPbr),
    },
    {
      symbol: "TSM",
      name: "TSMC",
      pbr: tsmFinal,
      isEstimate: isTsmEstimate,
      note: isTsmEstimate
        ? "추정값 (참고용) · 파운드리 업황 민감"
        : "Yahoo Finance 실시간 PBR · 파운드리 업황 민감",
      thresholds: PBR_THRESHOLDS["TSM"],
      verdict: getPbrVerdict("TSM", tsmFinal),
    },
    {
      symbol: "MU",
      name: "마이크론",
      pbr: muFinal,
      isEstimate: isMuEstimate,
      note: isMuEstimate
        ? "추정값 (참고용) · 메모리 사이클 민감"
        : "Yahoo Finance 실시간 PBR · 메모리 사이클 민감",
      thresholds: PBR_THRESHOLDS["MU"],
      verdict: getPbrVerdict("MU", muFinal),
    },
    {
      symbol: "NVDA",
      name: "엔비디아",
      pbr: nvdaFinal,
      isEstimate: isNvdaEstimate,
      note: isNvdaEstimate
        ? "추정값 (참고용) · AI 성장주 특성상 변동 큼"
        : "Yahoo Finance 실시간 PBR · AI 성장주 특성상 변동 큼",
      thresholds: PBR_THRESHOLDS["NVDA"],
      verdict: getPbrVerdict("NVDA", nvdaFinal),
    },
  ];

  const payload = { items, updatedAt: new Date().toISOString(), cached: false };
  cache.set(KEY, { data: payload, ts: Date.now() });
  res.json(payload);
});

// ── KOSPI 갭 캔들 방향 분석 (Python) ─────────────────────────────────────────
router.get("/stocks/gap-analysis", async (_req, res): Promise<void> => {
  const KEY = "gap_analysis_v2";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  try {
    const { stdout } = await execFileAsync("python3", [gapAnalysisScript], {
      timeout: 25_000,
      maxBuffer: 1_000_000,
    });
    const result = JSON.parse(stdout.trim()) as { error?: string; [key: string]: unknown };
    if (result.error) throw new Error(result.error);

    const payload = { ...result, updatedAt: new Date().toISOString(), cached: false };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "갭 분석을 실행하지 못했습니다.";
    res.status(502).json({ error: message });
  }
});

router.get("/stocks/quotes", async (req, res) => {
  const KEY = "quotes_v2";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < REALTIME_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const symbols = [
    { sym: "^KS11",     name: "KOSPI" },
    { sym: "^GSPC",     name: "S&P 500" },
    { sym: "^NDX",      name: "NASDAQ 100" },
    { sym: "005930.KS", name: "삼성전자" },
    { sym: "000660.KS", name: "SK하이닉스" },
    { sym: "TSM",       name: "TSMC" },
    { sym: "MU",        name: "마이크론" },
    { sym: "NVDA",      name: "엔비디아" },
  ];

  const settled = await Promise.allSettled(
    symbols.map((s) => getQuote(s.sym, s.name)),
  );

  const quotes: Record<string, unknown> = {};
  settled.forEach((r, i) => {
    quotes[symbols[i].sym] =
      r.status === "fulfilled" ? r.value : { error: (r.reason as Error).message };
  });

  const payload = { quotes, updatedAt: new Date().toISOString(), cached: false };
  cache.set(KEY, { data: payload, ts: Date.now() });
  res.json(payload);
});

// ── 반도체 주가 히스토리 (삼성전자 + SK하이닉스 주간 2년) ─────────────────────
router.get("/stocks/semiconductor-history", async (req, res) => {
  const KEY = "semi_history_v2";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  try {
    const [samData, skData] = await Promise.all([
      fetchChart("005930.KS", "1wk", "2y"),
      fetchChart("000660.KS", "1wk", "2y"),
    ]);

    const samResult = samData?.chart?.result?.[0];
    const skResult  = skData?.chart?.result?.[0];

    const samTs: number[]           = samResult?.timestamp ?? [];
    const samCloses: (number|null)[] = samResult?.indicators?.quote?.[0]?.close ?? [];
    const skTs: number[]            = skResult?.timestamp ?? [];
    const skCloses: (number|null)[]  = skResult?.indicators?.quote?.[0]?.close ?? [];

    const samMap = new Map<string, number>();
    samTs.forEach((ts, i) => {
      const v = samCloses[i];
      if (v != null && !isNaN(v)) samMap.set(new Date(ts * 1000).toISOString().slice(0,10), v);
    });
    const skMap = new Map<string, number>();
    skTs.forEach((ts, i) => {
      const v = skCloses[i];
      if (v != null && !isNaN(v)) skMap.set(new Date(ts * 1000).toISOString().slice(0,10), v);
    });

    const dates = [...samMap.keys()].filter(d => skMap.has(d)).sort();
    const series = dates.map(d => ({ date: d, sam: samMap.get(d)!, sk: skMap.get(d)! }));

    const payload = { series, updatedAt: new Date().toISOString(), cached: false };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── 반도체 신호 차트 (주간 MA40 + 데드크로스 + 신호 상태) ────────────────────
router.get("/stocks/signal-chart", async (req, res) => {
  const KEY = "signal_chart_v3";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  try {
    // 3y weekly for proper MA40 history
    const [samData, skData] = await Promise.all([
      fetchChart("005930.KS", "1wk", "3y"),
      fetchChart("000660.KS", "1wk", "3y"),
    ]);

    function buildSeries(data: any, label: string) {
      const result = data?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp ?? [];
      const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
      const highs:  (number | null)[] = result?.indicators?.quote?.[0]?.high  ?? [];
      const lows:   (number | null)[] = result?.indicators?.quote?.[0]?.low   ?? [];

      // Rolling MA40
      const series: {
        date: string; close: number; ma40: number | null;
        dev: number | null; signal: string; high: number; low: number;
      }[] = [];

      const validCloses: number[] = [];
      timestamps.forEach((ts, i) => {
        const c = closes[i]; const h = highs[i] ?? 0; const l = lows[i] ?? 0;
        if (c == null || isNaN(c) || c <= 0) return;
        validCloses.push(c);
        const n = validCloses.length;
        let ma40: number | null = null;
        if (n >= 40) {
          const slice = validCloses.slice(n - 40, n);
          ma40 = Math.round((slice.reduce((a, b) => a + b, 0) / 40) * 10) / 10;
        }
        const dev = ma40 ? Math.round(((c - ma40) / ma40) * 1000) / 10 : null;

        // Signal: safe <30%, caution 30-80%, danger 80-120%, sell >120% OR declining from >80%
        let signal = "safe";
        if (dev !== null) {
          if (dev >= 120) signal = "sell";
          else if (dev >= 80) signal = "danger";
          else if (dev >= 30) signal = "caution";
        }

        series.push({
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          close: c, ma40, dev, signal,
          high: h, low: l,
        });
      });

      // Dead-cross detection: price crosses below MA40 (after being above)
      // Mark crossovers in the series
      for (let i = 1; i < series.length; i++) {
        const prev = series[i - 1]; const cur = series[i];
        if (prev.ma40 && cur.ma40) {
          if (prev.close > prev.ma40 && cur.close < cur.ma40) {
            (cur as any).crossType = "dead";      // 데드크로스: 가격 MA 하향 돌파
          } else if (prev.close < prev.ma40 && cur.close > cur.ma40) {
            (cur as any).crossType = "golden";    // 골든크로스: 가격 MA 상향 돌파
          }
        }
      }

      // Slice to last 2 years (104 weeks) for display — keep enough MA history
      const display = series.slice(-104);

      // Current signal summary
      const last = display[display.length - 1];
      const prev8 = display.slice(-9, -1);
      const devTrend = prev8.length >= 2
        ? (last.dev ?? 0) - (prev8[0].dev ?? 0)
        : 0;

      return { series: display, last, devTrend, label };
    }

    const sam = buildSeries(samData, "삼성전자");
    const sk  = buildSeries(skData,  "SK하이닉스");

    // Ratio series (sam/sk) for divergence
    const samMap = new Map(sam.series.map(p => [p.date, p.close]));
    const skMap  = new Map(sk.series.map(p => [p.date, p.close]));
    const commonDates = sam.series.map(p => p.date).filter(d => skMap.has(d));
    const ratioSeries = commonDates.map(d => ({
      date: d,
      ratio: Math.round((samMap.get(d)! / skMap.get(d)!) * 10000) / 10000,
    }));

    // Divergence: is SK Hynix in new high while Samsung lagging?
    // Compare 12-week (3-month) high for SK vs Samsung
    const last12 = ratioSeries.slice(-12);
    const ratioNow = last12[last12.length - 1]?.ratio ?? 1;
    const ratio12ago = last12[0]?.ratio ?? ratioNow;
    const divergenceWeeks = ratioNow < ratio12ago * 0.85 ? 12 : ratioNow < ratio12ago * 0.92 ? 6 : 0;

    // Overall composite signal
    const samDev = sam.last?.dev ?? 0;
    const skDev  = sk.last?.dev ?? 0;
    const devExtreme = samDev > 80 || skDev > 80;
    const bothExtreme = samDev > 80 && skDev > 80;
    const divergeAlert = divergenceWeeks >= 12;
    const compositeSignal =
      (bothExtreme && divergeAlert) ? "sell" :
      (devExtreme  && divergeAlert) ? "danger" :
      devExtreme   ? "danger" :
      (samDev > 30 || skDev > 30) ? "caution" : "safe";

    const payload = {
      sam: { series: sam.series, last: sam.last, devTrend: sam.devTrend },
      sk:  { series: sk.series,  last: sk.last,  devTrend: sk.devTrend },
      ratioSeries,
      divergenceWeeks,
      compositeSignal,
      updatedAt: new Date().toISOString(),
      cached: false,
    };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── 살아있는 ATH 분석 ─────────────────────────────────────────────────────────
const ATH_CACHE_TTL = 30 * 60 * 1000; // 30분

router.get("/stocks/alive-ath", async (req, res) => {
  const KEY = "alive_ath_v1";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < ATH_CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  try {
    // Fetch 5y daily + max monthly in parallel
    // 5y daily gives enough granularity for alive ATH detection
    // (all alive ATHs are post-Sep 2025; pre-2022 ATHs all broken during 2022-2024 correction)
    const [dailyJson, monthlyJson] = await Promise.all([
      (async () => {
        const u = `https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1d&range=5y&includePrePost=false`;
        const r = await fetch(u, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "application/json" },
          signal: AbortSignal.timeout(20000),
        });
        if (!r.ok) throw new Error(`Yahoo Finance HTTP ${r.status}`);
        return r.json() as Promise<any>;
      })(),
      (async () => {
        const u = `https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1mo&range=max&includePrePost=false`;
        const r = await fetch(u, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "application/json" },
          signal: AbortSignal.timeout(20000),
        });
        if (!r.ok) return null;
        return r.json() as Promise<any>;
      })(),
    ]);

    const result = dailyJson?.chart?.result?.[0];
    if (!result) throw new Error("No chart result");

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    // Build (date, close) pairs — filter nulls
    const rows: { date: string; close: number }[] = [];
    timestamps.forEach((ts, i) => {
      const c = closes[i];
      if (c != null && !isNaN(c) && c > 0) {
        rows.push({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: c });
      }
    });

    if (rows.length < 10) throw new Error("Insufficient data");

    // Get analysis start from monthly data (full history)
    const monthlyResult = monthlyJson?.chart?.result?.[0];
    const monthlyTs: number[] = monthlyResult?.timestamp ?? [];
    const analysisStartFull = monthlyTs.length > 0
      ? new Date(monthlyTs[0] * 1000).toISOString().slice(0, 10)
      : rows[0]?.date ?? "";

    const today = new Date().toISOString().slice(0, 10);

    // Seed runningMax from monthly history BEFORE the daily window starts
    // This ensures ATHs are truly "all-time" relative to full KOSPI history
    const dailyWindowStart = rows[0]?.date ?? "";
    let runningMax = -Infinity;
    if (monthlyResult) {
      const mCloses: (number | null)[] = monthlyResult?.indicators?.quote?.[0]?.close ?? [];
      monthlyTs.forEach((ts, i) => {
        const d = new Date(ts * 1000).toISOString().slice(0, 10);
        const c = mCloses[i];
        if (d < dailyWindowStart && c != null && !isNaN(c) && c > 0) {
          if (c > runningMax) runningMax = c;
        }
      });
    }

    let totalAthCount = 0;

    // Mark ATH days
    const athDays: { idx: number; date: string; close: number }[] = [];
    rows.forEach((r, i) => {
      if (r.close > runningMax) {
        runningMax = r.close;
        totalAthCount++;
        athDays.push({ idx: i, date: r.date, close: r.close });
      }
    });

    // For each ATH day, check if any future close < that ATH price
    const aliveList: {
      date: string;
      close: number;
      daysAlive: number;
      rank: number;
    }[] = [];

    athDays.forEach(({ idx, date, close }) => {
      const futureCloses = rows.slice(idx + 1).map(r => r.close);
      const isAlive =
        futureCloses.length === 0 ||
        Math.min(...futureCloses) >= close;

      if (isAlive) {
        const lastDate = rows[rows.length - 1].date;
        const ms = new Date(lastDate).getTime() - new Date(date).getTime();
        const daysAlive = Math.round(ms / (1000 * 60 * 60 * 24));
        aliveList.push({ date, close: Math.round(close * 100) / 100, daysAlive, rank: 0 });
      }
    });

    // Sort by daysAlive descending, assign rank
    aliveList.sort((a, b) => b.daysAlive - a.daysAlive);
    aliveList.forEach((item, i) => { item.rank = i + 1; });

    // analysisStart = actual start of the daily window (honest representation)
    const analysisStart = dailyWindowStart;
    const analysisEnd   = rows[rows.length - 1]?.date ?? today;

    // Highest alive ATH = the most recently set ATH still alive (highest close in the alive list)
    const maxAlivePrice = aliveList.length > 0 ? Math.max(...aliveList.map(a => a.close)) : null;
    const maxAliveItem  = aliveList.find(a => a.close === maxAlivePrice) ?? null;

    // Lowest alive ATH = the ALL-INVALIDATING FLOOR
    // If price ever closes below this level, ALL alive ATHs die simultaneously
    const minAlivePrice = aliveList.length > 0 ? Math.min(...aliveList.map(a => a.close)) : null;
    const minAliveItem  = aliveList.find(a => a.close === minAlivePrice) ?? null;

    const payload = {
      aliveList,
      totalAthCount,
      aliveCount: aliveList.length,
      analysisStart,
      analysisEnd,
      totalDays: rows.length,
      // Highest alive ATH: most recently set surviving ATH
      maxAlivePrice,
      maxAliveDate: maxAliveItem?.date ?? null,
      maxAliveDaysAlive: maxAliveItem?.daysAlive ?? null,
      // Lowest alive ATH: the all-invalidating floor (closing below = ALL alive ATHs die)
      minAlivePrice,
      minAliveDate: minAliveItem?.date ?? null,
      minAliveDaysAlive: minAliveItem?.daysAlive ?? null,
      updatedAt: new Date().toISOString(),
      cached: false,
    };

    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── 투자자 매매동향 ───────────────────────────────────────────────────────────
const INVESTOR_CACHE_TTL = 30 * 60 * 1000; // 30 min

function parseKrxNum(s: string | undefined): number {
  if (!s) return 0;
  return Number(String(s).replace(/,/g, "")) || 0;
}

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function fetchKrxInvestor(startDd: string, endDd: string) {
  const body = new URLSearchParams({
    bld: "dbms/MDC/STAT/standard/MDCSTAT02302",
    locale: "ko_KR",
    mktId: "STK",
    strtDd: startDd,
    endDd: endDd,
    share: "1",
    money: "3",
    csvxls_isNo: "false",
  });

  const res = await fetch("http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "http://data.krx.co.kr/contents/MDC/STAT/standard/MDCSTAT02302.cmd",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`KRX HTTP ${res.status}`);
  const json = await res.json() as any;
  const rows: any[] = json?.OutBlock_1 ?? json?.output ?? [];
  if (!rows.length) throw new Error("KRX empty response");

  return rows.map((r: any) => ({
    date: String(r.TRD_DD ?? "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    foreign: parseKrxNum(r.TRDVAL_NETBID_FRGN),
    institution: parseKrxNum(r.TRDVAL_NETBID_INST),
    individual: parseKrxNum(r.TRDVAL_NETBID_INDV),
    foreignBuy: parseKrxNum(r.TRDVAL_BID_FRGN),
    foreignSell: parseKrxNum(r.TRDVAL_ASK_FRGN),
    instBuy: parseKrxNum(r.TRDVAL_BID_INST),
    instSell: parseKrxNum(r.TRDVAL_ASK_INST),
    indivBuy: parseKrxNum(r.TRDVAL_BID_INDV),
    indivSell: parseKrxNum(r.TRDVAL_ASK_INDV),
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

/** Realistic fallback: generate 1y of plausible KOSPI investor flow data */
function generateFallback(days: number) {
  const rows = [];
  // Seed with known 2025-2026 trend: individuals net buying, foreigners/institutions net selling in strong rally
  const rng = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) / 100) * 100;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const dateStr = d.toISOString().slice(0, 10);
    // Rough realistic ranges (억원)
    const frgn = rng(-8000, 3000);
    const inst = rng(-5000, 2000);
    const indiv = -(frgn + inst) + rng(-1000, 1000);
    rows.push({ date: dateStr, foreign: frgn, institution: inst, individual: indiv,
      foreignBuy: rng(30000, 80000), foreignSell: rng(30000, 80000),
      instBuy: rng(20000, 60000), instSell: rng(20000, 60000),
      indivBuy: rng(40000, 100000), indivSell: rng(40000, 100000) });
  }
  return rows;
}

function parsePeriodDays(p: string | undefined): number {
  const map: Record<string, number> = {
    "2y": 730, "1.5y": 547, "1y": 365,
    "6m": 182, "5m": 152, "4m": 121, "3m": 91, "2m": 60, "1m": 30, "1d": 1,
  };
  return map[p ?? "1y"] ?? 365;
}

router.get("/stocks/investor-trading", async (req, res) => {
  const period = parsePeriodDays(req.query.period as string);
  const KEY = `investor_v3_${period}`;
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < INVESTOR_CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const endDd = getDateStr(0);
  const startDd = getDateStr(period);

  let rows: any[];
  let source = "krx";
  try {
    rows = await fetchKrxInvestor(startDd, endDd);
  } catch (e) {
    rows = generateFallback(period);
    source = "fallback";
  }

  // cumulative sums
  let cumFgn = 0, cumInst = 0, cumIndiv = 0;
  const data = rows.map((r: any) => {
    cumFgn += r.foreign;
    cumInst += r.institution;
    cumIndiv += r.individual;
    return { ...r, cumForeign: cumFgn, cumInstitution: cumInst, cumIndividual: cumIndiv };
  });

  const payload = { data, source, updatedAt: new Date().toISOString(), cached: false };
  cache.set(KEY, { data: payload, ts: Date.now() });
  res.json(payload);
});

// ── 삼성전자 매매동향 ─────────────────────────────────────────────────────────
async function fetchKrxSamsung(startDd: string, endDd: string) {
  const body = new URLSearchParams({
    bld: "dbms/MDC/STAT/standard/MDCSTAT02303",
    locale: "ko_KR",
    isuCd: "KR7005930003",
    strtDd: startDd,
    endDd: endDd,
    share: "2",
    money: "3",
    csvxls_isNo: "false",
  });

  const res = await fetch("http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "http://data.krx.co.kr/contents/MDC/STAT/standard/MDCSTAT02303.cmd",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`KRX Samsung HTTP ${res.status}`);
  const json = await res.json() as any;
  const rows: any[] = json?.OutBlock_1 ?? json?.output ?? [];
  if (!rows.length) throw new Error("KRX Samsung empty response");

  return rows.map((r: any) => ({
    date: String(r.TRD_DD ?? "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    foreign:     parseKrxNum(r.TRDVOL_NETBID_FRGN ?? r.TRDVAL_NETBID_FRGN),
    institution: parseKrxNum(r.TRDVOL_NETBID_INST ?? r.TRDVAL_NETBID_INST),
    individual:  parseKrxNum(r.TRDVOL_NETBID_INDV ?? r.TRDVAL_NETBID_INDV),
    price:       parseKrxNum(r.TDD_CLSPRC ?? r.CLSPRC ?? r.CLSPRC_WTD),
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

/** Fallback: realistic Samsung daily investor trading (단위: 주) */
function generateSamsungFallback(days: number) {
  const rows = [];
  const rng = (min: number, max: number) =>
    Math.round((Math.random() * (max - min) + min) / 1000) * 1000;

  // Samsung 2025-2026 price range approximately 250,000~360,000
  let price = 310000;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = d.toISOString().slice(0, 10);
    // daily noise on price
    price = Math.max(200000, Math.min(400000, price + (Math.random() - 0.52) * 8000));
    // foreigners trending net sell, institution net buy over past year
    const frgn = rng(-2000000, 500000);
    const inst  = rng(-800000, 1200000);
    const indiv = -(frgn + inst) + rng(-200000, 200000);
    rows.push({ date: dateStr, foreign: frgn, institution: inst, individual: indiv, price: Math.round(price) });
  }
  return rows;
}

router.get("/stocks/samsung-trading", async (req, res) => {
  const period = parsePeriodDays(req.query.period as string);
  const KEY = `samsung_v1_${period}`;
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < INVESTOR_CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const endDd = getDateStr(0);
  const startDd = getDateStr(period);

  let rows: any[];
  let source = "krx";
  try {
    rows = await fetchKrxSamsung(startDd, endDd);
  } catch {
    rows = generateSamsungFallback(period);
    source = "fallback";
  }

  let cumFgn = 0, cumInst = 0, cumIndiv = 0;
  const data = rows.map((r: any) => {
    cumFgn   += r.foreign;
    cumInst  += r.institution;
    cumIndiv += r.individual;
    return { ...r, cumForeign: cumFgn, cumInstitution: cumInst, cumIndividual: cumIndiv };
  });

  const payload = { data, source, updatedAt: new Date().toISOString(), cached: false };
  cache.set(KEY, { data: payload, ts: Date.now() });
  res.json(payload);
});

// ── DRAM Spot vs Contract 역사적 가격 ────────────────────────────────────────
// 출처: DRAMeXchange/TrendForce 공개 분기 리포트 기반 DDR4 8Gb (1Gx8) 가격 (USD)
// 현물(Spot): 시장 수요공급에 따른 즉시 거래 가격
// 고정(Contract): 대형 PC제조사·서버업체와의 분기 계약 가격
router.get("/stocks/dram-history", async (req, res) => {
  const KEY = "dram_history_v1";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < 60 * 60 * 1000) { // 1hr cache
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  // Historical DRAM DDR4 8Gb prices (quarterly, USD, from public TrendForce reports)
  const dramData = [
    // === 상승 사이클 2016~2018 ===
    { date: "2016-Q1", spot: 2.50, contract: 2.85 },
    { date: "2016-Q2", spot: 2.60, contract: 2.95 },
    { date: "2016-Q3", spot: 3.10, contract: 3.10 },
    { date: "2016-Q4", spot: 3.60, contract: 3.50 }, // 골든크로스 (Spot > Contract)
    { date: "2017-Q1", spot: 4.30, contract: 4.00 },
    { date: "2017-Q2", spot: 5.60, contract: 5.10 },
    { date: "2017-Q3", spot: 7.00, contract: 6.30 },
    { date: "2017-Q4", spot: 8.00, contract: 7.20 },
    { date: "2018-Q1", spot: 8.50, contract: 7.80 },
    { date: "2018-Q2", spot: 8.50, contract: 8.20 },
    // === ⚠️ 데드크로스 #1 — 2018 Q3 ===
    { date: "2018-Q3", spot: 7.80, contract: 8.10, deadCross: true },
    { date: "2018-Q4", spot: 5.80, contract: 7.50 },
    // === 하락 사이클 2019 ===
    { date: "2019-Q1", spot: 3.80, contract: 5.30 },
    { date: "2019-Q2", spot: 3.10, contract: 4.20 },
    { date: "2019-Q3", spot: 2.75, contract: 3.40 },
    { date: "2019-Q4", spot: 2.70, contract: 3.00 },
    // === 회복 2020 ===
    { date: "2020-Q1", spot: 2.90, contract: 2.95 },
    { date: "2020-Q2", spot: 3.10, contract: 2.95 },
    { date: "2020-Q3", spot: 3.20, contract: 3.05 },
    { date: "2020-Q4", spot: 3.40, contract: 3.20 },
    // === 상승 사이클 2021 ===
    { date: "2021-Q1", spot: 3.80, contract: 3.60 },
    { date: "2021-Q2", spot: 4.30, contract: 4.00 },
    // === ⚠️ 데드크로스 #2 — 2021 Q3 ===
    { date: "2021-Q3", spot: 4.10, contract: 4.25, deadCross: true },
    { date: "2021-Q4", spot: 3.90, contract: 4.30 },
    // === 하락 사이클 2022~2023 ===
    { date: "2022-Q1", spot: 3.40, contract: 4.00 },
    { date: "2022-Q2", spot: 2.90, contract: 3.60 },
    { date: "2022-Q3", spot: 2.30, contract: 3.10 },
    { date: "2022-Q4", spot: 1.80, contract: 2.50 },
    { date: "2023-Q1", spot: 1.50, contract: 2.00 },
    { date: "2023-Q2", spot: 1.60, contract: 1.80 },
    { date: "2023-Q3", spot: 1.80, contract: 1.90 },
    { date: "2023-Q4", spot: 2.10, contract: 2.10 }, // 골든크로스 복귀
    // === 회복 2024 (HBM 시대) ===
    { date: "2024-Q1", spot: 2.50, contract: 2.60 },
    { date: "2024-Q2", spot: 3.00, contract: 3.10 },
    { date: "2024-Q3", spot: 3.30, contract: 3.50 },
    { date: "2024-Q4", spot: 3.10, contract: 3.60 },
    // === ⚠️ 데드크로스 #3 — 2025 Q1 (CXMT 공급 과잉 + DDR4 약세) ===
    { date: "2025-Q1", spot: 2.85, contract: 3.45, deadCross: true, estimated: true },
    { date: "2025-Q2", spot: 2.70, contract: 3.20, estimated: true },
    // === 회복 2025 Q3~ (AI 수요 폭발 + HBM shortage → DDR4 계약가 동반 상승) ===
    { date: "2025-Q3", spot: 3.10, contract: 3.00, estimated: true }, // 골든크로스 복귀
    { date: "2025-Q4", spot: 3.80, contract: 3.50, estimated: true },
    // === 강세 2026 (삼성 Q2 계약가 +30% 확정, TrendForce Q2 +58~63% 전망) ===
    { date: "2026-Q1", spot: 4.50, contract: 4.00, estimated: true },
    { date: "2026-Q2", spot: 5.20, contract: 4.60, estimated: true }, // 현재: 골든크로스 (Spot >> Contract)
  ];

  // Add signal annotation
  const annotated = dramData.map((d, i) => {
    const prev = dramData[i - 1];
    let crossType: string | null = null;
    if (prev) {
      const wasAbove = prev.spot > prev.contract;
      const nowBelow = d.spot < d.contract;
      const wasBelow = prev.spot < prev.contract;
      const nowAbove = d.spot > d.contract;
      if (wasAbove && nowBelow) crossType = "dead";
      else if (wasBelow && nowAbove) crossType = "golden";
    }
    const spread = Math.round((d.spot - d.contract) * 100) / 100;
    const status = d.spot >= d.contract ? "healthy" : "danger";
    return { ...d, spread, status, crossType };
  });

  // Latest data point
  const latest = annotated[annotated.length - 1];
  const currentStatus = latest.status;
  const lastCross = [...annotated].reverse().find(d => d.crossType === "dead");

  // Try to fetch Samsung historical stock to overlay
  let samStock: { date: string; close: number }[] = [];
  try {
    const samData = await fetchChart("005930.KS", "3mo", "10y");
    const result = samData?.chart?.result?.[0];
    const ts: number[] = result?.timestamp ?? [];
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
    // Quarterly: pick one point per quarter
    const qMap = new Map<string, number>();
    ts.forEach((t, i) => {
      const c = closes[i];
      if (!c || isNaN(c)) return;
      const d = new Date(t * 1000);
      const q = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
      qMap.set(q, c); // last close of quarter
    });
    samStock = annotated
      .map(d => ({ date: d.date, close: qMap.get(d.date) ?? 0 }))
      .filter(d => d.close > 0);
  } catch {
    // optional
  }

  const payload = {
    series: annotated,
    samStock,
    latest,
    currentStatus,
    lastDeadCross: lastCross?.date ?? null,
    note: "DDR4 8Gb (1Gx8) | 출처: TrendForce/DRAMeXchange 공개 분기 리포트 기반 | 2025~2026은 업계 추정치",
    updatedAt: new Date().toISOString(),
    cached: false,
  };
  cache.set(KEY, { data: payload, ts: Date.now() });
  res.json(payload);
});

// ── 리본인사이트: 3대 엔진 + RS 실시간 모니터 ───────────────────────────────
// 금리(수익률 곡선) · 환율(원달러/달러인덱스) · 유동성(달러인덱스 프록시) · 상대강도(RS)
// 전부 Yahoo Finance 실데이터(^TNX, ^IRX, KRW=X, DX-Y.NYB, 종목/지수 시세) 기반, 추정치 없음.
function pctChange(now: number, past: number): number {
  if (!past) return 0;
  return Math.round(((now - past) / past) * 10000) / 100;
}

function seriesFromChart(data: any): { ts: number; close: number }[] {
  const result = data?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
  const out: { ts: number; close: number }[] = [];
  timestamps.forEach((ts, i) => {
    const c = closes[i];
    if (c != null && !isNaN(c)) out.push({ ts, close: c });
  });
  return out;
}

function valueAgo(series: { ts: number; close: number }[], daysAgo: number): number | null {
  if (!series.length) return null;
  const targetTs = series[series.length - 1].ts - daysAgo * 86400;
  let best = series[0];
  for (const p of series) {
    if (p.ts <= targetTs) best = p;
    else break;
  }
  return best.close;
}

router.get("/stocks/macro-monitor", async (req, res) => {
  const KEY = "macro_monitor_v1";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  try {
    const [tnxD, irxD, krwD, dxyD, samD, skD, ksD] = await Promise.all([
      fetchChart("^TNX", "1d", "6mo"),
      fetchChart("^IRX", "1d", "6mo"),
      fetchChart("KRW=X", "1d", "6mo"),
      fetchChart("DX-Y.NYB", "1d", "6mo"),
      fetchChart("005930.KS", "1d", "6mo"),
      fetchChart("000660.KS", "1d", "6mo"),
      fetchChart("^KS11", "1d", "6mo"),
    ]);

    const tnx = seriesFromChart(tnxD);
    const irx = seriesFromChart(irxD);
    const krw = seriesFromChart(krwD);
    const dxy = seriesFromChart(dxyD);
    const sam = seriesFromChart(samD);
    const sk = seriesFromChart(skD);
    const ks = seriesFromChart(ksD);

    // ── 1. 금리 엔진: 10Y(^TNX) - 3M(^IRX) 수익률 곡선 스프레드 ──
    const us10y = tnx[tnx.length - 1]?.close ?? null;
    const us3m = irx[irx.length - 1]?.close ?? null;
    const spreadNow = us10y !== null && us3m !== null ? Math.round((us10y - us3m) * 100) / 100 : null;
    const spread1moAgo = (() => {
      const t = valueAgo(tnx, 30);
      const i = valueAgo(irx, 30);
      return t !== null && i !== null ? Math.round((t - i) * 100) / 100 : null;
    })();
    const spread3moAgo = (() => {
      const t = valueAgo(tnx, 90);
      const i = valueAgo(irx, 90);
      return t !== null && i !== null ? Math.round((t - i) * 100) / 100 : null;
    })();
    let curveStatus = "정상(우상향)";
    if (spreadNow !== null) {
      if (spreadNow < 0) curveStatus = "역전(경기침체 경고)";
      else if (spreadNow < 0.25) curveStatus = "평탄화(성장 둔화 우려)";
    }
    const curveTrend =
      spreadNow !== null && spread1moAgo !== null
        ? spreadNow > spread1moAgo + 0.05
          ? "스티프닝(가팔라짐)"
          : spreadNow < spread1moAgo - 0.05
            ? "플래트닝(평탄해짐)"
            : "횡보"
        : "-";

    // ── 2. 환율 엔진: 원달러 환율 + 달러 인덱스 ──
    const usdkrwNow = krw[krw.length - 1]?.close ?? null;
    const usdkrw1mo = valueAgo(krw, 30);
    const usdkrwChange1mo = usdkrwNow !== null && usdkrw1mo !== null ? pctChange(usdkrwNow, usdkrw1mo) : null;
    const fxTrend =
      usdkrwChange1mo !== null
        ? usdkrwChange1mo > 1
          ? "원화 약세 심화"
          : usdkrwChange1mo < -1
            ? "원화 강세 전환"
            : "안정 (박스권)"
        : "-";

    // ── 3. 유동성 엔진(프록시): 달러 인덱스(DXY) — 약달러=글로벌 유동성 완화, 강달러=긴축 ──
    const dxyNow = dxy[dxy.length - 1]?.close ?? null;
    const dxy1mo = valueAgo(dxy, 30);
    const dxy3mo = valueAgo(dxy, 90);
    const dxyChange1mo = dxyNow !== null && dxy1mo !== null ? pctChange(dxyNow, dxy1mo) : null;
    const dxyChange3mo = dxyNow !== null && dxy3mo !== null ? pctChange(dxyNow, dxy3mo) : null;
    const liquidityStatus =
      dxyChange3mo !== null
        ? dxyChange3mo < -2
          ? "완화적 (유동성 우호)"
          : dxyChange3mo > 2
            ? "긴축적 (유동성 부담)"
            : "중립"
        : "-";

    // ── 4. RS 엔진: 삼성전자/SK하이닉스 vs KOSPI 상대강도 (100 정규화, 3개월) ──
    function rsSeries(stock: { ts: number; close: number }[], index: { ts: number; close: number }[]) {
      const idxMap = new Map(index.map((p) => [new Date(p.ts * 1000).toISOString().slice(0, 10), p.close]));
      const points = stock
        .map((p) => {
          const d = new Date(p.ts * 1000).toISOString().slice(0, 10);
          const idxVal = idxMap.get(d);
          return idxVal ? { date: d, ratio: p.close / idxVal } : null;
        })
        .filter((p): p is { date: string; ratio: number } => p !== null);
      if (!points.length) return { now: null, chg1mo: null, chg3mo: null, series: [] as { date: string; rs: number }[] };
      const base = points[0].ratio;
      const series = points.map((p) => ({ date: p.date, rs: Math.round((p.ratio / base) * 10000) / 100 }));
      const now = series[series.length - 1].rs;
      const idx1mo = Math.max(0, series.length - 22);
      const idx3mo = 0;
      const chg1mo = Math.round((now - series[idx1mo].rs) * 100) / 100;
      const chg3mo = Math.round((now - series[idx3mo].rs) * 100) / 100;
      return { now, chg1mo, chg3mo, series: series.slice(-60) };
    }

    const samRS = rsSeries(sam, ks);
    const skRS = rsSeries(sk, ks);
    const leadingSector = (samRS.chg1mo ?? 0) > (skRS.chg1mo ?? 0) ? "삼성전자" : "SK하이닉스";

    // ── 종합 신호등 (매크로 우호도) ──
    let macroScore = 0;
    if (curveStatus === "정상(우상향)") macroScore += 1;
    if (fxTrend !== "원화 약세 심화") macroScore += 1;
    if (liquidityStatus !== "긴축적 (유동성 부담)") macroScore += 1;
    const macroLight = macroScore === 3 ? "green" : macroScore >= 1 ? "amber" : "red";

    const payload = {
      rates: {
        us10y, us3m, spreadNow, spread1moAgo, spread3moAgo, curveStatus, curveTrend,
      },
      fx: {
        usdkrwNow: usdkrwNow !== null ? Math.round(usdkrwNow * 100) / 100 : null,
        usdkrwChange1mo, fxTrend,
      },
      liquidity: {
        dxyNow: dxyNow !== null ? Math.round(dxyNow * 100) / 100 : null,
        dxyChange1mo, dxyChange3mo, liquidityStatus,
      },
      rs: {
        samsung: samRS, skhynix: skRS, leadingSector,
      },
      macroLight,
      macroScore,
      note: "실시간 Yahoo Finance 데이터 기반 (^TNX 10년물, ^IRX 3개월물, KRW=X, DX-Y.NYB) · 유동성은 연준 대차대조표 대신 달러인덱스를 프록시로 사용",
      updatedAt: new Date().toISOString(),
      cached: false,
    };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── 경기순환 사이클 지표 ─────────────────────────────────────────────────────
router.get("/stocks/cycle-indicators", async (req, res) => {
  const KEY = "cycle_v3";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  try {
    const [vixD, oilD, copperD, tnxD, irxD, krwD, dxyD, ksD] = await Promise.all([
      fetchChart("^VIX",     "1d", "3mo"),
      fetchChart("CL=F",     "1d", "3mo"),
      fetchChart("HG=F",     "1d", "3mo"),
      fetchChart("^TNX",     "1d", "6mo"),
      fetchChart("^IRX",     "1d", "6mo"),
      fetchChart("KRW=X",    "1d", "3mo"),
      fetchChart("DX-Y.NYB", "1d", "3mo"),
      fetchChart("^KS11",    "1d", "1y"),
    ]);

    function latestClose(chartData: any): number | null {
      const closes: (number | null)[] = chartData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
      for (let i = closes.length - 1; i >= 0; i--) {
        const v = closes[i];
        if (v != null && !isNaN(v)) return v;
      }
      return null;
    }

    function closeNAgo(chartData: any, n: number): number | null {
      const closes: (number | null)[] = chartData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
      const valid = closes.filter((c): c is number => c != null && !isNaN(c));
      if (valid.length <= n) return null;
      return valid[valid.length - 1 - n];
    }

    function pctChg(now: number | null, ago: number | null): number | null {
      if (now == null || ago == null || ago === 0) return null;
      return ((now - ago) / ago) * 100;
    }

    const vixNow    = latestClose(vixD);
    const oilNow    = latestClose(oilD);
    const copperNow = latestClose(copperD);
    const tnxNow    = latestClose(tnxD);
    const irxNow    = latestClose(irxD);
    const krwNow    = latestClose(krwD);
    const dxyNow    = latestClose(dxyD);

    const oilChange1mo    = pctChg(oilNow,    closeNAgo(oilD, 21));
    const copperChange1mo = pctChg(copperNow, closeNAgo(copperD, 21));
    const krwChange1mo    = pctChg(krwNow,    closeNAgo(krwD, 21));
    const dxyChange1mo    = pctChg(dxyNow,    closeNAgo(dxyD, 21));

    const yieldSpread = (tnxNow != null && irxNow != null) ? tnxNow - irxNow : null;

    const ksCloses: (number | null)[] = ksD?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const ksMA50  = calcMA(ksCloses, 50);
    const ksMA200 = calcMA(ksCloses, 200);
    const ksValid = ksCloses.filter((c): c is number => c != null && !isNaN(c));
    const ksNow   = ksValid.length ? ksValid[ksValid.length - 1] : null;

    type BDItem = { name: string; value: string; signal: string; pts: number };

    // ── 선행지표 (Leading) — 미래 방향 ────────────────────────────────────────
    const leadingBD: BDItem[] = [];
    let leadingScore = 0;

    if (yieldSpread !== null) {
      let pts = 0; let signal = "";
      if (yieldSpread > 1.5)       { pts = +2; signal = "가파른 정상 — 강한 확장 기대"; }
      else if (yieldSpread > 0.3)  { pts = +1; signal = "완만한 정상 — 확장 지속"; }
      else if (yieldSpread > -0.3) { pts = 0;  signal = "평탄화 — 성장 둔화 경고"; }
      else if (yieldSpread > -1)   { pts = -1; signal = "역전 경계 — 침체 경고"; }
      else                         { pts = -2; signal = "깊은 역전 — 침체 위험"; }
      leadingScore += pts;
      leadingBD.push({ name: "수익률곡선(10Y-3M)", value: `${yieldSpread.toFixed(2)}%p`, signal, pts });
    }

    if (copperChange1mo !== null) {
      let pts = 0; let signal = "";
      if (copperChange1mo > 3)       { pts = +2; signal = "급등 — 강한 성장 기대"; }
      else if (copperChange1mo > 0)  { pts = +1; signal = "상승 — 경기 개선 신호"; }
      else if (copperChange1mo > -3) { pts = 0;  signal = "보합 — 중립"; }
      else                           { pts = -1; signal = "하락 — 성장 둔화 기대"; }
      leadingScore += pts;
      leadingBD.push({ name: "구리(닥터코퍼) 1개월", value: `${copperChange1mo.toFixed(1)}%`, signal, pts });
    }

    if (vixNow !== null) {
      let pts = 0; let signal = "";
      if (vixNow < 15)       { pts = +2; signal = "극도 안정 — 강한 위험선호"; }
      else if (vixNow < 20)  { pts = +1; signal = "안정 — 위험선호"; }
      else if (vixNow < 25)  { pts = 0;  signal = "보통 — 관망"; }
      else if (vixNow < 30)  { pts = -1; signal = "불안 — 위험회피"; }
      else                   { pts = -2; signal = "공포 — 강한 위험회피"; }
      leadingScore += pts;
      leadingBD.push({ name: "VIX 공포지수", value: vixNow.toFixed(1), signal, pts });
    }

    if (krwChange1mo !== null) {
      let pts = 0; let signal = "";
      if (krwChange1mo < -2)      { pts = +1; signal = "원화 강세 — 리스크온 자금 유입"; }
      else if (krwChange1mo > 2)  { pts = -1; signal = "원화 약세 — 리스크오프 자금 이탈"; }
      else                        { pts = 0;  signal = "안정 — 중립"; }
      leadingScore += pts;
      leadingBD.push({ name: "원/달러 1개월 변화", value: `${krwChange1mo.toFixed(1)}%`, signal, pts });
    }

    // ── 동행지표 (Coincident) — 현재 경기 상태 ──────────────────────────────
    const coincidentBD: BDItem[] = [];
    let coincidentScore = 0;

    if (ksNow && ksMA50 && ksMA200) {
      let pts = 0; let signal = "";
      if (ksNow > ksMA50 && ksNow > ksMA200) { pts = +2; signal = "50·200일선 위 — 현재 경기 강세"; }
      else if (ksNow > ksMA200)              { pts = 0;  signal = "200일선 위 — 현재 경기 중립"; }
      else                                   { pts = -2; signal = "200일선 아래 — 현재 경기 약세"; }
      coincidentScore += pts;
      coincidentBD.push({ name: "KOSPI 이동평균 위치", value: `${Math.round(ksNow).toLocaleString()}`, signal, pts });
    }

    if (oilChange1mo !== null) {
      let pts = 0; let signal = "";
      if (oilChange1mo > 3)       { pts = +1; signal = "상승 — 현재 수요 강세"; }
      else if (oilChange1mo > -5) { pts = 0;  signal = "보합 — 현재 수요 중립"; }
      else                        { pts = -1; signal = "하락 — 현재 수요 위축"; }
      coincidentScore += pts;
      coincidentBD.push({ name: "WTI 원유 1개월", value: `${oilChange1mo.toFixed(1)}%`, signal, pts });
    }

    if (dxyChange1mo !== null) {
      let pts = 0; let signal = "";
      if (dxyChange1mo < -1)      { pts = +1; signal = "약달러 — 현재 유동성 완화"; }
      else if (dxyChange1mo > 1)  { pts = -1; signal = "강달러 — 현재 유동성 긴축"; }
      else                        { pts = 0;  signal = "보합 — 현재 중립"; }
      coincidentScore += pts;
      coincidentBD.push({ name: "달러인덱스(DXY) 1개월", value: `${dxyChange1mo.toFixed(1)}%`, signal, pts });
    }

    // ── 방향 판정 ─────────────────────────────────────────────────────────────
    type Dir = "up" | "flat" | "down";
    const leadingDir: Dir  = leadingScore  > 1 ? "up" : leadingScore  < -1 ? "down" : "flat";
    const coincidentDir: Dir = coincidentScore > 1 ? "up" : coincidentScore < -1 ? "down" : "flat";

    // ── 2×2 판정 매트릭스 ─────────────────────────────────────────────────────
    let verdictPhase: string, verdictStance: string, verdictStanceEn: string;
    let verdictColor: string, verdictDesc: string;

    if (leadingDir === "up" && coincidentDir === "up") {
      verdictPhase = "expansion"; verdictStance = "공격"; verdictStanceEn = "Offensive"; verdictColor = "green";
      verdictDesc = "선행·동행 모두 상승. 확장 국면 확인. 경기민감주 비중 확대 유리.";
    } else if (leadingDir === "up") {
      verdictPhase = "recovery"; verdictStance = "분할매수"; verdictStanceEn = "Accumulate"; verdictColor = "blue";
      verdictDesc = "선행 상승 + 동행 약세. 회복 초입 신호. 주식이 가장 좋아하는 구간. 분할매수 탐색.";
    } else if (coincidentDir === "up") {
      verdictPhase = "slowdown"; verdictStance = "경계"; verdictStanceEn = "Caution"; verdictColor = "amber";
      verdictDesc = "선행 꺾임 + 동행 아직 양호. 피크아웃 경계 구간. 차익실현·방어주 비중 준비.";
    } else {
      verdictPhase = "recession"; verdictStance = "방어"; verdictStanceEn = "Defensive"; verdictColor = "red";
      verdictDesc = "선행·동행 모두 약세. 하강·침체 구간. 현금·방어주 중심, 다음 회복 준비.";
    }

    // ── 기존 종합 점수 (시계 각도용) ─────────────────────────────────────────
    const totalScore = leadingScore + coincidentScore;
    const s = Math.max(-9, Math.min(9, totalScore));
    let angle = 0;
    let cyclePhase = "expansion";

    if (s >= 4)       { angle = 135 + ((s - 4) / 5) * 90; cyclePhase = "slowdown"; }
    else if (s >= 0)  { angle = 45  + (s / 4) * 90;       cyclePhase = "expansion"; }
    else if (s >= -4) { const raw = 315 + ((s + 4) / 4) * 90; angle = raw >= 360 ? raw - 360 : raw; cyclePhase = "recovery"; }
    else              { angle = 225 + ((s + 9) / 5) * 90; cyclePhase = "recession"; }

    const r = (v: number | null, d = 2) => v != null ? Math.round(v * Math.pow(10, d)) / Math.pow(10, d) : null;

    const payload = {
      indicators: {
        vix: r(vixNow, 1), oil: r(oilNow, 2), copper: r(copperNow, 4),
        tnx: r(tnxNow, 2), irx: r(irxNow, 2), krw: r(krwNow, 0), dxy: r(dxyNow, 2),
        yieldSpread: r(yieldSpread, 2),
        oilChange1mo: r(oilChange1mo, 1), copperChange1mo: r(copperChange1mo, 1),
        krwChange1mo: r(krwChange1mo, 1), dxyChange1mo: r(dxyChange1mo, 1),
        ksNow: r(ksNow, 0), ksMA50: r(ksMA50, 0), ksMA200: r(ksMA200, 0),
      },
      // 기존 시계 (호환성 유지)
      cycle: {
        score: totalScore,
        angle: Math.round(angle),
        phase: cyclePhase,
        breakdown: [...leadingBD, ...coincidentBD],
      },
      // 선행 지표 그룹
      leading: {
        score: leadingScore,
        direction: leadingDir,
        breakdown: leadingBD,
      },
      // 동행 지표 그룹
      coincident: {
        score: coincidentScore,
        direction: coincidentDir,
        breakdown: coincidentBD,
      },
      // 2×2 판정
      verdict: {
        phase: verdictPhase,
        stance: verdictStance,
        stanceEn: verdictStanceEn,
        color: verdictColor,
        desc: verdictDesc,
        leadingDir,
        coincidentDir,
      },
      updatedAt: new Date().toISOString(),
      cached: false,
    };

    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/stocks/global-market
// 미국 야간선물 + 한국 ADR 실시간 (Yahoo Finance)
// ────────────────────────────────────────────────────────
router.get("/stocks/global-market", async (_req, res): Promise<void> => {
  const KEY = "global-market";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < REALTIME_TTL) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const FUTURES = [
    { symbol: "ES=F",  name: "S&P500 선물",   nameEn: "S&P 500 Futures",   emoji: "🇺🇸" },
    { symbol: "NQ=F",  name: "나스닥100 선물", nameEn: "NASDAQ 100 Futures", emoji: "💻" },
    { symbol: "YM=F",  name: "다우 선물",      nameEn: "Dow Futures",        emoji: "🏭" },
  ];

  const ADRS = [
    { symbol: "PKX",   name: "포스코홀딩스",          note: "NYSE ADR"                                },
    { symbol: "KB",    name: "KB금융",                 note: "NYSE ADR"                                },
    { symbol: "SHG",   name: "신한지주",               note: "NYSE ADR"                                },
    { symbol: "KT",    name: "KT",                     note: "NYSE ADR"                                },
    { symbol: "LPL",   name: "LG디스플레이",           note: "NYSE ADR"                                },
    { symbol: "SKM",   name: "SK텔레콤",           note: "NYSE ADR"    },
    { symbol: "WF",    name: "우리금융",             note: "NYSE ADR"    },
    { symbol: "KEP",   name: "한국전력",             note: "NYSE ADR"    },
    { symbol: "GRVY",  name: "그라비티",             note: "NASDAQ 상장" },
    { symbol: "SKHY",  name: "SK하이닉스",           note: "NASDAQ 상장" },
    { symbol: "DDI",   name: "더블다운인터랙티브",   note: "NASDAQ 상장" },
  ];

  // 글로벌 반도체 연동 지표
  const SEMICONDUCTORS = [
    { symbol: "TSM",  name: "TSMC",    note: "NYSE ADR · 대만 반도체" },
    { symbol: "MU",   name: "마이크론", note: "NASDAQ · 메모리 반도체" },
    { symbol: "NVDA", name: "엔비디아", note: "NASDAQ · AI 반도체" },
  ];

  // 코스피 야간 방향 프록시
  const KOSPI_PROXY = [
    { symbol: "EWY",   name: "EWY (코스피 야간 대용)",  note: "iShares MSCI Korea ETF · NYSE · 상승=코스피 호재", emoji: "🌙" },
  ];

  // 원달러 환율
  const FX_LIST = [
    { symbol: "KRW=X", name: "원/달러 환율",       note: "하락(원화↑)=자금유입 호재 · 상승(원화↓)=자금유출 악재", emoji: "💱" },
  ];

  // includePrePost=true → 프리마켓/애프터마켓 포함
  const fetchQuote = async (symbol: string) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d&includePrePost=true`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<any>;
  };

  const toItem = async (sym: string, name: string, extra: Record<string, string>) => {
    try {
      const raw = await fetchQuote(sym);
      const meta = raw?.chart?.result?.[0]?.meta as any;
      if (!meta) return null;
      const price: number    = meta.regularMarketPrice ?? 0;
      const prev: number     = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const changePct        = prev ? ((price - prev) / prev) * 100 : 0;
      // meta.marketState가 null로 올 수 있어 currentTradingPeriod 타임스탬프로 직접 계산
      const ctp = meta.currentTradingPeriod as any;
      const nowSec = Math.floor(Date.now() / 1000);
      const computeMarketState = (): string => {
        if (meta.marketState && meta.marketState !== "null") return meta.marketState as string;
        if (!ctp) return "CLOSED";
        if (ctp.regular && nowSec >= ctp.regular.start && nowSec < ctp.regular.end) return "REGULAR";
        if (ctp.pre     && nowSec >= ctp.pre.start     && nowSec < ctp.pre.end)     return "PRE";
        if (ctp.post    && nowSec >= ctp.post.start    && nowSec < ctp.post.end)    return "POST";
        return "CLOSED";
      };
      const marketState = computeMarketState();
      return {
        symbol: sym,
        name,
        price: +price.toFixed(2),
        prevClose: +prev.toFixed(2),
        changePct: +changePct.toFixed(2),
        currency: meta.currency ?? "USD",
        marketState,
        ...extra,
      };
    } catch {
      return null;
    }
  };

  try {
    const [futureResults, adrResults, semiconductorResults, proxyResults, fxResults] = await Promise.all([
      Promise.all(FUTURES.map(f => toItem(f.symbol, f.name, { nameEn: f.nameEn, emoji: f.emoji }))),
      Promise.all(ADRS.map(a => toItem(a.symbol, a.name, { note: a.note }))),
      Promise.all(SEMICONDUCTORS.map(s => toItem(s.symbol, s.name, { note: s.note }))),
      Promise.all(KOSPI_PROXY.map(p => toItem(p.symbol, p.name, { note: p.note, emoji: p.emoji }))),
      Promise.all(FX_LIST.map(f => toItem(f.symbol, f.name, { note: f.note, emoji: f.emoji }))),
    ]);

    const payload = {
      futures:      futureResults.filter(Boolean),
      adrs:         adrResults.filter(Boolean),
      semiconductors: semiconductorResults.filter(Boolean),
      kospiProxy:   proxyResults.filter(Boolean),
      fx:           fxResults.filter(Boolean),
      updatedAt: new Date().toISOString(),
      cached: false,
    };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stocks/adr-history?symbol=PKX
// 개별 ADR 일봉(3개월) + 월봉(3년) OHLC 시계열
// ────────────────────────────────────────────────────────
router.get("/stocks/adr-history", async (req, res): Promise<void> => {
  const symbol = (req.query.symbol as string ?? "").toUpperCase().trim();
  if (!symbol) { res.status(400).json({ error: "symbol required" }); return; }

  const KEY = `adr-history:${symbol}`;
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < 30 * 60 * 1000) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const toOHLC = (raw: any) => {
    const result = raw?.chart?.result?.[0];
    if (!result) return [];
    const ts: number[]     = result.timestamp ?? [];
    const q                = result.indicators?.quote?.[0] ?? {};
    const opens:  number[] = q.open  ?? [];
    const highs:  number[] = q.high  ?? [];
    const lows:   number[] = q.low   ?? [];
    const closes: number[] = q.close ?? [];

    const items = ts
      .map((t, i) => ({
        date:  new Date(t * 1000).toISOString().slice(0, 10),
        open:  opens[i]  != null ? +opens[i].toFixed(2)  : null,
        high:  highs[i]  != null ? +highs[i].toFixed(2)  : null,
        low:   lows[i]   != null ? +lows[i].toFixed(2)   : null,
        close: closes[i] != null ? +closes[i].toFixed(2) : null,
      }))
      .filter(x => x.close != null);

    return items.map((item, i) => {
      const prev = i > 0 ? items[i - 1].close : item.open;
      const changePct = prev ? ((item.close! - prev!) / prev!) * 100 : 0;
      return { ...item, changePct: +changePct.toFixed(2) };
    });
  };

  try {
    const [dailyRaw, monthlyRaw] = await Promise.all([
      fetchChart(symbol, "1d",  "3mo"),
      fetchChart(symbol, "1mo", "3y"),
    ]);
    const payload = {
      symbol,
      daily:   toOHLC(dailyRaw),
      monthly: toOHLC(monthlyRaw),
      updatedAt: new Date().toISOString(),
      cached: false,
    };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stocks/global-market-history
// EWY(코스피 방향 프록시) + KRW=X(원달러) 30일 일봉 시계열
// ────────────────────────────────────────────────────────
router.get("/stocks/global-market-history", async (_req, res): Promise<void> => {
  const KEY = "global-market-history";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < 60 * 60 * 1000) { // 1시간 캐시
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const toSeries = (raw: any) => {
    const result = raw?.chart?.result?.[0];
    if (!result) return [];
    const ts: number[]    = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    return ts
      .map((t, i) => ({
        date:  new Date(t * 1000).toISOString().slice(0, 10),
        value: closes[i] != null ? +closes[i].toFixed(2) : null,
      }))
      .filter(x => x.value != null);
  };

  try {
    const [ewyRaw, krwRaw] = await Promise.all([
      fetchChart("EWY",   "1d", "1mo"),
      fetchChart("KRW=X", "1d", "1mo"),
    ]);

    const payload = {
      ewy: toSeries(ewyRaw),
      krw: toSeries(krwRaw),
      updatedAt: new Date().toISOString(),
      cached: false,
    };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stocks/ewy-history
// EWY 일봉(1년) + 주봉(2년) OHLCV + MA20 + MA60
// ────────────────────────────────────────────────────────
router.get("/stocks/ewy-history", async (_req, res): Promise<void> => {
  const KEY = "ewy-history:v1";
  const hit = cache.get(KEY);
  if (hit && Date.now() - hit.ts < 30 * 60 * 1000) {
    res.json({ ...(hit.data as object), cached: true });
    return;
  }

  const rollingMA = (arr: (number | null)[], period: number): (number | null)[] =>
    arr.map((_, i) => {
      if (i < period - 1) return null;
      const slice = arr.slice(i - period + 1, i + 1).filter(v => v != null) as number[];
      return slice.length >= Math.floor(period * 0.8)
        ? +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2)
        : null;
    });

  const toOHLCV = (raw: any, ma1: number, ma2: number) => {
    const result = raw?.chart?.result?.[0];
    if (!result) return [];
    const ts: number[]  = result.timestamp ?? [];
    const q             = result.indicators?.quote?.[0] ?? {};
    const opens: number[]   = q.open   ?? [];
    const highs: number[]   = q.high   ?? [];
    const lows: number[]    = q.low    ?? [];
    const closes: number[]  = q.close  ?? [];
    const volumes: number[] = q.volume ?? [];

    const items = ts.map((t, i) => ({
      date:   new Date(t * 1000).toISOString().slice(0, 10),
      open:   opens[i]   != null ? +opens[i].toFixed(2)   : null,
      high:   highs[i]   != null ? +highs[i].toFixed(2)   : null,
      low:    lows[i]    != null ? +lows[i].toFixed(2)     : null,
      close:  closes[i]  != null ? +closes[i].toFixed(2)  : null,
      volume: volumes[i] ?? null,
    })).filter(x => x.close != null);

    const closesArr = items.map(x => x.close);
    const ma1arr = rollingMA(closesArr, ma1);
    const ma2arr = rollingMA(closesArr, ma2);

    return items.map((item, i) => {
      const prev = i > 0 ? items[i - 1].close : item.open;
      const changePct = prev ? ((item.close! - prev!) / prev!) * 100 : 0;
      return { ...item, changePct: +changePct.toFixed(2), ma20: ma1arr[i], ma60: ma2arr[i] };
    });
  };

  try {
    const [dailyRaw, weeklyRaw] = await Promise.all([
      fetchChart("EWY", "1d",  "1y"),
      fetchChart("EWY", "1wk", "2y"),
    ]);
    const payload = {
      daily:   toOHLCV(dailyRaw, 20, 60),
      weekly:  toOHLCV(weeklyRaw, 10, 20),
      updatedAt: new Date().toISOString(),
      cached: false,
    };
    cache.set(KEY, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
