import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

import exceptionsChart from "@assets/Screenshot_20260607_132446_Samsung_Browser_1780809644569.jpg";
import probabilityChart from "@assets/Screenshot_20260607_141911_Samsung_Browser_1780809644527.jpg";
import koreaVsWorldChart from "@assets/Screenshot_20260607_141837_Samsung_Browser_1780809644531.jpg";

const kospiHistory = [
  { name: "1999.04", event: "닷컴버블", deviation: 71, y1: -3.4, y2: -36.0, maxDrawdown: -41.0, trigger: "IT 거품 붕괴" },
  { name: "2002.04", event: "신용카드 사태", deviation: 43, y1: -41.7, y2: -5.7, maxDrawdown: -43.9, trigger: "내수 신용 위기" },
  { name: "2007.07", event: "글로벌 금융위기", deviation: 32, y1: -22.0, y2: -30.9, maxDrawdown: -53.2, trigger: "서브프라임" },
  { name: "2021.01", event: "코로나 버블", deviation: 39, y1: -5.2, y2: -29.1, maxDrawdown: -31.6, trigger: "유동성 급회수" },
  { name: "2026 현재", event: "AI·반도체 급등", deviation: 69.8, y1: null, y2: null, maxDrawdown: null, trigger: "진행 중" },
];

const globalCrashes = [
  { country: "🇰🇷 한국", year: "2026 현재", peak: "8,160", trough: "?", drawdown: "진행 중", recovery: "?", note: "현재 이격도 +67%, 이격도 역사상 극단치" },
  { country: "🇹🇼 대만", year: "1990", peak: "12,495", trough: "2,485", drawdown: "-80%", recovery: "8개월", note: "8개월 만에 -80% 폭락. 현재 이격 +44.4%" },
  { country: "🇯🇵 일본", year: "1989", peak: "38,957", trough: "7,054", drawdown: "-82%", recovery: "34년", note: "2024년에야 고점 회복. 현재 이격 +27.2%" },
  { country: "🇺🇸 나스닥", year: "2000", peak: "5,132", trough: "1,108", drawdown: "-78%", recovery: "15년", note: "닷컴버블 최고점 후 붕괴. 시스코 -90%" },
];

const probabilityData6m1y2y = [
  { name: "이격도 +20% 이상", m6: 37, y1: 55, y2: 58 },
  { name: "이격도 +30% 이상", m6: 30, y1: 63, y2: 75 },
  { name: "이격도 +40% 이상", m6: 18, y1: 54, y2: 91 },
];

const exceptions = [
  { num: 1, name: "구조적 파괴", case: "시스코(CSCO)", detail: "2000년 $77 → 26년 후 $122 회복 (장기 미회복)", korea: "🟡 부분 해당", koreaColor: "text-yellow-400", koreaNote: "삼성·SK 산업 교체 위험" },
  { num: 2, name: "국가 장기침체", case: "일본 닛케이225", detail: "1989년 38,916pt → 2024년 회복 (34년 소요)", korea: "🟠 장기 관찰", koreaColor: "text-orange-400", koreaNote: "인구 감소·저성장 구조" },
  { num: 3, name: "통화/하이퍼인플레이션", case: "터키 리라", detail: "2005년 1.33 → 2026년 46.06 (-97% 가치 소멸)", korea: "🟢 해당 없음", koreaColor: "text-emerald-400", koreaNote: "원화 안정적" },
  { num: 4, name: "거대 추세 추종", case: "비트코인", detail: "2014년 $387 → 2026년 $60,923 (+15,645%)", korea: "🟡 일부 해당", koreaColor: "text-yellow-400", koreaNote: "AI 패러다임 가능성" },
  { num: 5, name: "영구 손상 종목", case: "GE / 한진해운", detail: "GE: 2000년 $281 → 18년 추가 하락. 한진해운: 상장폐지", korea: "🟠 일부 종목", koreaColor: "text-orange-400", koreaNote: "개별 종목 리스크" },
];

