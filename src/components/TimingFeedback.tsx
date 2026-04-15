/**
 * Real-time Timing Feedback Component
 * Displays immediate visual feedback for timing performance
 */

'use client';

import type { TimingFeedback as TimingFeedbackType } from '@/types/evaluation';

interface TimingFeedbackProps {
  feedback: TimingFeedbackType | null;
  streak?: number;
  currentPoints?: number;
  averagePoints?: number;
  showStreak?: boolean;
}

export default function TimingFeedback({
  feedback,
  streak: _streak = 0,
  currentPoints: _currentPoints,
  averagePoints: _averagePoints,
  showStreak: _showStreak = true,
}: TimingFeedbackProps) {
  if (!feedback) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'bounce-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        className="rounded-2xl border border-white/10 backdrop-blur-md px-5 py-4 flex flex-col items-center gap-2.5"
        style={{
          background: 'rgba(0, 0, 0, 0.72)',
          minWidth: '110px',
        }}
      >
        {/* 컬러 원 */}
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: 56,
            height: 56,
            backgroundColor: feedback.color,
            boxShadow: `0 0 24px ${feedback.color}cc, 0 0 48px ${feedback.color}55`,
          }}
        />

        {/* 편차 텍스트 */}
        <div
          className="text-2xl font-black tabular-nums leading-none"
          style={{
            color: feedback.color,
            textShadow: `0 0 12px ${feedback.color}88`,
          }}
        >
          {feedback.displayText}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 잘못된 입력 경고
// ─────────────────────────────────────────────────────────────────────────────

interface WrongInputAlertProps {
  show: boolean;
  expectedInput: string;
  actualInput: string;
}

export function WrongInputAlert({ show, expectedInput, actualInput }: WrongInputAlertProps) {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-shake">
      <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl border border-red-400/40 flex flex-col items-center gap-1">
        <div className="text-2xl font-black">잘못된 입력</div>
        <div className="text-sm font-semibold opacity-90">
          예상: {expectedInput} · 입력: {actualInput}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 진행도 표시
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressIndicatorProps {
  currentBeat: number;
  totalBeats: number;
  timeRemaining: string;
  bpm: number;
}

export function ProgressIndicator({
  currentBeat,
  totalBeats,
  timeRemaining,
  bpm,
}: ProgressIndicatorProps) {
  const progress = (currentBeat / totalBeats) * 100;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-black/70 backdrop-blur-sm px-5 py-3.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-5 text-white mb-2.5">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">BPM</span>
            <span className="text-xl font-black tabular-nums">{bpm}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">남은 시간</span>
            <span className="text-xl font-black tabular-nums">{timeRemaining}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">비트</span>
            <span className="text-xl font-black tabular-nums">{currentBeat}<span className="text-gray-600">/{totalBeats}</span></span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 예상 입력 표시
// ─────────────────────────────────────────────────────────────────────────────

import type { InputType } from '@/types/evaluation';
import { KEYBOARD_LABELS } from '@/config/inputMapping';

interface ExpectedInputDisplayProps {
  expectedInputs: InputType[];
  nextInputs?: InputType[];
}

export function ExpectedInputDisplay({ expectedInputs, nextInputs }: ExpectedInputDisplayProps) {
  const getInputDisplay = (input: InputType) => {
    const displays = {
      'left-hand':  { emoji: '👈', label: '왼손',  color: 'text-blue-400',   keyBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      'right-hand': { emoji: '👉', label: '오른손', color: 'text-red-400',    keyBg: 'bg-red-500/20 text-red-300 border-red-500/30' },
      'left-foot':  { emoji: '🦵', label: '왼발',  color: 'text-emerald-400', keyBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      'right-foot': { emoji: '🦵', label: '오른발', color: 'text-amber-400',  keyBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    };
    return displays[input];
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-black/85 backdrop-blur-sm px-7 py-5 rounded-2xl border border-white/10">
        <div className="text-center mb-4">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">다음 입력</div>
          <div className="flex items-center justify-center gap-5">
            {expectedInputs.map((input, index) => {
              const display = getInputDisplay(input);
              return (
                <div key={index} className="text-center animate-pulse">
                  <div className={`text-4xl mb-1.5 ${display.color}`}>{display.emoji}</div>
                  <div className="text-white text-base font-bold mb-2">{display.label}</div>
                  <div className={`border rounded-lg px-3 py-1.5 font-mono font-black text-xl ${display.keyBg}`}>
                    {KEYBOARD_LABELS[input]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {nextInputs && nextInputs.length > 0 && (
          <div className="pt-3.5 border-t border-white/10">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider text-center mb-2.5">다다음</div>
            <div className="flex items-center justify-center gap-4">
              {nextInputs.map((input, index) => {
                const display = getInputDisplay(input);
                return (
                  <div key={index} className="text-center opacity-50">
                    <div className="text-2xl mb-1">{display.emoji}</div>
                    <div className="text-white text-xs font-semibold">{display.label}</div>
                    <div className="bg-white/10 text-gray-400 border border-white/10 text-xs px-2 py-1 rounded-md mt-1 font-mono font-bold">
                      {KEYBOARD_LABELS[input]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
