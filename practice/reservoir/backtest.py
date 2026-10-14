#!/usr/bin/env python3
"""연습장: '저수지 투자법'(전고점 대비 -30/-45/-55% 분할 투입)을 코스피 과거 데이터로 검증.

- 데이터: Yahoo ^KS11 일별 종가(1996-07~), 가격지수라 배당(연 1~2%)은 빠져 있음
- 현금 이자: 연 2.5% 가정
"""
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

CASH_RATE = 0.025


def fetch():
    url = ("https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11"
           f"?period1=0&period2={int(time.time()) + 86400}&interval=1d")
    req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    res = json.loads(urlopen(req, timeout=30).read().decode())["chart"]["result"][0]
    kst = timezone(timedelta(hours=9))
    return [(datetime.fromtimestamp(t, kst).date(), c)
            for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c]


rows = fetch()
D = [r[0] for r in rows]; C = [r[1] for r in rows]; N = len(C)
peak = []; m = 0
for c in C:
    m = max(m, c); peak.append(m)
dd = [C[i] / peak[i] - 1 for i in range(N)]
out = [f"# 저수지 투자법 백테스트 (코스피 {D[0]} ~ {D[-1]}, {N}거래일)", "",
       f"- 현재 종가 {C[-1]:,.2f} / 전고점 {peak[-1]:,.2f} → **{dd[-1]*100:.1f}%**", ""]

# 1) 폭락 구간 목록 (전고점 대비 -20% 이상)
out += ["## 1. 전고점 대비 20% 이상 빠진 구간", "",
        "| 고점일 | 고점 | 저점일 | 최대낙폭 | 고점 회복일 | 회복까지 | -30% 도달 | -45% 도달 | -55% 도달 |",
        "|---|---:|---|---:|---|---:|:---:|:---:|:---:|"]
i = 0
while i < N:
    if dd[i] < 0:
        s = i - 1
        j = i
        while j < N and dd[j] < 0:
            j += 1
        seg = range(i, j)
        lo = min(seg, key=lambda k: dd[k])
        if dd[lo] <= -0.20:
            rec = D[j] if j < N else "미회복"
            dur = f"{(D[j] - D[s]).days / 365:.1f}년" if j < N else f"{(D[-1] - D[s]).days / 365:.1f}년+"
            out.append(f"| {D[s]} | {C[s]:,.0f} | {D[lo]} | {dd[lo]*100:.1f}% | {rec} | {dur} | "
                       f"{'O' if dd[lo] <= -0.30 else '-'} | {'O' if dd[lo] <= -0.45 else '-'} | {'O' if dd[lo] <= -0.55 else '-'} |")
        i = j
    else:
        i += 1
out.append("")

# 2) 전고점 대비 -30% 이하인 날 샀다면 이후 성과
def fwd(i, days):
    return C[i + days] / C[i] - 1 if i + days < N else None

out += ["## 2. 전고점 대비 -30% 이하인 날 매수했을 때 이후 수익률 분포", ""]
idx = [i for i in range(N) if dd[i] <= -0.30]
for h, name in ((250, "1년"), (500, "2년"), (750, "3년")):
    r = sorted(x for x in (fwd(i, h) for i in idx) if x is not None)
    if r:
        pos = sum(x > 0 for x in r) / len(r)
        out.append(f"- {name} 뒤: 표본 {len(r)}일, 플러스 확률 {pos*100:.0f}%, 중앙값 {r[len(r)//2]*100:+.1f}%, "
                   f"최악 {r[0]*100:+.1f}%, 최고 {r[-1]*100:+.1f}%")
furth = []
for i in idx:
    j = min(N, i + 750)
    furth.append(min(C[i:j]) / C[i] - 1)
furth.sort()
out.append(f"- 매수 후 3년 안에 추가로 더 빠진 폭: 중앙값 {furth[len(furth)//2]*100:.1f}%, 최악 {furth[0]*100:.1f}%")
out.append("")


