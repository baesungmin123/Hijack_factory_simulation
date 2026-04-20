import * as THREE from "three";

/**
 * 창고 내부 조명 세트(천장등 + 보조광)를 추가합니다.
 * @param {THREE.Scene} scene
 * @returns {{ dispose: () => void }}
 */
export function addInsideLighting(scene) {
  const group = new THREE.Group();
  group.name = "StorageInsideLights";

  const ambient = new THREE.AmbientLight(0xffffff, 0.42);
  group.add(ambient);

  const key = new THREE.DirectionalLight(0xfff0d4, 1.25);
  key.position.set(7, 11, 6);
  group.add(key);

  const fill = new THREE.DirectionalLight(0x8eaad1, 0.58);
  fill.position.set(-7, 6, -8);
  group.add(fill);

  // 천장등 느낌의 포인트 조명 4개
  const lightX = [-7, -2.2, 2.2, 7];
  for (const x of lightX) {
    const bulb = new THREE.PointLight(0xfff3d9, 1.15, 26, 2);
    bulb.position.set(x, 6.7, -3.5);
    group.add(bulb);
  }

  // 상자(좌/우 4개씩, 총 8개) 집중 조명
  const boxColumnX = [-7.5, 7.5];
  const boxRowZ = [-13.0, -8.2, -3.4, 1.4];
  for (const x of boxColumnX) {
    for (const z of boxRowZ) {
      const boxFocus = new THREE.PointLight(0xffe7b0, 0.95, 7.5, 2.1);
      boxFocus.position.set(x, 2.15, z);
      group.add(boxFocus);
    }
  }

  scene.add(group);

  return {
    dispose() {
      scene.remove(group);
    },
  };
}
