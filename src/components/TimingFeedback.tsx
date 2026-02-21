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
  streak = 0,
  currentPoints,
  averagePoints,
  showStreak = true,
}: TimingFeedbackProps) {
  if (!feedback) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
      {/* 가운데 네모 박스 안에 동그라미로 피드백 표시 */}
      <div
        className="bg-black bg-opacity-60 p-3 sm:p-4 md:p-6 rounded-xl md:rounded-2xl border-2 md:border-3 border-gray-700 transition-all duration-200 ease-out"
        style={{
          animation: 'bounce-in 0.3s ease-out',
        }}
      >
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          {/* 타이밍 평가 동그라미 */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full transition-all duration-200"
            style={{
              backgroundColor: feedback.color,
              boxShadow: `0 0 30px ${feedback.color}, 0 0 50px ${feedback.color}80`,
            }}
          />

          {/* 타이밍 차이 값 */}
          <div
            className="text-xl sm:text-2xl md:text-3xl font-bold px-3 py-1 rounded-lg"
            style={{
              color: feedback.color,
              textShadow: `0 0 10px ${feedback.color}80`,
            }}
          >
            {feedback.displayText}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 잘못된 입력 경고 컴포넌트
// ============================================================================

interface WrongInputAlertProps {
  show: boolean;
  expectedInput: string;
  actualInput: string;
}

export function WrongInputAlert({
  show,
  expectedInput,
  actualInput,
}: WrongInputAlertProps) {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-red-500 text-white px-8 py-4 rounded-lg shadow-2xl animate-shake">
        <div className="text-3xl font-bold mb-2">❌ 잘못된 입력!</div>
        <div className="text-xl">
          예상: {expectedInput} / 입력: {actualInput}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 진행도 표시 컴포넌트
// ============================================================================

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
      <div className="bg-black bg-opacity-70 px-6 py-4 rounded-lg">
        {/* 정보 표시 */}
        <div className="flex items-center gap-6 text-white mb-3">
          <div className="text-2xl font-bold">{bpm} BPM</div>
          <div className="text-2xl font-bold">{timeRemaining}</div>
          <div className="text-lg">
            {currentBeat} / {totalBeats} 비트
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 현재 예상 입력 표시 컴포넌트
// ============================================================================

import type { InputType } from '@/types/evaluation';
import { KEYBOARD_LABELS } from '@/config/inputMapping';

interface ExpectedInputDisplayProps {
  expectedInputs: InputType[];
  nextInputs?: InputType[];
}

export function ExpectedInputDisplay({
  expectedInputs,
  nextInputs,
}: ExpectedInputDisplayProps) {
  const getInputDisplay = (input: InputType) => {
    const displays = {
      'left-hand': { emoji: '👈', label: '왼손', color: 'text-blue-400' },
      'right-hand': { emoji: '👉', label: '오른손', color: 'text-blue-500' },
      'left-foot': { emoji: '🦵', label: '왼발', color: 'text-green-400' },
      'right-foot': { emoji: '🦵', label: '오른발', color: 'text-green-500' },
    };
    return displays[input];
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black bg-opacity-90 px-8 py-6 rounded-2xl border-2 border-yellow-400 border-opacity-50">
        {/* 현재 예상 입력 */}
        <div className="text-center mb-4">
          <div className="text-lg text-gray-300 mb-3">다음 입력</div>
          <div className="flex items-center justify-center gap-6">
            {expectedInputs.map((input, index) => {
              const display = getInputDisplay(input);
              return (
                <div key={index} className="text-center animate-pulse">
                  <div className={`text-5xl mb-2 ${display.color}`}>
                    {display.emoji}
                  </div>
                  <div className="text-white text-xl font-bold mb-1">
                    {display.label}
                  </div>
                  <div className="bg-yellow-400 text-black font-bold text-2xl px-4 py-2 rounded-lg shadow-lg">
                    {KEYBOARD_LABELS[input]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 다다음 입력 (미리보기) */}
        {nextInputs && nextInputs.length > 0 && (
          <div className="text-center pt-4 border-t border-gray-600">
            <div className="text-sm text-gray-400 mb-2">다다음</div>
            <div className="flex items-center justify-center gap-4">
              {nextInputs.map((input, index) => {
                const display = getInputDisplay(input);
                return (
                  <div key={index} className="text-center opacity-60">
                    <div className="text-2xl mb-1">{display.emoji}</div>
                    <div className="text-white text-xs">{display.label}</div>
                    <div className="bg-gray-600 text-white text-sm px-2 py-1 rounded mt-1">
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

// 애니메이션 스타일을 전역 CSS에 추가해야 함
// globals.css에 추가:
/*
@keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
*/
