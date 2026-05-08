# Hijack Factory Simulation — 프로젝트 코드 정리

## 기술 스택

| 항목 | 내용 |
|---|---|
| 3D 엔진 | Three.js 0.183.2 |
| 빌드 도구 | Vite 8.0.4 |
| 폰트 | DungGeunMo (픽셀 게임 감성) |
| 모듈 방식 | ES Modules |

---

## 디렉토리 구조

```
src/
├── main.js                         # 앱 진입점, 페이지 전환 총괄
├── style.css                       # 전역 스타일
├── components/
│   ├── Controls.js                 # 카메라 컨트롤 (원근/직교 전환)
│   ├── Light.js                    # 야외 공통 조명
│   ├── Sidebar.js                  # 사이드바 UI
│   └── Transition.js               # 체커보드 화면 전환 + 로딩 텍스트
└── pages/
    ├── storage/                    # 원재료 창고 (외부)
    ├── storage_inside/             # 창고 내부
    ├── parts_factory1/             # 부품공장1 (외부)
    ├── parts_factory1_inside/      # 부품공장1 내부
    ├── parts_factory2/             # 부품공장2 (외부)
    ├── parts_factory2_inside/      # 부품공장2 내부
    ├── join_factory1/              # 조립공장1 (외부)
    ├── join_factory1_inside/       # 조립공장1 내부
    ├── join_factory2/              # 조립공장2 (외부)
    ├── join_factory2_inside/       # 조립공장2 내부
    ├── transfer1/                  # 이송라인1
    ├── transfer2/                  # 이송라인2
    ├── hanger/                     # 격납고 (외부)
    └── hanger_inside/              # 격납고 내부
```

---

## 핵심 파일 설명

### `src/main.js`

앱의 진입점. Three.js Scene / Renderer / Canvas 초기화 후 페이지 전환 함수들을 관리한다.

**페이지 전환 함수 목록**

| 함수명 | 이동 대상 | 아이콘 |
|---|---|---|
| `switchToStoragePage()` | 원재료 창고 | storage.png |
| `switchToStorageInside()` | 창고 내부 | storage.png |
| `switchToPartsFactory1Page()` | 부품공장1 | factory.png |
| `switchToPartsFactory1InsidePage()` | 부품공장1 내부 | factory.png |
| `switchToPartsFactory2Page()` | 부품공장2 | factory.png |
| `switchToPartsFactory2InsidePage()` | 부품공장2 내부 | factory.png |
| `switchToJoinFactory1Page()` | 조립공장1 | robotarm.png |
| `switchToJoinFactory1InsidePage()` | 조립공장1 내부 | robotarm.png |
| `switchToJoinFactory2Page()` | 조립공장2 | robotarm.png |
| `switchToJoinFactory2InsidePage()` | 조립공장2 내부 | robotarm.png |
| `switchToTransfer1Page()` | 이송라인1 | truck.png |
| `switchToTransfer2Page()` | 이송라인2 | truck.png |
| `switchToHangerPage()` | 격납고 | hanger.png |
| `switchToHangerInsidePage()` | 격납고 내부 | hanger.png |

**전환 패턴**
```js
fadeToBlack("/assets/icon/xxx.png").then(() => {
  currentApp?.dispose?.();
  clearSceneObjects(scene);
  currentApp = initXxxApp({ scene, renderer, canvas, onEnterXxx: switchToXxx });
  currentPage = "xxx";
  setSidebarCurrentScreen("페이지명");
  revealFromBlack();
});
```

**window 커스텀 이벤트**

| 이벤트명 | 발생 시점 | 처리 |
|---|---|---|
| `app:sidebar-menu` | 사이드바 메뉴 클릭 | 해당 페이지로 전환 |
| `app:transfer-route` | 이송라인 경로 버튼 클릭 | transfer1/2 전환 |
| `app:viewmode-change` | 시점 모드 변경 | 각 페이지 controls에 전달 |
| `app:current-screen` | 페이지 전환 완료 | 사이드바 헤더·이미지 업데이트 |

---

### `src/components/Transition.js`

체커보드 타일 방식의 화면 전환 효과를 담당한다.

**상수**
```
COLS = 16, ROWS = 10  →  타일 160개
STEP_MS = 35          →  한 대각선당 딜레이 (ms)
MAX_DIAG = 24         →  최대 대각선 인덱스
```

**함수**

