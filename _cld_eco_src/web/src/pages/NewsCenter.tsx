import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  category: string;
}
interface NewsFeed {
  items: NewsItem[];
  categories: { key: string; label: string; emoji: string }[];
  sources: { name: string; ok: boolean; count: number }[];
  updatedAt: string;
}

// 키워드에서 뺄 흔한 말
const STOP = new Set([
  "기자", "뉴스", "속보", "종합", "오늘", "내일", "올해", "지난해", "이번", "관련", "대한", "위해", "있는", "없는",
  "한다", "했다", "에서", "으로", "까지", "부터", "보다", "만에", "이후", "전망", "포토", "영상", "단독", "사진",
  "하는", "하고", "되는", "된다", "것으로", "따르면", "가운데", "가장", "모두", "다시", "통해", "등", "중", "및",
]);

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function NewsCenter() {
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(40);

  useEffect(() => {
    const load = () =>
      fetch("/api/news/feed")
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then((d: NewsFeed) => { setFeed(d); setError(null); })
        .catch((e) => setError(e.message));
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const catMap = useMemo(() => Object.fromEntries((feed?.categories ?? []).map((c) => [c.key, c])), [feed]);

  const filtered = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (feed?.items ?? []).filter(
      (n) => (cat === "all" || n.category === cat) &&
        words.every((w) => (n.title + " " + n.source).toLowerCase().includes(w)),
    );
  }, [feed, cat, q]);

  // 오늘의 키워드: 제목에 많이 나온 단어
  const keywords = useMemo(() => {
    const count: Record<string, number> = {};
    for (const n of feed?.items ?? []) {
      const seen = new Set<string>();
      for (const raw of n.title.split(/[\s,.'"‘’“”·…!?()[\]<>「」『』/|:~-]+/)) {
        const w = raw.replace(/(은|는|이|가|을|를|의|에|도|와|과|로|으로|에서|까지)$/, "");
        if (w.length < 2 || STOP.has(w) || /^\d+(\.\d+)?%?$/.test(w) || seen.has(w)) continue;
        seen.add(w);
        count[w] = (count[w] ?? 0) + 1;
      }
    }
    return Object.entries(count).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [feed]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of feed?.items ?? []) c[n.category] = (c[n.category] ?? 0) + 1;
    return c;
  }, [feed]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="rounded-2xl p-5 text-white bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 shadow">
        <h2 className="text-xl md:text-2xl font-black tracking-tight">📰 경제·주식 뉴스 센터</h2>
        <p className="text-sm text-blue-100 mt-1">
          국내 증시 · 경제·금리·환율 · 반도체·AI · 해외 증시 주요 뉴스를 한곳에서. 제목을 누르면 언론사 원문이 새 탭으로 열려요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-full bg-white/15">
            🕐 {feed ? `수집 ${new Date(feed.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : "불러오는 중"}
          </span>
          <span className="px-2 py-1 rounded-full bg-white/15">약 1시간마다 자동 갱신</span>
          {feed && <span className="px-2 py-1 rounded-full bg-white/15">기사 {feed.items.length}건</span>}
        </div>
      </div>

      {error && !feed && (
        <Card className="border-amber-300">
          <CardContent className="pt-5 text-sm text-amber-800">
            뉴스를 아직 불러오지 못했어요 ({error}). 다음 자동 갱신(약 1시간 이내) 뒤 다시 확인해 주세요.
          </CardContent>
        </Card>
      )}

      {feed && (
        <>
          {/* 오늘의 키워드 */}
          {keywords.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <div className="text-sm font-black mb-2">🔥 지금 많이 나오는 키워드 <span className="text-xs font-normal text-muted-foreground">(누르면 검색)</span></div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(([w, c]) => (
                    <button key={w} onClick={() => setQ(q === w ? "" : w)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${q === w ? "bg-blue-600 text-white border-blue-600" : "bg-white border-border hover:border-blue-300"}`}>
                      {w} <span className="opacity-60">{c}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 분류 + 검색 */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex flex-wrap gap-2">
              {[{ key: "all", label: "전체", emoji: "🗂️" }, ...feed.categories].map((c) => (
                <button key={c.key} onClick={() => { setCat(c.key); setLimit(40); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${cat === c.key ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-border hover:border-slate-400"}`}>
                  {c.emoji} {c.label} <span className="opacity-60">{c.key === "all" ? feed.items.length : counts[c.key] ?? 0}</span>
                </button>
              ))}
            </div>
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(40); }} placeholder="🔍 검색 (예: 삼성전자, 금리)"
              className="md:ml-auto w-full md:w-64 px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* 기사 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.slice(0, limit).map((n) => (
              <a key={n.link} href={n.link} target="_blank" rel="noopener noreferrer"
                className="group block rounded-xl border border-border/60 bg-white/80 p-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">
                    {catMap[n.category]?.emoji} {catMap[n.category]?.label}
                  </span>
                  <span className="font-bold text-slate-500">{n.source}</span>
                  <span className="ml-auto">{timeAgo(n.publishedAt)}</span>
                </div>
                <div className="font-bold text-sm leading-snug text-slate-800 group-hover:text-blue-700">{n.title}</div>
                <div className="text-[11px] text-blue-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">원문 보기 ↗</div>
              </a>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">조건에 맞는 뉴스가 없어요.</p>}
          {filtered.length > limit && (
            <div className="text-center">
              <button onClick={() => setLimit(limit + 40)} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold">
                더 보기 ({filtered.length - limit}건 남음)
              </button>
            </div>
          )}

          {/* 출처·안내 */}
          <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
            📌 출처: {feed.sources.filter((s) => s.ok).map((s) => s.name).join(" · ") || "—"}
            <br />제목과 링크만 모아 보여 주며, 기사 저작권은 각 언론사에 있습니다. 투자 판단은 원문과 공시를 확인한 뒤 본인 책임으로 하세요.
          </div>
        </>
      )}
    </div>
  );
}
