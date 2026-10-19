/* 차르다시 피아노 교실
   - 큰보표 악보: 조표·임시표·16분/32분음표·셋잇단음표·붙임줄·계이름, 마디마다 조·박자 바뀜
   - 움직이는 악보: 소리에 맞춰 재생선과 공이 음표를 따라가고, 치는 음표가 빛나요(자동 스크롤)
   - 전곡 듣기(174마디, 원곡 빠르기 변화 반영) + 11단계 조각 레슨, 따라치기
   소리·건반은 music-engine.js의 ME 사용 */
(function(){
"use strict";
var ME=window.ME,STEPS=window.CZ_STEPS,FULL=window.CZ_FULL,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

var SE=window.SE,parseBars=SE.parseBars,audioItems=SE.audioItems,render=SE.render,play=SE.play,stopAll=SE.stopAll,barFromClick=SE.barFromClick;

/* ---------- 미니 악보: 조표와 음계 ---------- */
var SCALES={
  minor:{key:-1,names:["D4","E4","F4","G4","A4","Bb4","C#5","D5"]},
  major:{key:2,names:["D4","E4","F#4","G4","A4","B4","C#5","D5"]}
};
Object.keys(SCALES).forEach(function(k){
  var sc=SCALES[k],items=parseBars([sc.names.map(function(n){return n+":e";})]),el=$("scale-"+k);
  var bars=[{sig:4,key:sc.key,bpm:90}];
  var draw=function(){render(el,{staves:[{clef:"treble",items:items,prefix:"S"+k,labels:true}],bars:bars,startBar:1});};
  draw();window.addEventListener("resize",debounce(draw,200));
  $("scaleplay-"+k).onclick=function(){
    if(SE.cur()&&SE.cur().btn===this){stopAll();return;}
    play([{el:el,bars:bars,parts:[{items:items,prefix:"S"+k,vel:.5,light:true}]}],{btn:this});
  };
});

/* ---------- 전곡 듣기 ---------- */
var SECS={1:"피아노 전주",5:"Largo 느리게 ♩=66",14:"Largo 꾸밈 변주",30:"Allegro vivo 아주 빠르게 ♩=144",94:"Molto meno 라장조 ♩=70",110:"Meno, quasi lento 아주 여리게",126:"Allegro vivo 다시 빠르게 (라단조)",140:"피날레 라장조 ♩=152~160"};
var full=null;
if(FULL&&$("fullScore")){
  full={R:parseBars(FULL.rh),L:parseBars(FULL.lh),bars:FULL.bars.map(function(b,i){return {sig:b.sig,key:b.key,bpm:b.bpm,sec:SECS[i+1]};})};
  full.RA=audioItems(full.R);
  var fs=$("fullScore"),drawFull=function(){render(fs,{staves:[{clef:"treble",items:full.R,prefix:"FR",labels:true},{clef:"bass",items:full.L,prefix:"FL",labels:true}],bars:full.bars,startBar:1});};
  var kbF=ME.keyboard(48,95,{kw:24,kh:110});
  $("fullKb").innerHTML='<svg viewBox="0 0 '+kbF.w+' '+kbF.h+'" style="min-width:720px">'+kbF.svg+'</svg>';
  var fullDrawn=false,ensure=function(){if(!fullDrawn){drawFull();fullDrawn=true;}};
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){ensure();io.disconnect();}},{rootMargin:"600px"});io.observe(fs);}else ensure();
  window.addEventListener("resize",debounce(function(){if(fullDrawn&&!(SE.cur()&&SE.cur().chunks[0].el===fs))drawFull();},250));
  var fullPlay=function(btn,mode,fromBar){
    ensure();
    var mul=+$("fullSpeed").value,parts=[];
    if(mode!=="L")parts.push({items:full.RA,vel:.5},{items:full.R,prefix:"FR",audio:false,light:true});
    if(mode!=="R")parts.push({items:full.L,prefix:"FL",vel:mode==="L"?.5:.36,light:true});
    play([{el:fs,bars:full.bars,parts:parts,kb:$("fullKb")}],{btn:btn,mul:mul,fromBar:fromBar,metro:$("fullMetro").checked,scrollBox:fs,
      onBar:function(b){var s=$("fullNow");if(s)s.textContent=(b+1)+" / "+full.bars.length+"마디"+(SECS[b+1]?" · "+SECS[b+1]:"");}});
  };
  [].forEach.call(document.querySelectorAll("[data-full]"),function(b){
    b.onclick=function(){var m=b.dataset.full;if(m==="stop"){stopAll();return;}if(SE.cur()&&SE.cur().btn===b){stopAll();return;}fullPlay(b,m,null);};
  });
  [].forEach.call(document.querySelectorAll("[data-jump]"),function(b){
    b.onclick=function(){fullPlay($("fullBoth"),"B",+b.dataset.jump-1);};
  });
  fs.addEventListener("click",function(e){var b=barFromClick(fs,e);if(b!=null)fullPlay($("fullBoth"),"B",b);});
}

