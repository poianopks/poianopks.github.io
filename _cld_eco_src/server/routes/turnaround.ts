/**
 * turnaround.ts
 *
 * 주의: KRX / Naver Finance 투자자 데이터(개인/외국인/기관)는
 * 서버사이드에서 세션 인증 없이 접근이 완전히 차단되어 있습니다.
 * (KRX OTP, Naver sise_investor 모두 LOGOUT / 오류 반환)
 *
 * 대신 Yahoo Finance v8 Chart API (정상 작동)로:
 *   1. 가격·거래량 히스토리 → 이동평균·모멘텀·기술 지표 계산
 *   2. 지표 기반 실시간 긍정/부정 이유 동적 생성
 *   3. 턴어라운드 스코어링 (저가권 + 회복 모멘텀)
 */

import { Router } from "express";

const router = Router();

// ── 캐시 ─────────────────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();
const LIST_TTL  = 20 * 60 * 1000; // 20분
const CHART_TTL = 10 * 60 * 1000; // 10분

// ── 관심 종목 (사용자 지정 6종목) ────────────────────────────────────────────────
export const WATCHLIST_STOCKS = [
  {
    code: "051900", name: "LG생활건강", sector: "뷰티·생활용품", theme: "中소비회복",
    staticPros: ["생활용품 안정적 현금흐름 방어", "배당 매력 수익률 3%+", "럭셔리 뷰티 구조조정 완료"],
    staticCons: ["성장성 정체 우려", "중국 럭셔리 화장품 의존도 여전", "혁신 신제품 부재"],
  },
  {
    code: "051910", name: "LG화학", sector: "화학·배터리소재", theme: "배터리소재",
    staticPros: ["양극재·전구체 수직계열화 경쟁력", "LG에너지솔루션 밸류체인 핵심", "석유화학 고부가 구조 전환"],
    staticCons: ["리튬 가격 하락으로 수익성 압박", "전기차 수요 단기 둔화", "대규모 설비투자 부담 지속"],
  },
  {
    code: "090430", name: "아모레퍼시픽", sector: "뷰티·화장품", theme: "中소비회복",
    staticPros: ["K-뷰티 글로벌 수요 회복 기대", "중국 소비 회복 최대 수혜주", "인디브랜드 대비 고급 포지셔닝"],
    staticCons: ["중국 시장 회복 속도 불확실", "인디브랜드와 경쟁 지속", "단기 실적 가시성 낮음"],
  },
  {
    code: "005490", name: "포스코홀딩스", sector: "철강·2차전지소재", theme: "배터리소재·철강",
    staticPros: ["리튬·니켈 수직계열화로 배터리소재 경쟁력", "철강 사이클 바닥 통과 기대", "PBR 역사적 저점"],
    staticCons: ["중국발 철강 공급과잉 지속", "리튬 가격 하락으로 소재 수익성 압박", "배터리 수요 회복 지연"],
  },
  {
    code: "035420", name: "NAVER", sector: "IT플랫폼·AI", theme: "AI·광고플랫폼",
    staticPros: ["AI 검색·광고 수익 성장 가속", "라인야후 지분 가치 부각", "커머스·클라우드 확장"],
    staticCons: ["카카오·구글 경쟁 심화", "국내 플랫폼 규제 리스크", "글로벌 AI 빅테크 경쟁 심화"],
  },
  {
    code: "034220", name: "LG디스플레이", sector: "OLED 디스플레이", theme: "OLED·애플",
    staticPros: ["애플 OLED 아이폰 핵심 공급사", "OLED TV 패널 독점적 지위", "흑자 전환 임박"],
    staticCons: ["삼성에 아이폰 점유율 잠식 우려", "대규모 차입 부담", "중국 LCD 덤핑 경쟁"],
  },
];

