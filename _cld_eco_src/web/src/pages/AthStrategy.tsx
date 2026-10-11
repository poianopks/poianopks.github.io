import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KospiData {
  price?: number | null;
  changePct?: number | null;
  ma200w?: number | null;
  dev200w?: number | null;
}

interface AthStrategyProps {
  kospi?: KospiData | null;
}

const SEC = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    {children}
  </motion.div>
);

const Row = ({ label, val, sub, color = "text-foreground" }: { label: string; val: string; sub?: string; color?: string }) => (
  <div className="flex items-start justify-between py-2 border-b border-border/20 last:border-0 gap-4">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <div className="text-right">
      <span className={`font-bold text-sm ${color}`}>{val}</span>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  </div>
);

const ATH_PRICE = 9385;
const APR_LOW = 2284;

function fmt(v: number, dec = 0) {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: dec });
}

export function AthStrategy({ kospi }: AthStrategyProps) {
  const [openQ, setOpenQ] = useState<number | null>(null);

  const livePrice = kospi?.price ?? null;
  const changePct = kospi?.changePct ?? null;
  const ma200w = kospi?.ma200w ?? null;
  const dev200w = kospi?.dev200w ?? null;

  const displayPrice = livePrice ? fmt(livePrice) : "9,052";
  const displayChangePct = changePct != null
    ? `전일 대비 ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`
    : "장마감 기준";
  const displayMa200w = ma200w ? fmt(ma200w) : "3,365";
  const displayDev200w = dev200w != null
    ? `${dev200w >= 0 ? "+" : ""}${dev200w.toFixed(1)}%`
    : "+169%";
  const aprPct = livePrice
    ? `+${(((livePrice - APR_LOW) / APR_LOW) * 100).toFixed(0)}%`
    : "+311%";
  const athPct = livePrice
    ? `${(((livePrice - ATH_PRICE) / ATH_PRICE) * 100).toFixed(1)}%`
    : "-3.5%";
  const isLive = livePrice != null;

  const qaList = [
    {
      q: "KOSPI 연속 ATH 신기록인데 지금 숏(인버스)을 쳐도 되지 않나?",
      a: `이론적으로는 맞습니다. 하지만 "방향이 맞다"와 "지금 치면 돈이 된다"는 완전히 다른 문제입니다.

ATH 갱신 중인 시장에서 숏을 쳤을 때 실제 일어나는 일:

① 숏을 쳤는데 시장이 2주 더 오릅니다 → 손실 발생
② 손실이 커지면 심리적 압박이 극대화됩니다
③ 결국 "잠깐 오르다 내리겠지" 하고 버티다 강제 손절합니다
④ 손절 직후 폭락이 옵니다

이것이 역사가 반복하는 패턴입니다. 방향이 맞아도 타이밍 하나가 틀리면 전부 잃습니다.`,
    },
    {
      q: "인버스 ETF가 역사적 최저치(역ATH)인데 이건 매수 신호 아닌가?",
      a: `인버스 ETF가 낮다는 건 KOSPI가 높다는 뜻입니다. 이건 매수 신호가 아니라 위험 신호입니다.

더 중요한 것: 인버스 ETF는 "일간 음의 복리" 구조입니다.
- KOSPI가 오늘 +3%, 내일 -3% 하면 본지수는 -0.09%
- 인버스는 오늘 -3%, 내일 +3% → -0.09% (동일하게 손실)
- 즉 시장이 오르락내리락만 해도 인버스는 조금씩 녹습니다

장기 보유할수록 시간이 적이 됩니다.`,
    },
    {
      q: "언젠가 올 폭락인데, 숏으로 미리 기다리면 되지 않나?",
      a: `"언젠가"가 문제입니다. 

1999년 나스닥 버블: "버블이다" 경고가 1997년부터 → 2000년까지 3년 더 올랐습니다
2007년 미 부동산: 2004년 경고 → 2007년까지 3년 더 올랐습니다
2021년 KOSPI 3,300: ATH 경신 후 수개월 횡보·상승 후 하락

이번 KOSPI도 4월 2,284에서 9,385까지 +311% 폭등했습니다.
"버블이다"라고 일찍 숏 쳤다면 이미 3배 손실입니다.

현금은 기다리는 데 비용이 없습니다. 숏은 기다리는 데 비용이 있습니다.`,
    },
    {
      q: "그럼 ATH에서 현금 100% 보유가 최선인가?",
      a: `현금 100%는 매우 합리적이지만, 한 가지 위험이 있습니다: "기회 비용 + 심리적 포모(FOMO)".

시장이 9,000에서 10,000, 11,000으로 계속 오르면 "현금 들고 구경만 한다"는 심리가 쌓입니다.
그 심리가 극에 달한 고점에서 FOMO 매수를 하게 됩니다.

그래서 가장 좋은 구조는:
✅ 현금 90% + 소액 분할매수 10%

소액 참여로 FOMO 심리를 관리하고, 폭락 시 진짜 기회에 90%를 투입합니다.`,
    },
    {
      q: "오르면 이익, 대폭락 와도 살아남는 구조가 가능한가?",
      a: `가능합니다. 핵심은 진입 비중을 작게 유지하는 것입니다.

예시: 투자 가능 자금 1,000만원
- 100만원(10%)만 KOSPI ETF 분할매수
- 나머지 900만원 현금 보유

시나리오 A (10,000 추가 상승): 100만원이 110만원 → +10만원 이익. 아쉽지만 손실 없음.
시나리오 B (폭락 -40%): 100만원이 60만원 → -40만원 손실. 하지만 900만원은 그대로.
→ 이때 600~700만원 추가 투입 기회. 저점 평균단가로 장기 복리 시작.

핵심: 폭락이 손실이 아니라 기회가 되려면, 현금이 충분히 남아 있어야 합니다.`,
    },
    {
      q: "KOSPI 9,052, ATH 경신 상황에서 나라면 어떻게 하겠는가?",
      a: `현재 주식이 없는 상황이라면:

① 숏/인버스 → 절대 하지 않음 (타이밍 불가, 시간 손실, 심리 압박)
② 지금 큰 금액 매수 → 하지 않음 (역사적 극단 과열)
③ 전액 현금 → 기본으로 유지하되, FOMO 관리 필요

내 선택:
현금 90% + 코스피 ETF(KODEX 200 등) 10% 소액 분할매수

매월 또는 10% 조정 때마다 2~3%씩 추가 매수.
폭락(-30% 이상) 시 현금 50% 이상 투입.

이유: "너무 올랐다"는 확신을 숏에 쓰는 것이 아니라,
폭락 때 크게 살 준비금으로 활용하는 것이 확률적으로 훨씬 유리합니다.`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 상단 배너 */}
      <SEC title="banner">
        <div className="rounded-2xl bg-gradient-to-br from-red-950/80 via-red-900/70 to-orange-900/60 border border-red-500/40 p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚡</span>
            <div className="flex-1">
              <h1 className="text-xl font-black tracking-tight">ATH 연속 경신 — 지금 어떻게 할 것인가</h1>
              <p className="text-sm text-red-200 mt-0.5 flex items-center gap-2">
                <span>2026.06 기준 · KOSPI {displayPrice} · 역사적 신고가 9,385 (06/19)</span>
                {isLive && (
                  <span className="inline-flex items-center gap-1 text-emerald-300 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    LIVE
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-red-200 mb-1">현재 KOSPI</div>
              <div className="text-lg font-black text-orange-300">{displayPrice}</div>
              <div className="text-xs text-red-300 mt-0.5">{displayChangePct}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-red-200 mb-1">역사적 ATH</div>
              <div className="text-lg font-black text-red-300">9,385</div>
              <div className="text-xs text-red-300 mt-0.5">
                {livePrice ? `현재 ATH 대비 ${athPct}` : "2026.06.19"}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-red-200 mb-1">4월 저점 대비</div>
              <div className="text-lg font-black text-yellow-300">{aprPct}</div>
              <div className="text-xs text-red-300 mt-0.5">2,284 → {displayPrice}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-red-200 mb-1">200주 이격도</div>
              <div className="text-lg font-black text-amber-300">{displayDev200w}</div>
              <div className="text-xs text-red-300 mt-0.5">MA200주: {displayMa200w}</div>
            </div>
          </div>
        </div>
      </SEC>

      {/* 현재 시장 팩트 */}
      <SEC title="facts">
        <Card className="border-orange-200/40 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>📊</span> 현재 시장 팩트 체크
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-bold text-orange-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                  KOSPI 현황
                  {isLive && <span className="flex items-center gap-1 text-emerald-500 normal-case font-bold text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />실시간</span>}
                </div>
                <Row label="현재가" val={displayPrice} sub={displayChangePct} color="text-orange-600" />
                <Row label="역사적 ATH" val="9,385" sub={livePrice ? `현재 대비 ATH ${athPct}` : "2026.06.19"} color="text-red-600" />
                <Row label="4월 9일 저점" val="2,284" sub="트럼프 관세 충격 저점" />
                <Row label="저점 대비 상승" val={aprPct} sub={`2,284 → ${displayPrice}`} color="text-red-600" />
                <Row label="1년 상승률" val="약 +200%" color="text-red-600" />
                <Row label="200주 이동평균" val={displayMa200w} sub={`현재가 대비 ${displayDev200w} 위`} />
                <Row label="200주 이격도" val={displayDev200w} sub="역사적 극단 과열" color="text-red-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wide">배경 요인</div>
                {[
                  { icon: "🤖", text: "AI 반도체 수퍼사이클 — 삼성·SK하이닉스 쏠림 주도" },
                  { icon: "📉", text: "트럼프 관세 충격 후 급반등 — 4월 저점이 너무 낮았음" },
                  { icon: "💰", text: "빚투(신용융자) 급증 — 개인 레버리지 극대화" },
                  { icon: "📈", text: "FOMO 매수 급증 — '더 오를 것 같다' 심리 확산" },
                  { icon: "🌐", text: "나스닥은 적당히 오름 — KOSPI만 극단적 폭등" },
                  { icon: "⚠️", text: "반도체 2~3종목 쏠림 — 지수 왜곡 위험" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </SEC>

      {/* 숏이 불리한 이유 */}
      <SEC title="why-short-bad">
        <Card className="border-red-200/40 bg-red-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>📉</span> ATH에서 숏이 불리한 이유 — 6가지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  num: "①",
                  title: "타이밍 불가능",
                  desc: "버블이 얼마나 더 갈지 아무도 모릅니다. 1999년 나스닥은 '버블' 경고 3년 후에 터졌습니다. 지금 숏 치면 9,000→10,000→11,000 구간을 손실 보며 버텨야 합니다.",
                  badge: "핵심",
                  badgeColor: "bg-red-100 text-red-700",
                },
                {
                  num: "②",
                  title: "인버스 ETF 시간 손실",
                  desc: "인버스 ETF는 일간 리밸런싱 구조입니다. 지수가 오르락내리락만 해도 인버스는 조금씩 녹습니다. 오래 보유할수록 손실이 쌓입니다.",
                  badge: "비용",
                  badgeColor: "bg-orange-100 text-orange-700",
                },
                {
                  num: "③",
                  title: "심리적 압박 → 강제 손절",
                  desc: "숏 보유 중 시장이 3~5% 더 오르면 손실이 커집니다. 대부분 '잠깐 오르다 내리겠지' 버티다 강제 손절. 손절 직후 폭락이 오는 패턴이 반복됩니다.",
                  badge: "심리",
                  badgeColor: "bg-purple-100 text-purple-700",
                },
                {
                  num: "④",
                  title: "방향이 맞아도 수익이 없다",
                  desc: "폭락 시 패닉 후 빠른 반등이 옵니다. 어디서 숏 청산할지도 어렵습니다. 저점을 잡아 청산하지 못하면 반등에 수익을 반납합니다.",
                  badge: "청산",
                  badgeColor: "bg-blue-100 text-blue-700",
                },
                {
                  num: "⑤",
                  title: "ATH는 매수 심리 우위 증거",
                  desc: "ATH 경신 자체가 현재 매수세 > 매도세임을 의미합니다. 이 흐름에 역행하는 것은 방향의 문제가 아니라 세력의 방향과 싸우는 것입니다.",
                  badge: "추세",
                  badgeColor: "bg-yellow-100 text-yellow-700",
                },
                {
                  num: "⑥",
                  title: "현금은 시간 비용이 없다",
                  desc: "현금을 들고 기다리는 데 드는 비용은 0입니다. 숏을 들고 기다리는 데 드는 비용은 음의 복리입니다. 확률적으로 현금이 항상 유리합니다.",
                  badge: "확률",
                  badgeColor: "bg-emerald-100 text-emerald-700",
                },
              ].map((item) => (
                <div key={item.num} className="bg-white/60 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-black text-red-400 text-lg">{item.num}</span>
                    <span className="font-bold text-sm">{item.title}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>{item.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </SEC>

      {/* 3가지 선택 비교 */}
      <SEC title="choices">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>⚖️</span> 지금 선택지 비교 — 현금 없는 상태에서 주식 없다면
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: "📉",
                  title: "숏 / 인버스",
                  verdict: "강비추천",
                  verdictColor: "bg-red-100 text-red-700 border-red-200",
                  cardColor: "border-red-200/50 bg-red-50/20",
                  pros: [],
                  cons: [
                    "타이밍 맞추기 불가능",
                    "인버스 ETF 시간 손실",
                    "심리 압박 → 강제 손절",
                    "방향 맞아도 수익 미실현",
                    "이미 역ATH = 너무 늦음",
                  ],
                  summary: "가장 위험한 선택. 방향이 맞아도 확률적으로 손해.",
                },
                {
                  icon: "💰",
                  title: "현금 100% 보유",
                  verdict: "합리적",
                  verdictColor: "bg-amber-100 text-amber-700 border-amber-200",
                  cardColor: "border-amber-200/50 bg-amber-50/20",
                  pros: [
                    "손해 없음 — 원금 100% 보전",
                    "폭락 시 대규모 진입 가능",
                    "시간 비용 없음",
                    "정신적 여유 유지",
                  ],
                  cons: [
                    "FOMO 심리 — 계속 오를 때 괴로움",
                    "기회비용 일부 발생",
                    "심리적 한계로 고점에 결국 매수 위험",
                  ],
                  summary: "좋은 선택이지만 FOMO 관리가 핵심 과제.",
                },
                {
                  icon: "✅",
                  title: "현금 90% + 소액 분할매수 10%",
                  verdict: "최선",
                  verdictColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
                  cardColor: "border-emerald-200/50 bg-emerald-50/30",
                  pros: [
                    "오르면 소액이지만 이익 참여",
                    "폭락 와도 90%로 역습 기회",
                    "FOMO 심리 자연스럽게 관리",
                    "손실 최소화 구조",
                    "어떤 결과에도 살아남음",
                  ],
                  cons: [
                    "오를 때 수익이 적음",
                    "인내심 필요",
                  ],
                  summary: "오르면 소이익, 폭락 시 대기회. 어떤 시나리오에도 생존.",
                },
              ].map((c) => (
                <div key={c.title} className={`rounded-xl border p-4 ${c.cardColor}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <div className="font-bold text-sm">{c.title}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${c.verdictColor}`}>{c.verdict}</span>
                    </div>
                  </div>
                  {c.pros.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-emerald-600 mb-1">장점</div>
                      {c.pros.map((p, i) => <div key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-emerald-500">✓</span>{p}</div>)}
                    </div>
                  )}
                  {c.cons.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-red-500 mb-1">단점·위험</div>
                      {c.cons.map((p, i) => <div key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-red-400">✗</span>{p}</div>)}
                    </div>
                  )}
                  <div className="bg-white/60 rounded-lg p-2 text-xs text-muted-foreground border border-border/20">{c.summary}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </SEC>

      {/* 오르면 이익, 폭락도 기회 구조 */}
      <SEC title="structure">
        <Card className="border-emerald-200/40 bg-emerald-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>🏗️</span> "오르면 이익, 폭락도 기회" — 실전 구조 설계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-white/70 rounded-xl p-4 border border-emerald-100">
              <div className="font-bold text-sm mb-3 text-emerald-700">📐 기본 비중 설계 (예: 투자 가능 자금 1,000만원)</div>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: "현금 보유", pct: "90%", amt: "900만원", desc: "폭락 시 투입 대기 자금", color: "bg-blue-50 border-blue-200 text-blue-700" },
                  { label: "KOSPI ETF 소액 분할", pct: "10%", amt: "100만원", desc: "FOMO 관리 + 상승 참여", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                  { label: "숏/인버스", pct: "0%", amt: "0원", desc: "절대 하지 않음", color: "bg-red-50 border-red-200 text-red-700" },
                ].map(item => (
                  <div key={item.label} className={`rounded-lg p-3 border ${item.color}`}>
                    <div className="text-xs mb-1">{item.label}</div>
                    <div className="text-2xl font-black">{item.pct}</div>
                    <div className="text-sm font-bold">{item.amt}</div>
                    <div className="text-xs opacity-70 mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-xl p-4 border border-blue-100">
                <div className="font-bold text-sm mb-3 text-blue-700">📈 시나리오 A: 추가 상승 (→ 10,000)</div>
                <div className="space-y-1.5">
                  {[
                    { label: "100만원 → 110만원", good: true, desc: "+10만원 소이익" },
                    { label: "900만원 현금 유지", good: true, desc: "원금 100% 보전" },
                    { label: "전체 수익률", good: true, desc: "+1% (손해 없음)" },
                    { label: "FOMO 없음", good: true, desc: "소액 참여로 심리 관리됨" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={r.good ? "text-emerald-500" : "text-red-400"}>{r.good ? "✓" : "✗"}</span>
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground ml-auto">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-orange-100">
                <div className="font-bold text-sm mb-3 text-orange-700">📉 시나리오 B: 대폭락 (-40% → 5,400)</div>
                <div className="space-y-1.5">
                  {[
                    { label: "100만원 → 60만원", good: false, desc: "-40만원 손실" },
                    { label: "900만원 현금 → 기회", good: true, desc: "저점 대규모 투입 가능" },
                    { label: "500~700만원 추가 매수", good: true, desc: "평균단가 대폭 낮춤" },
                    { label: "폭락이 기회가 됨", good: true, desc: "장기 복리의 시작점" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={r.good ? "text-emerald-500" : "text-red-400"}>{r.good ? "✓" : "✗"}</span>
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground ml-auto">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-900/80 to-blue-900/80 rounded-xl p-4 text-white">
              <div className="font-black text-sm mb-2">🎯 핵심 원칙</div>
              <div className="text-sm leading-relaxed text-emerald-100">
                "너무 올랐다"는 확신을 <strong className="text-red-300">숏에 쓰지 말고</strong>,
                폭락 때 크게 살 준비금(현금)으로 활용하라.<br />
                폭락이 손실이 아니라 <strong className="text-yellow-300">기회가 되려면</strong>,
                현금이 충분히 남아 있어야 한다.
              </div>
            </div>
          </CardContent>
        </Card>
      </SEC>

      {/* 분할매수 실전 플랜 */}
      <SEC title="plan">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>📋</span> 분할매수 실전 플랜 — 언제 얼마나 살 것인가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">상황</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">KOSPI 레벨</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">추가 매수 비중</th>
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { situation: "현재 (ATH 경신)", level: "9,000~9,500", pct: "10% (소액)", desc: "FOMO 관리용 최소 참여", color: "text-orange-600" },
                    { situation: "횡보·소조정", level: "8,000~9,000", pct: "+5% (누적 15%)", desc: "조정 시 소폭 추가", color: "text-yellow-600" },
                    { situation: "1차 조정 -15%", level: "약 7,600", pct: "+10% (누적 25%)", desc: "첫 번째 의미있는 조정", color: "text-amber-600" },
                    { situation: "2차 조정 -25%", level: "약 6,800", pct: "+15% (누적 40%)", desc: "본격적인 하락 신호", color: "text-orange-700" },
                    { situation: "대폭락 -40%", level: "약 5,400", pct: "+30% (누적 70%)", desc: "패닉 저점 — 역습 기회", color: "text-red-600" },
                    { situation: "극단 폭락 -55%", level: "약 4,000", pct: "+20% (누적 90%)", desc: "IMF급 — 전재산 투입 구간", color: "text-red-700" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="py-2.5 pr-4 font-medium text-sm">{row.situation}</td>
                      <td className="py-2.5 pr-4 text-sm text-muted-foreground">{row.level}</td>
                      <td className={`py-2.5 pr-4 font-bold text-sm ${row.color}`}>{row.pct}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              ⚠️ 위 수치는 예시입니다. 개인 재정상황, 리스크 허용 범위에 맞게 조정하세요. 투자 권유가 아닌 구조적 사고 프레임입니다.
            </div>
          </CardContent>
        </Card>
      </SEC>

      {/* 여유자금 규모별 비교 */}
      <SEC title="capital-size">
        <Card className="border-blue-200/40 bg-blue-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>💰</span> 여유자금 규모별 비교 — 1,000만원 vs 1억원
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/70 rounded-xl p-4 border border-blue-100">
              <div className="text-sm font-bold text-blue-700 mb-3">핵심 원칙: 비율은 같다, 선택지가 넓어질 뿐</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-muted-foreground">항목</th>
                      <th className="text-center py-2 pr-3 text-xs font-semibold text-blue-600">여유자금 1,000만원</th>
                      <th className="text-center py-2 text-xs font-semibold text-emerald-600">여유자금 1억원</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "초기 투입(10%)", a: "100만원", b: "1,000만원", note: "비율 동일" },
                      { label: "현금 보유(90%)", a: "900만원", b: "9,000만원", note: "비율 동일" },
                      { label: "분산 종목", a: "ETF 1~2종목", b: "ETF + 삼성·SK 개별주", note: "1억은 분산 가능" },
                      { label: "단계별 추가 여력", a: "제한적", b: "풍부함", note: "1억이 유리" },
                      { label: "폭락 -40% 시 투입", a: "300~500만원", b: "3,000~5,000만원", note: "비율 동일" },
                      { label: "심리적 부담", a: "상대적으로 낮음", b: "금액이 커 부담 클 수 있음", note: "규모 주의" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="py-2.5 pr-3 text-xs font-medium">{row.label}</td>
                        <td className="py-2.5 pr-3 text-xs text-center text-blue-700 font-medium">{row.a}</td>
                        <td className="py-2.5 text-xs text-center text-emerald-700 font-medium">{row.b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
                <div className="font-bold text-sm text-blue-700 mb-3">💼 1,000만원 기준 플랜</div>
                {[
                  { label: "현금 보유", amt: "900만원 (90%)", color: "text-blue-600" },
                  { label: "KOSPI ETF 분할매수", amt: "100만원 (10%)", color: "text-emerald-600" },
                  { label: "매월 추가", amt: "10~20만원씩", color: "text-slate-600" },
                  { label: "폭락 -40% 시", amt: "300~500만원 투입", color: "text-orange-600" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/20 last:border-0 text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={`font-bold ${r.color}`}>{r.amt}</span>
                  </div>
                ))}
                <div className="mt-3 text-xs text-muted-foreground bg-white/60 rounded-lg p-2">
                  ETF 집중, 단순하게 유지. KODEX 200 또는 TIGER 200 1~2개면 충분.
                </div>
              </div>
              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
                <div className="font-bold text-sm text-emerald-700 mb-3">💼 1억원 기준 플랜</div>
                {[
                  { label: "현금 보유", amt: "9,000만원 (90%)", color: "text-blue-600" },
                  { label: "KOSPI ETF", amt: "500만원 (5%)", color: "text-emerald-600" },
                  { label: "삼성전자 소액", amt: "300만원 (3%)", color: "text-emerald-600" },
                  { label: "SK하이닉스 소액", amt: "200만원 (2%)", color: "text-emerald-600" },
                  { label: "폭락 -40% 시", amt: "3,000~5,000만원 투입", color: "text-orange-600" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/20 last:border-0 text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={`font-bold ${r.color}`}>{r.amt}</span>
                  </div>
                ))}
                <div className="mt-3 text-xs text-muted-foreground bg-white/60 rounded-lg p-2">
                  1억이면 개별주 소액 추가 분산이 가능. 단, 초기 10% 한도는 동일하게 엄수.
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 text-white text-sm">
              <span className="font-black text-yellow-300">결론: </span>
              <span className="text-slate-200">1,000만원이든 1억이든 </span>
              <span className="font-bold text-emerald-300">초기 투입 비율 10%는 동일합니다.</span>
              <span className="text-slate-200"> 금액이 커질수록 분산 종목이 늘어날 뿐, 현금 90% 보유 원칙은 변하지 않습니다. 오히려 1억이라면 금액이 크기 때문에 더욱 철저히 비율 규율을 지켜야 심리 압박 없이 폭락 기회를 활용할 수 있습니다.</span>
            </div>
          </CardContent>
        </Card>
      </SEC>

      {/* 반도체 AI 사이클 분석 */}
      <SEC title="semi-cycle">
        <Card className="border-purple-200/40 bg-purple-50/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>🔬</span> 반도체 AI 중기 사이클 — 시스코 2000 vs 엔비디아 지금
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* KOSPI 세계 1위 */}
            <div className="bg-red-50/60 rounded-xl p-4 border border-red-200/40">
              <div className="font-bold text-sm text-red-700 mb-3">🌍 현재 KOSPI — 세계 주요 지수 1년 상승률 비교</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "KOSPI (한국)", val: "약 +200%", color: "text-red-600 bg-red-50 border-red-200", badge: "🥇 세계 1위" },
                  { label: "나스닥 100", val: "약 +30~40%", color: "text-blue-600 bg-blue-50 border-blue-200", badge: "적당한 상승" },
                  { label: "S&P 500", val: "약 +20~25%", color: "text-emerald-600 bg-emerald-50 border-emerald-200", badge: "정상 강세장" },
                  { label: "일본·유럽", val: "약 +10~20%", color: "text-slate-600 bg-slate-50 border-slate-200", badge: "완만한 상승" },
                ].map((item, i) => (
                  <div key={i} className={`rounded-lg p-3 border text-center ${item.color}`}>
                    <div className="text-xs mb-1">{item.badge}</div>
                    <div className="font-black text-base">{item.val}</div>
                    <div className="text-xs mt-1 opacity-70">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-muted-foreground bg-white/70 rounded-lg p-3">
                ⚠️ KOSPI가 세계 1위 상승률이라는 것은 "이미 가장 많이 올랐다"는 뜻이기도 합니다.
                나스닥·S&P는 적당히 올랐는데 KOSPI만 극단적으로 튄 이유 → 삼성·SK하이닉스 반도체 쏠림.
                쏠림은 오를 때 더 빠르게 오르고, 빠질 때도 더 빠르게 빠집니다.
              </div>
            </div>

            {/* 반도체 사이클 특성 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-xl p-4 border border-purple-100">
                <div className="font-bold text-sm text-purple-700 mb-3">📊 반도체 주식의 특성</div>
                {[
                  { icon: "⚡", title: "경기민감주", desc: "경기 호황 시 급등, 불황 시 급락. 방어주와 반대 성격." },
                  { icon: "💸", title: "금리 민감", desc: "금리 상승 시 PER 압축 → 주가 부담. 고금리 환경에서 고PER 종목은 불리." },
                  { icon: "🔄", title: "사이클 반복", desc: "수요 폭발 → 과잉공급 → 가격 하락 → 구조조정 → 다시 수요 폭발. 이 사이클이 반복." },
                  { icon: "⏰", title: "중기 사이클", desc: "AI 반도체 수요는 실재하지만, 슈퍼사이클보다는 3~5년 중기 사이클에 가까움. 수요가 공급을 이기는 시간에 한계 존재." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 py-2 border-b border-border/20 last:border-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div>
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-orange-100">
                <div className="font-bold text-sm text-orange-700 mb-3">💡 방향은 맞아도 타이밍을 못 맞추는 이유</div>
                {[
                  { step: "①", text: "반도체 사이클 정점이 언제인지 아무도 모릅니다" },
                  { step: "②", text: "수요가 실재해도 주가는 수요보다 훨씬 먼저 움직입니다" },
                  { step: "③", text: "공급 과잉 신호는 주가가 이미 빠진 후에 확인됩니다" },
                  { step: "④", text: "금리 변화, 달러 환율, 미중 관계 등 외부 변수가 예측 불가합니다" },
                  { step: "⑤", text: "AI 수요 둔화 신호가 나와도 주가는 먼저 -30~50% 빠진 후입니다" },
                  { step: "⑥", text: "결론: 방향(하락할 것)은 맞아도, 타이밍(언제)은 영원히 모릅니다" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 py-2 border-b border-border/20 last:border-0 text-xs">
                    <span className="font-black text-orange-400 shrink-0">{item.step}</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시스코 vs 엔비디아 */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/40">
              <div className="font-bold text-sm text-slate-700 mb-4">🔀 시스코 2000 vs 엔비디아 지금 — 역사의 거울</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">비교 항목</th>
                      <th className="text-center py-2 pr-4 text-xs font-semibold text-blue-600">시스코 (2000년)</th>
                      <th className="text-center py-2 text-xs font-semibold text-green-600">엔비디아 (2025년)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { item: "핵심 기술", cisco: "인터넷 네트워크 장비", nvda: "AI GPU 가속 칩" },
                      { item: "기술의 실재성", cisco: "✅ 진짜였음", nvda: "✅ 진짜임" },
                      { item: "당시/현재 역할", cisco: "인터넷 인프라 독점", nvda: "AI 학습 인프라 독점" },
                      { item: "고점 PER", cisco: "PER 150~200배", nvda: "PER 40~60배+" },
                      { item: "고점 이후 하락", cisco: "-88% (3년간)", nvda: "?" },
                      { item: "이익 실현 시점", cisco: "고점 후 20년 이상", nvda: "?" },
                      { item: "기술이 세상 바꿨나", cisco: "✅ 인터넷 세상 바꿈", nvda: "✅ AI 세상 바꿀 것" },
                      { item: "주가가 그만큼 올랐나", cisco: "❌ -88% 후 20년 회복 못 함", nvda: "?" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="py-2.5 pr-4 text-xs font-medium text-muted-foreground">{row.item}</td>
                        <td className="py-2.5 pr-4 text-xs text-center">{row.cisco}</td>
                        <td className="py-2.5 text-xs text-center">{row.nvda}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <div className="font-bold text-xs text-red-700 mb-1">핵심 교훈</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    기술이 맞아도 주가가 틀릴 수 있습니다.<br />
                    시스코는 인터넷 인프라를 지배했고, 인터넷은 실제로 세상을 바꿨습니다.<br />
                    하지만 주가는 고점 대비 <strong className="text-red-600">-88%</strong> 하락 후 <strong className="text-red-600">20년이 지나도 고점 미회복.</strong>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="font-bold text-xs text-amber-700 mb-1">KOSPI + 삼성·SK 적용</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    AI 반도체 수요는 실재합니다. 하지만 KOSPI 200% 상승은 그 수요를 이미 수년치 선반영했을 수 있습니다.<br />
                    기술의 승리 ≠ 주가의 승리.<br />
                    <strong className="text-amber-700">중기 사이클</strong>로 보는 시각이 더 현실적입니다.
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </SEC>

      {/* Q&A 섹션 */}
      <SEC title="qa">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>💬</span> ATH 투자 핵심 Q&A — 자주 하는 질문
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {qaList.map((item, i) => (
              <div key={i} className="border border-border/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenQ(openQ === i ? null : i)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <span className="text-blue-500 font-black text-sm shrink-0 mt-0.5">Q{i + 1}</span>
                  <span className="text-sm font-medium flex-1">{item.q}</span>
                  <span className="text-muted-foreground text-xs shrink-0 mt-0.5">{openQ === i ? "▲" : "▼"}</span>
                </button>
                {openQ === i && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="bg-muted/30 rounded-lg p-4 ml-7">
                      <div className="text-xs font-bold text-emerald-600 mb-2">A</div>
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{item.a}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </SEC>

      {/* 최종 결론 */}
      <SEC title="conclusion">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 border border-emerald-500/30 p-6 text-white">
          <div className="text-center mb-5">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-black text-lg">최종 결론 — 나라면 이렇게 한다</div>
            <div className="text-sm text-slate-300 mt-1">KOSPI 9,052 · 주식 없는 상황 기준</div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div className="bg-red-900/40 border border-red-500/30 rounded-xl p-4">
              <div className="font-bold text-red-300 text-sm mb-2">❌ 하지 않을 것</div>
              {["숏/인버스 — 절대 하지 않음", "지금 큰 금액 매수 — 하지 않음", "전액 현금만 — FOMO 위험으로 지양"].map((t, i) => (
                <div key={i} className="text-sm text-red-200 flex gap-2 py-0.5"><span>•</span>{t}</div>
              ))}
            </div>
            <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-4">
              <div className="font-bold text-emerald-300 text-sm mb-2">✅ 실행할 것</div>
              {[
                "현금 90% 보유 — 폭락 대기 자금",
                "KOSPI ETF 10% 소액 분할매수",
                "10% 하락마다 2~3%씩 추가",
                "폭락 -40% 이상 시 50% 이상 투입",
              ].map((t, i) => (
                <div key={i} className="text-sm text-emerald-200 flex gap-2 py-0.5"><span>•</span>{t}</div>
              ))}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-yellow-300 font-black text-base mb-1">
              확신을 숏에 쓰지 말고, 현금에 담아라
            </div>
            <div className="text-sm text-slate-300">
              폭락이 <span className="text-red-300">손실</span>이 되려면 현금이 없어야 한다.<br />
              폭락이 <span className="text-emerald-300">기회</span>가 되려면 현금이 충분해야 한다.
            </div>
          </div>
        </div>
      </SEC>
    </div>
  );
}
