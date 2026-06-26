import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import { t, lang } from './i18n';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const app = document.getElementById('app')!;
const overlay = document.getElementById('overlay')!;
const overlayText = document.getElementById('overlay-text')!;
const infoPanel = document.getElementById('info-panel')!;
const infoBody = document.getElementById('info-body')!;

// Localize static chrome up front (panel title, initial loading text).
document.documentElement.lang = lang;
{
  const titleEl = document.querySelector('#info-header .info-title');
  if (titleEl) titleEl.textContent = t('title');
  overlayText.textContent = t('loading');
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1.3, 3);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.update();

// Lighting (key + fill + ambient)
const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
keyLight.position.set(1, 2, 1.5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-1.5, 1, -1);
scene.add(fillLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 0.6));

// Floor grid
const grid = new THREE.GridHelper(10, 20, 0x444444, 0x2a2a2a);
(grid.material as THREE.Material).transparent = true;
(grid.material as THREE.Material).opacity = 0.4;
scene.add(grid);

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------
const gltfLoader = new GLTFLoader();
gltfLoader.register((parser) => new VRMLoaderPlugin(parser));
const fbxLoader = new FBXLoader();

// Remember the root added to the scene (VRM or plain glTF/GLB) so we can swap it out
let currentRoot: THREE.Object3D | null = null;
let currentVrm: VRM | null = null;
let currentMixer: THREE.AnimationMixer | null = null;
let currentSkeletonHelper: THREE.SkeletonHelper | null = null;
const clock = new THREE.Clock();

/** Whether it has a renderable mesh. false for VRMA / skin-less FBX. */
function hasRenderableMesh(root: THREE.Object3D): boolean {
  let found = false;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) found = true;
  });
  return found;
}

