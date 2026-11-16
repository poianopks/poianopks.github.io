/* 야마하 C5 그랜드 음색 — Salamander Grand Piano (Alexander Holm, CC BY 3.0)
   샘플: tonejs.github.io/audio/salamander/ (3반음마다 녹음) → 실패하면 media/ydp(YDP, CC BY 3.0) → 그래도 실패하면 ME.piano
   사용: SAL.load(midi배열).then(...)  /  SAL.note(midi, 시각, 길이, 세기) */
(function(){
  "use strict";
  var ME=window.ME,BASE="https://tonejs.github.io/audio/salamander/",NAME={9:"A",0:"C",3:"Ds",6:"Fs"};
  var YDP=[31,34,37,40,43,46,49,52,55,58,61,64,67,70,73,76,79,82,85,88,91,94,97,100];
  var SMP={},ready=false,loading=null,master=null,kind="";
  function ac(){return ME.ac();}
  function dec(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(u);return r.arrayBuffer();}).then(function(b){return new Promise(function(res,rej){ac().decodeAudioData(b,res,rej);});});}
  function salFor(m){return Math.max(21,Math.min(108,Math.round(m/3)*3));}
  function load(used){
    if(loading)return loading;
    var need={};(used||[]).forEach(function(m){need[salFor(m)]=1;});
    loading=Promise.all(Object.keys(need).map(function(s){s=+s;return dec(BASE+NAME[s%12]+(Math.floor(s/12)-1)+".mp3").then(function(b){SMP[s]=b;});}))
      .then(function(){ready=true;kind="salamander";},function(){
        SMP={};return Promise.all(YDP.map(function(n){return dec("media/ydp/n"+n+".mp3").then(function(b){SMP[n]=b;});})).then(function(){ready=true;kind="ydp";},function(){ready=false;kind="basic";});
      }).then(function(){return kind;});
    return loading;
  }
  function note(m,when,dur,vel){
    if(!ready){ME.piano(m,when,dur,vel);return;}
    if(!master){master=ac().createGain();master.gain.value=.85;master.connect(ac().destination);}
    var s=null;for(var k in SMP){k=+k;if(s===null||Math.abs(k-m)<Math.abs(s-m))s=k;}
    var src=ac().createBufferSource(),g=ac().createGain();src.buffer=SMP[s];src.playbackRate.value=Math.pow(2,(m-s)/12);
    g.gain.setValueAtTime(vel,when);g.gain.setTargetAtTime(0,when+dur,.18);src.connect(g);g.connect(master);src.start(when);src.stop(when+dur+1.6);
  }
  window.SAL={load:load,note:note,kind:function(){return kind;}};
})();
