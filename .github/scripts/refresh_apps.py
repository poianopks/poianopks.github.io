"""apps/ 의 GitHub Pages 보관판 데이터를 Replit 원본 앱(API)에서 다시 받아 옵니다.

- data/ 폴더형: 파일 이름 = /api/ 뒤 경로의 / ? = & 를 _ 로 바꾼 것
- api-snapshot.json 형: { "/api/...": 응답 } 사전
받아 오기에 실패한 항목은 예전 파일을 그대로 둡니다(덮어쓰지 않음).
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "apps")
KST = timezone(timedelta(hours=9))
STAMP = datetime.now(KST).strftime("%Y-%m-%d %H:%M")

# 보관판 폴더 → Replit 원본 주소
DATA_DIR_APPS = {
    "economic-forecast-hub": "https://economic-forecast-hub.replit.app",
    "real-time-news": "https://real-time-news.replit.app",
    "erp-realtime-analysis": "https://erp-realtime-analysis.replit.app",
}
SNAPSHOT_APPS = {
    "stock-sense": "https://stock-sense.replit.app",
    "new-project-now": "https://new-project-now.replit.app",
    "economic-insight-hub": "https://economic-insight-hub.replit.app",
    "new-project": "https://new-project-pianopks1.replit.app",
    "new-project/market-cycle": "https://new-project-pianopks1.replit.app",
}
SKIP = ("admin", "stream", "/ai", "chat")


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "apps-refresh/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as r:
        if r.status != 200:
            raise RuntimeError(r.status)
        body = r.read()
    data = json.loads(body)
    if isinstance(data, dict) and set(data) <= {"error", "message"}:
        raise RuntimeError("error response")
    return data


def endpoints_from_bundle(app_dir):
    eps = set()
    adir = os.path.join(app_dir, "assets")
    for f in os.listdir(adir) if os.path.isdir(adir) else []:
        if f.endswith(".js"):
            txt = open(os.path.join(adir, f), encoding="utf-8", errors="ignore").read()
            eps.update(m.rstrip("?/") for m in re.findall(r"/api/([A-Za-z0-9/_.-]+)", txt))
    return sorted(eps, key=len, reverse=True)


def file_to_key(fname, eps):
    stem = fname[:-5]
    for e in eps:
        flat = e.replace("/", "_")
        if stem == flat:
            return e
        if stem.startswith(flat + "_"):
            rest = stem[len(flat) + 1:].split("_")
            if len(rest) % 2 == 0:
                q = "&".join(f"{rest[i]}={rest[i + 1]}" for i in range(0, len(rest), 2))
                return f"{e}?{q}"
    return None


def stamp_files(app_dir):
    pat = re.compile(r"20\d\d-\d\d-\d\d(?: \d\d:\d\d KST)?(?= (?:데이터|스냅샷|시점))")
    for dp, _, fs in os.walk(app_dir):
        if "assets" in dp.split(os.sep):
            continue
        for f in fs:
            if f in ("index.html", "static-api.js"):
                p = os.path.join(dp, f)
                s = open(p, encoding="utf-8").read()
                n = pat.sub(f"{STAMP} KST", s).replace("(실시간 아님)", "(하루 3번 자동 갱신)")
                if n != s:
                    open(p, "w", encoding="utf-8").write(n)


def stamp_hub(slug):
    p = os.path.join(ROOT, "index.html")
    s = open(p, encoding="utf-8").read()
    pat = re.compile(r'(href="' + re.escape(slug) + r'/"><b>[^<]*</b><span class="bd"[^>]*>)20\d\d-\d\d-\d\d(?: \d\d:\d\d KST)?( 데이터)')
    n = pat.sub(lambda m: m.group(1) + f"{STAMP} KST" + m.group(2), s)
    if n != s:
        open(p, "w", encoding="utf-8").write(n)


ok = fail = 0
report = []
for slug, base in DATA_DIR_APPS.items():
    app_dir = os.path.join(ROOT, slug)
    eps = endpoints_from_bundle(app_dir)
    good = 0
    for f in sorted(os.listdir(os.path.join(app_dir, "data"))):
        key = file_to_key(f, eps)
        if not key or any(s in "/" + key for s in SKIP):
            continue
        try:
            d = get_json(f"{base}/api/{key}")
            json.dump(d, open(os.path.join(app_dir, "data", f), "w", encoding="utf-8"), ensure_ascii=False)
            good += 1
        except Exception as e:  # noqa: BLE001
            fail += 1
            print(f"  ✗ {slug} {key}: {e}", file=sys.stderr)
    ok += good
    report.append(f"{slug}: {good}개 갱신")
    if good:
        stamp_files(app_dir)
        stamp_hub(slug)

for slug, base in SNAPSHOT_APPS.items():
    p = os.path.join(ROOT, slug, "api-snapshot.json")
    snap = json.load(open(p, encoding="utf-8"))
    good = 0
    for key in list(snap):
        if not key.startswith("/api/") or any(s in key for s in SKIP):
            continue
        try:
            snap[key] = get_json(base + key)
            good += 1
        except Exception as e:  # noqa: BLE001
            fail += 1
            print(f"  ✗ {slug} {key}: {e}", file=sys.stderr)
    if good:
        json.dump(snap, open(p, "w", encoding="utf-8"), ensure_ascii=False)
        stamp_files(os.path.join(ROOT, slug))
        stamp_hub(slug.split("/")[0])
    ok += good
    report.append(f"{slug}: {good}개 갱신")

print(f"{STAMP} KST · 성공 {ok} · 실패 {fail}")
print("\n".join(report))
summary = os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary, "a", encoding="utf-8") as fh:
        fh.write(f"## 앱 보관판 데이터 갱신 {STAMP} KST\n\n성공 {ok} · 실패 {fail}\n\n" + "\n".join(f"- {r}" for r in report) + "\n")
if ok == 0:
    sys.exit(1)