function showOverlay(text: string, isError = false) {
  overlayText.textContent = text;
  overlay.classList.toggle('error', isError);
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

/**
 * Notify the native host (WebView2) that loading finished.
 * In a plain browser `window.chrome.webview` is undefined, so this is a no-op.
 * The C# side listens for this to clear QuickLook's busy spinner.
 */
function notifyHost(status: 'loaded' | 'error') {
  (window as any).chrome?.webview?.postMessage(status);
}

/** Fit the camera and target to the model's bounding box. */
function frameModel(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  // With no mesh (bones only) the box is empty, so derive it from each node's position.
  if (box.isEmpty()) {
    const p = new THREE.Vector3();
    root.updateWorldMatrix(true, true);
    root.traverse((o) => box.expandByPoint(o.getWorldPosition(p)));
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Derive the distance that fits the whole model from the field of view.
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;
  const distance = (maxDim / 2 / Math.tan(fov / 2)) * 1.4;

  controls.target.copy(center);
  camera.position.set(center.x, center.y + size.y * 0.05, center.z + distance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.update();
}

/** Dispose the currently shown model (VRM / glTF / FBX / VRMA alike). */
function disposeCurrent() {
  if (currentMixer) {
    currentMixer.stopAllAction();
    currentMixer = null;
  }
  if (currentSkeletonHelper) {
    scene.remove(currentSkeletonHelper);
    currentSkeletonHelper.dispose();
    currentSkeletonHelper = null;
  }
  if (currentRoot) {
    scene.remove(currentRoot);
    VRMUtils.deepDispose(currentRoot);
    currentRoot = null;
  }
  currentVrm = null;
}

/** Detect FBX from the leading bytes (VRM/GLB start with the "glTF" magic). */
function isFBX(u8: Uint8Array): boolean {
  // Binary FBX: "Kaydara FBX Binary  \x00"
  const sig = 'Kaydara FBX Binary';
  let binMatch = u8.length > sig.length;
  for (let i = 0; binMatch && i < sig.length; i++) {
    if (u8[i] !== sig.charCodeAt(i)) binMatch = false;
  }
  if (binMatch) return true;
  // ASCII FBX: contains "FBX" near the start (GLB is 'glTF', so it won't match).
  const head = new TextDecoder().decode(u8.subarray(0, 64));
  return head.includes('FBX');
}

/** Add the loaded root to the scene (shared post-processing for VRM / glTF / FBX / VRMA). */
function applyModel(
  root: THREE.Object3D,
  vrm: VRM | null,
  clips: THREE.AnimationClip[],
  meta: { format: string; bytes: number; gltf?: GLTF | null },
) {
  // Play the first clip if any (GLB/FBX animation, VRMA, etc.).
  if (clips.length > 0) {
    currentMixer = new THREE.AnimationMixer(root);
    currentMixer.clipAction(clips[0]).play();
  }
  // Disable frustum culling so meshes don't disappear unexpectedly.
  root.traverse((obj) => {
    obj.frustumCulled = false;
  });
  scene.add(root);

  // No mesh, animation only (VRMA / skin-less FBX):
  // visualize the bone hierarchy with a skeleton helper.
  if (!vrm && clips.length > 0 && !hasRenderableMesh(root)) {
    root.traverse((o) => {
      // SkeletonHelper only links bones, so mark each node as a bone.
      if (o !== root) (o as unknown as { isBone: boolean }).isBone = true;
    });
    currentSkeletonHelper = new THREE.SkeletonHelper(root);
    scene.add(currentSkeletonHelper);
  }

  currentRoot = root;
  currentVrm = vrm;
  frameModel(root);
  hideOverlay();
  renderInfoPanel(computeModelInfo(root, vrm, clips, meta));
  infoReady = true;
  infoPanel.classList.remove('hidden');
  notifyHost('loaded');
}

// ---------------------------------------------------------------------------
// Model info panel — gather stats users care about and render them as an overlay.
// Toggle visibility with the "i" key.
// ---------------------------------------------------------------------------
interface ModelInfo {
  format: string;
  bytes: number;
  generator?: string;
  triangles: number;
  vertices: number;
  meshes: number;
  objects: number;
  materials: number;
  textures: number;
  morphs: number;
  bones: number;
  skinnedMeshes: number;
  clips: THREE.AnimationClip[];
  vrm?: {
    version: string;
    title?: string;
    author?: string;
    license?: string;
    expressions?: number;
  };
}

let infoReady = false;

// Known texture-bearing material slots. MToon (VRM) exposes these as prototype
// getters, so Object.keys() can't see them — we probe each name directly.
const TEXTURE_SLOTS = [
  'map', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'emissiveMap',
  'aoMap', 'alphaMap', 'displacementMap', 'lightMap', 'envMap', 'specularMap',
  'gradientMap', 'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
  'sheenColorMap', 'sheenRoughnessMap', 'transmissionMap', 'thicknessMap',
  'iridescenceMap', 'iridescenceThicknessMap', 'specularIntensityMap',
  'specularColorMap', 'anisotropyMap',
  // MToon (three-vrm)
  'shadeMultiplyTexture', 'shadingShiftTexture', 'matcapTexture',
  'rimMultiplyTexture', 'outlineWidthMultiplyTexture', 'uvAnimationMaskTexture',
];

/** Walk the loaded scene and tally geometry / material / rig / animation stats. */
function computeModelInfo(
  root: THREE.Object3D,
  vrm: VRM | null,
  clips: THREE.AnimationClip[],
  meta: { format: string; bytes: number; gltf?: GLTF | null },
): ModelInfo {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  let objects = 0;
  let morphs = 0;
  let skinnedMeshes = 0;
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const bones = new Set<THREE.Object3D>();

  root.traverse((o) => {
    objects++;
    if ((o as unknown as { isBone?: boolean }).isBone) bones.add(o);

    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes++;

    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position;
    if (pos) {
      vertices += pos.count;
      triangles += (geo.index ? geo.index.count : pos.count) / 3;
    }
    if (geo.morphAttributes?.position) morphs += geo.morphAttributes.position.length;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m) continue;
      materials.add(m);
      const collect = (val: unknown) => {
        if (val && (val as THREE.Texture).isTexture) textures.add(val as THREE.Texture);
      };
      const rec = m as unknown as Record<string, unknown>;
      // Known slots (catches MToon getters) + any own Texture-typed property.
      for (const slot of TEXTURE_SLOTS) {
        try {
          collect(rec[slot]);
        } catch {
          /* some getters may throw when unset */
        }
      }
      for (const key of Object.keys(m)) collect(rec[key]);
    }

    const skinned = mesh as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      skinnedMeshes++;
      skinned.skeleton.bones.forEach((b) => bones.add(b));
    }
  });

  let vrmInfo: ModelInfo['vrm'];
  if (vrm) {
    const m = vrm.meta as unknown as Record<string, unknown>;
    const version = m?.metaVersion === '1' ? 'VRM 1.0' : 'VRM 0.x';
    const authors = (m?.authors as string[]) ?? (m?.author ? [m.author as string] : []);
    vrmInfo = {
      version,
      title: (m?.name as string) ?? (m?.title as string) ?? undefined,
      author: authors.length ? authors.join(', ') : undefined,
      license: (m?.licenseName as string) ?? (m?.licenseUrl as string) ?? undefined,
      expressions: vrm.expressionManager?.expressions?.length,
    };
  }

  return {
    format: meta.format,
    bytes: meta.bytes,
    generator: meta.gltf?.asset?.generator,
    triangles: Math.round(triangles),
    vertices,
    meshes,
    objects,
    materials: materials.size,
    textures: textures.size,
    morphs,
    bones: bones.size,
    skinnedMeshes,
    clips,
    vrm: vrmInfo,
  };
}

