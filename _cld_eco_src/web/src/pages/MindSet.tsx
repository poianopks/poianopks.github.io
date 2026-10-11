import { Card, CardContent } from "@/components/ui/card";

// 원본 MindSet 페이지는 파일이 100KB를 넘어 자동 복사 도구로 가져오지 못했습니다.
// 원본 파일(artifacts/kospi-analysis/src/pages/MindSet.tsx)을 이 자리에 붙여 넣으면 그대로 동작합니다.
export function MindSet() {
  return (
    <div className="space-y-6">
      <div className="text-center py-6 border-b-2 border-emerald-200">
        <div className="text-3xl mb-2">🌱</div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">마인드 — 투자자의 마음가짐</h2>
        <p className="text-muted-foreground text-sm">이 탭의 전체 내용은 원본 앱에서 볼 수 있어요.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4 text-sm leading-relaxed">
          <p>
            원본 Replit 앱의 <strong>마인드</strong> 탭은 내용이 아주 많아서(100KB 이상) 이번 정적 사이트 이전 때
            자동으로 옮기지 못했습니다. 아래 버튼으로 원본 앱에서 확인해 주세요.
          </p>
          <a
            href="https://stock-insights-pianopks1.replit.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            🌱 원본 앱에서 마인드 탭 보기 ↗
          </a>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            핵심 요약: 조급함 대신 원칙, 몰빵 대신 분할, 공포 대신 계획. 현명투자·명언 검증 탭도 함께 읽어 보세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
