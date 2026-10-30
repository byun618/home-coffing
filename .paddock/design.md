# paddock 설계 — home-coffing

- paddock: 0.3.0 · 판정: 기존 · 날짜: 2026-10-30
- 모듈: l1 l2 specs-repo · harness: corral

## 분석

| 항목 | 값 | 출처 |
| --- | --- | --- |
| 스택 | pnpm 10.8.1 + Turborepo 2 · apps/api NestJS 11 + MikroORM 6 + MySQL 8 · apps/app Expo SDK 54 · packages/shared-types | package.json, apps/*/package.json |
| 런타임 | Node 20 | Dockerfile, docs/operations.md |
| 빌드 | `pnpm build` (turbo) | package.json |
| 린트 | `pnpm lint` → api 만 eslint. **base 에서 실패**(eslint 미설치, `sh: eslint: command not found`) | 이 세션에서 실행함 |
| 타입체크 | api `npx tsc --noEmit` 통과 · app `npx tsc --noEmit` **base 에서 오류 1건**(app/records/[id].tsx:184) | 이 세션에서 실행함 |
| 테스트 | **없음** — 루트·api 에 test 스크립트·*.spec.ts 없음. CLAUDE.md·README 의 `pnpm test` 는 실제로 없음 | package.json, find |
| CI | `.github/workflows/deploy-api.yml` — main push(API 이미지 경로)·workflow_dispatch, self-hosted(맥미니) api 타입체크 → docker build → homelab-infra compose up (LIFE-11) | 파일 |
| 사용자 실행 경로 | API: Docker 이미지(맥미니) · App: EAS `preview` 안드로이드 APK 사이드로드 / 개발은 실기기 Expo(dev client) | eas.json, docs/operations.md |
| 런타임 자원 | homelab-infra 의 호스트 MySQL(스키마 `home_coffing`) 공유, 루트 `.env`(로컬 dev), 운영 시크릿은 homelab-infra | docs/operations.md, .env.example(키만) |
| 외부 의존 | Amplitude, FCM, EAS, Cloudflare Tunnel, life-assistant API(일감), Pencil MCP(디자인) | README, operations.md |
| 브랜치 관례 | 현재 `issue/LIFE-N`(하네스), 과거 `ticket/NNN` · PR merge commit | git branch, git log |
| 일감 트래커 | life-assistant 앱 DB (`LIFE-N`) — MCP `issue_by_seq`/`issue_transition` | CLAUDE.md, MCP status_list |
| 에이전트 도구 | Claude Code(CLAUDE.md·.claude/), codex·grok 설치됨 | command -v |
| 터미널 제어 | corral·tmux 설치됨 | command -v |
| git 훅 | `core.hooksPath=<레포>/.git/hooks`(절대경로, sample 뿐 = 사실상 없음) · husky 없음 · gitleaks 있음 | git config |

## 결정

| 항목 | 값 | 근거 |
| --- | --- | --- |
| l1 + specs-repo | 켬 | 기본. 사용자 승인(A). 로컬 `../home-coffing-specs` git init 만 — GitHub 원격 생성·push 는 사용자 확인 대기 |
| l2 / harness | corral | 설치됨, 형제 레포 `*-specs` 관례 존재 |
| bundle / l3 | 끔 | 근거 없음 |
| PADDOCK_SKIP | `.claude/agents` | 기존 5종이 서브에이전트 정의(planner 등) |
| ISSUE_PREFIX | LIFE | 트래커 |
| WORKTREE_DIR | .claude/worktrees | 기존 관례, 이미 gitignore |
| BASE_BRANCH | main | origin/HEAD |
| SPECS_ROOT | `<본체>/../home-coffing-specs` | 권장형 |
| MAX_FIX_ROUNDS | 3 | 기본 |
| VARIANT_SUFFIXES | `-claude -codex` | 설치된 도구 |
| PR_FOOTER | (빈 값) | 레포 관례 없음 |
| 훅 | core.hooksPath → `.githooks` (이 클론만) | 기존 값(`.git/hooks`)은 sample 뿐 |

## 설계 슬롯 (초안)

### D1
원두 관리 앱 — 본인 + 와이프 공동 홈카페가 첫 사용자. pnpm + Turborepo 모노레포: `apps/api`(NestJS 11 + MikroORM 6 + MySQL 8), `apps/app`(Expo SDK 54 + expo-router + NativeWind + React Query, 단일 클라이언트), `packages/shared-types`(API↔App DTO 단일 진실원).
서비스 정의는 `~/brain/wiki/pages/home-coffing.md`, 디자인·기능 master 는 `spec/`(`spec/CLAUDE.md`), 운영 지식·금지 항목은 `docs/operations.md`, 배포는 `docs/deploy-runbook.md`.

### D3
일감은 life-assistant 앱 DB 의 `LIFE-N` — MCP `issue_by_seq`(seq=N)로 읽는다(`links` 의 미해소 blocker 확인). 전이는 `issue_transition`(라벨 지정, forward-only):
시작 `개발 중` → 게이트 ① 뒤 `검증 중` → PR 머지 뒤 `완료`. (`분석 중`·`디자인 중` 은 issue-think·issue-design 몫.) LIFE-N 을 이 레포가 발급하지 않는다 — 발급은 `issue-create`.

### D5
API: 변경 브랜치를 `🚀 Deploy API` 와 같은 Dockerfile(`docker build --build-arg APP=api .`)로 빌드해 컨테이너로 띄우고 실제 엔드포인트를 호출 1회. 운영 배포는 사용자만 — API 이미지 경로가 바뀐 PR 의 main 머지가 곧 배포(push 자동 실행)이므로 그 머지와 수동 재배포(workflow_dispatch)도 사용자 몫.
App: 안드로이드 실기기에서 dev client(`pnpm --filter @home-coffing/app start`)로 해당 화면 동선 1회 — APK(EAS preview) 빌드는 사용자 지시 때만. 격리 실행(타입체크·단위)과 달리 실기기·실 API 를 거친다.

### D6
- homelab 호스트 MySQL(스키마 `home_coffing`)은 공유 자원 — 새로 띄우지 않는다. `schema:update`/`schema:drop`/`db:reset` 은 사용자 승인 없이 실행 금지(파괴적, 운영 DB 와 같은 서버). 「로컬 dev .env 가 운영 스키마를 가리키는지」 확인 필요
- 동시에 하나만: DB 스키마 변경, 실기기 dev client(포트 8081), 로컬 API 포트(3001)
- 커밋 금지: `.env`·`apps/app/.env`, `backups/`(DB 덤프), `spec/*.pen` 외 임시 덤프

### D7
- 빠른 확인 = `cd apps/api && npx tsc --noEmit` + `cd apps/app && npx tsc --noEmit` + `pnpm build`. base 에서 app 타입 오류 1건·`pnpm lint` 실패(eslint 미설치)가 있으므로 통과선은 「base 대비 새 오류 0」
- 최종 관문 = 빠른 확인 + D5 네이티브 실행. 자동 테스트는 아직 없다(필요하면 일감 관문 스크립트로)

### D8
- 경량: 문서·산문(명령 블록 불변), 화면 카피·아이콘·NativeWind 클래스(로직·분기 불변), `spec/*.md` 서술
- 전체로 올리는 것: entity·스키마 변경, shared-types DTO 변경(API↔App 경계), 인증·가족(admin/member) 권한 분기, Amplitude 이벤트 정의, Dockerfile·eas.json·app.config(versionCode·package)·배포 워크플로

### D9
node 스크립트(`.mjs`), 첫 인자 = worktree 절대경로, 그 안의 `node_modules`(pnpm hoisted)를 쓴다. DB 가 필요한 관문은 쓰지 않는다(D6).

### D12
- API↔App 경계: 응답 shape 과 shared-types·app hook 일치, 로컬 interface 재정의(shared-types 우회)
- 권한: admin only 액션은 member 에 비노출(disabled 아님), API 권한 가드 누락
- entity 변경의 schema:update 영향(파괴적 컬럼 변경·데이터 이관 필요 여부 → deploy-runbook 적용 가능?)
- `docs/operations.md` 금지 항목(metro watchFolders, reanimated babel plugin, MikroORM v7, `expo install`, versionCode·android.package)
- 이벤트: `spec/event-taxonomy.md` 매핑·wrapper 경유
- 외부 사실 대조: Expo SDK 54·expo-router 6, MikroORM 6, NestJS 11 문서

### D13
grok(`grok-search` 스킬) — Expo·MikroORM·NestJS 등 버전 민감 동작이 기준을 바꿀 때. 한도 확인은 `grok_status`. — 사용자 확인

### D15
`pnpm dev` 후 안드로이드 실기기 dev client 로 해당 화면 확인(API 는 로컬 3001).

## 역할 기본값

값·근거는 `.agents/defaults.md`(사용자 답 그대로). 본체 Sonnet high · 코디 Opus high · 구현 Opus medium · 경쟁 상대 Codex gpt-6-astra high(카탈로그에 있을 때만) · 리뷰 ① Codex gpt-6-astra xhigh(없으면 자동 전환) · ② Claude Sonnet high · ③ Grok(grok-search 기본값). advisor 는 Claude 행 없음.

## 기존 파일 처리

원본: `git show 5909799:CLAUDE.md` · `git show 5909799:.claude/README.md`

| 출처 | 목적지 | 처리 |
| --- | --- | --- |
| CLAUDE.md 머리말·「스택」 | D1 | 요약해 옮김 (README 에 원문 그대로 남음) |
| CLAUDE.md 「루트 명령」 | D7·D15 / `pnpm test` 는 「없음」으로 정정 | 옮김 |
| CLAUDE.md 「DB 는 homelab MySQL 재사용」 | D6 | 옮김 |
| CLAUDE.md 「일감 ID」 | D3 | 옮김 |
| CLAUDE.md 「운영 모델」·산출물 위치 | AGENTS.md 산출물 규칙(고정)으로 대체 + `.claude/README.md` 에 「paddock 이전 산출물 위치」로 원문 이관 | 옮김 |
| CLAUDE.md 「운영 가드레일」 | D12 + `.agents/rules/validation.md` D6 | 옮김 |
| CLAUDE.md 「작업 원칙」 | `.agents/rules/coding.md` (Codex 는 글로벌 CLAUDE.md 를 못 읽음) | 옮김 |
| CLAUDE.md 「하네스」 표·트리거·워크트리 | `.claude/README.md` 에 이미 동일 내용 — 워크트리·브랜치는 고정 브랜치 규약으로 대체 | 버림-중복(.claude/README.md 「스킬 8종」) |
| CLAUDE.md 「변경 이력」 표 | `.claude/README.md` 끝 「변경 이력」 절로 원문 이관 + 이번 적용 한 줄 | 옮김 |
| `.claude/skills/*` 8종 | `.agents/skills/*` (git mv) → `.claude/skills` 심링크 | 옮김 |
| ↳ issue-bootstrap · feature-delivery | task-start · task-coordinate 가 대체 | description·본문에 「대체됨」 표시, 삭제는 사용자 확인 대기 |
| ↳ issue-design · entity-module · app-screen · dto-sync · boundary-qa · code-health | 프로젝트 특화 | 그대로 |
| `.claude/agents/*` 5종 | — | 그대로 (PADDOCK_SKIP) |
| `.claude/README.md`·`settings.local.json`·`spec/CLAUDE.md` | — | 그대로 (위 이관분만 추가) |
| `issues/LIFE-4~7/` | — | 그대로 (과거 기록). 새 일감부터 specs 레포 |
| core.hooksPath (`.git/hooks`, sample 뿐) | `.githooks` | 교체 |

## 변경 이력

| 날짜 | 변경 | 대상 | 사유 |
| --- | --- | --- | --- |
| 2026-10-30 | 최초 적용 | 전체 | — |

## 남은 확인

- 로컬 루트 `.env` 의 DB 가 운영 스키마(`home_coffing`)와 같은지 (D6 — 확인 전엔 운영으로 간주)
- issue-think·issue-design 이 쓰는 `issues/LIFE-N/` 경로와 specs 레포 산출물 규칙의 정합 (스킬 경로 갱신은 별도 일감)
- CLAUDE.md·README 의 `pnpm test` 언급 — 스크립트 없음 (README 는 그대로 둠)
