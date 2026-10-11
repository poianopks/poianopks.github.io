import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Clock, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = "recovery" | "expansion" | "slowdown" | "recession";
type Dir = "up" | "flat" | "down";

interface BreakdownItem {
  name: string;
  value: string;
  signal: string;
  pts: number;
}

interface CycleData {
  indicators: {
    vix: number | null;
    oil: number | null;
    copper: number | null;
    tnx: number | null;
    irx: number | null;
    krw: number | null;
    dxy: number | null;
    yieldSpread: number | null;
    oilChange1mo: number | null;
    copperChange1mo: number | null;
    krwChange1mo: number | null;
    dxyChange1mo: number | null;
    ksNow: number | null;
    ksMA50: number | null;
    ksMA200: number | null;
  };
  cycle: {
    score: number;
    angle: number;
    phase: Phase;
    breakdown: BreakdownItem[];
  };
  leading: {
    score: number;
    direction: Dir;
    breakdown: BreakdownItem[];
  };
  coincident: {
    score: number;
    direction: Dir;
    breakdown: BreakdownItem[];
  };
  verdict: {
    phase: string;
    stance: string;
    stanceEn: string;
    color: string;
    desc: string;
    leadingDir: Dir;
    coincidentDir: Dir;
  };
  updatedAt: string;
  cached: boolean;
}

// ── Phase Config ─────────────────────────────────────────────────────────────
const PHASE_CONFIG: Record<Phase, {
  label: string; sub: string; emoji: string;
  color: string; bg: string; border: string; text: string;
  strategy: string; strategyColor: string;
  description: string;
  sectors: { name: string; action: "매수확대" | "관심" | "보유" | "비중축소" | "매도축소" }[];
}> = {
  recovery: {
    label: "회복", sub: "Recovery", emoji: "🌱",
    color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", text: "#1e40af",
    strategy: "분할매수 시작 · 경기민감주 관심",
    strategyColor: "#15803d",
    description: "경기가 바닥을 지나 개선되기 시작하는 국면. 주가는 실적 회복보다 먼저 움직임.",
    sectors: [
      { name: "반도체", action: "매수확대" },
      { name: "금융·증권", action: "매수확대" },
      { name: "산업재", action: "매수확대" },
      { name: "소재·화학", action: "관심" },
      { name: "조선·기계", action: "관심" },
      { name: "방어주·채권", action: "보유" },
    ],
  },
  expansion: {
    label: "확장", sub: "Expansion", emoji: "🚀",
    color: "#15803d", bg: "#dcfce7", border: "#86efac", text: "#166534",
    strategy: "주식 비중 유지·확대 · 경기민감 업종 주도",
    strategyColor: "#15803d",
    description: "성장이 본격화되고 실적·수출이 강세. 위험선호 높아져 경기민감 자산 강세.",
    sectors: [
      { name: "IT·기술주", action: "매수확대" },
      { name: "자동차", action: "매수확대" },
      { name: "조선·기계", action: "매수확대" },
      { name: "소비재", action: "관심" },
      { name: "금융", action: "보유" },
      { name: "방어주", action: "비중축소" },
    ],
  },
  slowdown: {
    label: "둔화", sub: "Slowdown", emoji: "🌤",
    color: "#d97706", bg: "#fef3c7", border: "#fcd34d", text: "#92400e",
    strategy: "차익실현 · 방어주·현금 비중 확대",
    strategyColor: "#d97706",
    description: "성장 속도가 줄고 실적 피크 가능성. 과열 업종 비중 조절 시기.",
    sectors: [
      { name: "헬스케어", action: "매수확대" },
      { name: "필수소비재", action: "매수확대" },
      { name: "통신·유틸리티", action: "관심" },
      { name: "배당주", action: "관심" },
      { name: "IT·성장주", action: "비중축소" },
      { name: "경기민감주", action: "비중축소" },
    ],
  },
  recession: {
    label: "침체", sub: "Recession", emoji: "🌧",
    color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", text: "#7f1d1d",
    strategy: "현금·방어주 중심 · 다음 회복 준비",
    strategyColor: "#dc2626",
    description: "소비·실적·투자 위축. 불확실성 최고조. 바닥 근처에서 우량주 분할매수 준비.",
    sectors: [
      { name: "방어주", action: "매수확대" },
      { name: "현금·단기채", action: "매수확대" },
      { name: "필수소비재", action: "관심" },
      { name: "경기민감주", action: "매도축소" },
      { name: "성장주", action: "매도축소" },
      { name: "소재·철강", action: "매도축소" },
    ],
  },
};

const ACTION_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "매수확대": { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  "관심":    { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  "보유":    { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  "비중축소": { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" },
  "매도축소": { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
};

// ── SVG Clock ────────────────────────────────────────────────────────────────
function CycleClock({ angle, phase, loading }: { angle: number; phase: Phase; loading: boolean }) {
  const cx = 200, cy = 200, R = 175, ri = 72;

  function polarXY(deg: number, r: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function sectorPath(startDeg: number, endDeg: number) {
    const s = polarXY(startDeg, R);
    const e = polarXY(endDeg, R);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)} Z`;
  }

  const quadrants = [
    { p: sectorPath(315, 45),  fill: "#dbeafe", stroke: "#93c5fd", label: "회복",  lx: cx,      ly: 38,  ph: "recovery" as Phase },
    { p: sectorPath(45, 135),  fill: "#dcfce7", stroke: "#86efac", label: "확장",  lx: cx+135,  ly: cy,  ph: "expansion" as Phase },
    { p: sectorPath(135, 225), fill: "#fef3c7", stroke: "#fcd34d", label: "둔화",  lx: cx,      ly: cy+153, ph: "slowdown" as Phase },
    { p: sectorPath(225, 315), fill: "#fee2e2", stroke: "#fca5a5", label: "침체",  lx: cx-135,  ly: cy,  ph: "recession" as Phase },
  ];

  const tip = polarXY(angle, R - 30);
  const phaseCfg = PHASE_CONFIG[phase];

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[300px] md:max-w-[340px] drop-shadow-xl">
        {quadrants.map((q) => (
          <g key={q.ph}>
            <path
              d={q.p}
              fill={q.fill}
              opacity={phase === q.ph ? 1 : 0.55}
              stroke="white"
              strokeWidth="2.5"
            />
            <text
              x={q.lx}
              y={q.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
              fontWeight="bold"
              fill={PHASE_CONFIG[q.ph].text}
              opacity={phase === q.ph ? 1 : 0.5}
            >
              {q.label}
            </text>
          </g>
        ))}

        <circle cx={cx} cy={cy} r={R} fill="none" stroke="white" strokeWidth="4" />
        <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="white" strokeWidth="2.5" opacity="0.8" />
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="white" strokeWidth="2.5" opacity="0.8" />
        {/* 축 레이블: 선행(상하) / 동행(좌우) */}
        <text x={cx} y={11} textAnchor="middle" fontSize="11" fill="#2563eb" fontWeight="bold" opacity="0.95">선행 ↑</text>
        <text x={cx} y={394} textAnchor="middle" fontSize="11" fill="#dc2626" fontWeight="bold" opacity="0.95">선행 ↓</text>
        <text x={393} y={cy + 4} textAnchor="end" fontSize="11" fill="#15803d" fontWeight="bold" opacity="0.95">동행 ↑</text>
        <text x={7} y={cy + 4} textAnchor="start" fontSize="11" fill="#d97706" fontWeight="bold" opacity="0.95">동행 ↓</text>

        {loading ? (
          <circle cx={cx} cy={cy} r={8} fill="#9ca3af">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
        ) : (
          <motion.g
            animate={{ rotate: angle }}
            initial={{ rotate: 0 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          >
            <line
              x1={cx} y1={cy + 18}
              x2={cx} y2={cy - (R - 30)}
              stroke="#111827"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${cx},${cy - (R - 28)} ${cx - 7},${cy - (R - 48)} ${cx + 7},${cy - (R - 48)}`}
              fill="#111827"
            />
            <line
              x1={cx} y1={cy + 18}
              x2={cx} y2={cy + 26}
              stroke="#6b7280"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </motion.g>
        )}

        <circle cx={cx} cy={cy} r={ri} fill="white" stroke="#e5e7eb" strokeWidth="2" />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="13" fill="#6b7280" fontWeight="500">경기</text>
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="13" fill="#6b7280" fontWeight="500">순환</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="13" fill="#6b7280" fontWeight="500">시계</text>
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 px-3 py-1 rounded-full text-xs font-bold shadow"
        style={{ backgroundColor: phaseCfg.bg, color: phaseCfg.text, border: `1.5px solid ${phaseCfg.border}` }}
        key={phase}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {phaseCfg.emoji} 현재: {phaseCfg.label} ({phaseCfg.sub})
      </motion.div>
    </div>
  );
}

