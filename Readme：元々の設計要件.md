Readme：元々の設計要件

# Sesame API App
- やりたいこと
  - SesameのWeb-APIを使ってドアとスイッチの制御をやるアプリを作りたい
  - 特に標準アプリだとついてない『bot2』のシナリオ1を1タップで実行、シナリオ2を1タップで実行ってのがやりたい
    - 加えてbot2への命令として（これまた標準ではついてない）時間設定でのシナリオ実行を可能にしたい
    - 時間設定は日本時間UTC+9を設定しておきたい
- 基本的に個人利用なのでログインはいらないが、一応簡易ログインはできるようにしておきたい
  - ID：cafekenta@gmail.com  / Pass: Littleboy0809
  - ログイン状態は基本的に任意でログアウトしない限り継続

# Sesame API 関連情報
- 仕様： https://document.candyhouse.co/demo/webapi-ja
- API key： 7Nbu3oEc8O7KLpXckNsTz23AOb7qPcLA4aOMVYVt
- bot2
  - デバイスUUID： 11200423-0300-0207-5500-0A01FFFFFFFF
  - デバイスシークレットキー： fcf7adabb9daf83476f255b5be40c5b7
- Sesame 5
  - デバイスUUID：11200416-0103-0701-CA00-8100FFFFFFFF
  - デバイスシークレットキー：66c9750fd4b8133bb83c55c4a3e01484

## bot2に現在登録されているシナリオ
- シナリオ1：照明を消す
- シナリオ2：照明をつける

## セットしたいタイマー設定
- 例えば…午前7時に照明をつける
- 例えば…深夜2時に照明を消す

などなど。
あと照明をつける、消す、玄関のドアを 開ける/閉じる のスイッチがあればそれでいっかなー
※たしかドアについては開けるボタンと閉じるボタンを分ける方法がなかった気がするので（もしあったらこれもスイッチ分けたいかな）


# デザインテイストについて
全体にもーちょいシンプルなデザインでいいよ。
で、あとモノトーンな感じのほうが好き
差し色に使ってもベージュくらいで、あとは白黒灰色の感じでお願い
アイコンとかも線画っぽいやつに変更ね
あとボタン、矩形全体的に角丸アールが強すぎるのでもう少し抑えて

# 基本的に画面スクロールなしに
画面スクロールしない構成のほうが好きなので タスク、ログについては別画面に
画面はそれぞれURLルーティングしておいてね


# SESAME AWS認証情報 (公式SDKより)
- 項目,値
- Region,ap-northeast-1
- User Pool ID,ap-northeast-1_bY2byhlCa
- App Client ID,6ialca0p8u0lsgvbmvsljfm305
- Identity Pool ID,ap-northeast-1:0a1820f1-dbb3-4bca-9227-2a92f6abf0ae
- API Key,iGgXj9GorS4PeH90mAysg1l7kdvoIPxM25mPFl3k
- IoT Endpoint,d06107753ay3c67v7y9pa-ats.iot.ap-northeast-1.amazonaws.com
- API Base URL,https://app.candyhouse.co/prod





