import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

const webDir = import.meta.dirname;
const assetsDir = path.resolve(webDir, "assets");

/**
 * 원본 앱의 @assets 스크린샷 이미지(jpg)는 이 저장소에 없을 수 있습니다.
 * web/assets/ 에 같은 이름의 파일이 있으면 그 파일을 쓰고, 없으면 그 그림 자리를 숨깁니다.
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
      // 이미지가 없으면 빈 값 → 화면에서 그 자리를 숨깁니다 (index.css)
      return `export default "";`;
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
