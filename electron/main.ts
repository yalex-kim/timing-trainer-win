import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { SerialPort } from 'serialport';

let mainWindow: BrowserWindow | null = null;
let currentPort: SerialPort | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 개발 모드: VITE_DEV_SERVER_URL 환경변수 또는 app.isPackaged로 판단
  const isDev = !app.isPackaged;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Serial Port IPC Handlers
ipcMain.handle('serial:list', async () => {
  try {
    const ports = await SerialPort.list();
    return ports;
  } catch (err) {
    console.error('Error listing ports:', err);
    return [];
  }
});


const closeCurrentPort = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!currentPort) return resolve();
    const port = currentPort;
    currentPort = null;

    port.removeAllListeners('data');

    const doClose = () => {
      if (!port.isOpen) return resolve();
      const onClose = () => resolve();
      port.once('close', onClose);
      port.close((err) => {
        if (err) {
          port.off('close', onClose);
          console.error('Error closing port:', err);
          resolve();
        }
      });
    };

    // 포트가 열리는 중이면 open 이벤트 후에 닫기
    if ((port as any).opening) {
      port.once('open', doClose);
      port.once('error', () => resolve()); // open 실패 시
    } else {
      doClose();
    }
  });
};

ipcMain.handle('serial:connect', async (_, path: string, baudRate: number) => {
  await closeCurrentPort();

  return new Promise((resolve, reject) => {
    currentPort = new SerialPort({ path, baudRate });

    // Qtrainer_YB는 버튼 누름마다 단일 ASCII 문자를 전송 (줄바꿈 없음)
    // '1'=왼손, '2'=오른손, '3'=왼발, '4'=오른발
    currentPort.on('data', (chunk: Buffer) => {
      if (mainWindow) {
        const str = chunk.toString('ascii');
        for (const char of str) {
          mainWindow.webContents.send('serial:data', char);
        }
      }
    });

    currentPort.on('open', () => {
      resolve(true);
    });

    currentPort.on('error', (err) => {
      reject(err.message);
    });
  });
});

// 패키징 시: 실행파일 옆 TT_Result 폴더, 개발 시: 프로젝트 루트 옆 TT_Result 폴더
function getResultDir(): string {
  const baseDir = app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : path.resolve(__dirname, '../..');
  const resultDir = path.join(baseDir, 'TT_Result');

  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }
  return resultDir;
}

// 현재 렌더러 화면을 Chromium 네이티브 인쇄 엔진으로 PDF 변환 (텍스트 선택/검색 가능한 진짜 PDF)
ipcMain.handle('file:printToPDF', async (event, fileName: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    throw new Error('PDF 생성 대상 창을 찾을 수 없습니다.');
  }

  // margins 단위: Electron 타입 정의 주석은 "픽셀"이라고 되어 있지만 실제로는 Chromium
  // CDP Page.printToPDF와 동일하게 inch 단위로 동작한다 (px로 넣으면 "margins must be
  // less than or equal to pageSize" 에러 발생 — 런타임에서 확인). 0.4in ≈ 10mm.
  const pdfBuffer = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
  });

  const filePath = path.join(getResultDir(), fileName);
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
});

const EXCEL_HEADERS = [
  '날짜', '시간', '이름', '성별', '나이', '검사명',
  'Task Average(ms)', '등급', '정답률(%)', '응답률(%)',
  'PERFECT', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'MISS',
  '빠른반응(%)', '느린반응(%)', '정확반응(%)', '표준편차',
];
const EXCEL_KEYS = [
  'date', 'time', 'name', 'gender', 'age', 'testName',
  'taskAverage', 'classLevel', 'accuracyRate', 'responseRate',
  'perfectCount', 'excellentCount', 'goodCount', 'fairCount', 'poorCount', 'missCount',
  'earlyHitPercent', 'lateHitPercent', 'onTargetPercent', 'standardDeviation',
];

ipcMain.handle('file:appendExcel', async (_, rows: Record<string, unknown>[]) => {
  const filePath = path.join(getResultDir(), 'TimingTrainer_Assessment_Data.xlsx');
  const workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet;

  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
    worksheet = workbook.getWorksheet('결과') ?? workbook.addWorksheet('결과');
  } else {
    worksheet = workbook.addWorksheet('결과');
    const headerRow = worksheet.addRow(EXCEL_HEADERS);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    worksheet.columns = EXCEL_KEYS.map(() => ({ width: 16 }));
  }

  for (const row of rows) {
    worksheet.addRow(EXCEL_KEYS.map(k => row[k] ?? ''));
  }

  await workbook.xlsx.writeFile(filePath);
  return filePath;
});

ipcMain.handle('serial:disconnect', async () => {
  console.log('[serial:disconnect] called, currentPort:', currentPort?.path ?? 'null');
  await closeCurrentPort();
  console.log('[serial:disconnect] done');
  return true;
});
