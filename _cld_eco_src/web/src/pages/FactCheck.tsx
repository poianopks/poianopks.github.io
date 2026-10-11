import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useGlobalMarket, type MarketItem } from "@/hooks/useGlobalMarket";
import { useGlobalMarketHistory } from "@/hooks/useGlobalMarketHistory";
import { useAdrHistory } from "@/hooks/useAdrHistory";

// ── EWY 히스토리 훅 ─────────────────────────────────────────────────────────
interface EwyBar {
  date: string; open: number | null; high: number | null;
  low: number | null; close: number | null; volume: number | null;
  changePct: number; ma20: number | null; ma60: number | null;
}
function useEwyHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["ewy-history"],
    queryFn: async () => {
      const r = await fetch("/api/stocks/ewy-history");
      if (!r.ok) throw new Error("EWY 히스토리 로딩 실패");
      return r.json() as Promise<{ daily: EwyBar[]; weekly: EwyBar[]; updatedAt: string }>;
    },
    staleTime: 25 * 60 * 1000,
  });
  return { data, loading: isLoading };
}

function pctColor(v: number) {
  if (v > 0) return "text-red-600";
  if (v < 0) return "text-blue-600";
  return "text-slate-500";
}
function pctBg(v: number) {
  if (v > 0) return "bg-red-50 border-red-200";
  if (v < 0) return "bg-blue-50 border-blue-200";
  return "bg-slate-50 border-slate-200";
}
function arrow(v: number) {
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
}

