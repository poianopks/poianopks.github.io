/**
 * 메뉴별 단독 페이지 만들기 (vite build 다음에 실행)
 * dist/index.html 을 복사해 dist/<메뉴>/index.html 을 만들고 제목·설명·주소를 메뉴에 맞게 바꿉니다.
 * 이렇게 하면 /cld_eco/turnaround/ 같은 주소가 검색엔진·광고 심사에 각각 별도 페이지로 보입니다.
 */
import fs from "node:fs";
import path from "node:path";
import { TABS, SITE_NAME } from "../web/src/lib/tabs";

const DIST = path.resolve(import.meta.dirname, "../dist");
const BASE = process.env.BASE_PATH ?? "/cld_eco/";
const ORIGIN = process.env.SITE_ORIGIN ?? "https://poianopks.github.io";
const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function page(title: string, desc: string, url: string) {
  let h = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/<link rel="canonical"[^>]*>\s*/g, "");
  return h.replace("</head>", `  <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n  </head>`);
}

fs.writeFileSync(
  path.join(DIST, "index.html"),
  page(`${SITE_NAME} — KOSPI·미국 지수·반도체 분석`, "KOSPI·미국 지수·반도체 200일/200주 이격도, PBR, 갭 분석, 턴어라운드 종목, 경제 뉴스까지 — 공개 데이터로 1시간마다 갱신되는 투자 분석 센터", `${ORIGIN}${BASE}`),
);
for (const t of TABS) {
  const dir = path.join(DIST, t.value);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(`${t.title} | ${SITE_NAME}`, t.desc, `${ORIGIN}${BASE}${t.value}/`));
}
console.log(`✅ 메뉴별 단독 페이지 ${TABS.length}개 생성`);
