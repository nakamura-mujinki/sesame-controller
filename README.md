# Sesame Controller

SESAME Web API を使用したスマートロック・スマートホーム制御アプリ。

React + Vite + TypeScript + Supabase で構築。PWA対応。

## スクリーンショット

<p align="center">
  <img src="https://github.com/user-attachments/assets/796ef4a0-fbc6-4b8e-b4ce-255dfe0017ce" width="180" />
  <img src="https://github.com/user-attachments/assets/7d321975-0b0a-42d2-822b-46c710cdde15" width="180" />
  <img src="https://github.com/user-attachments/assets/58b2ae98-a0cc-46ed-8b6d-0ae5942ec24c" width="180" />
  <img src="https://github.com/user-attachments/assets/692ba0ff-8095-4c63-a24a-694160922530" width="180" />
  <img src="https://github.com/user-attachments/assets/dde575c9-c511-4050-9c8d-847985aaf744" width="180" />
</p>

## 対応デバイス

- **SESAME 5 / SESAME 5 Pro** - スマートロック（施錠・解錠）
- **SESAME Bot2** - ボタン押下（シナリオ0/1）

## 機能

- デバイス操作（ロック/アンロック、シナリオ実行）
- スケジュール設定（時間・曜日指定）
- 操作ログ
- 複数デバイス管理
- PWA（ホーム画面に追加可能）

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/sesame-controller.git
cd sesame-controller
npm install
```

### 2. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) でアカウント作成
2. 新規プロジェクトを作成
3. **Settings > API** から以下をメモ:
   - Project URL (`https://xxxxx.supabase.co`)
   - anon public key

### 3. データベースセットアップ

Supabase Dashboard > **SQL Editor** で以下を実行:

```sql
-- supabase/migrations/000_complete_schema.sql の内容をコピー＆ペースト
```

### 4. Storage セットアップ（任意）

デバイス画像を表示したい場合:

1. Supabase Dashboard > **Storage**
2. `assets` バケットを作成（Public）
3. 以下の画像をアップロード:
   - `sesame5.jpg`
   - `SSM5_pro_Right.jpg`
   - `bot2_front_2.jpg`

### 5. Edge Function デプロイ

```bash
# Supabase CLI インストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref your-project-id

# Edge Function デプロイ
supabase functions deploy send-command
```

### 6. 環境変数設定

#### ローカル開発

```bash
cp .env.example .env
# .env を編集して Supabase の URL と Key を設定
```

#### Vercel デプロイ

Vercel Dashboard > **Settings > Environment Variables** で設定:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

### 7. 開発サーバー起動

```bash
npm run dev
# http://localhost:1100 で起動
```

---

## SESAME API Key の取得

1. [SESAME アプリ](https://candyhouse.co/) をインストール
2. アプリ内でアカウント作成・デバイス登録
3. **設定 > API** から API Key を取得
4. 本アプリの **Settings** 画面で API Key を登録

## デバイス UUID と Secret Key の取得

SESAME アプリまたは Web Dashboard から取得できます:

- **Device UUID**: デバイス固有のID
- **Secret Key**: AES-CMAC署名生成用の秘密鍵

---

## 技術的な注意事項

### Bot2 シナリオ実行について

SESAME の公式ドキュメントでは Bot2 のシナリオ実行コマンドが明記されていませんが、
調査の結果、以下のコマンドコードでシナリオを実行できることがわかりました:

| コマンド | cmd値 |
|---------|-------|
| シナリオ0 | 82 |
| シナリオ1 | 83 |

```javascript
// Edge Function での実装例
if (action === "scenario0") cmd = 82;
else if (action === "scenario1") cmd = 83;
```

※ 公式に開示されていない仕様のため、将来的に変更される可能性があります。

---

## スケジュール実行（Cron）

スケジュール機能を使うには、Supabase で pg_cron を設定:

```sql
-- pg_cron 拡張を有効化（Supabase Dashboard > Database > Extensions）
-- 以下を SQL Editor で実行

SELECT cron.schedule(
  'execute-schedules',
  '*/5 * * * *',  -- 5分ごと
  $$
  SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/execute-schedules',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

---

## ディレクトリ構成

```
sesame-controller/
├── components/       # 再利用可能なUIコンポーネント
├── views/            # ページコンポーネント
├── services/         # API・データベース操作
├── supabase/
│   ├── functions/    # Edge Functions
│   └── migrations/   # DBマイグレーション
└── public/           # 静的ファイル
```

---

## ライセンス

MIT
