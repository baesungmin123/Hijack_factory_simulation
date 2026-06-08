import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { setSceneReady } from "../../components/Transition.js";
import { addStorageInsideSet } from "./floor.js";
import { addStorageMaterials } from "./material.js";
import { addInsideLighting } from "./inside_light.js";
import { getFactoryWebSocket } from "../../websocket.js";

const API_BASE = `http://${window.location.hostname}:8000`;

/**
 * 창고 내부 화면(임시): 검은 배경 + 중앙 타겟 시점.
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initStorageInsideApp({ scene, renderer, canvas }) {
  // --- 재고 배지 ---
  const badge = document.createElement("div");
  badge.className = "inventory-badge";
  badge.textContent = "원자재 재고: --";
  document.body.appendChild(badge);

  function updateBadge(n) {
    badge.textContent = `원자재 재고: ${n}`;
  }

  function triggerRestockAnim() {
    badge.classList.remove("inventory-badge--restock");
    void badge.offsetWidth;
    badge.classList.add("inventory-badge--restock");
  }

  async function fetchInitialInventory() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const entry = data.find((item) => item.location === "raw_material");
      if (entry == null) throw new Error("raw_material 항목 없음");
      updateBadge(entry.raw_material);
    } catch (err) {
      console.error("[StorageInside] 재고 초기 로드 실패:", err);
    }
  }

  const ws = getFactoryWebSocket();

  function onInventoryUpdate(msg) {
    updateBadge(msg.payload.raw_material.raw_material);
  }

  function onRestock() {
    updateBadge(100);
    triggerRestockAnim();
  }

  ws.on("inventory_update", onInventoryUpdate);
  ws.on("restock", onRestock);

  fetchInitialInventory();

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

  setSceneReady(
    addStorageMaterials(scene)
      .then((layer) => { materialsLayer = layer; })
      .catch((err) => { console.error("원자재 스택 로드 실패:", err); })
  );

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
      ws.off("inventory_update", onInventoryUpdate);
      ws.off("restock", onRestock);
      badge.remove();
    },
  };
}
