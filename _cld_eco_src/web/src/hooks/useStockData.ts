import { useState, useEffect, useCallback } from "react";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  ma50: number | null;
  ma200d: number | null;
  ma200w: number | null;
  dev200d: number | null;
  dev200w: number | null;
  marketTime?: string | null;
  marketState?: string;
  source?: string;
  error?: string;
}

export interface StockData {
  quotes: Record<string, Quote>;
  updatedAt: string;
  cached: boolean;
}

const POLL_INTERVAL = 60 * 1000;

const EMPTY: StockData = {
  quotes: {},
  updatedAt: "",
  cached: false,
};

export function useStockData() {
  const [data, setData] = useState<StockData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/quotes");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StockData = await res.json();
      const successfulQuotes = Object.fromEntries(
        Object.entries(json.quotes ?? {}).filter(([, quote]) =>
          quote &&
          !quote.error &&
          typeof quote.price === "number" &&
          quote.price > 0
        ),
      );
      const failedSymbols = Object.entries(json.quotes ?? {})
        .filter(([, quote]) => !quote || quote.error || !(quote.price > 0))
        .map(([symbol]) => symbol);

      if (Object.keys(successfulQuotes).length === 0) {
        throw new Error("Yahoo Finance 시세를 불러오지 못했습니다.");
      }

      setData((previous) => ({
        ...json,
        quotes: { ...previous.quotes, ...successfulQuotes },
      }));
      setError(failedSymbols.length ? `일부 시세 지연: ${failedSymbols.join(", ")}` : null);
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

  const kospi = data.quotes["^KS11"];
  const sp500 = data.quotes["^GSPC"];
  const ndx   = data.quotes["^NDX"];
  const sam   = data.quotes["005930.KS"];
  const sk    = data.quotes["000660.KS"];
  const tsm   = data.quotes["TSM"];
  const mu    = data.quotes["MU"];
  const nvda  = data.quotes["NVDA"];

  return { data, loading, error, kospi, sp500, ndx, sam, sk, tsm, mu, nvda, refetch: fetchData };
}
