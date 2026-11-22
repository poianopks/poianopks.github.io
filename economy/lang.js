/* 한국어·영어 같이 보기 + 영어 듣기(발음 안내·한글 발음·속도) + 경제 영어 맛보기 단어 카드
   브라우저 내장 음성(speechSynthesis)만 사용. 외부 서비스·외부 스크립트 없음. */
(function(){
var b=document.body,LS={get:function(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---------- 스타일 ---------- */
var css='.say-guide{max-width:820px;margin:8px auto 0;padding:10px 14px;background:#f2f7ff;border:1px solid #c9dcf5;border-radius:12px;font-size:.92rem;line-height:1.6}'+
'.say-guide .gen{display:block;color:#3b5b8a;font-size:.85rem}.say-guide .ctl{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}'+
'.say-guide button{border:1px solid #9bb8de;background:#fff;border-radius:16px;padding:3px 10px;font-size:.85rem;cursor:pointer}.say-guide button[aria-pressed=true]{background:#2f5d9a;color:#fff}'+
'.speaking{background:#fff3b0!important;transition:background .2s}.spk.on{background:#ffd54f;border-radius:50%}'+
'.kpr{display:block;margin:4px 0 8px;padding:5px 10px;background:#fffbe6;border-left:4px solid #e0a800;border-radius:6px;font-weight:700;font-size:1.1em;color:#1f2d3d;line-height:1.65;word-break:keep-all}'+
'.kpr .lb{font-size:.75em;color:#8a6d00;margin-right:6px;font-weight:700}'+
'@media(max-width:600px){.kpr{font-size:16px}}'+
'button.term{all:unset;cursor:pointer;border-bottom:2px dotted #2f7a4f}button.term:hover,button.term:focus{background:#e6f5ea;outline:2px solid #9fd1ae;border-radius:3px}'+
'.tpop{position:absolute;z-index:50;max-width:320px;background:#fff;border:1px solid #bcd9c5;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:12px 14px;font-size:.92rem;line-height:1.55;color:#2b2118}'+
'.tpop .w{font-size:1.15rem;font-weight:700;color:#1d5e38}.tpop .pos{color:#777;font-size:.8rem;margin-left:6px}.tpop .pr{color:#1f2d3d;font-weight:800;font-size:1.12em}'+
'.tpop .ex{margin-top:6px;padding:6px 8px;background:#f6faf7;border-radius:8px;font-size:.86rem}.tpop .tip2{margin-top:6px;font-size:.84rem;color:#6b5d50}'+
'.tpop .bt{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}.tpop .bt button{border:1px solid #9fd1ae;background:#fff;border-radius:14px;padding:3px 10px;cursor:pointer}'+
'@media(max-width:600px){.tpop{position:fixed;left:0!important;right:0;bottom:0;top:auto!important;max-width:none;border-radius:16px 16px 0 0;padding:16px 18px 22px}}'+
'.wordbook{margin:24px 0;padding:14px 18px;background:#fff;border:1px solid #e8dccb;border-radius:14px}.wordbook li{margin:4px 0}.wordbook .pr{font-weight:700;color:#1f2d3d}.wordbook button{border:1px solid #ccc;background:#fff;border-radius:12px;padding:1px 8px;margin-left:6px;cursor:pointer;font-size:.82rem}'+
'.vocab .say{cursor:pointer;border-bottom:1px dotted #2f5d9a}.vocab td:nth-child(2){font-weight:700;font-size:1.08em;color:#1f2d3d}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- 같이 보기 전환 ---------- */
var K='eco-lang',modes={both:'같이 보기 (한+영)',ko:'한국어만',en:'English only'};
function set(m){b.classList.remove('mode-both','mode-ko','mode-en');b.classList.add('mode-'+m);LS.set(K,m);document.querySelectorAll('.langbar button').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.m===m)});}
var bar=document.createElement('div');bar.className='langbar';bar.setAttribute('role','group');bar.setAttribute('aria-label','언어 보기 선택');
Object.keys(modes).forEach(function(m){var x=document.createElement('button');x.type='button';x.dataset.m=m;x.textContent=modes[m];x.onclick=function(){set(m)};bar.appendChild(x);});
var hd=document.querySelector('header');if(hd&&hd.after)hd.after(bar);else b.insertBefore(bar,b.firstChild);
set(LS.get(K,'both'));

/* ---------- 듣기 ---------- */
var can='speechSynthesis' in window,rate=parseFloat(LS.get('eco-rate','1'))||1,voice=null,cur=null,last=null;
function pickVoice(){if(!can)return;var v=speechSynthesis.getVoices()||[];voice=v.filter(function(x){return x.lang==='en-US'})[0]||v.filter(function(x){return /^en/i.test(x.lang)})[0]||null;}
if(can){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}
function stop(){if(can){try{speechSynthesis.cancel()}catch(e){}}if(cur){if(cur.el)cur.el.classList.remove('speaking');if(cur.btn)cur.btn.classList.remove('on');cur=null;}}
function speak(t,el,btn){
 if(!can){alert('이 브라우저는 영어 읽어 주기를 지원하지 않아요. 크롬이나 삼성 인터넷에서 열어 보세요.');return;}
 if(cur&&btn&&cur.btn===btn){stop();return;}
 stop();var u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=rate;if(voice)u.voice=voice;
 cur={el:el,btn:btn};if(el)el.classList.add('speaking');if(btn)btn.classList.add('on');
 u.onend=u.onerror=function(){if(cur&&cur.btn===btn)stop();};
 try{speechSynthesis.speak(u)}catch(e){stop();}}

/* 발음 안내 상자 */
var g=document.createElement('div');g.className='say-guide';g.setAttribute('role','note');
g.innerHTML='<b>🔊 영어 발음 듣기 안내</b> · 파란 영어 문장 끝의 <b>🔊</b>를 누르면 <b>소리와 함께 굵은 한글 발음</b>이 나와요. 한 번 더 누르면 멈추고 발음 줄이 닫혀요. 점선 밑줄 단어를 누르면 <b>뜻·발음 카드</b>가 열려요. 휴대폰은 <b>소리(무음 해제)</b>를 켜 주세요. 안 들리면 크롬이나 삼성 인터넷에서 열어 보세요. <small>(한글 발음은 미국식 발음을 우리 글자로 비슷하게 적은 참고용이에요.)</small>'+
'<span class="gen" lang="en">Tap 🔊 at the end of an English sentence to hear it and see the Korean-letter pronunciation. Tap again to stop. Tap a dotted word for its meaning.</span>'+
'<div class="ctl"><button type="button" data-r="1">🐇 보통 속도</button><button type="button" data-r="0.7">🐢 천천히</button><button type="button" data-again="1">🔁 다시 듣기</button></div>';
if(bar.after)bar.after(g);else b.insertBefore(g,bar.nextSibling);
function markRate(){g.querySelectorAll('[data-r]').forEach(function(x){x.setAttribute('aria-pressed',parseFloat(x.dataset.r)===rate)})}markRate();
g.addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;if(x.dataset.r){rate=parseFloat(x.dataset.r);LS.set('eco-rate',String(rate));markRate();}if(x.dataset.again){if(last)speak(last.t,last.el,null);else alert('먼저 🔊 버튼을 눌러 문장을 들어 보세요.');}});

