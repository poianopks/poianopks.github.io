/* 소녀의 기도 피아노 교실: 원곡 악보(내림마장조 ♭3) + 쉬운 악보, 움직이는 악보, 전곡 듣기, 따라치기
   악보·재생 엔진 = score-engine.js(SE), 소리·건반 = music-engine.js(ME) */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,F=window.PR_FULL,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

/* ---------- 쉬운 악보: 오른손 한 음(옥타브는 아랫음), 왼손 한 음(옥타브는 윗음, 화음은 맨 아래음) ---------- */
function easyTok(tok,hand){
  var m=/^([^:]+):(.+)$/.exec(tok);if(!m||m[1]==="r")return tok;
  var ns=m[1].split("+");if(ns.length<2)return tok;
  var mid=ns.map(function(n){return ME.noteFromName(n).midi;}),ord=mid.map(function(v,i){return i;}).sort(function(a,b){return mid[a]-mid[b];});
  var lo=ord[0],hi=ord[ord.length-1],pick;
  if(ns.length===2&&mid[hi]-mid[lo]===12)pick=hand==="R"?lo:hi;
  else pick=hand==="R"?hi:lo;
  return ns[pick]+":"+m[2];
}
function easyBars(bars,hand){return bars.map(function(b){return b.map(function(t){return easyTok(t,hand);});});}

/* ---------- 구간 ---------- */
var SECS={1:"전주 Andante",5:"주제 — 소녀의 기도 멜로디",13:"변주 1 — 반짝이는 아르페지오 (반복)",29:"변주 2 — 낮은 목소리로 (marcato)",37:"변주 3 — 트릴 장식 (반복)",53:"변주 4 — 셋잇단 화음 (마지막)"};
var BARS=F.bars.map(function(b,i){return {sig:b.sig,key:b.key,bpm:b.bpm,sec:SECS[i+1]};});
/* 소리: 원곡 MIDI(꾸밈음·트릴·페달 울림 포함) */
function rawItems(hand,b0,b1){
  var g0=b0*4,g1=b1*4;
  return F.raw.filter(function(r){return (!hand||r[3]===hand)&&r[0]>=g0-1e-6&&r[0]<g1-1e-6;}).map(function(r){
    var n=ME.noteFromMidi(r[2]);
    return {notes:[n],gpos:r[0]-g0,len:Math.min(r[1],g1-r[0]),pos:(r[0]-g0)%4};
  });
}

