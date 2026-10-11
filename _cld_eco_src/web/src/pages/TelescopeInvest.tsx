export function TelescopeInvest() {
  const apps = [
    {
      name: "🔭 망원경 투자자 (Telescope)",
      url: "https://stock-sense.replit.app/telescope/",
      badge: "핵심 추천",
      badgeColor: "bg-blue-500",
      desc: "실시간 KOSPI·NASDAQ·S&P500 시세 + FRED 매크로 지표(PMI·CPI·금리·수익률 곡선) + AI 뉴스 24개 동시 수집. '시장의 폭풍을 먼저 보고 행동을 정하는' 망원경 컨셉.",
      strengths: ["FRED 실시간 매크로(5개 지표 한 화면)", "AI 뉴스 24건 자동 분류(세계/한국/주식)", "공포·탐욕 지수 실시간", "30초 자동 갱신"],
      usage: "매일 아침 1회 + 시장 급변 시 즉시 확인. PMI·수익률 곡선·공포탐욕 3가지만 보면 오늘의 시장 온도 파악 완료.",
    },
    {
      name: "🧭 마켓 나침반 (Market Compass)",
      url: "https://stock-sense.replit.app/market-compass/",
      badge: "글로벌 한눈",
      badgeColor: "bg-emerald-500",
      desc: "다우·KOSPI·NASDAQ·S&P·원달러 5개 지수 실시간 + KOSPI 1년 차트 + 한국/미국 주요 종목 스파크라인. 글로벌 시장 전체를 한 화면에.",
      strengths: ["5개 주요 지수 동시 비교", "주요 종목 스파크라인 트렌드", "매크로 지표·투자 철학·분석 도구 서브탭", "용어 사전 46개+"],
      usage: "장 시작 전 글로벌 야간 흐름 확인. '어디가 오르고 어디가 빠졌나' 5초 파악.",
    },
    {
      name: "🔬 스마트 렌즈 (Stock Lens)",
      url: "https://stock-sense.replit.app/stock-lens/",
      badge: "반도체 전문",
      badgeColor: "bg-purple-500",
      desc: "HBM 반도체 사이클 실시간 추적 (SK하이닉스 HBM 점유율 62%, 영업이익률 50.7%). 경기 사이클 위치(호황기·고점·후퇴·불황기) + 3원칙 체크리스트.",
      strengths: ["HBM 점유율·이익률 실시간", "FRED 기반 경기 사이클 위치 게이지", "3가지 원칙 체크(호향·비용·경쟁)", "10년 결정적 순간 타임라인"],
      usage: "SK하이닉스·삼성전자 매수/매도 타이밍 점검. 사이클 게이지가 '호황기' 이면 보유, '고점' 근접 시 분할 매도 검토.",
    },
    {
      name: "📈 투자 나침반 (Invest Master)",
      url: "https://stock-sense.replit.app/invest-master/",
      badge: "이론 + 실전",
      badgeColor: "bg-amber-500",
      desc: "SK하이닉스·삼성전자·마이크론·NVIDIA 4종 실시간 주가 + '슈퍼사이클은 없다'·'감산→공급부족 공식'·'P×Q×E 공식' 등 핵심 이론 학습.",
      strengths: ["4종 반도체 주가 실시간 비교", "PxQxE·비트그로스 계산기", "사이클 분석·시그널 트래커", "2018 데자뷰 경고 알림"],
      usage: "반도체 주식 공부용. 이론(P×Q×E 공식)을 배우고 실전 시그널 트래커로 매매 타이밍 체크.",
    },
  ];

  const analysisDate = "2026년 7월 8일";

  const signals = [
    { icon: "📊", label: "KOSPI", value: "7,562 (−1.22%)", detail: "ATH 9,385 대비 −19.4% 조정", color: "text-red-600" },
    { icon: "🇺🇸", label: "NASDAQ", value: "25,819 (−1.16%)", detail: "고점 대비 약 −5~7% 조정 수준", color: "text-red-600" },
    { icon: "😰", label: "공포·탐욕", value: "43 — 공포", detail: "역사적으로 '공포' 구간 = 매수 기회 구간", color: "text-amber-600" },
    { icon: "🏭", label: "ISM PMI", value: "60 (강한 확장)", detail: "50 초과 = 경기 확장. 강세장은 PMI 60대에서 무너지지 않음", color: "text-emerald-600" },
    { icon: "📈", label: "수익률 곡선(10Y-2Y)", value: "+0.36%p (정상)", detail: "양수 = 역전 없음 = 침체 신호 없음", color: "text-emerald-600" },
    { icon: "💰", label: "연방기금리", value: "3.63%", detail: "고금리 지속 중이나 인상 사이클은 종료", color: "text-amber-600" },
    { icon: "🔥", label: "CPI(YoY)", value: "4.3%", detail: "아직 목표(2%) 상회 → Fed 인하 속도 제약", color: "text-amber-600" },
    { icon: "🤖", label: "NVIDIA", value: "$197 (+0.71%)", detail: "AI 반도체 대장주 상승 → AI 투자 사이클 유효", color: "text-emerald-600" },
  ];

  const historicalParallels = [
    {
      year: "1987 블랙먼데이",
      similarity: "높음",
      simColor: "text-amber-600",
      context: "강세장 중반 급락 (−22% 단일일). 경기는 탄탄, PMI 정상. → 이후 3년간 bull market 지속",
      lesson: "경제 펀더멘털이 살아있는 조정은 결국 회복됨",
    },
    {
      year: "1998 LTCM 위기",
      similarity: "높음",
      simColor: "text-amber-600",
      context: "러시아 디폴트→글로벌 패닉→NASDAQ 30% 급락. PMI 정상, 수익률 곡선 양수. → 이후 2년간 폭등",
      lesson: "공포 지수 40대 이하 = 역사적 매수 구간",
    },
    {
      year: "2018 Q4",
      similarity: "중간",
      simColor: "text-blue-600",
      context: "미중 무역전쟁 + Fed 금리 인상 → S&P −20%. PMI 55, 수익률 곡선 아직 양수. → 2019년 강한 반등",
      lesson: "무역 분쟁/금리 공포 조정은 펀더멘털 붕괴 아님",
    },
    {
      year: "2000 IT 버블 붕괴",
      similarity: "낮음",
      simColor: "text-emerald-600",
      context: "PMI 하락 전환, 수익률 곡선 역전, P/E 100배+. 구조적 버블 붕괴 시작",
      lesson: "현재와 다름: 수익률 곡선 정상, PMI 60, AI 기업 실제 이익 창출 중",
    },
    {
      year: "2022 하락장",
      similarity: "낮음",
      simColor: "text-emerald-600",
      context: "수익률 곡선 역전(−0.9%p), CPI 9%, Fed 75bp 인상 연속. 대세 하락 조건 완비",
      lesson: "현재 수익률 곡선 +0.36%p — 2022년과 근본 다름",
    },
  ];

  const verdictPoints = [
    { verdict: "✅ 강세 유지 근거", color: "border-emerald-400 bg-emerald-50", items: [
      "PMI 60 — 역사상 강세장은 PMI 60대에서 꺾인 적 거의 없음",
      "수익률 곡선 +0.36%p — 침체 선행 신호(역전) 없음",
      "NVIDIA +0.71% — AI 반도체 투자 사이클 아직 살아있음",
      "공포탐욕 43 — Sir John Templeton: '강세장은 비관 속에서 자란다'",
      "SK하이닉스 HBM 점유율 62% — 실적 기반 견고",
    ]},
    { verdict: "⚠️ 주의 신호", color: "border-amber-400 bg-amber-50", items: [
      "KOSPI ATH 9,385 대비 −19.4% — 기술적 조정 깊어짐",
      "15일 연속 하락 우세 — 단기 추세 붕괴 경계 필요",
      "CPI 4.3% — Fed 조기 인하 어려움 → 유동성 제약",
      "삼성전자 −2.53%, 마이크론 −4.71% — 메모리 조정 압박",
      "소비자심리 44.8 — 실물경기 약화 우려",
    ]},
  ];

  const conclusion = {
    title: "AI 종합 판단 — 2026.7.8 기준",
    verdict: "대세 상승장은 현재도 유효 (확률 약 70%)",
    subVerdict: "다만 KOSPI 기준 '중기 조정 국면' 진행 중",
    reasoning: [
      "대세 하락장(Bear Market)의 3대 조건: ① 수익률 곡선 역전 ② PMI 45 미만으로 추락 ③ 신용 스프레드 급등 — 현재 3개 모두 미충족",
      "15일 연속 하락은 '단기 추세 약화'이지 '대세 전환 확인'이 아님. 대세 전환은 보통 6개월 이상 선행지표 악화 후 발생",
      "AI 반도체(NVIDIA +0.71%)가 버티는 한, AI 관련 설비투자(CAPEX) 사이클은 살아있음 — 이것이 현재 강세장의 핵심 엔진",
      "Benjamin Graham: '시장은 단기적으로 투표기계, 장기적으로 저울.' 공포 43 구간은 저울이 가격을 낮게 측정하는 시점",
    ],
    scenario: [
      { prob: "70%", label: "조정 후 재상승", desc: "KOSPI 7,000~7,500 박스권 소화 → 연말 8,000~8,500 회복 시도. 미 PMI 유지·AI 투자 지속이 전제조건" },
      { prob: "20%", label: "추가 조정 심화", desc: "KOSPI 6,500~7,000 추가 하락. CPI 재상승 or 트럼프 관세 확대 시 발동. 대세 하락장은 아님" },
      { prob: "10%", label: "대세 하락장 전환", desc: "수익률 곡선 역전 + PMI 45 하락 + 글로벌 신용위기 동시 발생 시. 현재 조건 미충족" },
    ],
    action: "지금 해야 할 것: ① 공포에 팔지 말 것 ② 분할 매수 기회로 활용 ③ NVIDIA·SK하이닉스 등 AI 반도체 핵심주 비중 유지 ④ 매달 망원경 앱으로 PMI·수익률 곡선 모니터링",
    quote: "\"강세장은 비관 속에서 태어나, 회의 속에서 자라며, 낙관 속에서 성숙하다가, 행복감 속에서 죽는다.\" — Sir John Templeton\n\n지금 시장의 온도: 비관과 회의 사이 = 역사적으로 강세장의 중간 구간",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔭</span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">망원경투자</h1>
            <p className="text-slate-500 text-sm">stock-sense.replit.app — 4개 앱 완전 분석 + 2026.7.8 시장 판단</p>
          </div>
        </div>
      </div>

      <a
        href="https://stock-sense.replit.app/telescope/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all group"
      >
        <div>
          <div className="text-lg font-black mb-0.5">🔭 망원경 투자자 — 바로 열기</div>
          <div className="text-blue-100 text-sm">실시간 KOSPI·NASDAQ·FRED 매크로·AI뉴스 한 화면 · 30초 자동갱신</div>
          <div className="text-blue-200 text-xs mt-1">stock-sense.replit.app/telescope/</div>
        </div>
        <span className="text-4xl group-hover:translate-x-1 transition-transform">↗</span>
      </a>

      <div>
        <h2 className="text-lg font-black text-slate-800 mb-3">📋 4개 앱 완전 분석 & 평가</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <div key={app.name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-black text-slate-800 text-sm leading-tight">{app.name}</div>
                <span className={`shrink-0 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${app.badgeColor}`}>{app.badge}</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">{app.desc}</p>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">핵심 기능</div>
                <ul className="space-y-0.5">
                  {app.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-600">✓ {s}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">유익하게 사용하는 법</div>
                <p className="text-xs text-slate-600">{app.usage}</p>
              </div>
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-center bg-slate-800 text-white text-xs font-bold rounded-lg py-1.5 hover:bg-slate-700 transition-colors"
              >
                열기 ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-4 border-blue-500 pt-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{analysisDate} 오늘의 답</span>
          <span className="text-slate-400 text-xs">AI 분석 기준 · 투자 권유 아님</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 mt-2 leading-tight">
          지금 대세 상승장이 꺾인 건가요?<br />
          <span className="text-blue-600">나스닥·코스피 15일 연속 하락 — 진짜 하락장의 시작?</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {signals.map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
            <div className="text-lg">{s.icon}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">{s.label}</div>
            <div className={`font-black text-sm ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 leading-snug">{s.detail}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-black text-slate-800 mb-3">📚 역사는 뭐라고 하는가 — 과거 유사 사례 비교</h3>
        <div className="space-y-2">
          {historicalParallels.map((h, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-slate-800 text-sm">{h.year}</span>
                <span className={`text-xs font-bold ${h.simColor}`}>현재 유사도: {h.similarity}</span>
              </div>
              <p className="text-xs text-slate-600 mb-1">{h.context}</p>
              <p className="text-xs text-blue-700 font-bold">💡 교훈: {h.lesson}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {verdictPoints.map((vp, i) => (
          <div key={i} className={`border-l-4 rounded-xl p-4 ${vp.color}`}>
            <div className="font-black text-slate-800 mb-2">{vp.verdict}</div>
            <ul className="space-y-1">
              {vp.items.map((item, j) => (
                <li key={j} className="text-xs text-slate-700">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{analysisDate} 최종 판단</span>
        </div>
        <h3 className="text-xl font-black mb-1">{conclusion.verdict}</h3>
        <p className="text-blue-300 text-sm mb-4">{conclusion.subVerdict}</p>

        <div className="space-y-2 mb-4">
          {conclusion.reasoning.map((r, i) => (
            <div key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-blue-400 shrink-0 font-bold">{i + 1}.</span>
              <span>{r}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 mb-4">
          <div className="font-bold text-blue-300 text-xs uppercase mb-2">시나리오별 확률</div>
          <div className="space-y-2">
            {conclusion.scenario.map((sc, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`shrink-0 font-black text-sm px-2 py-0.5 rounded ${i === 0 ? "bg-emerald-500/30 text-emerald-300" : i === 1 ? "bg-amber-500/30 text-amber-300" : "bg-red-500/30 text-red-300"}`}>{sc.prob}</span>
                <div>
                  <span className="font-bold text-white text-sm">{sc.label}</span>
                  <p className="text-slate-400 text-xs">{sc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 mb-4">
          <div className="font-bold text-blue-300 text-xs mb-1">🎯 지금 해야 할 행동</div>
          <p className="text-white text-sm">{conclusion.action}</p>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="font-bold text-amber-300 text-xs mb-2">📜 역사의 격언</div>
          <p className="text-slate-300 text-sm italic whitespace-pre-line">{conclusion.quote}</p>
        </div>
      </div>

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
        ⚠️ 본 분석은 2026년 7월 8일 기준 공개 데이터(FRED·Yahoo Finance·ISM)와 역사적 패턴을 기반으로 한 AI 확률적 추론입니다. 미래를 보장하지 않으며, 투자 권유가 아닌 정보 제공 목적입니다. 최종 투자 결정은 본인의 판단과 책임 하에 하시기 바랍니다.
      </div>
    </div>
  );
}
