#!/usr/bin/env python3
"""연습장: 1995년 vs 2026년 필라델피아 반도체지수(^SOX) 고점 이후 경로 비교 + 10년물 금리."""
import json
import time
from datetime import date, datetime, timezone
from urllib.request import Request, urlopen


def fetch(sym, start):
    p1 = int(datetime.fromisoformat(start).replace(tzinfo=timezone.utc).timestamp())
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?period1={p1}&period2={int(time.time()) + 86400}&interval=1d"
    res = json.loads(urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode())["chart"]["result"][0]
    return [(datetime.fromtimestamp(t, timezone.utc).date(), c)
            for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]


def window(rows, a, b):
    return [(d, c) for d, c in rows if a <= d <= b]


out = ["# 1995 vs 2026 반도체지수 비교", ""]
sox = fetch("%5ESOX", "1994-01-01")
tnx = fetch("%5ETNX", "1994-01-01")
ndx = fetch("%5ENDX", "1994-01-01")
out.append(f"- SOX 데이터 시작: {sox[0][0]}, 10년물 시작: {tnx[0][0]}")

paths = {}
for label, a, b in (("1995", date(1995, 1, 1), date(1997, 12, 31)), ("2026", date(2025, 6, 1), date(2026, 12, 31))):
    seg = window(sox, a, b)
    search = [x for x in seg if x[0] <= (date(1995, 12, 31) if label == "1995" else date(2026, 9, 30))]
    pk = max(range(len(search)), key=lambda i: search[i][1])
    pd, pc = seg[pk]
    path = [c / pc - 1 for _, c in seg[pk:]]
    paths[label] = (pd, pc, seg[pk:], path)
    trough = min(range(len(path)), key=lambda i: path[i])
    out.append(f"- {label}: 고점 {pd} {pc:,.1f}, 이후 최저 {seg[pk + trough][0]} ({path[trough]*100:.1f}%, 고점 후 {trough}거래일)")

p95, p26 = paths["1995"][3], paths["2026"][3]
n = len(p26)
out += ["", f"## 고점 후 같은 거래일 비교 (2026년은 현재 {n - 1}거래일째)", "", "| 고점 후 거래일 | 1995~96 | 2026 |", "|---:|---:|---:|"]
for k in (0, 10, 20, 30, 40, 50, 60, 70, n - 1):
    if k < n:
        out.append(f"| {k} | {p95[k]*100:+.1f}% | {p26[k]*100:+.1f}% |")
m = min(n, len(p95))
a, b = p95[:m], p26[:m]
ma, mb = sum(a) / m, sum(b) / m
cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
corr = cov / ((sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5)
out.append(f"\n- 같은 구간 상관계수: **{corr:.2f}** (1에 가까울수록 모양이 닮음)")
out += ["", "## 1995년 고점 이후 1995년 경로가 이어진다면 (참고)", "", "| 고점 후 거래일 | 1995~96 경로 | 해당 날짜(1996) |", "|---:|---:|---|"]
seg95 = paths["1995"][2]
for k in (n - 1, 100, 120, 150, 180, 200, 250, 300, 400):
    if k < len(p95):
        out.append(f"| {k} | {p95[k]*100:+.1f}% | {seg95[k][0]} |")

out += ["", "## 1996년 10년물 금리와 반도체 바닥", ""]
t96 = window(tnx, date(1995, 9, 1), date(1997, 6, 30))
tp = max(t96, key=lambda x: x[1]); tl = min(window(tnx, date(1995, 9, 1), date(1996, 3, 31)), key=lambda x: x[1])
s96 = window(sox, date(1995, 9, 1), date(1997, 12, 31))
sl = min(s96, key=lambda x: x[1])
out.append(f"- 10년물: 저점 {tl[0]} {tl[1]:.2f}% → 고점 {tp[0]} {tp[1]:.2f}%")
out.append(f"- SOX 바닥: {sl[0]} {sl[1]:,.1f}")
after = [c for d, c in sox if d >= sl[0]]
one_y = [c for d, c in sox if sl[0] <= d <= date(sl[0].year + 1, sl[0].month, min(sl[0].day, 28))]
out.append(f"- SOX 바닥 후 1년 최고: {max(one_y)/sl[1]:.2f}배")
n95 = window(ndx, date(1995, 7, 1), date(1996, 7, 31))
out.append(f"- 같은 기간 나스닥100: {n95[0][1]:,.0f} → 최고 {max(c for _, c in n95):,.0f} → 1996-07 {n95[-1][1]:,.0f}")

out += ["", "## 현재 10년물 금리", ""]
t26 = window(tnx, date(2026, 1, 1), date(2026, 12, 31))
out.append(f"- 2026년 최저 {min(c for _, c in t26):.2f}%, 최고 {max(t26, key=lambda x: x[1])[1]:.2f}% ({max(t26, key=lambda x: x[1])[0]}), 최근 {t26[-1][0]} {t26[-1][1]:.2f}%")
text = "\n".join(out)
print(text)
open("practice/semi95/result.md", "w", encoding="utf-8").write(text + "\n")
