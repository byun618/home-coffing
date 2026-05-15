---
name: home-coffing-dev
description: home-coffing 코드 레포(apps/api, apps/app) ticket 기반 개발 사이클 오케스트레이터. "ticket 002 개발 시작", "T003 dev plan 작성", "API bean 모듈 추가", "Expo 앱 화면 구현", "QA 돌려줘", "Critical 이슈 수정", "스키마 업데이트", "screens.md 갱신", "ticket done 처리" 등 home-coffing의 ticket developing/reviewing 단계 작업이 언급되면 반드시 이 스킬을 사용. 사용자 컨펌 후 자동 실행 모델 — dev-plan만 사람이 검토, 이후 코드 작성과 QA는 팀이 자동. 다른 프로젝트의 일반 개발 작업에는 트리거하지 말 것 — home-coffing 도메인 전용. 분석/디자인 단계는 brain 레포에서 진행하므로 이 스킬에서는 다루지 않음.
---

# home-coffing-dev

home-coffing 코드 레포의 **ticket 기반 dev 사이클**을 오케스트레이션한다. brain 레포의 ticket 폴더(`tickets/NNN/`)를 입력으로, 실제 코드(`apps/api`, `apps/app`) 변경과 QA, ticket done 마무리(spec 갱신)까지 수행한다.

**핵심 모델:** dev-plan만 사용자 컨펌 후 자동 실행. 매 커밋 단위로 멈추지 않는다. 분석·디자인 단계는 brain 레포에서 종료된 상태로 진입한다고 가정한다.

## brain 레포 ticket 모델 (간단 요약)

> 자세히는 `~/brain/projects/home-coffing/tickets/CLAUDE.md` 참고.

- 작업 단위: `tickets/NNN/` (3자리 글로벌 ID)
- 상태: open → analyzing → analyzing-done → designing → developing → reviewing → done
- 산출물: `ticket.md` (분석 누적), `CLAUDE.md` (요약), `design.md` (필요 시), `dev-plan.md`, `qa.md`
- **이 스킬의 진입 조건**: 상태가 `analyzing-done` 또는 `designing` 완료 — 즉 "어떻게 만들지" 결정이 끝난 상태
- ticket done 시: `screens.md` 라인 추가/수정 + ticket ref. 필요 시 `event-taxonomy.md`, `design-system.md`, `design.pen` 갱신.

## Phase 0: 컨텍스트 확인

호출 즉시 다음을 확인:

**1. ticket 식별**
- 사용자 명시 우선 (예: "ticket 002 개발 시작")
- 미명시면 `tickets/CLAUDE.md` 인덱스에서 `developing` 또는 `analyzing-done`(developing 대기) 상태 ticket을 후보로 제시

**2. ticket 폴더 읽기**
- `~/brain/projects/home-coffing/tickets/NNN/CLAUDE.md` (요약)
- `~/brain/projects/home-coffing/tickets/NNN/ticket.md` (분석)
- `~/brain/projects/home-coffing/tickets/NNN/design.md` (있으면)
- `~/brain/projects/home-coffing/tickets/NNN/dev-plan.md` (있으면 → 재실행/이어서 모드 시그널)
- `~/brain/projects/home-coffing/tickets/NNN/qa.md` (있으면 → 이전 QA 결과)

