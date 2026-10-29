#!/usr/bin/env bash
# paddock:fixed
# task-finish.sh <작업 이름> [--into <묶음 브랜치>] | task-finish.sh <묶음 브랜치>
# 게이트 ② 뒤 작업 정리 — worktree·로컬 브랜치·세션 정리 훅.
# 기본 브랜치에 머지·push 하지 않는다. 기본 브랜치 반영은 PR 머지로만 한다.
#   기본      : 작업 브랜치 PR 이 있어야 한다(scripts/task-pr.sh). 로컬 작업 브랜치 = origin 사본임을 확인하고 지운다
#               — 작업 브랜치는 원격(PR head)에 남는다. PR 머지 뒤 다시 돌리면 남은 원격 브랜치도 지운다
#   --into F  : (bundle 모듈) 묶음(묶음 브랜치)의 자식 작업 — PR 없이 작업 브랜치를 F 에 로컬 merge 해 origin F 에 push 한 뒤 정리
#   <묶음>    : (bundle 모듈) 묶음 자신 — 묶음 PR 이 있어야 한다. 묶음 worktree·로컬 묶음 브랜치 정리(아래 finish_feature)
# 본체 밖 어디서 실행해도 됨 (레포 위치는 스크립트의 git 공통 디렉터리에서 역산). 멱등 — 이미 처리된 단계는 건너뜀.
# 값은 본체의 .paddock/config.sh 에서 읽는다: ISSUE_PREFIX(비면 ID 없음 — 브랜치 이름 자체가 작업 이름) · BASE_BRANCH · WORKTREE_DIR ·
# PADDOCK_MODULES(bundle·specs-repo 가 있는지) · BUNDLE_PREFIX · VARIANT_SUFFIXES.
#
# 변형 브랜치(<작업 이름>-*) 발견은 접두 매칭이다. VARIANT_SUFFIXES(경쟁 구현)는 원래부터 미머지 상태로 버려도 되는 게 설계다 — 강제 삭제.
# 그 외 변형(-fix 등, 코디네이터가 게이트① 수정 라운드용으로 만든 것)은 작업 브랜치에 이미
# 머지돼 있어야 정상이므로, 로컬·원격 사본이 작업 브랜치(PR head) 조상인지, worktree 에 미커밋 변경이 없는지 확인하고 아니면 멈춘다(미머지 작업 유실 방지).
# PR 머지는 merge commit 을 전제한다 — squash·rebase 로 머지하면 로컬 작업 브랜치가 기본 브랜치의 조상이 아니라 정리를 멈춘다(손으로 지운다).
# ID 없음 모드에서는 슬러그가 다른 작업 이름의 접두일 수 있다(foo 와 foo-bar) — 작업 이름을 서로 접두가 되지 않게 짓는다.
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
WORKTREE_DIR="${WORKTREE_DIR:-.claude/worktrees}"
BUNDLE_PREFIX="${BUNDLE_PREFIX:-feature/}"
VARIANT_SUFFIXES="${VARIANT_SUFFIXES--claude -codex}"
PADDOCK_MODULES="${PADDOCK_MODULES:-}"
has_module() { case " $PADDOCK_MODULES " in *" $1 "*) return 0 ;; esac; return 1; }
BUNDLE=0; if has_module bundle; then BUNDLE=1; fi
if [ -n "$ISSUE_PREFIX" ]; then TASK_FORM="$ISSUE_PREFIX-NNN-<슬러그>"; else TASK_FORM="<슬러그>"; fi

TASK=""; INTO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --into) INTO="${2:?--into 값 없음}"; shift 2 ;;
    -*) die "모르는 옵션: $1" ;;
    *) TASK="$1"; shift ;;
  esac
done
USAGE="사용법: task-finish.sh <$TASK_FORM>"
if [ "$BUNDLE" = 1 ]; then USAGE="$USAGE [--into $BUNDLE_PREFIX$TASK_FORM] | task-finish.sh $BUNDLE_PREFIX$TASK_FORM"; fi
[ -n "$TASK" ] || die "$USAGE"
WT="$REPO/$WORKTREE_DIR"

