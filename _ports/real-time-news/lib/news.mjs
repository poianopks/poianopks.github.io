// Port of artifacts/api-server/src/routes/news.ts (GET handlers only, Express removed).
import Parser from "rss-parser";
import { BROWSER_UA } from "./common.mjs";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": BROWSER_UA,
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
});

// 주식·경제 관련 키워드 (포함 시 통과)
const FINANCE_KEYWORDS_KO = [
  '주식','증권','코스피','코스닥','나스닥','다우존스','S&P','금리','환율','달러','원화',
  '반도체','삼성전자','SK하이닉스','경제','금융','투자','펀드','채권','원자재','원유',
  'GDP','인플레','연준','Fed','기준금리','수출','무역','실적','매출','영업이익',
  'IPO','공모주','배당','시가총액','외국인','기관','ETF','선물','옵션','파생',
  '비트코인','암호화폐','코인','한은','물가','수익률','포트폴리오','매수','매도','상장',
  '부동산','리츠','PER','PBR','밸류','기업가치','M&A','인수합병','상장폐지',
  '코스닥150','코스피200','대형주','중소형주','성장주','가치주','배당주',
  '바이오','제약','2차전지','배터리','전기차','수소','태양광','방산','조선','철강',
  '부채','자산','펀더멘털','실적발표','어닝시즌','무역수지','경상수지',
];

const FINANCE_KEYWORDS_EN = [
  'stock','market','economy','finance','trade','interest rate','inflation',
  'GDP','earnings','revenue','profit','dividend','IPO','nasdaq','nyse',
  'Wall Street','Fed','Powell','ECB','BOJ','treasury','yield','bond',
  'crypto','bitcoin','ethereum','semiconductor','chip','AI','tech',
  'S&P','dow','futures','options','ETF','hedge fund','private equity',
  'dollar','euro','yen','forex','commodity','oil','gold','silver',
  'recession','rate hike','rate cut','monetary','fiscal','tariff','sanction',
  'merger','acquisition','buyout','earnings call','guidance','outlook',
  'KOSPI','KOSDAQ','Samsung','Hynix','LG','Hyundai','Kia',
];

// 제외 키워드 (명백한 비금융)
const EXCLUDE_KEYWORDS = [
  '스포츠','축구','야구','농구','배구','골프','테니스','올림픽','월드컵',
  '드라마','예능','영화','연예','아이돌','BTS','뮤직','콘서트','공연',
  '날씨','기상','태풍','지진','홍수','산불',
  '요리','맛집','레시피','여행','관광','호텔',
  'sport','soccer','football','baseball','basketball','tennis','golf',
  'celebrity','entertainment','movie','drama','music','concert','fashion',
  'weather','recipe','travel','tourism',
];

function isFinancialArticle(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const excluded = EXCLUDE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
  if (excluded) return false;
  const koMatch = FINANCE_KEYWORDS_KO.some((kw) => text.includes(kw.toLowerCase()));
  const enMatch = FINANCE_KEYWORDS_EN.some((kw) => text.includes(kw.toLowerCase()));
  return koMatch || enMatch;
}

function extractImage(item) {
  if (item["media:thumbnail"]?.["$"]?.url) return item["media:thumbnail"]["$"].url;
  if (item["media:content"]?.["$"]?.url) return item["media:content"]["$"].url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) return item.enclosure.url;
  if (item.content) {
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) return match[1];
  }
  const desc = item.description;
  if (desc) {
    const match = desc.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) return match[1];
  }
  return null;
}

function stripHtml(str) {
  if (!str) return null;
  return str.replace(/<[^>]+>/g, "").trim().slice(0, 280) || null;
}

// Fetch with Node's fetch (follows redirects, honours NODE_USE_ENV_PROXY) and parse
// with rss-parser's parseString — same parsed output as parser.parseURL(url).
async function fetchFeed(url, source, category) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Status code ${res.status}`);
  const feed = await parser.parseString(await res.text());
  return (feed.items || []).slice(0, 20).map((item, i) => ({
    id: `${source}-${i}-${item.isoDate || Date.now()}`,
    title: (item.title || "").replace(/<[^>]+>/g, "").trim(),
    description: stripHtml(item.contentSnippet || item.content || item.summary || item.description),
    url: item.link || "",
    imageUrl: extractImage(item),
    source,
    category,
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
  }));
}

// ── 세계 주식·경제 전용 피드 ──
const WORLD_FEEDS = [
  { url: "https://feeds.reuters.com/reuters/businessNews",                        source: "Reuters",        category: "글로벌" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",                source: "CNBC",           category: "글로벌" },
  { url: "https://feeds.marketwatch.com/marketwatch/topstories/",                 source: "MarketWatch",    category: "글로벌" },
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",                        source: "WSJ Markets",    category: "글로벌" },
  { url: "https://finance.yahoo.com/news/rssindex",                               source: "Yahoo Finance",  category: "글로벌" },
];

// ── 국내 주식·경제 전용 피드 ──
const KOREA_FEEDS = [
  { url: "https://www.hankyung.com/rss/economy",                                  source: "한국경제",       category: "국내" },
  { url: "https://www.hankyung.com/rss/finance",                                  source: "한국경제(금융)", category: "국내" },
  { url: "https://rss.mt.co.kr/rss/rss_economy.xml",                              source: "머니투데이",     category: "국내" },
  { url: "https://rss.edaily.co.kr/edaily/rss/rss_economy.xml",                  source: "이데일리",       category: "국내" },
  { url: "https://www.mk.co.kr/rss/30100041/",                                    source: "매일경제",       category: "국내" },
  { url: "https://www.yna.co.kr/rss/economy.xml",                                 source: "연합뉴스",       category: "국내" },
];

async function collect(feeds) {
  const results = await Promise.allSettled(
    feeds.map((f) => fetchFeed(f.url, f.source, f.category))
  );
  const all = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`  [rss] ${feeds[i].source}: ${r.value.length} items`);
      all.push(...r.value);
    } else {
      console.warn(`  [rss] ${feeds[i].source} FAILED (${feeds[i].url}): ${r.reason?.message ?? r.reason}`);
    }
  });
  const filtered = all.filter((a) => isFinancialArticle(a.title, a.description));
  return filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// GET /news/world
export function world() {
  return collect(WORLD_FEEDS);
}

// GET /news/korea
export function korea() {
  return collect(KOREA_FEEDS);
}
