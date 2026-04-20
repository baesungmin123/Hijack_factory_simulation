import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const BOX_URL = "/assets/blend/titans_box3.glb";

export async function addStorageMaterials(scene) {
  const gltf = await loader.loadAsync(BOX_URL);
  const template = gltf.scene;

  template.scale.set(1, 1, 1);
  template.rotation.set(0, 0, 0);
  template.position.set(0, 0, 0);
  template.updateMatrixWorld(true);
  const baseBox = new THREE.Box3().setFromObject(template);
  const size = baseBox.getSize(new THREE.Vector3());
  const baseW = Math.max(size.x, 1e-6);
  const baseH = Math.max(size.y, 1e-6);
  const baseD = Math.max(size.z, 1e-6);
  const baseMinY = baseBox.min.y;

  const root = new THREE.Group();
  root.name = "StorageMaterials";

  const targetW = 4.5;
  const uniformScale = targetW / baseW;
  const stepY = baseH * uniformScale * 1.02;
  const gapX = baseW * uniformScale * 1.1;
  // ✅ 간격 확대
  const gapZ = baseD * uniformScale * 1.8;
  const floorContactY = -baseMinY * uniformScale;

  template.traverse((child) => {
    if (child.isMesh) child.rotation.set(0, 0, 0);
  });

  const palletMat = new THREE.MeshStandardMaterial({
    color: 0x8b6914,
    roughness: 0.9,
    metalness: 0.0,
  });

  function createPallet(x, z) {
    const palletW = targetW * 1.1;
    const palletD = baseD * uniformScale * 1.1;
    const palletH = 0.18;

    const palletGroup = new THREE.Group();

    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xa0762a,
      roughness: 0.92,
      metalness: 0.0,
    });
    const boardH = 0.045;
    const boardGeo = new THREE.BoxGeometry(palletW, boardH, palletD * 0.28);
    for (let i = 0; i < 3; i++) {
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(x, palletH - boardH / 2, z + (i - 1) * (palletD * 0.34));
      palletGroup.add(board);
    }

    const legGeo = new THREE.BoxGeometry(palletW, palletH * 0.7, palletD * 0.18);
    for (let i = 0; i < 2; i++) {
      const leg = new THREE.Mesh(legGeo, palletMat);
      leg.position.set(x, palletH * 0.35, z + (i === 0 ? -1 : 1) * (palletD * 0.38));
      palletGroup.add(leg);
    }

    return palletGroup;
  }

  function addColumn(boxX, palletX, startZ, count) {
    for (let i = 0; i < count; i += 1) {
      const z = startZ + i * gapZ;
  
      // 팔레트는 palletX 기준
      const pallet = createPallet(palletX, z);
      root.add(pallet);
  
      const palletH = 0.18;
      const box = template.clone(true);
      box.scale.setScalar(uniformScale);
      box.rotation.set(0, 0, 0);
      // 상자는 boxX 기준
      box.position.set(boxX, floorContactY + palletH, z);
      root.add(box);
    }
  }
  
  // 팔레트만 왼쪽으로 조정 (palletX를 boxX보다 작게)
  addColumn(-6.0, -7.0, -13.0, 4);  // 좌열: 상자 -6.0, 팔레트 -7.0
  addColumn( 9.0,  8.0, -13.0, 4);  // 우열: 상자 9.0,  팔레트 8.0
  scene.add(root);

  return {
    root,
    getBounds() {
      return new THREE.Box3().setFromObject(root);
    },
    dispose() {
      root.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      scene.remove(root);
    },
  };
}