/* ---------- 단계별 레슨 ---------- */
var follow=null,followStep=null;
function isDone(id,what){return store("cz-done-"+id+"-"+what)==="1";}
function stars(id){return (isDone(id,"R")?"★":"☆")+(isDone(id,"L")?"★":"☆");}
var lessonsEl=$("lessonList"),partOrder=[];
STEPS.forEach(function(st){
  st.R=parseBars(st.rh);st.L=parseBars(st.lh);st.RA=audioItems(st.R);
  if(partOrder.indexOf(st.part)<0)partOrder.push(st.part);
});
function stepBars(st,bpm){return st.rh.map(function(){return {sig:st.sig,key:st.key,bpm:bpm};});}
var PART_NOTE={
  largo:"바이올린이 노래하듯 느리게 시작해요. <b>4/4박자</b>, 조표 <b>♭1개(시♭)</b> = 라단조.",
  allegro:"갑자기 빨라지는 집시 춤! <b>2/4박자</b>(한 마디 2박). 왼손은 <b>쿵(레)–쿵(라)</b> 두 박.",
  meno:"조표가 <b>♯2개(파♯·도♯)</b>로 바뀌어 밝은 <b>라장조</b>가 돼요. 원곡 바이올린은 여기서 맑은 '하모닉스' 소리를 내요.",
  finale:"다시 아주 빠르게, 이번엔 <b>라장조</b>로 신나게 끝나요."
};
partOrder.forEach(function(part){
  var steps=STEPS.filter(function(s){return s.part===part;});
  var box=document.createElement("div");box.className="part";
  box.innerHTML='<h3 class="parth">'+steps[0].partName+'</h3><p class="lead" style="margin:0 0 8px">'+PART_NOTE[part]+'</p>'+
    '<div class="ctrls"><button class="btn blue" data-pp="'+part+'" data-sp="p">▶ 이 부분 이어 듣기 (연습 빠르기)</button><button class="btn alt" data-pp="'+part+'" data-sp="o">▶ 원곡 빠르기로 듣기</button></div>';
  steps.forEach(function(st){box.appendChild(stepCard(st));});
  lessonsEl.appendChild(box);
});
lessonsEl.addEventListener("click",function(e){
  var b=e.target.closest("[data-pp]");if(!b)return;
  if(SE.cur()&&SE.cur().btn===b){stopAll();return;}
  var steps=STEPS.filter(function(s){return s.part===b.dataset.pp;}),orig=b.dataset.sp==="o";
  steps.forEach(function(st){var d=$("step"+st.id);if(!d.open)d.open=true;st.draw();});
  play(steps.map(function(st){
    return {el:$("score"+st.id),bars:stepBars(st,orig?st.orig:st.bpm),beatsEl:$("beat"+st.id),
      parts:[{items:st.RA,vel:.5},{items:st.R,prefix:"R"+st.id+"-",audio:false,light:true},{items:st.L,prefix:"L"+st.id+"-",vel:.36,light:true}]};
  }),{btn:b,countIn:true});
});

