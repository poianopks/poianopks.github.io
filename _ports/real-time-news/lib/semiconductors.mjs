// Port of artifacts/api-server/src/routes/semiconductors.ts (GET handlers only, Express removed).
import { fetchQuote, makeCache, formatVolume, BROWSER_UA } from "./common.mjs";

const { getCached, setCached } = makeCache();

function getTTL(marketState) {
  if (marketState === "REGULAR") return 15 * 1000;
  if (marketState === "PRE" || marketState === "POST") return 30 * 1000;
  return 2 * 60 * 1000;
}

async function fetchNaverValuation(krxCode) {
  try {
    const url = `https://m.stock.naver.com/api/stock/${krxCode}/integration`;
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.warn(`  [naver] ${krxCode} HTTP ${res.status}`);
      return undefined;
    }
    const data = await res.json();
    const infos = data.totalInfos ?? [];
    const parseNum = (code) => {
      const e = infos.find((x) => x.code === code);
      if (!e) return undefined;
      const v = parseFloat(e.value.replace(/[^0-9.]/g, ""));
      return isFinite(v) && v > 0 ? v : undefined;
    };
    const pbr = parseNum("pbr");
    const bps = parseNum("bps");
    if (!pbr || !bps) return undefined;
    return {
      priceToBook: pbr,
      bps,
      trailingPE: parseNum("per"),
      forwardPE: parseNum("cnsPer"),
      eps: parseNum("eps"),
      cnsEps: parseNum("cnsEps"),
    };
  } catch (err) {
    console.warn(`  [naver] ${krxCode} failed: ${err?.message ?? err}`);
    return undefined;
  }
}

const SEMI_STOCKS = [
  { symbol: "005930.KS", nameKo: "삼성전자",          role: "DRAM/NAND/파운드리", currency: "KRW" },
  { symbol: "000660.KS", nameKo: "SK하이닉스",        role: "DRAM/HBM",            currency: "KRW" },
  { symbol: "NVDA",      nameKo: "엔비디아",          role: "AI GPU",              currency: "USD" },
  { symbol: "ASML",      nameKo: "ASML",              role: "EUV 장비",            currency: "USD" },
  { symbol: "TSM",       nameKo: "TSMC",              role: "파운드리",            currency: "USD" },
  { symbol: "MU",        nameKo: "마이크론",          role: "DRAM/NAND",           currency: "USD" },
  { symbol: "AMAT",      nameKo: "어플라이드머티리얼스", role: "반도체 장비",      currency: "USD" },
  { symbol: "LRCX",      nameKo: "램리서치",          role: "식각 장비",           currency: "USD" },
  { symbol: "KLAC",      nameKo: "KLA",               role: "검사 장비",           currency: "USD" },
  { symbol: "AMD",       nameKo: "AMD",               role: "CPU/GPU",             currency: "USD" },
  { symbol: "INTC",      nameKo: "인텔",              role: "CPU",                 currency: "USD" },
  { symbol: "QCOM",      nameKo: "퀄컴",              role: "모바일 반도체",       currency: "USD" },
  { symbol: "AVGO",      nameKo: "브로드컴",          role: "통신 반도체",         currency: "USD" },
  { symbol: "TXN",       nameKo: "텍사스인스트루먼트", role: "아날로그 반도체",    currency: "USD" },
];

function computeCyclePosition(stocks) {
  const avgChg = stocks.reduce((s, x) => s + x.changePercent, 0) / stocks.length;
  const avgDistFromHigh = stocks.reduce((s, x) => s + x.distFromHigh, 0) / stocks.length;
  const abs = Math.abs(avgDistFromHigh).toFixed(1);

  if (avgDistFromHigh > -10 && avgChg > 0.5) {
    return {
      position: "정점",
      signal: "red",
      summary: `반도체 섹터가 52주 고점 근처(평균 ${abs}% 하회)에서 강세를 보이고 있습니다. 싸이클 정점 가능성에 주의가 필요합니다.`,
    };
  } else if (avgDistFromHigh > -20 && avgChg > 0) {
    return {
      position: "상승",
      signal: "green",
      summary: `반도체 섹터가 52주 고점 대비 평균 ${abs}% 하회 수준에서 상승 중입니다. 싸이클 상승 국면으로 판단됩니다.`,
    };
  } else if (avgDistFromHigh > -35) {
    return {
      position: "회복",
      signal: "yellow",
      summary: `반도체 섹터가 52주 고점 대비 평균 ${abs}% 하회 수준입니다. 회복 국면 여부를 주가·재고·CAPEX로 함께 확인하세요.`,
    };
  } else if (avgDistFromHigh > -55) {
    return {
      position: "하락",
      signal: "red",
      summary: `반도체 섹터가 52주 고점 대비 평균 ${abs}% 하회 중입니다. 싸이클 하락 국면 — 저가 매수 타이밍인지 추가 데이터 확인 필요.`,
    };
  } else {
    return {
      position: "바닥",
      signal: "yellow",
      summary: `반도체 섹터가 52주 고점 대비 평균 ${abs}% 하회로 역사적 저점 부근입니다. 바닥 국면 — 회복 신호 확인 후 접근 권장.`,
    };
  }
}

