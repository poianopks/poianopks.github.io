#!/usr/bin/env python3
"""연습장: 미국 10년물 금리 '수준'과 '방향'에 따른 반도체지수(^SOX) 이후 1년 수익률."""
import json
import time
from bisect import bisect_left
from datetime import datetime, timezone
from urllib.request import Request, urlopen


def fetch(sym):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?period1=0&period2={int(time.time()) + 86400}&interval=1d"
    res = json.loads(urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode())["chart"]["result"][0]
    return [(datetime.fromtimestamp(t, timezone.utc).date(), c)
            for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]


sox, tnx = fetch("%5ESOX"), fetch("%5ETNX")
td = [d for d, _ in tnx]; tv = [c for _, c in tnx]


def rate_on(d):
    i = bisect_left(td, d)
    return tv[min(i, len(tv) - 1)]


rows = []
for i in range(0, len(sox) - 252, 5):  # 주 1회 샘플
    d, c = sox[i]
    r = rate_on(d)
    j = bisect_left(td, d)
    if j < 126:
        continue
    chg6m = tv[j] - tv[j - 126]
    peak_since = max(tv[max(0, j - 126):j + 1])
    rows.append((d, r, chg6m, tv[j] - peak_since, sox[i + 252][1] / c - 1))


def summary(label, sel):
    r = sorted(x[4] for x in sel)
    if not r:
        return f"| {label} | 0 | - | - | - |"
    return f"| {label} | {len(r)} | {sum(r)/len(r)*100:+.1f}% | {r[len(r)//2]*100:+.1f}% | {sum(x > 0 for x in r)/len(r)*100:.0f}% |"


out = [f"# 금리와 반도체지수 (SOX {sox[0][0]}~{sox[-1][0]})", "",
       f"- 현재 10년물 {tv[-1]:.2f}% ({td[-1]}), 6개월 전 대비 {tv[-1]-tv[-127]:+.2f}%p, 6개월 고점 대비 {tv[-1]-max(tv[-127:]):+.2f}%p", "",
       "## A. 금리 '수준'별 이후 1년 반도체지수 수익률", "", "| 10년물 수준 | 표본(주) | 평균 | 중앙값 | 상승 확률 |", "|---|---:|---:|---:|---:|"]
for lo, hi in ((0, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 9)):
    out.append(summary(f"{lo}~{hi}%", [x for x in rows if lo <= x[1] < hi]))
out += ["", "## B. 금리 '방향'별 (최근 6개월 변화)", "", "| 금리 방향 | 표본(주) | 평균 | 중앙값 | 상승 확률 |", "|---|---:|---:|---:|---:|"]
out.append(summary("크게 상승 (+0.75%p 이상)", [x for x in rows if x[2] >= 0.75]))
out.append(summary("상승 (+0.25~0.75)", [x for x in rows if 0.25 <= x[2] < 0.75]))
out.append(summary("보합 (±0.25)", [x for x in rows if -0.25 < x[2] < 0.25]))
out.append(summary("하락 (-0.25~-0.75)", [x for x in rows if -0.75 < x[2] <= -0.25]))
out.append(summary("크게 하락 (-0.75%p 이하)", [x for x in rows if x[2] <= -0.75]))
out += ["", "## C. '높은 금리에서 꺾이기 시작' (5% 이상 & 6개월 고점 대비 -0.2~-0.5%p)", "", "| 조건 | 표본(주) | 평균 | 중앙값 | 상승 확률 |", "|---|---:|---:|---:|---:|"]
out.append(summary("금리 4.5% 이상 & 고점서 꺾임", [x for x in rows if x[1] >= 4.5 and -0.5 <= x[3] <= -0.2]))
out.append(summary("금리 4.5% 이상 & 아직 고점 근처", [x for x in rows if x[1] >= 4.5 and x[3] > -0.1]))
out.append(summary("전체 평균", rows))
text = "\n".join(out)
print(text)
open("practice/semi95/rates.md", "w", encoding="utf-8").write(text + "\n")