function stepCard(st){
  var d=document.createElement("details");d.className="card step";d.id="step"+st.id;
  var keyName=st.key===-1?"라단조 (♭1: 시♭)":"라장조 (♯2: 파♯·도♯)";
  var bars=st.pdf?("원곡 "+st.pdf+"~"+(st.pdf+st.rh.length-1)+"마디"):"마지막 부분";
  d.innerHTML='<summary><span class="snum">'+st.id+'</span><span class="stitle">'+st.title+'</span><span class="sstar" id="star'+st.id+'" title="오른손·왼손 따라치기 완료">'+stars(st.id)+'</span></summary>'+
    '<div class="sbody">'+
    '<div class="tags"><span class="tag">'+keyName+'</span><span class="tag">'+st.sig+'/4박자</span><span class="tag">'+bars+'</span><span class="tag">원곡 빠르기 ♩='+st.orig+'</span></div>'+
    '<p class="tip">💡 '+st.tip+'</p><p class="tip">👉 '+st.tip2+'</p>'+
    '<div class="score" id="score'+st.id+'"></div>'+
    '<div class="beatline" id="beat'+st.id+'">'+Array.apply(null,{length:st.sig}).map(function(_,i){return '<span class="beatdot">'+(i+1)+'</span>';}).join("")+'</div>'+
    '<div class="ctrls">'+
      '<button class="btn" data-a="R">▶ 오른손(멜로디)</button>'+
      '<button class="btn" data-a="B" style="background:#6a4bc4">▶ 양손 같이</button>'+
      '<button class="btn alt" data-a="L">▶ 왼손만</button>'+
      '<button class="btn alt" data-a="stop">⏹ 멈춤</button>'+
    '</div>'+
    '<div class="ctrls opts">'+
      '<label class="chk">빠르기 <select data-o="speed"><option value="slow">🐢 아주 느리게 (♩='+Math.round(st.bpm*.75)+')</option><option value="prac" selected>🚶 연습 (♩='+st.bpm+')</option><option value="orig">🏃 원곡 (♩='+st.orig+')</option></select></label>'+
      '<label class="chk"><input type="checkbox" data-o="metro" checked> 메트로놈</label>'+
      '<label class="chk"><input type="checkbox" data-o="loop"> 반복</label>'+
    '</div>'+
    '<div class="ctrls"><button class="btn green" data-a="FR">🎹 오른손 따라치기</button><button class="btn green" data-a="FL">🎹 왼손 따라치기</button></div>'+
    '<div class="msg" id="msg'+st.id+'">파란 건반을 따라 누르면 한 음씩 넘어가요. 건반을 눌러 소리도 내 봐요.</div>'+
    '<div class="kb" id="kb'+st.id+'"></div>'+
    '</div>';
  var drawn=false;
  st.draw=function(){
    if(SE.cur()&&SE.cur().chunks.some(function(c){return c.el===$("score"+st.id);}))return;
    render($("score"+st.id),{staves:[{clef:"treble",items:st.R,prefix:"R"+st.id+"-",labels:true},{clef:"bass",items:st.L,prefix:"L"+st.id+"-",labels:true}],bars:stepBars(st,st.bpm),startBar:st.pdf||1});
    if(!drawn){
      drawn=true;window.addEventListener("resize",debounce(function(){if(d.open)st.draw();},200));
      var all=[];st.R.concat(st.L).forEach(function(it){it.notes.forEach(function(n){all.push(n.midi);});});
      var lo=Math.min.apply(0,all),hi=Math.max.apply(0,all);
      while(lo%12!==0&&lo%12!==5)lo--;
      while(hi%12!==4&&hi%12!==11)hi++;
      var kb=ME.keyboard(lo,hi,{kw:30,kh:130});
      $("kb"+st.id).innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:'+Math.min(900,kb.w)+'px">'+kb.svg+'</svg>';
      $("kb"+st.id).addEventListener("pointerdown",function(e){var k=e.target.closest("[data-m]");if(!k)return;e.preventDefault();pressKey(st,+k.dataset.m);});
    }
  };
  d.addEventListener("toggle",function(){
    if(!d.open){if(followStep===st)endFollow();return;}
    if(!drawn)st.draw();
  });
  d.addEventListener("click",function(e){
    var b=e.target.closest("[data-a]");if(!b)return;
    var a=b.dataset.a;
    if(a==="stop"){stopAll();endFollow();return;}
    if(a==="FR"||a==="FL"){startFollow(st,a==="FR"?"R":"L");return;}
    if(SE.cur()&&SE.cur().btn===b){stopAll();return;}
    endFollow();
    var sp=d.querySelector('[data-o="speed"]').value,bpm=sp==="slow"?Math.round(st.bpm*.75):sp==="orig"?st.orig:st.bpm;
    var parts=[];
    if(a!=="L")parts.push({items:st.RA,vel:.5},{items:st.R,prefix:"R"+st.id+"-",audio:false,light:true});
    if(a!=="R")parts.push({items:st.L,prefix:"L"+st.id+"-",vel:a==="L"?.5:.38,light:true});
    play([{el:$("score"+st.id),bars:stepBars(st,bpm),parts:parts,kb:$("kb"+st.id),beatsEl:$("beat"+st.id)}],{btn:b,countIn:true,
      metro:d.querySelector('[data-o="metro"]').checked,
      loop:function(){return d.querySelector('[data-o="loop"]').checked;}});
  });
  return d;
}

