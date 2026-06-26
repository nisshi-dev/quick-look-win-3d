<div align="center">

# 🧊 quick-look-win-3d

### Preview 3D models in Windows Explorer — just hit <kbd>Space</kbd>.

A [**QuickLook**](https://github.com/QL-Win/QuickLook) plugin that instantly previews
`.glb` · `.vrm` · `.vrma` · `.fbx` files, rendered with **Three.js** inside **WebView2**.

<br />

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white)
![QuickLook](https://img.shields.io/badge/QuickLook-plugin-2C9FDB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-renderer-000000?style=flat-square&logo=three.js&logoColor=white)
![WebView2](https://img.shields.io/badge/WebView2-host-0078D6?style=flat-square&logo=microsoftedge&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-3DA639?style=flat-square)

<br />

<!-- 👉 デモ GIF / スクリーンショットをここに貼ると映えます (docs/preview.gif など) -->
<!-- ![preview](docs/preview.gif) -->

</div>

---

## ✨ Features

- 🚀 **Instant preview** — select a file in Explorer, press <kbd>Space</kbd>, done.
- 🧍 **VRM avatars** — full character rendering via [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm).
- 🎞️ **Animations** — `.vrma` motion and animated `.glb` are played back.
- 🖱️ **Orbit controls** — drag to rotate, scroll to zoom, right‑drag to pan.
- 🌗 **Theme-aware** — follows QuickLook's light / dark theme.
- 🪶 **Lightweight host** — ships only the built renderer; relies on the OS WebView2 runtime.

## 📦 Supported formats

| Format  | Description                       | Status |
| :------ | :-------------------------------- | :----: |
| `.glb`  | glTF binary (static & animated)   |   ✅   |
| `.vrm`  | VRM avatar (`@pixiv/three-vrm`)   |   ✅   |
| `.vrma` | VRM animation                     |   ✅   |
| `.fbx`  | Autodesk FBX                      |  ⚠️\*  |

> \* FBX renders, but models relying on **external texture files** may appear dark — texture handling is a work in progress.

## 🚀 Install

1. Grab **`QuickLook.Plugin.Model3DViewer.qlplugin`** (build it from source — see below).
2. With **QuickLook running**, select the `.qlplugin` file and press <kbd>Space</kbd>.
3. Click **Install**, then **restart QuickLook**.
4. Press <kbd>Space</kbd> on any `.glb` / `.vrm` / `.vrma` / `.fbx` file. 🎉

> **Requirements:** Windows 10/11 · [QuickLook](https://github.com/QL-Win/QuickLook) 4.x · WebView2 Runtime (preinstalled on Windows 11).

## 🛠️ Build from source

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ · [.NET SDK](https://dotnet.microsoft.com/) (Windows).

```bash
# 1. Build the web renderer  ->  renderer/dist
cd renderer
npm install
npm run build

# 2. Build the plugin
cd ..
dotnet build QuickLook.Plugin.Model3DViewer.sln -c Release

# 3. Package into a .qlplugin
powershell -ExecutionPolicy Bypass -File Scripts/pack-zip.ps1
```

Then install the generated `QuickLook.Plugin.Model3DViewer.qlplugin` as described above.

> `QuickLook.Common` is consumed as a **NuGet package** — no git submodule required.

## 🧩 How it works

```
Explorer ──Space──▶ QuickLook ──▶ Plugin (IViewer, C#)
                                      │
                                      ▼
                              WebView2 control
                                      │
                                      ▼
                   Three.js renderer (Vite build)  ◀── model file
```

The C# plugin implements QuickLook's `IViewer` and hosts a **WebView2** control. Inside it runs a
small **Three.js / Vite** app (vendored from [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d))
that loads the selected model and renders it with orbit controls.

## 🙏 Credits

- Renderer based on [**sawa-zen/quick-look-3d**](https://github.com/sawa-zen/quick-look-3d) — the macOS counterpart (MIT, © sawa-zen).
- Scaffolded from the [**QuickLook.Plugin.HelloWorld**](https://github.com/QL-Win/QuickLook.Plugin.HelloWorld) template (MIT, © Paddy Xu).
- Built for [**QuickLook**](https://github.com/QL-Win/QuickLook) by Paddy Xu & contributors.
- VRM support by [**@pixiv/three-vrm**](https://github.com/pixiv/three-vrm).

## 📄 License

[MIT](LICENSE.txt) — see [`LICENSE.txt`](LICENSE.txt).
