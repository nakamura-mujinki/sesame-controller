import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://coawkrogiuekmjsnrtln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYXdrcm9naXVla21qc25ydGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTA3OTksImV4cCI6MjA4NDIyNjc5OX0.retIjMygGdJtXzt8OxZzv93qZBC2rVDG-WwAIK02X0Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sesame-control-auth',
  },
});

// Device types (limited to supported devices)
export type DeviceType = 'sesame5' | 'sesame5_pro' | 'bot2';

// Device images mapping
export const DEVICE_IMAGES: Record<DeviceType, string> = {
  sesame5: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/sesame5.jpg',
  sesame5_pro: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/SSM5_pro_Right.jpg',
  bot2: 'https://coawkrogiuekmjsnrtln.supabase.co/storage/v1/object/public/assets/bot2_front_2.jpg',
};

// Device display names
export const DEVICE_NAMES: Record<DeviceType, string> = {
  sesame5: 'SESAME 5',
  sesame5_pro: 'SESAME 5 Pro',
  bot2: 'SESAME bot2',
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
  scenario1_name: string | null;
  scenario2_name: string | null;
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
