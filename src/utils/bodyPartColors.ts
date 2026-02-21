import type { BodyPart } from '@/types';

/**
 * Body part color configuration
 * 왼손=파랑, 오른손=빨강, 왼발=초록, 오른발=노랑
 */
export const getBodyPartColors = (bodyPart: BodyPart, side: 'left' | 'right') => {
  const isHand = bodyPart === 'hand';
  const isLeft = side === 'left';

  if (isLeft) {
    // 왼손=파랑, 왼발=초록
    return {
      active: isHand ? 'bg-blue-400' : 'bg-green-400',
      inactive: isHand ? 'bg-blue-700' : 'bg-green-700',
    };
  } else {
    // 오른손=빨강, 오른발=노랑
    return {
      active: isHand ? 'bg-red-400' : 'bg-yellow-400',
      inactive: isHand ? 'bg-red-700' : 'bg-yellow-700',
    };
  }
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
 * Get body part icon
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
