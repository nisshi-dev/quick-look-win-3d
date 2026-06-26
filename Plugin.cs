using System.IO;
using System.Linq;
using System.Windows;
using QuickLook.Common.Plugin;

namespace QuickLook.Plugin.Model3DViewer
{
    public class Plugin : IViewer
    {
        // 対応する3Dモデル拡張子(優先順: glb → vrm/vrma → fbx)
        private static readonly string[] SupportedExtensions =
            { ".glb", ".vrm", ".vrma", ".fbx" };

        private ModelViewerPanel _panel;

        public int Priority => 0;

        public void Init()
        {
        }

        public bool CanHandle(string path)
        {
            if (Directory.Exists(path)) return false;
            return SupportedExtensions.Contains(Path.GetExtension(path).ToLowerInvariant());
        }

        public void Prepare(string path, ContextObject context)
        {
            // タイトルバー系は上書きしない。既定(TitlebarOverlap=false,
            // TitlebarAutoHide=false)に任せることで、画像プレビューと同じ
            // 「常時表示の標準ヘッダー(ファイル名＋ツールバー)」になる。
            // 組み込みの3Dビューア HelixViewer も同様にタイトルバーを上書きしない。
            context.SetPreferredSizeFit(new Size(1200, 900), 0.8);
        }

        public void View(string path, ContextObject context)
        {
            _panel = new ModelViewerPanel();
            // renderer が読み込み完了(成功/失敗)を通知したらスピナーを止める
            _panel.ModelLoaded += () => context.IsBusy = false;
            _panel.LoadModel(path, context.Theme);

            context.ViewerContent = _panel;
            context.Title = Path.GetFileName(path);
        }

        public void Cleanup()
        {
            _panel?.Dispose();
            _panel = null;
        }
    }
}
