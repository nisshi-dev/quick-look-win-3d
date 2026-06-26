<div align="center">

# quick-look-win-3d

[English](./README.md) | **日本語** | [한국어](./README.ko.md)

Windows のエクスプローラーで 3D モデルをスペースキーで即座にプレビューする [QuickLook](https://github.com/QL-Win/QuickLook) プラグイン。

`.glb` / `.vrm` / `.vrma` / `.fbx` を Three.js と WebView2 で描画します。

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white)
![QuickLook](https://img.shields.io/badge/QuickLook-plugin-2C9FDB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-renderer-000000?style=flat-square&logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-3DA639?style=flat-square)

![quick-look-win-3d デモ](docs/demo.gif)

<!-- X(旧 Twitter)の投稿をここに差し込む。 -->

</div>

## できること

エクスプローラーでファイルを選んでスペースキーを押すと、3D モデルが表示されます。
マウスのドラッグで回転、スクロールで拡大縮小、右ドラッグで平行移動できます。

左上の情報パネルに、形式、ファイルサイズ、ポリゴン数、頂点数、メッシュ数、マテリアル数、テクスチャ数、ボーン数、アニメーション、VRM のメタ情報を表示します。
情報パネルは i キーで開閉できます。

表示は QuickLook 本体のテーマ(ライト/ダーク)に追従します。
情報パネルのラベルは OS の表示言語に応じて英語、日本語、韓国語で切り替わります(既定は英語)。

## 対応フォーマット

| 形式 | 内容 | 状態 |
| :--- | :--- | :--: |
| `.glb` | glTF バイナリ(静止/アニメーション) | 対応 |
| `.vrm` | VRM アバター(`@pixiv/three-vrm`) | 対応 |
| `.vrma` | VRM アニメーション | 対応 |
| `.fbx` | Autodesk FBX | 一部対応 |

`.fbx` は表示できますが、外部テクスチャファイルに依存するモデルは暗く見えることがあります(テクスチャ処理は改善中)。

## インストール

### 1. QuickLook 本体を導入する

このプラグインは QuickLook の中で動くため、先に QuickLook 本体を導入します。
次のいずれかの方法で導入できます。

- Microsoft Store:「QuickLook」を検索(最も簡単で、自動更新されます)。
- インストーラー:[QuickLook のリリースページ](https://github.com/QL-Win/QuickLook/releases)から最新版を入手して実行します。
- Scoop:`scoop bucket add extras` を実行してから `scoop install quicklook`。

導入したら QuickLook を起動します。
QuickLook は通知領域(システムトレイ)に常駐します。
エクスプローラーで任意のファイルを選んでスペースキーを押し、プレビューが表示されれば動作しています。

WebView2 ランタイムも必要です。
Windows 11 と多くの Windows 10 には標準で入っています(Microsoft Edge に同梱)。
入っていない場合は Microsoft から導入してください。

### 2. このプラグインを導入する

1. `QuickLook.Plugin.Model3DViewer.qlplugin` を用意します(下記のビルド手順、または[リリースページ](https://github.com/nisshi-dev/quick-look-win-3d/releases)から取得)。
2. QuickLook を起動した状態で、`.qlplugin` ファイルを選んでスペースキーを押します。プラグイン名と「Install」ボタンが表示されます。
3. 「Install」を押します。
4. 新しいプラグインを読み込ませるため、QuickLook を再起動します。通知領域のアイコンから終了し、もう一度起動してください。
5. `.glb` / `.vrm` / `.vrma` / `.fbx` のいずれかを選んでスペースキーを押します。

動作要件:Windows 10/11。

## ソースからのビルド

前提:[Node.js](https://nodejs.org/) 20 以上、[.NET SDK](https://dotnet.microsoft.com/)(Windows)。

```bash
# 1. Web レンダラーをビルドする(renderer/dist を生成)
cd renderer
npm ci
npm run build

# 2. プラグインをビルドする
cd ..
dotnet build QuickLook.Plugin.Model3DViewer.sln -c Release

# 3. .qlplugin にパッケージする
powershell -ExecutionPolicy Bypass -File Scripts/pack-zip.ps1
```

生成された `QuickLook.Plugin.Model3DViewer.qlplugin` を、上記のインストール手順で導入します。

`QuickLook.Common` は NuGet パッケージとして参照します(git submodule は不要)。
`v` で始まるタグ(例:`v0.2.0`)を push すると、GitHub Actions が `.qlplugin` をビルドし、リリースに添付します。

## 仕組み

```
エクスプローラー --(Space)--> QuickLook --> プラグイン (IViewer, C#)
                                                |
                                                v
                                        WebView2 コントロール
                                                |
                                                v
                            Three.js レンダラー (Vite build) <-- モデルファイル
```

C# のプラグインは QuickLook の `IViewer` を実装し、WebView2 コントロールを表示します。
その中で Three.js と Vite による小さなアプリが動き、選択されたモデルを読み込んで描画します。
レンダラーは [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d)(macOS 版)を取り込んでいます。

## クレジット

本プロジェクトのアイデアは、3D モデルを Quick Look で表示する macOS 版 [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d) に由来します。
本プラグインはその Windows 版にあたり、レンダラーも同プロジェクトのものを利用しています。
素晴らしい元プロジェクトを公開してくださった sawa-zen 氏に感謝します(MIT、© sawa-zen)。

- [QuickLook.Plugin.HelloWorld](https://github.com/QL-Win/QuickLook.Plugin.HelloWorld) テンプレート(MIT、© Paddy Xu)から作成しました。
- 本体の [QuickLook](https://github.com/QL-Win/QuickLook) は Paddy Xu 氏とコントリビューターによるものです。
- VRM 対応は [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) を利用しています。

## ライセンス

[MIT](LICENSE.txt)。
