// Faithful port of artifacts/api-server/src/routes/market.ts from the Replit app
// "Erp Realtime Analysis". The Express router is replaced by a map of plain
// async handler functions (one per GET route) that return the same JSON body.
// Only transport-level changes were made: a browser-like User-Agent for all HTTP
// and a serialized Yahoo request queue with a small delay between calls.
import YahooFinance from "yahoo-finance2";
import axios from "axios";

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  // Port-only: one Yahoo request at a time, ~600 ms apart, browser-like UA.
  queue: { concurrency: 1, interval: 600 },
  fetchOptions: { headers: { "User-Agent": BROWSER_UA } },
});

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function classifyErp(erp) {
  if (erp === null) return "fairly_valued";
  if (erp > 3) return "severely_undervalued";
  if (erp > 1) return "undervalued";
  if (erp > 0) return "fairly_valued";
  if (erp > -1) return "overvalued";
  return "severely_overvalued";
}

function classifyBuffett(ratio) {
  if (ratio === null) return "fairly_valued";
  const pct = ratio * 100;
  if (pct > 200) return "severely_overvalued";
  if (pct > 150) return "overvalued";
  if (pct > 100) return "fairly_valued";
  if (pct > 75) return "undervalued";
  return "severely_undervalued";
}

function classifyCape(cape) {
  if (cape === null) return "fairly_valued";
  if (cape > 35) return "severely_overvalued";
  if (cape > 28) return "overvalued";
  if (cape > 20) return "fairly_valued";
  if (cape > 14) return "undervalued";
  return "severely_undervalued";
}

function erpInterpretation(erp) {
  if (erp === null) return "ERP 계산에 필요한 데이터를 불러오는 중입니다.";
  if (erp > 3) return `ERP ${erp.toFixed(2)}% — 주식이 채권보다 훨씬 매력적입니다. 역사적으로 강력한 매수 신호입니다.`;
  if (erp > 1) return `ERP ${erp.toFixed(2)}% — 주식 프리미엄이 적정 수준입니다. 균형 잡힌 투자가 유효합니다.`;
  if (erp > 0) return `ERP ${erp.toFixed(2)}% — 주식 프리미엄이 낮습니다. 채권과의 매력도 차이가 거의 없습니다.`;
  if (erp > -1) return `ERP ${erp.toFixed(2)}% — 주의 필요. 채권이 주식보다 유리한 상황입니다. 증시 고평가 가능성이 있습니다.`;
  return `ERP ${erp.toFixed(2)}% — 경고 신호. 채권 수익률이 주식 수익률보다 높아 증시가 상당히 고평가된 상태입니다.`;
}

function buffettInterpretation(ratio) {
  if (ratio === null) return "버핏 지수 데이터를 불러오는 중입니다.";
  const pct = (ratio * 100).toFixed(1);
  if (ratio * 100 > 200) return `버핏 지수 ${pct}% — 역사적 최고점 근처. 미국 빅테크 글로벌 매출을 감안해도 극심한 고평가 영역입니다.`;
  if (ratio * 100 > 150) return `버핏 지수 ${pct}% — 역사적 평균(127%) 대비 크게 고평가된 수준입니다.`;
  if (ratio * 100 > 100) return `버핏 지수 ${pct}% — 역사적 평균보다 다소 높습니다. 경계가 필요합니다.`;
  if (ratio * 100 > 75) return `버핏 지수 ${pct}% — 적정 범위 내에 있습니다. 버핏이 '매수 호기'라고 표현한 구간입니다.`;
  return `버핏 지수 ${pct}% — 역사적으로 강력한 저평가 영역입니다.`;
}