| 함수 | 설명 |
|---|---|
| `setSceneReady(promise)` | 씬 로딩 완료 Promise 등록. `revealFromBlack`이 이 Promise를 await한다. |
| `fadeToBlack(iconUrl)` | 오른쪽 위 → 왼쪽 아래 방향으로 타일을 채운다. 완료 후 아이콘 + LOADING... 텍스트 표시. Promise 반환. |
| `revealFromBlack()` | `_sceneReady` 완료를 기다린 후 왼쪽 아래 → 오른쪽 위 방향으로 타일을 제거한다. |

**로딩 화면 구성**
- 아이콘 이미지 96×96px (pixelated)
- `LOADING.` → `LOADING..` → `LOADING...` 400ms 간격 반복 (JS setInterval)
- 씬 로딩 완료 시 자동 숨김

> **규칙**: 각 페이지의 init 파일에서 반드시 `setSceneReady(loadingPromise)`를 호출해야 한다.

---

### `src/components/Controls.js`

원근(Perspective) / 직교(Orthographic) 카메라를 동시에 관리하는 컨트롤러.

**`createViewModeControls(options)`**

| 옵션 | 설명 |
|---|---|
| `renderer` | WebGLRenderer |
| `domElement` | 이벤트 바인딩 대상 canvas |
| `target` | OrbitControls 타겟 |
| `orthoD` | 직교 카메라 기본 거리 |
| `perspectiveFov` | 원근 카메라 FOV |
| `near`, `far` | 클리핑 거리 |

**반환 메서드**

| 메서드 | 설명 |
|---|---|
| `setMode("perspective" \| "orthographic")` | 카메라 전환 (현재 시점 스냅샷 이어받음) |
| `getActiveCamera()` | 현재 활성 카메라 반환 |
| `fitToBounds(box3)` | 주어진 박스에 맞게 카메라 자동 배치 |
| `setTarget(vec3)` | OrbitControls 타겟 변경 |
| `resize(w, h)` | 창 크기 변경 시 호출 |
| `update()` | 매 프레임 호출 필요 |
| `dispose()` | 이벤트 리스너 및 컨트롤 해제 |

---

### `src/components/Sidebar.js`

고정 사이드바 UI. DungGeunMo 폰트, 초록 레트로 스타일.

**구성**
- 상단: 현재 화면명 + 대표 아이콘 (`#sidebar-header-screen`)
- 중간: 각 페이지별 히어로 이미지 `#sidebar-hero-img` (pixel-float 애니메이션)
- 하단: 메뉴 버튼 목록

**페이지별 아이콘 매핑 (`SCREEN_ICONS`)**

| 페이지명 | 아이콘 |
|---|---|
| 원재료 창고, 창고 내부 | `storage.png` |
| 부품공장(머리+몸통), 부품공장(팔+다리), 내부 | `factory.png` |
| 조립공장(몸통+다리+팔), 조립공장(최종), 내부 | `robotarm.png` |
| 이송라인 | `truck.png` |
| 격납고, 격납고 내부 | `hanger.png` |

**히어로 이미지 크기**
- 기본: 표준 크기
- `조립공장`으로 시작하는 페이지: `.is-large` 클래스 적용

---

### `src/components/Light.js`

**`addSunStyleLighting(scene)`**
- HemisphereLight (하늘: `0xcfe7ff`, 땅: `0x8fa878`)
- DirectionalLight (태양광: `0xfff8e7`, intensity 1.0)
- 외부 씬 공통으로 사용

---

## 페이지별 상세

### 원재료 창고 (`storage/`)

| 파일 | 역할 |
|---|---|
| `storage_main.js` | 외부 씬 초기화, 창고 3개 모델 배치, 클릭 시 내부 전환 |
| `storage.js` | GLB 창고 모델 로드 및 배치 |
| `floor/floor.js` | `_tile-factory.glb` 타일 바닥 배치 |
| `coords.js` | `fitRootToAxisAlignedDimensions()` — 지정 크기에 맞게 non-uniform 스케일 조정 |

### 창고 내부 (`storage_inside/`)

| 파일 | 역할 |
|---|---|
| `storage_inside_main.js` | 내부 씬 초기화, 카메라 고정 시점 |
| `floor.js` | 내부 바닥 타일 배치 |
| `material.js` | 팔레트 위 박스 스택 절차적 생성 |
| `inside_light.js` | AmbientLight + DirectionalLight 2개 + PointLight 12개 |

### 부품공장 1·2 (`parts_factory1/`, `parts_factory2/`)

| 파일 | 역할 |
|---|---|
| `factory1_main.js` / `factory2_main.js` | 외부 씬, 클릭 시 내부 전환 |
| `fatory.js` | 공장 건물 GLB 로드 |
| `floor.js` | 바닥 타일 배치 |

