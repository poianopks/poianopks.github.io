import urllib.request, urllib.parse, re
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
def get(url, data=None, headers=None, enc=None):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode() if data else None, headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=20)
        b = r.read()
        t = b.decode(enc or r.headers.get_content_charset() or "utf-8", "replace")
        t = re.sub(r"\s+", " ", re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", t))
        return f"{r.status} len={len(b)} :: {t[:700]}"
    except Exception as e:
        return f"ERR {e}"
tests = {
 "naver_fut_page": ("https://finance.naver.com/sise/sise_index.naver?code=FUT", None, None, "euc-kr"),
 "naver_fut_time": ("https://finance.naver.com/sise/sise_index_time.naver?code=FUT&thistime=20261012160000", None, None, "euc-kr"),
 "naver_poll_fut": ("https://polling.finance.naver.com/api/realtime/domestic/index/FUT", None, None, None),
 "naver_m_fut": ("https://m.stock.naver.com/api/index/FUT/basic", None, None, None),
 "naver_invest_kospi": ("https://finance.naver.com/sise/investorDealTrendDay.naver?bizdate=20261012&sosok=", None, None, "euc-kr"),
 "naver_invest_fut03": ("https://finance.naver.com/sise/investorDealTrendDay.naver?bizdate=20261012&sosok=03", None, None, "euc-kr"),
 "naver_invest_time_fut": ("https://finance.naver.com/sise/investorDealTrendTime.naver?bizdate=20261012&sosok=03", None, None, "euc-kr"),
 "krx_stock_investor": ("https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd", {"bld":"dbms/MDC/STAT/standard/MDCSTAT02201","locale":"ko_KR","inqTpCd":"1","trdVolVal":"2","askBid":"3","mktId":"STK","strtDd":"20261012","endDd":"20261012","money":"3","detailView":"1"}, {"Referer":"https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd"}, None),
 "daum_investor": ("https://finance.daum.net/api/investor/days?page=1&perPage=5&market=KOSPI&pagination=true", None, {"Referer":"https://finance.daum.net/domestic/investors"}, None),
 "daum_futures": ("https://finance.daum.net/api/domestic/futures?", None, {"Referer":"https://finance.daum.net/domestic/futures"}, None),
}
for k, (u, d, h, enc) in tests.items():
    print(f"\n##### {k}\n{get(u, d, h, enc)}")
