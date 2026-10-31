"""나스닥·미국 반도체 하락 다음 날 코스피·삼성전자·SK하이닉스가 얼마나 빠졌는지 계산합니다.

결과는 Actions 요약 화면과 첨부파일(out/)로만 남기고 저장소에는 쓰지 않습니다.
"""
import json
import os
from datetime import timedelta

import pandas as pd
import yfinance as yf

US = {"나스닥": "^IXIC", "반도체(SOX)": "^SOX"}
KR = {"코스피": "^KS11", "삼성전자": "005930.KS", "SK하이닉스": "000660.KS"}
OUT = "out"
os.makedirs(OUT, exist_ok=True)


def load(sym):
    df = yf.download(sym, period="2y", interval="1d", auto_adjust=True, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df[["Open", "Close"]].dropna()
    df.index = pd.to_datetime(df.index).tz_localize(None).normalize()
    return df


us = {k: load(v) for k, v in US.items()}
kr = {k: load(v) for k, v in KR.items()}

nq = us["나스닥"]["Close"].pct_change() * 100
sox = us["반도체(SOX)"]["Close"].pct_change() * 100
kr_dates = kr["코스피"].index

rows = []
for d in nq.index[1:]:
    # 미국 d일 마감은 한국 d+1일 새벽 → d보다 뒤의 첫 한국 거래일에 반영
    nxt = kr_dates[kr_dates > d]
    if len(nxt) == 0:
        continue
    k = nxt[0]
    row = {"미국일": d.date().isoformat(), "한국일": k.date().isoformat(),
           "나스닥": nq.get(d), "SOX": sox.get(d)}
    for name, df in kr.items():
        prev = df.index[df.index < k]
        if k not in df.index or len(prev) == 0:
            continue
        pc = df.loc[prev[-1], "Close"]
        row[f"{name}_시초"] = (df.loc[k, "Open"] / pc - 1) * 100
        row[f"{name}_종가"] = (df.loc[k, "Close"] / pc - 1) * 100
    rows.append(row)

data = pd.DataFrame(rows).dropna(subset=["나스닥"])
data["미국일"] = pd.to_datetime(data["미국일"])
data.round(2).to_csv(f"{OUT}/nq_kospi_daily.csv", index=False, encoding="utf-8-sig")

last = data["미국일"].max()
periods = {"1년": last - timedelta(days=365), "6개월": last - timedelta(days=182)}
buckets = {
    "나스닥 -1~-2%": lambda x: (x["나스닥"] <= -1) & (x["나스닥"] > -2),
    "나스닥 -2% 이하": lambda x: x["나스닥"] <= -2,
    "SOX -3~-5%": lambda x: (x["SOX"] <= -3) & (x["SOX"] > -5),
    "SOX -5% 이하": lambda x: x["SOX"] <= -5,
}

lines = ["# 나스닥·반도체 하락 → 다음 날 한국 반응", "",
         f"기준: 미국 마지막 거래일 {last.date()} · 출처 Yahoo Finance", ""]
summary = {}
for pname, start in periods.items():
    s = data[data["미국일"] > start]
    lines += [f"## {pname} ({len(s)}거래일)", "",
              "| 조건 | 횟수 | 미국평균 | 코스피 종가 | 배율 | 삼성 종가 | 배율 | 하이닉스 종가 | 배율 | 코스피 -3%↓ | 코스피 -5%↓ |",
              "|---|---|---|---|---|---|---|---|---|---|---|"]
    for bname, f in buckets.items():
        x = s[f(s)]
        if x.empty:
            continue
        base = "SOX" if bname.startswith("SOX") else "나스닥"
        ua = x[base].mean()
        cells = [bname, str(len(x)), f"{ua:.2f}%"]
        for name in KR:
            c = x[f"{name}_종가"].mean()
            cells += [f"{c:.2f}%", f"{c / ua:.2f}배"]
        cells += [f"{(x['코스피_종가'] <= -3).mean() * 100:.0f}%",
                  f"{(x['코스피_종가'] <= -5).mean() * 100:.0f}%"]
        lines.append("| " + " | ".join(cells) + " |")
        summary[f"{pname}/{bname}"] = {
            "n": len(x), "us_avg": round(ua, 2),
            **{f"{n}_close": round(x[f"{n}_종가"].mean(), 2) for n in KR},
            **{f"{n}_gap": round(x[f"{n}_시초"].mean(), 2) for n in KR},
        }
    # 하락일 전체에 대한 민감도(회귀 기울기): 나스닥 1% 빠질 때 몇 % 빠지나
    down = s[s["나스닥"] < 0]
    betas = []
    for name in KR:
        y = down[f"{name}_종가"].dropna()
        xx = down.loc[y.index, "나스닥"]
        betas.append(f"{name} {(xx.cov(y) / xx.var()):.2f}배")
    lines += ["", f"나스닥 하락일({len(down)}일) 민감도: " + " · ".join(betas), ""]

big = data[data["SOX"] <= -5].sort_values("미국일", ascending=False)
lines += ["## 반도체(SOX) -5% 이상 급락한 날 전체", "",
          "| 미국일 | 나스닥 | SOX | 코스피 시초 | 코스피 종가 | 삼성 종가 | 하이닉스 종가 |",
          "|---|---|---|---|---|---|---|"]
for _, r in big.iterrows():
    lines.append(f"| {r['미국일'].date()} | {r['나스닥']:.2f}% | {r['SOX']:.2f}% | "
                 f"{r.get('코스피_시초', float('nan')):.2f}% | {r.get('코스피_종가', float('nan')):.2f}% | "
                 f"{r.get('삼성전자_종가', float('nan')):.2f}% | {r.get('SK하이닉스_종가', float('nan')):.2f}% |")

latest_us = pd.DataFrame({"나스닥": nq, "SOX": sox}).dropna().iloc[-1]
lines += ["", f"참고: 최신 미국 거래일 {nq.index[-1].date()} 나스닥 {latest_us['나스닥']:.2f}% · SOX {latest_us['SOX']:.2f}% (아직 한국 반영 전)"]

text = "\n".join(lines)
print(text)
with open(f"{OUT}/nq_kospi.md", "w", encoding="utf-8") as fp:
    fp.write(text)
with open(f"{OUT}/nq_kospi.json", "w", encoding="utf-8") as fp:
    json.dump(summary, fp, ensure_ascii=False, indent=2)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fp:
        fp.write(text + "\n")
