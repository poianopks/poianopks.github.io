import { useState } from "react";
import { useMacroMonitor } from "@/hooks/useMacroMonitor";

// ────────────────────────────────────────────────────────────
// 데이터
// ────────────────────────────────────────────────────────────
const SUBTABS = [
  { value: "map",       label: "🗺️ 지도" },
  { value: "episodes",  label: "📚 8편 요약" },
  { value: "monitor",   label: "📡 실시간 모니터" },
  { value: "dashboard", label: "🎯 대시보드" },
  { value: "checklist", label: "✅ 체크리스트" },
  { value: "verdict",   label: "💬 총평" },
];

const episodes = [
  {
    num: "02", color: "bg-blue-500", title: "🎯 금리 — 투자 세계의 중력",
    quote: "수익률 곡선의 모양이 다음 계절의 정밀 진단서다",
    body: [
      { h: "🧭 두 가지 금리", t: "기준금리(중앙은행): 한국 2.5%, 미국 3.5~3.75% · 시장금리(채권시장): 10년물 4.2%" },
      { h: "📈 수익률 곡선 4모양", t: "정상(우상향)=건강 · 평탄화=성장둔화 · 역전(단기>장기)=🚨 침체 예고(반년~1년 뒤) · 스티프닝=회복/위기대응" },
      { h: "🏢 금리↑ 시 업종 영향", t: "성장주 ❌ / 은행·보험 ✅ / 배당주 ❌" },
    ],
    caution: "자막 오타 다수 확인됨 (수치 표기 오류)",
  },
  {
    num: "03", color: "bg-teal-500", title: "🌐 환율 — 자금 흐름의 나침반",
    quote: "코스피 9,000 돌파인데 원화는 왜 약세?",
    body: [
      { h: "💪 환율 4대 힘", t: "① 금리 차이 ② 경상수지 ③ 자본흐름 ④ 위험선호심리" },
      { h: "🎢 캐리 트레이드 위험", t: "낮은 이자 통화로 빌려 높은 이자 자산 투자 → 2024년 8월 엔 캐리 청산으로 글로벌 급락 경험. 일본 정책금리 1%대(31년 만 최고)는 잠재 위험" },
      { h: "🏢 원화 약세 시", t: "✅ 수혜: 삼성전자·현대차·조선 / ❌ 피해: 항공·여행·원자재 수입" },
    ],
  },
  {
    num: "04", color: "bg-purple-500", title: "💧 유동성 — 시장의 밀물과 썰물",
    quote: "자산 가격은 유동성이라는 물결 위에 뜬 배다",
    body: [
      { h: "⚖️ QE vs QT", t: "QE: 채권 매입 → 돈 방출 → 자산↑ / QT: 채권 매도 → 돈 흡수 → 자산↓" },
      { h: "📊 연준 대차대조표", t: "코로나 이전 $4T → 최고점 $9T → 2025.12 QT종료 시 $6.58T (약 -$2T 축소)" },
      { h: "🚨 함정", t: "연준이 채권을 매입해도 QE 부활이 아닐 수 있음 — 준비금 관리(RMP)와 QE를 구분하는 눈이 필요" },
    ],
  },
  {
    num: "05", color: "bg-pink-500", title: "📊 선행지표 — 미래를 미리 읽다",
    quote: "선행으로 가설, 동행으로 확인, 후행으로 채점",
    body: [
      { h: "🔍 핵심 선행지표 6종", t: "ISM 제조업 PMI(50이 분수령) · ISM 서비스업 PMI(美 70%) · 주간 실업수당+PMI 고용 · 수익률 곡선 · LEI/OECD 선행지수 · 한국 수출·반도체 수출액" },
      { h: "💡 프로의 팁", t: '"신규주문 − 재고" 지표 활용, 레벨보다 방향과 속도가 중요. PMI가 40→43→46이면 아직 50 아래여도 봄을 준비한다' },
      { h: "📌 영상 시점 사례", t: "미국 PMI 고용 47 (한 달 전 51 → -4.6p) = 2020년 5월 이후 최저" },
    ],
    deepDive: {
      videoUrl: "https://www.youtube.com/watch?v=JbllgCD25gc",
      duration: "12분 45초",
      summary: "주가는 지금 경기가 아니라 6개월~1년 뒤 경기를 반영해요. 그래서 미래를 미리 보여주는 선행지표를 보면 남보다 한발 먼저 움직일 수 있어요.",
      whySummary:
        "\"주가는 대략 6개월~1년 뒤의 경기를 미리 반영해서 움직인다\" (영상 원문). 즉, 뉴스에서 \"경기 좋아졌다!\" 나올 때는 이미 주가는 다 올라있음 😅 반대로 \"경기 안 좋다\" 나올 때는 이미 주가는 바닥에서 오르고 있는 경우가 많음 📈",
      types: [
        { type: "선행지표", timing: "미래 예고", example: "ISM PMI, 실업수당 청구", metaphor: "⚡ 번개 (비 오기 전)" },
        { type: "동행지표", timing: "현재 반영", example: "산업생산, 소매판매", metaphor: "🌧️ 지금 오는 비" },
        { type: "후행지표", timing: "결과 확인", example: "실업률, 기업 실적", metaphor: "☔ 지나간 비의 흔적" },
      ],
      factCheck: [
        { claim: "주가는 경기보다 6개월~1년 앞선다", reality: "컨퍼런스보드 공식: LEI는 경기 전환점을 \"약 7개월 앞서\" 예측", verdict: "ok" as const },
        { claim: "PMI 50이 분수령", reality: "ISM 공식: 50 이상 확장, 50 미만 수축이 표준 정의", verdict: "ok" as const },
        { claim: "\"신규주문 − 재고\"가 고수의 기법", reality: "실무 애널리스트가 실제로 쓰는 지표 (Order-Inventory Gap)", verdict: "ok" as const },
        { claim: "장단기 금리차 역전 후 반년~1년 뒤 침체", reality: "Fed의 Estrella & Mishkin 연구가 실증. 다만 최근 20개월 역전에도 침체 없어 정확도 논쟁 중", verdict: "warn" as const },
        { claim: "미국 6월 PMI 고용 47", reality: "2026년 6월 ISM 제조업 PMI 전체는 53.3. 고용 세부항목은 별도지만 47 수준까지 하락 보도 있음", verdict: "warn" as const },
        { claim: "한국 수출·반도체 수출이 선행지표 역할", reality: "정통 실무 관점과 일치. 특히 반도체는 글로벌 IT 사이클 선행", verdict: "ok" as const },
        { claim: "컨퍼런스보드 LEI, OECD 선행지수", reality: "실제 존재하는 국제 표준 지표", verdict: "ok" as const },
      ],
      factCheckConclusion:
        "✅ 개념·프레임워크는 정확하고 정통 이론과 일치합니다. ⚠️ 다만 최근 20개월 역전에도 침체가 안 온 사례처럼 \"역전 = 무조건 침체\"라는 부분은 논쟁이 있어요. 100% 맞는 지표는 없다는 점을 기억하세요.",
      pros: [
        "\"주가 = 미래 반영\" 개념 하나만 이해해도 투자 관점이 완전히 바뀜",
        "PMI 50 기준선 같은 간단한 규칙을 알려줌",
        "\"레벨보다 방향과 속도\"라는 조언은 진짜 프로급",
      ],
      cons: [
        "왕초보에겐 여전히 어려울 수 있음 (차분·미분·가속도 표현)",
        "선행지표 정확도가 100%가 아님을 강조 부족",
        "\"고용지수 47\" 같은 구체 수치는 스스로 확인해야 함 (출처 링크 없음)",
      ],
      rating: 4,
      ratingNote: "시청 강추, 단 이 한 편만 보고 매매 결정은 금물",
      indicators: [
        { num: 1, title: "미국 ISM 제조업 PMI", badge: "매달 1일 발표", site: "Investing.com 한국 / ISM 공식", url: "https://kr.investing.com/economic-calendar/ism-manufacturing-pmi-173",
          points: ["매달 초 발표 → 50 넘으면 확장 · 미만이면 수축", "예: 2026년 6월 PMI = 53.3 → 20개월 연속 확장 중", "세부 항목 중 '고용'과 '신규주문' 함께 보기"] },
        { num: 2, title: "미국 장단기 금리차 (수익률 곡선)", badge: "실시간", site: "FRED - T10Y2Y", url: "https://fred.stlouisfed.org/series/T10Y2Y",
          points: ["페이지 열면 그래프 바로 뜸 (10년물 - 2년물 스프레드)", "음수(-)면 역전 → 침체 경고 · 양수(+)면 정상", "최근 수치: 약 +0.4~0.5%p 부근 (완만한 정상 곡선)"],
          tip: "이 사이트 즐겨찾기 필수! 매주 한 번만 확인해도 충분해요." },
        { num: 3, title: "컨퍼런스보드 경기선행지수 (LEI)", badge: "매달 발표", site: "The Conference Board 공식", url: "https://www.conference-board.org/topics/us-leading-indicators/",
          points: ["매달 발표 → 몇 달 연속 하락 vs 상승을 봄", "최근 발표: 2026년 5월 LEI = 99.3 (0.1% 상승)", "6개월 연속 방향이 핵심 (한 달 튀는 건 노이즈)"],
          alt: { label: "Investing.com 미국 선행지수 — 한국어로 표시됨", url: "https://kr.investing.com/economic-calendar/us-leading-index-1968" } },
        { num: 4, title: "한국 경기선행지수 순환변동치", badge: "통계청 · 매달", site: "지표누리 / INDEXerGO", url: "https://www.indexergo.com/series/?idxDetail=11601",
          points: ["최근 수치: 선행종합지수 순환변동치 104.80 (2026년 7월 확인)", "100 이상 = 확장 국면 · 100 미만 = 수축 국면", "매달 발표"] },
        { num: 5, title: "한국 수출 증가율", badge: "매달 1일 · 초빠른 지표", site: "산업통상자원부 수출입동향", url: "https://www.motir.go.kr",
          points: ["매달 1일 아침에 산업부가 발표 → 당일 뉴스 헤드라인에 나옴", "반도체 수출 증가율을 특히 주목 → 글로벌 IT 사이클 선행", "2026년 6월 수출: 1,022억 달러 (사상 첫 1,000억 돌파)"] },
      ],
      monthlyChecklist: [
        "1. 미국 ISM PMI ______ (50 위/아래? 방향은?)",
        "2. 미국 10-2년 스프레드 ______ %p (양수/음수?)",
        "3. 컨퍼런스보드 LEI ______ (전월 대비?)",
        "4. 한국 선행지수 순환변동치 ______ (100 위/아래?)",
        "5. 한국 수출 증가율 ______ % (전년 동월비)",
        "   └ 반도체 수출 ______ %",
        "",
        "📝 오늘의 계절 판단: ____________ (봄/여름/가을/겨울)",
      ],
      seasonTable: [
        { season: "🌸 봄", pmi: "상승 중 (50 돌파)", curve: "정상(+)", lei: "상승", verdict: "경기민감·성장주 유리" },
        { season: "☀️ 여름", pmi: "55+ 유지", curve: "정상", lei: "상승", verdict: "산업재·소재·금융 유리" },
        { season: "🍁 가을", pmi: "정점 후 하락", curve: "평탄화", lei: "하락 시작", verdict: "에너지·인플레 수혜" },
        { season: "❄️ 겨울", pmi: "50 아래", curve: "역전(-)", lei: "하락 지속", verdict: "필수소비재·헬스케어" },
      ],
      donts: [
        "지표 하나만 보고 결정하기 — 반드시 3~5개 지표를 함께 확인",
        "한 달 튀는 숫자에 흔들리기 — 3개월 이상 방향이 중요",
        "뉴스 헤드라인만 보고 매매 — 이미 반영된 정보일 확률 높음",
        "\"이번엔 다르다\"고 생각하기 — 역사는 반복됨",
        "손절 없이 확신하기 — 어떤 지표도 100%가 아님",
      ],
      nextActions: [
        "위 5개 사이트를 브라우저 즐겨찾기에 추가 (특히 FRED)",
        "매달 5일에 15분씩 대시보드 채우기 — 3개월만 해도 감이 옴",
        "예측이 아니라 관찰 일지 작성 → 3개월 뒤에 맞았는지 스스로 채점",
      ],
    },
  },
  {
    num: "06", color: "bg-orange-500", title: "🏃 모멘텀 — 시장의 관성",
    quote: "손실은 짧게, 이익은 길게",
    body: [
      { h: "🧠 모멘텀의 2대 원인", t: "① 정보 지연(뉴스가 계단식 반영) ② 군중심리(FOMO 눈덩이 효과)" },
      { h: "📚 2가지 종류", t: "시계열: 종목 vs 과거의 자기 자신 / 횡단면(RS): 종목 vs 다른 종목들" },
      { h: "💥 모멘텀 붕괴", t: "평소 안정적 수익 → 시장 급변 시 그동안 번 걸 짧게 토해냄. 강한 종목일수록 크게 무너짐" },
      { h: "🕳️ 심리 함정: 처분 효과", t: "오른 종목은 빨리 팔고 내린 종목은 오래 보유 → 모멘텀 원칙과 정반대" },
    ],
  },
  {
    num: "07", color: "bg-amber-500", title: "💪 상대강도(RS) — 주도주 찾기",
    quote: "강한 놈을 사라",
    body: [
      { h: "🧮 RS 정의", t: "RS = 종목 주가 ÷ 시장 지수 → 시간축으로 그린 선. 코스피 +1%, 종목 +3% = 시장보다 강함" },
      { h: "🏆 주도주가 계속 강한 이유", t: "① 돈의 관성(큰손 분할매수) ② 내러티브(강력한 스토리) ③ 실적(이익 증가)" },
      { h: "🔺 3단계 발굴법", t: "1) 시장 전체 방향 확인 2) RS 최강 섹터 선택 3) 그 섹터의 신고가+거래량 종목" },
    ],
  },
  {
    num: "08", color: "bg-emerald-500", title: "📉 거래량·수급 — 돈의 가속도",
    quote: "가격은 의견이고, 거래량은 사실이다",
    body: [
      { h: "📊 거래량 4경우", t: "↑가격+↑거래량=✅건강한 상승 · ↑가격+↓거래량=⚠️연료 부족 · ↓가격+↑거래량=🚨대량 매도 · ↓가격+↓거래량=💤바닥 다지기" },
      { h: "👥 3주체 특성", t: "외국인: 환율과 동행 / 기관: 급락 시 방파제(연기금 등) / 개인: 자금 분산·역발상 온도계" },
      { h: "🛠 실전 도구", t: "거래대금(금액 기준) · 20일 평균 대비 2~3배면 사건 발생 · 회전율 · OBV(누적 거래량 지표)" },
    ],
  },
  {
    num: "09", color: "bg-blue-500", title: "🎪 섹터 로테이션 — 모든 걸 통합",
    quote: "돈의 이사를 감지하는 기술",
    body: [
      { h: "🌸 경기 사계절 지도", t: "봄: 반도체·경기민감 성장주 / 여름: 산업재·소재·금융 / 가을: 에너지·인플레 수혜주 / 겨울: 필수소비재·헬스케어·유틸리티" },
      { h: "⚙️ 3대 엔진", t: "① 금리(성장주 vs 가치주) ② 환율·유동성(외국인 유입) ③ 경기 선행지표" },
      { h: "🚦 두 신호등 원칙", t: "거시 신호 + 모멘텀 신호 모두 초록일 때만 실행" },
      { h: "⚠️ 3대 함정", t: "① 뒷북 로테이션 ② 가짜 로테이션 ③ 계절 오판" },
    ],
  },
];