### 부품공장 내부 (`parts_factory1_inside/`, `parts_factory2_inside/`)

| 파일 | 역할 |
|---|---|
| `parts1_inside_main.js` / `parts2_inside_main.js` | 내부 씬, 좌우 생산라인 애니메이션 |
| `floor.js` | 내부 바닥 |
| `left_animation.js` | 왼쪽 라인 상태머신 (머리 제조) |
| `right_animation.js` | 오른쪽 라인 상태머신 (몸통 제조) |
| `left/`, `right/` | 개별 기계 GLB 로더 모음 |

**기계 컴포넌트 (`left/`, `right/` 공통)**

| 파일 | 기계 종류 |
|---|---|
| `conveyor.js` | 컨베이어 벨트 |
| `cutting_machine.js` | 절삭기 |
| `robot_arm1.js` | 범용 로봇팔 (AnimationMixer) |
| `robot_arm_body.js` / `robot_arm_head.js` | 부위별 특화 로봇팔 |
| `press.js` | 프레스기 |
| `xf6300.js` | 용접/결합 장비 |
| `box.js` | 완성품 박스 |

### 조립공장 1·2 (`join_factory1/`, `join_factory2/`)

외부 구조는 부품공장과 동일. 내부는 컨베이어 + 로봇팔로 몸통/다리/팔/머리를 순차 조립한다.

| 파일 | 역할 |
|---|---|
| `join1_inside_main.js` / `join2_inside_main.js` | 내부 씬, 컨베이어 배치, 로봇팔 로드 |
| `join1_animation.js` / `join2_animation.js` | 조립 시퀀스 상태머신 |
| `conveyor.js` | 컨베이어 GLB 로더 (getBounds 반환) |
| `robotarm_body.js` / `robotarm_arm.js` / `robotarm_head.js` | 로봇팔 로더 (mixer·actions 반환) |

**조립 시퀀스 (join1_animation)**
1. Body 컨베이어에서 몸통 이동
2. Leg 컨베이어에서 다리 이동 → 로봇팔 결합
3. Arm 컨베이어에서 팔 이동 → 로봇팔 결합
4. 완성품 배출

### 이송라인 (`transfer1/`, `transfer2/`)

| 파일 | 역할 |
|---|---|
| `transfer_main.js` | 씬 초기화, 3구역 색상 가이드, 경로 선택 버튼 |
| `floor.js` | `transfer_tile.glb` 바닥 배치 |
| `truck.js` | 트럭 2대 왕복 애니메이션 |

**트럭 설정 (`truck.js`)**

| 상수 | 값 | 설명 |
|---|---|---|
| `ROAD1_Z` | 5.313 | 1번 도로 Z좌표 (+X 방향 이동) |
| `ROAD2_Z` | -6.349 | 2번 도로 Z좌표 (-X 방향 이동) |
| `TRUCK_SPEED` | 20 | 이동 속도 |
| `TRUCK_SCALE` | 0.5 | 모델 스케일 |
| `TRUCK_Y` | 5.0 | 지면 위 높이 |

**이송라인 경로 버튼**
- "원재료 창고 → 조립공장 1, 2" → `transfer1`
- "최종 조립공장 → 격납고" → `transfer2`

### 격납고 (`hanger/`, `hanger_inside/`)

| 파일 | 역할 |
|---|---|
| `hanger_main.js` | 외부 씬, 중앙 건물 클릭 시 내부 전환 |
| `hanger/floor.js` | `_tile-factory.glb` 바닥 (storage 공용 에셋) |
| `hangar.js` | 격납고 건물 3동 GLB 로드 |
| `hanger_inside_main.js` | 내부 씬, 스탠드 10개 배치, 전시 조명 |
| `hanger_inside/floor.js` | `hanger_tile.glb` 내부 바닥 |
| `stand.js` | 전시 스탠드 10개 배치 (좌5 / 우5) |

**스탠드 배치 (`stand.js`)**

| 그룹 | X | rotationY | Z 위치 (5개) |
|---|---|---|---|
| LEFT_STANDS | -3.935 | +π/2 | -30.259, -8.316, 13.819, 35.953, 58.088 |
| RIGHT_STANDS | 91.694 | -π/2 | -30.373, -8.239, 13.896, 36.032, 57.972 |

**격납고 내부 조명**
- AmbientLight intensity: 1.8
- DirectionalLight intensity: 2.4
- PointLight 9개 (그리드 배치, intensity 각 1.2)

---

## 공통 패턴

### 페이지 init 함수 기본 구조

