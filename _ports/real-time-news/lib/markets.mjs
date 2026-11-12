// Port of artifacts/api-server/src/routes/markets.ts (GET handlers only, Express removed).
// Each exported function returns the JSON body the route would send, or throws on failure.
import { fetchQuote, yfChart, makeCache, formatVolume, BROWSER_UA } from "./common.mjs";
import { readSurvivalConfig } from "./admin.mjs";

const { getCached, setCached } = makeCache();

function getMarketTTL(marketState) {
  if (marketState === "REGULAR") return 15 * 1000;
  if (marketState === "PRE" || marketState === "POST") return 30 * 1000;
  return 2 * 60 * 1000;
}

const NYSE_INDICES = [
  { symbol: "^DJI", name: "다우존스" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "나스닥" },
  { symbol: "^RUT", name: "러셀 2000" },
  { symbol: "^VIX", name: "VIX 공포지수" },
];

const TOP_STOCKS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
  "META", "TSLA", "BRK-B", "JPM", "V",
  "XOM", "UNH", "JNJ", "PG", "MA",
];

// GET /markets/nyse
export async function nyse() {
  const probe = getCached("nyse_probe", 15 * 1000);
  const ttl = probe ? getMarketTTL(
    probe.marketStatus === "장개장중" ? "REGULAR" :
    probe.marketStatus === "프리마켓" ? "PRE" :
    probe.marketStatus === "애프터마켓" ? "POST" : "CLOSED"
  ) : 2 * 60 * 1000;

  const cached = getCached("nyse", ttl);
  if (cached) return cached;

  const [indicesResults, stockResults] = await Promise.all([
    Promise.all(NYSE_INDICES.map((idx) => fetchQuote(idx.symbol))),
    Promise.all(TOP_STOCKS.map((s) => fetchQuote(s))),
  ]);

  const indices = [];
  for (let i = 0; i < NYSE_INDICES.length; i++) {
    const q = indicesResults[i];
    if (q) {
      indices.push({
        name: NYSE_INDICES[i].name,
        symbol: NYSE_INDICES[i].symbol,
        value: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        previousClose: q.regularMarketPreviousClose ?? 0,
      });
    }
  }

  const stocks = [];
  for (let i = 0; i < TOP_STOCKS.length; i++) {
    const q = stockResults[i];
    if (q) {
      stocks.push({
        symbol: TOP_STOCKS[i],
        name: q.shortName || q.longName || TOP_STOCKS[i],
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        volume: formatVolume(q.regularMarketVolume),
      });
    }
  }

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const firstQ = indicesResults[0];
  let marketStatus = "장마감";
  if (firstQ?.marketState === "REGULAR") marketStatus = "장개장중";
  else if (firstQ?.marketState === "PRE") marketStatus = "프리마켓";
  else if (firstQ?.marketState === "POST") marketStatus = "애프터마켓";

  const snapshot = {
    indices,
    topGainers: gainers,
    topLosers: losers,
    updatedAt: new Date().toISOString(),
    marketStatus,
    isRealtime: firstQ?.marketState === "REGULAR" || firstQ?.marketState === "PRE" || firstQ?.marketState === "POST",
  };

  setCached("nyse", snapshot);
  setCached("nyse_probe", { marketStatus });
  return snapshot;
}

