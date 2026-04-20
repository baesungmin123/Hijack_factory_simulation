import * as THREE from "three";

/**
 * 보관소 내부 느낌의 바닥/벽/적재물 세트를 추가합니다.
 * @param {THREE.Scene} scene
 * @returns {{ root: THREE.Group; getBounds: () => THREE.Box3 }}
 */
export function addStorageInsideSet(scene) {
  const root = new THREE.Group();
  root.name = "StorageInsideSet";

  const concrete = new THREE.MeshStandardMaterial({
    color: 0x5f6368,
    roughness: 0.95,
    metalness: 0.05,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x4c5058,
    roughness: 0.9,
    metalness: 0.02,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xe7c84c,
    roughness: 0.65,
    metalness: 0.05,
  });

  // 바닥
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.25, 34),
    concrete
  );
  floor.position.set(0, -0.125, 0);
  root.add(floor);

  // 벽 (뒷면 + 좌우)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 8, 0.35), wallMat);
  backWall.position.set(0, 4, -16.9);
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 8, 34), wallMat);
  leftWall.position.set(-11.9, 4, 0);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 8, 34), wallMat);
  rightWall.position.set(11.9, 4, 0);
  root.add(rightWall);

  // 천장 보 느낌
  const beamGeo = new THREE.BoxGeometry(24, 0.25, 0.35);
  for (let i = 0; i < 6; i += 1) {
    const beam = new THREE.Mesh(beamGeo, wallMat);
    beam.position.set(0, 7.3, -14 + i * 5.2);
    root.add(beam);
  }

  // 바닥 안전 라인
  const stripeGeo = new THREE.BoxGeometry(0.22, 0.01, 30);
  const s1 = new THREE.Mesh(stripeGeo, stripeMat);
  s1.position.set(-4.1, 0.02, -1.5);
  const s2 = new THREE.Mesh(stripeGeo, stripeMat);
  s2.position.set(4.1, 0.02, -1.5);
  root.add(s1, s2);

  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
  };
}