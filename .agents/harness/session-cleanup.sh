#!/usr/bin/env bash
# paddock:fixed
# session-cleanup.sh <작업 이름> — corral 매핑의 세션 정리 훅. task-finish.sh 가 정리 마지막에 부른다(실패는 경고만).
#
# 하는 일: 이 작업의 전용 worktree(<WORKTREE_DIR>/<작업 이름> 과 경쟁 구현 변형 <작업 이름><VARIANT_SUFFIXES>) 아래에 남은 corral
#   pane 을 `corral terminal list` 로 찾아 **후보로 출력**한다. 닫지 않는다.
# 닫지 않는 이유: 매핑 『회수·정리』 의 닫기 조건은 handle·worktree·도구 정체, 활성 Dispatch 없음, 사용자 takeover 없음, 이번 작업 전용이다.
#   `terminal list` 는 경로·제목만 주므로 worktree 경로(= 이번 작업 전용)만 증명되고, 나머지는 Dispatch 단위 조회(worker-show)가 필요한데
#   훅은 Dispatch id 를 모른다. 사람이 띄운 pane 도 같은 worktree 에 있을 수 있어 경로만으로는 '내가 띄운 것' 이 증명되지 않는다.
#   소유한 pane 의 닫기는 `worker-release` 가 소유 증명 뒤에 하므로 코디네이터가 이미 했어야 하고, 남은 것은 사람이 확인해 닫는다.
# corral CLI 가 없거나 런타임이 응답하지 않으면 조용히(없을 때) / 한 줄 알리고(응답 없을 때) exit 0.
set -u

TASK="${1:-}"
if [ -z "$TASK" ]; then
  echo "사용법: session-cleanup.sh <작업 이름>" >&2
  exit 2
fi

command -v corral >/dev/null 2>&1 || exit 0
if ! command -v jq >/dev/null 2>&1; then
  echo "· jq 가 없어 corral pane 후보를 찾지 못했다 — corral terminal list 를 직접 확인한다"
  exit 0
fi

# 레포 = 본체 checkout (task-finish.sh 와 같은 방식 — 스크립트 위치의 git 공통 디렉터리에서 역산)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON="$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || exit 0
REPO="$(dirname "$COMMON")"

WORKTREE_DIR=".claude/worktrees"
VARIANT_SUFFIXES="-claude -codex"
CONFIG="$REPO/.paddock/config.sh"
# shellcheck disable=SC1090
[ -f "$CONFIG" ] && . "$CONFIG"
WORKTREE_DIR="${WORKTREE_DIR:-.claude/worktrees}"
VARIANT_SUFFIXES="${VARIANT_SUFFIXES--claude -codex}"

# 이 작업의 worktree 경로들 — 심링크를 푼 경로도 같이(terminal list 의 path 가 어느 쪽으로 오든 맞게)
ROOTS=("$REPO")
PHYSICAL="$(cd -P "$REPO" 2>/dev/null && pwd -P)" && [ "$PHYSICAL" != "$REPO" ] && ROOTS+=("$PHYSICAL")
DIRS=()
for root in "${ROOTS[@]}"; do
  DIRS+=("$root/$WORKTREE_DIR/$TASK")
  for suffix in $VARIANT_SUFFIXES; do DIRS+=("$root/$WORKTREE_DIR/$TASK$suffix"); done
done
DIRS_JSON="$(printf '%s\n' "${DIRS[@]}" | jq -R . | jq -s .)"

corral status --json --timeout-ms 10000 >/dev/null 2>&1 || {
  echo "· corral 런타임이 응답하지 않아 세션 정리를 건너뛴다 — 남은 pane 은 앱에서 확인한다"
  exit 0
}
LIST="$(corral terminal list --json --timeout-ms 10000 2>/dev/null)" || {
  echo "⚠ corral terminal list 실패 — 남은 pane 을 앱에서 확인한다" >&2
  exit 0
}

# 경로가 정확히 그 worktree 이거나 그 아래인 것만(작업 이름이 다른 작업 이름의 접두여도 '/' 경계로 갈린다)
CANDIDATES="$(printf '%s' "$LIST" | jq -c --argjson dirs "$DIRS_JSON" '
  (.result.terminals // [])[]
  | select(.path as $path | any($dirs[]; . as $dir | $path == $dir or ($path | startswith($dir + "/"))))
' 2>/dev/null)" || {
  echo "⚠ corral terminal list 응답을 읽지 못했다 — 남은 pane 을 앱에서 확인한다" >&2
  exit 0
}

if [ -z "$CANDIDATES" ]; then
  echo "· 세션 정리: $TASK 의 worktree 아래에 남은 corral pane 없음"
  exit 0
fi

echo "· 세션 정리: $TASK 의 worktree 아래에 남은 corral pane 후보 (닫지 않았다)"
printf '%s\n' "$CANDIDATES" | sed 's/^/    /'
echo "  닫기 전 확인(매핑 『회수·정리』): corral terminal show --terminal <handle> --json 으로 handle·worktree·도구 정체,"
echo "  활성 Dispatch 없음·사용자 takeover 없음은 corral orchestration worker-show --dispatch <ctx> --json 으로 본다."
echo "  이 작업 전용으로 확인된 pane 만 corral terminal close --terminal <handle> --json (소유한 pane 은 worker-release 가 닫는다)."
exit 0
