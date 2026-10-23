import { useEffect, useState } from "react";
import { useStockData, type Quote } from "@/hooks/useStockData";
import { useGlobalMarket } from "@/hooks/useGlobalMarket";
import { useMacroMonitor } from "@/hooks/useMacroMonitor";
import { tabUrl } from "@/lib/tabs";

/* ─────────────────────────────────────────────────────────────
   🔭 투자 망원경 — 아침 5분 시장 날씨 점검
   이 사이트가 1시간마다 모으는 공개 데이터(Yahoo Finance·공개 RSS)로
   오늘의 시장 날씨를 자동 진단합니다. 매매 신호가 아닌 참고용입니다.
   ───────────────────────────────────────────────────────────── */

type Level = "good" | "watch" | "warn" | "na";

interface Check {
  icon: string;
  title: string;
  value: string;
  level: Level;
  why: string;
}

const LEVEL = {
  good:  { label: "양호", dot: "🟢", cls: "border-emerald-300 bg-emerald-50", text: "text-emerald-700" },
  watch: { label: "주의", dot: "🟡", cls: "border-amber-300 bg-amber-50",   text: "text-amber-700" },
  warn:  { label: "경고", dot: "🔴", cls: "border-red-300 bg-red-50",       text: "text-red-700" },
  na:    { label: "확인 중", dot: "⚪", cls: "border-slate-200 bg-slate-50", text: "text-slate-500" },
} as const;

