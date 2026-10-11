import { useCallback, useEffect, useState } from "react";

export interface GapBucket {
  bullish: number;
  bearish: number;
  doji: number;
  total: number;
  bullishDates: string[];
  bearishDates: string[];
  dojiDates: string[];
}

export interface GapYear {
  year: number;
  gapUp: GapBucket;
  gapDown: GapBucket;
}

export interface GapAnalysisData {
  symbol: string;
  asOfDate: string;
  updatedAt: string;
  years: GapYear[];
  rules: {
    gapUp: string;
    gapDown: string;
    bullish: string;
    bearish: string;
    doji: string;
  };
}

const POLL_INTERVAL = 30 * 60 * 1000;

export function useGapAnalysis() {
  const [data, setData] = useState<GapAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/stocks/gap-analysis");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as GapAnalysisData;
      if (!Array.isArray(json.years)) throw new Error("갭 분석 데이터 형식이 올바르지 않습니다.");
      setData(json);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "갭 분석 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = window.setInterval(fetchData, POLL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
