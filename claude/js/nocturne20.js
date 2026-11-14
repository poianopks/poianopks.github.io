/* 쇼팽 녹턴 20번 피아노 교실: 원곡 악보(올림다단조 ♯4) + 쉬운 악보, 움직이는 악보, 전곡 듣기, 따라치기
   악보·재생 엔진 = score-engine.js(SE), 소리·건반 = music-engine.js(ME) */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,F=window.NC_FULL,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

/* ---------- 쉬운 악보: 데이터에 미리 계산(오른손 굵은 박의 맨 윗음, 왼손 2박마다 맨 아랫음) ---------- */
/* ---------- 구간 ---------- */
var SECS={};F.bars.forEach(function(b,i){if(b.sec)SECS[i+1]=b.sec;});
var BARS=F.bars.map(function(b,i){return {sig:b.sig,key:b.key,bpm:b.bpm,sec:SECS[i+1]};});
var OFF=[0];F.bars.forEach(function(b){OFF.push(OFF[OFF.length-1]+b.sig);});
/* 소리: 원곡 MIDI(꾸밈음·트릴·페달 울림 포함) */
function rawItems(hand,b0,b1){
  var g0=OFF[b0],g1=OFF[b1];
  return F.raw.filter(function(r){return (!hand||r[3]===hand)&&r[0]>=g0-1e-6&&r[0]<g1-1e-6;}).map(function(r){
    var n=ME.noteFromMidi(r[2],true),bi=b0;while(OFF[bi+1]<=r[0]+1e-6)bi++;
    return {notes:[n],gpos:r[0]-g0,len:Math.min(r[1],g1-r[0]),pos:r[0]-OFF[bi]};
  });
}

