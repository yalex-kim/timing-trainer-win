import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shot = (n) => path.join(__dirname, n);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

await page.goto('http://localhost:5173/');
await page.waitForLoadState('load');
await page.evaluate(() => {
  localStorage.setItem('userProfile', JSON.stringify({ name: '홍길동', birthDate: '2010-03-15', gender: 'male', age: 15 }));
});

await page.goto('http://localhost:5173/#/assessment');
await page.waitForLoadState('load');
await page.waitForTimeout(800);
await page.locator('button', { hasText: '검사 시작' }).first().click();
await page.waitForTimeout(2000);

await page.evaluate(() => {
  const rootEl = document.getElementById('root');
  const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer'));
  const findByName = (fiber, name) => {
    if (!fiber) return null;
    if (fiber.type && fiber.type.name === name) return fiber;
    return findByName(fiber.child, name) || findByName(fiber.sibling, name);
  };
  const f = findByName(rootEl[fiberKey], 'AssessmentPage');
  const dispatches = [];
  let h = f.memoizedState;
  while (h) { if (h.queue && h.queue.dispatch) dispatches.push(h.queue.dispatch); h = h.next; }
  const profile = { name: '홍길동', birthDate: '2010-03-15', gender: 'male', age: 15 };
  const makeBeat = (i) => {
    const deviation = Math.floor(Math.random() * 80 + 20) * (Math.random() > 0.5 ? 1 : -1);
    return { beatNumber: i, expectedTime: i*1000, expectedInput: { beatNumber: i, expectedTypes: ['left-hand'], isAlternating: true, alternateIndex: i%2 }, actualInput: { type: 'left-hand', timestamp: i*1000+deviation, source: 'keyboard', rawData: {} }, actualTime: i*1000+deviation, deviation, isCorrectInput: true, isWrongInput: false, feedback: { category: 'good', deviation: Math.abs(deviation), direction: deviation>0?'late':'early', points: 70, color: '#84cc16', message: 'GOOD', displayText: Math.abs(deviation)+'ms' } };
  };
  const seq = [
    { trainingType: 'audio', trainingRange: 'left', bodyPart: 'hand' }, { trainingType: 'visual', trainingRange: 'left', bodyPart: 'hand' },
    { trainingType: 'audio', trainingRange: 'right', bodyPart: 'hand' }, { trainingType: 'visual', trainingRange: 'right', bodyPart: 'hand' },
    { trainingType: 'audio', trainingRange: 'left', bodyPart: 'foot' }, { trainingType: 'visual', trainingRange: 'left', bodyPart: 'foot' },
    { trainingType: 'audio', trainingRange: 'right', bodyPart: 'foot' }, { trainingType: 'visual', trainingRange: 'right', bodyPart: 'foot' },
  ];
  const taValues = [88, 72, 95, 80, 105, 90, 78, 85];
  const mockSessions = seq.map((s, i) => ({ sessionId: `mock-${i}`, sessionNumber: i, date: new Date().toISOString(), startTime: Date.now(), userProfile: profile, settings: { ...s, bpm: 60, durationMinutes: 40/60, pattern: 'left-only' }, beats: Array.from({ length: 40 }, (_, j) => makeBeat(j)), results: { taskAverage: taValues[i], classLevel: 4, averagePoints: 70, consistency: 82, responseRate: 95, responsiveBeats: 38, totalBeats: 40, earlyHitPercent: 40, onTargetPercent: 35, lateHitPercent: 25, perfectCount: 4, excellentCount: 8, goodCount: 12, fairCount: 8, poorCount: 4, missCount: 4, missedBeats: 2, wrongInputBeats: 0, inputTypeStats: { 'left-hand': { count: 38, averageDeviation: taValues[i], averagePoints: 70 } }, accuracyRate: 95 } }));
  dispatches[3]('complete');
  dispatches[13](mockSessions);
});

await page.waitForTimeout(1500);

// 1. 리포트 최상단 (버튼 바 포함)
await page.screenshot({ path: shot('sticky_01_top.png') });

// 2. 스크롤 후 버튼 바가 고정되어 있는지 확인
await page.evaluate(() => { document.documentElement.scrollTop = 800; });
await page.waitForTimeout(300);
await page.screenshot({ path: shot('sticky_02_scrolled_800.png') });

await page.evaluate(() => { document.documentElement.scrollTop = 2000; });
await page.waitForTimeout(300);
await page.screenshot({ path: shot('sticky_03_scrolled_2000.png') });

await page.evaluate(() => { document.documentElement.scrollTop = 4000; });
await page.waitForTimeout(300);
await page.screenshot({ path: shot('sticky_04_scrolled_bottom.png') });

console.log('sticky 버튼 스크린샷 완료');
await browser.close();