if [ "$BUNDLE" = 0 ]; then
  [ -z "$INTO" ] || die "--into 는 bundle 모듈을 켠 프로젝트에서만 쓴다 — .paddock/config.sh 의 PADDOCK_MODULES 에 bundle 이 없다" # guard:nobundle
  case "$TASK" in "$BUNDLE_PREFIX"*) die "묶음 브랜치($TASK)는 bundle 모듈을 켠 프로젝트에서만 받는다 — .paddock/config.sh 의 PADDOCK_MODULES 에 bundle 이 없다" ;; esac # guard:nobundle
fi

is_throwaway() { local s; for s in $VARIANT_SUFFIXES; do if [ "$1" = "$TASK$s" ]; then return 0; fi; done; return 1; }
has_local() { git -C "$REPO" rev-parse --verify -q "refs/heads/$1" >/dev/null; }
has_remote() { [ -n "$(git -C "$REPO" ls-remote --heads origin "refs/heads/$1")" ]; }

# 묶음(<묶음 브랜치>) — PR 생성 승인 직후 묶음 코디의 마지막 실행, PR 머지 뒤엔 본체의 안전망.
# PR(head = 묶음 브랜치) 확인 → 로컬 묶음 브랜치가 보존 위치에 다 있음 → 묶음 worktree 깨끗 → 남은 자식 0 → 묶음 worktree·로컬 묶음 브랜치 정리.
# 원격 묶음 브랜치는 PR 이 열려 있는 동안 남긴다(PR head). 검사를 다 통과한 뒤에만 지우고, 지우는 단계가 실패하면 성공을 보고하지 않는다.
# 지우기는 검사한 값에 묶는다 — 로컬 묶음 브랜치는 update-ref 구 값 비교, 원격 묶음 브랜치는 --force-with-lease(검사 뒤 움직였으면 멈춘다).
# 자식 = 묶음 브랜치가 아닌 로컬 브랜치·worktree 가운데 ⓐ upstream 이 origin/<묶음> 이거나(작업 시작 때 origin/<묶음> 에서 -b 로 따면
# git 기본값으로 그렇게 된다) ⓑ 묶음 고유 커밋(<PR base>..<묶음> 의 가장 오래된 것)을 품은 것(push -u 로 upstream 이 바뀌었거나
# --no-track·로컬 묶음 브랜치에서 딴 자식, 자식의 구현 변형, 브랜치 없는 worktree). 기본 브랜치·release/*·묶음 브랜치 접두는 세지 않는다 — 독립 작업은
# 기본 브랜치에서 따서 ⓐⓑ 둘 다 없다. **한계**: upstream 이 origin/<묶음> 이 아니고(--no-track 으로 땄거나 뒤에 push -u 로 바뀜)
# 묶음의 첫 고유 커밋보다 먼저 딴 자식은 못 센다 — 빈 묶음에서 딴 자식은 그 시점 기본 브랜치와 그래프가 같아 upstream·설정 말고 단서가 없다.
# ⓐⓑ 는 origin/<묶음> 에서 딴 통합 확인용 throwaway 브랜치도 센다(안전 쪽 — 지우고 다시).
# **한계**: worktree 등록의 `.git` 은 사라졌는데 폴더 잔해(node_modules 등)가 남으면 그 폴더를 본체로 읽어 멈춘다(제거 실패 또는 HEAD 사유) —
# 비파괴(exit≠0·무변경)다. 잔해 폴더는 손으로 치우고 `git worktree prune` 뒤 다시 실행한다.
# 세션 정리 훅은 부르지 않는다 — 묶음 코디는 구현 워커를 띄우지 않고, 작업 이름 접두 매칭은 자식 세션을 잘못 잡는다.
finish_feature() {
  local FWT PR PR_NUM PR_STATE PR_BASE KEEP here wt_list w b up h kids k u FT lease NAME_RE LOID="" ROID="" did=0
  if [ -n "$ISSUE_PREFIX" ]; then NAME_RE="^${BUNDLE_PREFIX}${ISSUE_PREFIX}-[0-9]+-[^/]+$"; else NAME_RE="^${BUNDLE_PREFIX}[^/]+$"; fi
  echo "$TASK" | grep -qE "$NAME_RE" || die "묶음 브랜치는 $BUNDLE_PREFIX$TASK_FORM 꼴만 받는다 (받은 값: $TASK)" # guard:f-name
  [ -z "$INTO" ] || die "--into 는 자식 작업에만 — 묶음 브랜치($TASK)와 함께 쓰지 않는다" # guard:f-into
  FWT="$(cd "$REPO" && pwd -P)/$WORKTREE_DIR/${TASK#"$BUNDLE_PREFIX"}"
  here="$(pwd -P)"
  case "$here/" in "$FWT/"*) die "묶음 worktree 안에서 실행 금지 — 본체 경로에서 본체의 스크립트로 실행" ;; esac # guard:f-cwd
  cd "$REPO"
  git fetch -q --prune origin || die "git fetch 실패" # guard:f-fetch

  # 1. PR·보존 위치
  PR="$(gh pr list --head "$TASK" --state all --json number,state,baseRefName --jq 'sort_by(.number) | last | if . == null then "" else "\(.number) \(.state) \(.baseRefName)" end')" \
    || die "gh pr list 실패" # guard:f-gh
  [ -n "$PR" ] || die "$TASK 의 PR 이 없다 — 먼저 scripts/task-pr.sh $TASK" # guard:f-nopr
  set -- $PR; PR_NUM="$1"; PR_STATE="$2"; PR_BASE="$3"
  case "$PR_STATE" in
    OPEN) KEEP="origin/$TASK"
          git rev-parse --verify -q "refs/remotes/$KEEP" >/dev/null || die "PR #$PR_NUM 이 열려 있는데 원격 $TASK 가 없다"
          git rev-parse --verify -q "refs/remotes/origin/$PR_BASE" >/dev/null || die "PR #$PR_NUM base 원격 $PR_BASE 가 없다" ;; # guard:f-base-open
    MERGED) KEEP="origin/$PR_BASE"
          git rev-parse --verify -q "refs/remotes/$KEEP" >/dev/null || die "PR #$PR_NUM base 원격 $PR_BASE 가 없다" ;; # guard:f-base-merged
    *) die "$TASK 의 PR #$PR_NUM 상태가 $PR_STATE — 열림·머지만 정리한다" ;; # guard:f-state
  esac
  if has_local "$TASK"; then
    LOID="$(git rev-parse "refs/heads/$TASK")"
    git merge-base --is-ancestor "$LOID" "$KEEP" || die "로컬 $TASK 에 $KEEP 에 없는 커밋이 있다 — push(task-pr.sh) 뒤 다시" # guard:f-ahead
  fi
  # 원격 묶음 브랜치 유무는 방금 fetch --prune 한 추적 ref 로 본다(ls-remote 조회 실패를 「없음」으로 읽지 않게)
  ROID="$(git rev-parse --verify -q "refs/remotes/origin/$TASK" || true)"
  if [ "$PR_STATE" = MERGED ] && [ -n "$ROID" ]; then
    git merge-base --is-ancestor "$ROID" "$KEEP" || die "원격 $TASK 가 $KEEP 에 다 들어 있지 않다 — 지우지 않는다, 수동 확인" # guard:f-remote-ahead
  fi
  note "$TASK 보존 위치: $KEEP (PR #$PR_NUM $PR_STATE → $PR_BASE)"

  # 2. 묶음 worktree — 기대 경로 + 그 브랜치를 체크아웃한 worktree 전부. 실행 위치가 그 안이 아니고, 본체 checkout 이 아니고,
  #    깨끗해야 한다(미추적 포함), specs-repo 모듈이 켜져 있으면 specs/ 파일이 없어야 한다
  wt_list="$(git worktree list --porcelain | awk -v b="refs/heads/$TASK" '
    /^worktree /{w=substr($0,10)} /^branch /{if (substr($0,8)==b) print w}' ; [ ! -d "$FWT" ] || echo "$FWT")"
  wt_list="$(echo "$wt_list" | awk 'NF && !seen[$0]++')"
  while IFS= read -r w; do
    [ -n "$w" ] || continue
    [ -d "$w" ] || continue   # 폴더가 지워진(prunable) 등록은 검사할 것이 없다 — 아래 git worktree prune 이 치운다
    [ "$(cd "$w" 2>/dev/null && pwd -P)" != "$(pwd -P)" ] || die "$TASK 가 본체 checkout 에 체크아웃돼 있다 — 본체를 $BASE_BRANCH 로 돌린 뒤 다시" # guard:f-main
    case "$here/" in "$w/"*) die "$TASK 를 체크아웃한 worktree($w) 안에서 실행 금지 — 본체 경로에서 실행" ;; esac # guard:f-cwd-wt
    if [ "$(git -C "$w" symbolic-ref -q HEAD || true)" != "refs/heads/$TASK" ]; then
      git merge-base --is-ancestor "$(git -C "$w" rev-parse HEAD)" "$KEEP" \
        || die "$w 의 HEAD 가 $TASK 가 아니고(detached·다른 브랜치) $KEEP 에 없는 커밋을 가리킨다 — 브랜치에 담거나 치운 뒤 다시" # guard:f-wt-head
    fi
    [ -z "$(git -C "$w" status --porcelain)" ] || die "$w 에 미커밋 변경·미추적 파일 — 묶음에 커밋·push 하거나 치운 뒤 다시" # guard:f-dirty
    if has_module specs-repo && [ -d "$w/specs" ] && [ -n "$(find "$w/specs" -type f -print -quit)" ]; then
      die "$w/specs 에 파일이 있다 — 산출물 레포의 작업 폴더로 옮긴 뒤 비우고 다시(worktree 와 함께 지워진다)" # guard:f-specs
    fi
  done <<EOF2
