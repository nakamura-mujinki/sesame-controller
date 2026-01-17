import React, { useState, useEffect } from 'react';
import { DbOperationLog } from '../services/supabase';
import { getLogs } from '../services/logService';
import { IconList } from '../components/Icons';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<DbOperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-6 py-6 bg-surface border-b border-border shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-primary">Logs</h1>
        <p className="text-xs text-gray-500 mt-0.5">Recent activity</p>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {logs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <IconList className="w-10 h-10 mb-2 opacity-20" />
             <p className="text-xs">No activity recorded</p>
           </div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-surface">
            {logs.map((log) => {
              const { date, time } = formatDateTime(log.created_at);
              return (
                <li key={log.id} className="px-6 py-4 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${
                      log.status === 'error' ? 'text-red-500' : 'text-primary'
                    }`}>
                      {log.message || `${log.action} on ${log.device_type}`}
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-mono block">{time}</span>
                      <span className="text-[9px] text-gray-300 font-mono">{date}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Logs;
