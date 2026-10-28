#!/usr/bin/env python3
"""연습장: 코스피가 하루 +5% 이상 급등한 다음 날·5일·20일 뒤 흐름 (1997~)."""
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

url = f"https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?period1=0&period2={int(time.time()) + 86400}&interval=1d"
res = json.loads(urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode())["chart"]["result"][0]
kst = timezone(timedelta(hours=9))
rows = [(datetime.fromtimestamp(t, kst).date(), c) for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]
d = [r[0] for r in rows]; c = [r[1] for r in rows]
peak = []; m = 0
for x in c:
    m = max(m, x); peak.append(m)
out = [f"# 코스피 하루 +5% 이상 급등 뒤 흐름 ({d[0]}~{d[-1]})", "", f"- 마지막: {d[-1]} {c[-1]:,.2f} ({(c[-1]/c[-2]-1)*100:+.2f}%)", ""]
ev = [i for i in range(1, len(c)) if c[i] / c[i - 1] - 1 >= 0.05]
def stat(h, sel):
    r = sorted(c[i + h] / c[i] - 1 for i in sel if i + h < len(c))
    if not r:
        return "표본 없음"
    return f"표본 {len(r)}, 오른 확률 {sum(x > 0 for x in r)/len(r)*100:.0f}%, 중앙값 {r[len(r)//2]*100:+.1f}%, 최악 {r[0]*100:+.1f}%, 최고 {r[-1]*100:+.1f}%"
out.append(f"## 전체 급등일 {len(ev)}번")
for h, lab in ((1, "다음 날"), (5, "5거래일 뒤"), (20, "20거래일 뒤")):
    out.append(f"- {lab}: {stat(h, ev)}")
dn = [i for i in ev if c[i] / peak[i] - 1 <= -0.25]
out += ["", f"## 그중 '고점 대비 -25% 이하 하락장 속 급등' {len(dn)}번 (지금과 비슷)"]
for h, lab in ((1, "다음 날"), (5, "5거래일 뒤"), (20, "20거래일 뒤")):
    out.append(f"- {lab}: {stat(h, dn)}")
out += ["", "## 최근 급등일 목록 (최근 15개)", "| 날짜 | 등락 | 고점 대비 | 다음 날 | 5일 뒤 | 20일 뒤 |", "|---|---:|---:|---:|---:|---:|"]
f = lambda i, h: f"{(c[i+h]/c[i]-1)*100:+.1f}%" if i + h < len(c) else "-"
for i in ev[-15:]:
    out.append(f"| {d[i]} | {(c[i]/c[i-1]-1)*100:+.1f}% | {(c[i]/peak[i]-1)*100:.0f}% | {f(i,1)} | {f(i,5)} | {f(i,20)} |")
text = "\n".join(out)
print(text)
open("practice/kospi_streak/after_jump.md", "w", encoding="utf-8").write(text + "\n")