function capeInterpretation(cape) {
  if (cape === null) return "CAPE 데이터를 불러오는 중입니다.";
  const historicalMean = 16.8;
  const premium = (((cape - historicalMean) / historicalMean) * 100).toFixed(0);
  if (cape > 35) return `CAPE ${cape.toFixed(1)}배 — 역사적 평균(${historicalMean})의 ${premium}% 프리미엄. 닷컴 버블 수준의 극심한 고평가입니다.`;
  if (cape > 28) return `CAPE ${cape.toFixed(1)}배 — 역사적 평균 대비 ${premium}% 높습니다. 10년 기대 수익률이 낮아질 수 있습니다.`;
  if (cape > 20) return `CAPE ${cape.toFixed(1)}배 — 역사적 평균보다 다소 높지만, 금리 환경을 감안하면 합리적인 수준일 수 있습니다.`;
  if (cape > 14) return `CAPE ${cape.toFixed(1)}배 — 역사적 평균 근처의 적정 수준입니다.`;
  return `CAPE ${cape.toFixed(1)}배 — 역사적으로 저평가된 수준입니다. 장기 기대 수익률이 높습니다.`;
}

function classifySpread(spread) {
  // High Yield spread: LOWER = market complacency (risk of overvaluation/bubble)
  // HIGHER = fear/crisis (potential buying opportunity)
  if (spread < 2.5) return "severely_overvalued"; // extreme complacency
  if (spread < 3.5) return "overvalued"; // low fear, complacent
  if (spread < 5.5) return "fairly_valued"; // historical normal
  if (spread < 7.5) return "undervalued"; // elevated fear
  return "severely_undervalued"; // crisis/panic = buy signal
}

function spreadZone(spread) {
  if (spread < 3) return "극도 안심 구간";
  if (spread < 5) return "주의 구간";
  if (spread < 7.5) return "경고 구간";
  return "금융위기 구간";
}

function spreadInterpretation(spread, prev) {
  const change = prev !== null ? spread - prev : null;
  const dir = change !== null ? (change > 0 ? " (전일 대비 +확대)" : change < 0 ? " (전일 대비 -축소)" : "") : "";
  if (spread < 3) return `스프레드 ${spread.toFixed(2)}%${dir} — 시장이 극도로 안심 상태. 아무도 두려움을 느끼지 않는 역설적 위험 구간. 역사적 평균(5.19%)의 절반 수준.`;
  if (spread < 5) return `스프레드 ${spread.toFixed(2)}%${dir} — 주의 구간. 시장 낙관론이 높아 위험자산 선호. 정상 범위 하단.`;
  if (spread < 7.5) return `스프레드 ${spread.toFixed(2)}%${dir} — 경고 구간. 기업 신용 위험 상승. 주식 시장 조정 가능성 증가.`;
  return `스프레드 ${spread.toFixed(2)}%${dir} — 금융위기 구간 (7.5% 이상). 극단적 공포 상태. 역사적으로 강력한 장기 매수 기회.`;
}

async function fetchSpreadData() {
  const cached = getCached("spread");
  if (cached) return cached;

  const HISTORICAL_AVERAGE = 5.19; // long-run average of BAMLH0A0HYM2

  let spread = null;
  let previousClose = null;

  try {
    const resp = await axios.get(
      "https://fred.stlouisfed.org/graph/fredgraph.csv?id=BAMLH0A0HYM2",
      { headers: { "User-Agent": BROWSER_UA }, timeout: 8000 }
    );
    const csv = resp.data;
    const lines = csv.trim().split("\n").filter((l) => !l.startsWith("DATE"));
    if (lines.length >= 1) {
      const last = lines[lines.length - 1].split(",");
      if (last[1] && last[1] !== ".") spread = parseFloat(last[1]);
    }
    if (lines.length >= 2) {
      const prev = lines[lines.length - 2].split(",");
      if (prev[1] && prev[1] !== ".") previousClose = parseFloat(prev[1]);
    }
  } catch {
    spread = 2.8; // fallback to last known value
  }

  if (spread === null) spread = 2.8;
  const changeFromPrev = previousClose !== null ? parseFloat((spread - previousClose).toFixed(3)) : null;

  const data = {
    spread,
    historicalAverage: HISTORICAL_AVERAGE,
    previousClose,
    changeFromPrev,
    valuation: classifySpread(spread),
    zone: spreadZone(spread),
    interpretation: spreadInterpretation(spread, previousClose),
    updatedAt: new Date().toISOString(),
  };

  setCache("spread", data);
  return data;
}

