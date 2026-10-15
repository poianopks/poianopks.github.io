#!/usr/bin/env python3
"""연습장: 2026년 고점 이후 경로가 1995년(반도체 사이클)과 2000년(닷컴) 중 어디에 더 닮았나."""
import json
import time
from datetime import date, datetime, timezone
from urllib.request import Request, urlopen


def fetch(sym):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?period1=0&period2={int(time.time()) + 86400}&interval=1d"
    res = json.loads(urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode())["chart"]["result"][0]
    return [(datetime.fromtimestamp(t, timezone.utc).date(), c)
            for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]


def path_after_peak(rows, a, b):
    seg = [(d, c) for d, c in rows if a <= d]
    srch = [x for x in seg if x[0] <= b]
    pk = max(range(len(srch)), key=lambda i: srch[i][1])
    return seg[pk][0], [c / seg[pk][1] - 1 for _, c in seg[pk:]]


def corr(a, b):
    m = min(len(a), len(b)); a, b = a[:m], b[:m]
    ma, mb = sum(a) / m, sum(b) / m
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / (
        (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5)


def rmse(a, b):
    m = min(len(a), len(b))
    return (sum((x - y) ** 2 for x, y in zip(a[:m], b[:m])) / m) ** 0.5


out = ["# 2026 vs 1995 vs 2000 닷컴", ""]
sox, ks, ndx = fetch("%5ESOX"), fetch("%5EKS11"), fetch("%5ENDX")
cases = {
    "SOX 2026": path_after_peak(sox, date(2025, 6, 1), date(2026, 9, 30)),
    "SOX 1995": path_after_peak(sox, date(1995, 1, 1), date(1995, 12, 31)),
    "SOX 2000": path_after_peak(sox, date(1999, 6, 1), date(2000, 12, 31)),
    "NDX 2000": path_after_peak(ndx, date(1999, 6, 1), date(2000, 12, 31)),
    "KOSPI 2026": path_after_peak(ks, date(2025, 6, 1), date(2026, 9, 30)),
    "KOSPI 1995": path_after_peak(ks, date(1996, 12, 1), date(1997, 9, 30)),
    "KOSPI 2000": path_after_peak(ks, date(1999, 6, 1), date(2000, 12, 31)),
}
n = len(cases["SOX 2026"][1])
out.append(f"- 2026 반도체 고점 {cases['SOX 2026'][0]}, 현재 고점 후 {n - 1}거래일")
out += ["", "| 비교 | 고점일 | 고점 후 같은 날 낙폭 | 상관계수(모양) | 평균 오차(작을수록 닮음) | 이후 최대 낙폭 | 바닥까지 거래일 |",
        "|---|---|---:|---:|---:|---:|---:|"]
base = cases["SOX 2026"][1]
for k in ("SOX 2026", "SOX 1995", "SOX 2000", "NDX 2000"):
    d, p = cases[k]
    lo = min(range(len(p[:800])), key=lambda i: p[i])
    out.append(f"| {k} | {d} | {p[min(n - 1, len(p) - 1)]*100:+.1f}% | {corr(base, p):.2f} | {rmse(base, p)*100:.1f}%p | {p[lo]*100:.1f}% | {lo} |")
kb = cases["KOSPI 2026"][1]
nk = len(kb)
out += ["", f"- 코스피 2026 고점 {cases['KOSPI 2026'][0]}, 고점 후 {nk - 1}거래일", "",
        "| 코스피 비교 | 고점일 | 같은 날 낙폭 | 상관계수 | 평균 오차 | 이후 최대 낙폭 |", "|---|---|---:|---:|---:|---:|"]
for k in ("KOSPI 2026", "KOSPI 2000"):
    d, p = cases[k]
    out.append(f"| {k} | {d} | {p[min(nk - 1, len(p) - 1)]*100:+.1f}% | {corr(kb, p):.2f} | {rmse(kb, p)*100:.1f}%p | {min(p[:800])*100:.1f}% |")
out += ["", "## 고점 후 거래일별 (반도체지수)", "", "| 일 | 2026 | 1995 | 2000 SOX | 2000 NDX |", "|---:|---:|---:|---:|---:|"]
for k in (10, 20, 40, 60, n - 1, 120, 200, 300):
    row = [f"{cases[c][1][k]*100:+.1f}%" if k < len(cases[c][1]) else "-" for c in ("SOX 2026", "SOX 1995", "SOX 2000", "NDX 2000")]
    out.append(f"| {k} | " + " | ".join(row) + " |")
text = "\n".join(out)
print(text)
open("practice/semi95/vs_dotcom.md", "w", encoding="utf-8").write(text + "\n")