export const CANDIDATES = [
  {
    code: "090430", name: "아모레퍼시픽", sector: "뷰티·화장품", theme: "中소비회복",
    staticPros: ["K-뷰티 글로벌 수요 회복 기대", "중국 소비 회복 최대 수혜주 중 하나", "인디브랜드 경쟁 속 고급 포지셔닝 유지"],
    staticCons: ["중국 시장 회복 속도 불확실", "인디브랜드와 경쟁 지속", "단기 실적 가시성 낮음"],
  },
  {
    code: "051900", name: "LG생활건강", sector: "뷰티·생활용품", theme: "中소비회복",
    staticPros: ["생활용품 안정적 현금흐름 방어", "배당 매력 수익률 3%+", "럭셔리 뷰티 구조조정 완료"],
    staticCons: ["성장성 정체 우려", "중국 럭셔리 화장품 의존도 여전", "혁신 신제품 부재"],
  },
  {
    code: "011170", name: "롯데케미칼", sector: "화학", theme: "화학사이클",
    staticPros: ["석유화학 사이클 바닥 통과 기대", "수소·배터리 소재 사업 전환 진행 중", "PBR 역사적 저점"],
    staticCons: ["업황 회복 시기 불투명", "부채비율 상승", "구조적 공급과잉 장기화"],
  },
  {
    code: "009830", name: "한화솔루션", sector: "태양광·화학", theme: "신재생에너지",
    staticPros: ["미국 IRA 태양광 핵심 수혜주", "셀·모듈 수직계열화 경쟁력", "방산 계열사 가치 미반영"],
    staticCons: ["중국 저가 태양광 경쟁 심화", "미국 관세 정책 변화 리스크", "화학 부문 이익 부진"],
  },
  {
    code: "034020", name: "두산에너빌리티", sector: "원전·에너지", theme: "원전·SMR",
    staticPros: ["글로벌 원전 르네상스 최대 수혜", "SMR 핵심 부품사 포지셔닝", "수주잔고 급증"],
    staticCons: ["원전 프로젝트 지연 리스크", "밸류에이션 고평가 진입 우려", "재무구조 개선 필요"],
  },
  {
    code: "015760", name: "한국전력", sector: "에너지·유틸리티", theme: "AI전력수요",
    staticPros: ["전기요금 인상으로 적자 구조 탈출 중", "AI 데이터센터 전력 수요 증가", "PBR 0.2배 초저평가"],
    staticCons: ["정치적 요금 통제 리스크", "부채 규모 역대 최대", "민영화 불확실성"],
  },
  {
    code: "247540", name: "에코프로비엠", sector: "2차전지 양극재", theme: "전기차·배터리",
    staticPros: ["전기차 보급 확대 장기 수혜", "삼성SDI 주요 공급사", "유럽 공장 증설 완료"],
    staticCons: ["전기차 수요 단기 둔화", "POSCO계열 경쟁사 추격", "높은 밸류에이션 부담"],
  },
  {
    code: "003670", name: "포스코퓨처엠", sector: "2차전지 소재", theme: "전기차·배터리",
    staticPros: ["POSCO 리튬·니켈 수직계열화", "양극재·전구체 동시 생산 경쟁력", "GM·포드 공급 확대"],
    staticCons: ["리튬 가격 하락으로 수익성 압박", "설비투자 부담 지속", "수요 회복 지연"],
  },
  {
    code: "034220", name: "LG디스플레이", sector: "OLED 디스플레이", theme: "OLED·애플",
    staticPros: ["애플 OLED 아이폰 핵심 공급사", "OLED TV 패널 독점적 지위", "흑자 전환 임박"],
    staticCons: ["삼성에 아이폰 점유율 잠식 우려", "대규모 차입 부담", "중국 LCD 덤핑 경쟁"],
  },
  {
    code: "011200", name: "HMM", sector: "해운", theme: "해운·물류",
    staticPros: ["컨테이너 운임 회복 국면", "민영화 기대감", "현금성 자산 풍부"],
    staticCons: ["해운 사이클 변동성 극심", "민영화 일정 불확실", "공급 과잉 우려"],
  },
  {
    code: "064350", name: "현대로템", sector: "방산·철도", theme: "K-방산",
    staticPros: ["K2전차 폴란드 수출 대규모 수주", "유럽 재무장 수요 증가", "도시철도 수주 확대"],
    staticCons: ["매출 인식 지연 (수주→납품 2~3년)", "원재료 비용 상승", "한화에어로 경쟁"],
  },
  {
    code: "012450", name: "한화에어로스페이스", sector: "방산·항공", theme: "K-방산",
    staticPros: ["K9자주포·천무 글로벌 수출 1위", "폴란드·루마니아 대형 수주 완료", "항공엔진 MRO 성장"],
    staticCons: ["밸류에이션 고평가 구간 진입", "수출 승인 지연 리스크", "북미 시장 진입 장벽"],
  },
  {
    code: "010140", name: "삼성중공업", sector: "조선", theme: "조선·LNG",
    staticPros: ["LNG운반선 초호황 수주", "조선 슈퍼사이클 초입", "드릴십 시장 회복"],
    staticCons: ["후판·인력 비용 상승", "수주 후 건조 2~3년 매출 지연", "환율 변동 리스크"],
  },
  {
    code: "004020", name: "현대제철", sector: "철강", theme: "철강·소재",
    staticPros: ["자동차강판 고부가 비중 확대", "현대차그룹 물량 안정적", "전기로 전환 탄소 대응"],
    staticCons: ["중국발 공급과잉", "건설경기 부진", "이익 감소 추세"],
  },
  {
    code: "010130", name: "고려아연", sector: "비철금속", theme: "비철금속",
    staticPros: ["아연·납 가격 상승 수혜", "이차전지 소재 진출", "자사주 매입 중"],
    staticCons: ["경영권 분쟁 불확실성", "비철금속 가격 변동성", "신사업 성과 미확인"],
  },
  {
    code: "023530", name: "롯데쇼핑", sector: "유통", theme: "자산가치",
    staticPros: ["부동산 자산 재평가 잠재 가치", "PBR 극저평가", "구조조정으로 효율화"],
    staticCons: ["온라인 유통 경쟁 심화", "백화점·마트 성장 한계", "롯데그룹 지배구조 리스크"],
  },
  {
    code: "035720", name: "카카오", sector: "IT플랫폼", theme: "AI·플랫폼",
    staticPros: ["AI 카카오 생태계 확장 기대", "카카오페이·뱅크 성장", "광고 수익 회복"],
    staticCons: ["규제 리스크 지속", "계열사 구조 복잡성", "SM엔터 인수 후유증"],
  },
  {
    code: "003490", name: "대한항공", sector: "항공", theme: "항공·여행",
    staticPros: ["아시아나항공 합병 시너지 가시화", "화물 운임 회복", "동남아 노선 증편"],
    staticCons: ["유가 상승 시 비용 부담", "합병 비용 재무 부담", "중국 노선 회복 지연"],
  },
  {
    code: "241560", name: "두산밥캣", sector: "건설기계", theme: "인프라·기계",
    staticPros: ["미국 소형건설기계 시장 점유율 1위", "인프라 투자법 장기 수혜", "배당 매력"],
    staticCons: ["미국 금리 부담으로 건설경기 둔화", "두산그룹 지배구조 리스크", "농기계 수요 부진"],
  },
  {
    code: "097950", name: "CJ제일제당", sector: "식품·바이오", theme: "식품·글로벌",
    staticPros: ["글로벌 K-푸드 수요 확대", "바이오·아미노산 사업 고성장", "PBR 저평가 구간"],
    staticCons: ["원재료(곡물) 가격 부담", "CJ ENM 등 계열사 리스크", "글로벌 경기 민감도"],
  },
];

