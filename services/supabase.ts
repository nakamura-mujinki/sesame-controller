import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sesame-control-auth',
  },
});

// Device types (limited to supported devices)
export type DeviceType = 'sesame5' | 'sesame5_pro' | 'bot2';

// Device images mapping (using Supabase Storage public URLs)
const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/assets`;
export const DEVICE_IMAGES: Record<DeviceType, string> = {
  sesame5: `${storageUrl}/sesame5.jpg`,
  sesame5_pro: `${storageUrl}/SSM5_pro_Right.jpg`,
  bot2: `${storageUrl}/bot2_front_2.jpg`,
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
  scenario0_name: string | null;
  scenario1_name: string | null;
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
