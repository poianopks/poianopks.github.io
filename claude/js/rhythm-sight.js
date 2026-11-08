/* 리듬·시창 교실: 12단계 연습곡(움직이는 악보·리듬만 듣기·멜로디 듣기·따라치기) + 무한 시창 문제
   악보·재생 엔진 = score-engine.js(SE), 소리·건반 = music-engine.js(ME), 연습곡 = rhythm-sight-data.js(RS_DATA) */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,D=window.RS_DATA,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

var KEYNAME={"0":"다장조 (조표 없음)","1":"사장조 (♯1: 파♯)","-1":"바장조 (♭1: 시♭)"};
var SPEED={slow:.7,prac:1,fast:1.25};
function barsOf(n,sig,key,bpm){var a=[];for(var i=0;i<n;i++)a.push({sig:sig,key:key,bpm:bpm});return a;}
/* 리듬만: 모든 음을 한 음(높은 도)으로 */
function rhythmItems(items){
  var c=ME.noteFromName("C5");
  return SE.audioItems(items).map(function(a){return {notes:[c],gpos:a.gpos,len:a.len,bar:a.bar,pos:a.pos};});
}
function staves(ex,clef,pre,labels){
  if(clef==="grand")return [{clef:"treble",items:ex.R,prefix:pre+"R-",labels:labels},{clef:"bass",items:ex.L,prefix:pre+"L-",labels:labels}];
  return [{clef:clef,items:ex.R,prefix:pre+"R-",labels:labels}];
}