function msg(st,t,cls){var m=$("msg"+st.id);m.textContent=t;m.className="msg"+(cls?" "+cls:"");}
function pressKey(st,m){
  ME.ac();ME.piano(m,ME.now()+.005,.5,.45);
  if(follow&&followStep===st)follow.press(m);
  else{var k=document.querySelector('#kb'+st.id+' [data-m="'+m+'"]');if(k){k.classList.add("on");setTimeout(function(){k.classList.remove("on");},180);}}
}
function endFollow(){if(follow){follow.end(true);follow=null;followStep=null;}}
function startFollow(st,hand){
  stopAll();endFollow();
  var items=hand==="R"?st.R:st.L,prefix=(hand==="R"?"R":"L")+st.id+"-";
  var steps=items.filter(function(it){return !it.rest&&!it.cont;}).map(function(it){return {it:it,prefix:prefix,midis:it.notes.map(function(n){return n.midi;})};});
  followStep=st;
  document.querySelectorAll('#score'+st.id+' .n.pl').forEach(function(e){e.classList.remove("pl");});
  follow=new ME.Follow(steps,{kbRoot:$("kb"+st.id),
    onShow:function(s,i,n){msg(st,"다음 → "+s.it.notes.map(function(x){return x.sol;}).join("·")+"  ("+(i+1)+" / "+n+")");},
    onWrong:function(){var sc=$("score"+st.id);sc.classList.remove("shake");void sc.offsetWidth;sc.classList.add("shake");msg(st,"앗! 다른 건반이에요. 파란 건반을 눌러 봐요.","bad");},
    onDone:function(){
      follow=null;followStep=null;ME.confetti();store("cz-done-"+st.id+"-"+hand,"1");$("star"+st.id).textContent=stars(st.id);
      msg(st,"🎉 참 잘했어요! "+(hand==="R"?"오른손 멜로디":"왼손 반주")+"를 끝까지 쳤어요. 이제 ▶ 소리와 같이 쳐 봐요!","good");
    }});
  document.querySelectorAll('[data-i^="'+prefix+'"].done').forEach(function(e){e.classList.remove("done");});
  $("kb"+st.id).scrollIntoView({behavior:"smooth",block:"center"});
}

var firstStep=$("step1");if(firstStep){firstStep.open=true;STEPS[0].draw();}
window.CZ_render=render;
})();
