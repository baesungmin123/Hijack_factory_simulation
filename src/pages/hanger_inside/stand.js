import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STAND_URL = "/assets/blend/stand.glb";
const loader = new GLTFLoader();

const STANDS = [
  { x: -3.935,  z: -30.2589, ry: Math.PI / 2 },
  { x: -3.935,  z:  -8.3156, ry: Math.PI / 2 },
  { x: -3.935,  z:  13.819,  ry: Math.PI / 2 },
  { x: -3.935,  z:  35.953,  ry: Math.PI / 2 },
  { x: -3.935,  z:  58.088,  ry: Math.PI / 2 },
  { x: 91.694,  z: -30.373,  ry: -Math.PI / 2 },
  { x: 91.694,  z:  -8.2387, ry: -Math.PI / 2 },
  { x: 91.694,  z:  13.896,  ry: -Math.PI / 2 },
  { x: 91.694,  z:  36.032,  ry: -Math.PI / 2 },
  { x: 91.694,  z:  57.972,  ry: -Math.PI / 2 },
];

export async function addStands(scene) {
  const gltf = await loader.loadAsync(STAND_URL);
  const template = gltf.scene;
  template.updateMatrixWorld(true);

  const roots = [];
  for (const { x, z, ry } of STANDS) {
    const root = template.clone(true);
    root.position.set(x, 0, z);
    root.rotation.set(0, ry, 0);
    root.updateMatrixWorld(true);
    scene.add(root);
    roots.push(root);
  }

  return { roots };
}
