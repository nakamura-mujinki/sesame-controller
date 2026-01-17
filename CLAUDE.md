# Sesame Controller - Claude Code向け設定

## 開発サーバー

- **ローカルポート**: 1100
- **URL**: http://localhost:1100
- **起動コマンド**: `npm run dev`

## プロジェクト概要

Sesame Web-APIを使用したスマートホーム制御アプリ（React + Vite + TypeScript）

### 制御対象デバイス

- **Bot2（照明制御）**: シナリオ1=消灯、シナリオ2=点灯
- **Sesame 5（玄関ロック）**: 開錠/施錠

### 主要ファイル

- `vite.config.ts` - ビルド設定（ポート1100）
- `App.tsx` - メインアプリ（ルーティング、スケジューラー）
- `services/sesameService.ts` - Sesame API連携
- `constants.ts` - API KEY、デバイス情報
