#!/usr/bin/env python3
"""Count KOSPI daily gap candles by year.

The analysis uses the standard opening-gap comparison with the previous close:
  gap up   = today's open > yesterday's close
  gap down = today's open < yesterday's close
  bullish  = today's close > today's open (red candle in the app)
  bearish  = today's close < today's open (blue candle in the app)
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from urllib.parse import quote
from urllib.request import Request, urlopen


SYMBOL = "^KS11"
YEARS = (2024, 2025, 2026)
START = int(datetime(2023, 12, 1, tzinfo=timezone.utc).timestamp())


def empty_bucket() -> dict:
    return {
        "bullish": 0,
        "bearish": 0,
        "doji": 0,
        "total": 0,
        "bullishDates": [],
        "bearishDates": [],
        "dojiDates": [],
    }


def fetch_daily_candles() -> list[dict[str, float | int | str]]:
    end = int(time.time()) + 86400
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(SYMBOL)}"
        f"?period1={START}&period2={end}&interval=1d"
        "&includePrePost=false&events=history"
    )
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (KOSPI Investment Analysis)",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))

    result = payload["chart"]["result"][0]
    timestamps = result.get("timestamp") or []
    quote_data = result["indicators"]["quote"][0]
    rows = []
    for index, timestamp in enumerate(timestamps):
        values = {
            "open": quote_data["open"][index],
            "high": quote_data["high"][index],
            "low": quote_data["low"][index],
            "close": quote_data["close"][index],
        }
        if any(value is None for value in values.values()):
            continue
        date = datetime.fromtimestamp(timestamp, tz=timezone.utc).date()
        rows.append({"date": date.isoformat(), **values})
    return rows


def classify_candle(open_price: float, close_price: float) -> str:
    if close_price > open_price:
        return "bullish"
    if close_price < open_price:
        return "bearish"
    return "doji"


def analyze(rows: list[dict[str, float | int | str]]) -> dict:
    by_year = {
        str(year): {"year": year, "gapUp": empty_bucket(), "gapDown": empty_bucket()}
        for year in YEARS
    }

    for previous, current in zip(rows, rows[1:]):
        year = int(str(current["date"])[:4])
        if year not in YEARS:
            continue

        candle = classify_candle(float(current["open"]), float(current["close"]))
        gap_type = None
        if float(current["open"]) > float(previous["close"]):
            gap_type = "gapUp"
        elif float(current["open"]) < float(previous["close"]):
            gap_type = "gapDown"
        if gap_type is None:
            continue

        bucket = by_year[str(year)][gap_type]
        bucket[candle] += 1
        bucket["total"] += 1
        bucket[f"{candle}Dates"].append(str(current["date"]))

    last_candle_date = str(rows[-1]["date"]) if rows else datetime.now(timezone.utc).date().isoformat()
    return {
        "symbol": SYMBOL,
        "asOfDate": last_candle_date,
        "years": [by_year[str(year)] for year in YEARS],
        "rules": {
            "gapUp": "당일 시가 > 전일 종가",
            "gapDown": "당일 시가 < 전일 종가",
            "bullish": "당일 종가 > 당일 시가 (차트 빨강 양봉)",
            "bearish": "당일 종가 < 당일 시가 (차트 파랑 음봉)",
            "doji": "당일 종가 = 당일 시가 (보합)",
        },
    }


def main() -> None:
    try:
        print(json.dumps(analyze(fetch_daily_candles()), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
