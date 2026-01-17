import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://coawkrogiuekmjsnrtln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYXdrcm9naXVla21qc25ydGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTA3OTksImV4cCI6MjA4NDIyNjc5OX0.retIjMygGdJtXzt8OxZzv93qZBC2rVDG-WwAIK02X0Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Device types
export type DeviceType =
  | 'sesame5'
  | 'sesame5_pro'
  | 'sesame_face'
  | 'sesame_face_pro'
  | 'sesame_face_ai'
  | 'sesame_face_pro_ai'
  | 'sesame_touch'
  | 'sesame_touch_pro'
  | 'remote'
  | 'remote_nano'
  | 'hub3'
  | 'open_sensor'
  | 'bot2'
  | 'cycle2'
  | 'bot'   // legacy
  | 'lock'; // legacy

// Device images mapping
export const DEVICE_IMAGES: Record<DeviceType, string> = {
  sesame5: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/sesame5.jpg',
  sesame5_pro: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/SSM5_pro_Right.jpg',
  sesame_face: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/face_header_ja.webp',
  sesame_face_pro: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/facepro_header_ja.webp',
  sesame_face_ai: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/face_header_ja.webp',
  sesame_face_pro_ai: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/facepro_header_ja.webp',
  sesame_touch: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/touch_header_ja.webp',
  sesame_touch_pro: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/touchpro_header_ja.webp',
  remote: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/remote_header_ja.webp',
  remote_nano: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/remotenano_header_ja.webp',
  hub3: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/hub_3_right.webp',
  open_sensor: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/Open-Sensor-01-L.webp',
  bot2: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/bot2_front_2.jpg',
  cycle2: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/35_52464fc1-5140-40e6-a2be-cfb0b42b6ad8.webp',
  bot: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/bot2_front_2.jpg',
  lock: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/sesame5.jpg',
};

// Device display names
export const DEVICE_NAMES: Record<DeviceType, string> = {
  sesame5: 'SESAME 5',
  sesame5_pro: 'SESAME 5 Pro',
  sesame_face: 'SESAME Face',
  sesame_face_pro: 'SESAME Face Pro',
  sesame_face_ai: 'SESAME Face AI',
  sesame_face_pro_ai: 'SESAME Face Pro AI',
  sesame_touch: 'SESAME Touch',
  sesame_touch_pro: 'SESAME Touch Pro',
  remote: 'CANDY HOUSE Remote',
  remote_nano: 'CANDY HOUSE Remote nano',
  hub3: 'Hub3',
  open_sensor: 'Open Sensor',
  bot2: 'SESAME bot2',
  cycle2: 'SESAME Cycle2',
  bot: 'SESAME bot',
  lock: 'SESAME Lock',
};

// Types from database
export interface DbDevice {
  id: string;
  user_id: string;
  name: string;
  device_type: DeviceType;
  device_uuid: string;
  secret_key: string;
  visible: boolean;
  created_at: string;
}

export interface DbSchedule {
  id: string;
  user_id: string;
  name: string;
  device_type: DeviceType;
  device_uuid: string;
  action: string;
  time_hour: number;
  time_minute: number;
  days_of_week: number[] | null; // 0=Sun, 1=Mon, ..., 6=Sat. null = every day
  enabled: boolean;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOperationLog {
  id: string;
  user_id: string;
  device_type: 'bot' | 'lock';
  device_uuid: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string | null;
  created_at: string;
}
