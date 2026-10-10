/* 장르피아노 공통 엔진: 음표 해석, 왼손반주 생성, SVG 오선 악보, 리듬 칸 도표, 건반, Web Audio 소리 */
(function(){
"use strict";
var ME={};
var DUR=ME.DUR={w:4,dh:3,h:2,dq:1.5,q:1,e:0.5};
var LET={C:0,D:1,E:2,F:3,G:4,A:5,B:6};
var SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
var SOL=ME.SOL={C:"도",D:"레",E:"미",F:"파",G:"솔",A:"라",B:"시"};
var FLAT=[["C",""],["D","b"],["D",""],["E","b"],["E",""],["F",""],["G","b"],["G",""],["A","b"],["A",""],["B","b"],["B",""]];

function mk(letter,acc,oct){
  return {letter:letter,acc:acc,oct:oct,
    midi:12*(oct+1)+SEMI[letter]+(acc==="#"?1:acc==="b"?-1:0),
    step:LET[letter]+7*(oct-4),
    sol:SOL[letter]+(acc==="b"?"♭":acc==="#"?"♯":"")};
}
ME.noteFromName=function(n){var m=/^([A-G])(b|#)?(\d)$/.exec(n);return mk(m[1],m[2]||"",+m[3]);};
ME.noteFromMidi=function(m){var f=FLAT[m%12];return mk(f[0],f[1],Math.floor(m/12)-1);};

/* 오른손 멜로디: ["E4:q","r:q",...] 마디 배열 */
ME.parseMelody=function(bars){
  var items=[],gpos=0;
  bars.forEach(function(bar,bi){
    var pos=0;
    bar.forEach(function(tok){
      var a=tok.split(":"),it={d:a[1],len:DUR[a[1]],bar:bi,pos:pos,gpos:gpos,i:items.length};
      if(a[0]==="r"){it.rest=true;it.notes=[];it.kind="rest";}
      else{it.notes=[ME.noteFromName(a[0])];it.kind="note";}
      items.push(it);pos+=it.len;gpos+=it.len;
    });
  });
  return items;
};

/* 화음: C, Am, C7, Eb, Ab ... */
ME.chord=function(name){
  var m=/^([A-G])(b|#)?(m|7)?$/.exec(name);
  var pc=(SEMI[m[1]]+(m[2]==="b"?-1:m[2]==="#"?1:0)+12)%12,q=m[3]||"";
  var third=q==="m"?3:4,root=40+((pc-4+12)%12);       // 근음: E2~Eb3
  var tones=q==="7"?[0,third,10]:[0,third,7];
  var voicing=tones.map(function(t){var p=(pc+t)%12;return 47+((p-11+12)%12);}).sort(function(a,b){return a-b;}); // B2~Bb3 안에 모은 자리바꿈 화음
  var deg={"1":0,"3":third,"5":7,"6":9,"b7":10,"8":12,"5L":root-5<36?7:-5};
  var full=tones.map(function(t){return ME.noteFromMidi(voicing.filter(function(v){return v%12===(pc+t)%12;})[0]).sol;});
  return {name:name,label:name.replace("b","♭"),root:root,q:q,voicing:voicing,deg:deg,tonesSol:full,
    kor:q==="m"?"단화음(슬픈 느낌)":q==="7"?"7화음(블루스·재즈 느낌)":"장화음(밝은 느낌)"};
};

/* 반주 패턴 한 마디 해석: "1:q T:e T:e r:q" */
ME.parseTpl=function(str){
  var pos=0;
  return str.trim().split(/\s+/).map(function(tok,k){
    var a=tok.split(":"),o={deg:a[0],d:a[1],len:DUR[a[1]],pos:pos,tk:k};
    o.kind=o.deg==="r"?"rest":(o.deg==="T"||o.deg.indexOf("+")>=0)?"chord":(o.deg==="1"||o.deg==="5L")?"bass":"note";
    pos+=o.len;return o;
  });
};
ME.tplLen=function(str){return ME.parseTpl(str).reduce(function(a,t){return a+t.len;},0);};

/* 왼손반주 아이템: prog=["C","F",..] (마디마다 화음), pats=["패턴",...] (마디마다 번갈아) */
ME.buildLH=function(prog,pats,sig){
  var items=[],gpos=0;
  prog.forEach(function(cn,bi){
    var ch=ME.chord(cn),ti=bi%pats.length;
    ME.parseTpl(pats[ti]).forEach(function(t){
      var it={d:t.d,len:t.len,bar:bi,pos:t.pos,gpos:gpos+t.pos,i:items.length,kind:t.kind,deg:t.deg,tpl:ti,tk:t.tk,chord:ch};
      if(t.kind==="rest"){it.rest=true;it.notes=[];}
      else{
        var ms=t.deg==="T"?ch.voicing.slice():t.deg.split("+").map(function(d){return ch.root+ch.deg[d];});
        it.notes=ms.map(ME.noteFromMidi);
      }
      items.push(it);
    });
    gpos+=sig;
  });
  return items;
};

/* ---------------- SVG 악보 ---------------- */
var BOTTOM={treble:2,bass:-10};
function clefSVG(type,x,top){
  if(type==="treble")return '<g transform="translate('+x+','+(top-6)+')" class="ink" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M15 60 C11 62 8 58 11 55 C14 52 18 55 16 59 C14 64 21 64 21 58 L17 2 C16 -6 27 -4 25 7 C23 17 6 24 6 37 C6 47 19 49 23 43 C27 37 21 29 15 33 C11 36 13 41 17 41"/></g>';
  return '<g transform="translate('+(x+2)+','+top+')" class="ink"><circle cx="7" cy="10" r="3.8" stroke="none"/><path d="M4 10 C4 0 24 -2 25 11 C26 23 15 32 3 38" fill="none" stroke-width="2.6" stroke-linecap="round"/><circle cx="30" cy="5" r="2.1" stroke="none"/><circle cx="30" cy="15" r="2.1" stroke="none"/></g>';
}
function ext(it){var a=it.notes.map(function(n){return n.step;});return (Math.min.apply(0,a)+Math.max.apply(0,a))/2;}
function drawItem(it,x,top,bot,pair,prefix,label,labY,X){
  var s='<g class="n" data-i="'+prefix+it.i+'">',yOf=function(st){return top+40-(st-bot)*5;};
  if(it.rest){
    var m=top+20;
    if(it.d==="q")s+='<path class="st" fill="none" stroke-width="2.6" d="M'+(x-2)+' '+(m-14)+' L'+(x+4)+' '+(m-6)+' L'+(x-2)+' '+m+' L'+(x+4)+' '+(m+7)+' Q'+(x-5)+' '+(m+3)+' '+x+' '+(m+12)+'"/>';
    else if(it.d==="e")s+='<circle class="hd" cx="'+(x-2)+'" cy="'+(m-5)+'" r="2.8"/><path class="st" d="M'+(x-2)+' '+(m-3)+' Q'+(x+2)+' '+(m-3)+' '+(x+4)+' '+(m-7)+' L'+(x-1)+' '+(m+9)+'" fill="none" stroke-width="1.6"/>';
    else if(it.d==="w")s+='<rect class="hd" x="'+(x-7)+'" y="'+(m-10)+'" width="14" height="5"/>';
    else s+='<rect class="hd" x="'+(x-7)+'" y="'+(m-5)+'" width="14" height="5"/>';
    if(label!=null)s+='<text class="lab" x="'+x+'" y="'+labY+'">쉼</text>';
    return s+'</g>';
  }
  var ns=it.notes.slice().sort(function(a,b){return a.step-b.step;});
  var open=it.d==="w"||it.d==="h"||it.d==="dh",mid=bot+4;
  var up=pair?((ext(pair[0])+ext(pair[1]))/2<mid):ext(it)<mid;
  var dx=ns.map(function(){return 0;});
  for(var k=1;k<ns.length;k++)if(ns[k].step-ns[k-1].step===1&&dx[k-1]===0){if(up)dx[k]=11.5;else dx[k-1]=-11.5;}
  var accN=0;
  ns.forEach(function(n,k){
    var nx=x+dx[k],y=yOf(n.step),l;
    for(l=bot-2;l>=n.step;l-=2)s+='<line class="st" x1="'+(nx-10)+'" x2="'+(nx+10)+'" y1="'+yOf(l)+'" y2="'+yOf(l)+'"/>';
    for(l=bot+10;l<=n.step;l+=2)s+='<line class="st" x1="'+(nx-10)+'" x2="'+(nx+10)+'" y1="'+yOf(l)+'" y2="'+yOf(l)+'"/>';
    s+='<ellipse class="hd'+(open?" open":"")+'" cx="'+nx+'" cy="'+y+'" rx="6.2" ry="4.4" transform="rotate(-20 '+nx+' '+y+')"/>';
    if(n.acc){s+='<text class="acc" x="'+(x-15-accN*9+(dx[k]<0?dx[k]:0))+'" y="'+(y+5)+'">'+(n.acc==="b"?"♭":"♯")+'</text>';accN++;}
    if(it.d==="dq"||it.d==="dh")s+='<circle class="hd" cx="'+(x+11+(dx[k]>0?dx[k]:0))+'" cy="'+((n.step-bot)%2===0?y-3:y)+'" r="2"/>';
  });
  if(it.d!=="w"){
    var lowY=yOf(ns[0].step),highY=yOf(ns[ns.length-1].step),sx=up?x+5.6:x-5.6,ty;
    if(pair){
      var ys=[];pair.forEach(function(p){p.notes.forEach(function(n){ys.push(yOf(n.step));});});
      ty=up?Math.min.apply(0,ys)-32:Math.max.apply(0,ys)+32;
    }else ty=up?highY-33:lowY+33;
    s+='<line class="st" x1="'+sx+'" x2="'+sx+'" y1="'+(up?lowY:highY)+'" y2="'+ty+'"/>';
    if(pair&&pair[0]===it){
      var x2=X(pair[1])+(up?5.6:-5.6);
      s+='<rect class="hd" x="'+sx+'" y="'+(up?ty:ty-5)+'" width="'+(x2-sx)+'" height="5"/>';
    }else if(!pair&&it.d==="e"){
      s+=up?'<path class="hd" d="M'+sx+' '+ty+' q2 9 9 13 q-3 -5 -9 -7z"/>':'<path class="hd" d="M'+sx+' '+ty+' q2 -9 9 -13 q-3 5 -9 7z"/>';
    }
  }
  if(label!=null)s+='<text class="lab" x="'+x+'" y="'+labY+'">'+label+'</text>';
  return s+'</g>';
}
/* o={sig,swing,nbars,per,title,staves:[{clef,items,prefix,label:fn,chords:bool}]} */
ME.renderScore=function(el,o){
  var per=o.per||(el.clientWidth<560?1:2),nb=o.nbars,html="";
  for(var r0=0;r0<nb;r0+=per){
    var r1=Math.min(r0+per,nb),first=r0===0;
    var W=o.width||(per===1?360:660),left=(first&&!o.noTime)?74:44,barW=(W-left-8)/per,inner=barW-34;
    var y=(o.swing&&first)?40:30,blocks=[];
    o.staves.forEach(function(st){if(st.chords)y+=24;blocks.push({st:st,top:y});y+=st.label?82:66;});
    var cntY=y+8,H=o.noCounts?y-4:y+18;
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="악보 '+(r0+1)+'~'+r1+'마디">';
    if(o.swing&&first)s+='<text x="'+left+'" y="16" class="lab" style="text-anchor:start">스윙 ♪♪ = 따-안 따</text>';
    if(blocks.length>1)s+='<line class="staffline" x1="4" x2="4" y1="'+blocks[0].top+'" y2="'+(blocks[blocks.length-1].top+40)+'" style="stroke-width:2.4"/>';
    var cntPos={};
    blocks.forEach(function(bk,bix){
      var top=bk.top,st=bk.st,bot=BOTTOM[st.clef];
      for(var l=0;l<5;l++)s+='<line class="staffline" x1="4" x2="'+(W-4)+'" y1="'+(top+l*10)+'" y2="'+(top+l*10)+'"/>';
      s+='<line class="staffline" x1="4" x2="4" y1="'+top+'" y2="'+(top+40)+'"/>';
      s+=clefSVG(st.clef,8,top);
      if(first&&!o.noTime)s+='<g class="ink" stroke="none" font-family="Georgia,serif" font-weight="900" font-size="22" text-anchor="middle"><text x="56" y="'+(top+18)+'">'+o.sig+'</text><text x="56" y="'+(top+39)+'">4</text></g>';
      for(var bi=r0;bi<r1;bi++){
        var bx=left+(bi-r0)*barW;
        var X=(function(bx){return function(it){return bx+16+it.pos/o.sig*inner;};})(bx);
        var its=st.items.filter(function(x){return x.bar===bi;});
        if(bix===0&&!o.noCounts)s+='<text x="'+(bx+4)+'" y="'+(top-8-(st.chords?24:0))+'" class="cnt" style="text-anchor:start">'+(bi+1)+'</text>';
        if(st.chords&&its[0]&&its[0].chord)s+='<text class="chn" x="'+(bx+10)+'" y="'+(top-10)+'">'+its[0].chord.label+'</text>';
        var beam={};
        its.forEach(function(it,k){
          var nx=its[k+1];
          if(!beam[it.i]&&!it.rest&&it.d==="e"&&Math.abs(it.pos%1)<1e-6&&nx&&!nx.rest&&nx.d==="e")beam[it.i]=beam[nx.i]=[it,nx];
          cntPos[bi+"_"+it.pos]={x:X(it),t:Math.abs(it.pos%1)<1e-6?String(Math.round(it.pos)+1):"&"};
        });
        its.forEach(function(it){
          s+=drawItem(it,X(it),top,bot,beam[it.i],st.prefix||"",st.label?st.label(it):null,top+72,X);
        });
        var ex=bx+barW;
        if(bi===nb-1)s+='<line class="staffline" x1="'+(ex-5)+'" x2="'+(ex-5)+'" y1="'+top+'" y2="'+(top+40)+'"/><rect class="ink" x="'+(ex-2)+'" y="'+top+'" width="4" height="40"/>';
        else s+='<line class="staffline" x1="'+ex+'" x2="'+ex+'" y1="'+top+'" y2="'+(top+40)+'"/>';
      }
      if(st.label)s+='<text x="6" y="'+(top+72)+'" class="cnt" style="text-anchor:start">'+(st.labelName||"계이름")+'</text>';
    });
    if(!o.noCounts){Object.keys(cntPos).forEach(function(k){s+='<text class="cnt" x="'+cntPos[k].x+'" y="'+cntY+'">'+cntPos[k].t+'</text>';});
    s+='<text x="6" y="'+cntY+'" class="cnt" style="text-anchor:start">박자</text>';}
    s+='</svg>';
    html+=s;
  }
  el.innerHTML=html;
};

/* ---------------- 리듬 칸 도표 ---------------- */
ME.KIND={bass:{t:"쿵",c:"#6a4bc4"},chord:{t:"짝",c:"#ff6b4a"},note:{t:"띵",c:"#3d7cf0"},rest:{t:"쉼",c:"none"}};
ME.degWord=function(d){return {"1":"근음","3":"3음","5":"5음","6":"6음","b7":"♭7음","8":"옥타브","5L":"아래5음","T":"화음"}[d]||d;};
ME.rhythmGrid=function(pats,sig,opts){
  opts=opts||{};
  var cells=sig*2,cw=opts.cw||44,lw=opts.lw||0,rh=40,W=lw+cells*cw+2,H=22+pats.length*(rh+8);
  var s='<svg class="rg" style="max-width:'+Math.round(W*1.25)+'px" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="왼손 반주 리듬 칸 도표">';
  for(var c=0;c<cells;c++){
    s+='<text class="rgc" x="'+(lw+c*cw+cw/2)+'" y="14">'+(c%2?"&":(c/2+1))+'</text>';
  }
  pats.forEach(function(p,ri){
    var y=22+ri*(rh+8);
    for(var c=0;c<cells;c++)s+='<rect class="rgcell" x="'+(lw+c*cw+1)+'" y="'+y+'" width="'+(cw-2)+'" height="'+rh+'" rx="6"/>';
    if(lw)s+='<text class="rgc" x="'+(lw-6)+'" y="'+(y+25)+'" style="text-anchor:end">'+(ri===0?"홀수 마디":"짝수 마디")+'</text>';
    ME.parseTpl(p).forEach(function(t){
      var k=ME.KIND[t.kind],x=lw+t.pos*2*cw+2,w=t.len*2*cw-4;
      var lab=t.kind==="note"?ME.degWord(t.deg).replace("음",""):t.kind==="chord"&&t.deg!=="T"?t.deg.replace(/\+/g,"·"):k.t;
      s+='<g class="rgb" data-g="'+ri+'-'+t.tk+'">';
      if(t.kind==="rest")s+='<rect x="'+x+'" y="'+(y+3)+'" width="'+w+'" height="'+(rh-6)+'" rx="8" fill="none" stroke="currentColor" stroke-dasharray="4 3" opacity=".5"/>';
      else s+='<rect x="'+x+'" y="'+(y+3)+'" width="'+w+'" height="'+(rh-6)+'" rx="8" fill="'+k.c+'"/>';
      s+='<text x="'+(x+Math.min(w/2,22))+'" y="'+(y+26)+'" class="rgt'+(t.kind==="rest"?" rest":"")+'"'+(w>44?' style="text-anchor:middle"':'')+'>'+lab+'</text></g>';
    });
  });
  return s+'</svg>';
};

/* ---------------- 건반 ---------------- */
ME.keyboard=function(from,to,o){
  o=o||{};var kw=o.kw||40,kh=o.kh||150,whites=[],blacks=[],x=0;
  for(var m=from;m<=to;m++){
    if([1,3,6,8,10].indexOf(m%12)<0){whites.push({m:m,x:x});x+=kw;}else blacks.push({m:m,x:x-kw*.3});
  }
  var s='';
  whites.forEach(function(w){
    var name="도레미파솔라시".charAt([0,2,4,5,7,9,11].indexOf(w.m%12));
    s+='<rect class="w" data-m="'+w.m+'" x="'+w.x+'" y="0" width="'+kw+'" height="'+kh+'" rx="4"/>';
    if(o.labels!==false)s+='<text x="'+(w.x+kw/2)+'" y="'+(kh-10)+'"'+(w.m%12===0?' class="c"':'')+'>'+name+'</text>';
    if(w.m===60&&o.labels!==false)s+='<text x="'+(w.x+kw/2)+'" y="'+(kh-28)+'" class="mc">가온</text>';
  });
  blacks.forEach(function(b){s+='<rect class="b" data-m="'+b.m+'" x="'+b.x+'" y="0" width="'+(kw*.6)+'" height="'+(kh*.62)+'" rx="3"/>';});
  return {svg:s,w:x,h:kh};
};

/* ---------------- 소리 ---------------- */
var ctx=null,master=null,noiseBuf=null,live=[],timers=[];
ME.ac=function(){
  if(!ctx){
    var AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();
    master=ctx.createGain();master.gain.value=.8;
    var comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*.3,ctx.sampleRate);
    var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }
  if(ctx.state==="suspended")ctx.resume();
  return ctx;
};
ME.now=function(){return ME.ac().currentTime;};
function track(n){live.push(n);n.onended=function(){var i=live.indexOf(n);if(i>=0)live.splice(i,1);};}
ME.piano=function(midi,t,dur,vel){
  ME.ac();vel=vel||.5;
  var f=440*Math.pow(2,(midi-69)/12),g=ctx.createGain(),lp=ctx.createBiquadFilter(),len=Math.max(.25,dur);
  lp.type="lowpass";lp.frequency.setValueAtTime(Math.min(8000,f*6),t);lp.frequency.exponentialRampToValueAtTime(Math.max(300,f*1.5),t+len+.3);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.008);
  g.gain.exponentialRampToValueAtTime(vel*.45,t+.25);
  g.gain.exponentialRampToValueAtTime(0.0001,t+len+.35);
  lp.connect(g);g.connect(master);
  var low=midi<52;
  [["triangle",1,1],["sine",2,low?.5:.35],["sine",3,low?.2:.12]].forEach(function(o){
    var osc=ctx.createOscillator(),og=ctx.createGain();osc.type=o[0];osc.frequency.value=f*o[1];og.gain.value=o[2];
    osc.connect(og);og.connect(lp);osc.start(t);osc.stop(t+len+.4);track(osc);
  });
};
ME.click=function(t,acc){
  ME.ac();var o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=acc?1600:1000;
  g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.05);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+.06);track(o);
};
ME.tick=function(t){
  ME.ac();var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=noiseBuf;f.type="highpass";f.frequency.value=5000;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.06);
  s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.08);track(s);
};
ME.later=function(fn,t){var ms=Math.max(0,(t-ctx.currentTime)*1000);timers.push(setTimeout(fn,ms));};
ME.stop=function(){
  timers.forEach(clearTimeout);timers=[];
  live.slice().forEach(function(n){try{n.stop();}catch(e){}});live=[];
  document.querySelectorAll("[data-i].on,[data-m].on,[data-g].on").forEach(function(e){e.classList.remove("on");});
};
ME.sw=function(swing,b){if(!swing)return b;var f=Math.floor(b),r=b-f;return f+(Math.abs(r-.5)<1e-6?2/3:r);};
function light(c,p,it,on){
  (c.scoreRoot||document).querySelectorAll('[data-i="'+(p.prefix||"")+it.i+'"]').forEach(function(e){e.classList.toggle("on",on);});
  if(!it.rest&&c.kbRoot!==null)it.notes.forEach(function(n){(c.kbRoot||document).querySelectorAll('[data-m="'+n.midi+'"]').forEach(function(e){e.classList.toggle("on",on);});});
  if(c.onItem)c.onItem(p,it,on);
}
/* c={sig,swing,bpm,mul,nbars,parts:[{items,prefix,vel,mute,light}],metro,countIn,onBeat(b,count),onEnd(end),scoreRoot,kbRoot,onItem} */
ME.schedule=function(c,t0){
  var spb=60/(c.bpm*(c.mul||1)),start=t0,sig=c.sig;
  if(c.countIn){
    for(var k=0;k<sig;k++)(function(k){var tt=t0+k*spb;ME.click(tt,k===0);ME.later(function(){if(c.onBeat)c.onBeat(k,true);},tt);})(k);
    start=t0+sig*spb;
  }
  (c.parts||[]).forEach(function(p){
    p.items.forEach(function(it){
      var a=start+ME.sw(c.swing,it.gpos)*spb,b=start+ME.sw(c.swing,it.gpos+it.len)*spb;
      if(!it.rest&&!p.mute){
        var many=it.notes.length>1;
        it.notes.forEach(function(n){ME.piano(n.midi,a,(b-a)*.92,(p.vel||.45)*(it.pos===0?1.1:1)*(many?.7:1));});
      }
      if(p.light!==false){ME.later(function(){light(c,p,it,true);},a);ME.later(function(){light(c,p,it,false);},b-.012);}
    });
  });
  var total=c.nbars*sig;
  for(var b=0;b<total;b++)(function(b){var tt=start+b*spb;if(c.metro)ME.click(tt,b%sig===0);ME.later(function(){if(c.onBeat)c.onBeat(b%sig,false);},tt);})(b);
  var end=start+total*spb;
  ME.later(function(){if(c.onBeat)c.onBeat(-1);if(c.onEnd)c.onEnd(end);},end);
  return {start:start,spb:spb,end:end};
};

