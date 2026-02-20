import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

let mainWindow: BrowserWindow | null = null;
let currentPort: SerialPort | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
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

ipcMain.handle('serial:connect', async (_, path: string, baudRate: number) => {
  if (currentPort && currentPort.isOpen) {
    currentPort.close();
  }

  return new Promise((resolve, reject) => {
    currentPort = new SerialPort({ path, baudRate });

    const parser = currentPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', (data: string) => {
      if (mainWindow) {
        mainWindow.webContents.send('serial:data', data.trim());
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
  if (currentPort && currentPort.isOpen) {
    return new Promise((resolve, reject) => {
      currentPort?.close((err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
  return true;
});
