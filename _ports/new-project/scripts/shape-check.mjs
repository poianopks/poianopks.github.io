// Compares the JSON shape of each ported handler's output with the live Replit API.
// Usage: npm run shape-check   (does not write any files)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compute } from "./data.mjs";

const LIVE = process.env.LIVE_BASE ?? "https://new-project-pianopks1.replit.app";
const here = path.dirname(fileURLToPath(import.meta.url));
const APPS = path.resolve(here, "../../../apps/new-project");
const files = [path.join(APPS, "api-snapshot.json"), path.join(APPS, "market-cycle", "api-snapshot.json")];

function shape(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) {
    const els = [...new Set(v.map((x) => JSON.stringify(shape(x))))].map((s) => JSON.parse(s));
    return { "[]": els.length === 1 ? els[0] : els.length === 0 ? "empty" : els };
  }
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = shape(v[k]);
    return o;
  }
  return typeof v;
}

function diff(a, b, p = "$", out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === "object" && typeof b === "object" && !("[]" in a) && !("[]" in b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out.push(`${p}.${k}: missing in port`);
      else if (!(k in b)) out.push(`${p}.${k}: extra in port`);
      else diff(a[k], b[k], `${p}.${k}`, out);
    }
    return out;
  }
  if (a?.["[]"] !== undefined && b?.["[]"] !== undefined) {
    if (a["[]"] === "empty" || b["[]"] === "empty") return out; // empty array is compatible
    return diff(a["[]"], b["[]"], `${p}[]`, out);
  }
  out.push(`${p}: port=${JSON.stringify(a)} live=${JSON.stringify(b)}`);
  return out;
}

let same = 0, differ = 0;
for (const f of files) {
  for (const key of Object.keys(JSON.parse(fs.readFileSync(f, "utf8")))) {
    if (!/^(GET |SSE )?\/api\//.test(key)) continue;
    // SSE stream cannot be fetched as JSON; its first event equals /api/cycle/live.
    const liveKey = key.startsWith("SSE ") ? key.slice(4).replace("/stream", "/live") : key.replace(/^GET /, "");
    try {
      const [{ data }, live] = await Promise.all([
        compute(key),
        fetch(LIVE + liveKey, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(60000) })
          .then((r) => { if (!r.ok) throw new Error(`live HTTP ${r.status}`); return r.json(); }),
      ]);
      const d = diff(shape(data), shape(live));
      if (d.length) { differ++; console.log(`DIFF ${key}\n  ${d.join("\n  ")}`); }
      else { same++; console.log(`same ${key}`); }
    } catch (e) {
      differ++;
      console.log(`ERR  ${key}: ${e?.message || e}`);
    }
  }
}
console.log(`Shape check: ${same} identical, ${differ} different/errored`);
