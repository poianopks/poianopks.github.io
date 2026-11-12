// Port of artifacts/api-server/src/routes/stocks.ts + routes/market-radar.ts
// from the Replit app "New Project Now" (이격도 레이더).
// Handler bodies are copied as faithfully as possible; Express req/res is replaced by
// `async handler(query) -> { status, body }`. zod query validation is replaced by
// simple parameter checks. POST /market-radar/outlook (AI) is not ported.
import YahooFinance from "yahoo-finance2";
import Parser from "rss-parser";

// validation.logErrors only silences the long console dumps; failures still throw as in the original.
const yfRaw = new YahooFinance({ suppressNotices: ["yahooSurvey"], validation: { logErrors: false }, versionCheck: false });
const rssParser = new Parser({ timeout: 8000 });

// ── Throttle + per-run cache for Yahoo calls ──────────────────────────────
const YAHOO_GAP_MS = Number(process.env.YAHOO_GAP_MS ?? 200);
let lastStart = 0;
let chain = Promise.resolve();
function throttled(fn) {
  const run = chain.then(async () => {
    const wait = lastStart + YAHOO_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastStart = Date.now();
  });
  chain = run.catch(() => {});
  return run.then(async () => {
    try {
      return await fn();
    } catch (e) {
      // one retry after a short pause (rate limit / transient)
      await new Promise((r) => setTimeout(r, 1200));
      lastStart = Date.now();
      return fn();
    }
  });
}
const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) {
    const p = throttled(fn);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key);
}
export const stats = { yahooCalls: 0 };
// chart options use period1 derived from a range name, so cache by range name
const yf = {
  quote: (symbol) => cached(`q|${symbol}`, () => { stats.yahooCalls++; return yfRaw.quote(symbol); }),
  chart: (symbol, opts, rangeName) =>
    cached(`c|${symbol}|${opts.interval}|${rangeName}`, () => { stats.yahooCalls++; return yfRaw.chart(symbol, opts); }),
  search: (q) => throttled(() => { stats.yahooCalls++; return yfRaw.search(q); }),
};

const log = { error: (o, msg) => console.error(`  ! ${msg}:`, o?.err?.message ?? o?.message ?? o) };

// ═══════════════════════════ stocks.ts ════════════════════════════════════

function calcMA(data, period, index) {
  if (index < period - 1) return null;
  const slice = data.slice(index - period + 1, index + 1);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcDivergence(price, ma) {
  if (ma === null || ma === 0) return null;
  const div = ((price / ma) - 1) * 100;
  // 이격도 >500% 또는 <-90%는 데이터 오류로 간주
  if (div > 500 || div < -90) return null;
  return div;
}

function getDivergenceSignal(d) {
  if (d === null) return "neutral";
  if (d > 10) return "overbought";
  if (d < -10) return "oversold";
  return "neutral";
}

function rangeToPeriod1(range) {
  const ms = { "1y": 365, "2y": 730, "5y": 1825, "10y": 3650 };
  const days = ms[range] ?? 730;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const bad = (message) => ({ status: 400, body: { error: "Invalid params", message } });

// GET /stocks/quote?symbols=A,B
export async function getStockQuotes(query) {
  if (typeof query.symbols !== "string") return bad("symbols is required");
  const symbols = query.symbols.split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const q = await yf.quote(symbol);
          return {
            symbol: q.symbol ?? symbol,
            name: q.longName ?? q.shortName ?? symbol,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            currency: q.currency ?? "USD",
            marketState: q.marketState ?? "REGULAR",
            exchange: q.fullExchangeName ?? q.exchange ?? "",
          };
        } catch {
          return { symbol, name: symbol, price: 0, change: 0, changePercent: 0, currency: "USD", marketState: "UNKNOWN", exchange: "" };
        }
      })
    );
    return { status: 200, body: results };
  } catch (err) {
    log.error({ err }, "Error fetching quotes");
    return { status: 500, body: { error: "fetch_error", message: "Failed to fetch quotes" } };
  }
}

