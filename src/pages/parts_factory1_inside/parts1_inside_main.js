import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addPartsFactory1InsideFloor } from "./floor.js";
import { addConveyor } from "./left/conveyor.js";
import { addCuttingMachine } from "./left/cutting_machine.js";
import { addRobotArm1 } from "./left/robot_arm1.js";
import { addRobotArmHead } from "./left/robot_arm_head.js";
import { addPress } from "./left/press.js";
import { addXF6300 } from "./left/xf6300.js";
import { addBox } from "./left/box.js";
import { addConveyor as addRightConveyor } from "./right/conveyor.js";
import { addCuttingMachine as addRightCuttingMachine } from "./right/cutting_machine.js";
import { addRobotArm1 as addRightRobotArm1 } from "./right/robot_arm1.js";
import { addPress as addRightPress } from "./right/press.js";
import { addXF6300 as addRightXF6300 } from "./right/xf6300.js";
import { addBox as addRightBox } from "./right/box.js";

/**
 * 부품공장1 내부 화면
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initPartsFactory1InsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  addPartsFactory1InsideFloor(scene).catch((err) => console.error("바닥 로드 실패:", err));

  addCuttingMachine(scene, { position: new THREE.Vector3(-9.47, 0, -17.37) }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(-8.86, 0, -34.29) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(-8.86, 0, 0.02) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 0.02) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 18.88) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.461, 0, 49) }).catch(console.error);

  addXF6300(scene, { position: new THREE.Vector3(11, 0, 29.5) }).catch(console.error);
  addPress(scene, { position: new THREE.Vector3(18, 0, 0) }).catch(console.error);
  const mixers = [];

  addRobotArm1(scene, { position: new THREE.Vector3(-4, 0, 0) }).then(r => { if (r.mixer) mixers.push(r.mixer); }).catch(console.error);
  addRobotArmHead(scene, { position: new THREE.Vector3(0, 0, 50) }).then(r => { if (r.mixer) mixers.push(r.mixer); }).catch(console.error);
  addBox(scene, { position: new THREE.Vector3(9.487, 0, 63.523) }).catch(console.error);

  // right side
  addRightConveyor(scene, { position: new THREE.Vector3(97.089, 0, -34.448) }).catch(console.error);
  addRightCuttingMachine(scene, { position: new THREE.Vector3(97.692, 0, -17.059), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(97.232, 0, 0.073) }).catch(console.error);
  addRightRobotArm1(scene, { position: new THREE.Vector3(92.369, 0, 0.088), rotationY: Math.PI }).then(r => { if (r.mixer) mixers.push(r.mixer); }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(77.909, 0, 0.073) }).catch(console.error);
  addRightPress(scene, { position: new THREE.Vector3(70, 0, 0.088), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(77.924, 0, 18.926) }).catch(console.error);
  addRightXF6300(scene, { position: new THREE.Vector3(76.326, 0, 38), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(77.975, 0, 48.653) }).catch(console.error);
  addRobotArmHead(scene, { position: new THREE.Vector3(88.436, 0, 46.187), rotationY: Math.PI }).then(r => { if (r.mixer) mixers.push(r.mixer); }).catch(console.error);
  addRightBox(scene, { position: new THREE.Vector3(79.313, 0, 65.163), rotationY: Math.PI }).catch(console.error);

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
    mixers.forEach(m => m.update(delta));
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