/* 따라치기 도우미: steps=[{midis:[..], it, prefix}] */
ME.Follow=function(steps,hooks){this.steps=steps;this.i=0;this.left=null;this.h=hooks;this.show();};
ME.Follow.prototype.cur=function(){return this.steps[this.i];};
ME.Follow.prototype.show=function(){
  document.querySelectorAll(".hint,[data-i].next").forEach(function(e){e.classList.remove("hint");e.classList.remove("next");});
  var st=this.cur();if(!st)return;
  this.left=st.midis.slice();
  var r=this.h.kbRoot||document;
  st.midis.forEach(function(m){r.querySelectorAll('[data-m="'+m+'"]').forEach(function(k){k.classList.add("hint");});});
  document.querySelectorAll('[data-i="'+st.prefix+st.it.i+'"]').forEach(function(e){e.classList.add("next");});
  if(this.h.onShow)this.h.onShow(st,this.i,this.steps.length);
};
ME.Follow.prototype.press=function(m){
  var st=this.cur();if(!st)return false;
  var ix=this.left.indexOf(m),r=this.h.kbRoot||document;
  if(ix<0){if(this.h.onWrong)this.h.onWrong(st,m);return false;}
  this.left.splice(ix,1);
  r.querySelectorAll('[data-m="'+m+'"]').forEach(function(k){k.classList.remove("hint");});
  if(this.left.length===0){
    document.querySelectorAll('[data-i="'+st.prefix+st.it.i+'"]').forEach(function(e){e.classList.remove("next");e.classList.add("done");});
    this.i++;
    if(this.i>=this.steps.length){this.end();if(this.h.onDone)this.h.onDone();}else this.show();
  }else if(this.h.onPartial)this.h.onPartial(st,this.left);
  return true;
};
ME.Follow.prototype.end=function(clearDone){
  document.querySelectorAll(".hint,[data-i].next").forEach(function(e){e.classList.remove("hint");e.classList.remove("next");});
  if(clearDone)document.querySelectorAll("[data-i].done").forEach(function(e){e.classList.remove("done");});
};
ME.followSteps=function(items,prefix){
  return items.filter(function(it){return !it.rest;}).map(function(it){return {it:it,prefix:prefix,midis:it.notes.map(function(n){return n.midi;})};});
};

