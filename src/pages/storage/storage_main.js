import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createViewModeControls } from "../../components/Controls.js";
import { addTileFloor } from "./floor/floor.js";
import { fitRootToAxisAlignedDimensions } from "./coords.js";

const STORAGE_URL = "/assets/blend/storage.glb";
const storageLoader = new GLTFLoader();

/** 창고 AABB 목표 (m) */
const HANGAR_DIM_M = { widthX: 59.9, heightY: 28.7, depthZ: 47.5 };

/** 창고 X 감소(음수 = X축 줄임). */
const HANGAR_X_NUDGE = -30;
/** 바닥 위로 올리기(Y 증가). */
const HANGAR_Y_NUDGE = 1.0;

/**
 * @param {{
 *  scene: THREE.Scene;
 *  renderer: THREE.WebGLRenderer;
 *  canvas: HTMLCanvasElement;
 *  onEnterStorageInside?: () => void;
 * }} ctx
 */
export function initStorageApp({ scene, renderer, canvas, onEnterStorageInside }) {
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  /** @type {THREE.Object3D | null} */
  let centerHangarRoot = null;
  let rafId = 0;
  let pendingEnterInside = false;
  let isDisposed = false;
  let enteringInside = false;
  /** @type {null | {
   *   startTime: number;
   *   durationMs: number;
   *   startPos: THREE.Vector3;
   *   endPos: THREE.Vector3;
   *   startTarget: THREE.Vector3;
   *   endTarget: THREE.Vector3;
   * }} */
  let zoomTransition = null;

  const lookTarget = new THREE.Vector3(0, 0, 0);
  const viewControls = createViewModeControls({
    renderer,
    domElement: canvas,
    target: lookTarget,
    orthoD: 100,
    near: 0.5,
    far: 5000,
  });
  viewControls.resize(window.innerWidth, window.innerHeight);

  function onSidebarViewModeChange(event) {
    const next = event?.detail?.mode;
    if (next === "perspective" || next === "orthographic") {
      viewControls.setMode(next);
    }
  }

  function fitTargetToBounds(box) {
    const c = box.getCenter(new THREE.Vector3());
    lookTarget.copy(c);
    viewControls.setTarget(c);
  }

  function startSmoothFocus(root) {
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const distance = Math.max(22, radius * 2.4);
    const activeCamera = viewControls.getActiveCamera();
    const dir = new THREE.Vector3(30, 24, 28).normalize();
    const endPos = center.clone().addScaledVector(dir, distance);
    const startTarget = viewControls.getTarget();

    zoomTransition = {
      startTime: performance.now(),
      durationMs: 900,
      startPos: activeCamera.position.clone(),
      endPos,
      startTarget,
      endTarget: center.clone(),
    };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function updateZoomTransition() {
    if (!zoomTransition) return;
    const activeCamera = viewControls.getActiveCamera();
    const now = performance.now();
    const rawT = (now - zoomTransition.startTime) / zoomTransition.durationMs;
    const t = THREE.MathUtils.clamp(rawT, 0, 1);
    const e = easeOutCubic(t);

    activeCamera.position.lerpVectors(
      zoomTransition.startPos,
      zoomTransition.endPos,
      e
    );

    const target = new THREE.Vector3().lerpVectors(
      zoomTransition.startTarget,
      zoomTransition.endTarget,
      e
    );
    viewControls.setTarget(target);

    if (t >= 1) {
      zoomTransition = null;
      if (pendingEnterInside && onEnterStorageInside) {
        pendingEnterInside = false;
        if (!enteringInside) {
          enteringInside = true;
          onEnterStorageInside();
        }
      }
    }
  }

  function onCanvasClick(event) {
    if (!centerHangarRoot) return;

    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, viewControls.getActiveCamera());
    const hits = raycaster.intersectObject(centerHangarRoot, true);
    if (hits.length > 0) {
      pendingEnterInside = true;
      startSmoothFocus(centerHangarRoot);
    }
  }

  async function bootstrap() {
    const { getBounds } = await addTileFloor(scene);
    const tileBox = getBounds();

    const gltf = await storageLoader.loadAsync(STORAGE_URL);
    const template = gltf.scene;
    template.scale.set(1, 1, 1);
    template.updateMatrixWorld(true);

    const combined = tileBox.clone();

    const spawn = () => {
      const root = template.clone(true);
      root.rotation.set(0, 0, 0);
      fitRootToAxisAlignedDimensions(
        root,
        HANGAR_DIM_M.widthX,
        HANGAR_DIM_M.heightY,
        HANGAR_DIM_M.depthZ
      );
      scene.add(root);
      return root;
    };

    {
      const root = spawn();
      root.position.set(-68.465 + HANGAR_X_NUDGE, 5.225 + HANGAR_Y_NUDGE, 1.520);
      root.updateMatrixWorld(true);
      centerHangarRoot = root;
      combined.union(new THREE.Box3().setFromObject(root));
    }

    {
      const root = spawn();
      root.position.set(-114.94 + HANGAR_X_NUDGE, 5.225 + HANGAR_Y_NUDGE, 99.361);
      root.updateMatrixWorld(true);
      combined.union(new THREE.Box3().setFromObject(root));
    }

    {
      const root = spawn();
      root.position.set(-114.94 + HANGAR_X_NUDGE, 5.225 + HANGAR_Y_NUDGE, -94.364);
      root.updateMatrixWorld(true);
      combined.union(new THREE.Box3().setFromObject(root));
    }

    viewControls.fitToBounds(combined);
    viewControls.resize(window.innerWidth, window.innerHeight);
  }

  function onResize() {
    viewControls.resize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize);
  canvas.addEventListener("click", onCanvasClick);
  window.addEventListener("app:viewmode-change", onSidebarViewModeChange);

  function animate() {
    if (isDisposed) return;
    if (zoomTransition) {
      updateZoomTransition();
    }
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }

  bootstrap().catch((err) => {
    console.error("씬 초기화 실패:", err);
  });

  animate();

  return {
    dispose() {
      isDisposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onCanvasClick);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      viewControls.dispose();
    },
  };
}
