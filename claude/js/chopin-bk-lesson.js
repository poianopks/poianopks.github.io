/* 쇼팽 「흑건」 공부 교실 — 전곡 움직이는 악보 · 떨어지는 음표 건반 · 8단계 레슨
   악보·소리 자료: window.BK (Mutopia, 퍼블릭 도메인) · 음색: Salamander Grand Piano (CC BY 3.0) */
(function(){
"use strict";
var $=function(i){return document.getElementById(i);},ME=window.ME,SE=window.SE,SAL=window.SAL,BK=window.BK;
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}
var salOn=false;
function useSal(){if(salOn||!SAL)return Promise.resolve();var ms=[];for(var m=30;m<=102;m+=3)ms.push(m);
  return SAL.load(ms).then(function(k){if(k==="salamander"||k==="ydp"){salOn=true;ME.piano=function(m,t,d,v){SAL.note(m,t,d,v);};}});}
var BARS=BK.bars.map(function(b){return {sig:b.sig,key:b.key,bpm:b.bpm,sec:b.sec};});
var SECS={};BK.bars.forEach(function(b,i){if(b.sec)SECS[i+1]=b.sec;});

/* ---------- 조표: 검은 건반 다섯 개 ---------- */
(function(){var el=$("scaleBk");if(!el)return;
  var R=SE.parseBars([["Gb4:e","Ab4:e","Bb4:e","Db5:e"],["Eb5:e","Db5:e","Bb4:e","Ab4:e"],["Gb4:h"]]),bars=[0,1,2].map(function(){return {sig:2,key:-6,bpm:96};});
  var draw=function(){SE.render(el,{staves:[{clef:"treble",items:R,prefix:"SB",labels:true}],bars:bars,startBar:1});};
  draw();addEventListener("resize",debounce(draw,200));
  $("scaleBkPlay").onclick=function(){var b=this;useSal().then(function(){SE.play([{el:el,bars:bars,parts:[{items:R,prefix:"SB",vel:.5,light:true}],kb:$("scaleBkKb")}],{btn:b});});};
  SE.drawKb($("scaleBkKb"),[66,68,70,73,75]);
})();

/* ---------- 전곡 움직이는 악보 ---------- */
(function(){
  var fs=$("fullScore");if(!fs)return;
  var R=SE.parseBars(BK.rh),L=SE.parseBars(BK.lh),drawn=false;
  var draw=function(){SE.render(fs,{staves:[{clef:"treble",items:R,prefix:"FR",labels:true,ott:true},{clef:"bass",items:L,prefix:"FL",labels:true}],bars:BARS,startBar:1});drawn=true;};
  var ensure=function(){if(!drawn)draw();};
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){ensure();io.disconnect();}},{rootMargin:"600px"});io.observe(fs);}else ensure();
  addEventListener("resize",debounce(function(){if(drawn&&!(SE.cur()&&SE.cur().chunks[0].el===fs))draw();},250));
  var kb=ME.keyboard(36,103,{kw:22,kh:110});
  $("fullKb").innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:760px">'+kb.svg+'</svg>';
  var go=function(btn,mode,fromBar){ensure();stopPl();
    var parts=[];if(mode!=="L")parts.push({items:R,prefix:"FR",vel:.42,light:true});if(mode!=="R")parts.push({items:L,prefix:"FL",vel:mode==="L"?.4:.26,light:true});
    useSal().then(function(){SE.play([{el:fs,bars:BARS,parts:parts,kb:$("fullKb")}],{btn:btn,mul:+$("fullSpeed").value,fromBar:fromBar,scrollBox:fs,
      onBar:function(b){$("fullNow").textContent=(b+1)+" / "+BARS.length+"마디"+(SECS[b+1]?" · "+SECS[b+1]:"")+(b===65?" · ⚪ 유일한 흰 건반!":"");}});});};
  [].forEach.call(document.querySelectorAll("[data-full]"),function(b){b.onclick=function(){var m=b.dataset.full;if(m==="stop"||(SE.cur()&&SE.cur().btn===b)){SE.stopAll();return;}go(b,m,null);};});
  [].forEach.call(document.querySelectorAll("[data-jump]"),function(b){b.onclick=function(){go($("fullBoth"),"B",+b.dataset.jump-1);};});
  fs.addEventListener("click",function(e){var b=SE.barFromClick(fs,e);if(b!=null)go($("fullBoth"),"B",b);});
})();

