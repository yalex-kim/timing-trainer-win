// global.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      listPorts: () => Promise<any[]>;
      connect: (path: string, baudRate: number) => Promise<boolean>;
      disconnect: () => Promise<boolean>;
      onData: (callback: (data: string) => void) => void;
    };
  }
}
