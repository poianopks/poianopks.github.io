/**
 * 데이터 수집 스크립트 (GitHub Actions에서 실행)
 *
 * 원본 Replit 앱의 서버 코드(server/routes)를 그대로 실행한 뒤,
 * 화면이 쓰는 모든 /api 주소를 한 번씩 불러 web/public/api/**.json 으로 저장합니다.
 * 실패한 주소는 지금 공개된 사이트의 이전 파일을 그대로 다시 씁니다(빈 화면 방지).
 */
import express from "express";
import fs from "node:fs";
import path from "node:path";
import type { AddressInfo } from "node:net";
import stocksRouter from "../server/routes/stocks";
import turnaroundRouter, { CANDIDATES, WATCHLIST_STOCKS } from "../server/routes/turnaround";
import { staticKey } from "../web/src/lib/staticApi";
import { collectNews } from "../server/news";

const OUT = path.resolve(import.meta.dirname, "../web/public/api");
const PREV_BASE = process.env.PREV_BASE ?? "https://poianopks.github.io/cld_eco/";
const CONCURRENCY = 4;

const app = express();
app.use("/api", stocksRouter);
app.use("/api", turnaroundRouter);
const server = app.listen(0);
const port = (server.address() as AddressInfo).port;

type Job = { route: string; query?: string };
const ok: string[] = [];
const reused: string[] = [];
const failed: string[] = [];

function fileFor(job: Job) {
  return path.join(OUT, staticKey(job.route, job.query ?? ""));
}

function looksValid(body: unknown) {
  return body != null && typeof body === "object" && !("error" in (body as Record<string, unknown>));
}

async function getJson(url: string, timeoutMs: number) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function run(job: Job) {
  const label = job.route + (job.query ? `?${job.query}` : "");
  const dest = fileFor(job);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    const body = await getJson(`http://127.0.0.1:${port}/api/${job.route}${job.query ? `?${job.query}` : ""}`, 120_000);
    if (!looksValid(body)) throw new Error(JSON.stringify(body).slice(0, 200));
    fs.writeFileSync(dest, JSON.stringify(body));
    ok.push(label);
  } catch (e) {
    try {
      const prev = await getJson(`${PREV_BASE}api/${staticKey(job.route, job.query ?? "")}`, 20_000);
      if (!looksValid(prev)) throw new Error("invalid previous file");
      fs.writeFileSync(dest, JSON.stringify(prev));
      reused.push(`${label} (${(e as Error).message})`);
    } catch {
      failed.push(`${label} (${(e as Error).message})`);
    }
  }
}

async function runAll(jobs: Job[]) {
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) await run(job);
    }),
  );
}

const PERIODS = ["1m", "3m", "6m", "1y"];

async function main() {
  // 1) 화면 공통 데이터
  await runAll([
    { route: "stocks/quotes" },
    { route: "stocks/global-market" },
    { route: "stocks/global-market-history" },
    { route: "stocks/alive-ath" },
    { route: "stocks/gap-analysis" },
    { route: "stocks/pbr" },
    { route: "stocks/semiconductor-history" },
    { route: "stocks/signal-chart" },
    { route: "stocks/dram-history" },
    { route: "stocks/macro-monitor" },
    { route: "stocks/cycle-indicators" },
    { route: "stocks/ewy-history" },
    { route: "turnaround/list" },
    { route: "turnaround/watchlist" },
  ]);

  // 2) 팩트체크 탭: 해외 상장 한국 종목(ADR) 차트 — 시장 목록에 나온 종목 전부
  const symbols = new Set<string>();
  try {
    const gm = JSON.parse(fs.readFileSync(fileFor({ route: "stocks/global-market" }), "utf8"));
    for (const group of ["futures", "adrs", "semiconductors", "kospiProxy", "fx"]) {
      for (const item of gm[group] ?? []) if (item?.symbol) symbols.add(item.symbol);
    }
  } catch {
    /* 시장 목록이 없으면 건너뜀 */
  }
  await runAll([...symbols].map((s) => ({ route: "stocks/adr-history", query: `symbol=${encodeURIComponent(s)}` })));

  // 3) 턴어라운드 탭: 종목별·기간별 차트
  const chartJobs: Job[] = [];
  for (const c of CANDIDATES) for (const p of PERIODS) chartJobs.push({ route: `turnaround/chart/${c.code}`, query: `period=${p}` });
  for (const c of WATCHLIST_STOCKS) for (const p of PERIODS) chartJobs.push({ route: `turnaround/watchlist/chart/${c.code}`, query: `period=${p}` });
  await runAll(chartJobs);

  // 4) 경제·주식 뉴스 (무료 공개 RSS)
  {
    const dest = fileFor({ route: "news/feed" });
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      const feed = await collectNews();
      if (feed.items.length === 0) throw new Error("뉴스 0건");
      fs.writeFileSync(dest, JSON.stringify(feed));
      ok.push(`news/feed (${feed.items.length}건)`);
      for (const s of feed.sources) if (!s.ok) console.log("  ⚠️ 뉴스 출처 실패:", s.name);
    } catch (e) {
      try {
        const prev = await getJson(`${PREV_BASE}api/${staticKey("news/feed", "")}`, 20_000);
        fs.writeFileSync(dest, JSON.stringify(prev));
        reused.push(`news/feed (${(e as Error).message})`);
      } catch {
        failed.push(`news/feed (${(e as Error).message})`);
      }
    }
  }

  fs.writeFileSync(
    path.join(OUT, "_status.json"),
    JSON.stringify({ builtAt: new Date().toISOString(), ok: ok.length, reused, failed }, null, 2),
  );
  console.log(`✅ 새로 받음 ${ok.length}개 · ♻️ 이전 파일 재사용 ${reused.length}개 · ❌ 실패 ${failed.length}개`);
  for (const r of reused) console.log("  ♻️", r);
  for (const f of failed) console.log("  ❌", f);
  server.close();
  // 핵심 시세(quotes)까지 없으면 배포를 막아 빈 사이트가 올라가지 않게 함
  if (!fs.existsSync(fileFor({ route: "stocks/quotes" }))) {
    console.error("핵심 데이터(stocks/quotes)가 없어 중단합니다.");
    process.exit(1);
  }
  process.exit(0);
}

main();
