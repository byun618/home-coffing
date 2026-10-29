#!/usr/bin/env bash
# paddock:fixed
# task-pr.sh <브랜치> [--base <base>] [--pr <산출물 루트 상대경로>] [--verdict <산출물 루트 상대경로>] [--draft]
# 게이트 ② PR 생성 승인 뒤 PR 을 연다. 머지는 하지 않는다.
#   <브랜치>  작업 브랜치 (<ID 접두>-NNN-<슬러그>, ID 접두가 없는 프로젝트는 <슬러그>) 또는 (bundle 모듈) 묶음 브랜치 (<묶음 접두>…)
#   --base    PR 대상. 기본 BASE_BRANCH. 리허설은 throwaway base 를 준다
#   --pr      PR 원고 (산출물 루트 상대경로). 기본 <브랜치에서 묶음 접두를 뗀 이름>/pr.md — 코디네이터가 쓰고 커밋한다.
#             첫 줄 `# <제목>` = PR 제목, 나머지 = 본문. 스크립트는 판정문 위치·head/base·서명만 덧붙인다
#   --verdict 판정문 (산출물 루트 상대경로). 기본 <…>/verdict.md (존재·커밋 확인, 본문엔 위치만 텍스트로)
#   --draft   draft 로 연다 (검증용 PR)
# 값은 본체의 .paddock/config.sh 에서 읽는다: ISSUE_PREFIX(비면 ID 없음 — 브랜치 이름 자체가 작업 이름) · BASE_BRANCH · PADDOCK_MODULES ·
# BUNDLE_PREFIX · SPECS_ROOT(본체 기준 상대경로 또는 절대경로; `<본체>` 는 본체 경로로 푼다) · PR_FOOTER.
# specs-repo 모듈이 켜져 있으면 SPECS_ROOT 는 별도 산출물 레포다 — 원고·판정문·작업 폴더가 거기 커밋돼 있어야 하고, 스크립트가 그 레포를 push 한다.
# 흐름: 상태 파악 → 미커밋 거절 → push -u → 같은 head 의 열린 PR 재사용/없으면 생성.
# 멱등 — 다시 돌리면 같은 PR 의 본문만 갱신하고 PR 을 하나 더 만들지 않는다. 본체 밖 어디서 실행해도 된다.
set -euo pipefail

die() { echo "✖ $1" >&2; exit 1; }
note() { echo "· $1"; }

# 레포 = 본체 checkout. 작업 worktree 의 사본이나 `git show … > 파일` 로 꺼낸 사본으로 돌려도 본체를 가리키게
# 스크립트 위치(없으면 cwd)의 git 공통 디렉터리에서 역산한다
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON="$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || git rev-parse --path-format=absolute --git-common-dir)" \
  || die "git 레포 안에서 실행한다"
REPO="$(dirname "$COMMON")"

# 설정 — 본체의 .paddock/config.sh
CONFIG="$REPO/.paddock/config.sh"
[ -f "$CONFIG" ] || die "설정 파일 없음: $CONFIG — paddock 을 먼저 들인다"
# shellcheck disable=SC1090
. "$CONFIG"
ISSUE_PREFIX="${ISSUE_PREFIX:-}"
BASE_BRANCH="${BASE_BRANCH:-main}"
BUNDLE_PREFIX="${BUNDLE_PREFIX:-feature/}"
PADDOCK_MODULES="${PADDOCK_MODULES:-}"
SPECS_ROOT="${SPECS_ROOT:-specs}"
PR_FOOTER="${PR_FOOTER:-}"
has_module() { case " $PADDOCK_MODULES " in *" $1 "*) return 0 ;; esac; return 1; }
BUNDLE=0; if has_module bundle; then BUNDLE=1; fi
if [ -n "$ISSUE_PREFIX" ]; then TASK_FORM="$ISSUE_PREFIX-NNN-<슬러그>"; else TASK_FORM="<슬러그>"; fi

HEAD_BRANCH=""; BASE=""; PR_DOC=""; VERDICT=""; DRAFT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="${2:?--base 값 없음}"; shift 2 ;;
    --pr) PR_DOC="${2:?--pr 값 없음}"; shift 2 ;;
    --verdict) VERDICT="${2:?--verdict 값 없음}"; shift 2 ;;
    --draft) DRAFT=1; shift ;;
    -*) die "모르는 옵션: $1" ;;
    *) [ -z "$HEAD_BRANCH" ] || die "브랜치는 하나만"; HEAD_BRANCH="$1"; shift ;;
  esac
