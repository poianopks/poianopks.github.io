#!/usr/bin/env python3
"""연습장: 삼성전자·SK하이닉스 PBR/BPS 조회 + 과거 대폭락기 연속 하락 일수."""
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

UA = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
out = ["# PBR 사고실험 + 대폭락기 연속 하락", ""]


def get(url):
    return json.loads(urlopen(Request(url, headers=UA), timeout=20).read().decode("utf-8", "replace"))


out.append("## 1. 네이버 금융 종목 지표")
for code, name in (("005930", "삼성전자"), ("000660", "SK하이닉스")):
    try:
        d = get(f"https://m.stock.naver.com/api/stock/{code}/integration")
        infos = {i.get("code") or i.get("key"): i.get("value") for i in d.get("totalInfos", [])}
        out.append(f"- {name}: " + ", ".join(f"{k}={v}" for k, v in infos.items()))
    except Exception as e:  # noqa: BLE001
        out.append(f"- {name} integration 오류: {e}")
    try:
        b = get(f"https://m.stock.naver.com/api/stock/{code}/basic")
        out.append(f"  - 현재가 {b.get('closePrice')} ({b.get('fluctuationsRatio')}%) {b.get('localTradedAt')}")
    except Exception as e:  # noqa: BLE001
        out.append(f"  - basic 오류: {e}")
    try:
        f = get(f"https://m.stock.naver.com/api/stock/{code}/finance/annual")
        rows = f.get("financeInfo", {}).get("rowList", [])
        for r in rows:
            if r.get("title") in ("BPS", "PBR", "ROE", "EPS", "PER", "당기순이익", "영업이익", "자본총계", "자본총계(지배)"):
                cols = r.get("columns", {})
                out.append(f"  - {r['title']}: " + ", ".join(f"{k}:{v.get('value')}" for k, v in cols.items()))
        heads = f.get("financeInfo", {}).get("trTitleList", [])
        out.append("  - 기간: " + ", ".join(f"{h.get('key')}={h.get('title')}{'(E)' if h.get('isConsensus')=='Y' else ''}" for h in heads))
    except Exception as e:  # noqa: BLE001
        out.append(f"  - finance 오류: {e}")
try:
    k = get("https://m.stock.naver.com/api/index/KOSPI/basic")
    out.append(f"- KOSPI 현재 {k.get('closePrice')} ({k.get('fluctuationsRatio')}%) {k.get('localTradedAt')}")
except Exception as e:  # noqa: BLE001
    out.append(f"- KOSPI 오류: {e}")
out.append("")

# 2. 대폭락기 연속 하락
url = f"https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?period1=0&period2={int(time.time()) + 86400}&interval=1d"
res = get(url)["chart"]["result"][0]
kst = timezone(timedelta(hours=9))
rows = [(datetime.fromtimestamp(t, kst).date(), c) for t, c in
        zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]
streaks = []
i = 1
while i < len(rows):
    if rows[i][1] < rows[i - 1][1]:
        j = i
        while j + 1 < len(rows) and rows[j + 1][1] < rows[j][1]:
            j += 1
        streaks.append((rows[i][0], rows[j][0], j - i + 1, rows[j][1] / rows[i - 1][1] - 1))
        i = j + 1
    else:
        i += 1
out += [f"## 2. 전체 기간 ({rows[0][0]}~{rows[-1][0]}) 7일 이상 연속 하락", ""]
for s in streaks:
    if s[2] >= 7:
        out.append(f"- {s[0]} ~ {s[1]}: {s[2]}일, {s[3]*100:.1f}%")
out.append("")
EVENTS = [("IMF 외환위기", "1997-07-01", "1998-06-30"), ("IT버블·9.11", "2000-01-01", "2001-10-31"),
          ("카드대란·이라크전", "2002-04-01", "2003-03-31"), ("리먼 금융위기", "2007-11-01", "2009-03-31"),
          ("미국 신용강등", "2011-07-15", "2011-10-31"), ("미중 무역분쟁", "2018-01-29", "2019-08-31"),
          ("코로나", "2020-01-20", "2020-03-31"), ("금리인상기", "2021-07-01", "2022-10-31"),
          ("이번 하락", "2026-06-22", "2026-12-31")]
out += ["## 3. 대폭락기별 최장 연속 하락", "", "| 사건 | 기간 | 최장 연속 하락 | 그 구간 | 구간 최대 낙폭 |", "|---|---|---:|---|---:|"]
for name, a, b in EVENTS:
    a = datetime.fromisoformat(a).date(); b = datetime.fromisoformat(b).date()
    ss = [s for s in streaks if a <= s[0] <= b]
    seg = [c for d, c in rows if a <= d <= b]
    if not ss:
        continue
    best = max(ss, key=lambda s: (s[2], -s[3]))
    peak = seg[0]; mdd = 0
    for c in seg:
        peak = max(peak, c); mdd = min(mdd, c / peak - 1)
    out.append(f"| {name} | {a}~{b} | {best[2]}일 | {best[0]}~{best[1]} ({best[3]*100:.1f}%) | {mdd*100:.1f}% |")
text = "\n".join(out)
print(text)
open("practice/pbr/result.md", "w", encoding="utf-8").write(text + "\n")
