import{j as e,r as d}from"./index-BYTWsRVx.js";function w({code:n}){return e.jsx("pre",{className:"bg-slate-900 border border-slate-700 rounded-lg p-3 text-left text-xs text-green-300 font-mono overflow-x-auto whitespace-pre my-3",children:n})}function s({question:n,code:t,options:l,answer:p,explanation:m,onComplete:x}){const[r,f]=d.useState(null),[a,u]=d.useState(!1),c=r===p;return e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-white font-medium text-sm leading-relaxed",children:n}),t&&e.jsx(w,{code:t}),e.jsx("div",{className:"grid gap-2",children:l.map((_,o)=>{let i="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ";return r===null?i+="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-violet-500":o===p?i+="bg-green-900/60 border-green-500 text-green-200":o===r?i+="bg-red-900/60 border-red-500 text-red-200":i+="bg-slate-800/50 border-slate-700/50 text-slate-500",e.jsx("button",{className:i,disabled:r!==null,onClick:()=>f(o),children:_},o)})}),r!==null&&e.jsxs("div",{className:`rounded-xl p-3 text-sm ${c?"bg-green-900/40 border border-green-700 text-green-200":"bg-red-900/40 border border-red-700 text-red-200"}`,children:[c?"✅ 정답!":"❌ 오답"," — ",m]}),e.jsxs("div",{className:"flex gap-2 pt-1",children:[e.jsx("button",{onClick:()=>u(!a),className:"text-xs text-violet-400 hover:text-violet-300 underline",children:a?"힌트 숨기기":"힌트 보기"}),r!==null&&e.jsx("button",{onClick:x,className:"ml-auto px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors",children:"다음 →"})]}),a&&e.jsx("p",{className:"text-xs text-violet-300 bg-violet-900/20 rounded-lg px-3 py-2",children:m})]})}function y({question:n,code:t,answer:l,hint:p,explanation:m,onComplete:x}){const[r,f]=d.useState(""),[a,u]=d.useState(!1),[c,_]=d.useState(!1),[o,i]=d.useState(!1),h=r.trim().toLowerCase()===l.toLowerCase();return e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-white font-medium text-sm leading-relaxed",children:n}),t&&e.jsx(w,{code:t}),e.jsx("input",{className:"w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-violet-500 placeholder-slate-500",placeholder:"파이썬 코드를 입력하세요...",value:r,onChange:g=>f(g.target.value),disabled:a,onKeyDown:g=>g.key==="Enter"&&r.trim()&&!a&&u(!0)}),a&&e.jsxs("div",{className:`rounded-xl p-3 text-sm ${h?"bg-green-900/40 border border-green-700 text-green-200":"bg-red-900/40 border border-red-700 text-red-200"}`,children:[h?"✅ 정답!":`❌ 정답: ${l}`," — ",m]}),e.jsxs("div",{className:"flex gap-2 flex-wrap pt-1",children:[e.jsx("button",{onClick:()=>_(!c),className:"text-xs text-violet-400 hover:text-violet-300 underline",children:"힌트"}),e.jsx("button",{onClick:()=>i(!o),className:"text-xs text-slate-400 hover:text-slate-300 underline",children:"정답 보기"}),!a&&r.trim()&&e.jsx("button",{onClick:()=>u(!0),className:"ml-auto px-4 py-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors",children:"확인"}),a&&e.jsx("button",{onClick:x,className:"ml-auto px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors",children:"다음 →"})]}),c&&e.jsxs("p",{className:"text-xs text-violet-300 bg-violet-900/20 rounded-lg px-3 py-2",children:["💡 힌트: ",p]}),o&&e.jsxs("p",{className:"text-xs text-green-300 bg-green-900/20 rounded-lg px-3 py-2 font-mono",children:["✅ 정답: ",l]})]})}function v({activityId:n,onComplete:t}){switch(n){case"m1":return e.jsx(s,{question:"FinanceDataReader로 삼성전자 한국 주가 데이터를 가져오는 코드는?",code:`import FinanceDataReader as fdr
# 삼성전자 코드: 005930 (한국: .KS 없이)
df = ___`,options:['fdr.DataReader("005930", "2024-01-01", "2024-12-31")','fdr.download("005930.KS", start="2024-01-01")','fdr.get_data("005930")','fdr.read("005930", period="1y")'],answer:0,explanation:"FinanceDataReader는 한국 주식 코드에 .KS 없이 숫자만 씁니다. fdr.DataReader('코드', '시작', '끝') 형태입니다. 코스닥도 숫자 코드만 씁니다.",onComplete:t});case"m2":return e.jsx(s,{question:"DART(전자공시시스템) API로 삼성전자 최근 공시 목록을 가져오는 코드에서 빈칸은?",code:`import requests
url = "https://opendart.fss.or.kr/api/list.json"
params = {
    "crtfc_key": api_key,
    "corp_code": "00126380",  # 삼성전자
    "bgn_de": "20240101"
}
response = requests.___(url, params=params)
data = response.json()`,options:["get","post","put","fetch"],answer:0,explanation:"DART API는 기업 공시(실적발표·대규모투자 등)를 자동으로 수집할 수 있습니다. requests.get()에 API 키와 기업 코드를 파라미터로 넣습니다.",onComplete:t});case"m3":return e.jsx(s,{question:"PER 10 미만, ROE 15% 이상인 코스피 종목을 자동으로 찾는 스크리닝 코드에서 빈칸은?",code:`import FinanceDataReader as fdr
krx = fdr.StockListing('KRX')  # 전체 종목 목록
# PER<10, ROE>15 필터
screened = krx[(krx['PER'] < 10) ___ (krx['ROE'] > 15)]`,options:["&","|","and","+"],answer:0,explanation:"pandas 불리언 인덱싱에서 AND 조건은 &를 씁니다. 파이썬 키워드 and는 pandas Series에서 작동하지 않습니다. OR 조건은 |를 씁니다.",onComplete:t});case"m4":return e.jsx(s,{question:"이동평균 전략(MA5>MA20이면 매수)을 과거 데이터로 검증하는 백테스팅 코드에서 빈칸은?",code:`df['signal'] = 0
df.loc[df['ma5'] > df['ma20'], 'signal'] = 1  # 매수
df['strategy_return'] = df['signal'].shift(1) * df['___']
print(df['strategy_return'].cumsum())`,options:["daily_return","Close","return","pct_change"],answer:0,explanation:"전략 수익률 = 전일 신호 × 당일 일간 수익률입니다. shift(1)을 쓰는 이유는 오늘 신호를 내일 거래에 적용해야 하기 때문입니다.",onComplete:t});case"m5":return e.jsx(y,{question:"샤프지수(위험 대비 수익률)를 계산하는 코드를 완성하세요. 샤프지수 = 평균수익률 ÷ 표준편차 × √252",code:`import numpy as np
returns = df['Close'].pct_change().dropna()
sharpe = returns.mean() / returns.___ * np.sqrt(252)`,answer:"std()",hint:".std()는 표준편차를 계산합니다",explanation:"샤프지수 = 연평균수익률 / 연간변동성 = 일평균수익률/일표준편차 × √252(거래일). 샤프지수 1이상이면 좋은 전략, 2이상이면 매우 우수합니다.",onComplete:t});case"m6":return e.jsx(s,{question:"최대 낙폭(MDD: Maximum Drawdown)을 계산하는 파이썬 코드는?",code:`cumulative = (1 + df['Close'].pct_change()).cumprod()
rolling_max = cumulative.___
drawdown = cumulative / rolling_max - 1
mdd = drawdown.min()
print(f"MDD: {mdd:.2%}")`,options:["cummax()","rolling(252).max()","max()","expanding().max()"],answer:0,explanation:"cummax()는 지금까지의 누적 최댓값을 반환합니다. 낙폭 = 현재값/이전최고값 - 1로 계산합니다. 최솟값이 MDD(최악의 손실)입니다.",onComplete:t});case"m7":return e.jsx(s,{question:"포트폴리오 비중 최적화에서 랜덤 비중 시뮬레이션 코드에서 빈칸은?",code:`import numpy as np
n_assets = 5  # 종목 수
# 랜덤 비중 생성 (합계=1)
weights = np.random.random(n_assets)
weights = weights / ___  # 합계 1로 정규화
print(weights.sum())  # 1.0`,options:["weights.sum()","len(weights)","n_assets","weights.max()"],answer:0,explanation:"비중의 합이 1이 되어야 하므로 각 비중을 전체 합으로 나눕니다. 이 방식으로 수천 개 랜덤 포트폴리오를 생성해 최적 비중을 찾습니다.",onComplete:t});case"m8":return e.jsx(s,{question:"매일 오전 9시에 주가 분석 함수를 자동으로 실행하는 schedule 코드는?",code:`import schedule, time
def analyze_stocks():
    print("주가 분석 시작")

___.every().day.at("09:00").do(analyze_stocks)
while True:
    schedule.run_pending()
    time.sleep(60)`,options:["schedule","timer","cron","task"],answer:0,explanation:"schedule.every().day.at('HH:MM').do(함수)로 매일 특정 시간에 함수를 자동 실행합니다. while True 루프 안에서 run_pending()을 계속 호출합니다.",onComplete:t});case"m9":return e.jsx(s,{question:"파이썬으로 SQLite DB를 생성하고 주가 데이터를 저장하는 코드에서 빈칸은?",code:`import sqlite3, pandas as pd
conn = sqlite3.___("stocks.db")
df.to_sql("samsung", conn, if_exists="replace", index=True)
conn.close()`,options:["connect","open","create","new"],answer:0,explanation:"sqlite3.connect('파일명.db')로 DB 파일을 생성·접속합니다. df.to_sql()로 DataFrame을 테이블로 저장합니다. 나중에 pd.read_sql()로 불러올 수 있습니다.",onComplete:t});case"m10":return e.jsx(s,{question:"pandas_datareader로 미국 금리(Fed Funds Rate) 데이터를 FRED에서 가져오는 코드는?",code:`import pandas_datareader as pdr
# FRED: 미국 연방준비은행 경제 데이터베이스
rate = pdr.___("FEDFUNDS", "fred",
                 start="2020-01-01")`,options:["DataReader","get_data","fetch","download"],answer:0,explanation:"pdr.DataReader('심볼', '데이터소스', start)로 다양한 소스에서 경제 데이터를 가져옵니다. FRED는 미국 연준의 무료 경제 데이터베이스입니다.",onComplete:t});case"m11":return e.jsx(s,{question:"Selenium으로 동적 뉴스 페이지를 자동으로 여는 코드에서 빈칸은?",code:`from selenium import webdriver
from selenium.webdriver.chrome.options import Options
options = Options()
options.add_argument("--headless")
driver = webdriver.___( options=options)
driver.get("https://finance.naver.com")
print(driver.title)`,options:["Chrome()","Firefox()","Browser()","Safari()"],answer:0,explanation:"selenium은 브라우저를 파이썬으로 제어합니다. headless 모드는 화면 없이 백그라운드에서 실행됩니다. JavaScript로 로드되는 뉴스 페이지 크롤링에 필수입니다.",onComplete:t});case"m12":return e.jsx(s,{question:"삼성전자 주가가 목표가(80,000원) 달성 시 텔레그램으로 알림을 보내는 코드에서 빈칸은?",code:`import requests
BOT_TOKEN = "your_bot_token"
CHAT_ID = "your_chat_id"
def send_alert(msg):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/___"
    requests.get(url, params={"chat_id": CHAT_ID, "text": msg})`,options:["sendMessage","send","message","notify"],answer:0,explanation:"텔레그램 Bot API의 sendMessage 메서드로 메시지를 보냅니다. @BotFather에서 봇을 만들고 토큰을 발급받은 뒤 이 코드로 주가 알림을 자동화합니다.",onComplete:t});case"m13":return e.jsx(s,{question:"뉴스 제목에서 긍정/부정을 간단히 판단하는 파이썬 감성 분석 코드는?",code:`# 간단 키워드 감성 분석
positive = ["상승", "호실적", "신고가", "매수"]
negative = ["하락", "적자", "매도", "급락"]
def get_sentiment(title):
    score = sum(1 for w in ___ if w in title)
    score -= sum(1 for w in ___ if w in title)
    return "긍정" if score > 0 else "부정" if score < 0 else "중립"`,options:["positive, negative","negative, positive","title, score","news, text"],answer:0,explanation:"긍정 키워드 등장 횟수에서 부정 키워드 등장 횟수를 빼 감성 점수를 계산합니다. 더 정교한 분석에는 KoNLPy, VADER, OpenAI API를 씁니다.",onComplete:t});case"m14":return e.jsx(s,{question:"OpenAI API로 기업 재무 데이터를 분석 리포트로 만드는 코드에서 빈칸은?",code:`from openai import OpenAI
client = OpenAI(api_key="your_key")
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": f"삼성전자 PER:{per} ROE:{roe} 분석해줘"}]
)
print(response.___[0].message.content)`,options:["choices","results","responses","output"],answer:0,explanation:"OpenAI API 응답은 response.choices[0].message.content에 있습니다. 재무 데이터를 프롬프트에 포함시켜 GPT가 자동으로 분석 리포트를 작성하게 할 수 있습니다.",onComplete:t});case"m15":return e.jsx(s,{question:"scikit-learn으로 내일 주가 상승(1)/하락(0)을 예측하는 분류 모델 학습 코드에서 빈칸은?",code:`from sklearn.ensemble import RandomForestClassifier
X = df[['ma5', 'ma20', 'rsi', 'volume']]  # 특성
y = (df['Close'].shift(-1) > df['Close']).astype(int)  # 레이블
model = RandomForestClassifier(n_estimators=100)
model.___(X[:-1], y[:-1])`,options:["fit","train","learn","predict"],answer:0,explanation:"model.fit(X, y)로 머신러닝 모델을 학습시킵니다. 학습 후 model.predict(X_test)로 예측합니다. 단, 주가 예측은 노이즈가 많아 정확도가 제한적입니다.",onComplete:t});case"m16":return e.jsx(s,{question:"선형회귀(LinearRegression)로 다음날 주가를 예측하는 코드에서 빈칸은?",code:`from sklearn.linear_model import LinearRegression
X = df[['ma5', 'ma20', 'volume']]
y = df['Close']
model = ___
model.fit(X[:-5], y[:-5])
pred = model.predict(X[-5:])`,options:["LinearRegression()","LinearRegression.fit()","Regression(linear=True)","LR()"],answer:0,explanation:"LinearRegression()으로 모델 객체를 만든 뒤 .fit(X, y)으로 학습합니다. 선형회귀는 기술적 지표들의 조합으로 주가를 예측합니다.",onComplete:t});case"m17":return e.jsx(s,{question:"RandomForest로 학습 후 각 특성(이동평균·RSI 등)의 중요도를 확인하는 코드는?",code:`model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)
importances = model.___
for feat, imp in zip(X.columns, importances):
    print(f"{feat}: {imp:.3f}")`,options:["feature_importances_","feature_weights_","importance()","features_"],answer:0,explanation:"feature_importances_ 속성은 각 특성이 모델 예측에 얼마나 기여하는지 0~1 사이 값으로 반환합니다. 어떤 지표가 주가 예측에 더 중요한지 알 수 있습니다.",onComplete:t});case"m18":return e.jsx(s,{question:"LSTM 딥러닝 모델로 주가를 예측하기 위해 데이터를 (샘플수, 타임스텝, 특성수) 형태로 변환하는 코드는?",code:`import numpy as np
# X: (샘플수, 60일, 1개 특성) 형태로 변환
X_lstm = X.___(X.shape[0], 60, 1)`,options:["reshape","transform","resize","expand"],answer:0,explanation:"LSTM은 3D 입력(샘플, 타임스텝, 특성)이 필요합니다. reshape()으로 2D 배열을 3D로 변환합니다. Keras/TensorFlow에서 LSTM 레이어에 이 형태를 넣습니다.",onComplete:t});case"m19":return e.jsx(s,{question:"Streamlit으로 주가 차트를 웹 대시보드로 표시하는 최소 코드는?",code:`import streamlit as st
import yfinance as yf
st.title("주식 분석 대시보드")
ticker = st.text_input("종목 코드", "005930.KS")
df = yf.download(ticker, period="1y")
___.line_chart(df['Close'])`,options:["st","plt","mpf","fig"],answer:0,explanation:"st.line_chart()는 DataFrame 데이터를 인터랙티브 선 차트로 표시합니다. streamlit run app.py 명령으로 바로 웹 앱이 실행됩니다. 코딩 최소화로 빠른 프로토타이핑이 가능합니다.",onComplete:t});case"m20":return e.jsx(s,{question:"plotly express로 인터랙티브 주가 선 차트를 그리는 코드는?",code:`import plotly.express as px
fig = px.___(df.reset_index(), x='Date', y='Close',
             title='삼성전자 주가')
fig.show()`,options:["line","scatter","bar","area"],answer:0,explanation:"px.line()은 선 그래프를 그립니다. plotly 차트는 마우스로 확대·축소·호버 정보 확인이 가능한 인터랙티브 차트입니다. Streamlit에서도 st.plotly_chart(fig)로 씁니다.",onComplete:t});case"m21":return e.jsx(s,{question:"FastAPI로 주가를 반환하는 간단한 API 엔드포인트를 만드는 코드에서 빈칸은?",code:`from fastapi import FastAPI
import yfinance as yf
app = ___
@app.get("/price/{ticker}")
def get_price(ticker: str):
    df = yf.download(ticker, period="1d")
    return {"ticker": ticker, "price": float(df['Close'].iloc[-1])}`,options:["FastAPI()","FastAPI.app()","FastAPI.create()","App()"],answer:0,explanation:"FastAPI()로 앱 인스턴스를 만들고 @app.get('/경로')로 GET 엔드포인트를 정의합니다. uvicorn main:app --reload로 서버를 실행합니다.",onComplete:t});case"m22":return e.jsx(s,{question:"반도체 업종 주요 종목들의 주가 수익률을 비교하는 코드에서 빈칸은?",code:`import yfinance as yf
semiconductor = ["005930.KS", "000660.KS", "NVDA", "TSM"]
for ticker in semiconductor:
    df = yf.download(ticker, period="1y")
    ret = (df['Close'].iloc[-1] / df['Close'].___[0] - 1) * 100
    print(f"{ticker}: {ret:.1f}%")`,options:["iloc","loc","head()","first()"],answer:0,explanation:"iloc[0]은 첫 번째(가장 오래된) 값입니다. (최신가/기준가 - 1) × 100으로 기간 수익률을 계산합니다. for 루프로 여러 종목을 자동 비교합니다.",onComplete:t});case"m23":return e.jsx(s,{question:"최근 3개월 수익률이 가장 높은 종목(모멘텀 전략)을 찾는 코드에서 빈칸은?",code:`tickers = ["005930.KS", "035720.KS", "035420.KS"]
momentum = {}
for t in tickers:
    df = yf.download(t, period="3mo")
    ret = (df['Close'].iloc[-1] / df['Close'].iloc[0] - 1) * 100
    momentum[t] = ret
best = ___(momentum, key=momentum.get)
print(f"모멘텀 1위: {best} ({momentum[best]:.1f}%)")`,options:["max","min","sorted","argmax"],answer:0,explanation:"max(딕셔너리, key=딕셔너리.get)으로 값이 가장 큰 키(종목코드)를 찾습니다. 이것이 최근 3개월 수익률이 가장 높은 모멘텀 종목입니다.",onComplete:t});case"m24":return e.jsx(s,{question:"과매도 종목(RSI < 30)을 자동으로 찾는 평균회귀 전략 코드에서 빈칸은?",code:`oversold = []
for ticker in tickers:
    df = yf.download(ticker, period="3mo")
    delta = df['Close'].diff()
    gain = delta.where(delta>0,0).rolling(14).mean()
    loss = (-delta.where(delta<0,0)).rolling(14).mean()
    rsi = 100 - 100/(1 + gain/loss)
    if rsi.iloc[-1] ___:
        oversold.append(ticker)
print("과매도 종목:", oversold)`,options:["< 30","> 70","< 50","> 30"],answer:0,explanation:"RSI < 30이면 과매도로 반등 가능성이 있는 종목입니다. RSI > 70이면 과매수입니다. 평균회귀 전략은 극단값으로 간 종목이 평균으로 돌아온다는 원리를 씁니다.",onComplete:t});case"m25":return e.jsx(s,{question:"미국 기준금리(FEDFUNDS)와 코스피를 함께 분석하는 매크로 코드에서 빈칸은?",code:`import pandas_datareader as pdr
import yfinance as yf
# 미국 기준금리 (FRED)
rate = pdr.DataReader("FEDFUNDS", "fred", "2020-01-01")
# 코스피 지수
kospi = yf.download("^KS11", start="2020-01-01")
# 상관관계 계산
corr = rate['FEDFUNDS'].corr(kospi['Close'].___('ME').last())
print(f"금리-코스피 상관계수: {corr:.3f}")`,options:["resample","groupby","rolling","shift"],answer:0,explanation:"금리는 월별 데이터이므로 일별 주가를 resample('ME').last()로 월말 데이터로 변환해 주파수를 맞춥니다. 금리 인상기에 주가가 하락하는 경향을 분석할 수 있습니다.",onComplete:t});case"m26":return e.jsx(s,{question:"S&P500, 나스닥, 코스피를 한번에 다운받아 정규화(기준=100)된 수익률 비교 차트를 그리는 코드에서 빈칸은?",code:`indices = {"S&P500": "^GSPC", "NASDAQ": "^IXIC", "KOSPI": "^KS11"}
for name, code in indices.items():
    df = yf.download(code, start="2024-01-01")
    normalized = df['Close'] / df['Close'].___ * 100
    plt.plot(normalized, label=name)
plt.legend(); plt.title("글로벌 지수 비교")`,options:["iloc[0]","mean()","first()","head(1)"],answer:0,explanation:"첫날 종가를 기준(100)으로 정규화하면 서로 다른 단위의 지수를 같은 축에서 비교할 수 있습니다. iloc[0]으로 첫 번째 값을 기준으로 나눕니다.",onComplete:t});case"m27":return e.jsx(s,{question:"주가가 목표가에 도달하면 텔레그램·이메일·카카오 중 가장 쉽게 구현하는 알림 방법은?",code:`# 텔레그램 봇 알림 예시
def check_and_alert(ticker, target):
    df = yf.download(ticker, period="1d")
    price = df['Close'].iloc[-1]
    if price >= target:
        msg = f"{ticker} 목표가 {target:,}원 달성! 현재가: {price:,.0f}원"
        send_telegram(msg)
        return True
    return False`,options:["텔레그램 봇 API","이메일(smtplib)","카카오 API","세 가지 모두 파이썬으로 가능"],answer:3,explanation:"파이썬으로 텔레그램(telegram-bot-api), 이메일(smtplib), 카카오(kakao REST API) 모두 알림을 보낼 수 있습니다. 가장 설정이 간단한 것은 텔레그램 봇입니다.",onComplete:t});case"m28":return e.jsx(s,{question:"파이썬으로 주식 분석 결과를 PDF 리포트로 자동 생성하는 라이브러리는?",code:`from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
c = canvas.___("report.pdf", pagesize=A4)
c.drawString(100, 750, "삼성전자 분석 리포트")
c.drawString(100, 700, f"현재가: {price:,}원 | PER: {per:.1f}")
c.save()`,options:["Canvas","PDF","Document","Page"],answer:0,explanation:"reportlab의 canvas.Canvas()로 PDF를 생성합니다. drawString()으로 텍스트를, drawImage()로 차트 이미지를 삽입할 수 있습니다. 매일 자동으로 분석 리포트를 생성해 이메일로 보낼 수 있습니다.",onComplete:t});case"m29":return e.jsx(s,{question:"종합 주식 분석 봇이 수행해야 할 전체 파이프라인 순서로 올바른 것은?",options:["① 데이터수집 → ② 지표계산 → ③ 스크리닝 → ④ AI분석 → ⑤ 알림발송","① 알림발송 → ② 데이터수집 → ③ 스크리닝","① AI분석 → ② 데이터수집 → ③ 알림","순서는 상관없다"],answer:0,explanation:"완전 자동화 파이프라인: ①yfinance/fdr 데이터 수집 → ②MA·RSI·MACD 등 지표 계산 → ③PER·ROE·기술적 조건 스크리닝 → ④OpenAI API 심층 분석 → ⑤텔레그램 알림 발송. schedule로 매일 자동 실행합니다.",onComplete:t});case"m30":return e.jsx(s,{question:"🎓 중학 수료 문제! 파이썬으로 주식 분석 자동화 시스템을 만들 때 핵심 4개 라이브러리는?",options:["yfinance(데이터) + pandas(처리) + matplotlib(차트) + schedule(자동화)","pygame + tkinter + turtle + flask","numpy + scipy + sympy + math","django + flask + fastapi + tornado"],answer:0,explanation:"yfinance(주가수집) + pandas(데이터분석) + matplotlib/plotly(시각화) + schedule(자동화)이 주식 분석 자동화의 4대 핵심입니다. 여기에 requests(API), BeautifulSoup(크롤링), OpenAI(AI분석)을 더하면 완성도 높은 시스템을 만들 수 있습니다. 🎉 파이썬 주식분석 완전정복!",onComplete:t});default:return e.jsxs("div",{className:"text-center py-8",children:[e.jsx("p",{className:"text-slate-400",children:"게임을 불러오는 중..."}),e.jsx("button",{onClick:t,className:"mt-4 px-6 py-2 bg-violet-600 text-white rounded-xl text-sm",children:"완료"})]})}}export{v as default};