const checklistItems = [
  { label: "이격도 +60% 이상 (역사적 극단)", signal: "평균회귀", type: "red" },
  { label: "200주 MA 대비 +164.9% 이격", signal: "평균회귀", type: "red" },
  { label: "글로벌 지수 대비 독자 급등", signal: "평균회귀", type: "red" },
  { label: "역사적 유사 사례 5/5 폭락 (100%)", signal: "평균회귀", type: "red" },
  { label: "Shiller CAPE 25 이상 (과열)", signal: "평균회귀", type: "red" },
  { label: "삼성전자 이격 +119% (닷컴 패턴)", signal: "평균회귀", type: "red" },
  { label: "SK하이닉스 이격 +156% (닷컴 패턴)", signal: "평균회귀", type: "red" },
  { label: "개인 투자자 레버리지 급증", signal: "평균회귀", type: "red" },
  { label: "미국 금리 환경 불확실 (4.4~4.5%)", signal: "평균회귀", type: "red" },
  { label: "AI 수출 모멘텀 지속 여부", signal: "중립", type: "yellow" },
  { label: "삼성·SK하이닉스 실적 추이", signal: "중립", type: "yellow" },
  { label: "환율 안정성 (원/달러)", signal: "중립", type: "yellow" },
  { label: "지정학적 리스크 (북한·미중 갈등)", signal: "중립", type: "yellow" },
  { label: "글로벌 유동성 공급 정책", signal: "중립", type: "yellow" },
  { label: "AI·반도체 구조적 패러다임 변화", signal: "예외 가능", type: "green" },
];

