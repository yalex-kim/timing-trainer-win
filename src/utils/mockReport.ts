/**
 * 개발용 더미 데이터 생성기
 * 실제 8개 검사를 매번 진행하지 않고도 ComprehensiveAssessmentReport 화면(및 PDF/Excel 내보내기)을
 * 빠르게 확인하기 위한 용도. 프로덕션 빌드에서는 사용하지 않음 (App.tsx/main.tsx에서 DEV 모드에만 노출).
 */
import type {
  ComprehensiveAssessmentReport,
  InputType,
  SessionResults,
  TimingClass,
} from '@/types/evaluation';

function mockSessionResults(taskAverage: number, classLevel: TimingClass, type: InputType): SessionResults {
  const perfectCount = Math.max(0, 24 - classLevel);
  const excellentCount = 6;
  const goodCount = 4;
  const fairCount = 3;
  const poorCount = 2;
  const missCount = Math.max(0, 8 - classLevel);
  const totalBeats = perfectCount + excellentCount + goodCount + fairCount + poorCount + missCount;
  const responsiveBeats = totalBeats - missCount;

  return {
    taskAverage,
    classLevel,
    earlyHitPercent: 28,
    lateHitPercent: 22,
    onTargetPercent: 50,
    totalBeats,
    responsiveBeats,
    missedBeats: missCount,
    wrongInputBeats: 1,
    responseRate: (responsiveBeats / totalBeats) * 100,
    accuracyRate: (responsiveBeats - 1 > 0 ? (responsiveBeats - 1) / responsiveBeats : 1) * 100,
    perfectCount,
    excellentCount,
    goodCount,
    fairCount,
    poorCount,
    missCount,
    averagePoints: Math.max(20, 100 - classLevel * 10),
    consistency: Math.max(30, 100 - classLevel * 8),
    inputTypeStats: {
      [type]: {
        count: responsiveBeats,
        averageDeviation: taskAverage,
        averagePoints: Math.max(20, 100 - classLevel * 10),
      },
    },
  };
}

const PERFORMANCE_LEVEL: Record<TimingClass, string> = {
  7: '아주잘함', 6: '잘함', 5: '정상이상', 4: '정상', 3: '정상이하', 2: '못함', 1: '아주못함',
};
const PERCENTILE: Record<TimingClass, number> = { 7: 98, 6: 90, 5: 75, 4: 50, 3: 25, 2: 10, 1: 2 };

export function generateMockReport(): ComprehensiveAssessmentReport {
  const tests: { testName: string; type: InputType; ta: number; cls: TimingClass; mode: 'visual' | 'auditory' }[] = [
    { testName: '왼손 청각', type: 'left-hand', ta: 38, cls: 6, mode: 'auditory' },
    { testName: '왼손 시각', type: 'left-hand', ta: 52, cls: 5, mode: 'visual' },
    { testName: '오른손 청각', type: 'right-hand', ta: 29, cls: 7, mode: 'auditory' },
    { testName: '오른손 시각', type: 'right-hand', ta: 61, cls: 4, mode: 'visual' },
    { testName: '왼발 청각', type: 'left-foot', ta: 75, cls: 3, mode: 'auditory' },
    { testName: '왼발 시각', type: 'left-foot', ta: 88, cls: 3, mode: 'visual' },
    { testName: '오른발 청각', type: 'right-foot', ta: 45, cls: 5, mode: 'auditory' },
    { testName: '오른발 시각', type: 'right-foot', ta: 70, cls: 4, mode: 'visual' },
  ];

  const individualResults = tests.map((t) => ({
    testName: t.testName,
    sessionResults: mockSessionResults(t.ta, t.cls, t.type),
  }));

  const visualTests = tests.filter((t) => t.mode === 'visual');
  const auditoryTests = tests.filter((t) => t.mode === 'auditory');
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const visualTA = avg(visualTests.map((t) => t.ta));
  const auditoryTA = avg(auditoryTests.map((t) => t.ta));
  const visualClass = Math.round(avg(visualTests.map((t) => t.cls))) as TimingClass;
  const auditoryClass = Math.round(avg(auditoryTests.map((t) => t.cls))) as TimingClass;

  const leftTA = avg(tests.filter((t) => t.testName.startsWith('왼')).map((t) => t.ta));
  const rightTA = avg(tests.filter((t) => t.testName.startsWith('오른')).map((t) => t.ta));
  const rightBrain = Math.round((rightTA / (leftTA + rightTA)) * 100);
  const leftBrain = 100 - rightBrain;
  const brainDiff = Math.abs(leftBrain - rightBrain);

  const visualPercentile = PERCENTILE[visualClass];
  const auditoryPercentile = PERCENTILE[auditoryClass];
  const styleDiff = Math.abs(visualPercentile - auditoryPercentile);

  return {
    patientInfo: {
      name: '홍길동(샘플)',
      gender: 'male',
      age: 8,
      testDate: new Date().toISOString().split('T')[0],
    },
    processingCapability: {
      visual: { taskAverage: Math.round(visualTA), percentile: visualPercentile, level: PERFORMANCE_LEVEL[visualClass], classLevel: visualClass },
      auditory: { taskAverage: Math.round(auditoryTA), percentile: auditoryPercentile, level: PERFORMANCE_LEVEL[auditoryClass], classLevel: auditoryClass },
    },
    learningStyle: {
      dominantStyle: styleDiff < 5 ? 'balanced' : visualPercentile > auditoryPercentile ? 'visual' : 'auditory',
      difference: styleDiff,
      dominantLabel: styleDiff < 5 ? '균형적' : visualPercentile > auditoryPercentile ? '시각우성' : '청각우성',
    },
    attention: {
      visual: { percentile: 62, level: '보통', standardDeviation: 28 },
      auditory: { percentile: 78, level: '우수', standardDeviation: 17 },
    },
    brainSpeed: {
      taskAverage: Math.round((visualTA + auditoryTA) / 2),
      level: (visualTA + auditoryTA) / 2 < 50 ? '우수' : (visualTA + auditoryTA) / 2 < 100 ? '보통' : '미달',
      percentile: 65,
    },
    sustainability: {
      visual: { errorRate: 18, improvementRate: 0, earlyAverage: 48, lateAverage: 57 },
      auditory: { errorRate: 0, improvementRate: 22, earlyAverage: 41, lateAverage: 32 },
    },
    hemisphereBalance: {
      leftBrain,
      rightBrain,
      correlation: brainDiff < 10 ? '높음' : brainDiff < 20 ? '보통' : '낮음',
      difference: brainDiff,
    },
    individualResults,
    sessions: [],
  };
}
