<div align="center">

# quick-look-win-3d

Windows のエクスプローラーで 3D モデルをスペースキーで即座にプレビューする [QuickLook](https://github.com/QL-Win/QuickLook) プラグイン。

`.glb` / `.vrm` / `.vrma` / `.fbx` を Three.js と WebView2 で描画します。

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white)
![QuickLook](https://img.shields.io/badge/QuickLook-plugin-2C9FDB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-renderer-000000?style=flat-square&logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-3DA639?style=flat-square)

<!-- デモ動画(GIF または mp4)をここに差し込む。例: ![demo](docs/demo.gif) -->
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

1. `QuickLook.Plugin.Model3DViewer.qlplugin` を用意します(下記のビルド手順、またはリリースページから取得)。
2. QuickLook を起動した状態で、`.qlplugin` ファイルを選んでスペースキーを押します。
3. 「Install」を押し、QuickLook を再起動します。
4. `.glb` / `.vrm` / `.vrma` / `.fbx` のいずれかを選んでスペースキーを押します。

動作要件:Windows 10/11、[QuickLook](https://github.com/QL-Win/QuickLook) 4.x、WebView2 ランタイム(Windows 11 には標準搭載)。

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

- レンダラーは [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d)(macOS 版、MIT、© sawa-zen)を基にしています。
- [QuickLook.Plugin.HelloWorld](https://github.com/QL-Win/QuickLook.Plugin.HelloWorld) テンプレート(MIT、© Paddy Xu)から作成しました。
- 本体の [QuickLook](https://github.com/QL-Win/QuickLook) は Paddy Xu 氏とコントリビューターによるものです。
- VRM 対応は [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) を利用しています。

## ライセンス

[MIT](LICENSE.txt)。
