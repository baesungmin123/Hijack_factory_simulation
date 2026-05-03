const COLS = 16;
const ROWS = 10;
const MAX_DIAG = (COLS - 1) + (ROWS - 1);
const STEP_MS = 35;

let _sceneReady = Promise.resolve();
let _dotsInterval = null;

export function setSceneReady(promise) {
  _sceneReady = promise ?? Promise.resolve();
}

function ensureCheckerOverlay() {
  const id = "scene-checker-overlay";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "checker-overlay";
    for (let i = 0; i < COLS * ROWS; i++) {
      const tile = document.createElement("div");
      tile.className = "checker-tile";
      tile.dataset.idx = i;
      el.appendChild(tile);
    }
    const wrap = document.createElement("div");
    wrap.className = "checker-loading-wrap";

    const icon = document.createElement("img");
    icon.className = "checker-loading-icon";
    icon.alt = "";

    const text = document.createElement("div");
    text.className = "checker-loading-text";

    wrap.appendChild(icon);
    wrap.appendChild(text);
    el.appendChild(wrap);
    document.body.appendChild(el);
  }
  return el;
}

function showLoadingText(overlay, iconUrl) {
  const wrap = overlay.querySelector(".checker-loading-wrap");
  const icon = overlay.querySelector(".checker-loading-icon");
  const text = overlay.querySelector(".checker-loading-text");
  if (!wrap) return;

  if (icon) {
    icon.src = iconUrl || "";
    icon.style.display = iconUrl ? "block" : "none";
  }

  let count = 1;
  text.textContent = "LOADING.";
  wrap.style.display = "flex";

  if (_dotsInterval) clearInterval(_dotsInterval);
  _dotsInterval = setInterval(() => {
    count = (count % 3) + 1;
    text.textContent = "LOADING" + ".".repeat(count);
  }, 400);
}

function hideLoadingText(overlay) {
  const wrap = overlay.querySelector(".checker-loading-wrap");
  if (wrap) wrap.style.display = "none";
  if (_dotsInterval) { clearInterval(_dotsInterval); _dotsInterval = null; }
}

export function fadeToBlack(iconUrl) {
  const overlay = ensureCheckerOverlay();
  const tiles = overlay.querySelectorAll(".checker-tile");
  hideLoadingText(overlay);
  tiles.forEach((t) => t.classList.remove("on"));

  tiles.forEach((t, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const diag = (COLS - 1 - col) + row;
    setTimeout(() => t.classList.add("on"), diag * STEP_MS);
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      showLoadingText(overlay, iconUrl);
      resolve();
    }, MAX_DIAG * STEP_MS + 80);
  });
}

export function revealFromBlack() {
  _sceneReady.then(() => {
    const overlay = ensureCheckerOverlay();
    hideLoadingText(overlay);
    const tiles = overlay.querySelectorAll(".checker-tile");
    tiles.forEach((t, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const diag = col + (ROWS - 1 - row);
      setTimeout(() => t.classList.remove("on"), diag * STEP_MS);
    });
  });
  _sceneReady = Promise.resolve();
}
