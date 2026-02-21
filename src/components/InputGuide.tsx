/**
 * Input Guide Component
 * 입력 키 가이드 표시 컴포넌트
 */

'use client';

import type { InputType } from '@/types/evaluation';
import { KEYBOARD_LABELS } from '@/config/inputMapping';

interface InputGuideProps {
  show?: boolean;
  position?: 'top' | 'bottom' | 'center';
}

export default function InputGuide({
  show = true,
  position = 'bottom'
}: InputGuideProps) {
  if (!show) return null;

  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 ${positionClasses[position]} z-30`}
    >
      <div className="bg-black bg-opacity-80 px-8 py-6 rounded-2xl border-2 border-white border-opacity-20">
        <h3 className="text-white text-xl font-bold text-center mb-4">
          입력 키 가이드
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* 왼쪽 (손) */}
          <div className="space-y-3">
            <div className="text-white text-center text-sm opacity-70 mb-2">
              손 (Hands)
            </div>

            <InputKeyDisplay
              label="왼손"
              keyLabel={KEYBOARD_LABELS['left-hand']}
              icon="👈"
              color="bg-blue-500"
            />

            <InputKeyDisplay
              label="오른손"
              keyLabel={KEYBOARD_LABELS['right-hand']}
              icon="👉"
              color="bg-blue-500"
            />
          </div>

          {/* 오른쪽 (발) */}
          <div className="space-y-3">
            <div className="text-white text-center text-sm opacity-70 mb-2">
              발 (Feet)
            </div>

            <InputKeyDisplay
              label="왼발"
              keyLabel={KEYBOARD_LABELS['left-foot']}
              icon="🦵"
              color="bg-green-500"
            />

            <InputKeyDisplay
              label="오른발"
              keyLabel={KEYBOARD_LABELS['right-foot']}
              icon="🦵"
              color="bg-green-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 개별 키 표시 컴포넌트
// ============================================================================

interface InputKeyDisplayProps {
  label: string;
  keyLabel: string;
  icon: string;
  color: string;
}

function InputKeyDisplay({ label, keyLabel, icon, color }: InputKeyDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl">{icon}</div>

      <div className="flex-1">
        <div className="text-white text-sm opacity-80">{label}</div>
      </div>

      <div
        className={`${color} text-white font-bold text-xl px-4 py-2 rounded-lg min-w-[3rem] text-center shadow-lg`}
      >
        {keyLabel}
      </div>
    </div>
  );
}

// ============================================================================
// 간단한 키 힌트 컴포넌트 (화면 하단에 작게 표시)
// ============================================================================

interface KeyHintProps {
  inputType: InputType;
  size?: 'small' | 'medium' | 'large';
}

export function KeyHint({ inputType, size = 'medium' }: KeyHintProps) {
  const keyLabel = KEYBOARD_LABELS[inputType];

  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-xl px-4 py-2',
    large: 'text-3xl px-6 py-3',
  };

  const colorClasses = {
    'left-hand': 'bg-blue-500',
    'right-hand': 'bg-blue-600',
    'left-foot': 'bg-green-500',
    'right-foot': 'bg-green-600',
  };

  return (
    <div
      className={`${colorClasses[inputType]} text-white font-bold rounded-lg ${sizeClasses[size]} inline-block shadow-lg`}
    >
      {keyLabel}
    </div>
  );
}

// ============================================================================
// 키보드 시각화 컴포넌트
// ============================================================================

export function KeyboardVisualization() {
  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <div className="text-white text-center mb-4 text-lg font-bold">
        키보드 레이아웃
      </div>

      <div className="flex justify-center items-center gap-8">
        {/* 상단 행 (손) */}
        <div className="flex gap-4">
          <KeyVisual
            keyLabel={KEYBOARD_LABELS['left-hand']}
            label="왼손"
            color="bg-blue-500"
          />
          <KeyVisual
            keyLabel={KEYBOARD_LABELS['right-hand']}
            label="오른손"
            color="bg-blue-600"
          />
        </div>

        {/* 하단 행 (발) */}
        <div className="flex gap-4">
          <KeyVisual
            keyLabel={KEYBOARD_LABELS['left-foot']}
            label="왼발"
            color="bg-green-500"
          />
          <KeyVisual
            keyLabel={KEYBOARD_LABELS['right-foot']}
            label="오른발"
            color="bg-green-600"
          />
        </div>
      </div>
    </div>
  );
}

interface KeyVisualProps {
  keyLabel: string;
  label: string;
  color: string;
}

function KeyVisual({ keyLabel, label, color }: KeyVisualProps) {
  return (
    <div className="text-center">
      <div
        className={`${color} text-white font-bold text-2xl w-16 h-16 rounded-lg flex items-center justify-center shadow-lg mb-2`}
      >
        {keyLabel}
      </div>
      <div className="text-white text-xs opacity-70">{label}</div>
    </div>
  );
}

// ============================================================================
// 입력 설정 변경 버튼 (나중에 설정 화면에서 사용)
// ============================================================================

interface InputSettingsButtonProps {
  onClick: () => void;
}

export function InputSettingsButton({ onClick }: InputSettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
    >
      <span>⌨️</span>
      <span>입력 설정</span>
    </button>
  );
}
