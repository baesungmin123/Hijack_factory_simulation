import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FACTORY_URL = "/assets/blend/factory.glb";
const loader = new GLTFLoader();

/**
 * 조립공장1 메인 건물(factory.glb)을 중앙에 배치합니다.
 * @param {THREE.Scene} scene
 * @param {{ tileBounds: THREE.Box3; scale?: number }} options
 * @returns {Promise<{ root: THREE.Object3D; getBounds: () => THREE.Box3 }>}
 */
export async function addPartsFactory1Building(scene, options) {
  const { tileBounds, scale = 1 } = options;
  const FACTORY_Y_OFFSET = 1.2;

  const gltf = await loader.loadAsync(FACTORY_URL);
  const root = gltf.scene;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  // 타일 중앙에 맞추고 바닥면(y=tile.min.y)에 앉힘
  const tileCenter = tileBounds.getCenter(new THREE.Vector3());
  const box = new THREE.Box3().setFromObject(root);
  const modelCenter = box.getCenter(new THREE.Vector3());
  root.position.set(
    tileCenter.x - modelCenter.x,
    tileBounds.min.y - box.min.y + FACTORY_Y_OFFSET,
    tileCenter.z - modelCenter.z
  );
  root.updateMatrixWorld(true);

  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
