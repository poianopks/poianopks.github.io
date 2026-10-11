import { useState, useEffect, useCallback } from "react";

export interface PbrVerdict {
  grade: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  reason: string;
}

export interface PbrThresholds {
  label: string;
  histAvg: number;
  low: number;
  midLow: number;
  midHigh: number;
  high: number;
  histRange: string;
  desc: string;
}

export interface PbrItem {
  symbol: string;
  name: string;
  pbr: number | null;
  isEstimate?: boolean;
  note: string;
  thresholds: PbrThresholds;
  verdict: PbrVerdict | null;
}

export interface PbrData {
  items: PbrItem[];
  updatedAt: string;
  cached: boolean;
}

const POLL_INTERVAL = 5 * 60 * 1000;

// Static fallback values (2026.07 estimated levels)
const FALLBACK: PbrData = {
  items: [
    {
      symbol: "^KS11",
      name: "KOSPI",
      pbr: 1.65,
      note: "KODEX 200 ETF(069500) 기준 — KOSPI 전체 PBR 근사치",
      thresholds: { label: "KOSPI", histAvg: 1.0, low: 0.85, midLow: 0.85, midHigh: 1.3, high: 1.6, histRange: "0.8~1.8", desc: "코스피 시장 전체 평균 PBR" },
      verdict: { grade: "extreme", label: "극단 과열", color: "text-red-700", bg: "bg-red-50", border: "border-red-400", reason: "역사적 고점 구간 — 평균 1.0배 대비 65% 과열" },
    },
    {
      symbol: "005930.KS",
      name: "삼성전자",
      pbr: 2.45,
      note: "",
      thresholds: { label: "삼성전자", histAvg: 1.6, low: 1.2, midLow: 1.2, midHigh: 2.2, high: 3.0, histRange: "1.0~3.0", desc: "삼성전자 주가순자산비율" },
      verdict: { grade: "pricey", label: "고평가", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", reason: "역사적 부담 구간 (평균 1.6배 대비 53% 초과)" },
    },
    {
      symbol: "000660.KS",
      name: "SK하이닉스",
      pbr: 5.2,
      note: "반도체 사이클에 따라 PBR 변동 폭 매우 큼",
      thresholds: { label: "SK하이닉스", histAvg: 2.5, low: 1.8, midLow: 1.8, midHigh: 4.0, high: 6.0, histRange: "1.0~7.0", desc: "SK하이닉스 주가순자산비율 (반도체 사이클 민감)" },
      verdict: { grade: "pricey", label: "고평가", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", reason: "역사적 부담 구간 (평균 2.5배 대비 108% 초과)" },
    },
    {
      symbol: "^GSPC",
      name: "S&P 500",
      pbr: 5.1,
      isEstimate: true,
      note: "SPY ETF 구성 기업 기준 추정값 (참고용)",
      thresholds: { label: "S&P 500", histAvg: 3.5, low: 2.2, midLow: 2.2, midHigh: 4.0, high: 5.0, histRange: "2.0~5.0", desc: "S&P 500 구성 기업의 평균 주가순자산비율" },
      verdict: { grade: "extreme", label: "극단 과열", color: "text-red-700", bg: "bg-red-50", border: "border-red-400", reason: "참고 범위 상단을 넘는 고평가 구간" },
    },
    {
      symbol: "^NDX",
      name: "NASDAQ 100",
      pbr: 8.5,
      isEstimate: true,
      note: "QQQ ETF 구성 기업 기준 추정값 (참고용)",
      thresholds: { label: "NASDAQ 100", histAvg: 6.5, low: 3.5, midLow: 3.5, midHigh: 8.0, high: 10.0, histRange: "3.0~12.0", desc: "NASDAQ 100 구성 기업의 평균 주가순자산비율" },
      verdict: { grade: "pricey", label: "고평가", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", reason: "참고 평균 6.5배를 웃도는 성장주 프리미엄 구간" },
    },
    {
      symbol: "TSM",
      name: "TSMC",
      pbr: 5.9,
      isEstimate: true,
      note: "추정값 (참고용) · 파운드리 업황 민감",
      thresholds: { label: "TSMC", histAvg: 3.5, low: 2.0, midLow: 2.0, midHigh: 5.5, high: 7.0, histRange: "1.5~8.0", desc: "TSMC 주가순자산비율 (파운드리 업황 민감)" },
      verdict: { grade: "pricey", label: "고평가", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", reason: "참고 평균 3.5배 대비 파운드리 프리미엄 구간" },
    },
    {
      symbol: "MU",
      name: "마이크론",
      pbr: 3.4,
      isEstimate: true,
      note: "추정값 (참고용) · 메모리 사이클 민감",
      thresholds: { label: "마이크론", histAvg: 2.5, low: 1.0, midLow: 1.0, midHigh: 3.5, high: 5.0, histRange: "0.8~6.0", desc: "마이크론 주가순자산비율 (메모리 사이클 민감)" },
      verdict: { grade: "fair", label: "중간·적정", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300", reason: "메모리 업황 회복을 반영한 참고 평균 부근" },
    },
    {
      symbol: "NVDA",
      name: "엔비디아",
      pbr: 38.0,
      isEstimate: true,
      note: "추정값 (참고용) · AI 성장주 특성상 변동 큼",
      thresholds: { label: "엔비디아", histAvg: 25.0, low: 12.0, midLow: 12.0, midHigh: 35.0, high: 45.0, histRange: "10~60", desc: "엔비디아 주가순자산비율 (성장주 특성상 변동 큼)" },
      verdict: { grade: "pricey", label: "고평가", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", reason: "AI 성장 프리미엄이 반영된 참고 평균 상회 구간" },
    },
  ],
  updatedAt: "2026-07-30T00:00:00.000Z",
  cached: false,
};

export function usePbrData() {
  const [data, setData] = useState<PbrData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/pbr");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PbrData = await res.json();
      // Only replace fallback when at least one item has a real pbr value + verdict
      const hasData = json.items?.some(i => i.pbr != null && i.verdict != null);
      if (hasData) {
        setData(json);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
