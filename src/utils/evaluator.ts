/**
 * Timing Evaluation Logic
 * Based on Interactive Metronome (IM) Research
 */

import { CLASS_DEFINITIONS, FEEDBACK_THRESHOLDS, AGE_BASED_STANDARDS } from '@/types/evaluation';
import type {
  InputType,
  InputEvent,
  TrainingPattern,
  ExpectedInput,
  BeatData,
  TimingFeedback,
  FeedbackCategory,
  SessionResults,
  TimingClass,
  AgeGroup,
  UserProfile,
} from '@/types/evaluation';

// ============================================================================
// 연령대 및 Class 결정 헬퍼 함수
// ============================================================================

/**
 * 생년월일로부터 나이 계산
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 나이를 연령대 그룹으로 변환
 */
export function getAgeGroup(age: number): AgeGroup {
  if (age <= 7) return 'under7';
  if (age <= 9) return '8-9';
  if (age <= 11) return '10-11';
  if (age <= 13) return '12-13';
  if (age <= 16) return '14-16';
  return 'over17';
}

/**
 * 연령과 모드에 따른 Class 결정 (QTrainer 표준 규준표 기반)
 */
export function determineClassByAge(
  taskAverage: number,
  age: number,
  mode: 'visual' | 'auditory'
): TimingClass {
  const ageGroup = getAgeGroup(age);
  const standards = AGE_BASED_STANDARDS[mode as 'visual' | 'auditory'][ageGroup];

  for (const standard of standards) {
    if (taskAverage >= standard.range[0] && taskAverage < standard.range[1]) {
      return standard.class;
    }
  }

  return 1; // 기본값: 극심한 결핍
}

// ============================================================================
// 훈련 패턴별 예상 입력 생성
// ============================================================================

