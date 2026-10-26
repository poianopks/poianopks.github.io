import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { useStockData } from "@/hooks/useStockData";

type StockDataT = ReturnType<typeof useStockData>;

import scenariosChartA from "@assets/Screenshot_20260607_132419_Samsung_Browser_1780809644573.jpg";
import scenariosChartB from "@assets/Screenshot_20260607_132403_Samsung_Browser_1780809644577.jpg";

const scenarios = [
  {
    id: "A",
    label: "시나리오 A",
    name: "평균회귀 (가격 조정)",
    prob: 47,
    color: "#ef4444",
    borderClass: "border-destructive/50",
    bgClass: "bg-destructive/5",
    probColor: "text-destructive",
    icon: "📉",
    targets: [
      { label: "1년 후 목표", value: "5,500 ~ 6,500" },
      { label: "2년 후 목표", value: "4,800 ~ 5,500" },
      { label: "MA200 수렴 목표", value: "3,081 (±20%)" },
      { label: "최대 낙폭", value: "-40% ~ -45%", danger: true },
    ],
    basis: "역사적 유사 사례 5회 중 5회(100%) 큰 폭락. 과거 평균 낙폭 -42.9%. 작성 당시(6월 고점) 이격도 +67%는 과거 최대 수준이었음.",
    historical: "1999년 닷컴버블(-41%), 2007년 금융위기(-53%), 2021년 코로나버블(-32%)",
    warning: "이 시나리오에서 지금 코스피 신규 매수는 최대 -45% 손실 가능성이 있습니다.",
  },
  {
    id: "B",
    label: "시나리오 B",
    name: "기간 조정 (횡보)",
    prob: 33,
    color: "#f59e0b",
    borderClass: "border-amber-500/50",
    bgClass: "bg-amber-500/5",
    probColor: "text-amber-400",
    icon: "↔️",
    targets: [
      { label: "박스권 범위", value: "7,500 ~ 9,000" },
      { label: "횡보 기간", value: "2~4년 예상" },
      { label: "MA200 수렴 방식", value: "이평선 상승으로 해소" },
      { label: "최대 낙폭", value: "-15% ~ -20%", danger: true },
    ],
    basis: "AI 산업 구조 성장이 지속되며 시장이 이익 성장으로 이격도를 서서히 해소하는 시나리오.",
    historical: "2014~2017년 코스피 박스권(1,900~2,200pt), 미국 2014~2016년 완만한 조정",
    warning: "이 경우에도 단기적으로는 변동성이 크며, 진입 시점에 따라 수익률 편차가 큽니다.",
  },
  {
    id: "C",
    label: "시나리오 C",
    name: "새 패러다임 (추가 상승)",
    prob: 20,
    color: "#10b981",

    borderClass: "border-emerald-500/50",
    bgClass: "bg-emerald-500/5",
    probColor: "text-emerald-400",
    icon: "🚀",
    targets: [
      { label: "1년 목표 (낙관)", value: "10,000 ~ 12,000" },
      { label: "이격도 추가 확대", value: "+100~150%" },
      { label: "이후 리스크", value: "일본형 대폭락", danger: true },
      { label: "최대 낙폭 (이후)", value: "-50% ~ -70%", danger: true },
    ],
    basis: "AI·반도체 산업이 새 패러다임을 만들며 기존 이평선 틀을 벗어나는 시나리오. 일본 닛케이 1987~1990년 참고.",
    historical: "1999년 나스닥 닷컴버블 최고점까지 2년 추가 상승 후 -78% 대폭락.",
    warning: "이 시나리오를 믿고 추격매수할 경우, 이후 폭락 시 회복에 20~30년이 걸릴 수 있습니다.",
  },
];

const pieData = scenarios.map((s) => ({ name: `${s.id}: ${s.name.split(" ")[0]}`, value: s.prob, color: s.color }));

// 시나리오 기준 고점(2026.06.19 ATH)과 각 시나리오의 1년 범위 — 지금 코스피가 어느 쪽에 가까운지 자동 표시
const ATH_2026 = 9385;
const scenarioRanges = [
  { id: "A", name: "평균회귀", low: 5500, high: 6500 },
  { id: "B", name: "기간 조정", low: 7500, high: 9000 },
  { id: "C", name: "추가 상승", low: 10000, high: 12000 },
];