const scenarios = [
  { title: "✅ 두 신호등 초록", desc: "시장·모멘텀 모두 우호 → 분할 매수 시작 · 최대 신뢰도 → 손절선 미리 설정", color: "border-emerald-400 bg-emerald-50" },
  { title: "⚠️ 하나만 켜짐", desc: "거시 or 모멘텀 신호 불일치 → 관찰 목록에 등록 · 대기 → 포지션 크기 절반 이하", color: "border-amber-400 bg-amber-50" },
  { title: "🚨 둘 다 꺼짐", desc: "하락 또는 불확실 국면 → 현금 비중 확대 · 방어 섹터 → 매수 지양", color: "border-red-400 bg-red-50" },
];

const seasons = [
  { title: "🌸 봄 (회복)", desc: "반도체 · 경기민감 성장주", color: "border-emerald-400" },
  { title: "☀️ 여름 (확장)", desc: "산업재 · 소재 · 금융", color: "border-amber-400" },
  { title: "🍁 가을 (정점)", desc: "에너지 · 인플레 수혜", color: "border-red-400" },
  { title: "❄️ 겨울 (수축)", desc: "필수소비재 · 헬스케어 · 배당", color: "border-blue-400" },
];

type DeepDive = NonNullable<(typeof episodes)[number]["deepDive"]>;

