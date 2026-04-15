import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shot = (n) => path.join(__dirname, n);

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

// assessment 페이지 진입 후 '검사 시작' 클릭
await page.goto('http://localhost:5173/#/assessment');
await page.waitForLoadState('load');
await page.waitForTimeout(800);
await page.locator('button', { hasText: '검사 시작' }).first().click();
await page.waitForTimeout(2000); // 카운트다운 진행 중

// 모든 React fiber key 와 hook 상태 덤프
const debugInfo = await page.evaluate(() => {
  const rootEl = document.getElementById('root');
  const allKeys = Object.keys(rootEl).filter(k => k.startsWith('__react'));

  const findByName = (fiber, name) => {
    if (!fiber) return null;
    if (fiber.type && fiber.type.name === name) return fiber;
    return findByName(fiber.child, name) || findByName(fiber.sibling, name);
  };

  if (!allKeys.length) return { keys: 'none', error: 'no react keys' };
  const fiber = rootEl[allKeys[0]];
  const assessmentFiber = findByName(fiber, 'AssessmentPage');
  if (!assessmentFiber) return { keys: allKeys, error: 'no AssessmentPage' };

  // 모든 hook의 memoizedState 값 수집
  const hooks = [];
  let h = assessmentFiber.memoizedState;
  while (h) {
    hooks.push({
      hasDispatch: !!(h.queue && h.queue.dispatch),
      value: (() => {
        try {
          const v = h.memoizedState;
          if (v === null || v === undefined) return String(v);
          if (typeof v === 'object' && v.tag !== undefined) return '[useRef/useEffect]';
          return typeof v === 'object' ? JSON.stringify(v).slice(0, 60) : String(v);
        } catch { return '[error]'; }
      })()
    });
    h = h.next;
  }
  return { keys: allKeys, hookCount: hooks.length, hooks };
});
console.log('debug:', JSON.stringify(debugInfo, null, 2));

await browser.close();
