import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { postCompleteHijack, postUsePart } from "../../api.js";

export function createJoin2Animation(scene) {
  const config = {
    leftX: 29.764,
    rightX: 56.167,
    leftSpeed: 9.4,
    rightSpeed: 5,
    leftStartZ: 0, leftEndZ: 0, leftY: 0,
    rightStartZ: 0, rightEndZ: 0, rightY: 0,
    headTriggerZ: Infinity,
  };

  const sets = [];
  let headTemplate = null, bodyLegArmTemplate = null, hijackTemplate = null;
  let headMixer = null, headActions = [];
  let headRobotBusy = false;
  let spawnInterval = null;
  let loadedCount = 0;

  const inventory = { body: Infinity, head: Infinity };

  function setInventory(body, head) {
    inventory.body = body ?? Infinity;
    inventory.head = head ?? Infinity;
  }

  function hasEnoughParts() {
    return inventory.body > 0 && inventory.head > 0;
  }

  function createSet() {
    if (!headTemplate || !bodyLegArmTemplate) return;
    if (config.leftStartZ === 0 && config.leftEndZ === 0) return;
    if (!hasEnoughParts()) return;

    const hMesh = headTemplate.clone();
    hMesh.rotation.y = Math.PI * 1.5;
    hMesh.scale.setScalar(2);
    hMesh.position.set(config.leftX, config.leftY, config.leftStartZ);
    scene.add(hMesh);

    const blaMesh = bodyLegArmTemplate.clone();
    blaMesh.rotation.y = Math.PI * 1.5;
    blaMesh.scale.setScalar(3.5);
    blaMesh.position.set(config.rightX, config.rightY, config.rightStartZ);
    scene.add(blaMesh);

    postUsePart("final_assembly", "head", 1);
    postUsePart("final_assembly", "body", 1);

    sets.push({
      head: hMesh,
      bodyLegArm: blaMesh,
      hijack: null,
      hijackSwapped: false,
      robotTriggered: false,
      robotTime: 0,
      done: false,
    });
  }

  function onAllLoaded() {
    loadedCount++;
    if (loadedCount === 3) {
      createSet();
      spawnInterval = setInterval(createSet, 10000);
    }
  }

  function playHeadRobot() {
    if (headRobotBusy || headActions.length === 0) return;
    headRobotBusy = true;
    headActions.forEach(a => { a.reset(); a.paused = false; a.play(); });
    const duration = headActions[0]?.getClip()?.duration ?? 3;
    setTimeout(() => { headRobotBusy = false; }, duration * 1000);
  }

  function update(delta) {
    if (headMixer) headMixer.update(delta);

    sets.forEach(s => {
      if (s.done) return;

      // head 이동 (트리거 후에도 계속 이동)
      if (s.head.visible) {
        s.head.position.z += config.leftSpeed * delta;
        if (s.head.position.z >= config.leftEndZ) s.head.position.z = config.leftStartZ;
      }

      // 로봇팔 트리거
      if (!s.robotTriggered && s.head.position.z >= config.headTriggerZ) {
        s.robotTriggered = true;
        playHeadRobot();
      }

      // 로봇팔 시간 경과 처리
      if (s.robotTriggered) {
        s.robotTime += delta;
        if (s.robotTime >= 2) s.head.visible = false;

        // 4초: bodyLegArm → Hijack 교체
        if (!s.hijackSwapped && s.robotTime >= 4 && hijackTemplate) {
          const hj = hijackTemplate.clone();
          hj.rotation.y = Math.PI * 1.5;
          hj.scale.setScalar(3);
          hj.position.copy(s.bodyLegArm.position);
          scene.add(hj);
          s.bodyLegArm.visible = false;
          s.hijack = hj;
          s.hijackSwapped = true;
        }
      }

      // bodyLegArm 또는 Hijack 이동
      if (!s.hijackSwapped) {
        s.bodyLegArm.position.z += config.rightSpeed * delta;
      } else if (s.hijack) {
        s.hijack.position.z += config.rightSpeed * delta;
        if (s.hijack.position.z >= config.rightEndZ) {
          scene.remove(s.head);
          scene.remove(s.bodyLegArm);
          scene.remove(s.hijack);
          postCompleteHijack();
          s.done = true;
        }
      }
      if (!s.hijackSwapped && s.bodyLegArm.position.z >= config.rightEndZ) {
        scene.remove(s.head);
        scene.remove(s.bodyLegArm);
        s.done = true;
      }
    });
  }

  function setHeadMixer(mixer, actions) {
    headMixer = mixer;
    headActions = actions;
    headActions.forEach(a => { a.paused = true; });
  }

  function setLeftConveyor(startZ, endZ, y) {
    config.leftStartZ = startZ;
    config.leftEndZ = endZ;
    config.leftY = y;
    config.headTriggerZ = startZ + 5;
  }

  function setRightConveyor(startZ, endZ, y) {
    config.rightStartZ = startZ;
    config.rightEndZ = endZ;
    config.rightY = y;
  }

  async function loadTemplates() {
    const loader = new GLTFLoader();

    const headGltf = await loader.loadAsync("/assets/blend/Hijack_head.glb");
    headTemplate = headGltf.scene;
    onAllLoaded();

    const blaGltf = await loader.loadAsync("/assets/blend/body+leg+arm.glb");
    bodyLegArmTemplate = blaGltf.scene;
    onAllLoaded();

    const hjGltf = await loader.loadAsync("/assets/blend/Hijack.glb");
    hijackTemplate = hjGltf.scene;
    onAllLoaded();
  }

  function dispose() {
    if (spawnInterval) clearInterval(spawnInterval);
  }

  return {
    update,
    setHeadMixer,
    setLeftConveyor,
    setRightConveyor,
    setInventory,
    loadTemplates,
    dispose,
  };
}
