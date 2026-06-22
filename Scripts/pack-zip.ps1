Remove-Item ..\QuickLook.Plugin.Model3DViewer.qlplugin -ErrorAction SilentlyContinue

$files = Get-ChildItem -Path ..\bin\Release\ -Exclude *.pdb,*.xml
Compress-Archive $files ..\QuickLook.Plugin.Model3DViewer.zip
Move-Item ..\QuickLook.Plugin.Model3DViewer.zip ..\QuickLook.Plugin.Model3DViewer.qlplugin
