# home-coffing — 공통 지침

<!-- paddock:design D1 -->
원두 관리 앱 — 본인 + 와이프 공동 홈카페가 첫 사용자. pnpm + Turborepo 모노레포: `apps/api`(NestJS 11 + MikroORM 6 + MySQL 8),
`apps/app`(Expo SDK 54 + expo-router + NativeWind + React Query, 단일 클라이언트), `packages/shared-types`(API↔App DTO 단일 진실원).
서비스 정의는 `~/brain/wiki/pages/home-coffing.md`, 디자인·기능 master 는 `spec/`(규약: `spec/CLAUDE.md`), 운영 지식·금지 항목은 `docs/operations.md`,
배포는 `docs/deploy-runbook.md`. DB 는 `~/repos/byun618/homelab-infra/` 의 MySQL 을 재사용한다 — 새로 띄우지 않는다.
<!-- /paddock:design -->

## 산출물 규칙

- **작업 산출물은 별도 레포 `<본체>/../home-coffing-specs/` 에 둔다** — 본체 checkout 옆 폴더(본체 기준 경로). 브랜치는 하나, worktree 를 만들지 않는다.
  이 코드 레포에는 공개해도 되는 것만 둔다 — 원자료·작업 문서를 커밋하지 않는다
- 작업 하나 = `<본체>/../home-coffing-specs/LIFE-NNN-<슬러그>/` 폴더. 단계 산출물은 번호 파일 (00-analysis.md, 01-criteria.md, …)
- **쓰기와 커밋** — 본체·코디·워커·리뷰어 모두 그 폴더에 **절대경로로 직접** 쓴다(worktree 안 상대경로 금지).
  커밋은 그 일감의 코디(00-start 는 시작한 세션 — 본체)만, 게이트 시점에, **자기 폴더만** 한다:
  `git -C <본체>/../home-coffing-specs add -- LIFE-NNN-<슬러그>/ && git -C <본체>/../home-coffing-specs commit -m "…" -- LIFE-NNN-<슬러그>/ && git -C <본체>/../home-coffing-specs push` (경로는 절대경로로).
  여러 일감이 한 working copy 를 같이 쓰므로 남의 폴더를 add 하지 않고, `index.lock` 이면 잠시 뒤 다시 한다. 워커·리뷰어는 커밋하지 않는다.
  루트 공용 파일(00-project.md 등)은 바꾼 세션(본체 또는 그 일감의 코디)이 그 파일만 지정해 커밋한다
- `<본체>/../home-coffing-specs/` 파일이 진실의 원천. 세션 간 조율은 파일로 한다 — 세션 컨텍스트는 휘발됨
- **아티팩트(계획 문서·목업 설명)는 진실의 원천이 아니다.** 일감의 근거는 `<본체>/../home-coffing-specs/` 에서만 끌어온다 —
  아티팩트가 스파이크 판정과 어긋난 채 계획 근거로 쓰이는 일을 막는다
- 완료 조건·판정표 형식·**네이티브 실행 관문**(워커·리뷰어 공통)의 원본은 .agents/rules/validation.md —
  완료 선언 전에 확인한다

## 작업 플로우 (분석 → 단독 구현 → 리뷰 → 판정 → PR)

여기는 지도다 — **규칙 본문은 그 규칙을 실행하는 스킬에 두고 여기에 다시 적지 않는다.**
스킬은 **능력 이름**으로만 말하고 명령은 .agents/harness/ 의 도구별 매핑에 있다 —
어느 매핑을 열지는 .agents/harness/capabilities.md 의 「매핑 선택」 한 곳에서 정한다.

| 단계 | 누가 | 산출물 (`<본체>/../home-coffing-specs/LIFE-NNN-<슬러그>/`) | 절차 |
| --- | --- | --- | --- |
| 0 시작 — 작업 브랜치·worktree·코디 기동 | 본체 | 00-start.md | task-start |
| 1 분석 — 일감 스냅샷·외부 서치 대조 | 코디 | 00-analysis.md | task-coordinate §1 |
| 2 판정 기준 — 구현 전에 박는다 | 코디 | 01-criteria.md | §2 |
| 3 킥오프 → **게이트 ⓪** | 코디 | 02-kickoff.md | §3 |
| 4 구현 — 단독 워커, 설계 단계 없음(경쟁은 옵션) | 워커 | 구현 브랜치 `LIFE-NNN-<슬러그>-<구현 도구>` | §4 |
| 5 코드 리뷰 — 별도 세션, 재리뷰도 새 세션 | 리뷰어 | raw/review/, reviews.md | §5 |
| 6 판정 → **게이트 ①** | 코디 | verdict.md | §6·§7 |
| 7 사용자 확인 → **게이트 ②** = 기록·PR 생성·정리 | 코디 | devlog.md, learnings-proposal.md, adr-draft-*.md, handoff-main.md, pr.md | §8 |

