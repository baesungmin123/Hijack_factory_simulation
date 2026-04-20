import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FLOOR_URL = "/assets/blend/factory_tile.glb";
const loader = new GLTFLoader();

/**
 * 조립공장1 바닥 타일(factory_tile.glb)을 씬에 배치합니다.
 * @param {THREE.Scene} scene
 * @param {{ scale?: number }} [options]
 * @returns {Promise<{ root: THREE.Object3D; getBounds: () => THREE.Box3 }>}
 */
export async function addPartsFactory1Floor(scene, options = {}) {
  const { scale = 1 } = options;

  const gltf = await loader.loadAsync(FLOOR_URL);
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
