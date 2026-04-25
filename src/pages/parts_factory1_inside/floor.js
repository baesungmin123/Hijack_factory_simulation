import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FLOOR_URL = "/assets/blend/parts_floor.glb";
const loader = new GLTFLoader();

/**
 * 부품공장1 내부 바닥 GLB(parts_floor.glb)를 씬에 배치합니다.
 * @param {THREE.Scene} scene
 * @param {{ scale?: number; position?: THREE.Vector3 }} [options]
 * @returns {Promise<{ root: THREE.Object3D; getBounds: () => THREE.Box3 }>}
 */
export async function addPartsFactory1InsideFloor(scene, options = {}) {
  const { scale = 1, position = new THREE.Vector3(0, 0, 0) } = options;
  const gltf = await loader.loadAsync(FLOOR_URL);
  const root = gltf.scene;
  root.name = "PartsFactory1InsideFloor";
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
