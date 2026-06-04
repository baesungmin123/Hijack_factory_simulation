import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createViewModeControls } from "../../components/Controls.js";
import { addPartsFactory1InsideFloor } from "./floor.js";
import { addConveyor } from "./left/conveyor.js";
import { addCuttingMachine } from "./left/cutting_machine.js";
import { addRobotArm1 } from "./left/robot_arm1.js";
import { addRobotArmHead } from "./left/robot_arm_head.js";
import { addPress } from "./left/press.js";
import { addXF6300 } from "./left/xf6300.js";
import { addBox } from "./left/box.js";
import { initLeftAnimation } from "./left_animation.js";
import { getFactoryWebSocket } from "../../websocket.js";
import { getPartsPhase, PT } from "../../simulation/factoryClock.js";

const API_BASE = "http://127.0.0.1:8000";

/**
 * 부품공장1 내부 화면
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initPartsFactory1InsideApp({ scene, renderer, canvas }) {
  // --- 재고 현황 바 ---
  const badge = document.createElement("div");
  badge.className = "inventory-badge";
  badge.textContent = "원자재: -- | 머리: -- | 몸통: --";
  document.body.appendChild(badge);

  function updateBadge({ raw = "--", head = "--", body = "--" } = {}) {
    badge.textContent = `원자재: ${raw} | 머리: ${head} | 몸통: ${body}`;
  }

  async function fetchInventory() {
    try {
      const [resA, resAsm, resFinal] = await Promise.all([
        fetch(`${API_BASE}/api/v1/inventory/parts_a`),
        fetch(`${API_BASE}/api/v1/inventory/assembly`),
        fetch(`${API_BASE}/api/v1/inventory/final_assembly`),
      ]);
      if (!resA.ok || !resAsm.ok || !resFinal.ok) throw new Error("inventory fetch 실패");
      const [a, asm, final] = await Promise.all([resA.json(), resAsm.json(), resFinal.json()]);
      updateBadge({ raw: a.raw_material, head: final.head, body: a.body });
    } catch (err) {
      console.error("[PartsFactory1Inside] 재고 로드 실패:", err);
    }
  }

  const ws = getFactoryWebSocket();

  function onInventoryUpdate(msg) {
    const p = msg?.payload;
    if (!p) return;
    updateBadge({
      raw:  p?.parts_a?.raw_material,
      head: p?.final_assembly?.head,
      body: p?.parts_a?.body,
    });
    if (p?.parts_a?.raw_material !== undefined) {
      const n = p.parts_a.raw_material;
      rawMaterial = n;
      if (waitingForRaw && n > 0) tryStartCycle();
      leftAnim.setRawMaterial(n);
    }
  }

  ws.on("inventory_update", onInventoryUpdate);
  fetchInventory();

  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  addPartsFactory1InsideFloor(scene).catch((err) => console.error("바닥 로드 실패:", err));

  addCuttingMachine(scene, { position: new THREE.Vector3(-9.47, 0, -17.37) }).catch(console.error);

  const mat = {
    mesh: null,
    state: 'conv1',
    timer: 0,
    speed: 6,
    conv1: { minZ: 0, maxZ: 0, y: 0 },
    conv2: { minZ: 0, maxZ: 0, y: 0 },
  };

  addConveyor(scene, { position: new THREE.Vector3(-8.86, 0, -34.29) }).then(async conveyor => {
    const b = conveyor.getBounds();
    mat.conv1 = { minZ: b.min.z, maxZ: b.max.z, y: b.max.y - 0.6 };

    const gltf = await new GLTFLoader().loadAsync("/assets/blend/material.glb");
    mat.mesh = gltf.scene;
    mat.mesh.position.set(-8.86, mat.conv1.y, mat.conv1.minZ);
    scene.add(mat.mesh);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(-8.86, 0, 0.02) }).then(conveyor => {
    const b = conveyor.getBounds();
    mat.conv2 = { minZ: b.min.z, maxZ: b.max.z, y: b.max.y - 0.6 };
  }).catch(console.error);
  const flatMat = { mesh: null, moving: false, endZ: 0, speed: 6, y: 0, doneTimer: -1, triggered: false };
  const hijackHead = { mesh: null, moving: false, startZ: 0, endZ: 0, y: 0, speed: 6 };

  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 0.02) }).then(async conveyor => {
    const b = conveyor.getBounds();
    flatMat.y = b.max.y;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/flat_material.glb");
    flatMat.mesh = gltf.scene;
    flatMat.mesh.position.set(10.46, flatMat.y, 0);
    flatMat.mesh.visible = false;
    scene.add(flatMat.mesh);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 18.88) }).then(conveyor => {
    const b = conveyor.getBounds();
    flatMat.endZ = b.max.z;
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.461, 0, 49) }).then(async conveyor => {
    const b = conveyor.getBounds();
    hijackHead.startZ = b.min.z;
    hijackHead.endZ = b.max.z;
    hijackHead.y = b.max.y;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/Hijack_head.glb");
    hijackHead.mesh = gltf.scene;
    hijackHead.mesh.position.set(10.461, hijackHead.y, hijackHead.startZ);
    hijackHead.mesh.visible = false;
    scene.add(hijackHead.mesh);
  }).catch(console.error);

  addXF6300(scene, { position: new THREE.Vector3(11, 0, 29.5) }).catch(console.error);

  let arm1Mixer = null;
  let arm1Actions = [];
  let arm1Started = false;
  let arm1Timer = 0;
  let arm1Fps = 24;
  let arm1Duration = Infinity;
  let arm1Finished = false;
  let rawMaterial = Infinity;
  let waitingForRaw = false;

  let pressMixer = null;
  let pressActions = [];
  let pressStarted = false;

  addRobotArm1(scene, { position: new THREE.Vector3(-4, 0, 0) }).then(r => {
    arm1Mixer = r.mixer ?? null;
    arm1Actions = r.actions ?? [];
    if (r.clips && r.clips.length > 0) {
      arm1Duration = r.clips.reduce((max, c) => Math.max(max, c.duration), 0) || 20;
      const track = r.clips[0].tracks[0];
      if (track && track.times.length >= 2) {
        arm1Fps = (track.times.length - 1) / r.clips[0].duration;
      }
    }
  }).catch(console.error);

  addPress(scene, { position: new THREE.Vector3(18, 0, 0) }).then(r => {
    pressMixer = r.mixer ?? null;
    pressActions = r.actions ?? [];
  }).catch(console.error);

  let armHeadMixer = null;
  let armHeadActions = [];
  let armHeadZ = 50;

  addRobotArmHead(scene, { position: new THREE.Vector3(3, 0, 50) }).then(r => {
    armHeadMixer = r.mixer ?? null;
    armHeadActions = r.actions ?? [];
    armHeadZ = r.root.position.z;
  }).catch(console.error);
  addBox(scene, { position: new THREE.Vector3(9.487, 0, 63.523) }).catch(console.error);

  const rightAnim = initLeftAnimation(scene);

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

  function tryStartCycle() {
    if (rawMaterial <= 0) {
      waitingForRaw = true;
      if (mat.mesh) mat.mesh.visible = false;
      return;
    }
    waitingForRaw = false;
    arm1Started = false;
    arm1Timer = 0;
    pressStarted = false;
    flatMat.triggered = false;
    arm1Actions.forEach(a => { a.reset(); a.play(); a.paused = true; });
    pressActions.forEach(a => { a.reset(); a.play(); a.paused = true; });
    mat.state = 'conv1';
    mat.timer = 0;
    if (mat.mesh) { mat.mesh.position.set(-8.86, mat.conv1.y, mat.conv1.minZ); mat.mesh.visible = true; }
  }

  // 클락 현재 상태로 애니메이션 점프
  function syncFromClock() {
    const { phase, phaseTimer } = getPartsPhase('partsHead');

    if (phase === 'conv1') {
      if (mat.mesh && mat.conv1.maxZ !== 0) {
        mat.mesh.position.set(-8.86, mat.conv1.y, mat.conv1.minZ + phaseTimer * mat.speed);
        mat.mesh.visible = true;
      }
      mat.state = 'conv1';
    } else if (phase === 'cutting') {
      if (mat.mesh) mat.mesh.visible = false;
      mat.state = 'cutting';
      mat.timer = phaseTimer;
    } else {
      // arm phase
      const t = phaseTimer;
      arm1Started = true;
      arm1Timer = t;
      if (arm1Mixer && arm1Actions.length > 0) {
        arm1Actions.forEach(a => { a.reset(); a.play(); a.paused = false; });
        arm1Mixer.setTime(t);
      }
      if (t >= PT.PRESS_START && pressMixer && pressActions.length > 0) {
        pressActions.forEach(a => { a.reset(); a.play(); a.paused = false; });
        pressMixer.setTime(Math.max(0, t - PT.PRESS_START));
        pressStarted = true;
      }

      // conv2 위 원자재
      const conv2Duration = mat.conv2.maxZ !== 0
        ? (mat.conv2.maxZ - mat.conv2.minZ) / mat.speed
        : 3.0;
      if (t < conv2Duration) {
        if (mat.mesh && mat.conv2.y !== 0) {
          mat.mesh.position.set(-8.86, mat.conv2.y, mat.conv2.minZ + t * mat.speed);
          mat.mesh.visible = true;
        }
        mat.state = 'conv2';
      } else {
        if (mat.mesh) mat.mesh.visible = false;
        mat.state = 'done';
      }

      // flatMat
      if (t >= PT.FLATMAT_APPEAR && flatMat.mesh) {
        const ft = t - PT.FLATMAT_APPEAR;
        flatMat.triggered = true;
        if (ft < PT.FLATMAT_TRAVEL) {
          const z = ft * flatMat.speed;
          flatMat.mesh.position.set(10.46, flatMat.y, z);
          flatMat.mesh.visible = true;
          flatMat.moving = true;
        } else {
          flatMat.mesh.visible = false;
          flatMat.moving = false;
          const doneT = ft - PT.FLATMAT_TRAVEL;
          flatMat.doneTimer = doneT;

          if (doneT >= PT.HIJACK_WAIT && hijackHead.mesh) {
            const ht = doneT - PT.HIJACK_WAIT;
            if (ht < PT.HIJACK_TRAVEL) {
              hijackHead.mesh.position.set(10.461, hijackHead.y, hijackHead.startZ + ht * hijackHead.speed);
              hijackHead.mesh.visible = true;
              hijackHead.moving = true;
              flatMat.doneTimer = -1;
              if (armHeadMixer && armHeadActions.length > 0) {
                armHeadActions.forEach(a => { a.reset(); a.play(); });
                armHeadMixer.setTime(ht);
              }
            } else {
              hijackHead.mesh.visible = false;
              flatMat.doneTimer = -1;
            }
          }
        }
      }
    }
  }

  const clock = new THREE.Clock();
  let rafId = 0;
  let disposed = false;
  function animate() {
    if (disposed) return;
    const delta = clock.getDelta();

    if (arm1Finished) {
      arm1Finished = false;
      tryStartCycle();
    }

    if (arm1Started && arm1Mixer) {
      arm1Mixer.update(delta);
      arm1Timer += delta;
      if (!arm1Finished && arm1Timer >= arm1Duration) {
        arm1Finished = true;
      }
      if (flatMat.mesh && !flatMat.triggered && arm1Timer >= 9) {
        flatMat.mesh.position.set(10.46, flatMat.y, 0);
        flatMat.mesh.visible = true;
        flatMat.moving = true;
        flatMat.triggered = true;
      }
      if (!pressStarted && pressMixer && pressActions.length > 0 && arm1Timer >= 4) {
        pressActions.forEach(a => { a.paused = false; });
        pressStarted = true;
      }
    }

    if (pressMixer) pressMixer.update(delta);

    if (flatMat.moving && flatMat.mesh) {
      flatMat.mesh.position.z += flatMat.speed * delta;
      if (flatMat.mesh.position.z >= flatMat.endZ) {
        flatMat.mesh.visible = false;
        flatMat.moving = false;
        flatMat.doneTimer = 0;
      }
    }

    if (flatMat.doneTimer >= 0) {
      flatMat.doneTimer += delta;
      if (flatMat.doneTimer >= 5 && hijackHead.mesh && !hijackHead.moving) {
        hijackHead.mesh.position.set(10.461, hijackHead.y, hijackHead.startZ);
        hijackHead.mesh.visible = true;
        hijackHead.moving = true;
        flatMat.doneTimer = -1;
        if (armHeadMixer) {
          armHeadActions.forEach(a => { a.reset(); a.play(); });
        }
      }
    }

    if (armHeadMixer) armHeadMixer.update(delta);

    if (hijackHead.moving && hijackHead.mesh) {
      hijackHead.mesh.position.z += hijackHead.speed * delta;
      if (hijackHead.mesh.position.z >= armHeadZ) {
        hijackHead.mesh.visible = false;
        hijackHead.moving = false;
      }
    }

    if (mat.mesh) {
      if (mat.state === 'conv1') {
        mat.mesh.position.z += mat.speed * delta;
        if (mat.mesh.position.z > mat.conv1.maxZ) {
          mat.mesh.visible = false;
          mat.state = 'cutting';
          mat.timer = 0;
        }
      } else if (mat.state === 'cutting') {
        mat.timer += delta;
        if (mat.timer >= 5) {
          if (arm1Mixer) {
            arm1Mixer.setTime(0);
            arm1Actions.forEach(a => { a.paused = false; });
            arm1Started = true;
          }
          mat.mesh.position.set(-8.86, mat.conv2.y, mat.conv2.minZ);
          mat.mesh.visible = true;
          mat.state = 'conv2';
        }
      } else if (mat.state === 'conv2') {
        mat.mesh.position.z += mat.speed * delta;
        if (mat.mesh.position.z >= 0) {
          mat.mesh.visible = false;
          mat.state = 'done';
        }
      }
    }

    rightAnim.update(delta);
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }
  animate();
  // 에셋 로드(비동기) 완료 후 클락 상태로 싱크
  setTimeout(() => { syncFromClock(); rightAnim.syncFromClock(); }, 500);

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
