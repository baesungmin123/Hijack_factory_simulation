import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const URL = "/assets/blend/press.glb";

export async function addPress(scene, options = {}) {
  const {
    position = new THREE.Vector3(12.06, 0, 33.90),
    rotationY = 0,
  } = options;

  const gltf = await loader.loadAsync(URL);
  const root = gltf.scene;
  root.name = "Press";
  root.rotation.y = rotationY;
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(position.x - center.x, -box.min.y + position.y, position.z - center.z);

  scene.add(root);
  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
