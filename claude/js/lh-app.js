/* 왼손반주 리듬 교실 앱 */
(function(){
"use strict";
var ME=window.ME,GENRES=window.GENRES,ICON=window.ICON,store=ME.store;
function $(id){return document.getElementById(id);}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

GENRES.forEach(function(g){g.items=ME.parseMelody(g.bars);});
var playing=false;
function stopAll(){playing=false;ME.stop();setBeat(-1);}
function setBeat(b,count){
  document.querySelectorAll("#beatDots span").forEach(function(d,i){d.classList.toggle("on",i===b);d.classList.toggle("first",i===0);});
  var lab=$("beatLab");if(lab)lab.textContent=b<0?"":count?"준비~":"";
}
function lhSay(p){return ME.parseTpl(p).map(function(t){return t.kind==="rest"?"(쉬고)":t.kind==="bass"?"쿵":t.kind==="chord"?"짝":"띵";}).join(" ");}
function lhLabel(it){return it.kind==="chord"?"짝":it.kind==="bass"?"쿵":it.notes[0]?it.notes[0].sol:"";}
function quick(items,sig,bpm,swing,opts){
  stopAll();ME.ac();playing=true;opts=opts||{};
  ME.schedule({sig:sig,swing:swing,bpm:bpm,nbars:items[items.length-1].bar+1,
    parts:[{items:items,prefix:opts.prefix||"",vel:.45}],scoreRoot:opts.scoreRoot,kbRoot:opts.kbRoot||null,onItem:opts.onItem,
    onEnd:function(){playing=false;}},ME.now()+.08);
}

/* ---------- 1. 쿵 짝 띵 ---------- */
(function(){
  var K=[
    {k:"bass",t:"쿵",title:"쿵 = 근음",p:"화음의 이름이 되는 가장 낮은 음(근음)을 하나 쳐요. 북처럼 '쿵' 바닥을 받쳐 줘요.",pat:"1:q 1:q 1:q 1:q"},
    {k:"chord",t:"짝",title:"짝 = 화음",p:"3개의 음(도·미·솔)을 한꺼번에 눌러요. 박수처럼 '짝' 하고 울려요.",pat:"T:q T:q T:q T:q"},
    {k:"note",t:"띵",title:"띵 = 펼친 화음",p:"화음의 음을 하나씩 차례로 쳐요(아르페지오). 물방울처럼 '띵띵' 흘러요.",pat:"1:q 3:q 5:q 8:q"}
  ];
  $("kinds").innerHTML=K.map(function(o,i){
    return '<div class="card kindcard mini"><h4><span class="big" style="background:'+ME.KIND[o.k].c+'">'+o.t+'</span>'+o.title+'</h4><p>'+o.p+'</p><div class="score" id="kind'+i+'"></div><button class="btn alt" data-k="'+i+'" style="margin-top:8px">▶ 들어보기</button></div>';
  }).join("");
  K.forEach(function(o,i){
    o.items=ME.buildLH(["C"],[o.pat],4);
    ME.renderScore($("kind"+i),{sig:4,nbars:1,per:1,staves:[{clef:"bass",items:o.items,prefix:"K"+i+"-",chords:true,labelName:"왼손",label:lhLabel}]});
  });
  $("kinds").addEventListener("click",function(e){var b=e.target.closest("[data-k]");if(!b)return;var o=K[+b.dataset.k];quick(o.items,4,90,false,{prefix:"K"+b.dataset.k+"-"});});
})();

/* ---------- 2. 낮은음자리표 ---------- */
(function(){
  var items=ME.parseMelody([["G2:q","A2:q","B2:q","C3:q"],["D3:q","E3:q","F3:q","G3:q"],["A3:q","B3:q","C4:h"]]);
  var line={"-10":1,"-8":1,"-6":1,"-4":1,"-2":1};
  var wide=$("clefScore").clientWidth>=640;
  ME.renderScore($("clefScore"),{sig:4,nbars:3,per:wide?3:1,width:wide?900:null,staves:[{clef:"bass",items:items,prefix:"C",labelName:"계이름",label:function(it){var n=it.notes[0];return n.sol+(line[n.step]?"(줄)":n.step===0?"(덧줄)":"(칸)");}}]});
  $("clefPlay").onclick=function(){quick(items,4,80,false,{prefix:"C"});};
})();

/* ---------- 3. 화음 사전 ---------- */
(function(){
  var list=["C","F","G","Am","Dm","Em","C7","Cm"];
  var kb=ME.keyboard(36,59,{kw:20,kh:70,labels:false});
  $("chordGrid").innerHTML=list.map(function(c,i){
    var ch=ME.chord(c);
    return '<div class="card ccard" data-c="'+c+'"><h4>'+ch.label+'</h4><small>'+ch.kor+'</small>'+
      '<div class="tones">짝: '+ch.tonesSol.join(" · ")+' <span style="color:#6a4bc4">/ 쿵: '+ME.noteFromMidi(ch.root).sol+'</span></div>'+
      '<div class="score" id="cs'+i+'"></div><div class="kb"><svg viewBox="0 0 '+kb.w+' 70" id="ck'+i+'">'+kb.svg+'</svg></div></div>';
  }).join("");
  list.forEach(function(c,i){
    var ch=ME.chord(c),items=ME.buildLH([c],["1:h T:h"],4);
    ME.renderScore($("cs"+i),{sig:4,nbars:1,per:1,noTime:true,noCounts:true,staves:[{clef:"bass",items:items,prefix:"CS"+i+"-"}]});
    var svg=$("ck"+i);
    svg.querySelector('[data-m="'+ch.root+'"]').classList.add("root");
    ch.voicing.forEach(function(m){svg.querySelector('[data-m="'+m+'"]').classList.add("tone");});
  });
  $("chordGrid").addEventListener("click",function(e){
    var c=e.target.closest(".ccard");if(!c)return;var i=[].indexOf.call(c.parentNode.children,c);
    quick(ME.buildLH([c.dataset.c],["1:h T:h"],4),4,100,false,{prefix:"CS"+i+"-"});
  });
})();

/* ---------- 4. 장르 레슨 ---------- */
var PROGS=[{n:"장르 기본"},{n:"C-F-G-C 기본",p:["C","F","G","C"]},{n:"팝 4화음 C-G-Am-F",p:["C","G","Am","F"]},{n:"단조 Am-Dm-G-C",p:["Am","Dm","G","C"]}];
var PR={};try{PR=JSON.parse(store("lh-progress")||"{}")||{};}catch(e){PR={};}
function mark(id,k){PR[id]=PR[id]||{};if(!PR[id][k]){PR[id][k]=1;store("lh-progress",JSON.stringify(PR));renderChips();}}
function stars(id){var p=PR[id]||{};var n=(p.listen?1:0)+(p.follow?1:0)+(p.tap?1:0);return "★★★".slice(0,n)+"☆☆☆".slice(0,3-n);}
var S={g:null,level:+(store("lh-level")||1),prog:0,withMel:false},LHI=[],follow=null,tapState=null;
if(S.level!==0&&S.level!==1)S.level=1;
function renderChips(){
  $("chips").innerHTML=GENRES.map(function(g){
    return '<button class="chip'+(S.g===g?" sel":"")+'" style="--gc:'+g.color+'" data-id="'+g.id+'"><span class="ic">'+ICON[g.id]+'</span>'+g.name+' <small>'+stars(g.id)+'</small></button>';
  }).join("");
}
$("chips").addEventListener("click",function(e){var b=e.target.closest(".chip");if(b)openG(b.dataset.id,false);});
function curProg(){return S.prog===0?S.g.lh.prog:PROGS[S.prog].p;}
function tempoMul(){var el=$("tempo");return el?(+el.value)/100:1;}
function gridLight(p,it,on){
  if(p.prefix!=="L")return;
  document.querySelectorAll('#lhGrid [data-g="'+it.tpl+'-'+it.tk+'"]').forEach(function(e){e.classList.toggle("on",on);});
}
function openG(id,scroll){
  stopAll();endModes();
  var g=S.g=GENRES.filter(function(x){return x.id===id;})[0],lh=g.lh.L[S.level];
  if(S.prog!==0)S.withMel=false;
  LHI=ME.buildLH(curProg(),lh.pat,g.sig);
  var card=$("lessonCard"),idx=GENRES.indexOf(g),prev=GENRES[(idx+11)%12],next=GENRES[(idx+1)%12];
  card.style.setProperty("--gc",g.color);
  var dots="";for(var i=0;i<g.sig;i++)dots+='<span>'+(i+1)+'</span>';
  var kb=ME.keyboard(36,60,{kw:40,kh:150});
  var chords=curProg().filter(function(c,i,a){return a.indexOf(c)===i;}).map(function(c){var ch=ME.chord(c);return '<b>'+ch.label+'</b>('+ch.tonesSol.join("")+')';}).join(", ");
  card.innerHTML=
   '<div class="head"><div class="bigic" style="background:color-mix(in srgb,'+g.color+' 18%,transparent);color:'+g.color+'">'+ICON[g.id]+'</div>'+
   '<div><h3>'+g.name+' 왼손 반주</h3><div class="one">'+g.one+' · '+g.beatText+' · '+g.bpm+' BPM</div></div></div>'+
   '<div class="lhbox"><h4>🎹 '+lh.name+' <span class="lvl" id="lvl"><button data-l="0"'+(S.level===0?' class="sel"':'')+'>1단계 쉬움</button><button data-l="1"'+(S.level===1?' class="sel"':'')+'>2단계 장르 느낌</button></span></h4>'+
     '<p>'+lh.desc+'</p>'+
     '<p style="margin-top:6px">🗣 소리 내어 말하기: <b style="font-size:1.1rem">"'+lh.pat.map(lhSay).join(" | ")+'"</b></p>'+
     '<div class="rgwrap" id="lhGrid">'+ME.rhythmGrid(lh.pat,g.sig,{lw:lh.pat.length>1?70:0})+'</div>'+
     '<div class="legend"><span><i style="background:#6a4bc4"></i>쿵 = 낮은 근음</span><span><i style="background:#ff6b4a"></i>짝 = 화음</span><span><i style="background:#3d7cf0"></i>띵 = 화음 음 하나</span></div>'+
   '</div>'+
   '<div style="margin-top:12px;font-weight:800">🎼 화음 순서 고르기</div>'+
   '<div class="progsel" id="progsel">'+PROGS.map(function(p,i){return '<button data-p="'+i+'"'+(S.prog===i?' class="sel"':'')+'>'+(i===0?"장르 기본 ("+g.lh.prog.map(function(c){return ME.chord(c).label;}).join("-")+")":p.n)+'</button>';}).join("")+'</div>'+
   '<p style="margin:6px 0 0;color:var(--sub);font-size:.9rem">이번에 쓰는 화음: '+chords+'</p>'+
   '<h4 style="margin:14px 0 0">🎼 왼손 반주 악보 (낮은음자리표)</h4>'+
   '<label class="chk" style="margin-top:6px"><input type="checkbox" id="melChk"'+(S.withMel?" checked":"")+(S.prog!==0?" disabled":"")+'> 오른손 멜로디 악보도 같이 보기'+(S.prog!==0?' <small style="color:var(--sub)">(장르 기본 화음일 때만)</small>':'')+'</label>'+
   '<div class="score" id="score"></div>'+
   '<div class="ctrls">'+
     '<button class="btn" id="bLH" style="background:#6a4bc4">▶ 왼손 반주 듣기</button>'+
     '<button class="btn blue" id="bBoth"'+(S.prog!==0?" disabled":"")+'>▶ 멜로디와 함께</button>'+
     '<button class="btn alt" id="bStop">■ 멈춤</button>'+
     '<label class="chk"><input type="checkbox" id="loopChk"> 반복</label>'+
     '<label class="chk"><input type="checkbox" id="metroChk" checked> 메트로놈</label>'+
     '<span class="tempo">🐢<input type="range" id="tempo" min="50" max="120" step="5" value="100" aria-label="빠르기"><span id="tempoV">100%</span>🐇</span>'+
   '</div>'+
   '<div class="beatdots" id="beatDots">'+dots+'<small id="beatLab"></small></div>'+
   '<div class="kbt">🎹 왼손 건반 (낮은 도 ~ 가온 도)</div>'+
   '<div class="kb"><svg viewBox="0 0 '+kb.w+' 150" id="kbd" aria-label="왼손 피아노 건반">'+kb.svg+'</svg></div>'+
   '<div class="msg" id="lmsg"></div>'+
   '<button class="btn green tapbig" id="tapBtn">👏 여기를 탭! (스페이스바)</button>'+
   '<h4 style="margin:18px 0 0">🪜 왼손 반주 따라하기 5단계</h4>'+
   '<ol class="steps">'+
     '<li id="st1"><div><b>귀로 듣기</b><p>\'왼손 반주 듣기\'로 '+g.name+' 반주의 느낌을 들어요. 이어서 \'멜로디와 함께\'로 노래가 얹히면 어떻게 되는지도 들어 봐요.</p><button class="btn" style="background:#6a4bc4" data-act="listen">▶ 들어보기</button></div></li>'+
     '<li id="st2"><div><b>쿵·짝 소리 내어 말하기</b><p>리듬 칸 도표가 빛날 때 "'+lhSay(lh.pat[0])+'" 하고 입으로 말해요. 무릎을 치면서 해도 좋아요 (쿵=왼무릎, 짝=손뼉).</p><button class="btn alt" data-act="say">🗣 도표 보며 말하기</button></div></li>'+
     '<li id="st3"><div><b>화음 모양 잡기</b><p>마디마다 쓰는 화음을 차례로 잡아 봐요. 파란 건반을 모두 누르면 다음 화음으로 가요. 손가락은 5-3-1!</p><button class="btn blue" data-act="chords">✋ 화음 잡기 연습</button></div></li>'+
     '<li id="st4"><div><b>반주 따라치기</b><p>악보 순서대로 파란 건반을 눌러요. 짝(화음)은 빛나는 건반을 모두 누르면 돼요.</p><button class="btn" data-act="follow">🎯 따라치기 시작</button></div></li>'+
     '<li id="st5"><div><b>리듬 두드리기</b><p>"준비~" 뒤에 반주 음표가 빛날 때마다 탭! 60점 이상이면 ★. 어려우면 🐢 빠르기를 줄여요.</p><button class="btn green" data-act="tap">👏 리듬 테스트</button></div></li>'+
   '</ol>'+
   '<div class="pager"><button class="btn alt" id="pPrev">← '+prev.name+'</button><button class="btn alt" id="pNext">'+next.name+' →</button></div>';
  drawScore();
  var p=PR[g.id]||{};
  if(p.listen)$("st1").classList.add("ok");
  if(p.follow)$("st4").classList.add("ok");
  if(p.tap)$("st5").classList.add("ok");
  bind(g,prev,next);
  renderChips();
  if(scroll)$("lesson").scrollIntoView({behavior:"smooth"});
  try{history.replaceState(null,"","#"+g.id);}catch(e){}
}
function drawScore(){
  var g=S.g,st=[];
  if(S.withMel&&S.prog===0)st.push({clef:"treble",items:g.items,prefix:"R",label:function(it){return it.notes[0]?it.notes[0].sol:"";}});
  st.push({clef:"bass",items:LHI,prefix:"L",chords:true,labelName:"왼손",label:lhLabel});
  ME.renderScore($("score"),{sig:g.sig,swing:g.swing,nbars:LHI[LHI.length-1].bar+1,staves:st});
}
function msg(t,cls){var m=$("lmsg");if(!m)return;m.textContent=t;m.className="msg"+(cls?" "+cls:"");}
function play(withMel,done){
  var g=S.g;stopAll();ME.ac();playing=true;
  var parts=[{items:LHI,prefix:"L",vel:.45}];
  if(withMel)parts.push({items:g.items,prefix:"R",vel:.5,light:S.withMel});
  var run=function(t0){
    ME.schedule({sig:g.sig,swing:g.swing,bpm:g.bpm,mul:tempoMul(),nbars:LHI[LHI.length-1].bar+1,parts:parts,
      metro:$("metroChk").checked,onBeat:setBeat,onItem:gridLight,kbRoot:$("kbd"),
      onEnd:function(end){if(playing&&$("loopChk").checked)run(end);else{playing=false;if(done)done();}}},t0);
  };
  run(ME.now()+.12);
}
function bind(g,prev,next){
  var tempo=$("tempo");tempo.oninput=function(){$("tempoV").textContent=tempo.value+"%";};
  $("bLH").onclick=function(){endModes();play(false,function(){mark(g.id,"listen");$("st1").classList.add("ok");});};
  $("bBoth").onclick=function(){endModes();play(true);};
  $("bStop").onclick=function(){endModes();stopAll();msg("");};
  $("pPrev").onclick=function(){openG(prev.id,true);};
  $("pNext").onclick=function(){openG(next.id,true);};
  var keep=function(fn){var y=window.scrollY;fn();openG(g.id,false);window.scrollTo(0,y);};
  $("lvl").onclick=function(e){var b=e.target.closest("button");if(b)keep(function(){S.level=+b.dataset.l;store("lh-level",String(S.level));});};
  $("progsel").onclick=function(e){var b=e.target.closest("button");if(b)keep(function(){S.prog=+b.dataset.p;});};
  $("melChk").onchange=function(){S.withMel=this.checked;drawScore();};
  document.querySelector("#lessonCard .steps").onclick=function(e){
    var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act;
    if(a==="listen")$("bLH").click();
    if(a==="say"){endModes();$("metroChk").checked=true;play(false,function(){$("st2").classList.add("ok");});msg("빛나는 칸을 보며 '쿵·짝'을 소리 내어 말해요!");$("lhGrid").scrollIntoView({behavior:"smooth",block:"center"});}
    if(a==="chords")startFollow("chords");
    if(a==="follow")startFollow("all");
    if(a==="tap")startTap();
  };
  $("kbd").addEventListener("pointerdown",function(e){var k=e.target.closest("[data-m]");if(!k)return;e.preventDefault();pressKey(+k.dataset.m);});
  $("tapBtn").addEventListener("pointerdown",function(e){e.preventDefault();doTap();});
}
function flashKey(m,cls,ms){var k=document.querySelector('#kbd [data-m="'+m+'"]');if(!k)return;k.classList.add(cls);setTimeout(function(){k.classList.remove(cls);},ms||180);}
function pressKey(m){
  ME.ac();ME.piano(m,ME.now()+.005,.5,.45);
  if(follow)follow.press(m);else flashKey(m,"on");
}
function startFollow(kind){
  endModes();stopAll();
  var g=S.g,steps;
  if(kind==="chords"){
    steps=curProg().map(function(c,bi){var ch=ME.chord(c),first=LHI.filter(function(it){return it.bar===bi&&!it.rest;})[0];
      return {it:first,prefix:"L",midis:ch.voicing.slice(),chord:ch};});
  }else steps=ME.followSteps(LHI,"L");
  follow=new ME.Follow(steps,{kbRoot:$("kbd"),
    onShow:function(st,i,n){
      var what=st.chord?"화음 "+st.chord.label+" ("+st.chord.tonesSol.join("·")+")을 한꺼번에":st.it.kind==="chord"?"짝: "+st.it.chord.label+" ("+st.it.notes.map(function(x){return x.sol;}).join("·")+" 같이)":(st.it.kind==="bass"?"쿵: ":"띵: ")+st.it.notes.map(function(x){return x.sol;}).join("+");
      msg("다음 → "+what+" ("+(i+1)+" / "+n+")");
    },
    onPartial:function(st,left){msg("좋아요! 나머지 파란 건반도 눌러요 ("+left.length+"개 남음)");},
    onWrong:function(){var sc=$("score");sc.classList.remove("shake");void sc.offsetWidth;sc.classList.add("shake");msg("앗! 다른 건반이에요. 파란 건반을 눌러 봐요.","bad");},
    onDone:function(){
      follow=null;ME.confetti();
      if(kind==="chords"){msg("🎉 화음 모양을 모두 잡았어요! 이제 4단계 반주 따라치기에 도전!","good");$("st3").classList.add("ok");}
      else{msg("🎉 참 잘했어요! "+g.name+" 왼손 반주를 끝까지 쳤어요!","good");mark(g.id,"follow");$("st4").classList.add("ok");}
    }
  });
  document.querySelectorAll("[data-i].done").forEach(function(e){e.classList.remove("done");});
  $("kbd").scrollIntoView({behavior:"smooth",block:"center"});
}
function endModes(){
  if(follow){follow.end(true);follow=null;}
  if(tapState){tapState=null;var tb=$("tapBtn");if(tb)tb.classList.remove("show");}
}
function startTap(){
  endModes();stopAll();ME.ac();playing=true;$("loopChk").checked=false;
  var g=S.g,t0=ME.now()+.15;
  var info=ME.schedule({sig:g.sig,swing:g.swing,bpm:g.bpm,mul:tempoMul(),nbars:LHI[LHI.length-1].bar+1,
    parts:[{items:LHI,prefix:"L",mute:true}],metro:true,countIn:true,onBeat:setBeat,onItem:gridLight,kbRoot:$("kbd"),onEnd:finishTap},t0);
  tapState={taps:[],tol:Math.max(.12,info.spb*.22),
    expected:LHI.filter(function(it){return !it.rest;}).map(function(it){return info.start+ME.sw(g.swing,it.gpos)*info.spb;})};
  $("tapBtn").classList.add("show");
  msg("준비~ "+g.sig+"박을 세고 반주 음표가 빛날 때마다 탭!");
  $("tapBtn").scrollIntoView({behavior:"smooth",block:"center"});
}
function doTap(){
  if(!tapState)return;var t=ME.now();tapState.taps.push(t);ME.tick(t);
  var b=$("tapBtn");b.style.transform="scale(.97)";setTimeout(function(){b.style.transform="";},80);
}
function finishTap(){
  if(!tapState)return;var s=tapState;tapState=null;playing=false;
  var r=ME.scoreTaps(s.expected,s.taps,s.tol);$("tapBtn").classList.remove("show");
  msg("왼손 리듬 점수 "+r.score+"점 "+ME.stars(r.score)+" (맞힌 음 "+r.hit+"/"+r.total+(r.extra>0?", 남는 탭 "+r.extra:"")+")"+(r.score>=60?" 👍":" — 🐢 느리게 해서 다시!"),r.score>=60?"good":"bad");
  if(r.score>=60){mark(S.g.id,"tap");$("st5").classList.add("ok");if(r.score>=85)ME.confetti();}
}
document.addEventListener("keydown",function(e){
  if(e.target.tagName==="INPUT"&&e.target.type!=="range"&&e.target.type!=="checkbox")return;
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==="Space"&&tapState){e.preventDefault();doTap();return;}
  var m=ME.KEYMAP_LH[e.key&&e.key.toLowerCase()];
  if(m!==undefined&&$("kbd"))pressKey(m);
});
var rz;window.addEventListener("resize",function(){clearTimeout(rz);rz=setTimeout(function(){if(S.g&&!playing&&!follow)drawScore();},200);});

/* ---------- 5. 한눈에 보기 표 ---------- */
(function(){
  var tb=document.querySelector("#rgTable tbody");
  tb.innerHTML=GENRES.map(function(g){
    var cell=function(l){var L=g.lh.L[l];return '<td><span class="pname">'+L.name+'</span>'+ME.rhythmGrid(L.pat,g.sig,{cw:34})+'</td><td><button class="pb" data-id="'+g.id+'" data-l="'+l+'" aria-label="'+g.name+' '+L.name+' 듣기">▶</button></td>';};
    return '<tr data-id="'+g.id+'"><td class="gname"><span class="dot" style="background:'+g.color+'"></span>'+g.name+'<br><small style="color:var(--sub);font-weight:700">'+g.beatText+'</small></td>'+cell(0)+cell(1)+'</tr>';
  }).join("");
  tb.addEventListener("click",function(e){
    var b=e.target.closest(".pb");if(!b)return;
    var g=GENRES.filter(function(x){return x.id===b.dataset.id;})[0],l=+b.dataset.l,pat=g.lh.L[l].pat;
    var cellEl=b.closest("td").previousElementSibling;
    quick(ME.buildLH(["C","C"],pat,g.sig),g.sig,g.bpm,g.swing,{onItem:function(p,it,on){cellEl.querySelectorAll('[data-g="'+it.tpl+'-'+it.tk+'"]').forEach(function(x){x.classList.toggle("on",on);});}});
  });
})();

/* ---------- 6. 퀴즈 ---------- */
var Q={n:0,ok:0,cur:null};
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function newQ(){
  var ans=GENRES[Math.floor(Math.random()*12)],lv=Math.random()<.7?1:0;
  var opts=shuffle([ans].concat(shuffle(GENRES.filter(function(g){return g!==ans;})).slice(0,3)));
  Q.cur={ans:ans,lv:lv,done:false};
  $("qText").textContent="🔊 이 왼손 반주는 어떤 장르일까요?";
  $("qMsg").textContent="";$("qMsg").className="msg";
  $("qReplay").style.display="";$("qNext").style.display="none";
  $("qOpts").innerHTML=opts.map(function(g){return '<button data-id="'+g.id+'">'+g.name+'</button>';}).join("");
  qPlay();
}
function qPlay(){var g=Q.cur.ans;endModes();quick(ME.buildLH(g.lh.prog,g.lh.L[Q.cur.lv].pat,g.sig),g.sig,g.bpm,g.swing,{prefix:"Q"});}
$("qStart").onclick=function(){this.textContent="새로 시작";Q.n=0;Q.ok=0;upd();newQ();};
$("qReplay").onclick=qPlay;
$("qNext").onclick=newQ;
$("qOpts").onclick=function(e){
  var b=e.target.closest("button");if(!b||!Q.cur||Q.cur.done)return;
  Q.cur.done=true;Q.n++;var a=Q.cur.ans,right=b.dataset.id===a.id;if(right)Q.ok++;
  b.classList.add(right?"right":"wrong");
  document.querySelector('#qOpts [data-id="'+a.id+'"]').classList.add("right");
  $("qMsg").textContent=(right?"딩동댕! 🎉 ":"아쉬워요! 정답은 ")+a.name+"의 '"+a.lh.L[Q.cur.lv].name+"' — \""+lhSay(a.lh.L[Q.cur.lv].pat[0])+"\"";
  $("qMsg").className="msg "+(right?"good":"bad");
  $("qNext").style.display="";upd();
};
function upd(){$("qScore").textContent="점수 "+Q.ok+" / "+Q.n;}

/* ---------- 시작 ---------- */
var h=(location.hash||"").slice(1);
openG(GENRES.some(function(g){return g.id===h;})?h:"chanson",false);
})();
