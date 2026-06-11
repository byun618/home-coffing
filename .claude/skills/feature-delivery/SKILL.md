---
name: feature-delivery
description: "home-coffing 풀스택 dev 오케스트레이터. 일감(LIFE-N) 워크트리 안에서 API(NestJS)·App(Expo)·shared-types를 동시에 변경하는 dev → qa 작업에 사용. 트리거: 'LIFE-15 dev', 'feature-delivery 시작', '구현 가자', '이 일감 다시 작업', '재실행', 'API만 다시', '경계면 검증 다시', '이전 plan 보완'. 디자인 산출물(spec/screens.md)이 있으면 읽고 없으면 master만 참고. 단순 단일 파일 수정·typo·리네임은 트리거 X. 워크트리·브랜치 생성은 issue-bootstrap, 디자인은 issue-design."
---

# feature-delivery — home-coffing 풀스택 dev 오케스트레이터

**실행 모드:** 에이전트 팀 (TeamCreate + SendMessage + TaskCreate)
**팀 구성:** planner, api-builder, app-builder, types-keeper, qa (5명)
**범위:** dev → qa만. 워크트리·브랜치는 `issue-bootstrap`, 디자인은 `issue-design`이 선행.
**아키텍처 패턴:** 파이프라인 + 생성-검증 혼합 (planner → types-keeper 잠금 → api/app 병렬 빌드 → qa 점진 검증)

## Phase 0: 컨텍스트 확인

**0-1. 실행 위치 검증:**

- `pwd`가 `.../.claude/worktrees/LIFE-N` (워크트리)이어야 함.
- 루트(`/Users/byun/repos/byun618/home-coffing`)에서 실행되면 멈추고 "먼저 `issue-bootstrap`으로 워크트리 만들고 새 세션에서 호출하세요" 보고.

**0-2. 일감 ID 확인:**

사용자 입력에 `LIFE-N` 명시 없으면 현재 워크트리 경로(`.claude/worktrees/LIFE-N`)에서 추출. 모호하면 묻기. 임의 부여 X.

**0-3. 실행 모드 판정 (`issues/LIFE-N/dev-plan.md` 존재로):**

- 없음 → **초기 실행**
- 있음 + "보완/수정" → **부분 재실행** (해당 산출물 작성 에이전트만 재호출)
- 있음 + "다시"/"새로" → **새 실행** (`issues/LIFE-N/*.md` → `issues/LIFE-N/prev_*.md`로 이동)

**0-4. 디자인 산출물 게이트 (느슨):**

- `issues/LIFE-N/screens.md` 존재 → planner 입력에 포함
- 없음 + `spec/screens.md` master만 → master만 참고, 진행 OK
- 둘 다 없음 + UI 변경이 명확 → "디자인 먼저 (`issue-design`)? 아니면 master만으로 진행?" 1번 물음. dev 자체는 막지 않음 (티포·버그픽스 등 mockup 불필요한 경우 있음).

**0-5. 운영 가드레일 즉시 점검:**

- `docs/operations.md`의 절대 금지 항목 인지. 사용자 요청이 위반이면 즉시 차단 후 사유 보고.

## Phase 1: 일감 분해 (planner)

planner가:
1. 앱 DB Task 메타 (`GET {LIFE_ASSISTANT_API_URL}/tasks/by-seq/{n}`) — title·status·project
2. analysis 읽기 — `issues/LIFE-N/analysis.md` (있으면)
3. 디자인 산출물 읽기 — `issues/LIFE-N/screens.md` (sandbox) + `spec/screens.md` (master) + `spec/design.pen` 영향 frame
4. spec 앵커 cross-reference — `spec/event-taxonomy.md`(이벤트), `spec/design-system.md`(톤), `docs/operations.md`(가드레일), `~/brain/wiki/pages/home-coffing.md`(service 정의)
5. `issues/LIFE-N/dev-plan.md` 작성 (5축 분해: api / app / shared-types / events / infra)

planner 단독 실행 — TeamCreate는 Phase 2부터.

## Phase 2: 팀 구성 + DTO 잠금

`TeamCreate(team_name="LIFE-N", members=[api-builder, app-builder, types-keeper, qa])`

