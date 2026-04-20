import * as THREE from "three";

/**
 * 태양광에 가깝게: 낮은 헤미스피어(하늘·지면 반사) + 따뜻한 방향광.
 * @param {THREE.Scene} scene
 * @returns {{ hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight }}
 */
export function addSunStyleLighting(scene) {
  const hemi = new THREE.HemisphereLight(
    0xbfdfff,
    0x5b4a38,
    0.38
  );
  hemi.name = "SunHemi";
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1d0, 3.1);
  sun.name = "SunDir";
  sun.position.set(95, 145, 62);
  sun.target.position.set(-25, 0, -10);
  scene.add(sun);
  scene.add(sun.target);

  return { hemi, sun };
}
