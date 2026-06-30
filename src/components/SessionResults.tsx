/**
 * Session Results Component
 * Displays comprehensive training session results based on IM metrics
 */

'use client';

import type { SessionResults as SessionResultsType, InputType } from '@/types/evaluation';
import { getClassInfo, formatTA, evaluateBalance } from '@/utils/evaluator';
import { BODY_PART_HEX } from '@/utils/bodyPartColors';

const FEEDBACK_PALETTE: Record<string, string> = {
  perfect: '#1f9d57',
  excellent: '#5bb98c',
  good: '#7ca9af',
  fair: '#e0b454',
  poor: '#e08a3c',
  miss: '#d9647a',
};

interface SessionResultsProps {
  results: SessionResultsType;
  onRestart: () => void;
  onExit: () => void;
}

export default function SessionResults({ results, onRestart, onExit }: SessionResultsProps) {
  const classInfo = getClassInfo(results.classLevel);

  return (
    <div className="fixed inset-0 bg-tt-bg z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-5 sm:p-8">
        <div className="max-w-3xl w-full my-8 space-y-4">

          {/* ── 상단 헤더 ── */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-2xl font-bold text-tt-heading">훈련 결과</h1>
              <p className="text-tt-light-muted text-sm mt-0.5">세션이 완료되었습니다</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={onRestart}
                className="px-5 py-2.5 bg-tt-teal hover:bg-tt-teal-dark text-white rounded-xl font-semibold text-sm transition-all"
              >
                다시 훈련
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 bg-tt-card hover:bg-tt-border text-tt-muted-alt rounded-xl font-semibold text-sm transition-all border border-tt-border-alt"
              >
                메인으로
              </button>
            </div>
          </div>

          {/* ── 핵심 지표: TA & Class (다크 패널) ── */}
          <div className="bg-tt-dark-panel rounded-2xl p-5 grid grid-cols-2 gap-4 text-white">
            {/* Task Average */}
            <div>
              <div className="text-xs font-semibold text-tt-dark-label uppercase tracking-wider mb-3">
                Task Average (TA)
              </div>
              <div className="font-mono text-5xl font-black tabular-nums leading-none mb-1">
                {formatTA(results.taskAverage)}
              </div>
              <div className="text-sm text-tt-dark-label-alt mt-2">평균 타이밍 편차 (ms)</div>
            </div>

            {/* Class Level */}
            <div className="border-l border-white/10 pl-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-tt-dark-label">
                Class Level
              </div>
              <div className="font-mono text-5xl font-black leading-none mb-1 text-[#2dd4bf]">
                Class {results.classLevel}
              </div>
              <div className="text-sm font-semibold mt-2 text-tt-dark-label-alt">
                {classInfo?.label || '평균'}
              </div>
            </div>
          </div>

          {/* ── 3대 지표 ── */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="평균 점수" value={results.averagePoints.toFixed(1)} unit="/ 100" accent="#0f6e78" />
            <MetricCard label="일관성" value={results.consistency.toFixed(1)} unit="/ 100" accent="#1f9d57" />
            <MetricCard label="응답률" value={`${results.responseRate.toFixed(1)}%`} unit={`${results.responsiveBeats}/${results.totalBeats}`} accent="#e89a1c" />
          </div>

          {/* ── 타이밍 분포 ── */}
          <div className="bg-tt-card border border-tt-border-alt rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-tt-light-muted uppercase tracking-wider mb-4">타이밍 분포</h2>
            <div className="space-y-3">
              <DistributionBar label="조기 반응 (Early)" pct={results.earlyHitPercent} color="#2f6bd8" />
              <DistributionBar label="정확 (On Target)" pct={results.onTargetPercent} color="#1f9d57" />
              <DistributionBar label="지연 반응 (Late)" pct={results.lateHitPercent} color="#e89a1c" />
            </div>
            <div className="mt-4 pt-3 border-t border-tt-border-soft flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-tt-light-muted-alt" />
              <span className="text-sm text-tt-muted">
                균형 상태: <span className="text-tt-heading font-semibold">{evaluateBalance(results.earlyHitPercent, results.lateHitPercent)}</span>
              </span>
            </div>
          </div>

          {/* ── 피드백 분포 ── */}
          <div className="bg-tt-card border border-tt-border-alt rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-tt-light-muted uppercase tracking-wider mb-4">피드백 분포</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'Perfect', count: results.perfectCount, color: FEEDBACK_PALETTE.perfect },
                { label: 'Excellent', count: results.excellentCount, color: FEEDBACK_PALETTE.excellent },
                { label: 'Good', count: results.goodCount, color: FEEDBACK_PALETTE.good },
                { label: 'Fair', count: results.fairCount, color: FEEDBACK_PALETTE.fair },
                { label: 'Poor', count: results.poorCount, color: FEEDBACK_PALETTE.poor },
                { label: 'Miss', count: results.missCount, color: FEEDBACK_PALETTE.miss },
              ].map(({ label, count, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center border"
                  style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}
                >
                  <div className="text-xs font-semibold mb-1.5" style={{ color }}>{label}</div>
                  <div className="font-mono text-2xl font-black" style={{ color }}>{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 신체 부위별 통계 ── */}
          {Object.keys(results.inputTypeStats).length > 0 && (
            <div className="bg-tt-card border border-tt-border-alt rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-tt-light-muted uppercase tracking-wider mb-4">신체 부위별 통계</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(results.inputTypeStats).map(([type, stats]) => (
                  <InputTypeCard key={type} type={type as InputType} stats={stats!} />
                ))}
              </div>
            </div>
          )}

          {/* ── 오류 정보 ── */}
          {(results.missedBeats > 0 || results.wrongInputBeats > 0) && (
            <div className="bg-tt-card border border-tt-border-alt rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-tt-light-muted uppercase tracking-wider mb-4">오류 정보</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-xs font-semibold text-red-500 mb-1.5">놓친 비트</div>
                  <div className="font-mono text-3xl font-black text-red-500">{results.missedBeats}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                  <div className="text-xs font-semibold text-orange-500 mb-1.5">잘못된 입력</div>
                  <div className="font-mono text-3xl font-black text-orange-500">{results.wrongInputBeats}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── 개선도 ── */}
          {results.taImprovement !== undefined && (
            <div className="bg-tt-card border border-tt-border-alt rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-tt-teal uppercase tracking-wider mb-4">이전 세션 대비 개선도</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs font-semibold text-tt-muted mb-1.5">TA 개선</div>
                  <div className="font-mono text-4xl font-black text-tt-heading">
                    {results.taImprovement > 0 ? '↓' : '↑'} {Math.abs(results.taImprovement).toFixed(1)}%
                  </div>
                </div>
                {results.classImprovement !== undefined && (
                  <div className="text-center">
                    <div className="text-xs font-semibold text-tt-muted mb-1.5">Class 변화</div>
                    <div className="font-mono text-4xl font-black text-tt-heading">
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
      className="rounded-xl p-4 border bg-tt-card"
      style={{ borderColor: `${accent}40` }}
    >
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>{label}</div>
      <div className="font-mono text-2xl font-black" style={{ color: accent }}>{value}</div>
      <div className="text-xs mt-1 text-tt-light-muted">{unit}</div>
    </div>
  );
}

function DistributionBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-tt-muted">{label}</span>
        <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-tt-border rounded-full overflow-hidden">
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
  const LABELS: Record<InputType, string> = {
    'left-hand': '왼손',
    'right-hand': '오른손',
    'left-foot': '왼발',
    'right-foot': '오른발',
  };
  const color = BODY_PART_HEX[type];

  return (
    <div
      className="rounded-xl p-4 border bg-tt-card"
      style={{ borderColor: `${color}40` }}
    >
      <div className="text-center mb-3">
        <div className="text-sm font-bold" style={{ color }}>{LABELS[type]}</div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-tt-light-muted">
          <span>입력 횟수</span>
          <span className="font-bold text-tt-heading">{stats.count}</span>
        </div>
        <div className="flex justify-between text-tt-light-muted">
          <span>평균 편차</span>
          <span className="font-bold text-tt-heading">{stats.averageDeviation.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between text-tt-light-muted">
          <span>평균 점수</span>
          <span className="font-bold text-tt-heading">{stats.averagePoints.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
