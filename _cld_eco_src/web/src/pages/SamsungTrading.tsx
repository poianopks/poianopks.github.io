export function SamsungTrading() {
  const links = [
    {
      icon: "📊",
      name: "네이버 증권 — KOSPI 매매동향",
      desc: "KOSPI 전체 외국인·기관·개인 매매 동향",
      url: "https://finance.naver.com/sise/sise_trans_style.nhn?sosok=01",
      tag: "추천",
      tagColor: "bg-blue-100 text-blue-700",
      border: "border-blue-300",
    },
    {
      icon: "🟢",
      name: "네이버 증권 — 삼성전자 투자자 동향",
      desc: "개인·외국인·기관 일별 순매수 차트 (기간별 누적 확인 가능)",
      url: "https://finance.naver.com/item/frgn.naver?code=005930",
      tag: "추천",
      tagColor: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-300",
    },
  ];

  return (
    <div className="space-y-4 pb-10">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-black tracking-tight mb-1">📊 투자자 매매동향</h2>
        <p className="text-slate-300 text-sm">네이버 증권 실시간 데이터 바로가기</p>
      </div>

      <div className="space-y-3">
        {links.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-4 p-5 bg-white border-2 ${item.border} rounded-2xl hover:shadow-md transition-all group`}
          >
            <span className="text-3xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-sm text-slate-800 group-hover:text-primary leading-tight">{item.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${item.tagColor}`}>{item.tag}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <span className="text-slate-400 group-hover:text-primary text-xl flex-shrink-0">→</span>
          </a>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        네이버 증권 PC 버전 링크 · 클릭 시 새 탭으로 열립니다
      </p>
    </div>
  );
}
