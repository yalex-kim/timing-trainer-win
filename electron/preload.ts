// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  listPorts: () => ipcRenderer.invoke('serial:list'),
  connect: (path: string, baudRate: number) => ipcRenderer.invoke('serial:connect', path, baudRate),
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  onData: (callback: (data: string) => void) => {
    ipcRenderer.on('serial:data', (_event, value) => callback(value));
  }
});
