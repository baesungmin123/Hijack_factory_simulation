const MENU_ITEMS = [
  { key: "hangar", icon: "/assets/icon/factory.png", label: "격납고" },
  { key: "assembly-a", icon: "/assets/icon/robotarm.png", label: "조립공장(몸통+다리+팔)" },
  { key: "assembly-b", icon: "/assets/icon/robotarm.png", label: "조립공장(최종)" },
  { key: "line", icon: "/assets/icon/truck.png", label: "이송라인" },
  { key: "parts-a", icon: "/assets/icon/factory.png", label: "부품공장(머리 + 몸통)" },
  { key: "parts-b", icon: "/assets/icon/factory.png", label: "부품공장(팔 + 다리)" },
  { key: "storage", icon: "/assets/icon/storage.png", label: "원재료 창고" },
];

/**
 * 사이드바 UI를 문서에 마운트합니다.
 * 펼침/접힘 상태를 토글하며 접힘 시 아이콘 행만 노출합니다.
 */
export function mountSidebar() {
  if (document.getElementById("app-sidebar")) return;

  const wrap = document.createElement("aside");
  wrap.id = "app-sidebar";
  wrap.className = "app-sidebar is-expanded";

  const headerCard = document.createElement("section");
  headerCard.className = "sidebar-panel sidebar-title-panel";
  headerCard.innerHTML = `
    <div class="sidebar-panel-header">원재료 창고</div>
    <div class="sidebar-hero">
      <img src="/assets/icon/storage.png" alt="storage icon" class="sidebar-hero-img" />
    </div>
  `;

  const menuPanel = document.createElement("section");
  menuPanel.className = "sidebar-panel";

  const menuHead = document.createElement("div");
  menuHead.className = "sidebar-menu-head";
  menuHead.innerHTML = `
    <span class="menu-title"><img src="/assets/icon/factory.png" alt="" class="menu-title-icon" /><span id="sidebar-current-screen">격납고</span></span>
    <button type="button" class="sidebar-toggle" aria-label="사이드바 접기">⌄</button>
  `;

  const expandedList = document.createElement("div");
  expandedList.className = "sidebar-list expanded-list";
  expandedList.innerHTML = MENU_ITEMS.map(
    (m) => `
      <button type="button" class="sidebar-item" data-menu-key="${m.key}">
        <img src="${m.icon}" alt="" class="item-icon" />
        <span class="item-label">${m.label}</span>
      </button>
    `
  ).join("");

  const collapsedRow = document.createElement("div");
  collapsedRow.className = "sidebar-list collapsed-row";
  collapsedRow.innerHTML = MENU_ITEMS.slice(0, 5)
    .map(
      (m) => `
      <button type="button" class="collapsed-item" title="${m.label}" data-menu-key="${m.key}">
        <img src="${m.icon}" alt="" class="collapsed-icon" />
      </button>
    `
    )
    .join("");

  menuPanel.append(menuHead, expandedList, collapsedRow);

  const modeButtons = document.createElement("section");
  modeButtons.className = "sidebar-mode-buttons";
  modeButtons.innerHTML = `
    <button type="button" class="mode-btn" data-view-mode="orthographic">탑뷰</button>
    <button type="button" class="mode-btn" data-view-mode="perspective">일반뷰</button>
  `;

  wrap.append(headerCard, menuPanel, modeButtons);
  document.body.appendChild(wrap);

  const toggleBtn = wrap.querySelector(".sidebar-toggle");
  toggleBtn?.addEventListener("click", () => {
    const collapsed = wrap.classList.toggle("is-collapsed");
    wrap.classList.toggle("is-expanded", !collapsed);
    toggleBtn.textContent = collapsed ? "⌃" : "⌄";
  });

  wrap.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-view-mode");
      if (!mode) return;
      window.dispatchEvent(
        new CustomEvent("app:viewmode-change", { detail: { mode } })
      );
    });
  });

  wrap.querySelectorAll("[data-menu-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-menu-key");
      if (!key) return;
      window.dispatchEvent(
        new CustomEvent("app:sidebar-menu", { detail: { key } })
      );
    });
  });

  window.addEventListener("app:current-screen", (event) => {
    const name = event?.detail?.name;
    if (!name) return;
    const target = document.getElementById("sidebar-current-screen");
    if (target) target.textContent = name;
  });
}
