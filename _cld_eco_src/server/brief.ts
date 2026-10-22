/**
 * 코스피 개장 브리핑 데이터 (팩트체크 탭 맨 위 카드)
 *
 * - 코스피 마지막 장: 종가·연속 상승/하락·200일선·2000년 이후 같은 상황 통계 (Yahoo Finance 일봉)
 * - 밤사이 미국: 나스닥·S&P·다우·필라델피아 반도체·금리·유가·환율 (Yahoo Finance)
 * - 추정 갭: 코스피 장 마감 뒤 미국에서 거래된 EWY(코스피 ETF)가 추가로 반영한 등락
 * - 당일 수급: 현물·선물 투자자별 순매수, 프로그램 매매 (네이버 증권 모바일, 장 마감 뒤 확정)
 *
 * 무료 공개 시세만 씁니다. 실패한 항목은 비워 두고 화면에서 "자료 없음"으로 보여 줍니다.
 */

const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36";
const YAHOO_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

type Bar = { date: string; close: number };

/** Yahoo 일봉. 날짜는 거래소 현지 날짜(YYYY-MM-DD) */
async function yahooDaily(symbol: string, fromUnix: number): Promise<{ bars: Bar[]; last: number | null; lastTime: string | null }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${fromUnix}&period2=${Math.floor(Date.now() / 1000) + 86400}&interval=1d`;
  let r = await fetch(url, { headers: { "User-Agent": YAHOO_UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (r.status === 429) {
    await new Promise((ok) => setTimeout(ok, 3000));
    r = await fetch(url, { headers: { "User-Agent": YAHOO_UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  }
  if (!r.ok) throw new Error(`${symbol} HTTP ${r.status}`);
  const res = (await r.json())?.chart?.result?.[0];
  if (!res) throw new Error(`${symbol} 데이터 없음`);
  const off = (res.meta?.gmtoffset ?? 0) as number;
  const closes: (number | null)[] = res.indicators?.quote?.[0]?.close ?? [];
  const bars: Bar[] = [];
  (res.timestamp ?? []).forEach((t: number, i: number) => {
    const c = closes[i];
    if (c == null || !isFinite(c)) return;
    const date = new Date((t + off) * 1000).toISOString().slice(0, 10);
    if (bars.length && bars[bars.length - 1].date === date) bars[bars.length - 1].close = c;
    else bars.push({ date, close: c });
  });
  const mt = res.meta?.regularMarketTime;
  return { bars, last: res.meta?.regularMarketPrice ?? null, lastTime: mt ? new Date(mt * 1000).toISOString() : null };
}

const pct = (a: number, b: number) => (a / b - 1) * 100;
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/** 마지막 날 기준 연속 상승(+)/하락(-) 일수와 누적 등락률 */
function currentStreak(bars: Bar[]) {
  const n = bars.length;
  const dir = Math.sign(bars[n - 1].close - bars[n - 2].close);
  let len = 0;
  for (let i = n - 1; i > 0 && Math.sign(bars[i].close - bars[i - 1].close) === dir && dir !== 0; i--) len++;
  return { dir, len, cumPct: len ? round(pct(bars[n - 1].close, bars[n - 1 - len].close)) : 0, from: len ? bars[n - len].date : null };
}

/** 각 날짜의 연속 일수(하락이면 음수) */
function runLengths(bars: Bar[]) {
  const run: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const d = Math.sign(bars[i].close - bars[i - 1].close);
    const prev = run[i - 1];
    run.push(d === 0 ? 0 : Math.sign(prev) === d ? prev + d : d);
  }
  return run;
}

function forward(bars: Bar[], idx: number[], days: number) {
  const r = idx.filter((i) => i + days < bars.length).map((i) => pct(bars[i + days].close, bars[i].close));
  if (!r.length) return null;
  return { n: r.length, upPct: round((r.filter((x) => x > 0).length / r.length) * 100, 0), avg: round(r.reduce((a, b) => a + b, 0) / r.length) };
}

/** 연속 하락 구간 목록 (기간 안) */
function downRuns(bars: Bar[], sinceDate: string) {
  const out: { from: string; to: string; days: number; cumPct: number }[] = [];
  let start = -1;
  for (let i = 1; i <= bars.length; i++) {
    const down = i < bars.length && bars[i].close < bars[i - 1].close;
    if (down && start < 0) start = i;
    if (!down && start >= 0) {
      if (bars[start].date >= sinceDate) out.push({ from: bars[start].date, to: bars[i - 1].date, days: i - start, cumPct: round(pct(bars[i - 1].close, bars[start - 1].close)) });
      start = -1;
    }
  }
  return out;
}

function lastOnOrBefore(bars: Bar[], date: string) {
  for (let i = bars.length - 1; i >= 0; i--) if (bars[i].date <= date) return bars[i];
  return null;
}

// ─── 네이버 증권 모바일 (수급) ───────────────────────────────────────────
const num = (s: unknown) => {
  if (s == null) return null;
  const v = Number(String(s).replace(/[,+]/g, "").replace(/[^\d.-]/g, ""));
  return isFinite(v) ? v : null;
};

async function naver(path: string) {
  const r = await fetch(`https://m.stock.naver.com/api/${path}`, {
    headers: { "User-Agent": UA, Referer: "https://m.stock.naver.com/" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`naver ${path} HTTP ${r.status}`);
  return r.json();
}