done
BASE="${BASE:-$BASE_BRANCH}"
USAGE="사용법: task-pr.sh <$TASK_FORM"
if [ "$BUNDLE" = 1 ]; then USAGE="$USAGE|$BUNDLE_PREFIX$TASK_FORM"; fi
[ -n "$HEAD_BRANCH" ] || die "$USAGE> [--base $BASE_BRANCH] [--pr …] [--verdict …] [--draft]"
[ "$HEAD_BRANCH" != "$BASE" ] || die "head 와 base 가 같다: $BASE"
[ "$HEAD_BRANCH" != "$BASE_BRANCH" ] || die "$BASE_BRANCH 는 head 가 될 수 없다"
if [ "$BUNDLE" = 0 ]; then
  case "$HEAD_BRANCH" in "$BUNDLE_PREFIX"*) die "묶음 브랜치($HEAD_BRANCH)는 bundle 모듈을 켠 프로젝트에서만 받는다 — .paddock/config.sh 의 PADDOCK_MODULES 에 bundle 이 없다" ;; esac
fi

cd "$REPO"   # gh 가 이 레포를 보게
SPEC_ID="${HEAD_BRANCH#"$BUNDLE_PREFIX"}"
# 일감 ID — 이름 어디에 있든 첫 것(리허설 throwaway/<ID>-… 도 받는다). 파이프 없이 한 프로세스. ID 접두가 없는 프로젝트는 이름 자체가 작업 이름이다
TASK_ID=""
if [ -n "$ISSUE_PREFIX" ]; then
  TASK_ID="$(awk -v prefix="$ISSUE_PREFIX" 'match($0, prefix "-[0-9]+") { print substr($0, RSTART, RLENGTH) }' <<<"$SPEC_ID")"
  [ -n "$TASK_ID" ] || die "브랜치 이름에서 $ISSUE_PREFIX 번호를 못 찾음: $HEAD_BRANCH"
