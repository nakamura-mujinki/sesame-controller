import React, { useState, useEffect } from 'react';
import { DbDevice, DbSchedule } from '../services/supabase';
import { getDevices } from '../services/sesameService';
import { getSchedules, createSchedule, deleteSchedule } from '../services/scheduleService';
import Button from '../components/Button';
import { IconClock, IconTrash, IconPlus } from '../components/Icons';

const DAYS = [
  { value: 0, label: '日' },
  { value: 1, label: '月' },
  { value: 2, label: '火' },
  { value: 3, label: '水' },
  { value: 4, label: '木' },
  { value: 5, label: '金' },
  { value: 6, label: '土' },
];

const Schedule: React.FC = () => {
  const [devices, setDevices] = useState<DbDevice[]>([]);
  const [schedules, setSchedules] = useState<DbSchedule[]>([]);
  const [deviceUuid, setDeviceUuid] = useState('');
  const [action, setAction] = useState('on');
  const [time, setTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [devs, scheds] = await Promise.all([getDevices(), getSchedules()]);
      setDevices(devs);
      setSchedules(scheds);
      if (devs.length > 0) {
        setDeviceUuid(devs[0].device_uuid);
        setAction(devs[0].device_type === 'bot' ? 'on' : 'lock');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const selectedDevice = devices.find(d => d.device_uuid === deviceUuid);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearAllDays = () => {
    setSelectedDays([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !selectedDevice) return;

    setSubmitting(true);
    const [hours, minutes] = time.split(':').map(Number);

    const actionLabel = action === 'on' ? 'Turn On' : action === 'off' ? 'Turn Off' : action === 'lock' ? 'Lock' : 'Unlock';
    const name = `${selectedDevice.name.split('(')[0].trim()} -> ${actionLabel}`;

    const newSchedule = await createSchedule({
      name,
      device_type: selectedDevice.device_type,
      device_uuid: deviceUuid,
      action,
      time_hour: hours,
      time_minute: minutes,
      days_of_week: selectedDays.length === 0 || selectedDays.length === 7 ? null : selectedDays,
    });

    if (newSchedule) {
      setSchedules(prev => [...prev, newSchedule]);
    }
    setTime('');
    setSelectedDays([]);
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSchedule(id);
    if (success) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatDays = (daysOfWeek: number[] | null) => {
    if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) {
      return '毎日';
    }
    return daysOfWeek.map(d => DAYS.find(day => day.value === d)?.label).join(' ');
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
        <h1 className="text-xl font-semibold tracking-tight text-primary">Timer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Schedule automated tasks (UTC+9)</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Add Task Form */}
        <div className="bg-surface p-5 rounded-lg border border-border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Device</label>
              <select
                value={deviceUuid}
                onChange={(e) => {
                  setDeviceUuid(e.target.value);
                  const dev = devices.find(d => d.device_uuid === e.target.value);
                  if (dev) {
                    setAction(dev.device_type === 'bot' ? 'on' : 'lock');
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              >
                {devices.map(d => (
                  <option key={d.device_uuid} value={d.device_uuid}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                >
                  {selectedDevice?.device_type === 'bot' ? (
                    <>
                      <option value="on">On (Scn 2)</option>
                      <option value="off">Off (Scn 1)</option>
                    </>
                  ) : (
                    <>
                      <option value="lock">Lock</option>
                      <option value="unlock">Unlock</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Day of Week Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Days</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllDays}
                    className="text-[10px] text-primary hover:underline"
                  >
                    All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllDays}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex gap-1">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedDays.includes(day.value)
                        ? day.value === 0 ? 'bg-red-500 text-white'
                          : day.value === 6 ? 'bg-blue-500 text-white'
                          : 'bg-primary text-white'
                        : 'bg-background border border-border text-gray-500 hover:border-primary'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {selectedDays.length === 0 ? '未選択 = 毎日' : formatDays(selectedDays)}
              </p>
            </div>

            <Button type="submit" variant="secondary" className="w-full gap-2 mt-2" disabled={!time || submitting} isLoading={submitting}>
              <IconPlus className="w-4 h-4" />
              <span>Set Timer</span>
            </Button>
          </form>
        </div>

        {/* List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 px-1">Active Schedules</h3>
          {schedules.filter(s => s.enabled).length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <IconClock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">No active timers</p>
            </div>
          ) : (
            schedules.filter(s => s.enabled).map(schedule => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-full bg-accent/20 text-primary flex items-center justify-center text-xs font-bold">
                    {formatTime(schedule.time_hour, schedule.time_minute)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">{schedule.name}</span>
                    <span className="text-[10px] text-gray-400">{formatDays(schedule.days_of_week)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-2"
                >
                  <IconTrash className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Schedule;
