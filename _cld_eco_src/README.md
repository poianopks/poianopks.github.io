# KOSPI 투자 분석 센터 (정적 사이트판)

**서버·유료 API 없이** GitHub Pages에서 돌아가는 정적 사이트입니다. 처음에는 Replit 앱을 옮겨 왔지만, 이제 모든 코드와 데이터가 이 저장소에 있어 **Replit 없이 독립적으로 동작**합니다.

- 사이트 주소: https://poianopks.github.io/cld_eco/
- 화면은 19개 메뉴이며, 메뉴마다 단독 주소(`/cld_eco/<메뉴>/`)가 있습니다.
- 데이터는 **GitHub Actions가 1시간마다** 원본 서버 코드(`server/routes`)를 실행해 공개 시세(Yahoo Finance 등)를 받아 `api/**.json` 파일로 저장한 뒤 사이트(`cld_eco/` 폴더)를 다시 만듭니다.
- 그래서 **실시간이 아니라 최대 약 1시간 늦은 데이터**입니다. 화면의 "업데이트 시각"을 확인하세요.

## 구조

| 폴더 | 내용 |
|---|---|
| `web/` | 화면 (React + Vite + Tailwind) — 원본 `artifacts/kospi-analysis` |
| `server/` | 데이터 계산 코드 — 원본 `artifacts/api-server` 의 주식·턴어라운드 라우트 |
| `scripts/build-data.ts` | 서버 코드를 실행해 모든 `/api` 결과를 JSON으로 저장 |
| `web/src/lib/staticApi.ts` | 화면의 `fetch("/api/...")` 를 저장된 JSON 파일로 연결 |
| `../.github/workflows/cld-eco.yml` | 1시간마다 데이터 수집 → 빌드 → `cld_eco/` 폴더 교체 |

이 폴더(`_cld_eco_src`)는 이름이 `_`로 시작해서 홈페이지에는 공개되지 않고, 빌드 결과만 `cld_eco/`로 공개됩니다.

## 원본과 다른 점

- **마인드 탭**: 원본 파일이 100KB를 넘어 자동 복사하지 못했습니다. 원본 앱으로 가는 안내 화면을 넣었습니다. 원본 `MindSet.tsx`를 `web/src/pages/MindSet.tsx`에 붙여 넣으면 그대로 동작합니다.
- **역사·시나리오·전략 탭의 스크린샷 이미지 7장**: 사진 파일은 복사하지 못해 안내 그림으로 대신합니다. 원본 `attached_assets/` 의 같은 이름 jpg 파일을 `web/assets/` 에 넣으면 자동으로 원래 사진이 나옵니다.
- **📱 모바일 앱 탭**은 뺐습니다(본 화면이 휴대폰에서도 보이도록 만들어져 있습니다).
- 데이터 수집이 실패한 항목은 직전에 배포된 파일을 그대로 다시 씁니다. 수집 결과는 `api/_status.json` 에서 볼 수 있습니다.

## 직접 실행

```bash
npm ci
npm run data    # 공개 시세 수집 (인터넷 필요)
npm run dev     # 개발 서버
npm run build   # dist/ 에 정적 사이트 생성
```

⚠️ 투자 권유가 아닌 정보 제공 목적입니다. 데이터는 지연될 수 있으며 모든 투자 판단의 책임은 본인에게 있습니다.
