import urllib.request, json
UA = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36", "Referer": "https://m.stock.naver.com/"}
def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20)
        return f"{r.status} :: {r.read().decode('utf-8','replace')[:2500]}"
    except Exception as e:
        return f"ERR {e}"
for u in [
 "https://m.stock.naver.com/api/index/FUT/basic",
 "https://m.stock.naver.com/api/index/FUT/integration",
 "https://m.stock.naver.com/api/index/FUT/trend",
 "https://m.stock.naver.com/api/index/FUT/investor",
 "https://m.stock.naver.com/api/index/KOSPI/trend",
 "https://m.stock.naver.com/api/index/KOSPI/integration",
 "https://m.stock.naver.com/api/index/KOSPI/investor",
 "https://m.stock.naver.com/api/index/KOSPI/price?pageSize=5&page=1",
 "https://m.stock.naver.com/api/index/FUT/price?pageSize=5&page=1",
 "https://polling.finance.naver.com/api/realtime/domestic/index/FUT",
 "https://m.stock.naver.com/front-api/futures/basic?code=FUT",
]:
    print(f"\n##### {u}\n{get(u)}")
