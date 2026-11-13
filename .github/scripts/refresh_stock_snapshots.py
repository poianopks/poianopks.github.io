"""코스피 저평가 탐색기 2종(apps/stock-finder, apps/school-game-maker/kospi-screener) 데이터를
네이버 증권에서 직접 만듭니다. Replit·API 키 없이 GitHub Actions에서 동작합니다.

- 종목 범위: 코스피 보통주 중 시가총액 MIN_MCAP(억원) 이상 (ETF·ETN·우선주 제외)
- PER·추정PER·PBR·EPS·BPS·배당수익률: m.stock.naver.com/api/stock/{코드}/integration
- 월봉(최근 MONTHS개월): fchart.stock.naver.com/sise.nhn (timeframe=month)
- 받기에 실패한 종목은 예전 스냅샷 값을 그대로 둡니다.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "apps")
NOW = datetime.now(timezone(timedelta(hours=9)))
TODAY = NOW.strftime("%Y-%m-%d")
MIN_MCAP = 1000          # 억원
MONTHS = 72              # 6년 (60개월 이동평균용)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
FINDER = os.path.join(ROOT, "stock-finder", "stocks-snapshot.json")
SCREENER = os.path.join(ROOT, "school-game-maker", "kospi-screener", "stocks-snapshot.json")


def get(url, encoding="utf-8", tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://m.stock.naver.com/"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read().decode(encoding, "replace")
        except Exception:  # noqa: BLE001
            if i == tries - 1:
                raise
            time.sleep(1.5 * (i + 1))


def num(s):
    """'9.60배' '22,292원' '0.78%' '12,511,036' → float, 못 읽으면 None"""
    if s is None:
        return None
    m = re.search(r"-?[\d,]+(?:\.\d+)?", str(s))
    if not m:
        return None
    try:
        return float(m.group(0).replace(",", ""))
    except ValueError:
        return None


def universe():
    out, page = [], 1
    while page < 40:
        d = json.loads(get(f"https://m.stock.naver.com/api/stocks/marketValue/KOSPI?page={page}&pageSize=100"))
        stocks = d.get("stocks") or []
        if not stocks:
            break
        for s in stocks:
            mcap = num(s.get("marketValue"))
            if s.get("stockEndType") != "stock" or not s.get("itemCode", "").endswith("0"):
                continue  # ETF·ETN·우선주 제외
            if mcap is None or mcap < MIN_MCAP:
                continue
            out.append({"code": s["itemCode"], "name": s["stockName"], "mcap": int(mcap)})
        last = num(stocks[-1].get("marketValue")) or 0
        if last < MIN_MCAP:
            break  # 시가총액 순 정렬이라 여기서 끝
        page += 1
        time.sleep(0.2)
    return out


def fundamentals(code):
    d = json.loads(get(f"https://m.stock.naver.com/api/stock/{code}/integration"))
    info = {x.get("code"): x.get("value") for x in d.get("totalInfos", [])}
    return {
        "per": num(info.get("per")), "fper": num(info.get("cnsPer")), "pbr": num(info.get("pbr")),
        "eps": num(info.get("eps")), "bps": num(info.get("bps")), "div": num(info.get("dividendYieldRatio")),
    }


def monthly(code):
    xml = get(f"https://fchart.stock.naver.com/sise.nhn?symbol={code}&timeframe=month&count={MONTHS}&requestType=0",
              encoding="euc-kr")
    rows = []
    for m in re.finditer(r'data="(\d{8})\|([\d.]+)\|([\d.]+)\|([\d.]+)\|([\d.]+)\|(\d+)"', xml):
        ymd, o, h, l, c, v = m.groups()
        if float(o) <= 0:
            continue
        rows.append([f"{ymd[:4]}-{ymd[4:6]}", int(float(o)), int(float(h)), int(float(l)), int(float(c)), int(v)])
    return rows


def load(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {"stocks": []}


def main():
    uni = universe()
    if len(uni) < 100:
        print(f"종목 목록이 너무 적음({len(uni)}개) → 예전 데이터 유지")
        sys.exit(1)

    old = {s.get("t", "").replace(".KS", ""): s for s in load(FINDER).get("stocks", [])}

    def work(u):
        code = u["code"]
        rec = {"t": code + ".KS", "n": u["name"], "mcap": u["mcap"]}
        ok = True
        try:
            rec.update(fundamentals(code))
        except Exception as e:  # noqa: BLE001
            ok = False
            print(f"  ✗ 지표 {code} {u['name']}: {e}", file=sys.stderr)
        try:
            c = monthly(code)
            if len(c) < 4:
                raise RuntimeError("월봉 부족")
            rec["c"] = c
        except Exception as e:  # noqa: BLE001
            ok = False
            print(f"  ✗ 월봉 {code} {u['name']}: {e}", file=sys.stderr)
        prev = old.get(code)
        if prev:  # 실패한 부분은 예전 값으로 채움
            for k in ("per", "fper", "pbr", "eps", "bps", "div"):
                if rec.get(k) is None and prev.get(k) is not None:
                    rec[k] = prev[k]
            if "c" not in rec and prev.get("c"):
                rec["c"] = prev["c"]
        return rec, ok

    with ThreadPoolExecutor(max_workers=6) as ex:
        results = list(ex.map(work, uni))

    stocks = [r for r, _ in results if r.get("c")]
    good = sum(1 for _, ok in results if ok)
    if good < len(uni) * 0.5:
        print(f"성공 {good}/{len(uni)} — 절반 미만이라 예전 데이터 유지")
        sys.exit(1)

    meta = {"asOf": TODAY, "updated": NOW.strftime("%Y-%m-%d %H:%M KST"), "source": "네이버 증권",
            "universe": f"코스피 보통주 · 시가총액 {MIN_MCAP:,}억원 이상"}
    finder = dict(meta, stocks=[{**{k: v for k, v in s.items() if k != "c"},
                                 "c": [row[:5] for row in s["c"]]} for s in stocks])
    json.dump(finder, open(FINDER, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # 학교 게임 안 탐색기: 예전 형식 유지 (PBR = PER × ROE 로 계산하는 화면이라 roe = PBR/PER)
    scr = []
    for s in stocks:
        per, pbr = s.get("per"), s.get("pbr")
        roe = pbr / per if per and pbr and per > 0 else None
        scr.append({"s": s["t"], "n": s["n"], "tpe": per, "pec": s.get("fper"), "roe": roe, "c": s["c"]})
    json.dump(dict(meta, stocks=scr), open(SCREENER, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    stamp_hub("stock-finder/")
    stamp_hub("school-game-maker/kospi-screener/")
    line = f"{TODAY}: 코스피 {len(uni)}종목 중 {good}개 완전 성공, 저장 {len(stocks)}개"
    print(line)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fh:
            fh.write(f"## 코스피 저평가 탐색기 (네이버 증권)\n\n- {line}\n")


def stamp_hub(href):
    p = os.path.join(ROOT, "index.html")
    s = open(p, encoding="utf-8").read()
    pat = re.compile(r'(href="' + re.escape(href) + r'"><b>[^<]*</b><span class="bd"[^>]*>)20\d\d-\d\d-\d\d(?: \d\d:\d\d KST)?( 데이터)')
    n = pat.sub(lambda m: m.group(1) + TODAY + m.group(2), s)
    if n != s:
        open(p, "w", encoding="utf-8").write(n)


if __name__ == "__main__":
    main()