# 3) 전략 비교 시뮬레이션: 주식 4,300만 + 여유자금 1억, 3년 운용
def simulate(start, strategy, years=3):
    end = min(N - 1, start + 250 * years)
    units = 43_000_000 / C[start]
    cash = 100_000_000.0
    used = {"t30": False, "t45": False, "t55": False}
    last = C[start]
    dca_left = 24
    worst = None
    daily_rate = (1 + CASH_RATE) ** (1 / 250) - 1
    for k in range(start, end + 1):
        cash *= 1 + daily_rate
        p = C[k]
        if strategy == "lump" and k == start:
            units += cash / p; cash = 0
        elif strategy == "reservoir":
            for key, lvl, part in (("t30", -0.30, 1 / 3), ("t45", -0.45, 1 / 2), ("t55", -0.55, 1.0)):
                if not used[key] and dd[k] <= lvl:
                    amt = cash * part
                    units += amt / p; cash -= amt; used[key] = True
        elif strategy == "dca" and (k - start) % 21 == 0 and dca_left > 0:
            amt = cash / dca_left
            units += amt / p; cash -= amt; dca_left -= 1
        elif strategy == "grid":
            # 직전 거래가 대비 -5%마다 1,000만 매수, +7%마다 보유분 5% 매도
            if p <= last * 0.95 and cash >= 10_000_000:
                units += 10_000_000 / p; cash -= 10_000_000; last = p
            elif p >= last * 1.07:
                sell = units * 0.05
                units -= sell; cash += sell * p; last = p
        val = units * p + cash
        worst = val if worst is None else min(worst, val)
    return units * C[end] + cash, worst, units * C[end] / (units * C[end] + cash)


names = [("hold", "현금 그대로 보유(아무것도 안 함)"), ("lump", "1억 한 번에 전부 매수"),
         ("dca", "1억을 24개월 적립식 분할"), ("reservoir", "저수지법 (-30/-45/-55%에 1/3씩)"),
         ("grid", "사용자 방식: -5%마다 1천만 매수 / +7%마다 5% 매도")]
out += ["## 3. 전략 비교: 주식 4,300만 + 여유자금 1억으로 시작, 3년 뒤 결과", "",
        "시작 조건: 과거에 '전고점 대비 -25%~-40%'였던 달의 첫 거래일 (지금과 비슷한 상황)", ""]
starts = []
for k in range(N - 750):
    if (k == 0 or D[k].month != D[k - 1].month) and -0.40 <= dd[k] <= -0.25:
        starts.append(k)
out.append(f"- 시작 시점 표본: {len(starts)}개월 ({D[starts[0]]} ~ {D[starts[-1]]})")
out.append("")
out.append("| 전략 | 3년 뒤 평균 | 3년 뒤 중앙값 | 3년 뒤 최악 | 운용 중 최저 평가액(평균) | 손실(1.43억 미만) 확률 |")
out.append("|---|---:|---:|---:|---:|---:|")
for key, label in names:
    fin = []; wst = []
    for s in starts:
        f, w, _ = simulate(s, key)
        fin.append(f); wst.append(w)
    fs = sorted(fin)
    out.append(f"| {label} | {sum(fin)/len(fin)/1e8:.2f}억 | {fs[len(fs)//2]/1e8:.2f}억 | {fs[0]/1e8:.2f}억 | "
               f"{sum(wst)/len(wst)/1e8:.2f}억 | {sum(x < 1.43e8 for x in fin)/len(fin)*100:.0f}% |")
out.append("")

# 시작 연도별 상세
out += ["### 시작 시점별 3년 뒤 결과 (억 원)", "",
        "| 시작일 | 당시 낙폭 | 현금보유 | 일시매수 | 적립식 | 저수지법 | 사용자방식 |", "|---|---:|---:|---:|---:|---:|---:|"]
prev_year = None
for s in starts:
    if D[s].year == prev_year:
        continue
    prev_year = D[s].year
    vals = [simulate(s, k)[0] / 1e8 for k, _ in names]
    out.append(f"| {D[s]} | {dd[s]*100:.0f}% | " + " | ".join(f"{v:.2f}" for v in vals) + " |")

text = "\n".join(out)
print(text)
open("practice/reservoir/result.md", "w", encoding="utf-8").write(text + "\n")
