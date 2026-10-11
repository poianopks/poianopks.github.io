import { useState, useEffect, useCallback } from "react";

export interface SignalPoint {
  date: string;
  close: number;
  ma40: number | null;
  dev: number | null;
  signal: string;
  high: number;
  low: number;
  crossType?: "dead" | "golden";
}

export interface StockSignal {
  series: SignalPoint[];
  last: SignalPoint;
  devTrend: number;
}

export interface RatioPoint { date: string; ratio: number; }

export interface SemiSignalData {
  sam: StockSignal;
  sk: StockSignal;
  ratioSeries: RatioPoint[];
  divergenceWeeks: number;
  compositeSignal: "safe" | "caution" | "danger" | "sell";
  updatedAt: string;
  cached: boolean;
}

const POLL_MS = 5 * 60 * 1000;

export function useSemiSignal() {
  const [data, setData] = useState<SemiSignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/signal-chart");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SemiSignalData = await res.json();
      if (json.sam?.series?.length) { setData(json); setError(null); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => clearInterval(id);
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
