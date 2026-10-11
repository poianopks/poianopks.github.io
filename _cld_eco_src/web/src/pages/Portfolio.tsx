import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const options = [
  { id: 1, name: "즉시 코스피 매수", risk: "🔴 매우 높음", stars: 1, riskClass: "text-destructive", note: "이격도 +67% 구간 신규매수 = 역사상 최악의 타이밍" },
  { id: 2, name: "코스피 인버스 매수", risk: "🔴 매우 높음", stars: 2, riskClass: "text-destructive", note: "타이밍 예측 불가. 롤오버 손실 위험. 단기 도박 수준" },
  { id: 3, name: "현금 보유 + 회귀 대기", risk: "🟢 낮음", stars: 4, riskClass: "text-emerald-400", note: "안전하나 기회비용 발생. 이격 정상화 시점(2~5년) 예측 불가" },
  { id: "4A", name: "매월 100만원 코스피 DCA", risk: "🟡 중간", stars: 3, riskClass: "text-amber-400", note: "코스피 과열 구간 분할매수 — 여전히 위험, 비추천" },
  { id: "4B", name: "매월 1,000만원 미국 DCA ★", risk: "🟡 중간", stars: 5, riskClass: "text-amber-400", note: "미국 이격 +7.66% 정상 구간. DCA 최선 — 가장 추천", highlight: "blue" },
  { id: 5, name: "1억 코스피 일시 몰빵", risk: "🔴 매우 높음", stars: 1, riskClass: "text-destructive", note: "최악의 선택. 역사상 이 시점 5/5 큰 손실" },
  { id: 6, name: "1억 인버스 일시 몰빵", risk: "🔴 매우 높음", stars: 1, riskClass: "text-destructive", note: "절대 금지. 타이밍 실패 시 계좌 초토화" },
  { id: 7, name: "코스피 2,000 대기 후 매수", risk: "🟢 낮음", stars: 1, riskClass: "text-emerald-400", note: "비현실적. MA200(3,081)에서도 수년 대기 필요" },
  { id: 8, name: "코스피 10,000 대기 후 매수", risk: "🔴 매우 높음", stars: 1, riskClass: "text-destructive", note: "FOMO 함정. 새 패러다임(20%) 베팅 = 80% 폭락 위험" },
  { id: 9, name: "하이브리드 바벨 전략 ★★", risk: "🟡 중간", stars: 5, riskClass: "text-amber-400", note: "현금 방어 + 미국 성장 = 리스크 통제 + 기회비용 최소화", highlight: "primary" },
];

const portfolioAlloc = [
  { name: "현금/예금", value: 50, amount: "5,000만원", color: "#475569", detail: "CMA·파킹통장·단기채 | 폭락 시 저점 매수 화력" },
  { name: "미국 S&P500 ETF", value: 25, amount: "2,500만원", color: "#3b82f6", detail: "VOO·IVV | 10개월 분할매수 (월 250만원 DCA)" },
  { name: "나스닥 100 ETF", value: 10, amount: "1,000만원", color: "#8b5cf6", detail: "QQQ·QQQM | AI·빅테크 성장 노출" },
  { name: "선진국 분산 ETF", value: 10, amount: "1,000만원", color: "#10b981", detail: "VEA·EFA | 미국 외 선진국 분산" },
  { name: "금/원자재", value: 5, amount: "500만원", color: "#f59e0b", detail: "GLD·IAU | 인플레이션·달러 헤지" },
];