// ── Yahoo Finance 차트 데이터 ─────────────────────────────────────────────────
interface PriceHistory {
  currentPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timestamps: number[];
  closes: (number | null)[];
  volumes: (number | null)[];
}

async function fetchYahooChart(code: string, range: string): Promise<PriceHistory> {
  const symbol = encodeURIComponent(`${code}.KS`);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json() as any;
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("No chart data");
  const meta = result.meta ?? {};
  const q = result.indicators?.quote?.[0] ?? {};
  return {
    currentPrice: meta.regularMarketPrice ?? 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
    timestamps: result.timestamp ?? [],
    closes: (q.close ?? []).map((v: number | null) => v ? Math.round(v) : null),
    volumes: (q.volume ?? []).map((v: number | null) => v ?? null),
  };
}

// ── 기술 지표 계산 ─────────────────────────────────────────────────────────────
interface Indicators {
  current: number;
  ret1m: number | null;
  ret3m: number | null;
  ret6m: number | null;
  ma20: number | null;
  ma60: number | null;
  positionIn52w: number;        // 0=52주저점, 1=52주고점
  positionIn6m: number;         // 0=6개월저점, 1=6개월고점
  high6m: number;
  low6m: number;
  avgVol20: number | null;
  avgVol6m: number | null;
  volExpansion: number | null;  // recent20avgVol / total6mAvgVol
}