const pct = (v: number | null | undefined, d = 2) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`);
const num = (v: number | null | undefined, d = 0) => (v == null ? "—" : v.toLocaleString("ko-KR", { maximumFractionDigits: d }));

function trendCheck(name: string, q: Quote | undefined, icon: string): Check {
  const dev = q?.dev200d ?? null;
  if (dev == null) return { icon, title: `${name} 200일선`, value: "—", level: "na", why: "데이터 확인 중" };
  if (dev < 0) return { icon, title: `${name} 200일선`, value: `아래 ${pct(dev, 1)}`, level: "warn", why: "200일 이동평균 아래 = 장기 상승 추세가 약해진 상태" };
  if (dev >= 25) return { icon, title: `${name} 200일선`, value: `위 ${pct(dev, 1)}`, level: "watch", why: "추세는 살아 있지만 평균에서 너무 멀어 과열 부담" };
  return { icon, title: `${name} 200일선`, value: `위 ${pct(dev, 1)}`, level: "good", why: "200일선 위의 건강한 상승 추세" };
}

interface NewsItem { title: string; link: string; source: string; publishedAt: string | null; category: string }

export function TelescopeInvest() {
  const { kospi, sp500, ndx, sk, data: q } = useStockData();
  const { data: gm } = useGlobalMarket();
  const { data: macro } = useMacroMonitor();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch("/api/news/feed").then(r => (r.ok ? r.json() : null)).then(d => d && setNews(d.items ?? [])).catch(() => {});
  }, []);

  const spread = macro?.rates.spreadNow ?? null;
  const fx1m = macro?.fx.usdkrwChange1mo ?? null;
  const dxy1m = macro?.liquidity.dxyChange1mo ?? null;
  const ewy = gm.kospiProxy[0];
  const skDev = sk?.dev200d ?? null;

  const checks: Check[] = [
    trendCheck("KOSPI", kospi, "🇰🇷"),
    trendCheck("S&P 500", sp500, "🇺🇸"),
    trendCheck("나스닥 100", ndx, "💻"),
    spread == null
      ? { icon: "📈", title: "장단기 금리차 (미국 10년−3개월)", value: "—", level: "na", why: "데이터 확인 중" }
      : spread < 0
        ? { icon: "📈", title: "장단기 금리차 (미국 10년−3개월)", value: `${spread.toFixed(2)}%p 역전`, level: "warn", why: "금리 역전은 역사적으로 경기 침체에 앞서 나타난 대표 신호" }
        : { icon: "📈", title: "장단기 금리차 (미국 10년−3개월)", value: `+${spread.toFixed(2)}%p 정상`, level: spread < 0.3 ? "watch" : "good", why: spread < 0.3 ? "정상이지만 폭이 좁아 방향을 지켜볼 구간" : "정상 곡선 = 침체 선행 신호 없음" },
    fx1m == null
      ? { icon: "💱", title: "원/달러 환율 1개월 변화", value: "—", level: "na", why: "데이터 확인 중" }
      : { icon: "💱", title: "원/달러 환율 1개월 변화", value: `${num(macro?.fx.usdkrwNow, 1)}원 (${pct(fx1m, 1)})`, level: fx1m >= 3 ? "warn" : fx1m >= 1.5 ? "watch" : "good",
          why: fx1m >= 1.5 ? "원화 약세가 빠르면 외국인 자금이 빠져나갈 수 있음" : "환율이 안정적 = 외국인 수급 부담 적음" },
    dxy1m == null
      ? { icon: "💵", title: "달러 인덱스 1개월 변화", value: "—", level: "na", why: "데이터 확인 중" }
      : { icon: "💵", title: "달러 인덱스 1개월 변화", value: `${num(macro?.liquidity.dxyNow, 1)} (${pct(dxy1m, 1)})`, level: dxy1m >= 3 ? "warn" : dxy1m >= 1.5 ? "watch" : "good",
          why: dxy1m >= 1.5 ? "강달러는 세계 유동성을 줄여 신흥국 증시에 부담" : "달러가 안정적 = 유동성 환경 무난" },
    !ewy
      ? { icon: "🌙", title: "EWY (코스피 야간 대용)", value: "—", level: "na", why: "데이터 확인 중" }
      : { icon: "🌙", title: "EWY (코스피 야간 대용)", value: `${pct(ewy.changePct)}`, level: ewy.changePct <= -2 ? "warn" : ewy.changePct <= -0.7 ? "watch" : "good",
          why: "미국에 상장된 한국 ETF 움직임 = 다음 날 코스피 분위기 힌트" },
    skDev == null
      ? { icon: "🔬", title: "반도체 과열 (SK하이닉스 200일 이격)", value: "—", level: "na", why: "데이터 확인 중" }
      : { icon: "🔬", title: "반도체 과열 (SK하이닉스 200일 이격)", value: pct(skDev, 1), level: skDev >= 80 ? "warn" : skDev >= 40 ? "watch" : "good",
          why: skDev >= 40 ? "주도주가 평균에서 크게 벌어지면 조정 폭도 커지기 쉬움" : "주도주 과열 부담 크지 않음" },
  ];

  const warn = checks.filter(c => c.level === "warn").length;
  const watch = checks.filter(c => c.level === "watch").length;
  const known = checks.filter(c => c.level !== "na").length;
  const weather =
    known === 0 ? { icon: "⏳", label: "데이터 확인 중", desc: "잠시 뒤 다시 확인해 주세요.", cls: "from-slate-700 to-slate-500" }
    : warn >= 3 ? { icon: "⛈️", label: "폭풍 주의", desc: "경고 신호가 여러 개 겹쳤습니다. 신규 매수는 천천히, 현금 비중과 손절 기준부터 점검하세요.", cls: "from-red-800 to-slate-800" }
    : warn >= 1 || watch >= 3 ? { icon: "🌥️", label: "구름 많음", desc: "일부 신호가 흔들립니다. 계획한 분할매수 범위 안에서만 움직이세요.", cls: "from-amber-600 to-slate-700" }
    : { icon: "☀️", label: "맑음", desc: "큰 경고 신호는 없습니다. 그래도 몰빵·추격매수는 금물, 원칙대로 꾸준히.", cls: "from-sky-600 to-emerald-600" };

  const updated = q.updatedAt ? new Date(q.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const routine = [
    { step: "1분", icon: "☀️", title: "오늘의 날씨 보기", desc: "이 화면 맨 위 날씨와 경고 개수만 확인합니다.", link: null as string | null },
    { step: "1분", icon: "📊", title: "코스피 과열 온도", desc: "200일·200주 이격도와 위험도 게이지를 봅니다.", link: "dashboard" },
    { step: "1분", icon: "🌙", title: "밤사이 미국·환율", desc: "미국 선물, 한국 ADR, EWY, 원/달러를 확인합니다.", link: "factcheck" },
    { step: "1분", icon: "📰", title: "뉴스 키워드", desc: "'지금 많이 나오는 키워드'로 시장의 관심사를 봅니다.", link: "news" },
    { step: "1분", icon: "📝", title: "내 계획과 비교", desc: "미리 정한 분할매수 가격·손절 기준과 비교하고, 감정 매매는 하지 않습니다.", link: "decision" },
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔭</span>
        <div>
          <h1 className="text-2xl font-black text-slate-900">투자 망원경</h1>
          <p className="text-slate-500 text-sm">아침 5분, 시장의 날씨를 먼저 보고 오늘의 행동을 정하는 곳</p>
        </div>
      </div>

      {/* 오늘의 시장 날씨 */}
      <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${weather.cls}`}>
        <div className="flex items-start gap-4">
          <div className="text-6xl leading-none">{weather.icon}</div>
          <div className="flex-1">
            <div className="text-xs font-bold opacity-80">오늘의 시장 날씨 · 데이터 기준 {updated}</div>
            <div className="text-3xl font-black mt-1">{weather.label}</div>
            <p className="text-sm opacity-90 mt-1 leading-relaxed">{weather.desc}</p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-white/20">🔴 경고 {warn}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/20">🟡 주의 {watch}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/20">🟢 양호 {checks.filter(c => c.level === "good").length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8가지 망원경 점검 */}
      <div>
        <h2 className="text-lg font-black text-slate-800 mb-1">🔍 망원경으로 보는 8가지 점검</h2>
        <p className="text-xs text-slate-500 mb-3">1시간마다 모으는 공개 데이터로 자동 판정합니다. 하나의 신호보다 여러 신호가 같은 방향인지가 중요해요.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checks.map((c) => {
            const L = LEVEL[c.level];
            return (
              <div key={c.title} className={`rounded-xl border-2 p-4 ${L.cls}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-sm text-slate-800">{c.icon} {c.title}</div>
                  <span className={`text-xs font-black ${L.text}`}>{L.dot} {L.label}</span>
                </div>
                <div className={`text-xl font-black mt-1 ${L.text}`}>{c.value}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.why}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 아침 5분 루틴 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-3">⏱️ 아침 5분 루틴</h2>
        <div className="space-y-2">
          {routine.map((r, i) => (
            <div key={r.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{r.icon} {r.title} <span className="text-[10px] text-slate-400 font-normal">({r.step})</span></div>
                <div className="text-xs text-slate-600">{r.desc}</div>
              </div>
              {r.link && (
                <a href={tabUrl(r.link)} className="shrink-0 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50">열기 →</a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 오늘의 헤드라인 */}
      {news.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-800">📰 지금의 헤드라인</h2>
            <a href={tabUrl("news")} className="text-xs font-bold text-blue-600">뉴스 더 보기 →</a>
          </div>
          <ul className="space-y-2">
            {news.slice(0, 6).map((n) => (
              <li key={n.link}>
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="block text-sm hover:text-blue-700">
                  <span className="font-bold">{n.title}</span>
                  <span className="text-[11px] text-slate-400 ml-2">{n.source}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 대세상승 꺾이는 힌트 섹션 */}
      <div className="border-t-4 border-red-500 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🚨</span>
          <div>
            <h2 className="text-xl font-black text-slate-900">대세 상승장이 꺾이는 신호들</h2>
            <p className="text-slate-500 text-sm">이 신호들이 복합적으로 나타날 때 주의하세요 · 투자 권유 아님</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              icon: "📉",
              category: "기술적 분석 신호 — 왕초보 레슨 포함",
              color: "border-red-400 bg-red-50",
              labelColor: "text-red-700",
              items: [
                "【왕초보 레슨】 이동평균선이란? — 주가의 평균 온도계입니다. 5일선=최근 5일 평균가, 20일선=최근 20일 평균가. 짧은 선이 긴 선 위에 있으면 '오르는 추세', 아래로 내려가면 '내리는 추세'",
                "【일봉 데드크로스】 5일선이 20일선 아래로 교차 — 단기 하락 추세 신호. 비유: 단거리 선수(5일)가 장거리 선수(20일)보다 느려진 것. 단기 매수세가 죽었다는 의미. 하락 전환 확률 약 55~60% (단독 신호 기준)",
                "【주봉 데드크로스】 20주선이 60주선 아래로 교차 — 중기 추세 전환 경고. 비유: 20주=5개월 평균, 60주=15개월 평균. 5개월 추세가 15개월 추세보다 나빠진 것. 한 번 교차하면 회복에 수개월 걸림. 하락 지속 확률 약 65~70%",
                "【월봉 데드크로스】 12개월선이 24개월선 아래로 교차 — 대세 하락 전환의 가장 강한 기술적 신호. 비유: 1년 평균이 2년 평균보다 나빠진 것 = 장기 성장 동력 상실. 역사적으로 대세 하락장의 80% 이상에서 이 신호 선행 발생",
                "【장대음봉 + 거래량 폭증】 하루 거래량이 평소 3배 이상 + 큰 빨간 봉(하락) = 대형 기관이 대규모로 팔고 있다는 신호. 가장 위험한 기술적 경고",
                "【ATH 대비 -20% 공식】 역사적 신고가 대비 -20% 이상 하락 + 이후 반등에서 ATH 갱신 실패 3회 이상 = 공식적으로 약세장(Bear Market) 진입 판정",
              ],
            },
            {
              icon: "📊",
              category: "밸류에이션 과열 신호 — 팩트 검증 포함",
              color: "border-orange-400 bg-orange-50",
              labelColor: "text-orange-700",
              items: [
                "【PBR 팩트 검증】 KOSPI PBR 역사적 고점: 2007년 1.8배, 2021년(KOSPI 3,300 시절) 약 1.5배. 현재 KOSPI 적정 PBR 구간은 0.9~1.1배(저평가~적정). 1.3배 초과 시 경계, 1.5배 초과 시 역사적 고평가 구간 — 팩트 맞음",
                "【PBR이란?】 왕초보 설명: PBR = 주가 ÷ 1주당 순자산. PBR 1배 = 회사 문닫고 자산 팔면 딱 주가만큼 받는다는 뜻. 1배 미만 = 자산보다 싸게 팔리는 것 (저평가). 1.5배 = 자산보다 50% 비싸게 사는 것 (고평가)",
                "【PER 과열 기준】 S&P500 PER 역사 평균 15~17배. 25배 초과 시 고평가 경계. 2000년 닷컴 버블 PER 40배+ (팩트). 단, 금리가 낮을수록 PER 허용치 높아짐 — 맹목적 신뢰는 금물",
                "【쉴러 CAPE】 일반 PER의 업그레이드 버전. 10년 평균 이익으로 계산해 경기 사이클 왜곡 제거. 역사 평균 16배. 30배 초과 시 향후 10년 수익률 저하 확률 높음 (노벨상 수상 로버트 쉴러 연구)",
                "【버핏 지수】 = 전체 주식시총 ÷ GDP. 100% 초과 = 고평가, 150% 초과 = 버블 위험. 2000년 닷컴 버블 때 179% (팩트). 단점: GDP는 국내만 측정, 글로벌 기업 시총은 세계 GDP 기반이라 단순 비교엔 한계",
              ],
            },
            {
              icon: "🏦",
              category: "거시경제·금리 신호",
              color: "border-purple-400 bg-purple-50",
              labelColor: "text-purple-700",
              items: [
                "장단기 금리 역전(10Y-2Y 마이너스 전환): 역사적으로 12~18개월 후 침체 발생. 가장 신뢰도 높은 선행 지표",
                "채권 금리(10년물) 4.5~5% 이상: '무위험 이자'가 충분해 굳이 위험 주식 안 해도 이익 — 주식 매력 급감",
                "Fed 금리 인상 사이클 진행 중 + CPI 재상승: 유동성 긴축이 장기화되면 기업 실적 악화",
                "ISM PMI 50 미만으로 추락: 경기 위축 국면 진입 — 강세장의 핵심 엔진 꺼짐",
                "크레딧 스프레드(회사채-국채 금리차) 급등: 기업 부도 위험 상승, 신용시장 경색 신호",
              ],
            },
            {
              icon: "🆕",
              category: "IPO·시장 과열 신호",
              color: "border-yellow-400 bg-yellow-50",
              labelColor: "text-yellow-700",
              items: [
                "신규 상장(IPO) 폭증: 기업들이 '지금이 최고가'라 판단해 일제히 상장 — 역사적으로 버블 고점 신호",
                "적자 기업 IPO가 흑자 기업보다 많아질 때: 1999~2000년 닷컴 버블 때 재현된 전형적 패턴",
                "공모 첫날 100% 이상 급등 IPO 연속 출현: 투기 과열 극단 신호",
                "테마주·잡주 무차별 폭등: '아무거나 사도 오른다' 분위기 = 버블 막바지 징조",
                "주변 비전문가들(이발사·택시기사)이 주식 추천하기 시작할 때 (버핏의 '이발사 지표')",
              ],
            },
            {
              icon: "🔴",
              category: "버블 붕괴 직전 신호",
              color: "border-red-600 bg-red-100",
              labelColor: "text-red-800",
              items: [
                "고평가 + 거대 거래량 + 긴 장대음봉 동시 출현: 세력 대규모 이탈 시작 — 가장 위험한 조합",
                "대형 우량주가 먼저 꺾이기 시작: 시장 리더(삼성전자·애플·NVIDIA)가 먼저 고점 형성 후 하락",
                "VIX(공포지수) 단기 급등 + 반등 없이 고착: 패닉 매도가 구조화되는 단계",
                "외국인 순매도 10일 이상 연속: 스마트머니가 이미 떠나고 있다는 신호",
                "공매도 잔고 급증 + 개인 신용 매수 급증: 고수는 팔고 초보는 사는 구조 = 최고 위험 구간",
              ],
            },
            {
              icon: "💡",
              category: "실전 체크리스트 — 이 중 3개 이상 동시 발생 시 비중 축소 검토",
              color: "border-slate-400 bg-slate-50",
              labelColor: "text-slate-700",
              items: [
                "□ 장단기 금리 역전 (10Y-2Y 마이너스)",
                "□ PMI 50 미만으로 2개월 연속 하락",
                "□ 월봉 데드크로스 (12개월선 < 24개월선)",
                "□ 채권 금리 5% 이상 (주식 매력 감소)",
                "□ ATH 대비 -25% 이상 + 반등 3회 이상 실패",
                "□ CAPE PER 30배 이상 + 거대 거래량 음봉",
                "□ IPO 폭증 + 적자기업 상장 러시",
                "□ 외국인 20일 이상 연속 순매도",
              ],
            },
          ].map((section, i) => (
            <div key={i} className={`border-l-4 rounded-xl p-4 ${section.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{section.icon}</span>
                <span className={`font-black text-sm ${section.labelColor}`}>{section.category}</span>
              </div>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => (
                  <li key={j} className="text-xs text-slate-700 leading-relaxed flex gap-2">
                    <span className="shrink-0 text-slate-400">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-red-900 to-slate-900 rounded-2xl text-white">
          <div className="font-black text-amber-300 mb-2">⚡ 핵심 원칙</div>
          <div className="text-sm text-slate-200 space-y-1.5">
            <p>▸ 단 하나의 신호로 판단하지 말 것 — 반드시 <strong className="text-white">복합 신호(3개 이상 동시)</strong>를 확인</p>
            <p>▸ 대세 하락장은 갑자기 오지 않음 — 보통 <strong className="text-white">선행 지표가 6~18개월 먼저 경고</strong>를 보냄</p>
            <p>▸ 가장 위험한 순간은 '아무도 위험하다고 생각하지 않을 때' — 탐욕 지수 80+ 구간</p>
            <p>▸ 버핏: <em className="text-amber-200">"남들이 탐욕스러울 때 두려워하고, 남들이 두려워할 때 탐욕스러워라"</em></p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        ⚠️ 투자 망원경의 날씨와 점검 결과는 공개 데이터(Yahoo Finance 등)로 자동 계산한 참고 정보이며, 매수·매도 신호나 투자 권유가 아닙니다. 데이터는 약 1시간마다 갱신되어 실시간과 다를 수 있습니다. 최종 투자 결정은 본인의 판단과 책임 하에 하시기 바랍니다.
      </div>
    </div>
  );
}
