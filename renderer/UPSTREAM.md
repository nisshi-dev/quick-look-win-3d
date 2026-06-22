# Renderer provenance

This `renderer/` directory was **vendored** (copied) from the macOS project
[sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d), which is the
inspiration and upstream of this Windows port.

| | |
|---|---|
| Upstream repo | https://github.com/sawa-zen/quick-look-3d |
| Vendored from commit | `f4e415e50938ec83e8e835648650726509971504` |
| Commit date | 2026-06-16 |
| Vendored subtree | `renderer/` (the Three.js / TypeScript renderer only) |
| License | MIT © sawa-zen (see [LICENSE](LICENSE)) |

## Notes

- Only the OS-independent Three.js renderer was taken; the upstream's macOS
  (Swift / WKWebView) code was intentionally **not** copied.
- This copy is **modified** for WebView2 (Windows) integration. Modifications are
  kept in commits **after** the initial vendoring commit, so the diff against the
  upstream is traceable.
- The renderer's own libraries (`three`, `@pixiv/three-vrm`, etc.) are **not**
  vendored — they are pulled via `npm install` per `package.json`.
