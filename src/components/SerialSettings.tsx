import { useState, useEffect, useCallback } from 'react';

interface SerialSettingsProps {
  onStatusChange?: (isConnected: boolean, portPath: string) => void;
  initialConnected?: boolean;
  initialPortPath?: string;
}

const SerialSettings = ({ onStatusChange, initialConnected = false, initialPortPath = '' }: SerialSettingsProps) => {
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState(initialPortPath);
  const [baudRate, setBaudRate] = useState(115200);
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [isScanning, setIsScanning] = useState(false);

  const isFtdiPort = (port: any): boolean => {
    const mfr = (port.manufacturer ?? '').toLowerCase();
    const vid = (port.vendorId ?? '').toLowerCase();
    const pnp = (port.pnpId ?? '').toLowerCase();
    return (
      mfr.includes('ftdi') ||
      mfr.includes('future technology') ||
      vid === '0403' ||
      pnp.includes('vid_0403')
    );
  };

  const fetchPorts = useCallback(async () => {
    setIsScanning(true);
    try {
      const portList = await window.electronAPI.listPorts();
      // FTDI 장치를 목록 최상단으로 정렬
      const sorted = [...portList].sort((a, b) => {
        const aFtdi = isFtdiPort(a) ? 0 : 1;
        const bFtdi = isFtdiPort(b) ? 0 : 1;
        return aFtdi - bFtdi;
      });
      setPorts(sorted);
      if (sorted.length > 0 && !selectedPort) {
        setSelectedPort(sorted[0].path);
      }
    } catch (err) {
      console.error('Failed to list ports:', err);
    } finally {
      setIsScanning(false);
    }
  }, [selectedPort]);

  useEffect(() => {
    fetchPorts();
  }, [fetchPorts]);

  const handleConnect = async () => {
    try {
      await window.electronAPI.connect(selectedPort, baudRate);
      setIsConnected(true);
      onStatusChange?.(true, selectedPort);
    } catch (err: any) {
      alert('연결 실패: ' + err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.disconnect();
    } catch (err: any) {
      console.error('Disconnect failed:', err);
    } finally {
      setIsConnected(false);
      onStatusChange?.(false, '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">시리얼 포트 설정</h3>
        <button
          onClick={fetchPorts}
          disabled={isScanning || isConnected}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {isScanning ? '검색 중...' : '장치 새로고침'}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            포트 선택
          </label>
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={isConnected}
            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {ports.length === 0 && <option value="">검색된 포트 없음</option>}
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {isFtdiPort(port) ? '★ ' : ''}{port.path}{port.manufacturer ? ` (${port.manufacturer})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Baud Rate
          </label>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={isConnected}
            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value={9600}>9600</option>
            <option value={19200}>19200</option>
            <option value={38400}>38400</option>
            <option value={57600}>57600</option>
            <option value={115200}>115200</option>
          </select>
        </div>

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={!selectedPort && !isConnected}
          className={`w-full py-3 rounded-lg text-white font-bold transition-all shadow-md ${
            isConnected
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isConnected ? '연결 해제' : '장치 연결하기'}
        </button>
      </div>

      {isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 font-medium">
            {selectedPort} 포트에 연결됨
          </span>
        </div>
      )}
    </div>
  );
};

export default SerialSettings;
