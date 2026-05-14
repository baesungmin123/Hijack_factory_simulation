import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { postUseRaw, postCompletePart } from "../../api.js";
import { addConveyor } from "./right/conveyor.js";
import { addCuttingMachine } from "./right/cutting_machine.js";
import { addRobotArm1 } from "./right/robot_arm1.js";
import { addRobotArmBody } from "./right/robot_arm_body.js";
import { addPress } from "./right/press.js";
import { addXF6300 } from "./right/xf6300.js";
import { addBox } from "./right/box.js";

export function initLeftAnimation(scene) {
  const mat = {
    mesh: null,
    state: 'conv1',
    timer: 0,
    speed: 6,
    conv1: { minZ: 0, maxZ: 0, y: 0 },
    conv2: { minZ: 0, maxZ: 0, y: 0 },
  };

  addConveyor(scene, { position: new THREE.Vector3(97.089, 0, -34.448) }).then(async conveyor => {
    const b = conveyor.getBounds();
    mat.conv1 = { minZ: b.min.z, maxZ: b.max.z, y: b.max.y - 0.6 };
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/material.glb");
    mat.mesh = gltf.scene;
    mat.mesh.position.set(97.089, mat.conv1.y, mat.conv1.minZ);
    scene.add(mat.mesh);
  }).catch(console.error);

  addCuttingMachine(scene, { position: new THREE.Vector3(97.692, 0, -17.059), rotationY: Math.PI }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(97.232, 0, 0.073) }).then(conveyor => {
    const b = conveyor.getBounds();
    mat.conv2 = { minZ: b.min.z, maxZ: b.max.z, y: b.max.y - 0.6 };
  }).catch(console.error);

  const flatMat = { mesh: null, moving: false, endZ: 0, speed: 6, y: 0, doneTimer: -1, triggered: false };
  const hijackBody = { mesh: null, moving: false, startZ: 0, endZ: 0, y: 0, speed: 6 };

  let conv1ApiPending = true;

  let arm1Mixer = null;
  let arm1Actions = [];
  let arm1Started = false;
  let arm1Timer = 0;
  let arm1Fps = 24;
  let arm1Duration = Infinity;
  let arm1Finished = false;

  addRobotArm1(scene, { position: new THREE.Vector3(92.369, 0, 0.088), rotationY: Math.PI }).then(r => {
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

  addConveyor(scene, { position: new THREE.Vector3(77.909, 0, 0.073) }).then(async conveyor => {
    const b = conveyor.getBounds();
    flatMat.y = b.max.y;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/flat_material.glb");
    flatMat.mesh = gltf.scene;
    flatMat.mesh.position.set(77.909, flatMat.y, 0);
    flatMat.mesh.visible = false;
    scene.add(flatMat.mesh);
  }).catch(console.error);

  let pressMixer = null;
  let pressActions = [];
  let pressStarted = false;

  addPress(scene, { position: new THREE.Vector3(70, 0, 0.088), rotationY: Math.PI }).then(r => {
    pressMixer = r.mixer ?? null;
    pressActions = r.actions ?? [];
  }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(77.924, 0, 18.926) }).then(conveyor => {
    const b = conveyor.getBounds();
    flatMat.endZ = b.max.z;
  }).catch(console.error);

  addXF6300(scene, { position: new THREE.Vector3(76.326, 0, 38), rotationY: Math.PI }).catch(console.error);

  addConveyor(scene, { position: new THREE.Vector3(77.975, 0, 48.653) }).then(async conveyor => {
    const b = conveyor.getBounds();
    hijackBody.startZ = b.min.z;
    hijackBody.endZ = b.max.z;
    hijackBody.y = b.max.y;
    const gltf = await new GLTFLoader().loadAsync("/assets/blend/_Hijack_body.glb");
    hijackBody.mesh = gltf.scene;
    hijackBody.mesh.scale.setScalar(2);
    hijackBody.mesh.position.set(77.975, hijackBody.y, hijackBody.startZ);
    hijackBody.mesh.visible = false;
    scene.add(hijackBody.mesh);
  }).catch(console.error);

  let armBodyMixer = null;
  let armBodyActions = [];
  const armBodyZ = 50;

  addRobotArmBody(scene, { position: new THREE.Vector3(86, 0, 50), rotationY: Math.PI * 2 }).then(r => {
    armBodyMixer = r.mixer ?? null;
    armBodyActions = r.actions ?? [];
  }).catch(console.error);

  addBox(scene, { position: new THREE.Vector3(79.313, 0, 65.163), rotationY: Math.PI }).catch(console.error);

  return {
    update(delta) {
      if (arm1Finished) {
        arm1Finished = false;
        arm1Started = false;
        arm1Timer = 0;
        pressStarted = false;
        flatMat.triggered = false;
        arm1Actions.forEach(a => { a.reset(); a.play(); a.paused = true; });
        pressActions.forEach(a => { a.reset(); a.play(); a.paused = true; });
        mat.state = 'conv1';
        mat.timer = 0;
        conv1ApiPending = true;
        if (mat.mesh) { mat.mesh.position.set(97.089, mat.conv1.y, mat.conv1.minZ); mat.mesh.visible = true; }
      }

      if (arm1Started && arm1Mixer) {
        arm1Mixer.update(delta);
        arm1Timer += delta;
        if (!arm1Finished && arm1Timer >= arm1Duration) {
          arm1Finished = true;
        }
        if (flatMat.mesh && !flatMat.triggered && arm1Timer >= 9) {
          flatMat.mesh.position.set(77.909, flatMat.y, 0);
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
        if (flatMat.doneTimer >= 5 && hijackBody.mesh && !hijackBody.moving) {
          hijackBody.mesh.position.set(77.975, hijackBody.y, hijackBody.startZ);
          hijackBody.mesh.visible = true;
          hijackBody.moving = true;
          flatMat.doneTimer = -1;
          if (armBodyMixer) {
            armBodyActions.forEach(a => { a.reset(); a.play(); });
          }
        }
      }

      if (armBodyMixer) armBodyMixer.update(delta);

      if (hijackBody.moving && hijackBody.mesh) {
        hijackBody.mesh.position.z += hijackBody.speed * delta;
        if (hijackBody.mesh.position.z >= armBodyZ) {
          hijackBody.mesh.visible = false;
          hijackBody.moving = false;
          postCompletePart("parts_a", "body", 5);
        }
      }

      if (mat.mesh) {
        if (mat.state === 'conv1') {
          if (conv1ApiPending) { conv1ApiPending = false; postUseRaw("parts_a", 2); }
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
            mat.mesh.position.set(97.232, mat.conv2.y, mat.conv2.minZ);
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
  };
}
