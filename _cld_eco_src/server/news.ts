/**
 * 경제·주식 뉴스 수집 (무료 공개 RSS, API 키 없음)
 *
 * 제목·출처·시간·원문 링크만 저장합니다. 기사 본문은 저장하지 않으며
 * 저작권은 각 언론사에 있습니다. 원문은 링크로 해당 언론사 사이트에서 읽습니다.
 */

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null; // ISO
  category: string;
}

export interface NewsFeed {
  items: NewsItem[];
  categories: { key: string; label: string; emoji: string }[];
  sources: { name: string; ok: boolean; count: number }[];
  updatedAt: string;
}

const gn = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;

export const NEWS_CATEGORIES = [
  { key: "market", label: "국내 증시", emoji: "📈" },
  { key: "economy", label: "경제·금리·환율", emoji: "🏦" },
  { key: "semi", label: "반도체·AI", emoji: "🔬" },
  { key: "global", label: "해외 증시", emoji: "🌎" },
];

const FEEDS: { name: string; url: string; category: string }[] = [
  { name: "구글뉴스: 코스피·증시", url: gn("코스피 OR 코스닥 OR 증시 when:2d"), category: "market" },
  { name: "구글뉴스: 경제·금리·환율", url: gn("경제 금리 OR 환율 OR 물가 when:2d"), category: "economy" },
  { name: "구글뉴스: 반도체", url: gn("반도체 OR 삼성전자 OR SK하이닉스 OR 엔비디아 when:2d"), category: "semi" },
  { name: "구글뉴스: 해외 증시", url: gn("뉴욕증시 OR 나스닥 OR 미국증시 OR 연준 when:2d"), category: "global" },
  { name: "연합뉴스 경제", url: "https://www.yna.co.kr/rss/economy.xml", category: "economy" },
  { name: "연합뉴스 마켓", url: "https://www.yna.co.kr/rss/market.xml", category: "market" },
  { name: "한국경제 증권", url: "https://www.hankyung.com/feed/finance", category: "market" },
  { name: "한국경제 경제", url: "https://www.hankyung.com/feed/economy", category: "economy" },
  { name: "매일경제 증권", url: "https://www.mk.co.kr/rss/50200011/", category: "market" },
];

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

export function parseRss(xml: string, feed: (typeof FEEDS)[number]): NewsItem[] {
  const items: NewsItem[] = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const it = m[0];
    let title = tag(it, "title");
    const link = tag(it, "link") || (it.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
    let source = tag(it, "source");
    const date = tag(it, "pubDate") || tag(it, "dc:date");
    // 구글 뉴스 제목 끝의 " - 언론사" 를 출처로 분리
    if (!source) source = feed.name.replace(/^구글뉴스: .*/, "") || feed.name;
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    if (!title || !/^https?:\/\//.test(link)) continue;
    const t = date ? new Date(date) : null;
    items.push({
      title,
      link,
      source: source || feed.name,
      publishedAt: t && !isNaN(t.getTime()) ? t.toISOString() : null,
      category: feed.category,
    });
  }
  return items;
}

export async function collectNews(): Promise<NewsFeed> {
  const sources: NewsFeed["sources"] = [];
  const all: NewsItem[] = [];
  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const r = await fetch(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; KOSPI-Analysis-News/1.0)", Accept: "application/rss+xml, application/xml, text/xml" },
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const items = parseRss(await r.text(), feed);
        all.push(...items);
        sources.push({ name: feed.name, ok: items.length > 0, count: items.length });
      } catch {
        sources.push({ name: feed.name, ok: false, count: 0 });
      }
    }),
  );

  // 같은 제목은 하나만, 최신순, 3일 이내, 카테고리별 최대 60개
  const seen = new Set<string>();
  const cutoff = Date.now() - 3 * 24 * 3600 * 1000;
  const unique = all
    .filter((n) => !n.publishedAt || new Date(n.publishedAt).getTime() >= cutoff)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .filter((n) => {
      const k = n.title.replace(/\s+/g, "").slice(0, 40);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  const perCat: Record<string, number> = {};
  const items = unique.filter((n) => (perCat[n.category] = (perCat[n.category] ?? 0) + 1) <= 60);

  return { items, categories: NEWS_CATEGORIES, sources, updatedAt: new Date().toISOString() };
}
