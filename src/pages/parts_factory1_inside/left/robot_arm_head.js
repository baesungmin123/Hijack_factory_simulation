import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const URL = "/assets/blend/robotarm_animation_head.glb";

export async function addRobotArmHead(scene, options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 51.37),
    rotationY = 0,
  } = options;

  const gltf = await loader.loadAsync(URL);
  const root = gltf.scene;
  root.name = "RobotArmHead";
  root.rotation.y = rotationY;
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(position.x - center.x, -box.min.y + position.y, position.z - center.z);

  scene.add(root);

  const mixer = new THREE.AnimationMixer(root);
  const actions = gltf.animations.map(clip => {
    const action = mixer.clipAction(clip);
    action.loop = THREE.LoopOnce;
    action.clampWhenFinished = true;
    action.play();
    action.paused = true;
    return action;
  });

  return { root, mixer, actions, getBounds() { return new THREE.Box3().setFromObject(root); } };
}
