import React, { useState } from 'react';
import { DbDevice, DeviceType, DEVICE_IMAGES, DEVICE_NAMES } from '../services/supabase';
import { sendCommand, ActionType } from '../services/sesameService';
import Button from './Button';
import { IconLightBulb, IconLockClosed, IconLockOpen, IconMoon } from './Icons';

interface DeviceCardProps {
  device: DbDevice;
}

// Helper to determine if device is a bot-type (button control)
const isBotType = (type: DeviceType): boolean => {
  return type === 'bot2';
};

// Helper to determine if device is a lock-type (lock/unlock control)
const isLockType = (type: DeviceType): boolean => {
  return type === 'sesame5' || type === 'sesame5_pro';
};

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleCommand = async (action: ActionType, label: string) => {
    setLoadingAction(action);
    try {
      const result = await sendCommand(device.device_uuid, action);
      if (!result.success) {
        console.error(`${device.name}: ${result.message}`);
      }
    } catch (e) {
      console.error(`${device.name}: Error`, e);
    } finally {
      setLoadingAction(null);
    }
  };

  const deviceImage = DEVICE_IMAGES[device.device_type] || DEVICE_IMAGES.sesame5;
  const deviceTypeName = DEVICE_NAMES[device.device_type] || device.device_type;
  const showBotControls = isBotType(device.device_type);
  const showLockControls = isLockType(device.device_type);

  // Use custom scenario names if available, fallback to defaults
  const scenario0Label = device.scenario0_name || 'Scenario 0';
  const scenario1Label = device.scenario1_name || 'Scenario 1';

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
          showBotControls
            ? 'bg-accent/30 border-accent text-primary'
            : 'bg-gray-100 border-gray-200 text-gray-700'
        }`}>
          {showBotControls ? <IconLightBulb className="w-5 h-5"/> : <IconLockClosed className="w-5 h-5"/>}
        </div>
        <div>
          <h2 className="font-semibold text-primary leading-none">{device.name}</h2>
          <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-wider">
            {deviceTypeName}
          </p>
        </div>
      </div>

      {/* Device Image */}
      <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={deviceImage}
          alt={device.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {showBotControls ? (
          <>
            <Button
              variant="primary"
              onClick={() => handleCommand('scenario1', scenario1Label)}
              isLoading={loadingAction === 'scenario1'}
              className="flex items-center gap-2"
            >
              <IconLightBulb className="w-4 h-4" />
              <span>{scenario1Label}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCommand('scenario0', scenario0Label)}
              isLoading={loadingAction === 'scenario0'}
              className="flex items-center gap-2"
            >
              <IconMoon className="w-4 h-4" />
              <span>{scenario0Label}</span>
            </Button>
          </>
        ) : showLockControls ? (
          <>
             <Button
              variant="primary"
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => handleCommand('lock', 'Lock')}
              isLoading={loadingAction === 'lock'}
            >
              <div className="flex items-center gap-2">
                <IconLockClosed className="w-4 h-4" />
                <span>Lock</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCommand('unlock', 'Unlock')}
              isLoading={loadingAction === 'unlock'}
            >
              <div className="flex items-center gap-2">
                <IconLockOpen className="w-4 h-4" />
                <span>Unlock</span>
              </div>
            </Button>
          </>
        ) : (
          <div className="col-span-2 text-center text-gray-400 text-sm py-2">
            View only device
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;