첫 작업: types-keeper에게 `### shared-types` 항목 할당 (`dto-sync` 스킬). 다른 빌더는 잠금 완료 통보 받을 때까지 대기.

이유: API/App가 같은 DTO를 보고 작업해야 경계면이 어긋나지 않음.

## Phase 3: 병렬 빌드

types-keeper 잠금 완료 후:
- api-builder: `entity-module` 스킬 사용, `### api` 항목 구현
- app-builder: `app-screen` 스킬 사용, `### app` + `### events` 항목 구현

두 빌더는 SendMessage로 서로 진행 통보, 새 DTO 필요 시 types-keeper에게 즉시 요청.

## Phase 4: 점진 QA

각 빌더가 모듈 단위로 완료 보고 → qa가 `boundary-qa` 스킬로 **해당 모듈만** 검증.

전체 완성 후 1회 검증 X — 모듈마다 즉시 검증하여 다음 빌드 전 수정.

## Phase 5: 통합 보고

qa 최종 보고서(`issues/LIFE-N/qa.md`) + 모든 `issues/LIFE-N/*-changes.md` 종합:
- 변경 파일 목록
- 새 endpoint / hook / DTO / 이벤트
- schema:update 실행 필요 여부 (사용자 승인 후 실행)
- `spec/screens.md` master 영향 라인 (designing-done에서 sync 안 했다면 plan에 명시)
- Critical/Major 이슈 잔존 시 명시
- 커밋 메시지 초안 (`feat(api|app|types): LIFE-N {요약}` 패턴, 사용자 확인 후 commit)

`TeamDelete`로 팀 정리.

## 데이터 전달 프로토콜

- **태스크 기반(TaskCreate):** 빌더별 작업 할당
- **메시지 기반(SendMessage):** DTO 잠금/요청, QA Critical/Major 이슈
- **파일 기반(`issues/LIFE-N/`):** 모든 산출물 (`dev-plan.md`, `api-changes.md`, `app-changes.md`, `types-changes.md`, `qa.md`)

## 산출물 위치

`issues/LIFE-N/`는 워크트리(`.claude/worktrees/LIFE-N/issues/LIFE-N/`) 안에 생성, `issue/LIFE-N` 브랜치에 함께 커밋. `.gitignore`는 `issues/`를 제외하지 *않으므로* (= 커밋 가능).

## 에러 핸들링

| 상황 | 대응 |
|---|---|
| 워크트리 없음 | "issue-bootstrap 먼저" 보고 후 중단 |
| 앱 DB Task 없음 | LIFE-N 잘못됨 가능성. 사용자 확인 |
| types-keeper 잠금 실패 (DTO 충돌) | 사용자에게 의사결정 요청 |
| qa Critical/Major 이슈 | 1회 재시도 (해당 빌더 SendMessage), 재실패 시 보고서에 명시하고 진행 |
| 빌드 실패 | qa가 빌더에게 수정 요청, 1회 재시도 |
| `docs/operations.md` 위반 | 즉시 중단, 사용자 보고 |

## 테스트 시나리오

**정상 흐름:**
사용자 "LIFE-15 dev 가자" → planner가 앱 DB + analysis + sandbox screens.md 읽음 → dev-plan 작성 → 팀 생성 → types-keeper가 `ArchiveBeanRequest` 추가 → api-builder가 `POST /beans/:id/archive` 구현, app-builder가 archive 화면 + `bean_archived` 이벤트 추가 → qa가 endpoint shape ↔ hook 비교 + 이벤트 매핑 확인 → 통합 보고 + 커밋 초안.

**에러 흐름:**
api-builder가 `roastedAt: Date`로 응답, app-builder는 `string` 기대 → qa가 불일치 감지 → api-builder에게 SendMessage "ISO string 직렬화 누락" → api-builder 수정 → qa 재검증 → 통과.

## 트리거 금지

- 워크트리 생성 → `issue-bootstrap`
- 디자인 (design.pen·screens.md) → `issue-design`
- 단순 단일 파일 수정·typo·리네임 → 직접 Edit
- 정기 유지보수·리팩터 → `code-health`
