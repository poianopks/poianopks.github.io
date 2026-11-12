// Shared helpers for the Real Time News port (no Express).
import YahooFinanceClass from "yahoo-finance2";

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const yf = new YahooFinanceClass({ suppressNotices: ["yahooSurvey", "ripHistorical"] });

// ── Throttle: serialize Yahoo calls with a small delay between them ─────────
const YAHOO_DELAY_MS = Number(process.env.YAHOO_DELAY_MS ?? 250);
let chain = Promise.resolve();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function throttled(fn) {
  const p = chain.then(async () => {
    try {
      return await fn();
    } finally {
      await sleep(YAHOO_DELAY_MS);
    }
  });
  chain = p.catch(() => {});
  return p;
}

// Per-run memo of quotes (several endpoints request the same symbol seconds apart).
const QUOTE_MEMO_TTL = 60 * 1000;
const quoteMemo = new Map();

export async function fetchQuote(symbol) {
  const m = quoteMemo.get(symbol);
  if (m && Date.now() - m.t < QUOTE_MEMO_TTL) return m.v;
  try {
    const result = await throttled(() => yf.quote(symbol));
    quoteMemo.set(symbol, { v: result, t: Date.now() });
    return result;
  } catch (err) {
    console.warn(`  [yahoo] quote ${symbol} failed: ${err?.message ?? err}`);
    return null;
  }
}

export function yfChart(symbol, opts) {
  return throttled(() => yf.chart(symbol, opts));
}

export function makeCache() {
  const cache = new Map();
  return {
    cache,
    getCached(key, ttl) {
      const e = cache.get(key);
      return e && Date.now() - e.timestamp < ttl ? e.data : null;
    },
    setCached(key, data) {
      cache.set(key, { data, timestamp: Date.now() });
    },
  };
}

export function formatVolume(vol) {
  if (!vol) return "N/A";
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
  return String(vol);
}