```js
export function initXxxApp({ scene, renderer, canvas, onEnterInside }) {
  // 1. 배경색 + 조명
  scene.background = new THREE.Color(0x...);

  // 2. 카메라 컨트롤
  const viewControls = createViewModeControls({ renderer, domElement: canvas, ... });
  viewControls.setMode("perspective");

  // 3. 에셋 로드 + setSceneReady 등록
  setSceneReady(
    loadFloor(scene).then(...).catch(...)
  );

  // 4. 이벤트 리스너
  window.addEventListener("resize", onResize);
  window.addEventListener("app:viewmode-change", onSidebarViewModeChange);

  // 5. 애니메이션 루프
  let rafId = 0, disposed = false;
  function animate() {
    if (disposed) return;
    viewControls.update();
    renderer.render(scene, viewControls.getActiveCamera());
    rafId = requestAnimationFrame(animate);
  }
  animate();

  // 6. dispose 반환
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("app:viewmode-change", onSidebarViewModeChange);
      viewControls.dispose();
    },
  };
}
```

### setSceneReady 사용 패턴

```js
// 단순 로드
setSceneReady(addFloor(scene).catch(console.error));

// 여러 비동기 작업 병렬 대기
setSceneReady(Promise.all([
  addFloor(scene).catch(console.error),
  anim.loadTemplates().catch(console.error),
]));

// 체이닝
setSceneReady(
  addFloor(scene)
    .then(({ getBounds }) => { viewControls.fitToBounds(getBounds()); })
    .catch(console.error)
);
```

### 좌표 변환 (Blender → Three.js)

| Blender | Three.js |
|---|---|
| Y 축 값 | -Z 축 값 (부호 반전) |
| Z 회전 270° | Y 회전 `-Math.PI/2` |
| Z 회전 90° | Y 회전 `+Math.PI/2` |

---

## 에셋 경로

```
public/
└── assets/
    ├── font/
    │   └── DungGeunMo.ttf
    ├── icon/
    │   ├── storage.png
    │   ├── factory.png
    │   ├── robotarm.png
    │   ├── truck.png
    │   └── hanger.png
    └── blend/
        ├── hanger_tile.glb       # 격납고 내부 바닥
        ├── transfer_tile.glb     # 이송라인 바닥
        └── ...
```

> GLB 모델 중 일부는 `src/pages/xxx/` 폴더 내에 직접 위치하며  
> `new URL("./xxx.glb", import.meta.url).href` 패턴으로 참조한다.

---

## 트러블슈팅

### 1. 잘못된 폴더의 `floor.js` 수정 → 화면 깨짐

**증상**  
격납고 외부 화면이 완전히 깨졌다.

**원인**  
`hanger_inside/floor.js`를 수정해야 하는데 `hanger/floor.js`를 수정해버렸다.  
두 폴더가 이름이 비슷해서 혼동하기 쉽다.

**해결**  
- `hanger/floor.js` → `_tile-factory.glb` 사용 (storage 공용 에셋)  
- `hanger_inside/floor.js` → `hanger_tile.glb` 사용 (격납고 내부 전용)

**교훈**  
`hanger`와 `hanger_inside`는 완전히 다른 씬이다. 파일 경로를 항상 두 번 확인할 것.

---

### 2. 화면 전환 중 씬이 깜빡이며 로딩됨

**증상**  
검은 타일이 다 채워지기 전에 새 씬이 이미 렌더링되어 화면이 번쩍였다.

**원인**  
`fadeToBlack()`이 resolve되는 타이밍에 `currentApp = initXxxApp(...)` 이 호출되는데,  
씬 로딩(`addFloor`, `addTrucks` 등)이 비동기라서 타일이 사라지는 도중에도 로딩이 계속 진행됐다.

**해결**  
`setSceneReady(loadingPromise)` 시스템 도입.  
`revealFromBlack()` 이 `_sceneReady` Promise가 완료될 때까지 타일 제거를 시작하지 않는다.

```js
// Transition.js
export function revealFromBlack() {
  _sceneReady.then(() => {
    // 로딩 완료 후에만 타일 제거 시작
    tiles.forEach(...);
  });
  _sceneReady = Promise.resolve(); // 초기화
}
```

**교훈**  
새 페이지 init 함수를 만들 때 반드시 `setSceneReady(메인로딩Promise)`를 호출해야 한다.  
빠뜨리면 이전 페이지의 `Promise.resolve()`가 남아있어 즉시 reveal되어 버린다.

---

### 3. fadeToBlack을 일찍 resolve시켰더니 전환이 끊겨 보임

**증상**  
타일이 55% 채워진 시점에 resolve해서 씬 로딩을 병렬로 진행시켰더니 전환 애니메이션이 뚝뚝 끊겼다.

