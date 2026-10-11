import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "@/pages/Dashboard";
import { History } from "@/pages/History";
import { Strategy } from "@/pages/Strategy";
import { Scenarios } from "@/pages/Scenarios";
import { Portfolio } from "@/pages/Portfolio";
import { FactCheck } from "@/pages/FactCheck";
import { Quotes } from "@/pages/Quotes";
import { InvestDecision } from "@/pages/InvestDecision";
import { WisdomInvest } from "@/pages/WisdomInvest";
import { MindSet } from "@/pages/MindSet";
import { AthStrategy } from "@/pages/AthStrategy";
import { SamsungTrading } from "@/pages/SamsungTrading";
import { SemiconductorSignal } from "@/pages/SemiconductorSignal";
import { ReborInsight } from "@/pages/ReborInsight";
import { TelescopeInvest } from "@/pages/TelescopeInvest";
import { EconomicCycle } from "@/pages/EconomicCycle";
import { AliveAth } from "@/pages/AliveAth";
import { Turnaround } from "@/pages/Turnaround";
import { NewsCenter } from "@/pages/NewsCenter";
import { useStockData } from "@/hooks/useStockData";
import { useGlobalMarket } from "@/hooks/useGlobalMarket";
import { useAliveAth } from "@/hooks/useAliveAth";

const queryClient = new QueryClient();

const TABS = [
  { value: "dashboard",  label: "📊 현재 상황", short: "현재" },
  { value: "factcheck",  label: "🔍 팩트체크",  short: "팩트" },
  { value: "history",    label: "📜 역사 분석", short: "역사" },
  { value: "strategy",   label: "⚖️ 전략 비교", short: "전략" },
  { value: "scenarios",  label: "🔮 시나리오",  short: "시나리오" },
  { value: "portfolio",  label: "💼 자산 배분",  short: "배분" },
  { value: "decision",   label: "🧭 실전 판단",  short: "판단" },
  { value: "wisdom",     label: "🌟 현명투자",    short: "현명" },
  { value: "quotes",     label: "💎 명언 검증",  short: "명언" },
  { value: "mindset",    label: "🌱 마인드",      short: "마인드" },
  { value: "ath",        label: "⚡ ATH 생존전략", short: "ATH" },
  { value: "semisignal", label: "🔮 천기누설", short: "천기누설" },
  { value: "reborinsight", label: "📊 리본인사이트", short: "리본인사이트" },
  { value: "trading",    label: "📊 매매동향", short: "매매동향" },
  { value: "telescope",  label: "🔭 망원경투자", short: "망원경" },
  { value: "econocycle", label: "🕐 경기순환 사이클", short: "경기사이클" },
  { value: "aliveath",   label: "🏔️ 살아있는 ATH",   short: "살아있는ATH" },
  { value: "turnaround", label: "📈 턴어라운드",        short: "턴어라운드" },
  { value: "news",       label: "📰 경제·주식 뉴스",   short: "뉴스" },
];

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: decimals });
}

function fmtDev(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function LiveDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
      title={ok ? "Yahoo Finance 최근 시세" : "시세 연결 확인 중"}
    />
  );
}

