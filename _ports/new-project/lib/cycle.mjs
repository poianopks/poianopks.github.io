// Faithful port of artifacts/api-server/src/routes/cycle.ts (Replit "New Project").
// Handlers return the JSON body the Express route would send. The SSE route's
// first "price" event is the same payload as /cycle/live (see liveEvent()).
import { fetchYahooChart, fetchFredLatest } from "./http.mjs";

const fetchYahooQuote = (symbol) => fetchYahooChart(symbol, "1d", "5d");
const fetchYahooWeekly = (symbol, range) => fetchYahooChart(symbol, "1wk", range);

const TTL_PRICE = 30;

// ─── Math helpers ─────────────────────────────────────────────────────────────
function calcMA(closes, period) {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    result.push(sum / period);
  }
  return result;
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }

// ─── Body Position ─────────────────────────────────────────────────────────────
const BODY_PARTS = [
  { min: 0,  max: 10,  part: "발바닥", partEn: "sole",     color: "#22c55e", signal: "strongBuy",  label: "극단 침체 바닥",   hint: "역사적 저점 구간. 분할매수 시작 타이밍. 공포가 극에 달했을 때가 매수 기회." },
  { min: 10, max: 25,  part: "발목",   partEn: "ankle",    color: "#4ade80", signal: "buy",        label: "침체 회복 초입",   hint: "바닥을 지나 회복 시작. 가치주·배당주 중심 포트폴리오 구성 적기." },
  { min: 25, max: 40,  part: "무릎",   partEn: "knee",     color: "#a3e635", signal: "buy",        label: "초기 상승장",      hint: "추세 전환 확인 구간. 경기민감 섹터 비중 확대 시작." },
  { min: 40, max: 55,  part: "허리",   partEn: "waist",    color: "#facc15", signal: "neutral",    label: "중기 균형 국면",   hint: "적정 밸류에이션 구간. 섹터 로테이션 전략. 수익률 일부 실현 고려." },
  { min: 55, max: 70,  part: "어깨",   partEn: "shoulder", color: "#f97316", signal: "caution",    label: "후기 과열 징조",   hint: "과열 경고 구간. 수익 실현 시작. 방어주·현금 비중 확대." },
  { min: 70, max: 85,  part: "목",     partEn: "neck",     color: "#ef4444", signal: "sell",       label: "위험 과열 구간",   hint: "고평가 + 고변동성. 수익 적극 실현. FOMO 매수 극도 위험." },
  { min: 85, max: 101, part: "머리",   partEn: "head",     color: "#7c3aed", signal: "strongSell", label: "버블 극단 과열",   hint: "역사적 버블 구간. 현금화 최우선. 인버스/헷지 고려." },
];

function getBodyPosition(score) {
  const s = clamp(score);
  const part = BODY_PARTS.find((p) => s >= p.min && s < p.max) ?? BODY_PARTS[BODY_PARTS.length - 1];
  return { score: Math.round(s * 10) / 10, part: part.part, partEn: part.partEn, label: part.label, color: part.color, signal: part.signal, hint: part.hint };
}

const scoreSignal = (signal) => signal;

// ─── Index config ──────────────────────────────────────────────────────────────
const INDEX_CONFIG = {
  spx: { symbol: "^GSPC", nameKo: "S&P 500", nameEn: "S&P 500", currency: "USD", priceDecimals: 2 },
  nasdaq: { symbol: "^IXIC", nameKo: "나스닥", nameEn: "NASDAQ", currency: "USD", priceDecimals: 2 },
  kospi: { symbol: "^KS11", nameKo: "코스피", nameEn: "KOSPI", currency: "KRW", priceDecimals: 2 },
};

const isIndexKey = (s) => s === "spx" || s === "nasdaq" || s === "kospi";

