# QuickLook.Plugin.Model3DViewer (quick-look-win-3d)

A [QuickLook](https://github.com/QL-Win/QuickLook) plugin that previews 3D model files
(`.glb`, `.vrm`, `.vrma`, `.fbx`) with the spacebar, rendered by Three.js + @pixiv/three-vrm
inside WebView2.

> Work in progress. The Windows counterpart of [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d) (macOS).

## Status

- [x] Project scaffolding (renamed from the HelloWorld template)
- [ ] WebView2 host + Three.js renderer
- [ ] `.glb` preview
- [ ] `.vrm` / `.vrma` preview
- [ ] `.fbx` preview

## Development

1. Clone with submodules: `git clone --recurse-submodules <repo>`
   (the `QuickLook.Common` contract lives in a git submodule).
2. Build with the `Release` profile: `dotnet build -c Release`.
3. Run `Scripts\pack-zip.ps1` to produce `QuickLook.Plugin.Model3DViewer.qlplugin`.
4. With QuickLook running, press <kbd>Space</kbd> on the `.qlplugin` file and click "Install", then restart QuickLook.

## License

MIT License. See [LICENSE.txt](LICENSE.txt).

Derived from the [QuickLook.Plugin.HelloWorld](https://github.com/QL-Win/QuickLook.Plugin.HelloWorld)
template (MIT, © Paddy Xu). The bundled renderer is based on
[sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d) (MIT, © sawa-zen).
