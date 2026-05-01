import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createViewModeControls } from "../../components/Controls.js";
import { addJoinFactory1InsideFloor } from "./floor.js";
import { addConveyor } from "./conveyor.js";
import { addRobotArmBody } from "./robotarm_body.js";
import { addRobotArmArm } from "./robotarm_arm.js";

/**
 * 조립공장1 내부 화면
 * @param {{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement }} ctx
 */
export function initJoinFactory1InsideApp({ scene, renderer, canvas }) {
  scene.background = new THREE.Color(0x121722);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const key = new THREE.DirectionalLight(0xfff0d4, 2.5);
  key.position.set(12, 18, 10);
  scene.add(ambient, key);

  addJoinFactory1InsideFloor(scene).catch((err) => console.error("바닥 로드 실패:", err));

  const body = { mesh: null, moving: false, startZ: 0, endZ: 0, y: 0, speed: 9.4 };

  addConveyor(scene, { position: new THREE.Vector3( 16.764, 0, -34.181) }).then(async first => {
    const b = first.getBounds();
    body.startZ = b.min.z;
    body.y = b.max.y - 0.5;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/_Hijack_body.glb");
    body.mesh = gltf.scene;
    body.mesh.rotation.y = Math.PI * 1.5;
    body.mesh.scale.setScalar(2.5);
    body.mesh.position.set(16.764, body.y, body.startZ);
    scene.add(body.mesh);
    body.moving = true;
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 16.764, 0, -15.526) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 16.764, 0,   3.267) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 16.764, 0,  22.061) }).then(last => {
    body.endZ = last.getBounds().max.z;
  }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3( 43.167, 0,  22.061) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 43.167, 0,  40.956) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 43.167, 0,  59.7)   }).then(last => {
    leg.endZ = last.getBounds().max.z;
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 43.167, 0,   3.317) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 43.167, 0, -15.427) }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 43.167, 0, -34.171) }).then(async first => {
    const b = first.getBounds();
    leg.startZ = b.min.z;
    leg.y = b.max.y - 0.5;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/Hijack_leg.glb");
    leg.mesh = gltf.scene;
    leg.mesh.rotation.y = Math.PI * 1.5;
    leg.mesh.scale.setScalar(2.5);
    leg.mesh.position.set(43.167, leg.y, leg.startZ);
    scene.add(leg.mesh);
    leg.moving = true;

    const blGltf = await new GLTFLoader().loadAsync("/assets/blend/body+leg.glb");
    bodyLeg.mesh = blGltf.scene;
    bodyLeg.mesh.rotation.y = Math.PI * 1.5;
    bodyLeg.mesh.scale.setScalar(3);
    bodyLeg.mesh.visible = false;
    scene.add(bodyLeg.mesh);

    const blaGltf = await new GLTFLoader().loadAsync("/assets/blend/body+leg+arm.glb");
    bodyLegArm.mesh = blaGltf.scene;
    bodyLegArm.mesh.rotation.y = Math.PI * 1.5;
    bodyLegArm.mesh.scale.setScalar(3.5);
    bodyLegArm.mesh.visible = false;
    scene.add(bodyLegArm.mesh);
  }).catch(console.error);

  const arm = { mesh: null, moving: false, startZ: 0, endZ: 0, y: 0, speed: 5.8 };

  addConveyor(scene, { position: new THREE.Vector3( 69.487, 0, -34.181) }).then(async first => {
    const b = first.getBounds();
    arm.startZ = b.min.z;
    arm.y = b.max.y - 1;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/Hijack_arm.glb");
    arm.mesh = gltf.scene;
    arm.mesh.rotation.y = Math.PI * 1.5;
    arm.mesh.scale.setScalar(2.5);
    arm.mesh.position.set(69.487, arm.y, arm.startZ);
    scene.add(arm.mesh);
    arm.moving = true;
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 69.487, 0, -15.526) }).catch(console.error);
  let arm3TriggerZ = Infinity;
  addConveyor(scene, { position: new THREE.Vector3( 69.487, 0,   3.267) }).then(c => {
    const b = c.getBounds();
    arm3TriggerZ = (b.min.z + b.max.z) / 2;
  }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3( 69.487, 0,  22.061) }).then(c => {
    arm.endZ = c.getBounds().max.z;
  }).catch(console.error);

  const leg = { mesh: null, moving: false, startZ: 0, endZ: 0, y: 0, speed: 5 };
  const bodyLeg = { mesh: null, swapped: false };
  const bodyLegArm = { mesh: null, swapped: false };

  let bodyMixer = null;
  let bodyActions = [];
  let armMixer = null;
  let bodyArmTime = 0;

  addRobotArmBody(scene, { position: new THREE.Vector3(26, 0, -22.977) }).then(r => {
    bodyMixer = r.mixer;
    bodyActions = r.actions;
    bodyActions.forEach(a => { a.paused = false; });
  }).catch(console.error);

  let armActions = [];
  let armStarted = false;
  let armTime = 0;
  addRobotArmArm(scene, { position: new THREE.Vector3(59.319, 0, 18.88), rotationY: Math.PI }).then(r => {
    armMixer = r.mixer;
    armActions = r.actions;
  }).catch(console.error);

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

    if (bodyMixer) {
      bodyMixer.update(delta);
      bodyArmTime += delta;
      if (body.mesh && bodyArmTime >= 2) {
        body.mesh.visible = false;
      }
      if (!bodyLeg.swapped && bodyLeg.mesh && leg.mesh && bodyArmTime >= 4) {
        bodyLeg.mesh.position.set(43.167, leg.y, leg.mesh.position.z);
        bodyLeg.mesh.visible = true;
        leg.mesh.visible = false;
        bodyLeg.swapped = true;
      }
    }

    if (!armStarted && arm.mesh && arm.mesh.position.z >= arm3TriggerZ) {
      armActions.forEach(a => { a.paused = false; });
      armStarted = true;
    }
    if (armMixer) {
      armMixer.update(delta);
      if (armStarted) {
        armTime += delta;
        if (arm.mesh && armTime >= 2) arm.mesh.visible = false;
        if (!bodyLegArm.swapped && bodyLegArm.mesh && armTime >= 4) {
          const curZ = bodyLeg.swapped && bodyLeg.mesh
            ? bodyLeg.mesh.position.z
            : leg.mesh ? leg.mesh.position.z : leg.startZ;
          bodyLegArm.mesh.position.set(43.167, leg.y, curZ);
          bodyLegArm.mesh.visible = true;
          if (bodyLeg.mesh) bodyLeg.mesh.visible = false;
          bodyLegArm.swapped = true;
        }
      }
    }

    if (body.moving && body.mesh) {
      body.mesh.position.z += body.speed * delta;
      if (body.mesh.position.z >= body.endZ) {
        body.mesh.position.set(16.764, body.y, body.startZ);
      }
    }

    if (arm.moving && arm.mesh) {
      arm.mesh.position.z += arm.speed * delta;
      if (arm.mesh.position.z >= arm.endZ) {
        arm.mesh.position.set(69.487, arm.y, arm.startZ);
      }
    }

    if (leg.moving) {
      if (!bodyLeg.swapped && leg.mesh) {
        leg.mesh.position.z += leg.speed * delta;
        if (leg.mesh.position.z >= leg.endZ) {
          leg.mesh.position.set(43.167, leg.y, leg.startZ);
        }
      }
      if (bodyLeg.swapped && !bodyLegArm.swapped && bodyLeg.mesh) {
        bodyLeg.mesh.position.z += leg.speed * delta;
        if (bodyLeg.mesh.position.z >= leg.endZ) {
          bodyLeg.mesh.position.set(43.167, leg.y, leg.startZ);
        }
      }
      if (bodyLegArm.swapped && bodyLegArm.mesh) {
        bodyLegArm.mesh.position.z += leg.speed * delta;
        if (bodyLegArm.mesh.position.z >= leg.endZ) {
          bodyLegArm.mesh.position.set(43.167, leg.y, leg.startZ);
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
