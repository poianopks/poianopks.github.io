// Regenerates the Real Time News API responses as static JSON files.
// Usage: npm run data   (writes to ../../apps/real-time-news/data/)
import { writeFileSync, renameSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import * as markets from "./lib/markets.mjs";
import * as semis from "./lib/semiconductors.mjs";
import * as news from "./lib/news.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, process.env.OUT_DIR ?? "../../apps/real-time-news/data");

// path after "/api/" -> file name ("/", "?", "=", "&" -> "_", + ".json")
const fileFor = (path) => path.replace(/[/?=&]/g, "_") + ".json";

// Sanity checks: a response built entirely from failed upstream calls is treated
// as a failure so the previous (good) file is kept instead of being overwritten.
const nonEmptyArray = (d) => Array.isArray(d) && d.length > 0;
const ENDPOINTS = [
  // nyse first: it seeds the market-state probe other handlers read.
  { path: "markets/nyse",           fn: markets.nyse,       ok: (d) => d.indices?.length > 0 },
  { path: "markets/analysis",       fn: markets.analysis,   ok: (d) => d.vixLevel > 0 },
  { path: "markets/macro",          fn: markets.macro,      ok: (d) => d.usdKrw > 0 || d.gold > 0 },
  { path: "markets/korea",          fn: markets.korea,      ok: (d) => d.kospi?.value > 0 },
  { path: "markets/survival",       fn: markets.survival,   ok: (d) => d.buffettIsLive === true },
  { path: "markets/valuation",      fn: markets.valuation,  ok: (d) => d.kospiValue > 0 },
  { path: "markets/semiconductors", fn: semis.semiconductors, ok: (d) => d.stocks?.length > 0 },
  { path: "markets/outlook",        fn: semis.outlook,      ok: (d) => d.vixLevel > 0 },
  { path: "news/world",             fn: news.world,         ok: nonEmptyArray },
  { path: "news/korea",             fn: news.korea,         ok: nonEmptyArray },
];

// Safety net: a stray socket error from one source must not abort the whole run.
process.on("uncaughtException", (err) => console.error(`  [uncaught] ${err?.message ?? err}`));
process.on("unhandledRejection", (err) => console.error(`  [unhandled] ${err?.message ?? err}`));

mkdirSync(OUT_DIR, { recursive: true });

let success = 0;
const failed = [];
for (const ep of ENDPOINTS) {
  const file = fileFor(ep.path);
  const t0 = Date.now();
  console.log(`→ /api/${ep.path}`);
  try {
    const data = await ep.fn();
    if (!ep.ok(data)) throw new Error("sanity check failed (upstream data empty)");
    const target = join(OUT_DIR, file);
    const tmp = `${target}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
    renameSync(tmp, target);
    success++;
    console.log(`  ✓ ${file} (${Date.now() - t0} ms)`);
  } catch (err) {
    failed.push(ep.path);
    console.error(`  ✗ ${ep.path} failed, keeping previous ${file}: ${err?.stack ?? err}`);
  }
}

console.log(`\nDone: ${success}/${ENDPOINTS.length} succeeded.${failed.length ? " Failed: " + failed.join(", ") : ""}`);
process.exit(success >= ENDPOINTS.length / 2 ? 0 : 1);
