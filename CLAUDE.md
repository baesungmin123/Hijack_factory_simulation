# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hijack Factory는 로봇 생산 공장 시뮬레이션으로, Three.js 3D 프론트엔드와 FastAPI 백엔드로 구성된 두 개의 독립적인 서브 프로젝트로 이루어져 있다.

- `Hijack_factory_simulation/` — Three.js + Vite 프론트엔드
- `Hijack_factory_backend/` — FastAPI + PostgreSQL 백엔드

## Commands

### Frontend (Hijack_factory_simulation/)
```bash
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

### Backend (Hijack_factory_backend/)
```bash
uvicorn app.main:app --reload   # 개발 서버 (http://127.0.0.1:8000)
```
백엔드는 PostgreSQL을 사용한다. `.env` 파일에 DB 연결 정보가 필요하다.

## Architecture

### Frontend 구조

**단일 Scene, 단일 Renderer** — `src/main.js`에서 Three.js scene/renderer를 생성하고 앱 전체에서 재사용한다. 페이지 전환 시 `clearSceneObjects()`로 씬 초기화 후 새 페이지 init 함수를 호출한다. 각 페이지는 `dispose()` 메서드를 반환하여 이전 페이지 정리를 담당한다.

**페이지 라우팅** — `window.addEventListener("app:sidebar-menu", ...)` 커스텀 이벤트로 사이드바 클릭을 처리한다. 각 페이지는 `src/pages/<page_name>/` 디렉터리에 위치하며, 외부/내부 뷰가 분리되어 있다 (e.g. `parts_factory1/` vs `parts_factory1_inside/`).

**factoryClock.js** (`src/simulation/factoryClock.js`) — 앱 시작 시 `startClocks()`를 한 번만 호출하는 전역 타이머. 4개 부품 생산 라인(partsHead, partsBody, partsLeg, partsArm)의 사이클을 추적하고 백엔드 API 신호를 자동 발신한다. **어느 페이지에 있든 항상 동작한다.** 페이지별 애니메이션은 `getPartsPhase(lineName)` / `getJoinSets()`로 현재 클락 상태를 조회하여 진입 시 즉시 싱크한다.

**생산 사이클** — 부품 공장 한 사이클 = CONV1(3s) + CUTTING(5s) + ARM(20s) = 28초. partsBody와 partsArm은 14초(CYCLE×0.5) 위상 오프셋으로 엇갈린다.

**각 `*_inside_main.js` 패턴:**
1. 인벤토리 배지 DOM 생성
2. `getFactoryWebSocket()`으로 WebSocket 싱글톤 획득 후 `inventory_update` 이벤트 구독
3. `fetchInventory()`로 초기 재고 GET
4. 애니메이션 init 후 500ms 지연하여 `syncFromClock()` 호출 (로딩 완료 대기)
5. `dispose()`에서 WS 리스너 해제 및 배지 DOM 제거

### Backend 구조

**API 엔드포인트** (`app/api/v1/inventory.py`):
- `POST /api/v1/inventory/use-raw` — 원자재 차감 (parts_a/parts_b 이면 raw_material 창고도 동시 차감)
- `POST /api/v1/inventory/complete-part` — 부품 완성 (+5개 고정). 목적지: head→final_assembly, body/arm/leg→assembly
- `POST /api/v1/inventory/complete-assembly` — 조립1 완료 (assembly.body/arm/leg -1, final_assembly.body +1)
- `POST /api/v1/inventory/complete-hijack` — 최종 조립 완료 (final_assembly.body/head -1, hangar +1, 10대 도달 시 `hangar_launch` 이벤트 브로드캐스트)
- 모든 POST는 완료 후 WebSocket으로 전체 인벤토리 브로드캐스트

**백그라운드 태스크** (`app/tasks.py`):
- `transfer_loop` (180초) — raw_material 창고 → parts_a/parts_b 각 10개 이송. 창고 고갈 시 100개 보충
- `assembly1_loop` (10초) — assembly에서 body/arm/leg 소모하여 final_assembly.body 생산
- `assembly2_loop` (10초) — final_assembly에서 head+body 소모하여 hangar 적재

**assembly 자동 보충** — assembly의 body/arm/leg가 임계값(2) 이하면 parts_a/parts_b에서 자동으로 10개 이송 (`_refill_assembly_if_low`)

**DB 모델** — `Inventory` 테이블 단일. 위치(location) 기준으로 행 구분: `raw_material`, `parts_a`, `parts_b`, `assembly`, `final_assembly`, `hangar`. 서버 시작마다 `_seed()`로 초기값 리셋.

### 프론트↔백엔드 통신

**REST (프론트→백):**
- `src/api.js`에 모든 POST 함수 집중 (`API_BASE = "http://127.0.0.1:8000"`)
- factoryClock에서 백그라운드 자동 발신: `postUseRaw` (36초 간격, 4라인 9초 스태거), `postCompletePart` (사이클당 1회)
- 페이지 애니메이션에서 발신: `postCompleteAssembly` (join1 완료 시), `postCompleteHijack` (join2 완료 시)

**WebSocket (백→프론트):**
- `ws://127.0.0.1:8000/ws/factory` 단방향 수신
- `src/websocket.js` — 싱글톤 패턴, 연결 끊김 시 3초 후 자동 재접속
- 이벤트 타입: `inventory_update` (전체 재고 payload), `hangar_launch` (격납고 발사 이벤트)
- 각 페이지에서 `ws.on(type, handler)` / `ws.off(type, handler)`로 구독/해제

### 3D 에셋
모든 GLB 파일은 `public/assets/blend/`에 위치한다. 모델은 `GLTFLoader`로 비동기 로드하며, 로딩 실패는 `.catch(console.error)`로 처리한다.
