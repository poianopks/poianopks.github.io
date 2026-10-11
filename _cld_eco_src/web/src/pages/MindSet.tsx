import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { tabUrl } from "@/lib/tabs";

// ─── 1. 마음 습관 자가 진단 ────────────────────────────────────────────
const QUIZ = [
  "주가가 오르는 뉴스를 보면 ‘지금 안 사면 늦는다’는 생각이 든다.",
  "손실 난 종목은 ‘본전만 오면 판다’며 계속 들고 있다.",
  "수익 난 종목은 조금만 올라도 빨리 팔아 버린다.",
  "산 이유를 글로 적어 둔 적이 없다.",
  "하루에도 여러 번 계좌 앱을 연다.",
  "내 생각과 같은 의견만 찾아 읽는 편이다.",
  "한 종목(또는 한 업종)에 자산의 절반 이상이 들어가 있다.",
  "‘이번엔 다르다’는 말에 마음이 움직인 적이 있다.",
  "손절 기준을 정해 두지 않고 매수한다.",
  "최근 며칠의 움직임이 앞으로도 이어질 것 같다고 느낀다.",
];

function quizResult(score: number) {
  if (score <= 2)
    return { emoji: "🧘", name: "원칙형 투자자", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300",
      text: "감정보다 계획이 먼저 움직입니다. 지금의 습관을 기록으로 남겨 두면 시장이 크게 흔들릴 때 큰 힘이 됩니다." };
  if (score <= 5)
    return { emoji: "⚖️", name: "균형형 투자자", color: "text-blue-700", bg: "bg-blue-50 border-blue-300",
      text: "대체로 괜찮지만 몇몇 상황에서 감정이 앞섭니다. ‘예’라고 답한 항목에 맞는 해독제를 아래에서 하나씩 골라 써 보세요." };
  return { emoji: "🔥", name: "감정 주도형 투자자", color: "text-red-700", bg: "bg-red-50 border-red-300",
    text: "시장의 소음이 결정을 대신하고 있을 가능성이 큽니다. 투자 금액을 줄이고, 아래 ‘매수 전 5가지 질문’을 통과할 때만 사는 규칙부터 시작해 보세요." };
}

