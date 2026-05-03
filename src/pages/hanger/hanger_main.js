import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { setSceneReady } from "../../components/Transition.js";
import { addHangerFloor } from "./floor.js";
import { addHangarModels } from "./hangar.js";

/**
 * @param {{
 *  scene: THREE.Scene;
 *  renderer: THREE.WebGLRenderer;
 *  canvas: HTMLCanvasElement;
 *  onEnterHangerInside?: () => void;
 * }} ctx
 */
export function initHangerApp({ scene, renderer, canvas, onEnterHangerInside }) {
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

  function startSmoothFocus(root) {
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const distance = Math.max(22, radius * 2.4);
    const dir = new THREE.Vector3(30, 24, 28).normalize();
    const endPos = center.clone().addScaledVector(dir, distance);

    zoomTransition = {
      startTime: performance.now(),
      durationMs: 900,
      startPos: viewControls.getActiveCamera().position.clone(),
      endPos,
      startTarget: viewControls.getTarget(),
      endTarget: center.clone(),
    };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function updateZoomTransition() {
    if (!zoomTransition) return;
    const cam = viewControls.getActiveCamera();
    const t = THREE.MathUtils.clamp(
      (performance.now() - zoomTransition.startTime) / zoomTransition.durationMs,
      0, 1
    );
    const e = easeOutCubic(t);

    cam.position.lerpVectors(zoomTransition.startPos, zoomTransition.endPos, e);
    viewControls.setTarget(
      new THREE.Vector3().lerpVectors(zoomTransition.startTarget, zoomTransition.endTarget, e)
    );

    if (t >= 1) {
      zoomTransition = null;
      if (pendingEnterInside && onEnterHangerInside && !enteringInside) {
        pendingEnterInside = false;
        enteringInside = true;
        onEnterHangerInside();
      }
    }
  }

  function onCanvasClick(event) {
    if (!centerHangarRoot) return;

    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, viewControls.getActiveCamera());
    if (raycaster.intersectObject(centerHangarRoot, true).length > 0) {
      pendingEnterInside = true;
      startSmoothFocus(centerHangarRoot);
    }
  }

  async function bootstrap() {
    const { getBounds: getTileBounds } = await addHangerFloor(scene);
    const { center, bounds: hangarBounds } = await addHangarModels(scene);
    centerHangarRoot = center;

    const combined = getTileBounds().union(hangarBounds);
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
    if (zoomTransition) updateZoomTransition();
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }

  setSceneReady(bootstrap().catch((err) => console.error("격납고 씬 초기화 실패:", err)));
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