// GET /markets/analysis
export async function analysis() {
  const probe = getCached("nyse_probe", 15 * 1000);
  const ttl = probe?.marketStatus === "장개장중" ? 15 * 1000 : 2 * 60 * 1000;
  const cached = getCached("analysis", ttl);
  if (cached) return cached;

  const [dji, gspc, ixic, vix] = await Promise.all([
    fetchQuote("^DJI"),
    fetchQuote("^GSPC"),
    fetchQuote("^IXIC"),
    fetchQuote("^VIX"),
  ]);

  const djiChg = dji?.regularMarketChangePercent ?? 0;
  const gspcChg = gspc?.regularMarketChangePercent ?? 0;
  const ixicChg = ixic?.regularMarketChangePercent ?? 0;
  const vixLevel = vix?.regularMarketPrice ?? 0;
  const vixChg = vix?.regularMarketChangePercent ?? 0;
  const avgChg = (djiChg + gspcChg + ixicChg) / 3;

  const fmt = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  const fmtNum = (n) => n.toFixed(2);

  let sentiment;
  let summary;
  const keyDrivers = [];

  if (avgChg > 1.5) {
    sentiment = "강세";
    summary = `뉴욕증시가 강한 상승세입니다. 다우존스 ${fmt(djiChg)}, S&P 500 ${fmt(gspcChg)}, 나스닥 ${fmt(ixicChg)} 기록.`;
  } else if (avgChg > 0.3) {
    sentiment = "소폭상승";
    summary = `뉴욕증시가 소폭 상승하고 있습니다. 다우존스 ${fmt(djiChg)}, S&P 500 ${fmt(gspcChg)}, 나스닥 ${fmt(ixicChg)} 수준입니다.`;
  } else if (avgChg > -0.3) {
    sentiment = "혼조";
    summary = `뉴욕증시가 혼조세입니다. 다우존스 ${fmt(djiChg)}, S&P 500 ${fmt(gspcChg)}, 나스닥 ${fmt(ixicChg)} 보합.`;
  } else if (avgChg > -1.5) {
    sentiment = "약세";
    summary = `뉴욕증시가 소폭 하락 중입니다. 다우존스 ${fmt(djiChg)}, S&P 500 ${fmt(gspcChg)}, 나스닥 ${fmt(ixicChg)} 하락.`;
  } else {
    sentiment = "급락";
    summary = `뉴욕증시가 급격한 하락세입니다. 다우존스 ${fmt(djiChg)}, S&P 500 ${fmt(gspcChg)}, 나스닥 ${fmt(ixicChg)} 급락.`;
  }

  if (Math.abs(ixicChg) > Math.abs(djiChg) + 0.3) {
    keyDrivers.push(`기술주·나스닥 주도 — 나스닥 ${fmt(ixicChg)} vs 다우 ${fmt(djiChg)} 괴리 뚜렷`);
  } else if (Math.abs(djiChg) > Math.abs(ixicChg) + 0.3) {
    keyDrivers.push(`전통 산업주 주도 — 다우 ${fmt(djiChg)} 강세, 기술주 ${fmt(ixicChg)} 상대 부진`);
  } else {
    keyDrivers.push(`지수 동반 ${avgChg > 0 ? "상승" : avgChg < 0 ? "하락" : "보합"} — 다우 ${fmt(djiChg)}, S&P500 ${fmt(gspcChg)}, 나스닥 ${fmt(ixicChg)}`);
  }

  if (vixLevel > 30) {
    keyDrivers.push(`VIX 공포지수 ${fmtNum(vixLevel)} (${fmt(vixChg)}) — 극도 불안 구간, 급격한 변동성 경보`);
  } else if (vixLevel > 20) {
    keyDrivers.push(`VIX 공포지수 ${fmtNum(vixLevel)} (${fmt(vixChg)}) — 불안 구간, 헤지 수요 증가 중`);
  } else if (vixLevel > 15) {
    keyDrivers.push(`VIX 공포지수 ${fmtNum(vixLevel)} (${fmt(vixChg)}) — 보통 수준, 시장 안정 유지`);
  } else {
    keyDrivers.push(`VIX 공포지수 ${fmtNum(vixLevel)} (${fmt(vixChg)}) — 역사적 저변동성, 투자자 낙관`);
  }

  if (ixicChg > 0.5 && djiChg > 0.5) {
    keyDrivers.push(`기술주·가치주 동반 강세 — 광범위한 매수세, 리스크온 환경`);
  } else if (ixicChg > 1 && djiChg < 0) {
    keyDrivers.push(`기술주만 상승, 전통주 약세 — 성장주 집중 매수, 방어적 로테이션 혼재`);
  } else if (ixicChg < -0.5 && djiChg < -0.5) {
    keyDrivers.push(`전 섹터 약세 — 리스크오프 국면, 현금 비중 확대 흐름`);
  } else if (avgChg > 0) {
    keyDrivers.push(`소폭 상승 지속 — 매크로 이벤트(Fed, 실적, 고용) 대기 모드`);
  } else {
    keyDrivers.push(`방향성 탐색 — Fed 발언·경제지표·실적 발표가 다음 트리거`);
  }

  const strength = Math.abs(avgChg);
  if (strength > 1.5) {
    keyDrivers.push(`강한 추세 (평균 ${fmt(avgChg)}) — 모멘텀 추종 전략 유효, 급반전 주의`);
  } else if (strength > 0.5) {
    keyDrivers.push(`중간 강도 추세 (S&P500 ${fmt(gspcChg)}) — 방향성은 있으나 확신은 보통`);
  } else {
    keyDrivers.push(`방향성 불명확 (평균 ${fmt(avgChg)}) — 개별 종목·섹터 선별 접근 필요`);
  }

  const firstQ = (await fetchQuote("^DJI")) ?? dji;
  let marketStatus = "장마감";
  if (firstQ?.marketState === "REGULAR") marketStatus = "장개장중";
  else if (firstQ?.marketState === "PRE") marketStatus = "프리마켓";
  else if (firstQ?.marketState === "POST") marketStatus = "애프터마켓";

  const result = {
    summary,
    keyDrivers: keyDrivers.slice(0, 4),
    sentiment,
    updatedAt: new Date().toISOString(),
    marketStatus,
    vixLevel,
    vixChange: vixChg,
    isRealtime: firstQ?.marketState === "REGULAR" || firstQ?.marketState === "PRE" || firstQ?.marketState === "POST",
  };

  setCached("analysis", result);
  return result;
}