function valuationScore(level) {
  const map = {
    severely_overvalued: 5,
    overvalued: 4,
    fairly_valued: 3,
    undervalued: 2,
    severely_undervalued: 1,
  };
  return map[level];
}

function scoreToLevel(score) {
  if (score >= 4.5) return "severely_overvalued";
  if (score >= 3.5) return "overvalued";
  if (score >= 2.5) return "fairly_valued";
  if (score >= 1.5) return "undervalued";
  return "severely_undervalued";
}

async function fetchSp500Data() {
  const cached = getCached("sp500");
  if (cached) return cached;

  const [gspcQuote, spySummary] = await Promise.allSettled([
    yahooFinance.quote("^GSPC"),
    yahooFinance.quoteSummary("SPY", {
      modules: ["summaryDetail"],
    }),
  ]);

  const q = gspcQuote.status === "fulfilled" ? gspcQuote.value : null;
  const spy = spySummary.status === "fulfilled" ? spySummary.value : null;

  const price = q?.regularMarketPrice ?? 0;
  const change = q?.regularMarketChange ?? 0;
  const changePercent = q?.regularMarketChangePercent ?? 0;
  const trailingPE = spy?.summaryDetail?.trailingPE ?? null;
  const forwardPE = spy?.summaryDetail?.forwardPE ?? null;
  const earningsYield = trailingPE ? (1 / trailingPE) * 100 : null;

  const data = {
    price,
    trailingPE,
    forwardPE,
    earningsYield,
    marketCap: null,
    change,
    changePercent,
    updatedAt: new Date().toISOString(),
  };

  setCache("sp500", data);
  return data;
}

async function fetchTreasuryData() {
  const cached = getCached("treasury");
  if (cached) return cached;

  const [t10, t2, t30] = await Promise.allSettled([
    yahooFinance.quote("^TNX"),
    yahooFinance.quote("^IRX"),
    yahooFinance.quote("^TYX"),
  ]);

  const y10 = t10.status === "fulfilled" ? (t10.value.regularMarketPrice ?? 0) : 0;
  const y2 = t2.status === "fulfilled" ? (t2.value.regularMarketPrice ?? null) : null;
  const y30 = t30.status === "fulfilled" ? (t30.value.regularMarketPrice ?? null) : null;

  const data = {
    yield10Y: y10,
    yield2Y: y2,
    yield30Y: y30,
    invertedCurve: y2 !== null && y10 !== null && y2 > y10,
    updatedAt: new Date().toISOString(),
  };

  setCache("treasury", data);
  return data;
}

async function fetchCapeData() {
  const cached = getCached("cape");
  if (cached) return cached;

  const HISTORICAL_MEAN = 16.8;
  const HISTORICAL_MEDIAN = 15.9;

  let cape = null;

  try {
    const resp = await axios.get("https://www.multpl.com/shiller-pe", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      timeout: 10000,
    });
    const html = resp.data;
    // Try meta description: "Current Shiller PE Ratio is 41.63"
    const metaMatch = html.match(/Current Shiller PE Ratio is ([\d.]+)/);
    if (metaMatch?.[1]) {
      cape = parseFloat(metaMatch[1]);
    } else {
      // Try id="current-value"
      const idMatch = html.match(/id="current-value"[^>]*>\s*([\d.]+)/);
      if (idMatch?.[1]) cape = parseFloat(idMatch[1]);
    }
  } catch {
    cape = null;
  }

  const impliedReturn10Y = cape ? (1 / cape) * 100 : null;
  const valuation = classifyCape(cape);

  const data = {
    cape,
    historicalMean: HISTORICAL_MEAN,
    historicalMedian: HISTORICAL_MEDIAN,
    impliedReturn10Y,
    valuation,
    interpretation: capeInterpretation(cape),
    updatedAt: new Date().toISOString(),
  };

  setCache("cape", data);
  return data;
}

