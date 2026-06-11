# home-coffing

원두 관리 앱. 본인 + 와이프 공동 홈카페 케이스(Early User) 기반. Expo SDK 54 앱 + NestJS API + MikroORM + MySQL.

## 컨텍스트

- 일감 메타·상태 source of truth: **life-assistant 앱 DB** (`LIFE-N`)
- 분석 산출물 source of truth: **본 레포** `issues/LIFE-N/analysis.md` (issue-think — 유저 스코프 skill, 2026-06-12~)
- 디자인·dev·qa 산출물 source of truth: **본 레포** (`spec/` master + `issues/LIFE-N/` sandbox)

## 구조

```
apps/
  api/                    NestJS 11 + MikroORM v6 + MySQL 8
  app/                    Expo SDK 54 + expo-router + NativeWind (단일 클라이언트)
packages/
  shared-types/           API ↔ App DTO 공유 (@home-coffing/shared-types)
spec/                     디자인 master
  design.pen              storyboard + frames
  screens.md              화면 기능 정의서
  design-system.{md,pen}  톤·컴포넌트 카탈로그
  event-taxonomy.md       Amplitude 이벤트 정의
  pens/                   일감별 mockup archive (LIFE-N-design.pen)
issues/LIFE-N/            일감별 sandbox (디자인 delta + dev-plan + qa)
docs/
  operations.md           운영 가드레일 (배포 차단 항목)
  deploy-runbook.md       배포 절차
.claude/
  agents/                 planner, api-builder, app-builder, types-keeper, qa
  skills/                 issue-bootstrap, issue-design, feature-delivery, ...
  worktrees/LIFE-N        일감 워크트리 (issue/LIFE-N 브랜치)
  README.md               하네스 매뉴얼·치트시트
```

## 인프라

- DB: `~/repos/byun618/homelab-infra/`의 MySQL 재사용 (새로 띄우지 X)
- 운영 compose owner: `byun618/homelab-infra` — `services/home-coffing/`(API 컨테이너), `services/_runner/`(GHA self-hosted runner)
- 외부 통합: Amplitude(이벤트) + FCM(푸시)

## 개발

```bash
pnpm install
pnpm dev                  # turbo dev (api + app)
pnpm schema:create        # MySQL 스키마 생성
pnpm schema:update        # 변경 반영 (파괴적 변경 주의)
pnpm test                 # apps/api Jest 단위
```

`.env`는 `.env.example` 참고.

---

## 하네스 (Claude Code 자동화)

### 3-축 운영 모델 (2026-06-07~)

```
┌─ life-assistant 앱 DB ┐  ┌─ brain ──────────────────┐  ┌─ 본 레포 ────────────────┐
│ 일감 메타·상태         │  │ 분석만                    │  │ 디자인 + dev + qa         │
│ LIFE-N                │  │ tickets/LIFE-N/           │  │ spec/ (master)            │
│ title / status        │  │   analysis.md             │  │ issues/LIFE-N/ (sandbox)  │
│ project=home-coffing  │  │ service/ / discovery/     │  │ docs/operations.md        │
└───────────────────────┘  └───────────────────────────┘  └───────────────────────────┘
        ▲                          │                                ▲
        │                          └────── read-only 참조 ──────────┘
        │ (POST /tasks)
        │
   raw 입력 → brain `issue-create` → LIFE-N 발급
```

### 일감 ID

`LIFE-N` (N = life-assistant 앱 DB 글로벌 sequentialId). 예: `LIFE-15`. 패딩 X. 본 레포는 임의 부여 금지 — 발급은 brain `issue-create`(앱 API POST)만.

### 워크플로우 (한 일감의 일생)

