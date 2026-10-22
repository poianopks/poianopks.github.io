import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

/** 팩트체크 탭 맨 위: 코스피 개장 브리핑 (GitHub Actions가 모은 brief/kospi.json) */

type Fwd = { n: number; upPct: number; avg: number } | null;
type Flow = { individual: number | null; foreign: number | null; institution: number | null } | null;
interface FlowDay {
  date: string;
  spot: Flow;
  futures: Flow;
  program: { total: number | null; arbitrage: number | null; nonArbitrage: number | null } | null;
  breadth: { up: number | null; down: number | null; flat: number | null } | null;
  futuresClose: number | null;
  futuresChgPct: number | null;
  kospi200: number | null;
}
interface Brief {
  generatedAt: string;
  kospi: {
    date: string; close: number; chgPct: number; ma200: number; dev200: number; ma20: number; dev20: number;
    streak: { dir: number; len: number; cumPct: number; from: string | null };
    recent: { date: string; close: number; chgPct: number | null }[];
  };
  stats: {
    streak: { label: string; next: Fwd; d5: Fwd; d20: Fwd } | null;
    bigMove: { label: string; next: Fwd; d5: Fwd } | null;
    records: { years: number; maxDown: { from: string; to: string; days: number; cumPct: number }; fivePlus: { from: string; to: string; days: number; cumPct: number }[] }[];
    since: string; days: number;
  };
  us: Record<string, any>;
  gap: { ewyDate: string; ewyChgPct: number; usdkrwChgPct: number; refDays: number; residualPct: number; estOpen: number } | null;
  flowsToday: FlowDay | null;
  flowHistory: FlowDay[];
  signals: { label: string; value: string; score: -1 | 0 | 1; note: string }[];
  score: number;
  verdict: string;
}

const sign = (v: number | null | undefined, d = 2) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(d)}`);
const tone = (v: number | null | undefined) => (v == null || v === 0 ? "text-slate-500" : v > 0 ? "text-red-600" : "text-blue-600");
const eok = (v: number | null | undefined) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toLocaleString()}억`);
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