/* ---------- 경제 영어 단어장: [품사, 한글 발음, 쉬운 뜻, 예문(영), 예문(한), 어원·꿀팁] ---------- */
var G={
"margin of safety":["명사","마전 오브 세이프티","안전마진(원래 값보다 싸게 사서 생기는 여유)","Buy with a margin of safety.","안전마진을 두고 사세요.","벤저민 그레이엄이 널리 알린 말이에요."],
"book value":["명사","북 밸류","장부 가치(회사가 가진 순재산)","The price is below book value.","주가가 장부 가치보다 낮아요."],
"PBR":["명사","피비알","주가순자산비율(재산에 비해 주가가 몇 배)","A PBR below 1 looks cheap.","PBR이 1보다 낮으면 싸 보여요."],
"Buffett indicator":["명사","버핏 인디케이터","버핏지수(경제 크기에 비해 주식 시장이 얼마나 큰가)","The Buffett indicator compares market value with GDP.","버핏지수는 시가총액을 GDP와 비교해요."],
"moving average":["명사","무빙 애버리지","이동평균선(일정 기간 평균값을 이은 선)","The price is above its moving average.","가격이 이동평균선 위에 있어요."],
"drawdown":["명사","드로다운","고점에서 떨어진 폭","The drawdown was almost fifty percent.","고점에서 거의 50% 떨어졌어요."],
"intrinsic value":["명사","인트린직 밸류","내재 가치(원래 값)","Investors try to find intrinsic value.","투자자들은 원래 값을 찾으려 해요."],
"bargain":["명사","바건","싸게 사는 물건, 바겐세일","This is a real bargain.","이건 진짜 세일이에요."],
"fear index":["명사","피어 인덱스","공포지수(시장이 얼마나 겁먹었나)","The fear index jumped this week.","이번 주 공포지수가 뛰었어요."],
"bottom":["명사","바텀","바닥(가장 낮은 곳)","Nobody knows where the bottom is.","바닥이 어디인지는 아무도 몰라요."],
"interest rate":["명사","인터레스트 레이트","금리(돈을 빌린 값, 이자율)","The central bank raised the interest rate.","중앙은행이 금리를 올렸어요.","interest는 '관심'이라는 뜻도 있어요. 돈 이야기에서는 '이자'예요."],
"interest":["명사","인터레스트","이자; 관심","Banks pay interest on deposits.","은행은 예금에 이자를 줘요."],
"policy rate":["명사","폴리시 레이트","기준금리","The policy rate is set by the central bank.","기준금리는 중앙은행이 정해요."],
"inflation":["명사","인플레이션","물가가 계속 오르는 것","Inflation makes bread more expensive.","인플레이션이 생기면 빵값이 비싸져요.","라틴어 inflare(바람을 불어넣다)에서 왔어요. 풍선처럼 부풀어요!"],
"deflation":["명사","디플레이션","물가가 계속 내리는 것","Deflation can slow the economy.","디플레이션은 경제를 느리게 할 수 있어요."],
"stagflation":["명사","스태그플레이션","경기는 나쁜데 물가는 오르는 것","The 1970s saw stagflation.","1970년대에 스태그플레이션이 있었어요.","stagnation(정체)+inflation(물가 상승)을 합친 말이에요."],
"bond":["명사","본드 (미국식 '반드')","채권(나라·회사가 돈을 빌리며 써 주는 증서)","The government sold bonds to raise money.","정부는 돈을 모으려고 채권을 팔았어요.","bind(묶다)와 뿌리가 같아요. 약속으로 묶인 증서!"],
"stock":["명사","스톡 (미국식 '스탁')","주식","She bought a stock of a car company.","그녀는 자동차 회사 주식을 샀어요."],
"share":["명사","셰어","주식 한 주; 몫","He owns 10 shares.","그는 주식 10주를 가지고 있어요.","share는 '나누다'라는 뜻도 있어요. 회사를 잘게 나눈 한 조각!"],
"shareholder":["명사","셰어홀더","주주","Shareholders own the company.","주주는 회사의 주인이에요."],
"stock market":["명사","스톡 마킷","주식 시장","The stock market fell today.","오늘 주식 시장이 내렸어요."],
"stock exchange":["명사","스톡 익스체인지","증권거래소","Amsterdam had an early stock exchange.","암스테르담에 초기 증권거래소가 있었어요."],
"dividend":["명사","디비덴드","배당금(회사 이익을 주주에게 나눠 주는 돈)","The company paid a dividend.","회사가 배당금을 줬어요.","라틴어 dividere(나누다)에서 왔어요. divide와 같은 뿌리!"],
"company":["명사","컴퍼니","회사","The company makes pianos.","그 회사는 피아노를 만들어요.","com(함께)+panis(빵): '빵을 함께 먹는 사람들'에서 왔어요."],
"corporation":["명사","코퍼레이션","주식회사, 법인","A corporation can sell shares.","주식회사는 주식을 팔 수 있어요."],
"currency":["명사","커런시","통화, 화폐","The won is Korea's currency.","원은 한국의 화폐예요.","라틴어 currere(달리다, 흐르다)에서 왔어요. 돈은 흘러 다니니까요!"],
"reserve currency":["명사","리저브 커런시","기축통화(세계가 같이 쓰는 기준 돈)","The dollar is the main reserve currency.","달러는 대표적인 기축통화예요."],
"money":["명사","머니","돈","Money is a tool for trade.","돈은 거래를 위한 도구예요.","로마의 유노 모네타(Juno Moneta) 신전 옆에서 동전을 만든 데서 왔다고 해요."],
"cash":["명사","캐시","현금","I paid in cash.","현금으로 냈어요."],
"coin":["명사","코인","동전","Lydia made early coins.","리디아가 초기 동전을 만들었어요."],
"banknote":["명사","뱅크노트","지폐","China made early banknotes.","중국이 초기 지폐를 만들었어요."],
"paper money":["명사","페이퍼 머니","종이돈, 지폐","Paper money is light to carry.","지폐는 들고 다니기 가벼워요."],
"barter":["명사","바터","물물교환","Before money, people used barter.","돈이 생기기 전엔 물물교환을 했어요."],
"gold standard":["명사","골드 스탠더드","금본위제(돈을 금으로 바꿔 주는 제도)","The gold standard ended in 1971.","금본위제는 1971년에 끝났어요."],
"gold":["명사","골드","금","Gold does not pay interest.","금은 이자를 주지 않아요."],
"silver":["명사","실버","은","Silver was also used as money.","은도 돈으로 쓰였어요."],
"dollar":["명사","달러","달러(미국 돈)","The dollar got stronger.","달러가 강해졌어요.","옛 은화 탈러(Thaler)에서 온 말이에요."],
"exchange rate":["명사","익스체인지 레이트","환율","The exchange rate changes every day.","환율은 매일 바뀌어요."],
"central bank":["명사","센트럴 뱅크","중앙은행","The central bank controls money.","중앙은행은 돈의 양을 조절해요."],
"bank":["명사","뱅크","은행","I keep my money in a bank.","돈을 은행에 맡겨요.","이탈리아어 banco(긴 의자, 탁자)에서 왔어요. 옛 환전상이 탁자에서 일했거든요."],
"bankrupt":["형용사","뱅크럽트","파산한","The firm went bankrupt.","그 회사는 파산했어요.","이탈리아어 banca rotta(부서진 탁자)에서 왔다고 해요."],
"liquidity":["명사","리퀴디티","유동성(쉽게 현금으로 바꿀 수 있는 정도, 시장에 풀린 돈)","Cash has the most liquidity.","현금이 유동성이 가장 높아요.","liquid(액체)에서 왔어요. 물처럼 잘 흐르는 돈!"],
"money supply":["명사","머니 서플라이","통화량(시중에 풀린 돈의 양)","The money supply grew fast.","통화량이 빠르게 늘었어요."],
"base money":["명사","베이스 머니","본원통화","Base money is made by the central bank.","본원통화는 중앙은행이 만들어요."],
"credit creation":["명사","크레딧 크리에이션","신용창조(은행 대출로 돈이 불어나는 것)","Credit creation makes more money.","신용창조로 돈이 더 늘어나요."],
"credit":["명사","크레딧","신용; 외상","Credit means trust.","크레딧은 믿음이라는 뜻이에요.","라틴어 credere(믿다)에서 왔어요."],
"money multiplier":["명사","머니 멀티플라이어","통화승수","The money multiplier shows how money grows.","통화승수는 돈이 얼마나 불어나는지 보여 줘요."],
"reserve":["명사","리저브","지급준비금; 비축","Banks keep some money as reserves.","은행은 돈 일부를 준비금으로 둬요."],
"deposit":["명사","디파짓","예금","I made a deposit at the bank.","은행에 예금했어요."],
"loan":["명사","론","대출","She got a loan to buy a house.","그녀는 집을 사려고 대출을 받았어요."],
"debt":["명사","데트 (b는 소리 안 나요)","빚","Too much debt is risky.","빚이 너무 많으면 위험해요.","b를 읽지 않아요: '데트'."],
"mortgage":["명사","모기지 (t는 소리 안 나요)","주택담보대출","They pay the mortgage every month.","그들은 매달 주택담보대출을 갚아요.","옛 프랑스어 '죽은(mort) 약속(gage)'에서 왔어요. 다 갚으면 약속이 끝나니까요."],
"leverage":["명사","레버리지","지렛대 효과(빌린 돈으로 크게 투자하기)","Leverage makes gains and losses bigger.","레버리지는 이익과 손해를 모두 크게 해요.","lever(지렛대)에서 왔어요."],
"margin":["명사","마진","증거금; 이윤","Futures need a margin deposit.","선물은 증거금이 필요해요."],
"futures":["명사","퓨처스","선물(미래에 정한 값으로 사고팔기로 한 약속)","Futures have an expiry date.","선물에는 만기가 있어요."],
"futures contract":["명사","퓨처스 컨트랙트","선물 계약","A futures contract fixes a price today.","선물 계약은 오늘 값을 정해 둬요."],
"spot":["명사·형용사","스팟","현물(지금 바로 사고팔기)","The spot price of gold fell.","금 현물 가격이 내렸어요."],
"contract":["명사","컨트랙트","계약","They signed a contract.","그들은 계약서에 서명했어요."],
"expiry":["명사","익스파이어리","만기","The contract has an expiry in March.","그 계약은 3월이 만기예요."],
"maturity":["명사","머추어리티","(채권) 만기","The bond's maturity is ten years.","그 채권의 만기는 10년이에요."],
"yield":["명사","일드","수익률; 채권 금리","Bond yields went up.","채권 금리가 올랐어요.","yield는 '농작물을 거두다'라는 뜻도 있어요."],
"coupon":["명사","쿠폰","(채권) 이자","The bond pays a coupon twice a year.","그 채권은 1년에 두 번 이자를 줘요.","옛날 채권에 붙은 종이 쿠폰을 잘라 내고 이자를 받았던 데서 왔어요."],
"price":["명사","프라이스","가격","Prices went up.","가격이 올랐어요."],
"expected value":["명사","익스펙티드 밸류","기댓값(여러 번 했을 때의 평균 결과)","The expected value of a lottery ticket is low.","복권 한 장의 기댓값은 낮아요."],
"probability":["명사","프라버빌리티","확률","The probability of winning is tiny.","당첨 확률은 아주 작아요."],
"zero-sum":["형용사","제로섬","한쪽이 얻은 만큼 다른 쪽이 잃는","Gambling is a zero-sum game.","도박은 제로섬 게임이에요."],
"positive-sum":["형용사","포지티브섬","모두 함께 더 커질 수 있는(윈윈)","Good business is positive-sum.","좋은 사업은 모두의 몫을 키워요."],
"win-win":["형용사","윈윈","모두 이기는","It was a win-win deal.","모두에게 좋은 거래였어요."],
"lottery":["명사","라터리","복권","He bought a lottery ticket.","그는 복권을 샀어요."],
"casino":["명사","커시노","카지노","The casino always has an edge.","카지노는 늘 유리한 쪽이에요."],
"gambling":["명사","갬블링","도박","Gambling is not investing.","도박은 투자가 아니에요."],
"invest":["동사","인베스트","투자하다","She invests a little every month.","그녀는 매달 조금씩 투자해요."],
"investment":["명사","인베스트먼트","투자","Learning is the best investment.","배움이 최고의 투자예요."],
"investor":["명사","인베스터","투자자","Investors were worried.","투자자들이 걱정했어요."],
"risk":["명사","리스크","위험","Every investment has risk.","모든 투자에는 위험이 있어요."],
"return":["명사","리턴","수익","High returns often mean high risk.","높은 수익엔 보통 높은 위험이 따라요."],
"profit":["명사","프라핏","이익","The shop made a profit.","가게가 이익을 냈어요."],
"loss":["명사","로스","손실","He sold at a loss.","그는 손해를 보고 팔았어요."],
"recession":["명사","리세션","경기 침체","Many people lost jobs in the recession.","경기 침체 때 많은 사람이 일자리를 잃었어요.","recede(물러나다)에서 왔어요. 경기가 뒤로 물러나는 것!"],
"depression":["명사","디프레션","(심한) 불황, 공황","The Great Depression began in 1929.","대공황은 1929년에 시작됐어요."],
"boom":["명사","붐","호황","The 1990s had a tech boom.","1990년대에 기술 호황이 있었어요."],
"bubble":["명사","버블","거품(값이 실제보다 지나치게 오른 상태)","The dot-com bubble burst in 2000.","닷컴 거품은 2000년에 터졌어요."],
"crash":["명사","크래시","폭락","The 1929 crash shocked the world.","1929년 폭락은 세계를 놀라게 했어요."],
"panic":["명사","패닉","공황, 겁에 질린 매도","Panic selling made prices fall.","겁에 질린 매도로 값이 떨어졌어요."],
"crisis":["명사","크라이시스","위기","The 2008 financial crisis started with housing.","2008년 금융위기는 주택에서 시작됐어요."],
"economy":["명사","이카너미","경제","The economy is growing.","경제가 성장하고 있어요.","그리스어 oikonomia(집안 살림 관리)에서 왔어요."],
"economics":["명사","이커나믹스","경제학","Economics is the study of choices.","경제학은 선택을 공부하는 학문이에요."],
"macroeconomics":["명사","매크로이커나믹스","거시경제학(나라·세계 전체 경제)","Macroeconomics looks at the big picture.","거시경제학은 큰 그림을 봐요.","macro = 큰"],
"microeconomics":["명사","마이크로이커나믹스","미시경제학(가계·기업 하나하나)","Microeconomics looks at one market.","미시경제학은 시장 하나를 봐요.","micro = 작은"],
"capitalism":["명사","캐피털리즘","자본주의","Capitalism is based on markets.","자본주의는 시장을 바탕으로 해요."],
"capital":["명사","캐피털","자본; 수도","You need capital to start a business.","사업을 시작하려면 자본이 필요해요.","라틴어 caput(머리)에서 왔어요. 옛날엔 가축 '머릿수'가 재산이었거든요."],
"invisible hand":["명사","인비저블 핸드","보이지 않는 손(애덤 스미스의 말)","Adam Smith wrote about the invisible hand.","애덤 스미스는 보이지 않는 손에 대해 썼어요."],
"market":["명사","마킷","시장","Prices are set in the market.","가격은 시장에서 정해져요."],
"supply":["명사","서플라이","공급","Supply went down.","공급이 줄었어요."],
"demand":["명사","디맨드","수요","Demand for oil rose.","석유 수요가 늘었어요."],
"trade":["명사·동사","트레이드","무역, 거래(하다)","Trade connects countries.","무역은 나라들을 이어 줘요."],
"tariff":["명사","태리프","관세","A tariff makes imports more expensive.","관세는 수입품을 비싸게 해요."],
"tax":["명사","택스","세금","We pay tax on income.","우리는 소득에 세금을 내요."],
"budget":["명사","버짓","예산","Make a monthly budget.","한 달 예산을 세워 보세요.","옛 프랑스어 bougette(작은 돈주머니)에서 왔어요."],
"fiscal":["형용사","피스컬","재정의(정부 돈의)","Fiscal policy is about taxes and spending.","재정 정책은 세금과 지출에 관한 거예요.","라틴어 fiscus(바구니, 국고)에서 왔어요."],
"monetary policy":["명사","머니테리 폴리시","통화 정책(금리·돈의 양 조절)","Monetary policy is run by the central bank.","통화 정책은 중앙은행이 맡아요."],
"GDP":["명사","지디피","국내총생산(한 나라가 1년 동안 만든 가치)","GDP grew by 2 percent.","GDP가 2% 늘었어요.","Gross Domestic Product의 머리글자예요."],
"CPI":["명사","씨피아이","소비자물가지수","CPI shows how prices change.","CPI는 물가가 어떻게 바뀌는지 보여 줘요.","Consumer Price Index의 머리글자예요."],
"index":["명사","인덱스","지수","The KOSPI is a stock index.","코스피는 주가지수예요."],
"growth":["명사","그로스","성장","Economic growth slowed.","경제 성장이 느려졌어요."],
"unemployment":["명사","언임플로이먼트","실업","Unemployment rose.","실업이 늘었어요."],
"wage":["명사","웨이지","임금","Wages went up slowly.","임금이 천천히 올랐어요."],
"income":["명사","인컴","소득","Rent is a kind of income.","임대료도 소득의 한 종류예요."],
"saving":["명사","세이빙","저축","Saving a little helps a lot.","조금씩 저축하면 큰 도움이 돼요."],
"asset":["명사","애셋","자산","A house is an asset.","집은 자산이에요."],
"real estate":["명사","리얼 이스테이트","부동산","Real estate prices went up.","부동산 가격이 올랐어요."],
"property":["명사","프라퍼티","재산; 부동산","He bought a property near the station.","그는 역 근처 부동산을 샀어요."],
"rent":["명사","렌트","임대료, 월세","She pays rent every month.","그녀는 매달 월세를 내요."],
"housing":["명사","하우징","주택","Housing costs are high.","주택 비용이 높아요."],
"oil":["명사","오일","석유","Oil prices rose.","유가가 올랐어요."],
"crude oil":["명사","크루드 오일","원유","Crude oil is refined into gasoline.","원유는 정제해서 휘발유가 돼요."],
"petroleum":["명사","퍼트롤리엄","석유","Petroleum is found underground.","석유는 땅속에 있어요.","petra(바위)+oleum(기름): '바위 기름'이에요."],
"oil shock":["명사","오일 쇼크","석유 파동(유가 급등)","The 1973 oil shock raised prices.","1973년 석유 파동은 물가를 올렸어요."],
"OPEC":["명사","오펙","석유수출국기구","OPEC can cut oil production.","OPEC은 석유 생산을 줄일 수 있어요."],
"petrodollar":["명사","페트로달러","석유를 달러로 사고파는 체제","Oil is mostly priced in dollars.","석유는 대부분 달러로 값이 매겨져요."],
"commodity":["명사","커마더티","원자재(금·석유·곡물 등)","Gold and oil are commodities.","금과 석유는 원자재예요."],
"safe haven":["명사","세이프 헤이븐","안전자산(불안할 때 찾는 자산)","Gold is called a safe haven.","금은 안전자산이라고 불려요."],
"Treasury":["명사","트레저리","미국 재무부; 미국 국채","Treasuries are U.S. government bonds.","트레저리는 미국 국채예요."],
"government bond":["명사","거번먼트 본드","국채","Government bonds are considered safe.","국채는 안전하다고 여겨져요."],
"default":["명사","디폴트","채무 불이행(빚을 못 갚는 것)","A default hurts lenders.","채무 불이행은 빌려준 사람에게 손해예요."],
"lender":["명사","렌더","빌려주는 사람","The bank is the lender.","은행이 빌려주는 쪽이에요."],
"borrower":["명사","바로어","빌리는 사람","The borrower pays interest.","빌린 사람이 이자를 내요."],
"speculation":["명사","스페큘레이션","투기","Tulip speculation became a mania.","튤립 투기는 광풍이 됐어요."],
"mania":["명사","메이니아","광풍, 열광","Tulip mania happened in the 1630s.","튤립 광풍은 1630년대에 있었어요."],
"diversification":["명사","다이버시피케이션","분산 투자","Diversification lowers risk.","분산 투자는 위험을 낮춰요."],
"portfolio":["명사","포트폴리오","자산 묶음","A portfolio holds many assets.","포트폴리오에는 여러 자산이 들어 있어요.","이탈리아어 portafoglio(서류 가방)에서 왔어요."],
"volatility":["명사","발러틸리티","변동성(값이 출렁이는 정도)","Volatility was high this week.","이번 주 변동성이 컸어요."],
"long-term":["형용사","롱텀","장기의","Think long-term.","길게 보세요."],
"short-term":["형용사","숏텀","단기의","Short-term trading is risky.","단기 매매는 위험해요."],
"value":["명사","밸류","가치","Price and value are different.","가격과 가치는 달라요."],
"valuation":["명사","밸류에이션","가치 평가","The valuation looked too high.","가치 평가가 너무 높아 보였어요."],
"compound interest":["명사","컴파운드 인터레스트","복리(이자에 또 이자가 붙는 것)","Compound interest grows over time.","복리는 시간이 갈수록 커져요."],
"exchange":["명사·동사","익스체인지","교환(하다); 거래소","They exchange goods.","그들은 물건을 교환해요."],
"wealth":["명사","웰스","부, 재산","Wealth takes time to build.","부는 쌓는 데 시간이 걸려요."],
"finance":["명사","파이낸스","금융, 재정","She works in finance.","그녀는 금융 분야에서 일해요.","옛 프랑스어 finer(끝내다, 빚을 청산하다)에서 왔어요."],
"financial":["형용사","파이낸셜","금융의","The financial system is connected.","금융 시스템은 서로 연결돼 있어요."],
"regulation":["명사","레귤레이션","규제","New regulation came after 2008.","2008년 이후 새 규제가 생겼어요."],
"globalization":["명사","글로벌리제이션","세계화","Globalization increased trade.","세계화로 무역이 늘었어요."],
"cycle":["명사","사이클","순환, 주기","The business cycle has ups and downs.","경기 순환에는 오르내림이 있어요."]
};
var keys=Object.keys(G).sort(function(a,c){return c.length-a.length});
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
var re=new RegExp('\\b('+keys.map(function(k){return esc(k).replace(/ /g,'\\s+')+(/[a-z]$/.test(k)?'(?:s|es)?':'')}).join('|')+')\\b','gi');
function lookup(w){var lw=w.replace(/\s+/g,' ').toLowerCase();for(var i=0;i<keys.length;i++){var lk=keys[i].toLowerCase();if(lw===lk||lw===lk+'s'||lw===lk+'es')return keys[i];}return null;}
function wrap(span){var n=0,done={},nodes=[],walker=document.createTreeWalker(span,NodeFilter.SHOW_TEXT,null),t;
 while((t=walker.nextNode())){if(!t.parentNode.closest('button'))nodes.push(t);}
 nodes.forEach(function(t){if(n>=3)return;var s=t.nodeValue,m,lastI=0,frag=document.createDocumentFragment(),hit=false;re.lastIndex=0;
  while(n<3&&(m=re.exec(s))){var k=lookup(m[0]);if(!k||done[k])continue;done[k]=1;n++;hit=true;
   frag.appendChild(document.createTextNode(s.slice(lastI,m.index)));var bt=document.createElement('button');bt.type='button';bt.className='term';bt.dataset.k=k;bt.textContent=m[0];bt.setAttribute('aria-label',m[0]+' 뜻 보기');bt.setAttribute('aria-haspopup','dialog');frag.appendChild(bt);lastI=m.index+m[0].length;}
  if(hit){frag.appendChild(document.createTextNode(s.slice(lastI)));t.parentNode.replaceChild(frag,t);}});}
