# Replit 앱 31개 정리 (2026-11-12 조사)

GitHub 보관판 목록: https://poianopks.github.io/apps/  ·  KOSPI 분석 센터: https://poianopks.github.io/cld_eco/

## A. Replit에 켜져 있는 앱 (17개)
| Replit 앱 | Replit 주소 | 응답 | GitHub 보관판 | 데이터 자동 갱신 |
|---|---|---|---|---|
| Stock Insights | stock-insights-pianopks1.replit.app | 200 | /cld_eco/ | ✅ 자체(야후·네이버) 1시간마다 |
| Real Time News | real-time-news.replit.app | 200 | /apps/real-time-news/ | ✅ Replit에서 하루 3번 |
| Erp Realtime Analysis | erp-realtime-analysis.replit.app | 200 | /apps/erp-realtime-analysis/ | ✅ 하루 3번 |
| Economic Forecast Hub | economic-forecast-hub.replit.app | 200 | /apps/economic-forecast-hub/ | ✅ 하루 3번 |
| Economic Insight Hub | economic-insight-hub.replit.app | 200 | /apps/economic-insight-hub/ | ✅ 하루 3번 |
| Stock Sense | stock-sense.replit.app | 첫 화면 404 (API는 정상) | /apps/stock-sense/ (4개 도구) | ✅ 하루 3번 |
| New Project Now (이격도) | new-project-now.replit.app | 200 | /apps/new-project-now/ | ✅ 하루 3번 |
| New Project (거시경제 온도계) | new-project-pianopks1.replit.app | 200 | /apps/new-project/ (+ market-cycle) | ✅ 하루 3번 |
| Stock Api Saver | stock-api-saver.replit.app | 200 | /apps/stock-api-saver/ | – |
| Stock Market Rise | stock-market-rise.replit.app | 200 | /apps/stock-market-rise/ | – |
| Stock Finder (Streamlit) | stock-finder.replit.app | 200 (느림) | /apps/stock-finder/ | ✅ Yahoo Finance에서 직접, 하루 3번 (Replit 불필요) |
| Startup Bootcamp | startup-bootcamp.replit.app | 200 | /apps/startup-bootcamp/ | 데이터 없음 |
| New Project Maker | new-project-maker-pianopks1.replit.app | 200 | /apps/new-project-maker/ | 데이터 없음 |
| Version Checker | version-checker.replit.app | 200 | /apps/version-checker/ | 데이터 없음 |
| Python Playtime | python-playtime--pianopks1.replit.app | 200 | /apps/python-playtime/ | 데이터 없음 |
| School Game Maker | school-game-maker.replit.app | 200 | /apps/school-game-maker/ | ✅ 주식 탐색기(kospi-screener)는 Yahoo에서 직접, 하루 3번 |
| HTML, CSS, JS (Static) (1) | html-css-js-static-1-pianopks1.replit.app | 200 (빈 화면) | /apps/html-css-js-static-1/ | 데이터 없음 |

## B. Replit에 한 번도 게시 안 된 앱 (14개) → GitHub에서는 모두 열림
Retlip Web Comparison, New Project Status, New Project Now (1), New Project Now (2), Momentum Reversion,
Login Method, AI Chatbot, 성실피아노 메모 앱, Mindfulness Meaning, Daily Goal Reminder, Replit Game Lessons,
Insight Navigator, New Project Insight, Stock Recommender

## C. 요금 판단
- Replit 게시(Autoscale)는 앱이 깨어 있는 시간·요청 수만큼 요금이 붙고, 앱마다 작은 기본료가 붙을 수 있음
  (정확한 금액은 replit.com → 계정 → Usage 에서 확인).
- GitHub Pages는 무료.
- 그래서 B의 14개는 Replit에 새로 게시하지 않고 GitHub 보관판을 "켜진 주소"로 씀 (추가 요금 0원).
- A 중 ✅ 7개(Stock Insights 제외)는 GitHub 데이터의 원본이므로 Replit에서 켜 둠.
- A 중 데이터가 없는 앱(Startup Bootcamp, New Project Maker, Version Checker, Python Playtime, HTML Static,
  Stock Api Saver, Stock Market Rise, School Game Maker, Stock Finder)과 Stock Insights는 GitHub로 대신할 수 있어
  Replit에서 꺼도 됨(요금 절약). 끄기는 Replit 사이트에서 본인만 할 수 있음.

## D. 자동 갱신 장치
- `.github/workflows/apps-refresh.yml` + `.github/scripts/refresh_apps.py`
- 평일 08:41 · 12:13 · 16:11, 토요일 09:23 (한국 시간)에 Replit API에서 받아 apps/ 데이터 교체
- 실패한 항목은 예전 데이터를 그대로 둠
- 주식 탐색기 2종은 `.github/scripts/refresh_stock_snapshots.py`가 Yahoo Finance에서 직접 받음 (Replit을 꺼도 됨)
