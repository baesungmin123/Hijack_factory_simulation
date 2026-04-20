import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addPartsFactory1Floor } from "./floor.js";
import { addPartsFactory1Building } from "./fatory.js";

/**
 * 조립공장1(몸통+다리+팔) 화면 초기화
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initPartsFactory1App({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0xc7d9ee);

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

  addPartsFactory1Floor(scene, { scale: 1 })
    .then(async ({ getBounds }) => {
      const floorBox = getBounds();
      const { getBounds: getBuildingBounds } = await addPartsFactory1Building(scene, {
        tileBounds: floorBox,
        scale: 1,
      });

      const combined = floorBox.clone().union(getBuildingBounds());
      viewControls.fitToBounds(combined);
    })
    .catch((err) => {
      console.error("조립공장1 씬 로드 실패:", err);
    });

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