function buildSignals(stocks) {
  const avgChg = stocks.reduce((s, x) => s + x.changePercent, 0) / stocks.length;
  const avgDist = stocks.reduce((s, x) => s + x.distFromHigh, 0) / stocks.length;
  const gainers = stocks.filter((x) => x.changePercent > 0).length;
  const fmt = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

  const priceSignal = avgChg > 1 ? "green" : avgChg > -1 ? "yellow" : "red";
  const distSignal = avgDist > -15 ? "red" : avgDist > -30 ? "yellow" : "green";
  const breadthSignal = gainers >= 9 ? "green" : gainers >= 6 ? "yellow" : "red";

  const nvda = stocks.find((x) => x.symbol === "NVDA");
  const mu = stocks.find((x) => x.symbol === "MU");
  const amat = stocks.find((x) => x.symbol === "AMAT");
  const lrcx = stocks.find((x) => x.symbol === "LRCX");
  const klac = stocks.find((x) => x.symbol === "KLAC");
  const equipAvg = [amat, lrcx, klac].filter(Boolean)
    .reduce((s, x) => s + (x?.changePercent ?? 0), 0) / 3;
  const equipSig = equipAvg > 0.5 ? "green" : equipAvg > -0.5 ? "yellow" : "red";

  return [
    {
      label: "섹터 평균 등락",
      value: fmt(avgChg),
      signal: priceSignal,
      description: priceSignal === "green"
        ? `12종목 평균 ${fmt(avgChg)} — 섹터 전반 강세, 싸이클 모멘텀 확인`
        : priceSignal === "yellow"
        ? `12종목 평균 ${fmt(avgChg)} — 보합세, 방향성 탐색 중`
        : `12종목 평균 ${fmt(avgChg)} — 섹터 전반 하락, 추가 약세 주의`,
    },
    {
      label: "52주 고점 거리",
      value: `평균 ${fmt(avgDist)}`,
      signal: distSignal,
      description: distSignal === "red"
        ? `고점 ${Math.abs(avgDist).toFixed(1)}% 하회 — 밸류에이션 부담 점검 필요`
        : distSignal === "yellow"
        ? `고점 ${Math.abs(avgDist).toFixed(1)}% 하회 — 중간 구간, 추세 확인 권고`
        : `고점 ${Math.abs(avgDist).toFixed(1)}% 하회 — 저가 구간 진입 가능성`,
    },
    {
      label: "상승 종목 수",
      value: `${gainers} / ${stocks.length}`,
      signal: breadthSignal,
      description: breadthSignal === "green"
        ? `${gainers}개 상승 — 광범위한 강세, 섹터 전반 모멘텀 강`
        : breadthSignal === "yellow"
        ? `${gainers}개 상승 — 혼조, 선별적 접근 필요`
        : `${gainers}개만 상승 — 대부분 하락, 섹터 전반 약세`,
    },
    {
      label: "장비주 CAPEX 선행지표",
      value: fmt(equipAvg),
      signal: equipSig,
      description: equipSig === "green"
        ? `AMAT·LRCX·KLAC 평균 ${fmt(equipAvg)} — 장비 투자 확대 기대`
        : equipSig === "yellow"
        ? `AMAT·LRCX·KLAC 평균 ${fmt(equipAvg)} — CAPEX 방향 불명확`
        : `AMAT·LRCX·KLAC 평균 ${fmt(equipAvg)} — 장비주 약세, CAPEX 축소 우려`,
    },
    {
      label: "NVDA — AI 수요 온도계",
      value: nvda ? fmt(nvda.changePercent) : "N/A",
      signal: nvda ? (nvda.changePercent > 1 ? "green" : nvda.changePercent > -1 ? "yellow" : "red") : "yellow",
      description: nvda
        ? nvda.changePercent > 1
          ? `엔비디아 ${fmt(nvda.changePercent)} 강세 — AI 데이터센터 수요 확대 반영`
          : nvda.changePercent < -1
          ? `엔비디아 ${fmt(nvda.changePercent)} 약세 — AI 수요 둔화 우려 반영`
          : `엔비디아 ${fmt(nvda.changePercent)} 보합 — AI 수요 방향 주시`
        : "데이터 없음",
    },
    {
      label: "MU — DRAM/NAND 직접 지표",
      value: mu ? fmt(mu.changePercent) : "N/A",
      signal: mu ? (mu.changePercent > 1 ? "green" : mu.changePercent > -1 ? "yellow" : "red") : "yellow",
      description: mu
        ? mu.changePercent > 1
          ? `마이크론 ${fmt(mu.changePercent)} 강세 — 메모리 가격 상승·재고 정상화 기대`
          : mu.changePercent < -1
          ? `마이크론 ${fmt(mu.changePercent)} 약세 — 메모리 재고 부담·가격 하락 우려`
          : `마이크론 ${fmt(mu.changePercent)} 보합 — DRAM/NAND 가격 방향 확인 필요`
        : "데이터 없음",
    },
  ];
}

