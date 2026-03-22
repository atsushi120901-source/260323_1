# Image to PowerPoint Converter

画像ファイル（JPG, PNG, GIF, BMP, WebP）をPowerPoint（.pptx）スライドに変換するWebアプリケーションです。

## 機能

- 複数の画像ファイルを1つのPPTXファイルに変換（1画像＝1スライド）
- ドラッグ&ドロップでの画像アップロード
- スライド内での順序変更（ドラッグ）
- スライドサイズ選択: **16:9**（ワイドスクリーン）/ **4:3**（スタンダード）/ **A4**（横向き）
- レイアウト選択: **Contain**（余白あり）/ **Fit**（余白なし）/ **Fill**（全体に拡大）
- マージン調整（0〜20%）
- タイトルプレフィックスの設定（スライド下部に表示）

## セットアップ

```bash
pip install -r requirements.txt
```

## 起動

```bash
uvicorn app.main:app --reload
```

ブラウザで `http://localhost:8000` を開いてください。

## 使い方

1. 画像ファイルをドロップ（またはファイル選択）
2. リスト内でドラッグして順序を調整
3. スライドサイズ・レイアウト・タイトルを設定
4. 「変換してダウンロード」ボタンをクリック
5. `presentation.pptx` がダウンロードされます

## API

### `POST /convert`

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `files` | File[] | - | 画像ファイル（複数可） |
| `slide_size` | string | `16:9` | `16:9` / `4:3` / `A4` |
| `layout` | string | `contain` | `contain` / `fit` / `fill` |
| `title_prefix` | string | なし | スライドタイトルのプレフィックス |
| `margin` | float | `0.05` | マージン比率（0.0〜0.2） |

レスポンス: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