/* ---------- 조표 배우기 ---------- */
(function(){
  var items=SE.parseBars([["C#4:e","D#4:e","E4:e","F#4:e","G#4:e","A4:e","B#4:e","C#5:e"]]),el=$("scale-cs"),bars=[{sig:4,key:4,bpm:80}];
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
    if(mode!=="L")parts.push({items:rawItems("R",0,BARS.length),vel:.5},{items:R,prefix:"FR",audio:false,light:true});
    if(mode!=="R")parts.push({items:rawItems("L",0,BARS.length),vel:mode==="L"?.42:.24},{items:L,prefix:"FL",audio:false,light:true});
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
  {id:1,part:"intro",from:1,to:4,bpm:40,title:"도입 — 조용한 화음",tip:"<b>C♯m(도♯·미·솔♯)</b> 화음으로 시작해요. 2마디의 <b>파×</b>는 '파 더블샵' = <b>솔</b>과 같은 건반이에요.",tip2:"3·4마디는 1·2마디와 같아요. 두 번째는 <b>pp</b>(아주 여리게)로 메아리처럼."},
  {id:2,part:"theme",from:5,to:8,bpm:42,title:"주제 ① — 노래하는 멜로디",tip:"오른손은 <b>솔♯ → 파♯ → 솔♯ → 도♯</b> 긴 음으로 노래하고, 왼손은 <b>도♯–솔♯–미–도♯</b> 펼친 화음이 물결처럼 흘러요.",tip2:"6마디 <b>tr(트릴)</b>: 파♯–솔♯을 빠르게 번갈아요. 🎼 원곡 소리에 트릴·꾸밈음이 들어 있어요. 왕초보는 파♯ 하나만 길게 쳐도 괜찮아요."},
  {id:3,part:"theme",from:9,to:12,bpm:42,title:"주제 ② — 대답하는 선율",tip:"9마디 왼손 첫 음은 <b>시♯(=도)</b>. 11마디는 레♯을 길게 끌다가 <b>레♯–도♯</b>으로 내려와요.",tip2:"12마디 마지막 솔♯은 다음 마디로 이어지는 '숨'이에요."},
  {id:4,part:"theme",from:13,to:16,bpm:40,title:"주제 ③ — 흘러내리는 음계",tip:"15마디는 아주 높은 <b>도♯</b>(8va)에서 한 음씩 쏟아져 내려와요. 셋잇단 → 5잇단 → 6잇단으로 점점 빨라져요.",tip2:"🌱 쉬운 악보는 빠른 음을 빼고 큰 박의 음만 남겼어요. 원곡은 🐢 아주 느리게로 한 묶음씩!"},
  {id:5,part:"theme",from:17,to:20,bpm:40,title:"주제 ④ — 슬픈 마무리",tip:"17마디 <b>레♮</b>(하얀 건반 레)가 갑자기 어두운 색을 줘요. 18마디의 <b>라×</b>는 '라 더블샵' = <b>시</b> 건반.",tip2:"20마디 낮은 도♯에서 한 번 쉬어 가요."},
  {id:6,part:"anim",from:21,to:24,bpm:48,title:"조금 빠르게 ① — 작은 춤",tip:"<b>Più animato</b> = 조금 더 생기 있게. 16분음표 네 개(파♯–솔♯–라–시)를 고르게 올라가요.",tip2:"23·24마디는 두 음을 같이 치는 <b>겹음</b>이 나와요. 쉬운 악보는 윗음만!"},
  {id:7,part:"anim",from:25,to:28,bpm:48,title:"조금 빠르게 ② — 같은 춤 한 옥타브 아래",tip:"21~24마디와 같은 모양을 <b>낮은 음</b>에서 다시 춰요.",tip2:"25마디의 <b>미♯</b>은 '미 샵' = <b>파</b> 건반이에요."},
  {id:8,part:"anim",from:29,to:32,bpm:44,title:"다리 — 5/4박자 한 마디",tip:"32마디는 한 마디가 <b>5박</b>이에요. 마지막 시♯ 위의 늘임표(𝄐)에서 숨을 고르고 3/4박자로 넘어가요.",tip2:"29~31마디 왼손의 <b>파×, 도×</b>는 각각 솔, 레 건반이에요."},
  {id:9,part:"mid",from:33,to:38,bpm:56,title:"가운데 3/4박자 ① — 셋잇단 왼손",tip:"<b>Animato</b>, 3/4박자! 오른손은 레♯ 하나를 길게, 왼손은 <b>셋잇단음표</b>로 '셋–잇–단' 굴러요.",tip2:"쇼팽의 <b>피아노 협주곡 2번</b>에서 따온 부분이라고 알려져 있어요."},
  {id:10,part:"mid",from:39,to:43,bpm:52,title:"가운데 3/4박자 ② — 점점 작게",tip:"왼손 셋잇단은 그대로, 오른손은 낮은 <b>도♯ → 레♯</b>으로 내려와 <b>pp</b>로 사라져요.",tip2:"쉬는 마디가 많아요. 박을 세면서 기다리는 것도 연주예요!"},
  {id:11,part:"back",from:44,to:47,bpm:38,title:"아다지오 → 처음 주제로",tip:"44마디 <b>Adagio</b>: 오른손이 아주 낮은 레♯에서 높은 시♯까지 <b>셋잇단</b>으로 올라가 늘임표 솔♯에 닿아요.",tip2:"46마디부터 <b>Tempo I</b> — 처음 주제가 돌아와요."},
  {id:12,part:"back",from:48,to:52,bpm:40,title:"내려오고 올라가는 음계",tip:"48마디는 15마디처럼 높은 도♯에서 내려오고, 52마디는 반대로 <b>레♯에서 파♯까지 올라가요</b>.",tip2:"빠른 음계는 손가락 번호(엄지 넘기기)를 정하고 아주 느리게부터!"},
  {id:13,part:"back",from:53,to:56,bpm:42,title:"가장 세게 — 클라이맥스",tip:"53마디 <b>f</b>(세게)! 높은 미에서 노래가 가장 크게 울려요. 54마디 <b>라♮</b>.",tip2:"56마디 레♯은 tr(트릴)로 길게 — 쉬운 악보는 한 음만 4박."},
  {id:14,part:"end",from:57,to:60,bpm:38,title:"끝맺음 ① — 반짝이는 빠른 음계",tip:"57~60마디 오른손 후반부는 작은 음표로 빠르게 오르내리는 <b>장식 음계</b>예요. 58마디는 8va로 아주 높이!",tip2:"🌱 쉬운 악보는 솔♯ 하나로 대신해요. 원곡은 '흩뿌리듯' 자유롭게 쳐도 돼요."},
  {id:15,part:"end",from:61,to:64,bpm:34,title:"끝맺음 ② — 마지막 화음",tip:"솔♯을 길게 울린 뒤 <b>도♯–미♯–솔♯–도♯–미♯</b>으로 올라가 높은 도♯에서 끝나요. 미♯(=파)가 들어간 <b>장조(C♯)</b>로 밝게 끝나요!",tip2:"마지막 음은 늘임표 — 소리가 사라질 때까지 들어 보세요."}
];
var PARTS={intro:"🌙 도입",theme:"🎶 주제 — 녹턴의 노래",anim:"💃 조금 빠르게 (Più animato)",mid:"🎻 가운데 3/4박자 (Animato)",back:"🔁 주제가 돌아와요",end:"✨ 끝맺음"};
var PART_NOTE={
  intro:"조용한 화음 4마디로 밤의 분위기를 열어요.",
  theme:"왼손 펼친 화음 위에서 오른손이 긴 음으로 노래해요. 처음엔 <b>🌱 쉬운 악보</b>로!",
  anim:"조금 더 생기 있게. 16분음표와 셋잇단음표, 겹음이 나와요.",
  mid:"박자가 3/4로 바뀌고, 왼손이 셋잇단음표로 굴러요.",
  back:"느린 다리(Adagio)를 지나 처음 주제가 돌아오고, 가장 크게 울려요.",
  end:"빠른 장식 음계와 마지막 화음."
};
var follow=null,followStep=null;
function isDone(id,w){return store("nc-done-"+id+"-"+w)==="1";}
function stars(id){return (isDone(id,"R")?"★":"☆")+(isDone(id,"L")?"★":"☆");}
STEPS.forEach(function(st){
  st.orig={R:SE.parseBars(F.rh.slice(st.from-1,st.to)),L:SE.parseBars(F.lh.slice(st.from-1,st.to))};
  st.easy={R:SE.parseBars(F.rhE.slice(st.from-1,st.to)),L:SE.parseBars(F.lhE.slice(st.from-1,st.to))};
  st.origBpm=Math.round(F.bars.slice(st.from-1,st.to).reduce(function(a,b){return a+b.bpm;},0)/(st.to-st.from+1));
});
function mode(st){var d=$("step"+st.id);return d&&d.querySelector('[data-o="ver"]').value==="orig"?"orig":"easy";}
function stepBars(st,bpm){return BARS.slice(st.from-1,st.to).map(function(b){return {sig:b.sig,key:4,bpm:bpm};});}
function sigTag(st){var u=[];BARS.slice(st.from-1,st.to).forEach(function(b){if(u.indexOf(b.sig)<0)u.push(b.sig);});return u.map(function(x){return x+"/4";}).join("·")+"박자";}
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
    '<div class="tags"><span class="tag">올림다단조 (♯4: 파♯·도♯·솔♯·레♯)</span><span class="tag">'+sigTag(st)+'</span><span class="tag">원곡 '+st.from+'~'+st.to+'마디</span><span class="tag">원곡 빠르기 ♩≈'+st.origBpm+'</span></div>'+
    '<p class="tip">💡 '+st.tip+'</p><p class="tip">👉 '+st.tip2+'</p>'+
    '<div class="ctrls opts"><label class="chk">악보 <select data-o="ver"><option value="easy" selected>🌱 쉬운 악보 (멜로디 + 베이스)</option><option value="orig">🎼 원곡 그대로 (화음·빠른 음)</option></select></label></div>'+
    '<div class="score" id="score'+st.id+'"></div>'+
    '<div class="beatline" id="beat'+st.id+'">'+[1,2,3,4,5].slice(0,BARS[st.from-1].sig).map(function(i){return '<span class="beatdot">'+i+'</span>';}).join("")+'</div>'+
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
    if(a!=="R")parts.push({items:aud("L"),vel:a==="L"?.48:.28},{items:v.L,prefix:"L"+st.id+"-",audio:false,light:true});
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
    onDone:function(){follow=null;followStep=null;ME.confetti();store("nc-done-"+st.id+"-"+hand,"1");$("star"+st.id).textContent=stars(st.id);
      msg(st,"🎉 참 잘했어요! "+(hand==="R"?"오른손 멜로디":"왼손 반주")+"를 끝까지 쳤어요. 이제 ▶ 소리와 같이 쳐 봐요!","good");}});
  document.querySelectorAll('[data-i^="'+prefix+'"].done').forEach(function(e){e.classList.remove("done");});
  kbEl.scrollIntoView({behavior:"smooth",block:"center"});
}
var first=$("step2");if(first){first.open=true;STEPS[1].draw();}
})();
