-- =============================================
-- Update schedules and operation_logs device_type constraint
-- Supabase SQL Editor で実行してください
-- =============================================

-- Update schedules table constraint
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_device_type_check;
ALTER TABLE public.schedules ADD CONSTRAINT schedules_device_type_check
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
    'bot',
    'lock'
));

-- Update operation_logs table constraint
ALTER TABLE public.operation_logs DROP CONSTRAINT IF EXISTS operation_logs_device_type_check;
ALTER TABLE public.operation_logs ADD CONSTRAINT operation_logs_device_type_check
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
    'bot',
    'lock'
));