function computeIndicators(
  closes: (number | null)[],
  volumes: (number | null)[],
  fiftyTwoWeekHigh: number,
  fiftyTwoWeekLow: number,
): Indicators | null {
  const valid = closes.map((c, i) => c != null ? { c, v: volumes[i] ?? 0 } : null).filter(Boolean) as { c: number; v: number }[];
  const n = valid.length;
  if (n < 5) return null;

  const current = valid[n - 1].c;

  // returns
  const get = (daysAgo: number) => n > daysAgo ? valid[n - 1 - daysAgo]?.c : null;
  const p1m = get(22), p3m = get(66), p6m = valid[0]?.c;
  const ret = (p: number | undefined) => p ? ((current - p) / p) * 100 : null;
  const ret1m = ret(p1m ?? undefined);
  const ret3m = ret(p3m ?? undefined);
  const ret6m = ret(p6m);

  // MAs
  const ma = (days: number) =>
    n >= days ? Math.round(valid.slice(n - days).reduce((s, x) => s + x.c, 0) / days) : null;
  const ma20 = ma(20);
  const ma60 = ma(60);

  // range
  const allC = valid.map(x => x.c);
  const high6m = Math.max(...allC);
  const low6m  = Math.min(...allC);
  const range52 = fiftyTwoWeekHigh - fiftyTwoWeekLow;
  const range6m = high6m - low6m;
  const positionIn52w = range52 > 0 ? Math.max(0, Math.min(1, (current - fiftyTwoWeekLow) / range52)) : 0.5;
  const positionIn6m  = range6m > 0 ? Math.max(0, Math.min(1, (current - low6m) / range6m)) : 0.5;

  // volume
  const avgVolN = (days: number) => {
    const slice = valid.slice(Math.max(0, n - days));
    const nonZero = slice.filter(x => x.v > 0);
    return nonZero.length > 0 ? Math.round(nonZero.reduce((s, x) => s + x.v, 0) / nonZero.length) : null;
  };
  const avgVol20 = avgVolN(20);
  const avgVol6m = avgVolN(n);
  const volExpansion = avgVol20 && avgVol6m && avgVol6m > 0 ? avgVol20 / avgVol6m : null;

  return { current, ret1m, ret3m, ret6m, ma20, ma60, positionIn52w, positionIn6m, high6m, low6m, avgVol20, avgVol6m, volExpansion };
}

