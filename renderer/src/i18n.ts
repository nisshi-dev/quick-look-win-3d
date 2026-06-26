// UI strings for the model-info panel and overlay messages.
// English is the default; Japanese / Korean are picked from the OS/browser
// locale (WebView2 reflects the Windows display language in navigator.language).

export type Lang = 'en' | 'ja' | 'ko';

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Model info', loading: 'Loading…', failed: 'Failed to load',
    file: 'File', geometry: 'Geometry', materials: 'Materials', rig: 'Rig',
    animation: 'Animation', vrm: 'VRM',
    format: 'Format', size: 'Size', generator: 'Generator',
    triangles: 'Triangles', vertices: 'Vertices', meshes: 'Meshes', objects: 'Objects',
    materialsRow: 'Materials', textures: 'Textures', blendshapes: 'Blend shapes',
    bones: 'Bones', skinnedMeshes: 'Skinned meshes',
    clips: 'Clips', clip: 'Clip', spec: 'Spec', vrmTitle: 'Title',
    author: 'Author', expressions: 'Expressions', license: 'License',
  },
  ja: {
    title: 'モデル情報', loading: '読み込み中…', failed: '読み込みに失敗しました',
    file: 'ファイル', geometry: 'ジオメトリ', materials: 'マテリアル', rig: 'リグ',
    animation: 'アニメーション', vrm: 'VRM',
    format: '形式', size: 'サイズ', generator: '生成',
    triangles: 'ポリゴン', vertices: '頂点', meshes: 'メッシュ', objects: 'オブジェクト',
    materialsRow: 'マテリアル', textures: 'テクスチャ', blendshapes: 'ブレンドシェイプ',
    bones: 'ボーン', skinnedMeshes: 'スキンメッシュ',
    clips: 'クリップ数', clip: 'クリップ', spec: '仕様', vrmTitle: 'タイトル',
    author: '作者', expressions: '表情', license: 'ライセンス',
  },
  ko: {
    title: '모델 정보', loading: '불러오는 중…', failed: '불러오기 실패',
    file: '파일', geometry: '지오메트리', materials: '머티리얼', rig: '리그',
    animation: '애니메이션', vrm: 'VRM',
    format: '형식', size: '용량', generator: '생성 도구',
    triangles: '삼각형', vertices: '정점', meshes: '메시', objects: '오브젝트',
    materialsRow: '머티리얼', textures: '텍스처', blendshapes: '블렌드셰이프',
    bones: '본', skinnedMeshes: '스킨 메시',
    clips: '클립 수', clip: '클립', spec: '사양', vrmTitle: '제목',
    author: '작성자', expressions: '표정', license: '라이선스',
  },
};

function detectLang(): Lang {
  const cands = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  for (const c of cands) {
    const code = c.toLowerCase();
    if (code.startsWith('ja')) return 'ja';
    if (code.startsWith('ko')) return 'ko';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

/** Active language, derived once from the OS/browser locale. */
export const lang: Lang = detectLang();

/** Translate a key for the active language (falls back to English, then the key). */
export const t = (key: string): string => STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