function MarketCard({ item, onClick, selected }: {
  item: MarketItem;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border-2 p-3 transition-all ${pctBg(item.changePct)}
        ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : ""}
        ${selected ? "ring-2 ring-indigo-400 shadow-md" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-xs font-bold text-slate-700">{item.emoji && `${item.emoji} `}{item.name}</span>
          <span className="ml-1.5 text-[10px] text-slate-400">{item.symbol}</span>
        </div>
        <div className="flex items-center gap-1">
          {onClick && <span className="text-[9px] text-slate-300">📈</span>}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            item.marketState === "REGULAR"                     ? "bg-emerald-100 text-emerald-700" :
            item.marketState === "PRE" || item.marketState === "PREPRE" ? "bg-amber-100 text-amber-700" :
            item.marketState === "POST" || item.marketState === "POSTPOST" ? "bg-orange-100 text-orange-600" :
                                                                 "bg-slate-100 text-slate-500"
          }`}>
            {item.marketState === "REGULAR"                       ? "🟢 진행중" :
             item.marketState === "PRE" || item.marketState === "PREPRE"   ? "🟡 프리마켓" :
             item.marketState === "POST" || item.marketState === "POSTPOST" ? "🟠 장후거래" :
                                                                              "⚫ 마감됨"}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg font-black text-slate-800">
          {item.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </span>
        <span className={`text-sm font-black ${pctColor(item.changePct)}`}>
          {arrow(item.changePct)} {Math.abs(item.changePct).toFixed(2)}%
        </span>
      </div>
      {item.note && <div className="text-[10px] text-slate-400 mt-0.5">{item.note}</div>}
    </div>
  );
}

// ── ADR 국내 연동 · 상호 영향 · 미래 전망 전체 데이터 ─────────────────────
interface AdrMetaType {
  koreanCode: string; market: "코스피" | "코스닥";
  description: string;          // 종목 상세 설명
  usUpMeaning: string;          // 미국서 오르면 좋은지 여부 + 주의사항
  influence: string;            // 코스피 상호 영향
  bullConditions: string[];     // 호재 조건
  bearConditions: string[];     // 악재 조건
  positiveOutlook: string;      // 긍정 전망
  negativeOutlook: string;      // 부정 전망
}
const ADR_META: Record<string, AdrMetaType> = {
  PKX: {
    koreanCode: "005490.KS", market: "코스피",
    description: "한국 최대 철강사에서 2차전지 소재 기업으로 전환 중. 포스코퓨처엠(양극재), 포스코리튬솔루션(리튬) 등 자회사가 미래 성장 동력. 전통 철강과 친환경 소재 두 축을 병행하는 독특한 포트폴리오 보유.",
    usUpMeaning: "대체로 긍정. PKX 상승 = 글로벌 철강 수요 개선 or 2차전지 소재 기대감 반영 → 다음날 국내 포스코홀딩스 시초가 갭상승 경향. 단, 달러 강세로 인한 ADR 명목 상승이면 국내 실질 상승은 제한될 수 있음.",
    influence: "PKX 전일 등락은 다음날 국내 시초가에 직접 선반영. 외국인이 PKX로 한국 철강·소재 섹터 방향을 먼저 결정.",
    bullConditions: ["전기차 수요 반등 (리튬·양극재 주문 증가)", "리튬 가격 상승 전환", "중국 철강 과잉공급 규제 강화", "미국 IRA 배터리 소재 보조금 수혜 확대", "포스코퓨처엠 대형 수주 발표"],
    bearConditions: ["전기차 수요 둔화 or 재고 증가", "리튬 가격 지속 하락", "중국산 저가 철강재 공세 심화", "원자재 가격 급등으로 원가 압박", "배터리 소재 계약 취소/연기"],
    positiveOutlook: "리튬·양극재 수직계열화 완성 시 2차전지 소재 수퍼사이클 최대 수혜. 전기차 수요 회복 + IRA 보조금 = ADR·국내주 동반 강세 가능. 철강 업황 회복 시 전통부문도 실적 개선.",
    negativeOutlook: "전통 철강 업황 부진 장기화 + 리튬 공급과잉 지속 시 이중 악재. 2차전지 전환 비용이 수익성 악화로 이어질 경우 밸류에이션 재조정 압박.",
  },
  KB: {
    koreanCode: "105560.KS", market: "코스피",
    description: "국민은행·KB증권·KB손보·KB카드 등을 보유한 한국 1위 금융지주. 배당성향이 높아 외국인 장기 보유 선호. 한국 밸류업 프로그램의 핵심 수혜 기대 종목.",
    usUpMeaning: "강한 긍정 신호. KB ADR 상승 = 외국인이 한국 금융주에 자금 투입 결정 → 다음날 국내 은행주 전반 강세. 한국 금리·경기 전망 개선 기대가 ADR에 즉시 반영됨.",
    influence: "KB ADR 급락은 다음날 국내 금융주 전반 약세 신호. 외국인 자금 유입/유출 바로미터로 기관 수급 예측에 활용.",
    bullConditions: ["미국 금리 인하 → 한국 은행주 밸류 재평가", "정부 밸류업 프로그램 진전 (자사주 소각·배당 확대)", "부동산 PF 부실 우려 완화", "NIM(순이자마진) 방어 성공", "KB증권 IB 대형 딜 성사"],
    bearConditions: ["한국 부동산 PF 대규모 부실화", "금리 급락으로 NIM 축소", "강력한 DSR·LTV 대출 규제", "인터넷은행(카카오뱅크·토스뱅크) 점유율 잠식", "경기침체로 대출 연체율 급등"],
    positiveOutlook: "밸류업 프로그램 본격화 시 PBR 0.6배 → 1배 재평가 기대. 배당수익률 5%+ 유지로 외국인 장기 보유 구조. 금리 인하 사이클 수혜.",
    negativeOutlook: "PF 대출 부실 현실화 시 충당금 급증 → 실적 쇼크. 인터넷은행의 구조적 성장으로 전통은행 시장점유율 장기 하락 우려.",
  },
  SHG: {
    koreanCode: "055550.KS", market: "코스피",
    description: "신한은행·신한투자증권·신한카드를 보유한 금융지주. KB금융의 최대 경쟁자. 동남아(베트남·인도네시아) 디지털금융 진출이 가장 적극적이며 해외 성장 기대가 가장 큰 금융지주.",
    usUpMeaning: "강한 긍정. KB ADR과 함께 오르면 한국 금융 섹터 전체 긍정 신호. SHG만 오르면 신한 고유 호재(동남아 성과 등) 가능성. SHG·KB가 동시 하락하면 외국인 금융 섹터 매도 신호로 강력한 경고.",
    influence: "SHG·KB 동시 약세는 외국인의 한국 금융 섹터 전반 매도 신호. 두 ADR 스프레드가 KB vs 신한 경쟁력 판단 지표로 활용됨.",
    bullConditions: ["베트남·인도네시아 디지털뱅킹 고성장 지속", "비이자수익(WM·IB) 비중 확대 성공", "금리 인하로 국내 은행주 재평가", "자사주 소각·배당 확대 발표", "동남아 현지 IPO 성공"],
    bearConditions: ["동남아 환율 손실 확대", "신한카드 연체율 급등", "국내 DSR 규제 강화로 대출 성장 둔화", "증시 부진으로 증권 수수료 감소", "동남아 금융시장 규제 강화"],
    positiveOutlook: "동남아 디지털금융 성장이 해외 프리미엄 부여 근거. WM(자산관리)·연금 부문 확장으로 수익 다변화. KB 대비 해외 성장성 프리미엄 기대.",
    negativeOutlook: "동남아 사업 성과 가시화 지연 시 투자비용만 증가. 국내 은행업의 구조적 성장 한계는 KB와 동일하게 적용.",
  },
  KT: {
    koreanCode: "030200.KS", market: "코스피",
    description: "한국 2위 통신사. 유선·무선 통신 기반에서 AI 데이터센터·클라우드·AICT(AI+ICT)로 전환 중. 배당주 성격이 강해 방어주로 분류. KT클라우드를 통한 공공·기업 클라우드 시장 공략 중.",
    usUpMeaning: "긍정이나 신호 강도 약함. KT ADR은 변동성이 작아 큰 움직임이 없으면 특별한 시그널로 보기 어려움. 통신주 특성상 배당 매력으로 안정적. 급등 시 AI 인프라 테마 반영 가능성.",
    influence: "KT ADR은 한국 통신·AI 인프라 투자 의향 신호. 변동성이 낮아 방어주 성격 — 시장 전반 불안 시 상대적 강세 경향.",
    bullConditions: ["AI 데이터센터 수요 폭증 (전력·네트워크 독점)", "통신료 인상 허용", "KT클라우드 공공기관 대규모 수주", "5G SA 서비스 상용화 수익 본격화", "배당 확대 발표"],
    bearConditions: ["알뜰폰 MVNO 시장 점유율 잠식 가속", "AI 투자 대비 수익화 지연", "전력 비용 급등으로 데이터센터 마진 압박", "통신료 규제 강화", "KT클라우드 상장 지연"],
    positiveOutlook: "AI 인프라 수요 폭발 → 데이터센터·네트워크 수혜. KT클라우드 상장 시 숨겨진 가치 발굴. 배당주+성장주 성격으로 외국인 장기 보유 확대 가능.",
    negativeOutlook: "통신 ARPU 성장 한계 구조적 지속. AI 투자 성과 가시화까지 수년 소요로 단기 수익성 악화 가능. KT클라우드 독립법인화 과정에서 지배구조 혼란 우려.",
  },
  LPL: {
    koreanCode: "034220.KS", market: "코스피",
    description: "OLED 패널 글로벌 2위. TV·스마트폰·차량용 디스플레이 제조. 만성 적자에서 OLED 집중 전략으로 수익성 개선 시도 중. 애플 아이폰 OLED 패널 공급사로 고객 집중도 높음.",
    usUpMeaning: "중간 수준의 긍정 신호. LPL 상승 = 패널 수요 개선 or 아이폰 수주 기대 반영. 단, LPL은 적자 기업이므로 ADR 상승이 국내주 동반 강세를 반드시 보장하지 않음. 업황 턴어라운드 확인 후 신뢰도 높아짐.",
    influence: "LPL 급락은 디스플레이 업황 악화 신호로 국내 LG전자·삼성디스플레이 연관주에 파급. 패널가격 사이클과 강하게 연동.",
    bullConditions: ["아이폰 OLED 신규 패널 독점 수주", "차량용 디스플레이 대형 수주", "패널 ASP(평균판매가격) 반등", "중국 경쟁사 생산 차질", "OLED TV 판매 급증"],
    bearConditions: ["중국 BOE·CSOT 가격 덤핑 심화", "애플 공급망 다변화 (삼성디스플레이 비중 확대)", "LCD 퇴출 비용 증가", "소비자 가전 수요 부진", "적자 지속으로 유상증자 가능성"],
    positiveOutlook: "차량용 OLED 시장 고성장(연 30%+) 장기 수혜. 투명 디스플레이·폴더블 패널 등 신규 폼팩터 선점. 애플의 OLED 전 제품 확대 정책이 장기 수주 보증.",
    negativeOutlook: "중국 경쟁사의 OLED 기술 추격으로 구조적 마진 압박. 높은 애플 의존도는 협상력 약화 요인. 적자 구조 탈피 실패 시 재무 리스크 상존.",
  },
  SKM: {
    koreanCode: "017670.KS", market: "코스피",
    description: "한국 1위 통신사. AI 개인비서(에이닷), 양자암호통신, T우주 구독 서비스로 통신사에서 AI 플랫폼 기업 전환 도전 중. KT와 함께 한국 AI 인프라의 핵심 파트너.",
    usUpMeaning: "긍정 신호. SKM 상승 = 한국 5G·AI 인프라 투자심리 개선 반영. KT와 함께 오르면 한국 통신 섹터 전체 강세 신호. SKM만 단독 급등 시 에이닷 AI 서비스 호재 or 기업 고유 이벤트 가능성.",
    influence: "SKM ADR은 한국 5G·AI 인프라의 해외 평가 지표. KT와 함께 통신 섹터 방향을 공동으로 결정.",
    bullConditions: ["에이닷 AI 에이전트 가입자 급증 (월 1000만+)", "T우주 구독 ARPU 상승", "양자암호통신 B2B 대형 계약", "5G SA 요금제 수익화 성공", "SK텔레콤 밸류업 배당 확대"],
    bearConditions: ["알뜰폰 MVNO 점유율 잠식 (현재 30%+)", "에이닷 vs 카카오·네이버 AI 경쟁 심화", "AI 서비스 수익화 미지수로 투자비용 부담", "KT와 요금 인하 경쟁", "5G 투자 회수 지연"],
    positiveOutlook: "에이닷 AI 에이전트 시장 선점 성공 시 통신사→AI 플랫폼 전환 완성. 양자암호 B2B 정부·금융 사업화 가시화. SKT의 AI 브랜드가 주가 재평가 트리거.",
    negativeOutlook: "통신 ARPU 성장 구조적 한계. AI 서비스 수익화까지 장기간 투자 부담. 카카오·네이버 등 빅테크와의 AI 경쟁에서 뒤처질 경우 성장 스토리 훼손.",
  },
  WF: {
    koreanCode: "316140.KS", market: "코스피",
    description: "우리은행을 중심으로 한 금융지주. KB·신한 대비 증권·보험 자회사 부재로 비이자수익 구조 취약. 우리투자증권 출범으로 종합금융그룹 완성 추진 중. 지배구조 리스크가 과거부터 디스카운트 요인.",
    usUpMeaning: "제한적 긍정. WF ADR은 한국 금융지주 ADR 중 유동성이 가장 낮아 큰 움직임이 아니면 시그널 신뢰도 낮음. KB·SHG와 함께 오르면 금융 섹터 전반 호재. WF만 단독 움직임 시 우리금융 고유 이슈 확인 필요.",
    influence: "한국 금융지주 ADR 중 규모가 작아 KB·SHG 대비 영향력 낮음. 우리금융 특이 이슈 발생 시 선행 반응하는 경향.",
    bullConditions: ["우리투자증권 출범 성공 (비이자수익 확충)", "배당 확대 or 자사주 소각 발표", "대주주 리스크(예금보험공사 잔여 지분) 완전 해소", "동남아 사업 호조", "밸류업 프로그램 적극 참여"],
    bearConditions: ["대주주 관련 지배구조 리스크 재발", "기업여신·중소기업 대출 부실화", "증권사 인수 시너지 부재", "자본비율(BIS) 하락 우려", "금융당국의 추가 규제 압박"],
    positiveOutlook: "우리투자증권 통해 IB·WM 역량 확충 시 KB·신한 수준으로 밸류에이션 재평가 기대. 지배구조 개선 완료 시 디스카운트 해소. 밸류업 배당 확대로 외국인 매수 유입 가능.",
    negativeOutlook: "KB·신한 대비 구조적 경쟁력 열세 지속. 지배구조 리스크 재발 시 주가 급락 우려. 증권사 통합 시너지 가시화까지 시간과 비용 소요.",
  },
  KEP: {
    koreanCode: "015760.KS", market: "코스피",
    description: "한국 최대 전력 공기업. 전국 발전·송전·배전을 독점하는 국가 기간산업. 국제 연료비(LNG·석탄) 상승 시 요금을 올리지 못해 구조적 적자 반복. 정부 에너지 정책에 수익성이 직결되는 특수 종목.",
    usUpMeaning: "제한적 긍정. 한국전력은 정부 통제 공기업이라 ADR 상승이 곧 국내주 상승을 의미하지 않음. 글로벌 에너지 가격 하락 or 한국 정부 요금 인상 결정이 실질 시그널. ADR 급락은 에너지 가격 급등 경고로는 유효.",
    influence: "KEP ADR은 글로벌 에너지 가격 변동에 민감. 국제 LNG·석탄 가격 급락 시 ADR 강세 → 다음날 국내 한국전력 반등 경향. 요금 인상 정책 뉴스가 더 직접적 영향.",
    bullConditions: ["전기요금 대폭 인상 허용 (정부 결정)", "국제 LNG·석탄 가격 급락", "원전 재가동 및 비중 확대", "AI 데이터센터 전력 수요 증가 → 수익 확대", "재생에너지 보조금 확충"],
    bearConditions: ["국제 연료비 급등 + 요금 동결 (이중 압박)", "정부 에너지 요금 인상 불허", "대규모 적자 지속 → 부채비율 악화", "탈원전 정책 재시행", "재생에너지 전환 투자비용 급증"],
    positiveOutlook: "AI 데이터센터 전력 수요 폭증 시 장기 수익 기반 강화. 전기요금 정상화 완료 시 적자 구조 탈피. 원전 비중 확대로 연료비 부담 구조적 완화 가능.",
    negativeOutlook: "정부 물가 관리 목적 요금 동결 반복 시 구조적 적자 지속. 부채비율 악화로 재무 리스크 상존. 에너지 전환 비용이 장기간 수익성 압박 요인.",
  },
  GRVY: {
    koreanCode: "그라비티(067080.KQ)", market: "코스닥",
    description: "라그나로크 온라인 IP를 보유한 한국 게임사. 넥슨 계열. 태국·필리핀·인도네시아 등 동남아에서 라그나로크 모바일 게임으로 확고한 팬층 보유. 단일 IP 의존도가 높으나 동남아 신흥시장에서 독보적 브랜드.",
    usUpMeaning: "중간 수준 긍정. 소형주이며 NASDAQ 거래량이 많지 않아 시그널 신뢰도 제한적. 동남아 시장 기대감 or 신작 발표 시 반응. 코스닥 라그나로크 테마주와 동조하나 영향 규모 작음.",
    influence: "GRVY 상승 = 동남아 게임 수요 증가 or 신규 IP 기대. 코스닥 게임 섹터(컴투스·위메이드 등) 동반 상승 신호 가능. 단, 규모가 작아 코스피 전체에 미치는 영향 미미.",
    bullConditions: ["라그나로크 신규 타이틀 글로벌 흥행", "동남아 게임 시장 고성장 지속 (연 20%+)", "IP 라이선스 수익 추가 확대 (중동·남미)", "웹툰·굿즈 등 IP 다각화 성공", "넥슨과의 시너지 강화"],
    bearConditions: ["라그나로크 IP 노후화 및 신규 유저 유입 감소", "동남아 경쟁 게임 등장 (미호요·텐센트 등)", "신작 연속 흥행 실패", "주요 시장 규제 강화 (청소년 게임 제한)", "핵심 개발진 이탈"],
    positiveOutlook: "동남아에서 '국민게임' 수준의 IP 파워로 수명 연장 가능. 라그나로크 세계관 웹툰·애니메이션 등 미디어믹스 성공 시 IP 가치 재평가. 동남아 게임 시장의 구조적 성장 수혜.",
    negativeOutlook: "단일 IP 의존 구조는 근본적 취약점. 라그나로크 사이클 종료 시 대체 성장 동력 부재. 대형 게임사 대비 R&D·마케팅 역량 한계로 신규 IP 창출 어려움.",
  },
  DDI: {
    koreanCode: "더블유게임즈(192080.KQ)", market: "코스닥",
    description: "카지노 소셜게임 '더블다운 카지노' 운영사. 한국 더블유게임즈 자회사로 NASDAQ 상장. 실제 현금 배팅 없는 소셜 카지노 게임이며 미국·캐나다 시장 중심. 모바일 슬롯머신·포커 게임을 무료로 즐기는 앱 모델.",
    usUpMeaning: "제한적 긍정. DDI는 사실상 미국 소비자 지출 경기와 연동되며 한국 코스피·코스닥과의 상관관계가 낮음. ADR 상승이 국내 더블유게임즈 주가에 영향을 주긴 하나 규모가 작아 코스닥 전체에 미치는 영향은 미미. 순수 미국 소비 경기 지표로 활용하는 것이 적합.",
    influence: "DDI ADR은 미국 소비자 여가 지출 지표. 코스닥 모회사 더블유게임즈 주가와 동조하나 코스피 전체 영향은 거의 없음. 미국 빅테크 게임 플랫폼 정책 변화 시 선행 반응.",
    bullConditions: ["미국 소비자 지출 확대 (경기 회복)", "신규 소셜카지노 게임 타이틀 흥행", "미국 소셜게임 규제 완화", "실제 도박 합법화 확산 → 플랫폼 전환 기대", "구독 모델·인앱결제 ARPU 상승"],
    bearConditions: ["미국 경기침체 → 소비자 여가비 감소", "소셜카지노 앱 청소년 보호 규제 강화", "애플·구글 앱스토어 수수료 정책 변경", "대형 카지노 기업의 소셜게임 직접 진출", "모회사 더블유게임즈와의 관계 변화"],
    positiveOutlook: "미국 소셜카지노 시장 꾸준한 성장세 유지. 스포츠 베팅 합법화 확산 시 플랫폼 전환 혜택 가능. 구독 모델 전환 성공 시 수익 안정성 개선.",
    negativeOutlook: "한국 증시 분석 도구로서 활용성 낮음. 단일 장르 의존 구조로 대형 게임사 대비 성장 한계. 소셜카지노 시장의 구조적 성숙화로 고성장 기대 어려움.",
  },
  SKHY: {
    koreanCode: "000660.KS", market: "코스피",
    description: "HBM(고대역폭메모리) 세계 1위. 엔비디아 H100·H200·B200 GPU의 HBM을 독점 공급. AI 반도체 수요 최대 수혜주로 현재 한국 코스닥·코스피 전체에서 가장 주목받는 종목. 2026년 기준 HBM 시장점유율 약 50%+.",
    usUpMeaning: "🟢 가장 강력한 긍정 신호. SKHY는 미국 기관·개인투자자들이 직접 거래하는 실질적 시장이라 신호 신뢰도 최고. SKHY 상승 = AI 투자 확대 기대 or 엔비디아 발주 증가 소식 → 다음날 국내 SK하이닉스 갭상승 거의 확실. SKHY 급락은 반도체 전체 셀오프 경고.",
    influence: "SKHY NASDAQ 상장으로 미국 AI 투자자들이 직접 접근. 엔비디아 HBM 발주 뉴스가 SKHY에 즉시 반영 → 다음날 국내주 갭상승/갭하락.",
    bullConditions: ["엔비디아 신규 GPU 출시 → HBM 대규모 발주", "HBM4 단독 공급 계약 체결", "AI 데이터센터 투자 확대 (마이크로소프트·구글·아마존)", "DRAM 가격 상승 사이클 진입", "미국 반도체 규제 완화 or 면제"],
    bearConditions: ["미국 반도체 수출규제 한국 HBM까지 확대", "삼성전자 HBM4 추격 성공 → 점유율 잠식", "AI 투자 버블 붕괴 or 빅테크 CAPEX 삭감", "글로벌 경기침체로 메모리 수요 급감", "반도체 업황 사이클 하강 전환"],
    positiveOutlook: "HBM4 독점 공급 유지 시 2027년까지 AI 수요 구조적 증가. 온디바이스 AI 확산으로 엣지 메모리 수요 추가 창출. SKHY를 통한 미국 자금 직접 유입 = 국내주 외국인 수급 개선.",
    negativeOutlook: "AI 투자 사이클이 예상보다 빨리 꺾일 경우 HBM 수요 급락 위험. 삼성전자가 HBM4 수율 개선 성공 시 점유율 경쟁 심화. 메모리 업황 특성상 호황→불황 전환 속도가 빠를 수 있음.",
  },
};

// ── EWY 상세 차트 패널 ────────────────────────────────────────────────────────
const EWY_DAILY_PERIODS  = [
  { key: "1m", label: "1개월",  days: 22  },
  { key: "3m", label: "3개월",  days: 66  },
  { key: "6m", label: "6개월",  days: 130 },
  { key: "1y", label: "1년",    days: 252 },
] as const;
const EWY_WEEKLY_PERIODS = [
  { key: "6m", label: "6개월", weeks: 26 },
  { key: "1y", label: "1년",   weeks: 52 },
  { key: "2y", label: "2년",   weeks: 104 },
] as const;

function EwyChartPanel({ onClose }: { onClose: () => void }) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [dailyPeriod, setDailyPeriod]   = useState<"1m" | "3m" | "6m" | "1y">("3m");
  const [weeklyPeriod, setWeeklyPeriod] = useState<"6m" | "1y" | "2y">("1y");
  const { data, loading } = useEwyHistory();

  const rawPoints: EwyBar[] = (() => {
    if (!data) return [];
    if (viewMode === "daily") {
      const cfg = EWY_DAILY_PERIODS.find(p => p.key === dailyPeriod)!;
      return data.daily.slice(-cfg.days);
    } else {
      const cfg = EWY_WEEKLY_PERIODS.find(p => p.key === weeklyPeriod)!;
      return data.weekly.slice(-cfg.weeks);
    }
  })();

  // x축 라벨 포맷
  const fmtLabel = (d: string) => {
    const [, m, dd] = d.split("-");
    return viewMode === "weekly" ? `${parseInt(m)}월` : `${parseInt(m)}/${parseInt(dd)}`;
  };
  const n = rawPoints.length;
  const xStep = n > 80 ? 15 : n > 40 ? 8 : n > 20 ? 4 : 2;
  const points = rawPoints.map((r, i) => ({ ...r, labelTick: i % xStep === 0 ? fmtLabel(r.date) : "" }));

  const hasMA20 = points.some(r => r.ma20 != null);
  const hasMA60 = points.some(r => r.ma60 != null);
  const recent = [...rawPoints].reverse().slice(0, 30);

  const priceMin = Math.min(...points.map(r => r.close ?? Infinity).filter(isFinite));
  const priceMax = Math.max(...points.map(r => r.close ?? 0));
  const pad = (priceMax - priceMin) * 0.05;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="mt-3 bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-lg"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-black text-slate-800 text-sm">
            📊 EWY (iShares MSCI Korea ETF) <span className="text-slate-400 font-normal text-xs">· NYSE · 코스피 방향 프록시</span>
          </p>
          {/* 일봉/주봉 토글 */}
          <div className="flex gap-1.5 mt-1.5">
            {(["daily", "weekly"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                  viewMode === m ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"
                }`}>
                {m === "daily" ? "일봉" : "주봉"}
              </button>
            ))}
            <span className="text-slate-200 mx-0.5">|</span>
            {/* 기간 선택 */}
            {viewMode === "daily"
              ? EWY_DAILY_PERIODS.map(p => (
                  <button key={p.key} onClick={() => setDailyPeriod(p.key as any)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                      dailyPeriod === p.key ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-600"
                    }`}>
                    {p.label}
                  </button>
                ))
              : EWY_WEEKLY_PERIODS.map(p => (
                  <button key={p.key} onClick={() => setWeeklyPeriod(p.key as any)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                      weeklyPeriod === p.key ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-600"
                    }`}>
                    {p.label}
                  </button>
                ))
            }
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-light leading-none shrink-0">×</button>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          EWY 데이터 불러오는 중…
        </div>
      ) : points.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-slate-400 text-xs">데이터 없음</div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 가격 + MA 차트 */}
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={points} margin={{ top: 4, right: 48, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="labelTick" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              {/* 가격 축 (왼쪽) */}
              <YAxis yAxisId="price" domain={[priceMin - pad, priceMax + pad]}
                tickFormatter={v => `$${v}`}
                tick={{ fontSize: 9, fill: "#6366f1" }} axisLine={false} tickLine={false} width={44} />
              {/* 거래량 축 (오른쪽) */}
              <YAxis yAxisId="vol" orientation="right"
                tickFormatter={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + "M" : (v / 1_000).toFixed(0) + "K"}
                tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as EwyBar & { labelTick: string };
                return (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-xl space-y-0.5">
                    <p className="font-bold text-slate-700">{p.date}</p>
                    <p className="text-indigo-600 font-bold">종가: ${p.close}</p>
                    <p className={p.changePct > 0 ? "text-red-500 font-bold" : p.changePct < 0 ? "text-blue-500 font-bold" : "text-slate-400"}>
                      {p.changePct > 0 ? "▲" : p.changePct < 0 ? "▼" : "–"} {Math.abs(p.changePct).toFixed(2)}%
                    </p>
                    {p.high != null && <p className="text-slate-400">고가: ${p.high} · 저가: ${p.low}</p>}
                    {p.ma20 != null && <p className="text-blue-500">MA20: ${p.ma20}</p>}
                    {p.ma60 != null && <p className="text-green-600">MA{viewMode === "weekly" ? "20(주)" : "60"}: ${p.ma60}</p>}
                    {p.volume != null && <p className="text-slate-400">거래량: {p.volume >= 1_000_000 ? (p.volume / 1_000_000).toFixed(1) + "M" : (p.volume / 1_000).toFixed(0) + "K"}</p>}
                  </div>
                );
              }} />
              {/* 거래량 바 */}
              <Bar yAxisId="vol" dataKey="volume" name="거래량"
                fill="#CBD5E1" opacity={0.4} radius={[1, 1, 0, 0]} />
              {/* 가격 라인 */}
              <Line yAxisId="price" type="monotone" dataKey="close" name="EWY($)"
                stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
              {/* MA20 */}
              {hasMA20 && (
                <Line yAxisId="price" type="monotone" dataKey="ma20"
                  name={viewMode === "daily" ? "MA20" : "MA10(주)"}
                  stroke="#2563EB" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
              )}
              {/* MA60 (일봉) / MA20 (주봉) */}
              {hasMA60 && (
                <Line yAxisId="price" type="monotone" dataKey="ma60"
                  name={viewMode === "daily" ? "MA60" : "MA20(주)"}
                  stroke="#16A34A" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
              )}
              <Legend wrapperStyle={{ fontSize: 10 }}
                formatter={(v, e: any) => <span style={{ color: e.color }}>{v}</span>} />
            </ComposedChart>
          </ResponsiveContainer>

          <p className="text-[10px] text-slate-400 text-center">
            ─ EWY 종가 &nbsp;·&nbsp; <span style={{ color: "#2563EB" }}>-- {viewMode === "daily" ? "MA20" : "MA10"}</span>
            &nbsp;·&nbsp; <span style={{ color: "#16A34A" }}>-- {viewMode === "daily" ? "MA60" : "MA20"}</span>
            &nbsp;·&nbsp; 회색 바 = 거래량
          </p>

          {/* 날짜별 등락 테이블 */}
          <div className="overflow-y-auto max-h-52 rounded-lg border border-slate-100">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-500">
                  <th className="text-left px-2 py-1.5">날짜</th>
                  <th className="text-right px-2 py-1.5">종가($)</th>
                  <th className="text-right px-2 py-1.5">고가</th>
                  <th className="text-right px-2 py-1.5">저가</th>
                  <th className="text-right px-2 py-1.5">등락률</th>
                  <th className="text-right px-2 py-1.5">MA20</th>
                  <th className="text-right px-2 py-1.5">{viewMode === "daily" ? "MA60" : "MA20(주)"}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p, i) => (
                  <tr key={i} className={`border-t border-slate-50 ${
                    p.changePct > 0 ? "bg-red-50/40" : p.changePct < 0 ? "bg-blue-50/40" : ""
                  }`}>
                    <td className="px-2 py-1 text-slate-500 font-mono text-[11px]">{p.date}</td>
                    <td className="px-2 py-1 text-right font-bold text-slate-800">${p.close}</td>
                    <td className="px-2 py-1 text-right text-slate-400">{p.high != null ? `$${p.high}` : "–"}</td>
                    <td className="px-2 py-1 text-right text-slate-400">{p.low != null ? `$${p.low}` : "–"}</td>
                    <td className={`px-2 py-1 text-right font-bold ${
                      p.changePct > 0 ? "text-red-500" : p.changePct < 0 ? "text-blue-500" : "text-slate-400"
                    }`}>
                      {p.changePct > 0 ? "▲" : p.changePct < 0 ? "▼" : "–"} {Math.abs(p.changePct).toFixed(2)}%
                    </td>
                    <td className="px-2 py-1 text-right text-blue-500 font-mono">{p.ma20 != null ? `$${p.ma20}` : "–"}</td>
                    <td className="px-2 py-1 text-right text-green-600 font-mono">{p.ma60 != null ? `$${p.ma60}` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 해설 */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-indigo-700">📌 EWY 이동평균선 해석</p>
            <p>• <strong>EWY &gt; MA20</strong> → 단기 상승 추세. 코스피 강세 지속 가능성</p>
            <p>• <strong>EWY &lt; MA20</strong> → 단기 하락 추세. 코스피 약세 압력 확인 필요</p>
            <p>• <strong>MA20이 MA60 상향 돌파(골든크로스)</strong> → 중기 상승 전환 신호</p>
            <p>• <strong>MA20이 MA60 하향 돌파(데드크로스)</strong> → 중기 하락 전환 신호</p>
            <p className="text-slate-400">※ EWY는 KOSPI와 상관관계 0.9+ · CME 코스피200 선물 무료 미제공으로 대용 활용</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ADR 클릭 시 일봉/월봉 차트 패널
function AdrChartPanel({ symbol, name, onClose }: { symbol: string; name: string; onClose: () => void }) {
  const [tab, setTab] = useState<"daily" | "monthly">("daily");
  const { data, loading } = useAdrHistory(symbol);
  const points = tab === "daily" ? (data?.daily ?? []) : (data?.monthly ?? []);
  const recent = [...points].reverse().slice(0, 20);

  const fmtD = (d: string) => tab === "daily" ? d.slice(5).replace("-", "/") : d.slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mt-3 bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-lg"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-black text-slate-800 text-sm">{name} <span className="text-slate-400 font-normal text-xs">({symbol})</span></p>
          <div className="flex gap-1.5 mt-1.5">
            {(["daily", "monthly"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                  tab === t ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"
                }`}>
                {t === "daily" ? "일봉 (3개월)" : "월봉 (3년)"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-light leading-none">×</button>
      </div>

      {loading ? (
        <div className="h-36 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          차트 로딩 중…
        </div>
      ) : points.length === 0 ? (
        <div className="h-36 flex items-center justify-center text-slate-400 text-xs">데이터 없음</div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 라인 차트 */}
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd"
                tickFormatter={fmtD} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#6366f1" }} width={44}
                tickFormatter={v => `$${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs shadow-xl">
                      <p className="font-bold text-slate-700 mb-1">{label}</p>
                      <p className="text-indigo-600">종가: ${p.close}</p>
                      <p className={p.changePct > 0 ? "text-red-500" : p.changePct < 0 ? "text-blue-500" : "text-slate-400"}>
                        {p.changePct > 0 ? "▲" : p.changePct < 0 ? "▼" : "–"} {Math.abs(p.changePct).toFixed(2)}%
                      </p>
                      {p.high != null && <p className="text-slate-400">H: ${p.high}  L: ${p.low}</p>}
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="close" name="종가" stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>

          {/* 날짜별 등락 테이블 */}
          <div className="overflow-y-auto max-h-44 rounded-lg border border-slate-100">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-500">
                  <th className="text-left px-2 py-1.5">날짜</th>
                  <th className="text-right px-2 py-1.5">종가($)</th>
                  <th className="text-right px-2 py-1.5">고가</th>
                  <th className="text-right px-2 py-1.5">저가</th>
                  <th className="text-right px-2 py-1.5">등락률</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p, i) => (
                  <tr key={i} className={`border-t border-slate-50 ${p.changePct > 0 ? "bg-red-50/40" : p.changePct < 0 ? "bg-blue-50/40" : ""}`}>
                    <td className="px-2 py-1 text-slate-500 font-mono">{p.date}</td>
                    <td className="px-2 py-1 text-right font-bold text-slate-800">{p.close}</td>
                    <td className="px-2 py-1 text-right text-slate-400">{p.high ?? "–"}</td>
                    <td className="px-2 py-1 text-right text-slate-400">{p.low ?? "–"}</td>
                    <td className={`px-2 py-1 text-right font-bold ${p.changePct > 0 ? "text-red-500" : p.changePct < 0 ? "text-blue-500" : "text-slate-400"}`}>
                      {p.changePct > 0 ? "▲" : p.changePct < 0 ? "▼" : "–"} {Math.abs(p.changePct).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 종목 심층 분석 패널 ── */}
      {ADR_META[symbol] && (() => {
        const m = ADR_META[symbol];
        return (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs">

            {/* 헤더: 국내 연동 종목 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">🇰🇷 국내 연동</span>
              <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{m.koreanCode}</span>
              <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full">{m.market}</span>
            </div>

            {/* 종목 설명 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-700 mb-1 text-[11px]">📋 종목 개요</p>
              <p className="text-slate-600 leading-relaxed">{m.description}</p>
            </div>

            {/* 미국서 오르면 좋은가? */}
            <div className={`border rounded-xl p-3 ${
              m.usUpMeaning.startsWith("🟢") ? "bg-emerald-50 border-emerald-200" :
              m.usUpMeaning.startsWith("⚠️") ? "bg-amber-50 border-amber-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <p className="font-bold text-slate-700 mb-1 text-[11px]">🇺🇸 미국에서 오르면 한국주도 오르나?</p>
              <p className="text-slate-600 leading-relaxed">{m.usUpMeaning}</p>
            </div>

            {/* 코스피 상호 영향 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="font-bold text-blue-700 mb-1 text-[11px]">⚡ 코스피 상호 영향 메커니즘</p>
              <p className="text-slate-600 leading-relaxed">{m.influence}</p>
            </div>

            {/* 호재 / 악재 조건 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="font-bold text-red-600 mb-2 text-[11px]">🚀 긍정(호재)이 되는 조건</p>
                <ul className="space-y-1">
                  {m.bullConditions.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-slate-600 leading-snug">
                      <span className="text-emerald-500 mt-0.5 shrink-0">▲</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="font-bold text-blue-700 mb-2 text-[11px]">📉 부정(악재)이 되는 조건</p>
                <ul className="space-y-1">
                  {m.bearConditions.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-slate-600 leading-snug">
                      <span className="text-red-400 mt-0.5 shrink-0">▼</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 긍정 / 부정 전망 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="font-bold text-emerald-700 mb-1 text-[11px]">🔭 긍정 미래 전망</p>
                <p className="text-slate-600 leading-relaxed">{m.positiveOutlook}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="font-bold text-orange-700 mb-1 text-[11px]">⚠️ 부정 미래 전망</p>
                <p className="text-slate-600 leading-relaxed">{m.negativeOutlook}</p>
              </div>
            </div>

          </div>
        );
      })()}
    </motion.div>
  );
}

/* ── 코스톨라니 달걀이론 데이터 ─────────────────────────────────────────── */
const PHASES = [
  {
    id: "A1", label: "상승 초기", section: "상승 구간 A", color: "#2E7D32",
    action: "적극 매수", actionClass: "bg-emerald-100 text-emerald-700",
    description: "바닥을 지나 소수의 투자자만 회복을 감지합니다. 대부분의 사람이 여전히 비관적이고 주식을 멀리합니다. 이 시기에 용기 있게 투자한 사람이 가장 큰 수익을 올립니다.",
    signals: "금리 하락 시작, 경기침체 공식 선언, 뉴스는 여전히 어두움, 거래량 감소",
  },
  {
    id: "A2", label: "상승 동행", section: "상승 구간 A", color: "#558B2F",
    action: "매수·보유", actionClass: "bg-lime-100 text-lime-700",
    description: "기관과 전문 투자자들이 본격적으로 매수에 나섭니다. 경기 회복이 서서히 뉴스에 나오기 시작하고, 주가는 꾸준히 상승합니다. 아직 일반 대중은 참여하지 않습니다.",
    signals: "금리 안정, 기업 실적 개선, 증시 거래량 증가, 언론에 '경제 회복' 기사",
  },
  {
    id: "A3", label: "상승 과장", section: "상승 구간 A", color: "#D32F2F",
    action: "⚠️ 매도 준비", actionClass: "bg-rose-100 text-rose-700",
    description: "모든 사람이 주식 얘기를 합니다. 택시 기사, 미용사도 종목 추천을 합니다. 주가는 펀더멘털을 크게 초과해 올랐고, 이격도가 역사적 극단치를 기록합니다. 코스톨라니는 이때 팔라고 했습니다.",
    signals: "금리 인상 시작, 모든 사람이 낙관적, 200주 이격도 극단치, 거래량 사상 최대",
  },
  {
    id: "B1", label: "하락 초기", section: "하락 구간 B", color: "#E65100",
    action: "주의·축소", actionClass: "bg-orange-100 text-orange-700",
    description: "고점에서 하락이 시작되지만 '잠시 조정'이라고 대부분이 생각합니다. 스마트머니(기관)는 조용히 빠져나가고, 개인투자자들은 '더 사야지'라고 생각합니다. 이것이 가장 위험한 착각입니다.",
    signals: "금리 인상 지속, 외국인 매도 시작, 고점 대비 10~30% 하락, 여전히 낙관론 다수",
  },
  {
    id: "B2", label: "하락 동행", section: "하락 구간 B", color: "#B71C1C",
    action: "현금 보유", actionClass: "bg-red-100 text-red-700",
    description: "본격적인 하락이 진행됩니다. 비관론이 확산되고 뉴스는 연일 부정적입니다. '더 떨어진다'는 공포가 지배합니다. 이 구간에서 손절하는 사람이 가장 많습니다.",
    signals: "실물경기 침체 가시화, 기업 실적 악화, 부동산·소비 동반 하락, 거래량 감소",
  },
  {
    id: "B3", label: "하락 과장", section: "하락 구간 B", color: "#1B5E20",
    action: "✅ 최고의 매수", actionClass: "bg-emerald-100 text-emerald-700",
    description: "공황 상태입니다. 뉴스는 최악, 모든 사람이 주식을 팝니다. 하지만 역설적으로 이때가 코스톨라니가 말한 '피가 흐르는 거리에서 사라'는 시점입니다. 200주 이평선 아래로 주가가 내려와 역사적 저평가 상태입니다.",
    signals: "금리 최고점, 대규모 기업 파산, '주식은 끝났다' 여론, 200주 이격도 마이너스",
  },
] as const;

const PHASE_INFO: Record<string, { label: string; action: string; badgeClass: string; color: string }> = {
  A1: { label: "A1 상승 초기", action: "매수", badgeClass: "bg-emerald-100 text-emerald-700", color: "#2E7D32" },
  A2: { label: "A2 상승 동행", action: "보유", badgeClass: "bg-lime-100 text-lime-700", color: "#558B2F" },
  A3: { label: "A3 상승 과장", action: "⚠️ 매도", badgeClass: "bg-rose-100 text-rose-700", color: "#D32F2F" },
  B1: { label: "B1 하락 초기", action: "주의", badgeClass: "bg-orange-100 text-orange-700", color: "#E65100" },
  B2: { label: "B2 하락 동행", action: "현금", badgeClass: "bg-red-100 text-red-700", color: "#B71C1C" },
  B3: { label: "B3 하락 과장", action: "✅ 매수", badgeClass: "bg-emerald-100 text-emerald-700", color: "#1B5E20" },
};

function getPhase(dev200w = 0, dev200d = 0): string {
  if (dev200w > 70) return dev200d >= 25 ? "A3" : "B1";
  if (dev200w > 15) return dev200d > 0 ? "A2" : "B2";
  if (dev200w > -5) return dev200d > 0 ? "A1" : "B2";
  return "B3";
}

function mkReasons(q: any, isKospi: boolean): string[] {
  if (!q) return ["데이터 로딩 중..."];
  const d200w = q.dev200w ?? 0;
  const d200d = q.dev200d ?? 0;
  const phase = getPhase(d200w, d200d);
  const r200w = d200w > 70 ? "역사적 극단치 — 과거 5회 모두 대폭락으로 이어짐"
    : d200w > 30 ? "높은 수준 — 과열 영역 진입"
    : d200w > 0 ? "보통 수준의 강세장" : "200주선 하향 — 역사적 저평가";
  const r200d = d200d >= 25 ? "여전히 강한 상승세 지속" : d200d > 0 ? "200일선 위지만 상승 탄력 둔화" : "200일선 하향 이탈 — 하락 진행 중";
  const phaseReason = phase === "B1"
    ? `고점 대비 대폭 하락 중, 200주 이격도는 여전히 극단치 → ${isKospi ? "A3 직후 B1(하락 초기) 진입" : "상승 탄력 점차 둔화"}`
    : `${PHASE_INFO[phase]?.label} 구간 진행 중`;
  return [
    `200주 이격도 ${d200w >= 0 ? "+" : ""}${d200w.toFixed(2)}% — ${r200w}`,
    `200일 이격도 ${d200d >= 0 ? "+" : ""}${d200d.toFixed(2)}% — ${r200d}`,
    phaseReason,
    "※ 달걀이론은 장기 참고 지표 — 단기 매매 타이밍 도구가 아닙니다",
  ];
}

function KostolanEgg({ kospiPhase, usPhase }: { kospiPhase: string; usPhase: string }) {
  const cx = 170, cy = 140, rx = 115, ry = 95;
  const egg = (angle: number, rScale = 1.0) => {
    const r = (angle * Math.PI) / 180;
    return { x: cx + rx * rScale * Math.cos(r), y: cy - ry * rScale * Math.sin(r) };
  };
  const lp = (angle: number) => {
    const r = (angle * Math.PI) / 180;
    return { x: cx + (rx + 30) * Math.cos(r), y: cy - (ry + 30) * Math.sin(r) };
  };
  const phases = [
    { id: "A3", angle: 90, color: "#D32F2F", bg: "#FFEBEE", label: "A3", sub: "매도" },
    { id: "B1", angle: 30, color: "#E65100", bg: "#FBE9E7", label: "B1", sub: "주의" },
    { id: "B2", angle: 330, color: "#880E4F", bg: "#FCE4EC", label: "B2", sub: "현금" },
    { id: "B3", angle: 270, color: "#1B5E20", bg: "#E8F5E9", label: "B3", sub: "매수" },
    { id: "A1", angle: 210, color: "#2E7D32", bg: "#E8F5E9", label: "A1", sub: "매수" },
    { id: "A2", angle: 150, color: "#558B2F", bg: "#F1F8E9", label: "A2", sub: "보유" },
  ];
  const kPh = phases.find(p => p.id === kospiPhase)!;
  const uPh = phases.find(p => p.id === usPhase)!;
  const kPt = egg(kPh?.angle ?? 30, 0.82);
  const uPt = egg(uPh?.angle ?? 150, 0.82);
  const same = kospiPhase === usPhase;
  return (
    <svg viewBox="0 0 340 290" width="100%" style={{ maxWidth: 400 }}>
      {[0, 60, 120, 180, 240, 300].map(a => {
        const ep = egg(a);
        return <line key={a} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 3" />;
      })}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#94a3b8" strokeWidth="2.5" />
      {/* Clockwise direction arrow (top-right arc) */}
      <path d={`M ${cx + rx * 0.55} ${cy - ry * 0.8} Q ${cx + rx * 0.95} ${cy - ry * 0.6} ${cx + rx * 0.9} ${cy - ry * 0.1}`}
        fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
      </defs>
      {phases.map(ph => {
        const p = lp(ph.angle);
        return (
          <g key={ph.id}>
            <circle cx={p.x} cy={p.y} r={22} fill={ph.bg} stroke={ph.color} strokeWidth="2" />
            <text x={p.x} y={p.y - 4} textAnchor="middle" fill={ph.color} fontSize="12" fontWeight="800">{ph.label}</text>
            <text x={p.x} y={p.y + 9} textAnchor="middle" fill={ph.color} fontSize="8">{ph.sub}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="3" fill="#94a3b8" />
      {/* KOSPI marker */}
      <g filter="drop-shadow(0 2px 5px rgba(0,0,0,0.25))">
        <circle cx={kPt.x - (same ? 12 : 0)} cy={kPt.y} r={14} fill="#EF4444" stroke="white" strokeWidth="2.5" />
        <text x={kPt.x - (same ? 12 : 0)} y={kPt.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="800">KS</text>
      </g>
      {/* S&P 500 marker */}
      <g filter="drop-shadow(0 2px 5px rgba(0,0,0,0.25))">
        <circle cx={uPt.x + (same ? 12 : 0)} cy={uPt.y} r={14} fill="#3B82F6" stroke="white" strokeWidth="2.5" />
        <text x={uPt.x + (same ? 12 : 0)} y={uPt.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="800">US</text>
      </g>
    </svg>
  );
}

// 30일 차트 커스텀 툴팁
function HistoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-xl">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

// 날짜 MM/DD 포맷
function fmtDate(d: string) {
  const [, m, dd] = d.split("-");
  return `${parseInt(m)}/${parseInt(dd)}`;
}

export function FactCheck() {
  const [selectedAdr, setSelectedAdr] = useState<{ symbol: string; name: string } | null>(null);
  const [showEwyPanel, setShowEwyPanel] = useState(false);
  const { data: market, loading: mLoading, refetch: mRefetch } = useGlobalMarket();
  const { data: hist, loading: hLoading } = useGlobalMarketHistory();
  const { data: quotesRaw } = useQuery({
    queryKey: ["factcheck-quotes"],
    queryFn: async () => {
      const r = await fetch("/api/stocks/quotes");
      return r.json() as Promise<{ quotes: Record<string, any> }>;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });
  const kospiQ = quotesRaw?.quotes?.['^KS11'];
  const spQ   = quotesRaw?.quotes?.['^GSPC'];
  const kospiPhase = getPhase(kospiQ?.dev200w, kospiQ?.dev200d);
  const usPhase    = getPhase(spQ?.dev200w,    spQ?.dev200d);

  // EWY + KRW 날짜 병합
  const chartData = (() => {
    const map = new Map<string, { date: string; ewy?: number; krw?: number }>();
    hist.ewy.forEach(p => { map.set(p.date, { date: fmtDate(p.date), ewy: p.value ?? undefined }); });
    hist.krw.forEach(p => {
      const row = map.get(p.date) ?? { date: fmtDate(p.date) };
      row.krw = p.value ?? undefined;
      map.set(p.date, row);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <div className="space-y-8">

      {/* ── 실시간 시장 레이더 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800">📡 실시간 글로벌 시장 레이더</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              미국 야간선물 · 한국 ADR — Yahoo Finance 실시간 (1분 자동 갱신)
            </p>
          </div>
          <button
            onClick={mRefetch}
            className="text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full hover:bg-slate-50 transition-colors"
          >
            🔄 새로고침
          </button>
        </div>

        {mLoading ? (
          <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            글로벌 시세 불러오는 중…
          </div>
        ) : (
          <>
            {/* 미국 야간선물 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">🇺🇸 미국 야간선물</span>
                <span className="text-[10px] text-slate-400">— 코스피 다음날 개장 방향 선행 지표</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {market.futures.map(item => (
                  <MarketCard key={item.symbol} item={item} />
                ))}
                {market.futures.length === 0 && (
                  <p className="text-xs text-slate-400 col-span-3">데이터 없음 (장외시간)</p>
                )}
              </div>
            </div>

            {/* 코스피 야간 방향 프록시 + 환율 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* EWY */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">🌙 코스피 야간 방향 신호</span>
                  <span className="text-[10px] text-slate-400">— CME 직접 미제공 → EWY 프록시</span>
                </div>
                {market.kospiProxy.map(item => (
                  <MarketCard
                    key={item.symbol}
                    item={item}
                    selected={showEwyPanel}
                    onClick={() => setShowEwyPanel(v => !v)}
                  />
                ))}
                <button
                  onClick={() => setShowEwyPanel(v => !v)}
                  className={`mt-2 w-full text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    showEwyPanel
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {showEwyPanel ? "▲ EWY 상세 차트 닫기" : "▼ EWY 일봉·주봉 상세 차트 보기"}
                </button>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  EWY(iShares MSCI Korea ETF)는 NYSE에서 미국 장중 실시간 거래되며 KOSPI와 상관관계 0.9+. CME 코스피200 선물 무료 API 미제공으로 인한 실용적 대안.
                </p>
              </div>
              {/* KRW/USD */}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">💱 원/달러 환율</span>
                  <span className="text-[10px] text-slate-400">— 외국인 자금흐름 핵심 지표</span>
                </div>
                {market.fx.map(item => (
                  <MarketCard key={item.symbol} item={item} />
                ))}
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  원화 강세(환율↓) = 외국인 자금 유입 → 코스피 호재. 원화 약세(환율↑) = 자금 유출 → 코스피 악재.
                </p>
              </div>
            </div>

            {/* EWY 상세 차트 패널 — 버튼 바로 아래 */}
            <AnimatePresence>
              {showEwyPanel && (
                <EwyChartPanel onClose={() => setShowEwyPanel(false)} />
              )}
            </AnimatePresence>

            {/* 30일 흐름 차트 */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">📈 EWY · 원달러 환율 — 최근 30일 흐름</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">왼쪽 축: EWY($) · 오른쪽 축: 원/달러(원)</p>
                </div>
                {hLoading && <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />}
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                    <YAxis yAxisId="ewy" orientation="left"  domain={["auto","auto"]} tick={{ fontSize: 10, fill: "#6366f1" }} tickFormatter={v => `$${v}`} width={44} />
                    <YAxis yAxisId="krw" orientation="right" domain={["auto","auto"]} tick={{ fontSize: 10, fill: "#ef4444" }} tickFormatter={v => `${v.toLocaleString()}`} width={54} />
                    <Tooltip content={<HistoryTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line yAxisId="ewy" type="monotone" dataKey="ewy" name="EWY($)"     stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
                    <Line yAxisId="krw" type="monotone" dataKey="krw" name="원/달러(원)" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
                  {hLoading ? "데이터 불러오는 중…" : "차트 데이터 없음"}
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1.5">
                EWY↑ + 원달러↓ = 외국인 자금 유입 → 코스피 강세 신호 / EWY↓ + 원달러↑ = 자금 유출 → 코스피 약세 신호
              </p>
            </div>

            {/* 한국 ADR */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">🇰🇷 한국 기업 미국 상장 ADR</span>
                {/* 전체 시장 상태 뱃지 */}
                {(() => {
                  const states = market.adrs.map(a => a.marketState);
                  const isRegular = states.some(s => s === "REGULAR");
                  const isPre = !isRegular && states.some(s => s === "PRE" || s === "PREPRE");
                  const isPost = !isRegular && !isPre && states.some(s => s === "POST" || s === "POSTPOST");
                  return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isRegular ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      isPre     ? "bg-amber-50 text-amber-700 border-amber-200" :
                      isPost    ? "bg-orange-50 text-orange-600 border-orange-200" :
                                  "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {isRegular ? "🟢 미국장 진행중" :
                       isPre     ? "🟡 프리마켓" :
                       isPost    ? "🟠 장후거래 중" :
                                   "⚫ 미국장 마감됨"}
                    </span>
                  );
                })()}
              </div>
              {/* 한국시간 거래시간 안내 */}
              <div className="mb-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-relaxed">
                🕐 <strong className="text-slate-600">NYSE·NASDAQ 거래시간 (한국시간 KST)</strong>
                &nbsp;|&nbsp;여름(EDT·3~11월): <span className="font-semibold text-slate-700">22:30 ~ 다음날 05:00</span>
                &nbsp;|&nbsp;겨울(EST·11~3월): <span className="font-semibold text-slate-700">23:30 ~ 다음날 06:00</span>
                &nbsp;|&nbsp;카드 클릭 시 차트 확인
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {market.adrs.map(item => (
                  <MarketCard
                    key={item.symbol}
                    item={item}
                    selected={selectedAdr?.symbol === item.symbol}
                    onClick={() => setSelectedAdr(
                      selectedAdr?.symbol === item.symbol ? null : { symbol: item.symbol, name: item.name }
                    )}
                  />
                ))}
              </div>
              <AnimatePresence>
                {selectedAdr && (
                  <AdrChartPanel
                    key={selectedAdr.symbol}
                    symbol={selectedAdr.symbol}
                    name={selectedAdr.name}
                    onClose={() => setSelectedAdr(null)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* 글로벌 반도체 연동 지표 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">🌐 글로벌 반도체 연동 지표</span>
                <span className="text-[10px] text-slate-400">— TSMC ADR · 마이크론 · 엔비디아 실시간</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {market.semiconductors.map(item => (
                  <MarketCard key={item.symbol} item={item} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                TSMC·마이크론·엔비디아는 삼성전자·SK하이닉스와 같은 글로벌 반도체 업황을 반영하는 참고 지표입니다.
                미국 정규장·프리마켓·장후거래 상태를 각 카드에 표시합니다.
              </p>
            </div>

            {/* 해설 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-700">📌 이 데이터를 어떻게 활용하나요?</p>
              <p>• <strong>야간선물 상승</strong> → 다음날 코스피 강세 개장 가능성 높음</p>
              <p>• <strong>EWY 상승</strong> → 미국 장중 코스피 방향 신호 강세 (야간선물 대용)</p>
              <p>• <strong>원/달러 하락</strong> → 원화 강세 = 외국인 자금 유입 = 코스피 호재</p>
              <p>• <strong>ADR 상승</strong> → 미국 시장이 한국 주식을 긍정 평가 중 (외국인 수급 호재)</p>
              <p>• <strong>ADR 하락</strong> → 외국인 매도 압력 증가 신호 — 특히 포스코·KB금융 ADR 주목</p>
              <p className="text-slate-400">※ 프리마켓(Pre) = 미국 장 개장 전. 마감(Closed) = 미국 장 종료 후. 데이터는 약 15~20분 지연될 수 있음.</p>
            </div>

            {market.updatedAt && (
              <p className="text-[10px] text-slate-400">
                마지막 업데이트: {new Date(market.updatedAt).toLocaleTimeString("ko-KR")}
                {market.cached && " (캐시)"}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── 코스톨라니 달걀이론 ─────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6" />

      <div className="border-l-4 border-amber-500 pl-6 py-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">🥚 코스톨라니 달걀이론 실시간 레슨</h2>
        <p className="text-muted-foreground mt-1">
          왕초보를 위한 주식 사이클 교실 — 뉴욕·코스피 현재 위치를 실시간 이격도로 자동 계산
        </p>
      </div>

      {/* 코스톨라니 소개 + 명언 */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shrink-0">
              🧑‍🎓
            </div>
            <div>
              <p className="font-bold text-sm">앙드레 코스톨라니 (André Kostolany, 1906–1999)</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                헝가리 출신 독일 투자 대부. 60년 이상 투자 경험. 복잡한 경제를{" "}
                <strong>달걀 모양 6단계 사이클</strong>로 단순화해 왕초보도 이해할 수 있게 만들었습니다.
                "시장은 항상 옳다 — 하지만 단기적으로는 자주 틀린다"는 철학이 핵심입니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                quote: '"주식을 사고, 수면제를 먹고, 10년 후에 깨어라."',
                context: '장기 투자의 본질. 단기 등락에 흔들리지 말고 버텨라.',
              },
              {
                quote: '"주식 투자로 돈을 잃으면 성미가 급해지고, 돈을 벌면 멍청해진다."',
                context: '감정이 최대의 적. 손실 공포와 수익 도취 모두 판단을 망친다.',
              },
              {
                quote: '"경제가 재채기를 하면 증시는 폐렴에 걸린다."',
                context: '실물경제 악재가 증시에는 훨씬 크게 증폭되어 반영된다.',
              },
            ].map((q, i) => (
              <div key={i} className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4">
                <p className="text-sm font-medium italic leading-snug">{q.quote}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{q.context}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 달걀 다이어그램 + 현재 위치 분석 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">달걀 사이클 — 현재 위치 (실시간)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <KostolanEgg kospiPhase={kospiPhase} usPhase={usPhase} />
            <div className="flex items-center gap-5 mt-1 text-xs justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                <span>KOSPI (KS)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                <span>S&amp;P 500 (US)</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-1">
              화살표 방향 = 사이클 진행 방향 · 200주/200일 이격도 기반 자동 계산
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">현재 위치 — 왜 이 위치인가?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* KOSPI */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <span className="font-bold text-sm">한국 KOSPI — {PHASE_INFO[kospiPhase]?.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PHASE_INFO[kospiPhase]?.badgeClass}`}>
                  {PHASE_INFO[kospiPhase]?.action}
                </span>
              </div>
              <ul className="space-y-1.5">
                {mkReasons(kospiQ, true).map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                    <span className="text-rose-500 shrink-0 font-bold">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100" />

            {/* S&P 500 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="font-bold text-sm">미국 S&amp;P 500 — {PHASE_INFO[usPhase]?.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PHASE_INFO[usPhase]?.badgeClass}`}>
                  {PHASE_INFO[usPhase]?.action}
                </span>
              </div>
              <ul className="space-y-1.5">
                {mkReasons(spQ, false).map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                    <span className="text-blue-500 shrink-0 font-bold">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6단계 상세 설명 */}
      <div>
        <h3 className="font-bold text-base mb-3">📖 달걀 6단계 완벽 설명 (왕초보 레슨)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PHASES.map((ph) => (
            <Card
              key={ph.id}
              className={`border-2 transition-all ${
                ph.id === kospiPhase && ph.id === usPhase
                  ? "border-purple-400 shadow-md"
                  : ph.id === kospiPhase
                  ? "border-rose-400 shadow-md"
                  : ph.id === usPhase
                  ? "border-blue-400 shadow-md"
                  : "border-border/40"
              }`}
            >
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black" style={{ color: ph.color }}>{ph.id}</span>
                  <div className="leading-tight">
                    <p className="font-bold text-sm">{ph.label}</p>
                    <p className="text-[10px] text-muted-foreground">{ph.section}</p>
                  </div>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${ph.actionClass}`}>
                    {ph.action}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">{ph.description}</p>
                <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-500 leading-snug">
                  <span className="font-bold">이럴 때: </span>{ph.signals}
                </div>
                {(ph.id === kospiPhase || ph.id === usPhase) && (
                  <div className="flex gap-1.5 flex-wrap">
                    {ph.id === kospiPhase && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 rounded-full px-2 py-0.5 font-bold">
                        📍 KOSPI 현재 위치
                      </span>
                    )}
                    {ph.id === usPhase && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-bold">
                        📍 S&P 500 현재 위치
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 정확도 및 주의사항 */}
      <Card className="bg-amber-50/40 border-amber-200">
        <CardContent className="pt-5 pb-5 space-y-4">
          <h3 className="font-black text-base">⚖️ 달걀이론, 실제로 맞나요? — 왕초보 주의사항</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-bold text-emerald-700 text-sm">✅ 잘 맞는 경우</p>
              {[
                "장기 사이클(3~7년) 추세 파악에 매우 유용",
                "시장 심리(낙관/비관)와 사이클 위치 동기화에 탁월",
                "과열 구간(A3) 경고 기능 — 200주 이격도 극단치와 일치",
                "B3(공황) 구간의 장기 매수 전략 근거로 활용 가능",
              ].map((t, i) => (
                <p key={i} className="flex gap-2 text-xs text-slate-700">
                  <span className="shrink-0">•</span><span>{t}</span>
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-bold text-rose-700 text-sm">⚠️ 한계와 주의사항</p>
              {[
                "정확한 단계 전환 시점을 미리 알기 어려움 (사후 확인)",
                "같은 데이터도 해석자에 따라 A3/B1 경계 판단이 다를 수 있음",
                "금리 사이클이 빠르게 변하면(2022년 급격한 인상) 달걀이 왜곡됨",
                "코스피는 환율·미국 정책 충격에 달걀이론이 무력화될 수 있음",
              ].map((t, i) => (
                <p key={i} className="flex gap-2 text-xs text-slate-700">
                  <span className="shrink-0">•</span><span>{t}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="bg-white border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 mb-1">💡 왕초보 핵심 교훈</p>
            <p className="text-sm leading-relaxed">
              달걀이론은 <strong>"지금 내가 사이클의 어디쯤 있는지"</strong>를 감각적으로 파악하는 나침반입니다.
              단기 매매 타이밍 도구가 아닙니다. A3 구간에서 "아직 오를 거야" 하며 들어가거나,
              B3 구간에서 "더 떨어질 거야" 하며 팔면 가장 나쁜 결과가 나옵니다.{" "}
              <strong>사이클을 인식하고 반대로 행동하는 것이 코스톨라니의 핵심입니다.</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