function kstText(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Age({ iso }: { iso: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  const txt = m < 60 ? `${m}분 전` : `${Math.floor(m / 60)}시간 ${m % 60}분 전`;
  const stale = m > 180;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stale ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
      {stale ? "⏳" : "🟢"} {kstText(iso)} 수집 · {txt}
    </span>
  );
}

function Stat({ label, f }: { label: string; f: Fwd }) {
  if (!f) return null;
  return (
    <div className="p-2 rounded-lg bg-white border border-border/50 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`font-black ${f.upPct >= 50 ? "text-red-600" : "text-blue-600"}`}>상승 {f.upPct}%</div>
      <div className="text-[10px] text-muted-foreground">평균 {sign(f.avg)}% · {f.n}번</div>
    </div>
  );
}

function FlowRow({ name, f }: { name: string; f: Flow }) {
  if (!f) return null;
  return (
    <tr className="border-b border-border/40">
      <td className="py-1.5 pr-2 font-bold whitespace-nowrap">{name}</td>
      <td className={`py-1.5 pr-2 text-right font-bold ${tone(f.foreign)}`}>{eok(f.foreign)}</td>
      <td className={`py-1.5 pr-2 text-right ${tone(f.institution)}`}>{eok(f.institution)}</td>
      <td className={`py-1.5 text-right ${tone(f.individual)}`}>{eok(f.individual)}</td>
    </tr>
  );
}

export function OpeningBrief() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["brief-kospi"],
    queryFn: async () => {
      const r = await fetch("/api/brief/kospi");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<Brief>;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) return <div className="py-6 text-sm text-slate-400">개장 브리핑 불러오는 중…</div>;
  if (error || !data) return null;

  const k = data.kospi;
  const s = k.streak;
  const us = data.us;
  const ft = data.flowsToday;
  const vTone = data.score >= 2 ? "from-red-50 to-orange-50 border-red-200" : data.score <= -2 ? "from-blue-50 to-sky-50 border-blue-200" : "from-slate-50 to-slate-100 border-slate-200";
  const usRows: [string, any, string?][] = [
    ["나스닥 100", us.ndx], ["S&P 500", us.spx], ["다우", us.dji], ["필라델피아 반도체", us.sox], ["마이크론", us.mu], ["엔비디아", us.nvda], ["WTI 유가", us.oil],
  ];
  const futHist = data.flowHistory.filter((h) => h.futures?.foreign != null).slice(-5);
  const basis = ft?.futuresClose != null && ft?.kospi200 != null ? ft.futuresClose - ft.kospi200 : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-800">🌅 오늘의 코스피 개장 브리핑</h2>
          <p className="text-xs text-slate-500 mt-0.5">밤사이 미국 시장 · 추정 시초가 · 장 마감 수급 · 2000년 이후 통계를 한 장에</p>
        </div>
        <Age iso={data.generatedAt} />
      </div>

      {/* 종합 판단 */}
      <div className={`rounded-2xl border-2 bg-gradient-to-br p-4 ${vTone}`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xs font-bold text-slate-500">신호 종합</span>
          <span className="text-2xl font-black">{data.verdict}</span>
          <span className="text-xs text-slate-500">점수 {data.score > 0 ? "+" : ""}{data.score} (각 신호 +1 / 0 / −1 합계)</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.signals.map((g) => (
            <div key={g.label} className="p-2.5 rounded-lg bg-white/80 border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{g.score > 0 ? "🟢" : g.score < 0 ? "🔴" : "⚪"} {g.label}</span>
                <span className="text-sm font-black">{g.value}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{g.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* 코스피 마지막 장 */}
        <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
          <div className="text-sm font-black">📉 코스피 마지막 장 ({md(k.date)})</div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-2xl font-black">{k.close.toLocaleString()}</span>
            <span className={`font-black ${tone(k.chgPct)}`}>{sign(k.chgPct)}%</span>
            {s.len >= 2 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.dir < 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                {s.len}일 연속 {s.dir < 0 ? "하락" : "상승"} (누적 {sign(s.cumPct)}%)
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {k.recent.map((r) => (
              <div key={r.date} className="p-1.5 rounded bg-slate-50">
                <div className="text-[10px] text-muted-foreground">{md(r.date)}</div>
                <div className={`text-xs font-bold ${tone(r.chgPct)}`}>{sign(r.chgPct)}%</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50"><b>200일선</b> {k.ma200.toLocaleString()} <span className={tone(k.dev200)}>({sign(k.dev200)}%)</span>
              <div className="text-[10px] text-muted-foreground">{Math.abs(k.dev200) < 1.5 ? "⚠️ 200일선 바로 근처 — 지지 여부가 핵심" : k.dev200 > 0 ? "200일선 위" : "200일선 아래"}</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><b>20일선</b> {k.ma20.toLocaleString()} <span className={tone(k.dev20)}>({sign(k.dev20)}%)</span>
              <div className="text-[10px] text-muted-foreground">단기 추세 기준선</div></div>
          </div>
        </div>

        {/* 밤사이 미국 + 추정 갭 */}
        <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
          <div className="text-sm font-black">🇺🇸 밤사이 미국 {us.ndx ? `(${md(us.ndx.date)} 마감)` : ""}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {usRows.filter(([, v]) => v).map(([name, v]) => (
              <div key={name} className="p-1.5 rounded bg-slate-50 text-center">
                <div className="text-[10px] text-muted-foreground">{name}</div>
                <div className={`text-sm font-black ${tone(v.chgPct)}`}>{sign(v.chgPct)}%</div>
              </div>
            ))}
            {us.tnx && (
              <div className="p-1.5 rounded bg-slate-50 text-center">
                <div className="text-[10px] text-muted-foreground">미 10년 금리</div>
                <div className="text-sm font-black">{us.tnx.close.toFixed(2)}%</div>
                <div className={`text-[10px] ${tone(us.tnx.chgBp)}`}>{sign(us.tnx.chgBp, 1)}bp</div>
              </div>
            )}
          </div>
          {us.nqNow && <div className="text-xs text-slate-600">📈 나스닥 선물 지금 <b className={tone(us.nqNow.chgPct)}>{sign(us.nqNow.chgPct)}%</b> {us.nqNow.time ? `(${kstText(us.nqNow.time)})` : ""}</div>}
          {data.gap ? (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="text-xs font-bold text-indigo-700">🎯 추정 시초가 (EWY 환산)</div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-xl font-black">{data.gap.estOpen.toLocaleString()}</span>
                <span className={`font-black ${tone(data.gap.residualPct)}`}>{sign(data.gap.residualPct)}%</span>
              </div>
              <div className="text-[10px] text-slate-600 leading-relaxed mt-1">
                EWY {sign(data.gap.ewyChgPct)}% · 원/달러 {sign(data.gap.usdkrwChgPct)}%. "EWY×환율÷코스피" 비율이 최근 {data.gap.refDays}거래일 보통 수준(중앙값)에서 벗어난 만큼을 코스피 종가에 적용했어요.
                1년 시험 평균 오차 약 1.6%p · 방향 적중 약 75%. 코스피200 야간선물이 더 직접적인 신호이니 함께 보세요. 실제 시초가는 장 전 동시호가·뉴스에 따라 달라집니다.
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground">코스피가 이미 미국 장 이후에 거래되어 추정 시초가는 표시하지 않아요.</div>
          )}
        </div>
      </div>

      {/* 당일 수급 */}
      {ft && (
        <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-black">💰 투자자별 순매수 ({md(ft.date)}, 단위 억원)</div>
            <div className="text-[10px] text-muted-foreground">장중에는 잠정치, 장 마감(15:45) 뒤 확정 · 출처: 네이버 증권</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[320px]">
              <thead><tr className="text-muted-foreground border-b"><th className="text-left py-1">구분</th><th className="text-right py-1">외국인</th><th className="text-right py-1">기관</th><th className="text-right py-1">개인</th></tr></thead>
              <tbody>
                <FlowRow name="코스피 현물" f={ft.spot} />
                <FlowRow name="코스피200 선물" f={ft.futures} />
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {ft.futuresClose != null && <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-muted-foreground">선물 종가</div><b>{ft.futuresClose.toFixed(2)}</b> <span className={tone(ft.futuresChgPct)}>{sign(ft.futuresChgPct)}%</span></div>}
            {basis != null && <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-muted-foreground">베이시스 (선물−K200)</div><b>{basis.toFixed(2)}</b></div>}
            {ft.program && <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-muted-foreground">프로그램 (비차익)</div><b className={tone(ft.program.nonArbitrage)}>{eok(ft.program.nonArbitrage)}</b></div>}
            {ft.breadth && <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-muted-foreground">상승 / 하락 종목</div><b className="text-red-600">{ft.breadth.up}</b> / <b className="text-blue-600">{ft.breadth.down}</b></div>}
          </div>
          {futHist.length >= 2 && (
            <div>
              <div className="text-[11px] font-bold text-slate-600 mb-1">외국인 선물 최근 흐름</div>
              <div className="flex gap-1.5 overflow-x-auto">
                {futHist.map((h) => (
                  <div key={h.date} className="min-w-[64px] p-1.5 rounded bg-slate-50 text-center">
                    <div className="text-[10px] text-muted-foreground">{md(h.date)}</div>
                    <div className={`text-xs font-bold ${tone(h.futures!.foreign)}`}>{eok(h.futures!.foreign)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            💡 미결제약정은 무료 공개 자료로 자동 수집이 어려워 표시하지 않아요. 증권사 앱의 <b>선물 → 주가추이(미결제약정)</b>에서 확인하세요.
            가격이 오르며 미결제가 늘면 추세 강화, 미결제가 줄면 포지션 정리로 읽습니다.
          </div>
        </div>
      )}

      {/* 통계 */}
      <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
        <div className="text-sm font-black">📊 2000년 이후 같은 상황 통계 <span className="text-[10px] font-normal text-muted-foreground">({data.stats.since}부터 {data.stats.days.toLocaleString()}거래일)</span></div>
        {data.stats.streak && (
          <div>
            <div className="text-xs font-bold mb-1">{data.stats.streak.label}</div>
            <div className="grid grid-cols-3 gap-2"><Stat label="다음 날" f={data.stats.streak.next} /><Stat label="5거래일 뒤" f={data.stats.streak.d5} /><Stat label="20거래일 뒤" f={data.stats.streak.d20} /></div>
          </div>
        )}
        {data.stats.bigMove && (
          <div>
            <div className="text-xs font-bold mb-1">{data.stats.bigMove.label}</div>
            <div className="grid grid-cols-3 gap-2"><Stat label="다음 날" f={data.stats.bigMove.next} /><Stat label="5거래일 뒤" f={data.stats.bigMove.d5} /></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[360px]">
            <thead><tr className="text-muted-foreground border-b"><th className="text-left py-1">기간</th><th className="text-left py-1">최장 연속 하락</th><th className="text-left py-1">5일 이상 연속 하락</th></tr></thead>
            <tbody>
              {data.stats.records.map((r) => (
                <tr key={r.years} className="border-b border-border/40 align-top">
                  <td className="py-1.5 pr-3 font-bold whitespace-nowrap">최근 {r.years}년</td>
                  <td className="py-1.5 pr-3">{r.maxDown.days}일 <span className="text-muted-foreground">({r.maxDown.from}~{md(r.maxDown.to)}, {sign(r.maxDown.cumPct)}%)</span></td>
                  <td className="py-1.5">{r.fivePlus.length === 0 ? <b>없음</b> : r.fivePlus.map((f) => <div key={f.from}>{f.from} · {f.days}일 ({sign(f.cumPct)}%)</div>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">
        자료: Yahoo Finance 일봉, 네이버 증권(투자자별 순매수). GitHub Actions가 장중 30분, 미국 마감 직후·장 시작 전·장 마감 직후에 자동 수집합니다(서버 사정으로 몇 분~수십 분 늦을 수 있음).
        신호 점수는 단순 참고용이며 매매 권유가 아닙니다.
      </p>
    </div>
  );
}
