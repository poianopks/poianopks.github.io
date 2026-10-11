/** 메뉴(탭) 목록 — 화면 메뉴와 메뉴별 단독 페이지(dist/<value>/index.html) 생성에 함께 씁니다. */
export interface TabDef {
  value: string;
  label: string;
  short: string;
  /** 단독 페이지 제목·검색 설명 */
  title: string;
  desc: string;
}

export const SITE_NAME = "KOSPI 투자 분석 센터";

export const TABS: TabDef[] = [
  { value: "dashboard", label: "📊 현재 상황", short: "현재", title: "KOSPI 현재 상황 — 200일·200주 이격도와 PBR", desc: "KOSPI·S&P 500·나스닥 100의 200일·200주 이동평균 이격도, 과열 위험도, PBR 밸류에이션, 갭 캔들 통계를 한 화면에서 봅니다." },
  { value: "factcheck", label: "🔍 팩트체크", short: "팩트", title: "시장 팩트체크 — 미국 선물·한국 ADR·환율", desc: "미국 지수 선물, 해외 상장 한국 종목(ADR), 코스피 야간 방향(EWY), 원/달러 환율로 다음 날 한국 증시 분위기를 점검합니다." },
  { value: "history", label: "📜 역사 분석", short: "역사", title: "역사 분석 — 극단 이격도 이후 KOSPI는 어떻게 됐나", desc: "닷컴버블·금융위기·코로나 버블 등 과거 과열 구간과 대만·일본·나스닥 폭락 사례로 평균회귀 확률을 살펴봅니다." },
  { value: "strategy", label: "⚖️ 전략 비교", short: "전략", title: "전략 비교 — 일시매수 vs 적립식(DCA) vs 200일선 대기", desc: "S&P 500 17년 데이터로 일시매수·DCA·MA200 대기매수의 수익률을 비교하고 이동평균선의 올바른 활용법을 정리합니다." },
  { value: "scenarios", label: "🔮 시나리오", short: "시나리오", title: "KOSPI 미래 3가지 시나리오", desc: "평균회귀·기간 조정·새 패러다임 세 가지 시나리오의 확률, 목표 범위, 대응 전략을 정리합니다." },
  { value: "portfolio", label: "💼 자산 배분", short: "배분", title: "자산 배분 — 1억 운용 9가지 옵션 평가", desc: "현금·미국 ETF·선진국 ETF·금 등 바벨 전략 자산 배분과 한국 ETF 단계별 재진입 조건을 설명합니다." },
  { value: "decision", label: "🧭 실전 판단", short: "판단", title: "실전 판단 — 이격도 계산기와 분할매수 플랜", desc: "코스피 현재가와 이동평균을 넣으면 위험 점수와 레벨별 분할매수 금액을 계산해 주는 실전 판단 도구입니다." },
  { value: "wisdom", label: "🌟 현명투자", short: "현명", title: "현명투자 — 대가들의 투자 철학 10장", desc: "버핏·멍거·그레이엄·린치의 통찰을 마음가짐·분할·현금·평균회귀·복리 등 10개 장으로 엮은 투자 철학 읽을거리입니다." },
  { value: "quotes", label: "💎 명언 검증", short: "명언", title: "투자 명언 검증 — 진짜와 가짜 구별하기", desc: "투자 대가들의 검증된 명언과 출처 불명·왜곡된 가짜 명언을 구분하고 맥락과 숨은 이야기를 소개합니다." },
  { value: "mindset", label: "🌱 마인드", short: "마인드", title: "투자 마인드 — 흔들리지 않는 투자자의 마음가짐", desc: "조급함 대신 원칙, 몰빵 대신 분할, 공포 대신 계획 — 투자자의 마음가짐을 정리합니다." },
  { value: "ath", label: "⚡ ATH 생존전략", short: "ATH", title: "ATH 생존전략 — 사상 최고가 구간에서 살아남는 법", desc: "코스피가 사상 최고가를 경신할 때 숏·몰빵·전액 현금 대신 현금 90%+소액 분할매수로 대응하는 구조를 설명합니다." },
  { value: "semisignal", label: "🔮 천기누설", short: "천기누설", title: "천기누설 — 반도체 사이클 경보 (DRAM·삼성·하이닉스)", desc: "DRAM 현물·고정가 데드크로스, 삼성전자·SK하이닉스 이격도와 상대강도로 반도체 사이클 고점 신호를 추적합니다." },
  { value: "reborinsight", label: "📊 리본인사이트", short: "리본인사이트", title: "거시경제 학습 — 금리·환율·유동성·모멘텀", desc: "금리·환율·유동성·선행지표·모멘텀·상대강도·거래량·섹터 로테이션을 정리한 학습판과 실시간 매크로 모니터입니다." },
  { value: "trading", label: "📊 매매동향", short: "매매동향", title: "투자자 매매동향 바로가기", desc: "외국인·기관·개인 투자자별 매매동향을 확인할 수 있는 공식 데이터 바로가기와 읽는 법을 안내합니다." },
  { value: "telescope", label: "🔭 투자 망원경", short: "투자망원경", title: "투자 망원경 — 아침 5분 시장 날씨 점검", desc: "코스피·미국 지수·환율·금리차·달러로 오늘의 시장 날씨를 자동 진단하고, 대세 상승장이 꺾이는 신호를 점검합니다." },
  { value: "econocycle", label: "🕐 경기순환 사이클", short: "경기사이클", title: "경기순환 사이클 — 지금은 경기의 어느 계절인가", desc: "경기 선행지표로 현재 경기 사이클 위치를 진단하고 계절별 유리한 자산을 살펴봅니다." },
  { value: "aliveath", label: "🏔️ 살아있는 ATH", short: "살아있는ATH", title: "살아있는 ATH — 무너지지 않은 코스피 신고가", desc: "코스피 사상 최고가 중 이후 한 번도 종가가 그 아래로 내려가지 않은 ATH와 하락 시나리오별 소멸 개수를 분석합니다." },
  { value: "turnaround", label: "📈 턴어라운드", short: "턴어라운드", title: "턴어라운드 TOP 10 — 저가권 + 회복 모멘텀 종목", desc: "52주 저점 근처에서 반등 모멘텀과 거래량이 살아나는 종목을 자동 점수화한 TOP 10과 관심 종목 분석입니다." },
  { value: "news", label: "📰 경제·주식 뉴스", short: "뉴스", title: "경제·주식 뉴스 센터", desc: "국내 증시·경제·금리·환율·반도체·해외 증시 주요 뉴스를 1시간마다 모아 분류·검색·키워드로 보여 줍니다." },
];

/** 메뉴의 단독 페이지 주소 (예: /cld_eco/turnaround/) */
export function tabUrl(value: string, base: string = import.meta.env?.BASE_URL ?? "/cld_eco/") {
  return `${base}${value}/`;
}