// GET /markets/macro
export async function macro() {
  const macroprobe = getCached("nyse_probe", 15 * 1000);
  const ttl = macroprobe?.marketStatus === "장개장중" || macroprobe?.marketStatus === "프리마켓" || macroprobe?.marketStatus === "애프터마켓" ? 15 * 1000 : 2 * 60 * 1000;
  const cached = getCached("macro", ttl);
  if (cached) return cached;

  const [usdkrw, gold, oil, spy, tnx] = await Promise.all([
    fetchQuote("USDKRW=X"),
    fetchQuote("GC=F"),
    fetchQuote("CL=F"),
    fetchQuote("SPY"),
    fetchQuote("^TNX"),
  ]);

  const vixQuote = await fetchQuote("^VIX").catch(() => null);
  const sp500Quote = await fetchQuote("^GSPC").catch(() => null);
  const vixVal = vixQuote?.regularMarketPrice ?? 20;
  const sp500Chg = sp500Quote?.regularMarketChangePercent ?? 0;
  const yield10yVal = tnx?.regularMarketPrice ?? 4.5;

  const vixScore = Math.max(0, Math.min(100, 100 - ((vixVal - 10) / 40) * 100));
  const momentumScore = Math.max(0, Math.min(100, 50 + sp500Chg * 15));
  const bondScore = Math.max(0, Math.min(100, 50 - (yield10yVal - 3.5) * 15));
  const fearGreed = Math.round(vixScore * 0.50 + momentumScore * 0.30 + bondScore * 0.20);
  const fearGreedLabel =
    fearGreed < 25 ? "극도 공포" :
    fearGreed < 40 ? "공포" :
    fearGreed < 60 ? "중립" :
    fearGreed < 75 ? "탐욕" : "극도 탐욕";

  const usdKrw = usdkrw?.regularMarketPrice ?? 0;
  const goldPrice = gold?.regularMarketPrice ?? 0;
  const goldChg = gold?.regularMarketChangePercent ?? 0;
  const oilPrice = oil?.regularMarketPrice ?? 0;
  const oilChg = oil?.regularMarketChangePercent ?? 0;
  const yield10y = tnx?.regularMarketPrice ?? 0;

  const spyPE = spy?.trailingPE ?? 0;
  let erp = 0;
  let erpLabel = "중립";
  if (spyPE > 0 && yield10y > 0) {
    const earningsYield = (1 / spyPE) * 100;
    erp = parseFloat((earningsYield - yield10y).toFixed(2));
    if (erp > 2) erpLabel = "저평가";
    else if (erp > 0) erpLabel = "중립";
    else erpLabel = "고평가";
  }

  const snapshot = {
    fearGreed,
    fearGreedLabel,
    usdKrw,
    usdKrwChange: usdkrw?.regularMarketChangePercent ?? 0,
    gold: goldPrice,
    goldChangePercent: goldChg,
    oil: oilPrice,
    oilChangePercent: oilChg,
    erp,
    erpLabel,
    spyPE,
    yield10y,
    updatedAt: new Date().toISOString(),
  };

  setCached("macro", snapshot);
  return snapshot;
}

async function fetchKospiReturns() {
  const CACHE_KEY = "kospi_returns";
  const CACHE_TTL = 4 * 60 * 60 * 1000;
  const cached = getCached(CACHE_KEY, CACHE_TTL);
  if (cached) return cached;

  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const period1 = twoYearsAgo.toISOString().slice(0, 10);
    const period2 = new Date().toISOString().slice(0, 10);

    const chartResult = await yfChart("^KS11", { period1, period2, interval: "1d" });
    const quotes = chartResult?.quotes;
    if (!quotes || quotes.length < 5) return { kospiReturns: [], kospiAth: 0, kospiAthDate: "" };

    const valid = quotes.filter((h) => h.close != null && h.close > 0);
    if (valid.length < 5) return { kospiReturns: [], kospiAth: 0, kospiAthDate: "" };

    const now = Date.now();
    const last = valid[valid.length - 1];
    const currentClose = last.close;
    const currentDate = new Date(last.date).toISOString().slice(0, 10);

    const athEntry = valid.reduce((a, b) => (b.close > a.close ? b : a));
    const kospiAth = athEntry.close;
    const kospiAthDate = new Date(athEntry.date).toISOString().slice(0, 10);

    const findNearest = (msAgo) => {
      const target = now - msAgo;
      return valid.reduce((a, b) =>
        Math.abs(new Date(b.date).getTime() - target) < Math.abs(new Date(a.date).getTime() - target) ? b : a
      );
    };

    const PERIODS = [
      { label: "1주일", ms: 7 * 24 * 60 * 60 * 1000 },
      { label: "1개월", ms: 30 * 24 * 60 * 60 * 1000 },
      { label: "3개월", ms: 91 * 24 * 60 * 60 * 1000 },
      { label: "6개월", ms: 182 * 24 * 60 * 60 * 1000 },
      { label: "1년",   ms: 365 * 24 * 60 * 60 * 1000 },
      { label: "2년",   ms: 730 * 24 * 60 * 60 * 1000 },
    ];

    const kospiReturns = PERIODS.map(({ label, ms }) => {
      const from = findNearest(ms);
      const fromDate = new Date(from.date).toISOString().slice(0, 10);
      const fromClose = from.close;
      const returnPct = +((currentClose / fromClose - 1) * 100).toFixed(2);
      const isATH = currentDate === kospiAthDate;
      return { label, fromDate, fromClose: Math.round(fromClose), toClose: Math.round(currentClose), returnPct, isATH };
    });

    const result = { kospiReturns, kospiAth: Math.round(kospiAth), kospiAthDate };
    setCached(CACHE_KEY, result);
    return result;
  } catch (err) {
    console.warn(`  [yahoo] chart ^KS11 (returns) failed: ${err?.message ?? err}`);
    return { kospiReturns: [], kospiAth: 0, kospiAthDate: "" };
  }
}

