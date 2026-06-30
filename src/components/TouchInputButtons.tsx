/**
 * Touch Input Buttons for Mobile
 * 모바일 터치 입력 버튼 컴포넌트
 */

'use client';

import type { InputType } from '@/types/evaluation';
import { KEYBOARD_LABELS } from '@/config/inputMapping';
import { BODY_PART_HEX } from '@/utils/bodyPartColors';

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
          style={{ background: BODY_PART_HEX['left-hand'] }}
          className={`flex-1 transition-all duration-150 ${
            isExpected('left-hand') ? 'border-4 border-yellow-300' : 'border-2 border-black/20'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">👈</div>
            <div className="text-white text-4xl font-bold mb-2">왼손</div>
            <div className="bg-white font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl" style={{ color: BODY_PART_HEX['left-hand'] }}>
              {KEYBOARD_LABELS['left-hand']}
            </div>
          </div>
        </button>

        {/* 오른손 */}
        <button
          onTouchStart={(e) => handleTouchStart(e, 'right-hand')}
          disabled={disabled}
          style={{ background: BODY_PART_HEX['right-hand'] }}
          className={`flex-1 transition-all duration-150 ${
            isExpected('right-hand') ? 'border-4 border-yellow-300' : 'border-2 border-black/20'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">👉</div>
            <div className="text-white text-4xl font-bold mb-2">오른손</div>
            <div className="bg-white font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl" style={{ color: BODY_PART_HEX['right-hand'] }}>
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
          style={{ background: BODY_PART_HEX['left-foot'] }}
          className={`flex-1 transition-all duration-150 ${
            isExpected('left-foot') ? 'border-4 border-yellow-300' : 'border-2 border-black/20'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">🦵</div>
            <div className="text-white text-4xl font-bold mb-2">왼발</div>
            <div className="bg-white font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl" style={{ color: BODY_PART_HEX['left-foot'] }}>
              {KEYBOARD_LABELS['left-foot']}
            </div>
          </div>
        </button>

        {/* 오른발 */}
        <button
          onTouchStart={(e) => handleTouchStart(e, 'right-foot')}
          disabled={disabled}
          style={{ background: BODY_PART_HEX['right-foot'] }}
          className={`flex-1 transition-all duration-150 ${
            isExpected('right-foot') ? 'border-4 border-yellow-300' : 'border-2 border-black/20'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-4">🦵</div>
            <div className="text-white text-4xl font-bold mb-2">오른발</div>
            <div className="bg-white font-bold text-5xl px-8 py-4 rounded-2xl shadow-2xl" style={{ color: BODY_PART_HEX['right-foot'] }}>
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
            style={{ background: BODY_PART_HEX['left-hand'] }}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('left-hand') ? 'border-4 border-yellow-300 scale-105' : 'border-2 border-black/20'
            } ${disabled ? 'opacity-50' : ''}`}
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
            style={{ background: BODY_PART_HEX['right-hand'] }}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('right-hand') ? 'border-4 border-yellow-300 scale-105' : 'border-2 border-black/20'
            } ${disabled ? 'opacity-50' : ''}`}
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
            style={{ background: BODY_PART_HEX['left-foot'] }}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('left-foot') ? 'border-4 border-yellow-300 scale-105' : 'border-2 border-black/20'
            } ${disabled ? 'opacity-50' : ''}`}
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
            style={{ background: BODY_PART_HEX['right-foot'] }}
            className={`p-6 rounded-xl font-bold text-2xl transition-all ${
              isExpected('right-foot') ? 'border-4 border-yellow-300 scale-105' : 'border-2 border-black/20'
            } ${disabled ? 'opacity-50' : ''}`}
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
