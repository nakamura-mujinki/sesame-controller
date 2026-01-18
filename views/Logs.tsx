import React, { useState, useEffect } from 'react';
import { DbOperationLog } from '../services/supabase';
import { getLogs } from '../services/logService';
import { IconList } from '../components/Icons';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<DbOperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getLogs(50);
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      time: date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
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
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="px-6 py-3 bg-surface border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-primary">Logs</h1>
          <span className="text-[10px] text-gray-400">Last 50</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar scroll-container momentum-scroll">
        {logs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <IconList className="w-10 h-10 mb-2 opacity-20" />
             <p className="text-xs">No activity recorded</p>
           </div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-surface">
            {logs.map((log) => {
              const { date, time } = formatDateTime(log.created_at);
              const isError = log.status === 'error';
              return (
                <li key={log.id} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isError ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className={`text-xs truncate ${isError ? 'text-red-500' : 'text-gray-700'}`}>
                      {log.message || `${log.action}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {date} {time}
                  </span>
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
