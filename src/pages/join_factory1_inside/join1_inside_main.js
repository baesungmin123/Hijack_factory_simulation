import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { setSceneReady } from "../../components/Transition.js";
import { addJoinFactory1InsideFloor } from "./floor.js";
import { addConveyor } from "./conveyor.js";
import { addRobotArmBody } from "./robotarm_body.js";
import { addRobotArmArm } from "./robotarm_arm.js";
import { createJoin1Animation } from "./join1_animation.js";

export function initJoinFactory1InsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  const anim = createJoin1Animation(scene);

  setSceneReady(Promise.all([
    addJoinFactory1InsideFloor(scene).catch(console.error),
    anim.loadTemplates().catch(console.error),
  ]));

  // body 컨베이어
  addConveyor(scene, { position: new THREE.Vector3(16.764, 0, -34.181) }).then(first => {
    const b = first.getBounds();
    addConveyor(scene, { position: new THREE.Vector3(16.764, 0,  22.061) }).then(last => {
      anim.setBodyConveyor(b.min.z, last.getBounds().max.z, b.max.y - 0.5);
    }).catch(console.error);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(16.764, 0, -15.526) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(16.764, 0,   3.267) }).catch(console.error);

  // leg 컨베이어
  addConveyor(scene, { position: new THREE.Vector3(43.167, 0, -34.171) }).then(first => {
    const b = first.getBounds();
    addConveyor(scene, { position: new THREE.Vector3(43.167, 0,  59.7) }).then(last => {
      anim.setLegConveyor(b.min.z, last.getBounds().max.z, b.max.y - 0.5);
    }).catch(console.error);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(43.167, 0, -15.427) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(43.167, 0,   3.317) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(43.167, 0,  22.061) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(43.167, 0,  40.956) }).catch(console.error);

  // arm 컨베이어
  addConveyor(scene, { position: new THREE.Vector3(69.487, 0, -34.181) }).then(first => {
    const b = first.getBounds();
    addConveyor(scene, { position: new THREE.Vector3(69.487, 0,  22.061) }).then(last => {
      addConveyor(scene, { position: new THREE.Vector3(69.487, 0,   3.267) }).then(c => {
        const cb = c.getBounds();
        anim.setArmConveyor(b.min.z, last.getBounds().max.z, b.max.y - 1, (cb.min.z + cb.max.z) / 2);
      }).catch(console.error);
    }).catch(console.error);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(69.487, 0, -15.526) }).catch(console.error);

  // 로봇팔
  addRobotArmBody(scene, { position: new THREE.Vector3(26, 0, -22.977) }).then(r => {
    anim.setBodyMixer(r.mixer, r.actions);
  }).catch(console.error);

  addRobotArmArm(scene, { position: new THREE.Vector3(59.319, 0, 18.88), rotationY: Math.PI }).then(r => {
    anim.setArmMixer(r.mixer, r.actions);
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