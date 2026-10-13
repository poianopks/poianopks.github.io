#!/usr/bin/env python3
"""연습장: 코스피 상승추세 → 하락추세 전환 여부 점검 지표."""
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen


def fetch(sym, start="2015-01-01"):
    p1 = int(datetime.fromisoformat(start).replace(tzinfo=timezone.utc).timestamp())
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}"
           f"?period1={p1}&period2={int(time.time()) + 86400}&interval=1d")
    req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    res = json.loads(urlopen(req, timeout=30).read().decode())["chart"]["result"][0]
    q = res["indicators"]["quote"][0]
    kst = timezone(timedelta(hours=9))
    rows = []
    for t, c, h, l in zip(res["timestamp"], q["close"], q["high"], q["low"]):
        if c is not None:
            rows.append((datetime.fromtimestamp(t, kst).date(), c, h or c, l or c))
    return rows


def sma(v, n, i):
    return sum(v[i - n + 1:i + 1]) / n if i >= n - 1 else None


def rsi(v, n=14):
    g = l = 0.0
    for i in range(1, n + 1):
        d = v[i] - v[i - 1]
        g += max(d, 0); l += max(-d, 0)
    g /= n; l /= n
    for i in range(n + 1, len(v)):
        d = v[i] - v[i - 1]
        g = (g * (n - 1) + max(d, 0)) / n
        l = (l * (n - 1) + max(-d, 0)) / n
    return 100 - 100 / (1 + g / l) if l else 100


rows = fetch("%5EKS11")
d = [r[0] for r in rows]; c = [r[1] for r in rows]
i = len(c) - 1
out = [f"# 코스피 추세 점검 (기준일 {d[i]}, 종가 {c[i]:,.2f})", ""]
out.append("## 최근 8거래일")
for k in range(i - 7, i + 1):
    out.append(f"- {d[k]}: {c[k]:,.2f} ({(c[k] / c[k - 1] - 1) * 100:+.2f}%)")
out.append("")

out.append("## 이동평균 대비 위치")
out.append("| 이동평균 | 값 | 종가 대비 | 기울기(20일 전 대비) |")
out.append("|---|---:|---:|---:|")
for n in (5, 20, 60, 120, 200):
    m = sma(c, n, i); m20 = sma(c, n, i - 20)
    out.append(f"| MA{n} | {m:,.0f} | {(c[i] / m - 1) * 100:+.2f}% | {(m / m20 - 1) * 100:+.2f}% |")
out.append("")

peak_i = max(range(i - 250, i + 1), key=lambda k: c[k])
out.append(f"- 52주 최고 종가: {c[peak_i]:,.2f} ({d[peak_i]}) → 현재 낙폭 {(c[i] / c[peak_i] - 1) * 100:.2f}%")
low60 = min(range(i - 60, i + 1), key=lambda k: c[k])
out.append(f"- 최근 60거래일 최저 종가: {c[low60]:,.2f} ({d[low60]})")
out.append(f"- RSI(14): {rsi(c[-300:]):.1f}")
out.append(f"- 20일 수익률: {(c[i] / c[i - 20] - 1) * 100:+.2f}% / 60일: {(c[i] / c[i - 60] - 1) * 100:+.2f}% / 250일: {(c[i] / c[i - 250] - 1) * 100:+.2f}%")
out.append("")

# 과거 고점·저점 흐름(월말 종가)
out.append("## 최근 12개월 월말 종가")
seen = {}
for k in range(i - 260, i + 1):
    seen[(d[k].year, d[k].month)] = (d[k], c[k])
for (_, _), (dd, cc) in sorted(seen.items())[-13:]:
    out.append(f"- {dd}: {cc:,.0f}")
out.append("")

# 유사 사례: MA200 위(상승추세)에서 5일 이상 연속 하락 직후, 이후 20/60일 성과
out.append("## 유사 사례: 200일선 위 상승추세 중 5일+ 연속 하락이 처음 확정된 날 이후 성과 (2015~)")
out.append("| 확정일 | 5일 낙폭 | 확정일 종가/MA200 | +5일 | +20일 | +60일 | 60일 내 추가 최대낙폭 |")
out.append("|---|---:|---:|---:|---:|---:|---:|")
run = 0
for k in range(1, i + 1):
    run = run + 1 if c[k] < c[k - 1] else 0
    if run == 5 and k >= 200:
        m = sma(c, 200, k)
        if c[k] > m:
            f = lambda h: f"{(c[k + h] / c[k] - 1) * 100:+.1f}%" if k + h <= i else "-"
            dd = min(c[k:min(k + 61, i + 1)]) / c[k] - 1
            out.append(f"| {d[k]} | {(c[k] / c[k - 5] - 1) * 100:+.1f}% | {(c[k] / m - 1) * 100:+.1f}% | {f(5)} | {f(20)} | {f(60)} | {dd * 100:.1f}% |")
out.append("")

# 비교: 나스닥100 선물 오늘
try:
    nq = fetch("NQ%3DF", "2026-09-01")
    out.append(f"- 나스닥100 선물 최근: {nq[-1][0]} {nq[-1][1]:,.2f} (전일 {nq[-2][1]:,.2f}, {(nq[-1][1] / nq[-2][1] - 1) * 100:+.2f}%)")
except Exception as e:  # noqa: BLE001
    out.append(f"- 나스닥 선물 오류: {e}")

text = "\n".join(out)
print(text)
open("practice/kospi_streak/trend.md", "w", encoding="utf-8").write(text + "\n")
