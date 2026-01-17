-- Add scenario name columns to devices table for bot2 customization
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS scenario1_name TEXT DEFAULT 'Off',
ADD COLUMN IF NOT EXISTS scenario2_name TEXT DEFAULT 'On';

-- Update device_type constraint to only allow sesame5, sesame5_pro, bot2
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_device_type_check;
ALTER TABLE public.devices ADD CONSTRAINT devices_device_type_check
CHECK (device_type IN ('sesame5', 'sesame5_pro', 'bot2'));

-- Also update schedules table constraint
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_device_type_check;
ALTER TABLE public.schedules ADD CONSTRAINT schedules_device_type_check
CHECK (device_type IN ('sesame5', 'sesame5_pro', 'bot2'));
