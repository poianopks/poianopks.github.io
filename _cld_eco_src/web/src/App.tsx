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

import { TABS, tabUrl, SITE_NAME } from "@/lib/tabs";

const queryClient = new QueryClient();


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

type StockDataT = ReturnType<typeof useStockData>;

function TabContent({ tab, stockData }: { tab: string; stockData: StockDataT }) {
  return (
    <>
      {tab === "dashboard"    && <Dashboard stockData={stockData} />}
      {tab === "factcheck"    && <FactCheck />}
      {tab === "history"      && <History />}
      {tab === "strategy"     && <Strategy />}
      {tab === "scenarios"    && <Scenarios />}
      {tab === "portfolio"    && <Portfolio />}
      {tab === "decision"     && <InvestDecision />}
      {tab === "wisdom"       && <WisdomInvest />}
      {tab === "quotes"       && <Quotes />}
      {tab === "mindset"      && <MindSet />}
      {tab === "ath"          && <AthStrategy kospi={stockData.kospi} />}
      {tab === "semisignal"   && <SemiconductorSignal />}
      {tab === "reborinsight" && <ReborInsight />}
      {tab === "trading"      && <SamsungTrading />}
      {tab === "telescope"    && <TelescopeInvest />}
      {tab === "econocycle"   && <EconomicCycle />}
      {tab === "aliveath"     && <AliveAth />}
      {tab === "turnaround"   && <Turnaround />}
      {tab === "news"         && <NewsCenter />}
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/30 py-5 text-center text-xs text-muted-foreground bg-white/40 backdrop-blur-sm">
      <p className="mb-1">
        ⚠️ 본 분석은 역사적 데이터 기반 확률적 추론이며, 실제 미래는 다를 수 있습니다. 투자 권유가 아닌 정보 제공 목적입니다.
      </p>
      <p>
        데이터: Yahoo Finance 등 공개 시세·공개 뉴스 RSS · 약 1시간마다 자동 수집 (실시간 아님)
      </p>
    </footer>
  );
}

/** 지금 주소가 메뉴 단독 페이지(/cld_eco/turnaround/ 등)이면 그 메뉴 이름 */
function standaloneTab(): string | null {
  const base = import.meta.env.BASE_URL;
  const p = window.location.pathname;
  if (!p.startsWith(base)) return null;
  const rest = p.slice(base.length).replace(/\/(index\.html)?$/, "");
  return TABS.some(t => t.value === rest) ? rest : null;
}

/** 메뉴 하나만 보여 주는 단독 페이지 */
function StandalonePage({ tab }: { tab: string }) {
  const stockData = useStockData();
  const def = TABS.find(t => t.value === tab)!;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="container max-w-screen-xl mx-auto px-4 flex h-14 items-center justify-between gap-3">
          <a href={tabUrl(tab)} className="font-black text-base md:text-lg tracking-tight truncate">{def.label}</a>
          <a href={import.meta.env.BASE_URL} className="shrink-0 text-xs font-bold text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/5">
            📚 {SITE_NAME} 전체 메뉴
          </a>
        </div>
        <Ticker />
      </header>
      <main className="container max-w-screen-xl mx-auto px-4 py-8 pb-12">
        <TabContent tab={tab} stockData={stockData} />
      </main>
      <nav className="container max-w-screen-xl mx-auto px-4 pb-10">
        <div className="text-sm font-black mb-2">🧭 다른 메뉴도 둘러보기</div>
        <div className="flex flex-wrap gap-2">
          {TABS.filter(t => t.value !== tab).map(t => (
            <a key={t.value} href={tabUrl(t.value)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-border hover:border-primary/40">
              {t.label}
            </a>
          ))}
        </div>
      </nav>
      <SiteFooter />
    </div>
  );
}

function MainApp() {
  // 예전 주소(#factcheck 등)도 그대로 열리게 함
  const tabFromHash = () => {
    const h = window.location.hash.slice(1);
    return TABS.some(t => t.value === h) ? h : "dashboard";
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
            <span className="font-black text-base md:text-lg tracking-tight">{SITE_NAME}</span>
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
              <a key={tab.value}
                href={tabUrl(tab.value)}
                onClick={(e) => {
                  // 보통 클릭은 이 화면에서 탭 전환, 오른쪽 클릭·길게 누르기·Ctrl·휠 클릭은 메뉴 단독 페이지를 새 탭으로
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  setActiveTab(tab.value);
                }}
                title={`${tab.label} — 길게 누르거나 오른쪽 클릭하면 이 메뉴만 따로 새 탭으로 열 수 있어요`}
                data-testid={`tab-${tab.value}`}
                className={`px-4 md:px-5 py-2.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                  activeTab === tab.value
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border/40"
                }`}>
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.short}</span>
              </a>
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
            <TabContent tab={activeTab} stockData={stockData} />
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function App() {
  const solo = standaloneTab();
  return (
    <QueryClientProvider client={queryClient}>
      {solo ? <StandalonePage tab={solo} /> : <MainApp />}
    </QueryClientProvider>
  );
}
