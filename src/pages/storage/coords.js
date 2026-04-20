import * as THREE from "three";

/**
 * 루트 기준 월드 AABB 변의 길이가 (widthX, heightY, depthZ) 미터가 되도록 비균등 scale 적용.
 */
export function fitRootToAxisAlignedDimensions(root, widthX, heightY, depthZ) {
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
  const s = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  root.scale.set(
    widthX / Math.max(s.x, 1e-9),
    heightY / Math.max(s.y, 1e-9),
    depthZ / Math.max(s.z, 1e-9)
  );
  root.updateMatrixWorld(true);
}
