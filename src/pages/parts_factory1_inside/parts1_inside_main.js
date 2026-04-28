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
import { addConveyor as addRightConveyor } from "./right/conveyor.js";
import { addCuttingMachine as addRightCuttingMachine } from "./right/cutting_machine.js";
import { addRobotArm1 as addRightRobotArm1 } from "./right/robot_arm1.js";
import { addRobotArmBody } from "./right/robot_arm_body.js";
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
    console.log('[conv1 bounds]', mat.conv1);

    const gltf = await new GLTFLoader().loadAsync("/assets/blend/material.glb");
    mat.mesh = gltf.scene;
    mat.mesh.position.set(-8.86, mat.conv1.y, mat.conv1.minZ);
    scene.add(mat.mesh);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(-8.86, 0, 0.02) }).then(conveyor => {
    const b = conveyor.getBounds();
    mat.conv2 = { minZ: b.min.z, maxZ: b.max.z, y: b.max.y - 0.6 };
    console.log('[conv2 bounds]', mat.conv2);
  }).catch(console.error);
  const flatMat = { mesh: null, moving: false, minZ: 0, maxZ: 0, speed: 6 };

  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 0.02) }).then(async conveyor => {
    const b = conveyor.getBounds();
    flatMat.minZ = b.min.z;
    flatMat.maxZ = b.max.z;

    const gltf = await new GLTFLoader().loadAsync("/assets/blend/flat_material.glb");
    flatMat.mesh = gltf.scene;
    flatMat.mesh.position.set(10.46, b.max.y + 2, flatMat.minZ);
    flatMat.mesh.visible = false;
    scene.add(flatMat.mesh);
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 18.88) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(10.461, 0, 49) }).catch(console.error);

  addXF6300(scene, { position: new THREE.Vector3(11, 0, 29.5) }).catch(console.error);
  addPress(scene, { position: new THREE.Vector3(18, 0, 0) }).catch(console.error);

  let arm1Mixer = null;
  let arm1Actions = [];
  let arm1Frame218Time = 218 / 24;
  let arm1Started = false;

  addRobotArm1(scene, { position: new THREE.Vector3(-4, 0, 0) }).then(r => {
    arm1Mixer = r.mixer ?? null;
    arm1Actions = r.actions ?? [];
    const clips = r.clips ?? [];
    if (clips.length > 0) {
      const times = clips[0].tracks[0]?.times;
      if (times && times.length > 1) {
        const fps = Math.round(1 / (times[1] - times[0]));
        arm1Frame218Time = 218 / fps;
      }
    }
  }).catch(console.error);
  addRobotArmHead(scene, { position: new THREE.Vector3(3, 0, 50) }).catch(console.error);
  addBox(scene, { position: new THREE.Vector3(9.487, 0, 63.523) }).catch(console.error);

  // right side
  addRightConveyor(scene, { position: new THREE.Vector3(97.089, 0, -34.448) }).catch(console.error);
  addRightCuttingMachine(scene, { position: new THREE.Vector3(97.692, 0, -17.059), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(97.232, 0, 0.073) }).catch(console.error);
  addRightRobotArm1(scene, { position: new THREE.Vector3(92.369, 0, 0.088), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(77.909, 0, 0.073) }).catch(console.error);
  addRightPress(scene, { position: new THREE.Vector3(70, 0, 0.088), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(77.924, 0, 18.926) }).catch(console.error);
  addRightXF6300(scene, { position: new THREE.Vector3(76.326, 0, 38), rotationY: Math.PI }).catch(console.error);
  addRightConveyor(scene, { position: new THREE.Vector3(77.975, 0, 48.653) }).catch(console.error);
  addRobotArmBody(scene, { position: new THREE.Vector3(86, 0, 50), rotationY: Math.PI * 2 }).catch(console.error);
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

    if (arm1Started && arm1Mixer) {
      arm1Mixer.update(delta);
      console.log('[arm1] time:', arm1Mixer.time.toFixed(2), '/ frame218Time:', arm1Frame218Time.toFixed(2), '| flatMat.mesh:', !!flatMat.mesh);
      if (flatMat.mesh && !flatMat.moving && arm1Mixer.time >= arm1Frame218Time) {
        console.log('[flatMat] 등장!');
        flatMat.mesh.visible = true;
        flatMat.moving = true;
      }
    }

    if (flatMat.moving && flatMat.mesh) {
      flatMat.mesh.position.z += flatMat.speed * delta;
      if (flatMat.mesh.position.z > flatMat.maxZ) flatMat.mesh.position.z = flatMat.minZ;
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
