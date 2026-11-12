/* 박근성 자작곡 1 (2009 원곡): 움직이는 악보 + 피아노 소리 + 유튜브 */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,F=window.SONG1B,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}
var root=document.documentElement,saved=store("cg-theme");if(saved)root.setAttribute("data-theme",saved);
$("themeBtn").onclick=function(){var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);};
/* 유튜브: section#video 의 data-yt 에 영상 ID를 넣으면 자동으로 나와요 */
var vs=$("video"),yt=(vs.getAttribute("data-yt")||"").trim();
if(yt){$("ytbox").innerHTML='<iframe src="https://www.youtube.com/embed/'+yt+'" title="박근성 자작곡 1 (2009 원곡)" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;border-radius:16px"></iframe>';$("ytlink").innerHTML='<a href="https://youtu.be/'+yt+'">📺 유튜브에서 보기</a>';}
var BARS=F.bars,fs=$("fullScore");
var R=SE.parseBars(F.rh),L=SE.parseBars(F.lh),RE=SE.parseBars(F.rhE),LE=SE.parseBars(F.lhE);
function ver(){return $("ver").value;}
function draw(){var e=ver()==="easy";SE.render(fs,{staves:[{clef:"treble",items:e?RE:R,prefix:"SR",labels:$("lab").checked,autoClef:"row"},{clef:"bass",items:e?LE:L,prefix:"SL",labels:$("lab").checked,autoClef:"item"}],bars:BARS,startBar:1});}
draw();
["ver","lab"].forEach(function(id){$(id).onchange=function(){SE.stopAll();draw();};});
window.addEventListener("resize",debounce(function(){if(!SE.cur())draw();},250));
var kb=ME.keyboard(36,96,{kw:22,kh:110});$("kb").innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:760px">'+kb.svg+'</svg>';
function go(btn,mode,from){
  var e=ver()==="easy",r=e?RE:R,l=e?LE:L,parts=[];
  if(mode!=="L")parts.push({items:SE.audioItems(r),vel:.45},{items:r,prefix:"SR",audio:false,light:true});
  if(mode!=="R")parts.push({items:SE.audioItems(l),vel:mode==="L"?.45:.3},{items:l,prefix:"SL",audio:false,light:true});
  SE.play([{el:fs,bars:BARS,parts:parts,kb:$("kb")}],{btn:btn,mul:+$("speed").value,fromBar:from,metro:$("metro").checked,scrollBox:fs,
    onBar:function(b){$("now").textContent=(b<13?(b+1)+" / 13마디":(b-4)+" / 13마디 (반복)");}});
}
[].forEach.call(document.querySelectorAll("[data-p]"),function(b){b.onclick=function(){var m=b.dataset.p;if(m==="stop"){SE.stopAll();return;}if(SE.cur()&&SE.cur().btn===b){SE.stopAll();return;}go(b,m,null);};});
fs.addEventListener("click",function(e){var b=SE.barFromClick(fs,e);if(b!=null)go($("pBoth"),"B",b);});
})();