/* 탭 리듬 채점 */
ME.scoreTaps=function(expected,taps,tol){
  var used={},hit=0;
  expected.forEach(function(et){
    var best=-1,bd=1e9;
    taps.forEach(function(tt,i){var d=Math.abs(tt-et);if(!used[i]&&d<bd){bd=d;best=i;}});
    if(best>=0&&bd<=tol){used[best]=1;hit++;}
  });
  var extra=taps.length-hit;
  return {hit:hit,extra:extra,total:expected.length,score:Math.max(0,Math.round((hit-extra*.5)/expected.length*100))};
};
ME.stars=function(score){return score>=85?"★★★":score>=60?"★★☆":score>=30?"★☆☆":"☆☆☆";};

ME.store=function(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}};
ME.confetti=function(){
  for(var i=0;i<18;i++){var d=document.createElement("div");d.className="confetti";d.textContent=["🎵","🎶","⭐","🎹","✨"][i%5];
    d.style.left=(Math.random()*100)+"vw";d.style.top=(10+Math.random()*20)+"vh";d.style.animationDelay=(Math.random()*.4)+"s";
    document.body.appendChild(d);setTimeout(function(x){return function(){x.remove();};}(d),2000);}
};
ME.KEYMAP={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72,o:73,l:74,p:75,";":76};
ME.KEYMAP_LH={z:48,s:49,x:50,d:51,c:52,v:53,g:54,b:55,h:56,n:57,j:58,m:59,",":60};

window.ME=ME;
})();
