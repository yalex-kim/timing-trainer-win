/**
 * Session Results Component
 * Displays comprehensive training session results based on IM metrics
 */

'use client';

import type { SessionResults as SessionResultsType, InputType } from '@/types/evaluation';
import { getClassInfo, formatTA, evaluateBalance } from '@/utils/evaluator';

interface SessionResultsProps {
  results: SessionResultsType;
  onRestart: () => void;
  onExit: () => void;
}

export default function SessionResults({ results, onRestart, onExit }: SessionResultsProps) {
  const classInfo = getClassInfo(results.classLevel);

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-5 sm:p-8">
        <div className="max-w-3xl w-full my-8 space-y-4">

          {/* ── 상단 헤더 ── */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-2xl font-bold text-white">훈련 결과</h1>
              <p className="text-slate-500 text-sm mt-0.5">세션이 완료되었습니다</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={onRestart}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all"
              >
                다시 훈련
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-all border border-slate-700"
              >
                메인으로
              </button>
            </div>
          </div>

          {/* ── 핵심 지표: TA & Class ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Task Average */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Task Average (TA)
              </div>
              <div className="text-5xl font-black text-white tabular-nums leading-none mb-1">
                {formatTA(results.taskAverage)}
              </div>
              <div className="text-sm text-slate-500 mt-2">평균 타이밍 편차 (ms)</div>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-400">낮을수록 정확한 타이밍</span>
                </div>
              </div>
            </div>

            {/* Class Level */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ backgroundColor: `${classInfo?.color || '#6366f1'}18`, border: `1px solid ${classInfo?.color || '#6366f1'}30` }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: `${classInfo?.color || '#6366f1'}99` }}>
                Class Level
              </div>
              <div className="text-5xl font-black leading-none mb-1" style={{ color: classInfo?.color || '#6366f1' }}>
                Class {results.classLevel}
              </div>
              <div className="text-sm font-semibold mt-2" style={{ color: classInfo?.color || '#6366f1' }}>
                {classInfo?.label || '평균'}
              </div>
              {classInfo?.description && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: `${classInfo.color}20` }}>
                  <span className="text-xs" style={{ color: `${classInfo.color}80` }}>{classInfo.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3대 지표 ── */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="평균 점수" value={results.averagePoints.toFixed(1)} unit="/ 100" accent="#8b5cf6" />
            <MetricCard label="일관성" value={results.consistency.toFixed(1)} unit="/ 100" accent="#10b981" />
            <MetricCard label="응답률" value={`${results.responseRate.toFixed(1)}%`} unit={`${results.responsiveBeats}/${results.totalBeats}`} accent="#f59e0b" />
          </div>

          {/* ── 타이밍 분포 ── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">타이밍 분포</h2>
            <div className="space-y-3">
              <DistributionBar label="조기 반응 (Early)"  pct={results.earlyHitPercent}  color="#60a5fa" />
              <DistributionBar label="정확 (On Target)"   pct={results.onTargetPercent}   color="#34d399" />
              <DistributionBar label="지연 반응 (Late)"   pct={results.lateHitPercent}    color="#fb923c" />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-sm text-slate-400">
                균형 상태: <span className="text-white font-semibold">{evaluateBalance(results.earlyHitPercent, results.lateHitPercent)}</span>
              </span>
            </div>
          </div>

          {/* ── 피드백 분포 ── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">피드백 분포</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'Perfect',   count: results.perfectCount,   color: '#10b981' },
                { label: 'Excellent', count: results.excellentCount, color: '#22c55e' },
                { label: 'Good',      count: results.goodCount,      color: '#84cc16' },
                { label: 'Fair',      count: results.fairCount,      color: '#eab308' },
                { label: 'Poor',      count: results.poorCount,      color: '#f97316' },
                { label: 'Miss',      count: results.missCount,      color: '#ef4444' },
              ].map(({ label, count, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center border"
                  style={{ backgroundColor: `${color}15`, borderColor: `${color}25` }}
                >
                  <div className="text-xs font-semibold mb-1.5" style={{ color: `${color}cc` }}>{label}</div>
                  <div className="text-2xl font-black" style={{ color }}>{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 신체 부위별 통계 ── */}
          {Object.keys(results.inputTypeStats).length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">신체 부위별 통계</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(results.inputTypeStats).map(([type, stats]) => (
                  <InputTypeCard key={type} type={type as InputType} stats={stats!} />
                ))}
              </div>
            </div>
          )}

          {/* ── 오류 정보 ── */}
          {(results.missedBeats > 0 || results.wrongInputBeats > 0) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">오류 정보</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 text-center">
                  <div className="text-xs font-semibold text-red-400 mb-1.5">놓친 비트</div>
                  <div className="text-3xl font-black text-red-400">{results.missedBeats}</div>
                </div>
                <div className="bg-orange-900/20 border border-orange-800/30 rounded-xl p-4 text-center">
                  <div className="text-xs font-semibold text-orange-400 mb-1.5">잘못된 입력</div>
                  <div className="text-3xl font-black text-orange-400">{results.wrongInputBeats}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── 개선도 ── */}
          {results.taImprovement !== undefined && (
            <div className="bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border border-violet-800/30 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-4">이전 세션 대비 개선도</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs font-semibold text-violet-400 mb-1.5">TA 개선</div>
                  <div className="text-4xl font-black text-white">
                    {results.taImprovement > 0 ? '↓' : '↑'} {Math.abs(results.taImprovement).toFixed(1)}%
                  </div>
                </div>
                {results.classImprovement !== undefined && (
                  <div className="text-center">
                    <div className="text-xs font-semibold text-violet-400 mb-1.5">Class 변화</div>
                    <div className="text-4xl font-black text-white">
                      {results.classImprovement > 0 ? '↑' : results.classImprovement < 0 ? '↓' : '→'} {Math.abs(results.classImprovement)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 하단 여백 */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 보조 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: `${accent}12`, borderColor: `${accent}25` }}
    >
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: `${accent}99` }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: accent }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: `${accent}60` }}>{unit}</div>
    </div>
  );
}

function DistributionBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function InputTypeCard({
  type,
  stats,
}: {
  type: InputType;
  stats: { count: number; averageDeviation: number; averagePoints: number };
}) {
  const typeConfig: Record<InputType, { label: string; emoji: string; color: string }> = {
    'left-hand':  { label: '왼손',  emoji: '👈', color: '#60a5fa' },
    'right-hand': { label: '오른손', emoji: '👉', color: '#f87171' },
    'left-foot':  { label: '왼발',  emoji: '🦵', color: '#34d399' },
    'right-foot': { label: '오른발', emoji: '🦵', color: '#fbbf24' },
  };
  const cfg = typeConfig[type];

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}20` }}
    >
      <div className="text-center mb-3">
        <div className="text-2xl mb-0.5">{cfg.emoji}</div>
        <div className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>입력 횟수</span>
          <span className="font-bold text-white">{stats.count}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>평균 편차</span>
          <span className="font-bold text-white">{stats.averageDeviation.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>평균 점수</span>
          <span className="font-bold text-white">{stats.averagePoints.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