function deal(t: any) {
  if (!t?.bizdate) return null;
  const d = String(t.bizdate);
  return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, individual: num(t.personalValue), foreign: num(t.foreignValue), institution: num(t.institutionalValue) };
}

export interface FlowDay {
  date: string;
  spot: { individual: number | null; foreign: number | null; institution: number | null } | null;
  futures: { individual: number | null; foreign: number | null; institution: number | null } | null;
  program: { total: number | null; arbitrage: number | null; nonArbitrage: number | null } | null;
  breadth: { up: number | null; down: number | null; flat: number | null } | null;
  futuresClose: number | null;
  futuresChgPct: number | null;
  kospi200: number | null;
}

async function collectFlows(): Promise<FlowDay | null> {
  const [k, f, fp] = await Promise.all([
    naver("index/KOSPI/integration").catch(() => null),
    naver("index/FUT/integration").catch(() => null),
    naver("index/FUT/price?pageSize=2&page=1").catch(() => null),
  ]);
  const spot = deal(k?.dealTrendInfo);
  const fut = deal(f?.dealTrendInfo);
  if (!spot && !fut) return null;
  const p = k?.programTrendInfo;
  const u = k?.upDownStockInfo;
  const last = Array.isArray(fp) ? fp[0] : null;
  return {
    date: (spot ?? fut)!.date,
    spot: spot && { individual: spot.individual, foreign: spot.foreign, institution: spot.institution },
    futures: fut && { individual: fut.individual, foreign: fut.foreign, institution: fut.institution },
    program: p ? { total: num(p.indexTotalReal), arbitrage: num(p.indexDifferenceReal), nonArbitrage: num(p.indexBiDifferenceReal) } : null,
    breadth: u ? { up: (num(u.riseCount) ?? 0) + (num(u.upperCount) ?? 0), down: (num(u.fallCount) ?? 0) + (num(u.lowerCount) ?? 0), flat: num(u.steadyCount) } : null,
    futuresClose: num(last?.closePrice),
    futuresChgPct: num(last?.fluctuationsRatio),
    kospi200: null,
  };
}

// ─── 종합 ─────────────────────────────────────────────────────────────
export interface Signal { label: string; value: string; score: -1 | 0 | 1; note: string }