async function fetchGdpFromFred() {
  try {
    const resp = await axios.get("https://fred.stlouisfed.org/graph/fredgraph.csv?id=GDP", {
      headers: { "User-Agent": BROWSER_UA },
      timeout: 8000,
    });
    const csv = resp.data;
    const lines = csv.trim().split("\n");
    const last = lines[lines.length - 1];
    if (last) {
      const parts = last.split(",");
      if (parts[1] && parts[1] !== ".") {
        return parseFloat(parts[1]);
      }
    }
  } catch {
    // fall through to default
  }
  return 31856;
}

async function fetchBuffettData() {
  const cached = getCached("buffett");
  if (cached) return cached;

  const HISTORICAL_AVERAGE = 1.27;

  let totalMarketCapBillions = null;
  let gdpBillions = 31856;
  let ratio = null;

  try {
    const FRED_KEY = process.env.FRED_API_KEY;

    if (FRED_KEY) {
      const [willResp, gdpResp] = await Promise.allSettled([
        axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=WILL5000PRFC&api_key=${FRED_KEY}&limit=1&sort_order=desc&file_type=json`,
          { headers: { "User-Agent": BROWSER_UA }, timeout: 8000 }
        ),
        axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${FRED_KEY}&limit=1&sort_order=desc&file_type=json`,
          { headers: { "User-Agent": BROWSER_UA }, timeout: 8000 }
        ),
      ]);
      if (willResp.status === "fulfilled") {
        const obs = willResp.value.data?.observations;
        if (obs?.[0]?.value && obs[0].value !== ".") {
          totalMarketCapBillions = parseFloat(obs[0].value);
        }
      }
      if (gdpResp.status === "fulfilled") {
        const obs = gdpResp.value.data?.observations;
        if (obs?.[0]?.value && obs[0].value !== ".") {
          gdpBillions = parseFloat(obs[0].value);
        }
      }
    } else {
      // No FRED API key: use Wilshire 5000 price index from Yahoo Finance
      // as a proxy. Historical ratio: WILL5000PRFC (billions) ≈ ^W5000 × 1.3
      const [w5000, gdp] = await Promise.allSettled([yahooFinance.quote("^W5000"), fetchGdpFromFred()]);
      if (w5000.status === "fulfilled" && w5000.value.regularMarketPrice) {
        totalMarketCapBillions = w5000.value.regularMarketPrice * 1.3;
      }
      if (gdp.status === "fulfilled") {
        gdpBillions = gdp.value;
      }
    }

    if (totalMarketCapBillions && gdpBillions) {
      ratio = totalMarketCapBillions / gdpBillions;
    }
  } catch {
    const fallbackMarketCap = 55000;
    totalMarketCapBillions = fallbackMarketCap;
    ratio = fallbackMarketCap / gdpBillions;
  }

  const valuation = classifyBuffett(ratio);

  const data = {
    ratio,
    totalMarketCap: totalMarketCapBillions,
    gdp: gdpBillions,
    valuation,
    historicalAverage: HISTORICAL_AVERAGE * 100,
    interpretation: buffettInterpretation(ratio),
    updatedAt: new Date().toISOString(),
  };

  setCache("buffett", data);
  return data;
}

