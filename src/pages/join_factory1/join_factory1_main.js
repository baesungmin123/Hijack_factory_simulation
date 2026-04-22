import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addPartsFactory1Floor } from "./floor.js";
import { addPartsFactory1Building } from "./fatory.js";

/**
 * 조립공장1 화면 초기화
 * @param {{
 *   scene: THREE.Scene;
 *   renderer: THREE.WebGLRenderer;
 *   canvas: HTMLCanvasElement;
 *   onEnterInside?: () => void;
 * }} ctx
 */
export function initPartsFactory1App({ scene, renderer, canvas, onEnterInside }) {
  scene.background = new THREE.Color(0xc7d9ee);
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  /** @type {THREE.Object3D | null} */
  let factoryRoot = null;
  let enteringInside = false;
  let pendingEnterInside = false;
  let zoomTransition = null;

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const key = new THREE.DirectionalLight(0xfff3db, 1.15);
  key.position.set(26, 42, 20);
  scene.add(ambient, key);

  const target = new THREE.Vector3(0, 0, 0);
  const viewControls = createViewModeControls({
    renderer,
    domElement: canvas,
    target,
    orthoD: 100,
    perspectiveFov: 78,
    near: 0.2,
    far: 6000,
  });
  viewControls.setMode("perspective");
  viewControls.resize(window.innerWidth, window.innerHeight);

  function onSidebarViewModeChange(event) {
    const next = event?.detail?.mode;
    if (next === "perspective" || next === "orthographic") {
      viewControls.setMode(next);
    }
  }

  function startSmoothFocus(root) {
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const distance = Math.max(26, radius * 2.1);
    const activeCamera = viewControls.getActiveCamera();
    const dir = new THREE.Vector3(1, 0.5, 1).normalize();
    const endPos = center.clone().addScaledVector(dir, distance);
    const startTarget = viewControls.getTarget();

    zoomTransition = {
      startTime: performance.now(),
      durationMs: 850,
      startPos: activeCamera.position.clone(),
      endPos,
      startTarget,
      endTarget: center.clone(),
    };
  }

  function updateSmoothFocus(nowMs) {
    if (!zoomTransition) return;
    const tRaw = (nowMs - zoomTransition.startTime) / zoomTransition.durationMs;
    const t = Math.min(Math.max(tRaw, 0), 1);
    const eased = 1 - Math.pow(1 - t, 3);

    const camera = viewControls.getActiveCamera();
    camera.position.lerpVectors(zoomTransition.startPos, zoomTransition.endPos, eased);
    const target = new THREE.Vector3().lerpVectors(
      zoomTransition.startTarget,
      zoomTransition.endTarget,
      eased
    );
    viewControls.setTarget(target);

    if (t >= 1) {
      zoomTransition = null;
      if (!pendingEnterInside) return;
      pendingEnterInside = false;
      onEnterInside?.();
    }
  }

  addPartsFactory1Floor(scene, { scale: 1 })
    .then(async ({ getBounds }) => {
      const floorBox = getBounds();
      const { root, getBounds: getBuildingBounds } = await addPartsFactory1Building(scene, {
        tileBounds: floorBox,
        scale: 1,
      });
      factoryRoot = root;

      const combined = floorBox.clone().union(getBuildingBounds());
      viewControls.fitToBounds(combined);
    })
    .catch((err) => {
      console.error("조립공장1 씬 로드 실패:", err);
    });

  function onResize() {
    viewControls.resize(window.innerWidth, window.innerHeight);
  }

  function onCanvasClick(event) {
    if (enteringInside || !factoryRoot) return;
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, viewControls.getActiveCamera());
    const hits = raycaster.intersectObject(factoryRoot, true);
    if (hits.length === 0) return;

    enteringInside = true;
    pendingEnterInside = true;
    startSmoothFocus(factoryRoot);
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("app:viewmode-change", onSidebarViewModeChange);
  canvas.addEventListener("click", onCanvasClick);

  let rafId = 0;
  let disposed = false;
  function animate() {
    if (disposed) return;
    updateSmoothFocus(performance.now());
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }
  animate();

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      canvas.removeEventListener("click", onCanvasClick);
      viewControls.dispose();
    },
  };
}
