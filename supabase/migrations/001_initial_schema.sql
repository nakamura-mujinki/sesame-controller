-- =============================================
-- Sesame Controller - Initial Schema
-- Supabase SQL Editor で実行してください
-- =============================================

-- 1. 操作ログテーブル
CREATE TABLE public.operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL CHECK (device_type IN ('bot', 'lock')),
    device_uuid TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. スケジュールテーブル
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('bot', 'lock')),
    device_uuid TEXT NOT NULL,
    action TEXT NOT NULL,
    time_hour INTEGER NOT NULL CHECK (time_hour >= 0 AND time_hour <= 23),
    time_minute INTEGER NOT NULL CHECK (time_minute >= 0 AND time_minute <= 59),
    enabled BOOLEAN DEFAULT true NOT NULL,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. デバイス設定テーブル（Secretをサーバー側で管理）
CREATE TABLE public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('bot', 'lock')),
    device_uuid TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, device_uuid)
);

-- =============================================
-- RLS (Row Level Security) ポリシー
-- =============================================

-- operation_logs
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
    ON public.operation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
    ON public.operation_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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

-- =============================================
-- updated_at 自動更新トリガー
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

-- =============================================
-- インデックス
-- =============================================

CREATE INDEX idx_operation_logs_user_id ON public.operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON public.operation_logs(created_at DESC);
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_enabled ON public.schedules(enabled) WHERE enabled = true;
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
