import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export interface OHLCPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  changePct: number;
}

export interface AdrHistory {
  symbol: string;
  daily: OHLCPoint[];
  monthly: OHLCPoint[];
  updatedAt: string;
}

export function useAdrHistory(symbol: string | null) {
  const [data, setData]       = useState<AdrHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) { setData(null); return; }
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/stocks/adr-history?symbol=${encodeURIComponent(symbol)}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [symbol]);

  return { data, loading, error };
}
