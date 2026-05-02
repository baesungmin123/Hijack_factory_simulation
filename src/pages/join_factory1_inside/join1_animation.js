import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function createJoin1Animation(scene) {
  const config = {
    bodyX: 16.764, legX: 43.167, armX: 69.487,
    bodySpeed: 9.4, legSpeed: 5, armSpeed: 5.8,
    bodyStartZ: 0, bodyEndZ: 0, bodyY: 0,
    legStartZ: 0, legEndZ: 0, legY: 0,
    armStartZ: 0, armEndZ: 0, armY: 0,
    arm3TriggerZ: Infinity,
    bodyArmTriggerZ: 0,
  };

  const sets = [];
  let bodyTemplate = null, legTemplate = null, armTemplate = null;
  let blTemplate = null, blaTemplate = null;
  let bodyMixer = null, bodyActions = [];
  let armMixer = null, armActions = [];
  let bodyRobotBusy = false, armRobotBusy = false;
  let spawnInterval = null;
  let loadedCount = 0;

  function createSet() {
    if (!bodyTemplate || !legTemplate || !armTemplate || !blTemplate || !blaTemplate) return;
    if (config.bodyStartZ === 0 && config.bodyEndZ === 0) return;

    const bMesh = bodyTemplate.clone();
    bMesh.rotation.y = Math.PI * 1.5;
    bMesh.scale.setScalar(2.5);
    bMesh.position.set(config.bodyX, config.bodyY, config.bodyStartZ);
    scene.add(bMesh);

    const lMesh = legTemplate.clone();
    lMesh.rotation.y = Math.PI * 1.5;
    lMesh.scale.setScalar(2.5);
    lMesh.position.set(config.legX, config.legY, config.legStartZ);
    scene.add(lMesh);

    const aMesh = armTemplate.clone();
    aMesh.rotation.y = Math.PI * 1.5;
    aMesh.scale.setScalar(2.5);
    aMesh.position.set(config.armX, config.armY, config.armStartZ);
    scene.add(aMesh);

    const blMesh = blTemplate.clone();
    blMesh.rotation.y = Math.PI * 1.5;
    blMesh.scale.setScalar(3);
    blMesh.visible = false;
    scene.add(blMesh);

    const blaMesh = blaTemplate.clone();
    blaMesh.rotation.y = Math.PI * 1.5;
    blaMesh.scale.setScalar(3.5);
    blaMesh.visible = false;
    scene.add(blaMesh);

    sets.push({
      body: bMesh, leg: lMesh, arm: aMesh,
      bodyLeg: blMesh, bodyLegArm: blaMesh,
      bodyLegSwapped: false, bodyLegArmSwapped: false,
      bodyRobotTriggered: false, armRobotTriggered: false,
      bodyRobotTime: 0, armRobotTime: 0,
      done: false,
    });
  }

  function onAllLoaded() {
    loadedCount++;
    if (loadedCount === 5) {
      createSet();
      spawnInterval = setInterval(createSet, 10000);
    }
  }

  function playBodyRobot() {
    if (bodyRobotBusy || bodyActions.length === 0) return;
    bodyRobotBusy = true;
    bodyActions.forEach(a => { a.reset(); a.paused = false; a.play(); });
    const duration = bodyActions[0]?.getClip()?.duration ?? 3;
    setTimeout(() => { bodyRobotBusy = false; }, duration * 1000);
  }

  function playArmRobot() {
    if (armRobotBusy || armActions.length === 0) return;
    armRobotBusy = true;
    armActions.forEach(a => { a.reset(); a.paused = false; a.play(); });
    const duration = armActions[0]?.getClip()?.duration ?? 3;
    setTimeout(() => { armRobotBusy = false; }, duration * 1000);
  }

  function update(delta) {
    if (bodyMixer) bodyMixer.update(delta);
    if (armMixer) armMixer.update(delta);

    sets.forEach(s => {
      if (s.done) return;

      // body 이동
      s.body.position.z += config.bodySpeed * delta;
      if (s.body.position.z >= config.bodyEndZ) s.body.position.z = config.bodyStartZ;

      // body 로봇팔 트리거
      if (!s.bodyRobotTriggered && s.body.position.z >= config.bodyArmTriggerZ) {
        s.bodyRobotTriggered = true;
        playBodyRobot();
      }

      // body 로봇팔 애니메이션 후 처리
      if (s.bodyRobotTriggered) {
        s.bodyRobotTime += delta;
        if (s.bodyRobotTime >= 2) s.body.visible = false;
        if (!s.bodyLegSwapped && s.bodyRobotTime >= 4 && s.leg) {
          s.bodyLeg.position.set(config.legX, config.legY, s.leg.position.z);
          s.bodyLeg.visible = true;
          s.leg.visible = false;
          s.bodyLegSwapped = true;
        }
      }

      // leg / bodyLeg / bodyLegArm 이동
      if (!s.bodyLegSwapped && s.leg) {
        s.leg.position.z += config.legSpeed * delta;
        if (s.leg.position.z >= config.legEndZ) s.leg.position.z = config.legStartZ;
      }
      if (s.bodyLegSwapped && !s.bodyLegArmSwapped && s.bodyLeg) {
        s.bodyLeg.position.z += config.legSpeed * delta;
        if (s.bodyLeg.position.z >= config.legEndZ) s.bodyLeg.position.z = config.legStartZ;
      }
      if (s.bodyLegArmSwapped && s.bodyLegArm) {
        s.bodyLegArm.position.z += config.legSpeed * delta;
        if (s.bodyLegArm.position.z >= config.legEndZ) {
          scene.remove(s.body);
          scene.remove(s.leg);
          scene.remove(s.arm);
          scene.remove(s.bodyLeg);
          scene.remove(s.bodyLegArm);
          s.done = true;
        }
      }

      // arm 이동
      s.arm.position.z += config.armSpeed * delta;
      if (s.arm.position.z >= config.armEndZ) s.arm.position.z = config.armStartZ;

      // arm 로봇팔 트리거
      if (!s.armRobotTriggered && s.arm.position.z >= config.arm3TriggerZ) {
        s.armRobotTriggered = true;
        playArmRobot();
      }

      // arm 로봇팔 애니메이션 후 처리
      if (s.armRobotTriggered) {
        s.armRobotTime += delta;
        if (s.armRobotTime >= 2) s.arm.visible = false;
        if (!s.bodyLegArmSwapped && s.armRobotTime >= 4) {
          const curZ = s.bodyLegSwapped ? s.bodyLeg.position.z : config.legStartZ;
          s.bodyLegArm.position.set(config.legX, config.legY, curZ);
          s.bodyLegArm.visible = true;
          s.bodyLeg.visible = false;
          s.bodyLegArmSwapped = true;
        }
      }
    });
  }

  function setBodyMixer(mixer, actions) {
    bodyMixer = mixer;
    bodyActions = actions;
    bodyActions.forEach(a => { a.paused = true; });
  }

  function setArmMixer(mixer, actions) {
    armMixer = mixer;
    armActions = actions;
    armActions.forEach(a => { a.paused = true; });
  }

  function setBodyConveyor(startZ, endZ, y) {
    config.bodyStartZ = startZ;
    config.bodyEndZ = endZ;
    config.bodyY = y;
    config.bodyArmTriggerZ = startZ + 5;
  }

  function setLegConveyor(startZ, endZ, y) {
    config.legStartZ = startZ;
    config.legEndZ = endZ;
    config.legY = y;
  }

  function setArmConveyor(startZ, endZ, y, triggerZ) {
    config.armStartZ = startZ;
    config.armEndZ = endZ;
    config.armY = y;
    config.arm3TriggerZ = triggerZ;
  }

  async function loadTemplates() {
    const loader = new GLTFLoader();

    const bodyGltf = await loader.loadAsync("/assets/blend/_Hijack_body.glb");
    bodyTemplate = bodyGltf.scene;
    onAllLoaded();

    const legGltf = await loader.loadAsync("/assets/blend/Hijack_leg.glb");
    legTemplate = legGltf.scene;

    const blGltf = await loader.loadAsync("/assets/blend/body+leg.glb");
    blTemplate = blGltf.scene;

    const blaGltf = await loader.loadAsync("/assets/blend/body+leg+arm.glb");
    blaTemplate = blaGltf.scene;

    onAllLoaded(); // leg
    onAllLoaded(); // bodyLeg
    onAllLoaded(); // bodyLegArm

    const armGltf = await loader.loadAsync("/assets/blend/Hijack_arm.glb");
    armTemplate = armGltf.scene;
    onAllLoaded();
  }

  function dispose() {
    if (spawnInterval) clearInterval(spawnInterval);
  }

  return {
    update,
    setBodyMixer,
    setArmMixer,
    setBodyConveyor,
    setLegConveyor,
    setArmConveyor,
    loadTemplates,
    dispose,
  };
}