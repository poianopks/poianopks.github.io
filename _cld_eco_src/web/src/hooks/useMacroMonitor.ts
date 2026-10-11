import { useState, useEffect, useCallback } from "react";

export interface RSData {
  now: number | null;
  chg1mo: number | null;
  chg3mo: number | null;
  series: { date: string; rs: number }[];
}

export interface MacroMonitorData {
  rates: {
    us10y: number | null;
    us3m: number | null;
    spreadNow: number | null;
    spread1moAgo: number | null;
    spread3moAgo: number | null;
    curveStatus: string;
    curveTrend: string;
  };
  fx: {
    usdkrwNow: number | null;
    usdkrwChange1mo: number | null;
    fxTrend: string;
  };
  liquidity: {
    dxyNow: number | null;
    dxyChange1mo: number | null;
    dxyChange3mo: number | null;
    liquidityStatus: string;
  };
  rs: {
    samsung: RSData;
    skhynix: RSData;
    leadingSector: string;
  };
  macroLight: "green" | "amber" | "red";
  macroScore: number;
  note: string;
  updatedAt: string;
  cached: boolean;
}

const POLL_MS = 5 * 60 * 1000;

export function useMacroMonitor() {
  const [data, setData] = useState<MacroMonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/macro-monitor");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MacroMonitorData = await res.json();
      if (json.rates) { setData(json); setError(null); }
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
