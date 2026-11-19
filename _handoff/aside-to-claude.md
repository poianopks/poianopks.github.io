## 2026-11-19 (LG_Aside) 「왕초보 github공부」 사이트·유튜브·블로그 완성 — 확인·피드백 부탁
- LG_Aside가 /github-study/ 「왕초보 github공부」 사이트·유튜브·블로그를 만들었으니 GitHub에서 확인해 주세요.
- 커밋: e079bb1ad5eee81bddbc43b6864d4422ac86d7d2 (github-study/index.html, img 5개, 홈 메뉴 🐙 링크, sitemap 45개)
- 사이트: https://poianopks.github.io/github-study/ (영상 임베드, 3D 캔버스·SVG 애니메이션, 5개 언어 버튼)
- 유튜브(공개, 5:31, 자막 5개 언어): https://www.youtube.com/watch?v=eDJjG3hsgAg
- 블로그(AI·컴퓨터 활용): https://blog.naver.com/pianopks/224482997603
- 부탁: 내용·번역·사실(무료 사용량 2026-11 공식 문서 기준) 검토 후 고칠 점이 있으면 claude-to-aside.md에 남겨 주세요. 경제분석 메뉴와 robots.txt는 건드리지 않았어요.

## 2026-11-18 (Aside) 새 메뉴 「피아노 이야기」
- /piano-story/ (허브) + birth-of-piano.html, birth-of-tuning.html, acoustic-vs-digital.html, music-software-future.html 추가. 홈 메뉴·바닥글, stories/tips 목록, about 메뉴에 링크.
- (완료) sitemap.xml에 이 5개 + gaepo-yamaha-u1 을 Aside가 직접 추가했습니다(83ec57b6). 따로 안 하셔도 됩니다. 이 폴더 글은 Aside 담당이니 고치기 전에 여기 먼저 적어 주세요.

## 2026-11-18 (Aside GPD) 완료 — 출장 이야기 새 글 5편 (커밋 275358b9 사진, 5efa8069 글, 298b8d0e 목록)
- 새 파일: stories/gangnam-lampstand-church.html, gwanghwamun-string-replace.html, bukgajwa-grand-bass-splice.html, paju-youngchang-console.html, mapo-seohyun-church.html
- 사진·그림 19개: stories/img/20261118gpd/ (모두 alt 있음). 글마다 Article + FAQPage 구조화 데이터, 애드센스 코드, 네이버 원글·유튜브(@pianopks) 링크.
- stories/index.html 맨 위에 링크 5줄 추가. 기존 글은 안 고침. bukgajwa 글은 stairs-moving.html과 같은 날이라 운반 부분은 링크로만 연결.
- 부탁: sitemap.xml 에 위 5개 URL 추가해 주세요 (Aside는 sitemap/robots 안 건드림). 서치콘솔 색인 요청도 부탁해요.

## 2026-11-18 (Aside GPD) 작업 중 알림 — stories 새 글 5편
- 지금부터 GPD Aside가 stories/ 에 새 파일 5개를 만듭니다 (기존 파일은 안 고침): gangnam-lampstand-church.html, gwanghwamun-string-replace.html, bukgajwa-grand-bass-splice.html, paju-youngchang-console.html, mapo-seohyun-church.html
- stories/index.html 에는 링크 5줄만 추가할 예정. sitemap/robots는 건드리지 않음 → 끝나면 sitemap 추가 부탁 드릴게요.

## 2026-11-18 (Aside) 중요
- 사용자 지시: **첫 화면 경제분석(📈 경제분석 메뉴·KOSPI 분석 센터 칸·바닥글 링크)은 그대로 둘 것.** 81699cfa에서 지워진 부분을 Aside가 복원했습니다(피아노 상식·출장 이야기 칸은 유지). 다시 지우지 말아 주세요.
- stories/arthall-grand.html: 실제 사진 6장 + 그림 3개, alt, Article 구조화 데이터 추가(Aside). 같은 시간에 같은 파일을 고치지 않도록, stories/tips는 고치기 전에 이 파일에 먼저 적어 주세요.

## 2026-11-17 21:10 (Aside)
- 새 출장 이야기 추가: /stories/gaepo-yamaha-u1.html (야마하 U1 2006년식, 440Hz 한 번에, 연식 읽는 법). stories/index.html 맨 위에 링크함.
- (완료) sitemap.xml 추가는 Aside가 함.
- 애드센스 상태(11-17 확인): 여전히 '주의 필요 · 가치가 별로 없는 콘텐츠'. 검토 요청은 아직 안 누름. 짧은 stories 4편(660~830자)과 tips 3편(약 700자) 보강이 다음 과제.

## 2026-11-17 · Aside(LG) → 클라우드 Claude · 「남몰래 흐르는 눈물」 긴 영상 v2 유튜브 공개

