/* 장르피아노 장르 데이터 (그림 아이콘 + 멜로디 + 왼손반주) */
(function(){
"use strict";
/* ---------- 장르 아이콘 (SVG) ---------- */
var ICON={
classical:'<svg viewBox="0 0 64 64" fill="currentColor"><rect x="30" y="2" width="4" height="26" rx="1"/><circle cx="32" cy="4" r="3"/><ellipse cx="32" cy="30" rx="10" ry="9"/><ellipse cx="32" cy="46" rx="13" ry="13"/><path d="M26 40 q-2 4 0 8 M38 40 q2 4 0 8" stroke="#fff" stroke-width="1.6" fill="none"/><rect x="29" y="50" width="6" height="2" fill="#fff"/><line x1="6" y1="20" x2="58" y2="56" stroke="currentColor" stroke-width="2"/></svg>',
jazz:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M40 4 h6 v4 h-2 v30 a13 13 0 0 1 -26 0 v-8 h-4 v-5 h14 v5 h-4 v8 a6 6 0 0 0 12 0 V8 h-2z"/><circle cx="44" cy="16" r="2" fill="#fff"/><circle cx="44" cy="23" r="2" fill="#fff"/><circle cx="44" cy="30" r="2" fill="#fff"/><path d="M50 50 l4 -10 M54 54 l6 -8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
chanson:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 2 L35 18 L39 38 L48 60 H39 Q32 48 25 60 H16 L25 38 L29 18Z"/><rect x="24" y="36" width="16" height="3"/><rect x="27" y="18" width="10" height="2.5"/><path d="M50 10 a4 4 0 1 0 4 4 v-12 h6" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
canzone:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M4 38 Q32 52 60 30 Q58 46 32 48 Q12 48 4 38Z"/><path d="M58 30 l3 -6" stroke="currentColor" stroke-width="2.5"/><line x1="30" y1="10" x2="40" y2="58" stroke="currentColor" stroke-width="2"/><circle cx="26" cy="24" r="4"/><path d="M22 30 h8 l-1 12 h-6z"/><path d="M2 56 q6 -4 12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
trot:'<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="32" cy="14" r="11"/><path d="M24 10 h16 M23 15 h18 M24 20 h16" stroke="#fff" stroke-width="1.4"/><path d="M27 25 h10 l-2 18 h-6z"/><rect x="30" y="43" width="4" height="13"/><rect x="20" y="56" width="24" height="4" rx="2"/><path d="M50 8 l4 4 l6 -6 M6 28 l6 2 M8 18 l6 4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
folk:'<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="24" cy="44" r="15"/><circle cx="34" cy="31" r="11"/><circle cx="28" cy="38" r="4.5" fill="#fff"/><path d="M38 26 L56 6 l4 4 L42 30z"/><rect x="53" y="2" width="9" height="7" rx="2" transform="rotate(45 57 6)"/><path d="M16 50 l8 -8" stroke="#fff" stroke-width="2"/></svg>',
blues:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M30 6 a24 24 0 1 0 26 30 a18 18 0 1 1 -26 -30z"/><ellipse cx="40" cy="44" rx="6" ry="4.5" transform="rotate(-20 40 44)"/><rect x="44.5" y="20" width="2.6" height="24"/><path d="M47 20 q6 6 10 8 q-5 1 -10 -3z"/><path d="M8 58 h14 M26 58 h6" stroke="currentColor" stroke-width="2"/></svg>',
rock:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M36 2 L14 36 H29 L23 62 L50 24 H35 L44 2Z"/><path d="M4 12 l6 4 M2 26 h7 M56 44 l6 3 M54 56 l6 -2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
disco:'<svg viewBox="0 0 64 64" fill="currentColor"><line x1="32" y1="0" x2="32" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="34" r="22"/><g stroke="#fff" stroke-width="1.3" fill="none" opacity=".85"><ellipse cx="32" cy="34" rx="10" ry="22"/><line x1="32" y1="12" x2="32" y2="56"/><line x1="10" y1="34" x2="54" y2="34"/><path d="M13 23 h38 M13 45 h38"/></g><rect x="20" y="22" width="6" height="6" fill="#fff" opacity=".7"/><path d="M6 8 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2z M56 4 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5z"/></svg>',
country:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M2 36 Q6 46 32 46 Q58 46 62 36 Q54 40 48 38 L44 16 Q38 12 32 18 Q26 12 20 16 L16 38 Q10 40 2 36Z"/><path d="M17 34 Q32 40 47 34" stroke="#fff" stroke-width="2.4" fill="none"/><path d="M12 56 l8 -4 l8 4 l8 -4 l8 4 l8 -4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
pop:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 4 l8 17 l18 2 l-13 12 l4 18 l-17 -9 l-17 9 l4 -18 l-13 -12 l18 -2z"/><circle cx="26" cy="30" r="2.4" fill="#fff"/><circle cx="38" cy="30" r="2.4" fill="#fff"/><path d="M26 37 q6 5 12 0" stroke="#fff" stroke-width="2" fill="none"/><path d="M54 52 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2z"/></svg>',
hiphop:'<svg viewBox="0 0 64 64" fill="currentColor"><path d="M18 18 v-6 a4 4 0 0 1 4 -4 h20 a4 4 0 0 1 4 4 v6" fill="none" stroke="currentColor" stroke-width="3"/><rect x="2" y="18" width="60" height="38" rx="6"/><circle cx="17" cy="38" r="10" fill="#fff"/><circle cx="17" cy="38" r="5"/><circle cx="47" cy="38" r="10" fill="#fff"/><circle cx="47" cy="38" r="5"/><rect x="26" y="24" width="12" height="6" rx="1" fill="#fff"/><circle cx="29" cy="46" r="1.8" fill="#fff"/><circle cx="35" cy="46" r="1.8" fill="#fff"/></svg>'
};

/* ---------- 장르 데이터 ----------
 음표: "음이름:길이"  길이 w=4박 dh=3 h=2 dq=1.5 q=1 e=0.5  /  쉼표 "r:q"
 드럼(8분음표 칸 번호, 4/4는 0~7): k=킥(쿵) s=스네어(짝) h=하이햇(츠) */
var GENRES=[
{id:"classical",name:"클래식",en:"Classical",color:"#8a5cf6",one:"웅장하고 섬세한 연주",
 easy:"수백 년 전 유럽의 작곡가들(베토벤, 모차르트 등)이 만든 음악이에요. 악보에 적힌 대로 정확하고 아름답게 연주하는 것이 중요해요. 오케스트라처럼 여러 악기가 함께 웅장하게, 때로는 피아노 한 대로 섬세하게 연주해요.",
 like:"잘 꾸민 궁전을 천천히 걸어 다니는 느낌",
 listen:["작게(p) ↔ 크게(f) 바뀌는 부분 찾기","멜로디가 계단처럼 올라가고 내려가요","드럼이 거의 없어요"],
 tip:"레손 곡은 베토벤 〈환희의 송가〉예요. 오른손 엄지(1)를 '도'에 두고 손가락 1~5로 도레미파솔을 쳐요. 한 음 한 음 고르게!",
 bpm:90,energy:2,sig:4,swing:false,inst:"피아노·바이올린·오케스트라",beatText:"4/4 고른 박",
 bars:[["E4:q","E4:q","F4:q","G4:q"],["G4:q","F4:q","E4:q","D4:q"],["C4:q","C4:q","D4:q","E4:q"],["E4:dq","D4:e","D4:h"]],
 drums:{k:[],s:[],h:[]}},
{id:"jazz",name:"재즈",en:"Jazz",color:"#e8a317",one:"즉흥연주와 자유로운 리듬",
 easy:"미국 뉴올리언스에서 시작된 음악이에요. 연주자가 그 자리에서 멜로디를 새로 만들어 내는 '즉흥연주'가 가장 큰 특징이에요. '스윙' 리듬으로 통통 튀듯 연주해요.",
 like:"친구와 대화하듯 서로 주고받으며 노는 느낌",
 listen:["8분음표가 '따-안 따'처럼 길고 짧게 들려요(스윙)","시♭ 같은 검은 건반 소리가 멋을 내요","심벌이 '칭- 치키 칭' 하고 울려요"],
 tip:"8분음표 두 개를 '따-안 따' (길게-짧게) 쳐요. 시♭(Bb)은 '라'와 '시' 사이 검은 건반이에요.",
 bpm:110,energy:3,sig:4,swing:true,inst:"색소폰·트럼펫·피아노·콘트라베이스",beatText:"4/4 스윙",
 bars:[["C4:e","E4:e","G4:e","A4:e","Bb4:e","A4:e","G4:e","E4:e"],["F4:q","A4:e","C5:e","r:q","G4:q"],["C4:e","E4:e","G4:e","A4:e","Bb4:e","A4:e","G4:e","E4:e"],["C5:h","r:h"]],
 drums:{k:[0,4],s:[2,6],h:[0,2,3,4,6,7]}},
{id:"chanson",name:"샹송",en:"Chanson",color:"#e8457a",one:"프랑스 감성의 이야기 노래",
 easy:"'샹송'은 프랑스 말로 '노래'라는 뜻이에요. 사랑, 추억, 거리 풍경 같은 이야기를 시처럼 들려주는 노래예요. 아코디언 소리와 '쿵짝짝' 왈츠 박자가 잘 어울려요.",
 like:"파리 카페에서 누군가 조용히 이야기를 들려주는 느낌",
 listen:["가사(이야기)가 가장 중요해요","아코디언 '뮈제트 왈츠'(3박자 쿵짝짝) 스타일이 유명해요","아코디언 소리가 멋을 더해요"],
 tip:"3/4박자예요. '하나 둘 셋'으로 세고 첫 박 '하나'를 조금 더 무겁게 쳐요. 점2분음표는 3박을 꼭 채워요.",
 bpm:120,energy:2,sig:3,swing:false,inst:"아코디언·기타·목소리",beatText:"3/4 왈츠",
 bars:[["E4:h","G4:q"],["F4:h","A4:q"],["G4:q","F4:q","E4:q"],["D4:dh"]],
 drums:{k:[0],s:[],h:[2,4]}},
{id:"canzone",name:"칸초네",en:"Canzone",color:"#16a3a3",one:"이탈리아의 낭만적 대중가요",
 easy:"이탈리아의 대중가요예요. 〈오 솔레 미오〉, 〈산타 루치아〉처럼 목소리를 크고 길게 뽑아 노래하는 것이 특징이에요. 햇살 가득한 바다처럼 밝고 낭만적이에요.",
 like:"이탈리아 나폴리 바닷가에서 배를 타고 노래하는 느낌",
 listen:["음을 길~게 늘이며 노래해요","'점4분음표+8분음표' 출렁이는 리듬","만돌린·기타 반주"],
 tip:"점4분음표(1박 반)는 길게, 뒤의 8분음표는 살짝. '따-아 따' 하고 노래하듯 이어서 쳐요.",
 bpm:84,energy:2,sig:4,swing:false,inst:"목소리·만돌린·기타",beatText:"4/4 노래하듯",
 bars:[["G4:dq","A4:e","G4:q","E4:q"],["F4:dq","G4:e","F4:h"],["E4:dq","F4:e","E4:q","C4:q"],["D4:w"]],
 drums:{k:[0,4],s:[],h:[2,6]}},
{id:"trot",name:"트로트",en:"Trot",color:"#e0413a",one:"꺾는 창법과 흥겨운 리듬",
 easy:"우리나라에서 오래 사랑받은 대중가요예요. 이름은 춤곡 '폭스트롯'에서 왔어요. 목소리를 '꺾어서' 부르는 창법과 '쿵짝 쿵짝' 2박자 리듬이 특징이에요. 잔치나 축제에서 모두 함께 박수 치며 즐겨요.",
 like:"동네 잔치에서 할머니, 할아버지와 손뼉 치는 느낌",
 listen:["'쿵짝 쿵짝' 반복되는 2박자 계통 리듬","목소리를 꺾는 창법","요나누키 5음 음계(단조: 라·시·도·미·파 / 장조: 도·레·미·솔·라)"],
 tip:"단조 트로트에서 많이 쓰는 '라·시·도·미·파' 다섯 음(요나누키 단음계)으로 만든 연습 멜로디예요. '쿵'(1·3박)에 발을 구르며 '짝'(2·4박)에 손뼉을 쳐 보세요.",
 bpm:120,energy:4,sig:4,swing:false,inst:"목소리·전자오르간·드럼",beatText:"4/4 쿵짝",
 bars:[["A4:dq","B4:e","C5:q","E5:q"],["F5:dq","E5:e","C5:h"],["B4:q","C5:e","B4:e","A4:q","E4:q"],["A4:w"]],
 drums:{k:[0,4],s:[2,6],h:[1,3,5,7]}},
{id:"folk",name:"포크",en:"Folk",color:"#9b6b3c",one:"기타와 함께 부르는 이야기",
 easy:"통기타 하나 들고 우리 생활 이야기를 소박하게 부르는 노래예요. 화려하지 않고, 누구나 따라 부를 수 있도록 멜로디가 쉬워요.",
 like:"캠핑장 모닥불 앞에서 다 같이 부르는 노래",
 listen:["통기타 '다운-다운업' 스트로크","쉬운 멜로디와 이야기 가사","조용하고 따뜻해요"],
 tip:"'쿵 짝짝' (4분음표 + 8분음표 두 개)이 기타를 치는 손 모양과 같아요. 손목을 부드럽게!",
 bpm:100,energy:2,sig:4,swing:false,inst:"통기타·하모니카·목소리",beatText:"4/4 스트로크",
 bars:[["C4:q","C4:e","D4:e","E4:q","E4:e","F4:e"],["G4:h","E4:h"],["F4:q","F4:e","E4:e","D4:q","D4:e","E4:e"],["C4:w"]],
 drums:{k:[0,4],s:[],h:[0,2,3,4,6,7]}},
{id:"blues",name:"블루스",en:"Blues",color:"#2f6fd6",one:"슬픔을 깊게 풀어낸 음악",
 easy:"미국 남부의 흑인들이 힘든 마음을 노래로 풀어낸 음악이에요. 'Blue'는 영어로 '우울한'이라는 뜻도 있어요. 재즈·록·팝의 할아버지 같은 음악이에요.",
 like:"비 오는 날 창밖을 보며 마음속 이야기를 털어놓는 느낌",
 listen:["'블루노트'(미♭, 솔♭)의 쓸쓸한 소리","느린 셔플(스윙) 리듬","12마디가 반복되는 구조"],
 tip:"블루스 음계: 도·미♭·파·솔♭·솔·시♭. 검은 건반을 섞어 쳐요. 8분음표는 재즈처럼 '따-안 따'로!",
 bpm:72,energy:2,sig:4,swing:true,inst:"기타·하모니카·피아노",beatText:"4/4 셔플",
 bars:[["C4:e","Eb4:e","F4:e","Gb4:e","G4:h"],["Bb4:q","G4:q","Eb4:q","C4:q"],["C4:e","Eb4:e","F4:e","Gb4:e","G4:q","Bb4:q"],["C5:h","r:h"]],
 drums:{k:[0,4],s:[2,6],h:[0,1,2,3,4,5,6,7]}},
{id:"rock",name:"록",en:"Rock",color:"#3b3b46",one:"기타·드럼이 강하게 터진다",
 easy:"전기기타, 베이스, 드럼이 크고 힘차게 연주하는 음악이에요. 블루스에서 나왔지만 훨씬 빠르고 강해요. 공연장에서 다 같이 뛰며 즐겨요.",
 like:"천둥번개처럼 '쾅!' 에너지가 터지는 느낌",
 listen:["드럼 '쿵-짝!'이 아주 커요","전기기타의 지글지글한 소리","8분음표를 똑같이 '다다다다' 반복"],
 tip:"8분음표를 쉬지 않고 같은 세기로 '다다다다' 쳐요. 손목을 작고 단단하게, 박자는 절대 흔들리지 않게!",
 bpm:120,energy:5,sig:4,swing:false,inst:"전기기타·베이스·드럼",beatText:"4/4 8비트",
 bars:[["E4:e","E4:e","E4:e","E4:e","G4:e","G4:e","A4:e","A4:e"],["E4:e","E4:e","E4:e","E4:e","D4:e","D4:e","C4:q"],["E4:e","E4:e","E4:e","E4:e","G4:e","G4:e","A4:e","A4:e"],["B4:q","A4:q","E4:h"]],
 drums:{k:[0,3,4],s:[2,6],h:[0,1,2,3,4,5,6,7]}},
{id:"disco",name:"디스코",en:"Disco",color:"#c43fd6",one:"춤추기 좋은 신나는 반복 리듬",
 easy:"1970년대 춤추는 클럽(디스코텍)에서 유행한 음악이에요. 큰북이 '쿵 쿵 쿵 쿵' 모든 박에 울려서 저절로 몸이 움직여요. 베이스가 '도-높은도' 옥타브로 통통 뛰어요.",
 like:"반짝이는 미러볼 아래에서 춤추는 느낌",
 listen:["'쿵 쿵 쿵 쿵' 네 박 모두 큰북(포 온 더 플로어)","하이햇 '츠' 가 박 사이에","옥타브로 뛰는 베이스"],
 tip:"엄지(1)와 새끼손가락(5)으로 낮은 도와 높은 도를 번갈아 쳐요(옥타브). 손을 활짝 펴서 '통통' 튀어요.",
 bpm:116,energy:5,sig:4,swing:false,inst:"베이스·드럼·현악기·신시사이저",beatText:"4/4 포온더플로어",
 bars:[["C4:e","C5:e","C4:e","C5:e","C4:e","C5:e","C4:e","C5:e"],["F4:e","F5:e","F4:e","F5:e","F4:e","F5:e","F4:e","F5:e"],["G4:e","G5:e","G4:e","G5:e","G4:e","G5:e","G4:e","G5:e"],["C4:e","C5:e","C4:e","C5:e","C5:h"]],
 drums:{k:[0,2,4,6],s:[2,6],h:[1,3,5,7]}},
{id:"country",name:"컨트리",en:"Country",color:"#d9822b",one:"기타와 삶의 이야기 중심",
 easy:"미국 시골(농장, 목장)에서 생겨난 음악이에요. 가족, 고향, 일하는 하루 같은 삶의 이야기를 기타와 바이올린(피들)으로 경쾌하게 노래해요.",
 like:"카우보이 모자를 쓰고 넓은 들판을 말 타고 달리는 느낌",
 listen:["'붐-칙 붐-칙' 베이스와 화음이 번갈아","밴조·피들의 경쾌한 소리","기차가 달리는 듯한 박자"],
 tip:"'붐'(낮은 음)–'칙'(높은 음)을 번갈아 쳐요. 도-솔-미-솔처럼 한 손으로 왔다 갔다!",
 bpm:110,energy:3,sig:4,swing:false,inst:"통기타·밴조·피들",beatText:"4/4 붐칙",
 bars:[["C4:q","G4:q","E4:q","G4:q"],["F4:q","C5:q","A4:q","C5:q"],["G4:q","B4:q","D5:q","B4:q"],["C5:h","C4:h"]],
 drums:{k:[0,4],s:[2,6],h:[0,1,2,3,4,5,6,7]}},
{id:"pop",name:"팝",en:"Pop",color:"#ff6b9a",one:"누구나 쉽게 듣는 대중음악",
 easy:"'Popular(인기 있는)'에서 온 말로, 많은 사람이 쉽게 즐기는 대중음악이에요. 한 번 들으면 흥얼거리게 되는 '후렴'이 있어요. K-POP도 팝의 한 종류예요!",
 like:"라디오에서 나오면 나도 모르게 따라 부르게 되는 노래",
 listen:["귀에 쏙 들어오는 후렴(훅)","박자를 살짝 당기는 '싱코페이션'","3~4분 정도의 짧은 노래"],
 tip:"'1-&' 의 &(그리고)에서 음이 시작되는 '당김음'이 있어요. 8분음표 다음 4분음표를 '따 따-안' 하고 쳐요.",
 bpm:100,energy:4,sig:4,swing:false,inst:"목소리·신시사이저·드럼",beatText:"4/4 당김음",
 bars:[["E4:e","G4:q","G4:e","E4:q","D4:q"],["C4:h","r:q","C4:q"],["E4:e","G4:q","A4:e","G4:q","E4:q"],["D4:w"]],
 drums:{k:[0,3,4],s:[2,6],h:[0,1,2,3,4,5,6,7]}},
{id:"hiphop",name:"힙합",en:"Hip-hop",color:"#2bb673",one:"랩과 비트로 말을 들려준다",
 easy:"미국 뉴욕에서 생겨난 음악이에요. 노래 대신 리듬에 맞춰 말하듯 하는 '랩'과 반복되는 '비트'가 주인공이에요. 쉬는 박자(쉼표)를 멋지게 쓰는 게 포인트!",
 like:"비트 위에서 친구에게 내 이야기를 리듬감 있게 들려주는 느낌",
 listen:["'붐-뱁' 묵직한 드럼 비트","랩(말하듯 리듬)","쉼표로 생기는 '틈'이 멋"],
 tip:"쉼표에서는 손을 건반에서 살짝 들어요. 쉬는 것도 연주! 고개를 끄덕이며 박을 느껴요.",
 bpm:88,energy:4,sig:4,swing:false,inst:"드럼머신·턴테이블·랩",beatText:"4/4 붐뱁",
 bars:[["C4:q","r:e","C4:e","Eb4:q","r:q"],["C4:e","C4:e","Eb4:e","F4:e","G4:q","r:q"],["C4:q","r:e","C4:e","Eb4:q","r:q"],["G4:e","F4:e","Eb4:q","C4:h"]],
 drums:{k:[0,3,5],s:[2,6],h:[0,1,2,3,4,5,6,7]}}
];


/* ---------- 왼손반주 (장르 리듬) ----------
 패턴 기호: 1=근음(쿵) 5L=아래 5음(쿵) T=화음(짝) 3·5·6·b7·8=화음 안의 음(띵) 1+5=두 음 같이 r=쉼표
 prog=마디마다 화음, L[0]=1단계(쉬움) L[1]=2단계(장르 느낌), pat 여러 개면 마디마다 번갈아 */
var LH={
classical:{prog:["C","G","C","G"],L:[
 {name:"분산화음",desc:"화음(도미솔)을 한 번에 누르지 않고 '근음-5음-3음-5음' 하나씩 펼쳐서 쳐요. 피아노 소나타에서 많이 써요.",pat:["1:q 5:q 3:q 5:q"]},
 {name:"알베르티 베이스",desc:"모차르트가 즐겨 쓴 반주! '도솔미솔 도솔미솔' 8분음표로 잔잔하게 흘러요.",pat:["1:e 5:e 3:e 5:e 1:e 5:e 3:e 5:e"]}]},
jazz:{prog:["C7","F","C7","C"],L:[
 {name:"워킹 베이스",desc:"베이스가 걸어가듯 한 박에 한 음씩 '근음-3음-5음-6음'으로 움직여요. 스윙 느낌으로!",pat:["1:q 3:q 5:q 6:q"]},
 {name:"찰스턴 리듬",desc:"'짝—(1박 반)—짝!' 하고 두 번째를 짧게 당겨 쳐요. 재즈 피아노의 대표 반주 리듬이에요.",pat:["T:dq T:e r:h"]}]},
chanson:{prog:["C","F","C","G"],L:[
 {name:"왈츠 쿵짝짝",desc:"1박에 낮은 근음 '쿵', 2·3박에 화음 '짝짝'. 아코디언 왈츠 느낌이에요.",pat:["1:q T:q T:q"]},
 {name:"교대 베이스 왈츠",desc:"'쿵'을 마디마다 근음 ↔ 아래 5음으로 바꿔 쳐서 더 출렁여요.",pat:["1:q T:q T:q","5L:q T:q T:q"]}]},
canzone:{prog:["C","F","C","G"],L:[
 {name:"긴 화음",desc:"근음 2박, 화음 2박을 길게 눌러요. 노래를 넓게 받쳐 주는 바다 같아요.",pat:["1:h T:h"]},
 {name:"물결 아르페지오",desc:"'근음-5음-옥타브-5음-3음-5음-근음' 물결처럼 펼쳐서 만돌린처럼 흘러요.",pat:["1:e 5:e 8:e 5:e 3:e 5:e 1:q"]}]},
trot:{prog:["Am","F","E7","Am"],L:[
 {name:"쿵짝 쿵짝",desc:"근음 '쿵' – 화음 '짝'을 반복해요. 트로트의 심장 박동!",pat:["1:q T:q 1:q T:q"]},
 {name:"교대 쿵짝",desc:"'쿵'을 근음과 아래 5음으로 번갈아 '쿵짝 쿵짝'. 전자오르간 반주 느낌이에요.",pat:["1:q T:q 5L:q T:q"]}]},
folk:{prog:["C","C","G","C"],L:[
 {name:"핑거 피킹",desc:"기타 줄을 하나씩 튕기듯 '근음-5음-옥타브-5음'으로 쳐요.",pat:["1:q 5:q 8:q 5:q"]},
 {name:"스트럼 쿵 짝짝",desc:"화음을 '짝 짝짝 짝 짝짝' 기타를 쓸어내리듯 쳐요.",pat:["T:q T:e T:e T:q T:e T:e"]}]},
blues:{prog:["C7","F7","C7","C7"],L:[
 {name:"블루스 2음 베이스",desc:"'근음+5음', '근음+6음'을 번갈아 '둥-당 둥-당'. 블루스·로큰롤의 기본이에요.",pat:["1+5:q 1+6:q 1+5:q 1+6:q"]},
 {name:"부기우기 셔플",desc:"5음→6음→♭7음→6음으로 올라갔다 내려와요. 스윙으로 '따-안 따'!",pat:["1+5:e 1+5:e 1+6:e 1+6:e 1+b7:e 1+b7:e 1+6:e 1+6:e"]}]},
rock:{prog:["Em","C","Em","Em"],L:[
 {name:"8비트 근음",desc:"근음 하나를 8분음표로 '다다다다' 쉬지 않고! 록 베이스의 기본이에요.",pat:["1:e 1:e 1:e 1:e 1:e 1:e 1:e 1:e"]},
 {name:"파워코드",desc:"근음+5음 두 개를 같이 '다다다다'. 전기기타 파워코드 소리예요.",pat:["1+5:e 1+5:e 1+5:e 1+5:e 1+5:e 1+5:e 1+5:e 1+5:e"]}]},
disco:{prog:["C","F","G","C"],L:[
 {name:"포 온 더 플로어",desc:"모든 박에 근음 '쿵 쿵 쿵 쿵'. 춤추는 발걸음이에요.",pat:["1:q 1:q 1:q 1:q"]},
 {name:"옥타브 베이스",desc:"낮은 근음과 한 옥타브 위 근음을 '통통' 번갈아. 디스코 베이스의 상징!",pat:["1:e 8:e 1:e 8:e 1:e 8:e 1:e 8:e"]}]},
country:{prog:["C","F","G","C"],L:[
 {name:"붐 … 붐",desc:"근음 2박, 아래 5음 2박. 천천히 걷는 말발굽 소리예요.",pat:["1:h 5L:h"]},
 {name:"붐칙 붐칙",desc:"근음 '붐' – 화음 '칙' – 아래 5음 '붐' – 화음 '칙'. 컨트리의 대표 반주예요.",pat:["1:q T:q 5L:q T:q"]}]},
pop:{prog:["C","Am","F","G"],L:[
 {name:"블록 화음",desc:"화음을 2박씩 '쾅— 쾅—'. 발라드·팝의 가장 쉬운 반주예요.",pat:["T:h T:h"]},
 {name:"3-3-2 당김 리듬",desc:"'짝--짝--짝-' 1박 반, 1박 반, 1박. 요즘 팝·K-POP에서 아주 많이 써요.",pat:["T:dq T:dq T:q"]}]},
hiphop:{prog:["Cm","Cm","Ab","Cm"],L:[
 {name:"쿵 쉬고",desc:"근음 '쿵', 한 박 쉬고 또 '쿵'. 쉼표가 비트를 만들어요.",pat:["1:q r:q 1:q r:q"]},
 {name:"붐뱁 베이스",desc:"킥 드럼처럼 '쿵—(&)쿵 . (&)쿵'. 힙합 비트에 딱 맞는 베이스예요.",pat:["1:dq 1:e r:e 1:e r:q"]}]}
};
GENRES.forEach(function(g){g.lh=LH[g.id];});
window.GENRES=GENRES;window.ICON=ICON;
})();
