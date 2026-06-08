import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addHangerInsideFloor } from "./floor.js";
import { addHangarHijacks } from "./hager_hijack.js";
import { setSceneReady } from "../../components/Transition.js";
import { getFactoryWebSocket } from "../../websocket.js";

const API_BASE = `http://${window.location.hostname}:8000`;

function addHangerInsideLighting(scene) {
  const group = new THREE.Group();
  group.name = "HangerInsideLights";

  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  group.add(ambient);

  const key = new THREE.DirectionalLight(0xfff8e8, 2.4);
  key.position.set(20, 40, 20);
  group.add(key);

  const fill = new THREE.DirectionalLight(0xd0e8ff, 1.2);
  fill.position.set(-20, 20, -20);
  group.add(fill);

  const positions = [
    [-30, 20, -30], [0, 20, -30], [30, 20, -30],
    [-30, 20, 0],   [0, 20, 0],   [30, 20, 0],
    [-30, 20, 30],  [0, 20, 30],  [30, 20, 30],
  ];
  for (const [x, y, z] of positions) {
    const bulb = new THREE.PointLight(0xfff5e0, 1.6, 80, 1.5);
    bulb.position.set(x, y, z);
    group.add(bulb);
  }

  scene.add(group);
  return { dispose() { scene.remove(group); } };
}

/**
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initHangerInsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x1a2030);

  const lights = addHangerInsideLighting(scene);

  // --- 재고 배지 ---
  const badge = document.createElement("div");
  badge.className = "inventory-badge";
  badge.textContent = "격납고: --/10";
  document.body.appendChild(badge);

  let hijacks = null;

  function setCount(n) {
    badge.textContent = `격납고: ${n}/10`;
    hijacks?.setCount(n);
  }

  async function fetchInventory() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/hangar`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCount(data.raw_material ?? 0);
    } catch (err) {
      console.error("[HangerInside] 재고 로드 실패:", err);
    }
  }

  const ws = getFactoryWebSocket();

  function onInventoryUpdate(msg) {
    const n = msg?.payload?.hangar?.raw_material;
    if (n !== undefined) setCount(n);
  }

  function onHangarLaunch() {
    setCount(0);
  }

  ws.on("inventory_update", onInventoryUpdate);
  ws.on("hangar_launch", onHangarLaunch);
  fetchInventory();

  const viewControls = createViewModeControls({
    renderer,
    domElement: canvas,
    target: new THREE.Vector3(0, 0, 0),
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

  const ready = Promise.all([
    addHangerInsideFloor(scene),
    addHangarHijacks(scene).then(h => {
      hijacks = h;
      fetchInventory();
    }),
  ])
    .then(([{ getBounds }]) => {
      const box = getBounds();
      const center = box.getCenter(new THREE.Vector3());
      const cam = viewControls.getActiveCamera();
      cam.position.set(center.x, center.y + 30, center.z + 60);
      viewControls.setTarget(center);
    })
    .catch((err) => console.error("격납고 내부 로드 실패:", err));
  setSceneReady(ready);

  animate();

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      ws.off("inventory_update", onInventoryUpdate);
      ws.off("hangar_launch", onHangarLaunch);
      lights.dispose();
      hijacks?.dispose();
      viewControls.dispose();
      badge.remove();
    },
  };
}
