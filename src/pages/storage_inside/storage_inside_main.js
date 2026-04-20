import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addStorageInsideSet } from "./floor.js";
import { addStorageMaterials } from "./material.js";
import { addInsideLighting } from "./inside_light.js";

/**
 * 창고 내부 화면(임시): 검은 배경 + 중앙 타겟 시점.
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initStorageInsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const insideLights = addInsideLighting(scene);

  const { getBounds } = addStorageInsideSet(scene);
  const insideBox = getBounds();
  const center = insideBox.getCenter(new THREE.Vector3());
  /** @type {null | { dispose: () => void }} */
  let materialsLayer = null;

  const target = new THREE.Vector3(center.x, 2.3, center.z - 2.2);
  const viewControls = createViewModeControls({
    renderer,
    domElement: canvas,
    target,
    orthoD: 100,
    near: 0.1,
    far: 5000,
  });
  viewControls.setMode("perspective");
  viewControls.resize(window.innerWidth, window.innerHeight);

  function onSidebarViewModeChange(event) {
    const next = event?.detail?.mode;
    if (next === "perspective" || next === "orthographic") {
      viewControls.setMode(next);
    }
  }

  const cam = viewControls.getActiveCamera();
  cam.position.set(center.x, 4.4, center.z + 12.5);
  viewControls.setTarget(target);

  function onResize() {
    viewControls.resize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("app:viewmode-change", onSidebarViewModeChange);
  let rafId = 0;
  let disposed = false;

  function animate() {
    if (disposed) return;
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }

  addStorageMaterials(scene)
    .then((layer) => {
      materialsLayer = layer;
    })
    .catch((err) => {
      console.error("원자재 스택 로드 실패:", err);
    });

  animate();

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      materialsLayer?.dispose();
      insideLights.dispose();
      viewControls.dispose();
    },
  };
}
