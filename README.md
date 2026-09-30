# simple-timer-app

ブラウザだけで動く、シンプルなカウントダウンタイマーです。HTML・CSS・JavaScript のみで作られており、
サーバーやデータベース、APIキーは必要ありません。

公開URL: https://chihiro629.github.io/simple-timer-app/

## 機能

- 分（0〜99）と秒（0〜59）を指定できるカウントダウンタイマー
- スタート / 一時停止・再開 / リセットの操作
- 残り時間を大きく表示し、1秒ごとに更新
- 0 になると表示が点滅し、ビープ音（Web Audio API）でお知らせ
- 入力値の検証（未入力、整数以外、範囲外、0秒の設定）
- ラベル付きフォーム、キーボード操作、フォーカス表示、ARIA によるステータス読み上げに対応
- レスポンシブ対応（パソコン・スマートフォン）

## ファイル構成

```text
index.html                     画面
styles.css                     スタイル（外部依存なし）
app.js                         タイマーの処理
.github/workflows/deploy.yml   GitHub Pages への自動デプロイ
```

## ローカルでの使い方

`index.html` をブラウザで開くだけで動作します。

簡易サーバーで確認したい場合は、リポジトリのディレクトリで次を実行し、
`http://localhost:8000/` を開いてください。

```bash
python3 -m http.server 8000
```

## GitHub Pages での公開について

`main` ブランチへ push すると、GitHub Actions（`.github/workflows/deploy.yml`）が
リポジトリの内容をそのまま GitHub Pages へデプロイします。

- トリガー: `main` への push、および手動実行（`workflow_dispatch`）
- 権限: `pages: write` と `id-token: write`（`actions/deploy-pages` に必要）
- 処理: `actions/configure-pages` → `actions/upload-pages-artifact`（リポジトリ全体）→ `actions/deploy-pages`

初回のみ、GitHub のリポジトリ設定で **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に変更してください。

ファイルの参照はすべて相対パス（`./styles.css`、`./app.js`）のため、
`https://ユーザー名.github.io/simple-timer-app/` のようなサブパスでも正しく動作します。
