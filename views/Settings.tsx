import React, { useState, useEffect } from 'react';
import { DbDevice, DeviceType, DEVICE_IMAGES, DEVICE_NAMES } from '../services/supabase';
import { getAllDevices, addDevice, toggleDeviceVisibility, updateScenarioNames } from '../services/deviceService';
import { getUserSettings, saveApiKey } from '../services/userSettingsService';
import Button from '../components/Button';
import { IconPlus } from '../components/Icons';

// All available device types for the selector
const DEVICE_TYPE_OPTIONS: DeviceType[] = ['sesame5', 'sesame5_pro', 'bot2'];

// Eye icon for visibility toggle
const IconEye = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconEyeSlash = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const Settings: React.FC = () => {
  const [devices, setDevices] = useState<DbDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('sesame5');
  const [deviceUuid, setDeviceUuid] = useState('');
  const [secretKey, setSecretKey] = useState('');

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scenario editing state
  const [editingScenarioDevice, setEditingScenarioDevice] = useState<string | null>(null);
  const [scenario1Name, setScenario1Name] = useState('');
  const [scenario2Name, setScenario2Name] = useState('');
  const [savingScenario, setSavingScenario] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [devicesData, settings] = await Promise.all([
        getAllDevices(),
        getUserSettings(),
      ]);
      setDevices(devicesData);
      if (settings?.sesame_api_key) {
        setHasApiKey(true);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingApiKey(true);
    setApiKeyMessage(null);

    const success = await saveApiKey(apiKey.trim());
    if (success) {
      setHasApiKey(true);
      setApiKey('');
      setApiKeyMessage({ type: 'success', text: 'API Key saved!' });
    } else {
      setApiKeyMessage({ type: 'error', text: 'Failed to save API Key' });
    }
    setSavingApiKey(false);
  };

  const resetForm = () => {
    setName('');
    setDeviceType('sesame5');
    setDeviceUuid('');
    setSecretKey('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !deviceUuid || !secretKey) return;

    setSubmitting(true);
    const newDevice = await addDevice({
      name,
      device_type: deviceType,
      device_uuid: deviceUuid,
      secret_key: secretKey,
    });

    if (newDevice) {
      setDevices(prev => [...prev, newDevice]);
      resetForm();
    }
    setSubmitting(false);
  };

  const handleToggleVisibility = async (device: DbDevice) => {
    const newVisible = !device.visible;
    const success = await toggleDeviceVisibility(device.id, newVisible);
    if (success) {
      setDevices(prev =>
        prev.map(d => d.id === device.id ? { ...d, visible: newVisible } : d)
      );
    }
  };

  const startEditingScenario = (device: DbDevice) => {
    setEditingScenarioDevice(device.id);
    setScenario1Name(device.scenario1_name || 'Off');
    setScenario2Name(device.scenario2_name || 'On');
  };

  const cancelEditingScenario = () => {
    setEditingScenarioDevice(null);
    setScenario1Name('');
    setScenario2Name('');
  };

  const handleSaveScenarioNames = async (deviceId: string) => {
    setSavingScenario(true);
    const success = await updateScenarioNames(deviceId, scenario1Name, scenario2Name);
    if (success) {
      setDevices(prev =>
        prev.map(d => d.id === deviceId
          ? { ...d, scenario1_name: scenario1Name, scenario2_name: scenario2Name }
          : d
        )
      );
      setEditingScenarioDevice(null);
    }
    setSavingScenario(false);
  };

  // Separate visible and hidden devices
  const visibleDevices = devices.filter(d => d.visible);
  const hiddenDevices = devices.filter(d => !d.visible);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="px-6 py-4 bg-surface border-b border-border shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-primary">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage devices</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar scroll-container momentum-scroll">
        {/* Visible Device List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-gray-400">Active Devices</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <IconPlus className="w-3 h-3" />
              Add Device
            </button>
          </div>

          {visibleDevices.length === 0 ? (
            <div className="text-center py-6 opacity-50">
              <p className="text-xs text-gray-400">No active devices</p>
            </div>
          ) : (
            visibleDevices.map(device => (
              <div key={device.id} className="p-4 bg-surface rounded-lg border border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-border">
                      <img
                        src={DEVICE_IMAGES[device.device_type] || DEVICE_IMAGES.sesame5}
                        alt={DEVICE_NAMES[device.device_type] || device.device_type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary">{device.name}</span>
                      <span className="text-[10px] text-gray-400">{DEVICE_NAMES[device.device_type] || device.device_type}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{device.device_uuid.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(device)}
                    className="text-primary hover:text-gray-600 transition-colors p-2"
                    title="Hide device"
                  >
                    <IconEye className="w-5 h-5" />
                  </button>
                </div>

                {/* Scenario name editing for bot2 */}
                {device.device_type === 'bot2' && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {editingScenarioDevice === device.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-gray-400 w-20">Scenario 1:</label>
                          <input
                            type="text"
                            value={scenario1Name}
                            onChange={(e) => setScenario1Name(e.target.value)}
                            className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-gray-400 w-20">Scenario 2:</label>
                          <input
                            type="text"
                            value={scenario2Name}
                            onChange={(e) => setScenario2Name(e.target.value)}
                            className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={cancelEditingScenario}
                            className="text-[10px] text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveScenarioNames(device.id)}
                            disabled={savingScenario}
                            className="text-[10px] text-primary hover:underline"
                          >
                            {savingScenario ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-gray-500">
                          <span className="text-gray-400">Scenarios:</span>{' '}
                          {device.scenario1_name || 'Off'} / {device.scenario2_name || 'On'}
                        </div>
                        <button
                          onClick={() => startEditingScenario(device)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Hidden Device List */}
        {hiddenDevices.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center gap-2 px-1 text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              <span>{showHidden ? '▼' : '▶'}</span>
              <span>Hidden Devices ({hiddenDevices.length})</span>
            </button>

            {showHidden && (
              <div className="space-y-2">
                {hiddenDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 grayscale">
                        <img
                          src={DEVICE_IMAGES[device.device_type] || DEVICE_IMAGES.sesame5}
                          alt={DEVICE_NAMES[device.device_type] || device.device_type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">{device.name}</span>
                        <span className="text-[10px] text-gray-400">{DEVICE_NAMES[device.device_type] || device.device_type}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{device.device_uuid.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility(device)}
                      className="text-gray-400 hover:text-primary transition-colors p-2"
                      title="Show device"
                    >
                      <IconEyeSlash className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SESAME API Key Section */}
        <div className="bg-surface p-5 rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-primary mb-3">SESAME API Key</h3>
          <p className="text-[11px] text-gray-500 mb-3">
            デバイス操作に必要なAPI Keyを設定してください。
            <a
              href="https://biz.candyhouse.co/biz/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline ml-1"
            >
              Developer Portal
            </a>
            で取得できます。
          </p>

          {hasApiKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                API Key is configured
              </div>
              <Button
                variant="outline"
                onClick={() => setHasApiKey(false)}
                className="text-xs"
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your SESAME API Key"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              <Button
                variant="primary"
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim() || savingApiKey}
                isLoading={savingApiKey}
                className="w-full"
              >
                Save API Key
              </Button>
            </div>
          )}

          {apiKeyMessage && (
            <p className={`text-xs mt-2 ${apiKeyMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {apiKeyMessage.text}
            </p>
          )}
        </div>

        {/* How to get UUID and Secret Key */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-blue-800 mb-2">UUID / Secret Key の取得方法</h4>
          <ol className="text-[11px] text-blue-700 space-y-1 list-decimal list-inside">
            <li>
              <a
                href="https://biz.candyhouse.co/biz/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                SESAME Developer Portal
              </a>
              {' '}にアクセス
            </li>
            <li>SESAME公式アプリと同じアカウントでログイン</li>
            <li>「個人で登録済みのデバイス」から対象デバイスを選択</li>
            <li>UUID と Secret Key をコピー</li>
          </ol>
        </div>

        {/* Add Device Form */}
        {showForm && (
          <div className="bg-surface p-5 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-4">Add New Device</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Device Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Living Room Light"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Device Type</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                >
                  {DEVICE_TYPE_OPTIONS.map(type => (
                    <option key={type} value={type}>{DEVICE_NAMES[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">UUID</label>
                <input
                  type="text"
                  required
                  value={deviceUuid}
                  onChange={(e) => setDeviceUuid(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Secret Key</label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={!name || !deviceUuid || !secretKey || submitting}
                  isLoading={submitting}
                >
                  Add Device
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
