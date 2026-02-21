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

export default function SessionResults({
  results,
  onRestart,
  onExit,
}: SessionResultsProps) {
  const classInfo = getClassInfo(results.classLevel);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 sm:p-8">
        <div className="max-w-6xl w-full bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8">
        <h1 className="text-5xl font-bold text-white text-center mb-8">
          훈련 결과
        </h1>

        {/* ========== 핵심 지표 (TA & Class) ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Task Average */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
            <div className="text-sm uppercase tracking-wide mb-2 opacity-80">
              Task Average (TA)
            </div>
            <div className="text-6xl font-black mb-2">
              {formatTA(results.taskAverage)}
            </div>
            <div className="text-lg opacity-90">
              평균 타이밍 편차
            </div>
          </div>

          {/* Class Level */}
          <div
            className="rounded-xl p-6 text-white"
            style={{
              background: `linear-gradient(135deg, ${classInfo?.color || '#6366f1'}, ${classInfo?.color || '#6366f1'}dd)`,
            }}
          >
            <div className="text-sm uppercase tracking-wide mb-2 opacity-80">
              Class Level
            </div>
            <div className="text-6xl font-black mb-2">
              Class {results.classLevel}
            </div>
            <div className="text-lg opacity-90">
              {classInfo?.label || '평균'}
            </div>
            <div className="text-sm opacity-75 mt-1">
              {classInfo?.description}
            </div>
          </div>
        </div>

        {/* ========== 종합 점수 & 일관성 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 평균 점수 */}
          <div className="bg-purple-600 rounded-lg p-4 text-white text-center">
            <div className="text-sm opacity-80 mb-1">평균 점수</div>
            <div className="text-4xl font-bold">
              {results.averagePoints.toFixed(1)}
            </div>
            <div className="text-sm opacity-80">/ 100</div>
          </div>

          {/* 일관성 */}
          <div className="bg-green-600 rounded-lg p-4 text-white text-center">
            <div className="text-sm opacity-80 mb-1">일관성</div>
            <div className="text-4xl font-bold">
              {results.consistency.toFixed(1)}
            </div>
            <div className="text-sm opacity-80">/ 100</div>
          </div>

          {/* 응답률 */}
          <div className="bg-orange-600 rounded-lg p-4 text-white text-center">
            <div className="text-sm opacity-80 mb-1">응답률</div>
            <div className="text-4xl font-bold">
              {results.responseRate.toFixed(1)}%
            </div>
            <div className="text-sm opacity-80">
              {results.responsiveBeats} / {results.totalBeats}
            </div>
          </div>
        </div>

        {/* ========== Early/Late 분포 ========== */}
        <div className="bg-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">타이밍 분포</h2>

          {/* 막대 그래프 */}
          <div className="space-y-4 mb-4">
            {/* Early */}
            <div>
              <div className="flex justify-between text-white mb-1">
                <span>조기 반응 (Early)</span>
                <span className="font-bold">{results.earlyHitPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-6 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${results.earlyHitPercent}%` }}
                />
              </div>
            </div>

            {/* On Target */}
            <div>
              <div className="flex justify-between text-white mb-1">
                <span>정확 (On Target)</span>
                <span className="font-bold">{results.onTargetPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-6 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${results.onTargetPercent}%` }}
                />
              </div>
            </div>

            {/* Late */}
            <div>
              <div className="flex justify-between text-white mb-1">
                <span>지연 반응 (Late)</span>
                <span className="font-bold">{results.lateHitPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-6 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${results.lateHitPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-center text-white text-lg">
            균형 상태:{' '}
            <span className="font-bold">
              {evaluateBalance(results.earlyHitPercent, results.lateHitPercent)}
            </span>
          </div>
        </div>

        {/* ========== 피드백 분포 ========== */}
        <div className="bg-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">피드백 분포</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <FeedbackCard
              label="Perfect"
              count={results.perfectCount}
              color="#10b981"
            />
            <FeedbackCard
              label="Excellent"
              count={results.excellentCount}
              color="#22c55e"
            />
            <FeedbackCard
              label="Good"
              count={results.goodCount}
              color="#84cc16"
            />
            <FeedbackCard
              label="Fair"
              count={results.fairCount}
              color="#eab308"
            />
            <FeedbackCard
              label="Poor"
              count={results.poorCount}
              color="#f97316"
            />
            <FeedbackCard
              label="Miss"
              count={results.missCount}
              color="#ef4444"
            />
          </div>
        </div>

        {/* ========== 신체 부위별 통계 ========== */}
        {Object.keys(results.inputTypeStats).length > 0 && (
          <div className="bg-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">신체 부위별 통계</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(results.inputTypeStats).map(([type, stats]) => (
                <InputTypeCard
                  key={type}
                  type={type as InputType}
                  stats={stats!}
                />
              ))}
            </div>
          </div>
        )}

        {/* ========== 오류 정보 ========== */}
        {(results.missedBeats > 0 || results.wrongInputBeats > 0) && (
          <div className="bg-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">오류 정보</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-600 bg-opacity-50 rounded-lg p-4 text-white text-center">
                <div className="text-sm opacity-80 mb-1">놓친 비트</div>
                <div className="text-3xl font-bold">{results.missedBeats}</div>
              </div>

              <div className="bg-orange-600 bg-opacity-50 rounded-lg p-4 text-white text-center">
                <div className="text-sm opacity-80 mb-1">잘못된 입력</div>
                <div className="text-3xl font-bold">{results.wrongInputBeats}</div>
              </div>
            </div>
          </div>
        )}

        {/* ========== 개선도 (있는 경우) ========== */}
        {results.taImprovement !== undefined && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-4">이전 세션 대비 개선도</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm opacity-80 mb-1">TA 개선</div>
                <div className="text-4xl font-bold">
                  {results.taImprovement > 0 ? '↓' : '↑'}{' '}
                  {Math.abs(results.taImprovement).toFixed(1)}%
                </div>
              </div>

              {results.classImprovement !== undefined && (
                <div className="text-center">
                  <div className="text-sm opacity-80 mb-1">Class 변화</div>
                  <div className="text-4xl font-bold">
                    {results.classImprovement > 0 ? '↑' : results.classImprovement < 0 ? '↓' : '→'}{' '}
                    {Math.abs(results.classImprovement)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== 버튼 ========== */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
          >
            다시 훈련하기
          </button>

          <button
            onClick={onExit}
            className="bg-gray-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl"
          >
            메인으로
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 보조 컴포넌트
// ============================================================================

function FeedbackCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-4 text-white text-center"
      style={{ backgroundColor: color }}
    >
      <div className="text-sm uppercase mb-1">{label}</div>
      <div className="text-3xl font-bold">{count}</div>
    </div>
  );
}

function InputTypeCard({
  type,
  stats,
}: {
  type: InputType;
  stats: {
    count: number;
    averageDeviation: number;
    averagePoints: number;
  };
}) {
  const getTypeLabel = (type: InputType) => {
    switch (type) {
      case 'left-hand':
        return '👈 왼손';
      case 'right-hand':
        return '👉 오른손';
      case 'left-foot':
        return '🦵 왼발';
      case 'right-foot':
        return '🦵 오른발';
    }
  };

  return (
    <div className="bg-gray-600 rounded-lg p-4 text-white">
      <div className="text-2xl font-bold mb-3 text-center">
        {getTypeLabel(type)}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="opacity-80">입력 횟수:</span>
          <span className="font-bold">{stats.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-80">평균 편차:</span>
          <span className="font-bold">{stats.averageDeviation.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-80">평균 점수:</span>
          <span className="font-bold">{stats.averagePoints.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
