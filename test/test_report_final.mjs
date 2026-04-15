import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shot = (n) => path.join(__dirname, n);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

await page.goto('http://localhost:5173/');
await page.waitForLoadState('load');
await page.evaluate(() => {
  const profile = { name: '홍길동', birthDate: '2010-03-15', gender: 'male', age: 15 };
  localStorage.setItem('userProfile', JSON.stringify(profile));
});

await page.goto('http://localhost:5173/#/assessment');
await page.waitForLoadState('load');
await page.waitForTimeout(800);
await page.locator('button', { hasText: '검사 시작' }).first().click();
await page.waitForTimeout(2000);

const result = await page.evaluate(() => {
  const rootEl = document.getElementById('root');
  const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer') || k.startsWith('__reactFiber'));
  if (!fiberKey) return 'no key';

  const findByName = (fiber, name) => {
    if (!fiber) return null;
    if (fiber.type && fiber.type.name === name) return fiber;
    return findByName(fiber.child, name) || findByName(fiber.sibling, name);
  };

  const f = findByName(rootEl[fiberKey], 'AssessmentPage');
  if (!f) return 'no AssessmentPage';

  // dispatch가 있는 hook만 수집
  const dispatches = [];
  let h = f.memoizedState;
  while (h) {
    if (h.queue && h.queue.dispatch) dispatches.push(h.queue.dispatch);
    h = h.next;
  }
  // dispatches: [0]=userProfile [1]=isLoading [2]=currentTestIndex [3]=phase
  //             [4]=countdown [5]=session [6]=currentBeat [7]=isRunning [8]=currentFeedback
  //             [9]=timeRemaining [10]=currentSide [11]=isActive [12]=allResults [13]=completedSessions

  const profile = { name: '홍길동', birthDate: '2010-03-15', gender: 'male', age: 15 };

  // 40비트짜리 mock beat 생성
  const makeBeat = (i, trainingType) => {
    const deviation = Math.floor(Math.random() * 80 + 20) * (Math.random() > 0.5 ? 1 : -1);
    return {
      beatNumber: i,
      expectedTime: i * 1000,
      expectedInput: { beatNumber: i, expectedTypes: ['left-hand'], isAlternating: true, alternateIndex: i % 2 },
      actualInput: { type: 'left-hand', timestamp: i * 1000 + deviation, source: 'keyboard', rawData: {} },
      actualTime: i * 1000 + deviation,
      deviation,
      isCorrectInput: true,
      isWrongInput: false,
      feedback: { category: 'good', deviation: Math.abs(deviation), direction: deviation > 0 ? 'late' : 'early', points: 70, color: '#84cc16', message: 'GOOD', displayText: Math.abs(deviation) + 'ms' },
    };
  };

  const assessmentSequence = [
    { trainingType: 'audio', trainingRange: 'left', bodyPart: 'hand' },
    { trainingType: 'visual', trainingRange: 'left', bodyPart: 'hand' },
    { trainingType: 'audio', trainingRange: 'right', bodyPart: 'hand' },
    { trainingType: 'visual', trainingRange: 'right', bodyPart: 'hand' },
    { trainingType: 'audio', trainingRange: 'left', bodyPart: 'foot' },
    { trainingType: 'visual', trainingRange: 'left', bodyPart: 'foot' },
    { trainingType: 'audio', trainingRange: 'right', bodyPart: 'foot' },
    { trainingType: 'visual', trainingRange: 'right', bodyPart: 'foot' },
  ];

  const taValues = [88, 72, 95, 80, 105, 90, 78, 85];

  const mockSessions = assessmentSequence.map((seq, idx) => {
    const beats = Array.from({ length: 40 }, (_, i) => makeBeat(i, seq.trainingType));
    return {
      sessionId: `mock-${idx}`,
      sessionNumber: idx,
      date: new Date().toISOString(),
      startTime: Date.now(),
      userProfile: profile,
      settings: { ...seq, bpm: 60, durationMinutes: 40/60, pattern: 'left-only' },
      beats,
      results: {
        taskAverage: taValues[idx],
        classLevel: 4,
        averagePoints: 70,
        consistency: 82,
        responseRate: 95,
        responsiveBeats: 38,
        totalBeats: 40,
        earlyHitPercent: 40,
        onTargetPercent: 35,
        lateHitPercent: 25,
        perfectCount: 4, excellentCount: 8, goodCount: 12, fairCount: 8, poorCount: 4, missCount: 4,
        missedBeats: 2, wrongInputBeats: 0,
        inputTypeStats: { 'left-hand': { count: 38, averageDeviation: taValues[idx], averagePoints: 70 } },
        accuracyRate: 95,
      }
    };
  });

  dispatches[3]('complete');          // setPhase('complete')
  dispatches[13](mockSessions);       // setCompletedSessions(mockSessions)
  return `ok: ${dispatches.length} dispatches`;
});
console.log('inject result:', result);

await page.waitForTimeout(1500);
await page.screenshot({ path: shot('report_01_top.png') });
console.log('report_01 캡처');

// 스크롤 내려가며 캡처
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(200);
await page.screenshot({ path: shot('report_02_mid1.png') });

await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(200);
await page.screenshot({ path: shot('report_03_mid2.png') });

await page.evaluate(() => window.scrollTo(0, 2300));
await page.waitForTimeout(200);
await page.screenshot({ path: shot('report_04_mid3.png') });

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
await page.screenshot({ path: shot('report_05_bottom.png') });
console.log('report_01~05 전체 캡처 완료');

await browser.close();
console.log('완료');
