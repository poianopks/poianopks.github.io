import { useState, useEffect, useCallback } from "react";

export interface AliveAthItem {
  date: string;
  close: number;
  daysAlive: number;
  rank: number;
}

export interface AliveAthData {
  aliveList: AliveAthItem[];
  totalAthCount: number;
  aliveCount: number;
  analysisStart: string;
  analysisEnd: string;
  totalDays: number;
  /** 가장 높은 살아있는 ATH (최근에 달성한 생존 ATH) */
  maxAlivePrice: number | null;
  maxAliveDate: string | null;
  maxAliveDaysAlive: number | null;
  /** 가장 낮은 살아있는 ATH — 이 아래로 종가가 내려가면 모든 살아있는 ATH 동시 무효화 */
  minAlivePrice: number | null;
  minAliveDate: string | null;
  minAliveDaysAlive: number | null;
  updatedAt: string;
  cached: boolean;
}

const EMPTY: AliveAthData = {
  aliveList: [],
  totalAthCount: 0,
  aliveCount: 0,
  analysisStart: "",
  analysisEnd: "",
  totalDays: 0,
  maxAlivePrice: null,
  maxAliveDate: null,
  maxAliveDaysAlive: null,
  minAlivePrice: null,
  minAliveDate: null,
  minAliveDaysAlive: null,
  updatedAt: "",
  cached: false,
};

export function useAliveAth() {
  const [data, setData] = useState<AliveAthData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stocks/alive-ath");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AliveAthData = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
