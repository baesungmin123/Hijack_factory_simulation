import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FLOOR_URL = "/assets/blend/join2_tile.glb";
const loader = new GLTFLoader();

export async function addJoinFactory2InsideFloor(scene, options = {}) {
  const { scale = 1, position = new THREE.Vector3(0, 0, 0) } = options;
  const gltf = await loader.loadAsync(FLOOR_URL);
  const root = gltf.scene;
  root.name = "JoinFactory2InsideFloor";
  root.scale.setScalar(scale);
  root.position.copy(position);
  root.updateMatrixWorld(true);
  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
