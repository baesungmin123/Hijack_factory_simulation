import "./style.css";
import * as THREE from "three";
import { addSunStyleLighting } from "./components/Light.js";
import { mountSidebar } from "./components/Sidebar.js";
import { initStorageApp } from "./pages/storage/storage_main.js";
import { initStorageInsideApp } from "./pages/storage_inside/storage_inside_main.js";
import { initPartsFactory1App } from "./pages/parts_factory1/factory1_main.js";
import { initPartsFactory1InsideApp } from "./pages/parts_factory1_inside/parts1_inside_main.js";
import { initPartsFactory1App as initJoinFactory1App } from "./pages/join_factory1/join_factory1_main.js";
import { initPartsFactory1App as initJoinFactory2App } from "./pages/join_factory2/join_factory2_main.js";
import { initPartsFactory1App as initPartsFactory2App } from "./pages/parts_factory2/factory2_main.js";
import { initPartsFactory2InsideApp } from "./pages/parts_factory2_inside/parts2_inside_main.js";
import { initJoinFactory1InsideApp } from "./pages/join_factory1_inside/join1_inside_main.js";
import { initJoinFactory2InsideApp } from "./pages/join_factory2_inside/join2_inside_main.js";
import { initTransferApp as initTransfer1App } from "./pages/transfer1/transfer_main.js";
import { initTransferApp as initTransfer2App } from "./pages/transfer2/transfer_main.js";

const canvas = document.querySelector("#app");
if (!canvas) {
  throw new Error("Canvas element '#app' not found.");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe7ff);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

addSunStyleLighting(scene);
mountSidebar();

function setSidebarCurrentScreen(name) {
  window.dispatchEvent(
    new CustomEvent("app:current-screen", { detail: { name } })
  );
}

function clearSceneObjects(targetScene) {
  for (let i = targetScene.children.length - 1; i >= 0; i -= 1) {
    targetScene.remove(targetScene.children[i]);
  }
}

function ensureFadeOverlay() {
  const id = "scene-fade-overlay";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      "position:fixed;inset:0;background:#000;transform:translateX(100%);pointer-events:none;transition:transform 420ms cubic-bezier(.22,.61,.36,1);will-change:transform;z-index:2000;";
    document.body.appendChild(el);
  }
  return el;
}

function fadeToBlack() {
  const overlay = ensureFadeOverlay();
  overlay.style.transform = "translateX(100%)";
  requestAnimationFrame(() => {
    overlay.style.transform = "translateX(0)";
  });
  return new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });
}

function revealFromBlack() {
  const overlay = ensureFadeOverlay();
  overlay.style.transform = "translateX(-100%)";
}

let currentApp = null;
let currentPage = "storage";

function switchToStorageInside() {
  if (currentPage === "storage-inside") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    currentApp = initStorageInsideApp({ scene, renderer, canvas });
    currentPage = "storage-inside";
    setSidebarCurrentScreen("창고 내부");
    revealFromBlack();
  });
}

function switchToStoragePage() {
  if (currentPage === "storage") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xcfe7ff);
    addSunStyleLighting(scene);
    currentApp = initStorageApp({
      scene,
      renderer,
      canvas,
      onEnterStorageInside: switchToStorageInside,
    });
    currentPage = "storage";
    setSidebarCurrentScreen("원재료 창고");
    revealFromBlack();
  });
}

function switchToPartsFactory1Page() {
  if (currentPage === "parts-factory1") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xc7d9ee);
    addSunStyleLighting(scene);
    currentApp = initPartsFactory1App({
      scene,
      renderer,
      canvas,
      onEnterPartsFactory1Inside: switchToPartsFactory1InsidePage,
    });
    currentPage = "parts-factory1";
    setSidebarCurrentScreen("부품공장(머리 + 몸통)");
    revealFromBlack();
  });
}

function switchToPartsFactory1InsidePage() {
  if (currentPage === "parts-factory1-inside") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    currentApp = initPartsFactory1InsideApp({ scene, renderer, canvas });
    currentPage = "parts-factory1-inside";
    setSidebarCurrentScreen("부품공장1 내부");
    revealFromBlack();
  });
}

