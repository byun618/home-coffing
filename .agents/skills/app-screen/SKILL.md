---
name: app-screen
description: "home-coffing apps/app(Expo + expo-router + React Query)에 화면·폼·탭·React Query hook 추가/수정 시 사용. 트리거: '화면 추가/수정', '폼 만들어줘', 'expo-router에 라우트 추가', 'React Query hook', 'apps/app UI 변경', 'NativeWind 스타일'. apps/api·shared-types만 건드릴 때는 트리거 X."
---

# app-screen — Expo 화면 추가 패턴

app-builder가 사용. apps/app은 Expo SDK 54 + expo-router 파일 기반 라우팅 + React Query + NativeWind.

## 라우팅 (expo-router)

- `apps/app/app/` 디렉토리가 라우트 root.
- 라우트 그룹: `(main)` (인증 후), `(public)` (인증 전).
- entity별 디렉토리 유지: `app/beans/`, `app/records/`, `app/cafes/` 등.
- 새 탭/스택 추가는 planner와 재확인.

## 데이터 페칭

1. `apps/app/src/lib/api/{entity}.ts`에 fetcher 함수 정의 (API 클라이언트 wrapper 사용).
2. React Query hook으로 노출 (`useQuery`, `useMutation`).
3. mutation은 `onSuccess`에서 관련 `queryClient.invalidateQueries`.
4. 화면에서는 hook만 import. `fetch` 직접 호출 X.

## 인증

- 401 시 refresh, refresh 실패 → `(public)/login` 이동. 이 플로우는 이미 lib 단에 구현 — 새 화면도 동일 패턴 재사용.

## 타입

- `@home-coffing/shared-types`에서 import. **로컬 재정의 금지.**
- 누락된 DTO는 types-keeper에게 요청. 임의로 `as BeanResponse` 단언 금지.

## UI / 스타일

- **`spec/design-system.md` + `spec/design-system.pen`을 앵커로** — 톤·컴포넌트 카탈로그 준수. 새 컴포넌트가 기존 카탈로그와 모순 X.
- NativeWind className 우선. inline style은 동적 값 / NativeWind로 표현 불가한 경우만.
- 공통 컴포넌트는 `apps/app/src/components/` 평탄. 새 컴포넌트가 1회용이면 화면 내부 정의.
- 화면이 `spec/design.pen` S## frame과 매핑되는지 Pencil MCP로 확인 (픽셀 일치 X, 레이아웃·구성 정합성만).

## 권한 분기 UI

- admin only 액션은 member에게 **비노출** (disabled 아님).
- 작성자 only 액션은 다른 사람에게 비노출.

## 이벤트 발화

- `spec/event-taxonomy.md` 매핑된 이벤트는 Amplitude wrapper로 발화. wrapper 우회 직접 호출 금지.
- 신규 이벤트는 dev-plan의 `### events` 항목에 명시되어 있어야 함.

## 코드 컨벤션

- `as` 단언 기피. discriminated union + switch narrowing.
- 함수 파라미터 2개 이상 → 단일 객체.
- 수정 범위 최소화 — 무관한 컴포넌트 리팩터 금지.

## 트리거 금지

- apps/api endpoint 추가 → `entity-module`
- DTO 정의/수정 → `dto-sync`
- 단순 텍스트·아이콘 변경 (이 스킬은 화면/hook 단위 작업 대상)
