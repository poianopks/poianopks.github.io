/* 도니체티 「남몰래 흐르는 눈물」 피아노 교실: 1874 악보(가단조 6/8) + 쉬운 악보, 움직이는 악보, 전곡 듣기, 따라치기
   악보·재생 엔진 = score-engine.js(SE), 소리·건반 = music-engine.js(ME) */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,F=window.FU_FULL,store=ME.store;
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
var BARS=F.bars.map(function(b,i){return {sig:b.sig,key:b.key,bpm:b.bpm,ts:b.ts,sec:SECS[i+1]};});
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
  var items=SE.parseBars([["A4:e","B4:e","C5:e","D5:e","E5:e","F5:e","G#5:e","A5:e"]]),el=$("scale-cs"),bars=[{sig:4,key:0,bpm:80}];
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
  var draw=function(){SE.render(fs,{staves:[{clef:"treble",items:R,prefix:"FR",labels:true,ott:true},{clef:"bass",items:L,prefix:"FL",labels:true}],bars:BARS,startBar:1});drawn=true;};
  var ensure=function(){if(!drawn)draw();};
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){ensure();io.disconnect();}},{rootMargin:"600px"});io.observe(fs);}else ensure();
  window.addEventListener("resize",debounce(function(){if(drawn&&!(SE.cur()&&SE.cur().chunks[0].el===fs))draw();},250));
  var kb=ME.keyboard(33,96,{kw:22,kh:110});
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
  {id:1,part:"intro",from:1,to:5,bpm:52,title:"도입 ① — 바순이 부르는 노래",tip:"1마디는 왼손만 <b>라–미–라–도–라–미</b>로 물결처럼 시작해요. 2마디부터 오른손이 <b>미 → 라 라 라 라</b>로 노래해요.",tip2:"3마디 <b>라–솔♯–시</b>: 솔♯은 가단조의 '이끈음'(라로 가고 싶은 음)이에요."},
  {id:2,part:"intro",from:6,to:9,bpm:52,title:"도입 ② — 점점 크게, 그리고 쉼",tip:"6마디 <b>cresc.</b>(점점 크게): 미–레♯–미에서 높은 <b>솔</b>까지 올라가요.",tip2:"8마디 오른손 16분음표 <b>파–미–레♯–미</b>는 빠르니까 🐢 아주 느리게부터! 9마디 라에서 숨을 쉬고 노래가 시작돼요."},
  {id:3,part:"v1",from:10,to:13,bpm:54,title:"1절 ① — 남몰래 흐르는 눈물",tip:"<b>Una furtiva lagrima</b>(남몰래 흐르는 눈물 한 방울) — 도입의 바순 선율을 이제 노래가 한 옥타브 위에서 불러요.",tip2:"12마디 <b>파–시–시–레–도–시</b>: '그녀의 눈에 맺혔네'. 13마디 라에서 쉬어요."},
  {id:4,part:"v1",from:14,to:17,bpm:54,title:"1절 ② — 즐거운 아가씨들",tip:"14마디 <b>미–레♯–미–솔–파</b>: 높은 솔에 악센트(>)! 15마디 <b>점8분음표 + 16분음표</b>는 '따–안 딴' 리듬이에요.",tip2:"16마디는 한 음씩 내려와 17마디 <b>낮은 미</b>에서 쉬어요. 왼손은 <b>레♯</b>이 들어간 어두운 화음이에요."},
  {id:5,part:"v1",from:18,to:21,bpm:54,title:"1절 ③ — 더 무엇을 찾으리",tip:"'che più cercando io vò' — 더 무엇을 찾으리? 같은 말을 두 번 노래해요. 두 번째(20마디)는 <b>파</b>까지 올라가요.",tip2:"21마디 높은 <b>미</b>를 한 마디 가득(점2분음표) 길게 — 다음 마디까지 붙임줄로 이어져요."},
  {id:6,part:"v1",from:22,to:25,bpm:54,title:"1절 ④ — 그녀는 나를 사랑해!",tip:"<b>f</b>(세게)! 'm'ama, sì, m'ama' — 그녀는 나를 사랑해! 23마디 <b>솔–파–미–레–미–파</b>를 부드럽게 이어서.",tip2:"24마디 '<b>lo vedo</b>'(나는 알아요): 도 → 솔 솔 → 높은 미로 뛰어올라요. 25마디 끝 <b>미–레–시</b>는 2절로 넘어가는 다리예요."},
  {id:7,part:"v2",from:26,to:30,bpm:54,title:"2절 ① — 한순간만이라도",tip:"26마디는 왼손만 쳐요(노래 쉼). 27마디부터 1절과 <b>똑같은 선율</b>에 가사만 바뀌어요: 'Un solo istante i palpiti'.",tip2:"3단계(10~13마디)를 연습했다면 이미 칠 수 있어요! ★ 복습 단계예요."},
  {id:8,part:"v2",from:31,to:34,bpm:52,title:"2절 ② — 한숨을 섞고 싶어",tip:"31~32마디는 14~15마디와 거의 같아요. 33마디 <b>pp smorz.</b>(아주 여리게, 사라지듯) — 레를 세 번 부드럽게.",tip2:"34마디 끝의 16분음표 <b>미</b>는 다음 마디로 들어가는 '숨'이에요."},
  {id:9,part:"v2",from:35,to:38,bpm:52,title:"2절 ③ — 두근거림을 느끼고 싶어",tip:"'i palpiti'(두근거림) — <b>점8분음표 + 16분음표 3개</b> 리듬이 심장 소리처럼 두근두근!",tip2:"왼손은 4마디 내내 <b>미 화음(E7)</b>이에요. 38마디 긴 미 다음 <b>가장조</b>로 밝게 바뀌어요."},
  {id:10,part:"maj",from:39,to:42,bpm:54,title:"가장조 ① — 하늘이여!",tip:"조표가 <b>♯ 3개(파♯·도♯·솔♯)</b>로 바뀌어요! 'Cielo, si può morir' — 하늘이여, 이제 죽어도 좋아요. 밝고 세게(<b>f</b>).",tip2:"40마디 <b>라♯–시–도♯–레–미–파♯</b> 16분음표 음계로 올라가요(p, 여리게)."},
  {id:11,part:"maj",from:43,to:45,bpm:48,title:"가장조 ② — 카덴차",tip:"43마디는 39마디를 다시 부르고, 44마디 음계 다음 45마디 <b>카덴차</b>(늘임표 𝄐 위에서 자유롭게 부르는 빠른 음)!",tip2:"🌱 쉬운 악보는 카덴차를 빼고 <b>솔♯ → 시</b>만 길게 쳐요. 원곡 소리에서 빠른 음계를 들어 보세요."},
  {id:12,part:"end",from:46,to:52,bpm:48,title:"끝맺음 — 사랑으로 죽어도 좋아",tip:"'<b>Si può morir!</b>'(이제 죽어도 좋아!) — <b>솔♯–시–레</b>로 올라가 늘임표(𝄐)에서 길게. 처음은 <b>f</b>(세게), 두 번째는 <b>p</b>(여리게). 이 부분은 피아노 반주 없이 노래만 해요(왼손 쉼).",tip2:"48마디 <b>파♮</b>(하얀 건반 파!) → <b>미</b>를 길게 'd'amor'(사랑으로). 49~52마디는 피아노가 '파–미–레♯–미' 짧은 노래로 대답하고 라 화음으로 끝나요."}
];
var PARTS={intro:"🎺 도입 — 바순의 노래",v1:"💧 1절 — 남몰래 흐르는 눈물",v2:"💓 2절 — 한순간만이라도",maj:"☀️ 가장조 — 하늘이여!",end:"🌙 끝맺음 — 죽어도 좋아"};
var PART_NOTE={
  intro:"오페라에서는 바순이 부르는 슬픈 선율이에요. 왼손 펼친 화음 위에서 오른손이 노래해요.",
  v1:"네모리노가 부르는 노래가 시작돼요. 처음엔 <b>🌱 쉬운 악보</b>로!",
  v2:"1절과 같은 선율이 다시 나오고, 후반은 새로운 두근거림의 리듬이에요.",
  maj:"단조에서 장조로! 밝고 세게, 그리고 카덴차.",
  end:"「사랑으로 죽어도 좋아!」 늘임표 위에서 노래만 부르는 3마디, 그리고 피아노 마무리."
};
var follow=null,followStep=null;
function isDone(id,w){return store("fu-done-"+id+"-"+w)==="1";}
function stars(id){return (isDone(id,"R")?"★":"☆")+(isDone(id,"L")?"★":"☆");}
STEPS.forEach(function(st){
  st.orig={R:SE.parseBars(F.rh.slice(st.from-1,st.to)),L:SE.parseBars(F.lh.slice(st.from-1,st.to))};
  st.easy={R:SE.parseBars(F.rhE.slice(st.from-1,st.to)),L:SE.parseBars(F.lhE.slice(st.from-1,st.to))};
  st.origBpm=Math.round(F.bars.slice(st.from-1,st.to).reduce(function(a,b){return a+b.bpm;},0)/(st.to-st.from+1));
});
function mode(st){var d=$("step"+st.id);return d&&d.querySelector('[data-o="ver"]').value==="orig"?"orig":"easy";}
function stepBars(st,bpm){return BARS.slice(st.from-1,st.to).map(function(b){return {sig:b.sig,key:b.key,ts:b.ts,bpm:bpm};});}
function sigTag(st){return "6/8박자 (8분음표 6개)";}
function keyTag(st){return BARS[st.from-1].key===3||BARS[st.to-1].key===3?"가장조 (♯3: 파♯·도♯·솔♯)":"가단조 (조표 없음 · 솔♯ 자주)";}
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
    '<div class="tags"><span class="tag">'+keyTag(st)+'</span><span class="tag">'+sigTag(st)+'</span><span class="tag">원곡 '+st.from+'~'+st.to+'마디</span><span class="tag">원곡 빠르기 ♩≈'+st.origBpm+'</span></div>'+
    '<p class="tip">💡 '+st.tip+'</p><p class="tip">👉 '+st.tip2+'</p>'+
    '<div class="ctrls opts"><label class="chk">악보 <select data-o="ver"><option value="easy" selected>🌱 쉬운 악보 (멜로디 + 베이스)</option><option value="orig">🎼 원곡 그대로 (화음·빠른 음)</option></select></label></div>'+
    '<div class="score" id="score'+st.id+'"></div>'+
    '<div class="beatline" id="beat'+st.id+'">'+["1·2","3·4","5·6"].map(function(i){return '<span class="beatdot" style="width:44px;border-radius:16px">'+i+'</span>';}).join("")+'</div>'+
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
    SE.render($("score"+st.id),{staves:[{clef:"treble",items:v.R,prefix:"R"+st.id+"-",labels:true,ott:true},{clef:"bass",items:v.L,prefix:"L"+st.id+"-",labels:true}],bars:stepBars(st,st.bpm),startBar:st.from});
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
    onDone:function(){follow=null;followStep=null;ME.confetti();store("fu-done-"+st.id+"-"+hand,"1");$("star"+st.id).textContent=stars(st.id);
      msg(st,"🎉 참 잘했어요! "+(hand==="R"?"오른손 멜로디":"왼손 반주")+"를 끝까지 쳤어요. 이제 ▶ 소리와 같이 쳐 봐요!","good");}});
  document.querySelectorAll('[data-i^="'+prefix+'"].done').forEach(function(e){e.classList.remove("done");});
  kbEl.scrollIntoView({behavior:"smooth",block:"center"});
}
var first=$("step3");if(first){first.open=true;STEPS[2].draw();}
})();