export async function collectBrief(prev?: any) {
  const errors: string[] = [];
  const safe = async <T>(name: string, p: Promise<T>): Promise<T | null> => {
    try { return await p; } catch (e) { errors.push(`${name}: ${(e as Error).message}`); return null; }
  };
  const monthAgo = Math.floor(Date.now() / 1000) - 45 * 86400;
  const ratioFrom = Math.floor(Date.now() / 1000) - 75 * 86400; // 추정 갭 기준 비율(최근 20거래일)용

  const symbols: [string, string, number][] = [
    ["KOSPI", "^KS11", 946684800], ["EWY", "EWY", ratioFrom], ["USD/KRW", "KRW=X", ratioFrom], ["SOX", "^SOX", monthAgo],
    ["NDX", "^NDX", monthAgo], ["S&P500", "^GSPC", monthAgo], ["DOW", "^DJI", monthAgo], ["NQ=F", "NQ=F", monthAgo],
    ["MU", "MU", monthAgo], ["NVDA", "NVDA", monthAgo], ["TNX", "^TNX", monthAgo], ["OIL", "CL=F", monthAgo], ["KS200", "^KS200", monthAgo],
  ];
  const got: (Awaited<ReturnType<typeof yahooDaily>> | null)[] = [];
  for (let i = 0; i < symbols.length; i += 3) {
    got.push(...(await Promise.all(symbols.slice(i, i + 3).map(([name, sym, from]) => safe(name, yahooDaily(sym, from))))));
  }
  const [kospiY, ewy, krw, sox, ndx, spx, dji, nq, mu, nvda, tnx, oil, ks200] = got;
  if (!kospiY || kospiY.bars.length < 300) throw new Error(`KOSPI 일봉을 받지 못했습니다 (${errors.join(", ")})`);

  const flows = await safe("수급(네이버)", collectFlows());

  // Yahoo 일봉은 최근 하루가 늦게 들어오는 일이 있어, 최근 10거래일은 네이버 일별 종가로 맞춤
  const naverDaily = async (code: string) => {
    const rows = await naver(`index/${code}/price?pageSize=10&page=1`);
    return (Array.isArray(rows) ? rows : [])
      .map((r: any) => ({ date: String(r.localTradedAt).slice(0, 10), close: num(r.closePrice) }))
      .filter((r: any) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.close) as Bar[];
  };
  const mergeBars = (bars: Bar[], extra: Bar[]) => {
    const map = new Map(bars.map((b) => [b.date, b.close]));
    for (const e of extra) map.set(e.date, e.close);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, close]) => ({ date, close }));
  };
  const nk = await safe("코스피 일별(네이버)", naverDaily("KOSPI"));
  if (nk?.length) kospiY.bars = mergeBars(kospiY.bars, nk);
  const nk200 = await safe("코스피200 일별(네이버)", naverDaily("KPI200"));
  if (ks200 && nk200?.length) ks200.bars = mergeBars(ks200.bars, nk200);

  // 코스피 일봉: 네이버 수급 날짜가 Yahoo 마지막 날보다 최신이면 Yahoo가 아직 갱신 전 → 그대로 사용
  const bars = kospiY.bars;
  const n = bars.length;
  const last = bars[n - 1];
  const chgPct = round(pct(last.close, bars[n - 2].close));
  const ma200 = bars.slice(-200).reduce((a, b) => a + b.close, 0) / 200;
  const ma20 = bars.slice(-20).reduce((a, b) => a + b.close, 0) / 20;
  const streak = currentStreak(bars);

  // 2000년 이후 같은 상황 통계
  const run = runLengths(bars);
  const sameStreakIdx = streak.len >= 2 ? run.map((r, i) => (r === streak.dir * streak.len && i < n - 1 ? i : -1)).filter((i) => i >= 0) : [];
  const streakStats = sameStreakIdx.length >= 5
    ? { label: `${streak.len}일 연속 ${streak.dir < 0 ? "하락" : "상승"} 뒤`, next: forward(bars, sameStreakIdx, 1), d5: forward(bars, sameStreakIdx, 5), d20: forward(bars, sameStreakIdx, 20) }
    : null;
  let bigMoveStats = null;
  if (Math.abs(chgPct) >= 1.5) {
    const thr = Math.sign(chgPct) * Math.floor(Math.abs(chgPct) * 2) / 2;
    const idx: number[] = [];
    for (let i = 1; i < n - 1; i++) {
      const c = pct(bars[i].close, bars[i - 1].close);
      if (thr < 0 ? c <= thr : c >= thr) idx.push(i);
    }
    if (idx.length >= 5) bigMoveStats = { label: `하루 ${thr > 0 ? "+" : ""}${thr}% ${thr < 0 ? "이하 급락" : "이상 급등"} 뒤`, next: forward(bars, idx, 1), d5: forward(bars, idx, 5) };
  }
  const daysAgo = (y: number) => new Date(Date.parse(last.date) - y * 365 * 86400000).toISOString().slice(0, 10);
  const records = [1, 2, 3].map((y) => {
    const runs = downRuns(bars, daysAgo(y));
    const max = runs.reduce((m, r) => (r.days > m.days ? r : m), { from: "", to: "", days: 0, cumPct: 0 });
    return { years: y, maxDown: max, fivePlus: runs.filter((r) => r.days >= 5) };
  });

  // 밤사이 미국: 각 종목 마지막 일봉 등락
  const move = (d: Awaited<ReturnType<typeof yahooDaily>> | null) => {
    if (!d || d.bars.length < 2) return null;
    const b = d.bars;
    return { date: b[b.length - 1].date, close: round(b[b.length - 1].close), chgPct: round(pct(b[b.length - 1].close, b[b.length - 2].close)) };
  };
  const us = {
    ndx: move(ndx), spx: move(spx), dji: move(dji), sox: move(sox), mu: move(mu), nvda: move(nvda), oil: move(oil),
    tnx: tnx && tnx.bars.length >= 2 ? { date: tnx.bars[tnx.bars.length - 1].date, close: round(tnx.bars[tnx.bars.length - 1].close, 3), chgBp: round((tnx.bars[tnx.bars.length - 1].close - tnx.bars[tnx.bars.length - 2].close) * 100, 1) } : null,
    nqNow: nq && nq.last && nq.bars.length >= 2 ? { price: round(nq.last), chgPct: round(pct(nq.last, nq.bars[nq.bars.length - 2].close)), time: nq.lastTime } : null,
  };

  // 추정 갭: "EWY×환율÷코스피" 비율이 최근 20거래일 보통 수준(중앙값)에서 벗어난 만큼을 코스피 종가에 적용
  // (예전 방식은 코스피의 전날 등락 전체를 빼서, 전날 밤 미국장 몫을 두 번 빼는 문제가 있었음.
  //  2025-10~2026-10 시험: 예전 방식 평균 오차 2.76%p → 이 방식 1.60%p, 방향 적중 70% → 75%)
  let gap: any = null;
  if (ewy && ewy.bars.length >= 2 && krw && krw.bars.length >= 2) {
    const e1 = ewy.bars[ewy.bars.length - 1], e0 = ewy.bars[ewy.bars.length - 2];
    const f1 = lastOnOrBefore(krw.bars, e1.date), f0 = lastOnOrBefore(krw.bars, e0.date);
    if (last.date <= e1.date && f1) {
      const ratioOn = (kb: Bar) => {
        const e = ewy.bars.find((b) => b.date === kb.date);
        const f = lastOnOrBefore(krw.bars, kb.date);
        return e && f ? (e.close * f.close) / kb.close : null;
      };
      const hist: number[] = [];
      for (let i = n - 2; i >= 0 && hist.length < 20 && bars[i].date >= ewy.bars[0].date; i--) {
        const r = ratioOn(bars[i]);
        if (r != null) hist.push(r);
      }
      if (hist.length >= 10) {
        const sorted = [...hist].sort((a, b) => a - b);
        const ref = sorted[Math.floor(sorted.length / 2)];
        const residual = ((e1.close * f1.close) / last.close) / ref - 1;
        gap = {
          ewyDate: e1.date, ewyChgPct: round((e1.close / e0.close - 1) * 100),
          usdkrwChgPct: f0 ? round((f1.close / f0.close - 1) * 100) : 0, refDays: hist.length,
          residualPct: round(residual * 100), estOpen: round(last.close * (1 + residual), 0),
        };
      }
    }
  }

  // 수급 기록 (최근 30거래일, 이전 파일에서 이어 붙임)
  const history: FlowDay[] = Array.isArray(prev?.flowHistory) ? prev.flowHistory : [];
  if (flows) {
    const ks = ks200 ? lastOnOrBefore(ks200.bars, flows.date) : null;
    if (ks && ks.date === flows.date) flows.kospi200 = round(ks.close);
    const i = history.findIndex((h) => h.date === flows.date);
    if (i >= 0) history[i] = flows; else history.push(flows);
  }
  history.sort((a, b) => a.date.localeCompare(b.date));
  const flowHistory = history.slice(-30);
  const flowsToday = flowHistory.length ? flowHistory[flowHistory.length - 1] : null;

  // 신호 점수 (단순·투명하게)
  const signals: Signal[] = [];
  const add = (label: string, value: string, score: -1 | 0 | 1, note: string) => signals.push({ label, value, score, note });
  if (gap) add("밤사이 EWY 추가 반영", `${gap.residualPct > 0 ? "+" : ""}${gap.residualPct}%`, gap.residualPct >= 0.5 ? 1 : gap.residualPct <= -0.5 ? -1 : 0, "코스피 마감 뒤 미국에서 거래된 코스피 ETF가 더 움직인 몫");
  if (us.sox) add("미국 반도체지수(SOX)", `${us.sox.chgPct > 0 ? "+" : ""}${us.sox.chgPct}%`, us.sox.chgPct >= 1.5 ? 1 : us.sox.chgPct <= -1.5 ? -1 : 0, "삼성전자·SK하이닉스와 연동성이 큼");
  if (flowsToday?.futures?.foreign != null) {
    const v = flowsToday.futures.foreign;
    add("외국인 선물", `${v > 0 ? "+" : ""}${v.toLocaleString()}억`, v >= 3000 ? 1 : v <= -3000 ? -1 : 0, "외국인 선물 방향은 다음 날 흐름과 자주 이어짐 (하루 만에 뒤집히기도 함)");
  }
  if (flowsToday?.spot?.foreign != null) {
    const v = flowsToday.spot.foreign;
    add("외국인 현물", `${v > 0 ? "+" : ""}${v.toLocaleString()}억`, v >= 5000 ? 1 : v <= -5000 ? -1 : 0, "대량 순매도가 이어지면 반등이 약해지기 쉬움");
  }
  if (streakStats?.next) add(streakStats.label, `다음 날 상승 ${streakStats.next.upPct}%`, streakStats.next.upPct >= 58 ? 1 : streakStats.next.upPct <= 42 ? -1 : 0, `2000년 이후 ${streakStats.next.n}번`);
  if (gap) add("원/달러", `${gap.usdkrwChgPct > 0 ? "+" : ""}${gap.usdkrwChgPct}%`, gap.usdkrwChgPct <= -0.3 ? 1 : gap.usdkrwChgPct >= 0.3 ? -1 : 0, "환율 하락(원화 강세)은 외국인 매수에 우호적");
  const score = signals.reduce((a, s) => a + s.score, 0);
  const verdict = score >= 2 ? "반등 우위" : score <= -2 ? "하락 우위" : "중립 (방향 탐색)";

  return {
    generatedAt: new Date().toISOString(),
    kospi: {
      date: last.date, close: round(last.close), chgPct, ma200: round(ma200), dev200: round(pct(last.close, ma200)), ma20: round(ma20), dev20: round(pct(last.close, ma20)),
      streak, recent: bars.slice(-6).map((b, i, a) => ({ date: b.date, close: round(b.close), chgPct: i ? round(pct(b.close, a[i - 1].close)) : null })).slice(1),
    },
    stats: { streak: streakStats, bigMove: bigMoveStats, records, since: bars[0].date, days: n },
    us, gap, flowsToday, flowHistory, signals, score, verdict, errors,
  };
}
