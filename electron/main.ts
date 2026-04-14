import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { SerialPort } from 'serialport';

let mainWindow: BrowserWindow | null = null;
let currentPort: SerialPort | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
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

ipcMain.handle('serial:disconnect', async () => {
  console.log('[serial:disconnect] called, currentPort:', currentPort?.path ?? 'null');
  await closeCurrentPort();
  console.log('[serial:disconnect] done');
  return true;
});