// ── Indicator Card ────────────────────────────────────────────────────────────
function IndicatorCard({
  title, value, change, unit, interpretation, icon
}: {
  title: string;
  value: string;
  change?: number | null;
  unit?: string;
  interpretation: string;
  icon: string;
}) {
  const chgColor = change == null ? "#6b7280" : change > 0 ? "#16a34a" : change < 0 ? "#dc2626" : "#6b7280";
  return (
    <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-bold text-gray-800">{value}</span>
        {unit && <span className="text-xs text-gray-400 mb-0.5">{unit}</span>}
        {change != null && (
          <span className="text-xs font-semibold mb-0.5" style={{ color: chgColor }}>
            {change > 0 ? "▲" : change < 0 ? "▼" : "—"}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-[11px] text-gray-500 leading-tight">{interpretation}</div>
    </div>
  );
}

// ── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ pts }: { pts: number }) {
  const color = pts > 0 ? "#15803d" : pts < 0 ? "#dc2626" : "#9ca3af";
  const width = Math.abs(pts) * 16;
  return (
    <div className="flex items-center gap-1">
      {pts < 0 && <span className="text-xs font-bold" style={{ color }}>{pts}</span>}
      <div className="h-4 rounded-sm" style={{ width: `${width}px`, backgroundColor: color, minWidth: pts !== 0 ? 8 : 0, opacity: 0.8 }} />
      {pts > 0 && <span className="text-xs font-bold" style={{ color }}>+{pts}</span>}
      {pts === 0 && <span className="text-xs text-gray-400">0</span>}
    </div>
  );
}

// ── Verdict Config ────────────────────────────────────────────────────────────
const VERDICT_CONFIG: Record<string, {
  bg: string; border: string; text: string; accent: string;
  stanceColor: string; stanceBg: string;
}> = {
  green: { bg: "#dcfce7", border: "#86efac", text: "#166534", accent: "#15803d", stanceColor: "#14532d", stanceBg: "#bbf7d0" },
  blue:  { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", accent: "#1d4ed8", stanceColor: "#1e3a8a", stanceBg: "#bfdbfe" },
  amber: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", accent: "#d97706", stanceColor: "#78350f", stanceBg: "#fde68a" },
  red:   { bg: "#fee2e2", border: "#fca5a5", text: "#7f1d1d", accent: "#dc2626", stanceColor: "#7f1d1d", stanceBg: "#fecaca" },
};

const DIR_LABEL: Record<string, string> = { up: "상승 ↑", flat: "보합 →", down: "하락 ↓" };
const DIR_COLOR: Record<string, string> = { up: "#15803d", flat: "#6b7280", down: "#dc2626" };
const DIR_BG:    Record<string, string> = { up: "#dcfce7", flat: "#f3f4f6", down: "#fee2e2" };
const DIR_BORDER:Record<string, string> = { up: "#86efac", flat: "#e5e7eb", down: "#fca5a5" };

// 2×2 매트릭스 셀 정의
const MATRIX_CELLS = [
  { leading: "up",   coincident: "down",  phase: "recovery", label: "🌱 회복 초입",  stance: "분할매수", desc: "주식이 가장 좋아하는 구간",  color: "blue"  },
  { leading: "up",   coincident: "up",    phase: "expansion",label: "🚀 확장",       stance: "공격",    desc: "경기민감주 비중 확대",      color: "green" },
  { leading: "down", coincident: "down",  phase: "recession", label: "🌧 침체/하강",  stance: "방어",    desc: "현금·방어주 중심",          color: "red"   },
  { leading: "down", coincident: "up",    phase: "slowdown",  label: "🌤 둔화",       stance: "경계",    desc: "피크아웃 경계, 차익실현",    color: "amber" },
] as const;

// ── VerdictMatrix Component ───────────────────────────────────────────────────
function VerdictMatrix({ verdict }: { verdict: CycleData["verdict"] }) {
  const vcfg = VERDICT_CONFIG[verdict.color] ?? VERDICT_CONFIG.blue;

  // 매트릭스 셀: [top-left, top-right, bottom-left, bottom-right]
  // Y축(선행): 위=상승/개선, 아래=하락/악화
  // X축(동행): 왼쪽=하락/악화, 오른쪽=상승/개선
  const cells = [
    // 상단 행 (선행 ↑)
    { leading:"up",   coincident:"down",  phase:"recovery",  num:"②", label:"회복 초입",  stance:"선별 분할매수", icon:"🌱", color:"blue",  desc:"경기 개선 기대가 먼저 나타나는 국면. 모멘텀과 실적 개선이 확인되는 업종·자산을 선별해 분할매수." },
    { leading:"up",   coincident:"up",    phase:"expansion", num:"③", label:"확장",        stance:"보유·조정 시 확대", icon:"📈", color:"green", desc:"경기와 실적이 함께 개선되는 국면. 기존 포지션을 유지하며, 조정 시 비중을 확대하는 전략." },
    // 하단 행 (선행 ↓)
    { leading:"down", coincident:"down",  phase:"recession", num:"①", label:"하강·침체",  stance:"방어·현금 확보", icon:"🛡", color:"red",   desc:"경기 둔화가 심화되는 국면. 리스크 관리가 최우선이며, 현금 비중을 높여 방어적으로 대응." },
    { leading:"down", coincident:"up",    phase:"slowdown",  num:"④", label:"둔화·피크",  stance:"이익관리·비중조절", icon:"⚠️", color:"amber", desc:"경기 정점 후 둔화가 시작되는 국면. 수익 실현과 리스크 축소를 병행하며, 주식 비중을 점진적으로 축소." },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl shadow-lg overflow-hidden"
      style={{ border: `2px solid ${vcfg.border}`, backgroundColor: vcfg.bg }}
    >
      {/* ── 판정 헤더 배너 ── */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: vcfg.stanceBg, borderBottom: `2px solid ${vcfg.border}` }}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: vcfg.accent }}>
            🔍 선행·동행 자동 판정
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-black" style={{ color: vcfg.stanceColor }}>{verdict.stance}</span>
            <span className="text-sm font-semibold" style={{ color: vcfg.text }}>{verdict.stanceEn}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: vcfg.border, color: vcfg.stanceColor }}>
              {verdict.phase === "recovery" ? "② 회복 초입" : verdict.phase === "expansion" ? "③ 확장" : verdict.phase === "slowdown" ? "④ 둔화·피크" : "① 하강·침체"}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right text-xs" style={{ color: vcfg.text }}>
          <div className="font-medium max-w-[200px] leading-snug">{verdict.desc}</div>
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-3">
        {/* ── 선행/동행 방향 게이지 ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* 선행 */}
          <div className="rounded-xl p-3 bg-white border-2" style={{ borderColor: DIR_BORDER[verdict.leadingDir] }}>
            <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">
              📡 선행지수 <span className="text-[9px] font-normal">(미래 방향 · 더 중요)</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-base font-black px-3 py-1 rounded-lg"
                style={{ backgroundColor: DIR_BG[verdict.leadingDir], color: DIR_COLOR[verdict.leadingDir] }}
              >
                {verdict.leadingDir === "up" ? "상승 ↑" : verdict.leadingDir === "down" ? "하락 ↓" : "보합 →"}
              </span>
              {verdict.leadingDir === "up" && <span className="text-xs font-bold" style={{ color: DIR_COLOR.up }}>앞으로 경기 개선</span>}
              {verdict.leadingDir === "down" && <span className="text-xs font-bold" style={{ color: DIR_COLOR.down }}>앞으로 경기 악화</span>}
              {verdict.leadingDir === "flat" && <span className="text-xs font-bold text-gray-500">방향 불명확</span>}
            </div>
            <div className="text-[10px] text-gray-500">수익률곡선 · 구리 · VIX · 원/달러</div>
          </div>
          {/* 동행 */}
          <div className="rounded-xl p-3 bg-white border-2" style={{ borderColor: DIR_BORDER[verdict.coincidentDir] }}>
            <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">
              📊 동행지수 <span className="text-[9px] font-normal">(현재 실제 경기)</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-base font-black px-3 py-1 rounded-lg"
                style={{ backgroundColor: DIR_BG[verdict.coincidentDir], color: DIR_COLOR[verdict.coincidentDir] }}
              >
                {verdict.coincidentDir === "up" ? "상승 ↑" : verdict.coincidentDir === "down" ? "하락 ↓" : "보합 →"}
              </span>
              {verdict.coincidentDir === "up" && <span className="text-xs font-bold" style={{ color: DIR_COLOR.up }}>현재 경기 호조</span>}
              {verdict.coincidentDir === "down" && <span className="text-xs font-bold" style={{ color: DIR_COLOR.down }}>현재 경기 위축</span>}
              {verdict.coincidentDir === "flat" && <span className="text-xs font-bold text-gray-500">보합 상태</span>}
            </div>
            <div className="text-[10px] text-gray-500">KOSPI 이평선 · WTI 원유 · DXY</div>
          </div>
        </div>

        {/* ── 2×2 판정 매트릭스 ── */}
        <div>
          <div className="text-xs font-bold text-gray-600 mb-2">🗺 선행·동행 4국면 투자 시계</div>
          {/* 축 레이블 상단 */}
          <div className="flex items-center mb-1">
            <div className="w-12 shrink-0" />
            <div className="flex-1 text-center text-[10px] font-bold text-gray-400">동행지수: 현재 경기</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-12 shrink-0" />
            <div className="flex-1 grid grid-cols-2 gap-1.5 text-center text-[10px] font-semibold">
              <span className="text-red-400">← 하락·악화</span>
              <span className="text-green-500">상승·개선 →</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            {/* Y축 레이블 */}
            <div className="w-11 shrink-0 flex flex-col justify-center">
              <div
                className="text-[9px] font-bold text-center leading-tight"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: "100%", color: "#6b7280" }}
              >
                <span style={{ display:"block", textAlign:"center" }}>선행지수: 앞으로의 경기</span>
              </div>
            </div>

            <div className="flex-1">
              {/* Y축 상단 레이블 */}
              <div className="grid grid-cols-2 gap-1.5 mb-0.5">
                <div className="text-[9px] text-center" />
                <div className="text-[9px] text-center" />
              </div>
              <div className="text-[9px] font-semibold text-green-500 text-right mb-0.5 pr-0.5">↑ 상승·개선</div>
              <div className="grid grid-cols-2 gap-1.5">
                {cells.slice(0, 2).map((cell) => {
                  const active = verdict.phase === cell.phase;
                  const cellCfg = VERDICT_CONFIG[cell.color];
                  return (
                    <motion.div
                      key={cell.phase}
                      animate={{ scale: active ? 1.02 : 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl p-2.5 border-2 relative min-h-[90px]"
                      style={{
                        backgroundColor: active ? cellCfg.bg : "#f9fafb",
                        borderColor: active ? cellCfg.border : "#e5e7eb",
                        boxShadow: active ? `0 0 0 3px ${cellCfg.border}80` : "none",
                      }}
                    >
                      {active && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full shadow"
                            style={{ backgroundColor: cellCfg.border, color: cellCfg.stanceColor }}>
                            ▼ 현재
                          </span>
                        </div>
                      )}
                      <div className="text-base mb-0.5">{cell.icon}</div>
                      <div className="text-[10px] font-extrabold mb-0.5" style={{ color: active ? cellCfg.text : "#6b7280" }}>
                        <span className="opacity-60">{cell.num}</span> {cell.label}
                      </div>
                      <div
                        className="text-[10px] font-black px-1.5 py-0.5 rounded-md inline-block mb-1"
                        style={{
                          backgroundColor: active ? cellCfg.stanceBg : "#f3f4f6",
                          color: active ? cellCfg.stanceColor : "#9ca3af",
                        }}
                      >
                        {cell.stance}
                      </div>
                      <div className="text-[9px] text-gray-500 leading-snug hidden md:block">{cell.desc}</div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="text-[9px] font-semibold text-red-400 text-right mt-0.5 pr-0.5 mb-0.5">↓ 하락·악화</div>
              <div className="grid grid-cols-2 gap-1.5">
                {cells.slice(2, 4).map((cell) => {
                  const active = verdict.phase === cell.phase;
                  const cellCfg = VERDICT_CONFIG[cell.color];
                  return (
                    <motion.div
                      key={cell.phase}
                      animate={{ scale: active ? 1.02 : 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl p-2.5 border-2 relative min-h-[90px]"
                      style={{
                        backgroundColor: active ? cellCfg.bg : "#f9fafb",
                        borderColor: active ? cellCfg.border : "#e5e7eb",
                        boxShadow: active ? `0 0 0 3px ${cellCfg.border}80` : "none",
                      }}
                    >
                      {active && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full shadow"
                            style={{ backgroundColor: cellCfg.border, color: cellCfg.stanceColor }}>
                            ▼ 현재
                          </span>
                        </div>
                      )}
                      <div className="text-base mb-0.5">{cell.icon}</div>
                      <div className="text-[10px] font-extrabold mb-0.5" style={{ color: active ? cellCfg.text : "#6b7280" }}>
                        <span className="opacity-60">{cell.num}</span> {cell.label}
                      </div>
                      <div
                        className="text-[10px] font-black px-1.5 py-0.5 rounded-md inline-block mb-1"
                        style={{
                          backgroundColor: active ? cellCfg.stanceBg : "#f3f4f6",
                          color: active ? cellCfg.stanceColor : "#9ca3af",
                        }}
                      >
                        {cell.stance}
                      </div>
                      <div className="text-[9px] text-gray-500 leading-snug hidden md:block">{cell.desc}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 선행 우선 원칙 ── */}
        <div className="rounded-xl p-3 border-2 border-blue-200 bg-blue-50">
          <div className="text-xs font-black text-blue-800 mb-1.5">
            💡 왜 선행지수가 동행지수보다 더 중요한가?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-700">
            <div className="flex gap-2 items-start">
              <span className="text-sm shrink-0">📅</span>
              <span><strong>주가는 6~12개월 선반영</strong>합니다. 동행지수가 좋을 때 이미 주가는 오른 경우가 많음.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-sm shrink-0">🔑</span>
              <span><strong>선행이 먼저 돌아서면</strong> → 동행 확인 전에도 분할매수 검토. 선행이 꺾이면 → 동행이 좋아도 비중 축소 준비.</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Fallback data (when API fails) ────────────────────────────────────────────
const FALLBACK: CycleData = {
  indicators: {
    vix: 16.2, oil: 80.0, copper: 6.38,
    tnx: 4.61, irx: 3.73, krw: 1492, dxy: 100.9,
    yieldSpread: 0.88,
    oilChange1mo: -5.7, copperChange1mo: -0.9,
    krwChange1mo: -1.4, dxyChange1mo: 1.1,
    ksNow: 7284, ksMA50: 7980, ksMA200: 5550,
  },
  cycle: {
    score: 0,
    angle: 45,
    phase: "expansion",
    breakdown: [
      { name: "수익률곡선(10Y-3M)", value: "0.88%p", signal: "완만한 정상 — 확장 지속", pts: 1 },
      { name: "구리(닥터코퍼) 1개월", value: "-0.9%", signal: "보합 — 중립", pts: 0 },
      { name: "VIX 공포지수", value: "16.2", signal: "안정 — 위험선호", pts: 1 },
      { name: "원/달러 1개월 변화", value: "-1.4%", signal: "안정 — 중립", pts: 0 },
      { name: "KOSPI 이동평균 위치", value: "7,284", signal: "200일선 위 — 현재 경기 중립", pts: 0 },
      { name: "WTI 원유 1개월", value: "-5.7%", signal: "하락 — 현재 수요 위축", pts: -1 },
      { name: "달러인덱스(DXY) 1개월", value: "1.1%", signal: "강달러 — 현재 유동성 긴축", pts: -1 },
    ],
  },
  leading: {
    score: 2, direction: "up",
    breakdown: [
      { name: "수익률곡선(10Y-3M)", value: "0.88%p", signal: "완만한 정상 — 확장 지속", pts: 1 },
      { name: "구리(닥터코퍼) 1개월", value: "-0.9%", signal: "보합 — 중립", pts: 0 },
      { name: "VIX 공포지수", value: "16.2", signal: "안정 — 위험선호", pts: 1 },
      { name: "원/달러 1개월 변화", value: "-1.4%", signal: "안정 — 중립", pts: 0 },
    ],
  },
  coincident: {
    score: -2, direction: "down",
    breakdown: [
      { name: "KOSPI 이동평균 위치", value: "7,284", signal: "200일선 위 — 현재 경기 중립", pts: 0 },
      { name: "WTI 원유 1개월", value: "-5.7%", signal: "하락 — 현재 수요 위축", pts: -1 },
      { name: "달러인덱스(DXY) 1개월", value: "1.1%", signal: "강달러 — 현재 유동성 긴축", pts: -1 },
    ],
  },
  verdict: {
    phase: "recovery", stance: "분할매수", stanceEn: "Accumulate", color: "blue",
    desc: "선행 상승 + 동행 약세. 회복 초입 신호. 주식이 가장 좋아하는 구간. 분할매수 탐색.",
    leadingDir: "up", coincidentDir: "down",
  },
  updatedAt: new Date().toISOString(),
  cached: false,
};

// ── Main Component ────────────────────────────────────────────────────────────
export function EconomicCycle() {
  const [data, setData] = useState<CycleData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stocks/cycle-indicators");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CycleData = await res.json();
      setData(json);
      setLastOk(new Date().toLocaleTimeString("ko-KR"));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchData]);

  const { indicators: ind, cycle } = data;
  const cfg = PHASE_CONFIG[cycle.phase];

  function fmt(v: number | null, dec = 1) {
    if (v == null) return "—";
    return v.toLocaleString("ko-KR", { maximumFractionDigits: dec });
  }

  const phaseOrder: Phase[] = ["recovery", "expansion", "slowdown", "recession"];

  return (
    <div className="space-y-5 pb-10">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            경기순환 사이클
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            선행/동행 2단계 자동 판정 · Yahoo Finance 실시간 · 5분 갱신
            {lastOk && <span className="ml-2 text-green-600">✓ {lastOk} 갱신</span>}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          API 일시적 오류 — 마지막 정상 데이터 표시 중 ({error})
        </div>
      )}

      {/* ─── 판정 카드 (최상단) ─── */}
      {data.verdict && <VerdictMatrix verdict={data.verdict} />}

      {/* ─── Clock + Phase Info ─── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-visible">
          <CardContent className="pt-6 pb-8">
            <CycleClock angle={cycle.angle} phase={cycle.phase} loading={loading} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <motion.div
            key={cycle.phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 border-2 shadow-sm"
            style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{cfg.emoji}</span>
              <div>
                <div className="text-lg font-extrabold" style={{ color: cfg.text }}>
                  현재 국면: {cfg.label}
                </div>
                <div className="text-xs" style={{ color: cfg.color }}>{cfg.sub}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-gray-500">종합 점수</div>
                <div className="text-2xl font-black" style={{ color: cycle.score >= 0 ? "#15803d" : "#dc2626" }}>
                  {cycle.score > 0 ? "+" : ""}{cycle.score}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{cfg.description}</p>
            <div className="rounded-xl p-2.5 bg-white bg-opacity-60">
              <div className="text-xs text-gray-500 mb-1 font-medium">📌 투자 전략</div>
              <div className="text-sm font-bold" style={{ color: cfg.strategyColor }}>{cfg.strategy}</div>
            </div>
          </motion.div>

          <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
            <div className="font-semibold text-gray-700 mb-1.5">🔄 사이클 흐름</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {phaseOrder.map((ph, i) => (
                <span key={ph} className="flex items-center gap-1">
                  <span
                    className="px-2 py-0.5 rounded-full font-bold text-[11px]"
                    style={{
                      backgroundColor: ph === cycle.phase ? PHASE_CONFIG[ph].bg : "#f3f4f6",
                      color: ph === cycle.phase ? PHASE_CONFIG[ph].text : "#9ca3af",
                      border: ph === cycle.phase ? `1.5px solid ${PHASE_CONFIG[ph].border}` : "1.5px solid #e5e7eb",
                      fontWeight: ph === cycle.phase ? 800 : 500,
                    }}
                  >
                    {PHASE_CONFIG[ph].label}
                  </span>
                  {i < 3 && <span className="text-gray-400">→</span>}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-200">
              ※ 주가는 경기보다 6~12개월 선행 반영 · 단독 매매 신호로 쓰면 위험
            </div>
          </div>
        </div>
      </div>

      {/* ─── 선행/동행 실시간 대시보드 ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
          <span>📡</span> 선행지수 · 동행지수 실시간 대시보드
          <span className="ml-auto text-[10px] font-normal text-gray-400">5분 자동 갱신</span>
        </h3>

        {/* 스코어 카드 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 선행지수 */}
          <div className="rounded-2xl border-2 p-4"
            style={{ borderColor: DIR_BORDER[data.leading?.direction ?? "flat"], backgroundColor: DIR_BG[data.leading?.direction ?? "flat"] }}>
            <div className="text-xs font-black uppercase tracking-widest mb-1"
              style={{ color: DIR_COLOR[data.leading?.direction ?? "flat"] }}>
              📡 선행지수 (미래 방향)
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black" style={{ color: DIR_COLOR[data.leading?.direction ?? "flat"] }}>
                {(data.leading?.score ?? 0) > 0 ? "+" : ""}{data.leading?.score ?? 0}
              </span>
              <span className="text-base font-bold mb-1" style={{ color: DIR_COLOR[data.leading?.direction ?? "flat"] }}>
                {DIR_LABEL[data.leading?.direction ?? "flat"]}
              </span>
            </div>
            {/* 스코어 바 */}
            <div className="w-full h-2.5 rounded-full bg-white/60 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: DIR_COLOR[data.leading?.direction ?? "flat"] }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, ((data.leading?.score ?? 0) + 4) / 8 * 100))}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="text-[11px] leading-4" style={{ color: DIR_COLOR[data.leading?.direction ?? "flat"] }}>
              {(data.leading?.direction ?? "flat") === "up"
                ? "앞으로 6~12개월 경기 개선 신호. 분할매수 탐색 구간."
                : (data.leading?.direction ?? "flat") === "down"
                ? "앞으로 경기 둔화 경고. 과열 업종 비중 축소 준비."
                : "방향 불명확. 관망 후 추가 신호 확인."}
            </div>
          </div>

          {/* 동행지수 */}
          <div className="rounded-2xl border-2 p-4"
            style={{ borderColor: DIR_BORDER[data.coincident?.direction ?? "flat"], backgroundColor: DIR_BG[data.coincident?.direction ?? "flat"] }}>
            <div className="text-xs font-black uppercase tracking-widest mb-1"
              style={{ color: DIR_COLOR[data.coincident?.direction ?? "flat"] }}>
              📊 동행지수 (현재 실제 경기)
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black" style={{ color: DIR_COLOR[data.coincident?.direction ?? "flat"] }}>
                {(data.coincident?.score ?? 0) > 0 ? "+" : ""}{data.coincident?.score ?? 0}
              </span>
              <span className="text-base font-bold mb-1" style={{ color: DIR_COLOR[data.coincident?.direction ?? "flat"] }}>
                {DIR_LABEL[data.coincident?.direction ?? "flat"]}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/60 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: DIR_COLOR[data.coincident?.direction ?? "flat"] }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, ((data.coincident?.score ?? 0) + 4) / 8 * 100))}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="text-[11px] leading-4" style={{ color: DIR_COLOR[data.coincident?.direction ?? "flat"] }}>
              {(data.coincident?.direction ?? "flat") === "up"
                ? "현재 경기 호조. 뉴스 좋음. 주의: 이미 선반영된 가격."
                : (data.coincident?.direction ?? "flat") === "down"
                ? "현재 경기 위축. 하지만 선행이 반등 중이면 매수 기회."
                : "현재 경기 보합. 방향성 확인 필요."}
            </div>
          </div>
        </div>

        {/* 선행지수 5대 구성 지표 */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3">
            선행지수 구성 지표 실시간 분해
          </div>
          <div className="space-y-2">
            {(data.leading?.breakdown ?? []).map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-36 shrink-0 text-xs text-blue-800 font-medium leading-tight">{b.name}</div>
                <div className="w-20 shrink-0 text-xs font-mono text-blue-700 text-right">{b.value}</div>
                <div className="flex-1 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: b.pts > 0 ? "#15803d" : b.pts < 0 ? "#dc2626" : "#9ca3af" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.abs(b.pts) * 33)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <ScoreBar pts={b.pts} />
                <div className="hidden md:block text-[10px] text-blue-600 w-32 shrink-0 leading-tight">{b.signal}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 동행지수 구성 지표 */}
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-xs font-black text-green-700 uppercase tracking-widest mb-3">
            동행지수 구성 지표 실시간 분해
          </div>
          <div className="space-y-2">
            {(data.coincident?.breakdown ?? []).map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-36 shrink-0 text-xs text-green-800 font-medium leading-tight">{b.name}</div>
                <div className="w-20 shrink-0 text-xs font-mono text-green-700 text-right">{b.value}</div>
                <div className="flex-1 h-1.5 rounded-full bg-green-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: b.pts > 0 ? "#15803d" : b.pts < 0 ? "#dc2626" : "#9ca3af" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.abs(b.pts) * 33)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <ScoreBar pts={b.pts} />
                <div className="hidden md:block text-[10px] text-green-600 w-32 shrink-0 leading-tight">{b.signal}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 밸류에이션 온도계 ─── */}
      {ind.ksNow != null && ind.ksMA200 != null && (() => {
        const gap = ((ind.ksNow! - ind.ksMA200!) / ind.ksMA200!) * 100;
        const pct = Math.min(100, Math.max(0, (gap + 20) / 70 * 100));
        const heatLabel = gap > 40 ? "극단적 과열 🔥" : gap > 25 ? "과열 주의 ⚠️" : gap > 10 ? "다소 부담" : gap > 0 ? "정상권" : "저평가 매수검토";
        const heatColor = gap > 40 ? "#dc2626" : gap > 25 ? "#d97706" : gap > 10 ? "#ca8a04" : "#15803d";
        return (
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
            <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-1.5">
              <span>🌡</span> 시장 온도계 — KOSPI vs 200일 이동평균선
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-black text-white" style={{ backgroundColor: heatColor }}>{heatLabel}</span>
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-orange-700 w-16 text-right shrink-0">저평가</span>
              <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-blue-200 via-green-200 via-yellow-200 to-red-400 relative overflow-hidden border border-orange-200">
                <motion.div
                  className="absolute top-0 bottom-0 w-3 rounded-full bg-gray-900 shadow"
                  initial={{ left: "0%" }}
                  animate={{ left: `calc(${pct}% - 6px)` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-orange-700 w-16 shrink-0">극단 과열</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div className="text-center p-2 rounded-lg bg-white border border-orange-200">
                <div className="font-black text-orange-900">{ind.ksNow?.toLocaleString("ko-KR")}</div>
                <div className="text-orange-600">KOSPI 현재</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-orange-200">
                <div className="font-black text-orange-900">{ind.ksMA200?.toLocaleString("ko-KR")}</div>
                <div className="text-orange-600">200일 이평선</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-orange-200">
                <div className="font-black" style={{ color: heatColor }}>+{gap.toFixed(1)}%</div>
                <div className="text-orange-600">이격도</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-orange-700 leading-5">
              ※ 과거 10년 평균 시가총액/M2 비율: 58% · 현재 추정: ~72% (14%p 초과) · GDP 대비 시가총액 +20% 수준
            </div>
          </div>
        );
      })()}

      {/* ─── 미래 시나리오 A/B/C ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>🔮</span> 미래 시나리오 — 월간 체크로 판단하세요
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              id: "A", label: "재평가 시작", color: "#15803d", bg: "#dcfce7", border: "#86efac",
              conditions: ["선행지수 반등 확인", "밸류에이션 정상화 (200MA 이격 10% 이하)", "원화 강세 전환"],
              action: "성장주 비중 점진 확대. 반도체 분할매수 시작.",
              icon: "🚀",
            },
            {
              id: "B", label: "조정 지속", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5",
              conditions: ["선행지수 하락 지속", "밸류에이션 여전히 부담 (이격 30%+)", "원화 약세 지속"],
              action: "방어주 유지. 현금 비중 확보. 저평가 고배당주 중심.",
              icon: "🛡",
            },
            {
              id: "C", label: "관망 (현재)", color: "#d97706", bg: "#fef3c7", border: "#fcd34d",
              conditions: ["선행지수 보합/불명확", "밸류에이션 애매한 구간", "원화 방향성 불명"],
              action: "현금 확보 + 관망. 방향 확인 후 단계적 대응.",
              icon: "⚖️",
            },
          ].map((s) => (
            <div key={s.id} className="rounded-2xl border-2 p-4" style={{ borderColor: s.border, backgroundColor: s.bg }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s.color }}>시나리오 {s.id}</span>
                <span className="font-black text-sm" style={{ color: s.color }}>{s.label}</span>
              </div>
              <div className="space-y-1 mb-3">
                {s.conditions.map((c, i) => (
                  <div key={i} className="text-[11px] flex items-start gap-1" style={{ color: s.color }}>
                    <span className="shrink-0">✦</span><span>{c}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] p-2 rounded-lg bg-white/70 leading-4" style={{ color: s.color }}>
                <span className="font-black">대응: </span>{s.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 2단계 투자전략 ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>📋</span> 2단계 투자전략
          <span className="ml-2 text-[10px] text-gray-400 font-normal">스마트 머니톡 분석 기반</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">1</span>
              <div>
                <div className="font-black text-blue-800">안정성 확보 (지금)</div>
                <div className="text-xs text-blue-600">조정 가능성 대비 방어 포트폴리오</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                { sector: "통신 서비스", action: "핵심", reason: "저평가 + 연 5% 배당 · 방어주 역할" },
                { sector: "필수소비재·헬스케어", action: "유지", reason: "경기 둔화 방어력 높음" },
                { sector: "배당주", action: "유지", reason: "배당으로 조정기 버티기" },
                { sector: "현금 비중 확대", action: "준비", reason: "다음 국면 대응 실탄 확보" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-blue-200">
                  <span className="font-black text-blue-700 text-xs w-20 shrink-0">{item.sector}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0">{item.action}</span>
                  <span className="text-[10px] text-blue-600">{item.reason}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">2</span>
              <div>
                <div className="font-black text-emerald-800">성장성 편입 (조건 충족 후)</div>
                <div className="text-xs text-emerald-600">조정 마무리 + 선행 반등 확인 시</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs mb-3">
              {[
                { sector: "반도체·IT", action: "분할매수", reason: "재고 소진 + 선행 반등 확인 후" },
                { sector: "자동차", action: "확대", reason: "ASP 개선 + 원화 강세 전환 시" },
                { sector: "조선·기계", action: "관심", reason: "수주잔고 + 신조선가 상승 확인" },
                { sector: "경기민감주 전반", action: "비중확대", reason: "회복 초입 2국면 진입 시" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-emerald-200">
                  <span className="font-black text-emerald-700 text-xs w-20 shrink-0">{item.sector}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold shrink-0">{item.action}</span>
                  <span className="text-[10px] text-emerald-600">{item.reason}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] p-2 rounded-lg bg-white/70 border border-emerald-200 text-emerald-700 leading-4">
              <span className="font-black">전환 신호:</span> 선행지수 반등 + 원화 강세 + 밸류에이션 정상화 (200MA 이격 10%↓)
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3대 리스크 실시간 모니터 ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>⚠️</span> 3대 리스크 실시간 모니터
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {(() => {
            const yen = (ind.vix ?? 20) < 16 && (ind.yieldSpread ?? 1) < 0.5;
            const slowdown = (ind.copperChange1mo ?? 0) < -3 || (ind.dxyChange1mo ?? 0) > 3;
            const aiBubble = ind.ksNow != null && ind.ksMA200 != null && ((ind.ksNow - ind.ksMA200) / ind.ksMA200 * 100) > 30 && (ind.vix ?? 20) < 18;
            return [
              {
                title: "엔 캐리 트레이드 청산",
                icon: "🇯🇵",
                risk: yen,
                status: yen ? "주의" : "안정",
                statusColor: yen ? "#d97706" : "#15803d",
                statusBg: yen ? "#fef3c7" : "#dcfce7",
                desc: "일본 금리 인상 시 전 세계 자산 급매도 → 신흥시장 타격",
                signal: `현재 VIX ${fmt(ind.vix, 1)} · 수익률곡선 ${fmt(ind.yieldSpread, 2)}%p`,
                action: yen ? "VIX 급등 모니터링. 엔화 강세 시 비중 축소 준비." : "당장 위험 낮음. 일본 BOJ 동향 주시.",
              },
              {
                title: "글로벌 경기 둔화",
                icon: "🌐",
                risk: slowdown,
                status: slowdown ? "경고" : "안정",
                statusColor: slowdown ? "#dc2626" : "#15803d",
                statusBg: slowdown ? "#fee2e2" : "#dcfce7",
                desc: "수출 의존 한국 경제에 직격탄. 특히 내년 하반기 집중 점검.",
                signal: `구리 1개월 ${fmt(ind.copperChange1mo, 1)}% · DXY 1개월 ${fmt(ind.dxyChange1mo, 1)}%`,
                action: slowdown ? "경기민감주 비중 축소. 방어주 비중 유지." : "구리·DXY 흐름 월간 점검 유지.",
              },
              {
                title: "미국 AI 관련주 조정",
                icon: "🤖",
                risk: aiBubble,
                status: aiBubble ? "주의" : "모니터링",
                statusColor: aiBubble ? "#d97706" : "#6b7280",
                statusBg: aiBubble ? "#fef3c7" : "#f3f4f6",
                desc: "AI 버블 꺼지면 글로벌 투자 심리 얼어붙어 코스피 동반 하락.",
                signal: `KOSPI/200MA 이격 ${ind.ksNow != null && ind.ksMA200 != null ? ((ind.ksNow - ind.ksMA200) / ind.ksMA200 * 100).toFixed(1) : "—"}% · VIX ${fmt(ind.vix, 1)}`,
                action: aiBubble ? "나스닥 조정 시 코스피 충격 대비. 현금 비중 유지." : "나스닥 고점 경신 지속 여부 월간 확인.",
              },
            ];
          })().map((r, i) => (
            <div key={i} className="rounded-2xl border-2 p-4" style={{ borderColor: r.statusColor, backgroundColor: r.risk ? "#fffbeb" : "#f9fafb" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{r.icon}</span>
                <div className="flex-1">
                  <div className="font-black text-gray-800 text-xs leading-4">{r.title}</div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ color: r.statusColor, backgroundColor: r.statusBg }}>{r.status}</span>
              </div>
              <div className="text-[11px] text-gray-600 leading-4 mb-2">{r.desc}</div>
              <div className="text-[10px] font-mono text-gray-400 mb-1">{r.signal}</div>
              <div className="text-[11px] font-semibold leading-4" style={{ color: r.statusColor }}>{r.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 월간 체크리스트 5개 ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>✅</span> 월간 선행지수 체크리스트 5개
        </h3>
        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {(() => {
            const checks = [
              {
                label: "선행지수 방향",
                detail: "순환변동치 상승 중인가?",
                pass: (data.leading?.direction ?? "flat") === "up",
                value: DIR_LABEL[data.leading?.direction ?? "flat"],
                passMsg: "상승 중 — 앞으로 경기 개선 신호",
                failMsg: "하락/보합 — 경기 둔화 가능성. 비중 축소 검토",
              },
              {
                label: "수익률곡선 정상화",
                detail: "10Y-3M 스프레드 > 0인가?",
                pass: (ind.yieldSpread ?? -1) > 0,
                value: `${fmt(ind.yieldSpread, 2)}%p`,
                passMsg: "정상 (장기>단기) — 경기 확장 지속 환경",
                failMsg: "역전/평탄 — 침체 위험 신호 경계",
              },
              {
                label: "구리 가격 보합 이상",
                detail: "1개월 변화율 -3% 초과인가?",
                pass: (ind.copperChange1mo ?? -5) > -3,
                value: `${(ind.copperChange1mo ?? 0) > 0 ? "+" : ""}${fmt(ind.copperChange1mo, 1)}%`,
                passMsg: "구리 안정 — 글로벌 수요 정상",
                failMsg: "구리 급락 — 글로벌 경기 둔화 경고",
              },
              {
                label: "원화 안정",
                detail: "1개월 환율 변화 -3~+2% 범위인가?",
                pass: (ind.krwChange1mo ?? 0) > -3 && (ind.krwChange1mo ?? 0) < 4,
                value: `${(ind.krwChange1mo ?? 0) > 0 ? "+" : ""}${fmt(ind.krwChange1mo, 1)}%`,
                passMsg: "환율 안정 — 외국인 이탈 위험 낮음",
                failMsg: "원화 급변 — 외국인 자금 이탈 또는 급격 유입 주의",
              },
              {
                label: "VIX 안정",
                detail: "공포지수 25 미만인가?",
                pass: (ind.vix ?? 30) < 25,
                value: fmt(ind.vix, 1),
                passMsg: "시장 안정 — 리스크온 환경 지속",
                failMsg: "공포 급등 — 위험자산 비중 축소 고려",
              },
            ];
            const passCount = checks.filter(c => c.pass).length;
            return (
              <>
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-600">종합 점검 결과</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: passCount >= 4 ? "#dcfce7" : passCount >= 3 ? "#fef3c7" : "#fee2e2",
                      color: passCount >= 4 ? "#15803d" : passCount >= 3 ? "#d97706" : "#dc2626",
                    }}>
                    {passCount}/5 통과 — {passCount >= 4 ? "적극적 대응 가능" : passCount >= 3 ? "선별적 접근" : "방어 유지"}
                  </span>
                </div>
                {checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-lg shrink-0 mt-0.5">{c.pass ? "✅" : "❌"}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-gray-800">{c.label}</span>
                        <span className="text-[10px] text-gray-400">{c.detail}</span>
                        <span className="ml-auto font-mono text-xs font-bold" style={{ color: c.pass ? "#15803d" : "#dc2626" }}>{c.value}</span>
                      </div>
                      <div className="text-[11px] mt-0.5 leading-4" style={{ color: c.pass ? "#15803d" : "#dc2626" }}>
                        {c.pass ? c.passMsg : c.failMsg}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* ─── Live Indicators ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>📡</span> 실시간 동적 확인 지표
          {data.cached && <span className="text-[10px] text-gray-400 font-normal">(캐시)</span>}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <IndicatorCard
            icon="😱" title="VIX 공포지수" value={fmt(ind.vix, 1)}
            interpretation={
              ind.vix == null ? "데이터 없음"
              : ind.vix < 13 ? "🟢 극도 안정 — 강세장"
              : ind.vix < 18 ? "🟢 안정 — 확장 국면"
              : ind.vix < 25 ? "🟡 보통 — 중립"
              : ind.vix < 35 ? "🟠 불안 — 주의"
              : "🔴 공포 — 침체 신호"
            }
          />
          <IndicatorCard
            icon="📈" title="미국 10Y 금리" value={fmt(ind.tnx, 2)}
            unit="%"
            interpretation={
              ind.tnx == null ? "데이터 없음"
              : ind.tnx > 5 ? "🔴 고금리 — 성장주 부담"
              : ind.tnx > 4 ? "🟡 중금리 — 선별 접근"
              : "🟢 완화적 — 성장주 유리"
            }
          />
          <IndicatorCard
            icon="📉" title="수익률곡선 스프레드" value={fmt(ind.yieldSpread, 2)}
            unit="%p"
            interpretation={
              ind.yieldSpread == null ? "데이터 없음"
              : ind.yieldSpread > 1 ? "🟢 가파름 — 경기 확장"
              : ind.yieldSpread > 0 ? "🟡 완만 — 성장 둔화 주의"
              : ind.yieldSpread > -0.5 ? "🟠 평탄/역전 경계"
              : "🔴 역전 — 침체 경고"
            }
          />
          <IndicatorCard
            icon="💵" title="원/달러 환율" value={ind.krw ? Math.round(ind.krw).toLocaleString("ko-KR") : "—"}
            change={ind.krwChange1mo}
            unit="원"
            interpretation={
              ind.krwChange1mo == null ? "데이터 없음"
              : ind.krwChange1mo > 2 ? "🔴 원화 약세 심화 — 리스크오프"
              : ind.krwChange1mo < -2 ? "🟢 원화 강세 — 리스크온"
              : "🟡 안정권"
            }
          />
          <IndicatorCard
            icon="🛢️" title="WTI 원유" value={fmt(ind.oil, 1)}
            change={ind.oilChange1mo}
            unit="$"
            interpretation={
              ind.oilChange1mo == null ? "데이터 없음"
              : ind.oilChange1mo > 8 ? "🟡 급등 — 수요 강세 but 비용 부담"
              : ind.oilChange1mo > 2 ? "🟢 상승 — 경기 회복 신호"
              : ind.oilChange1mo > -5 ? "🟡 보합 — 중립"
              : "🟠 하락 — 수요 위축 신호"
            }
          />
          <IndicatorCard
            icon="🔧" title="구리 (닥터코퍼)" value={fmt(ind.copper, 2)}
            change={ind.copperChange1mo}
            unit="$/lb"
            interpretation={
              ind.copperChange1mo == null ? "데이터 없음"
              : ind.copperChange1mo > 5 ? "🟢 급등 — 강한 성장 신호"
              : ind.copperChange1mo > 1 ? "🟢 상승 — 경기 호조"
              : ind.copperChange1mo > -2 ? "🟡 보합"
              : "🔴 하락 — 성장 둔화"
            }
          />
          <IndicatorCard
            icon="💱" title="달러인덱스 DXY" value={fmt(ind.dxy, 1)}
            change={ind.dxyChange1mo}
            interpretation={
              ind.dxyChange1mo == null ? "데이터 없음"
              : ind.dxyChange1mo < -2 ? "🟢 약달러 — 글로벌 유동성 완화"
              : ind.dxyChange1mo > 2 ? "🔴 강달러 — 유동성 긴축"
              : "🟡 보합 — 중립"
            }
          />
          <IndicatorCard
            icon="🇰🇷" title="KOSPI vs 이평선"
            value={ind.ksNow ? Math.round(ind.ksNow).toLocaleString("ko-KR") : "—"}
            interpretation={
              ind.ksNow == null ? "데이터 없음"
              : ind.ksMA50 && ind.ksNow > ind.ksMA50 && ind.ksMA200 && ind.ksNow > ind.ksMA200
                ? `🟢 50MA(${ind.ksMA50?.toLocaleString()})·200MA(${ind.ksMA200?.toLocaleString()}) 위 — 강세`
              : ind.ksMA200 && ind.ksNow > ind.ksMA200
                ? `🟡 200MA(${ind.ksMA200?.toLocaleString()}) 위 — 중립`
              : `🔴 200MA(${ind.ksMA200?.toLocaleString()}) 아래 — 약세`
            }
          />
        </div>
      </div>

      {/* ─── Sector Recommendations ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>🏭</span> 국면별 업종 전략
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {phaseOrder.map((ph) => {
            const pcfg = PHASE_CONFIG[ph];
            const isActive = ph === cycle.phase;
            return (
              <motion.div
                key={ph}
                className="rounded-xl border-2 overflow-hidden"
                style={{
                  borderColor: isActive ? pcfg.border : "#e5e7eb",
                  backgroundColor: isActive ? pcfg.bg : "#fafafa",
                  boxShadow: isActive ? `0 0 0 2px ${pcfg.border}` : "none",
                }}
                animate={{ scale: isActive ? 1.02 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="px-3 py-2 font-bold text-sm flex items-center gap-1.5"
                  style={{ backgroundColor: isActive ? pcfg.bg : "#f3f4f6", color: pcfg.text }}
                >
                  {pcfg.emoji} {pcfg.label}
                  {isActive && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-extrabold" style={{ backgroundColor: pcfg.border, color: pcfg.text }}>
                      현재
                    </span>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {pcfg.sectors.map((s) => {
                    const st = ACTION_STYLE[s.action];
                    return (
                      <div key={s.name} className="flex items-center justify-between gap-1">
                        <span className="text-[12px] text-gray-700 font-medium">{s.name}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}
                        >
                          {s.action}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Score Breakdown ─── */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <span>🧮</span> 선행/동행 점수 산출 근거
          <span className="ml-auto text-xs font-normal text-gray-400">
            선행 {data.leading?.score > 0 ? "+" : ""}{data.leading?.score ?? "—"} / 동행 {data.coincident?.score > 0 ? "+" : ""}{data.coincident?.score ?? "—"}
          </span>
        </h3>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-2.5 text-gray-600 font-semibold">지표</th>
                <th className="text-center p-2.5 text-gray-600 font-semibold">현재값</th>
                <th className="text-left p-2.5 text-gray-600 font-semibold">신호</th>
                <th className="text-center p-2.5 text-gray-600 font-semibold">점수</th>
              </tr>
            </thead>
            <tbody>
              {/* 선행지표 그룹 */}
              <tr className="bg-blue-50 border-b border-blue-100">
                <td colSpan={4} className="px-2.5 py-1.5 text-[10px] font-extrabold text-blue-700 uppercase tracking-wide">
                  📡 선행지표 (Leading) — 미래 방향
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[9px]"
                    style={{
                      backgroundColor: DIR_BG[data.leading?.direction ?? "flat"],
                      color: DIR_COLOR[data.leading?.direction ?? "flat"],
                    }}>
                    {DIR_LABEL[data.leading?.direction ?? "flat"]}
                  </span>
                </td>
              </tr>
              {(data.leading?.breakdown ?? []).map((b, i) => (
                <tr key={`l-${i}`} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="p-2.5 text-gray-700 font-medium">{b.name}</td>
                  <td className="p-2.5 text-center font-mono text-gray-800">{b.value}</td>
                  <td className="p-2.5 text-gray-600">{b.signal}</td>
                  <td className="p-2.5"><div className="flex justify-center"><ScoreBar pts={b.pts} /></div></td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-b border-blue-200">
                <td colSpan={3} className="p-2 text-right text-[11px] font-bold text-blue-700">선행 소계</td>
                <td className="p-2 text-center">
                  <span className="font-black text-sm px-2 py-0.5 rounded"
                    style={{
                      color: (data.leading?.score ?? 0) > 0 ? "#1d4ed8" : (data.leading?.score ?? 0) < 0 ? "#dc2626" : "#6b7280",
                      backgroundColor: (data.leading?.score ?? 0) > 0 ? "#dbeafe" : (data.leading?.score ?? 0) < 0 ? "#fee2e2" : "#f3f4f6",
                    }}>
                    {(data.leading?.score ?? 0) > 0 ? "+" : ""}{data.leading?.score ?? 0}
                  </span>
                </td>
              </tr>

              {/* 동행지표 그룹 */}
              <tr className="bg-green-50 border-b border-green-100">
                <td colSpan={4} className="px-2.5 py-1.5 text-[10px] font-extrabold text-green-700 uppercase tracking-wide">
                  📊 동행지표 (Coincident) — 현재 경기
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[9px]"
                    style={{
                      backgroundColor: DIR_BG[data.coincident?.direction ?? "flat"],
                      color: DIR_COLOR[data.coincident?.direction ?? "flat"],
                    }}>
                    {DIR_LABEL[data.coincident?.direction ?? "flat"]}
                  </span>
                </td>
              </tr>
              {(data.coincident?.breakdown ?? []).map((b, i) => (
                <tr key={`c-${i}`} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                  <td className="p-2.5 text-gray-700 font-medium">{b.name}</td>
                  <td className="p-2.5 text-center font-mono text-gray-800">{b.value}</td>
                  <td className="p-2.5 text-gray-600">{b.signal}</td>
                  <td className="p-2.5"><div className="flex justify-center"><ScoreBar pts={b.pts} /></div></td>
                </tr>
              ))}
              <tr className="bg-green-50 border-b border-green-200">
                <td colSpan={3} className="p-2 text-right text-[11px] font-bold text-green-700">동행 소계</td>
                <td className="p-2 text-center">
                  <span className="font-black text-sm px-2 py-0.5 rounded"
                    style={{
                      color: (data.coincident?.score ?? 0) > 0 ? "#15803d" : (data.coincident?.score ?? 0) < 0 ? "#dc2626" : "#6b7280",
                      backgroundColor: (data.coincident?.score ?? 0) > 0 ? "#dcfce7" : (data.coincident?.score ?? 0) < 0 ? "#fee2e2" : "#f3f4f6",
                    }}>
                    {(data.coincident?.score ?? 0) > 0 ? "+" : ""}{data.coincident?.score ?? 0}
                  </span>
                </td>
              </tr>

              {/* 총합 */}
              <tr className="bg-gray-50">
                <td colSpan={3} className="p-2.5 text-right font-bold text-gray-700">종합 점수 (선행+동행)</td>
                <td className="p-2.5 text-center">
                  <span
                    className="font-black text-sm px-2 py-0.5 rounded"
                    style={{
                      color: cycle.score >= 3 ? "#d97706" : cycle.score >= 0 ? "#15803d" : cycle.score >= -3 ? "#2563eb" : "#dc2626",
                      backgroundColor: cycle.score >= 3 ? "#fef3c7" : cycle.score >= 0 ? "#dcfce7" : cycle.score >= -3 ? "#dbeafe" : "#fee2e2",
                    }}
                  >
                    {cycle.score > 0 ? "+" : ""}{cycle.score}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Key Principles ─── */}
      <div className="rounded-xl p-4 border-2 border-slate-200 bg-slate-800">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#f8fafc" }}>
          <span>⚠️</span> 경기순환시계 활용 핵심 원칙
        </h3>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {[
            { icon: "1️⃣", text: "단독 매매 신호가 아닌 \"비중 조절\" 도구로 사용" },
            { icon: "2️⃣", text: "주가는 경기보다 6~12개월 먼저 움직임 (선반영) — 선행지수가 핵심" },
            { icon: "3️⃣", text: "최소 3개 이상 지표가 같은 방향일 때 신뢰도 상승" },
            { icon: "4️⃣", text: "몰빵 금지 — 비중을 10~20%씩 분할 조정" },
          ].map((p) => (
            <div key={p.icon} className="flex items-start gap-2 rounded-lg p-2.5" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
              <span className="text-sm shrink-0">{p.icon}</span>
              <span style={{ color: "#e2e8f0", lineHeight: "1.5" }}>{p.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 text-[11px]" style={{ borderTop: "1px solid rgba(255,255,255,0.2)", color: "#94a3b8" }}>
          데이터 출처: Yahoo Finance (^VIX · CL=F · HG=F · ^TNX · ^IRX · KRW=X · DX-Y.NYB · ^KS11) · 5분 캐시 · 실시간 자동갱신
        </div>
      </div>

      {/* ─── 팟캐스트 딥다이브: 마감형 투자 심리 × 경기순환시계 ─── */}
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700">
          <span className="text-2xl">🎧</span>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">팟캐스트 딥다이브 × 경기순환시계</div>
            <div className="text-sm font-bold text-white">마감형 인간이 주식 고점에서 물리는 이유 — 심리학 × 거시경제</div>
          </div>
        </div>

        {/* 핵심 연결고리 */}
        <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">핵심 연결: 같은 심리 구조</div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 p-3 rounded-xl bg-orange-50 border-2 border-orange-200 text-center">
              <div className="text-xl mb-1">🎓</div>
              <div className="font-black text-orange-800 text-sm mb-1">마감형 학생</div>
              <div className="text-xs text-orange-700 leading-5">과제를 마감 직전까지 미루다가 밤새워 급히 제출</div>
            </div>
            <div className="text-xl font-black text-slate-400">=</div>
            <div className="flex-1 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-center">
              <div className="text-xl mb-1">📈</div>
              <div className="font-black text-red-800 text-sm mb-1">마감형 투자자</div>
              <div className="text-xs text-red-700 leading-5">동행지수 최고조(뉴스 축제)일 때 심리적 불편함 제로 → 급하게 고점 추격 매수</div>
            </div>
          </div>
          <div className="mt-3 text-center text-xs font-black text-slate-700 bg-white rounded-xl py-2 px-4 border border-slate-200">
            공통 구조: 현재의 불편함을 피하려다 미래에 폭탄을 맞는다
          </div>
        </div>

        {/* 동행지수 vs 선행지수 × 마인드 */}
        <div>
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">동행지수 vs 선행지수 — 마인드 차이</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 동행지수 = 결핍 마인드 */}
            <div className="p-4 rounded-2xl border-2 border-red-300 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">동행지수</span>
                <span className="text-xs font-black text-red-700">결핍 마인드</span>
              </div>
              <div className="text-sm font-black text-red-800 mb-2">📊 당장 편하고 축제만 보는 마인드</div>
              <div className="space-y-1.5 text-xs text-red-800 leading-5">
                <div>• 눈앞의 호황 수치·뉴스·주변 수익 소문만 본다</div>
                <div>• 심리적 불편함이 제로일 때 행동 → 이미 늦은 타이밍</div>
                <div>• 동행지수 상승 = <strong>확장 후반·피크 구간</strong>에서 매수 확대</div>
                <div>• 결과: 고점 물림 → 패닉 손절 or 수년 방치</div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-red-800 text-white text-[11px] font-black text-center">
                ⚠️ 동행지수 좋을 때 매수 확대 = 결핍 마인드 함정
              </div>
            </div>

            {/* 선행지수 = 풍족 마인드로 가는 길 */}
            <div className="p-4 rounded-2xl border-2 border-blue-300 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">선행지수</span>
                <span className="text-xs font-black text-blue-700">풍족 마인드로 가는 신호</span>
              </div>
              <div className="text-sm font-black text-blue-800 mb-2">📡 확장 후반 → 매수 축소 신호</div>
              <div className="space-y-1.5 text-xs text-blue-800 leading-5">
                <div>• 선행지수가 꺾이면 동행지수가 아무리 좋아도 비중 축소</div>
                <div>• 불편한 진실(선행 하락)을 직면할 수 있는 용기 필요</div>
                <div>• 선행지수 하락 = <strong>확장 후반·피크 경고</strong> → 매수 축소</div>
                <div>• 결과: 고점에서 나와 더 좋은 자리 준비</div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-blue-800 text-white text-[11px] font-black text-center">
                📡 선행지수 하락 확인 시 = 확장 후반 매수 축소
              </div>
            </div>
          </div>
        </div>

        {/* 풍족 마인드 정의 */}
        <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">풍족 마인드</span>
            <span className="text-sm font-black text-emerald-800">동행지수 + 선행지수 동시에 본다</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
              <div className="text-xl mb-1">🤝</div>
              <div className="text-xs font-black text-emerald-800 mb-1">동행지수도 인정</div>
              <div className="text-[11px] text-emerald-700 leading-4">현재 경기 좋음을 부정하지 않는다. 축제는 축제로 인정.</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
              <div className="text-xl mb-1">📡</div>
              <div className="text-xs font-black text-emerald-800 mb-1">선행지수로 미래 본다</div>
              <div className="text-[11px] text-emerald-700 leading-4">동시에 선행지수 하락 신호도 읽는다. 불편한 진실 회피 안 함.</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
              <div className="text-xl mb-1">🌱</div>
              <div className="text-xs font-black text-emerald-800 mb-1">불확실 인정 + 꾸준한 투자</div>
              <div className="text-[11px] text-emerald-700 leading-4">확실하지 않아도 버틸 수 있다. 흔들리지 않고 꾸준히.</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-800 text-white text-xs font-black text-center leading-5">
            풍족 마인드 = 동행지수(현재 좋음)도 인정 + 선행지수(미래 하락)도 같이 보며 → 불확실성을 인정하고 버틸 수 있고 꾸준한 투자
          </div>
        </div>

        {/* 2026.07 현재 상황 — 확장 후반 */}
        <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50">
          <div className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">📌 2026년 7월 현재 — 확장 후반 진단</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {[
              { icon: "🇺🇸", label: "미국 연준 금리 동결", sub: "3.5~3.75% — 인플레 2% 미달성. 무조건적 금리 인하 기대 없음" },
              { icon: "📡", label: "한국 선행지수 보합·상승 멈춤", sub: "미래 방향 동력 소진. 더 오를 근거 약해짐" },
              { icon: "📊", label: "한국 동행지수 정점 후 하락 전환", sub: "현재 경제 수치는 좋아 보이나 고점 꺾임 시작" },
              { icon: "💾", label: "반도체: 확장 후반 피크 구간", sub: "KOSPI 쏠림 + 대중 몰리는 시기 = 매수 확대 아닌 매수 축소" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-white border border-amber-200">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <div className="font-black text-amber-900 text-xs">{item.label}</div>
                  <div className="text-[11px] text-amber-700 leading-4 mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-amber-700 text-white text-[11px] font-black text-center">현재 국면<br/>3→4국면 전환</div>
            <div className="p-2 rounded-lg bg-red-700 text-white text-[11px] font-black text-center">반도체<br/>매수 축소</div>
            <div className="p-2 rounded-lg bg-emerald-700 text-white text-[11px] font-black text-center">스탠스<br/>중립·선별적</div>
          </div>
        </div>

        {/* 업종별 선행지표 */}
        <div>
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">업종별 선행지표 — 마감형 함정 vs 진짜 신호</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                sector: "💾 반도체", color: "bg-violet-50 border-violet-300", tc: "text-violet-800",
                trap: "사상 최대 실적·수출 뉴스 나올 때 매수 → 이미 피크",
                signal: "메모리 가격 하락세 둔화 + 고객사 악성 재고 소진 시작",
                key: "'덜 나빠지는 순간'이 선행 신호. 적자 최대일 때가 매수 타이밍.",
              },
              {
                sector: "🚗 자동차", color: "bg-sky-50 border-sky-300", tc: "text-sky-800",
                trap: "판매량 최대치 뉴스 나올 때 매수",
                signal: "ASP(평균 판매 단가) 상승 + 원화 약세 환율",
                key: "많이 파는 것보다 비싸게 파는 것이 핵심. 원화 약세 = 수출 이익 뻥튀기.",
              },
              {
                sector: "🔋 2차전지", color: "bg-emerald-50 border-emerald-300", tc: "text-emerald-800",
                trap: "'전기차 미래' 스토리만 보고 매수 → 채찍 효과 직격",
                signal: "유럽·미국 전기차 실제 인도량 반등 + 배터리 재고 축소",
                key: "스토리가 아닌 실제 인도량 + 재고 정상화 숫자로 팩트 체크 후 진입.",
              },
              {
                sector: "🚢 조선", color: "bg-indigo-50 border-indigo-300", tc: "text-indigo-800",
                trap: "현재 재무제표 영업이익 최대치 뉴스 보고 매수",
                signal: "수주잔고 증가 + 신조선가 지수 상승",
                key: "오늘 영업이익 = 3년 전 수주 결과. 수주잔고 꽉 차면 오늘 적자여도 주가 폭등.",
              },
            ].map((s, i) => (
              <div key={i} className={`p-4 rounded-2xl border-2 ${s.color}`}>
                <div className={`font-black text-sm mb-2 ${s.tc}`}>{s.sector}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <span className="font-black text-red-700">⚠️ 마감형 함정: </span>
                    <span className="text-red-800">{s.trap}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 border border-current/20">
                    <span className="font-black opacity-70">📡 진짜 선행 신호: </span>
                    <span>{s.signal}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="font-black text-emerald-700">💡 </span>
                    <span className="text-emerald-800">{s.key}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 핵심 인용구 */}
        <div className="space-y-3">
          {[
            {
              text: "폭우가 쏟아지다가 빗줄기가 살짝 가늘어지는 순간, 그 공포 속에서 기초 공사에 돈 던질 때 수익이 나온다.",
              sub: "맑은 날 완성된 건물을 제값 주고 살 때(동행지수 최고조)가 아니라",
            },
            {
              text: "투자 대가들이 군중과 다른 길을 걸을 수 있는 이유는 미래를 신들린 듯 맞춰서가 아니다. 현재 암울한 지표들이 뿜어내는 심리적 불편함을 피하지 않고 마주할 수 있는 마인드셋 때문이다.",
              sub: "데이터를 기반으로 한 진정한 풍족 마인드 — 동행+선행 동시에 보기",
            },
            {
              text: "오늘의 뉴스를 보고 내일의 주식을 사려는 건 이미 늦은 것이다. 시장은 철저하게 미래의 가치를 현재로 당겨와서 가격을 매기는 시스템이다.",
              sub: "선행지수가 동행지수보다 중요한 이유",
            },
          ].map((q, i) => (
            <div key={i} className="p-4 rounded-2xl border-l-4 border-slate-600 bg-slate-900">
              <p className="text-white text-sm leading-7 font-semibold italic mb-1">"{q.text}"</p>
              <p className="text-slate-400 text-xs">{q.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