/* ---------- 떨어지는 음표 건반 ---------- */
var cv=$("bkCanvas"),cx=cv?cv.getContext("2d"):null,NOTES=BK.play.map(function(n){return {t:n[0],d:n[1],m:n[2],h:n[3],v:n[4]};}),DUR=BK.bt[BK.bt.length-1];
var SPD=1,HANDS="RL",playing=false,startAt=0,pos=0,sched=0,iv=0,raf=0;
var LO=36,HI=103;function isB(m){return [1,3,6,8,10].indexOf(m%12)>=0;}
var WX={},nW=0;(function(){for(var m=LO;m<=HI;m++)if(!isB(m))WX[m]=nW++;for(m=LO;m<=HI;m++)if(isB(m))WX[m]=WX[m-1]+.68;})();
function songTime(){return playing?(ME.now()-startAt)*SPD:pos;}
function fmt(s){s=Math.max(0,s);return Math.floor(s/60)+":"+("0"+Math.floor(s%60)).slice(-2);}
function barAt(t){var b=0;while(b<BK.bt.length-2&&BK.bt[b+1]<=t)b++;return b;}
function info(){var t=songTime(),b=barAt(t);$("bkNow").textContent="마디 "+(b+1)+" / 85 · "+fmt(t)+" / "+fmt(DUR)+(SECS[b+1]?" · "+SECS[b+1]:"");$("bkProg").style.width=(100*t/DUR)+"%";}
function stopPl(){if(playing)pos=songTime();playing=false;clearInterval(iv);cancelAnimationFrame(raf);if($("bkPlay")){$("bkPlay").textContent="▶ 재생";$("bkPlay").classList.remove("live");}}
function play(){ME.ac();SE.stopAll();useSal().then(function(){if(playing)return;playing=true;startAt=ME.now()+.1-pos/SPD;sched=0;while(sched<NOTES.length&&NOTES[sched].t<pos-.01)sched++;
  $("bkPlay").textContent="⏸ 멈춤";$("bkPlay").classList.add("live");iv=setInterval(pump,50);pump();loop();});}
function pump(){var t=songTime(),ahead=t+.5*SPD,now=ME.now();
  while(sched<NOTES.length&&NOTES[sched].t<ahead){var n=NOTES[sched++];if(HANDS.indexOf(n.h)<0)continue;var when=startAt+n.t/SPD;if(when<now-.05)continue;
    ME.piano(n.m,Math.max(when,now),Math.max(.08,(n.h==="L"?n.d:n.d+.12)/SPD),n.h==="R"?.42:.36);}
  if(t>DUR+1){stopPl();pos=0;draw(0);info();}}
function loop(){if(!playing)return;var t=songTime();draw(t);info();raf=requestAnimationFrame(loop);}
function draw(t){if(!cx)return;var W=cv.clientWidth,H=cv.clientHeight,dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  cx.setTransform(dpr,0,0,dpr,0,0);var kh=Math.round(Math.min(120,W/nW*5.6)),fh=H-kh,kw=W/nW,win=2.2*SPD;
  var g=cx.createLinearGradient(0,0,0,fh);g.addColorStop(0,"#07070c");g.addColorStop(1,"#1c1830");cx.fillStyle=g;cx.fillRect(0,0,W,fh);
  cx.strokeStyle="rgba(255,255,255,.12)";BK.bt.forEach(function(bt){var y=fh-(bt-t)/win*fh;if(y>0&&y<fh){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}});
  var down={};
  for(var i=0;i<NOTES.length;i++){var n=NOTES[i];if(n.t>t+win)break;if(n.t+n.d<t-.05)continue;
    var y1=fh-(n.t-t)/win*fh,y0=fh-(n.t+n.d-t)/win*fh,x=WX[n.m]*kw,w=isB(n.m)?kw*.62:kw-1,on=HANDS.indexOf(n.h)>=0,white=n.h==="R"&&!isB(n.m);
    cx.fillStyle=white?"#ffffff":n.h==="R"?(on?"#ffd166":"rgba(255,209,102,.25)"):(on?"#6ec3ff":"rgba(110,195,255,.25)");
    var yy=Math.max(0,y0),hh=Math.min(fh,y1)-yy;if(hh>0){cx.beginPath();if(cx.roundRect)cx.roundRect(x+.5,yy,w,Math.max(2,hh),3);else cx.rect(x+.5,yy,w,Math.max(2,hh));cx.fill();}
    if(n.t<=t&&t<n.t+n.d)down[n.m]=white?"W":n.h;}
  for(var m=LO;m<=HI;m++)if(!isB(m)){var h=down[m];cx.fillStyle=h==="W"?"#ff5a5f":h==="R"?"#ffd166":h==="L"?"#6ec3ff":"#f7f4ec";cx.fillRect(WX[m]*kw,fh,kw-1,kh);
    if(m%12===0&&kw>9){cx.fillStyle="#666";cx.font="bold "+Math.min(11,kw*.8)+"px sans-serif";cx.textAlign="center";cx.fillText("C"+(m/12-1),WX[m]*kw+kw/2,fh+kh-5);}}
  for(m=LO;m<=HI;m++)if(isB(m)){h=down[m];cx.fillStyle=h==="R"?"#e0a92c":h==="L"?"#3a8fd6":"#141218";cx.fillRect(WX[m]*kw,fh,kw*.62,kh*.62);}
  cx.fillStyle="#c21f35";cx.fillRect(0,fh-2,W,3);}