// ─── Live price fetch ────────────────────────────────────────────────────────
export async function fetchLiveData() {
  const fetchedAt = new Date().toISOString();
  const [spxData, nasdaqData, kospiData, vixData] = await Promise.all([
    fetchYahooQuote("^GSPC"),
    fetchYahooQuote("^IXIC"),
    fetchYahooQuote("^KS11"),
    fetchYahooQuote("^VIX"),
  ]);

  function extractQuote(data, fallbackPrice) {
    if (data?.chart?.result?.[0]) {
      const m = data.chart.result[0].meta;
      return {
        price: Math.round((m.regularMarketPrice ?? fallbackPrice) * 100) / 100,
        change: Math.round((m.regularMarketChange ?? 0) * 100) / 100,
        changePct: Math.round((m.regularMarketChangePercent ?? 0) * 1000) / 1000,
        marketState: m.marketState ?? "CLOSED",
      };
    }
    return { price: fallbackPrice, change: 0, changePct: 0, marketState: "CLOSED" };
  }

  let vix = 18;
  if (vixData?.chart?.result?.[0]) {
    vix = Math.round((vixData.chart.result[0].meta.regularMarketPrice ?? 18) * 100) / 100;
  }

  return {
    spx: extractQuote(spxData, 5500),
    nasdaq: extractQuote(nasdaqData, 17000),
    kospi: extractQuote(kospiData, 2500),
    vix,
    fetchedAt,
    nextRefreshIn: 30,
  };
}

// /cycle/live and the first SSE "price" event: { ...data, nextRefreshIn: cacheNextRefresh("live") }
// (fresh cache entry → 30)
export async function live() {
  const data = await fetchLiveData();
  return { ...data, nextRefreshIn: TTL_PRICE };
}

