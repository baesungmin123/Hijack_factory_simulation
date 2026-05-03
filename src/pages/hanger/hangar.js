import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fitRootToAxisAlignedDimensions } from "../storage/coords.js";

const HANGAR_URL = "/assets/blend/storage.glb";
const HANGAR_DIM_M = { widthX: 59.9, heightY: 28.7, depthZ: 47.5 };
const HANGAR_X_NUDGE = -30;
const HANGAR_Y_NUDGE = 1.0;

const loader = new GLTFLoader();

/**
 * 격납고 모델 3개를 씬에 배치합니다.
 * @param {THREE.Scene} scene
 * @returns {Promise<{ center: THREE.Object3D; bounds: THREE.Box3 }>}
 */
export async function addHangarModels(scene) {
  const gltf = await loader.loadAsync(HANGAR_URL);
  const template = gltf.scene;
  template.scale.set(1, 1, 1);
  template.updateMatrixWorld(true);

  const spawn = () => {
    const root = template.clone(true);
    root.rotation.set(0, 0, 0);
    fitRootToAxisAlignedDimensions(
      root,
      HANGAR_DIM_M.widthX,
      HANGAR_DIM_M.heightY,
      HANGAR_DIM_M.depthZ
    );
    scene.add(root);
    return root;
  };

  const center = spawn();
  center.position.set(-68.465 + HANGAR_X_NUDGE, 5.225 + HANGAR_Y_NUDGE, 1.520);
  center.updateMatrixWorld(true);

  const b = spawn();
  b.position.set(-114.94 + HANGAR_X_NUDGE, 5.225 + HANGAR_Y_NUDGE, 99.361);
  b.updateMatrixWorld(true);

  const c = spawn();
  c.position.set(-114.94 + HANGAR_X_NUDGE, 5.225 + HANGAR_Y_NUDGE, -94.364);
  c.updateMatrixWorld(true);

  const bounds = new THREE.Box3()
    .setFromObject(center)
    .union(new THREE.Box3().setFromObject(b))
    .union(new THREE.Box3().setFromObject(c));

  return { center, bounds };
}
