// Regenerates ../../apps/new-project-now/api-snapshot.json without Replit.
// For every "/api/..." key, runs the ported handler with the key's (decoded) query
// and replaces the value. Failed keys and non-/api keys are left unchanged.
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ROUTES, stats, krxStatus, feedStatus } from "./handlers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.resolve(here, process.env.SNAPSHOT_PATH ?? "../../apps/new-project-now/api-snapshot.json");
const SKIP = ["/api/market-radar/outlook"]; // AI / POST only

// Reject results that the original would return as 200 but which are clearly
// "no data" (Yahoo/RSS blocked), so good old data is not overwritten.
function looksEmpty(route, body) {
  if (route === "/stocks/quote") return body.length > 0 && body.every((q) => q.marketState === "UNKNOWN");
  if (route === "/stocks/history") return !body.candles?.length;
  if (route === "/stocks/market-overview") return body.items.every((i) => !i.price && i.weeklyDivergence20 == null);
  if (route === "/market-radar/snapshot") return !body.kospiSpot && !body.kospi200 && body.globalIndices.every((g) => !g);
  if (route === "/market-radar/news" || route === "/market-radar/kr-news") return body.length === 0;
  return false;
}

const t0 = Date.now();
const snap = JSON.parse(readFileSync(SNAP, "utf8"));
const keys = Object.keys(snap);
let ok = 0, failed = 0, skipped = 0;
const failures = [];

for (const key of keys) {
  const raw = key.replace(/^GET /, "");
  if (!raw.startsWith("/api/") || SKIP.some((s) => raw.startsWith(s)) || /^(POST|SSE) /.test(key)) { skipped++; continue; }
  const url = new URL(raw, "http://local");
  const route = url.pathname.slice(4); // strip "/api"
  const handler = ROUTES[route];
  if (!handler) { skipped++; failures.push(`${key}: no ported handler`); continue; }
  const query = Object.fromEntries(url.searchParams.entries());
  try {
    const { status, body } = await handler(query);
    if (status !== 200) throw new Error(`HTTP ${status} ${body?.message ?? ""}`);
    if (looksEmpty(route, body)) throw new Error("empty/degenerate result");
    snap[key] = body;
    ok++;
  } catch (e) {
    failed++;
    failures.push(`${key}: ${e.message}`);
  }
}

const tmp = SNAP + ".tmp";
writeFileSync(tmp, JSON.stringify(snap), "utf8");
renameSync(tmp, SNAP);

const attempted = ok + failed;
for (const f of failures) console.error(`  x ${f}`);
console.log(`  feeds: ${JSON.stringify(feedStatus)}`);
console.log(`  KRX: ${krxStatus.ok}/${krxStatus.calls} calls ok${krxStatus.errors.length ? ` (${krxStatus.errors.join("; ")})` : ""}`);
console.log(`new-project-now: ${ok}/${attempted} keys updated, ${failed} failed, ${skipped} skipped, ` +
  `${stats.yahooCalls} Yahoo calls, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.exit(attempted > 0 && ok >= attempted / 2 ? 0 : 1);