// ── 실시간 긍정/부정 이유 동적 생성 ─────────────────────────────────────────────
function generateAnalysis(
  candidate: (typeof CANDIDATES)[0],
  ind: Indicators | null,
  w52High: number,
  w52Low: number,
): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  if (ind) {
    const { current, ret1m, ret3m, ret6m, ma20, ma60, positionIn52w, volExpansion } = ind;
    const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
    const won = (n: number) => n.toLocaleString("ko-KR") + "원";

    // ── 저가권 신호 ──────────────────────────────────────────────
    if (positionIn52w < 0.25) {
      const upFromLow = ((current - w52Low) / w52Low * 100).toFixed(1);
      pros.push(`52주 저점(${won(w52Low)}) 대비 +${upFromLow}% — 역사적 바닥권`);
    } else if (positionIn52w < 0.45) {
      const dnFromHigh = ((w52High - current) / w52High * 100).toFixed(1);
      pros.push(`52주 고점 대비 -${dnFromHigh}% 할인 — 중하단 구간`);
    } else if (positionIn52w > 0.85) {
      const dnFromHigh = ((w52High - current) / w52High * 100).toFixed(1);
      cons.push(`52주 고점(${won(w52High)}) 근접 (-${dnFromHigh}%) — 추가 상승 여력 제한`);
    }

    // ── 모멘텀 신호 ──────────────────────────────────────────────
    if (ret1m != null && ret3m != null) {
      if (ret1m > 0 && ret3m < -10) {
        pros.push(`3개월 조정(${pct(ret3m)}) 후 최근 1개월 반등 시작 (${pct(ret1m)})`);
      } else if (ret1m > 10) {
        pros.push(`최근 1개월 강한 회복 모멘텀 ${pct(ret1m)}`);
      } else if (ret1m < -10) {
        cons.push(`최근 1개월 ${pct(ret1m)} — 단기 추가 하락 압력`);
      }
    }

    if (ret6m != null) {
      if (ret6m < -25) {
        pros.push(`6개월 ${pct(ret6m)} 급락 후 반등 구간 (과매도 기대)`);
      } else if (ret6m > 30) {
        cons.push(`6개월 ${pct(ret6m)} 이미 큰 상승 — 단기 차익 실현 부담`);
      }
    }

    // ── 이동평균 신호 ─────────────────────────────────────────────
    if (ma20 != null) {
      const vsMA20 = ((current - ma20) / ma20 * 100);
      if (vsMA20 > 5) {
        pros.push(`20일 이평선(${won(ma20)}) 위 ${pct(vsMA20)} — 단기 상승 추세 확인`);
      } else if (vsMA20 < -5) {
        cons.push(`20일 이평선(${won(ma20)}) 아래 ${pct(vsMA20)} — 단기 하락 추세`);
      }
    }
    if (ma60 != null) {
      const vsMA60 = ((current - ma60) / ma60 * 100);
      if (vsMA60 < -10) {
        pros.push(`60일 이평선(${won(ma60)}) 대비 ${pct(vsMA60)} 이격 — 중기 반등 여력`);
      }
    }

    // ── 거래량 신호 ──────────────────────────────────────────────
    if (volExpansion != null && volExpansion > 1.5) {
      const diff = ((volExpansion - 1) * 100).toFixed(0);
      pros.push(`최근 20일 거래량 6개월 평균 대비 +${diff}% 증가 — 수급 유입 신호`);
    } else if (volExpansion != null && volExpansion < 0.5) {
      cons.push(`최근 20일 거래량 6개월 평균 대비 -${((1 - volExpansion) * 100).toFixed(0)}% 감소 — 수급 위축`);
    }
  }

  // 정적 분석으로 나머지 채우기
  for (const p of candidate.staticPros) {
    if (pros.length >= 3) break;
    if (!pros.includes(p)) pros.push(p);
  }
  for (const c of candidate.staticCons) {
    if (cons.length >= 3) break;
    if (!cons.includes(c)) cons.push(c);
  }

  return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
}