function Ticker() {
  const { kospi, sp500, ndx, sam, sk, loading, error, data, refetch } = useStockData();
  const { data: market } = useGlobalMarket();
  const { data: athData } = useAliveAth();

  const isLive = !loading && !error && kospi?.price != null;

  // 살아있는 ATH 방어선 경고: 코스피 현재가 < 살아있는 ATH 최솟값 이면 모든 살아있는 ATH 무효화
  const kospiPrice = kospi?.price ?? null;
  const minAlivePrice = athData.minAlivePrice;
  const athBreached = kospiPrice != null && minAlivePrice != null && kospiPrice < minAlivePrice;

  const ewy  = market.kospiProxy[0];
  const skhy = market.adrs.find(a => a.symbol === "SKHY");
  const krw  = market.fx[0];
  const fmtPct = (v: number) => `${v >= 0 ? "▲" : "▼"}${Math.abs(v).toFixed(2)}%`;

  const items = [
    { label: "KOSPI",          value: fmt(kospi?.price, 0), sub: kospi ? `${fmtDev(kospi.dev200d)} (200일 이격)` : "데이터 확인 중", danger: (kospi?.dev200d ?? 0) >= 25, alert: false },
    { label: "200주 이격",     value: fmtDev(kospi?.dev200w), sub: kospi ? `MA200주: ${fmt(kospi.ma200w, 0)}` : "데이터 확인 중", danger: (kospi?.dev200w ?? 0) >= 25, alert: false },
    { label: "S&P 500",        value: fmt(sp500?.price, 0), sub: sp500 ? `${fmtDev(sp500.dev200d)} (200일 이격)` : "데이터 확인 중", danger: (sp500?.dev200d ?? 0) >= 25, alert: false },
    { label: "NASDAQ 100",     value: fmt(ndx?.price, 0), sub: ndx ? `${fmtDev(ndx.dev200d)} (200일 이격)` : "데이터 확인 중", danger: (ndx?.dev200d ?? 0) >= 25, alert: false },
    { label: "삼성전자 이격",  value: fmtDev(sam?.dev200d), sub: sam ? `${fmt(sam.price, 0)}원` : "데이터 확인 중", danger: (sam?.dev200d ?? 0) >= 25, alert: false },
    { label: "SK하이닉스 이격",value: fmtDev(sk?.dev200d), sub: sk ? `${fmt(sk.price, 0)}원` : "데이터 확인 중", danger: (sk?.dev200d ?? 0) >= 25, alert: false },
    { label: "200주 MA",       value: fmt(kospi?.ma200w, 0), sub: kospi ? "장기 기준선" : "데이터 확인 중", danger: false, alert: false },
    { label: "역사적 ATH",     value: "9,385", sub: "2026.06.19 기록", danger: true, alert: false },
    ...(ewy  ? [{ label: "🌙 코스피야간(EWY)", value: `$${ewy.price}`,                               sub: fmtPct(ewy.changePct),  danger: ewy.changePct  <= -2, alert: ewy.changePct  <= -3 }] : []),
    ...(skhy ? [{ label: "SK하이닉스(SKHY)",   value: `$${skhy.price}`,                              sub: fmtPct(skhy.changePct), danger: skhy.changePct <= -2, alert: skhy.changePct <= -3 }] : []),
    ...(krw  ? [{ label: "💱 원/달러",         value: `${krw.price.toLocaleString("ko-KR")}원`,      sub: fmtPct(krw.changePct),  danger: krw.changePct  >= 1,  alert: krw.changePct  >= 2  }] : []),
  ];

  const updatedAt = data.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="bg-white/60 backdrop-blur-sm border-b border-border/30 overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-destructive px-3 py-1.5 text-xs font-black tracking-widest text-white shrink-0 flex items-center gap-1.5 uppercase">
          <LiveDot ok={isLive} />
          LIVE
        </div>
        {athBreached && (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-black animate-pulse border-r border-red-700 whitespace-nowrap">
            🚨 ATH 방어선 붕괴 — {fmt(minAlivePrice, 2)} 하향 이탈
          </div>
        )}
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex gap-8 py-1.5 px-4 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
          >
            {[...items, ...items].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs">
                {item.alert && (
                  <span className="animate-pulse text-amber-400 text-[11px]">⚠️</span>
                )}
                <span className="text-slate-500 font-medium">{item.label}</span>
                <span className={`font-bold ${item.alert ? "text-amber-400" : item.danger ? "text-destructive" : "text-emerald-600"}`}>
                  {item.value}
                </span>
                <span className={`text-xs ${item.alert ? "text-amber-300" : item.danger ? "text-destructive/70" : "text-slate-400"}`}>
                  {item.sub}
                </span>
                <span className="text-slate-300">|</span>
              </span>
            ))}
          </motion.div>
        </div>
        {updatedAt && (
          <button
            onClick={refetch}
            className="hidden sm:flex shrink-0 items-center gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors border-l border-border/30"
            title="새로고침"
          >
            <LiveDot ok={isLive} />
            {isLive ? `업데이트 ${updatedAt}` : "폴백 데이터"}
          </button>
        )}
      </div>
    </div>
  );
}