export class PatternGenerator {
  /**
   * 훈련 패턴에 따른 예상 입력 생성
   */
  static generateExpectedInput(
    pattern: TrainingPattern,
    beatNumber: number
  ): ExpectedInput {
    switch (pattern) {
      case 'left-hand-only':
        return {
          beatNumber,
          expectedTypes: ['left-hand'],
          isAlternating: false,
        };

      case 'right-hand-only':
        return {
          beatNumber,
          expectedTypes: ['right-hand'],
          isAlternating: false,
        };

      case 'both-hands-alternate':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['left-hand'] : ['right-hand'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'both-hands-simultaneous':
        return {
          beatNumber,
          expectedTypes: ['left-hand', 'right-hand'],
          isAlternating: false,
        };

      case 'left-foot-only':
        return {
          beatNumber,
          expectedTypes: ['left-foot'],
          isAlternating: false,
        };

      case 'right-foot-only':
        return {
          beatNumber,
          expectedTypes: ['right-foot'],
          isAlternating: false,
        };

      case 'both-feet-alternate':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['left-foot'] : ['right-foot'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'both-feet-simultaneous':
        return {
          beatNumber,
          expectedTypes: ['left-foot', 'right-foot'],
          isAlternating: false,
        };

      case 'left-hand-right-foot':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['left-hand'] : ['right-foot'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'right-hand-left-foot':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['right-hand'] : ['left-foot'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'all-alternate':
        const sequence: InputType[] = ['left-hand', 'right-hand', 'left-foot', 'right-foot'];
        return {
          beatNumber,
          expectedTypes: [sequence[beatNumber % 4]],
          isAlternating: true,
          alternateIndex: beatNumber % 4,
        };

      default:
        return {
          beatNumber,
          expectedTypes: ['left-hand'],
          isAlternating: false,
        };
    }
  }

  /**
   * 기존 설정을 훈련 패턴으로 변환
   */
  static settingsToPattern(
    bodyPart: 'hand' | 'foot',
    trainingRange: 'left' | 'right' | 'both'
  ): TrainingPattern {
    if (bodyPart === 'hand') {
      if (trainingRange === 'left') return 'left-hand-only';
      if (trainingRange === 'right') return 'right-hand-only';
      return 'both-hands-alternate';
    } else {
      if (trainingRange === 'left') return 'left-foot-only';
      if (trainingRange === 'right') return 'right-foot-only';
      return 'both-feet-alternate';
    }
  }
}

// ============================================================================
// 타이밍 평가기
// ============================================================================

export class TimingEvaluator {
  /**
   * 입력이 예상된 입력 타입과 일치하는지 확인
   */
  static isCorrectInput(
    inputType: InputType,
    expected: ExpectedInput
  ): boolean {
    return expected.expectedTypes.includes(inputType);
  }

  /**
   * 단일 비트 평가 (타이밍 + 입력 검증)
   */
  static evaluateBeat(
    expectedTime: number,
    actualTime: number,
    inputType: InputType,
    expected: ExpectedInput
  ): {
    feedback: TimingFeedback;
    isCorrectInput: boolean;
  } {
    const deviation = actualTime - expectedTime;
    const absDeviation = Math.abs(deviation);
    const isCorrectInput = this.isCorrectInput(inputType, expected);

    // 피드백 카테고리 결정
    let category: FeedbackCategory;
    let threshold: typeof FEEDBACK_THRESHOLDS[FeedbackCategory];

    if (absDeviation <= FEEDBACK_THRESHOLDS.perfect.range) {
      category = 'perfect';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.excellent.range) {
      category = 'excellent';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.good.range) {
      category = 'good';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.fair.range) {
      category = 'fair';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.poor.range) {
      category = 'poor';
    } else {
      category = 'miss';
    }

    threshold = FEEDBACK_THRESHOLDS[category];

    // 방향 결정
    const direction = absDeviation <= 5 ? 'on-time' : deviation < 0 ? 'early' : 'late';

    // 잘못된 입력이면 페널티 및 색상 변경
    const finalPoints = isCorrectInput ? threshold.points : 0;
    const finalColor = isCorrectInput ? threshold.color : '#ef4444'; // Wrong is always red
    const finalMessage = isCorrectInput ? threshold.message : 'WRONG INPUT';

    const feedback: TimingFeedback = {
      category: isCorrectInput ? category : 'miss',
      deviation,
      direction,
      points: finalPoints,
      color: finalColor,
      message: finalMessage,
      displayText: isCorrectInput 
        ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}ms`
        : `WRONG (${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}ms)`,
    };

    return {
      feedback,
      isCorrectInput,
    };
  }

  /**
   * Class 레벨 결정 (TA 기반)
   */
  static determineClass(ta: number): TimingClass {
    for (const def of CLASS_DEFINITIONS) {
      if (ta >= def.taRange[0] && ta < def.taRange[1]) {
        return def.class;
      }
    }
    return 1; // 기본값 (최하위)
  }

  /**
   * 일관성 점수 계산 (표준편차 기반, 0-100)
   */
  static calculateConsistency(deviations: number[], intervalMs: number): number {
    if (deviations.length < 2) return 100;

    const mean = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const variance =
      deviations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      deviations.length;
    const stdDev = Math.sqrt(variance);

    // intervalMs/2를 최대 편차 기준으로 백분율 계산
    // 입력 허용 창이 ±intervalMs/2로 제한되므로 이를 100% 기준으로 사용
    // stdDev=0 → 100점, stdDev=intervalMs/2 → 0점
    const maxDev = intervalMs / 2;
    return Math.max(0, Math.min(100, (1 - stdDev / maxDev) * 100));
  }

  /**
   * 세션 전체 평가
   */
  static evaluateSession(
    beats: BeatData[],
    userAge: number,
    trainingMode: 'visual' | 'audio'
  ): SessionResults {
    const validBeats = beats.filter((b) => b.actualTime !== null);
    const correctInputBeats = validBeats.filter((b) => b.isCorrectInput);
    const wrongInputBeats = validBeats.filter((b) => b.isWrongInput);

    // NO INPUT 비트 수 및 페널티 편차 계산
    // 비트 간격을 beats 배열에서 유도, 기본값 1000ms (60 BPM)
    const intervalMs = beats.length >= 2
      ? beats[1].expectedTime - beats[0].expectedTime
      : 1000;
    const noInputCount = beats.length - validBeats.length;
    // NO INPUT = 허용 창(±intervalMs/2)의 최대값으로 페널티 처리
    const noInputPenalty = intervalMs / 2;

    // Task Average (TA) 계산 - NO INPUT 비트를 페널티 편차로 포함
    const correctDeviations = correctInputBeats.map((b) => Math.abs(b.deviation!));
    const allTADeviations = [
      ...correctDeviations,
      ...new Array(noInputCount).fill(noInputPenalty),
    ];
    const taskAverage =
      allTADeviations.length > 0
        ? allTADeviations.reduce((a, b) => a + b, 0) / allTADeviations.length
        : 999;

    // trainingMode를 AGE_BASED_STANDARDS 키에 맞게 매핑
    const evaluationMode = trainingMode === 'audio' ? 'auditory' : trainingMode;

    // Class 결정 (연령 및 모드 기반)
    const classLevel = determineClassByAge(taskAverage, userAge, evaluationMode);

    // Early/Late/OnTarget 분포
    const earlyCount = correctInputBeats.filter((b) => b.deviation! < -5).length;
    const lateCount = correctInputBeats.filter((b) => b.deviation! > 5).length;
    const onTargetCount = correctInputBeats.filter(
      (b) => Math.abs(b.deviation!) <= 5
    ).length;

    const totalResponses = correctInputBeats.length;

    // 피드백 카테고리별 집계 - NO INPUT 비트를 miss로 포함
    const feedbackCounts = {
      perfect: validBeats.filter((b) => b.feedback?.category === 'perfect').length,
      excellent: validBeats.filter((b) => b.feedback?.category === 'excellent').length,
      good: validBeats.filter((b) => b.feedback?.category === 'good').length,
      fair: validBeats.filter((b) => b.feedback?.category === 'fair').length,
      poor: validBeats.filter((b) => b.feedback?.category === 'poor').length,
      miss: validBeats.filter((b) => b.feedback?.category === 'miss').length + noInputCount,
    };

    // 평균 점수 - NO INPUT(0점)을 전체 비트 수 기준으로 계산
    const averagePoints =
      beats.length > 0
        ? validBeats.reduce((sum, b) => sum + (b.feedback?.points || 0), 0) /
          beats.length
        : 0;

    // 일관성 - NO INPUT 페널티 편차 포함
    const consistency = this.calculateConsistency(allTADeviations, intervalMs);

    // 신체 부위별 통계
    const inputTypeStats: SessionResults['inputTypeStats'] = {};
    const inputTypes: InputType[] = ['left-hand', 'right-hand', 'left-foot', 'right-foot'];

    inputTypes.forEach((type) => {
      const typeBeats = validBeats.filter((b) => b.actualInput?.type === type);
      if (typeBeats.length > 0) {
        const typeDeviations = typeBeats
          .filter((b) => b.deviation !== null)
          .map((b) => Math.abs(b.deviation!));
        const typePoints = typeBeats.map((b) => b.feedback?.points || 0);

        inputTypeStats[type] = {
          count: typeBeats.length,
          averageDeviation:
            typeDeviations.length > 0
              ? typeDeviations.reduce((a, b) => a + b, 0) / typeDeviations.length
              : 0,
          averagePoints:
            typePoints.length > 0
              ? typePoints.reduce((a, b) => a + b, 0) / typePoints.length
              : 0,
        };
      }
    });

    return {
      taskAverage,
      classLevel,
      earlyHitPercent: totalResponses > 0 ? (earlyCount / totalResponses) * 100 : 0,
      lateHitPercent: totalResponses > 0 ? (lateCount / totalResponses) * 100 : 0,
      onTargetPercent: totalResponses > 0 ? (onTargetCount / totalResponses) * 100 : 0,
      totalBeats: beats.length,
      responsiveBeats: validBeats.length,
      missedBeats: beats.length - validBeats.length,
      wrongInputBeats: wrongInputBeats.length,
      responseRate: (validBeats.length / beats.length) * 100,
      accuracyRate: (correctInputBeats.length / validBeats.length) * 100 || 0,
      perfectCount: feedbackCounts.perfect,
      excellentCount: feedbackCounts.excellent,
      goodCount: feedbackCounts.good,
      fairCount: feedbackCounts.fair,
      poorCount: feedbackCounts.poor,
      missCount: feedbackCounts.miss,
      averagePoints,
      consistency,
      inputTypeStats,
    };
  }

  /**
   * 개선도 계산 (이전 세션 대비)
   */
  static calculateImprovement(
    currentResults: SessionResults,
    previousResults: SessionResults
  ): {
    taImprovement: number;
    classImprovement: number;
  } {
    const taImprovement =
      previousResults.taskAverage > 0
        ? ((previousResults.taskAverage - currentResults.taskAverage) /
            previousResults.taskAverage) *
          100
        : 0;

    const classImprovement = Number(currentResults.classLevel) - Number(previousResults.classLevel);

    return {
      taImprovement,
      classImprovement,
    };
  }
}

// ============================================================================
// 입력 매핑 유틸리티 (Deprecated - use InputDeviceMapper from config)
// ============================================================================

/**
 * @deprecated 이 클래스는 하위 호환성을 위해 유지됩니다.
 * 새 코드에서는 config/inputMapping.ts의 InputDeviceMapper를 사용하세요.
 */
export class InputMapper {
  /**
   * 키보드 키를 InputType으로 변환
   * @deprecated Use InputDeviceMapper.fromKeyboard() instead
   */
  static keyToInputType(key: string): InputType | null {
    // config/inputMapping.ts에서 임포트하도록 변경 권장
    // 임시로 하드코딩 유지 (하위 호환성)
    const mapping: Record<string, InputType> = {
      'e': 'left-hand',
      'E': 'left-hand',
      'i': 'right-hand',
      'I': 'right-hand',
      'x': 'left-foot',
      'X': 'left-foot',
      'n': 'right-foot',
      'N': 'right-foot',
    };
    return mapping[key] || null;
  }

  /**
   * MIDI 노트를 InputType으로 변환
   * @deprecated Use InputDeviceMapper.fromMIDI() instead
   */
  static midiNoteToInputType(note: number): InputType | null {
    const mapping: Record<number, InputType> = {
      60: 'left-hand',
      62: 'right-hand',
      64: 'left-foot',
      65: 'right-foot',
    };
    return mapping[note] || null;
  }

  /**
   * USB HID 버튼을 InputType으로 변환
   * @deprecated Use InputDeviceMapper.fromHID() instead
   */
  static hidButtonToInputType(buttonId: number): InputType | null {
    const mapping: Record<number, InputType> = {
      0: 'left-hand',
      1: 'right-hand',
      2: 'left-foot',
      3: 'right-foot',
    };
    return mapping[buttonId] || null;
  }

  /**
   * Gamepad 버튼을 InputType으로 변환
   * @deprecated Use InputDeviceMapper.fromGamepad() instead
   */
  static gamepadButtonToInputType(buttonIndex: number): InputType | null {
    const mapping: Record<number, InputType> = {
      0: 'left-hand',
      1: 'right-hand',
      2: 'left-foot',
      3: 'right-foot',
    };
    return mapping[buttonIndex] || null;
  }
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * Class 정보 가져오기
 */
export function getClassInfo(classLevel: TimingClass) {
  return CLASS_DEFINITIONS.find((def) => def.class === classLevel);
}

/**
 * 피드백 메시지 포맷팅
 */
export function formatFeedback(feedback: TimingFeedback): string {
  return `${feedback.message} (${feedback.displayText})`;
}

/**
 * TA를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatTA(ta: number): string {
  return `${ta.toFixed(1)}ms`;
}

/**
 * Early/Late 균형 평가
 */
export function evaluateBalance(earlyPercent: number, latePercent: number): string {
  const diff = Math.abs(earlyPercent - latePercent);
  if (diff <= 10) return '균형잡힘 (Balanced)';
  return earlyPercent > latePercent
    ? '조기 편향 (Early-Biased)'
    : '지연 편향 (Late-Biased)';
}

// ============================================================================
// Helper Functions for Components
// ============================================================================

/**
 * 단일 입력 평가 (컴포넌트용 헬퍼 함수)
 */
export function evaluateInput(
  inputEvent: InputEvent,
  beatData: BeatData,
  _userProfile: UserProfile | null
): TimingFeedback {
  const result = TimingEvaluator.evaluateBeat(
    beatData.expectedTime,
    inputEvent.timestamp,
    inputEvent.type,
    beatData.expectedInput
  );

  // BeatData 업데이트
  beatData.actualInput = inputEvent;
  beatData.actualTime = inputEvent.timestamp;
  beatData.deviation = inputEvent.timestamp - beatData.expectedTime;
  beatData.feedback = result.feedback;
  beatData.isCorrectInput = result.isCorrectInput;
  beatData.isWrongInput = !result.isCorrectInput;

  return result.feedback;
}

/**
 * 훈련 비트 데이터 생성 (컴포넌트용 헬퍼 함수)
 */
export function generateBeatData(params: {
  totalBeats: number;
  bpm: number;
  bodyPart: 'hand' | 'foot';
  trainingRange: 'left' | 'right' | 'both';
  trainingType: 'visual' | 'audio';
  customSequence?: ('left-hand' | 'right-hand' | 'left-foot' | 'right-foot')[];
}): BeatData[] {
  const { totalBeats, bpm, bodyPart, trainingRange, customSequence } = params;
  const beatInterval = (60 / bpm) * 1000; // ms
  const beats: BeatData[] = [];

  // 패턴 결정
  let pattern: TrainingPattern;
  if (customSequence && customSequence.length > 0) {
    // 커스텀 시퀀스 모드
    pattern = 'all-alternate'; // 임시로 all-alternate 사용
  } else if (bodyPart === 'hand') {
    if (trainingRange === 'left') pattern = 'left-hand-only';
    else if (trainingRange === 'right') pattern = 'right-hand-only';
    else pattern = 'both-hands-alternate';
  } else {
    // foot
    if (trainingRange === 'left') pattern = 'left-foot-only';
    else if (trainingRange === 'right') pattern = 'right-foot-only';
    else pattern = 'both-feet-alternate';
  }

  for (let i = 0; i < totalBeats; i++) {
    let expectedInput: ExpectedInput;

    if (customSequence && customSequence.length > 0) {
      // 커스텀 시퀀스 사용
      const sequenceIndex = i % customSequence.length;
      expectedInput = {
        beatNumber: i,
        expectedTypes: [customSequence[sequenceIndex]],
        isAlternating: true,
        alternateIndex: sequenceIndex,
      };
    } else {
      // 기본 패턴 사용
      expectedInput = PatternGenerator.generateExpectedInput(pattern, i);
    }

    beats.push({
      beatNumber: i,
      expectedTime: i * beatInterval,
      expectedInput,
      actualInput: null,
      actualTime: null,
      deviation: null,
      feedback: null,
      isCorrectInput: false,
      isWrongInput: false,
    });
  }

  return beats;
}

/**
 * 세션 결과 집계 (컴포넌트용 헬퍼 함수)
 */
export function aggregateSessionResults(
  beatsData: BeatData[],
  userProfile: UserProfile | null,
  trainingMode: 'visual' | 'audio' = 'visual'
): SessionResults {
  const age = userProfile?.age || 18; // 기본값
  return TimingEvaluator.evaluateSession(beatsData, age, trainingMode);
}
