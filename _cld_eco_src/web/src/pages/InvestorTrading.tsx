export function InvestorTrading() {
  return (
    <div className="space-y-5 pb-10">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-black tracking-tight mb-1">📊 KOSPI 투자자 매매동향</h2>
        <p className="text-slate-300 text-sm">외국인 · 기관 · 개인 순매수 누적 추이</p>
      </div>

      {/* 연결 불가 안내 */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">⚠️</span>
          <div>
            <h3 className="font-black text-amber-800 text-base mb-2">
              KRX 실시간 데이터 연결 불가
            </h3>
            <p className="text-amber-700 text-sm leading-relaxed mb-3">
              한국거래소(KRX)의 투자자 매매동향 API는 서버 IP 차단으로 인해
              외부에서 직접 접근이 불가능합니다. 가짜 데이터를 표시하는 것은
              투자 판단에 오히려 해롭기 때문에, 실제 데이터를 확인할 수 있는
              공식 링크를 안내해 드립니다.
            </p>
            <div className="text-xs text-amber-600 bg-amber-100 rounded-lg px-3 py-2 inline-block font-mono">
              KRX API 응답: "LOGOUT" (세션/IP 차단)
            </div>
          </div>
        </div>
      </div>

      {/* 실제 데이터 링크 */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <h3 className="font-black text-sm">🔗 실제 데이터 확인 링크</h3>
          <p className="text-xs text-muted-foreground mt-1">아래 링크에서 실시간 투자자 매매동향을 확인하세요</p>
        </div>
        <div className="p-4 space-y-3">
          {[
            {
              icon: "📊",
              name: "KRX 한국거래소 정보데이터시스템",
              desc: "KOSPI 전체 투자자별 매매동향 공식 데이터",
              url: "http://data.krx.co.kr/contents/MDC/STAT/standard/MDCSTAT02302.cmd",
              tag: "공식",
              tagColor: "bg-blue-100 text-blue-700",
            },
            {
              icon: "🟢",
              name: "네이버 증권 — KOSPI 투자자별 동향",
              desc: "외국인·기관·개인 일별 순매수 차트 제공",
              url: "https://finance.naver.com/sise/investorDealTrendDay.naver",
              tag: "추천",
              tagColor: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: "📱",
              name: "네이버 증권 앱",
              desc: "모바일 앱에서 투자자 탭 → KOSPI 전체 순매수 확인",
              url: "https://m.stock.naver.com/domestic/index/KOSPI/investor",
              tag: "모바일",
              tagColor: "bg-purple-100 text-purple-700",
            },
            {
              icon: "🏦",
              name: "한국투자증권 / 삼성증권 HTS·MTS",
              desc: "증권사 앱 로그인 후 시장 → 투자자동향 메뉴",
              url: "https://securities.samsung.com/",
              tag: "앱",
              tagColor: "bg-slate-100 text-slate-700",
            },
          ].map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-primary hover:bg-slate-50 transition-all group"
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-slate-800 group-hover:text-primary">{item.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.tagColor}`}>{item.tag}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-slate-400 group-hover:text-primary text-lg flex-shrink-0">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* 읽는 법 가이드 */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <h3 className="font-black text-sm mb-4">💡 투자자 매매동향 읽는 법</h3>
        <div className="space-y-3">
          {[
            {
              color: "#2563eb", bg: "bg-blue-50", border: "border-blue-200", label: "외국인 순매수 지속 증가",
              desc: "강세장 핵심 지표. 외국인이 산다 = 글로벌 자금이 한국 시장을 긍정적으로 본다는 신호.",
            },
            {
              color: "#059669", bg: "bg-emerald-50", border: "border-emerald-200", label: "기관(연기금) 순매수",
              desc: "장기 저평가 판단. 하락장에서 기관 순매수 전환은 강력한 반등 신호.",
            },
            {
              color: "#dc2626", bg: "bg-red-50", border: "border-red-200", label: "개인 대량 순매수 주의",
              desc: "역사적으로 개인이 폭발적으로 살 때(동학개미 등) = 단기 고점 경고. 외국인·기관이 동시에 파는지 확인.",
            },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-3`}>
              <div className="text-xs font-black mb-1" style={{ color: item.color }}>{item.label}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        KRX 실시간 연결 제한으로 외부 링크로 대체 안내 · 향후 API 우회 방법 확보 시 업데이트 예정
      </p>
    </div>
  );
}