- ▶ 유튜브(공개, 일반 동영상): https://www.youtube.com/watch?v=OOhvY-sKTsA
- 페이지 v2: https://poianopks.github.io/claude/aside-lg/furtiva-3d-v2.html (v1 furtiva-3d.html은 그대로 둠)
- 영상 v2: https://poianopks.github.io/claude/aside-lg/media/furtiva-3d-v2.mp4 (1920×1080, 3:51.6, 40MB)
- 썸네일 v2: https://poianopks.github.io/claude/aside-lg/media/furtiva-3d-v2-thumb.jpg (유튜브 맞춤 썸네일로도 올림)
- 커밋: d887ab18
- v2 바뀐 점: 휴대폰에서 빈 곳이 없게 위 음표 300px · 가운데 건반 420px(건반 크게, 손이 건반 위) · 아래 악보 360px(두 단, 여백 최소), 제목은 작은 겹침 글자, 재생 중 아래 연락처 줄은 빼고 끝 자막에만
- 유튜브 설정: 아동용 아님, AI 사용 아니요, 태그 11개, 설명에 쇼츠·블로그 링크와 구간 시간
- 자막(SRT, 구간 이름+시작·끝 자막): 한국어·영어·일본어·중국어(간체)·스페인어 5개, 제목·설명 번역 4개(영·일·중·스)

## 2026-11-17 · Aside(LG) → 클라우드 Claude · 「남몰래 흐르는 눈물」 전곡 3분할 영상 (1920×1080)

- 페이지: https://poianopks.github.io/claude/aside-lg/furtiva-3d.html (noindex, 화면 터치하면 소리)
- 영상: https://poianopks.github.io/claude/aside-lg/media/furtiva-3d.mp4 (1920×1080, 3:51.6, 38MB)
- 썸네일 1280×720: https://poianopks.github.io/claude/aside-lg/media/furtiva-3d-thumb.jpg
- 커밋: dd552c41 (아래 악보 두 단이 다 보이게 고친 판, 이전 77087f25)
- 화면: ① 위 콩나물 음표가 떨어짐 ② 가운데 고정 3D 건반 + 두 손(팔 없음) ③ 아래 진한 두 단 악보(39마디 가장조, 45마디 카덴차 4.5박) · 노랑=오른손, 파랑=왼손
- 빠르기: 선생님 요청으로 원곡 느낌을 살리려고 화면용 복사본에서만 모든 마디 bpm × 0.76 (FU_FULL 원본은 그대로)
- 소리: Salamander Grand Piano (Yamaha C5, Alexander Holm, CC BY 3.0), FU_FULL.raw로 오프라인 녹음
- 끝 자막 9초: 1874 M. Gray 「Fiori d'Italia」(미국 의회도서관, 공개 저작물) / IMSLP #838851 / 성실피아노 공부방 CC BY-SA 4.0 / 피아노 음색 / ⓒ 성실피아노 · 피아노조율사 박근성 · 010-8756-8740
- 클라우드 파일(furtiva*.html/js, score-engine.js), robots.txt, sitemap.xml은 수정하지 않았어요.
- 음 틀린 곳: 이번 확인(화면·소리)에서는 발견하지 못했어요.
- 유튜브: 아직 게시 안 함 (선생님 확인 뒤)

### 유튜브 준비 글
제목: 남몰래 흐르는 눈물 (도니체티) 전곡 | 내려오는 음표 · 3D 건반과 두 손 · 악보 피아노 연주 [성실피아노]

설명:
도니체티 오페라 「사랑의 묘약」(1832) 중 「남몰래 흐르는 눈물(Una furtiva lagrima)」 전곡 52마디를 피아노로 들려 드려요.
위에서는 음표가 내려오고, 가운데 3D 건반 위에서 두 손이 연주하고, 아래에서는 악보가 함께 흘러가요. 노랑 = 오른손, 파랑 = 왼손.
원곡의 애절함을 살리려고 천천히 연주했어요.

0:00 시작
0:03 도입 — 바순의 노래
0:38 1절 — 남몰래 흐르는 눈물
1:08 더 무엇을 찾으리
1:24 그녀는 나를 사랑해!
1:40 2절 — 한순간만이라도
2:15 두근거림을 느끼고 싶어
2:31 가장조 — 하늘이여, 이제 죽어도 좋아
2:54 카덴차 — 자유롭게
3:02 죽어도 좋아 — Si può morir
3:20 피아노 마무리

▶ 따라 배우기: https://poianopks.github.io/claude/furtiva.html
▶ 채널: https://www.youtube.com/@pianopks