/* ---------- 단계별 연습 ---------- */
var follow=null,followCard=null;
function isDone(id,h){return store("rs-done-"+id+"-"+h)==="1";}
function stars(c){return (isDone(c.id,"R")?"★":"☆")+(c.clef==="grand"?(isDone(c.id,"L")?"★":"☆"):"");}
var listEl=$("levelList"),CARDS=[];
D.forEach(function(lv,li){
  var box=document.createElement("div");box.className="part";box.id="lv"+(li+1);
  box.innerHTML='<h3 class="parth"><span class="lvnum">'+(li+1)+'</span>'+lv.title+'</h3><p class="lead" style="margin:0 0 4px"><b>'+lv.sub+'</b></p><p class="tip">💡 '+lv.tip+'</p>';
  lv.ex.forEach(function(ex,ei){
    var c={id:(li+1)+"-"+(ei+1),lv:lv,li:li,ex:ex,clef:lv.clef,sig:lv.sig,key:ex.key,bpm:lv.bpm,
      R:SE.parseBars(ex.R),L:ex.L?SE.parseBars(ex.L):null};
    CARDS.push(c);box.appendChild(card(c));
  });
  listEl.appendChild(box);
});
function card(c){
  var d=document.createElement("details");d.className="card step";d.id="ex"+c.id;
  var grand=c.clef==="grand",pre="X"+c.id.replace("-","_")+"-";
  d.innerHTML='<summary><span class="snum">'+c.id+'</span><span class="stitle">'+c.ex.t+'</span><span class="sstar" id="star'+c.id+'" title="따라치기 완료">'+stars(c)+'</span></summary>'+
    '<div class="sbody">'+
    '<div class="tags"><span class="tag">'+c.sig+'/4박자</span><span class="tag">'+KEYNAME[c.key]+'</span><span class="tag">'+(c.clef==="bass"?"낮은음자리표":grand?"큰보표 (양손)":"높은음자리표")+'</span><span class="tag">♩='+c.bpm+'</span></div>'+
    '<div class="score" id="sc'+c.id+'"></div>'+
    '<div class="beatline" id="bt'+c.id+'">'+Array.apply(null,{length:c.sig}).map(function(_,i){return '<span class="beatdot">'+(i+1)+'</span>';}).join("")+'</div>'+
    '<div class="ctrls">'+
      '<button class="btn alt" data-a="rhythm">🥁 리듬만 듣기</button>'+
      (grand?'<button class="btn" data-a="R">▶ 오른손</button><button class="btn alt" data-a="L">▶ 왼손</button><button class="btn" data-a="B" style="background:#6a4bc4">▶ 양손</button>'
            :'<button class="btn" data-a="R">▶ 멜로디 듣기</button>')+
      '<button class="btn alt" data-a="stop">⏹ 멈춤</button>'+
    '</div>'+
    '<div class="ctrls opts">'+
      '<label class="chk">빠르기 <select data-o="speed"><option value="slow">🐢 느리게</option><option value="prac" selected>🚶 보통</option><option value="fast">🏃 빠르게</option></select></label>'+
      '<label class="chk"><input type="checkbox" data-o="metro" checked> 메트로놈</label>'+
      '<label class="chk"><input type="checkbox" data-o="loop"> 반복</label>'+
      '<label class="chk"><input type="checkbox" data-o="lab" checked> 계이름 보기</label>'+
    '</div>'+
    '<div class="ctrls"><button class="btn green" data-a="FR">🎹 '+(grand?"오른손 ":"")+'따라치기</button>'+(grand?'<button class="btn green" data-a="FL">🎹 왼손 따라치기</button>':'')+'</div>'+
    '<div class="msg" id="msg'+c.id+'">시창 연습: <b>계이름 보기</b>를 끄고 먼저 소리 내어 읽은 뒤, ▶ 듣기로 맞는지 확인해요.</div>'+
    '<div class="kb" id="kb'+c.id+'"></div>'+
    '</div>';
  var drawn=false;
  c.draw=function(){
    if(SE.cur()&&SE.cur().chunks.some(function(k){return k.el===$("sc"+c.id);}))return;
    var lab=d.querySelector('[data-o="lab"]').checked;
    SE.render($("sc"+c.id),{staves:staves(c,c.clef,pre,lab),bars:barsOf(c.R.length?c.ex.R.length:4,c.sig,c.key,c.bpm),startBar:1});
    if(!drawn){
      drawn=true;window.addEventListener("resize",debounce(function(){if(d.open)c.draw();},200));
      c.all=function(){var a=[];c.R.concat(c.L||[]).forEach(function(it){it.notes.forEach(function(n){a.push(n.midi);});});return a;};
      SE.drawKb($("kb"+c.id),c.all());
      $("kb"+c.id).addEventListener("pointerdown",function(e){var k=e.target.closest("[data-m]");if(!k)return;e.preventDefault();press(c,+k.dataset.m);});
    }
  };
  d.addEventListener("toggle",function(){if(!d.open){if(followCard===c)endFollow();return;}if(!drawn)c.draw();});
  d.addEventListener("change",function(e){if(e.target.dataset.o==="lab"){SE.stopAll();endFollow();c.draw();}});
  d.addEventListener("click",function(e){
    var b=e.target.closest("[data-a]");if(!b)return;
    var a=b.dataset.a;
    if(a==="stop"){SE.stopAll();endFollow();return;}
    if(a==="FR"||a==="FL"){startFollow(c,a==="FR"?"R":"L");return;}
    if(SE.cur()&&SE.cur().btn===b){SE.stopAll();return;}
    endFollow();
    if($("kb"+c.id)._hand){SE.drawKb($("kb"+c.id),c.all());$("kb"+c.id)._hand=null;}
    var bpm=Math.round(c.bpm*SPEED[d.querySelector('[data-o="speed"]').value]),parts=[];
    var pr="X"+c.id.replace("-","_")+"-";
    if(a==="rhythm")parts.push({items:rhythmItems(c.R),vel:.5},{items:c.R,prefix:pr+"R-",audio:false,light:true});
    else{
      if(a!=="L")parts.push({items:SE.audioItems(c.R),vel:.5},{items:c.R,prefix:pr+"R-",audio:false,light:true});
      if(c.L&&a!=="R")parts.push({items:SE.audioItems(c.L),vel:a==="L"?.5:.36},{items:c.L,prefix:pr+"L-",audio:false,light:true});
    }
    SE.play([{el:$("sc"+c.id),bars:barsOf(c.ex.R.length,c.sig,c.key,bpm),parts:parts,kb:$("kb"+c.id),beatsEl:$("bt"+c.id)}],{btn:b,countIn:true,
      metro:d.querySelector('[data-o="metro"]').checked,loop:function(){return d.querySelector('[data-o="loop"]').checked;}});
  });
  return d;
}
function msg(c,t,cls){var m=$("msg"+c.id);m.innerHTML=t;m.className="msg"+(cls?" "+cls:"");}
function press(c,m){
  ME.ac();ME.piano(m,ME.now()+.005,.5,.45);
  if(follow&&followCard===c)follow.press(m);
  else{var k=document.querySelector('#kb'+c.id+' [data-m="'+m+'"]');if(k){k.classList.add("on");setTimeout(function(){k.classList.remove("on");},180);}}
}
function endFollow(){if(follow){follow.end(true);follow=null;followCard=null;}}
function startFollow(c,hand){
  SE.stopAll();endFollow();
  var items=hand==="R"?c.R:c.L,prefix="X"+c.id.replace("-","_")+"-"+hand+"-";
  var steps=items.filter(function(it){return !it.rest&&!it.cont&&!it.hidden;}).map(function(it){return {it:it,prefix:prefix,midis:it.notes.map(function(n){return n.midi;})};});
  followCard=c;
  var kbEl=$("kb"+c.id),hm=[];steps.forEach(function(x){hm=hm.concat(x.midis);});
  SE.drawKb(kbEl,hm);kbEl._hand=hand;
  document.querySelectorAll('#sc'+c.id+' .n.pl').forEach(function(e){e.classList.remove("pl");});
  follow=new ME.Follow(steps,{kbRoot:kbEl,
    onShow:function(s,i,n){msg(c,"다음 → <b>"+s.it.notes.map(function(x){return x.sol;}).join("·")+"</b>  ("+(i+1)+" / "+n+")");setTimeout(function(){SE.revealKeys(kbEl,s.midis);},30);},
    onPartial:function(s,left){msg(c,"좋아요! 나머지 파란 건반도 같이 눌러요");},
    onWrong:function(){var sc=$("sc"+c.id);sc.classList.remove("shake");void sc.offsetWidth;sc.classList.add("shake");msg(c,"앗! 다른 건반이에요. 악보의 음을 다시 읽어 봐요.","bad");},
    onDone:function(){follow=null;followCard=null;ME.confetti();store("rs-done-"+c.id+"-"+hand,"1");$("star"+c.id).textContent=stars(c);
      msg(c,"🎉 참 잘했어요! 이제 <b>계이름 보기</b>를 끄고 다시 읽어 봐요.","good");}});
  kbEl.scrollIntoView({behavior:"smooth",block:"center"});
}

