// Regenerates apps/new-project{,/market-cycle}/api-snapshot.json with the ported handlers.
// Usage: npm run data   (from _ports/new-project)
//
// Snapshot values are written in the { status, ct, body: "<json string>" } form that
// static-api.js reads (it serves hit.body). Keys are "/api/..." request paths, or
// "SSE /api/..." for EventSource streams (body = first event payload).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routes as macroRoutes } from "../lib/macro.mjs";
import { routes as cycleRoutes } from "../lib/cycle.mjs";
import { tracker, upstreamOk, upstreamLog } from "../lib/http.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APPS = path.resolve(here, "../../../apps/new-project");
const SNAPSHOTS = [
  path.join(APPS, "api-snapshot.json"),
  path.join(APPS, "market-cycle", "api-snapshot.json"),
];
const ROUTES = { ...macroRoutes, ...cycleRoutes };
const DELAY_MS = Number(process.env.DELAY_MS ?? 400);
const CT = "application/json; charset=utf-8";

// Upstreams that also fail on the live Replit server (Yahoo has no "^DXY" symbol → 404),
// so the original always serves its hardcoded fallback for them. Not counted as failures.
// FRED WILL5000PRFC(윌셔5000)는 FRED에서 서비스가 끝나 404 → 원본도 고정값(46000)을 씀.
const KNOWN_BROKEN = [/\/chart\/%5EDXY\?/, /id=WILL5000PRFC/];
// A key whose output used a hardcoded fallback because a normally-working source failed
// is kept unchanged (so real data is not replaced by placeholders). ALLOW_FALLBACK=1 writes it anyway.
const ALLOW_FALLBACK = process.env.ALLOW_FALLBACK === "1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function compute(key) {
  const p = key.replace(/^(GET|SSE) /, "");
  const url = new URL(p, "http://local");
  const handler = ROUTES[url.pathname];
  if (!handler) throw new Error(`no ported handler for ${url.pathname}`);
  const touched = new Set();
  const data = await tracker.run(touched, () => handler(url.searchParams));
  const urls = [...touched];
  const failed = urls.filter((u) => !upstreamOk(u) && !KNOWN_BROKEN.some((re) => re.test(u)));
  return { data, urls, failed };
}

async function main() {
  let ok = 0, fail = 0, skipped = 0;
  const lines = [];
  for (const file of SNAPSHOTS) {
    const snap = JSON.parse(fs.readFileSync(file, "utf8"));
    let changed = 0;
    const okBefore = ok;
    for (const key of Object.keys(snap)) {
      if (!/^(GET |SSE )?\/api\//.test(key)) { skipped++; continue; }
      try {
        const { data, urls, failed } = await compute(key);
        if (failed.length && !ALLOW_FALLBACK) {
          throw new Error(`upstream failed, output would use hardcoded fallback: ${failed.map(short).join(", ")}`);
        }
        JSON.stringify(data); // must be serialisable
        snap[key] = { status: 200, ct: CT, body: JSON.stringify(data) };
        changed++; ok++;
        lines.push(`  ok   ${key}${failed.length ? `  (fallback for: ${failed.map(short).join(", ")})` : ""}`);
      } catch (e) {
        fail++;
        lines.push(`  FAIL ${key}: ${e?.message || e}  (kept old value)`);
        // Old values stored as bare JSON (not the {status, body} wrapper static-api.js serves)
        // are re-wrapped with their data untouched, so the static page can still read them.
        const old = snap[key];
        if (old == null || typeof old !== "object" || typeof old.body !== "string") {
          snap[key] = { status: 200, ct: CT, body: JSON.stringify(old) };
          changed++;
        }
      }
      await sleep(DELAY_MS);
    }
    if (changed) fs.writeFileSync(file, JSON.stringify(snap, null, 0), "utf8");
    lines.push(`${path.relative(path.resolve(APPS, "../.."), file)}: ${ok - okBefore} key(s) regenerated`);
  }

  const failedUp = [...new Set(upstreamLog.filter((l) => !l.ok).map((l) => `${short(l.url)} [${l.status}]`))];
  console.log(lines.join("\n"));
  if (failedUp.length) console.log("Upstream failures (fallbacks used where applicable):\n  " + failedUp.join("\n  "));
  console.log(`Summary: ${ok} ok, ${fail} failed, ${skipped} skipped`);
  const total = ok + fail;
  process.exit(total > 0 && ok >= total / 2 ? 0 : 1);
}

function short(u) {
  const m = u.match(/chart\/([^?]+)\?(.*)$/);
  if (m) return `Yahoo ${decodeURIComponent(m[1])} ${m[2]}`;
  const f = u.match(/id=([^&]+)/);
  return f ? `FRED ${f[1]}` : u;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