$wt_list
EOF2

  # 3. 남은 자식(위 머리 주석의 ⓐⓑ) — worktree 가 있으면(--into 미처리) 멈추고, worktree 없는 자식 브랜치는 보존 위치에 다 들어 있어야 한다
  FT="$ROID"; [ -n "$FT" ] || FT="$LOID"
  u=""; [ -z "$FT" ] || u="$(git rev-list --reverse "origin/$PR_BASE..$FT" | awk 'NR==1')" || die "묶음 고유 커밋 조회 실패(origin/$PR_BASE..$FT)"
  kids=""
  while read -r b up; do
    case "$b" in "$TASK"|"$BASE_BRANCH"|"$PR_BASE"|release/*|"$BUNDLE_PREFIX"*) continue ;; esac # guard:f-release
    if [ "$up" = "refs/remotes/origin/$TASK" ] || { [ -n "$u" ] && git merge-base --is-ancestor "$u" "$b"; }; then kids="$kids $b"; fi # guard:f-up
  done < <(git for-each-ref refs/heads --format='%(refname:short) %(upstream)')
  # 브랜치 없는(detached) worktree 가 묶음 고유 커밋을 품으면 자식 작업일 수 있다
  if [ -n "$u" ]; then
    while read -r h w; do
      git merge-base --is-ancestor "$u" "$h" 2>/dev/null \
        && die "브랜치 없는 worktree 가 $TASK 의 커밋을 품고 있다: $w — 자식 작업이면 묶음에 넣고 치운 뒤 다시" # guard:f-child-detached
    done < <(git worktree list --porcelain | awk '/^worktree /{w=substr($0,10)} /^HEAD /{h=substr($0,6)} /^detached/{print h, w}')
  fi
  for k in $kids; do
    while read -r b w; do
      case "$b" in "$k"|"$k"-*) die "자식 worktree 가 남아 있다: $w ($b) — 자식이면 자식 코디가 task-finish.sh $k --into $TASK 로 넣고, 통합 확인용 throwaway 면 지운 뒤 다시" ;; esac # guard:f-child-wt
    done < <(git worktree list --porcelain | awk '/^worktree /{w=substr($0,10)} /^branch refs\/heads\//{print substr($0,19), w}')
    git merge-base --is-ancestor "$k" "$KEEP" \
      || die "자식 브랜치 $k 가 $KEEP 에 다 들어 있지 않다 — 자식이면 task-finish.sh $k --into $TASK 로 넣고, 통합 확인용 throwaway 면 지운 뒤 다시" # guard:f-child-branch
    note "자식 브랜치 $k 가 남아 있다(이미 $KEEP 에 들어 있음) — 지우지 않는다, 필요하면 task-finish.sh $k --into $TASK"
  done

  # 4. 정리 — 검사를 다 통과한 뒤에만. git worktree remove 는 --force 없이(그새 더러워졌으면 git 이 거절한다) # guard:f-no-force
  while IFS= read -r w; do
    [ -n "$w" ] && [ -d "$w" ] || continue
    git worktree remove "$w" || die "worktree 제거 실패: $w — 원인을 본 뒤 다시(멱등)" # guard:f-wt-remove
    note "worktree 제거: $w"; did=1
  done <<EOF2
$wt_list
EOF2
  git worktree prune # guard:f-prune
  if [ -n "$LOID" ]; then
    git update-ref -d "refs/heads/$TASK" "$LOID" || die "로컬 $TASK 삭제 실패 — 검사 뒤 움직였을 수 있다, 다시 실행" # guard:f-cas
    git config --remove-section "branch.$TASK" 2>/dev/null || true   # git branch -D 처럼 추적 설정도 지운다(없으면 그만)
    note "브랜치 삭제: $TASK (보존 위치 $KEEP)"; did=1
  fi
  # PR 머지 뒤에는 원격 묶음 브랜치도 필요 없다 — 머지 쪽이 대개 먼저 지운다. 열린 PR 이면 head 라 남긴다
  if [ "$PR_STATE" = MERGED ] && [ -n "$ROID" ]; then
    lease="--force-with-lease=refs/heads/$TASK:$ROID" # guard:f-lease
    git push -q "$lease" origin ":refs/heads/$TASK" || die "원격 브랜치 $TASK 삭제 실패" # guard:f-remote-del
    note "원격 브랜치 삭제: $TASK"; did=1
  fi

  [ "$did" = 1 ] || note "정리할 것 없음 — 이미 정리됨"
  echo "✔ $TASK 정리 완료 — 보존 위치 $KEEP"
  if [ "$PR_STATE" = OPEN ]; then
    echo "□ 다음: PR #$PR_NUM 머지 대기. 묶음 코디는 여기서 끝 — 머지 전에 수정이 필요하면 본체가 묶음 worktree 를 다시 열고 묶음 코디를 재기동한다(bundle.md 6)"
  else
    echo "□ 다음: 머지된 묶음의 남은 로컬 정리 끝"
  fi
}
case "$TASK" in "$BUNDLE_PREFIX"*) finish_feature; exit 0 ;; esac

# 0. 안전 확인
case "$PWD/" in "$WT/$TASK"*) die "작업 worktree 안에서 실행 금지 — 본체나 다른 위치에서 실행" ;; esac
cd "$REPO"
git fetch -q --prune origin
if [ -d "$WT/$TASK" ]; then
  [ -z "$(git -C "$WT/$TASK" status --porcelain)" ] || die "작업 worktree 에 미커밋 변경 — 먼저 커밋(인계 문서 포함)"
fi
# specs-repo 모듈: 산출물은 산출물 레포에만 둔다. worktree 안 specs/ 는 .gitignore 라 status 에 안 보이는데, 측정 스크립트의
# 기본 출력 경로가 거기면 원자료가 남을 수 있다 — worktree 를 지우기 전에 멈춰서 옮기게 한다
if has_module specs-repo; then
  for w in "$WT/$TASK" "$WT/$TASK"-*; do
    if [ -d "$w/specs" ] && [ -n "$(find "$w/specs" -type f -print -quit)" ]; then
      die "$w/specs 에 파일이 있다 — 산출물 레포의 작업 폴더로 옮긴 뒤 비우고 다시(worktree 와 함께 지워진다)"
    fi
  done
fi

# 1. 작업 브랜치가 어디에 보존됐는지 확인 — 그 기준(KEEP)으로 변형 브랜치를 검사한다
if [ -n "$INTO" ]; then
  # 묶음 자식: 묶음 브랜치에 로컬 merge → push (임시 worktree, rebase 금지)
  # 묶음 브랜치만 받는다 — 기본 브랜치 등을 주면 PR 없이 기본 브랜치에 직접 merge·push 하게 된다(기본 브랜치 반영은 PR 머지로만)
  case "$INTO" in "$BUNDLE_PREFIX${ISSUE_PREFIX:+$ISSUE_PREFIX-}"*) ;; *) die "--into 는 $BUNDLE_PREFIX$TASK_FORM 만 받는다 (받은 값: $INTO)" ;; esac
  git rev-parse --verify -q "refs/remotes/origin/$INTO" >/dev/null || die "원격 묶음 브랜치 없음: origin/$INTO"
  KEEP="origin/$INTO"
  if has_local "$TASK" && ! git merge-base --is-ancestor "$TASK" "origin/$INTO"; then
    TMPWT="$WT/_finish-$TASK"
    git worktree add -q --detach "$TMPWT" "origin/$INTO"
    if ! git -C "$TMPWT" merge --no-ff --no-edit "$TASK" >/dev/null; then
      git -C "$TMPWT" merge --abort || true; git worktree remove --force "$TMPWT"
      die "$TASK → $INTO 충돌 — 묶음 쪽을 작업 브랜치에 merge 해 풀고 다시"
    fi
    git -C "$TMPWT" push -q origin "HEAD:refs/heads/$INTO" || { git worktree remove --force "$TMPWT"; die "origin/$INTO push 실패"; }
    git worktree remove --force "$TMPWT"
    git fetch -q origin "$INTO"
    note "$INTO ← $TASK 머지·push"
  elif has_local "$TASK"; then
    note "$TASK 는 이미 $INTO 에 들어 있음"
  elif git rev-parse --verify -q "refs/remotes/origin/$TASK" >/dev/null; then
    git merge-base --is-ancestor "origin/$TASK" "origin/$INTO" \
      || die "로컬 $TASK 가 없고 origin/$TASK 는 $INTO 에 들어 있지 않다 — 원격 브랜치를 받아(git branch $TASK origin/$TASK) 다시"
    note "로컬 $TASK 없음 — origin/$TASK 는 이미 $INTO 에 들어 있음"
  else
    note "로컬·원격 $TASK 모두 없음 — $INTO 에 넣을 것이 없다(이미 정리됨)"
  fi
else
  PR="$(gh pr list --head "$TASK" --state all --json number,state,baseRefName --jq 'sort_by(.number) | last | if . == null then "" else "\(.number) \(.state) \(.baseRefName)" end')"
  [ -n "$PR" ] || die "$TASK 의 PR 이 없다 — 먼저 scripts/task-pr.sh $TASK"
  set -- $PR; PR_NUM="$1"; PR_STATE="$2"; PR_BASE="$3"
  case "$PR_STATE" in
    OPEN) KEEP="origin/$TASK"
          git rev-parse --verify -q "refs/remotes/origin/$TASK" >/dev/null || die "PR 이 열려 있는데 원격 $TASK 가 없다" ;;
    MERGED) KEEP="origin/$PR_BASE" ;;
    *) die "$TASK 의 PR #$PR_NUM 상태가 $PR_STATE — 열림·머지만 정리한다" ;;
  esac
  if has_local "$TASK" && ! git merge-base --is-ancestor "$TASK" "$KEEP"; then
    [ "$PR_STATE" = MERGED ] && die "PR #$PR_NUM 은 머지됐는데 로컬 $TASK 가 $KEEP 에 조상으로 들어 있지 않다 — squash·rebase 머지는 자동 정리하지 않는다(merge commit 만). 머지된 내용을 확인한 뒤 손으로 지운다" # guard:f-squash
    die "로컬 $TASK 에 $KEEP 에 없는 커밋이 있다 — push(task-pr.sh) 뒤 다시"
  fi
  note "$TASK 보존 위치: $KEEP (PR #$PR_NUM $PR_STATE → $PR_BASE)"
fi

# 2. 변형 브랜치·worktree 전수 발견 ($TASK-* 접두 — 경쟁 구현 변형·-fix 등 이름 안 가림)
# macOS 기본 /bin/bash 가 3.2(GPLv3 회피)라 `mapfile` 이 없다 — while-read 로 배열 구성
VARIANTS=()
while IFS= read -r v; do [ -n "$v" ] && VARIANTS+=("$v"); done < <(
  { find "$WT" -maxdepth 1 -type d -name "$TASK-*" -exec basename {} \; 2>/dev/null ;
    git branch --list "$TASK-*" --format='%(refname:short)' ; } | sort -u
)
# ID 없음 모드에서는 이름이 서로 접두가 될 수 있다(foo · foo-bar 는 다른 작업) — 변형은 VARIANT_SUFFIXES 이름만 센다
if [ -z "$ISSUE_PREFIX" ]; then
  KEPT=(); for v in "${VARIANTS[@]:-}"; do [ -n "$v" ] && is_throwaway "$v" && KEPT+=("$v"); done   # guard:noid-variant
  VARIANTS=("${KEPT[@]:-}")
fi

# 안전: throwaway(VARIANT_SUFFIXES) 가 아닌 변형이 보존 위치의 조상이 아니면 멈춘다 — 미머지 작업일 수 있다
for v in "${VARIANTS[@]:-}"; do
  [ -z "$v" ] && continue
  is_throwaway "$v" && continue
  if [ -d "$WT/$v" ]; then
    [ -z "$(git -C "$WT/$v" status --porcelain)" ] || die "$v worktree 에 미커밋 변경 — 커밋해 작업 브랜치에 넣거나 버린 뒤 재실행(자동 삭제 안 함)" # guard:variant-dirty
  fi
  if has_local "$v"; then
    git merge-base --is-ancestor "$v" "$KEEP" || \
      die "$v 가 $KEEP 조상이 아님 — 미머지 작업일 수 있다, 수동 확인 후 재실행(자동 삭제 안 함)"
  fi
  if has_remote "$v"; then
    VOID="$(git rev-parse --verify -q "refs/remotes/origin/$v" || true)"
    [ -n "$VOID" ] && git merge-base --is-ancestor "$VOID" "$KEEP" || \
      die "원격 $v 가 $KEEP 조상이 아님 — 원격에만 있는 작업일 수 있다, 수동 확인 후 재실행(자동 삭제 안 함)" # guard:variant-remote
  fi
done

# 3. worktree 제거 — $TASK 자신 + 변형 전부
for w in "$TASK" "${VARIANTS[@]:-}"; do
  [ -n "$w" ] && [ -d "$WT/$w" ] && { git worktree remove --force "$WT/$w" && note "worktree 제거: $w"; }
done
git worktree prune

# 4. 로컬 브랜치 정리 (변형은 확인됐으니 삭제, $TASK 는 보존 위치 확인 뒤 삭제)
#    원격 throwaway 사본(검증용으로 push 한 것)도 지운다
for v in "${VARIANTS[@]:-}"; do
  [ -z "$v" ] && continue
  has_local "$v" && git branch -D "$v" >/dev/null && note "브랜치 삭제: $v"
  has_remote "$v" && git push -q origin --delete "$v" && note "원격 브랜치 삭제: $v"
done
has_local "$TASK" && git branch -D "$TASK" >/dev/null && note "브랜치 삭제: $TASK (보존 위치 $KEEP)"
# PR 머지 뒤 또는 묶음으로 들어간 뒤에는 원격 작업 브랜치도 필요 없다
if [ "$KEEP" != "origin/$TASK" ] && has_remote "$TASK"; then
  git merge-base --is-ancestor "origin/$TASK" "$KEEP" && git push -q origin --delete "$TASK" && note "원격 브랜치 삭제: $TASK"
fi

# 5. 세션 정리 훅 — 있으면 <작업 이름> 으로 부른다(L2 매핑이 제공). 없으면 조용히 건너뛰고, 실패는 경고만 한다
HOOK="$REPO/.agents/harness/session-cleanup.sh"
if [ -x "$HOOK" ]; then
  "$HOOK" "$TASK" || echo "⚠ 세션 정리 훅 실패 — 수동 확인 필요 ($HOOK $TASK)" >&2 # guard:s-hook
fi

echo "✔ $TASK 정리 완료 — 보존 위치 $KEEP"
if [ "$KEEP" = "origin/$TASK" ]; then
  echo "□ 다음: PR 이 열려 있다. 머지한 뒤 task-finish.sh $TASK 를 다시 돌리면 남은 원격 브랜치까지 정리한다"
fi
