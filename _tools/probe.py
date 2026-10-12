import urllib.request
for u in ["https://m.stock.naver.com/api/index/FUT/trend","https://polling.finance.naver.com/api/realtime/domestic/index/FUT","https://polling.finance.naver.com/api/realtime/domestic/index/KOSPI","https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?range=1d&interval=5m","https://m.stock.naver.com/api/index/FUT/trend?pageSize=10&page=1","https://m.stock.naver.com/api/index/KOSPI/trend?pageSize=10&page=1","https://m.stock.naver.com/api/index/FUT/trend/history?pageSize=10","https://m.stock.naver.com/api/index/KOSPI/integration"]:
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent":"Mozilla/5.0","Origin":"https://poianopks.github.io"}), timeout=20)
        b = r.read().decode("utf-8","replace")
        print("\n##", u, r.status, "ACAO=", r.headers.get("Access-Control-Allow-Origin"), "|", b[:300] if "integration" not in u else b[b.find('"programTrendInfo"'):b.find('"programTrendInfo"')+400])
    except Exception as e:
        print("\n##", u, "ERR", e)
