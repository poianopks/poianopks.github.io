# Aside(GPD) → 클라우드 Claude — 2026-11-14

**녹턴 20번 PDF 확인 완료 — 이미 올라가 있음 (커밋 f261f6cf, LG 그램 Aside)**
- GPD Aside도 같은 부탁을 받아 IMSLP에서 #1005676(1875 Benicke 초판, PD)과 #921410(1830 쇼팽 자필본, PD)을 받아 봤어요.
- _scores/nocturne20/ 에 있는 파일과 바이트 크기가 똑같아서(665,719 / 7,162,310) 중복으로 올리지 않았어요.
- _scores/nocturne20/ 의 PDF 3개 + SOURCE.md 로 바로 nocturne20.html 레슨 작업을 시작하시면 돼요.
- 참고: 사장님 네이버 블로그에 「특허 왕초보 교실」 글도 발행했어요 (https://m.blog.naver.com/pianopks/224476529877, AI·컴퓨터 활용).

---

# Aside → 클라우드 Claude — 2026-11-14

**녹턴 20번 PDF 올림 (커밋 f261f6cf)** — _scores/nocturne20/ 에 1875 Benicke 초판(PD) + 1830 쇼팽 자필본(PD) + 참고용 Gouin 2006 조판(CC BY-SA). 자세한 출처는 SOURCE.md. robots.txt·sitemap.xml은 건드리지 않았어요.

---

# Aside → 클라우드 Claude Code — 2026-11-13 (3) 부탁 처리 완료

1. "문의"(/contact.html) 링크 추가 완료 (커밋 deb078a4)
   - 첫 화면 index.html: 바닥글 + "조율사 소개" 옆에 "문의·상담 안내"
   - about.html, stories 5개, 예전 tips 3개(moving-checklist·used-piano·silent-piano): 위 메뉴 + 바닥글
2. 서치콘솔
   - sitemap.xml 다시 제출 (상태는 아직 "가져올 수 없음" 표시, 며칠 뒤 확인)
   - 색인 요청 7개 모두 "색인 생성 요청됨": contact, what-is-tuning, humidity-seasons, piano-symptoms, piano-care-cleaning, upright-vs-grand, digital-vs-acoustic
3. Stock Finder Replit 게시 취소 완료 (11/13), replit-status.html 갱신 (켜짐 3 · 끔 14)
4. 11/27 10:00 재심사 준비 점검 루틴 그대로

---
# Aside(LG 노트북) → 클라우드 Claude Code 전달 — 2026-11-13

## 1. 구글 애드센스 거절 이유 (애드센스 화면에서 직접 확인)
- 사이트: poianopks.github.io
- 상태: **주의 필요 · 정책 위반 "가치가 별로 없는 콘텐츠"** (최종 업데이트 2026-11-06 07:34 KST)
- 애드센스 안내 원문 요지: 광고 게재를 위해 사이트가 *충분한 고유 가치*를 제공하고, *꾸준히 운영*되며, *실제 사용자 관심*을 받는다는 것을 보여야 함.
  - 신뢰할 수 있는 고품질 정보·도구·서비스 제공
  - 지속적인 콘텐츠 큐레이션과 구조 유지관리
  - 실제 사용자 관심 유도·유지
- Ads.txt 상태: "찾을 수 없음"으로 표시(11/6 기준). 지금 /ads.txt 는 200으로 있음 → 다음 심사 때 반영 예상.
- 다른 항목: stock-insights-pianopks1.replit.app "검토 필요"(9/29) — Replit 앱은 꺼짐.
- 서치콘솔: /sitemap.xml 이 11/2 부터 "가져올 수 없음" 상태였음.

## 2. Aside가 11/13에 한 일 (지우지 말아 주세요)
- 새 페이지: /about.html, /stories/ (현장 이야기 4편), /tips/ (피아노 상식 3편), 첫 화면·메뉴 연결
- robots.txt: Googlebot에서 /apps/, /cld_eco/, 백업·중복 파일(gen*, manus_*, *_bak*, test/ 등) **Disallow** (Mediapartners-Google 은 전체 Allow).
  → 자동 데이터·중복 페이지가 "가치 낮음" 판정 원인일 가능성이 커서 검색에서만 뺌. 파일은 그대로, 주소로는 열림.
- sitemap.xml: 62개 → 28개로 정리(apps·cld_eco 제외, 새 페이지 추가) 후 서치콘솔에 다시 제출, about·stories 색인 요청.
- 애드센스 "검토 요청"은 아직 안 누름. 2026-11-27 10:00 에 색인 상태 점검 후 요청 예정.

## 3. 부탁
1) GitHub Actions 자동 갱신이 robots.txt / sitemap.xml 을 **덮어쓰지 않게** 해 주세요. (자동으로 만드는 스크립트가 있으면 apps·cld_eco 를 넣지 않도록)
2) 사장님 방침: **메인은 피아노조율 유지**, 경제(cld_eco)는 승인 뒤 다시 검색 노출 검토.
3) 승인 뒤 cld_eco 를 다시 검색에 넣을 때는 자동 숫자만이 아니라 사람이 쓴 해설 글을 붙이는 쪽을 추천.
