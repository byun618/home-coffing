---
name: issue-design
description: "home-coffing 일감(LIFE-N) 디자인 산출물 작성 — `spec/design.pen` + `spec/screens.md` (master) / `issues/LIFE-N/design.pen` + `screens.md` (delta sandbox). user flow storyboard 본축 + 모든 인터랙션을 state frame으로. 매 batch_design 후 7-step verbalize 필수. designing-done 시 frame name 키로 master sync. 트리거: '디자인 들어가자', 'storyboard 그리자', 'screens 만들자', 'mockup 작업', 'master로 merge', '~ 화면 그려'. Pencil MCP 필수. 사고·기능 정의는 brain의 issue-think로, dev는 feature-delivery로."
---

# issue-design — Spec-Driven Design

home-coffing 일감(LIFE-N)의 디자인 산출물(design.pen·screens.md)을 *spec master + LIFE-N delta sandbox* 구조로 작성. 매 `batch_design` 후 7-step verbalize가 핵심.

## 실행 위치

**워크트리 안에서 실행** — `issue-bootstrap`이 만든 `.claude/worktrees/LIFE-N/`. 메인 레포 루트에서 실행 X (master 변경이 issue 브랜치에 격리되지 않음).

## 의존성

**Pencil MCP 전용**. `batch_design`·`batch_get`·`snapshot_layout`·`export_nodes` 등 모든 핵심 도구가 Pencil. 미연결 환경에선 동작 불가.

## 작업 위치

| 산출물 | master | delta sandbox |
|---|---|---|
| design (storyboard + frames) | `spec/design.pen` | `issues/LIFE-N/design.pen` |
| screens 명세 | `spec/screens.md` | `issues/LIFE-N/screens.md` |

design-system은 별도 master(`spec/design-system.pen` + `spec/design-system.md`) — 톤·컴포넌트 카탈로그 참조 전용, 일감별 sandbox 만들지 X. 변경 필요 시 사용자 결정.

master 직접 수정 X. designing-done 시 sandbox → master sync.

## Pre-flight (그리기 *전* 반드시)

1. **앱 DB Task read** — LIFE-N의 카테고리·관계·peer 일감 (life-assistant API `GET /tasks/by-seq/{n}`)
2. **analysis.md read** (있으면) — `issues/LIFE-N/analysis.md`의 결정·기능 정의·안 함·열린 질문
3. **peer 일감 산출물 read** — 같은 영역 LIFE-N의 결정·범위 (`issues/LIFE-{N-1,N-2,...}/screens.md`)
4. **design-system 카탈로그 read** — `spec/design-system.md` + `spec/design-system.pen` 톤·컴포넌트
5. **master `spec/design.pen`에서 영향받는 frame `batch_get`** — 패턴·필드·인터랙션·시트/풀스크린 여부. 없으면 frame 만들기 시작 금지. **partial fork**: 건드릴 frame 통째를 sandbox에 복사
6. **이전 일감 mockup에서 재사용 컴포넌트 확인** — `spec/pens/` archive에 일감별 mockup 보존

pre-flight 생략하고 frame부터 그리기 시작 = *spec 패턴 위배 거의 확정*.

## 첫 batch

1. `open_document`로 sandbox `issues/LIFE-N/design.pen` 새로 만들거나 기존 열기
2. **첫 frame은 storyboard 1번 row 헤더 + Entry frame** — flow primacy. inventory부터 그리면 동선 누락
3. `find_empty_space_on_canvas`로 시작 좌표 확보 (기존 frame 겹침 방지)
4. 이후 `batch_design`으로 추가. 매 batch 후 ⬇ 7-step verbalize

첫 batch 직후 cmd+S 저장 요청 (Pencil 새 문서는 unsaved). `.claude` 같은 숨김 폴더는 `cmd+shift+G`로 경로 직접 입력.

## 매 `batch_design` 후 — 7-step verbalize (필수)

머리로만 OK 판단 X. 사용자 답변에 *짧게라도 적기*:

> "Post-batch check: ① clip OK ② row gap OK ③ storyboard sync OK ④ spec 패턴 OK ⑤ 잉여 X ⑥ 모델 cascade — A 영향 ⑦ surface 필요 — X 사용자에게."