- 스킬 파일: .agents/skills/task-start · task-coordinate (각 SKILL.md). 역할별 도구·모델·effort·리뷰어 구성의 값은 .agents/defaults.md, 규칙은 .agents/defaults.rules.md
- 판정 규칙(다수결 기각 금지·수렴 조건·수정 상한·테스트 계층·경량/전체 경로)은 task-coordinate §2·§3·§5·§6
- **사용자 승인 게이트 3단 (자율 진행 금지 지점)**: ⓪ 킥오프(구현 워커 기동 전) ① 채택(작업 브랜치 머지 전)
  ② PR 생성(PR 을 열기 전). 게이트 사이는 자율 진행하되 게이트에서 멈추고 보고한다 — 보고할 내용은 task-coordinate 의 각 게이트 절.
  worktree 는 PR 생성 승인 전까지 유지 — 사용자가 직접 실행·확인할 수 있는 상태
- 작업이 끝나거나 막히면 반드시 사용자에게 보고 — 조용한 완료 금지
- 일감 트래커 상태 전이(트래커가 있으면)는 코디(진행)·본체(마무리)가 forward-only 로 한다 — 방법은 task-start 1·5단계의 D3 슬롯, 시점은 각 스킬의 해당 절 첫 줄

## 브랜치 규약

- 작업 브랜치 `LIFE-NNN-<슬러그>` 는 main 에서 분기, 작업 하나의 수명만 갖는다 —
  PR 을 열면 로컬은 정리하고 원격만 남긴다. 머지 후 원격도 삭제 (단명 원칙 유지)
- **main 반영은 PR 머지로만** — main 직접 push 금지. PR 은 merge commit 으로 머지한다
  (squash·rebase 머지면 `scripts/task-finish.sh` 가 작업 브랜치를 자동 정리하지 않고 멈춘다)
- 슬러그는 일감 타이틀에서 자동 파생(케밥케이스 1~3단어), 생성 후 불변 (매핑은 키로만)
- worktree 는 전부 .claude/worktrees/ 아래 형제 폴더 — 중첩 금지. 구현 브랜치 생존 중 작업 브랜치 rebase 금지
- 통합 확인이 필요하면 throwaway: integration/<이름>-YYYYMMDD 에 합쳐 테스트 후 삭제. 유지 금지

## 도구 역할

- 코디네이터·판정 = 작업마다 도구를 고른다. 선택 규칙·기동·전제 점검은 task-start, **역할별 도구·모델·effort·리뷰어 구성의 값은
  .agents/defaults.md, 규칙은 .agents/defaults.rules.md 다.** 같은 도구여도 세션과 역할은 구분한다
- 구현·코드 리뷰·외부 서치를 어느 도구가 맡는지는 .agents/defaults.md 의 「역할 기본값」이 정한다. 외부 서치 도구는 느리고 쿼터가 있을 수 있다 — 한도 소진은 defaults.rules.md 「외부 서치 한도 소진 시 생략」
- **effort·모델은 세션 기동 시 반드시 명시한다.** 환경 기본이 낮을 수 있어 플래그가 없으면
  조용히 내려간다. 기동 후 세션 중간에 바꾸지 않는다 — 프롬프트 캐시가 깨져 그 턴의 입력 비용이 수십 배로 뛴다
- **advisor 는 도구 내장 상담 기능이다. 독립 리뷰를 대신하지 않는다** — 켜는지는 .agents/defaults.md
- **제어 도구(pane·배달·완료 감지)는 절차와 분리한다.** 절차는 능력 이름으로 쓰고 명령은 매핑에 둔다 —
  목표는 "어디서나 같은 보장" 이 아니라 **"어디서나 돌고, 못 하는 것은 판정표에서 공백"** 이다
  (.agents/harness/capabilities.md)