**3. spec 앵커 읽기**
- `~/brain/projects/home-coffing/spec/screens.md` (영향 라인 식별 — ticket의 `screens_lines:` 메타 참고)
- `~/brain/projects/home-coffing/spec/event-taxonomy.md` (이벤트 발화 점검용)
- `~/brain/projects/home-coffing/spec/design-system.md` (디자인 톤·컴포넌트 카탈로그)
- `~/brain/projects/home-coffing/spec/design.pen` (Pencil MCP로만 — 영향 S## 확인)

**4. 운영 가드레일 즉시 점검**
- `references/operations-summary.md` (`docs/operations.md` 압축본)에 정리된 절대 금지 항목. 사용자 요청이 위반이면 즉시 차단 후 사유 보고.

**5. 실행 모드 결정**

| 상황 | 모드 |
|---|---|
| `dev-plan.md` 미존재 | **신규 dev-plan 작성 모드** (Phase 1) |
| `dev-plan.md` 존재 + 코드 미변경 | **신규 실행 모드** (Phase 2) |
| `dev-plan.md` 존재 + 일부 모듈 완성 (`qa.md` 또는 진행 표 존재) | **이어서 실행 모드** |
| 사용자가 "QA만" / "특정 모듈만" 명시 | **부분 실행 모드** |
| 사용자가 "ticket done 처리" 명시 | **마무리 모드** (Phase 3 단독) |

## Phase 1: dev-plan 작성 (신규일 때만)

dev-plan은 본 오케스트레이터(메인 컨텍스트)가 직접 작성한다. 이유: 작성 과정에서 사용자 검토·즉답이 필요한 결정 분기가 자주 나오므로 에이전트 위임보다 메인이 효율적.

### 작성 절차

1. ticket의 `ticket.md` / `design.md`에서 신규 API·화면·이벤트·데이터 모델 변경 추출
2. spec 앵커에서 영향 받는 화면(S##)·이벤트·디자인 톤 식별
3. `tickets/NNN/dev-plan.md` 작성:

```markdown
# Ticket NNN — Dev Plan

> **상태:** 🟡 리뷰 중
> **앵커:** ./ticket.md, ./design.md, ../../spec/screens.md, ../../spec/event-taxonomy.md, ../../spec/design-system.md, ../../spec/design.pen
> **영향 screens.md 라인:** {ticket의 screens_lines 메타와 동일}

## 1. 변경 범위 요약
- API: (신규 모듈 / 수정 모듈)
- App: (신규 라우트 / 컴포넌트 / 훅)
- Web: (해당 시)
- 데이터 모델: (entities/ 변경 — 코드 SoT 기준)
- 이벤트: (event-taxonomy 추가/변경 매핑)

## 2. API 작업
### {모듈명}
- 엔티티 변경: ...
- 신규 엔드포인트: ...
- DTO 변경: ...
- shared-types export: ...
- 마이그레이션: schema:update 필요 여부 + 파괴적 변경 유무

## 3. App 작업
### {라우트/화면 — design.pen S##}
- 신규 화면 / 변경 화면
- 컴포넌트 의존성: design-system.md 어느 카탈로그
- 훅 변경 (lib/api/ 하위)
- API 호출 변경

## 4. shared-types 변경
- (DTO·Response 인터페이스 추가/변경)

## 5. 작업 순서 (의존 그래프)
1. shared-types 추가
2. API 모듈 X
3. App 화면 Y (X 완료 후)
4. ...

## 6. QA 체크리스트 (모듈별)
- API ↔ Client shape 일치
- 인증 흐름 (401 분기)
- 권한 분기 UI
- event-taxonomy 발화 위치
- design-system 톤 정합

## 7. ticket done 시 spec 갱신 항목
- screens.md 라인: ...
- event-taxonomy.md: 추가/없음
- design-system.md: 추가/없음
- design.pen: 갱신/없음

## 8. 미해결 이슈 / 결정 필요
- (있으면)
```

4. 사용자에게 dev-plan 경로와 작업 순서 요약을 보여주고 **명시 컨펌 요청**: "이대로 자동 실행 진입할까요?"
5. 사용자 컨펌 후 Phase 2 진입. **컨펌 없으면 대기 (자동 진입 금지).**

## Phase 2: 자동 실행 (팀 모드)

dev-plan 컨펌 후 에이전트 팀을 구성하여 자동 실행한다.

### 2-1. 팀 구성

```
TeamCreate(
  team_name: "home-coffing-dev-NNN",
  members: ["api-engineer", "client-engineer", "qa-engineer"]
)
```

리더는 본 오케스트레이터(메인 컨텍스트). 모든 Agent 호출에 `model: "opus"` 명시.

### 2-2. 작업 할당 (TaskCreate)

dev-plan의 "작업 순서" 섹션을 기반으로 의존성 있는 TaskCreate 발행:

```
Task A: shared-types 추가 (api-engineer 또는 메인 직접)
Task B: API 모듈 X 구현 (api-engineer, blockedBy: A)
Task C: App 화면 Y 구현 (client-engineer, blockedBy: B)
Task D: QA 모듈 X+Y (qa-engineer, blockedBy: C)
```

### 2-3. 실행 흐름 (점진적 QA)

**핵심: QA를 모듈 완성 직후마다 호출. 전체 완료 후 1회 X.**

1. shared-types 먼저 (양쪽 의존)
2. api-engineer가 API 모듈 1 작업 → 완료 보고 → qa-engineer 호출 (api 단독 점검: dto·entity·event 발화)
3. client-engineer가 해당 모듈의 클라이언트 작업 → 완료 보고 → qa-engineer 호출 (api ↔ client shape 교차 비교)
4. qa-engineer가 Critical 이슈 보고 시 → 즉시 해당 엔지니어에게 SendMessage로 정정 요청 → 재검증
5. 한 모듈 완료 → 다음 모듈로
6. 모든 모듈 완료 후 마지막으로 통합 QA 1회 (전체 흐름 + spec 정합)

### 2-4. 진행 기록

진행 상태는 ticket 폴더의 `dev-plan.md` 본문 또는 별도 섹션에 누적하지 않는다. **`qa.md`에 모듈 단위 QA 로그가 누적되며, 그것이 진행 기록 역할**을 한다 (qa.md 항목 수 = 진행도).

복잡한 경우(작업이 며칠에 걸침)에만 `tickets/NNN/dev-plan.md` 본문 상단의 상태 마커(🟡 → 🟢)나 체크박스를 갱신한다.

## Phase 3: 마무리 (ticket done 처리)

전체 코드 변경 + 통합 QA 완료 후 ticket을 done 상태로 매듭짓는다.

### 3-1. ticket done 체크리스트 (`tickets/CLAUDE.md`의 표준)

- [ ] 코드 머지 완료 (사용자 컨펌 후 별도)
- [ ] `spec/screens.md` 라인 추가/수정 + ticket ref `T### (YYYY-MM-DD)`
- [ ] `spec/event-taxonomy.md` — 새 이벤트 추가 시
- [ ] `spec/design-system.md` — 톤·원칙·컴포넌트 카탈로그 변경 시
- [ ] `spec/design.pen` — visual 변경 시 (Pencil MCP로)
- [ ] `tickets/CLAUDE.md` 인덱스 → Done 섹션으로 이동 (날짜 + ticket ref)
- [ ] 해당 ticket의 `CLAUDE.md`/`ticket.md` 상단 frontmatter `status` → `done`, `updated` 갱신

### 3-2. spec 갱신 작성 가이드

**screens.md 라인 형식 (`spec/CLAUDE.md` 표준):**
```markdown
- ✅/🟡/🔴 기능 설명 — T### (YYYY-MM-DD)
- ~~취소선 기능~~ — T### 추가 → T### 롤백 (YYYY-MM-DD, 사유)
```

**ticket-ref 종류:**
- `T### (YYYY-MM-DD)` — 본 ticket
- `T### → T###` — 추가 후 변경

### 3-3. 사용자 보고

- 변경 파일 목록 (apps/api, apps/app 별)
- 신규 엔드포인트·화면·이벤트 요약
- spec 갱신 요약 (어느 라인이 추가/변경)
- 미해결 QA 이슈 (있으면, 라벨별)
- **`git commit` / `git push`는 자동화하지 않는다.** 사용자 컨펌 후 별도 단계.

## 실행 모드 (Phase별)

**하이브리드** — Phase별로:

| Phase | 모드 |
|---|---|
| 0 (컨텍스트 확인) | 메인 직접 |
| 1 (dev-plan 작성) | 메인 직접 (사용자 컨펌 중심) |
| 2 (자동 실행) | **에이전트 팀** (api-engineer + client-engineer + qa-engineer, TeamCreate 활용) |
| 3 (마무리) | 메인 직접 (.pen 갱신은 client-engineer에 위임 가능) |

## 데이터 전달 프로토콜

| 데이터 | 전달 방식 | 위치 |
|---|---|---|
| dev-plan | 파일 | `tickets/NNN/dev-plan.md` |
| QA 결과 (진행 기록 겸) | 파일 (누적) | `tickets/NNN/qa.md` |
| 팀 통신 (실시간 조율) | SendMessage | - |
| 작업 할당 | TaskCreate / TaskUpdate | - |
| 결과 보고 | Agent 도구 반환값 | - |
| ticket 상태 갱신 | ticket frontmatter + tickets/CLAUDE.md 인덱스 | - |

## 에러 핸들링

- **api ↔ client shape 불일치 (Critical)**: qa-engineer 즉시 보고 → 리더가 해당 엔지니어 재호출. 1회 재시도 후 재실패면 사용자에게 의사결정 요청.
- **운영 가드레일 위반 시도**: 즉시 차단. `docs/operations.md`(요약: `references/operations-summary.md`) 절대 금지 항목은 어떤 dev-plan이든 우회 금지. 위반 발견 시 dev-plan 자체를 사용자에게 다시 보내 수정 요청.
- **MikroORM schema:update 실패**: 즉시 중단. 데이터 손실 우려가 있으면 사용자 컨펌 없이 계속 진행 금지.
- **외부 의존(`pnpm install`, `npx expo install`, `pnpm schema:update`, `pnpm docker:deploy`, `eas build`)**: 사용자 권한 요청 — 자동 실행 X.
- **spec/data-model.md 또는 spec/component-library.md 참조 시도**: 이 파일은 더 이상 존재하지 않는다. 데이터 스키마 SoT는 코드 ORM, 컴포넌트 카탈로그는 `spec/design-system.md`. 잘못된 참조 발견 시 즉시 정정.

## 팀 크기 가이드

기본 3명 (api-engineer + client-engineer + qa-engineer). 늘리지 않는다 — 조율 오버헤드.

## 후속 작업 키워드

- "ticket NNN dev-plan / dev-plan 작성"
- "ticket NNN 개발 시작 / 진입 / 재개 / 이어서"
- "T### 개발", "T### QA"
- "API {모듈} 추가 / 수정"
- "Expo 앱 {화면} 구현"
- "스키마 업데이트", "schema:update"
- "QA 돌려줘", "qa 보강"
- "Critical 이슈 수정", "qa.md 후속"
- "shared-types 추가"
- "screens.md 갱신", "ticket done 처리", "spec 갱신"
- "이전 dev 결과 이어서"

## 트리거하지 말 것

- "ticket 분석", "ticket designing", "ticket analyzing" — brain 레포에서 진행 (이 하네스에서는 분석/디자인 단계 다루지 않음)
- 일반적인 "개발 / 구현" 단어가 home-coffing과 무관할 때
- brain의 다른 프로젝트(home-inventory 등) 코드 작업
- spec/data-model.md, spec/component-library.md 참조 요청 — 이 파일은 폐기됨

## 테스트 시나리오

**정상 흐름:**
사용자: "ticket 002 dev-plan 작성하고 진입"
→ Phase 0: tickets/002 폴더 확인 (status: analyzing-done), spec 앵커 확인, dev-plan.md 미존재 → 신규 모드
→ Phase 1: dev-plan.md 작성 → 사용자 컨펌
→ Phase 2: 팀 구성 → shared-types → api-engineer (모듈) → qa → client-engineer (화면) → qa → 다음 모듈 → ... → 통합 QA
→ Phase 3: screens.md 갱신, tickets/CLAUDE.md 인덱스 Done 이동, ticket frontmatter status=done

**에러 흐름:**
사용자: "API bean 모듈에 totalGrams nullable 추가"
→ Phase 0: 어느 ticket 소속인지 확인. 무관한 임의 변경이면 "이 변경의 분석/결정이 어느 ticket에 있나요? 없으면 brain 레포에서 ticket 먼저 만들어야 합니다 (home-coffing-planning 영역)"라고 사용자에게 의사결정 요청.

**부분 실행:**
사용자: "ticket 002 QA만 다시 돌려줘"
→ Phase 0: tickets/002/dev-plan.md, qa.md 존재 확인 → 부분 실행 모드
→ qa-engineer 단독 호출 (모듈별 점진적 QA 재실행)
→ 새 이슈를 qa.md에 누적 추가
