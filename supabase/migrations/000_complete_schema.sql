-- =============================================
-- Sesame Controller - Complete Schema
-- Run this in Supabase SQL Editor to set up all tables
-- =============================================

-- =============================================
-- 1. Tables
-- =============================================

-- User settings table (API key storage)
CREATE TABLE public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    sesame_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Devices table
CREATE TABLE public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('sesame5', 'sesame5_pro', 'bot2')),
    device_uuid TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    visible BOOLEAN DEFAULT true NOT NULL,
    scenario0_name TEXT DEFAULT 'Off',
    scenario1_name TEXT DEFAULT 'On',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, device_uuid)
);

-- Schedules table
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('sesame5', 'sesame5_pro', 'bot2')),
    device_uuid TEXT NOT NULL,
    action TEXT NOT NULL,
    time_hour INTEGER NOT NULL CHECK (time_hour >= 0 AND time_hour <= 23),
    time_minute INTEGER NOT NULL CHECK (time_minute >= 0 AND time_minute <= 59),
    days_of_week INTEGER[] DEFAULT NULL,
    enabled BOOLEAN DEFAULT true NOT NULL,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Operation logs table
CREATE TABLE public.operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL CHECK (device_type IN ('sesame5', 'sesame5_pro', 'bot2', 'bot', 'lock')),
    device_uuid TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 2. Row Level Security (RLS)
-- =============================================

-- user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
    ON public.devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
    ON public.devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON public.devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON public.devices FOR DELETE
    USING (auth.uid() = user_id);

-- schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules"
    ON public.schedules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
    ON public.schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
    ON public.schedules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
    ON public.schedules FOR DELETE
    USING (auth.uid() = user_id);

-- operation_logs
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
    ON public.operation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
    ON public.operation_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. Triggers
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 4. Indexes
-- =============================================

CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_visible ON public.devices(visible) WHERE visible = true;
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_enabled ON public.schedules(enabled) WHERE enabled = true;
CREATE INDEX idx_operation_logs_user_id ON public.operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON public.operation_logs(created_at DESC);

-- =============================================
-- 5. Comments
-- =============================================

COMMENT ON COLUMN public.schedules.days_of_week IS 'Days of week to execute: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat. NULL = every day.';
COMMENT ON COLUMN public.devices.visible IS 'Whether to show device in the app. false = hidden (not deleted).';
COMMENT ON COLUMN public.devices.scenario0_name IS 'Custom label for scenario 0 (bot2 only). Default: Off';
COMMENT ON COLUMN public.devices.scenario1_name IS 'Custom label for scenario 1 (bot2 only). Default: On';