const kospiEntryConditions = [
  { level: "6,500", deviation: "+20%", action: "10% 진입", amount: "500만원", urgency: "관찰 시작", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { level: "5,800", deviation: "+10%", action: "20% 진입", amount: "1,000만원", urgency: "분할 매수", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { level: "5,000", deviation: "MA200 근처", action: "30% 진입", amount: "1,500만원", urgency: "적극 매수", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { level: "4,500", deviation: "-5% 이하", action: "40% 진입", amount: "2,000만원", urgency: "핵심 매수", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

export function Portfolio() {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-emerald-500 pl-6 py-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">1억 자산 운용 — 9가지 옵션 완전 평가</h2>
        <p className="text-muted-foreground mt-1">리스크 통제 + 기회비용 최소화 + 평균회귀 대비 최적 전략</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>9가지 전략 옵션 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="table-options">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>전략 옵션</TableHead>
                  <TableHead className="w-32">위험도</TableHead>
                  <TableHead className="w-28 text-center">추천도</TableHead>
                  <TableHead className="hidden lg:table-cell">핵심 판단</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((opt) => (
                  <TableRow
                    key={opt.id}
                    className={
                      opt.highlight === "primary" ? "bg-primary/10 border-y-2 border-primary/30"
                      : opt.highlight === "blue" ? "bg-blue-500/8 border-y border-blue-500/20"
                      : ""
                    }
                    data-testid={`option-row-${opt.id}`}
                  >
                    <TableCell className="font-bold text-muted-foreground text-sm">{opt.id}</TableCell>
                    <TableCell className={`font-medium text-sm ${opt.highlight === "primary" ? "text-primary font-bold" : opt.highlight === "blue" ? "text-blue-400 font-bold" : ""}`}>
                      {opt.name}
                    </TableCell>
                    <TableCell className={`text-sm font-bold ${opt.riskClass}`}>{opt.risk}</TableCell>
                    <TableCell className="text-center tracking-widest text-amber-400 text-xs">{"⭐".repeat(opt.stars)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{opt.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/40 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
        <CardHeader className="bg-primary/5 border-b border-primary/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <CardTitle className="text-primary text-xl">옵션 9 — 하이브리드 바벨 전략 (1억 기준)</CardTitle>
              <CardDescription>워런 버핏 1원칙: 절대 돈을 잃지 마라 | 2원칙: 1원칙을 절대 잊지 마라</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart data-testid="chart-portfolio">
                  <Pie data={portfolioAlloc} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none"
                    onMouseEnter={(d) => setHoveredAsset(d.name)} onMouseLeave={() => setHoveredAsset(null)}>
                    {portfolioAlloc.map((e, i) => <Cell key={i} fill={e.color} opacity={hoveredAsset && hoveredAsset !== e.name ? 0.35 : 1} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                    formatter={(v: any, _: any, p: any) => [`${v}% (${p.payload.amount})`, p.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {portfolioAlloc.map((item) => (
                <div key={item.name}
                  className={`p-3 rounded-lg border cursor-default transition-all ${hoveredAsset === item.name ? "border-border bg-muted/30 scale-[1.01]" : "border-border/30"}`}
                  onMouseEnter={() => setHoveredAsset(item.name)} onMouseLeave={() => setHoveredAsset(null)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-sm">{item.name}</span>
                    </div>
                    <div className="flex gap-3 items-center text-sm">
                      <span className="text-muted-foreground">{item.amount}</span>
                      <span className="font-black w-8 text-right">{item.value}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 pl-5">{item.detail}</p>
                </div>
              ))}
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-destructive shrink-0" />
                    <span className="text-sm text-muted-foreground font-medium">한국 ETF (KOSPI/KOSDAQ)</span>
                  </div>
                  <span className="text-destructive font-black text-sm">0% — 대기</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 pl-5">이격도 정상화 후 단계적 진입</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "현금성 방어", value: "50%", desc: "폭락 대비 화력", color: "text-slate-300" },
              { label: "해외 성장", value: "45%", desc: "미국·선진국 우상향", color: "text-blue-400" },
              { label: "실물 헤지", value: "5%", desc: "인플레·달러 대비", color: "text-amber-400" },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-slate-50 rounded-lg border border-border/30">
                <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                <div className="text-xs font-medium mt-1">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-primary">🎯 한국 ETF 단계별 재진입 조건</CardTitle>
          <CardDescription>현금 5,000만원 활용 — 이격도 정상화에 따른 분할 매수 전략</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {kospiEntryConditions.map((cond) => (
              <div key={cond.level} className={`p-4 rounded-xl border ${cond.bg}`}>
                <div className="text-xs text-muted-foreground mb-1">KOSPI 도달 시</div>
                <div className="text-2xl font-black">{cond.level}</div>
                <div className={`text-sm font-bold ${cond.color} mt-1`}>{cond.deviation}</div>
                <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">진입 비중</span>
                    <span className={`font-black ${cond.color}`}>{cond.action}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">투입 금액</span>
                    <span className="font-bold">{cond.amount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">행동</span>
                    <span className={`font-bold ${cond.color}`}>{cond.urgency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-50 border border-border/30 rounded-lg text-xs text-muted-foreground">
            <strong className="text-foreground">활용법:</strong> 현재 대기 현금 5,000만원을 위 4단계로 분할 사용.
            코스피가 6,500까지 오면 500만원 → 5,800이면 추가 1,000만원 → 5,000이면 1,500만원 → 4,500이면 나머지 2,000만원.
            총 5,000만원 전량 투입 시 평균 매수가 크게 낮아집니다.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-400 text-base flex items-center gap-2">✅ 지금 당장 해야 할 일</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                ["현금 비중 50~80% 유지", "폭락 대비 화력 비축 필수"],
                ["미국 인덱스 ETF DCA", "S&P500·나스닥 매월 분할 매수"],
                ["고금리 파킹통장·CMA 활용", "대기 현금 연 3~4% 이자 수익"],
                ["이격도 주 1회 체크", "코스피 +20% 이하 복귀 시 재진입 검토"],
                ["인용문 팩트체크 습관화", "가짜 명언으로 잘못된 판단 방지"],
                ["평균회귀 예외 5가지 기억", "무조건 평균회귀 맹신도 위험"],
              ].map(([title, sub], i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive text-base flex items-center gap-2">⛔ 절대 하지 말 것</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                ["삼성전자·SK하이닉스 추격매수", "+119%, +156% 과열 — 닷컴버블 시스코 패턴"],
                ["신용·미수 레버리지", "-40% 시 반대매매 → 계좌 청산 위험"],
                ["'이번엔 다르다' 맹신", "역사상 이 말이 맞은 적 거의 없음"],
                ["단일 종목 100% 집중", "종목 고유 위험 + 시장 위험 중복"],
                ["FOMO 추격매수", "탐욕이 절정일 때가 가장 위험한 시점"],
                ["인버스 ETF 장기 보유", "롤오버 손실로 시간이 지날수록 가치 하락"],
              ].map(([title, sub], i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold shrink-0 mt-0.5">✗</span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/10 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <h3 className="font-black text-lg mb-4 text-center">📌 3줄 핵심 요약</h3>
          <div className="space-y-3">
            {[
              { num: "01", text: "코스피 +67% 이격은 역사적 극단치 → 평균회귀 확률 70~80% (역사상 5/5)", color: "text-destructive" },
              { num: "02", text: "지금은 매수 아닌 현금 보유 + 미국 ETF 분산 DCA가 합리적 대응", color: "text-amber-400" },
              { num: "03", text: "'수익 극대화'보다 '절대 안 망하기' — 버핏 1원칙: 절대 돈을 잃지 마라", color: "text-emerald-400" },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border/40">
                <span className={`text-2xl font-black shrink-0 ${item.color}`}>{item.num}</span>
                <p className="text-sm leading-relaxed font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