async function fetchHistoricalData() {
  const cached = getCached("history");
  if (cached) return cached;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5);

    const [sp500Hist, tnxHist] = await Promise.allSettled([
      yahooFinance.chart("^GSPC", { period1: startDate, period2: endDate, interval: "1mo" }),
      yahooFinance.chart("^TNX", { period1: startDate, period2: endDate, interval: "1mo" }),
    ]);

    const sp500Data = sp500Hist.status === "fulfilled" ? sp500Hist.value.quotes : [];
    const tnxData = tnxHist.status === "fulfilled" ? tnxHist.value.quotes : [];

    const tnxMap = new Map();
    for (const d of tnxData) {
      if (d.date && d.close) {
        tnxMap.set(d.date.toISOString().slice(0, 7), d.close);
      }
    }

    const HISTORICAL_SP500_PE = {
      "2020": 25, "2021": 28, "2022": 20, "2023": 23, "2024": 25, "2025": 27, "2026": 28,
    };

    const result = sp500Data
      .filter((d) => d.close)
      .map((d) => {
        const dateStr = d.date.toISOString().slice(0, 7);
        const year = dateStr.slice(0, 4);
        const tny = tnxMap.get(dateStr) ?? null;
        const pe = HISTORICAL_SP500_PE[year] ?? 22;
        const earningsYield = (1 / pe) * 100;
        const erpVal = tny !== null ? earningsYield - tny : null;

        return {
          date: dateStr,
          erp: erpVal ? parseFloat(erpVal.toFixed(3)) : null,
          cape: null,
          buffett: null,
          sp500Price: d.close ? parseFloat(d.close.toFixed(2)) : null,
        };
      });

    setCache("history", result);
    return result;
  } catch {
    return [];
  }
}

// ---- GET handlers (path after "/api/" -> response body) -------------------

async function erpHandler() {
  const [sp, tr] = await Promise.all([fetchSp500Data(), fetchTreasuryData()]);
  const erp = sp.earningsYield !== null ? sp.earningsYield - tr.yield10Y : null;
  const valuation = classifyErp(erp);
  return {
    erp: erp ? parseFloat(erp.toFixed(3)) : null,
    earningsYield: sp.earningsYield ? parseFloat(sp.earningsYield.toFixed(3)) : null,
    treasuryYield10Y: tr.yield10Y,
    spPE: sp.trailingPE,
    valuation,
    interpretation: erpInterpretation(erp),
    updatedAt: new Date().toISOString(),
  };
}

async function summaryHandler() {
  const [sp500, treasury, erp, buffett, cape, spread] = await Promise.all([
    fetchSp500Data(),
    fetchTreasuryData(),
    (async () => {
      const sp = await fetchSp500Data();
      const tr = await fetchTreasuryData();
      const erpVal = sp.earningsYield !== null ? sp.earningsYield - tr.yield10Y : null;
      const valuation = classifyErp(erpVal);
      return {
        erp: erpVal ? parseFloat(erpVal.toFixed(3)) : null,
        earningsYield: sp.earningsYield ? parseFloat(sp.earningsYield.toFixed(3)) : null,
        treasuryYield10Y: tr.yield10Y,
        spPE: sp.trailingPE,
        valuation,
        interpretation: erpInterpretation(erpVal),
        updatedAt: new Date().toISOString(),
      };
    })(),
    fetchBuffettData(),
    fetchCapeData(),
    fetchSpreadData(),
  ]);

  // Include spread in overall score (4-indicator average)
  const avgScore =
    (valuationScore(erp.valuation) +
      valuationScore(buffett.valuation) +
      valuationScore(cape.valuation) +
      valuationScore(spread.valuation)) /
    4;

  const overallValuation = scoreToLevel(avgScore);
  const hasRealData = erp.erp !== null || buffett.ratio !== null;

  return {
    overallValuation,
    overallScore: parseFloat(avgScore.toFixed(2)),
    sp500,
    treasury,
    erp,
    buffett,
    cape,
    spread,
    updatedAt: new Date().toISOString(),
    dataQuality: hasRealData ? "live" : "estimated",
  };
}

export const endpoints = {
  "healthz": async () => ({ status: "ok" }),
  "market/sp500": fetchSp500Data,
  "market/treasury": fetchTreasuryData,
  "market/erp": erpHandler,
  "market/buffett": fetchBuffettData,
  "market/cape": fetchCapeData,
  "market/summary": summaryHandler,
  "market/spread": fetchSpreadData,
  "market/history": fetchHistoricalData,
};