var main=document.querySelector('main')||b;

/* 듣기 버튼 + 굵은 한글 발음 줄 (단어 감싸기 전에 문장 텍스트를 저장) */
main.querySelectorAll('.en').forEach(function(e){
 if(e.closest('.vocab table'))return;
 var t=(e.textContent||'').trim();if(t.length<3)return;
 var s=document.createElement('button');s.type='button';s.className='spk';s.textContent='🔊';s.title='영어로 듣기 + 한글 발음 보기 (한 번 더 누르면 닫힘)';s.setAttribute('aria-label','영어로 듣기, 한글 발음 보기');s.setAttribute('aria-expanded','false');
 s.onclick=function(ev){ev.preventDefault();ev.stopPropagation();
  var open=e.nextElementSibling&&e.nextElementSibling.classList.contains('kpr');
  if(open){e.nextElementSibling.remove();s.setAttribute('aria-expanded','false');if(cur&&cur.btn===s)stop();return;}
  var ko=e.getAttribute('data-ko');
  if(ko){var k=document.createElement('span');k.className='kpr';k.setAttribute('lang','ko');k.innerHTML='<span class="lb">🗣 발음</span>';k.appendChild(document.createTextNode(ko));e.after(k);s.setAttribute('aria-expanded','true');}
  last={t:t,el:e};speak(t,e,s);};
 e.appendChild(s);
});
main.querySelectorAll('.en').forEach(wrap);
main.querySelectorAll('.vocab .say').forEach(function(e){var t=(e.dataset.say||e.textContent).trim();e.setAttribute('role','button');e.tabIndex=0;e.title='눌러서 듣기';var f=function(){last={t:t,el:e};speak(t,e,e)};e.addEventListener('click',f);e.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();f()}});});