// GET /markets/korea
export async function korea() {
  const probe = getCached("nyse_probe", 60 * 1000);
  const ttl = probe?.marketStatus === "장개장중" ? 15 * 1000 : probe?.marketStatus === "프리마켓" || probe?.marketStatus === "애프터마켓" ? 30 * 1000 : 2 * 60 * 1000;
  const cached = getCached("korea", ttl);
  if (cached) return cached;

  const PHYSICAL_AI_STOCKS = [
    { symbol: "004800.KS", nameKo: "효성중공업",        sector: "전력인프라", currency: "KRW" },
    { symbol: "267260.KS", nameKo: "HD현대일렉트릭",    sector: "전력인프라", currency: "KRW" },
    { symbol: "454910.KS", nameKo: "두산로보틱스",      sector: "로보틱스",   currency: "KRW" },
    { symbol: "012450.KS", nameKo: "한화에어로스페이스", sector: "로보틱스",  currency: "KRW" },
    { symbol: "034020.KS", nameKo: "두산에너빌리티",    sector: "원자력",     currency: "KRW" },
  ];

  const [ks11, kq11, tnx, tyx, vixQ, returnsData, ...physAiQuotes] = await Promise.all([
    fetchQuote("^KS11"),
    fetchQuote("^KQ11"),
    fetchQuote("^TNX"),
    fetchQuote("^TYX"),
    fetchQuote("^VIX"),
    fetchKospiReturns(),
    ...PHYSICAL_AI_STOCKS.map((s) => fetchQuote(s.symbol)),
  ]);

  const kospiVal = ks11?.regularMarketPrice ?? 0;
  const kospiChg = ks11?.regularMarketChangePercent ?? 0;
  const kospiChgAbs = ks11?.regularMarketChange ?? 0;
  const kosdaqVal = kq11?.regularMarketPrice ?? 0;
  const kosdaqChg = kq11?.regularMarketChangePercent ?? 0;
  const kosdaqChgAbs = kq11?.regularMarketChange ?? 0;
  const yield10y = tnx?.regularMarketPrice ?? 0;
  const yield30y = tyx?.regularMarketPrice ?? 0;
  const vixLevel = vixQ?.regularMarketPrice ?? 0;

  const fmt = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

  const riskItems = [];

  if (yield30y >= 5.0) {
    riskItems.push({ title: `미국 30년물 금리 ${yield30y.toFixed(2)}%`, detail: "2007년 서브프라임 이후 최고치. 빅테크 AI 데이터센터 CAPEX에 자금 조달 부담 → 반도체 수요 감소 위험 상존.", level: "high" });
  } else if (yield30y >= 4.5) {
    riskItems.push({ title: `미국 30년물 금리 ${yield30y.toFixed(2)}%`, detail: "고금리 지속. 성장주 밸류에이션 압박 및 한국 외국인 자금 유출 주의.", level: "medium" });
  } else {
    riskItems.push({ title: `미국 30년물 금리 ${yield30y.toFixed(2)}%`, detail: "금리 안정 구간. 성장주 밸류에이션 부담 낮음, 자금 유입 여건 우호적.", level: "low" });
  }

  if (yield10y >= 4.6) {
    riskItems.push({ title: `미국 10년물 금리 ${yield10y.toFixed(2)}%`, detail: "장기 기대수익률 기준선 상승. 위험자산 대비 국채 매력 증가, 코스피 외국인 이탈 압박.", level: "high" });
  } else if (yield10y >= 4.0) {
    riskItems.push({ title: `미국 10년물 금리 ${yield10y.toFixed(2)}%`, detail: "보통 수준. 주식·채권 상대 매력은 균형, 추가 상승 시 위험.", level: "medium" });
  } else {
    riskItems.push({ title: `미국 10년물 금리 ${yield10y.toFixed(2)}%`, detail: "안정. 채권 대비 주식 매력 양호.", level: "low" });
  }

  if (vixLevel > 30) {
    riskItems.push({ title: `VIX 공포지수 ${vixLevel.toFixed(1)}`, detail: "극도 공포 구간. 단기 급락 리스크 매우 높음. 현금 비중 확대·분할 접근 필수.", level: "high" });
  } else if (vixLevel > 20) {
    riskItems.push({ title: `VIX 공포지수 ${vixLevel.toFixed(1)}`, detail: "불안 구간. 변동성 확대 중. 분할 매수 접근 권장, 풀베팅 자제.", level: "medium" });
  } else {
    riskItems.push({ title: `VIX 공포지수 ${vixLevel.toFixed(1)}`, detail: "안정 구간. 과도한 낙관 시 역설적 경계 신호 — 공포가 없을 때가 위험한 때.", level: "low" });
  }

  if (kospiChg < -2) {
    riskItems.push({ title: `코스피 ${fmt(kospiChg)} 급락`, detail: "반대매매(마진콜) 연쇄 위험. 외국인 대규모 매도 시 추가 하락 가능 — 빚투 계좌 청산 도미노 경계.", level: "high" });
  } else if (kospiChg < -1) {
    riskItems.push({ title: `코스피 ${fmt(kospiChg)} 하락`, detail: "단기 하락 압력. 외국인 포지션 및 반대매매 동향 주시.", level: "medium" });
  } else {
    riskItems.push({ title: `코스피 ${fmt(kospiChg)} 등락`, detail: "등락폭 안정. ETF 44조 대기자금이 조정 시 자동 지지선 역할.", level: "low" });
  }

  riskItems.push({ title: "中 창신메모리(CXMT) IPO 위협", detail: "2026년 하반기 6조 원 실탄 장전 후 D램 생산량 폭증 예고. 점유율 두 자릿수 근접 — 한국 메모리 마진 압박 위험.", level: "medium" });

  const opportunityItems = [
    { title: "삼성·SK하이닉스 2026년 영업이익 630~800조 전망", detail: "PER 5배 수준. 이익 절정 시 시장은 이미 6개월 앞을 봄 — 다음 사이클 개화 타이밍 포착 중요.", signal: "positive" },
    { title: "코스피 목표 9,000~11,000 (노무라·JP모건·골드만삭스)", detail: "ETF 44조 대기자금·상법 개정 기대·코리아 디스카운트 해소 → 재평가 여건 형성 중.", signal: "positive" },
    { title: "피지컬 AI 다음 물결 섹터 부상", detail: "전력인프라(효성중공업·HD현대일렉트릭)·원자력·로보틱스(두산로보틱스·보스턴다이내믹스)·HBM 메모리 수혜.", signal: "positive" },
    { title: "코리아 디스카운트 해소 + 상법 개정", detail: "PBR 1배 이하에서 주주환원 확대 → 외국인 재평가 가능성. 실현 시 밸류에이션 리레이팅 기대.", signal: "positive" },
  ];

  let balanceScore = 50;
  if (yield30y >= 5.0) balanceScore -= 15;
  else if (yield30y >= 4.5) balanceScore -= 8;
  if (yield10y >= 4.6) balanceScore -= 8;
  else if (yield10y >= 4.0) balanceScore -= 3;
  if (vixLevel > 30) balanceScore -= 15;
  else if (vixLevel > 20) balanceScore -= 8;
  else if (vixLevel < 14) balanceScore += 5;
  if (kospiChg > 1.5) balanceScore += 10;
  else if (kospiChg > 0.5) balanceScore += 5;
  else if (kospiChg < -2) balanceScore -= 12;
  else if (kospiChg < -1) balanceScore -= 6;
  balanceScore = Math.max(5, Math.min(95, balanceScore));

  const isKrxOpen = ks11?.marketState === "REGULAR";

  const kospiScenarios = kospiVal > 0 ? [
    { label: "-10% 조정", level: Math.round(kospiVal * 0.90), pct: -10, severity: "caution" },
    { label: "-15% 조정", level: Math.round(kospiVal * 0.85), pct: -15, severity: "warning" },
    { label: "-20% 조정", level: Math.round(kospiVal * 0.80), pct: -20, severity: "danger" },
  ] : [];

  const marginCallAlert = vixLevel > 20 || kospiChg <= -2;

  const physicalAiStocks = PHYSICAL_AI_STOCKS.map((meta, i) => {
    const q = physAiQuotes[i];
    return {
      symbol: meta.symbol,
      nameKo: meta.nameKo,
      sector: meta.sector,
      currency: meta.currency,
      price: q?.regularMarketPrice ?? 0,
      change: q?.regularMarketChange ?? 0,
      changePercent: q?.regularMarketChangePercent ?? 0,
    };
  });

  const snapshot = {
    kospi: {
      value: kospiVal,
      change: kospiChgAbs,
      changePercent: kospiChg,
      previousClose: ks11?.regularMarketPreviousClose ?? 0,
      marketState: ks11?.marketState ?? "CLOSED",
    },
    kosdaq: {
      value: kosdaqVal,
      change: kosdaqChgAbs,
      changePercent: kosdaqChg,
      previousClose: kq11?.regularMarketPreviousClose ?? 0,
    },
    bondYield10y: yield10y,
    bondYield30y: yield30y,
    vixLevel,
    riskItems,
    opportunityItems,
    balanceScore,
    kospiScenarios,
    marginCallAlert,
    physicalAiStocks,
    kospiReturns: returnsData.kospiReturns ?? [],
    kospiAth: returnsData.kospiAth ?? 0,
    kospiAthDate: returnsData.kospiAthDate ?? "",
    updatedAt: new Date().toISOString(),
    isRealtime: isKrxOpen,
  };

  setCached("korea", snapshot);
  return snapshot;
}

