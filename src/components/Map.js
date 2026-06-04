const PAGE_COORDS = {
  "storage":           { cx: 0.52, cy: 0.14, zoom: 0.20, label: "원자재 창고" },
  "storage-inside":    { cx: 0.52, cy: 0.14, zoom: 0.25, label: "창고 내부" },
  "parts-a":           { cx: 0.82, cy: 0.22, zoom: 0.20, label: "부품공장 1" },
  "parts-a-inside":    { cx: 0.82, cy: 0.22, zoom: 0.25, label: "부품공장1 내부" },
  "parts-b":           { cx: 0.18, cy: 0.22, zoom: 0.20, label: "부품공장 2" },
  "parts-b-inside":    { cx: 0.18, cy: 0.22, zoom: 0.25, label: "부품공장2 내부" },
  "assembly-a":        { cx: 0.63, cy: 0.46, zoom: 0.20, label: "조립공장 1" },
  "assembly-a-inside": { cx: 0.63, cy: 0.46, zoom: 0.25, label: "조립공장1 내부" },
  "assembly-b":        { cx: 0.63, cy: 0.59, zoom: 0.20, label: "최종 조립공장" },
  "assembly-b-inside": { cx: 0.63, cy: 0.59, zoom: 0.25, label: "조립공장2 내부" },
  "line":              { cx: 0.52, cy: 0.50, zoom: 0.15, label: "이송라인" },
  "hangar":            { cx: 0.50, cy: 0.82, zoom: 0.12, label: "격납고" },
  "hangar-inside":     { cx: 0.50, cy: 0.82, zoom: 0.15, label: "격납고 내부" },
};

const DEFAULT_KEY = "storage";
const VP_W = 160;
const VP_H = 220;

export function mountMinimap() {
  // ── 1. 상태 변수 (onload 핸들러보다 먼저 선언) ──
  let currentKey = DEFAULT_KEY;
  let naturalW = 0;
  let naturalH = 0;
  let imgLoaded = false;

  // ── 2. DOM 요소 생성 ──
  const container = document.createElement("div");
  container.className = "minimap-container";

  const titleBar = document.createElement("div");
  titleBar.className = "minimap-titlebar";
  titleBar.textContent = "MINIMAP";

  const viewport = document.createElement("div");
  viewport.className = "minimap-viewport";

  const img = document.createElement("img");
  img.className = "minimap-img";
  img.draggable = false;

  const marker = document.createElement("div");
  marker.className = "minimap-marker";

  const label = document.createElement("div");
  label.className = "minimap-label";
  label.textContent = PAGE_COORDS[DEFAULT_KEY].label;

  // 오버레이
  const overlay = document.createElement("div");
  overlay.className = "minimap-overlay";
  overlay.style.display = "none";

  const overlayInner = document.createElement("div");
  overlayInner.className = "minimap-overlay-inner";

  const overlayImg = document.createElement("img");
  overlayImg.className = "minimap-overlay-img";
  overlayImg.draggable = false;

  const overlayMarker = document.createElement("div");
  overlayMarker.className = "minimap-overlay-marker";

  const overlayClose = document.createElement("button");
  overlayClose.className = "minimap-overlay-close";
  overlayClose.textContent = "✕";

  // ── 3. 헬퍼 함수 (img.src 설정 전에 선언) ──
  function _applyTransform(key, animate) {
    if (!imgLoaded) return;
    const coord = PAGE_COORDS[key] ?? PAGE_COORDS[DEFAULT_KEY];
    const { cx, cy, zoom, label: labelText } = coord;

    const tx = VP_W / 2 - cx * naturalW * zoom;
    const ty = VP_H / 2 - cy * naturalH * zoom;

    img.style.transition = animate
      ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
      : "none";
    img.style.transformOrigin = "0 0";
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    label.textContent = labelText;
  }

  function _updateOverlayMarker(key) {
    const coord = PAGE_COORDS[key] ?? PAGE_COORDS[DEFAULT_KEY];
    overlayMarker.style.left = `${coord.cx * 100}%`;
    overlayMarker.style.top = `${coord.cy * 100}%`;
  }

  function _onImgLoad() {
    imgLoaded = true;
    naturalW = img.naturalWidth;
    naturalH = img.naturalHeight;
    _applyTransform(currentKey, false);
  }

  // ── 4. 이미지 로드 (onload 먼저, src 나중) ──
  img.addEventListener("load", _onImgLoad);
  img.addEventListener("error", () => {
    console.error("[Minimap] map.png 로드 실패 — 경로: /assets/map/map.png");
  });
  img.src = "/assets/map/map.png";

  // 캐시된 이미지는 load 이벤트가 발화 안 될 수 있으므로 즉시 체크
  if (img.complete && img.naturalWidth > 0) {
    _onImgLoad();
  }

  // 오버레이 이미지도 같은 src (미니맵과 공유, 이미 로드됨)
  overlayImg.src = "/assets/map/map.png";

  // ── 5. DOM 조립 ──
  viewport.appendChild(img);
  viewport.appendChild(marker);
  container.appendChild(titleBar);
  container.appendChild(viewport);
  container.appendChild(label);
  document.body.appendChild(container);

  overlayInner.appendChild(overlayImg);
  overlayInner.appendChild(overlayMarker);
  overlay.appendChild(overlayInner);
  overlay.appendChild(overlayClose);
  document.body.appendChild(overlay);

  // ── 6. 이벤트 ──
  container.addEventListener("click", () => {
    overlay.style.display = "flex";
    requestAnimationFrame(() => {
      const rect = overlayImg.getBoundingClientRect();
      overlayInner.style.width = rect.width + "px";
      overlayInner.style.height = rect.height + "px";
      _updateOverlayMarker(currentKey);
    });
  });

  overlayClose.addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.style.display = "none";
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
    }
  });

  // ── 7. 공개 API ──
  function setPage(key) {
    if (key === currentKey) return;
    currentKey = key;
    _applyTransform(key, true);
    if (overlay.style.display !== "none") {
      _updateOverlayMarker(key);
    }
  }

  function unmount() {
    container.remove();
    overlay.remove();
  }

  return { setPage, unmount };
}