// ── 턴어라운드 점수 ────────────────────────────────────────────────────────────
function computeScore(ind: Indicators | null): number {
  if (!ind) return 0;
  const { positionIn52w, ret1m, ret3m, ret6m, volExpansion } = ind;

  // 저가권 점수 (0~40) — 많이 빠진 종목일수록 높음
  const cheapScore = (1 - positionIn52w) * 40;

  // 반등 모멘텀 점수 (0~30) — 최근 1개월 상승 & 이전 하락
  let momentumScore = 0;
  if (ret1m != null && ret1m > 0 && ret3m != null && ret3m < 0) {
    momentumScore = Math.min(ret1m * 1.5, 30); // 반등 확인
  } else if (ret1m != null && ret1m > 0) {
    momentumScore = Math.min(ret1m * 0.5, 15);
  }

  // 과매도 보너스 (0~20) — 6개월 하락이 클수록
  const oversoldBonus = ret6m != null && ret6m < 0 ? Math.min(Math.abs(ret6m) * 0.4, 20) : 0;

  // 거래량 보너스 (0~10)
  const volBonus = volExpansion != null && volExpansion > 1.2 ? Math.min((volExpansion - 1) * 20, 10) : 0;

  return Math.round(cheapScore + momentumScore + oversoldBonus + volBonus);
}

// ── 날짜 포맷 ──────────────────────────────────────────────────────────────────
function tsToLabel(ts: number): string {
  const d = new Date(ts * 1000);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function tsToDateKey(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// ── 이동평균 계산 (rolling) ────────────────────────────────────────────────────
function rollingMA(closes: (number | null)[], days: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < days - 1) return null;
    const slice = closes.slice(i - days + 1, i + 1).filter(c => c != null) as number[];
    return slice.length >= Math.floor(days * 0.8) ? Math.round(slice.reduce((a, b) => a + b, 0) / slice.length) : null;
  });
}

// ── 차트 응답 공통 ────────────────────────────────────────────────────────────
async function buildChart(candidate: (typeof CANDIDATES)[0], code: string, period: string) {
  const rangeMap: Record<string, string> = { "1m": "1mo", "3m": "3mo", "6m": "6mo", "1y": "1y" };
  const yahooRange = rangeMap[period] ?? "6mo";

  const hist = await fetchYahooChart(code, yahooRange);
  const ind = computeIndicators(hist.closes, hist.volumes, hist.fiftyTwoWeekHigh, hist.fiftyTwoWeekLow);
  const analysis = generateAnalysis(candidate, ind, hist.fiftyTwoWeekHigh, hist.fiftyTwoWeekLow);

  const ma20arr = rollingMA(hist.closes, 20);
  const ma60arr = rollingMA(hist.closes, 60);

  const step = hist.timestamps.length > 100 ? 2 : 1;
  const chartData = hist.timestamps
    .filter((_, i) => i % step === 0)
    .map((ts, si) => {
      const i = si * step;
      return {
        date: tsToDateKey(ts),
        label: tsToLabel(ts),
        price: hist.closes[i],
        volume: hist.volumes[i],
        ma20: ma20arr[i],
        ma60: ma60arr[i],
      };
    });

  return {
    code, name: candidate.name, sector: candidate.sector, theme: candidate.theme,
    pros: analysis.pros, cons: analysis.cons,
    currentPrice: hist.currentPrice,
    fiftyTwoWeekHigh: hist.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: hist.fiftyTwoWeekLow,
    ret1m: ind?.ret1m ?? null,
    ret3m: ind?.ret3m ?? null,
    ret6m: ind?.ret6m ?? null,
    positionIn52w: ind?.positionIn52w ?? null,
    ma20: ind?.ma20 ?? null,
    ma60: ind?.ma60 ?? null,
    volExpansion: ind?.volExpansion ?? null,
    chartData,
    dataAvailable: chartData.length > 0,
    updatedAt: new Date().toISOString(),
  };
}