// ── 버핏지수: World Bank GDP + Yahoo Finance W5000 ──────────────────────────
async function fetchWorldBankGdp() {
  const CACHE_KEY = "worldbank_gdp";
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  const cached = getCached(CACHE_KEY, CACHE_TTL);
  if (cached) return cached;

  try {
    const url =
      "https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.CD?format=json&mrv=2&per_page=2";
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`WorldBank HTTP ${res.status}`);
    const json = await res.json();
    const rows = json[1] ?? [];
    const latest = rows.find((r) => r.value != null);
    if (!latest) throw new Error("No GDP data");
    const gdpT = +(latest.value / 1_000_000_000_000).toFixed(2);
    const result = { gdpT, year: latest.date };
    setCached(CACHE_KEY, result);
    return result;
  } catch (err) {
    console.warn(`  [worldbank] GDP fetch failed, using fallback: ${err?.message ?? err}`);
    return { gdpT: 28.75, year: "2024" };
  }
}

// GET /markets/survival
export async function survival() {
  const CACHE_TTL = 4 * 60 * 60 * 1000;
  const cached = getCached("survival", CACHE_TTL);
  if (cached) return cached;

  const [w5000Quote, gdpData] = await Promise.all([
    fetchQuote("^W5000"),
    fetchWorldBankGdp(),
  ]);

  const w5000Val = w5000Quote?.regularMarketPrice ?? 0;
  const CALIB_B_PER_PT = 1.08;
  const totalMktCapT = w5000Val > 0 ? +(w5000Val * CALIB_B_PER_PT / 1000).toFixed(2) : 0;
  const buffettPct =
    totalMktCapT > 0 && gdpData.gdpT > 0
      ? Math.round((totalMktCapT / gdpData.gdpT) * 100)
      : 0;

  const cfg = readSurvivalConfig();

  const snapshot = {
    buffettPct,
    buffettMarketCapT: totalMktCapT,
    buffettGdpT: gdpData.gdpT,
    buffettGdpYear: gdpData.year,
    buffettW5000: w5000Val,
    buffettUpdatedAt: new Date().toISOString(),
    buffettIsLive: w5000Val > 0,
    creditBalanceTril: cfg.creditBalanceTril,
    creditBalanceDate: cfg.creditBalanceDate,
    foreignNetSellTril: cfg.foreignNetSellTril,
    foreignNetSellDate: cfg.foreignNetSellDate,
    updatedAt: new Date().toISOString(),
  };

  setCached("survival", snapshot);
  return snapshot;
}