// ─── 2. 돈을 잃게 만드는 7가지 마음의 함정 ───────────────────────────
const BIASES = [
  { icon: "😖", name: "손실 회피", en: "Loss Aversion",
    what: "같은 크기라도 잃는 고통이 얻는 기쁨보다 훨씬 크게 느껴집니다. 카너먼·트버스키의 연구(전망 이론)에서는 약 2배로 추정했습니다.",
    when: "손실 난 종목을 못 팔고, 반대로 작은 수익에 서둘러 팝니다.",
    cure: "‘지금 현금이 있다면 이 종목을 새로 사겠는가?’ 라고 물어보세요. 아니라면 보유할 이유도 약합니다." },
  { icon: "🔁", name: "처분 효과", en: "Disposition Effect",
    what: "오른 주식은 일찍 팔고, 떨어진 주식은 오래 붙잡는 경향입니다(셰프린·스탯먼, 1985).",
    when: "계좌에 ‘물린 종목’만 쌓이고 좋은 종목은 남아 있지 않습니다.",
    cure: "매수할 때 매도 조건(목표·손절·기간)을 미리 적어 두고, 가격이 아니라 조건으로 팝니다." },
  { icon: "🐑", name: "군중 심리 · FOMO", en: "Herding",
    what: "모두가 사면 나도 사야 할 것 같은 마음입니다. 고점 근처에서 개인 매수가 몰리는 이유입니다.",
    when: "커뮤니티·뉴스에 같은 종목 이야기가 넘칠 때 급하게 삽니다.",
    cure: "24시간 규칙: 사고 싶어지면 하루 기다렸다가 그래도 사고 싶을 때, 계획한 금액의 일부만 삽니다." },
  { icon: "🔍", name: "확증 편향", en: "Confirmation Bias",
    what: "내 생각을 지지하는 정보만 눈에 들어오고 반대 정보는 무시하게 됩니다.",
    when: "보유 종목의 좋은 기사만 찾아 읽고, 나쁜 소식은 ‘일시적’이라고 넘깁니다.",
    cure: "매수 전에 ‘이 투자가 실패한다면 이유는?’ 세 가지를 직접 적어 보세요." },
  { icon: "⚓", name: "앵커링", en: "Anchoring",
    what: "처음 본 숫자(매수가, 과거 최고가)에 판단이 묶이는 현상입니다.",
    when: "‘예전에 10만 원이었으니 5만 원이면 싸다’고 생각합니다.",
    cure: "과거 가격 대신 지금의 이익·성장·밸류에이션으로 다시 평가합니다." },
  { icon: "🦚", name: "과신", en: "Overconfidence",
    what: "내 판단이 실제보다 정확하다고 믿는 경향입니다. 바버·오딘의 연구(2000)에서 매매를 가장 많이 한 개인 투자자 그룹의 연 수익률은 약 11.4%로, 시장(약 17.9%)보다 크게 낮았습니다.",
    when: "몇 번 맞힌 뒤 금액을 키우고 매매 횟수가 늘어납니다.",
    cure: "매매 일지를 쓰고 3개월마다 ‘맞힌 이유가 실력이었나, 운이었나’를 점검합니다." },
  { icon: "📈", name: "최근성 편향", en: "Recency Bias",
    what: "최근 일어난 일이 앞으로도 계속될 것이라고 믿는 경향입니다.",
    when: "급등장 뒤엔 영원히 오를 것 같고, 급락장 뒤엔 끝없이 떨어질 것 같습니다.",
    cure: "역사 분석 탭처럼 10년 이상의 긴 그래프를 보고 지금 위치를 확인합니다." },
];

// ─── 3. 시장 감정 사이클 ──────────────────────────────────────────────
const CYCLE = [
  { emoji: "🙂", name: "낙관", tip: "계획대로 분할 매수·보유" },
  { emoji: "😃", name: "흥분", tip: "추가 매수 속도를 늦추기" },
  { emoji: "🤩", name: "환희 (고점 위험)", tip: "비중 점검·일부 이익 실현", hot: true },
  { emoji: "😟", name: "불안", tip: "손절·리밸런싱 규칙 확인" },
  { emoji: "😱", name: "공포", tip: "현금 비중 지키며 기다리기" },
  { emoji: "😞", name: "절망 (기회 구간)", tip: "계획한 분할 매수 실행", cold: true },
  { emoji: "🌱", name: "희망", tip: "원칙대로 비중 회복" },
];

// ─── 4. 매수 전 5가지 질문 ───────────────────────────────────────────
const CHECKS = [
  "이 기업(또는 ETF)이 무엇으로 돈을 버는지 한 문장으로 말할 수 있다.",
  "왜 지금 사는지 이유를 적었다. (‘오를 것 같아서’는 이유가 아니다)",
  "얼마나 떨어지면 다시 생각할지(손절·재검토 기준)를 정했다.",
  "이 돈은 1년 이상 쓰지 않아도 되는 돈이다.",
  "이번 매수 후에도 한 종목 비중이 내 원칙(예: 20%)을 넘지 않는다.",
];

const RULES_KEY = "cld_eco_mindset_rules";

