#!/usr/bin/env python3
"""연습장: 오늘 종가 단일가(15:20~15:30) 결과가 15:20 직전 가격보다 위/아래였는지."""
import json
import re
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

KST = timezone(timedelta(hours=9))
ITEMS = [("069500", "KODEX 200"), ("122630", "KODEX 레버리지"), ("114800", "KODEX 인버스"),
         ("252670", "KODEX 200선물인버스2X"), ("005930", "삼성전자"), ("000660", "SK하이닉스")]
UA = {"User-Agent": "Mozilla/5.0"}
out = [f"# 종가 단일가 확인 (생성 {datetime.now(KST):%Y-%m-%d %H:%M} KST)", "",
       "| 종목 | 15:19 마지막 체결가 | 종가(15:30 단일가) | 단일가 결과 | 전일 대비 |", "|---|---:|---:|---|---:|"]
for code, name in ITEMS:
    try:
        url = f"https://fchart.stock.naver.com/sise.nhn?symbol={code}&timeframe=minute&count=400&requestType=0"
        xml = urlopen(Request(url, headers=UA), timeout=20).read().decode("euc-kr", "replace")
        rows = re.findall(r'data="(\d{12})\|([\d.]+|null)\|([\d.]+|null)\|([\d.]+|null)\|([\d.]+|null)\|(\d+)"', xml)
        today = rows[-1][0][:8]
        bars = [(r[0], float(r[4])) for r in rows if r[0][:8] == today and r[4] != "null"]
        before = [b for b in bars if b[0][8:12] <= "1520"]
        last_cont = before[-1] if before else None
        basic = json.loads(urlopen(Request(f"https://m.stock.naver.com/api/stock/{code}/basic", headers=UA), timeout=20).read())
        close = float(str(basic["closePrice"]).replace(",", ""))
        chg = basic.get("fluctuationsRatio")
        if last_cont:
            diff = close / last_cont[1] - 1
            verdict = "🔺 위" if diff > 0 else ("🔻 아래" if diff < 0 else "＝ 같음")
            out.append(f"| {name} | {last_cont[1]:,.0f} ({last_cont[0][8:10]}:{last_cont[0][10:12]}) | {close:,.0f} | {verdict} ({diff*100:+.2f}%) | {chg}% |")
        else:
            out.append(f"| {name} | 분봉 없음 | {close:,.0f} | - | {chg}% |")
        out.append(f"<!-- {name} 마지막 분봉 10개: {bars[-10:]} -->")
    except Exception as e:  # noqa: BLE001
        out.append(f"| {name} | 오류: {e} | | | |")
try:
    k = json.loads(urlopen(Request("https://m.stock.naver.com/api/index/KOSPI/basic", headers=UA), timeout=20).read())
    out.append(f"\n- 코스피 종가 {k.get('closePrice')} ({k.get('fluctuationsRatio')}%) {k.get('localTradedAt')}")
except Exception as e:  # noqa: BLE001
    out.append(f"- 코스피 오류: {e}")
text = "\n".join(out)
print(text)
open("practice/closing/result.md", "w", encoding="utf-8").write(text + "\n")