function summarize(c: (typeof CANDIDATES)[0], hist: PriceHistory, ind: Indicators | null) {
  const analysis = generateAnalysis(c, ind, hist.fiftyTwoWeekHigh, hist.fiftyTwoWeekLow);
  return {
    ...c,
    currentPrice: hist.currentPrice,
    fiftyTwoWeekHigh: hist.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: hist.fiftyTwoWeekLow,
    ret1m: ind?.ret1m ?? null,
    ret3m: ind?.ret3m ?? null,
    ret6m: ind?.ret6m ?? null,
    positionIn52w: ind?.positionIn52w ?? null,
    volExpansion: ind?.volExpansion ?? null,
    ma20: ind?.ma20 ?? null,
    ma60: ind?.ma60 ?? null,
    pros: analysis.pros,
    cons: analysis.cons,
    dataAvailable: hist.closes.length > 0,
  };
}

const emptyItem = (c: (typeof CANDIDATES)[0]) => ({
  ...c, currentPrice: null, fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
  ret1m: null, ret3m: null, ret6m: null, positionIn52w: null, volExpansion: null, ma20: null, ma60: null,
  dataAvailable: false, pros: c.staticPros, cons: c.staticCons,
});

// ── GET /turnaround/watchlist ─────────────────────────────────────────────────
router.get("/turnaround/watchlist", async (_req, res) => {
  try {
    const cacheKey = "turnaround:watchlist:v1";
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < LIST_TTL) return res.json(hit.data);

    const settled = await Promise.allSettled(
      WATCHLIST_STOCKS.map(async (c) => {
        const hist = await fetchYahooChart(c.code, "1y");
        const ind = computeIndicators(hist.closes, hist.volumes, hist.fiftyTwoWeekHigh, hist.fiftyTwoWeekLow);
        return summarize(c, hist, ind);
      })
    );
    const items = settled.map((r, i) => r.status === "fulfilled" ? r.value : emptyItem(WATCHLIST_STOCKS[i]));

    const data = { items, updatedAt: new Date().toISOString() };
    cache.set(cacheKey, { data, ts: Date.now() });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /turnaround/watchlist/chart/:code ─────────────────────────────────────
router.get("/turnaround/watchlist/chart/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const period = (req.query.period as string) ?? "6m";
    const cacheKey = `turnaround:watchlist:chart:v1:${code}:${period}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CHART_TTL) return res.json(hit.data);

    const candidate = WATCHLIST_STOCKS.find(c => c.code === code);
    if (!candidate) return res.status(404).json({ error: "종목 없음" });

    const data = await buildChart(candidate, code, period);
    cache.set(cacheKey, { data, ts: Date.now() });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /turnaround/list ───────────────────────────────────────────────────────
router.get("/turnaround/list", async (_req, res) => {
  try {
    const cacheKey = "turnaround:list:v5";
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < LIST_TTL) return res.json(hit.data);

    const settled = await Promise.allSettled(
      CANDIDATES.map(async (c) => {
        const hist = await fetchYahooChart(c.code, "1y"); // 1년 데이터로 스크리닝
        const ind = computeIndicators(hist.closes, hist.volumes, hist.fiftyTwoWeekHigh, hist.fiftyTwoWeekLow);
        return { ...summarize(c, hist, ind), score: computeScore(ind) };
      })
    );
    const items = settled.map((r, i) => r.status === "fulfilled" ? r.value : { ...emptyItem(CANDIDATES[i]), score: 0 });

    const ranked = items
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item, i) => ({ ...item, rank: i + 1 }));

    const data = { ranked, screeningMethod: "기술적 지표 (Yahoo Finance)", updatedAt: new Date().toISOString() };
    cache.set(cacheKey, { data, ts: Date.now() });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /turnaround/chart/:code ────────────────────────────────────────────────
router.get("/turnaround/chart/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const period = (req.query.period as string) ?? "6m";
    const cacheKey = `turnaround:chart:v4:${code}:${period}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CHART_TTL) return res.json(hit.data);

    const candidate = CANDIDATES.find(c => c.code === code);
    if (!candidate) return res.status(404).json({ error: "종목 없음" });

    const data = await buildChart(candidate, code, period);
    cache.set(cacheKey, { data, ts: Date.now() });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
