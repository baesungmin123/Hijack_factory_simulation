import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const URL = "/assets/blend/_cutting_machine.glb";

export async function addCuttingMachine(scene, options = {}) {
  const {
    position = new THREE.Vector3(-9.47, 0, -17.37),
    rotationY = 0,
  } = options;

  const gltf = await loader.loadAsync(URL);
  const root = gltf.scene;
  root.name = "CuttingMachine";
  root.rotation.y = rotationY;
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(position.x - center.x, -box.min.y + position.y, position.z - center.z);

  scene.add(root);
  return { root, getBounds() { return new THREE.Box3().setFromObject(root); } };
}
