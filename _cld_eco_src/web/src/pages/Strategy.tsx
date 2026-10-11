import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from "recharts";

import sp500BuyTimingChart from "@assets/Screenshot_20260607_141750_Samsung_Browser_1780809644560.jpg";
import dcaBacktestChart from "@assets/Screenshot_20260607_132145_Samsung_Browser_1780809644588.jpg";

const strategyResults = [
  { name: "일시매수\n(2008 저점)", return: 662, amount: 1617679, color: "#3b82f6", rank: "🥇" },
  { name: "DCA\n(매월 정기)", return: 248, amount: 739955, color: "#10b981", rank: "🥈" },
  { name: "MA200\n대기매수", return: 241, amount: 724149, color: "#ef4444", rank: "🥉" },
];

const growthSim = [
  { year: 2008, dca: 12000, ma200: 0, lump: 212240 },
  { year: 2010, dca: 36000, ma200: 14000, lump: 310000 },
  { year: 2012, dca: 60000, ma200: 45000, lump: 380000 },
  { year: 2014, dca: 95000, ma200: 80000, lump: 470000 },
  { year: 2016, dca: 140000, ma200: 120000, lump: 580000 },
  { year: 2018, dca: 200000, ma200: 165000, lump: 720000 },
  { year: 2020, dca: 220000, ma200: 180000, lump: 620000 },
  { year: 2021, dca: 380000, ma200: 310000, lump: 1100000 },
  { year: 2022, dca: 290000, ma200: 240000, lump: 850000 },
  { year: 2024, dca: 580000, ma200: 560000, lump: 1300000 },
  { year: 2026, dca: 739955, ma200: 724149, lump: 1617679 },
];

const maRules = [
  { ma: "200일선", freq: "일봉", stars: 5, use: "강세장/약세장 구분 핵심 지표", rule: "종가 > 200일선 = 강세장 / 반대 = 약세장", color: "border-primary/50" },
  { ma: "200주선", freq: "주봉", stars: 4, use: "장기 지지선 (수십 년 단위)", rule: "극단 이격 시 평균회귀 신호", color: "border-blue-500/40" },
  { ma: "50일선", freq: "일봉", stars: 3, use: "중기 추세 확인", rule: "골든크로스/데드크로스 매매 신호", color: "border-amber-500/40" },
  { ma: "20주선", freq: "주봉", stars: 2, use: "단기~중기 추세", rule: "단독 사용보다 보조 지표로 활용", color: "border-muted/50" },
];

