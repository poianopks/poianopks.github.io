/* 장르음악 피아노 교실: 화면 동작 (오른손 멜로디 + 왼손 반주) */
(function(){
"use strict";
var ME=window.ME,GENRES=window.GENRES,ICON=window.ICON,store=ME.store;

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
document.getElementById("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

GENRES.forEach(function(g){g.items=ME.parseMelody(g.bars);g.notes=g.items.filter(function(x){return !x.rest;});g.total=g.bars.length*g.sig;});
function lhItems(g,lv){return ME.buildLH(g.lh.prog,g.lh.L[lv].pat,g.sig);}

/* ---------- 진행 기록 ---------- */
var PROG={};try{PROG=JSON.parse(store("cg-progress")||"{}")||{};}catch(e){PROG={};}
function mark(id,k){PROG[id]=PROG[id]||{};if(!PROG[id][k]){PROG[id][k]=1;store("cg-progress",JSON.stringify(PROG));renderGrid();}}
function stars(id){var p=PROG[id]||{};var n=(p.listen?1:0)+(p.follow?1:0)+(p.tap?1:0);return "★★★".slice(0,n)+"☆☆☆".slice(0,3-n);}

/* ---------- 기초 도표 ---------- */
(function(){
  var t=document.getElementById("noteTable"),s="",rows=[["온음표","4박",1,"#8a5cf6","w"],["2분음표","2박",2,"#3d7cf0","h"],["4분음표","1박",4,"#1f9d63","q"],["8분음표","반 박",8,"#ff6b4a","e"]];
  rows.forEach(function(r,i){
    var y=20+i*56,bw=232/r[2],x=28,ny=y+18;
    s+='<ellipse cx="'+x+'" cy="'+ny+'" rx="8" ry="5.6" transform="rotate(-20 '+x+' '+ny+')" fill="'+(r[4]==="w"||r[4]==="h"?"none":"currentColor")+'" stroke="currentColor" stroke-width="2"/>';
    if(r[4]!=="w")s+='<line x1="'+(x+7)+'" x2="'+(x+7)+'" y1="'+ny+'" y2="'+(ny-34)+'" stroke="currentColor" stroke-width="1.8"/>';
    if(r[4]==="e")s+='<path d="M'+(x+7)+' '+(ny-34)+' q2 10 10 14 q-3 -6 -10 -8z" fill="currentColor"/>';
    s+='<text x="50" y="'+(y+8)+'" font-size="12" font-weight="800" fill="currentColor">'+r[0]+' · '+r[1]+'</text>';
    for(var k=0;k<r[2];k++)s+='<rect x="'+(110+k*bw+1)+'" y="'+(y+14)+'" width="'+(bw-2)+'" height="22" rx="5" fill="'+r[3]+'" opacity="'+((k%2)?.55:1)+'"/>';
    if(r[2]<=4)for(var k2=0;k2<r[2];k2++)s+='<text x="'+(110+k2*bw+bw/2)+'" y="'+(y+30)+'" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">'+(r[2]===1?"1 2 3 4":r[2]===2?(k2?"3 4":"1 2"):(k2+1))+'</text>';
    else for(var k3=0;k3<8;k3++)s+='<text x="'+(110+k3*bw+bw/2)+'" y="'+(y+30)+'" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">'+(k3%2?"&":(k3/2+1))+'</text>';
  });
  s+='<text x="110" y="246" font-size="11" fill="currentColor">← 한 마디(4박)의 길이는 모두 같아요 →</text>';
  t.innerHTML=s;
  var mk=ME.keyboard(60,71,{kw:40,kh:140,labels:false}),g=document.getElementById("miniKb"),lab="";
  [0,2,4,5,7,9,11].forEach(function(pc,i){lab+='<text x="'+(i*40+20)+'" y="130" text-anchor="middle" font-size="13" font-weight="800" fill="'+(i?"#444":"#ff6b4a")+'">'+"도레미파솔라시".charAt(i)+'</text>';});
  g.setAttribute("transform","translate("+((360-mk.w)/2)+",10)");
  g.innerHTML=mk.svg.replace(/class="w"/g,'fill="#fff" stroke="#bbb"').replace(/class="b"/g,'fill="#26232c"')+lab;
})();

/* ---------- 장르 카드 ---------- */
var cur=null,level=+(store("cg-lhlevel")||0)||0;
function renderGrid(){
  document.getElementById("genreGrid").innerHTML=GENRES.map(function(g){
    return '<button class="gcard'+(cur&&cur.id===g.id?" sel":"")+'" style="--gc:'+g.color+'" data-id="'+g.id+'"><span class="stars">'+stars(g.id)+'</span><div class="ic">'+ICON[g.id]+'</div><b>'+g.name+'</b><small>'+g.one+'</small></button>';
  }).join("");
}
document.getElementById("genreGrid").addEventListener("click",function(e){var b=e.target.closest(".gcard");if(b)open(b.dataset.id,true);});

/* ---------- 비교 도표 ---------- */
(function(){
  var svg=document.getElementById("genreMap"),s="",L=60,R=610,T=20,B=320;
  var X=function(bpm){return L+(bpm-70)/(130-70)*(R-L);},Y=function(e){return B-(e-.5)/5*(B-T);};
  var face=["🙂","😊","😃","🤩","🔥"];
  for(var b=70;b<=130;b+=10)s+='<line class="gridl" x1="'+X(b)+'" x2="'+X(b)+'" y1="'+T+'" y2="'+B+'"/><text class="axl" x="'+X(b)+'" y="'+(B+18)+'" text-anchor="middle">'+b+'</text>';
  for(var e=1;e<=5;e++)s+='<line class="gridl" x1="'+L+'" x2="'+R+'" y1="'+Y(e)+'" y2="'+Y(e)+'"/><text class="axl" x="'+(L-8)+'" y="'+(Y(e)+4)+'" text-anchor="end">'+face[e-1]+'</text>';
  s+='<line class="ax" x1="'+L+'" x2="'+R+'" y1="'+B+'" y2="'+B+'" stroke-width="1.5"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+B+'" stroke-width="1.5"/>';
  s+='<text class="axl" x="'+((L+R)/2)+'" y="'+(B+40)+'" text-anchor="middle">빠르기 (1분에 몇 박? BPM) →</text>';
  s+='<text class="axl" x="16" y="'+((T+B)/2)+'" text-anchor="middle" transform="rotate(-90 16 '+((T+B)/2)+')">신나는 정도 →</text>';
  var used={};
  GENRES.forEach(function(g){
    var x=X(g.bpm),y=Y(g.energy),key=g.bpm+"_"+g.energy;used[key]=(used[key]||0)+1;var off=(used[key]-1)*30;
    s+='<g class="pt" data-id="'+g.id+'" tabindex="0" role="button" aria-label="'+g.name+'"><circle cx="'+x+'" cy="'+(y+off)+'" r="9" fill="'+g.color+'"/><text x="'+x+'" y="'+(y+off-14)+'" font-size="14" font-weight="800" text-anchor="middle">'+g.name+'</text></g>';
  });
  svg.innerHTML=s;
  svg.addEventListener("click",function(ev){var p=ev.target.closest(".pt");if(p)open(p.dataset.id,true);});
  var tb=document.querySelector("#cmpTable tbody");
  tb.innerHTML=GENRES.map(function(g){
    return '<tr data-id="'+g.id+'"><td><span class="dot" style="background:'+g.color+'"></span><b>'+g.name+'</b></td><td>'+g.one+'</td><td>'+g.beatText+'</td><td>'+g.bpm+'</td><td><div class="bar"><i style="width:'+(g.energy*20)+'%;background:'+g.color+'"></i></div></td><td>'+g.lh.L[1].name+'</td><td>'+g.inst+'</td></tr>';
  }).join("");
  tb.addEventListener("click",function(ev){var r=ev.target.closest("tr");if(r)open(r.dataset.id,true);});
})();

/* ---------- 재생 ---------- */
var playing=false,follow=null,tapState=null,LHI=[];
function $(id){return document.getElementById(id);}
function tempoMul(){var el=$("tempo");return el?(+el.value)/100:1;}
function setBeat(b,count){
  document.querySelectorAll("#beatDots span").forEach(function(d,i){d.classList.toggle("on",i===b);d.classList.toggle("first",i===0);});
  var lab=$("beatLab");if(lab)lab.textContent=b<0?"":count?"준비~":"";
}
function gridLight(p,it,on){
  if(p.prefix!=="L")return;
  document.querySelectorAll('#lhGrid [data-g="'+it.tpl+'-'+it.tk+'"]').forEach(function(e){e.classList.toggle("on",on);});
}
function stopAll(){playing=false;ME.stop();setBeat(-1);}
function play(g,parts,done){
  stopAll();ME.ac();playing=true;
  var run=function(t0){
    ME.schedule({sig:g.sig,swing:g.swing,bpm:g.bpm,mul:tempoMul(),nbars:g.bars.length,parts:parts,
      metro:$("metroChk")&&$("metroChk").checked,onBeat:setBeat,onItem:gridLight,
      onEnd:function(end){if(playing&&$("loopChk")&&$("loopChk").checked)run(end);else{playing=false;if(done)done();}}},t0);
  };
  run(ME.now()+.12);
}
function P(g,which){
  var m={items:g.items,prefix:"R",vel:.5},l={items:LHI,prefix:"L",vel:.42};
  return which==="R"?[m]:which==="L"?[l]:[m,l];
}

/* ---------- 레슨 ---------- */
function open(id,scroll){
  stopAll();endModes();
  cur=GENRES.filter(function(g){return g.id===id;})[0];
  var g=cur,idx=GENRES.indexOf(g),card=$("lessonCard"),lh=g.lh.L[level];
  LHI=lhItems(g,level);
  card.style.setProperty("--gc",g.color);
  var dots="";for(var i=0;i<g.sig;i++)dots+='<span>'+(i+1)+'</span>';
  var kbL=ME.keyboard(36,59,{kw:40,kh:140}),kbR=ME.keyboard(60,84,{kw:40,kh:140});
  var prev=GENRES[(idx+11)%12],next=GENRES[(idx+1)%12];
  card.innerHTML=
   '<div class="head"><div class="bigic" style="background:color-mix(in srgb,'+g.color+' 18%,transparent);color:'+g.color+'">'+ICON[g.id]+'</div>'+
   '<div><h3>'+g.name+' <small style="font-size:.9rem;color:var(--sub)">'+g.en+'</small></h3><div class="one">'+g.one+'</div></div></div>'+
   '<div class="tags"><span class="tag">⏱ '+g.beatText+' · '+g.bpm+' BPM</span><span class="tag">🎹 왼손: '+lh.name+'</span><span class="tag">🎸 '+g.inst+'</span><span class="tag">신남 '+"●●●●●".slice(0,g.energy)+"○○○○○".slice(0,5-g.energy)+'</span></div>'+
   '<div class="explain">'+
     '<div class="box"><h4>📖 쉽게 말하면</h4><p>'+g.easy+'</p></div>'+
     '<div class="box"><h4>🎨 이런 느낌이에요</h4><p>'+g.like+'</p><h4 style="margin-top:8px">👂 들을 때 찾아봐요</h4><ul>'+g.listen.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></div>'+
   '</div>'+
   '<div class="lhbox"><h4>🎹 왼손 반주 리듬: '+lh.name+
     '<span class="lvl" id="lvl"><button data-l="0"'+(level===0?' class="sel"':'')+'>1단계 쉬움</button><button data-l="1"'+(level===1?' class="sel"':'')+'>2단계 장르 느낌</button></span></h4>'+
     '<p>'+lh.desc+' <b>화음 순서: '+g.lh.prog.map(function(c){return ME.chord(c).label;}).join(" → ")+'</b></p>'+
     '<div class="rgwrap" id="lhGrid">'+ME.rhythmGrid(lh.pat,g.sig,{lw:lh.pat.length>1?70:0})+'</div>'+
     '<div class="legend"><span><i style="background:'+ME.KIND.bass.c+'"></i>쿵 = 낮은 근음</span><span><i style="background:'+ME.KIND.chord.c+'"></i>짝 = 화음(여러 음 같이)</span><span><i style="background:'+ME.KIND.note.c+'"></i>띵 = 화음 음 하나</span></div>'+
   '</div>'+
   '<h4 style="margin:16px 0 0">🎼 '+g.name+' 양손 악보 <small style="color:var(--sub)">(위: 오른손 멜로디 · 아래: 왼손 반주)</small></h4>'+
   '<div class="score" id="score"></div>'+
   '<div class="ctrls">'+
     '<button class="btn" id="bAll">▶ 양손 듣기</button>'+
     '<button class="btn blue" id="bMel">🎹 멜로디만</button>'+
     '<button class="btn" id="bLH" style="background:#6a4bc4">🎹 왼손반주만</button>'+
     '<button class="btn alt" id="bStop">■ 멈춤</button>'+
     '<label class="chk"><input type="checkbox" id="loopChk"> 반복</label>'+
     '<label class="chk"><input type="checkbox" id="metroChk"> 메트로놈</label>'+
     '<span class="tempo">🐢<input type="range" id="tempo" min="50" max="120" step="5" value="100" aria-label="빠르기"><span id="tempoV">100%</span>🐇</span>'+
   '</div>'+
   '<div class="beatdots" id="beatDots">'+dots+'<small id="beatLab"></small></div>'+
   '<div class="kbt">🎹 오른손 건반 (가온 도부터 · 높은 소리)</div>'+
   '<div class="kb"><svg viewBox="0 0 '+kbR.w+' 140" id="kbR" aria-label="오른손 피아노 건반">'+kbR.svg+'</svg></div>'+
   '<div class="kbt">🎹 왼손 건반 (낮은 소리 · 왼손 반주 자리)</div>'+
   '<div class="kb"><svg viewBox="0 0 '+kbL.w+' 140" id="kbL" aria-label="왼손 피아노 건반">'+kbL.svg+'</svg></div>'+
   '<div class="msg" id="lmsg"></div>'+
   '<button class="btn green tapbig" id="tapBtn">👏 여기를 탭! (스페이스바)</button>'+
   '<h4 style="margin:18px 0 0">🪜 따라하기 공부법 5단계</h4>'+
   '<ol class="steps">'+
     '<li id="st1"><div><b>양손으로 귀로 듣기</b><p>먼저 \'양손 듣기\'로 '+g.name+'의 느낌을 들어요. 오른손 멜로디와 왼손 반주가 함께 나와요.</p><button class="btn" data-act="listen">▶ 들어보기</button></div></li>'+
     '<li id="st2"><div><b>왼손 반주 리듬 익히기</b><p>왼손 반주만 들으면서 리듬 칸 도표의 <b>쿵·짝·띵</b>을 소리 내어 따라 말해요. "'+lhSay(lh.pat[0])+'"</p><button class="btn" style="background:#6a4bc4" data-act="lh">🎹 왼손 반주 듣기</button></div></li>'+
     '<li id="st3"><div><b>계이름 읽기</b><p>오른손 계이름을 노래하듯 읽어요. "'+g.notes.slice(0,4).map(function(n){return n.notes[0].sol;}).join("-")+'…" 따라 불러요.</p><button class="btn blue" data-act="sing">🎹 멜로디 따라 부르기</button></div></li>'+
     '<li id="st4"><div><b>건반 따라치기</b><p>파란색으로 빛나는 건반을 순서대로 눌러요. 왼손 화음(짝)은 빛나는 건반을 <b>모두</b> 누르면 다음으로 가요. '+g.tip+'</p><button class="btn" data-act="followR">🎯 오른손 따라치기</button> <button class="btn" style="background:#6a4bc4" data-act="followL">🎯 왼손 따라치기</button></div></li>'+
     '<li id="st5"><div><b>리듬 두드리기</b><p>"준비~" 뒤에 음표가 나올 때마다 탭! 정확하면 ★을 받아요. 어려우면 🐢 빠르기를 줄여요.</p><button class="btn green" data-act="tapR">👏 오른손 리듬</button> <button class="btn green" data-act="tapL">👏 왼손 리듬</button></div></li>'+
   '</ol>'+
   '<div class="pager"><button class="btn alt" id="pPrev">← '+prev.name+'</button><button class="btn alt" id="pNext">'+next.name+' →</button></div>';
  drawScore();
  var p=PROG[g.id]||{};
  if(p.listen)$("st1").classList.add("ok");
  if(p.follow)$("st4").classList.add("ok");
  if(p.tap)$("st5").classList.add("ok");
  bindLesson(g,prev,next);
  renderGrid();
  if(scroll)$("lesson").scrollIntoView({behavior:"smooth"});
  try{history.replaceState(null,"","#"+g.id);}catch(e){}
}
function lhSay(p){return ME.parseTpl(p).map(function(t){return t.kind==="rest"?"(쉬고)":t.kind==="bass"?"쿵":t.kind==="chord"?"짝":"띵";}).join(" ");}
function drawScore(){
  var g=cur;
  ME.renderScore($("score"),{sig:g.sig,swing:g.swing,nbars:g.bars.length,staves:[
    {clef:"treble",items:g.items,prefix:"R",label:function(it){return it.notes[0]?it.notes[0].sol:"";}},
    {clef:"bass",items:LHI,prefix:"L",chords:true,labelName:"왼손",label:function(it){return it.kind==="chord"?"짝":it.kind==="bass"?"쿵":it.notes[0]?it.notes[0].sol:"";}}
  ]});
}
function msg(t,cls){var m=$("lmsg");if(!m)return;m.textContent=t;m.className="msg"+(cls?" "+cls:"");}
function bindLesson(g,prev,next){
  var tempo=$("tempo");tempo.oninput=function(){$("tempoV").textContent=tempo.value+"%";};
  $("bAll").onclick=function(){endModes();play(g,P(g,"B"),function(){mark(g.id,"listen");$("st1").classList.add("ok");});};
  $("bMel").onclick=function(){endModes();play(g,P(g,"R"));};
  $("bLH").onclick=function(){endModes();play(g,P(g,"L"));};
  $("bStop").onclick=function(){endModes();stopAll();msg("");};
  $("pPrev").onclick=function(){open(prev.id,true);};
  $("pNext").onclick=function(){open(next.id,true);};
  $("lvl").onclick=function(e){var b=e.target.closest("button");if(!b)return;level=+b.dataset.l;store("cg-lhlevel",String(level));var y=window.scrollY;open(g.id,false);window.scrollTo(0,y);};
  document.querySelector("#lessonCard .steps").onclick=function(e){
    var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act;
    if(a==="listen")$("bAll").click();
    if(a==="lh"){endModes();play(g,P(g,"L"),function(){$("st2").classList.add("ok");});msg("리듬 칸 도표가 빛날 때 '쿵·짝'을 소리 내어 말해요!");$("lhGrid").scrollIntoView({behavior:"smooth",block:"center"});}
    if(a==="sing"){endModes();play(g,P(g,"R"),function(){$("st3").classList.add("ok");});msg("빛나는 음표의 계이름을 따라 불러요 🎵");}
    if(a==="followR")startFollow(g,"R");
    if(a==="followL")startFollow(g,"L");
    if(a==="tapR")startTap(g,"R");
    if(a==="tapL")startTap(g,"L");
  };
  ["kbR","kbL"].forEach(function(id){
    $(id).addEventListener("pointerdown",function(e){var k=e.target.closest("[data-m]");if(!k)return;e.preventDefault();pressKey(+k.dataset.m);});
  });
  $("tapBtn").addEventListener("pointerdown",function(e){e.preventDefault();doTap();});
}
function flashKey(m,cls,ms){document.querySelectorAll('.kb [data-m="'+m+'"]').forEach(function(k){k.classList.add(cls);setTimeout(function(){k.classList.remove(cls);},ms||180);});}
function pressKey(m){
  ME.ac();ME.piano(m,ME.now()+.005,.5,m<60?.42:.5);
  if(follow)follow.press(m);else flashKey(m,"on");
}
function startFollow(g,hand){
  endModes();stopAll();
  var items=hand==="R"?g.items:LHI;
  follow=new ME.Follow(ME.followSteps(items,hand),{
    onShow:function(st,i,n){
      var what=st.it.kind==="chord"?"화음 "+st.it.chord.label+" ("+st.it.notes.map(function(x){return x.sol;}).join("·")+" 같이)":st.it.notes[0].sol;
      msg((hand==="R"?"오른손":"왼손")+" 다음: "+what+" ("+(i+1)+" / "+n+")");
      var k=document.querySelector('.kb .hint');if(k)k.closest(".kb").scrollIntoView({behavior:"smooth",block:"nearest"});
    },
    onPartial:function(st,left){flashKey(st.midis.filter(function(m){return left.indexOf(m)<0;})[0],"on");msg("좋아요! 나머지 파란 건반도 눌러요 ("+left.length+"개 남음)");},
    onWrong:function(st,m){
      flashKey(m,"bad",300);var sc=$("score");sc.classList.remove("shake");void sc.offsetWidth;sc.classList.add("shake");
      msg("앗! 다른 건반이에요. 파란 건반을 눌러 봐요.","bad");
    },
    onDone:function(){
      follow=null;msg("🎉 참 잘했어요! "+g.name+" "+(hand==="R"?"오른손 멜로디":"왼손 반주")+"를 끝까지 쳤어요!","good");ME.confetti();
      mark(g.id,"follow");var s4=$("st4");if(s4)s4.classList.add("ok");
    }
  });
  follow.hand=hand;
  document.querySelectorAll("[data-i].done").forEach(function(e){e.classList.remove("done");});
}
function endModes(){
  if(follow){follow.end(true);follow=null;}
  if(tapState){tapState=null;var tb=$("tapBtn");if(tb)tb.classList.remove("show");}
}
function startTap(g,hand){
  endModes();stopAll();ME.ac();playing=true;
  var lp=$("loopChk");if(lp)lp.checked=false;
  var items=hand==="R"?g.items:LHI,t0=ME.now()+.15;
  var info=ME.schedule({sig:g.sig,swing:g.swing,bpm:g.bpm,mul:tempoMul(),nbars:g.bars.length,
    parts:[{items:items,prefix:hand,mute:true}],metro:true,countIn:true,onBeat:setBeat,onItem:gridLight,onEnd:finishTap},t0);
  tapState={g:g,hand:hand,taps:[],tol:Math.max(.12,info.spb*.22),
    expected:items.filter(function(it){return !it.rest;}).map(function(it){return info.start+ME.sw(g.swing,it.gpos)*info.spb;})};
  var tb=$("tapBtn");tb.classList.add("show");
  msg("준비~ "+g.sig+"박을 세고 "+(hand==="R"?"오른손 음표":"왼손 반주")+"가 빛날 때마다 탭!");
  tb.scrollIntoView({behavior:"smooth",block:"center"});
}
function doTap(){
  if(!tapState)return;var t=ME.now();tapState.taps.push(t);ME.tick(t);
  var b=$("tapBtn");b.style.transform="scale(.97)";setTimeout(function(){b.style.transform="";},80);
}
function finishTap(){
  if(!tapState)return;var s=tapState;tapState=null;playing=false;
  var r=ME.scoreTaps(s.expected,s.taps,s.tol),tb=$("tapBtn");if(tb)tb.classList.remove("show");
  msg((s.hand==="R"?"오른손":"왼손")+" 리듬 점수 "+r.score+"점 "+ME.stars(r.score)+" (맞힌 음 "+r.hit+"/"+r.total+(r.extra>0?", 남는 탭 "+r.extra:"")+")"+(r.score>=60?" 👍":" — 🐢 느리게 해서 다시!"),r.score>=60?"good":"bad");
  if(r.score>=60){mark(s.g.id,"tap");var s5=$("st5");if(s5)s5.classList.add("ok");if(r.score>=85)ME.confetti();}
}
document.addEventListener("keydown",function(e){
  if(e.target.tagName==="INPUT"&&e.target.type!=="range"&&e.target.type!=="checkbox")return;
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==="Space"&&tapState){e.preventDefault();doTap();return;}
  var k=e.key&&e.key.toLowerCase(),m=ME.KEYMAP[k];
  if(m===undefined)m=ME.KEYMAP_LH[k]!==undefined?ME.KEYMAP_LH[k]-12:undefined;
  if(m!==undefined&&$("kbR"))pressKey(m);
});
var rz;window.addEventListener("resize",function(){clearTimeout(rz);rz=setTimeout(function(){if(cur&&!playing&&!follow)drawScore();},200);});

/* ---------- 퀴즈 ---------- */
var Q={n:0,ok:0,cur:null};
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function newQ(){
  var ans=GENRES[Math.floor(Math.random()*12)],type=Math.random()<.5?"sound":"text";
  var opts=shuffle([ans].concat(shuffle(GENRES.filter(function(g){return g!==ans;})).slice(0,3)));
  Q.cur={ans:ans,type:type,done:false};
  $("qText").textContent=type==="sound"?"🔊 이 양손 연주는 어떤 장르일까요?":"📖 \""+ans.like+"\" — 어떤 장르일까요?";
  $("qMsg").textContent="";$("qMsg").className="msg";
  $("qReplay").style.display=type==="sound"?"":"none";
  $("qNext").style.display="none";
  $("qOpts").innerHTML=opts.map(function(g){return '<button data-id="'+g.id+'">'+g.name+'</button>';}).join("");
  if(type==="sound")qPlay();
}
function qPlay(){
  stopAll();endModes();ME.ac();playing=true;var g=Q.cur.ans;
  ME.schedule({sig:g.sig,swing:g.swing,bpm:g.bpm,nbars:g.bars.length,
    parts:[{items:g.items,vel:.5,light:false},{items:lhItems(g,1),vel:.42,light:false}],onEnd:function(){playing=false;}},ME.now()+.1);
}
$("qStart").onclick=function(){this.textContent="새로 시작";Q.n=0;Q.ok=0;upd();newQ();};
$("qReplay").onclick=qPlay;
$("qNext").onclick=newQ;
$("qOpts").onclick=function(e){
  var b=e.target.closest("button");if(!b||!Q.cur||Q.cur.done)return;
  Q.cur.done=true;Q.n++;var right=b.dataset.id===Q.cur.ans.id;if(right)Q.ok++;
  b.classList.add(right?"right":"wrong");
  document.querySelector('#qOpts [data-id="'+Q.cur.ans.id+'"]').classList.add("right");
  var m=$("qMsg");
  m.textContent=right?"딩동댕! 🎉 "+Q.cur.ans.name+": "+Q.cur.ans.one+" (왼손: "+Q.cur.ans.lh.L[1].name+")":"아쉬워요! 정답은 "+Q.cur.ans.name+" — "+Q.cur.ans.one;
  m.className="msg "+(right?"good":"bad");
  $("qNext").style.display="";upd();
};
function upd(){$("qScore").textContent="점수 "+Q.ok+" / "+Q.n;}

/* ---------- 시작 ---------- */
renderGrid();
var h=(location.hash||"").slice(1);
open(GENRES.some(function(g){return g.id===h;})?h:"classical",false);
})();
