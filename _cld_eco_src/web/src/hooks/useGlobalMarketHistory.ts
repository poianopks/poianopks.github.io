import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export interface HistoryPoint {
  date: string;
  value: number | null;
}

export interface GlobalMarketHistory {
  ewy: HistoryPoint[];
  krw: HistoryPoint[];
  updatedAt: string;
  cached: boolean;
}

const EMPTY: GlobalMarketHistory = { ewy: [], krw: [], updatedAt: "", cached: false };

export function useGlobalMarketHistory() {
  const [data, setData]       = useState<GlobalMarketHistory>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/api/stocks/global-market-history`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) {
      setError(e.message ?? "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 60 * 60 * 1000); // 1시간마다 갱신
    return () => clearInterval(id);
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