| # | 점검 | 의미 |
|---|---|---|
| 1 | **Content overflow** | `snapshot_layout(problemsOnly:true)`. clip 자식 → frame height ↑ 또는 content ↓. footer(saveBtn) 삐져나가는 게 가장 흔한 실수 |
| 2 | **Frame 충돌** | `snapshot_layout(maxDepth:0)` + 수동 검산. row 1 height H1이면 row 2 y ≥ H1 + 80px. `problemsOnly`는 frame *간* 충돌 안 잡음 |
| 3 | **Storyboard sync** | inventory frame 변경 → 그 frame의 storyboard 사본도 같이 update |
| 4 | **Spec 패턴 일관** | master(`spec/design.pen`) · 이전 일감 mockup · `spec/design-system.md`에 정의된 패턴 임의 변경 X. 변경 시 *명시 사용자 결정* |
| 5 | **잉여 + In-place 수정** | 같은 의미 두 frame은 하나 빼기. 수정은 기존 frame 직접. 멀리 새 variant 만들지 X |
| 6 | **데이터 모델 cascade** | UI 필드 변경 → schema도 같이 검토. UI에서 빠진 필드는 entity에서도 빠짐 |
| 7 | **사용자 surface** | 이번 batch 변경이 데이터 모델·인접 일감·이전 결정과 충돌 가능성 → 변경 *전*에 짚기 |

## User flow primacy — 모든 화면 = storyboard 등장

mockup의 primary 시각화 = User flow storyboard. **모든 화면 = storyboard 시나리오 1+ 등장 + 도달 entry path 명시**.

- storyboard 안 등장 안 하는 마스터 화면 만들지 X — 도달 path 없는 frame = 동선 고립
- frame inventory area는 *원칙적 폐기*
- 단 *state pattern variant*(snackbar·toast 같은 short-lived overlay)는 *마스터 frame 옆에 1개*만

### 모든 인터랙션 → state frame (풀 커버)

각 화면의 사용자 action별 결과 state를 frame으로 시각화:

- default / loading / empty / error / focused / disabled / after-action (토글 on/off·sheet open 등)

→ dev 진입 시 *어느 state도 모호함 없음*. screens.md에 state list 명시.

state frame이 많아지면 storyboard row 하나가 길어지거나, *별 row "상태 variants — {화면명}"*에 모음.

### arrow trigger 시각 출발

arrow는 시작 element 위치에서 출발. 공간에서 시작 X. 옵션:
- 시작 element highlight (dashed accent / dot)
- connection line (Pencil `type:"connection"`)
- 상대 위치 (arrow x를 시작 element 우측)

trigger element 시각 명시 없으면 *어디 누르면 이 화살표*인지 모호.

### Storyboard 룰

1. **각 flow 헤더에 `Entry → 종착` 한 줄 강제**
2. **Arrow 3요소** — trigger / 상태 변화 / 다음 frame. 시각 라벨 부족하면 screens.md flow 표로 보강
3. **분기 표현** — 동일 entry에서 분기 path 2-3개면 Y-branching
4. **flow별 row 배치** — canvas에 flow별 row로 시각 분리. row 헤더 `▾ Story N · 제목 — Entry → 종착`

## screens.md — 화면 기능 정의서

design.pen은 *flow + 비주얼*, screens.md는 *기능 정의서*. **각 화면 정형 표 강제** — 정성적 텍스트 X.

### 화면별 표 (강제)

```markdown
### {ID} · {화면 이름}

**진입 path**: {어디서 → 이 화면}
**스크린 타입**: 풀스크린 / sheet / popover / modal
**Anchor**: {화면 목적 한 줄}

| 영역 | UI 요소 | 인터랙션 | 데이터 매핑 (entity 필드 의미) | 검증 본질 |
|------|---------|----------|--------------------------------|-----------|
| 헤더 | back / title / actions | back tap → caller pop | — | — |
| 본문 | ... | ... | ... | ... |
| 하단 | ... | ... | ... | ... |

**상태 list**: default / loading / empty / error / focused / disabled / after-action
**권한**: admin only / member 가능 / 작성자 only
**다음 화면 transition**: 어떤 trigger → 어디로
```

### Flow 표 (storyboard별)

```markdown
| 단계 | frame | trigger | 상태 변화 | 다음 |
|------|-------|---------|----------|------|
```

### Open / TODO

developing 이월 (algorithm 선택·threshold 튜닝·구현 detail).

> **screens.md = 기획·디자인 관점만**. 컬럼 type·precision·algorithm threshold·API endpoint shape는 *코드 ground truth*. screens.md에 박지 X.

## 자주 놓치는 가드레일