**원인**  
`fadeToBlack` Promise resolve와 씬 초기화(`THREE.WebGLRenderer` 작업)가 같은 JS 스레드에서 경쟁하면서 프레임 드랍 발생.

**해결**  
`fadeToBlack`은 **모든 타일이 다 채워진 후(`MAX_DIAG * STEP_MS + 80ms`)** 에만 resolve한다.  
씬 로딩은 타일이 채워지는 동안 백그라운드에서 진행되고, `revealFromBlack`이 완료를 기다린다.

```
타일 채워지는 중(~920ms)   →   씬 로딩도 동시에 진행
타일 전부 채워짐           →   fadeToBlack resolve
                           →   initXxxApp 호출 (이미 로딩 완료되어 있음)
revealFromBlack 호출       →   _sceneReady 기다렸다가 타일 제거 시작
```

---

### 4. Blender 좌표를 Three.js에 그대로 사용하면 위치가 틀림

**증상**  
Blender에서 확인한 오브젝트 Y 좌표를 Three.js `position.z`에 그대로 넣으면 반대 방향에 배치된다.

**원인**  
Blender는 Z-up 좌표계, Three.js는 Y-up 좌표계를 사용한다.  
GLB로 export하면 Three.js용으로 자동 변환되지만, 직접 좌표를 입력할 때는 수동 변환이 필요하다.

**변환 규칙**

| Blender 값 | Three.js 적용 |
|---|---|
| Location Y | `position.z`에 **부호 반전**해서 대입 |
| Location X | `position.x` 그대로 |
| Rotation Z = 270° | `rotation.y = -Math.PI / 2` |
| Rotation Z = 90° | `rotation.y = Math.PI / 2` |

---

### 5. GLB 파일을 `src/pages/` 안에 뒀을 때 경로 오류

**증상**  
`/assets/blend/xxx.glb` 같은 절대 경로로 참조하면 `public/` 폴더 안 파일은 찾지만, `src/pages/` 안에 있는 GLB는 404 오류가 난다.

**원인**  
Vite에서 `src/` 안의 바이너리 파일은 번들링 대상으로 처리되므로 URL이 빌드 후 바뀐다.

**해결**  
`import.meta.url`을 사용해 상대 경로로 참조한다.

```js
// 올바른 방법
const MODEL_URL = new URL("./building.glb", import.meta.url).href;

// 잘못된 방법 (빌드 후 경로 불일치)
const MODEL_URL = "/src/pages/hanger/building.glb";
```

`public/assets/blend/` 안에 있는 파일은 절대 경로(`/assets/blend/xxx.glb`)로 참조해도 된다.

---

### 6. 체커 오버레이 안에서 `position: absolute`가 안 먹힘

**증상**  
`.checker-overlay`가 `display: grid`라서 자식 요소에 `position: absolute`를 줘도 그리드 셀 안에 갇혀버렸다.

**원인**  
grid 컨테이너의 직계 자식은 grid item이 되어 `position: absolute`가 예상대로 동작하지 않을 수 있다.

**해결**  
`.checker-overlay`는 이미 `position: fixed`라 containing block 역할을 한다.  
자식 요소에 `position: absolute`를 주면 오버레이 기준으로 정확히 배치된다.  
단, 텍스트/아이콘 래퍼는 그리드 플로우에서 벗어나도록 `position: absolute`로 설정하면 그리드 셀을 차지하지 않는다.

```css
.checker-loading-wrap {
  position: absolute; /* grid flow에서 제거, .checker-overlay 기준 배치 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

---

### 7. `join_factory1_inside`에서 `loadTemplates()`가 두 번 호출되어 GLB 중복 로드

**증상**  
조립공장1 내부 진입 시 GLB 모델이 2번 씩 로드되어 메모리 낭비 및 씬에 모델이 겹쳐서 배치됐다.

**원인**  
`setSceneReady`를 도입하면서 `anim.loadTemplates()`를 `Promise.all` 안에 넣었는데, 기존에 파일 하단에 남아있던 `anim.loadTemplates().catch(console.error)` 호출을 제거하지 않았다.

**해결**  
`setSceneReady(Promise.all([..., anim.loadTemplates()...]))` 로 통합하고,  
중복 호출 라인을 삭제.

**교훈**  
`setSceneReady` 도입 시 기존의 독립적인 `loadTemplates()` / `addFloor()` 호출이 남아있는지 반드시 확인할 것.

---

## 개발 환경

```bash
npm install
npm run dev    # Vite 개발 서버 실행
npm run build  # 프로덕션 빌드
```
