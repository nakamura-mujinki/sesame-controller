-- =============================================
-- Update device_type check constraint to support all SESAME device types
-- Supabase SQL Editor で実行してください
-- =============================================

-- Drop existing check constraint on devices table
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_device_type_check;

-- Add new check constraint with all device types
ALTER TABLE public.devices ADD CONSTRAINT devices_device_type_check
CHECK (device_type IN (
  'sesame5',
  'sesame5_pro',
  'sesame_face',
  'sesame_face_pro',
  'sesame_face_ai',
  'sesame_face_pro_ai',
  'sesame_touch',
  'sesame_touch_pro',
  'remote',
  'remote_nano',
  'hub3',
  'open_sensor',
  'bot2',
  'cycle2',
  'bot',    -- legacy
  'lock'    -- legacy
));