// ─── Technical ───────────────────────────────────────────────────────────────
async function computeTechnical(indexKey) {
  const cfg = INDEX_CONFIG[indexKey];
  const fetchedAt = new Date().toISOString();
  const rawData = await fetchYahooWeekly(cfg.symbol, "5y");

  let price = indexKey === "spx" ? 5500 : indexKey === "nasdaq" ? 17000 : 2500;
  let ma20w = price * 0.96, ma60w = price * 0.91, ma120w = price * 0.85;
  let rsi14w = 55, high52w = price * 1.07, low52w = price * 0.87;

  if (rawData?.chart?.result?.[0]) {
    const result = rawData.chart.result[0];
    const rawCloses = result.indicators.quote[0].close;
    const closes = rawCloses.filter((c) => c !== null && !isNaN(c));

    if (closes.length > 0) {
      price = result.meta.regularMarketPrice ?? closes[closes.length - 1];
      const ma20 = calcMA(closes, 20);
      const ma60 = calcMA(closes, 60);
      const ma120 = calcMA(closes, 120);
      ma20w = ma20[ma20.length - 1] ?? ma20w;
      ma60w = ma60[ma60.length - 1] ?? ma60w;
      ma120w = ma120[ma120.length - 1] ?? ma120w;
      rsi14w = calcRSI(closes, 14);
      const last52 = closes.slice(-52);
      high52w = Math.max(...last52);
      low52w = Math.min(...last52);
    }
  }

  const distFromMa60Pct = ((price - ma60w) / ma60w) * 100;

  let maAlignScore = 50;
  if (price > ma20w && ma20w > ma60w && ma60w > ma120w) {
    const ext = distFromMa60Pct;
    if (ext > 25) maAlignScore = 88;
    else if (ext > 15) maAlignScore = 78;
    else if (ext > 8) maAlignScore = 65;
    else if (ext > 3) maAlignScore = 55;
    else maAlignScore = 48;
  } else if (price < ma20w && ma20w < ma60w && ma60w < ma120w) {
    const drop = Math.abs(distFromMa60Pct);
    if (drop > 25) maAlignScore = 5;
    else if (drop > 15) maAlignScore = 15;
    else if (drop > 8) maAlignScore = 28;
    else maAlignScore = 40;
  } else {
    maAlignScore = clamp(50 + distFromMa60Pct * 1.5);
  }

  let rsiScore;
  if (rsi14w >= 80) rsiScore = 90;
  else if (rsi14w >= 70) rsiScore = 78;
  else if (rsi14w >= 60) rsiScore = 65;
  else if (rsi14w >= 50) rsiScore = 52;
  else if (rsi14w >= 40) rsiScore = 40;
  else if (rsi14w >= 30) rsiScore = 22;
  else rsiScore = 8;

  const range52 = high52w - low52w;
  const pos52 = range52 > 0 ? ((price - low52w) / range52) * 100 : 50;
  let pos52Score;
  if (pos52 >= 95) pos52Score = 90;
  else if (pos52 >= 80) pos52Score = 75;
  else if (pos52 >= 60) pos52Score = 60;
  else if (pos52 >= 40) pos52Score = 45;
  else if (pos52 >= 20) pos52Score = 30;
  else if (pos52 >= 5) pos52Score = 15;
  else pos52Score = 5;

  let distScore;
  if (distFromMa60Pct > 25) distScore = 93;
  else if (distFromMa60Pct > 15) distScore = 80;
  else if (distFromMa60Pct > 8) distScore = 65;
  else if (distFromMa60Pct > 3) distScore = 55;
  else if (distFromMa60Pct > -3) distScore = 45;
  else if (distFromMa60Pct > -10) distScore = 30;
  else if (distFromMa60Pct > -20) distScore = 18;
  else distScore = 5;

  const overallScore = maAlignScore * 0.30 + rsiScore * 0.25 + pos52Score * 0.25 + distScore * 0.20;
  const sig = (s) => s >= 75 ? "sell" : s >= 60 ? "caution" : s <= 20 ? "strongBuy" : s <= 35 ? "buy" : "neutral";
  const srcLabel = `Yahoo Finance ${cfg.symbol} (주봉 5년)`;

  return {
    index: indexKey,
    indexName: cfg.nameKo,
    overall: getBodyPosition(overallScore),
    price: Math.round(price * 100) / 100,
    ma20w: Math.round(ma20w * 100) / 100,
    ma60w: Math.round(ma60w * 100) / 100,
    ma120w: Math.round(ma120w * 100) / 100,
    rsi14w: Math.round(rsi14w * 10) / 10,
    high52w: Math.round(high52w * 100) / 100,
    low52w: Math.round(low52w * 100) / 100,
    distFromMa60Pct: Math.round(distFromMa60Pct * 100) / 100,
    spxPrice: Math.round(price * 100) / 100,
    spxMa20w: Math.round(ma20w * 100) / 100,
    spxMa60w: Math.round(ma60w * 100) / 100,
    spxMa120w: Math.round(ma120w * 100) / 100,
    indicators: [
      {
        name: "MA Alignment",
        nameKo: "이동평균 배열",
        value: distFromMa60Pct,
        valueLabel: `MA60 대비 ${distFromMa60Pct >= 0 ? "+" : ""}${distFromMa60Pct.toFixed(1)}%`,
        score: Math.round(maAlignScore),
        weight: 0.30,
        interpretation: maAlignScore >= 65
          ? `주봉 MA 정배열. MA60 대비 ${distFromMa60Pct.toFixed(1)}% 위.`
          : maAlignScore >= 45
          ? `MA 혼재 국면. MA60 대비 ${distFromMa60Pct.toFixed(1)}%.`
          : `역배열. MA60 대비 ${distFromMa60Pct.toFixed(1)}% 하위.`,
        signal: scoreSignal(sig(maAlignScore)),
        source: srcLabel,
        updatedAt: fetchedAt,
      },
      {
        name: "RSI (14w)",
        nameKo: "RSI 주봉 14",
        value: rsi14w,
        valueLabel: `RSI ${rsi14w.toFixed(1)}`,
        score: Math.round(rsiScore),
        weight: 0.25,
        interpretation: rsi14w >= 70
          ? `주봉 RSI ${rsi14w.toFixed(1)} — 과매수. 조정 경계.`
          : rsi14w <= 30
          ? `주봉 RSI ${rsi14w.toFixed(1)} — 극단 과매도. 역발상 매수 신호.`
          : `주봉 RSI ${rsi14w.toFixed(1)} — 중립.`,
        signal: scoreSignal(sig(rsiScore)),
        source: srcLabel,
        updatedAt: fetchedAt,
      },
      {
        name: "52-Week Position",
        nameKo: "52주 고저 위치",
        value: pos52,
        valueLabel: `범위 내 ${pos52.toFixed(0)}%`,
        score: Math.round(pos52Score),
        weight: 0.25,
        interpretation: `52주 고저가 범위 내 ${pos52.toFixed(0)}% 위치.`,
        signal: scoreSignal(sig(pos52Score)),
        source: srcLabel,
        updatedAt: fetchedAt,
      },
      {
        name: "MA60 Distance",
        nameKo: "MA60 괴리율",
        value: distFromMa60Pct,
        valueLabel: `${distFromMa60Pct >= 0 ? "+" : ""}${distFromMa60Pct.toFixed(1)}%`,
        score: Math.round(distScore),
        weight: 0.20,
        interpretation: distFromMa60Pct > 15
          ? `MA60 대비 +${distFromMa60Pct.toFixed(1)}% — 과열. 평균 회귀 압력.`
          : distFromMa60Pct < -10
          ? `MA60 대비 ${distFromMa60Pct.toFixed(1)}% — 역사적 매수 기회.`
          : `MA60 대비 ${distFromMa60Pct.toFixed(1)}%.`,
        signal: scoreSignal(sig(distScore)),
        source: srcLabel,
        updatedAt: fetchedAt,
      },
    ],
    fetchedAt,
    nextRefreshIn: 300,
  };
}

