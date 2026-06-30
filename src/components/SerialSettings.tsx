import { useState, useEffect, useCallback } from 'react';
import { BODY_PART_HEX } from '@/utils/bodyPartColors';
import { KEYBOARD_LABELS } from '@/config/inputMapping';
import type { InputType } from '@/types/evaluation';

interface SerialSettingsProps {
  onStatusChange?: (isConnected: boolean, portPath: string) => void;
  initialConnected?: boolean;
  initialPortPath?: string;
}

const KEY_LABELS: { type: InputType; label: string }[] = [
  { type: 'left-hand', label: '왼손' },
  { type: 'right-hand', label: '오른손' },
  { type: 'left-foot', label: '왼발' },
  { type: 'right-foot', label: '오른발' },
];

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
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-tt-heading">USB 시리얼 장치</h3>
          <button
            onClick={fetchPorts}
            disabled={isScanning || isConnected}
            className="text-xs font-semibold text-tt-teal hover:text-tt-teal-dark disabled:text-tt-light-muted"
          >
            {isScanning ? '검색 중...' : '장치 새로고침'}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-tt-muted mb-1.5">
              포트 선택
            </label>
            <div className="flex gap-2.5">
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={isConnected}
                className="flex-1 border border-tt-border-alt p-2.5 rounded-lg font-mono text-sm focus:ring-2 focus:ring-tt-teal bg-tt-bg text-tt-heading"
              >
                {ports.length === 0 && <option value="">검색된 포트 없음</option>}
                {ports.map((port) => (
                  <option key={port.path} value={port.path}>
                    {isFtdiPort(port) ? '★ ' : ''}{port.path}{port.manufacturer ? ` (${port.manufacturer})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={!selectedPort && !isConnected}
                className={`px-5 rounded-lg text-white font-bold text-sm transition-all ${
                  isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-tt-teal hover:bg-tt-teal-dark'
                }`}
              >
                {isConnected ? '연결 해제' : '연결'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tt-muted mb-1.5">
              Baud Rate
            </label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={isConnected}
              className="w-full border border-tt-border-alt p-2.5 rounded-lg font-mono text-sm focus:ring-2 focus:ring-tt-teal bg-tt-bg text-tt-heading"
            >
              <option value={9600}>9600</option>
              <option value={19200}>19200</option>
              <option value={38400}>38400</option>
              <option value={57600}>57600</option>
              <option value={115200}>115200</option>
            </select>
          </div>

          <div>
            <div className="text-xs font-semibold text-tt-muted mb-1.5">통신 설정 (Timing-Trainer 고정값)</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Baud Rate', '115200'],
                ['Data Bits', '8'],
                ['Stop Bits', '1'],
                ['Parity', 'None'],
              ].map(([label, value]) => (
                <div key={label} className="bg-tt-bg border border-tt-border-soft rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-tt-light-muted">{label}</span>
                  <span className="font-mono text-xs font-semibold text-tt-heading">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 mt-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-700 font-medium">
              {selectedPort} 포트에 연결됨
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-tt-border-soft pt-4">
        <h3 className="text-base font-extrabold text-tt-heading mb-1">키보드 매핑</h3>
        <p className="text-xs text-tt-light-muted mb-3">장치가 없을 때 키보드로 입력할 수 있습니다.</p>
        <div className="flex flex-col gap-2">
          {KEY_LABELS.map(({ type, label }) => (
            <div key={type} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tt-dark-panel text-white flex items-center justify-center font-mono text-base font-semibold flex-none">
                {KEYBOARD_LABELS[type]}
              </div>
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: BODY_PART_HEX[type] }} />
              <span className="text-sm font-bold text-tt-heading">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SerialSettings;
