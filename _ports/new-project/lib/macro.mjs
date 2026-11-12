// Faithful port of artifacts/api-server/src/routes/macro.ts (Replit "New Project").
// Each handler returns the JSON body the Express route would send.
import { fetchYahooChart, fetchFredCsv } from "./http.mjs";

// ─── FOMC live fetch ──────────────────────────────────────────────────────────
// (The original keeps a 6h in-memory cache here; within one batch run the http layer
// already de-duplicates the FRED calls, so it is omitted to keep per-key source tracking exact.)

async function fetchFomcLive() {
  const [projData, effrData] = await Promise.all([
    fetchFredCsv("FEDTARMD"),
    fetchFredCsv("EFFR"),
  ]);

  const currentYear = new Date().getFullYear();
  const thisYearRow = projData.find((d) => d.date.startsWith(String(currentYear)));
  const nextYearRow = projData.find((d) => d.date.startsWith(String(currentYear + 1)));
  const bestRow = thisYearRow ?? nextYearRow ?? projData[projData.length - 1];

  const medianProjection = bestRow?.value ?? 3.4;
  const projectionYear = bestRow ? parseInt(bestRow.date.slice(0, 4)) : currentYear;
  const projectionDate = bestRow?.date ?? "N/A";

  const currentActual = effrData.length > 0 ? effrData[effrData.length - 1].value : 3.64;

  const live = {
    medianProjection,
    currentActual,
    projectionYear,
    projectionDate,
    source: "FRED (FEDTARMD · EFFR)",
  };

  return live;
}

// ─── Scoring functions ────────────────────────────────────────────────────────
function scoreTreasury(rate) {
  if (rate <= 3.5) return { season: "spring", score: 90, signal: "bullish", description: `10년물 국채금리 ${rate.toFixed(2)}% — 저금리 유동성 봄 환경. 주식시장 매우 긍정적.` };
  if (rate <= 4.0) return { season: "spring", score: 70, signal: "bullish", description: `10년물 국채금리 ${rate.toFixed(2)}% — 적정 금리. 봄~여름 환경. 유동성 양호.` };
  if (rate <= 4.5) return { season: "autumn", score: 45, signal: "neutral", description: `10년물 국채금리 ${rate.toFixed(2)}% — 금리 상승 압력. 가을 전환 구간. 주의 필요.` };
  if (rate <= 5.0) return { season: "winter", score: 20, signal: "bearish", description: `10년물 국채금리 ${rate.toFixed(2)}% — 고금리 유동성 축소. 겨울 환경. 위험 구간.` };
  return { season: "winter", score: 5, signal: "bearish", description: `10년물 국채금리 ${rate.toFixed(2)}% — 극고금리. 깊은 겨울. 매우 위험.` };
}

function scoreDxy(dxy) {
  if (dxy <= 95) return { season: "spring", score: 95, signal: "bullish", description: `달러 인덱스 ${dxy.toFixed(2)} — 약달러로 글로벌 유동성 풍부. 신흥국·원자재 봄 환경.` };
  if (dxy <= 100) return { season: "spring", score: 75, signal: "bullish", description: `달러 인덱스 ${dxy.toFixed(2)} — 적정 달러. 봄 환경 우세.` };
  if (dxy <= 104) return { season: "autumn", score: 40, signal: "neutral", description: `달러 인덱스 ${dxy.toFixed(2)} — 달러 강세 진입. 가을 경계 구간.` };
  if (dxy <= 108) return { season: "winter", score: 20, signal: "bearish", description: `달러 인덱스 ${dxy.toFixed(2)} — 강달러. 글로벌 유동성 축소. 겨울 환경.` };
  return { season: "winter", score: 5, signal: "bearish", description: `달러 인덱스 ${dxy.toFixed(2)} — 극강 달러. 신흥국 위기 가능. 깊은 겨울.` };
}

function scoreFomc(fomc) {
  const r = fomc.medianProjection;
  const gap = fomc.currentActual - r;
  const desc = `FOMC 점도표 ${fomc.projectionYear}년 말 중앙값 ${r.toFixed(2)}% (실제 EFFR ${fomc.currentActual.toFixed(2)}%, 추가인하 여지 ${gap > 0 ? "+" : ""}${gap.toFixed(2)}%p) — 출처: ${fomc.source}`;
  if (r <= 3.0) return { season: "spring", score: 90, signal: "bullish", description: desc };
  if (r <= 3.5) return { season: "spring", score: 65, signal: "bullish", description: desc };
  if (r <= 4.0) return { season: "autumn", score: 40, signal: "neutral", description: desc };
  return { season: "winter", score: 15, signal: "bearish", description: desc };
}

