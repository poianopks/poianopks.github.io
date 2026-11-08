/* 정적(GitHub Pages) 버전용 API 대체 스크립트: /api/* 요청을 번들된 스냅샷(api-snapshot.json)으로 응답합니다. */
(function () {
  var CFG = window.__STATIC_CFG || {};
  var SNAP_URL = CFG.snapshot || "api-snapshot.json";
  var origFetch = window.fetch.bind(window);
  var snapPromise = null;
  function loadSnap() {
    if (!snapPromise) snapPromise = origFetch(SNAP_URL).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    return snapPromise;
  }
  function parse(u) {
    var url = new URL(u, location.origin);
    url.searchParams.delete("t"); url.searchParams.delete("_");
    return { path: url.pathname, qs: url.searchParams, key: url.pathname + (url.searchParams.toString() ? "?" + decodeURIComponent(url.searchParams.toString()) : "") };
  }
  function resp(status, body, ct) {
    return new Response(body, { status: status, headers: { "Content-Type": ct || "application/json; charset=utf-8" } });
  }
  var AI_MSG = CFG.aiMessage || "AI 분석 기능은 정적(GitHub Pages) 보관 버전에서는 사용할 수 없습니다. (서버·API 키 필요)";
  function aiStream() {
    var ev = { type: "error", error: AI_MSG, message: AI_MSG };
    return resp(200, "data: " + JSON.stringify(ev) + "\n\n", "text/event-stream; charset=utf-8");
  }
  function lookup(snap, method, p) {
    var keys = Object.keys(snap);
    var exact = snap[method + " " + p.key] || snap[p.key];
    if (exact) return exact;
    // 쿼리 파라미터 순서 무시 매칭
    var norm = function (qs) { return Array.from(qs.entries()).map(function (e) { return e.join("=").toLowerCase(); }).sort().join("&"); };
    var want = norm(p.qs);
    for (var i = 0; i < keys.length; i++) {
      var q = parse(keys[i].replace(/^(GET|POST) /, ""));
      if (q.path === p.path && norm(q.qs) === want) return snap[keys[i]];
    }
    // 시세 묶음 요청: 개별 스냅샷을 합쳐서 응답
    if (CFG.mergeQuote && p.path === CFG.mergeQuote.path && p.qs.get(CFG.mergeQuote.param)) {
      var want2 = p.qs.get(CFG.mergeQuote.param).split(","), out = {}, ok = false, extra = null;
      keys.forEach(function (k) {
        var q = parse(k.replace(/^(GET|POST) /, ""));
        if (q.path !== p.path) return;
        try { var b = JSON.parse(snap[k].body); var d = b[CFG.mergeQuote.field]; if (!extra) extra = b;
          want2.forEach(function (t) { if (d && d[t] && !out[t]) { out[t] = d[t]; ok = true; } }); } catch (e) {}
      });
      if (ok) { var nb = Object.assign({}, extra); nb[CFG.mergeQuote.field] = out; return { status: 200, body: JSON.stringify(nb) }; }
    }
    if (CFG.fallbacks && CFG.fallbacks[p.path] != null) return { status: 200, body: CFG.fallbacks[p.path] };
    if ((CFG.noPathFallback || []).indexOf(p.path) >= 0) return null;
    // 같은 경로(쿼리 무시) 중 첫 번째
    for (var j = 0; j < keys.length; j++) {
      if (parse(keys[j].replace(/^(GET|POST) /, "")).path === p.path) return snap[keys[j]];
    }
    // 가변 경로 마지막 세그먼트 무시 (예: /history/:ticker 대신 다른 종목은 없음 → 404)
    return null;
  }
  window.fetch = function (input, init) {
    var u = typeof input === "string" ? input : (input && input.url) || String(input);
    var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
    var abs;
    try { abs = new URL(u, location.href); } catch (e) { return origFetch(input, init); }
    var apiPrefix = CFG.apiPrefix || "/api/";
    var isApi = abs.origin === location.origin && abs.pathname.indexOf(apiPrefix) === 0 && !/\/apps\//.test(abs.pathname);
    if (!isApi && CFG.remoteApi && u.indexOf(CFG.remoteApi) === 0) { isApi = true; abs = new URL(u.slice(CFG.remoteApi.length) || "/", location.origin); }
    if (!isApi) return origFetch(input, init);
    var p = parse(abs.pathname + abs.search);
    if ((CFG.aiPaths || []).some(function (x) { return p.path.indexOf(x) === 0; })) {
      return Promise.resolve(CFG.aiJson ? resp(503, JSON.stringify({ error: AI_MSG, message: AI_MSG })) : aiStream());
    }
    if (method !== "GET" && CFG.postHandler) { var r = CFG.postHandler(p, init); if (r) return Promise.resolve(r); }
    return loadSnap().then(function (snap) {
      var hit = lookup(snap, method, p);
      if (!hit) return resp(404, JSON.stringify({ error: "정적 버전에 저장된 데이터가 없습니다.", message: "정적 버전에 저장된 데이터가 없습니다." }));
      return resp(hit.status || 200, hit.body, hit.ct);
    });
  };
  // EventSource(SSE) 대체: 스냅샷 한 건을 이벤트로 전달
  if (CFG.sse && window.EventSource) {
    var OrigES = window.EventSource;
    var FakeES = function (u, opts) {
      var abs = new URL(u, location.href), self = this, conf = CFG.sse[abs.pathname];
      if (!conf) return new OrigES(u, opts);
      this.url = abs.href; this.readyState = 0; this._l = {};
      this.onopen = this.onmessage = this.onerror = null;
      loadSnap().then(function (snap) {
        if (self.readyState === 2) return;
        var hit = snap["SSE " + abs.pathname];
        self.readyState = 1;
        if (self.onopen) self.onopen({ type: "open" });
        if (hit) self._emit(conf.event || "message", hit.body);
      });
    };
    FakeES.prototype.addEventListener = function (t, f) { (this._l[t] = this._l[t] || []).push(f); };
    FakeES.prototype.removeEventListener = function (t, f) { this._l[t] = (this._l[t] || []).filter(function (x) { return x !== f; }); };
    FakeES.prototype.close = function () { this.readyState = 2; };
    FakeES.prototype._emit = function (t, data) {
      var ev = { type: t, data: data };
      (this._l[t] || []).forEach(function (f) { f(ev); });
      if (t === "message" && this.onmessage) this.onmessage(ev);
    };
    FakeES.CONNECTING = 0; FakeES.OPEN = 1; FakeES.CLOSED = 2;
    window.EventSource = FakeES;
  }
  // 안내 배지 + 앱 모음 링크
  function badge() {
    if (document.getElementById("static-port-badge") || CFG.noBadge) return;
    var d = document.createElement("div");
    d.id = "static-port-badge";
    d.setAttribute("style", "position:fixed;left:8px;bottom:8px;z-index:2147483000;max-width:calc(100vw - 16px);box-sizing:border-box;font:12px/1.4 system-ui,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:rgba(15,23,42,.88);color:#e2e8f0;border:1px solid rgba(148,163,184,.35);border-radius:10px;padding:5px 9px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,.3)");
    var links = (CFG.links || [{ href: "../", text: "← 앱 모음" }]).map(function (l) { return '<a href="' + l.href + '" style="color:#7dd3fc;text-decoration:none;font-weight:600">' + l.text + "</a>"; }).join(" ");
    d.innerHTML = links + (CFG.note ? '<span style="opacity:.85">' + CFG.note + "</span>" : "") +
      '<button type="button" aria-label="닫기" style="background:none;border:0;color:#94a3b8;cursor:pointer;font-size:13px;padding:0 2px">✕</button>';
    d.querySelector("button").onclick = function () { d.remove(); };
    document.body.appendChild(d);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", badge); else badge();
})();
