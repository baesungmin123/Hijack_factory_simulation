import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addTransferFloor } from "./floor.js";

const TRANSFER_ROUTE_BAR_ID = "transfer-route-bar";

function mountTransferRouteBar() {
  if (document.getElementById(TRANSFER_ROUTE_BAR_ID)) return;

  const bar = document.createElement("div");
  bar.id = TRANSFER_ROUTE_BAR_ID;
  bar.className = "transfer-route-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "이송 경로");

  const inner = document.createElement("div");
  inner.className = "transfer-route-bar-inner";

  const btnA = document.createElement("button");
  btnA.type = "button";
  btnA.className = "transfer-route-btn";
  btnA.dataset.route = "storage-to-assembly";
  btnA.textContent = "원재료 창고 -> 조립공장 1, 2";

  const btnB = document.createElement("button");
  btnB.type = "button";
  btnB.className = "transfer-route-btn";
  btnB.dataset.route = "final-to-hangar";
  btnB.textContent = "최종 조립공장 -> 격납고";

  inner.append(btnA, btnB);
  bar.append(inner);
  document.body.appendChild(bar);

  inner.addEventListener("click", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLButtonElement)) return;
    const route = el.dataset.route;
    if (!route) return;
    window.dispatchEvent(
      new CustomEvent("app:transfer-route", { detail: { route } })
    );
  });
}

function unmountTransferRouteBar() {
  document.getElementById(TRANSFER_ROUTE_BAR_ID)?.remove();
}

/**
 * 이송라인(transfer) 화면 초기화
 * - transfer_tile.glb 바닥 배치
 * - 바닥을 3등분한 가이드 표시
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initTransferApp({ scene, renderer, canvas }) {
  mountTransferRouteBar();

  scene.background = new THREE.Color(0xc7d9ee);

  const ambient = new THREE.AmbientLight(0xffffff, 0.62);
  const key = new THREE.DirectionalLight(0xfff2d6, 1.18);
  key.position.set(34, 52, 26);
  scene.add(ambient, key);

  const target = new THREE.Vector3(0, 0, 0);
  const viewControls = createViewModeControls({
    renderer,
    domElement: canvas,
    target,
    orthoD: 100,
    perspectiveFov: 78,
    near: 0.2,
    far: 8000,
  });
  viewControls.setMode("perspective");
  viewControls.resize(window.innerWidth, window.innerHeight);

  /** @type {THREE.Object3D[]} */
  const splitHelpers = [];

  function addSplitGuides(box) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const zoneWidth = size.x / 3;
    const markerY = box.min.y + 0.03;

    const zoneColor = [0x6db4ff, 0x7ddc94, 0xffc66d];
    for (let i = 0; i < 3; i += 1) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(zoneWidth * 0.96, size.z * 0.95),
        new THREE.MeshBasicMaterial({
          color: zoneColor[i],
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(
        box.min.x + zoneWidth * (i + 0.5),
        markerY,
        center.z
      );
      scene.add(plane);
      splitHelpers.push(plane);
    }

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    for (let i = 1; i <= 2; i += 1) {
      const x = box.min.x + zoneWidth * i;
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, markerY + 0.005, box.min.z),
        new THREE.Vector3(x, markerY + 0.005, box.max.z),
      ]);
      const line = new THREE.Line(geom, lineMat);
      scene.add(line);
      splitHelpers.push(line);
    }
  }

  addTransferFloor(scene, { scale: 1 })
    .then(({ getBounds }) => {
      const floorBox = getBounds();
      addSplitGuides(floorBox);

      viewControls.fitToBounds(floorBox);
    })
    .catch((err) => {
      console.error("이송라인 씬 로드 실패:", err);
    });

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
      for (const obj of splitHelpers) {
        scene.remove(obj);
      }
      viewControls.dispose();
      unmountTransferRouteBar();
    },
  };
}
