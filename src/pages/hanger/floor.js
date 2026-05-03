import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fitRootToAxisAlignedDimensions } from "../storage/coords.js";

const FLOOR_URL = new URL("../storage/floor/_tile-factory.glb", import.meta.url).href;
const loader = new GLTFLoader();

const FLOOR_DIM_M = { widthX: 244, heightY: 0.812, depthZ: 243 };

export async function addHangerFloor(scene) {
  const gltf = await loader.loadAsync(FLOOR_URL);
  const root = gltf.scene;
  root.name = "HangerFloor";
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