function scoreM2Growth(yoy) {
  if (yoy >= 8) return { season: "spring", score: 95, signal: "bullish", description: `M2 전년비 +${yoy.toFixed(1)}% — 강한 유동성 공급. 주식시장 봄.` };
  if (yoy >= 5) return { season: "spring", score: 75, signal: "bullish", description: `M2 전년비 +${yoy.toFixed(1)}% — 적정 유동성 성장. 봄 환경.` };
  if (yoy >= 2) return { season: "summer", score: 55, signal: "neutral", description: `M2 전년비 +${yoy.toFixed(1)}% — 유동성 중립. 여름~가을 경계.` };
  if (yoy >= 0) return { season: "autumn", score: 35, signal: "neutral", description: `M2 전년비 +${yoy.toFixed(1)}% — 유동성 정체. 가을 진입.` };
  return { season: "winter", score: 10, signal: "bearish", description: `M2 전년비 ${yoy.toFixed(1)}% — 유동성 감소. 겨울 환경. 위험.` };
}

function computeOverall(scores) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  let season, signal;
  if (avg >= 68) { season = "spring"; signal = "bullish"; }
  else if (avg >= 50) { season = "summer"; signal = "bullish"; }
  else if (avg >= 32) { season = "autumn"; signal = "neutral"; }
  else { season = "winter"; signal = "bearish"; }
  return { season, score: Math.round(avg), signal };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export async function indicators() {
  const [tnxData, dxyData, m2Data, fomc] = await Promise.all([
    fetchYahooChart("^TNX", "1d", "5d"),
    fetchYahooChart("^DXY", "1d", "5d"),
    fetchFredCsv("M2SL"),
    fetchFomcLive(),
  ]);

  const treasuryRate = tnxData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 4.31;
  const dxy = dxyData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 98.52;

  let m2Growth = 3.2;
  if (m2Data.length >= 13) {
    const latest = m2Data[m2Data.length - 1].value;
    const yearAgo = m2Data[m2Data.length - 13].value;
    m2Growth = ((latest - yearAgo) / yearAgo) * 100;
  }

  const tScore = scoreTreasury(treasuryRate);
  const dScore = scoreDxy(dxy);
  const fScore = scoreFomc(fomc);
  const mScore = scoreM2Growth(m2Growth);
  const overall = computeOverall([tScore.score, dScore.score, fScore.score, mScore.score]);

  const overallDesc = {
    spring: "4가지 지표 종합: 봄 환경. 유동성 충분·금리 부담 낮음. 광범위 상승장 가능성.",
    summer: "4가지 지표 종합: 여름 환경. 실적 중심 선별 상승장. 종목 선택이 중요합니다.",
    autumn: "4가지 지표 종합: 가을 경고. 유동성 축소 신호. 리스크 관리 시작 권장.",
    winter: "4가지 지표 종합: 겨울 위험! 고금리·강달러·유동성 축소. 현금 비중 고려.",
  };

  const breadthWarning = overall.score < 50;
  const now = new Date().toISOString();

  return {
    overallSeason: overall.season,
    overallScore: overall.score,
    overallSignal: overall.signal,
    overallDescription: overallDesc[overall.season] + ` 종합 점수: ${overall.score}/100`,
    treasury10Y: {
      value: treasuryRate,
      label: `${treasuryRate.toFixed(2)}%`,
      season: tScore.season, seasonScore: tScore.score, signal: tScore.signal,
      description: tScore.description,
      thresholds: { spring: "3.5~4.0% 이하 = 봄", winter: "4.5% 이상 = 겨울" },
      updatedAt: now,
    },
    fomc: {
      value: fomc.medianProjection,
      label: `${fomc.medianProjection.toFixed(2)}% (${fomc.projectionYear}년 말 전망)`,
      season: fScore.season, seasonScore: fScore.score, signal: fScore.signal,
      description: fScore.description,
      thresholds: { spring: "인하 전망 우세 = 봄", winter: "동결·인상 전망 = 겨울" },
      updatedAt: now,
      currentActual: fomc.currentActual,
      source: fomc.source,
      projectionDate: fomc.projectionDate,
    },
    dxy: {
      value: dxy,
      label: dxy.toFixed(2),
      season: dScore.season, seasonScore: dScore.score, signal: dScore.signal,
      description: dScore.description,
      thresholds: { spring: "100 이하 = 봄", winter: "105 이상 = 겨울" },
      updatedAt: now,
    },
    liquidity: {
      value: m2Growth,
      label: `전년비 ${m2Growth >= 0 ? "+" : ""}${m2Growth.toFixed(1)}%`,
      season: mScore.season, seasonScore: mScore.score, signal: mScore.signal,
      description: mScore.description,
      thresholds: { spring: "+5% 이상 = 봄", winter: "0% 이하 = 겨울" },
      updatedAt: now,
    },
    breadthWarning,
    breadthNote: breadthWarning
      ? "시장 폭 좁아짐 감지. AI·반도체 소수 종목이 지수를 견인하는 구조 — 건강하지 않은 상승장의 특징. 겨울 진입 전 나타나는 역사적 패턴입니다."
      : "시장 폭 비교적 양호합니다.",
    fetchedAt: now,
  };
}

