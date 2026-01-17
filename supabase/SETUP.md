# Supabase セットアップ手順

## 1. SQLマイグレーション実行

Supabase Dashboard → SQL Editor で以下を順番に実行:

1. `migrations/001_initial_schema.sql` - テーブル・RLS作成
2. `migrations/002_initial_devices.sql` - 初期デバイス登録

## 2. Secrets登録

Dashboard → Project Settings → Edge Functions → Secrets で登録:

```
SESAME_API_KEY = 7Nbu3oEc8O7KLpXckNsTz23AOb7qPcLA4aOMVYVt
```

## 3. Edge Functions デプロイ

```bash
# Supabase CLIログイン
npx supabase login

# プロジェクトリンク
npx supabase link --project-ref coawkrogiuekmjsnrtln

# Functions デプロイ
npx supabase functions deploy send-command
npx supabase functions deploy execute-schedule
```

## 4. Cron設定（スケジュール自動実行）

Dashboard → Database → Extensions で `pg_cron` を有効化後、SQL Editorで実行:

```sql
-- 毎分実行（スケジュールチェック）
SELECT cron.schedule(
  'execute-schedules',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://coawkrogiuekmjsnrtln.supabase.co/functions/v1/execute-schedule',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

※ または外部Cronサービス（cron-job.org等）から呼び出し

## Edge Functions 一覧

| Function | 用途 | 認証 |
|----------|------|------|
| `send-command` | 手動コマンド実行 | Bearer Token必須 |
| `execute-schedule` | スケジュール自動実行 | Service Role |

## APIエンドポイント

```
POST https://coawkrogiuekmjsnrtln.supabase.co/functions/v1/send-command
Headers:
  Authorization: Bearer <user_access_token>
Body:
  { "device_uuid": "...", "action": "on|off|lock|unlock" }
```
