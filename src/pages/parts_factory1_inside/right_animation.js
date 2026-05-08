import * as THREE from "three";
import { addConveyor } from "./right/conveyor.js";
import { addCuttingMachine } from "./right/cutting_machine.js";
import { addRobotArm1 } from "./right/robot_arm1.js";
import { addRobotArmBody } from "./right/robot_arm_body.js";
import { addPress } from "./right/press.js";
import { addXF6300 } from "./right/xf6300.js";
import { addBox } from "./right/box.js";

export function initRightAnimation(scene) {
  addConveyor(scene, { position: new THREE.Vector3(97.089, 0, -34.448) }).catch(console.error);
  addCuttingMachine(scene, { position: new THREE.Vector3(97.692, 0, -17.059), rotationY: Math.PI }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(97.232, 0, 0.073) }).catch(console.error);
  addRobotArm1(scene, { position: new THREE.Vector3(92.369, 0, 0.088), rotationY: Math.PI }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(77.909, 0, 0.073) }).catch(console.error);
  addPress(scene, { position: new THREE.Vector3(70, 0, 0.088), rotationY: Math.PI }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(77.924, 0, 18.926) }).catch(console.error);
  addXF6300(scene, { position: new THREE.Vector3(76.326, 0, 38), rotationY: Math.PI }).catch(console.error);
  addConveyor(scene, { position: new THREE.Vector3(77.975, 0, 48.653) }).catch(console.error);
  addRobotArmBody(scene, { position: new THREE.Vector3(86, 0, 50), rotationY: Math.PI * 2 }).catch(console.error);
  addBox(scene, { position: new THREE.Vector3(79.313, 0, 65.163), rotationY: Math.PI }).catch(console.error);

  return { update(_delta) {} };
}
