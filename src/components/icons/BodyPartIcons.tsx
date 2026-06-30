import type { BodyPart } from '@/types';

interface BodyPartSvgIconProps {
  bodyPart: BodyPart;
  side: 'left' | 'right';
  size?: number;
  color?: string;
  className?: string;
}

/**
 * 디자인 목업의 손/발 라인 아이콘 (Pretendard 디자인 시스템 전용)
 */
export function BodyPartSvgIcon({ bodyPart, side, size = 56, color = '#fff', className }: BodyPartSvgIconProps) {
  const mirror = bodyPart === 'hand' ? side === 'left' : side === 'right';
  const style = mirror ? { transform: 'scaleX(-1)' } : undefined;

  if (bodyPart === 'hand') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
        className={className}
      >
        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    );
  }

  return (
    <svg
      width={size * (13 / 19)}
      height={size}
      viewBox="0 0 13 19"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
      <path d="M4 13h4" />
    </svg>
  );
}
