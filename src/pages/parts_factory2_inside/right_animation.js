import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { addConveyor } from "./left/conveyor.js";
import { addCuttingMachine } from "./left/cutting_machine.js";
import { addRobotArm1 } from "./left/robot_arm1.js";
import { addRobotArmHead } from "./left/robot_arm_head.js";
import { addPress } from "./left/press.js";
import { addXF6300 } from "./left/xf6300.js";
import { addBox } from "./left/box.js";

export function initRightAnimation(scene) {
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

  addCuttingMachine(scene, { position: new THREE.Vector3(-9.47, 0, -17.37) }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(-8.86, 0, 0.02) }).then(conveyor => {
    const b = conveyor.getBounds();
    mat.conv2 = { minZ: b.min.z, maxZ: b.max.z, y: b.max.y - 0.6 };
  }).catch(console.error);

  const flatMat = { mesh: null, moving: false, endZ: 0, speed: 6, y: 0, doneTimer: -1, triggered: false };
  const hijackHead = { mesh: null, moving: false, startZ: 0, endZ: 0, y: 0, speed: 6 };


  let arm1Mixer = null;
  let arm1Actions = [];
  let arm1Started = false;
  let arm1Timer = 0;
  let arm1Fps = 24;
  let arm1Duration = Infinity;
  let arm1Finished = false;
  let rawMaterial = Infinity;
  let waitingForRaw = false;

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
    conv1ApiPending = true;
    if (mat.mesh) { mat.mesh.position.set(-8.86, mat.conv1.y, mat.conv1.minZ); mat.mesh.visible = true; }
  }

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

  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 0.02) }).then(async conveyor => {
    const b = conveyor.getBounds();
    flatMat.y = b.max.y;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/flat_material.glb");
    flatMat.mesh = gltf.scene;
    flatMat.mesh.position.set(10.46, flatMat.y, 0);
    flatMat.mesh.visible = false;
    scene.add(flatMat.mesh);
  }).catch(console.error);

  let pressMixer = null;
  let pressActions = [];
  let pressStarted = false;

  addPress(scene, { position: new THREE.Vector3(18, 0, 0) }).then(r => {
    pressMixer = r.mixer ?? null;
    pressActions = r.actions ?? [];
  }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(10.46, 0, 18.88) }).then(conveyor => {
    const b = conveyor.getBounds();
    flatMat.endZ = b.max.z;
  }).catch(console.error);

  addXF6300(scene, { position: new THREE.Vector3(11, 0, 29.5) }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(10.461, 0, 49) }).then(async conveyor => {
    const b = conveyor.getBounds();
    hijackHead.startZ = b.min.z;
    hijackHead.endZ = b.max.z;
    hijackHead.y = b.max.y;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/Hijack_arm.glb");
    hijackHead.mesh = gltf.scene;
    hijackHead.mesh.scale.setScalar(3);
    hijackHead.mesh.rotation.y = Math.PI / 2;
    hijackHead.mesh.position.set(9, hijackHead.y, hijackHead.startZ);
    hijackHead.mesh.visible = false;
    scene.add(hijackHead.mesh);
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

  return {
    update(delta) {
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
          hijackHead.mesh.position.set(9, hijackHead.y, hijackHead.startZ);
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
    },
    setRawMaterial(n) {
      rawMaterial = n;
      if (waitingForRaw && rawMaterial > 0) tryStartCycle();
    },
  };
}