// GET /stocks/history?symbol=X&interval=1wk|1mo&range=1y|2y|5y|10y
export async function getStockHistory(query) {
  const { symbol, interval } = query;
  const range = query.range ?? "2y";
  if (typeof symbol !== "string" || !symbol) return bad("symbol is required");
  if (interval !== "1wk" && interval !== "1mo") return bad("interval must be 1wk or 1mo");
  if (!["1y", "2y", "5y", "10y"].includes(range)) return bad("invalid range");
  const safeInterval = interval === "1mo" ? "1mo" : "1wk";
  const period1 = rangeToPeriod1(range);

  try {
    const [quoteResult, chartResult] = await Promise.all([
      yf.quote(symbol).catch(() => null),
      yf.chart(symbol, { interval: safeInterval, period1 }, range),
    ]);

    const quotes = chartResult.quotes ?? [];
    const closes = quotes.map((q) => (q.close ?? 0));

    const candles = quotes.map((q, i) => {
      const close = (q.close ?? 0);
      const ma5 = calcMA(closes, 5, i);
      const ma20 = calcMA(closes, 20, i);
      const rawDate = q.date;
      const dateStr = rawDate instanceof Date
        ? rawDate.toISOString()
        : typeof rawDate === "number"
          ? new Date(rawDate * 1000).toISOString()
          : String(rawDate);
      return {
        date: dateStr,
        open: (q.open ?? 0),
        high: (q.high ?? 0),
        low: (q.low ?? 0),
        close,
        volume: (q.volume ?? 0),
        ma5,
        ma20,
        divergence5: calcDivergence(close, ma5),
        divergence20: calcDivergence(close, ma20),
      };
    });

    const last = candles[candles.length - 1];
    return {
      status: 200,
      body: {
        symbol,
        name: quoteResult?.longName ?? quoteResult?.shortName ?? symbol,
        interval,
        currency: quoteResult?.currency ?? "USD",
        candles,
        currentDivergence5: last?.divergence5 ?? null,
        currentDivergence20: last?.divergence20 ?? null,
        divergenceSignal: getDivergenceSignal(last?.divergence20 ?? null),
      },
    };
  } catch (err) {
    log.error({ err }, `Error fetching history ${symbol}`);
    return { status: 500, body: { error: "fetch_error", message: "Failed to fetch history" } };
  }
}

