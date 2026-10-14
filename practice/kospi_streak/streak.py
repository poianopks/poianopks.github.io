#!/usr/bin/env python3
"""연습장: KOSPI 연속 하락 구간 찾기 (최근 1·2·3년).

하락 = 오늘 종가 < 전 거래일 종가. 보합이면 연속이 끊긴 것으로 본다.
"""
import json
import time
from datetime import date, datetime, timedelta, timezone
from urllib.request import Request, urlopen

START = int(datetime(2023, 6, 1, tzinfo=timezone.utc).timestamp())
MIN_LEN = 5


def fetch():
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11"
        f"?period1={START}&period2={int(time.time()) + 86400}&interval=1d&events=history"
    )
    req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    with urlopen(req, timeout=20) as r:
        res = json.loads(r.read().decode())["chart"]["result"][0]
    rows = []
    for ts, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]):
        if c is not None:
            d = datetime.fromtimestamp(ts, timezone(timedelta(hours=9))).date()
            rows.append((d, round(c, 2)))
    return rows


def streaks(rows):
    out, i = [], 1
    while i < len(rows):
        if rows[i][1] < rows[i - 1][1]:
            j = i
            while j + 1 < len(rows) and rows[j + 1][1] < rows[j][1]:
                j += 1
            n = j - i + 1
            if n >= MIN_LEN:
                base = rows[i - 1][1]
                out.append({"start": rows[i][0], "end": rows[j][0], "days": n,
                            "from": base, "to": rows[j][1],
                            "pct": round((rows[j][1] / base - 1) * 100, 2)})
            i = j + 1
        else:
            i += 1
    return out


def main():
    rows = fetch()
    last = rows[-1][0]
    print(f"데이터: {rows[0][0]} ~ {last} ({len(rows)}거래일), 마지막 종가 {rows[-1][1]}")
    for dd, cc in rows[-9:]:
        print(dd, cc)
    all_s = streaks(rows)
    lines = [f"# KOSPI 연속 하락 (기준일 {last})", ""]
    for years in (1, 2, 3):
        since = last.replace(year=last.year - years)
        s = [x for x in all_s if x["end"] > since]
        lines.append(f"## 최근 {years}년 ({since} 이후)")
        lines.append(f"- {MIN_LEN}일 이상 연속 하락: {len(s)}회 / 5일 이상: {sum(x['days'] >= 5 for x in s)}회"
                     f" / 6일 이상: {sum(x['days'] >= 6 for x in s)}회 / 최장: {max((x['days'] for x in s), default=0)}일")
        for x in s:
            lines.append(f"  - {x['start']} ~ {x['end']}: {x['days']}일, {x['from']} → {x['to']} ({x['pct']}%)")
        lines.append("")
    text = "\n".join(lines)
    print(text)
    with open("practice/kospi_streak/result.md", "w", encoding="utf-8") as f:
        f.write(text + "\n")


if __name__ == "__main__":
    main()
