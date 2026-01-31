# 프로젝트 코드 분석 리포트

현재 진행 중인 '블로그 책장 만들기' 프로젝트의 코드 구조와 주요 로직을 분석한 내용입니다.

## 1. 프로젝트 개요
이 프로젝트는 **React**와 **Vite**를 기반으로 하며, **Three.js (@react-three/fiber)**를 사용하여 3D 가상 서재를 구현한 웹 애플리케이션입니다. 사용자는 3D 공간의 책장에서 책을 선택하여 블로그 글처럼 읽을 수 있습니다.

### 주요 기술 스택
- **Core**: React 19, TypeScript, Vite
- **3D Rendering**: @react-three/fiber (Three.js의 React 래퍼), @react-three/drei (유용한 컴포넌트 모음)
- **Styling**: CSS Modules, Vanilla CSS
- **State Management**: React Hooks (`useState`, `useMemo`, Custom Hooks)

## 2. 프로젝트 구조 (Project Structure)

```
src/
├── components/       # UI 및 3D 컴포넌트
│   ├── Scene3D.tsx       # 3D 캔버스 및 조명/환경 설정
│   ├── Book3DModel.tsx   # 개별 책의 3D 모델 렌더링
│   ├── Shelf3D.tsx       # 3D 선반 모델
│   ├── BookDetail.tsx    # 책 클릭 시 나오는 상세 모달
│   └── ...
├── data/
│   └── books.ts          # 책 데이터 (정적 배열)
├── hooks/
│   └── useBooks.ts       # 책 검색 및 필터링 로직을 담은 커스텀 훅
├── App.tsx           # 메인 레이아웃 및 로직 조합
└── main.tsx          # 엔트리 포인트
```

## 3. 핵심 로직 및 데이터 흐름

### A. 데이터 관리 (`books.ts`)
- `books.ts` 파일에 `Book` 인터페이스와 실제 책 데이터 배열이 정의되어 있습니다.
- 각 책은 `contentHtml` 필드를 통해 Naver 블로그 스타일의 HTML 컨텐츠를 포함하고 있습니다.

### B. 상태 관리 및 필터링 (`App.tsx`, `useBooks.ts`)
1. **`useBooks` Hook**: `searchQuery`(검색어)와 `selectedCategory`(카테고리) 상태를 관리하며, 원본 `books` 데이터를 필터링하여 반환합니다.
2. **`App` 컴포넌트**:
   - `useBooks`에서 필터링된 책 목록을 받습니다.
   - 책들을 5권씩 묶어 `shelves` 배열(선반 단위)로 그룹화합니다.
   - 모바일 환경인지 감지하여 PC 접속 권장 화면을 띄우는 로직이 있습니다.

### C. 3D 렌더링 (`Scene3D.tsx` / `App.tsx` 내 Canvas)
Three.js 캔버스 내부에서는 다음과 같은 구조로 렌더링됩니다:

1. **Canvas 설정**: 카메라 위치, 조명(Ambient, Directional, Point), 그림자 설정.
2. **장면 구성**:
   - `shelves.map(...)`: 선반 그룹을 순회하며 Y축 위치를 계산해 배치합니다. (위에서 아래로)
   - `Shelf3D`: 각 그룹의 바닥에 선반 모델을 배치합니다.
   - `shelfBooks.map(...)`: 선반 내의 책들을 순회하며 X축 위치를 계산해 배치합니다.
   - `Book3DModel`: 실제 책의 3D 형태를 렌더링합니다. 클릭 이벤트(`onClick`)가 연결되어 있습니다.
3. **상호작용**:
   - `OrbitControls`: 마우스로 카메라를 회전/줌 할 수 있게 합니다.
   - 책 클릭 시 `setSelectedBook`이 호출되어 `showDetail` 상태가 `true`가 되고, 3D 씬 위에 `BookDetail` 오버레이가 뜹니다.

## 4. 주요 컴포넌트 상세

### `App.tsx`
애플리케이션의 뼈대입니다. 헤더, 카테고리 필터, 그리고 3D 캔버스 영역을 배치합니다. 모바일 사용자에게는 경고 화면을 보여주는 방어 로직이 포함되어 있습니다.

### `Book3DModel.tsx` (추정)
개별 책을 3D로 그립니다. 책의 `sizeWidth`, `sizeHeight`, `sizeDepth` 데이터를 사용하여 BoxGeometry(직육면체) 형태로 렌더링하고, 텍스처(표지 이미지)를 매핑하는 역할을 합니다.

### `BookDetail.tsx`
책을 클릭했을 때 나타나는 오버레이 뷰입니다. `books.ts`에 있는 HTML 문자열(`contentHtml`)을 렌더링하여 실제 내용을 보여줍니다.

## 요약
이 프로젝트는 **데이터(배열) → 필터링(Hook) → 3D 장면 배치(Canvas iteration)**의 깔끔한 단방향 데이터 흐름을 가지고 있습니다. 로직과 뷰가 적절히 분리되어 있어 유지보수에 용이한 구조입니다.