// ── 코스피 차트 데이터 (이격도·RSI용) ────────────────────────────────────────
async function fetchKospiChartData(days = 130) {
  const CACHE_KEY = `kospi_chart_${days}`;
  const CACHE_TTL = 4 * 60 * 60 * 1000;
  const cached = getCached(CACHE_KEY, CACHE_TTL);
  if (cached) return cached;

  try {
    const period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const period2 = new Date().toISOString().slice(0, 10);
    const chartResult = await yfChart("^KS11", { period1, period2, interval: "1d" });
    const quotes = (chartResult?.quotes ?? []).filter((q) => q.close != null && q.close > 0);
    if (quotes.length < 5) return [];
    setCached(CACHE_KEY, quotes);
    return quotes;
  } catch (err) {
    console.warn(`  [yahoo] chart ^KS11 (${days}d) failed: ${err?.message ?? err}`);
    return [];
  }
}

function calcMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((s, d) => s + d.close, 0) / period;
}

function calcRSI(data, period = 14) {
  if (data.length < period + 1) return null;
  const slice = data.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i].close - slice[i - 1].close;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return Math.round(100 - 100 / (1 + avgGain / avgLoss));
}

// GET /markets/valuation
export async function valuation() {
  const CACHE_TTL = 15 * 60 * 1000;
  const cached = getCached("valuation", CACHE_TTL);
  if (cached) return cached;

  const [ks11Quote, ewyQuote, w5000Quote, gdpData, chartData] = await Promise.all([
    fetchQuote("^KS11"),
    fetchQuote("EWY"),
    fetchQuote("^W5000"),
    fetchWorldBankGdp(),
    fetchKospiChartData(130),
  ]);

  const kospiValue = ks11Quote?.regularMarketPrice ?? 0;

  // ── PBR ────────────────────────────────────────────────────────────
  const ewyPbr = ewyQuote?.priceToBook ?? 0;
  let kospiPbr;
  let kospiBps;
  let pbrSource;

  if (ewyPbr > 0.3 && ewyPbr < 5.0) {
    kospiPbr = +ewyPbr.toFixed(2);
    kospiBps = kospiValue > 0 ? Math.round(kospiValue / ewyPbr) : 0;
    pbrSource = "EWY(MSCI Korea ETF) 실측값";
  } else {
    const yearDiff = new Date().getFullYear() - 2026;
    kospiBps = Math.round(2200 * Math.pow(1.08, yearDiff));
    kospiPbr = kospiValue > 0 ? +(kospiValue / kospiBps).toFixed(2) : 0;
    pbrSource = "추정값 (EWY 미수신)";
  }

  let pbrScore, pbrZone, pbrLabel, pbrDesc;
  if (kospiPbr < 0.75) {
    pbrScore = 10; pbrZone = "저평가"; pbrLabel = "극단 저평가";
    pbrDesc = `PBR ${kospiPbr.toFixed(2)}배 — 금융위기·코로나 급락급의 바닥권. 순자산 대비 25% 이상 할인. 역사적으로 장기 최고 진입 구간.`;
  } else if (kospiPbr < 0.90) {
    pbrScore = 25; pbrZone = "저평가"; pbrLabel = "저평가";
    pbrDesc = `PBR ${kospiPbr.toFixed(2)}배 — 순자산 대비 할인 거래 중. 코리아 디스카운트 반영 시에도 역사적 매력도 높은 수준.`;
  } else if (kospiPbr < 1.10) {
    pbrScore = 45; pbrZone = "중평가"; pbrLabel = "적정가치";
    pbrDesc = `PBR ${kospiPbr.toFixed(2)}배 — 역사적 평균(1.0배) 근방. 순자산 기준 합리적 수준. 상승·하락 여력 균형.`;
  } else if (kospiPbr < 1.35) {
    pbrScore = 60; pbrZone = "중평가"; pbrLabel = "적정~약간 고평가";
    pbrDesc = `PBR ${kospiPbr.toFixed(2)}배 — 평균 상단 구간. 실적 개선 기대가 반영된 상태. 신중 접근 필요.`;
  } else if (kospiPbr < 1.60) {
    pbrScore = 78; pbrZone = "고평가"; pbrLabel = "고평가";
    pbrDesc = `PBR ${kospiPbr.toFixed(2)}배 — 역사적 고점 구간. 낙관론이 충분히 가격에 반영됨. 신규 진입 주의.`;
  } else {
    pbrScore = 92; pbrZone = "고평가"; pbrLabel = "극단 과열";
    pbrDesc = `PBR ${kospiPbr.toFixed(2)}배 — 역사적 최고권 (2021년 버블 구간 수준). 극단적 낙관론 경계. 안전마진 없는 상태.`;
  }

  // ── 버핏지수 ────────────────────────────────────────────────────────
  const w5000Val = w5000Quote?.regularMarketPrice ?? 0;
  const totalMktCapT = w5000Val > 0 ? +(w5000Val * 1.08 / 1000).toFixed(2) : 0;
  const buffettPct = totalMktCapT > 0 && gdpData.gdpT > 0 ? Math.round((totalMktCapT / gdpData.gdpT) * 100) : 0;

  let buffettScore, buffettZone, buffettLabel, buffettDesc;
  if (buffettPct < 80) {
    buffettScore = 15; buffettZone = "저평가"; buffettLabel = "강한 저평가";
    buffettDesc = `버핏지수 ${buffettPct}% — GDP 대비 주식시장 80% 미만. 워런 버핏이 "강력 매수" 언급한 역사적 저평가 구간.`;
  } else if (buffettPct < 110) {
    buffettScore = 35; buffettZone = "저평가"; buffettLabel = "저평가~적정";
    buffettDesc = `버핏지수 ${buffettPct}% — GDP 대비 합리적 수준. 버핏이 "여전히 적정"으로 분류한 안전 구간.`;
  } else if (buffettPct < 150) {
    buffettScore = 55; buffettZone = "중평가"; buffettLabel = "적정~약간 고평가";
    buffettDesc = `버핏지수 ${buffettPct}% — 역사적 평균(120%) 상단. 성장 기대가 일부 반영. 버블은 아니나 주의 필요.`;
  } else if (buffettPct < 200) {
    buffettScore = 76; buffettZone = "고평가"; buffettLabel = "고평가";
    buffettDesc = `버핏지수 ${buffettPct}% — GDP 1.5배 초과. 2000년 닷컴 버블 수준. 장기 수익률 낮아질 가능성 높음.`;
  } else {
    buffettScore = 93; buffettZone = "고평가"; buffettLabel = "극단 과열";
    buffettDesc = `버핏지수 ${buffettPct}% — GDP 2배 초과. 사상 최고권. 버핏이 "위험한 영역"이라 경고한 레벨.`;
  }

  // ── 이격도 ──────────────────────────────────────────────────────────
  const ma20 = calcMA(chartData, 20);
  const ma60 = calcMA(chartData, 60);
  const ma120 = calcMA(chartData, 120);

  const disp20 = ma20 && kospiValue ? +((kospiValue / ma20 - 1) * 100).toFixed(1) : 0;
  const disp60 = ma60 && kospiValue ? +((kospiValue / ma60 - 1) * 100).toFixed(1) : 0;
  const disp120 = ma120 && kospiValue ? +((kospiValue / ma120 - 1) * 100).toFixed(1) : 0;
  const avgDisp = (disp20 + disp60) / 2;

  const fmtD = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

  let disparityScore, disparityZone, disparityLabel, disparityDesc;
  if (avgDisp < -12) {
    disparityScore = 10; disparityZone = "저평가"; disparityLabel = "심한 하락 이격 — 기술적 저점";
    disparityDesc = `MA20 ${fmtD(disp20)}, MA60 ${fmtD(disp60)} — 이동평균에서 크게 이탈(하락). 과매도 구간. 기술적 반등 확률 높음.`;
  } else if (avgDisp < -5) {
    disparityScore = 30; disparityZone = "저평가"; disparityLabel = "하락 이격 — 매수 타이밍 탐색";
    disparityDesc = `MA20 ${fmtD(disp20)}, MA60 ${fmtD(disp60)} — 이동평균 하방 이격. 단기 과매도 신호. 분할 매수 검토 구간.`;
  } else if (avgDisp < 5) {
    disparityScore = 50; disparityZone = "중평가"; disparityLabel = "정상 이격 — 추세 균형";
    disparityDesc = `MA20 ${fmtD(disp20)}, MA60 ${fmtD(disp60)} — 이동평균 근방 정상 거래. 추세 방향 확인 후 대응 적합.`;
  } else if (avgDisp < 12) {
    disparityScore = 70; disparityZone = "고평가"; disparityLabel = "상승 이격 — 단기 과열 주의";
    disparityDesc = `MA20 ${fmtD(disp20)}, MA60 ${fmtD(disp60)} — 이동평균 상방 이격 확대. 단기 과매수 — 신규 진입보다 보유 유지 적합.`;
  } else {
    disparityScore = 90; disparityZone = "고평가"; disparityLabel = "심한 상승 이격 — 기술적 고점";
    disparityDesc = `MA20 ${fmtD(disp20)}, MA60 ${fmtD(disp60)} — 이동평균에서 크게 이격(상승). 과매수 극단. 단기 조정 확률 높음.`;
  }

  // ── RSI ─────────────────────────────────────────────────────────────
  const rsi14 = calcRSI(chartData, 14) ?? 50;

  let rsiScore, rsiZone, rsiLabel, rsiDesc;
  if (rsi14 < 30) {
    rsiScore = 8; rsiZone = "저평가"; rsiLabel = "RSI 과매도 — 강한 반등 신호";
    rsiDesc = `RSI ${rsi14} — 30 미만 과매도 구간. 단기 하락세가 과도하게 진행됨. 반등 반전 신호.`;
  } else if (rsi14 < 40) {
    rsiScore = 28; rsiZone = "저평가"; rsiLabel = "RSI 하락 구간";
    rsiDesc = `RSI ${rsi14} — 하락 모멘텀 약화 중. 저가 매수 기회 형성 구간.`;
  } else if (rsi14 < 60) {
    rsiScore = 50; rsiZone = "중평가"; rsiLabel = "RSI 중립 균형";
    rsiDesc = `RSI ${rsi14} — 50 부근 중립. 추세 방향 탐색 중. 방향성 이탈 시 추종.`;
  } else if (rsi14 < 70) {
    rsiScore = 70; rsiZone = "고평가"; rsiLabel = "RSI 강세 — 과매수 진입 전";
    rsiDesc = `RSI ${rsi14} — 상승 모멘텀 강함. 과매수 영역 진입 직전. 추격 매수 자제.`;
  } else {
    rsiScore = 90; rsiZone = "고평가"; rsiLabel = "RSI 과매수 — 단기 조정 가능";
    rsiDesc = `RSI ${rsi14} — 70 초과 과매수. 단기 조정 가능성 높음. 보수적 대응 권장.`;
  }

  // ── 종합 점수 (가중 평균) ─────────────────────────────────────────────
  const compositeScore = Math.round(
    pbrScore * 0.30 + buffettScore * 0.30 + disparityScore * 0.25 + rsiScore * 0.15
  );

  let compositeZone, compositeLabel, compositeDesc;
  if (compositeScore < 30) {
    compositeZone = "저평가"; compositeLabel = "강한 저평가 — 역사적 매수 구간";
    compositeDesc = "복수 지표가 역사적 저평가를 가리킵니다. 공황·위기 수준의 저가 구간. 장기 투자 관점 최적 타이밍으로 평가됩니다.";
  } else if (compositeScore < 45) {
    compositeZone = "저평가"; compositeLabel = "저평가 — 우호적 진입 구간";
    compositeDesc = "여러 지표가 저평가를 시사합니다. 시장이 위험을 과도하게 반영한 상태. 분할 매수 시작이 합리적인 구간.";
  } else if (compositeScore < 58) {
    compositeZone = "중평가"; compositeLabel = "중립 — 균형 구간";
    compositeDesc = "저평가도 고평가도 아닌 역사적 평균 수준. 추세 방향과 개별 종목 선별이 더 중요한 시점.";
  } else if (compositeScore < 72) {
    compositeZone = "고평가"; compositeLabel = "약간 고평가 — 신중 구간";
    compositeDesc = "복수 지표가 과열 신호를 보냅니다. 기존 보유 유지가 신규 진입보다 유리. 리스크 관리 강화 권장.";
  } else {
    compositeZone = "고평가"; compositeLabel = "고평가 — 위험 구간";
    compositeDesc = "대다수 지표가 과열·고평가를 시사합니다. 역사적으로 향후 1-3년 기대수익률 낮은 구간. 방어적 포지션 고려 시점.";
  }

  const snapshot = {
    kospiValue,
    kospiPbr,
    kospiBps,
    pbrSource,
    pbrZone,
    pbrScore,
    pbrLabel,
    pbrDesc,
    buffettPct,
    buffettZone,
    buffettScore,
    buffettLabel,
    buffettDesc,
    buffettGdpYear: gdpData.year,
    disparityMa20: disp20,
    disparityMa60: disp60,
    disparityMa120: disp120,
    disparityZone,
    disparityScore,
    disparityLabel,
    disparityDesc,
    rsi14,
    rsiZone,
    rsiScore,
    rsiLabel,
    rsiDesc,
    compositeScore,
    compositeZone,
    compositeLabel,
    compositeDesc,
    updatedAt: new Date().toISOString(),
    isRealtime: ks11Quote?.marketState === "REGULAR",
  };

  setCached("valuation", snapshot);
  return snapshot;
}