/* ---------- 조표 배우기 ---------- */
(function(){
  var items=SE.parseBars([["Eb4:e","F4:e","G4:e","Ab4:e","Bb4:e","C5:e","D5:e","Eb5:e"]]),el=$("scale-eb"),bars=[{sig:4,key:-3,bpm:90}];
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
  {id:1,part:"intro",from:1,to:4,bpm:56,title:"전주 — 옥타브로 내려오기",tip:"<b>미♭–레–도–시♭ | 라♭–솔–파–미♭</b>: 계단처럼 한 음씩 내려와요. 원곡은 양손 모두 <b>옥타브</b>(같은 음 두 개)예요.",tip2:"마지막 마디는 <b>늘임표(𝄐)</b> — 충분히 길게 눌러 기다려요."},
  {id:2,part:"theme",from:5,to:6,bpm:48,title:"주제 ① — 셋잇단 아르페지오",tip:"쉼표 다음에 <b>시♭–미♭–솔</b>을 <b>셋잇단음표(3)</b>로 굴리듯 올라가요. 높은 음은 <b>8va</b>(적힌 것보다 한 옥타브 위)!",tip2:"왼손은 <b>쿵(낮은 미♭) – 짝 – 짝 – 짝</b>. 짝 화음은 시♭·미♭·솔."},
  {id:3,part:"theme",from:7,to:8,bpm:48,title:"주제 ② — 노래하듯",tip:"<b>파–미♭–미♭–레–도</b>: 가장 유명한 '소녀의 기도' 선율이에요. 점8분음표+16분음표는 '따—안 따'.",tip2:"8마디는 <b>레–파–시♭</b>로 다시 올라가요. 왼손 화음이 바뀌어요(라♭·도·파 → 파·라♭·시♭·레)."},
  {id:4,part:"theme",from:9,to:10,bpm:48,title:"주제 ③ — 다시 한 번",tip:"①과 같은 모양이 한 번 더 나와요. 손 모양이 익숙해졌을 거예요!",tip2:"높은 음은 무리하지 말고 <b>쉬운 악보</b>로 먼저 연습해요."},
  {id:5,part:"theme",from:11,to:12,bpm:44,title:"주제 ④ — 트릴로 마무리",tip:"마지막 마디의 <b>tr(트릴)</b>은 시♭과 도를 빠르게 번갈아 치는 장식이에요. 처음엔 <b>시♭ 하나만</b> 길게 쳐도 괜찮아요.",tip2:"솔–파–미♭으로 차분하게 끝나요."},
  {id:6,part:"var2",from:29,to:32,bpm:52,title:"낮은 목소리 ① — 변주 2",tip:"멜로디가 <b>낮은 음</b>으로 내려와요(오른손이 낮은음자리표). 주제와 같은 노래를 다른 목소리로!",tip2:"왼손은 반대로 <b>높은음자리표</b>로 올라가 화음을 짚어요. 음자리표가 바뀌는 곳을 잘 봐요."},
  {id:7,part:"var2",from:33,to:35,bpm:52,title:"낮은 목소리 ② — 변주 2",tip:"①의 노래를 이어서. <b>marcato</b> = 한 음 한 음 또렷하게.",tip2:"35마디는 내려가는 선율로 다음 장식에 이어져요."},
  {id:8,part:"var4",from:53,to:56,bpm:50,title:"셋잇단 화음 ① — 변주 4",tip:"한 박에 <b>3번씩</b> 같은 화음(옥타브)을 통통 쳐요. 손목 힘을 빼고 가볍게!",tip2:"쉬운 악보로 한 음씩 → 익숙해지면 원곡 옥타브로."},
  {id:9,part:"var4",from:57,to:60,bpm:50,title:"셋잇단 화음 ② — 끝맺음",tip:"<b>cre–scen–do</b>(점점 세게) 했다가 <b>ritard.</b>(점점 느리게)로 끝!",tip2:"마지막 미♭ 화음은 늘임표로 충분히 길게."}
];
var PARTS={intro:"🎬 전주",theme:"🙏 주제 — 가장 유명한 '소녀의 기도' 멜로디",var2:"🎻 변주 2 — 낮은 목소리",var4:"✨ 변주 4 — 셋잇단 화음"};
var PART_NOTE={
  intro:"힘차게(f) 시작하는 4마디. <b>옥타브</b>로 한 음씩 내려와요.",
  theme:"모두가 아는 그 선율! 원곡은 오른손이 <b>옥타브 + 8va</b>로 아주 높게 노래해요. 처음엔 <b>쉬운 악보</b>로 한 음씩.",
  var2:"같은 노래를 <b>낮은 음</b>으로. 오른손 낮은음자리표, 왼손 높은음자리표로 바뀌어요.",
  var4:"셋잇단음표 화음이 반짝이며 끝나는 부분이에요."
};
var follow=null,followStep=null;
function isDone(id,w){return store("pr-done-"+id+"-"+w)==="1";}
function stars(id){return (isDone(id,"R")?"★":"☆")+(isDone(id,"L")?"★":"☆");}
STEPS.forEach(function(st){
  st.orig={R:SE.parseBars(F.rh.slice(st.from-1,st.to)),L:SE.parseBars(F.lh.slice(st.from-1,st.to))};
  st.easy={R:SE.parseBars(easyBars(F.rh.slice(st.from-1,st.to),"R")),L:SE.parseBars(easyBars(F.lh.slice(st.from-1,st.to),"L"))};
  st.origBpm=Math.round(F.bars.slice(st.from-1,st.to).reduce(function(a,b){return a+b.bpm;},0)/(st.to-st.from+1));
});
function mode(st){var d=$("step"+st.id);return d&&d.querySelector('[data-o="ver"]').value==="orig"?"orig":"easy";}
function stepBars(st,bpm){return BARS.slice(st.from-1,st.to).map(function(b){return {sig:4,key:-3,bpm:bpm};});}
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
    '<div class="tags"><span class="tag">내림마장조 (♭3: 시♭·미♭·라♭)</span><span class="tag">4/4박자</span><span class="tag">원곡 '+st.from+'~'+st.to+'마디</span><span class="tag">원곡 빠르기 ♩≈'+st.origBpm+'</span></div>'+
    '<p class="tip">💡 '+st.tip+'</p><p class="tip">👉 '+st.tip2+'</p>'+
    '<div class="ctrls opts"><label class="chk">악보 <select data-o="ver"><option value="easy" selected>🌱 쉬운 악보 (한 손에 한 음씩)</option><option value="orig">🎼 원곡 그대로 (옥타브·화음)</option></select></label></div>'+
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
      var all=[];["orig","easy"].forEach(function(k){st[k].R.concat(st[k].L).forEach(function(it){it.notes.forEach(function(n){all.push(n.midi);});});});
      var lo=Math.min.apply(0,all),hi=Math.max.apply(0,all);
      while(lo%12!==0&&lo%12!==5)lo--;while(hi%12!==4&&hi%12!==11)hi++;
      var kb=ME.keyboard(lo,hi,{kw:26,kh:120});
      $("kb"+st.id).innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:'+Math.min(980,kb.w)+'px">'+kb.svg+'</svg>';
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
  document.querySelectorAll('#score'+st.id+' .n.pl').forEach(function(e){e.classList.remove("pl");});
  follow=new ME.Follow(steps,{kbRoot:$("kb"+st.id),
    onShow:function(s,i,n){msg(st,"다음 → "+s.it.notes.map(function(x){return x.sol;}).join("·")+(s.midis.length>1?" (같이 누르기)":"")+"  ("+(i+1)+" / "+n+")");},
    onPartial:function(s,left){msg(st,"좋아요! 나머지 파란 건반도 같이 눌러요 ("+left.length+"개 남음)");},
    onWrong:function(){var sc=$("score"+st.id);sc.classList.remove("shake");void sc.offsetWidth;sc.classList.add("shake");msg(st,"앗! 다른 건반이에요. 파란 건반을 눌러 봐요.","bad");},
    onDone:function(){follow=null;followStep=null;ME.confetti();store("pr-done-"+st.id+"-"+hand,"1");$("star"+st.id).textContent=stars(st.id);
      msg(st,"🎉 참 잘했어요! "+(hand==="R"?"오른손 멜로디":"왼손 반주")+"를 끝까지 쳤어요. 이제 ▶ 소리와 같이 쳐 봐요!","good");}});
  document.querySelectorAll('[data-i^="'+prefix+'"].done').forEach(function(e){e.classList.remove("done");});
  $("kb"+st.id).scrollIntoView({behavior:"smooth",block:"center"});
}
var first=$("step2");if(first){first.open=true;STEPS[1].draw();}
})();
