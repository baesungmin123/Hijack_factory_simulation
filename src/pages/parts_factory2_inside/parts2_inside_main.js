import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { setSceneReady } from "../../components/Transition.js";
import { addPartsFactory2InsideFloor } from "./floor.js";
import { initLeftAnimation } from "./left_animation.js";
import { initRightAnimation } from "./right_animation.js";
import { getFactoryWebSocket } from "../../websocket.js";

const API_BASE = "http://127.0.0.1:8000";

/**
 * 부품공장2 내부 화면
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initPartsFactory2InsideApp({ scene, renderer, canvas }) {
  // --- 재고 현황 바 ---
  const badge = document.createElement("div");
  badge.className = "inventory-badge";
  badge.textContent = "원자재: -- | 다리: -- | 팔: --";
  document.body.appendChild(badge);

  function updateBadge({ raw = "--", leg = "--", arm = "--" } = {}) {
    badge.textContent = `원자재: ${raw} | 다리: ${leg} | 팔: ${arm}`;
  }

  async function fetchInventory() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/parts_b`);
      if (!res.ok) throw new Error("inventory fetch 실패");
      const b = await res.json();
      updateBadge({ raw: b.raw_material, leg: b.leg, arm: b.arm });
    } catch (err) {
      console.error("[PartsFactory2Inside] 재고 로드 실패:", err);
    }
  }

  const ws = getFactoryWebSocket();

  function onInventoryUpdate(msg) {
    const p = msg?.payload;
    if (!p) return;
    updateBadge({
      raw: p?.parts_b?.raw_material,
      leg: p?.parts_b?.leg,
      arm: p?.parts_b?.arm,
    });
    if (p?.parts_b?.raw_material !== undefined) {
      const n = p.parts_b.raw_material;
      leftAnim.setRawMaterial(n);
      rightAnim.setRawMaterial(n);
    }
  }

  ws.on("inventory_update", onInventoryUpdate);
  fetchInventory();

  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  setSceneReady(addPartsFactory2InsideFloor(scene).catch((err) => console.error("바닥 로드 실패:", err)));

  const leftAnim = initLeftAnimation(scene);
  const rightAnim = initRightAnimation(scene);

  const target = new THREE.Vector3(0, 0, 30);
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
  cam.position.set(0, 80, 80);
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

  const clock = new THREE.Clock();
  let rafId = 0;
  let disposed = false;
  function animate() {
    if (disposed) return;
    const delta = clock.getDelta();

    leftAnim.update(delta);
    rightAnim.update(delta);

    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }
  animate();
  setTimeout(() => { leftAnim.syncFromClock(); rightAnim.syncFromClock(); }, 500);

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      viewControls.dispose();
      ws.off("inventory_update", onInventoryUpdate);
      badge.remove();
    },
  };
}
