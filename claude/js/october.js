/* 차이콥스키 10월(가을의 노래) 피아노 교실: 원곡 악보(라단조 ♭1) + 쉬운 악보, 움직이는 악보, 전곡 듣기, 따라치기
   악보·재생 엔진 = score-engine.js(SE), 소리·건반 = music-engine.js(ME) */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,F=window.OC_FULL,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

/* ---------- 구간 ---------- */
var SECS={1:"가을의 노래 — 첫 주제",9:"왼손이 노래해요 (marcato)",17:"가운데 부분 — 조금 밝게",22:"가운데 부분 — 높은 노래 (mf)",30:"주제로 돌아가는 길 (rit.)",34:"첫 주제 다시",50:"끝맺음 — 점점 사라지듯 (morendo)"};
var BARS=F.bars.map(function(b,i){return {sig:b.sig,key:b.key,bpm:b.bpm,sec:SECS[i+1]};});
/* 소리: 원곡 악보의 모든 성부 */
function rawItems(hand,b0,b1){
  var g0=b0*4,g1=b1*4;
  return F.raw.filter(function(r){return (!hand||r[3]===hand)&&r[0]>=g0-1e-6&&r[0]<g1-1e-6;}).map(function(r){
    var n=ME.noteFromMidi(r[2]);
    return {notes:[n],gpos:r[0]-g0,len:Math.min(r[1],g1-r[0]),pos:(r[0]-g0)%4};
  });
}

/* ---------- 조표 배우기 ---------- */
(function(){
  var items=SE.parseBars([["D4:e","E4:e","F4:e","G4:e","A4:e","Bb4:e","C#5:e","D5:e"]]),el=$("scale-dm"),bars=[{sig:4,key:-1,bpm:90}];
  var draw=function(){SE.render(el,{staves:[{clef:"treble",items:items,prefix:"SC",labels:true}],bars:bars,startBar:1});};
  draw();window.addEventListener("resize",debounce(draw,200));
  $("scaleplay").onclick=function(){
    if(SE.cur()&&SE.cur().btn===this){SE.stopAll();return;}
    SE.play([{el:el,bars:bars,parts:[{items:items,prefix:"SC",vel:.5,light:true}]}],{btn:this});
  };
})();

/* ---------- 전곡 듣기 ---------- */
(function(){
  var fs=$("fullScore");if(!fs)return;
  var R=SE.parseBars(F.rh),L=SE.parseBars(F.lh),drawn=false;
  var draw=function(){SE.render(fs,{staves:[{clef:"treble",items:R,prefix:"FR",labels:true,ott:true,autoClef:"row"},{clef:"bass",items:L,prefix:"FL",labels:true,autoClef:"item"}],bars:BARS,startBar:1});drawn=true;};
  var ensure=function(){if(!drawn)draw();};
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){ensure();io.disconnect();}},{rootMargin:"600px"});io.observe(fs);}else ensure();
  window.addEventListener("resize",debounce(function(){if(drawn&&!(SE.cur()&&SE.cur().chunks[0].el===fs))draw();},250));
  var kb=ME.keyboard(36,96,{kw:22,kh:110});
  $("fullKb").innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:760px">'+kb.svg+'</svg>';
  var go=function(btn,mode,fromBar){
    ensure();
    var parts=[];
    if(mode!=="L")parts.push({items:rawItems("R",0,BARS.length),vel:.42},{items:R,prefix:"FR",audio:false,light:true});
    if(mode!=="R")parts.push({items:rawItems("L",0,BARS.length),vel:mode==="L"?.42:.32},{items:L,prefix:"FL",audio:false,light:true});
    SE.play([{el:fs,bars:BARS,parts:parts,kb:$("fullKb")}],{btn:btn,mul:+$("fullSpeed").value,fromBar:fromBar,metro:$("fullMetro").checked,scrollBox:fs,
      onBar:function(b){$("fullNow").textContent=(b+1)+" / "+BARS.length+"마디"+(SECS[b+1]?" · "+SECS[b+1]:"");}});
  };
  [].forEach.call(document.querySelectorAll("[data-full]"),function(b){
    b.onclick=function(){var m=b.dataset.full;if(m==="stop"){SE.stopAll();return;}if(SE.cur()&&SE.cur().btn===b){SE.stopAll();return;}go(b,m,null);};
  });
  [].forEach.call(document.querySelectorAll("[data-jump]"),function(b){b.onclick=function(){go($("fullBoth"),"B",+b.dataset.jump-1);};});
  fs.addEventListener("click",function(e){var b=SE.barFromClick(fs,e);if(b!=null)go($("fullBoth"),"B",b);});
})();