export async function technical(query) {
  const rawIndex = String(query.get("index") ?? "spx");
  const indexKey = isIndexKey(rawIndex) ? rawIndex : "spx";
  return computeTechnical(indexKey);
}

// ─── Fundamental ─────────────────────────────────────────────────────────────
export async function fundamental() {
  const fetchedAt = new Date().toISOString();

  const [yieldCurveRaw, hyCreditRaw, will5000Raw, gdpRaw, vixData] = await Promise.all([
    fetchFredLatest("T10Y2Y"),
    fetchFredLatest("BAMLH0A0HYM2"),
    fetchFredLatest("WILL5000PRFC"),
    fetchFredLatest("GDP"),
    fetchYahooQuote("^VIX"),
  ]);

  const yieldCurve = yieldCurveRaw ?? -0.5;
  const hyCreditSpread = hyCreditRaw ?? 3.5;
  const will5000 = will5000Raw ?? 46000;
  const gdp = gdpRaw ?? 29000;
  const buffettIndicator = (will5000 / gdp) * 100;

  let vix = 18;
  if (vixData?.chart?.result?.[0]) {
    vix = vixData.chart.result[0].meta.regularMarketPrice ?? 18;
  }

  let ycScore;
  if (yieldCurve >= 1.5) ycScore = 75;
  else if (yieldCurve >= 0.5) ycScore = 60;
  else if (yieldCurve >= 0) ycScore = 50;
  else if (yieldCurve >= -0.5) ycScore = 38;
  else if (yieldCurve >= -1.0) ycScore = 25;
  else ycScore = 15;

  let hyScore;
  if (hyCreditSpread <= 3.0) hyScore = 85;
  else if (hyCreditSpread <= 4.0) hyScore = 72;
  else if (hyCreditSpread <= 5.5) hyScore = 55;
  else if (hyCreditSpread <= 7.0) hyScore = 38;
  else if (hyCreditSpread <= 10.0) hyScore = 20;
  else hyScore = 8;

  let buffScore;
  if (buffettIndicator >= 200) buffScore = 97;
  else if (buffettIndicator >= 175) buffScore = 90;
  else if (buffettIndicator >= 150) buffScore = 80;
  else if (buffettIndicator >= 130) buffScore = 70;
  else if (buffettIndicator >= 110) buffScore = 60;
  else if (buffettIndicator >= 90) buffScore = 50;
  else if (buffettIndicator >= 70) buffScore = 38;
  else if (buffettIndicator >= 50) buffScore = 22;
  else buffScore = 10;

  let vixScore;
  if (vix <= 12) vixScore = 90;
  else if (vix <= 15) vixScore = 78;
  else if (vix <= 20) vixScore = 60;
  else if (vix <= 25) vixScore = 45;
  else if (vix <= 35) vixScore = 30;
  else if (vix <= 50) vixScore = 15;
  else vixScore = 5;

  const overallScore = ycScore * 0.25 + hyScore * 0.25 + buffScore * 0.30 + vixScore * 0.20;
  const sig = (s) => s >= 75 ? "sell" : s >= 60 ? "caution" : s <= 20 ? "strongBuy" : s <= 35 ? "buy" : "neutral";

  return {
    overall: getBodyPosition(overallScore),
    yieldCurve: Math.round(yieldCurve * 1000) / 1000,
    hyCreditSpread: Math.round(hyCreditSpread * 100) / 100,
    buffettIndicator: Math.round(buffettIndicator * 10) / 10,
    vix: Math.round(vix * 100) / 100,
    indicators: [
      {
        name: "Yield Curve (10Y-2Y)",
        nameKo: "장단기 금리차",
        value: yieldCurve,
        valueLabel: `${yieldCurve >= 0 ? "+" : ""}${yieldCurve.toFixed(2)}%p`,
        score: Math.round(ycScore),
        weight: 0.25,
        interpretation: yieldCurve >= 0
          ? `10Y-2Y 금리차 +${yieldCurve.toFixed(2)}%p — 정상 곡선.`
          : `10Y-2Y 금리차 ${yieldCurve.toFixed(2)}%p — 역전. 경기침체 선행지표.`,
        signal: scoreSignal(sig(ycScore)),
        source: "FRED T10Y2Y (실시간)",
        updatedAt: fetchedAt,
      },
      {
        name: "HY Credit Spread",
        nameKo: "하이일드 신용 스프레드",
        value: hyCreditSpread,
        valueLabel: `${hyCreditSpread.toFixed(2)}%`,
        score: Math.round(hyScore),
        weight: 0.25,
        interpretation: hyCreditSpread <= 3.5
          ? `HY 스프레드 ${hyCreditSpread.toFixed(2)}% — 극히 낮음. 버블 신호.`
          : hyCreditSpread >= 7
          ? `HY 스프레드 ${hyCreditSpread.toFixed(2)}% — 위기 수준.`
          : `HY 스프레드 ${hyCreditSpread.toFixed(2)}% — 정상 구간.`,
        signal: scoreSignal(sig(hyScore)),
        source: "FRED BAMLH0A0HYM2 (실시간)",
        updatedAt: fetchedAt,
      },
      {
        name: "Buffett Indicator",
        nameKo: "버핏 지수",
        value: buffettIndicator,
        valueLabel: `${buffettIndicator.toFixed(0)}%`,
        score: Math.round(buffScore),
        weight: 0.30,
        interpretation: buffettIndicator >= 175
          ? `버핏지수 ${buffettIndicator.toFixed(0)}% — 극단 과대평가.`
          : buffettIndicator >= 100
          ? `버핏지수 ${buffettIndicator.toFixed(0)}% — 고평가 구간.`
          : `버핏지수 ${buffettIndicator.toFixed(0)}% — 저평가.`,
        signal: scoreSignal(sig(buffScore)),
        source: "FRED WILL5000PRFC + GDP (실시간)",
        updatedAt: fetchedAt,
      },
      {
        name: "VIX Fear Index",
        nameKo: "공포지수 VIX",
        value: vix,
        valueLabel: `VIX ${vix.toFixed(1)}`,
        score: Math.round(vixScore),
        weight: 0.20,
        interpretation: vix <= 15
          ? `VIX ${vix.toFixed(1)} — 극단 자만. 버블 위험.`
          : vix <= 25
          ? `VIX ${vix.toFixed(1)} — 안정 구간.`
          : `VIX ${vix.toFixed(1)} — 공포 구간. 역발상 기회.`,
        signal: scoreSignal(sig(vixScore)),
        source: "Yahoo Finance ^VIX (실시간)",
        updatedAt: fetchedAt,
      },
    ],
    fetchedAt,
    nextRefreshIn: 900,
  };
}

export const routes = {
  "/api/cycle/live": live,
  "/api/cycle/stream": live, // SSE: first "price" event payload
  "/api/cycle/technical": technical,
  "/api/cycle/fundamental": fundamental,
};