function monthlySeries(data, dropNaN) {
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  return timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 7), value: closes[i] ?? null }))
    .filter((p) => p.value !== null && (!dropNaN || !isNaN(p.value)));
}

export async function treasuryHistory() {
  const data = await fetchYahooChart("^TNX", "1mo", "2y");
  return { label: "미국 10년물 국채금리", unit: "%", data: monthlySeries(data, false) };
}

export async function dxyHistory() {
  const data = await fetchYahooChart("^DXY", "1mo", "2y");
  return { label: "달러 인덱스 (DXY)", unit: "", data: monthlySeries(data, false) };
}

export async function m2History() {
  const allData = await fetchFredCsv("M2SL");
  return { label: "M2 통화량", unit: "십억달러", data: allData.slice(-24) };
}

export async function fomcHistory() {
  const [projData, effrData] = await Promise.all([
    fetchFredCsv("FEDTARMD"),
    fetchFredCsv("FEDFUNDS"),
  ]);
  const projections = projData.slice(-6).map((d) => ({ date: d.date.slice(0, 7), value: d.value, type: "projection" }));
  const actuals = effrData.slice(-24).map((d) => ({ date: d.date.slice(0, 7), value: d.value, type: "actual" }));
  const liveInfo = await fetchFomcLive();
  return {
    label: "FOMC 점도표 vs 실제 기준금리",
    unit: "%",
    projections,
    actuals,
    currentProjection: liveInfo.medianProjection,
    currentActual: liveInfo.currentActual,
    projectionYear: liveInfo.projectionYear,
    projectionDate: liveInfo.projectionDate,
    source: liveInfo.source,
    data: actuals,
  };
}

// ─── VKOSPI fear-level model ─────────────────────────────────────────────────
function estimateVkospi(changePct, kospiLevel) {
  const absPct = Math.abs(changePct);
  let base = 15;
  if (absPct >= 5) base = 55;
  else if (absPct >= 3) base = 38;
  else if (absPct >= 2) base = 28;
  else if (absPct >= 1) base = 20;
  else if (absPct >= 0.5) base = 17;
  if (kospiLevel > 6000) base += 5;
  if (kospiLevel > 6500) base += 5;
  const estimate = Math.round(base * 10) / 10;
  let level;
  if (estimate < 18) level = "low";
  else if (estimate < 25) level = "moderate";
  else if (estimate < 35) level = "elevated";
  else if (estimate < 50) level = "high";
  else level = "extreme";
  const score = Math.min(100, Math.round((estimate / 80) * 100));
  return { estimate, level, score };
}