const numberFmt = new Intl.NumberFormat('en-US');
const fmtNum = (n: number) => numberFmt.format(n);

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = b / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}

function renderInfoPanel(info: ModelInfo) {
  const sections: { label: string; rows: [string, string][] }[] = [];

  const file: [string, string][] = [
    [t('format'), info.format],
    [t('size'), fmtBytes(info.bytes)],
  ];
  if (info.generator) file.push([t('generator'), info.generator]);
  sections.push({ label: t('file'), rows: file });

  if (info.meshes > 0) {
    sections.push({
      label: t('geometry'),
      rows: [
        [t('triangles'), fmtNum(info.triangles)],
        [t('vertices'), fmtNum(info.vertices)],
        [t('meshes'), fmtNum(info.meshes)],
        [t('objects'), fmtNum(info.objects)],
      ],
    });
    const appearance: [string, string][] = [
      [t('materialsRow'), fmtNum(info.materials)],
      [t('textures'), fmtNum(info.textures)],
    ];
    if (info.morphs > 0) appearance.push([t('blendshapes'), fmtNum(info.morphs)]);
    sections.push({ label: t('materials'), rows: appearance });
  }

  const rig: [string, string][] = [];
  if (info.bones > 0) rig.push([t('bones'), fmtNum(info.bones)]);
  if (info.skinnedMeshes > 0) rig.push([t('skinnedMeshes'), fmtNum(info.skinnedMeshes)]);
  if (rig.length) sections.push({ label: t('rig'), rows: rig });

  if (info.clips.length > 0) {
    const rows: [string, string][] = [[t('clips'), fmtNum(info.clips.length)]];
    info.clips.slice(0, 5).forEach((c, i) => {
      rows.push([c.name || `${t('clip')} ${i + 1}`, `${c.duration.toFixed(2)}s`]);
    });
    sections.push({ label: t('animation'), rows });
  }

  if (info.vrm) {
    const rows: [string, string][] = [[t('spec'), info.vrm.version]];
    if (info.vrm.title) rows.push([t('vrmTitle'), info.vrm.title]);
    if (info.vrm.author) rows.push([t('author'), info.vrm.author]);
    if (info.vrm.expressions) rows.push([t('expressions'), fmtNum(info.vrm.expressions)]);
    if (info.vrm.license) rows.push([t('license'), info.vrm.license]);
    sections.push({ label: t('vrm'), rows });
  }

  infoBody.innerHTML = sections
    .map(
      (sec) =>
        `<div class="info-section">${sec.label}</div>` +
        sec.rows
          .map(
            ([k, v]) =>
              `<div class="info-row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`,
          )
          .join(''),
    )
    .join('');
}