const KR_ALIAS = [
  { keywords: ["삼성전자", "삼성", "samsung electronics"], symbol: "005930.KS", name: "Samsung Electronics Co., Ltd.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["sk하이닉스", "하이닉스", "sk hynix"], symbol: "000660.KS", name: "SK hynix Inc.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["애플", "apple"], symbol: "AAPL", name: "Apple Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["엔비디아", "nvidia"], symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NMS", type: "EQUITY" },
  { keywords: ["마이크로소프트", "마소", "microsoft"], symbol: "MSFT", name: "Microsoft Corporation", exchange: "NMS", type: "EQUITY" },
  { keywords: ["테슬라", "tesla"], symbol: "TSLA", name: "Tesla, Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["구글", "알파벳", "google", "alphabet"], symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["아마존", "amazon"], symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["메타", "페이스북", "meta", "facebook"], symbol: "META", name: "Meta Platforms, Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["나스닥", "nasdaq"], symbol: "^IXIC", name: "NASDAQ Composite", exchange: "NIM", type: "INDEX" },
  { keywords: ["코스피", "kospi"], symbol: "^KS11", name: "KOSPI Composite Index", exchange: "KSC", type: "INDEX" },
  { keywords: ["s&p500", "s&p 500", "에스앤피", "sp500"], symbol: "^GSPC", name: "S&P 500", exchange: "SNP", type: "INDEX" },
  { keywords: ["현대차", "현대자동차", "hyundai motor"], symbol: "005380.KS", name: "Hyundai Motor Company", exchange: "KSC", type: "EQUITY" },
  { keywords: ["lg에너지솔루션", "lg에너지", "lges"], symbol: "373220.KS", name: "LG Energy Solution, Ltd.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["카카오", "kakao"], symbol: "035720.KS", name: "Kakao Corp.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["네이버", "naver"], symbol: "035420.KS", name: "NAVER Corporation", exchange: "KSC", type: "EQUITY" },
  { keywords: ["셀트리온", "celltrion"], symbol: "068270.KS", name: "Celltrion, Inc.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["kb금융", "kb"], symbol: "105560.KS", name: "KB Financial Group Inc.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["신한지주", "신한"], symbol: "055550.KS", name: "Shinhan Financial Group Co., Ltd.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["포스코", "posco"], symbol: "005490.KS", name: "POSCO Holdings Inc.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["lg화학", "lg chem"], symbol: "051910.KS", name: "LG Chem, Ltd.", exchange: "KSC", type: "EQUITY" },
  { keywords: ["기아", "기아차", "kia"], symbol: "000270.KS", name: "Kia Corporation", exchange: "KSC", type: "EQUITY" },
  { keywords: ["한국전력", "한전", "kepco"], symbol: "015760.KS", name: "Korea Electric Power Corporation", exchange: "KSC", type: "EQUITY" },
  { keywords: ["브로드컴", "broadcom"], symbol: "AVGO", name: "Broadcom Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["AMD", "어드밴스드", "advanced micro"], symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["인텔", "intel"], symbol: "INTC", name: "Intel Corporation", exchange: "NMS", type: "EQUITY" },
  { keywords: ["넷플릭스", "netflix"], symbol: "NFLX", name: "Netflix, Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["버크셔", "워런버핏", "berkshire"], symbol: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYQ", type: "EQUITY" },
  { keywords: ["코인베이스", "coinbase"], symbol: "COIN", name: "Coinbase Global, Inc.", exchange: "NMS", type: "EQUITY" },
  { keywords: ["팔란티어", "palantir"], symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYQ", type: "EQUITY" },
];

function searchKrAlias(q) {
  const lower = q.trim().toLowerCase();
  return KR_ALIAS.filter((entry) =>
    entry.keywords.some((kw) => kw.includes(lower) || lower.includes(kw))
  ).map(({ symbol, name, exchange, type }) => ({ symbol, name, exchange, type }));
}

function mapSearchQuotes(quotesArr) {
  return (quotesArr ?? [])
    .filter((r) => {
      const qt = r["quoteType"];
      return r["symbol"] && (qt === "EQUITY" || qt === "INDEX" || qt === "ETF");
    })
    .slice(0, 10)
    .map((r) => ({
      symbol: r["symbol"] ?? "",
      name: r["longname"] ?? r["shortname"] ?? r["symbol"] ?? "",
      exchange: r["exchange"] ?? "",
      type: r["quoteType"] ?? "EQUITY",
    }));
}

// Port-only fallback: Yahoo's public search endpoint, called directly.
async function directYahooSearch(q) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
  const res = await throttled(() =>
    fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" }, signal: AbortSignal.timeout(10000) })
  );
  if (!res.ok) throw new Error(`Yahoo search HTTP ${res.status}`);
  const j = await res.json();
  return j.quotes ?? [];
}

// GET /stocks/search?q=...
export async function searchStocks(query) {
  if (typeof query.q !== "string" || query.q.length < 1) return bad("q is required");
  const q = query.q.trim();

  const krMatches = searchKrAlias(q);
  if (krMatches.length > 0) return { status: 200, body: krMatches.slice(0, 10) };

  try {
    const results = await yf.search(q);
    return { status: 200, body: mapSearchQuotes(results.quotes) };
  } catch (err) {
    log.error({ err }, `yahoo-finance2 search failed for "${q}", trying direct endpoint`);
  }
  try {
    return { status: 200, body: mapSearchQuotes(await directYahooSearch(q)) };
  } catch (err) {
    log.error({ err }, "Error searching");
    return { status: 500, body: { error: "search_error", message: "Failed to search" } };
  }
}

const DEFAULT_SYMBOLS = [
  { symbol: "^IXIC", category: "index" },
  { symbol: "^KS11", category: "index" },
  { symbol: "^KS200", category: "index" },
  { symbol: "^GSPC", category: "index" },
  { symbol: "NVDA", category: "us_stock" },
  { symbol: "AAPL", category: "us_stock" },
  { symbol: "MSFT", category: "us_stock" },
  { symbol: "TSLA", category: "us_stock" },
  { symbol: "005930.KS", category: "kr_stock" },
  { symbol: "000660.KS", category: "kr_stock" },
  { symbol: "005380.KS", category: "kr_stock" },
  { symbol: "035720.KS", category: "kr_stock" },
];

function getLastDivergences(quotes) {
  // 0 또는 null close 제거 — 결측치가 MA 계산을 왜곡하지 않도록
  const closes = quotes.map((q) => q.close ?? 0).filter((c) => c > 0);
  if (closes.length < 2) return { div5: null, div20: null };
  const lastIdx = closes.length - 1;
  return {
    div5: calcDivergence(closes[lastIdx], calcMA(closes, 5, lastIdx)),
    div20: calcDivergence(closes[lastIdx], calcMA(closes, 20, lastIdx)),
  };
}

// GET /stocks/market-overview
export async function getMarketOverview() {
  const wkPeriod1 = rangeToPeriod1("1y");
  const moPeriod1 = rangeToPeriod1("5y");
  try {
    const items = await Promise.all(
      DEFAULT_SYMBOLS.map(async ({ symbol, category }) => {
        try {
          const [quoteData, weeklyData, monthlyData] = await Promise.all([
            yf.quote(symbol).catch(() => null),
            yf.chart(symbol, { interval: "1wk", period1: wkPeriod1 }, "1y").catch(() => null),
            yf.chart(symbol, { interval: "1mo", period1: moPeriod1 }, "5y").catch(() => null),
          ]);
          const weekly = getLastDivergences(weeklyData?.quotes ?? []);
          const monthly = getLastDivergences(monthlyData?.quotes ?? []);
          return {
            symbol,
            name: quoteData?.longName ?? quoteData?.shortName ?? symbol,
            price: quoteData?.regularMarketPrice ?? 0,
            changePercent: quoteData?.regularMarketChangePercent ?? 0,
            weeklyDivergence5: weekly.div5,
            weeklyDivergence20: weekly.div20,
            monthlyDivergence5: monthly.div5,
            monthlyDivergence20: monthly.div20,
            signal: getDivergenceSignal(weekly.div20),
            category,
          };
        } catch {
          return {
            symbol, name: symbol, price: 0, changePercent: 0,
            weeklyDivergence5: null, weeklyDivergence20: null,
            monthlyDivergence5: null, monthlyDivergence20: null,
            signal: "neutral", category,
          };
        }
      })
    );
    return { status: 200, body: { items, updatedAt: new Date().toISOString() } };
  } catch (err) {
    log.error({ err }, "Error fetching market overview");
    return { status: 500, body: { error: "fetch_error", message: "Failed to fetch market overview" } };
  }
}

// ═══════════════════════════ market-radar.ts ══════════════════════════════

function mapQuote(q, fallbackName) {
  if (!q) return null;
  return {
    symbol: q.symbol,
    name: (q.longName || q.shortName || fallbackName),
    price: (q.regularMarketPrice ?? 0),
    change: (q.regularMarketChange ?? 0),
    changePercent: (q.regularMarketChangePercent ?? 0),
    open: (q.regularMarketOpen ?? null),
    high: (q.regularMarketDayHigh ?? null),
    low: (q.regularMarketDayLow ?? null),
    volume: (q.regularMarketVolume ?? null),
    previousClose: (q.regularMarketPreviousClose ?? null),
    marketState: (q.marketState ?? "CLOSED"),
  };
}

function kstToday() {
  const kst = new Date(Date.now() + 9 * 3600_000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

function frontMonthProdId() {
  const kst = new Date(Date.now() + 9 * 3600_000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  const quarters = [3, 6, 9, 12];
  const fm = quarters.find((m) => m >= month) ?? 3;
  const fy = fm < month ? year + 1 : year;
  return `${fy}${String(fm).padStart(2, "0")}`;
}

const KRX_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "Mozilla/5.0 (compatible)",
  Referer: "https://data.krx.co.kr/",
  Accept: "application/json, text/plain, */*",
};

async function krxPost(bld, extra) {
  const yyyymmdd = kstToday();
  const body = new URLSearchParams({
    bld, locale: "ko_KR", strtDd: yyyymmdd, endDd: yyyymmdd,
    share: "1", money: "1", csvxls_isNo: "false", ...extra,
  }).toString();
  const res = await fetch("https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd",
    { method: "POST", headers: KRX_HEADERS, body, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`KRX HTTP ${res.status}`);
  return res.json();
}

export const krxStatus = { calls: 0, ok: 0, errors: [] };
async function krxTracked(bld, extra) {
  krxStatus.calls++;
  try {
    const r = await krxPost(bld, extra);
    krxStatus.ok++;
    return r;
  } catch (e) {
    krxStatus.errors.push(`${bld.split("/").pop()}: ${e.message}`);
    throw e;
  }
}

async function fetchKrxFuturesData() {
  const result = {
    settlePrice: null, change: null, changePercent: null, volume: null,
    openInterest: null, openInterestChange: null,
    foreignNetBuy: null, institutionNetBuy: null, retailNetBuy: null,
    dataDate: null,
  };
  const yyyymmdd = kstToday();
  const prodId = frontMonthProdId();
  const parseNum = (v) =>
    v && v.trim() !== "" && v.trim() !== "-" ? parseFloat(v.replace(/,/g, "")) : null;

  try {
    const d1 = await krxTracked("dbms/MDC/STAT/standard/MDCSTAT12301", { prodId });
    const row = d1?.output?.[0];
    if (row) {
      result.settlePrice = parseNum(row["SETLPRC"] ?? row["CLSPRC"]);
      result.change = parseNum(row["CMPPREVDD_PRC"]);
      result.changePercent = parseNum(row["FLCT_RT"]);
      result.volume = parseNum(row["ACC_TRDVOL"]);
      result.openInterest = parseNum(row["OPNINT_QTY"]);
      result.openInterestChange = parseNum(row["OPNINT_QTY_CHG"]);
      result.dataDate = yyyymmdd.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
    }
  } catch {
    try {
      const d2 = await krxTracked("dbms/MDC/STAT/standard/MDCSTAT12601", { mktId: "F", isuCd: "KR4101T90002" });
      const row = d2?.output?.[0];
      if (row) {
        result.openInterest = parseNum(row["OPNINT_QTY"]);
        result.openInterestChange = parseNum(row["OPNINT_QTY_CHG"]);
        result.dataDate = yyyymmdd.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      }
    } catch { /* OI 엔드포인트도 실패 */ }
  }

  try {
    const d3 = await krxTracked("dbms/MDC/STAT/standard/MDCSTAT12401", { mktTpCd: "F", isuCd: "KR4101T90002" });
    const rows = d3?.output ?? [];
    if (rows.length > 0) {
      const r = rows[0];
      const foreignBuy = parseNum(r["FRGNR_NETBUY_CONT"] ?? r["FRGNR_NETBUY"] ?? r["FRGNR_BUY_CONT"]);
      const instBuy = parseNum(r["ORGZT_NETBUY_CONT"] ?? r["ORGZT_NETBUY"] ?? r["ORGZT_BUY_CONT"]);
      const retailBuy = parseNum(r["INDVDL_NETBUY_CONT"] ?? r["INDVDL_NETBUY"] ?? r["INDVDL_BUY_CONT"]);
      if (foreignBuy !== null || instBuy !== null || retailBuy !== null) {
        result.foreignNetBuy = foreignBuy;
        result.institutionNetBuy = instBuy;
        result.retailNetBuy = retailBuy;
      }
    }
  } catch { /* 투자자별 데이터 실패 — 정상 처리 */ }

  return result;
}

// GET /market-radar/snapshot
export async function getMarketRadarSnapshot() {
  try {
    const MAIN_SYMBOLS = ["^KS11", "^KS200", "^IXIC", "^GSPC", "^DJI", "KM=F"];
    const [results, krx] = await Promise.all([
      Promise.allSettled(MAIN_SYMBOLS.map((s) => yf.quote(s))),
      fetchKrxFuturesData(),
    ]);
    const getQ = (i) => {
      const r = results[i];
      return r?.status === "fulfilled" ? r.value : null;
    };
    const [ks11Raw, ks200Raw, ixicRaw, gspcRaw, djiRaw, kmRaw] = MAIN_SYMBOLS.map((_, i) => getQ(i));

    const kospiSpot = mapQuote(ks11Raw ?? null, "KOSPI");
    const kospi200 = mapQuote(ks200Raw ?? null, "KOSPI 200");

    const km = kmRaw;
    const isKmActive =
      km && (km.marketState === "REGULAR" || km.marketState === "PRE" || km.marketState === "POST");

    const fPriceRaw = (km?.regularMarketPrice ?? 0);
    const fChangeRaw = (km?.regularMarketChange ?? 0);
    const fChangePctRaw = (km?.regularMarketChangePercent ?? 0);
    const fPrevClose = (km?.regularMarketPreviousClose ?? null);
    const fHigh = (km?.regularMarketDayHigh ?? null);
    const fLow = (km?.regularMarketDayLow ?? null);
    const fVolume = (km?.regularMarketVolume ?? null);
    const f52High = (km?.fiftyTwoWeekHigh ?? null);
    const f52Low = (km?.fiftyTwoWeekLow ?? null);

    const hasCmePrice = fPriceRaw > 0;
    const hasKrxPrice = (krx.settlePrice ?? 0) > 0;

    let displayPrice = 0;
    let displayChange = 0;
    let displayChangePct = 0;
    let priceSource = "NO_DATA";

    if (isKmActive && hasCmePrice) {
      displayPrice = fPriceRaw;
      displayChange = fChangeRaw;
      displayChangePct = fChangePctRaw;
      priceSource = "CME_LIVE";
    } else if (hasKrxPrice) {
      displayPrice = krx.settlePrice;
      displayChange = krx.change ?? 0;
      displayChangePct = krx.changePercent ?? 0;
      priceSource = "KRX_SETTLE";
    }

    const spotRef = (ks200Raw?.regularMarketPrice ?? 0);
    const spotPrev = (ks200Raw?.regularMarketPreviousClose ?? spotRef);
    const basisBase = spotRef > 0 ? spotRef : spotPrev;
    const basisPrice = displayPrice > 0 ? displayPrice : (fPrevClose ?? 0);
    const basis = basisBase > 0 && basisPrice > 0 ? Number((basisPrice - basisBase).toFixed(2)) : 0;
    const basisPct = basisBase > 0 && basisPrice > 0 ? Number(((basis / basisBase) * 100).toFixed(3)) : 0;

    let oiSignal = null;
    if (krx.openInterestChange != null) {
      const oiChg = krx.openInterestChange;
      if (oiChg > 5000) oiSignal = "신규 진입 증가";
      else if (oiChg < -5000) oiSignal = "청산 증가";
      else oiSignal = "중립";
    }

    let closedNote = null;
    if (!isKmActive) {
      if (priceSource === "KRX_SETTLE") {
        closedNote = `KRX 정산가 기준 (${krx.dataDate ?? "당일"}). CME 선물은 미국 시장 개장 시(한국 야간)에 실시간 표시됩니다.`;
      } else {
        closedNote = `CME 선물 장외시간 · KRX 데이터 미수신. 가격 없음. KRX 선물 거래: 09:00–15:45 KST.`;
      }
    }

    const kospi200Futures = {
      symbol: "KOSPI 200 선물",
      name: priceSource === "CME_LIVE" ? "CME Mini (KM=F) — 실시간" : priceSource === "KRX_SETTLE" ? "KRX 정산가" : "KOSPI 200 선물",
      price: displayPrice,
      change: displayChange,
      changePercent: displayChangePct,
      previousClose: fPrevClose,
      high: isKmActive ? fHigh : null,
      low: isKmActive ? fLow : null,
      volume: isKmActive ? fVolume : (krx.volume ?? null),
      fiftyTwoWeekHigh: f52High,
      fiftyTwoWeekLow: f52Low,
      basis,
      basisPercent: basisPct,
      openInterest: krx.openInterest,
      openInterestChange: krx.openInterestChange,
      openInterestSignal: oiSignal,
      krxPrice: krx.settlePrice,
      krxVolume: krx.volume,
      krxDataDate: krx.dataDate,
      foreignNetBuy: krx.foreignNetBuy,
      institutionNetBuy: krx.institutionNetBuy,
      retailNetBuy: krx.retailNetBuy,
      investorDataAvailable: (
        krx.foreignNetBuy != null || krx.institutionNetBuy != null || krx.retailNetBuy != null
      ),
      marketState: (km?.marketState ?? "CLOSED"),
      closedNote,
    };

    const snapshot = {
      kospiSpot,
      kospi200,
      kospi200Futures,
      globalIndices: [
        mapQuote(djiRaw ?? null, "다우존스"),
        mapQuote(ixicRaw ?? null, "나스닥"),
        mapQuote(gspcRaw ?? null, "S&P 500"),
      ],
      updatedAt: new Date().toISOString(),
    };
    return { status: 200, body: snapshot };
  } catch (err) {
    log.error(err, "market-radar/snapshot failed");
    return { status: 500, body: { error: "snapshot_failed", message: String(err) } };
  }
}

export const feedStatus = {};
async function parseFeed(url, source) {
  try {
    const feed = await rssParser.parseURL(url);
    feedStatus[url] = `ok (${(feed.items ?? []).length} items)`;
    return feed;
  } catch (e) {
    feedStatus[url] = `FAILED: ${e.message}`;
    throw e;
  }
}

const GLOBAL_NEWS_FEEDS = [
  { url: "https://finance.yahoo.com/rss/topfinstories", source: "Yahoo Finance" },
  { url: "https://finance.yahoo.com/rss/2.0/headline?s=^IXIC&region=US&lang=en-US", source: "NASDAQ 뉴스" },
  { url: "https://finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", source: "S&P 뉴스" },
];

// GET /market-radar/news
export async function getNews() {
  try {
    const allNews = [];
    await Promise.allSettled(
      GLOBAL_NEWS_FEEDS.map(async ({ url, source }) => {
        try {
          const feed = await parseFeed(url, source);
          allNews.push(...(feed.items ?? []).slice(0, 6).map((item) => ({
            title: item.title ?? "",
            link: item.link ?? "",
            pubDate: item.pubDate ?? item.isoDate ?? "",
            source,
            summary: item.contentSnippet?.slice(0, 200) ?? null,
          })));
        } catch { /* feed failed */ }
      })
    );
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return { status: 200, body: allNews.slice(0, 15) };
  } catch (err) {
    log.error(err, "market-radar/news failed");
    return { status: 500, body: { error: "news_failed", message: String(err) } };
  }
}

const KR_NEWS_FEEDS = [
  { url: "https://news.google.com/rss/search?q=코스피+주가&hl=ko&gl=KR&ceid=KR:ko", source: "Google 뉴스" },
  { url: "https://news.google.com/rss/search?q=주식시장+증시&hl=ko&gl=KR&ceid=KR:ko", source: "Google 뉴스" },
  { url: "https://www.hankyung.com/feed/all-news", source: "한국경제" },
  { url: "https://www.mk.co.kr/rss/40300001/", source: "매일경제" },
  { url: "https://finance.yahoo.com/rss/2.0/headline?s=^KS11&region=KR&lang=ko-KR", source: "KOSPI 뉴스" },
];

// GET /market-radar/kr-news
export async function getKrNews() {
  try {
    const allNews = [];
    await Promise.allSettled(
      KR_NEWS_FEEDS.map(async ({ url, source }) => {
        try {
          const feed = await parseFeed(url, source);
          allNews.push(...(feed.items ?? []).slice(0, 8).map((item) => ({
            title: item.title ?? "",
            link: item.link ?? "",
            pubDate: item.pubDate ?? item.isoDate ?? "",
            source,
            summary: item.contentSnippet?.slice(0, 200) ?? null,
          })));
        } catch { /* feed failed */ }
      })
    );
    const seen = new Set();
    const deduped = allNews.filter((item) => {
      const key = item.title.slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return { status: 200, body: deduped.slice(0, 20) };
  } catch (err) {
    log.error(err, "market-radar/kr-news failed");
    return { status: 500, body: { error: "kr_news_failed", message: String(err) } };
  }
}

// Route table: path (after /api) -> handler(query)
export const ROUTES = {
  "/stocks/quote": getStockQuotes,
  "/stocks/history": getStockHistory,
  "/stocks/search": searchStocks,
  "/stocks/market-overview": getMarketOverview,
  "/market-radar/snapshot": getMarketRadarSnapshot,
  "/market-radar/news": getNews,
  "/market-radar/kr-news": getKrNews,
};