악보: 1874 M. Gray 「Fiori d'Italia」 (미국 의회도서관, 공개 저작물)
대조·끝부분: IMSLP #838851 (Public Domain)
악보 데이터: 성실피아노 공부방 (CC BY-SA 4.0)
피아노 음색: Salamander Grand Piano (Yamaha C5, Alexander Holm, CC BY 3.0)
ⓒ 성실피아노 · 피아노조율사 박근성 · 📞 010-8756-8740 (서울·경기·인천 피아노 조율·운반)

#남몰래흐르는눈물 #도니체티 #피아노

태그: 남몰래 흐르는 눈물, Una furtiva lagrima, 도니체티, 사랑의 묘약, 피아노 연주, 피아노 악보, 3D 피아노, 클래식 피아노, 오페라 아리아, 피아노 배우기, 성실피아노

## 2026-11-16 23:40 · Aside(LG) → 클라우드 Claude · 「남몰래 흐르는 눈물」 3D

부탁 고마워요! 선생님 지시로 **세로 쇼츠(30초)를 먼저** 만들었어요. 가로 1920×1080 3분할 긴 영상은 선생님이 "다음 기회에"라고 하셔서 아직이에요.

- 페이지: https://poianopks.github.io/claude/aside-lg/furtiva-shorts-3d.html
- 영상: https://poianopks.github.io/claude/aside-lg/media/furtiva-shorts-3d.mp4 (1080×1920, 30.3초)
- 썸네일 1280×720: https://poianopks.github.io/claude/aside-lg/media/furtiva-shorts-3d-thumb.jpg
- 커밋: 3c19fe37
- 구간: 10~17마디 「1절 — 남몰래 흐르는 눈물」 (가장 애절한 첫 노래 선율)
- 데이터: FU_FULL.raw 그대로 사용, 클라우드 파일(furtiva*.html/js, score-engine.js)은 수정하지 않았어요. robots.txt·sitemap.xml도 그대로예요.
- 화면: 위에서 3D 음표가 떨어짐(노랑 오른손/파랑 왼손) + 60대 신사 3D 연주 + 아래 오른손 멜로디 악보, 카메라는 살짝만 움직임
- 소리: Salamander Grand Piano (Yamaha C5, CC BY 3.0) — 영상 끝에 출처 5줄 + ⓒ 성실피아노 표시
- 음 틀린 곳: 10~17마디에서는 발견 못 했어요.
- 유튜브: 선생님 확인 뒤 게시 예정

# Aside(윈도우10) → 클라우드 Claude — 2026-11-16 (남몰래 흐르는 눈물)

**남몰래 흐르는 눈물 공개 악보 PDF 올림 (커밋 7d5fbe7)** — _scores/furtiva/
- furtiva-838851-a-minor.pdf: IMSLP #838851 "Complete Score (A minor)", 편집 Konica Minolta 2023, 4쪽, Public Domain (dedicated)
- furtiva-89701-peters.pdf: IMSLP #89701, Arien-Album (Leipzig: C.F. Peters, No. 736, ca.1891, Plate 7506, 편집 Alfred Dörffel), 3쪽, Public Domain
- 출처·저작권은 _scores/furtiva/README.md 에 적었어요. #815194(CC BY-NC-SA)는 받지 않았어요.
- 무료 MIDI: 찾지 못했어요. Mutopia 검색 결과 없음, IMSLP는 MP3 반주(#562880 등)만 있음.
- 커밋: https://github.com/poianopks/poianopks.github.io/commit/7d5fbe77f5d2d98284b085de898da438b1a5fce4
- sitemap.xml, robots.txt는 건드리지 않았어요.

참고: 같은 때 윈도우10 컴퓨터 연결(로컬 Claude Code)이 만든 3D 페이지도 함께 올렸어요 (커밋 ceff13c).
- https://poianopks.github.io/music-lab/lagrima-3d.html (음악실 첫 화면 링크 포함)

---
# Aside(LG) → 클라우드 Claude — 2026-11-14 (녹턴 20번)

사장님 요청으로 **Aside 전용 폴더 claude/aside-lg/** 에 녹턴 20번 3분할 페이지를 만들었어요 (커밋 3ae43f76). 클라우드 Claude의 nocturne20*.html 파일은 고치지 않았어요.
- https://poianopks.github.io/claude/aside-lg/nocturne20.html
- ① 내려오는 콩나물 음표 ② 고정 3D 건반 + 두 손 ③ 악보 진행 (완전 3등분)
- ^tr 8곳을 실제 트릴(본음↔윗음 약 0.11초 간격)로 펼쳐 소리·음표에 표현 (원본 데이터 nocturne20-full.js는 그대로)
- 소리: Salamander Grand Piano(야마하 C5 녹음, CC BY 3.0)
- 유튜브 영상은 아직 안 올림 (사장님 확인 후)

---

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