const dcaOrder = [
  { rank: 1, name: "DCA (매월 정기 적립)", desc: "가장 추천 — 심리적 부담 없이 자동화. 코스피 고점 구간에서도 평균 매수가 낮아짐.", color: "text-emerald-400" },
  { rank: 2, name: "DCA + Buy-the-Dip 혼합", desc: "정기 적립 + 하락 시 추가 매수 (50/50). 미국 ETF에 적용 시 최상.", color: "text-blue-400" },
  { rank: 3, name: "일시 매수 (목돈 발생 시)", desc: "인내력 있을 때만 — 단기 변동성 감수. 장기 복리 효과 극대화.", color: "text-amber-400" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl space-y-1">
        <p className="font-bold">{label}년</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function Strategy() {
  return (
    <div className="space-y-8">
      <div className="border-l-4 border-blue-500 pl-6 py-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">투자 전략 백테스트 — 충격적 진실</h2>
        <p className="text-muted-foreground mt-1">
          S&P 500 17년 실제 데이터 | 누적 투자금 $212,240 동일 | 월 $1,000 적립 가정
        </p>
      </div>

      {/* 수익률 카드 3개 */}
      <div className="grid grid-cols-3 gap-3">
        {strategyResults.map((s) => (
          <Card key={s.name} className="text-center">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl mb-1">{s.rank}</div>
              <div className="font-bold text-xs text-muted-foreground mb-2 whitespace-pre-line">{s.name}</div>
              <div className="text-2xl font-black" style={{ color: s.color }}>+{s.return}%</div>
              <div className="text-xs text-muted-foreground mt-1">${s.amount.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-center">
        <p className="font-black text-lg text-destructive">MA200 대기매수 &lt; 무뇌 DCA!</p>
        <p className="text-sm text-muted-foreground mt-1">
          17년 동안 S&P500이 MA200 아래로 떨어진 기회는 <strong className="text-foreground">단 14번</strong>뿐.
          나머지 기간 현금은 쉬고, 시장은 계속 올랐습니다. 그 <strong className="text-foreground">기회비용</strong>이 결국 DCA에 졌습니다.
          DCA가 MA200보다 <strong className="text-destructive">+2% 우수</strong> (시장에 더 오래 머문 복리 효과).
        </p>
      </div>

      {/* S&P 500 200주선 매수 시점 시각화 — 새 이미지 */}
      <Card className="border-blue-500/30">
        <CardHeader className="pb-3">
          <CardTitle>📍 S&P 500 200주선 매수 시점 시각화 (17년간)</CardTitle>
          <CardDescription>녹색 삼각형(▽) = MA200 터치 매수 시점 | 총 14회 기회 | 전략별 포트폴리오 가치 비교</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg overflow-hidden border border-blue-500/20 bg-white/80">
            <img src={sp500BuyTimingChart} alt="S&P 500 200주선 매수 시점 시각화 및 전략 비교" className="w-full h-auto object-contain" />
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-muted-foreground">
            <strong className="text-blue-400">읽는 법:</strong> 상단 차트 = S&P 500 주가 + 200주 이평선 + 매수 시점(▽).
            하단 차트 = 전략별 포트폴리오 누적 가치. 파란선(일시매수)이 17년 내내 선두, 녹색(DCA)이 붉은 점선(MA200)보다 근소하게 앞섬.
          </div>
        </CardContent>
      </Card>

      {/* 실제 백테스트 차트 (젠스파크 원본) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>📚 실제 백테스트 결과 — 충격적인 진실</CardTitle>
          <CardDescription>DCA가 MA200법 대비 +2% 우수 (시장에 더 오래 머물러 복리 효과 극대화)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <img src={dcaBacktestChart} alt="DCA vs MA200 백테스트 결과" className="w-full h-auto" />
        </CardContent>
      </Card>

      {/* 성장 시뮬레이션 라인 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>17년 포트폴리오 성장 시뮬레이션</CardTitle>
            <CardDescription>2008~2026년 S&P 500 실제 데이터 기반 ($)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthSim} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="year" stroke="#475569" fontSize={10} tick={{ fill: "#64748b" }} />
                  <YAxis stroke="#475569" fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="lump" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="일시매수" />
                  <Line type="monotone" dataKey="dca" stroke="#10b981" strokeWidth={2} dot={false} name="DCA" />
                  <Line type="monotone" dataKey="ma200" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 3" name="MA200" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs justify-center">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block" />일시매수</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block" />DCA</span>
              <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-destructive inline-block" />MA200</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>수익률 최종 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyResults} layout="vertical" margin={{ top: 5, right: 55, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} tick={{ fill: "#94a3b8" }} width={65} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                    formatter={(v: any, _: any, p: any) => [`+${v}% ($${p.payload.amount.toLocaleString()})`, "수익률"]} />
                  <Bar dataKey="return" radius={[0, 4, 4, 0]}>
                    {strategyResults.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="return" position="right" formatter={(v: number) => `+${v}%`} fill="#e2e8f0" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 도시락 비유 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🍱 도시락 비유 — 왜 DCA가 이기는가?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { title: "DCA = 매주 도시락 그냥 사기", icon: "🍱", desc: "비싸든 싸든 매주 1개. 결국 평균 가격에 매수. 심리적 스트레스 없음. 자동화 가능.", color: "border-emerald-500/40 bg-emerald-500/5" },
              { title: "MA200 = 세일할 때만 사기", icon: "🏪", desc: "세일(MA200 터치)을 기다리는 동안 '베개 밑 현금'은 죽은 돈. 기회비용 발생. 결국 DCA에 패배.", color: "border-destructive/40 bg-destructive/5" },
              { title: "일시매수 = 시간이 무기", icon: "⏱️", desc: "목돈이 있을 때 한 번에 투자. 장기 복리 효과 극대화. 단기 변동성 감수 필수.", color: "border-blue-500/40 bg-blue-500/5" },
            ].map((item) => (
              <div key={item.title} className={`p-4 rounded-xl border ${item.color}`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 이동평균선 평가 + 추천 순서 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>✅ 추천 매수 전략 우선순위</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dcaOrder.map((item) => (
              <div key={item.rank} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-border/30">
                <span className={`text-2xl font-black shrink-0 ${item.color}`}>{item.rank}순위</span>
                <div>
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>📊 이동평균선 솔직한 평가</CardTitle>
            <CardDescription>Mebane Faber 연구 | "리스크 관리용으로만 활용"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {maRules.map((rule) => (
              <div key={rule.ma} className={`p-3 rounded-lg border ${rule.color}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-black text-sm">{rule.ma}</span>
                  <span className="text-xs text-muted-foreground">({rule.freq})</span>
                  <span className="ml-auto text-amber-400 text-xs">{"⭐".repeat(rule.stars)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{rule.use}</p>
                <p className="text-xs font-medium">{rule.rule}</p>
              </div>
            ))}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-center">
              <strong className="text-amber-400">Mebane Faber 핵심:</strong> 200일선 전략은 "수익률 향상"이 아닌 <strong>"최대 낙폭 감소"</strong>가 진짜 장점
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 명언 + 가짜명언 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/8 border-primary/30">
          <CardContent className="pt-5 pb-5">
            <blockquote className="text-lg font-serif italic text-center text-muted-foreground">
              "Time <strong className="text-foreground">IN</strong> the market<br />
              beats <strong className="text-destructive">timing</strong> the market."
            </blockquote>
            <p className="text-xs text-center text-muted-foreground mt-3">— 워런 버핏 (검증된 명언 ✅)</p>
            <p className="text-xs text-center text-muted-foreground mt-1">17년 백테스트 결과가 이 명언을 증명합니다</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="bg-destructive/5 border-b border-destructive/20 pb-3">
            <CardTitle className="text-destructive text-sm">❌ 찰리 멍거 200주선 명언 — 가짜 확인</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
            <div className="p-3 bg-muted/30 rounded-md italic line-through">"200주 이평선까지 떨어졌을 때 매수하면 S&P 500을 크게 이길 수 있다"</div>
            {["출처: 2024년 X(트위터) @Convertbond — 검증 불가",
              "멍거 책·주총·인터뷰 어디에도 없음",
              "Reddit r/investing: 'fabricated quote'로 결론",
              "멍거 본인: 기술적 분석 = '점성술'이라 비판",
              "백테스트 결과: MA200 전략이 DCA에 패배"].map((f, i) => (
              <p key={i} className="flex gap-1.5"><span className="text-destructive">·</span>{f}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
