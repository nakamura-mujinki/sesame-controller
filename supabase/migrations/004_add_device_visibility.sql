-- =============================================
-- デバイスの表示/非表示フラグ追加
-- SESAME認証に移行後、デバイス管理をシンプル化
-- =============================================

-- 表示フラグを追加（デフォルトtrue = 表示）
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true NOT NULL;

-- 表示デバイスのみ取得するためのインデックス
CREATE INDEX IF NOT EXISTS idx_devices_visible ON public.devices(visible) WHERE visible = true;

-- コメント追加
COMMENT ON COLUMN public.devices.visible IS 'デバイスをアプリ上で表示するかどうか。false=非表示（削除ではない）';
