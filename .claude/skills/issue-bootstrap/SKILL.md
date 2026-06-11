---
name: issue-bootstrap
description: "home-coffing 일감(LIFE-N) 작업 시작 시 코드 워크트리·브랜치 생성 + analysis 로딩. 트리거: 'LIFE-15 시작', 'LIFE-N 작업', '워크트리 만들어줘', 'home-coffing {번호} 작업 환경 준비', 'issue-bootstrap'. 일감 ID는 LIFE-N (life-assistant 앱 DB의 sequentialId). issue-design/feature-delivery 진입 전 1회 실행."
---

# issue-bootstrap

home-coffing 일감(LIFE-N) 작업의 진입 의식. 코드 워크트리·브랜치 + analysis 로딩까지 1회 처리. 산출물 폴더(`issues/LIFE-N/`)는 만들지 *않고*, 디자인·dev skill이 lazy 생성.

## 컨벤션

- **일감 ID**: `LIFE-N` (life-assistant 앱 DB의 글로벌 sequentialId). 패딩 없음.
- **앱 DB Task**: life-assistant API가 source of truth. 메타·상태는 앱에서.
- **analysis**: `issues/LIFE-N/analysis.md` (선택 — issue-think 산출물, 2026-06-12부터 본 레포)
- **코드 워크트리**: `~/repos/byun618/home-coffing/.claude/worktrees/LIFE-N`
- **코드 브랜치**: `issue/LIFE-N`

## 워크플로우

### 1. 일감 ID 확인

사용자 입력에서 `LIFE-N` 추출. 없으면 묻기. 임의로 다음 번호 부여 X — 일감 생성은 brain의 `issue-create` (life-assistant API POST).

### 2. 앱 DB Task 메타 확인 (선택)

`LIFE_ASSISTANT_API_URL`·`LIFE_ASSISTANT_API_TOKEN` 환경변수 있으면 `GET {URL}/tasks/by-seq/{n}` 호출하여 title·status·project(home-coffing 일치 확인) 추출. 미설정·실패 시 skip하고 analysis만 의존.

### 3. analysis 로딩 (있으면)

`issues/LIFE-N/analysis.md` 존재 시 읽기. 없으면 skip — analysis 없이도 워크트리는 생성. 사용자에게 "analysis.md 없음, 그대로 진행하거나 `issue-think`로 먼저 분석할래?" 1번 물음.

### 4. 코드 워크트리 생성

```bash
cd /Users/byun/repos/byun618/home-coffing
git worktree add .claude/worktrees/LIFE-N -b issue/LIFE-N
```

이미 존재하면:
- 워크트리 디렉토리 존재 → "사용 계속?"
- 브랜치만 존재 (워크트리 없음) → `git worktree add .claude/worktrees/LIFE-N issue/LIFE-N` (기존 브랜치 사용)

원격에 동명 브랜치가 있으면 `git fetch` 후 추적 확인.

### 5. 세션 핸드오프 (iTerm 새 탭)

**현재 세션의 cwd·CLAUDE.md·permission 스코프는 루트 기준으로 고정**되어 있으므로, 워크트리에서 본격 작업은 **새 Claude 세션**에서. `cd`만으로 이어가지 마라.

5-1. 사용자에게 확인:
> "iTerm 새 탭을 열어 워크트리(`.claude/worktrees/LIFE-N`)에서 claude 세션을 시작할까요?"

5-2. 동의하면 osascript 실행:

```bash
osascript <<'EOF'
tell application "iTerm"
  activate
  tell current window
    create tab with default profile
  end tell
  tell current session of current window
    write text "cd /Users/byun/repos/byun618/home-coffing/.claude/worktrees/LIFE-N && claude"
  end tell
end tell
EOF
```

(`LIFE-N`은 실제 일감 ID로 치환)

5-3. 실패하거나 거절하면 fallback — 복붙용:

```
cd /Users/byun/repos/byun618/home-coffing/.claude/worktrees/LIFE-N && claude
```

5-4. 새 세션에서 사용자가 자연어로:
- "디자인 가자" → `issue-design`
- "dev 가자" / 기능 구현 → `feature-delivery`

## 산출물

- 새 코드 워크트리 + 브랜치 `issue/LIFE-N`
- iTerm 새 탭에서 claude 세션 (또는 fallback 명령어)
- 사용자에게 보고:
  - 앱 DB Task 메타 1줄 (있으면)
  - analysis.md 존재 여부 + 1~3줄 요약
  - 워크트리 경로
  - "새 탭에서 `issue-design` (디자인부터) 또는 `feature-delivery` (바로 dev) 호출"

## 안 하는 것

- 일감 ID 없는 일반 작업
- `issues/LIFE-N/` 폴더 생성 — 첫 산출물 박는 skill(issue-design/planner)이 lazy
- analysis.md를 워크트리 밖에서 찾기 — `issues/LIFE-N/analysis.md`가 유일 위치 (2026-06-12~)
- 일감 ID 자동 부여 — brain의 `issue-create`(life-assistant API POST)가 발급
- 단순 hotfix·typo·문서 수정 (일감 없는 변경)
