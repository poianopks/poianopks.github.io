/* 한국어·영어 같이 보기 전환 + 영어 듣기 (브라우저 내장 음성, 외부 서비스 없음) */
(function(){
var K='eco-lang',b=document.body,modes={both:'같이 보기 (한+영)',ko:'한국어만',en:'English only'};
function set(m){b.classList.remove('mode-both','mode-ko','mode-en');b.classList.add('mode-'+m);try{localStorage.setItem(K,m)}catch(e){}document.querySelectorAll('.langbar button').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.m===m)});}
var bar=document.createElement('div');bar.className='langbar';bar.setAttribute('role','group');bar.setAttribute('aria-label','언어 보기 선택');
Object.keys(modes).forEach(function(m){var x=document.createElement('button');x.type='button';x.dataset.m=m;x.textContent=modes[m];x.onclick=function(){set(m)};bar.appendChild(x);});
var hd=document.querySelector('header');hd&&hd.after?hd.after(bar):b.insertBefore(bar,b.firstChild);
var m='both';try{m=localStorage.getItem(K)||'both'}catch(e){}set(m);
var can='speechSynthesis' in window;
function speak(t){if(!can)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.9;speechSynthesis.speak(u);}
if(can){document.querySelectorAll('p>.en,li>.en,.vocab .say').forEach(function(e){var t=(e.dataset.say||e.textContent).trim();if(t.length<3)return;var s=document.createElement('button');s.type='button';s.className='spk';s.textContent='🔊';s.title='영어로 듣기';s.setAttribute('aria-label','영어로 듣기');s.onclick=function(ev){ev.preventDefault();speak(t)};e.appendChild(s);});}
})();