/* ---------- 단계 바로 가기 ---------- */
var jump=$("lvJump");
D.forEach(function(lv,i){var b=document.createElement("button");b.textContent=(i+1)+". "+lv.title.split(" — ")[0];b.onclick=function(){$("lv"+(i+1)).scrollIntoView({behavior:"smooth"});};jump.appendChild(b);});

/* ---------- 무한 시창 문제 ---------- */
var genSel=$("genLevel"),G={items:null,bars:null};
D.forEach(function(lv,i){if(!lv.gen)return;var o=document.createElement("option");o.value=i;o.textContent=(i+1)+"단계 · "+lv.title;genSel.appendChild(o);});
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function makeQuestion(){
  var lv=D[+genSel.value],g=lv.gen,ns=g.notes,idx=Math.floor(ns.length/2)-1,bars=[];
  if(idx<0)idx=0;
  var tonic=ns.indexOf(lv.clef==="bass"?"C3":"C4");if(tonic<0)tonic=0;
  idx=tonic;
  for(var b=0;b<4;b++){
    var pat,toks=[];
    if(b===3)pat=lv.sig===3?["dh"]:(Math.random()<.5?["w"]:["q","q","h"]);
    else pat=pick(g.durs);
    pat.forEach(function(du,k){
      if(du==="r"){toks.push("r:q");return;}
      var last=b===3&&k===pat.length-1;
      if(last)idx=tonic;
      else if(!(b===0&&k===0)){
        var stepMax=g.leap&&Math.random()<.35?3:1,dir=Math.random()<.5?-1:1,mv=dir*(1+Math.floor(Math.random()*stepMax));
        if(Math.random()<.2)mv=0;
        idx=Math.max(0,Math.min(ns.length-1,idx+mv));
      }
      toks.push(ns[idx]+":"+du);
    });
    bars.push(toks);
  }
  G.bars=bars;G.items=SE.parseBars(bars);G.lv=lv;drawQ();
  $("genMsg").innerHTML="① 박자표를 보고 <b>손뼉으로 리듬</b> → ② <b>계이름을 소리 내어</b> 읽기 → ③ <b>정답 보기·▶ 듣기</b>로 확인!";
}
function drawQ(){
  if(!G.items)return;
  var lab=$("genAns").getAttribute("aria-pressed")==="true";
  SE.render($("genScore"),{staves:[{clef:G.lv.clef,items:G.items,prefix:"GQ-",labels:lab}],bars:barsOf(4,G.lv.sig,0,G.lv.bpm),startBar:1});
}
genSel.onchange=makeQuestion;
$("genNew").onclick=function(){SE.stopAll();$("genAns").setAttribute("aria-pressed","false");$("genAns").textContent="👀 정답(계이름) 보기";makeQuestion();};
$("genAns").onclick=function(){var on=this.getAttribute("aria-pressed")!=="true";this.setAttribute("aria-pressed",on?"true":"false");this.textContent=on?"🙈 계이름 숨기기":"👀 정답(계이름) 보기";SE.stopAll();drawQ();};
function playQ(btn,rhythm){
  if(SE.cur()&&SE.cur().btn===btn){SE.stopAll();return;}
  SE.play([{el:$("genScore"),bars:barsOf(4,G.lv.sig,0,G.lv.bpm),parts:[{items:rhythm?rhythmItems(G.items):SE.audioItems(G.items),vel:.5},{items:G.items,prefix:"GQ-",audio:false,light:true}],beatsEl:null}],{btn:btn,countIn:true,metro:$("genMetro").checked});
}
$("genRhythm").onclick=function(){playQ(this,true);};
$("genPlay").onclick=function(){playQ(this,false);};
window.addEventListener("resize",debounce(drawQ,200));
makeQuestion();

var first=$("ex1-1");if(first){first.open=true;CARDS[0].draw();}
})();
