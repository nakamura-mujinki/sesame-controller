export interface DeviceConfig {
  name: string;
  uuid: string;
  secret: string;
  type: 'bot' | 'lock';
}

export enum SesameCommand {
  LOCK = 82,
  UNLOCK = 83,
  TOGGLE = 88,
  CLICK = 89,
}

export interface ScheduledTask {
  id: string;
  deviceUuid: string;
  command: SesameCommand;
  time: string; // HH:mm
  description: string;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export interface HistoryItem {
  timestamp: number;
  message: string;
  type: 'success' | 'error' | 'info';
}