export function History() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const red = checklistItems.filter((c) => c.type === "red").length;
  const yellow = checklistItems.filter((c) => c.type === "yellow").length;
  const green = checklistItems.filter((c) => c.type === "green").length;

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-amber-500 pl-6 py-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">역사가 반복된다 — +60% 이격도의 운명</h2>
        <p className="text-muted-foreground mt-1">
          데이터 출처: Yahoo Finance (^KS11) | 분석 기간: 1985~2026 (40년) | Python yfinance·pandas·matplotlib
        </p>
      </div>

      {/* 한국·대만·일본 3개국 이격도 역사 비교 — 핵심 새 이미지 */}
      <Card className="border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle>🌏 한국 vs 대만 vs 일본: 200일선 이격도 역사 비교</CardTitle>
          <CardDescription>KOSPI +67% vs 대만 +44.4% vs 일본 +27.2% | 1998~2026</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg overflow-hidden border border-amber-500/20 bg-white/80">
            <img src={koreaVsWorldChart} alt="한국 vs 대만 vs 일본 200일선 이격도 역사 비교" className="w-full h-auto object-contain" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-destructive font-black text-xl">+67%</div>
              <div className="text-xs text-muted-foreground mt-1">🇰🇷 KOSPI (현재)</div>
              <div className="text-xs text-destructive">+60% 극단 라인 초과</div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="text-amber-400 font-black text-xl">+44.4%</div>
              <div className="text-xs text-muted-foreground mt-1">🇹🇼 대만 (현재)</div>
              <div className="text-xs text-amber-400">+40% 위험 라인 초과</div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-blue-400 font-black text-xl">+27.2%</div>
              <div className="text-xs text-muted-foreground mt-1">🇯🇵 일본 (현재)</div>
              <div className="text-xs text-blue-400">+20% 경계 라인 초과</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            ※ 1990년 대만은 이격도 급등 후 8개월 만에 -80% 폭락. 1989년 일본은 -82% 폭락 후 34년 회복.
            <strong className="text-destructive"> 현재 한국이 가장 위험.</strong>
          </p>
        </CardContent>
      </Card>

      {/* KOSPI 과거 과열 → 결과 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>KOSPI 과거 과열 구간 → 결과 비교</CardTitle>
          <CardDescription>이격도 급등 후 1년·2년 수익률 및 3년 내 최대 낙폭 (코스피 기준, 1996~2026)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시점 / 사건</TableHead>
                  <TableHead className="text-right">이격도</TableHead>
                  <TableHead className="text-right">1년 후</TableHead>
                  <TableHead className="text-right">2년 후</TableHead>
                  <TableHead className="text-right text-destructive">최대 낙폭</TableHead>
                  <TableHead className="hidden md:table-cell">촉발 원인</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kospiHistory.map((row) => (
                  <TableRow key={row.name}
                    onClick={() => setSelectedRow(selectedRow === row.name ? null : row.name)}
                    className={`cursor-pointer transition-colors ${
                      row.name === "2026 현재"
                        ? "bg-destructive/10 border-y-2 border-destructive/30 font-bold"
                        : selectedRow === row.name ? "bg-muted/30" : "hover:bg-muted/10"
                    }`}>
                    <TableCell>
                      <div className="font-semibold text-sm">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.event}</div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-400">+{row.deviation}%</TableCell>
                    <TableCell className={`text-right font-medium text-sm ${row.y1 !== null && row.y1 < 0 ? "text-destructive" : row.y1 !== null ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {row.y1 !== null ? `${row.y1}%` : <span className="animate-pulse font-bold text-destructive">?</span>}
                    </TableCell>
                    <TableCell className={`text-right font-medium text-sm ${row.y2 !== null && row.y2 < 0 ? "text-destructive" : row.y2 !== null ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {row.y2 !== null ? `${row.y2}%` : <span className="animate-pulse font-bold text-destructive">?</span>}
                    </TableCell>
                    <TableCell className="text-right font-black text-destructive text-sm">
                      {row.maxDrawdown !== null ? `${row.maxDrawdown}%` : <span className="animate-pulse">진행 중</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{row.trigger}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground">
            과거 4회 평균 최대낙폭: <span className="text-destructive font-bold">-42.4%</span> | 최대: -53.2% (2007 금융위기)
          </div>
        </CardContent>
      </Card>

      {/* 이격도별 하락 확률 — 실제 젠스파크 차트 + 숫자 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📊 이격도별 하락 확률 — 6개월 / 1년 / 2년</CardTitle>
          <CardDescription>KOSPI 기준 | 동전 던지기(50%) 기준선 초과 시 통계적 유의미</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg overflow-hidden border border-border/30 bg-white/80">
            <img src={probabilityChart} alt="이격도별 6개월 1년 2년 하락 확률 바차트" className="w-full h-auto object-contain" />
          </div>

          {/* 숫자 요약 */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이격도 구간</TableHead>
                  <TableHead className="text-right">6개월 후</TableHead>
                  <TableHead className="text-right">1년 후</TableHead>
                  <TableHead className="text-right font-bold text-destructive">2년 후</TableHead>
                  <TableHead className="hidden md:table-cell">판정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {probabilityData6m1y2y.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-semibold text-sm">{row.name}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${row.m6 >= 50 ? "text-destructive" : "text-amber-400"}`}>{row.m6}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${row.y1 >= 50 ? "text-destructive" : "text-amber-400"}`}>{row.y1}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-black text-lg ${row.y2 >= 75 ? "text-destructive" : "text-amber-400"}`}>{row.y2}%</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      <span className={`font-bold ${row.y2 >= 75 ? "text-destructive" : "text-amber-400"}`}>
                        {row.y2 >= 90 ? "⚠️ 매우 위험" : row.y2 >= 75 ? "🔴 위험" : "🟡 애매"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-destructive/10 border-y-2 border-destructive/30">
                  <TableCell className="font-black text-destructive text-sm">이격도 +60% 이상</TableCell>
                  <TableCell className="text-right font-black text-destructive">-</TableCell>
                  <TableCell className="text-right font-black text-destructive">-</TableCell>
                  <TableCell className="text-right font-black text-destructive text-lg">100%</TableCell>
                  <TableCell className="hidden md:table-cell text-destructive font-black text-xs">역사상 5회 모두 폭락</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs">
            <strong className="text-destructive">핵심 발견:</strong> 이격도가 클수록 평균회귀 확률 급증.
            현재 KOSPI +67% → 역사상 극단치 → 동전 던지기(50%) 훨씬 초과하는 통계적 유의미한 위험 신호.
          </div>
        </CardContent>
      </Card>

      {/* 해외 유사 사례 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🌍 해외 유사 사례 — 극단 이격 후 폭락 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>국가/시장</TableHead>
                  <TableHead className="text-right">폭락 연도</TableHead>
                  <TableHead className="text-right">고점</TableHead>
                  <TableHead className="text-right">저점</TableHead>
                  <TableHead className="text-right text-destructive">낙폭</TableHead>
                  <TableHead className="hidden md:table-cell">회복 기간</TableHead>
                  <TableHead className="hidden lg:table-cell">특징</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalCrashes.map((crash) => (
                  <TableRow key={crash.country} className={crash.country.includes("한국") ? "bg-destructive/10 border-y border-destructive/30" : ""}>
                    <TableCell className="font-bold text-sm">{crash.country}</TableCell>
                    <TableCell className="text-right text-sm">{crash.year}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{crash.peak}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{crash.trough}</TableCell>
                    <TableCell className={`text-right font-black ${crash.country.includes("한국") ? "text-destructive animate-pulse" : "text-destructive"}`}>
                      {crash.drawdown}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm font-bold text-amber-400">{crash.recovery}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{crash.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-sm">
              <strong className="text-destructive">🇹🇼 대만 1990 교훈:</strong>
              <p className="text-xs text-muted-foreground mt-1">12,495pt에서 단 8개월 만에 2,485pt로 -80% 폭락. 현재 대만도 이격도 +44.4%로 위험권.</p>
            </div>
            <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg text-sm">
              <strong className="text-amber-400">🇯🇵 일본 1989 교훈:</strong>
              <p className="text-xs text-muted-foreground mt-1">38,957pt 고점 후 -82% 폭락. 2024년(34년 후)에야 고점 회복. 최악의 시나리오. 현재 +27.2%.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 평균회귀 예외 5가지 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>평균회귀 예외 5가지 — 실제 차트 + 한국 적용 판정</CardTitle>
          <CardDescription>Fama·Shiller 등 노벨상급 학자 입증 | 단, 예외는 실재함</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg overflow-hidden border border-border/30">
            <img src={exceptionsChart} alt="평균회귀 예외 5가지 실제 차트" className="w-full h-auto" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>예외 요인</TableHead>
                  <TableHead>역사 사례</TableHead>
                  <TableHead className="hidden md:table-cell">실제 데이터</TableHead>
                  <TableHead>한국 적용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((ex) => (
                  <TableRow key={ex.num}>
                    <TableCell className="font-bold text-muted-foreground">{ex.num}</TableCell>
                    <TableCell className="font-semibold text-sm whitespace-nowrap">{ex.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{ex.case}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{ex.detail}</TableCell>
                    <TableCell>
                      <div className={`font-bold text-sm ${ex.koreaColor} whitespace-nowrap`}>{ex.korea}</div>
                      <div className="text-xs text-muted-foreground">{ex.koreaNote}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
            <strong className="text-blue-400">종합 진단:</strong>
            <span className="text-muted-foreground ml-1">현재 한국은 ① 시스코형 + ④ AI 추세형 혼재. 가장 위험한 시나리오는 ② 일본형 장기침체. 인덱스 ETF + DCA가 최선의 안전 전략.</span>
          </div>
        </CardContent>
      </Card>

      {/* 15개 체크리스트 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📋 평균회귀 vs 예외 — 15개 체크리스트</CardTitle>
          <CardDescription>기술적 + 기본적 분석 종합 (RSI, CAPE, 볼린저 밴드, 피보나치 포함)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="text-3xl font-black text-destructive">{red}</div>
              <div className="text-xs text-muted-foreground mt-1">🔴 평균회귀 신호</div>
            </div>
            <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="text-3xl font-black text-amber-400">{yellow}</div>
              <div className="text-xs text-muted-foreground mt-1">🟡 중립</div>
            </div>
            <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="text-3xl font-black text-emerald-400">{green}</div>
              <div className="text-xs text-muted-foreground mt-1">🟢 예외 가능</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {checklistItems.map((item, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs border ${
                item.type === "red" ? "border-destructive/20 bg-destructive/5"
                : item.type === "yellow" ? "border-amber-500/20 bg-amber-500/5"
                : "border-emerald-500/20 bg-emerald-500/5"
              }`}>
                <span className="shrink-0">{item.type === "red" ? "🔴" : item.type === "yellow" ? "🟡" : "🟢"}</span>
                <span className="flex-1">{item.label}</span>
                <span className={`ml-auto text-xs font-medium shrink-0 ${
                  item.type === "red" ? "text-destructive" : item.type === "yellow" ? "text-amber-400" : "text-emerald-400"
                }`}>{item.signal}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-center font-bold text-destructive">
            결론: 9개 평균회귀 신호 vs 1개 예외 → 평균회귀 확률 <span className="text-xl">70~80%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
