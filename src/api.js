const API_BASE = `http://${window.location.hostname}:8000`;

export async function postCompleteAssembly(stage) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory/complete-assembly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(`[API] complete-assembly(${stage}) 실패:`, err);
  }
}

export async function postUsePart(location, part, count = 1) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory/use-part`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, part, count }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(`[API] use-part(${location}/${part}) 실패:`, err);
  }
}

export async function postCompletePart(location, part, count = 1) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory/complete-part`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, part, count }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(`[API] complete-part(${location}/${part}) 실패:`, err);
  }
}

export async function postAddFinalHijack() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory/add-final-hijack`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error("[API] add-final-hijack 실패:", err);
  }
}

export async function postCompleteHijack() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory/complete-hijack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error("[API] complete-hijack 실패:", err);
  }
}

export async function postUseRaw(location, count = 1) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory/use-raw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, count }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(`[API] use-raw(${location}) 실패:`, err);
  }
}
