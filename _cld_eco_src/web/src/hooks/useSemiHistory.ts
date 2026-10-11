import { useState, useEffect, useCallback } from "react";

export interface SemiPoint {
  date: string;
  sam: number;
  sk: number;
}

export interface SemiHistory {
  series: SemiPoint[];
  updatedAt: string;
  cached: boolean;
}

const POLL_INTERVAL = 10 * 60 * 1000;

export function useSemiHistory() {
  const [data, setData] = useState<SemiHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/semiconductor-history");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SemiHistory = await res.json();
      if (json.series?.length > 0) {
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
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
