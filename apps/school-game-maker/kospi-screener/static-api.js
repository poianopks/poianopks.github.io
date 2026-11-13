// 정적 버전용 API 대체: /api/stocks/screen 요청을 저장된 Yahoo Finance 스냅샷으로 브라우저에서 계산합니다.
(function () {
  var snapPromise = null;
  function loadSnap() {
    if (!snapPromise) snapPromise = window.__origFetch('./stocks-snapshot.json').then(function (r) { return r.json(); });
    return snapPromise;
  }
  function safeNum(v) { var n = Number(v); return v == null || isNaN(n) || !isFinite(n) ? null : n; }
  function calcMA(closes, p) { if (closes.length < p) return null; var s = 0; for (var i = closes.length - p; i < closes.length; i++) s += closes[i]; return s / p; }
  function screen(snap, maxPer, maxPbr) {
    var perPassed = [], all = [];
    snap.stocks.forEach(function (st) {
      var per = safeNum(st.tpe); if (per == null) per = safeNum(st.pec);
      if (per == null || per <= 0 || per > maxPer) return;
      perPassed.push(st);
      var roe = safeNum(st.roe);
      var pbr = roe != null && roe > 0 ? Math.round(per * roe * 100) / 100 : null;
      if (pbr !== null && pbr > maxPbr) return;
      var candles = st.c.map(function (c) { return { date: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] }; });
      if (candles.length < 4) return;
      var last = candles.length - 1, cur = candles[last], prev = candles[last - 1];
      if (cur.close <= cur.open) return;
      var bear = 0;
      for (var i = last - 1; i >= 0 && i >= last - 3; i--) { if (candles[i].close < candles[i].open) bear++; else break; }
      if (bear < 1) return;
      var closes = candles.map(function (c) { return c.close; });
      all.push({
        symbol: st.s, name: st.n, per: Math.round(per * 10) / 10, pbr: pbr,
        score: pbr != null ? per * pbr : per, bearishCount: bear,
        currentClose: cur.close, currentOpen: cur.open,
        changeRate: prev.close > 0 ? ((cur.close - prev.close) / prev.close) * 100 : 0,
        ma5: calcMA(closes, 5), ma20: calcMA(closes, 20), ma60: calcMA(closes, 60),
        history: candles.slice(-72)
      });
    });
    all.sort(function (a, b) { return a.score - b.score; });
    return { results: all.slice(0, 10), total: all.length, screened: snap.stocks.length, perPassed: perPassed.length };
  }
  window.__origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var m = url.match(/\/api\/stocks\/screen\?(.*)$/);
    if (!m) return window.__origFetch(input, init);
    var q = new URLSearchParams(m[1]);
    var maxPer = parseFloat(q.get('maxPer') || '15'), maxPbr = parseFloat(q.get('maxPbr') || '1.5');
    return loadSnap().then(function (snap) {
      return new Response(JSON.stringify(screen(snap, maxPer, maxPbr)), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
  };
  window.addEventListener('DOMContentLoaded', function () {
    loadSnap().then(function (snap) {
      var b = document.createElement('div');
      b.textContent = '📌 ' + (snap.updated || snap.asOf) + ' 기준 네이버 증권 데이터 · ' + snap.stocks.length + '종목 (평일 하루 3번 자동 갱신) · 더 많은 조건은 코스피 저평가 월봉 탐색기(../../stock-finder/)';
      b.style.cssText = 'background:#fef3c7;color:#92400e;font:13px/1.5 sans-serif;padding:6px 12px;text-align:center';
      document.body.insertBefore(b, document.body.firstChild);
    });
  });
})();