fi
[ -n "$VERDICT" ] || VERDICT="$SPEC_ID/verdict.md"
[ -n "$PR_DOC" ] || PR_DOC="$SPEC_ID/pr.md"
SPECS="${SPECS_ROOT//<본체>/$REPO}"
case "$SPECS" in /*) ;; *) SPECS="$REPO/$SPECS" ;; esac
[ -d "$SPECS" ] || die "산출물 폴더 없음: $SPECS (.paddock/config.sh 의 SPECS_ROOT 확인)"
if has_module specs-repo; then
  [ "$(git -C "$SPECS" rev-parse --show-toplevel 2>/dev/null)" = "$(cd "$SPECS" 2>/dev/null && pwd -P)" ] \
    || die "산출물 레포가 아니다: $SPECS (.paddock/config.sh 의 SPECS_ROOT 확인)"
fi
# 원고·판정문은 있어야 하고, specs-repo 모듈이면 산출물 레포에 커밋돼 있어야 한다 — 작업 폴더에만 있고 커밋 안 된 문서로 PR 을 열지 않는다
doc_ready() {
  [ -f "$SPECS/$1" ] || die "$2 없음: $SPECS/$1"
  has_module specs-repo || return 0
  git -C "$SPECS" ls-files --error-unmatch -- "$1" >/dev/null 2>&1 || die "$2 가 산출물 레포에 커밋되지 않았다: $1"
  [ -z "$(git -C "$SPECS" status --porcelain -- "$1")" ] || die "$2 에 커밋 안 된 변경: $1 — 커밋한 뒤 다시"
}

# 0. 상태 파악 — 브랜치·미커밋·판정문
git -C "$REPO" fetch -q origin
git -C "$REPO" rev-parse --verify -q "refs/heads/$HEAD_BRANCH" >/dev/null || die "로컬 브랜치 없음: $HEAD_BRANCH"
git -C "$REPO" rev-parse --verify -q "refs/remotes/origin/$BASE" >/dev/null || die "원격 base 없음: origin/$BASE"
WT_PATH="$(git -C "$REPO" worktree list --porcelain | awk -v b="branch refs/heads/$HEAD_BRANCH" '/^worktree /{p=substr($0,10)} $0==b{print p}')"
if [ -n "$WT_PATH" ]; then
  [ -z "$(git -C "$WT_PATH" status --porcelain)" ] || die "미커밋 변경 있음: $WT_PATH — 커밋한 뒤 다시"
fi
doc_ready "$VERDICT" "판정문"
doc_ready "$PR_DOC" "PR 원고"
if has_module specs-repo; then
  # 작업 폴더 전체(원자료 포함)가 커밋돼 있어야 한다 — 원자료가 빠진 채 PR 을 열지 않는다
  [ -d "$SPECS/$SPEC_ID" ] || die "작업 폴더 없음: $SPECS/$SPEC_ID"
  DIRTY="$(git -C "$SPECS" status --porcelain --untracked-files=all -- "$SPEC_ID/")"
  [ -z "$DIRTY" ] || die "산출물 레포 작업 폴더에 커밋 안 된 파일: $SPEC_ID/ — 코디가 커밋한 뒤 다시
$(head -5 <<<"$DIRTY")"
fi
[ -n "$(git -C "$REPO" log --oneline "origin/$BASE..$HEAD_BRANCH")" ] || die "$BASE 에 없는 커밋이 없다 — 이미 반영됐거나 빈 브랜치"

# PR 원고 — 코디네이터가 diff·산출물을 읽고 쓴 제목·본문. 기계적으로 뽑지 않는다. 없으면 push 전에 멈춘다
PR_TEXT="$(cat "$SPECS/$PR_DOC")"
TITLE="$(awk 'NF{ if (sub(/^# +/, "")) print; exit }' <<<"$PR_TEXT")"
[ -n "$TITLE" ] || die "PR 원고 첫 줄이 '# <제목>' 이 아니다: $PR_DOC"
BODY="$(awk 'done{print; next} NF{done=1}' <<<"$PR_TEXT")"
[ -n "$(tr -d '[:space:]' <<<"$BODY")" ] || die "PR 원고에 본문이 없다: $PR_DOC"

# 1. 산출물 레포 push (specs-repo 모듈 — 원고·판정문 백업, 다른 일감 커밋이 같이 올라가도 된다), 작업 브랜치 push -u (이미 push 됐으면 delta 만)
if has_module specs-repo; then
  git -C "$SPECS" push -q origin HEAD || die "산출물 레포 push 실패: $SPECS"
fi
git -C "$REPO" push -u origin "$HEAD_BRANCH"
[ "$(git -C "$REPO" rev-parse "$HEAD_BRANCH")" = "$(git -C "$REPO" rev-parse "origin/$HEAD_BRANCH")" ] || die "push 뒤 원격과 로컬이 다르다"

# 2. 본문 — 원고 그대로 + 판정문 위치·head/base·서명
if [ -n "$TASK_ID" ]; then
  case "$TITLE" in *"$TASK_ID"*) ;; *) TITLE="$TASK_ID: $TITLE" ;; esac
fi
BODY_FILE="$(mktemp)"; trap 'rm -f "$BODY_FILE"' EXIT
{
  printf '%s\n' "$BODY"
  echo
  echo "---"
  echo
  if has_module specs-repo; then
    echo "- 판정문: 산출물 레포 \`$VERDICT\` (링크 없음)"
  else
    echo "- 판정문: \`$VERDICT\`"
  fi
  if has_module l3; then
    echo "- head \`$HEAD_BRANCH\` @ \`$(git -C "$REPO" rev-parse --short "$HEAD_BRANCH")\` → base \`$BASE\` — 머지는 출고(release) 흐름으로만 한다"
  else
    echo "- head \`$HEAD_BRANCH\` @ \`$(git -C "$REPO" rev-parse --short "$HEAD_BRANCH")\` → base \`$BASE\`"
  fi
  if [ -n "$PR_FOOTER" ]; then
    echo
    printf '%s\n' "$PR_FOOTER"
  fi
} > "$BODY_FILE"

# 3. 같은 head 의 열린 PR 재사용, 없으면 생성
EXISTING="$(gh pr list --head "$HEAD_BRANCH" --state open --json number,baseRefName --jq '.[] | "\(.number) \(.baseRefName)"')"
if [ -n "$EXISTING" ]; then
  [ "$(printf '%s\n' "$EXISTING" | wc -l | tr -d ' ')" = "1" ] || die "같은 head 의 열린 PR 이 여럿: $EXISTING"
  NUM="${EXISTING%% *}"; EXISTING_BASE="${EXISTING#* }"
  [ "$EXISTING_BASE" = "$BASE" ] || die "열린 PR #$NUM 의 base 가 $EXISTING_BASE — 요청 base $BASE 와 다르다"
  gh pr edit "$NUM" --title "$TITLE" --body-file "$BODY_FILE" >/dev/null
  note "기존 PR #$NUM 재사용 (제목·본문 갱신)"
else
  DRAFT_FLAG=""; [ "$DRAFT" = 1 ] && DRAFT_FLAG="--draft"
  gh pr create --base "$BASE" --head "$HEAD_BRANCH" --title "$TITLE" --body-file "$BODY_FILE" $DRAFT_FLAG >/dev/null
  NUM="$(gh pr list --head "$HEAD_BRANCH" --state open --json number --jq '.[0].number')"
  note "PR #$NUM 생성"
fi

echo "✔ $HEAD_BRANCH → $BASE : $(gh pr view "$NUM" --json url --jq .url)"
case "$HEAD_BRANCH" in
  "$BUNDLE_PREFIX"*) echo "□ 다음: PR 을 머지한 뒤 묶음 정리는 scripts/task-finish.sh $HEAD_BRANCH (묶음 worktree 밖, 본체 경로에서 — 묶음 코디의 마지막 실행). 남은 자식 worktree 가 있으면 멈춘다" ;;
  *) echo "□ 다음: PR 을 머지한 뒤 작업 정리는 scripts/task-finish.sh $HEAD_BRANCH (작업 worktree 밖에서)" ;;
esac
if has_module l3; then
  echo "□ 머지는 이 스크립트가 하지 않는다 — 출고(release) 흐름에서 한다"
fi
