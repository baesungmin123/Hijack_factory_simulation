import * as THREE from "three";

/** 기존 시선 방향(30, 24, 28)과 비슷한 각도 유지 */
const VIEW_DIR = new THREE.Vector3(30, 24, 28).normalize();

/**
 * 부품/조립 공장 씬: 모델 전체가 보이도록 카메라를 바깥쪽으로 둡니다.
 * (고정 오프셋은 모델이 크면 시야 안에 들어오지 않거나 너무 가깝게 붙습니다.)
 *
 * @param {THREE.Box3} combinedBox
 * @param {THREE.Camera} camera
 * @param {{ setTarget: (v: THREE.Vector3) => void }} viewControls
 */
export function applyFactoryPerspectiveFrame(combinedBox, camera, viewControls) {
  const sphere = new THREE.Sphere();
  combinedBox.getBoundingSphere(sphere);
  const center = sphere.center;
  const r = Math.max(sphere.radius, 0.01);

  const distance = Math.max(r * 1.78, 40);
  camera.position.copy(center).addScaledVector(VIEW_DIR, distance);
  viewControls.setTarget(center);
  camera.updateProjectionMatrix();
}