```
1.  raw 입력
        ↓                                       [세션: 어디서든 — 유저 스코프 skill]
2.  `issue-create`
        → life-assistant API POST /tasks
        → LIFE-N 발급

3.  `issue-think` (선택)                         [세션: 어디서든 — 유저 스코프 skill]
        → issues/LIFE-N/analysis.md
        (JTBD·기능 정의·안 함·열린 질문 — 자유 markdown)

4.  본 레포 `issue-bootstrap`                    [세션: 메인 레포 루트]
        → git worktree add .claude/worktrees/LIFE-N -b issue/LIFE-N
        → iTerm 새 탭에서 claude 세션 자동 기동

5.  본 레포 `issue-design` (UI 변경 있을 때만)   [세션: 워크트리]
        → spec/{design.pen, screens.md}에서 영향 frame을 sandbox로 fork
        → issues/LIFE-N/{design.pen, screens.md}에 delta 작업
        → designing-done 시 frame name 키로 master sync + spec/pens/ archive
        ※ Pencil MCP 필수, design-system.md 톤 앵커

6.  본 레포 `feature-delivery`                   [세션: 워크트리]
        → planner: 앱 DB + analysis + screens.md + event-taxonomy + docs/operations 읽고
                   issues/LIFE-N/dev-plan.md 작성 (5축: api/app/types/events/infra)
        → TeamCreate: api-builder + app-builder + types-keeper + qa
        → types-keeper 잠금 → api/app 병렬 빌드 → qa 점진 검증
        → 산출물: issues/LIFE-N/{api,app,types}-changes.md + qa.md

7.  사용자 확인 → commit → push → PR
```

### Skill 빠른 참조

| skill | 트리거 자연어 | 실행 위치 |
|---|---|---|
| `issue-bootstrap` | "LIFE-15 시작 / 워크트리 만들어줘" | 메인 레포 루트 |
| `issue-design` | "디자인 가자 / storyboard 그리자 / 화면 그려" | 워크트리 |
| `feature-delivery` | "LIFE-15 dev / 구현 가자" | 워크트리 |
| `code-health` | "코드 점검 / 리팩터 후보 / 테스트 보강" | 메인 또는 워크트리 |
| `entity-module` / `app-screen` / `dto-sync` / `boundary-qa` | (빌더·QA가 내부 호출) | 워크트리 |

단순 typo·리네임·1파일 수정은 skill 트리거 없이 직접 Edit.

### 산출물 위치

| 산출물 | 위치 |
|---|---|
| 일감 메타 (title/status/priority/...) | life-assistant 앱 DB |
| 분석 (JTBD·결론·안 함·열린 질문) | `issues/LIFE-N/analysis.md` |
| 서비스 정의 (mission/problem/target) | `~/brain/wiki/pages/home-coffing.md` (living canonical) |
| 디자인 master | `spec/design.pen` + `spec/screens.md` |
| 디자인 시스템 카탈로그 | `spec/design-system.md` + `spec/design-system.pen` |
| 이벤트 정의 (Amplitude) | `spec/event-taxonomy.md` |
| 운영 가드레일 | `docs/operations.md` |
| 디자인 sandbox | `issues/LIFE-N/design.pen` + `screens.md` |
| 일감 mockup archive | `spec/pens/LIFE-N-design.pen` (designing-done 후) |
| dev-plan | `issues/LIFE-N/dev-plan.md` |
| 빌더별 changes | `issues/LIFE-N/{api,app,types}-changes.md` |
| QA 보고서 | `issues/LIFE-N/qa.md` |
| 정기 유지보수 (일감 없음) | `_workspace/code-health-*.md` (gitignored) |

### 워크트리 컨벤션

- 브랜치: `issue/LIFE-N`
- 위치: `.claude/worktrees/LIFE-N` (gitignored)
- **one session per worktree** — `cd`만으론 cwd·CLAUDE.md·permission이 안 따라옴. iTerm 새 탭 + 새 claude 세션.

### 환경 dependency

- `LIFE_ASSISTANT_API_URL` — life-assistant API (Tailscale homelab)
- `LIFE_ASSISTANT_API_TOKEN` — JWT
- Pencil MCP — `issue-design` 전용
- 미설정·실패 시 brain `issue-create`는 `~/brain/.inbox/{timestamp}.md`에 raw fallback

### 더 보기

- 하네스 상세 매뉴얼·치트시트·함정: [`.claude/README.md`](./.claude/README.md)
- 각 skill 상세: `.claude/skills/{name}/SKILL.md`
- 각 agent 상세: `.claude/agents/{name}.md`
- 하네스 변경 이력: [`CLAUDE.md`](./CLAUDE.md)
- brain 쪽 컨벤션: `~/brain/CLAUDE.md` + `~/brain/workspace/CLAUDE.md`
