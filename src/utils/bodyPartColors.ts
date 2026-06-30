import type { BodyPart, CustomBodyPart } from '@/types';

/**
 * 신체 부위 색상 단일 소스
 * 왼손=블루, 오른손=레드, 왼발=그린, 오른발=앰버
 */
export const BODY_PART_HEX: Record<CustomBodyPart, string> = {
  'left-hand': '#2f6bd8',
  'right-hand': '#e0445b',
  'left-foot': '#1f9d57',
  'right-foot': '#e89a1c',
};

const toCustomBodyPart = (bodyPart: BodyPart, side: 'left' | 'right'): CustomBodyPart =>
  `${side}-${bodyPart}` as CustomBodyPart;

/**
 * Body part color configuration (hex 문자열, inline style용)
 */
export const getBodyPartColors = (bodyPart: BodyPart, side: 'left' | 'right') => {
  const hex = BODY_PART_HEX[toCustomBodyPart(bodyPart, side)];
  return {
    active: hex,
    inactive: hex,
  };
};

/**
 * Get body part label
 */
export const getBodyPartLabel = (bodyPart: BodyPart, side: 'left' | 'right') => {
  const isHand = bodyPart === 'hand';
  const isLeft = side === 'left';

  if (isLeft) {
    return isHand ? '왼손' : '왼발';
  } else {
    return isHand ? '오른손' : '오른발';
  }
};

/**
 * Get body part icon (emoji — InputGuide/TouchInputButtons 등 레거시 사용처용)
 */
export const getBodyPartIcon = (bodyPart: BodyPart, side: 'left' | 'right') => {
  const isHand = bodyPart === 'hand';
  const isLeft = side === 'left';

  if (isHand) {
    return isLeft ? '✋' : '🤚';
  } else {
    return '🦶';
  }
};
