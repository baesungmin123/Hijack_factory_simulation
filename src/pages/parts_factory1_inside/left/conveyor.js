import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const URL = "/assets/blend/conveyor_belt.glb";

export async function addConveyor(scene, options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    rotationY = 0,
  } = options;

  const gltf = await loader.loadAsync(URL);
  const root = gltf.scene;
  root.name = "Conveyor";
  root.rotation.y = rotationY;
  root.updateMatrixWorld(true);

  // 스케일 후 실제 바운딩박스로 바닥 정렬 + 중심 배치
  const scaledBox = new THREE.Box3().setFromObject(root);
  const center = scaledBox.getCenter(new THREE.Vector3());

  root.position.set(
    position.x - center.x,
    -scaledBox.min.y + position.y,
    position.z - center.z,
  );

  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
