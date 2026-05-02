import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addJoinFactory2InsideFloor } from "./floor.js";
import { addConveyor } from "./conveyor.js";
import { addRobotArmHead } from "./robotarm_head.js";
import { createJoin2Animation } from "./join2_animation.js";

export function initJoinFactory2InsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  addJoinFactory2InsideFloor(scene).catch(console.error);

  const anim = createJoin2Animation(scene);

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

  // GLB 템플릿 로드
  anim.loadTemplates().catch(console.error);

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
    },
  };
}