if(cv){
  $("bkPlay").onclick=function(){if(playing)stopPl();else play();};
  $("bkRew").onclick=function(){var was=playing;stopPl();pos=0;draw(0);info();if(was)play();};
  $("bkSpeed").onchange=function(){var was=playing;stopPl();SPD=+this.value;if(was)play();else draw(pos);};
  $("bkHands").onchange=function(){var was=playing;stopPl();HANDS=this.value;if(was)play();else draw(pos);};
  $("bkBar").onclick=function(){var n=Math.max(1,Math.min(85,+$("bkBarN").value||1)),was=playing;stopPl();pos=BK.bt[n-1];draw(pos);info();if(was)play();};
  $("bkProgBar").onclick=function(e){var r=this.getBoundingClientRect(),was=playing;stopPl();pos=DUR*(e.clientX-r.left)/r.width;draw(pos);info();if(was)play();};
  addEventListener("resize",function(){if(!playing)draw(pos);});draw(0);info();
}

/* ---------- 8단계 레슨 (실제 악보 구간) ---------- */
var STEPS=[
 {t:"검은 건반 다섯 개 — 솔♭·라♭·시♭·레♭·미♭",st:1,ex:true,bpm:80,goal:"이 곡 오른손은 거의 이 다섯 검은 건반만 써요. 먼저 눈 감고도 찾을 수 있게!",tips:["검은 건반 2개 묶음(레♭·미♭)과 3개 묶음(솔♭·라♭·시♭)을 손으로 더듬어 찾아요.","손가락은 평평하게, 손톱이 아니라 손가락 살로 눌러요."]},
 {t:"1~2마디 오른손 — 셋잇단 16분음표 폭포",st:2,from:1,to:2,bpm:58,hand:"R",goal:"높은 솔♭에서 시작해 검은 건반을 셋씩 묶어 굴러 내려와요(셋잇단 16분음표).",tips:["'하나-둘-셋, 하나-둘-셋' 셋씩 소리 내어 세요. 한 박에 6개!","엄지가 검은 건반을 칠 때는 손을 건반 안쪽으로 조금 넣어요."]},
 {t:"1~2마디 왼손 — 가볍게 끊는 화음",st:2,from:1,to:2,bpm:58,hand:"L",goal:"왼손은 8분음표 화음을 짧게 끊어(스타카토) 쳐요. 솔♭ 화음 → 도♭ 화음 → 솔♭ 화음.",tips:["손목으로 살짝 튕기듯. 크게 치지 말고 '톡톡'.","오른손보다 작게 — 왼손은 반주예요."]},
 {t:"1~4마디 양손 — 첫 프레이즈",st:3,from:1,to:4,bpm:58,goal:"두 손을 합쳐요. 왼손 화음이 오른손 셋잇단의 첫 음과 정확히 같이 떨어져야 해요.",tips:["🐌 아주 느리게부터. 박의 첫 음만 맞추면 나머지는 따라와요.","3·4마디는 1·2마디의 변형이에요. 같은 점, 다른 점을 찾아봐요."]},
 {t:"5~8마디 — 오르락내리락 물결",st:3,from:5,to:8,bpm:58,goal:"오른손이 위아래로 크게 물결쳐요. 손 모양은 그대로, 팔로 옮겨 다녀요.",tips:["손가락이 아니라 팔꿈치가 좌우로 따라가게.","8마디 끝에서 잠깐 숨 — 다음 구절 준비."]},
 {t:"9~16마디 — 주제 마무리",st:4,from:9,to:16,bpm:60,goal:"A 부분을 끝까지! 16마디에서 첫 부분이 마무리돼요.",tips:["4마디씩 끊어서 연습한 뒤 이어 붙여요.","왼손 화음이 바뀌는 자리를 눈으로 먼저 확인해요."]},
 {t:"⚪ 66마디 — 오른손 유일한 흰 건반 「파」",st:3,from:65,to:67,bpm:56,goal:"85마디 동안 오른손이 흰 건반을 치는 건 딱 한 번! 66마디의 화음 속 「파(F)」예요. 들으면서 찾아보세요.",tips:["66마디 둘째 박 화음 <b>레♭–파–시♭</b>의 가운데 음이 흰 건반 파예요.","그래서 이 곡의 별명이 「흑건(검은 건반)」이에요."]},
 {t:"코다 79~85마디 — 옥타브로 휘날리는 마무리",st:5,from:79,to:85,bpm:66,goal:"양손 옥타브로 검은 건반 위를 질주하고, 마지막에 큰 화음으로 끝나요.",tips:["옥타브는 손목을 가볍게 튕겨서. 아프면 바로 쉬어요!","마지막 화음은 몸 전체 무게를 실어 '쾅!'"]}
];
(function(){var box=$("stepList");if(!box)return;
  function stars(n){return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n);}
  box.innerHTML=STEPS.map(function(s,i){var n=i+1;return '<details class="card step"'+(i===0?" open":"")+'><summary><span class="snum">'+n+'</span><span class="stitle">'+s.t+'</span><span class="sstar">'+stars(s.st)+'</span></summary><div class="sbody">'+
    '<p class="tip">🎯 '+s.goal+(s.from?' <span class="small">('+s.from+'~'+s.to+'마디)</span>':'')+'</p><div class="score" id="sc'+n+'"></div><div class="kb" id="kb'+n+'"></div>'+
    '<div class="ctrls"><button class="btn" data-sp="'+n+'" data-h="RL">▶ 양손</button><button class="btn alt" data-sp="'+n+'" data-h="R">오른손만</button><button class="btn alt" data-sp="'+n+'" data-h="L">왼손만</button>'+
    '<label class="chk">빠르기 <select id="sv'+n+'"><option value="0.5">🐌 아주 느리게</option><option value="0.75" selected>🐢 느리게</option><option value="1">🎵 이 단계 빠르기</option></select></label></div>'+
    '<ul class="tips">'+s.tips.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></div></details>';}).join("");
  var EX={R:[["Gb4:s","Ab4:s","Bb4:s","Db5:s","Eb5:s","Db5:s","Bb4:s","Ab4:s"],["Gb4:s","Ab4:s","Bb4:s","Db5:s","Eb5:s","Gb5:s","Eb5:s","Db5:s"],["Bb4:s","Ab4:s","Gb4:s","Ab4:s","Gb4:q"]],L:[["Gb3+Db4:h"],["Gb3+Db4:h"],["Gb3+Bb3+Db4:h"]]};
  var drawn={};
  function data(n){var s=STEPS[n-1];if(drawn[n])return drawn[n];var r,l,bars;
    if(s.ex){r=EX.R;l=EX.L;bars=r.map(function(){return {sig:2,key:-6,bpm:s.bpm};});}
    else{r=BK.rh.slice(s.from-1,s.to);l=BK.lh.slice(s.from-1,s.to);bars=BARS.slice(s.from-1,s.to).map(function(b){return {sig:2,key:-6,bpm:s.bpm,sec:b.sec};});}
    var R=SE.parseBars(r),L=SE.parseBars(l);
    SE.render($("sc"+n),{staves:[{clef:"treble",items:R,prefix:"R"+n+"-",labels:true,ott:true},{clef:"bass",items:L,prefix:"L"+n+"-",labels:true}],bars:bars,startBar:s.from||1});
    var ms={};R.concat(L).forEach(function(it){(it.notes||[]).forEach(function(x){ms[x.midi]=1;});});SE.drawKb($("kb"+n),Object.keys(ms).map(Number));
    drawn[n]={R:R,L:L,bars:bars};return drawn[n];}
  [].forEach.call(box.querySelectorAll("details.step"),function(d,i){if(d.open)data(i+1);d.addEventListener("toggle",function(){if(d.open)data(i+1);});});
  box.addEventListener("click",function(ev){var b=ev.target.closest("[data-sp]");if(!b)return;var n=+b.dataset.sp,v=data(n),h=b.dataset.h;stopPl();
    var parts=[];if(h.indexOf("R")>=0)parts.push({items:v.R,prefix:"R"+n+"-",vel:.45,light:true});if(h.indexOf("L")>=0)parts.push({items:v.L,prefix:"L"+n+"-",vel:.32,light:true});
    useSal().then(function(){SE.play([{el:$("sc"+n),bars:v.bars,parts:parts,kb:$("kb"+n)}],{btn:b,mul:+$("sv"+n).value,countIn:true});});});
})();
})();