/* ---------- 단계별 레슨 ---------- */
var STEPS=[
  {id:1,part:"theme",from:1,to:2,bpm:48,title:"첫 주제 ① — 파·미, 한숨처럼",tip:"쉼표 다음 <b>파(길게)–미</b>로 시작해요. 2마디의 <b>미–레–솔♯–라</b>에서 솔♯은 검은 건반!",tip2:"왼손은 <b>레·라·레</b> 화음을 길게 눌러요. 2마디 끝 <b>파 → 파♯</b>으로 반음 올라가요."},
  {id:2,part:"theme",from:3,to:4,bpm:48,title:"첫 주제 ② — 시♭에 기대어",tip:"<b>시♭</b>을 길게(악센트 >) 누르고 <b>파♯ → 솔</b>로 올라가요. 시는 곡 내내 <b>시♭</b>(검은 건반)이에요.",tip2:"4마디 끝 <b>레–도♯</b>: 도♯이 '라단조'의 이끔음이에요."},
  {id:3,part:"theme",from:5,to:6,bpm:46,title:"셋잇단 오르막 — 높은 라까지",tip:"<b>셋잇단음표(3)</b>로 <b>라–시–도♯–레–미</b> 계단을 올라가 <b>높은 라</b>에서 멈춰요.",tip2:"시는 이번엔 <b>시♮</b>(하얀 건반)! 제자리표(♮)를 잘 보세요."},
  {id:4,part:"theme",from:7,to:8,bpm:44,title:"천천히 내려오기 — dim.",tip:"<b>솔–파–미</b>, <b>레–도♯–레</b>… 셋잇단으로 한 음씩 내려와요. 점점 여리게(dim.).",tip2:"왼손 <b>솔 → 솔♯ → 라</b>: 낮은 음이 반음씩 올라가요."},
  {id:5,part:"left",from:9,to:10,bpm:48,title:"왼손이 노래해요 ① (marcato)",tip:"이번엔 <b>왼손이 첫 주제</b>(파–미–미–레–솔♯–라)를 노래해요. 또렷하게(marcato)!",tip2:"오른손은 <b>레 … 라–라 시 도♯</b>로 짧게 대답해요."},
  {id:6,part:"left",from:11,to:12,bpm:48,title:"왼손이 노래해요 ②",tip:"왼손 <b>시♭(길게) → 파♯ → 솔</b>. 오른손은 <b>라·솔·솔♯</b>을 붙임줄로 이어요.",tip2:"붙임줄(⌒)로 이어진 음은 다시 치지 않고 계속 눌러요."},
  {id:7,part:"mid",from:17,to:18,bpm:50,title:"가운데 부분 — 조금 밝게",tip:"<b>솔–라–시♭–시♮–도</b> 셋잇단으로 올라가 <b>파–미, 미–레</b>. 셋잇단 '긴 음+짧은 음'은 <b>따–안 따</b> 느낌이에요.",tip2:"왼손은 <b>쿵(낮은 음) – 짝(화음)</b>을 두 번씩."},
  {id:8,part:"mid",from:22,to:23,bpm:50,title:"높은 노래 (mf)",tip:"<b>높은 라·솔♯·도</b>까지 올라가 노래해요. 조금 세게(mf)!",tip2:"왼손 <b>파♯ → 솔</b>, 그리고 <b>파·미</b>로 대답하는 멜로디가 나와요."},
  {id:9,part:"end",from:53,to:56,bpm:44,title:"끝맺음 — 사라지듯 (morendo)",tip:"오른손이 <b>낮은음자리표</b>로 내려와 <b>라·시♭</b>을 한숨처럼 주고받아요. 점점 사라지듯(morendo)!",tip2:"마지막 <b>라</b>는 늘임표(𝄐) — 소리가 사라질 때까지 기다려요."}
];
var PARTS={theme:"🍂 첫 주제 — 가을의 노래",left:"🎻 왼손이 노래하는 부분",mid:"🌤 가운데 부분",end:"🌙 끝맺음"};
var PART_NOTE={
  theme:"쓸쓸하고 노래하듯(doloroso e cantabile). 오른손 위 성부가 멜로디예요. 처음엔 <b>쉬운 악보</b>(멜로디만)로!",
  left:"첫 주제가 <b>왼손 테너 음역</b>에서 다시 나와요. 오른손은 짧게 대답해요.",
  mid:"조금 밝아지는 부분. <b>셋잇단음표</b>가 많이 나와요.",
  end:"주제가 다시 나온 뒤, 아주 여리게 사라지며 끝나요."
};
var follow=null,followStep=null;
function isDone(id,w){return store("oc-done-"+id+"-"+w)==="1";}
function stars(id){return (isDone(id,"R")?"★":"☆")+(isDone(id,"L")?"★":"☆");}
STEPS.forEach(function(st){
  st.orig={R:SE.parseBars(F.rh.slice(st.from-1,st.to)),L:SE.parseBars(F.lh.slice(st.from-1,st.to))};
  st.easy={R:SE.parseBars(F.rhE.slice(st.from-1,st.to)),L:SE.parseBars(F.lhE.slice(st.from-1,st.to))};
  st.origBpm=Math.round(F.bars.slice(st.from-1,st.to).reduce(function(a,b){return a+b.bpm;},0)/(st.to-st.from+1));
});
function mode(st){var d=$("step"+st.id);return d&&d.querySelector('[data-o="ver"]').value==="orig"?"orig":"easy";}
function stepBars(st,bpm){return BARS.slice(st.from-1,st.to).map(function(b){return {sig:4,key:-1,bpm:bpm};});}
var listEl=$("lessonList"),order=[];
STEPS.forEach(function(s){if(order.indexOf(s.part)<0)order.push(s.part);});
order.forEach(function(part){
  var box=document.createElement("div");box.className="part";
  box.innerHTML='<h3 class="parth">'+PARTS[part]+'</h3><p class="lead" style="margin:0 0 8px">'+PART_NOTE[part]+'</p>';
  STEPS.filter(function(s){return s.part===part;}).forEach(function(st){box.appendChild(card(st));});
  listEl.appendChild(box);
});
function card(st){
  var d=document.createElement("details");d.className="card step";d.id="step"+st.id;
  d.innerHTML='<summary><span class="snum">'+st.id+'</span><span class="stitle">'+st.title+'</span><span class="sstar" id="star'+st.id+'" title="오른손·왼손 따라치기 완료">'+stars(st.id)+'</span></summary>'+
    '<div class="sbody">'+
    '<div class="tags"><span class="tag">라단조 (♭1: 시♭)</span><span class="tag">4/4박자</span><span class="tag">원곡 '+st.from+'~'+st.to+'마디</span><span class="tag">원곡 빠르기 ♩≈'+st.origBpm+'</span></div>'+
    '<p class="tip">💡 '+st.tip+'</p><p class="tip">👉 '+st.tip2+'</p>'+
    '<div class="ctrls opts"><label class="chk">악보 <select data-o="ver"><option value="easy" selected>🌱 쉬운 악보 (멜로디·베이스만)</option><option value="orig">🎼 원곡 그대로 (모든 성부)</option></select></label></div>'+
    '<div class="score" id="score'+st.id+'"></div>'+
    '<div class="beatline" id="beat'+st.id+'">'+[1,2,3,4].map(function(i){return '<span class="beatdot">'+i+'</span>';}).join("")+'</div>'+
    '<div class="ctrls">'+
      '<button class="btn" data-a="R">▶ 오른손(멜로디)</button>'+
      '<button class="btn" data-a="B" style="background:#6a4bc4">▶ 양손 같이</button>'+
      '<button class="btn alt" data-a="L">▶ 왼손만</button>'+
      '<button class="btn alt" data-a="stop">⏹ 멈춤</button>'+
    '</div>'+
    '<div class="ctrls opts">'+
      '<label class="chk">빠르기 <select data-o="speed"><option value="slow">🐢 아주 느리게 (♩='+Math.round(st.bpm*.7)+')</option><option value="prac" selected>🚶 연습 (♩='+st.bpm+')</option><option value="orig">🏃 원곡 (♩≈'+st.origBpm+')</option></select></label>'+
      '<label class="chk"><input type="checkbox" data-o="metro" checked> 메트로놈</label>'+
      '<label class="chk"><input type="checkbox" data-o="loop"> 반복</label>'+
    '</div>'+
    '<div class="ctrls"><button class="btn green" data-a="FR">🎹 오른손 따라치기</button><button class="btn green" data-a="FL">🎹 왼손 따라치기</button></div>'+
    '<div class="msg" id="msg'+st.id+'">파란 건반을 따라 누르면 한 음씩 넘어가요. 원곡 악보에서는 같이 누를 건반이 여러 개일 수 있어요.</div>'+
    '<div class="kb" id="kb'+st.id+'"></div>'+
    '</div>';
  var drawn=false;
  st.draw=function(){
    if(SE.cur()&&SE.cur().chunks.some(function(c){return c.el===$("score"+st.id);}))return;
    var v=st[mode(st)];
    SE.render($("score"+st.id),{staves:[{clef:"treble",items:v.R,prefix:"R"+st.id+"-",labels:true,ott:true,autoClef:"row"},{clef:"bass",items:v.L,prefix:"L"+st.id+"-",labels:true,autoClef:"item"}],bars:stepBars(st,st.bpm),startBar:st.from});
    if(!drawn){
      drawn=true;window.addEventListener("resize",debounce(function(){if(d.open)st.draw();},200));
      st.kbAll=function(){var all=[];["orig","easy"].forEach(function(k){st[k].R.concat(st[k].L).forEach(function(it){it.notes.forEach(function(n){all.push(n.midi);});});});return all;};
      SE.drawKb($("kb"+st.id),st.kbAll());
      $("kb"+st.id).addEventListener("pointerdown",function(e){var k=e.target.closest("[data-m]");if(!k)return;e.preventDefault();press(st,+k.dataset.m);});
    }
  };
  d.addEventListener("toggle",function(){if(!d.open){if(followStep===st)endFollow();return;}if(!drawn)st.draw();});
  d.addEventListener("change",function(e){if(e.target.dataset.o==="ver"){SE.stopAll();endFollow();st.draw();}});
  d.addEventListener("click",function(e){
    var b=e.target.closest("[data-a]");if(!b)return;
    var a=b.dataset.a;
    if(a==="stop"){SE.stopAll();endFollow();return;}
    if(a==="FR"||a==="FL"){startFollow(st,a==="FR"?"R":"L");return;}
    if(SE.cur()&&SE.cur().btn===b){SE.stopAll();return;}
    endFollow();
    if($("kb"+st.id)._hand){SE.drawKb($("kb"+st.id),st.kbAll());$("kb"+st.id)._hand=null;}
    var sp=d.querySelector('[data-o="speed"]').value,bpm=sp==="slow"?Math.round(st.bpm*.7):sp==="orig"?st.origBpm:st.bpm;
    var m=mode(st),v=st[m],parts=[];
    var aud=function(h){return m==="orig"?rawItems(h,st.from-1,st.to):SE.audioItems(v[h]);};
    if(a!=="L")parts.push({items:aud("R"),vel:.48},{items:v.R,prefix:"R"+st.id+"-",audio:false,light:true});
    if(a!=="R")parts.push({items:aud("L"),vel:a==="L"?.48:.34},{items:v.L,prefix:"L"+st.id+"-",audio:false,light:true});
    SE.play([{el:$("score"+st.id),bars:stepBars(st,bpm),parts:parts,kb:$("kb"+st.id),beatsEl:$("beat"+st.id)}],{btn:b,countIn:true,
      metro:d.querySelector('[data-o="metro"]').checked,loop:function(){return d.querySelector('[data-o="loop"]').checked;}});
  });
  return d;
}
function msg(st,t,cls){var m=$("msg"+st.id);m.textContent=t;m.className="msg"+(cls?" "+cls:"");}
function press(st,m){
  ME.ac();ME.piano(m,ME.now()+.005,.5,.45);
  if(follow&&followStep===st)follow.press(m);
  else{var k=document.querySelector('#kb'+st.id+' [data-m="'+m+'"]');if(k){k.classList.add("on");setTimeout(function(){k.classList.remove("on");},180);}}
}
function endFollow(){if(follow){follow.end(true);follow=null;followStep=null;}}
function startFollow(st,hand){
  SE.stopAll();endFollow();
  var v=st[mode(st)],items=v[hand],prefix=hand+st.id+"-";
  var steps=items.filter(function(it){return !it.rest&&!it.cont&&!it.hidden;}).map(function(it){return {it:it,prefix:prefix,midis:it.notes.map(function(n){return n.midi;})};});
  followStep=st;
  var kbEl=$("kb"+st.id),hm=[];steps.forEach(function(x){hm=hm.concat(x.midis);});
  SE.drawKb(kbEl,hm);kbEl._hand=hand;
  document.querySelectorAll('#score'+st.id+' .n.pl').forEach(function(e){e.classList.remove("pl");});
  follow=new ME.Follow(steps,{kbRoot:$("kb"+st.id),
    onShow:function(s,i,n){msg(st,"다음 → "+s.it.notes.map(function(x){return x.sol;}).join("·")+(s.midis.length>1?" (같이 누르기)":"")+"  ("+(i+1)+" / "+n+")");setTimeout(function(){SE.revealKeys(kbEl,s.midis);},30);},
    onPartial:function(s,left){msg(st,"좋아요! 나머지 파란 건반도 같이 눌러요 ("+left.length+"개 남음)");},
    onWrong:function(){var sc=$("score"+st.id);sc.classList.remove("shake");void sc.offsetWidth;sc.classList.add("shake");msg(st,"앗! 다른 건반이에요. 파란 건반을 눌러 봐요.","bad");},
    onDone:function(){follow=null;followStep=null;ME.confetti();store("oc-done-"+st.id+"-"+hand,"1");$("star"+st.id).textContent=stars(st.id);
      msg(st,"🎉 참 잘했어요! "+(hand==="R"?"오른손":"왼손")+"를 끝까지 쳤어요. 이제 ▶ 소리와 같이 쳐 봐요!","good");}});
  document.querySelectorAll('[data-i^="'+prefix+'"].done').forEach(function(e){e.classList.remove("done");});
  kbEl.scrollIntoView({behavior:"smooth",block:"center"});
}
var first=$("step1");if(first){first.open=true;STEPS[0].draw();}
})();
