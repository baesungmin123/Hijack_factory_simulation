import * as THREE from "three";
import { createViewModeControls } from "../../components/Controls.js";
import { addPartsFactory1InsideFloor } from "./floor.js";
import { addConveyor } from "./conveyor.js";
import { addCuttingMachine } from "./cutting_machine.js";
import { addRobotArm1 } from "./robot_arm1.js";
import { addRobotArmHead } from "./robot_arm_head.js";
import { addPress } from "./press.js";
import { addXF6300 } from "./xf6300.js";
import { addBox } from "./box.js";

/**
 * 부품공장1 내부 화면
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initPartsFactory1InsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 1.1);
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
  addPress(scene, { position: new THREE.Vector3(18, 0, -2.278) }).catch(console.error);
  addRobotArm1(scene, { position: new THREE.Vector3(0, 0, 0) }).catch(console.error);
  addRobotArmHead(scene, { position: new THREE.Vector3(0, 0, 50) }).catch(console.error);
  addBox(scene, { position: new THREE.Vector3(9.487, 0, 63.523) }).catch(console.error);

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
