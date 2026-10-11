import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export interface MarketItem {
  symbol: string;
  name: string;
  nameEn?: string;
  emoji?: string;
  note?: string;
  price: number;
  prevClose: number;
  changePct: number;
  currency: string;
  marketState: string;
}

export interface GlobalMarketData {
  futures: MarketItem[];
  adrs: MarketItem[];
  semiconductors: MarketItem[];
  kospiProxy: MarketItem[];
  fx: MarketItem[];
  updatedAt: string;
  cached: boolean;
}

const EMPTY: GlobalMarketData = {
  futures: [],
  adrs: [],
  semiconductors: [],
  kospiProxy: [],
  fx: [],
  updatedAt: "",
  cached: false,
};

export function useGlobalMarket() {
  const [data, setData] = useState<GlobalMarketData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/api/stocks/global-market`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    // 1분마다 자동 갱신
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