/* 단어 카드 */
var pop=document.createElement('div');pop.className='tpop';pop.setAttribute('role','dialog');pop.hidden=true;b.appendChild(pop);
function h(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var WB='eco-words';function getWB(){try{return JSON.parse(LS.get(WB,'[]'))||[]}catch(e){return[]}}
function addWB(k){var a=getWB().filter(function(x){return x!==k});a.unshift(k);LS.set(WB,JSON.stringify(a.slice(0,30)));renderWB();}
var opener=null;
function show(btn){var k=btn.dataset.k,d=G[k];if(!d)return;opener=btn;
 pop.innerHTML='<div><span class="w" lang="en">'+h(k)+'</span><span class="pos">'+h(d[0])+'</span></div><div>발음: <span class="pr">'+h(d[1])+'</span></div><div>뜻: <b>'+h(d[2])+'</b></div><div class="ex"><span lang="en">'+h(d[3])+'</span><br>'+h(d[4])+'</div>'+(d[5]?'<div class="tip2">💡 '+h(d[5])+'</div>':'')+'<div class="bt"><button type="button" data-a="w">🔊 단어 듣기</button><button type="button" data-a="e">🔊 예문 듣기</button><button type="button" data-a="x">닫기</button></div>';
 pop.dataset.k=k;pop.hidden=false;pop.setAttribute('aria-label',k+' 단어 카드');
 var r=btn.getBoundingClientRect(),w=Math.min(320,window.innerWidth-16),x=window.scrollX+r.left,y=window.scrollY+r.bottom+6;
 if(x+w>window.scrollX+window.innerWidth-8)x=window.scrollX+window.innerWidth-w-8;pop.style.left=Math.max(8,x)+'px';pop.style.top=y+'px';
 addWB(k);var f=pop.querySelector('button');if(f)f.focus({preventScroll:true});}
function hide(){if(!pop.hidden){pop.hidden=true;if(opener)opener.focus({preventScroll:true});}}
document.addEventListener('click',function(e){var t=e.target.closest('button.term');if(t){e.preventDefault();show(t);return;}var a=e.target.closest('.tpop button');if(a){var d=G[pop.dataset.k];if(a.dataset.a==='w')speak(pop.dataset.k,null,null);if(a.dataset.a==='e')speak(d[3],null,null);if(a.dataset.a==='x')hide();return;}if(!e.target.closest('.tpop'))hide();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')hide();});

/* 오늘 눌러 본 단어 */
var wb=document.createElement('section');wb.className='wordbook';wb.setAttribute('aria-label','오늘 눌러 본 단어');main.appendChild(wb);
function renderWB(){var a=getWB();wb.innerHTML='<h2>📒 오늘 눌러 본 단어</h2><span class="en" lang="en">📒 Words you tapped</span>'+(a.length?'<ul>'+a.map(function(k){var d=G[k]||['','',''];return '<li><b lang="en">'+h(k)+'</b> (<span class="pr">'+h(d[1])+'</span>) = '+h(d[2])+'<button type="button" data-say="'+h(k)+'">🔊 다시 듣기</button></li>'}).join('')+'</ul><button type="button" data-clear="1">🗑 지우기</button>':'<p>파란 영어 문장 속 <b>점선 밑줄 단어</b>를 눌러 보세요. 여기에 모여요.</p>');}
wb.addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;if(x.dataset.say)speak(x.dataset.say,null,x);if(x.dataset.clear){LS.set(WB,'[]');renderWB();}});
renderWB();
})();
