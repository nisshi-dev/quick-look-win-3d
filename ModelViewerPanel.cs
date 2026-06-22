using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using QuickLook.Common.Plugin;

namespace QuickLook.Plugin.Model3DViewer
{
    /// <summary>
    /// WebView2 をホストし、Three.js 製レンダラー(renderer/index.html)で
    /// 3D モデルを表示する WPF コントロール。
    /// </summary>
    public sealed class ModelViewerPanel : UserControl, IDisposable
    {
        // 仮想ホスト名(WebView2 内からだけ見えるダミーのホスト)
        private const string RendererHost = "renderer.qlplugin"; // 静的なレンダラー資産
        private const string AssetHost = "asset.qlplugin";       // プレビュー対象ファイルのフォルダ

        private readonly WebView2 _webView = new WebView2();

        /// <summary>読み込みが完了(成功 or 失敗)したときに発火。スピナー解除に使う。</summary>
        public event Action ModelLoaded;

        public ModelViewerPanel()
        {
            // 読み込み前の白いちらつきを防ぐため、背景をレンダラーと同じ暗色にする
            _webView.DefaultBackgroundColor = Color.FromArgb(0x1c, 0x1c, 0x1e);
            Content = _webView;
        }

        public async void LoadModel(string modelPath, Themes theme)
        {
            try
            {
                var pluginDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                var rendererDir = Path.Combine(pluginDir, "renderer");
                var modelDir = Path.GetDirectoryName(modelPath);
                var modelFile = Path.GetFileName(modelPath);

                // ユーザーデータは書き込み可能な場所に置く(プラグインフォルダは読み取り専用のことがある)
                var env = await CoreWebView2Environment.CreateAsync(
                    userDataFolder: Path.Combine(Path.GetTempPath(), "QuickLook.Model3DViewer"));
                await _webView.EnsureCoreWebView2Async(env);

                var core = _webView.CoreWebView2;

                // ① レンダラーの静的ファイル群
                core.SetVirtualHostNameToFolderMapping(
                    RendererHost, rendererDir, CoreWebView2HostResourceAccessKind.Allow);
                // ② プレビュー対象ファイルのあるフォルダ(別オリジンからの fetch を許可)
                core.SetVirtualHostNameToFolderMapping(
                    AssetHost, modelDir, CoreWebView2HostResourceAccessKind.Allow);

                // JS(renderer)→ C# の通知。'loaded' / 'error' のどちらでもスピナーを解除する
                core.WebMessageReceived += (s, e) =>
                {
                    ModelLoaded?.Invoke();
                };

                var themeName = theme == Themes.Dark ? "dark" : "light";
                var modelUrl = $"https://{AssetHost}/{Uri.EscapeDataString(modelFile)}";
                _webView.Source = new Uri(
                    $"https://{RendererHost}/index.html" +
                    $"?url={Uri.EscapeDataString(modelUrl)}&theme={themeName}");
            }
            catch
            {
                // 初期化に失敗してもスピナーを止める
                ModelLoaded?.Invoke();
            }
        }

        public void Dispose()
        {
            _webView?.Dispose();
        }
    }
}
