"""참고형 PBR 계산 (읽기 전용 연습용)

네이버 증권 공개 데이터에서 BPS(주당순자산)와 월봉 주가를 받아
  1) 현재 PBR = 현재가 / 최근 확정 BPS
  2) 선행 PBR = 현재가 / 올해·내년 예상 BPS (컨센서스)
  3) 과거 PBR 밴드 = 각 월말 종가 / 그 시점에 알려진 BPS
를 계산합니다. 결과는 out/ 폴더와 Actions 요약 화면에만 남기고, 저장소는 건드리지 않습니다.
"""
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

STOCKS = {"005930": "삼성전자", "000660": "SK하이닉스"}
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
OUT = "out"
os.makedirs(OUT, exist_ok=True)


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "replace")


def num(s):
    if s is None:
        return None
    m = re.search(r"-?[\d,]+(?:\.\d+)?", str(s))
    return float(m.group(0).replace(",", "")) if m else None


def save(name, text):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(text)


def bps_table(code, period):
    """{'202512': (bps, is_estimate), ...}"""
    raw = get(f"https://m.stock.naver.com/api/stock/{code}/finance/{period}")
    save(f"{code}_{period}.json", raw)
    info = json.loads(raw).get("financeInfo", {})
    titles = {t["key"]: t.get("isConsensus") == "Y" for t in info.get("trTitleList", [])}
    for row in info.get("rowList", []):
        if row.get("title", "").strip().upper().startswith("BPS"):
            out = {}
            for key, col in row.get("columns", {}).items():
                v = num(col.get("value"))
                if v:
                    out[key] = (v, titles.get(key, False))
            return out
    return {}


def integration(code):
    raw = get(f"https://m.stock.naver.com/api/stock/{code}/integration")
    save(f"{code}_integration.json", raw)
    d = json.loads(raw)
    infos = {i.get("code"): i.get("value") for i in d.get("totalInfos", [])}
    return {k: num(infos.get(k)) for k in ("pbr", "bps", "per", "eps", "cnsPer", "cnsEps")}


def monthly(code):
    xml = get(
        f"https://fchart.stock.naver.com/sise.nhn?symbol={code}&timeframe=month&count=400&requestType=0"
    )
    rows = []
    for item in ET.fromstring(xml).iter("item"):
        p = item.get("data", "").split("|")
        if len(p) >= 5:
            rows.append((p[0], float(p[4])))  # (YYYYMMDD, 종가)
    return rows


def known_bps(table, yyyymm):
    """그 달에 이미 확정·공시됐을 BPS (분기말 + 약 2달 공시 지연)."""
    best = None
    for key, (v, est) in sorted(table.items()):
        if est:
            continue
        y, m = int(key[:4]), int(key[4:6])
        avail = y * 12 + m + 2
        if avail <= int(yyyymm[:4]) * 12 + int(yyyymm[4:6]):
            best = (key, v)
    return best


report = ["# 참고형 PBR (네이버 증권 공개 데이터)", ""]
result = {}
for code, name in STOCKS.items():
    try:
        integ = integration(code)
        ann = bps_table(code, "annual")
        qtr = bps_table(code, "quarter")
        px = monthly(code)
    except Exception as e:  # noqa: BLE001
        report += [f"## {name}: 수집 실패 — {e}", ""]
        print(f"{name} 실패: {e}", file=sys.stderr)
        continue

    price = px[-1][1]
    actual = {k: v for k, v in {**ann, **qtr}.items() if not v[1]}
    last_key = max(actual) if actual else None
    last_bps = actual[last_key][0] if last_key else None
    est = {k: v[0] for k, v in ann.items() if v[1]}

    merged = {**ann, **qtr}
    band = []
    for ymd, close in px:
        kb = known_bps(merged, ymd[:6])
        if kb:
            band.append((ymd[:6], close, kb[1], close / kb[1]))

    r = {
        "price": price,
        "priceDate": px[-1][0],
        "naverPbr": integ.get("pbr"),
        "naverBps": integ.get("bps"),
        "lastBps": last_bps,
        "lastBpsPeriod": last_key,
        "pbrNow": round(price / last_bps, 2) if last_bps else None,
        "fwd": {k: {"bps": v, "pbr": round(price / v, 2)} for k, v in sorted(est.items())},
        "band": band,
    }
    result[code] = r

    report += [f"## {name} ({code})", ""]
    report += [f"- 현재가(최근 월봉 종가): **{price:,.0f}원** ({px[-1][0]})"]
    if last_bps:
        report += [f"- 최근 확정 BPS: {last_bps:,.0f}원 ({last_key}) → **PBR {r['pbrNow']}배**"]
    if integ.get("pbr"):
        report += [f"- 네이버 표시 PBR: {integ['pbr']}배 (BPS {integ.get('bps') or 0:,.0f}원)"]
    for k, v in r["fwd"].items():
        report += [f"- 예상 BPS {k}E: {v['bps']:,.0f}원 → **선행 PBR {v['pbr']}배**"]
    if band:
        pbrs = [b[3] for b in band]
        hi = max(band, key=lambda b: b[3])
        lo = min(band, key=lambda b: b[3])
        avg = sum(pbrs) / len(pbrs)
        pct = sum(p <= r["pbrNow"] for p in pbrs) / len(pbrs) * 100 if r["pbrNow"] else None
        report += [
            "",
            f"과거 PBR 밴드 ({band[0][0]}~{band[-1][0]}, 월말 기준 {len(band)}개월)",
            f"- 최고 {hi[3]:.2f}배 ({hi[0]}, 주가 {hi[1]:,.0f})",
            f"- 최저 {lo[3]:.2f}배 ({lo[0]}, 주가 {lo[1]:,.0f})",
            f"- 평균 {avg:.2f}배" + (f" · 현재는 하위 {pct:.0f}% 위치" if pct is not None else ""),
            "",
            "| 기준 PBR | 해당 주가 (최근 BPS 기준) |",
            "|---|---|",
        ]
        for m in (1.0, 1.5, 2.0, 2.5, 3.0, 4.0):
            if last_bps:
                report += [f"| {m}배 | {m * last_bps:,.0f}원 |"]
        report += [
            "",
            "| 연도 | 연간 최고 PBR | 연간 최저 PBR |",
            "|---|---|---|",
        ]
        years = sorted({b[0][:4] for b in band})
        for y in years:
            ys = [b[3] for b in band if b[0].startswith(y)]
            report += [f"| {y} | {max(ys):.2f} | {min(ys):.2f} |"]
    report += [""]

report += ["※ 월말 종가 기준·공시 지연 2개월 가정의 참고용 계산입니다. 투자 권유가 아닙니다."]
text = "\n".join(report)
print(text)
save("pbr_ref.md", text)
save("pbr_ref.json", json.dumps(result, ensure_ascii=False, indent=1))
summary = os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary, "a", encoding="utf-8") as f:
        f.write(text + "\n")
if not result:
    sys.exit(1)
