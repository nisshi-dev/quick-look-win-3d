<div align="center">

# quick-look-win-3d

[English](./README.md) | [日本語](./README.ja.md) | **한국어**

Windows 탐색기에서 스페이스바로 3D 모델을 즉시 미리보는 [QuickLook](https://github.com/QL-Win/QuickLook) 플러그인.

`.glb` / `.vrm` / `.vrma` / `.fbx` 를 Three.js 와 WebView2 로 렌더링합니다.

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white)
![QuickLook](https://img.shields.io/badge/QuickLook-plugin-2C9FDB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-renderer-000000?style=flat-square&logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-3DA639?style=flat-square)

![quick-look-win-3d 데모](docs/demo.gif)

<!-- X(구 Twitter) 게시물을 여기에 삽입합니다. -->

</div>

## 기능

탐색기에서 파일을 선택하고 <kbd>Space</kbd> 를 누르면 3D 모델이 표시됩니다.
드래그로 회전, 스크롤로 확대/축소, 오른쪽 드래그로 이동할 수 있습니다.

왼쪽 위 정보 패널에 형식, 파일 크기, 폴리곤 수, 정점 수, 메시 수, 머티리얼 수, 텍스처 수, 본 수, 애니메이션, VRM 메타데이터를 표시합니다.
정보 패널은 <kbd>i</kbd> 키로 열고 닫을 수 있습니다.

화면은 QuickLook 의 테마(라이트/다크)를 따릅니다.
정보 패널의 라벨은 OS 표시 언어에 따라 영어, 일본어, 한국어로 전환됩니다(기본값은 영어).

## 지원 형식

| 형식 | 설명 | 상태 |
| :--- | :--- | :--: |
| `.glb` | glTF 바이너리(정적 / 애니메이션) | 지원 |
| `.vrm` | VRM 아바타(`@pixiv/three-vrm`) | 지원 |
| `.vrma` | VRM 애니메이션 | 지원 |
| `.fbx` | Autodesk FBX | 부분 지원 |

`.fbx` 는 표시되지만, 외부 텍스처 파일에 의존하는 모델은 어둡게 보일 수 있습니다(텍스처 처리는 개선 중).

## 설치

### 1. QuickLook 본체 설치

이 플러그인은 QuickLook 안에서 동작하므로 먼저 QuickLook 본체를 설치합니다.
다음 중 한 가지 방법을 사용합니다.

- Microsoft Store: "QuickLook" 검색(가장 간단하며 자동 업데이트).
- 설치 프로그램: [QuickLook 릴리스 페이지](https://github.com/QL-Win/QuickLook/releases)에서 최신 버전을 받아 실행합니다.
- Scoop: `scoop bucket add extras` 실행 후 `scoop install quicklook`.

설치한 뒤 QuickLook 을 실행합니다.
QuickLook 은 알림 영역(시스템 트레이)에 상주합니다.
탐색기에서 아무 파일이나 선택하고 <kbd>Space</kbd> 를 눌러 미리보기가 나오면 정상 동작입니다.

WebView2 런타임도 필요합니다.
Windows 11 과 대부분의 Windows 10 에는 기본 포함되어 있습니다(Microsoft Edge 에 포함).
없으면 Microsoft 에서 설치하세요.

### 2. 이 플러그인 설치

1. `QuickLook.Plugin.Model3DViewer.qlplugin` 을 준비합니다(아래 빌드 절차를 따르거나 이 저장소의 릴리스 페이지에서 받기).
2. QuickLook 이 실행 중인 상태에서 `.qlplugin` 파일을 선택하고 <kbd>Space</kbd> 를 누릅니다. 플러그인 이름과 "Install" 버튼이 표시됩니다.
3. "Install" 을 누릅니다.
4. 새 플러그인을 불러오도록 QuickLook 을 재시작합니다. 알림 영역 아이콘에서 종료한 뒤 다시 실행하세요.
5. `.glb` / `.vrm` / `.vrma` / `.fbx` 중 하나를 선택하고 <kbd>Space</kbd> 를 누릅니다.

요구 사항: Windows 10/11.

## 소스에서 빌드

준비물: [Node.js](https://nodejs.org/) 20 이상, [.NET SDK](https://dotnet.microsoft.com/)(Windows).

```bash
# 1. 웹 렌더러 빌드 (renderer/dist 생성)
cd renderer
npm ci
npm run build

# 2. 플러그인 빌드
cd ..
dotnet build QuickLook.Plugin.Model3DViewer.sln -c Release

# 3. .qlplugin 으로 패키징
powershell -ExecutionPolicy Bypass -File Scripts/pack-zip.ps1
```

생성된 `QuickLook.Plugin.Model3DViewer.qlplugin` 을 위의 설치 절차로 설치합니다.

`QuickLook.Common` 은 NuGet 패키지로 참조합니다(git 서브모듈은 필요 없습니다).
`v` 로 시작하는 태그(예: `v0.2.0`)를 푸시하면 GitHub Actions 가 `.qlplugin` 을 빌드하여 릴리스에 첨부합니다.

## 동작 방식

```
탐색기 --(Space)--> QuickLook --> 플러그인 (IViewer, C#)
                                       |
                                       v
                               WebView2 컨트롤
                                       |
                                       v
                   Three.js 렌더러 (Vite build) <-- 모델 파일
```

C# 플러그인은 QuickLook 의 `IViewer` 를 구현하고 WebView2 컨트롤을 호스팅합니다.
그 안에서 Three.js 와 Vite 로 만든 작은 앱이 실행되어 선택한 모델을 불러와 렌더링합니다.
렌더러는 [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d)(macOS 버전)에서 가져와 사용합니다.

## 크레딧

이 프로젝트의 아이디어는 3D 모델을 Quick Look 으로 표시하는 macOS 버전 [sawa-zen/quick-look-3d](https://github.com/sawa-zen/quick-look-3d) 에서 비롯되었습니다.
이 플러그인은 그 Windows 버전에 해당하며, 렌더러도 해당 프로젝트의 것을 사용합니다.
훌륭한 원본 프로젝트를 공개해 주신 sawa-zen 님께 감사드립니다(MIT, © sawa-zen).

- [QuickLook.Plugin.HelloWorld](https://github.com/QL-Win/QuickLook.Plugin.HelloWorld) 템플릿(MIT, © Paddy Xu)으로 만들었습니다.
- 본체인 [QuickLook](https://github.com/QL-Win/QuickLook) 은 Paddy Xu 와 기여자들이 만들었습니다.
- VRM 지원은 [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) 을 사용합니다.

## 라이선스

[MIT](LICENSE.txt).
