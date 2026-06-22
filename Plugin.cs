using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using QuickLook.Common.Plugin;

namespace QuickLook.Plugin.Model3DViewer
{
    public class Plugin : IViewer
    {
        // 対応する3Dモデル拡張子(優先順: glb → vrm/vrma → fbx)
        private static readonly string[] SupportedExtensions =
            { ".glb", ".vrm", ".vrma", ".fbx" };

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
            context.PreferredSize = new Size { Width = 1200, Height = 900 };
        }

        public void View(string path, ContextObject context)
        {
            // TODO: WebView2 + Three.js レンダラーに置き換える(次ステップ)
            var viewer = new Label { Content = $"3D model viewer (WIP): {Path.GetFileName(path)}" };

            context.ViewerContent = viewer;
            context.Title = Path.GetFileName(path);

            context.IsBusy = false;
        }

        public void Cleanup()
        {
        }
    }
}
