/* 공통 악보 엔진: 큰보표 그리기(조표·임시표·셋잇단·32분·붙임줄·8va·음자리표 자동) + 움직이는 재생선 재생기
   차르다시·소녀의 기도 레슨이 함께 써요. 소리·건반은 music-engine.js의 ME */
(function(){
"use strict";
var ME=window.ME;
/* ---------- 음표 해석 ---------- */
/* 길이(4분음표=1): t=셋잇단 8분, ts=셋잇단 16분, ds=점16분, z=32분 */
var DUR={w:4,dh:3,h:2,dq:1.5,q:1,de:.75,e:.5,ds:.375,t:1/3,s:.25,ts:1/6,z:.125,tz:1/12,x:1/24};
var BEAMS={e:1,de:1,t:1,s:2,ds:2,ts:2,z:3,tz:3};
var DOTTED={dh:1,dq:1,de:1,ds:1};
/* bars=[["A4:e","Bb4:e~",...],...] → items (~ = 다음 음과 붙임줄) */
function parseBars(bars){
  var items=[],gpos=0;
  bars.forEach(function(bar,bi){
    var pos=0;
    bar.forEach(function(tok){
      var tie=/~$/.test(tok);tok=tok.replace(/~$/,"");
      var orn=/\^(\w+)$/.exec(tok);if(orn)tok=tok.replace(/\^\w+$/,"");
      var a=tok.split(":"),it={d:a[1],len:DUR[a[1]],bar:bi,pos:pos,gpos:gpos,i:items.length,tie:tie,orn:orn?orn[1]:null};
      if(a[1]==="x")it.hidden=true;
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
  return items.filter(function(it){return !it.rest&&!it.cont&&!it.hidden;}).map(function(it){
    var len=it.len,k=it.i;
    while(items[k]&&items[k].tie&&items[k+1]){len+=items[k+1].len;k++;}
    return {notes:it.notes,gpos:it.gpos,len:len,bar:it.bar,pos:it.pos};
  });
}

/* ---------- 조표 ---------- */
var KEYS={
  "-1":{name:"라단조",acc:{B:"b"},marks:{treble:[["b",6]],bass:[["b",-8]]}},
  "2":{name:"라장조",acc:{F:"#",C:"#"},marks:{treble:[["#",10],["#",7]],bass:[["#",-4],["#",-7]]}},
  "-3":{name:"내림마장조",acc:{B:"b",E:"b",A:"b"},marks:{treble:[["b",6],["b",9],["b",5]],bass:[["b",-8],["b",-5],["b",-9]]}}
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
function yOfC(clef,top,step){return top+40-(step-BOTTOM[clef])*5;}
/* o={staves:[{clef,items,prefix,labels,autoClef:"row"|"item",ott:bool}], bars:[{sig,key,sec}], startBar} */
function render(el,o){
  var W=Math.max(320,Math.min(1000,Math.round(el.clientWidth||700)));
  var nb=o.bars.length,byBar=o.staves.map(function(){return [];});
  for(var b=0;b<nb;b++)o.staves.forEach(function(st,si){byBar[si][b]=[];});
  o.staves.forEach(function(st,si){st.items.forEach(function(it){if(!it.hidden&&byBar[si][it.bar])byBar[si][it.bar].push(it);});});
  /* 8va: 높은음자리표에서 E6보다 높은 음이 있는 마디는 한 옥타브 낮춰 적고 8va 표시 */
  o.staves.forEach(function(st,si){
    for(var b=0;b<nb;b++){
      var mx=0;byBar[si][b].forEach(function(it){it.notes.forEach(function(n){mx=Math.max(mx,n.midi);});});
      var sh=st.ott&&mx>88?7:0;byBar[si][b].forEach(function(it){it._sh=sh;});
      byBar[si][b].ott=sh>0;
    }
  });
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
    var stretch=used>avail?avail/used:Math.max(1,avail/used);
    if(b1===nb&&b1-b0===1&&stretch>2.2)stretch=2.2;
    rows.push({b0:b0,b1:b1,left:left,stretch:stretch,showTime:showTime,key:bar0.key,sig:bar0.sig});
    b0=b1;
  }
  var dstep=function(n,it){return n.step-(it._sh||0);};
  var layout=[];
  rows.forEach(function(row,ri){
    /* 음자리표 정하기 */
    var rowClef=o.staves.map(function(st,si){
      var its=[];for(var b=row.b0;b<row.b1;b++)its=its.concat(byBar[si][b]);
      if(st.autoClef==="row"){
        var stp=[];its.forEach(function(it){it.notes.forEach(function(n){stp.push(dstep(n,it));});});
        var c=stp.length&&stp.reduce(function(a,v){return a+v;},0)/stp.length<2?"bass":"treble";
        if(c==="bass")its.forEach(function(it){it._sh=0;});
        its.forEach(function(it){it._clef=c;});return c;
      }
      if(st.autoClef==="item"){
        var cur=st.clef,first=null;
        its.forEach(function(it){
          if(!it.rest){var low=Math.min.apply(0,it.notes.map(function(n){return dstep(n,it);}));
            if(cur==="bass"&&low>=3)cur="treble";else if(cur==="treble"&&low<-1)cur="bass";}
          it._clef=cur;if(first===null)first=cur;
        });
        return first||st.clef;
      }
      its.forEach(function(it){it._clef=st.clef;});return st.clef;
    });
    var hiY=0;o.staves[0].items.forEach(function(it){if(it.bar>=row.b0&&it.bar<row.b1&&!it.hidden)it.notes.forEach(function(n){hiY=Math.max(hiY,(dstep(n,it)-BOTTOM[it._clef||"treble"])*5-40);});});
    var hasOtt=byBar[0].slice(row.b0,row.b1).some(function(x){return x.ott;});
    var top0=Math.max(46+Math.max(0,hiY-20),hasOtt?Math.max(hiY,10)+58:0),tops=[],y=top0;
    o.staves.forEach(function(st,si){
      tops.push(y);
      var lowY=0;st.items.forEach(function(it){if(it.bar>=row.b0&&it.bar<row.b1&&!it.hidden)it.notes.forEach(function(n){lowY=Math.max(lowY,(BOTTOM[it._clef||st.clef]-dstep(n,it))*5);});});
      var lines=1;st.items.forEach(function(it){if(it.bar>=row.b0&&it.bar<row.b1&&!it.hidden&&!it.rest){var u={};it.notes.forEach(function(n){u[n.sol]=1;});lines=Math.max(lines,Object.keys(u).length);}});
      y+=(st.labels?126:100)+Math.max(0,lowY-26)+(st.labels?(lines-1)*13:0);
    });
    var H=y-(o.staves[o.staves.length-1].labels?32:40);
    var s='<svg viewBox="0 0 '+W+' '+H+'" data-row="'+ri+'" role="img" aria-label="악보 '+(row.b0+o.startBar)+'~'+(row.b1-1+o.startBar)+'마디">';
    if(o.staves.length>1)s+='<line class="staffline" x1="4" x2="4" y1="'+tops[0]+'" y2="'+(tops[tops.length-1]+40)+'" style="stroke-width:2.4"/>';
    var bx=row.left,barX=[];
    for(var bi=row.b0;bi<row.b1;bi++){barX.push(bx);bx+=maps[bi].min*row.stretch;}
    barX.push(bx);
    var xAt=function(bi,pos){
      var m=maps[bi],x0=barX[bi-row.b0],sc=row.stretch,k=0;
      while(k+1<m.ons.length&&m.ons[k+1]<=pos+1e-6)k++;
      var nx=k+1<m.ons.length?m.ons[k+1]:o.bars[bi].sig,f=nx>m.ons[k]?(pos-m.ons[k])/(nx-m.ons[k]):0;
      return x0+(18+m.cum[k]+f*(m.cum[k+1]-m.cum[k]))*sc;
    };
    o.staves.forEach(function(st,si){
      var top=tops[si],labY=top+(si===0?84:70);
      var lowest=0;st.items.forEach(function(it){if(it.bar>=row.b0&&it.bar<row.b1&&!it.hidden)it.notes.forEach(function(n){lowest=Math.max(lowest,yOfC(it._clef||st.clef,top,dstep(n,it)));});});
      labY=Math.max(labY,lowest+20);
      for(var l=0;l<5;l++)s+='<line class="staffline" x1="4" x2="'+(W-4)+'" y1="'+(top+l*10)+'" y2="'+(top+l*10)+'"/>';
      s+='<line class="staffline" x1="4" x2="4" y1="'+top+'" y2="'+(top+40)+'"/>';
      s+=clefSVG(rowClef[si],8,top)+keySigSVG(rowClef[si],row.key,42,top);
      if(row.showTime){var tx=42+KEYS[row.key].marks.treble.length*10+14;
        s+='<g class="ink" stroke="none" font-family="Georgia,serif" font-weight="900" font-size="22" text-anchor="middle"><text x="'+tx+'" y="'+(top+18)+'">'+row.sig+'</text><text x="'+tx+'" y="'+(top+39)+'">4</text></g>';}
      if(st.labels)s+='<text x="6" y="'+labY+'" class="cnt" style="text-anchor:start">계이름</text>';
      var keyAcc=KEYS[row.key].acc,xOf={},prevClef=rowClef[si];
      for(var bi=row.b0;bi<row.b1;bi++){
        var its=byBar[si][bi];
        its.forEach(function(it){xOf[it.i]=xAt(bi,it.pos);});
        if(si===0){
          s+='<text x="'+(barX[bi-row.b0]+3)+'" y="'+(top-Math.max(22,hiY+8))+'" class="cnt" style="text-anchor:start">'+(bi+o.startBar)+'</text>';
          if(o.bars[bi].sec)s+='<text x="'+(barX[bi-row.b0]+22)+'" y="14" class="sec">'+o.bars[bi].sec+'</text>';
        }
        if(its.ott){
          var oy=top-12;its.forEach(function(it){it.notes.forEach(function(n){oy=Math.min(oy,yOfC(it._clef,top,dstep(n,it))-40);});});
          var ox0=barX[bi-row.b0]+6,ox1=barX[bi-row.b0+1]-4;
          s+='<text class="ott" x="'+ox0+'" y="'+oy+'">8va</text><line class="ottl" x1="'+(ox0+26)+'" x2="'+ox1+'" y1="'+(oy-4)+'" y2="'+(oy-4)+'"/><line class="ottl" x1="'+ox1+'" x2="'+ox1+'" y1="'+(oy-4)+'" y2="'+(oy+4)+'"/>';
        }
        var Y=function(it,step){return yOfC(it._clef||st.clef,top,step);};
        var groups=[],cur=null;
        its.forEach(function(it){
          var beat=Math.floor(it.pos+1e-6);
          if(!it.rest&&BEAMS[it.d]){
            if(cur&&cur.beat===beat&&cur.clef===it._clef)cur.list.push(it);else{cur={beat:beat,list:[it],clef:it._clef};groups.push(cur);}
          }else cur=null;
        });
        var gOf={};
        groups.forEach(function(gr){
          var ys=[];gr.list.forEach(function(it){it.notes.forEach(function(n){ys.push(Y(it,dstep(n,it)));});});
          var avg=ys.reduce(function(a,c){return a+c;},0)/ys.length;gr.up=avg>top+20;
          var lv=Math.max.apply(0,gr.list.map(function(it){return BEAMS[it.d];}));
          gr.y=gr.up?Math.min.apply(0,ys)-30-(lv-1)*5:Math.max.apply(0,ys)+30+(lv-1)*5;
          gr.ys=ys;
          if(gr.list.length>1)gr.list.forEach(function(it){gOf[it.i]=gr;});
        });
        var barAcc={};
        its.forEach(function(it){
          var x=xOf[it.i];
          if(it._clef&&it._clef!==prevClef){
            s+='<g transform="translate('+(x-24)+','+(top+7.6)+') scale(.62)">'+clefSVG(it._clef,0,0)+'</g>';prevClef=it._clef;
          }
          s+='<g class="n" data-i="'+st.prefix+it.i+'">';
          if(it.rest){s+=restSVG(it.d,x,top)+'</g>';return;}
          var gr=gOf[it.i],ns=it.notes.slice().sort(function(a,c){return a.step-c.step;});
          var open=it.d==="w"||it.d==="h"||it.d==="dh",bot=BOTTOM[it._clef||st.clef];
          var lowY=Y(it,dstep(ns[0],it)),highY=Y(it,dstep(ns[ns.length-1],it));
          var up=gr?gr.up:((lowY+highY)/2>top+20);
          var dx=ns.map(function(){return 0;});
          for(var k=1;k<ns.length;k++)if(dstep(ns[k],it)-dstep(ns[k-1],it)===1&&dx[k-1]===0){if(up)dx[k]=11.5;else dx[k-1]=-11.5;}
          ns.forEach(function(n,k){
            var st2=dstep(n,it),ny=Y(it,st2),l,nx=x+dx[k];
            for(l=bot-2;l>=st2;l-=2)s+='<line class="st" x1="'+(nx-10)+'" x2="'+(nx+10)+'" y1="'+Y(it,l)+'" y2="'+Y(it,l)+'"/>';
            for(l=bot+10;l<=st2;l+=2)s+='<line class="st" x1="'+(nx-10)+'" x2="'+(nx+10)+'" y1="'+Y(it,l)+'" y2="'+Y(it,l)+'"/>';
            s+='<ellipse class="hd'+(open?" open":"")+'" cx="'+nx+'" cy="'+ny+'" rx="6.2" ry="4.4" transform="rotate(-20 '+nx+' '+ny+')"/>';
            var slot=n.letter+n.oct,want=barAcc[slot]!==undefined?barAcc[slot]:(keyAcc[n.letter]||"");
            if(!it.cont&&n.acc!==want)s+='<text class="acc" x="'+(x-17-(dx[k]<0?11:0))+'" y="'+(ny+5)+'">'+(n.acc==="b"?"♭":n.acc==="#"?"♯":"♮")+'</text>';
            barAcc[slot]=n.acc;
            if(DOTTED[it.d])s+='<circle class="hd" cx="'+(x+11+(dx[k]>0?11:0))+'" cy="'+((st2-bot)%2===0?ny-3:ny)+'" r="2"/>';
          });
          var sx=up?x+5.6:x-5.6,ty=up?highY-32:lowY+32;
          if(it.d!=="w"){
            ty=gr&&gOf[it.i]?gr.y:(up?highY-32-((BEAMS[it.d]||1)-1)*5:lowY+32+((BEAMS[it.d]||1)-1)*5);
            s+='<line class="st" x1="'+sx+'" x2="'+sx+'" y1="'+(up?lowY:highY)+'" y2="'+ty+'"/>';
            if(!gOf[it.i]&&BEAMS[it.d]){
              for(var f=0;f<BEAMS[it.d];f++){var off=f*7;
                s+=up?'<path class="hd" d="M'+sx+' '+(ty+off)+' c1 5 10 8 8 17 c0 -6 -4 -9 -8 -11z"/>':'<path class="hd" d="M'+sx+' '+(ty-off)+' c1 -5 10 -8 8 -17 c0 6 -4 9 -8 11z"/>';}
            }
          }
          if(it.orn==="tr")s+='<text class="orn" x="'+(x+2)+'" y="'+(Math.min(up&&it.d!=="w"?ty-4:highY-12,top-8))+'">tr</text>';
          if(st.labels){
            var names=[];ns.slice().reverse().forEach(function(n){if(names.indexOf(n.sol)<0)names.push(n.sol);});
            if(it.cont)s+='<text class="lab" x="'+x+'" y="'+labY+'">~</text>';
            else s+='<text class="lab" x="'+x+'" y="'+labY+'">'+names.map(function(t,k){return '<tspan x="'+x+'" dy="'+(k?13:0)+'">'+t+'</tspan>';}).join("")+'</text>';
          }
          s+='</g>';
        });
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
          var tw={},topY=Math.min.apply(0,gr.ys);
          L.forEach(function(it){var win=it.d==="t"?1:it.d==="ts"?.5:it.d==="tz"?.25:0;if(win){var key=Math.floor(it.pos/win+1e-6);(tw[key]=tw[key]||[]).push(xOf[it.i]);}});
          Object.keys(tw).forEach(function(key){var xs=tw[key],cx=(xs[0]+xs[xs.length-1])/2;
            s+='<text class="tup" x="'+cx+'" y="'+(gr.up?gr.y-6:Math.min(topY-9,top-6))+'">3</text>';});
        });
        var ex=barX[bi-row.b0+1];
        if(bi===nb-1)s+='<line class="staffline" x1="'+(ex-5)+'" x2="'+(ex-5)+'" y1="'+top+'" y2="'+(top+40)+'"/><rect class="ink" x="'+(ex-2)+'" y="'+top+'" width="4" height="40"/>';
        else if(bi===row.b1-1&&row.b1<nb&&(o.bars[row.b1].key!==row.key||o.bars[row.b1].sig!==row.sig))s+='<line class="staffline" x1="'+(ex-4)+'" x2="'+(ex-4)+'" y1="'+top+'" y2="'+(top+40)+'"/><line class="staffline" x1="'+ex+'" x2="'+ex+'" y1="'+top+'" y2="'+(top+40)+'"/>';
        else s+='<line class="staffline" x1="'+ex+'" x2="'+ex+'" y1="'+top+'" y2="'+(top+40)+'"/>';
      }
      st.items.forEach(function(it,k){
        if(!it.tie||it.hidden||it.bar<row.b0||it.bar>=row.b1)return;
        var nx=st.items[k+1];if(!nx)return;
        var n=it.notes[it.notes.length-1],y0=yOfC(it._clef||st.clef,top,dstep(n,it)),above=y0<top+20,x1=xOf[it.i]+7,x2=nx.bar<row.b1&&xOf[nx.i]!=null?xOf[nx.i]-7:W-8;
        s+='<path class="tie" d="M'+x1+' '+(above?y0-6:y0+6)+' Q'+((x1+x2)/2)+' '+(above?y0-14:y0+14)+' '+x2+' '+(above?y0-6:y0+6)+'"/>';
      });
    });
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


/* ---------- 건반: 필요한 음역만 그리기 + 파란 건반이 화면 안에 보이게 스크롤 ---------- */
function drawKb(el,midis,o){
  o=o||{};
  var lo=Math.min.apply(0,midis),hi=Math.max.apply(0,midis);
  lo-=2;hi+=2;
  while(lo%12!==0&&lo%12!==5)lo--;
  while(hi%12!==4&&hi%12!==11)hi++;
  var whites=0;for(var m=lo;m<=hi;m++)if([1,3,6,8,10].indexOf(m%12)<0)whites++;
  var avail=el.clientWidth||600,kw=Math.max(o.minKw||26,Math.min(44,Math.floor(avail/whites)));
  var kb=ME.keyboard(lo,hi,{kw:kw,kh:o.kh||Math.round(kw*4.3)});
  el.innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:0;width:'+kb.w+'px;max-width:none">'+kb.svg+'</svg>';
  el._range=[lo,hi];
  return [lo,hi];
}
function revealKeys(el,midis){
  if(!el||!midis||!midis.length)return;
  var ks=midis.map(function(m){return el.querySelector('[data-m="'+m+'"]');}).filter(Boolean);
  if(!ks.length)return;
  var er=el.getBoundingClientRect(),l=1e9,r=-1e9;
  ks.forEach(function(k){var b=k.getBoundingClientRect();l=Math.min(l,b.left);r=Math.max(r,b.right);});
  if(l<er.left+8||r>er.right-8){el.scrollTo({left:Math.max(0,el.scrollLeft+(l+r)/2-(er.left+er.right)/2),behavior:"smooth"});}
}

/* 악보 그리기가 실패해도 페이지 전체가 멈추지 않게: 그 칸에만 안내를 남겨요 */
function safeRender(el,o){
  try{render(el,o);}
  catch(e){el.innerHTML='<p style="padding:16px;color:#c0392b">악보를 그리지 못했어요. 화면을 새로고침해 주세요. ('+String(e&&e.message||e).replace(/</g,"&lt;")+')</p>';if(window.console)console.error(e);}
}
window.SE={parseBars:parseBars,audioItems:audioItems,render:safeRender,play:play,stopAll:stopAll,barFromClick:barFromClick,KEYS:KEYS,drawKb:drawKb,revealKeys:revealKeys,cur:function(){return P;}};
})();
