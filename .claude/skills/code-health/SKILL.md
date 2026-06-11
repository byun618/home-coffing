---
name: code-health
description: "home-coffing 코드 전반의 정기 유지보수 — 리팩토링 후보 발굴, 테스트 커버리지 점검·보강, 죽은 코드/중복 제거. 트리거: '코드 점검', '리팩토링 점검', '전반 리팩터', '테스트 커버리지 점검', '테스트 보강', 'code-health', '유지보수 작업', '리팩터 후보 찾아줘', 'apps/api 정리', 'apps/app 컴포넌트 정리', '다시 점검', '저번 점검 이어서'. 단일 파일 즉시 수정·일감 기반 기능 구현(feature-delivery)은 트리거 X."
---

# code-health — 정기 유지보수 스킬

home-coffing 코드 전반에 걸친 리팩토링·테스트 보강 작업. **일감 기반 feature-delivery와 분리**된 정기 점검용.

## 왜 별도 스킬인가

- feature-delivery는 일감 + API↔App 경계 변경 전제 → 팀 5명, types-keeper 잠금, qa 경계 비교가 의미 있음
- 유지보수 작업은 경계면이 안 움직이고 survey → prioritize → execute 패턴 → 팀 동원 시 헛작업
- 따라서 **메인 세션이 직접 진행** + 필요 시 general-purpose subagent로 survey 병렬화

## 3 모드

사용자 요청에서 모드를 판별. 명시 안 됐으면 **survey가 기본**.

| 모드 | 트리거 표현 | 산출물 |
|---|---|---|
| **survey** | "점검해줘", "후보 찾아줘", "현황 봐줘" | `_workspace/code-health-{YYYYMMDD}_survey.md` |
| **refactor** | "리팩터 해줘", "정리해줘" + 대상 | 코드 변경 + `_workspace/code-health-{YYYYMMDD}_changes.md` |
| **test** | "spec 추가", "테스트 보강", "커버리지" | 코드 변경 (`*.spec.ts`) + changes 기록 |

## 워크플로우

### Phase 0: 컨텍스트 확인

- `_workspace/code-health-*` 존재 + 사용자가 "이어서/다시" → 가장 최근 survey 읽고 미처리 항목 재제시
- 없음 → 새 survey 시작

### Phase 1: Survey

대상 범위를 사용자에게 확인 — `apps/api`, `apps/app`, `packages/shared-types`, 전체 중 택.

**Survey 항목 (체크리스트):**
- 리팩터 후보
  - 모듈 패턴 위반 (controller에 비즈니스 로직, service 우회 등)
  - 중복 로직 (entity별 동일 패턴, 추출 가능)
  - `as` 단언 사용처
  - 함수 파라미터 3개 이상인데 객체로 안 묶인 곳
  - 사용처 없는 export / 죽은 코드
  - apps/app 컴포넌트 폴더 중첩 시도 흔적
- 테스트 공백
  - 순수 함수 / 헬퍼 중 spec 없는 것
  - 최근 추가된 모듈 (`git log --since` 기반) spec 누락
  - 경계 케이스 분명한데 spec 없는 service 메서드
- 컨벤션 드리프트
  - shared-types 우회 (로컬 type 재정의)
  - SQL alias 축약 사용
  - 폰트·색·아이콘 하드코딩 (디자인 시스템 우회)
  - Amplitude wrapper 우회 직접 호출

범위 넓으면 `Explore` 서브에이전트 1~2개로 병렬 스캔. 결과를 survey 파일에 표 형식으로 기록.

```markdown
## Code Health Survey ({YYYY-MM-DD})

### 리팩터 후보
| # | 위치 | 문제 | 권장 액션 | 우선순위 |
|---|---|---|---|---|

### 테스트 공백
| # | 대상 | 이유 | 권장 spec | 우선순위 |
|---|---|---|---|---|

### 컨벤션 드리프트
| # | 위치 | 위반 | 수정안 | 우선순위 |
|---|---|---|---|---|
```

### Phase 2: Prioritize

survey 결과를 사용자에게 보여주고 **이번 세션에 처리할 항목**을 고르게 한다. 임의로 전체 실행 X.

사용자 선호: 수정 범위 최소화. 高 우선순위 + 묶을 수 있는 것 위주로 3~7개 제안.

### Phase 3: Execute

선택한 항목을 순차 실행. **각 항목은 독립 커밋 단위**로 생각.

- **refactor 모드**: Edit/Read로 직접 수정. 복잡하면 메인 세션이 진행, 단순 변환(rename, 추출)이면 general-purpose subagent.
- **test 모드**: 대상 옆에 `{name}.spec.ts` 작성. DB 의존이면 EntityManager 모킹, 모킹이 과하면 건너뛰고 changes에 명시.

각 변경마다:
1. 변경 전 동작 메모 (한 줄)
2. 변경 후 의도 (한 줄)
3. `_workspace/code-health-{YYYYMMDD}_changes.md`에 누적

### Phase 4: 검증

모든 변경 후 1회:
```bash
pnpm --filter @home-coffing/api build
pnpm --filter @home-coffing/api test
pnpm --filter @home-coffing/app exec tsc --noEmit
```

실패 시 해당 변경 revert 또는 수정. 사용자 보고.

### Phase 5: 보고

`changes.md` 요약 + 처리 안 된 survey 항목 잔여 목록 제시. 다음 세션에 "이어서" 트리거 가능하게 survey 파일 보존.

커밋 메시지 초안: `refactor: {요약}` / `test(api): {대상} spec 추가`.

## 작업 원칙

- **수정 범위 최소화** — 한 번에 한 관심사. 무관한 cleanup 끼워넣지 마라.
- **사용자 prioritize 단계 생략 금지** — 전체 자동 실행이 가장 흔한 사고 원인.
- **검증 실패 = blocking** — 그냥 넘어가지 마라.
- **survey-only 요청이면 Phase 1만** — 사용자가 "찾아만 봐줘"라 했으면 후보 제시하고 종료.

## 트리거 금지

- 단일 파일 즉시 수정 (`"X 함수 이름 바꿔줘"`) — 직접 Edit
- 일감 기반 기능 구현 → `feature-delivery`
- 단순 typo·import 정리
- 코드 리뷰 (스타일·리뷰 코멘트) → `review` 스킬
- 변경 diff 점검 → `simplify` 스킬 (변경된 코드 한정)

## simplify 스킬과의 차이

- `simplify`: 방금 변경한 코드(diff 영역)를 정리
- `code-health`: 변경 안 한 영역까지 포함한 전반 점검 — survey 단계가 본질
