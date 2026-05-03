import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FLOOR_URL = "/assets/blend/hanger_tile.glb";
const loader = new GLTFLoader();

export async function addHangerInsideFloor(scene) {
  const gltf = await loader.loadAsync(FLOOR_URL);
  const root = gltf.scene;
  root.name = "HangerInsideFloor";
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
