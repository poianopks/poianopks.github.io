/* 박근성 자작곡 1: 움직이는 악보(초안) + 피아노 소리, 4부분 편곡 음원 */
(function(){
"use strict";
var ME=window.ME,SE=window.SE,F=window.SONG1,store=ME.store;
function $(id){return document.getElementById(id);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}
var root=document.documentElement,saved=store("cg-theme");if(saved)root.setAttribute("data-theme",saved);
$("themeBtn").onclick=function(){var dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);var t=dark?"light":"dark";root.setAttribute("data-theme",t);store("cg-theme",t);};
var BARS=F.bars,fs=$("fullScore");
var R=SE.parseBars(F.rh),L=SE.parseBars(F.lh),RE=SE.parseBars(F.rhE),LE=SE.parseBars(F.lhE);
function ver(){return $("ver").value;}
function draw(){var e=ver()==="easy";SE.render(fs,{staves:[{clef:"treble",items:e?RE:R,prefix:"SR",labels:$("lab").checked,autoClef:"row"},{clef:"bass",items:e?LE:L,prefix:"SL",labels:$("lab").checked,autoClef:"item"}],bars:BARS,startBar:1});}
draw();
["ver","lab"].forEach(function(id){$(id).onchange=function(){SE.stopAll();draw();};});
window.addEventListener("resize",debounce(function(){if(!SE.cur())draw();},250));
var kb=ME.keyboard(36,96,{kw:22,kh:110});$("kb").innerHTML='<svg viewBox="0 0 '+kb.w+' '+kb.h+'" style="min-width:760px">'+kb.svg+'</svg>';
function raw(hand){return F.raw.filter(function(r){return !hand||r[3]===hand;}).map(function(r){return {notes:[ME.noteFromMidi(r[2])],gpos:r[0],len:r[1],pos:r[0]%4};});}
function go(btn,mode,from){
  var e=ver()==="easy",parts=[];
  if(mode!=="L")parts.push({items:e?SE.audioItems(RE):raw("R"),vel:.45},{items:e?RE:R,prefix:"SR",audio:false,light:true});
  if(mode!=="R")parts.push({items:e?SE.audioItems(LE):raw("L"),vel:mode==="L"?.45:.32},{items:e?LE:L,prefix:"SL",audio:false,light:true});
  SE.play([{el:fs,bars:BARS,parts:parts,kb:$("kb")}],{btn:btn,mul:+$("speed").value,fromBar:from,metro:$("metro").checked,scrollBox:fs,
    onBar:function(b){$("now").textContent=(b+1)+" / "+BARS.length+"마디";}});
}
[].forEach.call(document.querySelectorAll("[data-p]"),function(b){b.onclick=function(){var m=b.dataset.p;if(m==="stop"){SE.stopAll();return;}if(SE.cur()&&SE.cur().btn===b){SE.stopAll();return;}go(b,m,null);};});
fs.addEventListener("click",function(e){var b=SE.barFromClick(fs,e);if(b!=null)go($("pBoth"),"B",b);});
/* 4부분 편곡 음원: 구간 바로 가기 */
var au=$("arr"),cuts=[0,49.8,85.3,120.9];
[].forEach.call(document.querySelectorAll("[data-cut]"),function(b){b.onclick=function(){SE.stopAll();au.currentTime=cuts[+b.dataset.cut];au.play();};});
au.addEventListener("timeupdate",function(){var t=au.currentTime,i=t<cuts[1]?0:t<cuts[2]?1:t<cuts[3]?2:3;[].forEach.call(document.querySelectorAll("[data-cut]"),function(b){b.classList.toggle("live",+b.dataset.cut===i);});});
})();
