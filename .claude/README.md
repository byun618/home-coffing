# home-coffing 하네스

home-coffing 코드 레포의 Claude Code 자동화 구성. 5 agents + 8 skills로 일감(LIFE-N) 단위 디자인→dev→qa 사이클을 오케스트레이션.

상위 컨텍스트(3-축 운영 모델, 워크플로우 다이어그램)는 [`../README.md`](../README.md)의 "하네스" 섹션 참고. 본 문서는 **에이전트 협업 구조 + 트리거 치트시트 + 흔한 함정 + 갱신 절차**.

---

## 에이전트 5명

| 이름 | 역할 | 입력 | 출력 |
|---|---|---|---|
| `planner` | 일감 분해. 앱 DB 메타 + analysis + screens.md + spec 앵커 cross-ref → 5축 작업 분해 | LIFE-N + analysis.md + screens.md(있으면) | `issues/LIFE-N/dev-plan.md` |
| `types-keeper` | `@home-coffing/shared-types` 게이트키퍼. 양쪽 빌더 시작 전 DTO 잠금 | plan의 `### shared-types` | shared-types/src/** + `types-changes.md` |
| `api-builder` | NestJS 모듈(`controller/service/module + dto.ts`) 구현. entity는 `common/entities/` | plan의 `### api` | apps/api/** + `api-changes.md` |
| `app-builder` | Expo 화면·hook·이벤트 발화. design-system.md 톤 앵커 | plan의 `### app` + `### events` | apps/app/** + `app-changes.md` |
| `qa` | API↔App 경계면 교차 비교 + 이벤트 매핑 + 권한 분기 + design.pen 매핑 + 운영 가드레일 | `*-changes.md` 3종 | `qa.md` |

### 협업 흐름 (`feature-delivery` 안에서)

```
planner (단독)
   │ dev-plan.md
   ▼
TeamCreate(api-builder, app-builder, types-keeper, qa)
   │
   ▼
types-keeper 잠금 ──┐
                    ├─→ SendMessage "DTO 잠금 완료"
                    │
       ┌────────────┴────────────┐
       ▼                          ▼
api-builder                  app-builder
       │                          │
       └─→ SendMessage "모듈 완료" ─┐
                                   ▼
                                  qa (점진 검증, 모듈마다 즉시)
                                   │
                                   └─ Critical/Major → 빌더에게 SendMessage 수정 요청
                                   └─ 통과 → qa.md 누적

전체 종료 → TeamDelete + 통합 보고 + 커밋 초안
```

데이터 전달:
- **태스크**(TaskCreate): 빌더별 작업 할당
- **메시지**(SendMessage): DTO 잠금/요청, Critical/Major 이슈
- **파일**(`issues/LIFE-N/`): 모든 산출물

---

## 스킬 8종 — 트리거 치트시트

### 오케스트레이터 / 사이클 진입 (3개)

| skill | 사용자 발화 예시 | 실행 위치 |
|---|---|---|
| `issue-bootstrap` | "LIFE-15 시작", "워크트리 만들어줘", "LIFE-N 작업 환경" | 메인 레포 루트 |
| `issue-design` | "디자인 가자", "storyboard 그리자", "screens 만들자", "Bean 화면 그려", "master로 merge" | 워크트리 |
| `feature-delivery` | "LIFE-15 dev", "구현 가자", "이 일감 다시", "API만 다시", "경계면 검증 다시" | 워크트리 |

### 빌더·QA 패턴 (4개, 보통 빌더가 내부 호출)

| skill | 무엇 | 사용자 직접 호출 케이스 |
|---|---|---|
| `entity-module` | NestJS 모듈 추가/수정 패턴 | "API에 bean 모듈 만들어줘", "entity 추가" |
| `app-screen` | Expo 화면·hook 추가 패턴 | "BeanDetail 화면 추가", "expo-router 라우트" |
| `dto-sync` | shared-types DTO 정의 | "DTO 추가", "request/response 타입" |
| `boundary-qa` | API↔App 경계 교차 비교 + 이벤트·권한·디자인 톤·운영 가드레일 점검 | "QA 실행", "경계면 검증", "이벤트 매핑 점검" |

### 유지보수 (1개)

| skill | 사용자 발화 예시 | 비고 |
|---|---|---|
| `code-health` | "코드 점검", "리팩터 후보 찾아줘", "테스트 보강", "저번 점검 이어서" | survey/refactor/test 3 모드. 일감 없는 정기 점검 전용 |

### 트리거 금지 (skill 안 거치고 직접)

- typo·1파일 rename
- import 정리
- 단순 텍스트·아이콘 swap
- 변경된 diff 정리 → `simplify` (built-in)
- 변경된 diff 코드 리뷰 → `code-review` (built-in)

---

## 5축 작업 분해 (dev-plan 구조)

planner가 `issues/LIFE-N/dev-plan.md`를 다음 5축으로 분해 (life-assistant 4축에 `events` 추가):

| 축 | 담당 | 내용 |
|---|---|---|
| `### api` | api-builder | entity, NestJS 모듈, schema 변경 |
| `### app` | app-builder | Expo 화면, expo-router 경로, hook |
| `### shared-types` | types-keeper | DTO 추가/수정 |
| `### events` | app-builder (대부분) | `spec/event-taxonomy.md` 매핑·발화 지점 |
| `### infra` | (필요 시 사용자 승인) | schema:update 실행, env 변경, `docs/operations.md` 영향 |

---

## spec 앵커 (master, 디자인·기획 진실원)

| 파일 | 역할 | 누가 읽는가 |
|---|---|---|
| `spec/design.pen` | storyboard + frame inventory | issue-design / planner / app-builder / qa |
| `spec/screens.md` | 화면 기능 정의서 (정형 표) | issue-design / planner / app-builder / qa |
| `spec/design-system.md` | 톤·원칙 | issue-design / app-builder / qa |
| `spec/design-system.pen` | 컴포넌트 카탈로그 | issue-design / app-builder |
| `spec/event-taxonomy.md` | Amplitude 이벤트 정의 | planner / app-builder / qa |
| `spec/pens/LIFE-N-design.pen` | 일감 mockup archive (designing-done 후 백업) | (참고용, 직접 수정 X) |

**master 수정 룰:** 일감 작업 중엔 절대 직접 수정 X — `issues/LIFE-N/` sandbox에서 작업, designing-done의 merge-back에서만 master 갱신.

---

## 흔한 함정

| 함정 | 무엇 / 대응 |
|---|---|
| **master 직접 수정** | `spec/design.pen` / `screens.md`을 일감 작업 중 직접 수정 X. sandbox에서 작업 → designing-done에서 frame name 키로 merge-back |
| **워크트리 루트 혼동** | `feature-delivery`·`issue-design`을 메인 레포 루트에서 실행 X. 워크트리(`.claude/worktrees/LIFE-N`)에서 새 claude 세션 |
| **`cd`만으로 워크트리 이동** | cwd·CLAUDE.md·permission이 안 따라옴. iTerm 새 탭 + 새 claude 세션이 정답 |
| **batch_design 후 7-step verbalize 생략** | "머리로 OK"는 spec 패턴 위배 거의 확정. 매 batch 후 짧게라도 적기 |
| **storyboard 등장 안 하는 화면** | 동선 고립. 모든 화면은 storyboard 시나리오 1+ 등장 + entry path 명시 |
| **shared-types 우회** | api/app에 로컬 `interface BeanResponse` 재정의 X. `@home-coffing/shared-types`에서만 |
| **`as` 단언** | 극도로 기피. discriminated union + switch narrowing |
| **SQL alias 축약** | 풀네임 사용 |
| **Amplitude wrapper 우회** | `spec/event-taxonomy.md` 매핑된 이벤트는 wrapper 경유. 직접 호출 X |
| **admin only를 disabled로** | admin only 액션은 member에게 **비노출** (disabled 아님) |
| **schema:update 무승인 실행** | 파괴적 변경은 사용자 승인 필수. dump-sql로 미리 검토 |
| **docs/operations.md 위반** | 즉시 차단, 사용자 보고. 우회 X |
| **임의 LIFE-N 발급** | brain `issue-create`(life-assistant API POST)만. 코드 레포는 절대 X |

---

## 워크트리 cleanup

일감 완료 + PR merge 후:

```bash
cd /Users/byun/repos/byun618/home-coffing
git worktree remove .claude/worktrees/LIFE-N
git branch -d issue/LIFE-N        # 또는 -D (강제)
```

`issues/LIFE-N/` 폴더는 git에 남김 (감사 추적용).

---

## 환경 dependency

| 변수/도구 | 용도 | 없으면 |
|---|---|---|
| `LIFE_ASSISTANT_API_URL` | life-assistant API base | 앱 DB 메타 read skip, analysis만 의존 |
| `LIFE_ASSISTANT_API_TOKEN` | JWT | 동일 |
| Pencil MCP | `issue-design` 전용 | `issue-design` 동작 불가 |
| Amplitude wrapper | 이벤트 발화 | dev/qa에서 이벤트 매핑 X (운영 깨짐) |

---

## 하네스 갱신 절차

하네스 자체를 수정하고 싶으면 (에이전트 추가/책임 재분할/스킬 트리거 보강 등):

1. `harness:harness` 스킬 호출 — "하네스 점검", "agent 추가해줘" 등 자연어로 트리거
2. Phase 0 감사 → Phase별 필요한 것만 실행 (전체 재구축 X)
3. 변경 후 이 문서 끝 **변경 이력** 테이블에 한 줄 추가 (날짜·변경 내용·대상·사유)

직접 편집해도 무방하지만, 이력 갱신은 잊지 말 것 — 다음 세션에서 "왜 이 구조인지" 추적 가능해야 함.

---

## 참고 산출물 (외부)

| 위치 | 무엇 |
|---|---|
| `~/brain/CLAUDE.md` + `~/brain/workspace/CLAUDE.md` | brain 운영 모델 (3-축 모델의 brain 쪽) |
| `~/brain/wiki/pages/home-coffing.md` | service 정의 living canonical — 분석은 본 레포 `issues/LIFE-N/` (2026-06-12~) |
| `~/repos/byun618/life-assistant/` | 하네스 원본 — 본 레포는 이 구조를 차용 |
| `~/repos/byun618/homelab-infra/services/home-coffing/` | 운영 compose (외부 repo, ncnc 패턴) |

---

## paddock 이전 운영 모델 (원문: 적용 전 CLAUDE.md)

> 2026-10-30 paddock 적용으로 새 일감의 작업 산출물·브랜치 규약은 `AGENTS.md` 가 정한다(`../home-coffing-specs/LIFE-NNN-<슬러그>/`, 브랜치 `LIFE-NNN-<슬러그>`). 아래는 그 전 모델의 원문 — `issues/LIFE-4~7` 이 이 모델의 기록이다.

### 운영 모델 (2026-06-07~, 분석 위치 2026-06-12 갱신)

```
분석 (issue-think, 어디서든)   code repo (디자인·dev·qa)            life-assistant 앱 DB
─────────────                 ────────────────────────             ──────────────────
issue-think                   issue-design (spec master            일감 메타·상태
↓                              + issues/LIFE-N sandbox)             (LIFE-N)
issues/LIFE-N/analysis.md →   ↓
                              feature-delivery
                              (planner → builders → qa)
                              ↓
                              issues/LIFE-N/dev-plan + *-changes + qa.md
```

산출물 위치:
- 일감 메타: life-assistant 앱 DB (`GET /tasks/by-seq/{n}`)
- 분석: `issues/LIFE-N/analysis.md` (issue-think — 유저 스코프 skill, 2026-06-12부터 본 레포)
- 디자인 master: `spec/design.pen` + `spec/screens.md` (+ `spec/design-system.{md,pen}` + `spec/event-taxonomy.md`)
- 디자인 sandbox: `issues/LIFE-N/design.pen` + `screens.md`
- 일감 mockup archive: `spec/pens/LIFE-N-design.pen`
- dev-plan / qa / changes: `issues/LIFE-N/`

---

## 변경 이력

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-30 | 초기 구성 | 전체 (.claude/agents 5명, .claude/skills 2개) | 하네스 신규 구축 |
| 2026-05-06 | 하네스 리셋 + dev 전용 재구축 | agents 3명(api/client/qa-engineer), skills 1개(home-coffing-dev) | brain 레포가 sprint 기반 → ticket 기반으로 전환됨. planning 사이클은 brain 레포로 이관, 이 코드 레포는 dev 사이클 전용. spec/data-model.md, spec/component-library.md 폐기 반영. |
| 2026-05-12 | apps/web 폐기 + skills/agents 갱신 | apps/web 삭제, shared-types legacy 정리, CLAUDE.md / SKILL.md / client-engineer / client-stack.md에서 web 참조 제거 | T005 진행 중 web `/beans` 회수 충돌 발견. web은 dogfooding 미사용 + 비전 미정 → 폐기. 향후 클라이언트는 Expo 앱(`apps/app`) 단일. |
| 2026-05-17 | T008 배포 자동화 (GHA self-hosted + 운영 compose 이관) | `.github/workflows/deploy-api.yml`, `docs/deploy-runbook.md`, `docs/operations.md`, skills 갱신. home-coffing repo의 `docker-compose.yml`/`infra/github-runner/` 제거, `homelab-infra/services/home-coffing/`·`services/_runner/`로 이전. Dockerfile CMD의 자동 schema:update 제거 | T005 누적 배포 회고에서 수동 ssh deploy 마찰 노출. ncnc 패턴(app repo = build, infra repo = runtime compose owner) 차용. |
| 2026-06-07 | 하네스 풀 리셋 → life-assistant 구조 차용 | 폐기: agents 3종(api/client/qa-engineer), skill 1종(home-coffing-dev). 신규: agents 5종(planner / api-builder / app-builder / types-keeper / qa), skills 8종(issue-bootstrap / issue-design / feature-delivery / entity-module / app-screen / dto-sync / boundary-qa / code-health). CLAUDE.md 운영 모델 재작성 | 운영 모델 전환: 일감 메타가 brain ticket → life-assistant 앱 DB(LIFE-N), brain은 분석만, 코드 레포가 디자인+dev+qa 산출물 master. life-assistant 레포에서 검증된 5-팀/8-스킬 구조 그대로 차용 (스택 거의 동일). |
| 2026-06-12 | 분석 산출물 위치를 본 레포로 | CLAUDE.md / README.md / .claude/README.md / planner / issue-bootstrap / issue-design / feature-delivery의 analysis 경로 | brain workspace 프로젝트 폴더 해체 — 분석도 `issues/LIFE-N/analysis.md`(본 레포), service 정의는 `~/brain/wiki/pages/home-coffing.md`. `issue-think`는 유저 스코프 skill로 어느 세션에서든 가용. |
| 2026-10-30 | paddock 0.3.0 적용 | CLAUDE.md → `@AGENTS.md` 렌더본, `.claude/skills/*` → `.agents/skills/*`(심링크), AGENTS.md·`.agents/`·`.codex/`·`.githooks/`·`scripts/task-*`·`docs/adr/` 신설. issue-bootstrap·feature-delivery 대체됨 표시. 이 변경 이력·운영 모델은 CLAUDE.md 에서 이 문서로 이관 | 독립 리뷰·사용자 게이트가 있는 task 흐름 도입, 작업 산출물은 `../home-coffing-specs/` 로. 설계 기록: `.paddock/design.md` |
