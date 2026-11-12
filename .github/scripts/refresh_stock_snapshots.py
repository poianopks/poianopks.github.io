"""주식 탐색기 보관판(apps/stock-finder, apps/school-game-maker/kospi-screener) 스냅샷을
Yahoo Finance(yfinance)에서 직접 다시 만듭니다. Replit 없이 동작합니다.

- 월봉(2019-01부터)과 PER·PBR·ROE 값을 종목마다 새로 받습니다.
- 받기에 실패한 종목은 예전 값을 그대로 둡니다.
"""
import json
import math
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone

import pandas as pd
import yfinance as yf

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "apps")
TODAY = datetime.now(timezone(timedelta(hours=9))).strftime("%Y-%m-%d")

TARGETS = [
    # (스냅샷 파일, 종목코드 키, 월봉에 거래량 포함?, {스냅샷 필드: yfinance info 필드})
    ("stock-finder/stocks-snapshot.json", "t", False,
     {"fpe": "forwardPE", "tpe": "trailingPE", "pbr": "priceToBook"}),
    ("school-game-maker/kospi-screener/stocks-snapshot.json", "s", True,
     {"tpe": "trailingPE", "pec": "priceEpsCurrentYear", "roe": "returnOnEquity"}),
]


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def monthly(tickers):
    df = yf.download(tickers, start="2019-01-01", interval="1mo", auto_adjust=False,
                     group_by="ticker", progress=False, threads=True)
    out = {}
    for t in tickers:
        try:
            d = df[t] if isinstance(df.columns, pd.MultiIndex) else df
            d = d[["Open", "High", "Low", "Close", "Volume"]].dropna(subset=["Open", "Close"])
        except KeyError:
            continue
        rows = []
        for idx, r in d.iterrows():
            rows.append([idx.strftime("%Y-%m"), round(float(r.Open), 2), round(float(r.High), 2),
                         round(float(r.Low), 2), round(float(r.Close), 2), int(r.Volume or 0)])
        if len(rows) >= 12:
            out[t] = rows
    return out


info_cache = {}


def info(t):
    if t not in info_cache:
        try:
            info_cache[t] = yf.Ticker(t).info or {}
        except Exception as e:  # noqa: BLE001
            print(f"  ✗ info {t}: {e}", file=sys.stderr)
            info_cache[t] = {}
        time.sleep(0.3)
    return info_cache[t]




def stamp_hub(href):
    p = os.path.join(ROOT, "index.html")
    s = open(p, encoding="utf-8").read()
    pat = re.compile(r'(href="' + re.escape(href) + r'"><b>[^<]*</b><span class="bd"[^>]*>)20\d\d-\d\d-\d\d(?: \d\d:\d\d KST)?( 데이터)')
    n = pat.sub(lambda m: m.group(1) + TODAY + m.group(2), s)
    if n != s:
        open(p, "w", encoding="utf-8").write(n)


total_ok = 0
summary = []
for rel, key, with_vol, fields in TARGETS:
    path = os.path.join(ROOT, rel)
    snap = json.load(open(path, encoding="utf-8"))
    tickers = [s[key] for s in snap["stocks"]]
    candles = monthly(tickers)
    ok = 0
    for s in snap["stocks"]:
        t = s[key]
        got = False
        if t in candles:
            s["c"] = [r if with_vol else r[:5] for r in candles[t]]
            got = True
        inf = info(t)
        for f, src in fields.items():
            v = num(inf.get(src))
            if v is not None:
                s[f] = v
                got = True
        ok += got
    if ok:
        snap["asOf"] = TODAY
        stamp_hub(rel.rsplit("/", 1)[0] + "/")
        json.dump(snap, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    total_ok += ok
    summary.append(f"{rel}: {ok}/{len(snap['stocks'])} 종목 갱신")

print("\n".join(summary))
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fh:
        fh.write(f"## 주식 탐색기 스냅샷 갱신 {TODAY}\n\n" + "\n".join(f"- {x}" for x in summary) + "\n")
if total_ok == 0:
    sys.exit(1)
