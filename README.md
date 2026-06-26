<div align="center">

# quick-look-win-3d

**English** | [日本語](./README.ja.md) | [한국어](./README.ko.md)

A [QuickLook](https://github.com/QL-Win/QuickLook) plugin that previews 3D models in Windows Explorer with the spacebar.

It renders `.glb` / `.vrm` / `.vrma` / `.fbx` using Three.js inside WebView2.

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white)
![QuickLook](https://img.shields.io/badge/QuickLook-plugin-2C9FDB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-renderer-000000?style=flat-square&logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-3DA639?style=flat-square)

![quick-look-win-3d demo](docs/demo.gif)

<!-- Insert the X (formerly Twitter) post here. -->

</div>

## Features

Select a file in Explorer and press <kbd>Space</kbd> to view the model.
Drag to rotate, scroll to zoom, and right-drag to pan.

An info panel in the top-left shows the format, file size, triangle count, vertices, meshes, materials, textures, bones, animations, and VRM metadata.
Toggle the panel with the <kbd>i</kbd> key.

The view follows QuickLook's light/dark theme.
The info panel labels switch between English, Japanese, and Korean based on the OS display language (English by default).

## Supported formats

| Format | Description | Status |
| :--- | :--- | :--: |
| `.glb` | glTF binary (static / animated) | Supported |
| `.vrm` | VRM avatar (`@pixiv/three-vrm`) | Supported |
| `.vrma` | VRM animation | Supported |
| `.fbx` | Autodesk FBX | Partial |

`.fbx` renders, but models that rely on external texture files may appear dark (texture handling is a work in progress).

## Install

### 1. Install QuickLook (the host app)

This plugin runs inside QuickLook, so install QuickLook itself first. Choose one method:

- Microsoft Store: search for "QuickLook" (easiest, with automatic updates).
- Installer: download the latest release from the [QuickLook releases page](https://github.com/QL-Win/QuickLook/releases) and run it.
- Scoop: run `scoop bucket add extras`, then `scoop install quicklook`.

After installing, start QuickLook. It keeps running in the system tray (notification area).
Confirm it works by selecting any file in Explorer and pressing <kbd>Space</kbd>.

The WebView2 runtime is also required. It is preinstalled on Windows 11 and on most Windows 10 machines (it ships with Microsoft Edge); install it from Microsoft if it is missing.

### 2. Install this plugin

1. Get `QuickLook.Plugin.Model3DViewer.qlplugin` (build it from source below, or download it from the [releases page](https://github.com/nisshi-dev/quick-look-win-3d/releases)).
2. With QuickLook running, select the `.qlplugin` file in Explorer and press <kbd>Space</kbd>. QuickLook shows a small panel with the plugin name and an Install button.
3. Click Install.
4. Restart QuickLook so it loads the new plugin: quit it from the system tray icon, then start it again.
5. Select any `.glb` / `.vrm` / `.vrma` / `.fbx` file and press <kbd>Space</kbd>.

Requirements: Windows 10/11.

## Build from source

Prerequisites: [Node.js](https://nodejs.org/) 20 or later, the [.NET SDK](https://dotnet.microsoft.com/) (Windows).

```bash
# 1. Build the web renderer (produces renderer/dist)
cd renderer
npm ci
npm run build

# 2. Build the plugin
cd ..
dotnet build QuickLook.Plugin.Model3DViewer.sln -c Release

# 3. Package into a .qlplugin
powershell -ExecutionPolicy Bypass -File Scripts/pack-zip.ps1
```

Install the generated `QuickLook.Plugin.Model3DViewer.qlplugin` as described above.

`QuickLook.Common` is consumed as a NuGet package (no git submodule required).
Pushing a tag that starts with `v` (for example `v0.2.0`) makes GitHub Actions build the `.qlplugin` and attach it to a release.

## How it works

```
Explorer --(Space)--> QuickLook --> Plugin (IViewer, C#)
                                          |
                                          v
                                  WebView2 control
                                          |
                                          v
                      Three.js renderer (Vite build) <-- model file
```

The C# plugin implements QuickLook's `IViewer` and hosts a WebView2 control.
Inside it runs a small Three.js and Vite app that loads the selected model and renders it.
The renderer is vendored from [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d) (the macOS counterpart).

## Credits

The whole idea for this project comes from [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d), the macOS version of a 3D-model Quick Look viewer.
This plugin is the Windows counterpart, and it reuses that project's renderer.
Many thanks to sawa-zen for sharing the original work (MIT, © sawa-zen).

- Scaffolded from the [QuickLook.Plugin.HelloWorld](https://github.com/QL-Win/QuickLook.Plugin.HelloWorld) template (MIT, © Paddy Xu).
- [QuickLook](https://github.com/QL-Win/QuickLook) itself is by Paddy Xu and its contributors.
- VRM support uses [@pixiv/three-vrm](https://github.com/pixiv/three-vrm).

## License

[MIT](LICENSE.txt).
