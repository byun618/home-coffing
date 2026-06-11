# home-coffing 코드 레포

원두 관리 앱. 일감 메타·상태는 **life-assistant 앱 DB(LIFE-N)**가 source of truth, 본 레포가 분석·디자인·dev·qa 산출물 master (brain은 wiki·raw 지식 축 — service 정의는 `~/brain/wiki/pages/home-coffing.md`).

## 스택

- pnpm + Turborepo
- apps/api — NestJS 11 + MikroORM 6 + MySQL 8 (`@home-coffing/api`)
- apps/app — Expo SDK 54 + expo-router + NativeWind + React Query (`@home-coffing/app`, 단일 클라이언트)
- packages/shared-types — `@home-coffing/shared-types` (API↔App DTO 단일 진실원)
- Amplitude (이벤트) + FCM (푸시)

루트 명령:
- `pnpm dev` — turbo (api + app 동시)
- `pnpm test` — turbo test (현재 apps/api Jest 단위만)
- `pnpm schema:create / schema:update / schema:drop / db:reset`
- DB는 `~/repos/byun618/homelab-infra/`의 MySQL 재사용 — 새로 띄우지 마라.

## 일감 ID

`LIFE-N` (N = life-assistant 앱 DB 글로벌 sequentialId, 패딩 X). 예: `LIFE-15`. 생성은 brain의 `issue-create`(life-assistant API POST). 코드 레포는 절대 임의 부여 X.

## 운영 모델 (2026-06-07~, 분석 위치 2026-06-12 갱신)

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

## 운영 가드레일

- `docs/operations.md` — 절대 금지 항목 (배포 차단). planner/qa가 매번 점검.
- `docs/deploy-runbook.md` — 배포 절차.
- 인프라(외부 repo): `byun618/homelab-infra` — `services/home-coffing/`(API 컨테이너), `services/_runner/`(GHA self-hosted runner).

## 작업 원칙 (변상현 개인 스타일)

- `as` 단언 극도로 기피 — discriminated union + switch narrowing 선호
- 파라미터 2개 이상이면 단일 객체 (NestJS 데코레이터 제약 영역만 예외)
- 수정 범위 최소화 — 무관한 코드 건드리지 X
- 관심사 분리 (Guard: request 추출, Service: 순수 로직)
- 불필요한 추상화 지양
- SQL 테이블 alias 금지 — 풀네임

## 하네스 (life-assistant와 동일 구조)

| skill | 책임 | 실행 위치 |
|---|---|---|
| `issue-bootstrap` | 워크트리(`.claude/worktrees/LIFE-N`) + 브랜치(`issue/LIFE-N`) 생성, analysis 로딩 | 메인 레포 루트 |
| `issue-design` | spec master + sandbox 디자인 (Pencil MCP) | 워크트리 |
| `feature-delivery` | planner → types-keeper → api/app builder → qa 오케스트레이션 (dev → qa) | 워크트리 |
| `code-health` | 정기 리팩터·테스트 보강 (일감 없는 유지보수) | 메인 레포 루트 또는 워크트리 |
| `entity-module` / `app-screen` / `dto-sync` / `boundary-qa` | 각 빌더·QA 전용 패턴 스킬 | 워크트리 |

**트리거:**
- "LIFE-15 시작 / 워크트리 만들어줘" → `issue-bootstrap`
- "디자인 가자 / storyboard 그리자" → `issue-design`
- "dev 가자 / 구현 가자 / LIFE-15 dev" → `feature-delivery`
- 단순 typo·리네임·1파일 수정은 직접 처리.

**워크트리:**
- `<repo>/.claude/worktrees/LIFE-N` / 브랜치 `issue/LIFE-N`
- one session per worktree (cd만으로 cwd·CLAUDE.md 컨텍스트 안 따라옴)

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-30 | 초기 구성 | 전체 (.claude/agents 5명, .claude/skills 2개) | 하네스 신규 구축 |
| 2026-05-06 | 하네스 리셋 + dev 전용 재구축 | agents 3명(api/client/qa-engineer), skills 1개(home-coffing-dev) | brain 레포가 sprint 기반 → ticket 기반으로 전환됨. planning 사이클은 brain 레포로 이관, 이 코드 레포는 dev 사이클 전용. spec/data-model.md, spec/component-library.md 폐기 반영. |
| 2026-05-12 | apps/web 폐기 + skills/agents 갱신 | apps/web 삭제, shared-types legacy 정리, CLAUDE.md / SKILL.md / client-engineer / client-stack.md에서 web 참조 제거 | T005 진행 중 web `/beans` 회수 충돌 발견. web은 dogfooding 미사용 + 비전 미정 → 폐기. 향후 클라이언트는 Expo 앱(`apps/app`) 단일. |
| 2026-05-17 | T008 배포 자동화 (GHA self-hosted + 운영 compose 이관) | `.github/workflows/deploy-api.yml`, `docs/deploy-runbook.md`, `docs/operations.md`, skills 갱신. home-coffing repo의 `docker-compose.yml`/`infra/github-runner/` 제거, `homelab-infra/services/home-coffing/`·`services/_runner/`로 이전. Dockerfile CMD의 자동 schema:update 제거 | T005 누적 배포 회고에서 수동 ssh deploy 마찰 노출. ncnc 패턴(app repo = build, infra repo = runtime compose owner) 차용. |
| 2026-06-07 | 하네스 풀 리셋 → life-assistant 구조 차용 | 폐기: agents 3종(api/client/qa-engineer), skill 1종(home-coffing-dev). 신규: agents 5종(planner / api-builder / app-builder / types-keeper / qa), skills 8종(issue-bootstrap / issue-design / feature-delivery / entity-module / app-screen / dto-sync / boundary-qa / code-health). CLAUDE.md 운영 모델 재작성 | 운영 모델 전환: 일감 메타가 brain ticket → life-assistant 앱 DB(LIFE-N), brain은 분석만, 코드 레포가 디자인+dev+qa 산출물 master. life-assistant 레포에서 검증된 5-팀/8-스킬 구조 그대로 차용 (스택 거의 동일). |
| 2026-06-12 | 분석 산출물 위치를 본 레포로 | CLAUDE.md / README.md / .claude/README.md / planner / issue-bootstrap / issue-design / feature-delivery의 analysis 경로 | brain workspace 프로젝트 폴더 해체 — 분석도 `issues/LIFE-N/analysis.md`(본 레포), service 정의는 `~/brain/wiki/pages/home-coffing.md`. `issue-think`는 유저 스코프 skill로 어느 세션에서든 가용. |