// GET /markets/semiconductors
export async function semiconductors() {
  const probeState = getCached("semi_market_state", 15 * 1000);
  const ttl = getTTL(probeState ?? undefined);
  const cached = getCached("semis", ttl);
  if (cached) return cached;

  const KRX_VAL_CODES = [{ symbol: "005930.KS", code: "005930" }, { symbol: "000660.KS", code: "000660" }];
  const [quotes, naverValResults] = await Promise.all([
    Promise.all(SEMI_STOCKS.map((s) => fetchQuote(s.symbol))),
    Promise.all(KRX_VAL_CODES.map(({ code }) => fetchNaverValuation(code))),
  ]);
  const pbrMap = {};
  KRX_VAL_CODES.forEach(({ symbol }, i) => { pbrMap[symbol] = naverValResults[i]; });

  const stocks = [];
  for (let i = 0; i < SEMI_STOCKS.length; i++) {
    const q = quotes[i];
    const meta = SEMI_STOCKS[i];
    if (!q) continue;
    const high52 = q.fiftyTwoWeekHigh ?? q.regularMarketPrice ?? 1;
    const price = q.regularMarketPrice ?? 0;
    const distFromHigh = high52 > 0 ? ((price - high52) / high52) * 100 : 0;
    const trailingPE = q.trailingPE ?? undefined;
    const forwardPE = q.forwardPE ?? undefined;
    const naverPBR = pbrMap[meta.symbol];
    stocks.push({
      symbol: meta.symbol,
      name: q.shortName || q.longName || meta.symbol,
      nameKo: meta.nameKo,
      role: meta.role,
      currency: meta.currency,
      price,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: formatVolume(q.regularMarketVolume),
      week52High: high52,
      week52Low: q.fiftyTwoWeekLow ?? 0,
      distFromHigh,
      ...(trailingPE !== undefined ? { trailingPE } : {}),
      ...(forwardPE !== undefined ? { forwardPE } : {}),
      ...(naverPBR !== undefined ? {
        priceToBook: naverPBR.priceToBook,
        bps: naverPBR.bps,
        ...(naverPBR.trailingPE !== undefined ? { trailingPE: naverPBR.trailingPE } : {}),
        ...(naverPBR.forwardPE !== undefined ? { forwardPE: naverPBR.forwardPE } : {}),
        ...(naverPBR.eps !== undefined ? { eps: naverPBR.eps } : {}),
        ...(naverPBR.cnsEps !== undefined ? { cnsEps: naverPBR.cnsEps } : {}),
      } : {}),
    });
  }

  const { position, signal, summary } = computeCyclePosition(stocks);
  const signals = buildSignals(stocks);

  const firstQ = quotes[0];
  const marketState = firstQ?.marketState ?? "CLOSED";
  let marketStatus = "장마감";
  if (marketState === "REGULAR") marketStatus = "장개장중";
  else if (marketState === "PRE") marketStatus = "프리마켓";
  else if (marketState === "POST") marketStatus = "애프터마켓";

  setCached("semi_market_state", marketState);

  const snapshot = {
    stocks,
    cyclePosition: position,
    cycleSignal: signal,
    cycleSummary: summary,
    signals,
    updatedAt: new Date().toISOString(),
    marketStatus,
    isRealtime: marketState === "REGULAR" || marketState === "PRE" || marketState === "POST",
  };
  setCached("semis", snapshot);
  return snapshot;
}