function MainApp() {
  // 탭마다 주소(#factcheck 등)를 가져서 바로 열거나 공유할 수 있게 함
  const tabFromHash = () => {
    const h = window.location.hash.slice(1);
    return TABS.some(t => t.value === h && !t.href) ? h : "dashboard";
  };
  const [activeTab, setActiveTabState] = useState(tabFromHash);
  const setActiveTab = (v: string) => {
    setActiveTabState(v);
    history.replaceState(null, "", v === "dashboard" ? window.location.pathname : `#${v}`);
  };
  useEffect(() => {
    const onHash = () => setActiveTabState(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const stockData = useStockData();

  const kospiDev200d = stockData.kospi?.dev200d;
  const kospiDev200w = stockData.kospi?.dev200w;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="container max-w-screen-xl mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" />
            <span className="font-black text-base md:text-lg tracking-tight">KOSPI 투자 분석 센터</span>
            <span className="hidden md:inline text-xs text-muted-foreground border border-border/40 px-2 py-0.5 rounded-full">
              ATH 9,385 · 2026.06
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-destructive font-black">
              200일 이격 {fmtDev(kospiDev200d)}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-destructive font-black">
              200주 이격 {fmtDev(kospiDev200w)}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-amber-400 font-bold">평균회귀 확률 70~80%</span>
          </div>
        </div>

        <Ticker />

        <div className="border-t border-border/20 overflow-x-auto scrollbar-none">
          <div className="container max-w-screen-xl mx-auto flex min-w-max">
            {TABS.map((tab) => (
              tab.href ? (
                <a key={tab.value}
                  href={tab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`tab-${tab.value}`}
                  className="px-4 md:px-5 py-2.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-blue-500 hover:text-blue-600 hover:border-blue-400 transition-all duration-150 flex items-center gap-1">
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.short}</span>
                  <span className="text-[10px] opacity-70">↗</span>
                </a>
              ) : (
                <a key={tab.value}
                  href={`#${tab.value}`}
                  onClick={(e) => {
                    // 보통 클릭은 이 화면에서 탭 전환, Ctrl·휠 클릭 등은 새 탭으로 열기
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    setActiveTab(tab.value);
                  }}
                  title={`${tab.label} — 길게 누르거나 오른쪽 클릭하면 새 탭으로 열 수 있어요`}
                  data-testid={`tab-${tab.value}`}
                  className={`px-4 md:px-5 py-2.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                    activeTab === tab.value
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border/40"
                  }`}>
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.short}</span>
                </a>
              )
            ))}
          </div>
        </div>
      </header>

      <main className="container max-w-screen-xl mx-auto px-4 py-8 pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}>
            {activeTab === "dashboard"  && <Dashboard stockData={stockData} />}
            {activeTab === "factcheck"  && <FactCheck />}
            {activeTab === "history"    && <History />}
            {activeTab === "strategy"   && <Strategy />}
            {activeTab === "scenarios"  && <Scenarios />}
            {activeTab === "portfolio"  && <Portfolio />}
            {activeTab === "decision"   && <InvestDecision />}
            {activeTab === "wisdom"     && <WisdomInvest />}
            {activeTab === "quotes"     && <Quotes />}
            {activeTab === "mindset"    && <MindSet />}
            {activeTab === "ath"        && <AthStrategy kospi={stockData.kospi} />}
            {activeTab === "semisignal" && <SemiconductorSignal />}
            {activeTab === "reborinsight" && <ReborInsight />}
            {activeTab === "trading"    && <SamsungTrading />}
            {activeTab === "telescope"  && <TelescopeInvest />}
            {activeTab === "econocycle" && <EconomicCycle />}
            {activeTab === "aliveath"   && <AliveAth />}
            {activeTab === "turnaround" && <Turnaround />}
            {activeTab === "news"       && <NewsCenter />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/30 py-5 text-center text-xs text-muted-foreground bg-white/40 backdrop-blur-sm">
        <p className="mb-1">
          ⚠️ 본 분석은 역사적 데이터 기반 확률적 추론이며, 실제 미래는 다를 수 있습니다. 투자 권유가 아닌 정보 제공 목적입니다.
        </p>
        <p>
          데이터: Yahoo Finance 공개 시세 (^KS11, ^GSPC, ^NDX, 005930.KS, 000660.KS 등) · GitHub Actions가 약 1시간마다 자동 수집하는 정적 사이트 (실시간 아님) · 원본: Replit Stock Insights
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}
