/* 리스트 「초절기교 연습곡」 공부 레슨 — 12곡 지도 · MIDI 건반 재생기 · 9단계 기초 연습
   소리: Salamander Grand Piano (CC BY 3.0) → 실패하면 기본 소리
   MIDI(4·5·8번): Bernd Krueger, piano-midi.de (CC BY-SA 3.0 DE) */
(function(){
"use strict";
var $=function(i){return document.getElementById(i);},ME=window.ME,SE=window.SE,SAL=window.SAL;
var basicPiano=ME.piano,salOn=false;
function useSal(){if(salOn||!SAL)return Promise.resolve();var ms=[];for(var m=24;m<=108;m+=3)ms.push(m);
  return SAL.load(ms).then(function(k){if(k==="salamander"||k==="ydp"){salOn=true;ME.piano=function(m,t,d,v){SAL.note(m,t,d,v);};}});}

/* ---------- 12곡 ---------- */
var ET=[
 {no:1,fr:"Preludio",ko:"프렐류디오(전주곡)",key:"다장조",tempo:"Presto (아주 빠르게)",st:3,tech:"펼친화음 · 빠른 음계 내려오기",
  say:"12곡 문을 여는 짧은 '준비 운동'. 첫 마디부터 높은 도에서 낮은 도까지 화음을 폭포처럼 내려와요. 2쪽밖에 안 되지만 손 전체를 깨워요."},
 {no:2,fr:"(Molto vivace)",ko:"2번 (별명: 불꽃)",key:"가단조",tempo:"Molto vivace (아주 생기 있게)",st:5,tech:"손 교대 · 겹음 · 도약",
  say:"제목이 없는 곡이라 '불꽃(Fusées)'이라는 별명으로 불려요. 두 손이 번갈아 튀어 오르며 짧은 불꽃을 터뜨려요."},
 {no:3,fr:"Paysage",ko:"풍경",key:"바장조",tempo:"Poco adagio (조금 느리게)",st:3,tech:"노래하는 멜로디 · 화음 레가토",
  pay:1,say:"12곡 중 가장 평화로운 곡. 시골 들판을 바라보듯 '아주 부드럽게, 한 줄로(una corda)' 시작해요. 기교보다 '노래'를 배우는 곡이에요."},
 {no:4,fr:"Mazeppa",ko:"마제파",key:"라단조",tempo:"Allegro (빠르게)",st:5,tech:"3도 겹음 · 옥타브 · 손 교대",
  yt:"https://youtu.be/tfjVMODnXUo",say:"빅토르 위고의 시에서 온 이야기. 말에 묶인 채 초원을 끝없이 달리는 우크라이나 영웅 마제파를 그려요. 두 손이 3도 화음으로 멜로디를 힘차게 이어 가며, 말발굽처럼 쉬지 않고 달려요.",midi:1},
 {no:5,fr:"Feux follets",ko:"도깨비불",key:"내림나장조",tempo:"Allegretto (조금 빠르게)",st:5,tech:"반음계 겹음 · 가벼운 손가락",
  say:"밤 늪지에서 나타났다 사라지는 작은 불빛. 오른손이 아주 가볍게 반음계 겹음을 굴려요. 12곡 중 가장 어렵다고 하는 피아니스트가 많아요.",midi:1},
 {no:6,fr:"Vision",ko:"환상",key:"사단조",tempo:"Lento (느리게)",st:4,tech:"넓은 펼친화음 · 무거운 화음",
  say:"느리고 장엄한 장송 행진 같은 곡. 왼손의 넓은 펼친화음 위로 오른손 화음이 무겁게 울려요."},
 {no:7,fr:"Eroica",ko:"영웅",key:"내림마장조",tempo:"Allegro (빠르게)",st:4,tech:"행진 리듬 · 옥타브",
  say:"영웅의 행진. 처음엔 자유로운 서주(카덴차)로 시작해서 당당한 행진곡이 나와요."},
 {no:8,fr:"Wilde Jagd",ko:"사냥",key:"다단조",tempo:"Presto furioso (미친 듯 빠르게)",st:5,tech:"옥타브 도약 · 엇박 리듬",
  say:"밤하늘을 달리는 유령 사냥꾼 무리의 전설. 왼손 옥타브가 말발굽처럼 뛰고, 중간에는 사냥 나팔 같은 밝은 노래가 나와요.",midi:1},
 {no:9,fr:"Ricordanza",ko:"회상",key:"내림가장조",tempo:"Andantino (조금 느리게)",st:4,tech:"장식음 · 노래하는 선율",
  say:"작곡가 부소니는 이 곡을 '빛바랜 연애편지 묶음'이라고 했어요. 오래된 추억을 꺼내 읽듯 부드럽게 노래해요."},
 {no:10,fr:"(Allegro agitato molto)",ko:"10번 (별명: 열정)",key:"바단조",tempo:"Allegro agitato molto (매우 흥분해서)",st:5,tech:"화음 연타 · 두 손 엇갈림",
  say:"제목은 없지만 '열정(Appassionata)'이라는 별명으로 불리는 불타는 곡. 끝없이 몰아치는 화음과 엇갈리는 손이 특징이에요."},
 {no:11,fr:"Harmonies du soir",ko:"저녁의 선율",key:"내림라장조",tempo:"Andantino (조금 느리게)",st:4,tech:"종소리 화음 · 넓은 펼친화음",
  say:"해 질 녘 멀리서 들려오는 종소리. 아주 조용히 시작해 온 건반을 울리는 큰 종소리로 커졌다가 다시 고요해져요."},
 {no:12,fr:"Chasse-neige",ko:"눈보라",key:"내림나단조",tempo:"Andante con moto (걷듯이, 움직임 있게)",st:5,tech:"트레몰로 · 반음계",
  say:"끝없이 휘날리는 눈보라. 오른손 트레몰로(빠른 떨림)가 처음부터 끝까지 이어지며 점점 거세져요. 12곡을 닫는 곡이에요."}
];
function stars(n){return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n);}
(function(){var box=$("etList");if(!box)return;
  box.innerHTML=ET.map(function(e){
    return '<div class="card et" id="et'+e.no+'"><div class="ethead"><span class="etno">'+e.no+'</span><div><b>'+e.ko+'</b><small>'+e.fr+' · '+e.key+'</small></div><span class="sstar" title="난이도">'+stars(e.st)+'</span></div>'+
      '<img loading="lazy" src="media/liszt/e'+(e.no<10?"0":"")+e.no+'.jpg" alt="'+e.no+'번 '+e.ko+' 첫 줄 악보 (20세기 초 브라이트코프 판, 공개 저작물)">'+
      '<p>'+e.say+'</p><p class="small">⏱ '+e.tempo+' · 🖐 '+e.tech+'</p>'+
      (e.yt?'<a class="btn alt" style="text-decoration:none;display:inline-block;margin:8px 6px 0 0" href="'+e.yt+'" target="_blank" rel="noopener">📺 3D 영상 (유튜브)</a>':'')+(e.pay?'<button class="btn" data-pay="1">▶ 첫 6마디 악보로 듣기</button>':'')+(e.midi?'<button class="btn" data-go="'+e.no+'">▶ 건반으로 들어 보기</button>':e.pay?'':'<p class="small" style="opacity:.75">🎧 소리 자료 준비 중 — 악보 사진으로 살펴봐요</p>')+'</div>';}).join("");
  box.addEventListener("click",function(ev){if(ev.target.closest("[data-pay]")){$("paysage").scrollIntoView({behavior:"smooth",block:"start"});return;}var b=ev.target.closest("[data-go]");if(!b)return;openPiece(+b.dataset.go,0,true);});
})();

/* ---------- MIDI 건반 재생기 ---------- */
var cv=$("lzCanvas"),cx=cv?cv.getContext("2d"):null,PIECE=null,NOTES=[],SPD=1,HANDS="RL";
var playing=false,startAt=0,pos=0,sched=0,iv=0,raf=0,loaded={};
var LO=21,HI=108;function isB(m){return [1,3,6,8,10].indexOf(m%12)>=0;}
var WX={},nW=0;(function(){for(var m=LO;m<=HI;m++)if(!isB(m)){WX[m]=nW++;}for(m=LO;m<=HI;m++)if(isB(m))WX[m]=WX[m-1]+.68;})();
function loadPiece(no){if(loaded[no])return loaded[no];
  loaded[no]=new Promise(function(res,rej){var s=document.createElement("script");s.src="js/liszt/no"+no+".js?v=20261120";s.onload=function(){res(window.LZ[no]);};s.onerror=rej;document.head.appendChild(s);});
  return loaded[no];}
function prep(d){/* 페달 고려한 소리 길이 */
  var ped=d.ped||[],out=[];
  function pedEnd(t){var down=false,i;for(i=0;i<ped.length&&ped[i][0]<=t;i++)down=ped[i][1]===1;if(!down)return t;for(;i<ped.length;i++)if(ped[i][1]===0)return ped[i][0];return t+1.5;}
  d.notes.forEach(function(n){var e=n[0]+n[1];out.push({t:n[0],d:n[1],sd:Math.min(pedEnd(e)-n[0],n[1]+4),m:n[2],h:n[3],v:n[4]});});
  return out;}
function openPiece(no,at,scroll){
  stop();$("lzNow").textContent="불러오는 중…";
  [].forEach.call(document.querySelectorAll("#lzPick button"),function(b){b.classList.toggle("on",+b.dataset.p===no);});
  if(scroll)$("player").scrollIntoView({behavior:"smooth",block:"start"});
  return loadPiece(no).then(function(d){PIECE=d;NOTES=prep(d);pos=at||0;draw(pos);info();});}
function songTime(){return playing?(ME.now()-startAt)*SPD:pos;}
function info(){if(!PIECE)return;var t=songTime(),b=0;while(b<PIECE.bars.length-1&&PIECE.bars[b+1]<=t)b++;
  $("lzNow").textContent=PIECE.no+"번 「"+(ET[PIECE.no-1].ko)+"」 · 마디 "+(b+1)+" / "+PIECE.bars.length+" · "+fmt(t)+" / "+fmt(PIECE.dur);
  $("lzProg").style.width=(100*t/PIECE.dur)+"%";}
function fmt(s){s=Math.max(0,s);return Math.floor(s/60)+":"+("0"+Math.floor(s%60)).slice(-2);}
function play(){if(!PIECE)return;ME.ac();
  useSal().then(function(){if(playing)return;
    playing=true;startAt=ME.now()+.1-pos/SPD;sched=0;while(sched<NOTES.length&&NOTES[sched].t<pos-.01)sched++;
    $("lzPlay").textContent="⏸ 멈춤";$("lzPlay").classList.add("live");
    iv=setInterval(pump,50);pump();loop();});}
function pump(){var t=songTime(),ahead=t+.5*SPD,now=ME.now();
  while(sched<NOTES.length&&NOTES[sched].t<ahead){var n=NOTES[sched++];if(HANDS.indexOf(n.h)<0)continue;
    var when=startAt+n.t/SPD;if(when<now-.05)continue;ME.piano(n.m,Math.max(when,now),Math.max(.08,n.sd/SPD),Math.min(.9,.25+n.v*.6));}
  if(t>PIECE.dur+1){stop();pos=0;draw(0);info();}}
function stop(){if(playing){pos=songTime();}playing=false;clearInterval(iv);cancelAnimationFrame(raf);
  if($("lzPlay")){$("lzPlay").textContent="▶ 재생";$("lzPlay").classList.remove("live");}}
function loop(){if(!playing)return;var t=songTime();draw(t);info();raf=requestAnimationFrame(loop);}
function draw(t){if(!cx)return;var W=cv.clientWidth,H=cv.clientHeight,dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  cx.setTransform(dpr,0,0,dpr,0,0);var kh=Math.round(Math.min(110,W/nW*5.2)),fh=H-kh,kw=W/nW,win=2.6*SPD;
  var g=cx.createLinearGradient(0,0,0,fh);g.addColorStop(0,"#0b1030");g.addColorStop(1,"#1d1450");cx.fillStyle=g;cx.fillRect(0,0,W,fh);
  /* 마디선 */
  if(PIECE){cx.strokeStyle="rgba(255,255,255,.12)";cx.lineWidth=1;PIECE.bars.forEach(function(bt){var y=fh-(bt-t)/win*fh;if(y>0&&y<fh){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}});}
  var down={};
  for(var i=0;i<NOTES.length;i++){var n=NOTES[i];if(n.t>t+win)break;if(n.t+n.d<t-.05)continue;
    var y1=fh-(n.t-t)/win*fh,y0=fh-(n.t+n.d-t)/win*fh,x=WX[n.m]*kw,w=isB(n.m)?kw*.62:kw-1,on=HANDS.indexOf(n.h)>=0;
    cx.fillStyle=n.h==="R"?(on?"#ffd166":"rgba(255,209,102,.25)"):(on?"#6ec3ff":"rgba(110,195,255,.25)");
    var yy=Math.max(0,y0),hh=Math.min(fh,y1)-yy;if(hh>0){cx.beginPath();if(cx.roundRect)cx.roundRect(x+.5,yy,w,Math.max(2,hh),3);else cx.rect(x+.5,yy,w,Math.max(2,hh));cx.fill();}
    if(n.t<=t&&t<n.t+n.d)down[n.m]=n.h;}
  /* 건반 */
  for(var m=LO;m<=HI;m++)if(!isB(m)){var h=down[m];cx.fillStyle=h==="R"?"#ffd166":h==="L"?"#6ec3ff":"#f7f4ec";cx.fillRect(WX[m]*kw,fh,kw-1,kh);
    if(m%12===0&&kw>9){cx.fillStyle="#555";cx.font="bold "+Math.min(11,kw*.8)+"px sans-serif";cx.textAlign="center";cx.fillText("C"+(m/12-1),WX[m]*kw+kw/2,fh+kh-5);}}
  for(m=LO;m<=HI;m++)if(isB(m)){h=down[m];cx.fillStyle=h==="R"?"#e0a92c":h==="L"?"#3a8fd6":"#141218";cx.fillRect(WX[m]*kw,fh,kw*.62,kh*.62);}
  cx.fillStyle="#c21f35";cx.fillRect(0,fh-2,W,3);
  if(!PIECE){cx.fillStyle="#cfd8ff";cx.font="bold 16px sans-serif";cx.textAlign="center";cx.fillText("위에서 곡을 고르세요",W/2,fh/2);}}
if(cv){
  $("lzPick").addEventListener("click",function(e){var b=e.target.closest("button[data-p]");if(b)openPiece(+b.dataset.p,0);});
  $("lzPlay").addEventListener("click",function(){if(playing)stop();else play();});
  $("lzRew").addEventListener("click",function(){var was=playing;stop();pos=0;draw(0);info();if(was)play();});
  $("lzSpeed").addEventListener("change",function(){var was=playing;stop();SPD=+this.value;if(was)play();else draw(pos);});
  $("lzHands").addEventListener("change",function(){var was=playing;stop();HANDS=this.value;if(was)play();else draw(pos);});
  $("lzBar").addEventListener("click",function(){if(!PIECE)return;var n=Math.max(1,Math.min(PIECE.bars.length,+$("lzBarN").value||1)),was=playing;stop();pos=PIECE.bars[n-1];draw(pos);info();if(was)play();});
  $("lzProgBar").addEventListener("click",function(e){if(!PIECE)return;var r=this.getBoundingClientRect(),was=playing;stop();pos=PIECE.dur*(e.clientX-r.left)/r.width;draw(pos);info();if(was)play();});
  addEventListener("resize",function(){if(!playing)draw(pos);});
  draw(0);
}


/* ---------- 3번 「풍경」 첫 6마디 (브라이트코프 판 8쪽에서 옮김) ---------- */
(function(){var el=$("payScore");if(!el)return;
  var R=[["r:dh"],["r:dh"],["r:dh"],["r:q","r:e","A4+A5:dq~"],["A4+A5:dq","Bb4+Bb5:q","C5+C6:e"],["D5+D6:q","F5+F6:e","E5+E6:q","G5+G6:e"]];
  var L=[["F3+C4+F4+A4:e","C4:e","F4+A4:e","E4+G4:e","D4+F4:e","F3:e"],["F3+D4+F4:e","C4+E4:e","Bb3+D4:e","F3:e","Bb3+D4:e","A3+C4:e"],
         ["Ab3+B3:e","G3:e","D3+F3:e","Db3+F3+Bb3:e","C3+E3:e","E3+G3+C4:e"],["F3+A3:e","F3:e","F4+A4:e","E4+G4:e","D4+F4:e","F3:e"],
         ["F3+D4+F4:e","C4+E4:e","Bb3+D4:e","F3:e","Bb3+D4:e","A3+C4:e"],["Ab3+B3:e","G3:e","D3+F3:e","Db3+F3+Bb3:e","C3+E3:e","E3+G3+C4:e"]];
  var secs=["","","","멜로디 시작","",""];
  function bars(){return R.map(function(_,i){return {sig:3,key:-1,bpm:87,ts:"6/8",sec:i===0?"전주 — 왼손만":i===3?"오른손 멜로디":""};});}
  var Ri=SE.parseBars(R),Li=SE.parseBars(L),done=false;
  function draw(){if(done)return;done=true;
    SE.render(el,{staves:[{clef:"treble",items:Ri,prefix:"PR",labels:true,ott:true},{clef:"bass",items:Li,prefix:"PL",labels:true}],bars:bars(),startBar:1});
    var ms={};Ri.concat(Li).forEach(function(it){(it.notes||[]).forEach(function(x){ms[x.midi]=1;});});SE.drawKb($("payKb"),Object.keys(ms).map(Number));}
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){draw();io.disconnect();}});io.observe(el);}else draw();
  [].forEach.call(document.querySelectorAll("[data-ph]"),function(b){b.addEventListener("click",function(){draw();stop();var h=b.dataset.ph,parts=[];
    if(h.indexOf("R")>=0)parts.push({items:Ri,prefix:"PR",vel:.55,light:true});if(h.indexOf("L")>=0)parts.push({items:Li,prefix:"PL",vel:.3,light:true});
    useSal().then(function(){SE.play([{el:el,bars:bars(),parts:parts,kb:$("payKb")}],{btn:b,mul:+$("paySpeed").value});});});});
})();
/* ---------- 9단계 기초 연습 ---------- */
var STEPS=[
 {t:"손가락 깨우기 — 다섯 손가락 굴리기",st:1,bpm:80,go:[1,0],
  goal:"도·레·미·파·솔을 16분음표로 고르게. 초절기교의 모든 빠른 음은 이 '고른 손가락'에서 시작해요.",
  tips:["손가락 번호 1-2-3-4-5-4-3-2. 손목은 힘을 빼고 가만히.","처음엔 메트로놈 60으로, 4번·5번 손가락 소리가 작아지지 않게."],
  R:[["C4:s","D4:s","E4:s","F4:s","G4:s","F4:s","E4:s","D4:s","C4:s","D4:s","E4:s","F4:s","G4:s","F4:s","E4:s","D4:s"],["C4:w"]],L:[["C3:w"],["C3+G3:w"]]},
 {t:"폭포처럼 내려오기 — C7 펼친화음 (1번 프렐류디오 첫 마디)",st:2,bpm:72,go:null,img:1,
  goal:"높은 도에서 도·시♭·솔·미로 화음을 타고 내려와요. 프렐류디오 첫 마디의 '폭포'를 아주 짧게 줄인 연습이에요.",
  tips:["엄지가 손가락 밑으로 지나가지 말고, 손 전체를 한 덩어리로 왼쪽으로 옮겨요.","도착하는 도(2분음표)를 크게, 내려오는 음은 점점 작게."],
  R:[["C6:s","Bb5:s","G5:s","E5:s","C5:s","Bb4:s","G4:s","E4:s","C4:h"],["F4+A4+C5:w"]],L:[["C2+C3:w"],["F2+F3:w"]]},
 {t:"반음씩 걸어 올라가기 — 왼손 반음계 (프렐류디오 2마디)",st:2,bpm:72,go:null,img:1,
  goal:"왼손이 파·파♯·솔·솔♯·라·시♭·시로 반음씩 걸어 올라가요. 프렐류디오 2마디 왼손 그대로예요.",
  tips:["검은 건반(♯·♭)은 건반 안쪽, 흰 건반은 앞쪽을 눌러 손이 앞뒤로 덜 움직이게.","한 음 한 음 '짧게 끊어서(스타카토)' 쳐 봐요."],
  R:[["F4+A4+C5:h","F4+A4+C5:h"],["E4+G4+C5:w"]],L:[["F2:e","F#2:e","G2:e","G#2:e","A2:q","Bb2:e","B2:e"],["C3:w"]]},
 {t:"두 음 함께 노래하기 — 3도 레가토 (3번 풍경·4번 마제파)",st:3,bpm:66,go:[4,0],
  goal:"도+미, 레+파 … 두 음(3도)을 함께 누르며 이어 가요. 풍경의 부드러운 화음, 마제파의 무서운 3도가 모두 여기서 시작해요.",
  tips:["손가락 짝: 1+3 → 2+4 → 3+5 를 돌려 써요.","두 음이 '동시에' 소리 나는지 귀로 확인. 한 음이 늦으면 아주 느리게!"],
  R:[["C4+E4:e","D4+F4:e","E4+G4:e","F4+A4:e","G4+B4:e","A4+C5:e","B4+D5:e","C5+E5:e"],["B4+D5:e","A4+C5:e","G4+B4:e","F4+A4:e","E4+G4:e","D4+F4:e","C4+E4:q"]],L:[["C3:w"],["G2:h","C3:h"]]},
 {t:"같은 음 빠르게 — 손가락 바꿔 치기 (4번 마제파·8번 사냥)",st:3,bpm:60,go:[8,0],
  goal:"같은 솔을 손가락 4-3-2-1 순서로 바꿔 가며 빠르게 쳐요. 한 손가락으로 치면 금방 굳어요.",
  tips:["건반이 다 올라오기 전에 다음 손가락이 살짝 눌러요.","손목을 높이 들지 말고, 손가락 끝으로 '긁듯이'."],
  R:[["G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s"],["G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:s","G4:q"]],L:[["C3+G3:w"],["C3+G3:w"]]},
 {t:"도깨비불 걸음 — 반음계 겹음 (5번 도깨비불)",st:4,bpm:54,go:[5,0],
  goal:"두 음을 함께 반음씩 올라갔다 내려와요. 도깨비불의 오른손이 바로 이 모양을 아주 가볍고 빠르게 쳐요.",
  tips:["처음엔 아주 느리게, 두 음이 같이 떨어지는지만 봐요.","빨라질수록 '세게'가 아니라 '가볍게'. 건반 위를 스치듯."],
  R:[["C5+E5:s","C#5+F5:s","D5+F#5:s","D#5+G5:s","E5+G#5:s","F5+A5:s","F#5+A#5:s","G5+B5:s","F#5+A#5:s","F5+A5:s","E5+G#5:s","D#5+G5:s","D5+F#5:s","C#5+F5:s","C5+E5:s","B4+D5:s"],["C5+E5:w"]],L:[["C3:w"],["C3+G3:w"]]},
 {t:"옥타브로 달리기 — 손목 튕기기 (8번 사냥)",st:4,bpm:66,go:[8,0],
  goal:"엄지와 새끼로 옥타브(8도)를 잡고 음계를 올라갔다 내려와요. 사냥의 말발굽 소리가 옥타브예요.",
  tips:["손가락이 아니라 '손목'을 가볍게 튕겨서.","손 모양(1과 5 사이 간격)을 고정하고 팔째로 옮겨요. 아프면 바로 쉬어요!"],
  R:[["C4+C5:e","D4+D5:e","E4+E5:e","F4+F5:e","G4+G5:e","A4+A5:e","B4+B5:e","C5+C6:e"],["B4+B5:e","A4+A5:e","G4+G5:e","F4+F5:e","E4+E5:e","D4+D5:e","C4+C5:q"]],L:[["C3:w"],["G2:h","C3:h"]]},
 {t:"두 손 번갈아 — 손 교대 (4번 마제파·2번)",st:4,bpm:72,go:[4,0],
  goal:"왼손 옥타브 → 오른손 화음 → 왼손 → 오른손… 두 손이 탁구처럼 번갈아 쳐요. 한 사람이 치는데도 소리가 끊김 없이 꽉 차게 들려요.",
  tips:["한 손씩 따로 먼저: 오른손은 엇박(2·4번째 8분음표)만.","합칠 때는 '쿵-짝-쿵-짝' 소리 내어 세면서."],
  R:[["r:e","C5+E5+G5:e","r:e","C5+E5+G5:e","r:e","B4+D5+G5:e","r:e","B4+D5+G5:e"],["r:e","C5+E5+G5:e","r:e","C5+E5+G5:e","C5+E5+G5:h"]],
  L:[["C3+C4:e","r:e","C3+C4:e","r:e","G2+G3:e","r:e","G2+G3:e","r:e"],["C3+C4:e","r:e","C3+C4:e","r:e","C2+C3:h"]]},
 {t:"온 건반을 울리기 — 넓은 펼친화음 (11번 저녁의 선율·6번 환상)",st:5,bpm:60,go:null,img:11,
  goal:"왼손이 낮은 도에서 시작해 오른손이 높은 도까지 이어 받아요. 저녁의 선율의 큰 종소리, 환상의 넓은 펼침이 이렇게 온 건반을 써요.",
  tips:["오른발 페달을 마디 처음에 밟고 마디 끝에서 바꿔요.","왼손 마지막 음과 오른손 첫 음이 끊기지 않게 '바통 터치'."],
  R:[["r:q","G4:s","C5:s","E5:s","G5:s","C6:h"],["r:q","C5:s","F5:s","A5:s","C6:s","F6:h"]],L:[["C2:s","G2:s","C3:s","E3:s","r:dh"],["F2:s","C3:s","F3:s","A3:s","r:dh"]]}
];
(function(){var box=$("stepList");if(!box)return;
  box.innerHTML=STEPS.map(function(s,i){var n=i+1;
    return '<details class="card step"'+(i===0?" open":"")+'><summary><span class="snum">'+n+'</span><span class="stitle">'+s.t+'</span><span class="sstar">'+stars(s.st)+'</span></summary><div class="sbody">'+
      '<p class="tip">🎯 '+s.goal+'</p><div class="score" id="sc'+n+'"></div><div class="kb" id="kb'+n+'"></div>'+
      '<div class="ctrls"><button class="btn" data-sp="'+n+'" data-h="RL">▶ 양손</button><button class="btn alt" data-sp="'+n+'" data-h="R">오른손만</button><button class="btn alt" data-sp="'+n+'" data-h="L">왼손만</button>'+
      '<label class="chk">빠르기 <select id="sv'+n+'"><option value="0.5">🐌 아주 느리게</option><option value="0.75" selected>🐢 느리게</option><option value="1">🎵 보통</option></select></label>'+
      (s.go?'<button class="btn alt" data-go="'+s.go[0]+'">🎧 '+s.go[0]+'번에서 실제로 들어 보기</button>':'')+'</div>'+
      (s.img?'<p class="small" style="margin:8px 0 2px">📜 실제 악보 ('+s.img+'번 첫 줄)</p><img class="mini" loading="lazy" src="media/liszt/e'+(s.img<10?"0":"")+s.img+'.jpg" alt="'+s.img+'번 실제 악보">':'')+
      '<ul class="tips">'+s.tips.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></div></details>';}).join("");
  var drawn={};
  function render(n){var s=STEPS[n-1];if(drawn[n])return drawn[n];
    var R=SE.parseBars(s.R),L=SE.parseBars(s.L),bars=s.R.map(function(){return {sig:4,key:0,bpm:s.bpm};});
    SE.render($("sc"+n),{staves:[{clef:"treble",items:R,prefix:"R"+n+"-",labels:true,ott:true},{clef:"bass",items:L,prefix:"L"+n+"-",labels:true}],bars:bars,startBar:1});
    var ms={};R.concat(L).forEach(function(it){(it.notes||[]).forEach(function(x){ms[x.midi]=1;});});SE.drawKb($("kb"+n),Object.keys(ms).map(Number));
    drawn[n]={R:R,L:L};return drawn[n];}
  [].forEach.call(box.querySelectorAll("details.step"),function(d,i){if(d.open)render(i+1);d.addEventListener("toggle",function(){if(d.open)render(i+1);});});
  box.addEventListener("click",function(ev){var g=ev.target.closest("[data-go]");if(g){openPiece(+g.dataset.go,0,true);return;}
    var b=ev.target.closest("[data-sp]");if(!b)return;var n=+b.dataset.sp,s=STEPS[n-1],v=render(n),h=b.dataset.h,mul=+$("sv"+n).value;
    stop();var parts=[];if(h.indexOf("R")>=0)parts.push({items:v.R,prefix:"R"+n+"-",vel:.5,light:true});if(h.indexOf("L")>=0)parts.push({items:v.L,prefix:"L"+n+"-",vel:.4,light:true});
    var bars=s.R.map(function(){return {sig:4,key:0,bpm:s.bpm};});
    useSal().then(function(){SE.play([{el:$("sc"+n),bars:bars,parts:parts,kb:$("kb"+n)}],{btn:b,mul:mul,countIn:true});});});
})();
})();
