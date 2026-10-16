#!/usr/bin/env python3
"""연습장 레슨: 코스피·나스닥100의 '최고가(ATH) 대비 낙폭'과 보유 기간별 이익 확률 + 그래프."""
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

for f in font_manager.findSystemFonts():
    if "NanumGothic" in f:
        font_manager.fontManager.addfont(f)
plt.rcParams["font.family"] = "NanumGothic"
plt.rcParams["axes.unicode_minus"] = False

INK, INK2, GRID, SURF = "#0b0b0b", "#52514e", "#e6e5e0", "#fcfcfb"
BLUE, ORANGE, RED = "#2a78d6", "#eb6834", "#d03b3b"


def fetch(sym):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?period1=0&period2={int(time.time()) + 86400}&interval=1d"
    res = json.loads(urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode())["chart"]["result"][0]
    kst = timezone(timedelta(hours=9))
    return [(datetime.fromtimestamp(t, kst).date(), c) for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]


MKTS = [("코스피", "%5EKS11", (0.30, 0.45, 0.55)), ("나스닥100", "%5ENDX", (0.20, 0.30, 0.40))]
HOLD = [("6개월", 126), ("1년", 252), ("3년", 756), ("5년", 1260), ("10년", 2520)]
out = ["# 레슨: 최고가 대비 낙폭과 보유 기간별 이익 확률", ""]
data = {}
for name, sym, th in MKTS:
    rows = fetch(sym)
    d = [r[0] for r in rows]; c = [r[1] for r in rows]
    peak, dd, m = [], [], 0
    for x in c:
        m = max(m, x); peak.append(m); dd.append(x / m - 1)
    data[name] = (d, c, dd, th)
    out += [f"## {name} ({d[0]} ~ {d[-1]})", "",
            f"- 기준 '고점' = 데이터 시작일부터 그날까지의 **최고 종가(ATH)**. 새 최고가가 나오면 기준이 바뀜",
            f"- 지금: {c[-1]:,.0f}, 최고가 {peak[-1]:,.0f} 대비 {dd[-1]*100:.1f}%", "",
            "| 보유 기간 | 아무 날이나 샀을 때 이익 확률 | 1차 기준(-{:.0f}%) 이하에서 샀을 때 이익 확률 | 그때 중앙값 | 그때 최악 |".format(th[0]*100),
            "|---|---:|---:|---:|---:|"]
    stats = []
    for lab, h in HOLD:
        allr = [c[i + h] / c[i] - 1 for i in range(len(c) - h)]
        sel = sorted(c[i + h] / c[i] - 1 for i in range(len(c) - h) if dd[i] <= -th[0])
        pa = sum(x > 0 for x in allr) / len(allr)
        ps = sum(x > 0 for x in sel) / len(sel) if sel else float("nan")
        stats.append((lab, pa, ps))
        out.append(f"| {lab} | {pa*100:.0f}% | {ps*100:.0f}% ({len(sel)}일) | {sel[len(sel)//2]*100:+.0f}% | {sel[0]*100:+.0f}% |" if sel else f"| {lab} | {pa*100:.0f}% | 표본 없음 | - | - |")
    data[name] += (stats,)
    out.append("")

# 그래프 1: 최고가 대비 낙폭 (시장별 작은 그림 2개, 같은 y축)
fig, axes = plt.subplots(2, 1, figsize=(9, 8), sharey=True, facecolor=SURF)
for ax, (name, _, th) in zip(axes, MKTS):
    d, c, dd, _, _ = data[name]
    ax.set_facecolor(SURF)
    ax.fill_between(d, [x * 100 for x in dd], 0, color=BLUE, alpha=0.18, linewidth=0)
    ax.plot(d, [x * 100 for x in dd], color=BLUE, linewidth=1.5)
    for k, t in enumerate(th):
        ax.axhline(-t * 100, color=INK2, linewidth=1, linestyle=(0, (4, 3)))
        ax.text(d[0], -t * 100 + 1.5, f"{k+1}차 매수선 -{t*100:.0f}%", color=INK2, fontsize=10)
    ax.scatter([d[-1]], [dd[-1] * 100], color=RED, s=60, zorder=5, edgecolor=SURF, linewidth=2)
    ax.annotate(f"지금 {dd[-1]*100:.0f}%", (d[-1], dd[-1] * 100), textcoords="offset points", xytext=(-70, -18), color=INK, fontsize=11, fontweight="bold")
    ax.set_title(f"{name}: 최고가보다 몇 % 아래에 있었나", loc="left", color=INK, fontsize=13, fontweight="bold")
    ax.set_ylabel("최고가 대비 (%)", color=INK2)
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.tick_params(colors=INK2)
axes[1].set_ylim(-90, 5)
fig.tight_layout()
fig.savefig("practice/lesson/drawdown.png", dpi=150)

# 그래프 2: 보유 기간별 이익 확률 (막대 2종)
fig, axes = plt.subplots(1, 2, figsize=(11, 5), sharey=True, facecolor=SURF)
for ax, (name, _, th) in zip(axes, MKTS):
    stats = data[name][4]
    x = range(len(stats)); w = 0.38
    a = [s[1] * 100 for s in stats]; b = [s[2] * 100 for s in stats]
    ba = ax.bar([i - w / 2 - 0.01 for i in x], a, w, color=BLUE, label="아무 날이나 샀을 때")
    bb = ax.bar([i + w / 2 + 0.01 for i in x], b, w, color=ORANGE, label=f"최고가 대비 -{th[0]*100:.0f}% 이하에서 샀을 때")
    for bars in (ba, bb):
        for r in bars:
            ax.text(r.get_x() + r.get_width() / 2, r.get_height() + 1, f"{r.get_height():.0f}%", ha="center", color=INK, fontsize=9)
    ax.axhline(50, color=INK2, linewidth=1, linestyle=(0, (4, 3)))
    ax.text(len(stats) - 0.5, 51.5, "동전 던지기(50%)", ha="right", color=INK2, fontsize=9)
    ax.set_xticks(list(x)); ax.set_xticklabels([s[0] for s in stats], color=INK2)
    ax.set_title(f"{name}: 얼마나 오래 들고 있으면 이익이었나", loc="left", color=INK, fontsize=12, fontweight="bold")
    ax.set_facecolor(SURF); ax.set_ylim(0, 112)
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.legend(loc="lower right", frameon=False, fontsize=9)
axes[0].set_ylabel("이익이었던 확률 (%)", color=INK2)
fig.tight_layout()
fig.savefig("practice/lesson/win_rate.png", dpi=150)

text = "\n".join(out)
print(text)
open("practice/lesson/result.md", "w", encoding="utf-8").write(text + "\n")
