# Hijack Factory — 프로젝트 개요·기술·최적화 정리

이 문서는 현재 `src/` 기준으로 구현된 기능, 사용 기술, 구조·최적화 관점을 한 번에 정리한 것입니다. (작성 시점: 코드베이스 스냅샷 기준)

---

## 1. 프로젝트 개요

- **목적**: Three.js 기반 공장·물류 시각화. 원재료 창고(외부/내부), 부품·조립 공장, 이송라인 등 **화면(페이지) 단위**로 씬을 전환한다.
- **실행**: [Vite](https://vitejs.dev/) 개발 서버 / `npm run build` 프로덕션 번들.
- **렌더링**: 단일 `<canvas id="app">`, 단일 `THREE.Scene` + `WebGLRenderer`를 유지하고, 페이지 전환 시 **씬 자식 오브젝트를 비우고** 각 화면 모듈이 다시 채운다.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 런타임 | **Three.js** (npm `three`, 예: r0.183.x) |
| 번들러 | **Vite** 8.x, ES Modules |
| 3D 자산 | **glTF / GLB** (`GLTFLoader`) |
| 카메라 조작 | **OrbitControls** (透視 + 正射 2모드 래퍼) |
| UI | 바닐라 **DOM** 생성 + **CSS** (`style.css`), 커스텀 이벤트로 3D와 분리 |
| 톤 | `ACESFilmicToneMapping` + 노출, 장면별 배경색 |

---

## 3. 소스 디렉터리 구조 (요약)

```
src/
├── main.js                 # 앱 오케스트레이션: 씬/렌더러, 페이지 전환, 이벤트 브리지
├── style.css               # 전역 + 사이드바 + 이송 하단 바 등
├── components/
│   ├── Controls.js         # Perspective / Orthographic + OrbitControls
│   ├── Light.js            # 외부 씬용 태양광 느낌 조명
│   └── Sidebar.js          # 접이식 사이드바 + 메뉴/뷰모드 이벤트
└── pages/
    ├── storage/            # 원재료 창고(외부): 타일 바닥, 격납고 GLB, 레이캐스트 줌
    ├── storage_inside/     # 창고 내부: 바닥·벽, GLB 상자 스택, 전용 조명
    ├── parts_factory1|2/  # 부품공장: factory_tile + factory GLB
    ├── join_factory1|2/   # 조립공장: 동일 구조(별도 폴더)
    ├── factory_frame.js    # 공장 카메라 프레이밍 유틸 (바운딩 스피어 기반)
    ├── transfer1|2/        # 이송: transfer_tile, 3분할 가이드, 하단 경로 버튼
    └── …
```

---

## 4. 기능별 진행도

### 4.1 공통 앱 셸 (`main.js`)

- **완료**: 단일 씬/렌더러, `devicePixelRatio` 상한(2), 톤매핑/노출 설정.
- **완료**: 페이지 전환 시 `dispose()` → `clearSceneObjects` → 새 `init*App` 패턴.
- **완료**: 전환 시 **검은 슬라이드 오버레이** (`transform` + `transition`, 우측에서 덮기 / 해제).
- **완료**: 사이드바 메뉴 `app:sidebar-menu` → 각 `switchTo*Page`.
- **완료**: 이송 하단 버튼 `app:transfer-route` → `transfer1` / `transfer2` 전환.

### 4.2 사이드바 (`Sidebar.js` + `style.css`)

- **완료**: 펼침/접힘 UI, 메뉴 아이콘·라벨, `@font-face` 둥근모, 뷰 모드(탑뷰/일반뷰) → `app:viewmode-change`.
- **완료**: 현재 화면 제목 갱신 `app:current-screen`.
- **참고**: 메뉴 키 `hangar`(격납고)는 `main.js`에 아직 라우팅이 없을 수 있음(미연결 시 동작 없음).

### 4.3 카메라 컨트롤 (`Controls.js`)

- **완료**: Perspective / Orthographic 듀얼 카메라 + 각각 OrbitControls.
- **완료**: 모드 전환 시 **스냅샷** 저장/복원으로 시점 유지.
- **완료**: 직교 카메라는 상단 뷰 용도로 회전 제한 등.

### 4.4 외부 조명 (`Light.js`)

- **완료**: `HemisphereLight` + `DirectionalLight` 조합으로 하늘/지면 반사 + 태양 방향광 느낌.

### 4.5 원재료 창고 — 외부 (`storage/storage_main.js` 등)

- **완료**: GLB 바닥·격납고 배치, `fitRootToAxisAlignedDimensions` 등으로 **목표 치수(m)** 맞춤.
- **완료**: **Raycaster** + 포인터 NDC로 가운데 격납고 클릭 감지.
- **완료**: 카메라 **부드러운 줌/포커스**(시간 기반 lerp 등) 후 내부 진입 콜백.

### 4.6 원재료 창고 — 내부 (`storage_inside/*`)

- **완료**: `floor.js` — 프로시저럴 메시(바닥·벽·노란 안전선 등).
- **완료**: `material.js` — `titans_box3.glb` **1회 로드 후 `clone(true)`** 로 다수 배치, 바닥 접지·열 배치.
- **완료**: `inside_light.js` — Ambient + Directional + Point(천장·상자 집중).
- **완료**: `storage_inside_main.js` — 비동기 `addStorageMaterials`, `dispose`에서 지오메트리/머티리얼 정리.

### 4.7 부품공장 / 조립공장 (`parts_factory*`, `join_factory*`)

- **완료**: `factory_tile.glb` 바닥 + `factory.glb` 건물, `Box3`로 타일 위에 건물 얹기.
- **완료**: `factory_frame.js` — 합쳐진 AABB의 **바운딩 스피어**로 카메라 거리 산출(고정 오프셋보다 스케일에 강함).
- **완료**: 사이드바: `parts-a`→부품1, `parts-b`→부품2, `assembly-a`→조립1, `assembly-b`→조립2.

### 4.8 이송라인 (`transfer1`, `transfer2`)

- **완료**: `transfer_tile.glb` 바닥, 바닥 `Box3` 기준 **3등분** 시각 가이드(반투명 평면 + 구분선).
- **완료**: 하단 **경로 버튼 2개**(DOM), 클릭 시 `app:transfer-route`.
- **완료**: `line` 메뉴 → 기본 `transfer1`; 버튼1 → `transfer1`, 버튼2 → `transfer2`.

### 4.9 기타·플레이스홀더

- `storage/truck_storage/truck_storage.js`: 트럭 기능 제거 등 **플레이스홀더** 수준일 수 있음.

---

## 5. 기능 ↔ 사용 기술 매핑

| 기능 | 주요 기술·API |
|------|----------------|
| GLB 로딩 | `GLTFLoader`, `loadAsync` |
| 배치·스케일 | `Box3`, `Sphere`, `Vector3`, `Object3D.updateMatrixWorld`, 커스텀 `fitRootToAxisAlignedDimensions` |
| 카메라 | `PerspectiveCamera`, `OrthographicCamera`, `OrbitControls` |
| 클릭 피킹 | `Raycaster`, NDC 좌표 |
| 애니메이션 루프 | `requestAnimationFrame`, 페이지별 `dispose`에서 `cancelAnimationFrame` |
| UI ↔ 3D 디커플링 | `CustomEvent`: `app:sidebar-menu`, `app:viewmode-change`, `app:current-screen`, `app:transfer-route` |
| 전환 연출 | DOM 오버레이 + CSS `transform` / `transition` |
| 다중 인스턴스 | `scene.clone(true)` (원자재 상자 등) |
| 톤/노출 | `ACESFilmicToneMapping`, `toneMappingExposure` |

---

## 6. 아키텍처 패턴

1. **페이지 = 모듈 팩토리**  
   `initXxxApp({ scene, renderer, canvas })` → `{ dispose() }` 반환. 전역 상태 최소화.

2. **단일 씬**  
   전환 시 `clearSceneObjects`로 루트 자식 제거. (전역 조명 `addSunStyleLighting`은 일부 페이지에서 다시 호출.)

3. **이벤트 버스**  
   사이드바·하단 버튼은 DOM만 담당하고, 라우팅은 `main.js`가 이벤트로 수행 → **관심사 분리**.

4. **공장 카메라**  
   `factory_frame.js`로 중복 제거 → 여러 공장 페이지가 동일 프레이밍 로직 공유.

---

## 7. 최적화·품질 관련 조치

| 항목 | 내용 |
|------|------|
| 픽셀 비율 | `setPixelRatio(Math.min(devicePixelRatio, 2))` — 고해상도 기기에서 과도한 픽셀 fill 완화 |
| 자산 로드 | 동일 GLB **한 번 로드** 후 `clone(true)`로 인스턴스화(원자재 상자 등) — 네트워크·파싱 비용 절감 |
| 메모리 | `storage_inside` 재료 레이어 `dispose()`에서 geometry/material 정리, 라이트 그룹 `scene.remove` |
| 카메라 프레이밍 | 바운딩 **스피어** 기반 거리 — 모델 크기 변화에 대응, 잘림/과도 이격 완화 |
| 입력 | 이송 하단 바 `pointer-events`로 캔버스와 겹침 시 클릭 처리 제어 |

### 아직 “하지 않은” 또는 향후 여지

- **코드 스플리팅**: 모든 페이지가 `main` 번들에 포함 → 빌드 경고(대용량 청크). 필요 시 `import()` 동적 로딩으로 초기 로드 단축 가능.
- **GLB 자체 최적화**: Draco/meshopt, 텍스처 압축, 불필요 노드 제거 등은 **에셋 파이프라인** 단계 최적화.
- **격납고 전용 페이지**: 사이드바 키만 있고 `main` 라우트가 없다면 연결 작업 필요.

---

## 8. 빌드·실행

```bash
npm install
npm run dev    # 개발
npm run build  # 프로덕션 번들
```

---

## 9. 탑뷰 시점 통일 — 트러블슈팅 기록

### 9.1 문제 인식

사이드바 **"탑뷰"** 버튼(= orthographic 모드 전환)과 일반뷰 모두에서, 화면마다 카메라가 씬을 바라보는 **각도·방향이 제각각**이었다.

- `transfer1`, `transfer2`: 방향벡터 `(0.9, 0.65, 0.95)` 기반 오프셋
- `storage`: 방향벡터 `(1, 0.45, 1)` 기반, 초기 카메라 위치 미설정(Controls.js 기본값 그대로)
- `parts_factory*`, `join_factory*`: `factory_frame.js`의 방향벡터 `(30, 24, 28)` 기반 `applyFactoryPerspectiveFrame()`
- `storage_inside`: 고정 좌표 (`Y=4.4`, `Z+12.5`) — 내부 시점이라 의도적으로 다름

결과적으로 화면을 이동할 때마다 "시점이 튀는" 현상이 발생했다.

---

### 9.2 1차 시도 — 각 페이지 main 파일 직접 수정 (잘못된 접근)

처음에는 각 페이지의 `*_main.js` 파일에서 개별적으로 방향벡터를 `(30, 24, 28)`로 통일하려고 했다. `transfer1/transfer_main.js`, `transfer2/transfer_main.js`, `storage/storage_main.js` 등을 직접 수정.

**문제점**: 카메라 방향 로직이 여러 파일에 중복 산재되어, 나중에 방향을 바꾸려면 다시 모든 파일을 수정해야 한다. **시점 관련 코드는 `Controls.js` 한 곳에서 관리해야 한다.**

---

### 9.3 올바른 접근 — `Controls.js`에 `fitToBounds()` 추가

`Controls.js`의 반환 객체에 `fitToBounds(box: THREE.Box3)` 메서드를 추가하여 **방향벡터를 단일 정의**했다.

```js
fitToBounds(box) {
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const center = sphere.center;
  const r = Math.max(sphere.radius, 0.01);
  const viewDir = new THREE.Vector3(30, 24, 28).normalize();
  const distance = Math.max(r * 1.78, 40);
  // ...
}
```

각 페이지는 씬 로드 완료 후 `viewControls.fitToBounds(combinedBox)` 한 줄만 호출하도록 변경했다.

- `parts_factory*`, `join_factory*`: `applyFactoryPerspectiveFrame(combined, cam, viewControls)` → `viewControls.fitToBounds(combined)` + `factory_frame.js` import 제거
- `transfer*`: 수동 `cam.position.set(...)` → `viewControls.fitToBounds(floorBox)`
- `storage`: `fitTargetToBounds(combined)` → `viewControls.fitToBounds(combined)`, `startSmoothFocus` 방향벡터도 `(30, 24, 28)`로 통일

---

### 9.4 2차 문제 — 탑뷰(orthographic) 모드에서 여전히 화면마다 각도가 달라 보임

perspective 뷰는 통일됐지만, **"탑뷰" 버튼을 누르면 여전히 화면마다 방향이 달랐다.**

#### 원인 분석

`fitToBounds`가 `getActiveCamera()`만 업데이트했기 때문이다. 페이지 초기화 시 mode는 항상 `"perspective"`이므로, perspective 카메라만 `(30, 24, 28)` 방향으로 설정되고 **orthographic 카메라는 Controls.js 생성 시 기본값인 `(orthoD, orthoD, orthoD)` = 월드 좌표 `(100, 100, 100)`에 그대로 남아있었다**.

탑뷰 버튼 클릭 흐름:

```
setMode("orthographic")
  → saveSnapshot("perspective")       // perspective 저장
  → applySnapshot("orthographic")     // orthographic 스냅샷 없음
    → applyDefaultPose("orthographic") // 카메라를 (100, 100, 100)으로 리셋!
```

`applyDefaultPose`는 카메라를 `(100, 100, 100)` 고정 위치에 두고, 씬 센터(`target`)를 바라보게 한다. 씬마다 `target`이 다르기 때문에(바닥만 있는 씬 vs 높은 건물이 포함된 씬) **카메라→타겟 방향벡터가 화면마다 달라지는 것**이다.

예시:
| 화면 | target 위치 | ortho 카메라 `(100,100,100)` → target 방향 |
|------|------------|------------------------------------------|
| transfer | `(0, 0, 50)` 부근 | `(-0, -0, -1)` 방향에 가까움 |
| storage | `(-120, 15, 0)` 부근 | `(220, 85, 100)` 방향 |
| factory | `(0, 15, 0)` 부근 | `(100, 85, 100)` 방향 |

#### 해결책

`fitToBounds`에서 **perspective · orthographic 두 카메라 모두** 같은 방향으로 위치를 설정하고, **두 모드의 스냅샷도 저장**한다.

```js
// 두 카메라 모두 동일한 위치로 설정
for (const cam of [perspectiveCamera, orthographicCamera]) {
  cam.position.copy(center).addScaledVector(viewDir, distance);
  cam.updateProjectionMatrix();
}

// 스냅샷 저장 → setMode() 시 applyDefaultPose가 (100,100,100)으로 리셋하는 것을 방지
snapshots.perspective = { position: ..., quaternion: ..., target: center.clone(), zoom: ... };
snapshots.orthographic = { position: ..., quaternion: ..., target: center.clone(), zoom: ... };
```

스냅샷이 저장되어 있으면, `setMode("orthographic")` 시 `applyDefaultPose` 대신 `applySnapshot`이 실행되어 `fitToBounds`에서 설정한 위치가 그대로 복원된다.

---

### 9.5 최종 구조 요약

| 변경 파일 | 변경 내용 |
|-----------|----------|
| `components/Controls.js` | `fitToBounds(box)` 추가 — 방향벡터 `(30,24,28)` 단일 정의, 두 카메라 모두 업데이트, 스냅샷 저장 |
| `pages/factory_frame.js` | 변경 없음 (유틸 함수 유지) |
| `pages/join_factory1|2/` | `applyFactoryPerspectiveFrame` → `viewControls.fitToBounds(combined)` |
| `pages/parts_factory1|2/` | 동일 |
| `pages/transfer1|2/` | 수동 `cam.position.set` → `viewControls.fitToBounds(floorBox)` |
| `pages/storage/` | `fitTargetToBounds` → `viewControls.fitToBounds(combined)`, `startSmoothFocus` 방향벡터 통일 |

**핵심 교훈**: 카메라 시점 방향은 `Controls.js` 한 곳에서만 관리해야 한다. 각 페이지 main 파일은 씬 바운딩 박스만 전달(`fitToBounds(box)`)하면 되고, 방향·거리 계산은 Controls.js 책임이다.

---

## 10. 문서 유지보수

- 새 페이지 추가 시: `main.js`에 `switchTo*` + `currentPage` 문자열 + 이벤트 키를 문서 **4절·5절**에 한 줄씩 반영하면 됩니다.
- 새 최적화(동적 import, 인스턴싱 등) 적용 시 **7절** 표를 갱신하세요.
