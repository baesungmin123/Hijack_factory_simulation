import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const TRANSFER_FLOOR_URL = "/assets/blend/transfer_tile.glb";
const loader = new GLTFLoader();

/**
 * 이송라인 바닥(transfer_tile.glb)을 씬에 배치합니다.
 * @param {THREE.Scene} scene
 * @param {{ scale?: number }} [options]
 * @returns {Promise<{ root: THREE.Object3D; getBounds: () => THREE.Box3 }>}
 */
export async function addTransferFloor(scene, options = {}) {
  const { scale = 1 } = options;

  const gltf = await loader.loadAsync(TRANSFER_FLOOR_URL);
  const root = gltf.scene;
  root.scale.setScalar(scale);
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);

  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