function interpretVkospi(level, changePct, estimate) {
  const dir = changePct >= 0 ? "상승" : "하락";
  const absPct = Math.abs(changePct).toFixed(2);
  if (level === "low") {
    return { interpretation: `VKOSPI 추정 ${estimate}pt — 낮은 변동성. 시장 참여자들이 안정적. 건강한 강세장의 특징. 공포 없음.`, mood: "안정 (공포 없음)", season: "spring", signal: "bullish" };
  }
  if (level === "moderate") {
    return { interpretation: `VKOSPI 추정 ${estimate}pt — 보통 변동성. 코스피 ${dir} ${absPct}%로 소폭 흔들림. 정상 범위 내 불안.`, mood: "보통 (약간의 불안)", season: "summer", signal: "neutral" };
  }
  if (level === "elevated") {
    return { interpretation: `VKOSPI 추정 ${estimate}pt — 상승한 변동성. 코스피가 ${dir} ${absPct}%로 크게 움직임. 투자자 긴장 고조. 주의 구간.`, mood: "주의 (불안 상승)", season: "autumn", signal: "neutral" };
  }
  if (level === "high") {
    return { interpretation: `VKOSPI 추정 ${estimate}pt — 높은 공포지수. 코스피 급${dir} ${absPct}% 발생. 시장이 방향성에 확신 없음. 헤지·하락베팅 급증.`, mood: "경계 (공포 상승)", season: "autumn", signal: "bearish" };
  }
  return {
    interpretation: `VKOSPI 추정 ${estimate}pt — 극단적 공포. 코스피 ${dir} ${absPct}% 폭${dir}. 패닉 셀링 또는 숏스퀴즈 가능. 역사적으로 단기 바닥 신호이기도 함. 매우 위험.`,
    mood: "극단 공포",
    season: "winter",
    signal: "bearish",
  };
}

export async function kospi() {
  const data = await fetchYahooChart("^KS11", "1d", "5d");
  const meta = data?.chart?.result?.[0]?.meta;
  const kospiPrice = meta?.regularMarketPrice ?? 6936.99;

  const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const validCloses = closes.filter((v) => v !== null && !isNaN(v));
  const prevClose = validCloses.length >= 2 ? validCloses[validCloses.length - 2] : kospiPrice * 0.95;

  const kospiChange = kospiPrice - prevClose;
  const kospiChangePct = (kospiChange / prevClose) * 100;

  const { estimate, level, score } = estimateVkospi(kospiChangePct, kospiPrice);
  const { interpretation, mood, season, signal } = interpretVkospi(level, kospiChangePct, estimate);

  return {
    kospi: kospiPrice,
    kospiChange: Math.round(kospiChange * 100) / 100,
    kospiChangePct: Math.round(kospiChangePct * 100) / 100,
    kospiPrevClose: Math.round(prevClose * 100) / 100,
    vkospiEstimate: estimate,
    vkospiLevel: level,
    vkospiScore: score,
    vkospiInterpretation: interpretation,
    marketMood: mood,
    season,
    signal,
    note: "VKOSPI는 KRX 독점 데이터로 무료 API 미제공. 당일 코스피 변동률 기반 추정값입니다. 장중 KRX 공식 수치와 다를 수 있습니다.",
    updatedAt: new Date().toISOString(),
  };
}

export async function kospiHistory() {
  const data = await fetchYahooChart("^KS11", "1mo", "2y");
  return { label: "코스피 지수", unit: "pt", data: monthlySeries(data, true) };
}

export async function breadth() {
  const [spyData, rspData] = await Promise.all([
    fetchYahooChart("SPY", "1d", "5d"),
    fetchYahooChart("RSP", "1d", "5d"),
  ]);
  const spyPrice = spyData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 560;
  const rspPrice = rspData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 165;
  const top10Concentration = 35.2;
  const spyVsRsp = spyPrice / rspPrice;
  const advanceDeclineRatio = 1.1;
  const breadthScore = Math.max(0, Math.min(100, 100 - (top10Concentration - 20) * 2));
  const isNarrow = top10Concentration > 30 || breadthScore < 50;
  return {
    spyVsRsp, advanceDeclineRatio, top10Concentration, breadthScore,
    assessment: isNarrow
      ? `S&P500 상위 10종목 집중도 ${top10Concentration}% — 소수 종목이 지수를 과도하게 견인 중. 시장 폭 이상 경보.`
      : `시장 폭이 비교적 건강합니다. 상위 10종목 집중도 ${top10Concentration}%.`,
    isNarrow,
  };
}

export const routes = {
  "/api/macro/indicators": indicators,
  "/api/macro/treasury-history": treasuryHistory,
  "/api/macro/dxy-history": dxyHistory,
  "/api/macro/m2-history": m2History,
  "/api/macro/fomc-history": fomcHistory,
  "/api/macro/kospi": kospi,
  "/api/macro/kospi-history": kospiHistory,
  "/api/macro/breadth": breadth,
};
