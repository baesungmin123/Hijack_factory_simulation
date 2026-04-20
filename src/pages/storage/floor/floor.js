import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fitRootToAxisAlignedDimensions } from "../coords.js";

const TILE_URL = new URL("./_tile-factory.glb", import.meta.url).href;
const loader = new GLTFLoader();

/** Plane.001 — 블렌더 Dimensions → Three: 가로 X, 두께 Y, 세로 Z (m) */
const FLOOR_DIM_M = { widthX: 244, heightY: 0.812, depthZ: 243 };

/**
 * `_tile-factory.glb` 바닥: AABB를 블렌더와 동일 미터로 맞춘 뒤 위치 고정.
 * @param {THREE.Scene} scene
 * @returns {Promise<{ root: THREE.Object3D; getBounds: () => THREE.Box3 }>}
 */
export async function addTileFloor(scene) {
  const gltf = await loader.loadAsync(TILE_URL);
  const root = gltf.scene;

  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  fitRootToAxisAlignedDimensions(
    root,
    FLOOR_DIM_M.widthX,
    FLOOR_DIM_M.heightY,
    FLOOR_DIM_M.depthZ
  );

  root.position.set(-46.547, 4.231, 1.874);
  root.updateMatrixWorld(true);

  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}