function nearestScenario(kospi: number) {
  const inside = scenarioRanges.find((r) => kospi >= r.low && kospi <= r.high);
  if (inside) return { ...inside, inside: true };
  const dist = (r: typeof scenarioRanges[number]) => (kospi < r.low ? r.low - kospi : kospi - r.high);
  return { ...scenarioRanges.reduce((a, b) => (dist(b) < dist(a) ? b : a)), inside: false };
}

export function Scenarios({ stockData }: { stockData?: StockDataT }) {
  const [active, setActive] = useState<string>("A");
  const selected = scenarios.find((s) => s.id === active)!;
  const kospi = stockData?.kospi;
  const now = kospi && kospi.price > 0 ? kospi.price : null;
  const near = now ? nearestScenario(now) : null;

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-purple-500 pl-6 py-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">KOSPI 미래 3가지 시나리오</h2>
        <p className="text-muted-foreground mt-1">2026.06 ~ 2029.06 | 역사적 데이터 + 현재 구조 변수 기반 (확률·근거는 2026년 6월 고점 당시 작성)</p>
      </div>

      {now && near && (
        <Card className="border-2 border-purple-300">
          <CardContent className="pt-5 pb-5 space-y-2">
            <div className="text-xs font-bold text-purple-700">📡 지금 코스피는 어느 시나리오에 가까울까? (GitHub Actions 1시간마다 자동 갱신)</div>
            <div className="text-lg font-black">
              코스피 {Math.round(now).toLocaleString("ko-KR")} · 고점({ATH_2026.toLocaleString("ko-KR")}) 대비{" "}
              {(((now - ATH_2026) / ATH_2026) * 100).toFixed(1)}%
              {kospi?.dev200d != null && <> · 200일 이격 {kospi.dev200d >= 0 ? "+" : ""}{kospi.dev200d.toFixed(2)}%</>}
            </div>
            <p className="text-sm">
              {near.inside
                ? <>현재 값이 <strong>시나리오 {near.id}({near.name})</strong>의 1년 범위 {near.low.toLocaleString("ko-KR")}~{near.high.toLocaleString("ko-KR")} <strong>안</strong>에 있습니다.</>
                : <>현재 값은 <strong>시나리오 {near.id}({near.name})</strong> 범위 {near.low.toLocaleString("ko-KR")}~{near.high.toLocaleString("ko-KR")}에 가장 가깝습니다.</>}
            </p>
            <p className="text-xs text-muted-foreground">
              ※ 아래 확률(47/33/20%)과 근거 문장은 6월 고점(200일 이격 +67%) 기준이라 지금 상황과 다를 수 있어요. 숫자는 실시간, 해석은 참고용입니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 시나리오 확률 파이 + 선택 탭 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">시나리오별 발생 확률</CardTitle>
            <CardDescription className="text-xs">근거: KOSPI 이격 +60% 5번 사례 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} opacity={active === scenarios[i].id ? 1 : 0.4} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                    formatter={(v: any, _: any, p: any) => [`${v}%`, p.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {scenarios.map((s) => (
                <button key={s.id} onClick={() => setActive(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                    active === s.id ? `${s.borderClass} ${s.bgClass} ring-1 ring-current` : "border-border/30 hover:bg-slate-50"
                  }`}>
                  <span className="flex items-center gap-2">
                    <span>{s.icon}</span>
                    <span className="font-medium">{s.label}</span>
                  </span>
                  <span className={`font-black text-lg ${s.probColor}`}>{s.prob}%</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`lg:col-span-2 border ${selected.borderClass} ${selected.bgClass}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{selected.icon}</span>
              <div>
                <div className={`text-xs font-bold mb-1 ${selected.probColor}`}>
                  {selected.label} — 발생 확률 {selected.prob}%
                </div>
                <CardTitle className="text-xl">{selected.name}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {selected.targets.map((t) => (
                <div key={t.label} className={`p-3 rounded-lg border ${t.danger ? "border-destructive/30 bg-red-50" : "border-border/30 bg-slate-50"}`}>
                  <div className="text-xs text-muted-foreground mb-1">{t.label}</div>
                  <div className={`font-black text-sm ${t.danger ? "text-destructive" : ""}`}>{t.value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-border/30">
                <strong className="text-xs text-muted-foreground uppercase tracking-wide">근거</strong>
                <p className="mt-1 text-sm leading-relaxed">{selected.basis}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-border/30">
                <strong className="text-xs text-muted-foreground uppercase tracking-wide">역사적 참조</strong>
                <p className="mt-1 text-xs text-muted-foreground">{selected.historical}</p>
              </div>
              <div className={`p-3 rounded-lg border ${selected.borderClass}`}>
                <strong className="text-xs uppercase tracking-wide">⚠️ 핵심 경고</strong>
                <p className="mt-1 text-xs leading-relaxed">{selected.warning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시나리오 차트 — 젠스파크 실제 이미지 */}
      <Card className="border-purple-500/30">
        <CardHeader className="pb-3">
          <CardTitle>📈 KOSPI 미래 3가지 시나리오 차트</CardTitle>
          <CardDescription>2026.06 ~ 2029.06 예측 | 역사 데이터 기반 | 빨강: A(평균회귀) 노랑: B(횡보) 초록: C(추가상승)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg overflow-hidden border border-purple-500/20 bg-white/80">
            <img src={scenariosChartA} alt="KOSPI 미래 3가지 시나리오 차트" className="w-full h-auto object-contain" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-destructive font-black text-base">A: 50%</div>
              <div className="text-muted-foreground">평균회귀 가격 조정</div>
              <div className="text-destructive font-bold">-40~45%</div>
            </div>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="text-amber-400 font-black text-base">B: 30%</div>
              <div className="text-muted-foreground">기간 조정 횡보</div>
              <div className="text-amber-400 font-bold">-15~20%</div>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="text-emerald-400 font-black text-base">C: 20%</div>
              <div className="text-muted-foreground">새 패러다임 추가 상승</div>
              <div className="text-destructive font-bold">나중에 -50~70%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결론 카드 */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-5 pb-5">
          <div className="text-center mb-4">
            <span className="text-2xl font-black text-amber-400">✅ 결론</span>
            <p className="text-lg font-bold mt-2">한국 증시가 예외에 해당할 가능성은 <span className="text-amber-400">완전히 없지 않음</span> (20~30%)</p>
            <p className="text-sm text-muted-foreground mt-1">따라서 3가지 시나리오를 모두 대비한 전략이 필요합니다</p>
          </div>
          <div className="rounded-lg overflow-hidden border border-amber-500/20 bg-white/80">
            <img src={scenariosChartB} alt="KOSPI 시나리오 결론 차트" className="w-full h-auto object-contain" />
          </div>
        </CardContent>
      </Card>

      {/* 대응 전략 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🎯 시나리오별 권장 대응 전략</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                scenario: "A 대비 (50%)",
                color: "border-destructive/40 bg-destructive/5",
                actions: ["현금 비중 50~80% 유지", "신규 코스피 매수 중단", "미국 ETF DCA 전환", "KOSPI 이격 정상화 대기"],
              },
              {
                scenario: "B 대비 (30%)",
                color: "border-amber-500/40 bg-amber-500/5",
                actions: ["현금 30~50% 유지", "미국 ETF 소규모 DCA", "코스피 분할매수 검토 (7,000 이하)", "변동성 대비 분산 유지"],
              },
              {
                scenario: "C 대비 (20%)",
                color: "border-emerald-500/40 bg-emerald-500/5",
                actions: ["추격매수 절대 금지", "기존 보유 물량 일부 익절", "일본형 결말 대비 현금화", "레버리지 절대 사용 금지"],
              },
            ].map((item) => (
              <div key={item.scenario} className={`p-4 rounded-xl border ${item.color}`}>
                <h4 className="font-bold text-sm mb-3">{item.scenario}</h4>
                <ul className="space-y-2">
                  {item.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-foreground mt-0.5">·</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-50 border border-border/30 rounded-lg text-xs text-center text-muted-foreground">
            ⚠️ 본 분석은 역사적 데이터 기반 확률적 추론이며, 실제 미래는 다를 수 있습니다. 시점 예측은 누구도 정확히 할 수 없으며, 투자 권유가 아닌 정보 제공 목적입니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
