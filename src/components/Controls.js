import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Perspective + Orthographic 듀얼 뷰, OrbitControls, 모드별 시점 스냅샷 유지.
 * @param {object} options
 * @param {THREE.WebGLRenderer} options.renderer
 * @param {HTMLElement} options.domElement
 * @param {THREE.Vector3} [options.target]
 * @param {number} [options.orthoD] Orthographic frustum half-height (d). 작을수록 확대.
 * @param {number} [options.perspectiveFov]
 * @param {number} [options.near]
 * @param {number} [options.far]
 */
export function createViewModeControls({
  renderer,
  domElement,
  target = new THREE.Vector3(0, 0, 0),
  orthoD = 3,
  perspectiveFov = 75,
  near = 0.01,
  far = 10000,
}) {
  const aspect0 =
    domElement.clientWidth / Math.max(1, domElement.clientHeight);

  const perspectiveCamera = new THREE.PerspectiveCamera(
    perspectiveFov,
    aspect0,
    near,
    far
  );
  perspectiveCamera.position.set(orthoD * 0.6, orthoD * 0.45, orthoD * 1.2);

  const orthographicCamera = new THREE.OrthographicCamera(
    -orthoD * aspect0,
    orthoD * aspect0,
    orthoD,
    -orthoD,
    near,
    far
  );
  orthographicCamera.position.set(orthoD, orthoD, orthoD);
  orthographicCamera.lookAt(target);
  orthographicCamera.zoom = 1;

  const controlsPerspective = new OrbitControls(
    perspectiveCamera,
    domElement
  );
  const controlsOrthographic = new OrbitControls(
    orthographicCamera,
    domElement
  );

  for (const c of [controlsPerspective, controlsOrthographic]) {
    c.target.copy(target);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
  }

  controlsOrthographic.minPolarAngle = 0;
  controlsOrthographic.maxPolarAngle = Math.PI / 2;
  controlsOrthographic.enableRotate = false;
  controlsOrthographic.enablePan = true;
  controlsOrthographic.enableZoom = true;

  /** @type {'perspective' | 'orthographic'} */
  let mode = "perspective";

  /** @type {Record<'perspective' | 'orthographic', null | { position: THREE.Vector3; quaternion: THREE.Quaternion; target: THREE.Vector3; zoom: number }>} */
  const snapshots = {
    perspective: null,
    orthographic: null,
  };

  function getActiveCamera() {
    return mode === "perspective" ? perspectiveCamera : orthographicCamera;
  }

  function getActiveControls() {
    return mode === "perspective" ? controlsPerspective : controlsOrthographic;
  }

  function applyDefaultPose(which) {
    if (which === "perspective") {
      perspectiveCamera.position.set(orthoD * 0.6, orthoD * 0.45, orthoD * 1.2);
      perspectiveCamera.quaternion.identity();
      perspectiveCamera.zoom = 1;
      perspectiveCamera.updateProjectionMatrix();
      controlsPerspective.target.copy(target);
    } else {
      orthographicCamera.position.set(orthoD, orthoD, orthoD);
      orthographicCamera.quaternion.identity();
      orthographicCamera.zoom = 1;
      orthographicCamera.lookAt(target);
      orthographicCamera.updateProjectionMatrix();
      controlsOrthographic.target.copy(target);
    }
  }

  function saveSnapshot(which) {
    const cam =
      which === "perspective" ? perspectiveCamera : orthographicCamera;
    const ctl =
      which === "perspective" ? controlsPerspective : controlsOrthographic;
    snapshots[which] = {
      position: cam.position.clone(),
      quaternion: cam.quaternion.clone(),
      target: ctl.target.clone(),
      zoom: cam.zoom,
    };
  }

  function applySnapshot(which) {
    const snap = snapshots[which];
    const cam =
      which === "perspective" ? perspectiveCamera : orthographicCamera;
    const ctl =
      which === "perspective" ? controlsPerspective : controlsOrthographic;

    if (snap) {
      cam.position.copy(snap.position);
      cam.quaternion.copy(snap.quaternion);
      cam.zoom = snap.zoom;
      ctl.target.copy(snap.target);
      cam.updateProjectionMatrix();
    } else {
      applyDefaultPose(which);
    }
    ctl.update();
  }

  function setControlsEnabled(which, enabled) {
    const ctl =
      which === "perspective" ? controlsPerspective : controlsOrthographic;
    ctl.enabled = enabled;
  }

  /**
   * @param {'perspective' | 'orthographic'} next
   */
  function setMode(next) {
    if (next === mode) return;

    saveSnapshot(mode);

    setControlsEnabled(mode, false);
    mode = next;
    setControlsEnabled(mode, true);

    applySnapshot(mode);
    getActiveControls().update();
  }

  function updateOrthographicFrustum(width, height) {
    const aspect = width / Math.max(1, height);
    orthographicCamera.left = -orthoD * aspect;
    orthographicCamera.right = orthoD * aspect;
    orthographicCamera.top = orthoD;
    orthographicCamera.bottom = -orthoD;
    orthographicCamera.updateProjectionMatrix();
  }

  function resize(width, height) {
    const aspect = width / Math.max(1, height);
    perspectiveCamera.aspect = aspect;
    perspectiveCamera.updateProjectionMatrix();
    updateOrthographicFrustum(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
  }

  function update() {
    getActiveControls().update();
  }

  setControlsEnabled("perspective", true);
  setControlsEnabled("orthographic", false);
  controlsPerspective.update();
  controlsOrthographic.update();

  function dispose() {
    controlsPerspective.dispose();
    controlsOrthographic.dispose();
  }

  return {
    perspectiveCamera,
    orthographicCamera,
    getActiveCamera,
    getMode: () => mode,
    setMode,
    update,
    resize,
    dispose,
    /** 외부에서 look-at 대상이 바뀔 때 공통 target 갱신용 */
    setTarget(v) {
      target.copy(v);
      controlsPerspective.target.copy(v);
      controlsOrthographic.target.copy(v);
      controlsPerspective.update();
      controlsOrthographic.update();
    },
    getTarget() {
      return getActiveControls().target.clone();
    },
    fitToBounds(box) {
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      const center = sphere.center;
      const r = Math.max(sphere.radius, 0.01);
      const viewDir = new THREE.Vector3(30, 24, 28).normalize();
      const distance = Math.max(r * 1.78, 40);

      for (const cam of [perspectiveCamera, orthographicCamera]) {
        cam.position.copy(center).addScaledVector(viewDir, distance);
        cam.updateProjectionMatrix();
      }

      target.copy(center);
      controlsPerspective.target.copy(center);
      controlsOrthographic.target.copy(center);
      controlsPerspective.update();
      controlsOrthographic.update();

      snapshots.perspective = {
        position: perspectiveCamera.position.clone(),
        quaternion: perspectiveCamera.quaternion.clone(),
        target: center.clone(),
        zoom: perspectiveCamera.zoom,
      };
      snapshots.orthographic = {
        position: orthographicCamera.position.clone(),
        quaternion: orthographicCamera.quaternion.clone(),
        target: center.clone(),
        zoom: orthographicCamera.zoom,
      };
    },
  };
}
