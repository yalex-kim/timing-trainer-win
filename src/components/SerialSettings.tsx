// SerialSettings.tsx
import { useState, useEffect } from 'react';

const SerialSettings = () => {
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [baudRate, setBaudRate] = useState(115200);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // List ports on mount
    const fetchPorts = async () => {
      const portList = await window.electronAPI.listPorts();
      setPorts(portList);
      if (portList.length > 0) setSelectedPort(portList[0].path);
    };
    fetchPorts();
  }, []);

  const handleConnect = async () => {
    try {
      await window.electronAPI.connect(selectedPort, baudRate);
      setIsConnected(true);
      alert('Connected to ' + selectedPort);
    } catch (err: any) {
      alert('Failed to connect: ' + err.message);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded border border-gray-300 mb-4">
      <h3 className="font-bold mb-2">Serial Port Settings</h3>
      <div className="flex gap-2">
        <select
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          className="border p-2 rounded"
        >
          {ports.map((port) => (
            <option key={port.path} value={port.path}>
              {port.path} ({port.manufacturer || 'Unknown'})
            </option>
          ))}
        </select>
        <button
          onClick={handleConnect}
          disabled={isConnected}
          className={`px-4 py-2 rounded text-white ${isConnected ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {isConnected ? 'Connected' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default SerialSettings;