## 세션 간 통신

- 영속 산출물: `<본체>/../home-coffing-specs/` 파일 (진실의 원천)
- 제어 채널: 『감독 워커 기동』·『완료 감지』·『질의응답』. 완료는 워커의 종료 보고로만 본다 (파일·화면·프로세스 종료가 아니다).
  명령과 보장 수준은 선택한 매핑(.agents/harness/<도구>.md) — 능력이 공백인 도구에서는 그 판정 칸이 공백이다. 절차는 task-coordinate §4

## 어디를 고치나 (증상 → 파일)

| 증상 | 고치는 파일 |
| --- | --- |
| 프로젝트가 뭔지 매번 설명하게 된다 | AGENTS.md |
| 문체·용어·문서 형식이 매번 다르다 | .agents/rules/writing.md |
| 코드 스타일·파일 이름이 제각각이다 | .agents/rules/coding.md |
| "다 됐습니다"인데 안 되어 있다 | .agents/rules/validation.md |
| 같은 다단계 절차를 매번 다시 설명한다 | .agents/skills/<이름>/SKILL.md 신설 |
| 같은 배움을 일감마다 다시 겪는다 | .agents/learnings/<영역>.md (형식·승격은 그 폴더 README) |
| 왜 그렇게 정했는지 매번 다시 묻는다 | docs/adr/ (번호·상태는 그 폴더 README) |


| 증상 | 고치는 파일 |
| --- | --- |
| 리뷰 품질·형식이 도구마다 흔들린다 | .agents/agents/reviewer.md |
| 도구가 바뀌면 절차 문서를 다시 쓰게 된다 | .agents/harness/capabilities.md (능력 이름·보장 어휘) |
| 명령·플래그가 실제와 다르거나 빠져 있다 | .agents/harness/ 의 설치한 매핑 (<도구>.md) |
| 역할별 도구·모델·리뷰어 구성이 흔들린다 | .agents/defaults.md (값) · .agents/defaults.rules.md (규칙) |
| 무엇을 만들어야 하는지가 흔들린다 | 해당 작업의 01-criteria.md |

## 원본 관리

- 규칙·에이전트·스킬 원본은 .agents/ 에만 둔다. .claude/ 의 rules·skills·agents 는 심링크 — 원본 저장 금지
- .agents/agents/ 의 역할 파일은 각 터미널 세션이 시작 시 읽는 지침서다 (서브에이전트 아님)
- codex 는 AGENTS.md 만 읽는다 — 역할은 .codex/agents/<역할>.toml 포인터 경유. .agents/agents/ 를 고치면 포인터가 깨지지 않았는지 확인
- rules 스텁(writing.md·coding.md)은 같은 실수 두 번째에 한 줄씩 — 첫 번째는 .agents/learnings/ 에. 글로벌 스타일과 중복 금지
- 스킬의 로컬 상태(config.json, state/)는 .gitignore — config.example.json 만 커밋
- 시크릿 점검: gitleaks pre-commit 훅(.githooks/). 클론마다 한 번 `git config core.hooksPath .githooks`
- **paddock 이 깐 파일**: 첫 줄이 `paddock:fixed` 인 파일과, `paddock:design` 구간 밖은 paddock sync 가 덮어쓴다 —
  고칠 것은 paddock 레포에 되돌려 보낸다. `paddock:seed` 파일과 `paddock:design` 구간 안은 이 프로젝트 소유다
- **이 파일은 매 세션·매 호출에 실린다** — 매 세션 필요한 사실만 두고, 다단계 절차·한 역할만 쓰는 규칙은 스킬로 뺀다.
  200줄을 넘으면 이미 너무 길다
- 역할 기본값의 원본은 .agents/defaults.md 한 곳(프로젝트 소유), 그 규칙은 .agents/defaults.rules.md(paddock 고정). 도구가 자동으로 읽는 파일이 아니라 스킬·역할 파일이 경로로 가리켜야 읽힌다
- 시크릿 점검은 산출물 레포(`<본체>/../home-coffing-specs/`)도 같은 gitleaks pre-commit 훅(`.githooks/`)으로 한다. 클론마다 한 번 `git config core.hooksPath .githooks`
