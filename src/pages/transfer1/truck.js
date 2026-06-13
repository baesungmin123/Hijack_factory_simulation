import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const TRUCK_URL = "/assets/blend/_truckblend.glb";
const loader = new GLTFLoader();

const ROAD1_Z = 5.313;
const ROAD2_Z = -6.349;
const TRUCK_SPEED = 20;
const TRUCK_SCALE = 0.5;
const TRUCK_Y = 5.0;

export async function addTrucks(scene, floorBox) {
  const gltf = await loader.loadAsync(TRUCK_URL);
  const template = gltf.scene;
  template.updateMatrixWorld(true);

  const minX = floorBox.min.x;
  const maxX = floorBox.max.x;

  const activeTrucks = []; // { mesh, dir, endX }

  function trigger() {
    const truck1 = template.clone(true);
    truck1.scale.setScalar(TRUCK_SCALE);
    truck1.position.set(minX, TRUCK_Y, ROAD1_Z);
    truck1.rotation.y = 0;
    scene.add(truck1);
    activeTrucks.push({ mesh: truck1, dir: 1, endX: maxX });

    const truck2 = template.clone(true);
    truck2.scale.setScalar(TRUCK_SCALE);
    truck2.position.set(maxX, TRUCK_Y, ROAD2_Z);
    truck2.rotation.y = Math.PI;
    scene.add(truck2);
    activeTrucks.push({ mesh: truck2, dir: -1, endX: minX });
  }

  function update(delta) {
    for (let i = activeTrucks.length - 1; i >= 0; i--) {
      const t = activeTrucks[i];
      t.mesh.position.x += TRUCK_SPEED * delta * t.dir;
      const done = t.dir > 0
        ? t.mesh.position.x >= t.endX
        : t.mesh.position.x <= t.endX;
      if (done) {
        scene.remove(t.mesh);
        activeTrucks.splice(i, 1);
      }
    }
  }

  return { update, trigger };
}