function switchToPartsFactory2Page() {
  if (currentPage === "parts-factory2") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xc7d9ee);
    addSunStyleLighting(scene);
    currentApp = initPartsFactory2App({
      scene,
      renderer,
      canvas,
      onEnterInside: switchToPartsFactory2InsidePage,
    });
    currentPage = "parts-factory2";
    setSidebarCurrentScreen("부품공장(팔 + 다리)");
    revealFromBlack();
  });
}

function switchToPartsFactory2InsidePage() {
  if (currentPage === "parts-factory2-inside") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    currentApp = initPartsFactory2InsideApp({ scene, renderer, canvas });
    currentPage = "parts-factory2-inside";
    setSidebarCurrentScreen("부품공장2 내부");
    revealFromBlack();
  });
}

function switchToJoinFactory1Page() {
  if (currentPage === "join-factory1") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xc7d9ee);
    addSunStyleLighting(scene);
    currentApp = initJoinFactory1App({
      scene,
      renderer,
      canvas,
      onEnterInside: switchToJoinFactory1InsidePage,
    });
    currentPage = "join-factory1";
    setSidebarCurrentScreen("조립공장(몸통+다리+팔)");
    revealFromBlack();
  });
}

function switchToJoinFactory1InsidePage() {
  if (currentPage === "join-factory1-inside") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    currentApp = initJoinFactory1InsideApp({ scene, renderer, canvas });
    currentPage = "join-factory1-inside";
    setSidebarCurrentScreen("조립공장1 내부");
    revealFromBlack();
  });
}

function switchToJoinFactory2Page() {
  if (currentPage === "join-factory2") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xc7d9ee);
    addSunStyleLighting(scene);
    currentApp = initJoinFactory2App({
      scene,
      renderer,
      canvas,
      onEnterInside: switchToJoinFactory2InsidePage,
    });
    currentPage = "join-factory2";
    setSidebarCurrentScreen("조립공장(최종)");
    revealFromBlack();
  });
}

function switchToJoinFactory2InsidePage() {
  if (currentPage === "join-factory2-inside") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    currentApp = initJoinFactory2InsideApp({ scene, renderer, canvas });
    currentPage = "join-factory2-inside";
    setSidebarCurrentScreen("조립공장2 내부");
    revealFromBlack();
  });
}

function switchToTransfer1Page() {
  if (currentPage === "transfer1") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xc7d9ee);
    addSunStyleLighting(scene);
    currentApp = initTransfer1App({ scene, renderer, canvas });
    currentPage = "transfer1";
    setSidebarCurrentScreen("이송라인");
    revealFromBlack();
  });
}

function switchToTransfer2Page() {
  if (currentPage === "transfer2") return;
  fadeToBlack().then(() => {
    currentApp?.dispose?.();
    clearSceneObjects(scene);
    scene.background = new THREE.Color(0xc7d9ee);
    addSunStyleLighting(scene);
    currentApp = initTransfer2App({ scene, renderer, canvas });
    currentPage = "transfer2";
    setSidebarCurrentScreen("이송라인");
    revealFromBlack();
  });
}

window.addEventListener("app:sidebar-menu", (event) => {
  const key = event?.detail?.key;
  if (key === "storage") {
    switchToStoragePage();
    return;
  }
  if (key === "parts-a") {
    switchToPartsFactory1Page();
    return;
  }
  if (key === "parts-b") {
    switchToPartsFactory2Page();
    return;
  }
  if (key === "assembly-a") {
    switchToJoinFactory1Page();
    return;
  }
  if (key === "assembly-b") {
    switchToJoinFactory2Page();
    return;
  }
  if (key === "line") {
    switchToTransfer1Page();
    return;
  }
});

window.addEventListener("app:transfer-route", (event) => {
  const route = event?.detail?.route;
  if (route === "storage-to-assembly") {
    switchToTransfer1Page();
    return;
  }
  if (route === "final-to-hangar") {
    switchToTransfer2Page();
    return;
  }
});

currentApp = initStorageApp({
  scene,
  renderer,
  canvas,
  onEnterStorageInside: switchToStorageInside,
});
setSidebarCurrentScreen("원재료 창고");
revealFromBlack();
