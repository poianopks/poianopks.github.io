import fs from "node:fs";
import { collectBrief } from "../_cld_eco_src/server/brief";
const prev = await fetch("https://poianopks.github.io/cld_eco/api/brief/kospi.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
const b = await collectBrief(prev);
fs.writeFileSync("brief.json", JSON.stringify(b));
console.log(JSON.stringify({ ...b, flowHistory: b.flowHistory.length }, null, 1));
