import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { setSceneReady } from "../../components/Transition.js";
import { addJoinFactory2InsideFloor } from "./floor.js";
import { addConveyor } from "./conveyor.js";
import { addRobotArmHead } from "./robotarm_head.js";
import { createJoin2Animation } from "./join2_animation.js";
import { getFactoryWebSocket } from "../../websocket.js";

const API_BASE = "http://127.0.0.1:8000";

export function initJoinFactory2InsideApp({ scene, renderer, canvas }) {
  // --- 재고 현황 바 ---
  const badge = document.createElement("div");
  badge.className = "inventory-badge";
  badge.textContent = "하체: -- | 머리: -- | 격납고: --/10";
  document.body.appendChild(badge);

  function updateBadge({ body = "--", head = "--", hangar = "--" } = {}) {
    badge.textContent = `하체: ${body} | 머리: ${head} | 격납고: ${hangar}/10`;
  }

  const stock = { body: undefined, head: undefined, hangar: undefined };

  function applyStock() {
    updateBadge(stock);
    if (stock.body !== undefined && stock.head !== undefined) {
      anim.setInventory(stock.body, stock.head);
    }
  }

  async function fetchInventory() {
    try {
      const [finalRes, hangarRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/inventory/final_assembly`),
        fetch(`${API_BASE}/api/v1/inventory/hangar`),
      ]);
      if (!finalRes.ok) throw new Error(`final_assembly HTTP ${finalRes.status}`);
      if (!hangarRes.ok) throw new Error(`hangar HTTP ${hangarRes.status}`);
      const final = await finalRes.json();
      const hangar = await hangarRes.json();
      stock.body   = final.body;
      stock.head   = final.head;
      stock.hangar = hangar.raw_material;
      applyStock();
    } catch (err) {
      console.error("[JoinFactory2Inside] 재고 로드 실패:", err);
    }
  }

  const ws = getFactoryWebSocket();

  function onInventoryUpdate(msg) {
    const p = msg?.payload;
    if (p?.final_assembly?.body !== undefined) stock.body   = p.final_assembly.body;
    if (p?.final_assembly?.head !== undefined) stock.head   = p.final_assembly.head;
    if (p?.hangar?.raw_material !== undefined) stock.hangar = p.hangar.raw_material;
    applyStock();
  }

  ws.on("inventory_update", onInventoryUpdate);
  fetchInventory();

  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  const anim = createJoin2Animation(scene);

  setSceneReady(Promise.all([
    addJoinFactory2InsideFloor(scene).catch(console.error),
    anim.loadTemplates().catch(console.error),
  ]));

  // 왼쪽 컨베이어 (X = 29.764) — Hijack_head
  addConveyor(scene, { position: new THREE.Vector3(29.764, 0, -34.181) }).then(first => {
    const b = first.getBounds();
    addConveyor(scene, { position: new THREE.Vector3(29.764, 0,  22.061) }).then(last => {
      anim.setLeftConveyor(b.min.z, last.getBounds().max.z, b.max.y - 0.5);
    }).catch(console.error);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(29.764, 0, -15.526) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(29.764, 0,   3.267) }).catch(console.error);

  // 오른쪽 컨베이어 (X = 56.167) — body+leg+arm
  addConveyor(scene, { position: new THREE.Vector3(56.167, 0, -34.181) }).then(first => {
    const b = first.getBounds();
    addConveyor(scene, { position: new THREE.Vector3(56.167, 0,  59.982) }).then(last => {
      anim.setRightConveyor(b.min.z, last.getBounds().max.z, b.max.y - 0.5);
    }).catch(console.error);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(56.167, 0, -15.526) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(56.167, 0,   3.267) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(56.167, 0,  22.061) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(56.167, 0,  41.021) }).catch(console.error);

  // 로봇팔
  addRobotArmHead(scene, { position: new THREE.Vector3(40, 0, -22.977) }).then(r => {
    anim.setHeadMixer(r.mixer, r.actions);
  }).catch(console.error);

  // 카메라 & 컨트롤
  const target = new THREE.Vector3(0, 0, 30);
  const viewControls = createViewModeControls({
    renderer, domElement: canvas, target, orthoD: 100, near: 0.1, far: 5000,
  });
  viewControls.setMode("perspective");
  viewControls.resize(window.innerWidth, window.innerHeight);
  const cam = viewControls.getActiveCamera();
  cam.position.set(0, 80, 80);
  viewControls.setTarget(target);

  window.addEventListener("resize", () => viewControls.resize(window.innerWidth, window.innerHeight));
  window.addEventListener("app:viewmode-change", e => {
    const next = e?.detail?.mode;
    if (next === "perspective" || next === "orthographic") viewControls.setMode(next);
  });

  const clock = new THREE.Clock();
  let rafId = 0;
  let disposed = false;

  function animate() {
    if (disposed) return;
    const delta = clock.getDelta();
    anim.update(delta);
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }
  animate();

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      anim.dispose();
      viewControls.dispose();
      ws.off("inventory_update", onInventoryUpdate);
      badge.remove();
    },
  };
}
