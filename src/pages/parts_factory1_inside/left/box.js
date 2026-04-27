import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const URL = "/assets/blend/titans_box3.glb";

export async function addBox(scene, options = {}) {
  const {
    position = new THREE.Vector3(9.48, 0, 65.16),
    rotationY = 0,
  } = options;

  const gltf = await loader.loadAsync(URL);
  const root = gltf.scene;
  root.name = "Box";
  root.scale.setScalar(1.5);
  root.rotation.y = rotationY;
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(position.x - center.x, -box.min.y + position.y, position.z - center.z);

  scene.add(root);
  return { root, getBounds() { return new THREE.Box3().setFromObject(root); } };
}
