// Upstream fetch helpers ported from the Replit app (macro.ts / cycle.ts).
// Identical upstream requests within one run share a single in-flight/finished promise.

import { AsyncLocalStorage } from "node:async_hooks";

const memo = new Map();
const results = new Map(); // url -> true (ok) / false (failed)
// Tracks which upstream URLs a handler touched, so the runner can tell whether
// its output came only from hardcoded fallbacks.
export const tracker = new AsyncLocalStorage();
export const upstreamOk = (url) => results.get(url);
export const upstreamLog = []; // { url, ok, status }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rawFetch(url, headers, timeoutMs, kind) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) {
        if (attempt === 0 && (res.status === 429 || res.status >= 500)) { await sleep(1500); continue; }
        upstreamLog.push({ url, ok: false, status: res.status });
        return null;
      }
      const body = kind === "json" ? await res.json() : await res.text();
      upstreamLog.push({ url, ok: true, status: res.status });
      return body;
    } catch (e) {
      if (attempt === 0) { await sleep(1500); continue; }
      upstreamLog.push({ url, ok: false, status: String(e?.name || e) });
      return null;
    }
  }
  return null;
}

function cached(url, headers, timeoutMs, kind) {
  tracker.getStore()?.add(url);
  if (!memo.has(url)) {
    memo.set(url, rawFetch(url, headers, timeoutMs, kind).then((v) => { results.set(url, kind === "json" ? !!v?.chart?.result?.[0] : v != null && v.trim().split("\n").length > 1); return v; }));
  }
  return memo.get(url);
}

// macro.ts fetchYahooChart (9s timeout) / cycle.ts fetchJson (10s timeout)
export function fetchYahooChart(symbol, interval, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  return cached(url, { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }, 10000, "json");
}

function fetchFredText(seriesId) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
  return cached(url, { "User-Agent": "Mozilla/5.0" }, 15000, "text");
}

// macro.ts fetchFredCsv
export async function fetchFredCsv(seriesId) {
  const text = await fetchFredText(seriesId);
  if (text == null) return [];
  const lines = text.trim().split("\n").slice(1);
  const points = [];
  for (const line of lines) {
    const [date, val] = line.split(",");
    const n = parseFloat(val);
    if (date && !isNaN(n) && n >= 0) points.push({ date: date.trim(), value: n });
  }
  return points;
}

// cycle.ts fetchFredLatest
export async function fetchFredLatest(seriesId) {
  const text = await fetchFredText(seriesId);
  if (text == null) return null;
  const lines = text.trim().split("\n").slice(1);
  for (let i = lines.length - 1; i >= 0; i--) {
    const [, val] = lines[i].split(",");
    const n = parseFloat(val);
    if (!isNaN(n) && isFinite(n)) return n;
  }
  return null;
}
