/**
 * Touch Input Buttons for Mobile
 * 모바일 터치 입력 버튼 컴포넌트
 */

'use client';

import type { InputType } from '@/types/evaluation';
import { KEYBOARD_LABELS } from '@/config/inputMapping';

interface TouchInputButtonsProps {
  onTouch: (inputType: InputType) => void;
  expectedInputs?: InputType[];
  disabled?: boolean;
}

export default function TouchInputButtons({
  onTouch,
  expectedInputs = [],
  disabled = false,
}: TouchInputButtonsProps) {
  const handleTouchStart = (e: React.TouchEvent, inputType: InputType) => {
    e.preventDefault();
    if (disabled) return;
    onTouch(inputType);
  };

  const isExpected = (inputType: InputType) => {
    return expectedInputs.includes(inputType);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* 상단: 손 버튼 */}
      <div className="absolute top-0 left-0 right-0 h-1/2 flex pointer-events-auto">
        {/* 왼손 */}
        <button
          onTouchStart={(e) => handleTouchStart(e, 'left-hand')}
          disabled={disabled}
          className={`flex-1 transition-all duration-150 ${
            isExpected('left-hand')
              ? 'bg-blue-500 border-4 border-yellow-300'
              : 'bg-blue-700 border-2 border-blue-500'
          } ${disabled ? 'opacity-50' : 'active:bg-blue-400'}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">👈</div>
            <div className="text-white text-4xl font-bold mb-2">왼손</div>
            <div className="bg-white text-blue-700 font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl">
              {KEYBOARD_LABELS['left-hand']}
            </div>
          </div>
        </button>

        {/* 오른손 */}
        <button
          onTouchStart={(e) => handleTouchStart(e, 'right-hand')}
          disabled={disabled}
          className={`flex-1 transition-all duration-150 ${
            isExpected('right-hand')
              ? 'bg-blue-400 border-4 border-yellow-300'
              : 'bg-blue-600 border-2 border-blue-400'
          } ${disabled ? 'opacity-50' : 'active:bg-blue-300'}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">👉</div>
            <div className="text-white text-4xl font-bold mb-2">오른손</div>
            <div className="bg-white text-blue-600 font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl">
              {KEYBOARD_LABELS['right-hand']}
            </div>
          </div>
        </button>
      </div>

      {/* 하단: 발 버튼 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 flex pointer-events-auto">
        {/* 왼발 */}
        <button
          onTouchStart={(e) => handleTouchStart(e, 'left-foot')}
          disabled={disabled}
          className={`flex-1 transition-all duration-150 ${
            isExpected('left-foot')
              ? 'bg-green-500 border-4 border-yellow-300'
              : 'bg-green-700 border-2 border-green-500'
          } ${disabled ? 'opacity-50' : 'active:bg-green-400'}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">🦵</div>
            <div className="text-white text-4xl font-bold mb-2">왼발</div>
            <div className="bg-white text-green-700 font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl">
              {KEYBOARD_LABELS['left-foot']}
            </div>
          </div>
        </button>

        {/* 오른발 */}
        <button
          onTouchStart={(e) => handleTouchStart(e, 'right-foot')}
          disabled={disabled}
          className={`flex-1 transition-all duration-150 ${
            isExpected('right-foot')
              ? 'bg-green-400 border-4 border-yellow-300'
              : 'bg-green-600 border-2 border-green-400'
          } ${disabled ? 'opacity-50' : 'active:bg-green-300'}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">🦵</div>
            <div className="text-white text-4xl font-bold mb-2">오른발</div>
            <div className="bg-white text-green-600 font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl">
              {KEYBOARD_LABELS['right-foot']}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 컴팩트 버튼 (시각/청각 모드에서 오버레이)
// ============================================================================

interface CompactTouchButtonsProps {
  onTouch: (inputType: InputType) => void;
  expectedInputs?: InputType[];
  disabled?: boolean;
  position?: 'bottom' | 'overlay';
}

export function CompactTouchButtons({
  onTouch,
  expectedInputs = [],
  disabled = false,
  position = 'bottom',
}: CompactTouchButtonsProps) {
  const handleTouchStart = (e: React.TouchEvent, inputType: InputType) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onTouch(inputType);
  };

  const isExpected = (inputType: InputType) => {
    return expectedInputs.includes(inputType);
  };

  const positionClasses =
    position === 'bottom'
      ? 'fixed bottom-0 left-0 right-0'
      : 'fixed bottom-4 left-4 right-4';

  return (
    <div className={`${positionClasses} z-40`}>
      <div className="bg-black bg-opacity-80 p-4 rounded-t-2xl">
        <div className="text-white text-center text-sm mb-3 opacity-70">
          터치 입력
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* 왼손 */}
          <button
            onTouchStart={(e) => handleTouchStart(e, 'left-hand')}
            disabled={disabled}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('left-hand')
                ? 'bg-blue-500 border-4 border-yellow-300 scale-105'
                : 'bg-blue-600 border-2 border-blue-400'
            } ${disabled ? 'opacity-50' : 'active:bg-blue-400'}`}
          >
            <div className="text-4xl mb-1">👈</div>
            <div className="text-white text-lg">왼손</div>
            <div className="text-white text-xl mt-1">
              {KEYBOARD_LABELS['left-hand']}
            </div>
          </button>

          {/* 오른손 */}
          <button
            onTouchStart={(e) => handleTouchStart(e, 'right-hand')}
            disabled={disabled}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('right-hand')
                ? 'bg-blue-400 border-4 border-yellow-300 scale-105'
                : 'bg-blue-500 border-2 border-blue-300'
            } ${disabled ? 'opacity-50' : 'active:bg-blue-300'}`}
          >
            <div className="text-4xl mb-1">👉</div>
            <div className="text-white text-lg">오른손</div>
            <div className="text-white text-xl mt-1">
              {KEYBOARD_LABELS['right-hand']}
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 왼발 */}
          <button
            onTouchStart={(e) => handleTouchStart(e, 'left-foot')}
            disabled={disabled}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('left-foot')
                ? 'bg-green-500 border-4 border-yellow-300 scale-105'
                : 'bg-green-600 border-2 border-green-400'
            } ${disabled ? 'opacity-50' : 'active:bg-green-400'}`}
          >
            <div className="text-4xl mb-1">🦵</div>
            <div className="text-white text-lg">왼발</div>
            <div className="text-white text-xl mt-1">
              {KEYBOARD_LABELS['left-foot']}
            </div>
          </button>

          {/* 오른발 */}
          <button
            onTouchStart={(e) => handleTouchStart(e, 'right-foot')}
            disabled={disabled}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('right-foot')
                ? 'bg-green-400 border-4 border-yellow-300 scale-105'
                : 'bg-green-500 border-2 border-green-300'
            } ${disabled ? 'opacity-50' : 'active:bg-green-300'}`}
          >
            <div className="text-4xl mb-1">🦵</div>
            <div className="text-white text-lg">오른발</div>
            <div className="text-white text-xl mt-1">
              {KEYBOARD_LABELS['right-foot']}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 모바일 감지 유틸리티
// ============================================================================

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
    ('ontouchstart' in window)
  );
}