export function MindSet() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => QUIZ.map(() => null));
  const [checks, setChecks] = useState<boolean[]>(() => CHECKS.map(() => false));
  const [rules, setRules] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    try { setRules(localStorage.getItem(RULES_KEY) ?? ""); } catch { /* 저장소를 못 쓰는 환경 */ }
  }, []);
  const saveRules = (v: string) => {
    setRules(v);
    try { localStorage.setItem(RULES_KEY, v); } catch { /* 무시 */ }
  };

  const answered = answers.filter((a) => a !== null).length;
  const score = answers.filter((a) => a === true).length;
  const result = answered === QUIZ.length ? quizResult(score) : null;
  const passed = checks.filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 shadow">
        <div className="text-3xl mb-1">🌱</div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">투자 마인드 — 흔들리지 않는 투자자의 마음가짐</h2>
        <p className="text-sm text-emerald-50 mt-2 leading-relaxed">
          수익을 가르는 것은 정보보다 <strong>행동</strong>입니다. 같은 시장에서도 감정에 따라 사고파는 사람과 원칙대로 움직이는 사람의 결과는 크게 달라집니다.
          내 마음 습관을 진단하고, 함정을 알고, 매수 전 질문으로 실수를 줄여 보세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {["조급함 대신 원칙", "몰빵 대신 분할", "공포 대신 계획", "예측 대신 대응"].map((t) => (
            <span key={t} className="px-2 py-1 rounded-full bg-white/15 font-bold">{t}</span>
          ))}
        </div>
      </div>

      {/* 1. 자가 진단 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🩺 1. 내 투자 마음 습관 자가 진단</CardTitle>
          <CardDescription>10개 문항에 솔직하게 ‘예/아니오’로 답해 보세요. 결과는 이 화면에서만 보이고 어디에도 저장되지 않습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {QUIZ.map((q, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border/60 bg-white/70">
              <span className="text-sm flex-1"><b className="text-emerald-700 mr-1">Q{i + 1}.</b>{q}</span>
              <div className="flex gap-2 shrink-0">
                {[true, false].map((v) => (
                  <button key={String(v)}
                    onClick={() => setAnswers(answers.map((a, j) => (j === i ? v : a)))}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      answers[i] === v
                        ? v ? "bg-red-500 text-white border-red-500" : "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white border-border hover:border-slate-400"}`}>
                    {v ? "예" : "아니오"}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-2 text-xs text-muted-foreground">답한 문항 {answered} / {QUIZ.length}</div>
          {result && (
            <div className={`p-4 rounded-xl border-2 ${result.bg}`}>
              <div className={`text-lg font-black ${result.color}`}>{result.emoji} {result.name} <span className="text-sm font-bold">(‘예’ {score}개)</span></div>
              <p className="text-sm mt-1 leading-relaxed">{result.text}</p>
              <button onClick={() => setAnswers(QUIZ.map(() => null))} className="mt-2 text-xs underline text-muted-foreground">다시 하기</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 마음의 함정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧠 2. 돈을 잃게 만드는 7가지 마음의 함정</CardTitle>
          <CardDescription>행동재무학이 밝혀낸 대표적인 심리 편향과, 바로 써먹을 수 있는 해독제입니다. 제목을 눌러 펼쳐 보세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {BIASES.map((b, i) => (
            <div key={b.name} className="rounded-xl border border-border/60 bg-white/70 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50">
                <span className="text-2xl">{b.icon}</span>
                <span className="font-black text-sm flex-1">{b.name} <span className="text-xs font-normal text-muted-foreground">{b.en}</span></span>
                <span className="text-muted-foreground text-xs">{open === i ? "▲" : "▼"}</span>
              </button>
              {open === i && (
                <div className="px-4 pb-4 space-y-2 text-sm leading-relaxed">
                  <p>{b.what}</p>
                  <p className="p-2 rounded-lg bg-amber-50 border border-amber-200"><b>⚠️ 이럴 때 나타나요:</b> {b.when}</p>
                  <p className="p-2 rounded-lg bg-emerald-50 border border-emerald-200"><b>💊 해독제:</b> {b.cure}</p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. 감정 사이클 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎢 3. 시장 감정 사이클 — 지금 나는 어디쯤일까?</CardTitle>
          <CardDescription>시장은 낙관 → 환희 → 공포 → 절망 → 희망을 되풀이합니다. 위험은 모두가 기뻐할 때 가장 크고, 기회는 모두가 절망할 때 가장 큽니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CYCLE.map((c, i) => (
              <div key={c.name} className={`p-3 rounded-xl border text-center ${c.hot ? "bg-red-50 border-red-300" : c.cold ? "bg-blue-50 border-blue-300" : "bg-white/70 border-border/60"}`}>
                <div className="text-2xl">{c.emoji}</div>
                <div className="text-[11px] text-muted-foreground">{i + 1}단계</div>
                <div className="text-sm font-black">{c.name}</div>
                <div className="text-[11px] mt-1 leading-snug">{c.tip}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            💡 지금 시장의 온도는 <a href={tabUrl("dashboard")} className="text-blue-600 underline">현재 상황</a>의 이격도와
            <a href={tabUrl("telescope")} className="text-blue-600 underline ml-1">투자 망원경</a>의 시장 날씨로 확인할 수 있어요.
            감정 대신 숫자로 위치를 읽는 습관이 마인드의 시작입니다.
          </p>
        </CardContent>
      </Card>

      {/* 4. 매수 전 체크리스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">✅ 4. 매수 버튼 누르기 전 5가지 질문</CardTitle>
          <CardDescription>5개를 모두 체크할 수 있을 때만 사는 습관을 들여 보세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKS.map((c, i) => (
            <label key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-white/70 cursor-pointer">
              <input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((v, j) => (j === i ? !v : v)))}
                className="mt-0.5 w-4 h-4 accent-emerald-600" />
              <span className="text-sm">{c}</span>
            </label>
          ))}
          <div className={`p-3 rounded-xl text-sm font-bold ${passed === CHECKS.length ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            {passed === CHECKS.length
              ? "🟢 5/5 통과 — 계획한 금액의 일부부터 분할로 시작하세요."
              : `🟡 ${passed}/5 — 체크하지 못한 항목을 먼저 채운 뒤 다시 보세요. 서두를수록 비싸게 삽니다.`}
          </div>
        </CardContent>
      </Card>

      {/* 5. 나의 원칙 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">✍️ 5. 나만의 투자 원칙 쓰기</CardTitle>
          <CardDescription>시장이 흔들릴 때 다시 읽을 나의 약속을 적어 두세요. 이 브라우저에만 저장되고 다른 사람은 볼 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea value={rules} onChange={(e) => saveRules(e.target.value)} rows={6}
            placeholder={"예)\n1. 한 종목은 자산의 20%를 넘기지 않는다.\n2. 매수는 3~5번에 나눠서 한다.\n3. 산 이유가 사라지면 손실이어도 판다.\n4. 생활비·비상금은 투자하지 않는다."}
            className="w-full p-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <div className="text-xs text-muted-foreground">자동 저장돼요. 글자 수 {rules.length}</div>
        </CardContent>
      </Card>

      {/* 6. 마무리 */}
      <Card className="border-emerald-200">
        <CardContent className="pt-6 space-y-3 text-sm leading-relaxed">
          <div className="font-black text-base">🌿 오늘의 한 줄</div>
          <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            시장은 내가 통제할 수 없지만, <b>얼마를, 언제, 어떤 조건으로</b> 사고팔지는 내가 정할 수 있습니다. 마인드란 결국 그 약속을 지키는 힘입니다.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href={tabUrl("wisdom")} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-border hover:border-emerald-400">🌟 현명투자 읽기</a>
            <a href={tabUrl("quotes")} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-border hover:border-emerald-400">💎 명언 검증</a>
            <a href={tabUrl("decision")} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-border hover:border-emerald-400">🧭 분할매수 계산기</a>
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            참고: Kahneman &amp; Tversky(1979, 1992) 전망 이론 · Shefrin &amp; Statman(1985) 처분 효과 · Barber &amp; Odean(2000) “Trading Is Hazardous to Your Wealth”.
            이 페이지는 투자 교육용이며 특정 종목의 매수·매도 권유가 아닙니다. 투자 판단과 책임은 본인에게 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
