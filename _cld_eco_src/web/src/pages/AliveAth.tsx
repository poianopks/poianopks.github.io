import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAliveAth } from "@/hooks/useAliveAth";

function fmt(v: number | null | undefined, dec = 2) {
  if (v == null) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: dec });
}

function fmtDate(d: string) {
  if (!d) return "—";
  return d.replace(/-/g, ".");
}

export function AliveAth() {
  const { data, loading, error, refetch } = useAliveAth();

  const {
    aliveList,
    totalAthCount,
    aliveCount,
    analysisStart,
    analysisEnd,
    totalDays,
    maxAlivePrice,
    maxAliveDate,
    minAlivePrice,
    minAliveDate,
    updatedAt,
  } = data;

  const survivalRate =
    totalAthCount > 0
      ? ((aliveCount / totalAthCount) * 100).toFixed(1)
      : "—";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-emerald-600 text-white text-sm px-3 py-1 font-black">
            🏔️ 살아있는 ATH
          </Badge>
          {!loading && updatedAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {new Date(updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준
            </span>
          )}
          <button
            onClick={refetch}
            className="ml-auto text-xs text-muted-foreground border border-border/40 px-2.5 py-1 rounded-full hover:text-foreground hover:border-border transition-colors"
          >
            🔄 새로고침
          </button>
        </div>
        <h2 className="text-2xl font-black tracking-tight">살아있는 ATH 분석</h2>
        <p className="text-sm text-muted-foreground">
          코스피가 역사상 최고가(ATH)를 기록한 날 중 — 이후 단 한 번도 종가가 그 아래로 내려간 적 없는 ATH만 표시
        </p>
      </div>

      {/* 정의 설명 */}
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm text-blue-800 space-y-1.5">
        <p className="font-bold">📌 살아있는 ATH 정의 (엄격 기준)</p>
        <p>✅ 해당 날에 코스피 종가가 새로운 역사적 사상 최고가(ATH)를 기록했고</p>
        <p>✅ 그 이후 오늘까지 종가가 단 한 번도 그 ATH 아래로 내려간 적 없을 것</p>
        <p className="text-blue-600">❌ 한 번이라도 아래로 내려갔다가 다시 올라온 것은 무효 (패배 처리)</p>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Yahoo Finance에서 코스피 전체 히스토리 분석 중…
            <br />
            <span className="text-xs">(약 30년치 일봉 데이터 처리 — 10~20초 소요)</span>
          </p>
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">
          <p className="font-bold mb-1">⚠️ 데이터 로딩 실패</p>
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-xs underline">다시 시도</button>
        </div>
      )}

      {/* 결과 */}
      {!loading && !error && aliveCount > 0 && (
        <>
          {/* 요약 카드 4개 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50"
            >
              <div className="text-xs text-emerald-700 font-medium mb-1">살아있는 ATH 개수</div>
              <div className="text-4xl font-black text-emerald-700">{aliveCount}</div>
              <div className="text-xs text-emerald-600 mt-1">
                분석 기간 내 {totalAthCount}회 갱신 중 {survivalRate}% 생존
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50"
            >
              <div className="text-xs text-blue-700 font-medium mb-1">최상단 살아있는 ATH</div>
              <div className="text-2xl font-black text-blue-700">{fmt(maxAlivePrice, 2)}</div>
              <div className="text-xs text-blue-600 mt-1">
                {fmtDate(maxAliveDate ?? "")} 달성
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.11 }}
              className="p-4 rounded-xl border-2 border-red-300 bg-red-50"
            >
              <div className="text-xs text-red-700 font-medium mb-1">🔴 전부 무효화 기준선</div>
              <div className="text-2xl font-black text-red-700">{fmt(minAlivePrice, 2)}</div>
              <div className="text-xs text-red-600 mt-1">
                {fmtDate(minAliveDate ?? "")} · 이 아래 종가 = 전부 소멸
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="p-4 rounded-xl border-2 border-slate-300 bg-slate-50"
            >
              <div className="text-xs text-slate-600 font-medium mb-1">분석 기간</div>
              <div className="text-sm font-black text-slate-700">
                {fmtDate(analysisStart)} ~
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {fmtDate(analysisEnd)} · {totalDays.toLocaleString()}거래일
              </div>
            </motion.div>
          </div>

          {/* 젠스파크 비교 */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-700">📊 젠스파크 분석 결과 vs 실시간 검증</p>
            <div className="flex flex-wrap gap-4 mt-1">
              <div>
                <span className="text-slate-500">젠스파크 (2026.07.31 기준): </span>
                <span className="font-black text-slate-700">20개</span>
                <span className="text-slate-400"> · 최상단 4,909.93 (2026-01-21)</span>
              </div>
              <div>
                <span className="text-slate-500">실시간 계산 결과: </span>
                <span className={`font-black ${aliveCount === 20 ? "text-emerald-600" : "text-amber-600"}`}>
                  {aliveCount}개
                </span>
                <span className="text-slate-400"> · 최상단 {fmt(maxAlivePrice, 2)} ({fmtDate(maxAliveDate ?? "")})</span>
              </div>
            </div>
            <p className="text-slate-400 mt-1">
              ※ 일자별 데이터 제공 시점, ATH 동률 처리 방식에 따라 소폭 차이가 있을 수 있음
            </p>
          </div>

          {/* 핵심 인사이트 — 방어선 로직 정확하게 */}
          {minAlivePrice && maxAlivePrice && (
            <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-3 text-sm">
              <p className="font-black text-slate-800">🛡️ 방어선 읽는 법 — ATH별 독립 생사</p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-bold text-red-700 mb-1">
                  🔴 전부 무효화 기준선: {fmt(minAlivePrice, 2)} ({fmtDate(minAliveDate ?? "")})
                </p>
                <p className="text-red-600 text-xs leading-relaxed">
                  종가가 이 아래로 내려가면 → 살아있는 ATH <strong>{aliveCount}개 전부 동시 소멸</strong>.
                  가장 오래 살아남은 ATH가 무너지는 것이므로 장기 상승 추세 붕괴 신호.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-bold text-blue-700 mb-1">
                  🔵 최상단 살아있는 ATH: {fmt(maxAlivePrice, 2)} ({fmtDate(maxAliveDate ?? "")})
                </p>
                <p className="text-blue-600 text-xs leading-relaxed">
                  종가가 이 아래로 내려가면 → 이 ATH 하나만 소멸. 그보다 낮은 ATH들은 계속 생존.
                  현재 코스피(6,595)는 이 위에 있어 최상단 ATH도 살아있는 상태.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                ※ 각 ATH는 독립적으로 생존 여부를 판정. 한 ATH가 무효화돼도 더 낮은 ATH에는 영향 없음.
                전부 무효화 = 가장 낮은 ATH(기준선)가 깨질 때만.
              </p>
            </div>
          )}

          {/* 하락 시나리오별 ATH 소멸 수 */}
          <Card className="border-2 border-slate-200">
            <CardHeader className="pb-2 bg-slate-50">
              <CardTitle className="text-sm text-slate-800">
                📉 하락 시나리오별 ATH 소멸 수
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                현재 코스피 6,595 기준 · 코스피가 이 가격 아래로 종가를 기록하면 해당 수만큼 ATH 소멸
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {[
                {
                  emoji: "🟢",
                  pct: "-25% 이내",
                  price: "4,910",
                  alive: 19,
                  dead: 1,
                  desc: "최상단 ATH 1개만 소멸, 나머지 19개 생존",
                  reason: "현 추세의 최정상(4,909.93)만 무너지는 것. 아직 19개 ATH가 지지하므로 장기 상승 구조 유지.",
                  badge: "장기 상승 추세 유지",
                  bg: "bg-emerald-50",
                  border: "border-emerald-200",
                  headColor: "text-emerald-700",
                  badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-300",
                  numColor: "text-emerald-700",
                },
                {
                  emoji: "🟡",
                  pct: "-30%",
                  price: "~4,600",
                  alive: 15,
                  dead: 5,
                  desc: "#16~20 총 5개 소멸, 15개 생존",
                  reason: "2026년 1월 고점권(4,692~4,909) ATH 5개가 한꺼번에 무너짐. 추세 꺾임 신호지만 절반 이상 생존.",
                  badge: "조정 국면 진입",
                  bg: "bg-yellow-50",
                  border: "border-yellow-200",
                  headColor: "text-yellow-700",
                  badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-300",
                  numColor: "text-yellow-700",
                },
                {
                  emoji: "🟠",
                  pct: "-40%",
                  price: "~3,957",
                  alive: 8,
                  dead: 12,
                  desc: "#9~20 총 12개 소멸, 8개만 생존",
                  reason: "2026년 1월 전체 + 2025년 10월 후반 ATH까지 소멸. 2025년 9~10월 초반 ATH 8개만 버팀. 심각한 추세 훼손.",
                  badge: "심각한 조정",
                  bg: "bg-orange-50",
                  border: "border-orange-200",
                  headColor: "text-orange-700",
                  badgeColor: "bg-orange-100 text-orange-700 border-orange-300",
                  numColor: "text-orange-700",
                },
                {
                  emoji: "🔴",
                  pct: "-50% 이상",
                  price: "~3,300 이하",
                  alive: 0,
                  dead: 20,
                  desc: "살아있는 ATH 20개 전부 소멸 🚨",
                  reason: "최하단 ATH(3,314.53)마저 무너지면 전부 동시 소멸. 2025년 9월 이후 만들어온 장기 상승 구조 전체 붕괴.",
                  badge: "장기 추세 근본 붕괴",
                  bg: "bg-red-50",
                  border: "border-red-200",
                  headColor: "text-red-700",
                  badgeColor: "bg-red-100 text-red-700 border-red-300",
                  numColor: "text-red-700",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.pct}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-xl border-2 ${s.bg} ${s.border} overflow-hidden`}
                >
                  {/* 상단 요약 줄 */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-black text-sm ${s.headColor}`}>
                        {s.pct} 하락 · 6,595 → {s.price}
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">{s.desc}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-black ${s.numColor}`}>
                        {s.alive}
                        <span className="text-sm font-semibold text-slate-500">개</span>
                      </div>
                      <div className="text-[10px] text-slate-400">생존</div>
                    </div>
                  </div>
                  {/* 하단 이유 설명 */}
                  <div className="px-4 pb-3 border-t border-slate-100">
                    <div className="flex items-start gap-2 mt-2">
                      <span className={`mt-0.5 flex-shrink-0 text-[10px] font-bold border px-1.5 py-0.5 rounded-full ${s.badgeColor}`}>
                        {s.badge}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{s.reason}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <p className="text-[11px] text-slate-400 pt-1">
                ※ 각 ATH는 종가 기준 독립 판정. 해당 가격 아래로 종가가 내려간 날이 하루라도 있으면 그 ATH 소멸.
              </p>
            </CardContent>
          </Card>

          {/* 살아있는 ATH 테이블 */}
          <Card className="border-2 border-emerald-200">
            <CardHeader className="pb-2 bg-emerald-50/60">
              <CardTitle className="text-base flex items-center gap-2">
                🏔️ 살아있는 ATH 전체 목록
                <Badge className="bg-emerald-600 text-white text-xs">{aliveCount}개</Badge>
              </CardTitle>
              <CardDescription>버틴 기간 내림차순 · 이후 단 한 번도 종가가 아래로 내려간 적 없는 ATH만</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-slate-50/60">
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium w-12">순위</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">ATH 달성일</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">ATH 종가</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">버틴 기간</th>
                      <th className="text-center px-4 py-2.5 text-xs text-muted-foreground font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aliveList.map((item, i) => {
                      const isTop = item.close === maxAlivePrice;
                      const isOldest = item.daysAlive === aliveList[0].daysAlive;
                      return (
                        <motion.tr
                          key={item.date}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`border-b border-border/20 transition-colors hover:bg-slate-50/60 ${
                            isTop ? "bg-amber-50/60" : ""
                          }`}
                        >
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-xs font-black ${
                              item.rank <= 3 ? "text-amber-600" : "text-muted-foreground"
                            }`}>
                              {item.rank <= 3 ? ["🥇","🥈","🥉"][item.rank - 1] : `#${item.rank}`}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            {fmtDate(item.date)}
                            {isOldest && (
                              <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-medium">
                                가장 오래
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-black">
                            {fmt(item.close, 2)}
                            {isTop && (
                              <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                                최상단
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            <span className="font-bold text-slate-700">{item.daysAlive.toLocaleString()}</span>일
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              ✅ 생존 중
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <Card className="border border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📈 KOSPI ATH 종합 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "분석 기간", value: `${fmtDate(analysisStart)} ~ ${fmtDate(analysisEnd)}` },
                  { label: "총 거래일", value: `${totalDays.toLocaleString()}일` },
                  { label: "역대 ATH 갱신 횟수", value: `${totalAthCount}회` },
                  { label: "살아있는 ATH", value: `${aliveCount}개 (${survivalRate}%)` },
                  { label: "최상단 살아있는 ATH", value: `${fmt(maxAlivePrice, 2)} (${fmtDate(maxAliveDate ?? "")})` },
                  { label: "최하단 살아있는 ATH", value: aliveList.length > 0 ? `${fmt(aliveList[0].close, 2)} (${fmtDate(aliveList[0].date)})` : "—" },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                    <div className="font-black text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 데이터 없을 때 (비어있고 로딩도 아닐 때) */}
      {!loading && !error && aliveCount === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">📭</p>
          <p>현재 살아있는 ATH가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
