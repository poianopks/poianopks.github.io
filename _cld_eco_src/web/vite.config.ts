import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

const webDir = import.meta.dirname;
const assetsDir = path.resolve(webDir, "assets");

/**
 * 원본 앱의 @assets 스크린샷 이미지(jpg)는 이 저장소에 없을 수 있습니다.
 * web/assets/ 에 같은 이름의 파일이 있으면 그 파일을, 없으면 안내 그림(SVG)을 씁니다.
 */
function assetsFallback(): Plugin {
  return {
    name: "assets-fallback",
    enforce: "pre",
    resolveId(id) {
      if (!id.startsWith("@assets/")) return null;
      const name = id.slice("@assets/".length);
      const file = path.join(assetsDir, name);
      return fs.existsSync(file) ? file : `\0assets-missing:${name}`;
    },
    load(id) {
      if (!id.startsWith("\0assets-missing:")) return null;
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240" viewBox="0 0 800 240">` +
        `<rect width="800" height="240" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-dasharray="8 6"/>` +
        `<text x="400" y="110" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#475569">📊 원본 차트 이미지</text>` +
        `<text x="400" y="150" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#64748b">Replit 원본 앱에서 볼 수 있어요</text>` +
        `</svg>`;
      return `export default ${JSON.stringify("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg))};`;
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "/cld_eco/",
  root: webDir,
  plugins: [assetsFallback(), react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(webDir, "src") },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(webDir, "../dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
