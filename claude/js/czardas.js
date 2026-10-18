/* 차르다시 피아노 교실: 조표·16분음표·붙임줄을 그리는 큰보표 악보 + 듣기·따라치기 (소리·건반은 music-engine.js의 ME 사용) */
(function(){
"use strict";
var ME=window.ME,STEPS=window.CZ_STEPS,store=ME.store;
function $(id){return document.getElementById(id);}

/* ---------- 테마 ---------- */
var root=document.documentElement;
var savedTheme=store("cg-theme");if(savedTheme)root.setAttribute("data-theme",savedTheme);
$("themeBtn").onclick=function(){
  var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
  var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);
};

/* ---------- 음표 해석 ---------- */
var DUR={w:4,dh:3,h:2,dq:1.5,q:1,de:.75,e:.5,s:.25};
var BEAMABLE={e:1,de:1,s:1};
/* bars=[["A4:e","Bb4:e~",...],...] → items (붙임줄 ~ = 다음 음과 이어서 한 소리) */
function parseBars(bars){
  var items=[],gpos=0;
  bars.forEach(function(bar,bi){
    var pos=0;
    bar.forEach(function(tok){
      var tie=/~$/.test(tok);tok=tok.replace(/~$/,"");
      var a=tok.split(":"),it={d:a[1],len:DUR[a[1]],bar:bi,pos:pos,gpos:gpos,i:items.length,tie:tie};
      if(a[0]==="r"){it.rest=true;it.notes=[];}
      else it.notes=a[0].split("+").map(ME.noteFromName);
      items.push(it);pos+=it.len;gpos+=it.len;
    });
  });
  items.forEach(function(it,k){if(k>0&&items[k-1].tie&&!it.rest)it.cont=true;});
  return items;
}
/* 소리용: 붙임줄로 이어진 음은 한 번만, 길게 */
function audioItems(items){
  return items.map(function(it){
    if(it.cont)return {rest:true,notes:[],gpos:it.gpos,len:it.len,pos:it.pos,i:it.i,bar:it.bar};
    var len=it.len,k=it.i;
    while(items[k]&&items[k].tie&&items[k+1]){len+=items[k+1].len;k++;}
    return {notes:it.notes,gpos:it.gpos,len:len,pos:it.pos,i:it.i,bar:it.bar};
  });
}

/* ---------- 조표 ---------- */
var KEYS={
  "-1":{name:"라단조",acc:{B:"b"},marks:{treble:[["b",6]],bass:[["b",-8]]}},
  "2":{name:"라장조",acc:{F:"#",C:"#"},marks:{treble:[["#",10],["#",7]],bass:[["#",-4],["#",-7]]}}
};
var BOTTOM={treble:2,bass:-10};

function clefSVG(type,x,top){
  if(type==="treble")return '<g transform="translate('+x+','+(top-6)+')" class="ink" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M15 60 C11 62 8 58 11 55 C14 52 18 55 16 59 C14 64 21 64 21 58 L17 2 C16 -6 27 -4 25 7 C23 17 6 24 6 37 C6 47 19 49 23 43 C27 37 21 29 15 33 C11 36 13 41 17 41"/></g>';
  return '<g transform="translate('+(x+2)+','+top+')" class="ink"><circle cx="7" cy="10" r="3.8" stroke="none"/><path d="M4 10 C4 0 24 -2 25 11 C26 23 15 32 3 38" fill="none" stroke-width="2.6" stroke-linecap="round"/><circle cx="30" cy="5" r="2.1" stroke="none"/><circle cx="30" cy="15" r="2.1" stroke="none"/></g>';
}
function keySigSVG(clef,key,x,top){
  var k=KEYS[key],s="",bot=BOTTOM[clef];
  k.marks[clef].forEach(function(m,j){
    var y=top+40-(m[1]-bot)*5;
    s+='<text class="ksig" x="'+(x+j*10)+'" y="'+(y+(m[0]==="b"?4:6))+'">'+(m[0]==="b"?"♭":"♯")+'</text>';
  });
  return {svg:s,w:k.marks[clef].length*10};
}

/* ---------- 큰보표 악보 그리기 ----------
   o={staves:[{clef,items,prefix,labels:true}],sig,key,startBar,width} */
function restSVG(d,x,top){
  var m=top+20,s="";
  if(d==="w")s='<rect class="hd" x="'+(x-7)+'" y="'+(m-10)+'" width="14" height="5"/>';
  else if(d==="h"||d==="dh")s='<rect class="hd" x="'+(x-7)+'" y="'+(m-5)+'" width="14" height="5"/>';
  else if(d==="q"||d==="dq")s='<path class="st" fill="none" stroke-width="2.6" d="M'+(x-2)+' '+(m-14)+' L'+(x+4)+' '+(m-6)+' L'+(x-2)+' '+m+' L'+(x+4)+' '+(m+7)+' Q'+(x-5)+' '+(m+3)+' '+x+' '+(m+12)+'"/>';
  else{
    s='<circle class="hd" cx="'+(x-2)+'" cy="'+(m-5)+'" r="2.8"/><path class="st" d="M'+(x-2)+' '+(m-3)+' Q'+(x+2)+' '+(m-3)+' '+(x+4)+' '+(m-7)+' L'+(x-1)+' '+(m+9)+'" fill="none" stroke-width="1.6"/>';
    if(d==="s")s+='<circle class="hd" cx="'+(x-3)+'" cy="'+(m+1)+'" r="2.8"/><path class="st" d="M'+(x-3)+' '+(m+3)+' Q'+(x+1)+' '+(m+3)+' '+(x+2)+' '+(m-1)+'" fill="none" stroke-width="1.6"/>';
  }
  if(d==="dh"||d==="dq")s+='<circle class="hd" cx="'+(x+9)+'" cy="'+(m-3)+'" r="2"/>';
  return s;
}
function render(el,o){
  var W=Math.max(320,Math.min(940,Math.round(el.clientWidth||700)));
  var nb=Math.max.apply(0,o.staves.map(function(st){return st.items.length?st.items[st.items.length-1].bar+1:0;}));
  var maxCnt=0;
  for(var b=0;b<nb;b++)o.staves.forEach(function(st){maxCnt=Math.max(maxCnt,st.items.filter(function(it){return it.bar===b;}).length);});
  var ksW=KEYS[o.key].marks.treble.length*10;
  var leftFirst=40+ksW+28,leftRest=40+ksW+8;
  var minBar=Math.max(120,maxCnt*30+30);
  var html="",b0=0;
  while(b0<nb){
    var first=b0===0,left=first?leftFirst:leftRest;
    var per=Math.max(1,Math.min(nb-b0,Math.floor((W-left-6)/minBar)));
    var b1=b0+per,barW=(W-left-6)/per;
    var tops=[],y=46;
    o.staves.forEach(function(st){tops.push(y);y+=st.labels?120:100;});
    var H=y-(o.staves[o.staves.length-1].labels?18:30);
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="악보 '+(b0+o.startBar)+'~'+(b1-1+o.startBar)+'마디">';
    if(o.staves.length>1){
      s+='<line class="staffline" x1="4" x2="4" y1="'+tops[0]+'" y2="'+(tops[tops.length-1]+40)+'" style="stroke-width:2.4"/>';
    }
    o.staves.forEach(function(st,si){
      var top=tops[si],bot=BOTTOM[st.clef],yOf=function(step){return top+40-(step-bot)*5;},mid=bot+4;
      for(var l=0;l<5;l++)s+='<line class="staffline" x1="4" x2="'+(W-4)+'" y1="'+(top+l*10)+'" y2="'+(top+l*10)+'"/>';
      s+='<line class="staffline" x1="4" x2="4" y1="'+top+'" y2="'+(top+40)+'"/>';
      s+=clefSVG(st.clef,8,top);
      var ks=keySigSVG(st.clef,o.key,42,top);s+=ks.svg;
      if(first)s+='<g class="ink" stroke="none" font-family="Georgia,serif" font-weight="900" font-size="22" text-anchor="middle"><text x="'+(52+ks.w+8)+'" y="'+(top+18)+'">'+o.sig+'</text><text x="'+(52+ks.w+8)+'" y="'+(top+39)+'">4</text></g>';
      if(st.labels)s+='<text x="6" y="'+(top+78)+'" class="cnt" style="text-anchor:start">계이름</text>';
      var xOf={},keyAcc=KEYS[o.key].acc;
      for(var bi=b0;bi<b1;bi++){
        var bx=left+(bi-b0)*barW,inner=barW-30;
        if(si===0)s+='<text x="'+(bx+4)+'" y="'+(top-26)+'" class="cnt" style="text-anchor:start">'+(bi+o.startBar)+'</text>';
        var its=st.items.filter(function(it){return it.bar===bi;});
        its.forEach(function(it){xOf[it.i]=bx+16+it.pos/o.sig*inner;});
        /* 빔 묶음: 같은 박 안의 8분·16분 */
        var groups=[],cur=null;
        its.forEach(function(it){
          var beat=Math.floor(it.pos+1e-6);
          if(!it.rest&&BEAMABLE[it.d]){
            if(cur&&cur.beat===beat)cur.list.push(it);else{cur={beat:beat,list:[it]};groups.push(cur);}
          }else cur=null;
        });
        var gOf={};
        groups.forEach(function(g){
          if(g.list.length<2)return;
          var steps=[];g.list.forEach(function(it){it.notes.forEach(function(n){steps.push(n.step);});});
          var avg=steps.reduce(function(a,b){return a+b;},0)/steps.length;g.up=avg<mid;
          var ys=steps.map(yOf);g.y=g.up?Math.min.apply(0,ys)-30:Math.max.apply(0,ys)+30;
          g.list.forEach(function(it){gOf[it.i]=g;});
        });
        var barAcc={};
        its.forEach(function(it){
          var x=xOf[it.i];
          s+='<g class="n" data-i="'+st.prefix+it.i+'">';
          if(it.rest){s+=restSVG(it.d,x,top);s+='</g>';return;}
          var g=gOf[it.i],ns=it.notes.slice().sort(function(a,b){return a.step-b.step;});
          var open=it.d==="w"||it.d==="h"||it.d==="dh";
          var up=g?g.up:((ns[0].step+ns[ns.length-1].step)/2<mid);
          ns.forEach(function(n){
            var ny=yOf(n.step),l;
            for(l=bot-2;l>=n.step;l-=2)s+='<line class="st" x1="'+(x-10)+'" x2="'+(x+10)+'" y1="'+yOf(l)+'" y2="'+yOf(l)+'"/>';
            for(l=bot+10;l<=n.step;l+=2)s+='<line class="st" x1="'+(x-10)+'" x2="'+(x+10)+'" y1="'+yOf(l)+'" y2="'+yOf(l)+'"/>';
            s+='<ellipse class="hd'+(open?" open":"")+'" cx="'+x+'" cy="'+ny+'" rx="6.2" ry="4.4" transform="rotate(-20 '+x+' '+ny+')"/>';
            /* 임시표: 조표·같은 마디 앞 음과 다를 때만 */
            var slot=n.letter+n.oct,want=barAcc[slot]!==undefined?barAcc[slot]:(keyAcc[n.letter]||"");
            if(!it.cont&&n.acc!==want){s+='<text class="acc" x="'+(x-17)+'" y="'+(ny+5)+'">'+(n.acc==="b"?"♭":n.acc==="#"?"♯":"♮")+'</text>';}
            barAcc[slot]=n.acc;
            if(it.d==="dq"||it.d==="dh"||it.d==="de")s+='<circle class="hd" cx="'+(x+11)+'" cy="'+((n.step-bot)%2===0?ny-3:ny)+'" r="2"/>';
          });
          if(it.d!=="w"){
            var lowY=yOf(ns[0].step),highY=yOf(ns[ns.length-1].step),sx=up?x+5.6:x-5.6;
            var ty=g?g.y:(up?highY-32:lowY+32);
            s+='<line class="st" x1="'+sx+'" x2="'+sx+'" y1="'+(up?lowY:highY)+'" y2="'+ty+'"/>';
            if(!g&&(it.d==="e"||it.d==="de"||it.d==="s")){
              var fl=function(off){return up?'<path class="hd" d="M'+sx+' '+(ty+off)+' c1 5 10 8 8 17 c0 -6 -4 -9 -8 -11z"/>':'<path class="hd" d="M'+sx+' '+(ty-off)+' c1 -5 10 -8 8 -17 c0 6 -4 9 -8 11z"/>';};
              s+=fl(0);if(it.d==="s")s+=fl(7);
            }
          }
          if(st.labels)s+='<text class="lab" x="'+x+'" y="'+(top+78)+'">'+(it.cont?"~":ns.map(function(n){return n.sol;}).join("·"))+'</text>';
          s+='</g>';
        });
        /* 빔 */
        groups.forEach(function(g){
          if(g.list.length<2)return;
          var sxs=g.list.map(function(it){return xOf[it.i]+(g.up?5.6:-5.6);});
          var by=g.up?g.y:g.y-4.5,by2=g.up?g.y+7:g.y-11.5;
          s+='<rect class="beam" x="'+sxs[0]+'" y="'+by+'" width="'+(sxs[sxs.length-1]-sxs[0])+'" height="4.5"/>';
          g.list.forEach(function(it,k){
            if(it.d!=="s")return;
            var nx=g.list[k+1],pv=g.list[k-1];
            if(nx&&nx.d==="s")s+='<rect class="beam" x="'+sxs[k]+'" y="'+by2+'" width="'+(sxs[k+1]-sxs[k])+'" height="4.5"/>';
            else if(!(pv&&pv.d==="s")){var w=nx?8:-8;s+='<rect class="beam" x="'+Math.min(sxs[k],sxs[k]+w)+'" y="'+by2+'" width="8" height="4.5"/>';}
          });
        });
        var ex=bx+barW;
        if(bi===nb-1)s+='<line class="staffline" x1="'+(ex-5)+'" x2="'+(ex-5)+'" y1="'+top+'" y2="'+(top+40)+'"/><rect class="ink" x="'+(ex-2)+'" y="'+top+'" width="4" height="40"/>';
        else s+='<line class="staffline" x1="'+ex+'" x2="'+ex+'" y1="'+top+'" y2="'+(top+40)+'"/>';
      }
      /* 붙임줄 */
      st.items.forEach(function(it,k){
        if(!it.tie||it.bar<b0||it.bar>=b1)return;
        var nx=st.items[k+1];if(!nx)return;
        var n=it.notes[0],y0=yOf(n.step),above=n.step>=mid,x1=xOf[it.i]+7,x2=nx.bar<b1?xOf[nx.i]-7:W-8;
        var cy=above?y0-14:y0+14,yy=above?y0-6:y0+6;
        s+='<path class="tie" d="M'+x1+' '+yy+' Q'+((x1+x2)/2)+' '+cy+' '+x2+' '+yy+'"/>';
      });
    });
    s+='</svg>';html+=s;b0=b1;
  }
  el.innerHTML=html;
}
window.CZ_render=render;

/* ---------- 재생 ---------- */
var playing=null;
function stopAll(){ME.stop();if(playing&&playing.btn)playing.btn.classList.remove("live");playing=null;document.querySelectorAll(".beatdot").forEach(function(d){d.classList.remove("on");});}
function playParts(list,opts){
  /* list=[{st,bpm,parts:[...]}] 차례로 이어서 재생 */
  stopAll();ME.ac();var t=ME.now()+.1,my={btn:opts.btn};playing=my;if(opts.btn)opts.btn.classList.add("live");
  list.forEach(function(x,k){
    var info=ME.schedule({sig:x.sig,bpm:x.bpm,nbars:x.nbars,parts:x.parts,metro:opts.metro,countIn:k===0&&opts.countIn,
      kbRoot:opts.kbRoot||null,onBeat:opts.onBeat?function(b,c){opts.onBeat(x,b,c);}:null,
      onEnd:k===list.length-1?function(){if(playing!==my)return;if(opts.loop&&opts.loop())playParts(list,opts);else stopAll();}:null},t);
    t=info.end;
  });
}

/* ---------- 미니 악보: 조표와 음계 ---------- */
function scaleItems(names){return parseBars([names.map(function(n){return n+":e";})]);}
var SCALES={
  minor:{key:-1,names:["D4","E4","F4","G4","A4","Bb4","C#5","D5"],say:"레 · 미 · 파 · 솔 · 라 · 시♭ · 도♯ · 레"},
  major:{key:2,names:["D4","E4","F#4","G4","A4","B4","C#5","D5"],say:"레 · 미 · 파♯ · 솔 · 라 · 시 · 도♯ · 레"}
};
Object.keys(SCALES).forEach(function(k){
  var sc=SCALES[k],items=scaleItems(sc.names),el=$("scale-"+k);
  var draw=function(){render(el,{staves:[{clef:"treble",items:items,prefix:"S"+k,labels:true}],sig:4,key:sc.key,startBar:1});};
  draw();window.addEventListener("resize",debounce(draw,200));
  $("scaleplay-"+k).onclick=function(){
    playParts([{sig:4,bpm:90,nbars:1,parts:[{items:items,prefix:"S"+k,vel:.5}]}],{btn:this});
  };
});
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

/* ---------- 단계별 레슨 ---------- */
var follow=null,followStep=null;
function isDone(id,what){return store("cz-done-"+id+"-"+what)==="1";}
function stars(id){return (isDone(id,"R")?"★":"☆")+(isDone(id,"L")?"★":"☆");}

var lessonsEl=$("lessonList"),partOrder=[];
STEPS.forEach(function(st){
  st.R=parseBars(st.rh);st.L=parseBars(st.lh);
  if(partOrder.indexOf(st.part)<0)partOrder.push(st.part);
});
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
  var steps=STEPS.filter(function(s){return s.part===b.dataset.pp;}),orig=b.dataset.sp==="o";
  if(playing&&playing.btn===b){stopAll();return;}
  playParts(steps.map(function(st){
    return {sig:st.sig,bpm:orig?st.orig:st.bpm,nbars:st.rh.length,
      parts:[{items:audioItems(st.R),prefix:"x",vel:.5,light:false},{items:st.R,prefix:"R"+st.id+"-",mute:true},
             {items:st.L,prefix:"L"+st.id+"-",vel:.38}]};
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
  var draw=function(){
    render($("score"+st.id),{staves:[{clef:"treble",items:st.R,prefix:"R"+st.id+"-",labels:true},{clef:"bass",items:st.L,prefix:"L"+st.id+"-",labels:true}],sig:st.sig,key:st.key,startBar:st.pdf||1});
  };
  d.addEventListener("toggle",function(){
    if(!d.open){if(followStep===st)endFollow();return;}
    if(!drawn){
      draw();drawn=true;window.addEventListener("resize",debounce(function(){if(d.open)draw();},200));
      var all=[];st.R.concat(st.L).forEach(function(it){it.notes.forEach(function(n){all.push(n.midi);});});
      var lo=Math.min.apply(0,all),hi=Math.max.apply(0,all);
      while([1,3,6,8,10].indexOf(lo%12)>=0||lo%12!==0&&lo%12!==5)lo--;     /* 도 또는 파에서 시작 */
      while([1,3,6,8,10].indexOf(hi%12)>=0||hi%12!==4&&hi%12!==11)hi++;    /* 미 또는 시에서 끝 */
      var kb=ME.keyboard(lo,hi,{kw:30,kh:130});
      $("kb"+st.id).innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:'+Math.min(900,kb.w)+'px">'+kb.svg+'</svg>';
      $("kb"+st.id).addEventListener("pointerdown",function(e){var k=e.target.closest("[data-m]");if(!k)return;e.preventDefault();pressKey(st,+k.dataset.m);});
    }
  });
  d.addEventListener("click",function(e){
    var b=e.target.closest("[data-a]");if(!b)return;
    var a=b.dataset.a;
    if(a==="stop"){stopAll();endFollow();return;}
    if(a==="FR"||a==="FL"){startFollow(st,a==="FR"?"R":"L");return;}
    if(playing&&playing.btn===b){stopAll();return;}
    endFollow();
    var sp=d.querySelector('[data-o="speed"]').value,bpm=sp==="slow"?Math.round(st.bpm*.75):sp==="orig"?st.orig:st.bpm;
    var parts=[];
    if(a!=="L")parts.push({items:audioItems(st.R),prefix:"x",vel:.5,light:false},{items:st.R,prefix:"R"+st.id+"-",mute:true});
    if(a!=="R")parts.push({items:st.L,prefix:"L"+st.id+"-",vel:a==="L"?.5:.38});
    playParts([{sig:st.sig,bpm:bpm,nbars:st.rh.length,parts:parts}],{btn:b,countIn:true,
      metro:d.querySelector('[data-o="metro"]').checked,kbRoot:$("kb"+st.id),
      loop:function(){return d.querySelector('[data-o="loop"]').checked;},
      onBeat:function(x,beat){d.querySelectorAll(".beatdot").forEach(function(dot,i){dot.classList.toggle("on",i===beat);});}});
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

/* 처음 단계는 열어 두기 */
var firstStep=$("step1");if(firstStep)firstStep.open=true;
})();
