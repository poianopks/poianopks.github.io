// Computes every GET endpoint of the ported API and writes the JSON bodies to
// ../../apps/erp-realtime-analysis/data/<path with / ? = & -> _>.json
// A failing endpoint is logged and its previous file is kept.
// Exit code: 0 if at least half of the endpoints succeeded, else 1.
import { mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { endpoints } from "./market.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(here, "../../apps/erp-realtime-analysis/data");

const fileNameFor = (p) => p.replace(/[/?=&]/g, "_") + ".json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(OUT_DIR, { recursive: true });

const results = [];
for (const [route, handler] of Object.entries(endpoints)) {
  const file = fileNameFor(route);
  try {
    const body = await handler();
    if (body === undefined || body === null) throw new Error("empty response");
    // The original returns [] when Yahoo history fails; don't overwrite good data with it.
    if (Array.isArray(body) && body.length === 0) throw new Error("empty array (upstream failure)");
    const json = JSON.stringify(body);
    JSON.parse(json);
    const dest = path.join(OUT_DIR, file);
    const tmp = dest + ".tmp";
    await writeFile(tmp, json + "\n", "utf8");
    await rename(tmp, dest);
    console.log(`ok    /api/${route} -> ${file} (${json.length} bytes)`);
    results.push(true);
  } catch (err) {
    console.error(`FAIL  /api/${route} -> ${file} kept old file: ${err?.message ?? err}`);
    results.push(false);
  }
  await sleep(300);
}

const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} endpoints succeeded`);
process.exit(ok * 2 >= results.length ? 0 : 1);
