import React, { useState, useEffect } from 'react';
import { DbDevice } from '../services/supabase';
import { getDevices } from '../services/sesameService';
import DeviceCard from '../components/DeviceCard';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [devices, setDevices] = useState<DbDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      const data = await getDevices();
      setDevices(data);
      setLoading(false);
    };
    fetchDevices();
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-6 py-6 bg-surface border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-primary">Control</h1>
          <p className="text-xs text-gray-500 mt-0.5">Welcome home</p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No devices found</div>
        ) : (
          devices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))
        )}
      </main>
    </div>
  );
};

export default Dashboard;