import React from 'react';
import type { BodyPart, TrainingRange, TrainingType, CustomBodyPart } from '@/types';
import type { InputType, BeatData, TimingFeedback as TimingFeedbackType } from '@/types/evaluation';
import { getBodyPartLabel, BODY_PART_HEX } from '@/utils/bodyPartColors';
import { BodyPartSvgIcon } from '@/components/icons/BodyPartIcons';
import { formatTime } from '@/utils/commonHelpers';
import { KEYBOARD_LABELS } from '@/config/inputMapping';

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
  currentFeedbackTypes?: InputType[] | null;
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
  currentFeedbackTypes,
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

  // 현재 피드백이 어느 사분면에 표시되어야 하는지 — 피드백을 만든 시점의 입력 타입(currentFeedbackTypes)을
  // 그대로 사용한다. currentBeatData는 다음 비트로 이미 넘어가 있을 수 있어 피드백 출처와 다를 수 있다.
  const feedbackTargets = currentFeedbackTypes ?? [];

  const renderBodyPart = (part: BodyPartType) => {
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    const enabled = isBodyPartEnabled(part);
    const active = isBodyPartActive(part);
    const hex = BODY_PART_HEX[part];
    const showCardFeedback = showFeedback && currentFeedback && feedbackTargets.includes(part as InputType);

    return (
      <div
        key={part}
        onTouchStart={handleTouch(part)}
        style={{ background: enabled ? hex : '#cbd2d6' }}
        className={`relative rounded-2xl flex flex-col items-center justify-center gap-2.5 overflow-hidden transition-all duration-200 ${
          enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
        }`}
      >
        {/* 활성 펄스 */}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-46.25 h-46.25 rounded-full bg-white animate-tt-pulse" />
          </div>
        )}

        <div className="relative flex flex-col items-center gap-2.5 pointer-events-none select-none">
          <BodyPartSvgIcon bodyPart={type} side={side} size={type === 'foot' ? 78 : 62} color="#fff" />
          <div className="flex items-center gap-2.5">
            <span className="text-[36px] font-black text-white tracking-tight">{getBodyPartLabel(type, side)}</span>
            {enabled && (
              <span className="font-mono text-sm font-extrabold rounded-lg px-2.5 py-0.5 bg-white" style={{ color: hex }}>
                {KEYBOARD_LABELS[part as InputType]}
              </span>
            )}
          </div>
        </div>

        {/* 피드백 — 카드 하단 고정 슬롯 (해당 부위 카드 안에서만 나타나고 사라짐, 위치는 항상 동일) */}
        {showCardFeedback && currentFeedback && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div
              key={`${currentFeedback.message}-${currentFeedback.displayText}`}
              className="flex items-center gap-2 bg-white rounded-full pl-3.5 pr-4 py-1.5 tt-card-shadow animate-bounce-in"
            >
              <span className="text-sm font-extrabold" style={{ color: currentFeedback.color }}>
                {currentFeedback.message}
              </span>
              <span className="font-mono text-xs font-bold text-tt-muted-alt">
                {currentFeedback.displayText}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-tt-bg-session flex flex-col">

      {/* ── 헤더 바 ── */}
      <div className="shrink-0 h-14 flex items-center px-5 bg-tt-card border-b border-tt-border-soft">

        {/* 좌측: 타이틀 + 진행 뱃지 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-tt-heading-alt font-extrabold text-[15px] truncate">
            {title || '훈련 모드'}
          </span>
          <span className="text-[12.5px] font-semibold text-tt-muted-alt bg-tt-bg rounded-md px-2.5 py-1">
            반복 <b className="text-tt-teal">{currentBeat + 1}</b> / {totalBeats}
          </span>
        </div>

        {/* 중앙: BPM · 남은 시간 */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-tt-light-muted-alt2 font-bold tracking-wider">BPM</div>
            <div className="font-mono text-lg font-semibold text-tt-heading-alt leading-tight">{bpm}</div>
          </div>
          <div className="w-px h-6.5 bg-tt-border-soft" />
          <div className="text-right">
            <div className="text-[10px] text-tt-light-muted-alt2 font-bold tracking-wider">남은 시간</div>
            <div className="font-mono text-lg font-semibold text-tt-heading-alt leading-tight">{formatTime(timeRemaining)}</div>
          </div>
        </div>

        {/* 우측: 종료 버튼 */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-tt-card hover:bg-red-50 border border-[#e6c6cb] text-[#bd5066] text-sm font-bold transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            종료
          </button>
        </div>
      </div>

      {/* ── 진행 바 ── */}
      <div className="shrink-0 h-0.75 bg-tt-border-soft">
        <div
          className="h-full bg-tt-teal transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── 2×2 그리드 ── */}
      <div className="flex-1 relative grid grid-cols-2 grid-rows-2 gap-3.5 p-4.5">
        {renderBodyPart('left-hand')}
        {renderBodyPart('right-hand')}
        {renderBodyPart('left-foot')}
        {renderBodyPart('right-foot')}

        {/* ── 중앙 BEAT 인디케이터 ── */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-30 h-30 rounded-full bg-white tt-card-shadow border border-tt-border-soft flex flex-col items-center justify-center z-5">
          <div className="absolute -inset-2.25 rounded-full border-2 border-tt-teal animate-tt-ring" />
          <div className="font-mono text-[10px] text-tt-light-muted-alt2 font-semibold tracking-[1.5px]">BEAT</div>
          <div className="text-[30px] text-tt-teal leading-[1.1] my-px">♩</div>
          <div className="text-[11px] text-tt-muted-alt font-bold">{bpm} BPM</div>
        </div>
      </div>
    </div>
  );
}
