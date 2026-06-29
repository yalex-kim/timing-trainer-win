import React from 'react';
import type { BodyPart, TrainingRange, TrainingType, CustomBodyPart } from '@/types';
import type { InputType, BeatData, TimingFeedback as TimingFeedbackType } from '@/types/evaluation';
import { getBodyPartColors, getBodyPartLabel, getBodyPartIcon } from '@/utils/bodyPartColors';
import { formatTime } from '@/utils/commonHelpers';
import { KEYBOARD_LABELS } from '@/config/inputMapping';
import TimingFeedback from './TimingFeedback';

interface TrainingDisplayProps {
  trainingType: TrainingType;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  bpm: number;
  timeRemaining: number;
  currentBeat: number;
  totalBeats: number;
  isActive: boolean;
  currentSide: 'left' | 'right';
  currentFeedback: TimingFeedbackType | null;
  currentBeatData: BeatData | undefined;
  nextBeatData: BeatData | undefined;
  onLeftTouch: (e: React.TouchEvent) => void;
  onRightTouch: (e: React.TouchEvent) => void;
  onExit: () => void;
  title?: string;
  customSequence?: CustomBodyPart[] | null;
  showFeedback?: boolean;
}

type BodyPartType = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';

export function TrainingDisplay({
  trainingType: _trainingType,
  bodyPart,
  trainingRange,
  bpm,
  timeRemaining,
  currentBeat,
  totalBeats,
  isActive,
  currentSide,
  currentFeedback,
  currentBeatData,
  nextBeatData: _nextBeatData,
  onLeftTouch,
  onRightTouch,
  onExit,
  title,
  customSequence,
  showFeedback = true,
}: TrainingDisplayProps) {

  const isBodyPartEnabled = (part: BodyPartType): boolean => {
    if (customSequence && customSequence.length > 0) {
      return customSequence.includes(part as CustomBodyPart);
    }
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    if (bodyPart !== type) return false;
    if (trainingRange === 'both') return true;
    if (trainingRange === side) return true;
    return false;
  };

  const isBodyPartActive = (part: BodyPartType): boolean => {
    if (!isActive) return false;
    if (customSequence && customSequence.length > 0 && currentBeatData) {
      return currentBeatData.expectedInput.expectedTypes.includes(part as InputType);
    }
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    if (bodyPart !== type) return false;
    if (trainingRange === 'both' && currentSide === side) return true;
    if (trainingRange === side) return true;
    return false;
  };

  const handleTouch = (part: BodyPartType) => (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isBodyPartEnabled(part)) return;
    const [side] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    if (side === 'left') {
      onLeftTouch(e);
    } else {
      onRightTouch(e);
    }
  };

  const progressPercent = totalBeats > 0 ? (currentBeat / totalBeats) * 100 : 0;

  const renderBodyPart = (part: BodyPartType) => {
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    const enabled = isBodyPartEnabled(part);
    const active = isBodyPartActive(part);

    let bgColor: string;
    let glowStyle: React.CSSProperties = {};

    if (!enabled) {
      bgColor = 'bg-gray-900';
    } else {
      const colors = getBodyPartColors(type as BodyPart, side);
      bgColor = active ? colors.active : colors.inactive;

      // 활성 시 부드러운 glow 효과
      if (active) {
        const glowColors: Record<BodyPartType, string> = {
          'left-hand':  'rgba(96, 165, 250, 0.4)',
          'right-hand': 'rgba(248, 113, 113, 0.4)',
          'left-foot':  'rgba(52, 211, 153, 0.4)',
          'right-foot': 'rgba(251, 191, 36, 0.4)',
        };
        glowStyle = { boxShadow: `inset 0 0 60px 10px ${glowColors[part]}` };
      }
    }

    return (
      <div
        key={part}
        onTouchStart={handleTouch(part)}
        style={glowStyle}
        className={`relative flex items-center justify-center transition-all duration-200 ${
          enabled ? 'cursor-pointer' : 'cursor-not-allowed'
        } ${bgColor} ${!enabled ? 'opacity-30' : ''}`}
      >
        {/* 구분선 */}
        <div className="absolute inset-0 border border-gray-800 pointer-events-none" />

        <div
          className={`text-white text-center pointer-events-none select-none transition-all duration-200 ${
            active ? 'scale-110' : 'scale-100'
          }`}
        >
          <div className={`text-6xl mb-2 transition-all duration-200 ${active ? 'drop-shadow-lg' : ''}`}>
            {getBodyPartIcon(type as BodyPart, side)}
          </div>
          <div className="text-xl font-bold tracking-wide">
            {getBodyPartLabel(type as BodyPart, side)}
          </div>
          {enabled && (
            <div className={`mt-2.5 inline-block px-3 py-1 rounded-md text-sm font-mono font-black tracking-widest transition-all duration-200 ${
              active
                ? 'bg-white/25 text-white'
                : 'bg-black/30 text-white/70'
            }`}>
              {KEYBOARD_LABELS[part as InputType]}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">

      {/* ── 헤더 바 ── */}
      <div className="flex-shrink-0 h-16 flex items-center px-5 bg-gray-950 border-b border-gray-800">

        {/* 좌측: 타이틀 + 진행 뱃지 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-white font-bold text-base truncate">
            {title || '훈련 모드'}
          </span>
          <span className="text-gray-500 text-sm font-mono flex-shrink-0">
            {currentBeat + 1}<span className="text-gray-700 mx-0.5">/</span>{totalBeats}
          </span>
        </div>

        {/* 중앙: BPM · 남은 시간 */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">BPM</span>
            <span className="text-white text-xl font-black tabular-nums">{bpm}</span>
          </div>
          <div className="w-px h-5 bg-gray-700" />
          <span className="text-white text-xl font-black tabular-nums">{formatTime(timeRemaining)}</span>
        </div>

        {/* 우측: 종료 버튼 */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-900/60 border border-gray-700 hover:border-red-800 text-gray-400 hover:text-red-400 text-sm font-semibold transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            종료
          </button>
        </div>
      </div>

      {/* ── 진행 바 ── */}
      <div className="flex-shrink-0 h-0.5 bg-gray-900">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── 실시간 피드백 ── */}
      {showFeedback && currentFeedback && (
        <TimingFeedback
          feedback={currentFeedback}
          currentPoints={currentFeedback.points}
        />
      )}

      {/* ── 2×2 그리드 ── */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2">
        {renderBodyPart('left-hand')}
        {renderBodyPart('right-hand')}
        {renderBodyPart('left-foot')}
        {renderBodyPart('right-foot')}
      </div>
    </div>
  );
}
