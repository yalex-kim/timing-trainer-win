import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shot = (name) => path.join(__dirname, name);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

// 프로필 주입
await page.goto('http://localhost:5173/');
await page.waitForLoadState('load');
await page.evaluate(() => {
  const profile = { name: '홍길동', birthDate: '2010-03-15', gender: 'male', age: 15 };
  localStorage.setItem('userProfile', JSON.stringify(profile));
});

// ── 1) SessionResults 전체 캡처 ──
const trainingUrl = 'http://localhost:5173/#/training?trainingType=visual&bodyPart=hand&trainingRange=both&bpm=120&duration=1';
await page.goto(trainingUrl);
await page.waitForLoadState('load');
await page.waitForTimeout(4500);

for (let i = 0; i < 15; i++) {
  await page.keyboard.press('e');
  await page.waitForTimeout(480);
  await page.keyboard.press('i');
  await page.waitForTimeout(480);
}

await page.waitForSelector('text=훈련 결과', { timeout: 70000 });
await page.waitForTimeout(600);
await page.screenshot({ path: shot('r01_results_top.png') });

// overflow-y-auto fixed div 스크롤
const container = await page.$('.fixed.overflow-y-auto');
if (container) {
  await container.evaluate(el => el.scrollTop = 500);
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('r02_results_mid.png') });
  await container.evaluate(el => el.scrollTop = el.scrollHeight);
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('r03_results_bottom.png') });
}
console.log('r01~r03 SessionResults 캡처 완료');

// ── 2) AssessmentPage — React fiber로 'complete' + mock report 주입 ──
await page.goto('http://localhost:5173/#/assessment');
await page.waitForLoadState('load');
await page.waitForTimeout(600);

await page.screenshot({ path: shot('r04_assessment_ready.png') });

// 검사 시작 버튼
await page.locator('button', { hasText: '검사 시작' }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: shot('r05_assessment_countdown.png') });

// React fiber를 통해 phase='complete', report=mockReport 주입
const injected = await page.evaluate(() => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return 'no root';
  const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
  if (!fiberKey) return 'no fiber key';

  const findByName = (fiber, name) => {
    if (!fiber) return null;
    if (fiber.type && fiber.type.name === name) return fiber;
    return findByName(fiber.child, name) || findByName(fiber.sibling, name);
  };

  const f = findByName(rootEl[fiberKey], 'AssessmentPage');
  if (!f) return 'AssessmentPage not found';

  const dispatches = [];
  let hook = f.memoizedState;
  while (hook) {
    if (hook.queue && hook.queue.dispatch) dispatches.push(hook.queue.dispatch);
    hook = hook.next;
  }

  const mockSessionResult = {
    taskAverage: 85, classLevel: 4, averagePoints: 65,
    consistency: 78, responseRate: 88.5, responsiveBeats: 35, totalBeats: 40,
    earlyHitPercent: 30, onTargetPercent: 45, lateHitPercent: 25,
    perfectCount: 8, excellentCount: 10, goodCount: 9, fairCount: 5, poorCount: 2, missCount: 6,
    missedBeats: 5, wrongInputBeats: 0,
    inputTypeStats: { 'left-hand': { count: 35, averageDeviation: 82, averagePoints: 66 } },
    accuracyRate: 88.5
  };

  const mockReport = {
    patientInfo: { name: '홍길동', age: 15, gender: 'male', testDate: '2026-04-15' },
    processingCapability: {
      visual:   { taskAverage: 88, classLevel: 4, level: '보통', percentile: 55 },
      auditory: { taskAverage: 72, classLevel: 5, level: '잘함', percentile: 70 }
    },
    learningStyle: { dominantStyle: 'auditory', dominantLabel: '청각 우세', difference: 15 },
    attention: {
      visual:   { standardDeviation: 42, level: '보통', percentile: 58 },
      auditory: { standardDeviation: 35, level: '잘함', percentile: 72 }
    },
    brainSpeed:   { taskAverage: 80, level: '보통', percentile: 60 },
    sustainability: {
      visual:   { earlyAverage: 90, lateAverage: 86, errorRate: 5, improvementRate: 4 },
      auditory: { earlyAverage: 78, lateAverage: 70, errorRate: 3, improvementRate: 10 }
    },
    hemisphereBalance: { leftBrain: 52, rightBrain: 48, correlation: '높음', difference: 4 },
    individualResults: [
      { testName: '왼손 청각',  sessionResults: { ...mockSessionResult, taskAverage: 92 } },
      { testName: '왼손 시각',  sessionResults: { ...mockSessionResult, taskAverage: 88 } },
      { testName: '오른손 청각',sessionResults: { ...mockSessionResult, taskAverage: 78 } },
      { testName: '오른손 시각',sessionResults: { ...mockSessionResult, taskAverage: 82 } },
      { testName: '왼발 청각',  sessionResults: { ...mockSessionResult, taskAverage: 95 } },
      { testName: '왼발 시각',  sessionResults: { ...mockSessionResult, taskAverage: 101 } },
      { testName: '오른발 청각',sessionResults: { ...mockSessionResult, taskAverage: 76 } },
      { testName: '오른발 시각',sessionResults: { ...mockSessionResult, taskAverage: 84 } },
    ]
  };

  // hook 순서: currentTestIndex(0), phase(1), countdown(2), session(3), ...
  // phase dispatch = dispatches[1]
  // report는 마지막 useState
  if (dispatches.length < 2) return `not enough dispatches: ${dispatches.length}`;
  dispatches[1]('complete');
  dispatches[dispatches.length - 1](mockReport);
  return `ok: ${dispatches.length} dispatches`;
});
console.log('inject:', injected);

await page.waitForTimeout(1500);
await page.screenshot({ path: shot('r06_report_top.png') });

// 리포트 스크롤
const reportBody = await page.$('.min-h-screen.bg-gray-50');
if (reportBody) {
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('r07_report_mid.png') });
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('r08_report_lower.png') });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('r09_report_bottom.png') });
}
console.log('r06~r09 ComprehensiveReport 캡처 완료');

await browser.close();
console.log('전체 완료');
