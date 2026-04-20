import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

export async function addStorageModel(scene, options = {}) {
  const {
    url = "/storage.glb",
    position = new THREE.Vector3(0, 0, 0),
    scale = new THREE.Vector3(1, 1, 1),
    rotationY = 0,
    centerToOrigin = true,
    placeOnFloor = true,
  } = options;

  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.scale.copy(scale);

  if (centerToOrigin) {
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);
  }

  if (placeOnFloor) {
    const box = new THREE.Box3().setFromObject(root);
    root.position.y -= box.min.y;
  }

  root.rotation.y = rotationY;
  root.position.add(position);
  scene.add(root);
  return root;
}
