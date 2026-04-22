import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addPartsFactory1InsideFloor } from "./floor.js";

/**
 * 부품공장1 내부 화면(임시)
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initPartsFactory1InsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 1.1);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  addPartsFactory1InsideFloor(scene, { width: 26, depth: 21 });

  const target = new THREE.Vector3(0, 1.2, 0);
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

  const cam = viewControls.getActiveCamera();
  cam.position.set(15, 12, 16);
  viewControls.setTarget(target);

  function onSidebarViewModeChange(event) {
    const next = event?.detail?.mode;
    if (next === "perspective" || next === "orthographic") {
      viewControls.setMode(next);
    }
  }

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
  animate();

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      viewControls.dispose();
    },
  };
}
