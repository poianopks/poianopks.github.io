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

/* ---------- 음표 해석 ---------- */
/* 길이(4분음표=1): t=셋잇단 8분, ts=셋잇단 16분, ds=점16분, z=32분 */
var DUR={w:4,dh:3,h:2,dq:1.5,q:1,de:.75,e:.5,ds:.375,t:1/3,s:.25,ts:1/6,z:.125};
var BEAMS={e:1,de:1,t:1,s:2,ds:2,ts:2,z:3};
var DOTTED={dh:1,dq:1,de:1,ds:1};
/* bars=[["A4:e","Bb4:e~",...],...] → items (~ = 다음 음과 붙임줄) */
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
/* 소리용: 붙임줄로 이어진 음은 한 번만 길게 */
function audioItems(items){
  return items.filter(function(it){return !it.rest&&!it.cont;}).map(function(it){
    var len=it.len,k=it.i;
    while(items[k]&&items[k].tie&&items[k+1]){len+=items[k+1].len;k++;}
    return {notes:it.notes,gpos:it.gpos,len:len,bar:it.bar,pos:it.pos};
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
  return s;
}
function restSVG(d,x,top){
  var m=top+20,s="";
  if(d==="w")s='<rect class="hd" x="'+(x-7)+'" y="'+(m-10)+'" width="14" height="5"/>';
  else if(d==="h"||d==="dh")s='<rect class="hd" x="'+(x-7)+'" y="'+(m-5)+'" width="14" height="5"/>';
  else if(d==="q"||d==="dq")s='<path class="st" fill="none" stroke-width="2.6" d="M'+(x-2)+' '+(m-14)+' L'+(x+4)+' '+(m-6)+' L'+(x-2)+' '+m+' L'+(x+4)+' '+(m+7)+' Q'+(x-5)+' '+(m+3)+' '+x+' '+(m+12)+'"/>';
  else{
    s='<circle class="hd" cx="'+(x-2)+'" cy="'+(m-5)+'" r="2.8"/><path class="st" d="M'+(x-2)+' '+(m-3)+' Q'+(x+2)+' '+(m-3)+' '+(x+4)+' '+(m-7)+' L'+(x-1)+' '+(m+9)+'" fill="none" stroke-width="1.6"/>';
    if((BEAMS[d]||1)>1)s+='<circle class="hd" cx="'+(x-3)+'" cy="'+(m+1)+'" r="2.8"/><path class="st" d="M'+(x-3)+' '+(m+3)+' Q'+(x+1)+' '+(m+3)+' '+(x+2)+' '+(m-1)+'" fill="none" stroke-width="1.6"/>';
  }
  if(DOTTED[d])s+='<circle class="hd" cx="'+(x+9)+'" cy="'+(m-3)+'" r="2"/>';
  return s;
}

/* ---------- 큰보표 악보 그리기 ----------
   o={staves:[{clef,items,prefix,labels}], bars:[{sig,key,sec}], startBar}
   그린 뒤 el._rows(svg 줄), el._bars(마디 위치: 재생선용)를 남겨요 */
var MINSP=26,QW=36;
function render(el,o){
  var W=Math.max(320,Math.min(1000,Math.round(el.clientWidth||700)));
  var nb=o.bars.length,byBar=o.staves.map(function(){return [];});
  for(var b=0;b<nb;b++)o.staves.forEach(function(st,si){byBar[si][b]=[];});
  o.staves.forEach(function(st,si){st.items.forEach(function(it){if(byBar[si][it.bar])byBar[si][it.bar].push(it);});});
  /* 마디마다 시간→가로 위치 지도 (음표가 몰려도 계이름이 겹치지 않게 최소 간격) */
  var gstart=[],g=0,maps=[];
  for(b=0;b<nb;b++){
    gstart.push(g);g+=o.bars[b].sig;
    var ons={};o.staves.forEach(function(st,si){byBar[si][b].forEach(function(it){ons[Math.round(it.pos*1000)]=1;});});
    var list=Object.keys(ons).map(Number).sort(function(a,c){return a-c;}).map(function(v){return v/1000;});
    if(!list.length||list[0]>0)list.unshift(0);
    var cum=[0],sum=0;
    for(var k=0;k<list.length;k++){var nx=k+1<list.length?list[k+1]:o.bars[b].sig;sum+=Math.max(MINSP,(nx-list[k])*QW);cum.push(sum);}
    maps.push({ons:list,cum:cum,min:sum+30});
  }
  var html="",rows=[],b0=0;
  while(b0<nb){
    var bar0=o.bars[b0],prev=b0>0?o.bars[b0-1]:null;
    var showTime=!prev||prev.sig!==bar0.sig,ksW=KEYS[bar0.key].marks.treble.length*10;
    var left=42+ksW+(showTime?30:6),avail=W-left-6,used=0,b1=b0;
    while(b1<nb){
      if(b1>b0&&(o.bars[b1].key!==bar0.key||o.bars[b1].sig!==bar0.sig))break;
      if(b1>b0&&used+maps[b1].min>avail)break;
      used+=maps[b1].min;b1++;
    }
    var stretch=Math.max(1,avail/used);
    if(b1===nb&&b1-b0===1&&stretch>2.2)stretch=2.2;
    rows.push({b0:b0,b1:b1,left:left,stretch:stretch,showTime:showTime,key:bar0.key,sig:bar0.sig});
    b0=b1;
  }
  var layout=[];
  rows.forEach(function(row,ri){
    /* 높은 음이 있으면 위쪽 여유를 더 줘요 */
    var hi=2;o.staves[0].items.forEach(function(it){if(it.bar>=row.b0&&it.bar<row.b1)it.notes.forEach(function(n){hi=Math.max(hi,n.step);});});
    var top0=46+Math.max(0,(hi-12)*5),tops=[],y=top0;
    o.staves.forEach(function(st){tops.push(y);y+=st.labels?126:100;});
    var H=y-(o.staves[o.staves.length-1].labels?32:40);
    var s='<svg viewBox="0 0 '+W+' '+H+'" data-row="'+ri+'" role="img" aria-label="악보 '+(row.b0+o.startBar)+'~'+(row.b1-1+o.startBar)+'마디">';
    if(o.staves.length>1)s+='<line class="staffline" x1="4" x2="4" y1="'+tops[0]+'" y2="'+(tops[tops.length-1]+40)+'" style="stroke-width:2.4"/>';
    var bx=row.left,barX=[];
    for(var bi=row.b0;bi<row.b1;bi++){barX.push(bx);bx+=maps[bi].min*row.stretch;}
    barX.push(bx);
    /* 마디별 시간→x */
    var xAt=function(bi,pos){
      var m=maps[bi],x0=barX[bi-row.b0],sc=row.stretch,k=0;
      while(k+1<m.ons.length&&m.ons[k+1]<=pos+1e-6)k++;
      var nx=k+1<m.ons.length?m.ons[k+1]:o.bars[bi].sig,f=nx>m.ons[k]?(pos-m.ons[k])/(nx-m.ons[k]):0;
      return x0+(18+m.cum[k]+f*(m.cum[k+1]-m.cum[k]))*sc;
    };
    o.staves.forEach(function(st,si){
      var top=tops[si],bot=BOTTOM[st.clef],yOf=function(step){return top+40-(step-bot)*5;},mid=bot+4;
      for(var l=0;l<5;l++)s+='<line class="staffline" x1="4" x2="'+(W-4)+'" y1="'+(top+l*10)+'" y2="'+(top+l*10)+'"/>';
      s+='<line class="staffline" x1="4" x2="4" y1="'+top+'" y2="'+(top+40)+'"/>';
      s+=clefSVG(st.clef,8,top)+keySigSVG(st.clef,row.key,42,top);
      if(row.showTime){var tx=42+KEYS[row.key].marks.treble.length*10+14;
        s+='<g class="ink" stroke="none" font-family="Georgia,serif" font-weight="900" font-size="22" text-anchor="middle"><text x="'+tx+'" y="'+(top+18)+'">'+row.sig+'</text><text x="'+tx+'" y="'+(top+39)+'">4</text></g>';}
      if(st.labels)s+='<text x="6" y="'+(top+(si===0?84:70))+'" class="cnt" style="text-anchor:start">계이름</text>';
      var keyAcc=KEYS[row.key].acc,xOf={};
      for(var bi=row.b0;bi<row.b1;bi++){
        var its=byBar[si][bi];
        its.forEach(function(it){xOf[it.i]=xAt(bi,it.pos);});
        if(si===0){
          s+='<text x="'+(barX[bi-row.b0]+3)+'" y="'+(top-(hi>12?(hi-10)*5+8:22))+'" class="cnt" style="text-anchor:start">'+(bi+o.startBar)+'</text>';
          if(o.bars[bi].sec)s+='<text x="'+(barX[bi-row.b0]+22)+'" y="14" class="sec">'+o.bars[bi].sec+'</text>';
        }
        /* 빔 묶음: 같은 박 안의 8분·16분·셋잇단 */
        var groups=[],cur=null;
        its.forEach(function(it){
          var beat=Math.floor(it.pos+1e-6);
          if(!it.rest&&BEAMS[it.d]){
            if(cur&&cur.beat===beat)cur.list.push(it);else{cur={beat:beat,list:[it]};groups.push(cur);}
          }else cur=null;
        });
        var gOf={};
        groups.forEach(function(gr){
          var steps=[];gr.list.forEach(function(it){it.notes.forEach(function(n){steps.push(n.step);});});
          var avg=steps.reduce(function(a,c){return a+c;},0)/steps.length;gr.up=avg<mid;
          var ys=steps.map(yOf),lv=Math.max.apply(0,gr.list.map(function(it){return BEAMS[it.d];}));
          gr.y=gr.up?Math.min.apply(0,ys)-30-(lv-1)*5:Math.max.apply(0,ys)+30+(lv-1)*5;
          if(gr.list.length>1)gr.list.forEach(function(it){gOf[it.i]=gr;});
        });
        var barAcc={};
        its.forEach(function(it){
          var x=xOf[it.i];
          s+='<g class="n" data-i="'+st.prefix+it.i+'">';
          if(it.rest){s+=restSVG(it.d,x,top)+'</g>';return;}
          var gr=gOf[it.i],ns=it.notes.slice().sort(function(a,c){return a.step-c.step;});
          var open=it.d==="w"||it.d==="h"||it.d==="dh";
          var up=gr?gr.up:((ns[0].step+ns[ns.length-1].step)/2<mid);
          ns.forEach(function(n){
            var ny=yOf(n.step),l;
            for(l=bot-2;l>=n.step;l-=2)s+='<line class="st" x1="'+(x-10)+'" x2="'+(x+10)+'" y1="'+yOf(l)+'" y2="'+yOf(l)+'"/>';
            for(l=bot+10;l<=n.step;l+=2)s+='<line class="st" x1="'+(x-10)+'" x2="'+(x+10)+'" y1="'+yOf(l)+'" y2="'+yOf(l)+'"/>';
            s+='<ellipse class="hd'+(open?" open":"")+'" cx="'+x+'" cy="'+ny+'" rx="6.2" ry="4.4" transform="rotate(-20 '+x+' '+ny+')"/>';
            var slot=n.letter+n.oct,want=barAcc[slot]!==undefined?barAcc[slot]:(keyAcc[n.letter]||"");
            if(!it.cont&&n.acc!==want)s+='<text class="acc" x="'+(x-17)+'" y="'+(ny+5)+'">'+(n.acc==="b"?"♭":n.acc==="#"?"♯":"♮")+'</text>';
            barAcc[slot]=n.acc;
            if(DOTTED[it.d])s+='<circle class="hd" cx="'+(x+11)+'" cy="'+((n.step-bot)%2===0?ny-3:ny)+'" r="2"/>';
          });
          if(it.d!=="w"){
            var lowY=yOf(ns[0].step),highY=yOf(ns[ns.length-1].step),sx=up?x+5.6:x-5.6;
            var ty=gr&&gOf[it.i]?gr.y:(up?highY-32-((BEAMS[it.d]||1)-1)*5:lowY+32+((BEAMS[it.d]||1)-1)*5);
            s+='<line class="st" x1="'+sx+'" x2="'+sx+'" y1="'+(up?lowY:highY)+'" y2="'+ty+'"/>';
            if(!gOf[it.i]&&BEAMS[it.d]){
              for(var f=0;f<BEAMS[it.d];f++){var off=f*7;
                s+=up?'<path class="hd" d="M'+sx+' '+(ty+off)+' c1 5 10 8 8 17 c0 -6 -4 -9 -8 -11z"/>':'<path class="hd" d="M'+sx+' '+(ty-off)+' c1 -5 10 -8 8 -17 c0 6 -4 9 -8 11z"/>';}
            }
          }
          if(st.labels)s+='<text class="lab" x="'+x+'" y="'+(top+(si===0?84:70))+'">'+(it.cont?"~":ns.map(function(n){return n.sol;}).join("·"))+'</text>';
          s+='</g>';
        });
        /* 빔(겹 빔) + 셋잇단 '3' */
        groups.forEach(function(gr){
          var L=gr.list,sxs=L.map(function(it){return xOf[it.i]+(gr.up?5.6:-5.6);});
          if(L.length>1){
            for(var lv=1;lv<=3;lv++){
              var by=gr.up?gr.y+(lv-1)*7:gr.y-4.5-(lv-1)*7;
              for(var k=0;k<L.length;k++){
                if((BEAMS[L[k].d]||0)<lv)continue;
                var nx=L[k+1]&&(BEAMS[L[k+1].d]||0)>=lv,pv=L[k-1]&&(BEAMS[L[k-1].d]||0)>=lv;
                if(lv===1){if(k===0)s+='<rect class="beam" x="'+sxs[0]+'" y="'+by+'" width="'+(sxs[L.length-1]-sxs[0])+'" height="4.5"/>';continue;}
                if(nx)s+='<rect class="beam" x="'+sxs[k]+'" y="'+by+'" width="'+(sxs[k+1]-sxs[k])+'" height="4.5"/>';
                else if(!pv){var w=k+1<L.length?8:-8;s+='<rect class="beam" x="'+Math.min(sxs[k],sxs[k]+w)+'" y="'+by+'" width="8" height="4.5"/>';}
              }
            }
          }
          var tw={};
          var topY=Math.min.apply(0,[].concat.apply([],L.map(function(it){return it.notes.map(function(n){return yOf(n.step);});})));
          L.forEach(function(it,k){if(it.d==="t"||it.d==="ts"){var win=it.d==="t"?1:.5,key=Math.floor(it.pos/win+1e-6);(tw[key]=tw[key]||[]).push(xOf[it.i]);}});
          Object.keys(tw).forEach(function(key){var xs=tw[key],cx=(xs[0]+xs[xs.length-1])/2;
            s+='<text class="tup" x="'+cx+'" y="'+(gr.up?gr.y-6:Math.min(topY-9,top-6))+'">3</text>';});
        });
        var ex=barX[bi-row.b0+1];
        if(bi===nb-1)s+='<line class="staffline" x1="'+(ex-5)+'" x2="'+(ex-5)+'" y1="'+top+'" y2="'+(top+40)+'"/><rect class="ink" x="'+(ex-2)+'" y="'+top+'" width="4" height="40"/>';
        else if(bi===row.b1-1&&row.b1<nb&&(o.bars[row.b1].key!==row.key||o.bars[row.b1].sig!==row.sig))s+='<line class="staffline" x1="'+(ex-4)+'" x2="'+(ex-4)+'" y1="'+top+'" y2="'+(top+40)+'"/><line class="staffline" x1="'+ex+'" x2="'+ex+'" y1="'+top+'" y2="'+(top+40)+'"/>';
        else s+='<line class="staffline" x1="'+ex+'" x2="'+ex+'" y1="'+top+'" y2="'+(top+40)+'"/>';
      }
      /* 붙임줄 */
      st.items.forEach(function(it,k){
        if(!it.tie||it.bar<row.b0||it.bar>=row.b1)return;
        var nx=st.items[k+1];if(!nx)return;
        var n=it.notes[0],y0=yOf(n.step),above=n.step>=mid,x1=xOf[it.i]+7,x2=nx.bar<row.b1?xOf[nx.i]-7:W-8;
        s+='<path class="tie" d="M'+x1+' '+(above?y0-6:y0+6)+' Q'+((x1+x2)/2)+' '+(above?y0-14:y0+14)+' '+x2+' '+(above?y0-6:y0+6)+'"/>';
      });
    });
    /* 재생선 + 통통 공 */
    s+='<g class="ph" style="display:none"><rect class="phband" x="-9" y="'+(tops[0]-14)+'" width="18" height="'+(tops[tops.length-1]+54-tops[0])+'" rx="9"/><circle class="phball" cx="0" cy="'+(tops[0]-20)+'" r="7"/></g>';
    s+='</svg>';html+=s;
    for(var bi=row.b0;bi<row.b1;bi++)layout.push({b:bi,row:ri,g0:gstart[bi],sig:o.bars[bi].sig,x:xAt.bind(null,bi),x0:barX[bi-row.b0],x1:barX[bi-row.b0+1],ballY:tops[0]-20});
  });
  el.innerHTML=html;
  el._rows=[].slice.call(el.querySelectorAll("svg"));
  el._bars=layout;
  el._nodes={};
  [].forEach.call(el.querySelectorAll("[data-i]"),function(n){el._nodes[n.getAttribute("data-i")]=n;});
}

/* ---------- 재생기: 미리 읽어 소리 예약 + 움직이는 재생선 ----------
   chunks=[{el, bars:[{sig,bpm}], parts:[{items, prefix, audio, light, vel}], kb}] 차례로 이어서 */
var P=null;
function stopAll(){
  if(P){clearInterval(P.iv);cancelAnimationFrame(P.raf);P.timers.forEach(clearTimeout);if(P.btn)P.btn.classList.remove("live");
    P.chunks.forEach(function(c){if(c.el&&c.el._rows)c.el._rows.forEach(function(r){var ph=r.querySelector(".ph");if(ph)ph.style.display="none";});});
    if(P.onStop)P.onStop();}
  P=null;ME.stop();
  document.querySelectorAll(".beatdot.on").forEach(function(d){d.classList.remove("on");});
}
function play(chunks,opts){
  stopAll();ME.ac();
  var mul=opts.mul||1,t=0,evs=[],first=chunks[0];
  /* 박 시간표 */
  chunks.forEach(function(c){
    c.tb=[];c.gb=[];var g=0;
    c.bars.forEach(function(b){c.tb.push(t);c.gb.push(g);t+=b.sig*60/(b.bpm*mul);g+=b.sig;});
    c.t0=c.tb[0];c.t1=t;
  });
  var total=t;
  function tAt(c,g){var b=c.gb.length-1;while(b>0&&c.gb[b]>g+1e-9)b--;return c.tb[b]+(g-c.gb[b])*60/(c.bars[b].bpm*mul);}
  var startT=0;
  if(opts.fromBar!=null){startT=chunks[0].tb[opts.fromBar]||0;}
  chunks.forEach(function(c){
    c.parts.forEach(function(p){
      p.items.forEach(function(it){
        if(it.rest)return;
        var a=tAt(c,it.gpos),b=tAt(c,it.gpos+it.len);
        if(a<startT-1e-6)return;
        if(p.audio!==false)evs.push({t:a,k:"n",midis:it.notes.map(function(n){return n.midi;}),dur:Math.max(.08,(b-a)*.93),vel:(p.vel||.45)*(it.pos===0?1.1:1)*(it.notes.length>1?.7:1)});
        if(p.light){var node=c.el&&c.el._nodes&&c.el._nodes[p.prefix+it.i];
          evs.push({t:a,k:"on",node:node,midis:it.notes.map(function(n){return n.midi;}),kb:c.kb,off:b});}
      });
    });
    if(opts.metro)c.bars.forEach(function(b,bi){for(var q=0;q<b.sig;q++){var tt=c.tb[bi]+q*60/(b.bpm*mul);if(tt>=startT-1e-6)evs.push({t:tt,k:"c",acc:q===0,beat:q,beatsEl:c.beatsEl});}});
    else if(c.beatsEl)c.bars.forEach(function(b,bi){for(var q=0;q<b.sig;q++){var tt=c.tb[bi]+q*60/(b.bpm*mul);if(tt>=startT-1e-6)evs.push({t:tt,k:"b",beat:q,beatsEl:c.beatsEl});}});
  });
  evs.sort(function(a,b){return a.t-b.t;});
  var lead=.15,count=0;
  if(opts.countIn){
    var b0=chunks[0].bars[opts.fromBar||0],spb=60/(b0.bpm*mul);count=b0.sig*spb;
    for(var q=0;q<b0.sig;q++)ME.click(ME.now()+lead+q*spb,q===0);
  }
  var T0=ME.now()+lead+count-startT,ix=0;
  P={iv:0,raf:0,timers:[],btn:opts.btn,chunks:chunks,onStop:opts.onStop,T0:T0,total:total};
  var me=P;
  if(opts.btn)opts.btn.classList.add("live");
  chunks.forEach(function(c){if(c.el&&c.el._nodes)Object.keys(c.el._nodes).forEach(function(k){c.el._nodes[k].classList.remove("pl","on");});});
  function later(fn,at){me.timers.push(setTimeout(fn,Math.max(0,(at-ME.now())*1000)));}
  function pump(){
    if(P!==me)return;
    var now=ME.now();
    while(ix<evs.length&&evs[ix].t+T0<now+.35){
      var e=evs[ix++],at=e.t+T0;
      if(e.k==="n")e.midis.forEach(function(m){ME.piano(m,at,e.dur,e.vel);});
      else if(e.k==="c"||e.k==="b"){if(e.k==="c")ME.click(at,e.acc);(function(e){later(function(){if(e.beatsEl)[].forEach.call(e.beatsEl.children,function(d,i){d.classList.toggle("on",i===e.beat);});},at);})(e);}
      else if(e.k==="on")(function(e){
        later(function(){if(e.node){e.node.classList.add("on");e.node.classList.remove("pl");}
          if(e.kb)e.midis.forEach(function(m){var k=e.kb.querySelector('[data-m="'+m+'"]');if(k)k.classList.add("on");});},at);
        later(function(){if(e.node){e.node.classList.remove("on");e.node.classList.add("pl");}
          if(e.kb)e.midis.forEach(function(m){var k=e.kb.querySelector('[data-m="'+m+'"]');if(k)k.classList.remove("on");});},e.off+T0-.015);
      })(e);
    }
    if(now>T0+total+.2){
      var o=opts;stopAll();
      if(o.loop&&o.loop())play(chunks,Object.assign({},o,{fromBar:null}));
    }
  }
  P.iv=setInterval(pump,40);pump();
  /* 재생선 */
  var lastRow=null;
  function frame(){
    if(P!==me)return;
    var tt=ME.now()-T0;
    if(tt>=0){
      var c=null;for(var k=0;k<chunks.length;k++)if(tt<chunks[k].t1||k===chunks.length-1){c=chunks[k];break;}
      if(c&&c.el&&c.el._bars){
        var b=c.tb.length-1;while(b>0&&c.tb[b]>tt)b--;
        var bpm=c.bars[b].bpm*mul,within=Math.min(c.bars[b].sig,(tt-c.tb[b])*bpm/60),L=c.el._bars[b];
        if(L){
          var x=L.x(within),row=c.el._rows[L.row],ph=row.querySelector(".ph"),bounce=Math.abs(Math.sin(Math.PI*(within%1)));
          if(lastRow!==row){
            if(lastRow){var o=lastRow.querySelector(".ph");if(o)o.style.display="none";}
            ph.style.display="";lastRow=row;
            if(opts.scrollBox){var sb=opts.scrollBox;sb.scrollTo({top:Math.max(0,sb.scrollTop+row.getBoundingClientRect().top-sb.getBoundingClientRect().top-8),behavior:"smooth"});var pr=sb.getBoundingClientRect();if(pr.top<0||pr.top>innerHeight*.5)sb.scrollIntoView({behavior:"smooth",block:"start"});}
            else{var r=row.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-10)row.scrollIntoView({behavior:"smooth",block:"center"});}
          }
          ph.setAttribute("transform","translate("+x.toFixed(1)+",0)");
          var ball=ph.querySelector(".phball");ball.setAttribute("cy",(L.ballY-12*bounce).toFixed(1));
          if(opts.onBar)opts.onBar(L.b);
        }
      }
    }
    me.raf=requestAnimationFrame(frame);
  }
  me.raf=requestAnimationFrame(frame);
}
/* 악보에서 마디를 누른 위치 → 마디 번호 */
function barFromClick(el,e){
  var svg=e.target.closest("svg");if(!svg||!el._rows)return null;
  var ri=el._rows.indexOf(svg),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
  var p=pt.matrixTransform(svg.getScreenCTM().inverse()),hit=null;
  el._bars.forEach(function(L){if(L.row===ri&&p.x>=L.x0&&p.x<L.x1)hit=L.b;});
  return hit;
}

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
    if(P&&P.btn===this){stopAll();return;}
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
  window.addEventListener("resize",debounce(function(){if(fullDrawn&&!(P&&P.chunks[0].el===fs))drawFull();},250));
  var fullPlay=function(btn,mode,fromBar){
    ensure();
    var mul=+$("fullSpeed").value,parts=[];
    if(mode!=="L")parts.push({items:full.RA,vel:.5},{items:full.R,prefix:"FR",audio:false,light:true});
    if(mode!=="R")parts.push({items:full.L,prefix:"FL",vel:mode==="L"?.5:.36,light:true});
    play([{el:fs,bars:full.bars,parts:parts,kb:$("fullKb")}],{btn:btn,mul:mul,fromBar:fromBar,metro:$("fullMetro").checked,scrollBox:fs,
      onBar:function(b){var s=$("fullNow");if(s)s.textContent=(b+1)+" / "+full.bars.length+"마디"+(SECS[b+1]?" · "+SECS[b+1]:"");}});
  };
  [].forEach.call(document.querySelectorAll("[data-full]"),function(b){
    b.onclick=function(){var m=b.dataset.full;if(m==="stop"){stopAll();return;}if(P&&P.btn===b){stopAll();return;}fullPlay(b,m,null);};
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
  if(P&&P.btn===b){stopAll();return;}
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
    if(P&&P.chunks.some(function(c){return c.el===$("score"+st.id);}))return;
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
    if(P&&P.btn===b){stopAll();return;}
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
