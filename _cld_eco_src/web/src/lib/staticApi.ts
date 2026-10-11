/**
 * 정적 사이트용 API 연결.
 *
 * 원본 Replit 앱은 서버(/api/...)에서 데이터를 받아왔습니다.
 * GitHub Pages에는 서버가 없으므로, GitHub Actions가 같은 서버 코드를 실행해
 * 결과를 api/**.json 파일로 미리 저장해 둡니다. 화면 코드는 그대로 두고
 * fetch("/api/...") 요청만 그 JSON 파일로 바꿔 줍니다.
 */

/** "/api/" 뒤 경로 + 쿼리 → 저장 파일 이름 (데이터 수집 스크립트와 같은 규칙) */
export function staticKey(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  const parts = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}-${v}`);
  const q = parts.length ? "__" + parts.join("_").replace(/[^A-Za-z0-9._-]/g, "_") : "";
  return `${pathname.replace(/\/+$/, "")}${q}.json`;
}

export function installStaticApi(base: string) {
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    const m = url.origin === window.location.origin ? url.pathname.match(/\/api\/(.+)$/) : null;
    if (!m) return original(input, init);
    // GitHub Pages 캐시(10분)를 피하려고 5분 단위로 주소를 바꿔 최신 파일을 받음
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    return original(`${base}api/${staticKey(m[1], url.search)}?v=${bucket}`, init);
  };
}
