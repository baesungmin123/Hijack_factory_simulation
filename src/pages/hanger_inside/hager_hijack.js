import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STANDS = [
  { x: -3.935,  z: -30.2589, ry: Math.PI / 2 },
  { x: -3.935,  z:  -8.3156, ry: Math.PI / 2 },
  { x: -3.935,  z:  13.819,  ry: Math.PI / 2 },
  { x: -3.935,  z:  35.953,  ry: Math.PI / 2 },
  { x: -3.935,  z:  58.088,  ry: Math.PI / 2 },
  { x: 91.694,  z: -30.373,  ry: -Math.PI / 2 },
  { x: 91.694,  z:  -8.2387, ry: -Math.PI / 2 },
  { x: 91.694,  z:  13.896,  ry: -Math.PI / 2 },
  { x: 91.694,  z:  36.032,  ry: -Math.PI / 2 },
  { x: 91.694,  z:  57.972,  ry: -Math.PI / 2 },
];

export async function addHangarHijacks(scene) {
  const loader = new GLTFLoader();
  const [standGltf, hijackGltf] = await Promise.all([
    loader.loadAsync("/assets/blend/stand.glb"),
    loader.loadAsync("/assets/blend/stand_hijack.glb"),
  ]);

  const standTemplate  = standGltf.scene;
  const hijackTemplate = hijackGltf.scene;

  // GLB 내부 오프셋 제거: XZ 중심, Y는 바닥 기준
  function normalizeToBase(obj) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.x -= center.x;
    obj.position.z -= center.z;
    obj.position.y -= box.min.y;
    obj.updateMatrixWorld(true);
  }
  normalizeToBase(standTemplate);
  normalizeToBase(hijackTemplate);

  const slots = STANDS.map(({ x, z, ry }) => {
    const standMesh  = standTemplate.clone(true);
    const hijackMesh = hijackTemplate.clone(true);
    hijackMesh.visible = false;

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = ry;
    group.add(standMesh, hijackMesh);
    scene.add(group);

    return { group, standMesh, hijackMesh };
  });

  function setCount(n) {
    const count = Math.max(0, Math.min(10, n));
    slots.forEach(({ standMesh, hijackMesh }, i) => {
      const isHijack = i < count;
      standMesh.visible  = !isHijack;
      hijackMesh.visible = isHijack;
    });
  }

  setCount(0);

  return {
    setCount,
    dispose() {
      slots.forEach(({ group }) => scene.remove(group));
    },
  };
}