// "i" toggles the info panel once a model is loaded.
window.addEventListener('keydown', (e) => {
  if (e.key !== 'i' && e.key !== 'I') return;
  if (!infoReady) return;
  infoPanel.classList.toggle('hidden');
});

async function loadModelFromArrayBuffer(buffer: ArrayBuffer) {
  showOverlay(t('loading'));
  infoReady = false;
  infoPanel.classList.add('hidden');
  try {
    disposeCurrent();

    if (isFBX(new Uint8Array(buffer))) {
      // --- FBX ---
      const root = fbxLoader.parse(buffer, '');
      applyModel(root, null, root.animations, {
        format: 'FBX',
        bytes: buffer.byteLength,
      });
      console.log('FBX loaded & added to scene');
      return;
    }

    // --- VRM / VRMA / glTF / GLB ---
    const blob = new Blob([buffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const gltf = await gltfLoader.loadAsync(url);
    URL.revokeObjectURL(url);

    // The VRM plugin sets userData.vrm when it can parse it; otherwise plain glTF/GLB.
    // A VRMA (no mesh, animation only) ends up vrm=null + animations present, and
    // applyModel routes it to the skeleton view.
    const vrm = (gltf.userData.vrm as VRM | undefined) ?? null;
    if (vrm) {
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);
      VRMUtils.rotateVRM0(vrm); // fix VRM 0.x coordinate system (faces +Z)
    }
    const format = vrm
      ? (vrm.meta as unknown as { metaVersion?: string }).metaVersion === '1'
        ? 'VRM 1.0'
        : 'VRM 0.x'
      : hasRenderableMesh(gltf.scene)
        ? 'GLB'
        : 'VRMA';
    applyModel(vrm ? vrm.scene : gltf.scene, vrm, vrm ? [] : gltf.animations, {
      format,
      bytes: buffer.byteLength,
      gltf,
    });
    console.log(
      vrm
        ? 'VRM loaded & added to scene'
        : hasRenderableMesh(gltf.scene)
          ? 'glTF/GLB loaded & added to scene'
          : 'skeleton (mesh-less) loaded & added to scene',
    );
  } catch (e) {
    console.error('[model] load failed', e);
    showOverlay(t('failed'), true);
    notifyHost('error');
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

console.log('renderer booted, WebGL context =', !!renderer.getContext());

// ---------------------------------------------------------------------------
// Load entry points
//   - QuickLook (production): the C# host navigates to index.html?url=<assetUrl>,
//     and the renderer fetches that URL below. This always runs.
//   - postMessage({ type: 'loadVRM', base64 }): programmatic hook for development
//     and automated testing (Vite reserves the ?url query, so tests use this).
//   - Drag & drop: convenience when opening the renderer directly in a browser.
// ---------------------------------------------------------------------------
window.addEventListener('message', (event) => {
  if (event.data?.type !== 'loadVRM') return;
  void loadModelFromArrayBuffer(base64ToArrayBuffer(event.data.base64));
});

(function initLoad() {
  const url = new URLSearchParams(location.search).get('url');
  if (url) {
    showOverlay(t('loading'));
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => loadModelFromArrayBuffer(buf))
      .catch(() => showOverlay(t('failed'), true));
    return;
  }

  // No model supplied — only reachable when opening the renderer directly in a
  // browser (inside QuickLook the host always provides ?url). Offer drag & drop.
  const inHost = !!(window as unknown as { chrome?: { webview?: unknown } }).chrome?.webview;
  if (!inHost) {
    showOverlay('Drag & drop a .vrm / .vrma / .glb / .fbx');
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) void file.arrayBuffer().then((buf) => loadModelFromArrayBuffer(buf));
    });
  }
})();

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update();
  if (currentVrm) currentVrm.update(delta); // update spring bones, expressions, etc.
  if (currentMixer) currentMixer.update(delta); // glTF/GLB animation
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