- **사용자 멘탈 모델 → 입력 폼**: derived/누적/sum 자동, 입력 X
- **정보 중복**: header title ↔ 폼 첫 필드
- **라벨 vs 위치/포맷**: 컬럼 위치가 의미 전달하면 라벨 redundant
- **명명 패턴 일관성**: 같은 종류 frame mixed pattern 금지
- **한 컬럼 3+ stacked = 빡빡 sign**
- **권한 분기 시각화**: admin only 액션은 member 화면에 *비노출* (disabled 아님)
- **결정 cascade surface**: 한 변경 → 인접 frame·데이터 모델·이전 결정 영향 *변경 전*에 짚기

## Master sync — sandbox ↔ spec master

**원칙**: spec master = source of truth (전체 그림). sandbox = delta (이 일감이 건드릴 frame만).

### Fork (pre-flight 5번)
1. master에서 *이 일감이 건드릴 frame*만 추려냄 — 새 frame은 fork 대상 X (sandbox 신설)
2. **delta 단위 = frame 통째**. element 단위 추적 X
3. sandbox에 복사. 안 건드리는 frame은 sandbox에 두지 X
4. screens.md도 동일 — 해당 화면 표만 sandbox로 복사

### 작업 중
- sandbox 자유 수정·신설
- **master는 절대 건드리지 X** — designing-done 전까지 read-only

### Merge-back (designing-done)
- **frame name match** → master replace
- **frame name 새것** → master add
- master에만 있고 sandbox에 없는 frame → *유지* (delete 자동 X — 명시 결정만)
- screens.md도 화면 ID 키로 동일
- 일감 산출물 archive: `issues/LIFE-N/design.pen` → `spec/pens/LIFE-N-design.pen` 백업

> frame name = sync key. name 일관성 깨지면 잘못된 frame replace. designing-done checklist에서 명시 점검.

### Master in-place 변경 review

master frame을 in-place 수정·삭제할 때 *어떤 frame 바뀌었는지 시각 확인*용 형광 border 하이라이트 → 사용자 ✅ → 원복 → **`git diff` 디스크 sync 0건 확인** (Pencil 메모리/디스크 sync 시점차 방어).

## designing-done — Hand-off readiness

### 1. 최종 sweep
- 모든 mockup frame 7-step 한 번 더 전체 단위
- self-review — boundary 일관성·redundant UI·layer 충돌

### 2. Hand-off readiness
- 모든 frame이 screens.md에서 cover? (진입·타입·구조·인터랙션·데이터 매핑·검증 본질·권한)
- storyboard arrow trigger ↔ screens.md flow 표 일관?
- 모든 flow에 entry point 명시?
- 분기 path 시각화?
- 기획·디자인 boundary 안? (코드 spec 박혀 있지 X)
- Open / TODO에 algorithm 선택·threshold 등 dev 결정 이월?
- **frame name 일관성** — 수정 frame은 master 동일 name과 정확히 match? 신설은 새 name?
- **master 형광 border 원복 + `git diff` 확인** — `git diff spec/design.pen | grep '^+.*39FF14'` 잔존 0건

### 3. 동기화
- **Master merge-back** — sandbox → master sync. frame name match → replace, 새 name → add. 사용자 ✅ 후 실행
- screens.md sync 동일 룰
- 일감 mockup archive — `spec/pens/LIFE-N-design.pen` 백업

### 4. 종료
designing-done 후 *자동 다음 단계 X*. 사용자가 자연어로 `feature-delivery` (dev → qa) 호출.

## 안 하는 것

- pre-flight 생략 후 frame부터 그리기
- batch_design 후 7-step verbalize 생략, 머리로 OK 판단
- storyboard 시나리오에 등장 안 하는 화면 만들기 (동선 고립)
- 인터랙션 부수적 state 명세를 *텍스트만으로* (state frame 필수)
- arrow가 빈 공간에서 출발
- 수정을 기존 frame *직접 수정* X 하고 inventory area에 새 variant 추가
- `problemsOnly:true`만 보고 layout OK 판정
- 텍스트 다이어그램으로 storyboard 대체
- screens.md에 코드 spec 박기 (algorithm 구현·threshold 숫자·schema precision·API endpoint shape)
- flow 헤더 없는 storyboard
- arrow 라벨 1요소만
- master 형광 border 원복 batch 후 `git diff` 확인 없이 commit
- master(`spec/`) 직접 수정 — designing-done의 merge-back 단계에서만

## 다른 skill로 자연 전환

- 사고·기능 정의 → brain의 `issue-think` (brain 세션)
- raw 입력 → brain의 `issue-create` (brain 세션)
- dev → `feature-delivery` (이 워크트리에서)

skill 간 자동 호출 X. 모든 전환은 사용자 명시 호출.
