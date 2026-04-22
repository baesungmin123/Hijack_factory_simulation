import * as THREE from "three";

function buildFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const W = 1024, H = 1024;

  // 공장 내부 바닥 - 콘크리트 회색
  ctx.fillStyle = "#004B2E";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#FFC107";
  ctx.lineWidth = 7;

  const lOuter = 0.165 * W;
  const lInner = 0.355 * W;
  const rInner = 0.645 * W;
  const rOuter = 0.835 * W;
  const yTop   = 0.06  * H;
  const yJunct = 0.265 * H;

  ctx.beginPath();
  ctx.moveTo(lOuter, yTop);   ctx.lineTo(rOuter, yTop);   // 상단 가로선
  ctx.moveTo(lOuter, yTop);   ctx.lineTo(lOuter, yJunct); // 좌측 외측 세로선
  ctx.moveTo(lOuter, yJunct); ctx.lineTo(lInner, yJunct); // 좌측 접합 가로선
  ctx.moveTo(lInner, yJunct); ctx.lineTo(lInner, H);      // 좌측 내측 세로선 (접합부터 시작)
  ctx.moveTo(rInner, yJunct); ctx.lineTo(rInner, H);      // 우측 내측 세로선 (접합부터 시작)
  ctx.moveTo(rInner, yJunct); ctx.lineTo(rOuter, yJunct); // 우측 접합 가로선
  ctx.moveTo(rOuter, yTop);   ctx.lineTo(rOuter, yJunct); // 우측 외측 세로선
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

/**
 * 부품공장1 내부 바닥을 씬에 배치합니다.
 * @param {THREE.Scene} scene
 * @param {{ width?: number; depth?: number }} [options]
 * @returns {{ root: THREE.Mesh; getBounds: () => THREE.Box3 }}
 */
export function addPartsFactory1InsideFloor(scene, options = {}) {
  const { width = 26, depth = 21 } = options;

  const texture = buildFloorTexture();
  const geometry = new THREE.PlaneGeometry(width, depth);
  const material = new THREE.MeshLambertMaterial({ map: texture });

  scene.background = new THREE.Color(0xb0b0b0);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  return {
    root: mesh,
    getBounds() {
      return new THREE.Box3().setFromObject(mesh);
    },
  };
}