// GET /markets/outlook
export async function outlook() {
  const probeState = getCached("semi_market_state", 15 * 1000);
  const ttl = getTTL(probeState ?? undefined);
  const cached = getCached("outlook", ttl);
  if (cached) return cached;

  const [dji, gspc, ixic, nvda, mu, amat, asml, vix] = await Promise.all([
    fetchQuote("^DJI"), fetchQuote("^GSPC"), fetchQuote("^IXIC"),
    fetchQuote("NVDA"), fetchQuote("MU"), fetchQuote("AMAT"),
    fetchQuote("ASML"), fetchQuote("^VIX"),
  ]);

  const djiChg = dji?.regularMarketChangePercent ?? 0;
  const gspcChg = gspc?.regularMarketChangePercent ?? 0;
  const ixicChg = ixic?.regularMarketChangePercent ?? 0;
  const nvdaChg = nvda?.regularMarketChangePercent ?? 0;
  const muChg = mu?.regularMarketChangePercent ?? 0;
  const equipAvg = ((amat?.regularMarketChangePercent ?? 0) + (asml?.regularMarketChangePercent ?? 0)) / 2;
  const vixLevel = vix?.regularMarketPrice ?? 0;
  const vixChg = vix?.regularMarketChangePercent ?? 0;
  const marketAvg = (djiChg + gspcChg + ixicChg) / 3;
  const semiAvg = (nvdaChg + muChg + equipAvg) / 3;

  const fmt = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  const fmtNum = (n) => n.toFixed(2);

  const overallScore = (marketAvg > 0 ? 1 : -1) + (semiAvg > 0 ? 1 : -1) + (nvdaChg > 0 ? 1 : -1) + (vixLevel < 20 ? 1 : -1);
  const overallSignal = overallScore >= 3 ? "green" : overallScore >= 1 ? "yellow" : "red";

  const shortTerm = marketAvg > 0.5
    ? `뉴욕증시 ${fmt(marketAvg)} 강세 지속 중. 엔비디아 ${fmt(nvdaChg)}이 AI 수요를 견인하며 기술주 모멘텀 유지. VIX ${fmtNum(vixLevel)}으로 변동성 ${vixLevel < 20 ? "안정, 단기 상승 흐름 지속 가능성 높음" : "상승 주의"}.`
    : marketAvg > -0.5
    ? `증시 보합(${fmt(marketAvg)}) 혼조세. 엔비디아 ${fmt(nvdaChg)}, 마이크론 ${fmt(muChg)} 반도체 방향성 탐색 중. VIX ${fmtNum(vixLevel)} — Fed 발언·실적 발표가 다음 방향 결정.`
    : `증시 ${fmt(marketAvg)} 하락 중. VIX ${fmtNum(vixLevel)} (${fmt(vixChg)}) 상승으로 투자자 불안 확대. 단기 추가 매수보다 관망 권고.`;

  const midTerm = nvdaChg > 1 && muChg > 0
    ? `AI 인프라 투자 확대(엔비디아 ${fmt(nvdaChg)})와 메모리 가격 회복(마이크론 ${fmt(muChg)}) 신호 동시 출현. 반도체 싸이클 상승 국면 지속 가능성에 무게. 장비주(AMAT·ASML 평균 ${fmt(equipAvg)}) CAPEX 방향 월간 확인 권고.`
    : muChg < -1
    ? `마이크론 ${fmt(muChg)} 약세는 메모리 재고 부담 시사. DRAM/NAND 계약가·고객사 재고 모니터링 필요. VIX ${fmtNum(vixLevel)} 수준에서 싸이클 하락 전환 리스크 배제 어렵.`
    : `엔비디아 ${fmt(nvdaChg)}, 마이크론 ${fmt(muChg)}, 장비주 ${fmt(equipAvg)} — AI 수요와 메모리 회복 두 축 혼재. VIX ${fmtNum(vixLevel)} 안정 구간에서 싸이클 위치 월간 체크 지속.`;

  const marketState = dji?.marketState ?? "CLOSED";
  let marketStatus = "장마감";
  if (marketState === "REGULAR") marketStatus = "장개장중";
  else if (marketState === "PRE") marketStatus = "프리마켓";
  else if (marketState === "POST") marketStatus = "애프터마켓";

  const keyRisks = [
    {
      title: "Fed 금리 불확실성",
      detail: `VIX ${fmtNum(vixLevel)} (${fmt(vixChg)}) — ${vixLevel > 20 ? "변동성 확대 중, 금리 인하 기대 후퇴 시 기술주 밸류에이션 압박 가속" : "현재 안정적이나, 인플레 재발 시 금리 인하 지연으로 성장주 타격 가능"}`,
      signal: vixLevel > 25 ? "negative" : vixLevel > 18 ? "neutral" : "neutral",
    },
    {
      title: "메모리 재고 리스크",
      detail: `마이크론 ${fmt(muChg)} — ${muChg < -1 ? "현재 약세, 고객사 재고 재축적 시 DRAM/NAND 가격 하락 압력" : muChg > 1 ? "현재 강세이나 급격한 수요 둔화 시 재고 과잉 전환 주의" : "보합, DRAM 현물가·고객사 재고 수준 모니터링 필요"}`,
      signal: muChg < -1 ? "negative" : "neutral",
    },
    {
      title: "미·중 반도체 규제",
      detail: `ASML·AMAT 장비주 평균 ${fmt(equipAvg)} — 수출 통제 강화 시 중국 매출 타격 및 CAPEX 축소 파급`,
      signal: equipAvg < -1 ? "negative" : "neutral",
    },
    {
      title: "AI 수요 둔화 리스크",
      detail: `엔비디아 ${fmt(nvdaChg)} — ${nvdaChg < 0 ? "현재 약세, 빅테크 CAPEX 집행 지연 또는 AI ROI 의문 시 GPU 수요 급감 가능" : "현재 강세이나 AI 거품 논란 지속, 실적 미스 시 급락 리스크"}`,
      signal: nvdaChg < -1 ? "negative" : "neutral",
    },
  ];

  const keyOpportunities = [
    {
      title: "AI 인프라 투자 지속",
      detail: `엔비디아 ${fmt(nvdaChg)} — 데이터센터 GPU·AI 가속기 수요 장기 구조적 성장, Blackwell 세대 전환 모멘텀`,
      signal: nvdaChg > 0 ? "positive" : "neutral",
    },
    {
      title: "HBM·고대역폭 메모리 수요",
      detail: `마이크론 ${fmt(muChg)} — AI 서버 HBM3E 공급 부족 구간 지속, 가격 프리미엄 유지 가능성`,
      signal: muChg > 0 ? "positive" : "neutral",
    },
    {
      title: "장비주 CAPEX 사이클 회복",
      detail: `AMAT·ASML 평균 ${fmt(equipAvg)} — 파운드리 선단 공정 투자 재개 및 2nm/1.4nm 경쟁으로 장비 수주 증가 전망`,
      signal: equipAvg > 0 ? "positive" : "neutral",
    },
    {
      title: "저변동성 리스크온 환경",
      detail: `VIX ${fmtNum(vixLevel)} (${fmt(vixChg)}) — ${vixLevel < 15 ? "역사적 저변동성, 투자자 낙관적 포지셔닝, 반도체 등 성장주에 유리한 환경" : vixLevel < 20 ? "안정적 변동성 구간, 위험자산 비중 확대 기회" : "변동성 상승 중, 저점 매수 기회 탐색 필요"}`,
      signal: vixLevel < 18 ? "positive" : "neutral",
    },
  ];

  const result = {
    shortTerm,
    midTerm,
    keyRisks,
    keyOpportunities,
    overallSignal,
    updatedAt: new Date().toISOString(),
    marketStatus,
    vixLevel,
    isRealtime: marketState === "REGULAR" || marketState === "PRE" || marketState === "POST",
  };
  setCached("outlook", result);
  return result;
}
