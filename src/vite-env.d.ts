// global.d.ts
/// <reference types="vite/client" />
export {};

declare global {
  const __APP_VERSION__: string;

  interface Window {
    electronAPI: {
      listPorts: () => Promise<any[]>;
      connect: (path: string, baudRate: number) => Promise<boolean>;
      disconnect: () => Promise<boolean>;
      onData: (callback: (data: string) => void) => void;
      printToPDF: (fileName: string) => Promise<string>;
      appendExcel: (rows: Record<string, unknown>[]) => Promise<string>;
    };
  }
}