function EpisodeDeepDive({ d }: { d: DeepDive }) {
  return (
    <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 space-y-4">
      <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg px-3 py-2 border border-blue-200">
        <span className="text-[11px] font-black text-slate-700">📚 왕초보 완전정복 딥다이브</span>
        <a href={d.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 underline">
          🎬 영상 보기 ({d.duration})
        </a>
      </div>

      <div className="text-center italic font-semibold text-slate-700 bg-white border-l-4 border-blue-400 rounded-r-lg px-3 py-3 leading-relaxed">
        "{d.summary}"
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-1">📖 지표는 3종류가 있어요</div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px] border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-1.5 font-bold border-b border-slate-300">종류</th>
                <th className="text-left p-1.5 font-bold border-b border-slate-300">시점</th>
                <th className="text-left p-1.5 font-bold border-b border-slate-300">예시</th>
                <th className="text-left p-1.5 font-bold border-b border-slate-300">비유</th>
              </tr>
            </thead>
            <tbody>
              {d.types.map((row, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-1.5 font-bold">{row.type}</td>
                  <td className="p-1.5 text-slate-600">{row.timing}</td>
                  <td className="p-1.5 text-slate-600">{row.example}</td>
                  <td className="p-1.5 text-slate-600">{row.metaphor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          💡 <b>왕초보 팁</b>: 뉴스에 나오는 "실업률 발표"는 대부분 <b>후행지표</b>예요. 이걸 보고 투자하면 늦어요!
        </div>
        <div className="mt-2 font-bold text-slate-800 mb-1">📖 왜 선행지표를 봐야 할까요?</div>
        <div className="italic border-l-4 border-blue-400 bg-white rounded-r-lg px-3 py-2 text-slate-600">
          {d.whySummary}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-1">✅ 팩트체크 — 이 영상 믿어도 될까?</div>
        <div className="space-y-1.5">
          {d.factCheck.map((f, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
              <div className="text-slate-700 font-semibold">{f.claim}</div>
              <div className="text-slate-500 mt-0.5">{f.reality}</div>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  f.verdict === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {f.verdict === "ok" ? "✅ 정확" : "⚠️ 대체로 맞음 / 세부확인"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-800">
          🎯 <b>팩트체크 최종 결론</b>
          <div className="mt-1 text-slate-600">{d.factCheckConclusion}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <div className="font-bold text-emerald-700 mb-1">👍 유익한 점</div>
          <ul className="space-y-1 text-slate-600">
            {d.pros.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
          <div className="font-bold text-red-700 mb-1">👎 한계</div>
          <ul className="space-y-1 text-slate-600">
            {d.cons.map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center bg-amber-50 border border-amber-200 rounded-lg py-2.5">
        <div className="text-lg">
          {"★".repeat(d.rating)}
          <span className="text-slate-300">{"★".repeat(5 - d.rating)}</span>
        </div>
        <div className="font-bold text-amber-800 text-[11px] mt-0.5">
          {d.rating}/5 — {d.ratingNote}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-1.5">🔍 선행지표 실제 확인 방법</div>
        <div className="space-y-2">
          {d.indicators.map((ind) => (
            <div key={ind.num} className="bg-white rounded-lg border border-slate-200 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {ind.num}
                </span>
                <span className="font-bold text-slate-800">{ind.title}</span>
                <span className="ml-auto bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0">
                  {ind.badge}
                </span>
              </div>
              <div className="text-slate-500 mb-1">📍 {ind.site}</div>
              <ul className="space-y-0.5 text-slate-600 mb-1.5">
                {ind.points.map((pt, i) => (
                  <li key={i}>· {pt}</li>
                ))}
              </ul>
              {ind.tip && (
                <div className="mb-1.5 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                  💡 <b>왕초보 팁</b>: {ind.tip}
                </div>
              )}
              {ind.alt && (
                <div className="mb-1.5 text-slate-500">
                  💡 <b>대안 (더 쉬움)</b>:{" "}
                  <a href={ind.alt.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    {ind.alt.label}
                  </a>
                </div>
              )}
              <a
                href={ind.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-blue-500 text-white rounded-md px-2.5 py-1 text-[10px] font-bold"
              >
                🔗 확인하러 가기
              </a>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-1.5">🛠️ 왕초보용 실전 대시보드 (매달 15분이면 끝)</div>
        <div className="text-slate-600 mb-1">📅 매달 5일경 (전월 지표 나온 뒤)</div>
        <pre className="bg-slate-100 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700">
          {"✅ 체크리스트 (모두 위 사이트에서 확인)\n\n" + d.monthlyChecklist.join("\n")}
        </pre>
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-1">🎯 지표 조합 해석 가이드</div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px] border-collapse min-w-[460px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-1.5 font-bold border-b border-slate-300">상황</th>
                <th className="text-center p-1.5 font-bold border-b border-slate-300">PMI</th>
                <th className="text-center p-1.5 font-bold border-b border-slate-300">금리차</th>
                <th className="text-center p-1.5 font-bold border-b border-slate-300">LEI</th>
                <th className="text-left p-1.5 font-bold border-b border-slate-300">판단</th>
              </tr>
            </thead>
            <tbody>
              {d.seasonTable.map((row, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-1.5 font-bold">{row.season}</td>
                  <td className="p-1.5 text-center text-slate-600">{row.pmi}</td>
                  <td className="p-1.5 text-center text-slate-600">{row.curve}</td>
                  <td className="p-1.5 text-center text-slate-600">{row.lei}</td>
                  <td className="p-1.5 text-slate-600">{row.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
        <div className="font-bold text-red-700 mb-1">🚫 왕초보가 절대 하지 말아야 할 것</div>
        <ul className="space-y-1 text-slate-600">
          {d.donts.map((x, i) => (
            <li key={i}>✕ {x}</li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
        <div className="font-bold text-blue-700 mb-1">💡 다음 액션 추천</div>
        <ol className="space-y-1 text-slate-600 list-decimal list-inside">
          {d.nextActions.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────────────────
export function ReborInsight() {
  const [sub, setSub] = useState("map");
  const [openEp, setOpenEp] = useState<string | null>(null);
  const [signals, setSignals] = useState({ macro: false, momentum: false });

  const onCount = (signals.macro ? 1 : 0) + (signals.momentum ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl border border-indigo-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-black rounded-full">외부 채널 학습 요약</span>
        </div>
        <h1 className="font-black text-lg mb-1">📊 리본 인사이트 — 중급 시즌 1 종합 학습판</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          유튜브 채널 <a href="https://www.youtube.com/@daily10stock" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">@daily10stock (리본 인사이트)</a>의
          중급 시즌 1(EP.02~EP.09) 강의 내용을 요약·정리하고, 정통 재무이론 기준으로 검증한 학습 자료입니다.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap text-[11px]">
          <span className="px-2 py-1 bg-white border border-border/30 rounded-full font-bold">🎓 학습용</span>
          <span className="px-2 py-1 bg-white border border-border/30 rounded-full font-bold">🧭 프레임워크</span>
          <span className="px-2 py-1 bg-white border border-red-200 text-red-600 rounded-full font-bold">⚠️ 매매신호 아님</span>
        </div>
      </div>

      {/* 서브탭 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none bg-slate-100 rounded-xl p-1">
        {SUBTABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setSub(t.value)}
            className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              sub === t.value ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 지도 ── */}
      {sub === "map" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-2">🎯 시즌 1의 핵심 논리</h2>
            <div className="text-sm italic border-l-4 border-indigo-400 bg-indigo-50 rounded-r-lg px-3 py-2 mb-3">
              "거시는 방향을 가리키고, 모멘텀은 그 방향을 확인한다"
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              시즌 1은 단순한 강의가 아니라 하나의 실전 매매 프레임워크입니다. 매크로 3대 엔진(금리·환율·유동성)으로 계절을 판단하고,
              모멘텀·RS·거래량으로 진짜 신호를 확인한 뒤, 섹터 로테이션으로 실행합니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-3">📈 지식 빌딩 블록</h2>
            <div className="space-y-1.5">
              {[
                { icon: "🎯", label: "EP.02 금리", desc: "자산의 중력 · 수익률 곡선", color: "bg-blue-50 border-blue-200" },
                { icon: "🌐", label: "EP.03 환율", desc: "외국인 자금의 나침반", color: "bg-teal-50 border-teal-200" },
                { icon: "💧", label: "EP.04 유동성", desc: "연준 대차대조표 · QE/QT", color: "bg-purple-50 border-purple-200" },
                { icon: "📊", label: "EP.05 선행지표", desc: "ISM PMI · 수익률 곡선", color: "bg-pink-50 border-pink-200" },
                { icon: "🏃", label: "EP.06 모멘텀", desc: "추세 추종 · 붕괴 리스크", color: "bg-orange-50 border-orange-200" },
                { icon: "💪", label: "EP.07 상대강도 RS", desc: "강한 놈을 사라", color: "bg-amber-50 border-amber-200" },
                { icon: "📉", label: "EP.08 거래량·수급", desc: "돈의 가속도", color: "bg-emerald-50 border-emerald-200" },
                { icon: "🎪", label: "EP.09 섹터 로테이션", desc: "모든 걸 통합한 실전", color: "bg-blue-50 border-blue-200" },
              ].map((s, i) => (
                <div key={i}>
                  <div className={`p-2.5 rounded-lg border text-xs ${s.color}`}>
                    <span className="font-black">{s.icon} {s.label}</span>
                    <span className="text-slate-500 ml-2">{s.desc}</span>
                  </div>
                  {i < 7 && <div className="text-center text-slate-300 text-xs">▼</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-2">🔑 반드시 기억할 5문장</h2>
            <ul className="space-y-2 text-xs text-slate-700">
              {[
                "금리는 자산 가격의 중력이다",
                "가격은 의견, 거래량은 사실이다",
                "강한 놈이 계속 강하다 (모멘텀)",
                "두 신호등이 모두 초록일 때만 실행",
                "예측이 아니라 신호 확인으로 따라간다",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── 8편 요약 ── */}
      {sub === "episodes" && (
        <div className="space-y-2">
          <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-700">
            💡 각 편을 터치하면 상세 요약이 펼쳐집니다
          </div>
          {episodes.map((ep) => (
            <div key={ep.num} className="bg-white rounded-xl border border-border/30 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenEp(openEp === ep.num ? null : ep.num)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className={`w-8 h-8 rounded-full ${ep.color} text-white text-xs font-black flex items-center justify-center shrink-0`}>
                  {ep.num}
                </span>
                <span className="flex-1 text-sm font-bold">{ep.title}</span>
                <span className={`text-slate-400 transition-transform ${openEp === ep.num ? "rotate-90" : ""}`}>▶</span>
              </button>
              {openEp === ep.num && (
                <div className="px-4 pb-4 bg-slate-50 text-xs space-y-3">
                  <div className="italic border-l-4 border-blue-400 bg-white rounded-r-lg px-3 py-2 text-slate-600">
                    "{ep.quote}"
                  </div>
                  {ep.body.map((b, i) => (
                    <div key={i}>
                      <div className="font-bold text-slate-800 mb-0.5">{b.h}</div>
                      <div className="text-slate-600 leading-relaxed">{b.t}</div>
                    </div>
                  ))}
                  {ep.caution && (
                    <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      ⚠️ {ep.caution}
                    </div>
                  )}
                  {ep.deepDive && <EpisodeDeepDive d={ep.deepDive} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 실시간 모니터 ── */}
      {sub === "monitor" && <MacroMonitorPanel />}

      {/* ── 대시보드 ── */}
      {sub === "dashboard" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-3">🚦 두 신호등 체커 (학습용 시뮬레이터)</h2>
            <p className="text-xs text-slate-500 mb-3">아래 신호등을 클릭해서 나만의 매매 신호를 판별해 보세요</p>

            <div className="text-xs font-bold mb-1.5">거시 신호등</div>
            <button
              onClick={() => setSignals((s) => ({ ...s, macro: !s.macro }))}
              className={`w-full p-4 rounded-xl border-2 mb-3 transition-all ${
                signals.macro ? "bg-emerald-50 border-emerald-400" : "bg-white border-border/30"
              }`}
            >
              <div className="text-2xl mb-1">🌍</div>
              <div className="text-xs font-bold">거시 우호</div>
              <div className={`text-[11px] mt-1 ${signals.macro ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                {signals.macro ? "🟢 켜짐" : "클릭해서 켜기"}
              </div>
            </button>
            <p className="text-[11px] text-slate-400 mb-4">확인: 금리 방향 / 환율 안정 / 유동성 우호 / 선행지표 개선</p>

            <div className="text-xs font-bold mb-1.5">모멘텀 신호등</div>
            <button
              onClick={() => setSignals((s) => ({ ...s, momentum: !s.momentum }))}
              className={`w-full p-4 rounded-xl border-2 mb-3 transition-all ${
                signals.momentum ? "bg-emerald-50 border-emerald-400" : "bg-white border-border/30"
              }`}
            >
              <div className="text-2xl mb-1">📈</div>
              <div className="text-xs font-bold">모멘텀 확인</div>
              <div className={`text-[11px] mt-1 ${signals.momentum ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                {signals.momentum ? "🟢 켜짐" : "클릭해서 켜기"}
              </div>
            </button>
            <p className="text-[11px] text-slate-400 mb-4">확인: RS 상승 / 거래량 20일평균 2배↑ / 수급 유입</p>

            <div
              className={`p-4 rounded-xl text-center font-black text-sm border-2 border-dashed ${
                onCount === 2
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : onCount === 1
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "bg-slate-50 border-slate-300 text-slate-500"
              }`}
            >
              {onCount === 2 && "✅ 실행! 분할 매수 시작 (손절선 필수)"}
              {onCount === 1 && "⚠️ 관찰 목록에 등록 · 대기"}
              {onCount === 0 && "⏸️ 두 신호등 상태를 확인 중..."}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-3">📊 상황별 시나리오 트리</h2>
            <div className="space-y-2">
              {scenarios.map((s, i) => (
                <div key={i} className={`p-3 rounded-xl border-l-4 ${s.color} text-xs`}>
                  <div className="font-black mb-1">{s.title}</div>
                  <div className="text-slate-600">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-3">🌡️ 4계절 섹터 지도</h2>
            <div className="grid grid-cols-2 gap-2">
              {seasons.map((s, i) => (
                <div key={i} className={`p-3 rounded-xl border-l-4 bg-slate-50 ${s.color} text-xs`}>
                  <div className="font-black mb-1">{s.title}</div>
                  <div className="text-slate-600">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 체크리스트 ── */}
      {sub === "checklist" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-1">📅 월간 (30분 · 매달 1회)</h2>
            <p className="text-xs text-slate-500 mb-3">거시 대시보드를 5줄로 요약하고 "지금의 계절"을 한 단어로 적기</p>
            <ul className="space-y-1.5 text-xs">
              {[
                "미국·한국 기준금리 방향 (인상/동결/인하)",
                "미국 10년물 - 2년물 스프레드 변화",
                "ISM 제조업·서비스업 PMI (50 위/아래 + 방향)",
                "원달러 환율 추세 + 한국 수출 증가율",
                "연준 대차대조표 (커지나·줄어드나·멈췄나)",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 last:border-0">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-1">📅 주간 (20분 · 매주 주말)</h2>
            <p className="text-xs text-slate-500 mb-3">섹터 상대강도 순위표 갱신 + 수급 확인</p>
            <ul className="space-y-1.5 text-xs">
              {[
                "주요 섹터 ETF의 1개월·3개월 수익률 대비 코스피",
                "지난주보다 순위가 2계단↑ 오른 섹터 표시",
                "상위 섹터의 거래대금·수급 주체 확인",
                "외국인·기관의 20일 누적 순매수 방향",
                "관심 종목: OBV vs 주가 괴리 여부",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 last:border-0">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-3">📅 매매 실행 전 필수 확인</h2>
            <ul className="space-y-1.5 text-xs">
              {[
                "거시 신호등 + 모멘텀 신호등 모두 초록인가?",
                "손절선(진입가 -5~10%) 미리 설정했나?",
                "한 번에 전량 아닌 분할 매수 계획인가?",
                "파는 이유와 사는 이유를 각각 적었나?",
                "추격매수/FOMO가 아닌 신호 기반인가?",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 last:border-0">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-3">⚠️ 반드시 피할 3대 함정</h2>
            <ul className="space-y-1.5 text-xs mb-3">
              {[
                { b: "뒷북 로테이션", d: "뉴스가 나오면 이미 중후반" },
                { b: "가짜 로테이션", d: "하루 급등을 추세로 오해" },
                { b: "계절 오판", d: "거시 해석 자체가 틀린 경우" },
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 last:border-0">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">!</span>
                  <span><b>{s.b}</b>: {s.d}</span>
                </li>
              ))}
            </ul>
            <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              💡 방어 원칙: 손절 규칙은 계절 판단보다 위에 둔다
            </div>
          </div>
        </div>
      )}

      {/* ── 총평 ── */}
      {sub === "verdict" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm text-center">
            <h2 className="font-black text-base mb-2">⭐ 최종 평가</h2>
            <div className="text-2xl mb-2">★★★★☆</div>
            <div className="inline-block px-4 py-2 bg-amber-50 border border-amber-300 rounded-full text-amber-700 font-black text-sm">
              4.0 / 5.0 — 학습용 강추, 매매용 비추
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-2">💭 종합 분석</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              리본 인사이트 채널은 AI 자동화 SaaS 회사(리본랩스)의 실증용 채널이지만, 시즌 1의 콘텐츠는 정통 재무·거시경제 이론과
              대체로 부합합니다. 매 편마다 실행 가능한 체크리스트를 제공한다는 점이 강력한 장점입니다.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              특히 "매크로 → 모멘텀 → 실행"이라는 프레임워크는 레이 달리오의 올웨더(All-Weather) 사고방식과 유사한 통합적 시각을
              훈련시켜 줍니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="font-black text-sm text-emerald-700 mb-2">👍 강점</div>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• 개념 정확성 (정통 이론과 일치)</li>
                <li>• 실행 가능한 체크리스트 문화</li>
                <li>• 직관적 은유 (중력·나침반·밀물)</li>
                <li>• 시즌제 커리큘럼 (지식이 쌓이는 구조)</li>
                <li>• 매매 지시가 아닌 프레임워크 교육</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50">
              <div className="font-black text-sm text-red-700 mb-2">👎 약점</div>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• 자막·수치 표기 오류 다수</li>
                <li>• RSI·MACD·이동평균 미포함</li>
                <li>• RS 계산 세부 규격 부재</li>
                <li>• 원자료 출처 링크 없음</li>
                <li>• 트랙레코드 없음 (구독자 269명)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-2">🎯 이런 분에게 추천</h2>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>• 감(感)이 아니라 프레임워크로 배우고 싶은 분</li>
              <li>• 매크로·모멘텀 단어 앞에서 막막한 분</li>
              <li>• 짧고 밀도 있는 강의를 선호하는 분 (12~15분)</li>
              <li>• 기술적 지표보다 시장 흐름을 이해하고 싶은 분</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-2">🚫 이런 분에겐 불충분</h2>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>• 매수·매도 신호를 원하는 분</li>
              <li>• 차트 기술적 분석 위주로 배우고 싶은 분</li>
              <li>• 검증된 트랙레코드 채널을 선호하는 분</li>
              <li>• 즉시 수익을 원하는 분</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h2 className="font-black text-base mb-2">💡 학습 후 추천 다음 단계</h2>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>Investopedia에서 RRG · RSI · MACD 심화 학습</li>
              <li>KRX 정보데이터시스템에서 실제 수급 데이터 확인</li>
              <li>증권사 리서치 리포트로 매크로 크로스체크</li>
              <li>모의 투자로 최소 6개월 프레임워크 검증</li>
              <li>다른 애널리스트 채널로 균형 잡힌 시각 유지</li>
            </ol>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-2 pb-4">
            📺 출처: <a href="https://www.youtube.com/@daily10stock" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">리본 인사이트</a> · 중급 시즌 1
            <br />⚠️ 본 페이지는 학습용 요약이며 투자 권유가 아닙니다. 모든 투자 판단은 원자료 재검증 후 본인 책임하에.
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 실시간 3대 엔진 + RS 모니터 (실데이터 기반)
// ────────────────────────────────────────────────────────────
function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || isNaN(v)) return "-";
  return v.toFixed(digits);
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function MacroMonitorPanel() {
  const { data, loading, error } = useMacroMonitor();

  const lightMeta = {
    green: { label: "🟢 우호적", color: "bg-emerald-50 border-emerald-300 text-emerald-700" },
    amber: { label: "🟡 중립/관망", color: "bg-amber-50 border-amber-300 text-amber-700" },
    red:   { label: "🔴 비우호적", color: "bg-red-50 border-red-300 text-red-700" },
  } as const;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-border/30 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-black text-base">📡 실시간 3대 엔진 + RS 모니터</h2>
          {data && (
            <span className="text-[10px] text-slate-400">
              {new Date(data.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          EP.02~09에서 배운 금리·환율·유동성·RS 지표를 Yahoo Finance 실시간 데이터로 자동 계산합니다. 5분마다 자동 갱신되며, 매매 신호가 아닌 참고용 프레임워크 도구입니다.
        </p>
      </div>

      {loading && !data && (
        <div className="bg-white rounded-2xl border border-border/30 p-8 text-center text-xs text-slate-400 shadow-sm">
          데이터 불러오는 중...
        </div>
      )}

      {error && !data && (
        <div className="bg-white rounded-2xl border border-red-200 p-5 text-center text-xs text-red-500 shadow-sm">
          데이터를 불러오지 못했습니다: {error}
        </div>
      )}

      {data && (
        <>
          {/* 종합 신호등 */}
          <div className={`rounded-2xl border-2 p-4 text-center font-black text-sm shadow-sm ${lightMeta[data.macroLight].color}`}>
            {lightMeta[data.macroLight].label} · 매크로 종합 점수 {data.macroScore}/3
          </div>

          {/* 1. 금리 엔진 */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-black text-sm mb-3">🎯 금리 엔진 — 수익률 곡선 (미국 10Y - 3M)</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">10년물</div>
                <div className="font-black text-sm">{fmtNum(data.rates.us10y)}%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">3개월물</div>
                <div className="font-black text-sm">{fmtNum(data.rates.us3m)}%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">스프레드</div>
                <div className={`font-black text-sm ${(data.rates.spreadNow ?? 0) < 0 ? "text-red-600" : "text-slate-800"}`}>
                  {fmtNum(data.rates.spreadNow)}%p
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full font-bold text-blue-700">
                곡선: {data.rates.curveStatus}
              </span>
              <span className="px-2 py-1 bg-slate-50 border border-border/30 rounded-full font-bold text-slate-600">
                추세: {data.rates.curveTrend}
              </span>
            </div>
          </div>

          {/* 2. 환율 엔진 */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-black text-sm mb-3">🌐 환율 엔진 — 원달러 환율</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">USD/KRW</div>
                <div className="font-black text-sm">{fmtNum(data.fx.usdkrwNow, 1)}원</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">1개월 변화</div>
                <div className={`font-black text-sm ${(data.fx.usdkrwChange1mo ?? 0) > 0 ? "text-red-600" : "text-blue-600"}`}>
                  {fmtPct(data.fx.usdkrwChange1mo)}
                </div>
              </div>
            </div>
            <span className="inline-block px-2 py-1 bg-teal-50 border border-teal-200 rounded-full text-[11px] font-bold text-teal-700">
              {data.fx.fxTrend}
            </span>
          </div>

          {/* 3. 유동성 엔진 (프록시) */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-black text-sm mb-1">💧 유동성 엔진 — 달러 인덱스(DXY) 프록시</h3>
            <p className="text-[11px] text-slate-400 mb-3">※ 연준 대차대조표 데이터는 실시간 연동이 어려워, 통상 역상관 관계인 달러 인덱스로 근사합니다</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">DXY</div>
                <div className="font-black text-sm">{fmtNum(data.liquidity.dxyNow, 1)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">1개월</div>
                <div className="font-black text-sm">{fmtPct(data.liquidity.dxyChange1mo)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">3개월</div>
                <div className="font-black text-sm">{fmtPct(data.liquidity.dxyChange3mo)}</div>
              </div>
            </div>
            <span className="inline-block px-2 py-1 bg-purple-50 border border-purple-200 rounded-full text-[11px] font-bold text-purple-700">
              {data.liquidity.liquidityStatus}
            </span>
          </div>

          {/* 4. RS 엔진 */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-black text-sm mb-3">💪 RS 엔진 — 반도체 2종목 vs KOSPI 상대강도</h3>
            <div className="space-y-2 mb-3">
              {[
                { name: "삼성전자", d: data.rs.samsung, color: "bg-blue-50 border-blue-200" },
                { name: "SK하이닉스", d: data.rs.skhynix, color: "bg-indigo-50 border-indigo-200" },
              ].map((s) => (
                <div key={s.name} className={`p-3 rounded-lg border ${s.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{s.name}</span>
                    <span className="font-black text-sm">{fmtNum(s.d.now, 1)}</span>
                  </div>
                  <div className="flex gap-3 text-[11px] text-slate-500">
                    <span>1개월: <b className={(s.d.chg1mo ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}>{fmtPct(s.d.chg1mo)}</b></span>
                    <span>3개월: <b className={(s.d.chg3mo ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}>{fmtPct(s.d.chg3mo)}</b></span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
              🏆 현재 주도주(RS 강도 우위): <b>{data.rs.leadingSector}</b> — EP.07 "강한 놈을 사라" 기준
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-1 pb-2 leading-relaxed">
            {data.note}
            <br />⚠️ 참고용 프레임워크 도구이며 매수·매도 신호가 아닙니다.
          </div>
        </>
      )}
    </div>
  );
}
