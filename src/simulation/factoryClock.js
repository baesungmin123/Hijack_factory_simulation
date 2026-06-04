// 앱 시작 시 한 번만 켜지는 글로벌 공장 타이머
// 어떤 페이지에 있든 항상 흐르며, 각 라인이 사이클 어디쯤인지 계산해줌

import {
  postUsePart, postCompleteAssembly, postUseRaw, postCompletePart,
} from "../api.js";

// ─── 타이밍 상수 (초) ────────────────────────────────────────────────────────
export const PT = {
  CONV1:          3.0,
  CUTTING:        5.0,
  ARM:           20.0,
  PRESS_START:    4.0,
  FLATMAT_APPEAR: 9.0,
  FLATMAT_TRAVEL: 3.0,
  HIJACK_WAIT:    4.0,
  HIJACK_TRAVEL:  1.2,
};
PT.CYCLE = PT.CONV1 + PT.CUTTING + PT.ARM;  // 28s

// hijack 메시가 컨베이어 끝에 도달하는 사이클 내 절대 시각
const PART_DONE_T = PT.CONV1 + PT.CUTTING + PT.FLATMAT_APPEAR + PT.FLATMAT_TRAVEL + PT.HIJACK_WAIT + PT.HIJACK_TRAVEL; // 25.2s

// 조립공장 스폰 간격
export const JOIN_SPAWN = 10.0;
// ─── 라인별 위상 오프셋 ───────────────────────────────────────────────────────
const OFFSETS = {
  partsHead: 0,
  partsBody: PT.CYCLE * 0.5,
  partsLeg:  0,
  partsArm:  PT.CYCLE * 0.5,
};

// ─── 부품 라인 정의 ───────────────────────────────────────────────────────────
const LINES = [
  { name: 'partsHead', factory: 'parts_a', partType: 'head' },
  { name: 'partsBody', factory: 'parts_a', partType: 'body' },
  { name: 'partsLeg',  factory: 'parts_b', partType: 'leg'  },
  { name: 'partsArm',  factory: 'parts_b', partType: 'arm'  },
];
const lastUseRawIdx = { partsHead: -1, partsBody: -1, partsLeg: -1, partsArm: -1 };
const lastDoneIdx   = { partsHead: -1, partsBody: -1, partsLeg: -1, partsArm: -1 };

let startTime = null;

let lastA1Idx = -1;

function cycleOffset(lineName) {
  const elapsed = (Date.now() - startTime) / 1000 + (OFFSETS[lineName] ?? 0);
  return elapsed % PT.CYCLE;
}

// ─── 전체 신호 루프 (1초 tick) ────────────────────────────────────────────────
function tick() {
  if (!startTime) return;
  const elapsed = (Date.now() - startTime) / 1000;

  // ── 조립공장1 신호 (10초마다) ──────────────────────────────────────────────
  const a1Idx = Math.floor(elapsed / JOIN_SPAWN);
  if (lastA1Idx < a1Idx) {
    lastA1Idx = a1Idx;
    postUsePart('parts_a', 'body', 1);
    postUsePart('parts_b', 'arm', 1);
    postUsePart('parts_b', 'leg', 1);
    postCompleteAssembly('stage1');
  }

  // ── 부품 공장 라인별 신호 (28초 사이클) ────────────────────────────────────
  for (const line of LINES) {
    const lineElapsed = elapsed + (OFFSETS[line.name] ?? 0);
    const cycleIdx = Math.floor(lineElapsed / PT.CYCLE);
    const offset = lineElapsed % PT.CYCLE;

    if (lastUseRawIdx[line.name] < cycleIdx) {
      lastUseRawIdx[line.name] = cycleIdx;
      postUseRaw(line.factory, 1);
    }

    if (offset >= PART_DONE_T && lastDoneIdx[line.name] < cycleIdx) {
      lastDoneIdx[line.name] = cycleIdx;
      postCompletePart(line.factory, line.partType, 5);
    }
  }

}

export function startClocks() {
  startTime = Date.now();

  // 조립공장: 시작 시점의 현재 사이클은 이미 처리된 것으로 초기화
  lastA1Idx = 0;

  // 부품 라인: 현재 사이클 인덱스로 초기화 (앱 재시작 시 중복 발신 방지)
  for (const line of LINES) {
    const lineElapsed = OFFSETS[line.name] ?? 0;
    const cycleIdx = Math.floor(lineElapsed / PT.CYCLE);
    const offset = lineElapsed % PT.CYCLE;
    lastUseRawIdx[line.name] = cycleIdx;
    lastDoneIdx[line.name] = offset >= PART_DONE_T ? cycleIdx : cycleIdx - 1;
  }

  setInterval(tick, 1000);
}

// ─── 현재 phase 조회 (3D 싱크용) ─────────────────────────────────────────────
export function getPartsPhase(lineName) {
  if (!startTime) return { phase: 'conv1', phaseTimer: 0 };
  const t = cycleOffset(lineName);
  if (t < PT.CONV1) return { phase: 'conv1', phaseTimer: t };
  if (t < PT.CONV1 + PT.CUTTING) return { phase: 'cutting', phaseTimer: t - PT.CONV1 };
  return { phase: 'arm', phaseTimer: t - PT.CONV1 - PT.CUTTING };
}

// ─── 조립공장 세트 조회 (3D 싱크용) ──────────────────────────────────────────
export function getJoinSets() {
  if (!startTime) return [];
  const elapsed = (Date.now() - startTime) / 1000;
  const totalSpawned = Math.floor(elapsed / JOIN_SPAWN);
  const sets = [];
  const maxVisible = 3;
  for (let i = Math.max(0, totalSpawned - maxVisible + 1); i <= totalSpawned; i++) {
    sets.push({ elapsed: elapsed - i * JOIN_SPAWN });
  }
  return sets;
}
