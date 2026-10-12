#!/usr/bin/env python3
"""교차 검증: 네이버 금융 일별 KOSPI 종가로 최근 2년 5일+ 연속 하락 구간을 다시 센다."""
import re
import sys
from datetime import date, datetime
from urllib.request import Request, urlopen

sys.path.insert(0, "practice/kospi_streak")
from streak import streaks  # noqa: E402

url = "https://fchart.stock.naver.com/sise.nhn?symbol=KOSPI&timeframe=day&count=800&requestType=0"
xml = urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read().decode("euc-kr", "replace")
rows = []
for d, o, h, l, c, v in re.findall(r'data="(\d{8})\|([\d.]+)\|([\d.]+)\|([\d.]+)\|([\d.]+)\|(\d+)"', xml):
    rows.append((datetime.strptime(d, "%Y%m%d").date(), float(c)))
last = rows[-1][0]
since = last.replace(year=last.year - 2)
print(f"네이버 데이터: {rows[0][0]} ~ {last} ({len(rows)}거래일), 마지막 종가 {rows[-1][1]}")
s = [x for x in streaks(rows) if x["end"] > since]
five = [x for x in s if x["days"] >= 5]
lines = [f"# 네이버 교차 검증 (기준일 {last}, 최근 2년 = {since} 이후)", "",
         f"- 4일 이상: {len(s)}회 / 5일 이상: {len(five)}회", ""]
for x in s:
    lines.append(f"  - {x['start']} ~ {x['end']}: {x['days']}일, {x['from']} → {x['to']} ({x['pct']}%)")
lines.append("")
lines.append("## 5일+ 구간 일별 종가")
for x in five:
    for d, c in rows:
        if x["start"] <= d <= x["end"] or d == max(dd for dd, _ in rows if dd < x["start"]):
            lines.append(f"  - {d}: {c}")
    nxt = next(((d, c) for d, c in rows if d > x["end"]), None)
    lines.append(f"  - (다음날) {nxt[0]}: {nxt[1]}" if nxt else "")
text = "\n".join(lines)
print(text)
open("practice/kospi_streak/verify_naver.md", "w", encoding="utf-8").write(text + "\n")
