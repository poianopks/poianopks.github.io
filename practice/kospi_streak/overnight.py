#!/usr/bin/env python3
"""연습장: 간밤 미국 증시 마감과 코스피 관련 지표 스냅샷."""
import json
from datetime import datetime, timezone
from urllib.parse import quote
from urllib.request import Request, urlopen

SYMBOLS = [
    ("^IXIC", "나스닥 종합"), ("^NDX", "나스닥100"), ("^GSPC", "S&P500"), ("^DJI", "다우"),
    ("^SOX", "필라델피아 반도체"), ("^VIX", "VIX"), ("NQ=F", "나스닥100 선물"), ("ES=F", "S&P500 선물"),
    ("EWY", "EWY(한국 ETF)"), ("KRW=X", "원/달러"), ("^TNX", "미 10년물 금리"), ("CL=F", "WTI 유가"),
    ("NVDA", "엔비디아"), ("MU", "마이크론"), ("TSM", "TSMC"), ("AVGO", "브로드컴"), ("SKHY", "SK하이닉스 ADR"),
    ("^KS11", "코스피"),
]


def last_two(sym):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(sym)}?range=5d&interval=1d"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    with urlopen(req, timeout=20) as r:
        res = json.loads(r.read().decode())["chart"]["result"][0]
    meta = res["meta"]
    closes = [(t, c) for t, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c is not None]
    price = meta.get("regularMarketPrice") or closes[-1][1]
    t = meta.get("regularMarketTime") or closes[-1][0]
    # 마지막 봉 직전 종가를 전일 종가로 사용
    prev = closes[-2][1] if len(closes) >= 2 else meta.get("chartPreviousClose")
    return price, prev, datetime.fromtimestamp(t, timezone.utc)


lines = [f"# 간밤 스냅샷 (생성 {datetime.now(timezone.utc):%Y-%m-%d %H:%MZ})", "",
         "| 지표 | 현재/종가 | 전일 | 등락률 | 시각(UTC) |", "|---|---:|---:|---:|---|"]
for sym, name in SYMBOLS:
    try:
        p, prev, t = last_two(sym)
        lines.append(f"| {name} ({sym}) | {p:,.2f} | {prev:,.2f} | {(p / prev - 1) * 100:+.2f}% | {t:%m-%d %H:%M} |")
    except Exception as e:  # noqa: BLE001
        lines.append(f"| {name} ({sym}) | 오류 | | | {e} |")
text = "\n".join(lines)
print(text)
open("practice/kospi_streak/overnight.md", "w", encoding="utf-8").write(text + "\n")
