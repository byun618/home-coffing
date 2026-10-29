<!-- paddock:fixed -->
# corral 매핑 — 능력 → 명령

능력 이름과 보장 어휘(증명/관측/공백)의 정본은 [capabilities.md](capabilities.md). 이 파일은 그 능력을
corral CLI 로 어떻게 수행하고, **무엇까지 증명되는지**를 적는다. 명령별 시그니처·주의사항의 정본은
`corral agent-context --json` 이다 — 이 파일에 없는 세부는 그것을 본다.

## 이 도구를 쓰기 위한 전제

- **H7 — `corral` 은 두 갈래로 풀린다. foundation 명령은 셸 node 와 무관하다.**
  설치본 앱이 있으면 PATH 의 `corral` 은 앱이 두는 shim(`~/.local/bin/corral`)이고 앱 내장 Node 로 CLI 를 돌린다 —
  `--version`·`open`·`status` 등 foundation 명령은 셸 node 버전·유무와 무관하다. 설치본 CLI 의 terminal·orchestration 은
  **앱 동봉 backend 로 돈다** — 앱이 backend 를 스스로 띄우고, 런타임은 명시 바인딩이 없으면 GUI 가 지금 붙은 그 서버를
  쓴다(앱이 실행 중이어야 한다). PATH 등록은 앱 메뉴 「Install 'corral' Command in PATH…」. 설치본이 없는 기계에서는
  npm-link 된 CLI 에 풀리고, 그 node bin 이 PATH 에서 `~/.local/bin` 보다 앞이면 설치본 shim 을 가린다.
  `command -v corral` 이 비거나 엉뚱한 쪽이면 도구 부재가 아니라 PATH 문제로 먼저 의심한다. 필요하면
  `node <경로>/corral.mjs` 절대경로 호출형으로 부른다 — **이 대체 호출형도 표기 허용 목록에 있다**(A3). 그렇게 적은 명령줄도
  접두사 표기와 똑같이 플래그·선언 대조를 받는다. 전역옵션(`--socket`·`--instance` …)을 명령 앞에 두는
  표기도 허용 목록에 있고 같은 검사를 받는다.
- 모든 명령은 로컬 Unix 소켓 클라이언트다. `--socket` 을 생략하면 기본 프로필 소켓
  (`~/Library/Application Support/corral/runtime/rpc.sock`)에 붙는다. 다른 프로필·인스턴스를 쓸 때만
  `--socket`·`--instance` 를 명시한다.
  **예외: `agent-context` 는 순수 로컬 레지스트리 읽기라 `--socket` 을 거절한다**(`invalid_argument`).
- **계약을 알 수 있는 곳은 `corral agent-context` 다**(기계용 시그니처·주의사항). 이 매핑에 없는 세부를 찾을 때 그것을 본다.
- **`--run` 은 orchestration 명령 전부가 받는 플래그가 아니다** — 받지 않는 9개는 『제어 문맥 격리』에
  목록으로 적었다. 없는 명령에 붙이면 `invalid_argument` 로 튕긴다.
- 공통 플래그는 `--json`·`--timeout-ms`·`--request-id`. **`--timeout-ms` 상한은 `orchestration check` ·
  `orchestration ask` 만 600000 이고 나머지는 120000 이다** (초과는 `--timeout-ms must be 1..120000` 거절).
- **⚠ 호출자 자신의 타임아웃이 `--timeout-ms` 보다 커야 한다.** 여기 적힌 상한은 corral 쪽 예산이고,
  명령을 실행하는 셸·도구에도 따로 예산이 있다(에이전트의 셸 도구는 보통 120초). 더 짧은 쪽이 먼저 죽으면
  **corral 은 계속 돌고 있는데 호출자만 끊긴다** — 그러면 `request_cancelled`("수락된 효과는 이미 일어났을 수
  있다") 뒤에 `--ack` 를 다시 쳐서 `delivery_stale` 로 가는, 이 문서가 『완료 감지』 복구에서 경고하는 바로 그
  사고다. **두 예산을 함께 정해라**: corral `--timeout-ms N` 이면 호출자 예산은 N + 여유. 호출자 예산을 늘릴 수
  없으면 corral 쪽을 그보다 작게 잡아라 — `corral orchestration check --block --timeout-ms 600000` 을 120초 셸에서 그대로 치지 않는다.
- **거절 응답은 복구 명령을 스스로 알려준다** — `error.resources.recovery` 필드를 먼저 읽는다.
  거절의 `stage`(`preflight`·`receipt`·단계 이름)가 "효과가 시작됐는지" 를 가른다.
- 재시도는 **같은 `--request-id` 를 다시 보내는 것**이다. 별도 retry 플래그는 없다. 같은 id + 다른 입력은
  `request_conflict`, 아직 기록되지 않은 영수증은 `outcome_unknown` 이고 **절대 자동 재실행되지 않는다**.
  영수증 보존은 24시간이다. `absent` 는 "아무 일도 없었다" 가 아니다.
- **H3 — 문서가 시그니처를 적지 않으면 추측한 플래그가 거절된다.** 확인된 세 형태:
  `worker-stop` 에 `--reason` 없음(있는 쪽은 `worker-retain`) · `dispatch-show` 는 `--id`(또는 `--task`),
  `--dispatch` 아님 · `corral terminal wait --timeout-ms` 상한 120000.
- **H1' — 큰 본문은 파일로 넣는다.** `corral terminal prompt --file <경로>` 또는 `corral orchestration worker-start --spec-file <경로>`.
  `task-create` 에는 `--spec-file` 이 **없다**(`--spec` 만).
  **⚠ `--file` 은 상한을 올려 주지 않는다.** `--text`·`--file`·`--stdin` 에 **같은 65536 UTF-8 바이트** 상한이
  걸린다 (초과는 `--file must be NUL-free UTF-8, at most 65536 bytes`). `--file` 의 효용은 argv·따옴표·이스케이프를
  피하는 것뿐이다. **상한을 넘으면 상세를 파일로 저장하고 짧은 지시에 그 경로를 적어 워커가 읽게 한다.**
  `corral orchestration worker-start --spec-file` 의 **TASK 본문 상한은 49152 바이트**이고 이것은 preamble 을 **포함하지 않는**
  본문 단독 값이다 (preamble 몫 16384 바이트는 그 밖에 있다).

## 보장 요약 (네 가지 증명 대상)

| 증명 대상 | 수준 | 무엇이 그것을 돌려주는가 |
| --- | --- | --- |
| 본문이 정확히 한 번 전달됐다 | **증명(소유 증명 가능한 세션 기록이 있을 때)** — 기록이 없거나 둘 이상이면 `unknown`(공백)이다 | `corral terminal prompt --wait accepted` 의 `outcome: completed` + `record.matchCount: 1` + `wait.satisfied`. 제출 창 안에서 정확히 1건 일치일 때만 `stage: confirmed`·`phase: accepted`. 2건 이상은 "확인된 1회" 가 아니라 **한 입력 규칙이 깨진 것**으로 보고된다 |
| 이 pane 이 맡긴 그 pane 이다 (세대 불변) | **증명** | handle 에 프로필·backend 부팅·PTY 세대가 묶여 있고, reconcile 이 `pane_gone`·`pty_replaced`·`epoch_changed` 로 시도를 `unknown` 으로 정산한다. 정리는 닫기 직전 같은 세대를 다시 관측하고 같은 lane 안에서 닫는다 |
| 보고가 오래된 시도에서 온 게 아니다 | **증명** | 워커 보고는 `--task-id`·`--dispatch-id` + pane 신원으로 검사된다. 다른 pane = `sender_mismatch`, 사라진 pane·교체된 시도 = `stale_dispatch`, 두 번째 완료 보고 = `illegal_transition`, 정산·중단·회수된 시도 = `capability_revoked`. **거절은 아무것도 저장하지 않는다** |
| 사람 개입 흔적 | **관측** | `terminal read` 화면뿐(H2). 구조화된 조회는 GUI 직접 입력을 보지 못한다. `corral orchestration worker-retain --reason user_takeover` 는 **사람이 선언하는 기록**이지 감지가 아니다 |

위 수준은 corral 의 공개 계약(`corral agent-context` 의 시그니처·주의사항)이 무엇을 값으로 돌려준다고 적는지를 읽은 것이다.
계약이 값으로 약속하지 않는 것은 관측·공백으로 적었다.

## 응답에서 어디를 읽나 (필드 경로)

식별자와 판정값이 응답의 **어디**에 있는지다. 이걸 모르면 명령은 알아도 다음 명령에 넣을 값을 못 꺼낸다.

| 무엇 | 어느 응답의 어디 |
| --- | --- |
| Run id | `run-current`·`run-create`·`run-use` → `result.run.id` (`run_<12 hex>`) |
| 일감(Task) id | `task-create` → `result.task.id` (`task_<12 hex>`) |
| 시도(Dispatch) id | `worker-start` → `result.dispatchId` (`ctx_<12 hex>`) · `worker-show`·`dispatch-show` → `result.dispatch.id` |
| pane handle | `worker-start` → `result.terminal.handle` (= `result.stages.terminal.handle`) · `terminal create` → `result.terminal.handle` |
| 기동 단계별 상태 | `worker-start` → `result.state`·`result.stage`·`result.launch`·`result.stages.{terminal,dispatch,input}.status`·`result.residualResources`·`result.ignoredOptions` |
| **배달 확인** | `terminal prompt` → `result.stage`(`confirmed`)·`result.wait.satisfied`·`result.record.matchCount`·`result.record.unavailableReason`, 그리고 `_meta.outcome`(`completed`). `worker-start` 는 같은 값을 `result.input.*` 아래에 담는다 |
| 요청 영수증 | `result.requestId`(`r1.<13자리 ms>.<UUID>`)·`result.replayed` |
| 실제 모델·advisor | `worker-start` → `result.input.agent.{requestedModel,requestedEffort,requestedAdvisor,resolvedModel,argv,sessionId,sessionRecord}` · `terminal show` → `result.process.foreground[].argv` · 배너는 `result.input.delivery.screen` 또는 `corral terminal read --screen` |
| 준비 근거 | `terminal wait` / `worker-start` → `…agent.evidence.{agentStatus,launchPending,interactiveReady,stateChangeSeq,samples,detectManifest}` |
| 배치·확인 | `check` → `result.deliveryId`(`delivery_<12 hex>`)·`result.count`·`result.timedOut`·`result.deliveryReplayed`·`result.acknowledged`·`result.peeked` |
| 메시지·질문 id | `check` → `result.messages[].{id,type,subject,body,taskId,dispatchId}` (`msg_<12 hex>`). 질문에 답할 때 그 `id` 를 `corral orchestration reply --id` 에 넣는다 |
| 회수 결과 | `worker-release` → `result.state`(`released`\|`retained`)·`result.reason`(예: `owned_generation_matches`·`borrowed`·`pane_gone`·`identity_unproven`)·`result.processAction`·`result.close.stage` |
| pane 생존 | `worker-show` → `result.observation.{live,observed,reason}`(`pane_live`·`pane_gone`) · `result.messageCounts` |
| 세션 목록 | `terminal list` → `result.terminals[].{paneId,tabId,path,title}` |
| **화면 텍스트 (두 명령의 모양이 다르다)** | `terminal read` → **`result.text`** (형제 필드 `result.{source,truncated,generation,cursor}`) · `worker-read` → **`result.output.text`** (`result` 키는 dispatchId · terminal · source · output). 같은 화면인데 한 단 깊이가 다르다 — `result.screen.text` 는 **어느 쪽에도 없다** |
| 읽기 잘림·이어 읽기 | 두 명령 모두 `…truncated`(bool)·`…cursor`·`…generation`. `--limit` 은 줄이 아니라 **바이트고 상한이 명령마다 다르다** — `terminal read` 1..262144 · **`orchestration worker-read` 1..10000**(계약의 *pass-through* 문구 때문에 262144 로 읽히지만 **실제 상한은 10000**, 넘기면 `invalid_argument: --limit must be 1..10000` · `_meta.outcome: not_started`). `truncated: true` 면 잘린 것이다 |

---

## 이 매핑이 요구하는 명령 — 선언

`capability-check runtime --tool corral` 이 이 블록을 읽어 **런타임 광고와 대조한다.**
블록이 없거나 비어 있으면 대조가 통과가 아니라 **불일치(exit 1)** 다 — "요구가 0개" 는
"다 있다" 가 아니라 **아직 안 적었다** 는 뜻이다. 본문이 쓰는데 여기 없는 명령도 불일치다.

```required-commands
status                              # 『전제 점검』 — 런타임 생존·광고 명령 목록
agent-context                       # 『전제 점검』 — 공개 계약(시그니처·주의사항). --socket 을 받지 않는다
orchestration run-create            # 『제어 문맥 격리』
orchestration run-use               # 『제어 문맥 격리』 — 복원
orchestration run-current           # 『제어 문맥 격리』 — 복원 확인
orchestration task-create           # 『감독 워커 기동』
orchestration worker-start          # 『감독 워커 기동』 + 『본문 주입』(한 호출)
orchestration dispatch-show         # 『감독 워커 기동』 — 타임아웃 뒤 시도 상태
orchestration check                 # 『완료 감지』 — 코디네이터가 배치를 받는다
orchestration inbox                 # 『완료 감지』 — 확인 없이 들여다본다
orchestration send                  # 『완료 감지』 — **워커가** worker_done·heartbeat·escalation 을 보낸다
orchestration request-show          # 『완료 감지』 — 영수증으로 중복 여부를 가른다
orchestration ask                   # 『질의응답』 — 워커가 묻는다 (--run 을 받지 않는다)
orchestration reply                 # 『질의응답』 — 코디네이터가 답한다
orchestration worker-show           # 『회수·정리』·『화면 관측』 — pane 생존·메시지 수
orchestration worker-read           # 『회수·정리』 — 원자료 회수
orchestration worker-retain         # 『회수·정리』 — 보존 의사 (한 번만 먹는다)
orchestration worker-release        # 『회수·정리』 — 정리
orchestration worker-stop           # 『회수·정리』 — 수렴하지 않는 시도 끝내기
orchestration worker-abandon        # 『회수·정리』 — 아무 조치 없이 포기
terminal create                     # 『세션 기동』
terminal wait                       # 『준비 대기』
terminal prompt                     # 『본문 주입』 — 배달 증명
terminal read                       # 『화면 관측』
terminal show                       # 『세션 기동』 관측 — 실제 argv
terminal list                       # 『회수·정리』 — 세션 목록
terminal send                       # 『본문 주입』 우회 경로 (증명 없음 — 쓰지 않는다고 적기 위해 선언)
terminal close                      # 『회수·정리』 — 빌린 pane 을 따로 닫는다
terminal switch                     # 『세션 기동』 — 포커스 전환
worktree set                        # 『감독 워커 기동』 — git 으로 만든 구현·리뷰 worktree 의 상위를 지정(표시용)
```

```mentioned-commands
orchestration task-list        # 「Run 명시 규칙」 목록에만 나온다 — 이 매핑은 호출하지 않는다
open                           # H7 설명(foundation 명령 예시)에만 나온다 — 앱 기동은 사용자 몫, 이 매핑은 호출하지 않는다
orchestration task-update      # 같은 위
orchestration dispatch         # 같은 위 (문맥 전용 Dispatch — 이 매핑의 순환에 쓰지 않는다)
orchestration worker-list      # 같은 위
orchestration run-list         # 같은 위
orchestration run-show         # 같은 위
worktree create                # 광고에는 있다. 이 매핑은 실행하지 않는다 — 구현 worktree 는 git 으로 만든다(『감독 워커 기동』)
worktree rm                    # 같은 위
worktree list                  # 같은 위
worktree current               # 같은 위
worktree show                  # 같은 위
worktree ps                    # 같은 위
```

`mentioned-commands` 는 **이름만 나오고 호출하지 않는 명령**의 칸이다. 사유 주석이 없으면 『전제 점검』이 멈춘다 —
"없는 명령·폐기된 별칭·쓰지 말라" 를 적을 자리를 주되, 아무 이름이나 조용히 통과하지는 못하게 한다.

**『세션 기록 오라클』은 corral 명령을 쓰지 않는다** — 그래서 이 목록에 없다. 대신 `jq` 로 기록을 직접 읽는다.

## 『전제 점검』

### 명령
```bash
corral status --json                      # runtime.state·reachable·capabilities(명령 이름 목록)
node .agents/harness/capability-check.mjs runtime --tool corral   # 매핑 요구 능력 ↔ 광고 대조
corral agent-context --json               # 명령별 시그니처·주의사항 (--socket 거절)
```

### 보장 수준
**증명(이 프로필·이 셸의 광고에 한정).** 아래 「이 점검이 보지 않는 것」 두 줄이 자격의 이유다 — 자식 pane 의
PATH 와 다른 프로필(`--socket`·`--instance`)은 이 점검 밖이다. `status` 의 `runtime.capabilities` 는 **명령 이름 집합**이다(`terminal prompt`,
`orchestration worker-start` …). 대조 스크립트가 이 매핑이 요구하는 명령 이름을 그 집합과 차집합으로 비교하고
빠진 것이 있으면 0 이 아닌 종료로 멈춘다. `status` 가 exit 1 이면 런타임이 꺼진 것이다.

### 상황 → 행동
- **차단 화면**: 해당 없음 — 점검 명령은 pane 을 열지 않는다.
- **타임아웃·빈 결과**: `status` 가 응답하지 않거나 `reachable: false` 면 런타임이 없다. 다른 도구로 몰래
  대체하지 않고 원인을 보고한다. `capabilities` 가 비어 오는 것은 **광고 부재**이지 통과가 아니다.
- **부분 실패**: 광고에는 있는데 실제 호출이 거절되면 광고가 아니라 **실제 응답을 믿는다** — 거절 원문을 원자료로
  남기고 이 매핑을 고친다.
- **복구**: 런타임이 꺼져 있으면 사용자가 데스크톱 앱을 띄운다. 런타임·backend 는
  `CLAUDE_CODE_*`·`CLAUDECODE`·`CLAUDE_PID`·`CLAUDE_EFFORT`·`ORCA_AGENT_HOOK_*` 를 **제거한 env** 로 띄운다.
  pane 이 backend 에서 env 를 상속하므로 마커가 남으면 provider 가 세션
  기록을 쓰지 않아 『본문 주입』의 배달 판정이 조용히 무력화된다 — `record.unavailableReason` 이 null 이 아니면
  마커 상속부터 의심한다.
- **이 점검이 보지 않는 것 — 자식 pane 의 PATH.** `capability-check` 와 `status` 는 **내 셸**에서 corral 이
  보이는지만 본다. 워커가 완료 보고를 치려면 **그 pane 의 셸에서도** corral 이 보여야 하는데(H7),
  그것을 미리 재는 수단은 없다 — **공백이다.** 워커가 조용히 보고를 못 하면 이 자리를 의심한다
  (워커 preamble 이 소켓 경로까지 박아 주므로 보통은 찾는다).
- **이 점검이 보지 않는 것 — 다른 프로필·인스턴스.** `capability-check runtime` 은 `--socket`·`--instance` 를
  **그대로 넘겨 주지만**(그 인자를 주지 않으면) **기본 프로필**을 본다. 다른 프로필로 일하면서 이 점검을
  기본으로 돌리면 **쓰지 않는 런타임을 점검하고 통과를 준다** — 그 경우 점검 명령에도 같은 `--socket`·`--instance`
  를 붙인다. 붙이지 않았다면 그 판정 칸은 **다른 런타임의 것**이다.
- **이 점검이 보지 않는 것 — "없다" 고 적은 문장.** 대조는 *요구 ⊆ 광고* 한 방향이다. 매핑이 **광고에 있는
  명령을 없다고 적어도** 어느 방향에도 걸리지 않는다 — `mentioned-commands` 는 사유만 요구하고 사유의 사실
  여부는 보지 않는다. **역방향 대조는 공백이다** — 매핑에 "없다·못 한다" 를 적을 때는 광고 목록을 그 자리에서 눈으로 대조한다.
- **하지 말 우회**: 시작 세션에서 됐다는 이유로 이 점검을 생략하지 않는다. 대조 불일치를 "아마 될 것" 으로
  넘기지 않는다.

## 『세션 기동』

### 명령
```bash
corral terminal create --worktree path:<절대경로> --title "<제목>" \
  --agent claude|codex|grok [--model <id>] [--effort <등급>] [--advisor fable] [--focus] --json
corral terminal show --terminal <handle> --json     # provider 프로세스·argv
corral terminal read --terminal <handle> --screen --json   # 배너
```

### 보장 수준
**세션 기록 경로**: 응답의 `result.agent.sessionRecord.path` — claude 는 세션 id 를 민팅하므로 기동 응답에 있다(파일은 아직 없어 `exists: false`).
codex 는 기동 응답에서 `sessionRecord`·`sessionId` 가 null 이고, 경로는 첫 `terminal prompt` 응답에서야 나오며 소유 판정이 `ambiguous` 일 수 있다.

**관측.** 기동 자체는 계약이지만 **모델·advisor 가 실제로 무엇으로 해소됐는지는 관측이다.** dispatch 스냅샷은
기동 시점 관측이라 갱신되지 않고 `resolvedModel: null` 일 수 있다. argv(`terminal show`)와 배너(`terminal read`)로
기록하고 **요청값과 관측값을 구분해 적는다.** 별칭(`opus`·`fable`)은 버전 고정이 아니다.

### 상황 → 행동
- **차단 화면**: `--prompt` 를 함께 준 경우, 차단이 먼저 뜨면 create 는 거기서 끝나고(complete) 본문을 들고
  있지 않는다 — 별도 `terminal prompt` 로 자기 `--request-id` 아래 다시 넣는다.
- **타임아웃·빈 결과**: `terminal create` 응답 타임아웃은 실패가 아니라 **지연일 수 있다.** 같은 worktree 의
  `corral terminal list` 로 그 도구 터미널을 먼저 찾고, 살아 있으면 그 handle 을 기록해 재사용한다. 확인 없이 재시도해
  중복 세션을 만들지 않는다.
- **부분 실패**: 단계별 상태(`stages` = worktree·terminal·agent·prompt)가 정본이다. 만들어진 git worktree 는
  뒤 단계 실패로 지워지지 않고, 관측되지 않은 단계는 `unknown` 으로 남고 재시도되지 않는다.
- **복구**: `--focus` 때문에 문제가 나면 `--focus` 를 빼고 만든 뒤 `corral terminal switch` 를 쓴다. 헤드리스에서는
  `switch`·`corral terminal create --focus` 가 미지원이다.
- **하지 말 우회**: `--command` 로 provider argv 를 문자열로 조립하지 않는다 — `--command` 와 `--agent` 는
  상호배타이고 위반은 효과 없는 `invalid_request` 다. `--model`·`--effort`·`--advisor`·`--prompt` 는 `--agent`
  필수, `--advisor` 는 `--agent claude` 에만 붙는다. 모델 접근·사용량으로 못 띄우면 **다른 모델로 조용히
  대체하지 않고** 차단을 보고한다.

## 『준비 대기』

### 명령
```bash
corral terminal wait --terminal <handle> --for agent-ready --timeout-ms 60000 --json
# --for 는 ready|output|exit|agent-ready|agent-idle
```

### 보장 수준
**증명(단 label 된 차단에 한정) — label 되지 않은 모달은 공백이고 『화면 관측』이 메운다.**
자격을 붙이는 이유는 이 절 아래 「상황 → 행동」의 반례다: 차단 판정의 유일한 근거가 detect manifest 의
label 이므로, **label 되지 않은 모달은 "준비" 와 같은 값으로 돌아온다**(예: codex 의 업데이트 메뉴).
그래서 이 칸은 무자격 증명이 아니다 — 판정표에 옮길 때도 자격을 함께 옮긴다.
label 된 차단에 대해서는 준비·차단·타임아웃이 서로 다른 값으로 돌아온다. agent-ready 는 750ms 간격 두 관측이 모두
idle/done·interactive_ready·launch 대기 아님이고 같은 `state_change_seq` 를 공유하며, **가드가 그 provider 의
기대 detect manifest 를 보고한 경우**에만 만족이다. 차단 화면과 미검증 manifest 는 **기다리지 않고 즉시**
`satisfied: false` 로 돌아오고 이유가 `agent.evidence` 에 담긴다.

### 상황 → 행동
- **차단 화면**: trust·로그인·업데이트 화면은 corral 이 대답하지 않는다 — **사람이 치운다.** 단
  **차단 판정의 유일한 근거는 detect manifest 의 label 이다.** label 되지 않은 모달은 agent-ready 를
  그냥 통과한다(예: codex 업데이트 메뉴). 그래서 **codex pane 은 첫 주입 전에 `terminal read` 로
  화면을 한 번 본다.**
- **타임아웃·빈 결과**: 타임아웃은 준비 완료가 **아니다.** 차단이었는지 그냥 느렸는지는 `agent.evidence`
  (`samples`·`detectManifest`)로 가른다. 만족하지 못한 대기를 준비로 읽고 주입하지 않는다.
- **부분 실패**: 이전에 ready 가 저장돼 있어도 지금 관문이 성립하지 않으면 `launching` 으로 보고된다 —
  저장된 ready 를 근거로 쓰지 않는다.
- **복구**: 화면을 읽어 차단이면 사람이 GUI 에서 치우거나 `corral terminal send` 로 정리한 뒤 다시 대기한다.
- **하지 말 우회**: `--for exit`·`--for output` 을 준비의 대용으로 쓰지 않는다. `agent-idle` 은 같은 술어를
  **다른 시점에** 묻는 것이라 기동 직후 준비 판정에 쓰지 않는다.

## 『본문 주입』

### 명령
```bash
corral terminal prompt --terminal <handle> (--text "<본문>" | --file <경로> | --stdin) \
  --wait accepted --json
```

### 보장 수준
**증명(이 pane 이 소유한 세션 기록이 있을 때) — 없거나 둘 이상이면 그 판정은 `unknown` 이고 그때는 공백이다.**
`--wait accepted` 가 만족된 `outcome: completed` + `record.matchCount: 1` 이 "정확히 한 번 도착" 이다.
배달과 대기는 **따로 보고된다**: `record.matchCount`/`unavailableReason` 이 배달을, `wait.requested/satisfied/reason`
이 대기를 답한다. `--wait` 없는 주입은 **큐에 들어간 것이지 완료가 아니다.** 응답의 `requestId` 형식은
`r1.<13자리 ms>.<UUID>` 이고, corral 은 **이 pane 이 소유했음을 증명할 수 있는 세션 기록만** 읽는다
(claude·grok 은 민팅한 세션 id, codex 는 cwd·시각이 맞는 rollout 하나). 그런 기록이 없거나 둘 이상이면
matchCount·resolvedModel·record.path 가 모두 unknown 이다 — **다른 세션 파일에서 읽어오지 않는다.**

### 상황 → 행동
- **차단 화면**: 주입은 fail-closed 이고 효과가 없다 — `agent_blocked`(차단 화면),
  `detect_manifest_unverified`(가드 manifest 불일치), `agent_not_ready`(준비 관문 또는 제출 직전
  `state_change_seq` 검사 실패), `prompt_already_delivered`(이미 기록에 그 본문이 있음).
- **타임아웃·빈 결과**: 마감·차단·종료로 대기가 끝나면 `wait.reason` 이 `deadline|agent_blocked|agent_exited` 다.
  `outcome` 은 만족한 대기에서만 `completed` 이고, 그 밖은 `outcome: unknown` 이며 **자동 재제출되지 않는다** —
  이때도 확인된 배달은 함께 보고된다. 그 보고를 먼저 읽고, `matchCount: 1` 이면 다시 넣지 않는다.
- **부분 실패**: `matchCount` 가 2 이상이면 **한 입력 규칙이 이미 깨진 것**이다. 통과로 승격하지 않고 사람에게
  보고한다. `unavailableReason` 이 null 이 아닌 `matchCount: 1` 은 **어느 쪽으로도 증거가 아니다**(커서가 무효화된
  1건과, 기록을 아직 쓰지 않은 provider 의 0건이 같은 모양으로 온다).
- **복구**: 큐 수락(`queued`)·`outcome_unknown` 에서 **중복 주입하지 않는다.** 같은 `--request-id` 로 재전송해
  영수증을 replay 하거나, `corral orchestration request-show --id <request_id>` 로 무엇이 일어났는지 먼저 본다.
- **하지 말 우회**: `terminal send` 는 raw 입력이라 배달 판정이 없다 — managed 에이전트에 지시를 넣는 정본은
  `terminal prompt` 다. **`--text`·`--file`·`--stdin` 의 상한은 모두 65536 UTF-8 바이트로 같다 — `--file` 로
  상한을 넘기지 못한다**(H1'). 넘으면 상세를 파일로 저장하고 짧은 지시에 그 경로를 적는다. NUL 은 거절된다.

## 『감독 워커 기동』

### 명령
```bash
corral orchestration task-create --spec "<일감 명세>" [--title "<제목>"] --run <run_id> --json
corral orchestration worker-start --task <task_id> \
  --agent claude|codex|grok --model <id> --effort <등급> [--advisor fable] \
  --worktree path:<구현 worktree 절대경로> [--spec-file <경로>] --run <run_id> --timeout-ms 120000 --json
corral orchestration worker-start --task <task_id> --terminal <handle> --run <run_id> --json   # pane 재사용
```

corral 에는 repo setup/archive hook 이 아직 없다 — **기다릴 setup 단계가 없다는 뜻**이고,
worktree 준비 확인은 git worktree 생성 결과로 한다. `--worktree` 에 주는 경로는 git worktree 경로 그대로다.

**전용 worktree 가 필요 없는 과제도 있다.** 스모크·검증 순환처럼 저장소를 고치지 않는 짧은 일감은
**지금 서 있는 worktree 절대경로를 그대로 `--worktree path:` 에 준다** — 새로 만들지 않는다. 기동은 그것으로
성립한다.
**구현 작업은 다르다** — 브랜치가 갈려야 하므로 아래대로 전용 worktree 를 만든다.

**그 worktree 를 만드는 방법 — 두 길이 있고, 이 매핑이 쓰는 길은 git 이다.**
corral 광고에는 worktree 계열 명령이 **있다**: `worktree create` · `worktree rm` · `worktree set` ·
`worktree list` · `worktree current` · `worktree show` · `worktree ps` (『전제 점검』 응답의 능력 목록에서 확인된다).
다만 이 매핑은 생성 계열(`worktree create`·`worktree rm`)을 쓰지 않는다 — **이 절의 worktree 생성 보장 수준은 공백이다.**
그래서 구현 worktree 는 절차 문서(`.agents/skills/task-coordinate/references/implementation.md` §2)의
git 명령으로 만든다. `worktree create` 로 만드는 길은 원자료가 없으니 여기서 짐작하지 않는다.

**git 으로 만든 worktree 의 상위 표시.** git 으로 만든 worktree 는 레지스트리에 부모가 없어 사이드바에서
다른 worktree 아래로 중첩되지 않는다. 중첩해 보이게 하고 싶을 때만, worktree 를 만든 직후 코디네이터가 한 번 친다:

```bash
corral worktree set --worktree path:<구현 worktree 절대경로> --parent-worktree path:<작업 worktree 절대경로> --json
```

- **bundle 을 쓸 때**: 묶음 자식의 작업 worktree 를 feature worktree 아래로 보이게 하려면 같은 명령을
  `--worktree path:<자식 작업 worktree>` `--parent-worktree path:<feature worktree>` 로 친다. 독립 작업은 상위를 지정하지 않는다(루트).
- **리뷰 worktree 를 만드는 경우도 같은 규칙이다** — `--worktree path:<리뷰 worktree>` 로 바꿔 한 번 더 친다.
- **실패는 경고만 남기고 워커 기동을 막지 않는다.** 부모는 사이드바 표시용 메타일 뿐 제어 순환(Task·Dispatch·완료 감지)은 이 값을
  읽지 않는다. 거절 원문(예: 순환 거절 `Lineage cycle is not allowed`)을 원자료에 남기고 진행한다.
- 보장 수준: 표시용 메타라 증명 대상이 아니다 — 응답을 원자료에 남기고 진행한다.

**`--spec-file` 을 생략하면 그 Task 의 `--spec` 본문이 배달된다** — 일감 명세를 `corral orchestration task-create --spec` 에만
담아도 pane 에 들어간다. 두 곳에 나눠 담지 않는다. (『세션 기록 오라클』로 배달 본문을 읽어 확인할 수 있다.)

**preamble 이 워커에게 무엇을 주는가** (코디네이터가 일감 명세에 안 적어도 되는 것): 워커 쪽 `ask` 와
`corral orchestration send --type worker_done|heartbeat|escalation` 의 명령줄이 **`--task-id`·`--dispatch-id` 가 치환된 채로**,
소켓 경로까지 붙어 preamble 에 들어간다. 그래서 **코디네이터는 일감 명세에 보고 명령을 적지 않는다** —
적으면 중복이고, id 를 손으로 옮기다 틀린다.

### 보장 수준
**증명(단 준비 관문의 자격이 그대로 따라온다 — label 되지 않은 차단 화면은 여기서도 공백이다).**
`worker-start` 는 pane 생성 → Dispatch 기록 → 준비 대기 → preamble+본문 주입을 **한 호출로 묶고
제출을 판정한다**: `state: ready` 는 주입이 `outcome: completed` + 만족한 대기였을 때, 또는 그 본문이 provider
기록에 정확히 1건 있을 때만이다. 그 밖은 전부 `state: incomplete`·`stage: dispatch_input_unconfirmed` 이고
`promptRequestId` 가 null 로 남아 **재개 가능**하다. **pane 에 도달하지 못한 Dispatch 가 ready 로 보고되는
경로는 없다.** preamble 은 Dispatch 당 정확히 한 번 도달한다.

### 상황 → 행동
- **차단 화면**: 차단이면 `worker-start` 가 `agent_blocked` 로 거절한다. **`--agent codex` 는 준비→주입이 한
  호출 안에서 원자적이라 중간 화면을 볼 자리가 없다** —
  기동 전에 사용자 셸에서 codex 를 최신으로 올리거나, `corral terminal create --agent codex` → `terminal read` 확인 →
  같은 pane 에 `--terminal <handle>` 로 붙이는 2단을 쓴다. **trust 화면은 사람 몫이다.**
- **셸 rc 의 대화형 질문**: pane 셸이 rc 에서 질문(업데이트 확인 등)을 띄우면 주입한 기동 줄 첫 글자가 그 답으로 먹혀 provider 이름이 깨지고
  `agent_not_ready`·`incomplete` 로 끝난다. 같은 Task 를 `worker-stop` 으로 멈추고 새로 기동한다 — 반복되면 사용자에게 셸 쪽 질문을 먼저 끝내 달라고 한다.
- **타임아웃·빈 결과**: 대기 예산은 `--timeout-ms` 로 주고 상한은 120000 이다. codex 는 같은 과제에서 Claude 보다
  느리고 타임아웃이 잦으니 예산을 넉넉히 잡는다. 타임아웃은 "안 갔다" 가 아니다 — `corral orchestration dispatch-show --task <t>` 로
  시도 상태를 먼저 본다.
- **부분 실패**: 단계별로 보고되고 **실패한 단계가 앞 단계를 되돌리지 않는다** — 남은 것은
  `residualResources` 에 담긴다. `input_line` 항목은 **이전 실행이 pane 입력줄에 타이핑한 한 줄**이고 corral 은
  그것을 지울 수 없다 — 사람이 치운다(기록 기준, 화면 기준이 아니다). `dispatch_input_unprovable` 은 재개로
  수렴하지 않는다 — 사람이 pane 을 읽고 `corral orchestration worker-stop --dispatch <ctx>` 로 끝낸다.
- **복구**: **`--retry-of` 류 플래그는 없다.** 복구는 2단이다 — `terminal read` 로 화면을 보고 차단이면 정리한 뒤
  **같은 Task 에** `corral orchestration worker-start --task <t> --terminal <handle>` 을 다시 부른다. 주입이 확정되지 않은 시도는 같은
  Dispatch 로 재개되고(`launch: resumed`), **이미 주입된 시도가 열려 있으면 `dispatch_active` 로 거절된다.**
  `launch: reused` 는 열린 시도가 없어 시작 가능한 Task 에 기존 pane 을 배정한 **새 시도**다. 재개는 Dispatch
  생성 시 기록된 본문 digest 를 배달하며, 명령줄에 남은 `--spec-file` 은 `ignoredOptions` 에 들어간다.
- **하지 말 우회**: **기본 경로는 이 한 호출이다** — 따로 pane 을 만들고 `--terminal` 로 붙이는 2단 경로를
  평소에 쓰지 않는다(2단은 아래 차단 화면 복구용이다). `--terminal` 과 `--agent … --worktree` 를 **동시에 쓰지 않는다**(재사용 pane 은 기동 때의
  agent 를 그대로 쓰므로 `--model`·`--effort`·`--advisor`·`--worktree` 가 거절된다). `--agent` 에는 `--worktree`
  가 필수다. **리뷰어 3명은 Task 를 각각 따로 발급한다** — 같은 Task 로 띄우면 미확정 시도만 조용히 재개되거나
  `dispatch_active` 로 거절된다. 실행 중 Dispatch 위에 같은 terminal 의 새 Dispatch 를 겹쳐 기동하지 않는다.
  pane 재사용은 **소유권을 옮긴다** — 이전 시도는 `borrowed` 가 되고 `ownershipTransferredTo` 에 새 시도가 적힌다.

### 재사용 인자 규칙 (절차 문서가 가리키는 그 규칙)

| 경로 | 반드시 준다 | 절대 붙이지 않는다 |
| --- | --- | --- |
| 새 기동 | `--agent` + `--worktree path:<절대경로>` + `--model` + `--effort` (+ 필요하면 `--advisor`) | — |
| pane 재사용 | `--terminal <handle>` 만 | `--agent`·`--model`·`--effort`·`--advisor`·**`--worktree`** |

재사용 pane 은 기동 때의 도구를 그대로 쓴다. 위 인자를 붙이면 거절되거나 `ignoredOptions` 에 담겨 조용히
무시된다 — **무시된 것을 반영됐다고 읽지 않는다.** `--worktree` 는 corral 에서 **새 기동 전용**이다
(같은 이름의 플래그를 재사용 때 **요구하는** 도구가 있다 — 매핑을 갈아 쓸 때 여기서 틀린다).

**`--model`·`--effort` 에 넣을 값은 어디서 오나 — 이 매핑에서는 공백이다.**
열거하는 플래그는 열거한다(`--agent claude|codex|grok`, `corral terminal wait --for ready|output|exit|agent-ready|agent-idle`,
`corral orchestration worker-retain --reason user_requested|user_takeover`). 그런데 **`--model`·`--effort`·`--advisor` 의 유효값 집합은
두 오라클(`--help`·`agent-context`) 어디에도 없다** — `--help` 는 `VALUE`/`<level>`/`<id>` 로만 쓰고
`agent-context` 는 "`--agent` 를 요구한다" 는 제약만 적는다. 값 집합의 원본은 corral 이 아니라 **에이전트 CLI 쪽**이고
이 매핑 밖이다. 역할별 기본값은 `.agents/defaults.md`(값)에 있고 규칙은 `.agents/defaults.rules.md` 다.
- **corral 은 값을 검증하지 않는다.** `--effort bogus-effort` 가 거절되지 않고 argv 로 그대로 넘어가
  pane 이 생긴다(`requestedEffort: "bogus-effort"`, `argv: ["claude","--effort","bogus-effort",…]`).
  즉 잘못된 값은 기동 관문이 아니라 **에이전트 쪽에서** 드러나고, 그때는 이미 pane 이 만들어져 있다 —
  치우는 것은 내 몫이다.
- 그래서 **값은 지시받은 것을 그대로 넘기고, 짐작해서 채우지 않는다.** 지시가 없으면 묻는다(『질의응답』).

### Run 명시 규칙 (절차 문서가 가리키는 그 규칙)

`--run` 을 **받는 명령에만** 붙인다. 받지 않는 명령에 붙이면 `invalid_argument` 로 거절된다 —
받는 15개·받지 않는 9개 목록은 『제어 문맥 격리』에 있다. 바인딩은 **프로필 단위**라
`run-create`·`run-use` 는 그 프로필의 기본 Run 을 바꾼다. 바꿨으면 바꾼 쪽이 `run-use` 로 되돌리고
`run-current` 로 확인한다.

## 『완료 감지』

### 명령
```bash
corral orchestration check --block --types worker_done,escalation,question \
  --timeout-ms 600000 --run <run_id> --json
corral orchestration check --ack <delivery_id> --block --types … --run <run_id> --json
corral orchestration worker-show --dispatch <ctx_id> --json    # 유실 의심 시 현재 상태 조회
corral orchestration dispatch-show --task <task_id> --json     # 시도 상태·reconcile 기록

# 워커 쪽(preamble 이 주는 형태) — 이 명령이 없으면 완료 감지 자체가 성립하지 않는다
corral orchestration send --type worker_done --subject "<상태>" --body "<3문장>" \
  --task-id <task_id> --dispatch-id <ctx_id> --outcome succeeded|failed --json
corral orchestration send --type heartbeat --subject alive \
  --task-id <task_id> --dispatch-id <ctx_id> --phase "<단계>" --json
corral orchestration send --type escalation --subject "Blocked: <이유>" --body "<상세>" \
  --task-id <task_id> --dispatch-id <ctx_id> --json
corral orchestration inbox --run <run_id> --json               # 배치를 놓쳤을 때 Run 전체 조회
corral orchestration request-show --id <request_id> --json     # 응답 유실 시 영수증 조회
```

### 보장 수준
**증명(보고가 왔을 때). 보고가 없는 상태는 "완료가 아니다" 가 아니라 "모른다" 다** — 그 칸은 공백으로 적는다.
완료는 그 Task·그 Dispatch 의 `worker_done` 이다. `succeeded`/`failed` 모두 종료 보고이고
(`failed` 를 성공으로 처리하지 않는다), 메시지 저장과 시도 정산이 **한 번의 원자적 쓰기**라 둘이 어긋날 수 없다.
Run 은 미확인 Delivery 를 **하나만** 갖고, `--ack` 전까지 같은 배치를 `deliveryReplayed: true` 로 계속 돌려준다
(배치 최대 50건, 그 사이 도착한 메시지는 섞이지 않는다). 파일 존재·TUI idle·프로세스 종료는 완료가 아니다.

### 상황 → 행동
- **차단 화면**: **provider 차단 화면은 `question` 이 아니다** — `question` 은 워커의 『질의응답』만 만든다.
  차단은 기동이 `agent_blocked` 로 거절하거나 대기가 즉시 `satisfied: false` 로 돌아오는 것으로 나타난다.
- **타임아웃·빈 결과**: `--block` 의 마감은 `count: 0`·`timedOut: true` 로 오는 **정상 답**이다.
  **타임아웃·`count: 0` 은 새 워커를 만드는 근거가 아니다.** 응답 유실이 의심되면
  `request-show`·`worker-show`·`dispatch-show` 로 기존 요청·시도를 확인한다.
- **부분 실패**: 배치의 **모든 메시지를 처리한 뒤** 각 종료 워커의 재사용/보존/회수를 결정하고 나서 `--ack` 로
  이어간다. `--ack` 는 대기 시작 **전에 한 번만** 적용된다. 같은 Run 의 check 를 중복 실행하지 않는다.
  시도가 `unknown` 으로 정산됐다면 이유는 `pane_gone|pty_replaced|epoch_changed` 이고 Task 는 다시 기동
  가능한 상태로 남는다 — `unknown` 은 실패가 아니다.
- **복구**: `--peek` 로 다음 배치를 만들지 않고 들여다볼 수 있다. **중간에 취소된(Ctrl-C·타임아웃으로 죽인)
  `corral orchestration check --block` 은 `--ack` 를 이미 적용했을 수 있다** — 응답은 `request_cancelled`("accepted effects may
  already have occurred")로 오고, 같은 id 로 다시 `--ack` 하면 `delivery_stale` + `deliveryState: acknowledged`
  다. 그때의 복구는 **`--ack` 를 떼고 `check` 를 다시 부르는 것**이다.
  취소를 배달 실패로 읽지 않는다. Run 메시지 상한은 10000건·본문 65536바이트이고
  한계에 닿으면 `message_capacity` 다 — corral 은 자리를 만들려고 메시지를 지우지 않는다.
- **ack 만 하고 싶을 때**: `--ack` 는 **대기 시작 전에 한 번** 적용되므로, 확인만 하려면 **아주 짧은 대기를
  연다** — `corral orchestration check --ack <delivery_id> --block --timeout-ms 3000`. 답은 `acknowledged: <그 delivery>` ·
  `count: 0` · `timedOut: true` 이고 **이것이 정상이다**(빈 배치는 실패가 아니다). ack 없는 조회는 `inbox` 다.
- **하지 말 우회**: 화면에 "다 했다" 가 보인다는 이유로 완료로 적지 않는다. `DONE.md` 같은 파일은 감사 기록이지
  완료 신호가 아니다. 두 번째 `worker_done` 은 `illegal_transition` 이므로 워커에게 다시 보내게 하지 않는다.

## 『질의응답』

### 명령
```bash
# 코디네이터: 질문은 『완료 감지』의 check 배치로 받는다 (--types 에 question 포함)
corral orchestration reply --id <msg_id> --body "<답>" [--run <run_id>] --json
# 워커 쪽(preamble 이 주는 형태): corral orchestration ask --question … --task-id … --dispatch-id … --timeout-ms 600000
```

### 보장 수준
**증명.** 질문은 대기 시작 **전에 durable 하게 저장된다** — 타임아웃·클라이언트 취소·런타임 재시작에도 답할 수
있다. 마감은 오류가 아니라 `state: pending` + `messageId` + `resumeCommand` 이고, 재개는 새 질문을 만들지 않는다.
답은 물어본 워커에게 주소된 별도 메시지이고 **check 배치에 섞이지 않는다.** 이미 답이 있는 질문에 두 번째
`reply` 는 `already_answered` 로 아무것도 저장하지 않는다.

### 상황 → 행동
- **차단 화면**: 해당 없음 — 질의응답은 pane 화면을 거치지 않는다.
- **타임아웃·빈 결과**: `corral orchestration ask --timeout-ms` 상한은 600000 이다. 마감이면 워커는 **다시 묻지 않고**
  응답에 담긴 `resumeCommand`(`--resume <msg_id>`)를 실행한다. 다시 물으면 중복 질문이 생긴다.
- **부분 실패**: `corral orchestration reply --id` 가 가리키는 게 질문이 아니면 `not_a_question`, 없는 id 면 `message_not_found` —
  둘 다 아무것도 저장하지 않는다.
- **복구**: 질문을 놓친 것 같으면 `corral orchestration inbox --run <run_id> --json` 으로 Run 의 모든 메시지를 본다.
- **하지 말 우회**: **⚠ `orchestration ask` 에는 `--run` 이 없다.** 질문은 **프로필에 현재 바인딩된 Run** 으로
  간다. 바인딩을 바꿔 둔 구간에서는 `ask` 를 치지 않는다 — 『제어 문맥 격리』를 먼저 복원하고 묻는다.
  워커에게 로컬 대화형 프롬프트로 묻게 하지 않는다(코디네이터가 볼 수 없어 세션이 멈춘다).

## 『화면 관측』

### 명령
```bash
corral terminal read --terminal <handle> [--screen] [--cursor <n>] [--limit <바이트>] --json
corral orchestration worker-read --dispatch <ctx_id> [--screen] [--limit <바이트>] --json
```

### 보장 수준
**관측.** 화면 읽기는 본질적으로 관측이다(H2). `--screen` 은 렌더된 화면, 기본값은 누적 출력이다 —
줄을 다시 그리는 프로그램(셸·진행 표시·TUI)은 기본 읽기에서 조각으로 쌓여 온다. `worker-read` 는 그 Dispatch 가
묶인 pane 에 대한 `terminal read` 의 pass-through 이고 **corral 은 provider 훅을 설치하지 않고 transcript 를
읽지 않는다.** 읽기는 아무것도 저장하지 않는다.

**꺼내는 자리가 두 명령에서 다르다**: `terminal read` → `result.text`, `worker-read` → `result.output.text`.
`result.screen.text` 는 어느 쪽에도 없다 — 짐작해서 뒤지지 말고 「응답에서 어디를 읽나」 표를 본다.

### 상황 → 행동
- **차단 화면**: 이것이 차단 화면을 **볼 수 있는 유일한 능력**이다. detect manifest 가 label 하지 않은 모달은
  구조화된 조회로는 보이지 않으므로, codex pane 은 첫 주입 전에 여기서 한 번 본다.
- **타임아웃·빈 결과**: **`--limit` 은 줄 수가 아니라 바이트고, 상한이 명령마다 다르다.**
  `terminal read` 는 1..262144(화면도 262144), **`orchestration worker-read` 는 1..10000** 이다.
  계약은 `worker-read` 를 *a pass-through of terminal read* 라고만 적어 262144 로 읽히는데 **실제 상한은 10000 이다** —
  넘기면 `invalid_argument: --limit must be 1..10000` 이고 `_meta.outcome: not_started` 다(부작용 없음).
  목록(`corral terminal list --limit`)도 1..10000.
  **계약과 실제가 갈리면 실제를 믿는다**(『전제 점검』 부분 실패 규칙).
  빈 출력은 "아무 일도 없었다" 가 아니라 "이 창에서 볼 게 없었다" 다. 보존은 PTY 당 마지막 1048576 바이트다.
- **부분 실패**: `--cursor` 는 바이트 오프셋 + UTF-8 디코더 carry 다. 잘린 문자는 다음 읽기에서 이어진다.
- **복구**: 사람 개입이 의심되면 화면을 읽어 원자료로 남기고, 사람이 잡은 pane 이면
  `corral orchestration worker-retain --dispatch <ctx> --reason user_takeover` 로 **선언**한다(감지가 아니다).
- **하지 말 우회**: 화면에서 읽은 문장을 『완료 감지』·『본문 주입』의 증명 대용으로 쓰지 않는다.
  화면으로 "보냈다/끝났다" 를 판정하지 않는다.

## 『회수·정리』

### 명령
```bash
corral orchestration worker-retain  --dispatch <ctx_id> [--reason user_requested|user_takeover] --run <run_id> --json
corral orchestration worker-release --dispatch <ctx_id> --run <run_id> --json
corral orchestration worker-stop    --dispatch <ctx_id> --run <run_id> --json   # 열린 시도 취소 (--reason 없음)
corral orchestration worker-abandon --dispatch <ctx_id> --run <run_id> --json   # 손대지 않고 정산
corral terminal close --terminal <handle> --json                                # 빌린 pane (H5)
```

### 보장 수준
**증명(닫기 판정에 한정) — 프로세스가 실제로 죽었는지는 관측이다(H5).**
`released` 는 **이 시도가 pane 을 소유하고, 닫기 직전 관측한 pane 이 같은 세대일 때만** 나온다.
그 밖은 전부 `retained` + 이유(`borrowed`·`user_requested`·`user_takeover`·`pane_gone`·`identity_unproven`·
`observation_failed`)이고 프로세스에 손대지 않는다. 소유 판정과 닫기가 같은 lane 안에서 일어나므로
**판정한 pane 이 닫히는 pane 이다.** `worker-retain` 은 **보존 의사 기록일 뿐** 프로세스에 손대지 않고 새 Task
배정도 아니다. **그리고 보존은 다음 회수 한 번만 존중되고 지워진다** — 계약 원문: "The next worker-release
honours the retain once, reports retained with this reason, and clears it; a further worker-release then judges
the pane on its own merits." 즉 **`worker-release` 를 두 번 부르면 두 번째는 pane 을 닫는다.** `worker-abandon` 은 pane 을 보지도 닫지도 않는다.

### 상황 → 행동
- **차단 화면**: 해당 없음 — 정리 명령은 화면을 대답하지 않는다.
- **타임아웃·빈 결과**: `worker-release` 를 열린 시도에 부르면 `dispatch_active` 이고 효과가 없다 — 취소는
  `worker-stop` 이다. 이미 회수된 시도에 다시 부르면 기록에서 답하고 아무것도 쓰지 않는다.
- **부분 실패**: **H5 — 사람이 만든 pane 은 `borrowed` 라 corral 이 닫지 않는다.** 원자료를 회수한 뒤
  `terminal show`·`worker-show` 로 handle·worktree·agent 정체, 활성 Dispatch 없음, 사용자 takeover 없음,
  이번 작업 전용임을 확인한 **경우에만** `terminal close` 로 정리한다. 불확실하면 보존하고 차단 사유를 보고한다.
  재사용된 옛 Dispatch 의 회수로 현재 워커가 정리됐다고 가정하지 않는다 — 최종 Dispatch 와 실제 소유권을 본다.
  작업 정리(`task-finish.sh`)는 마지막에 세션 정리 훅 `.agents/harness/session-cleanup.sh` 를 부른다. 이 훅은 이 작업의
  worktree 아래에 남은 pane 을 **후보로 출력할 뿐 닫지 않는다** — pane 의 소유 증명(Dispatch 단위)은 훅이 가질 수 없고,
  위 확인을 거치는 것은 코디네이터 몫이기 때문이다.
- **복구**: **`release.state: unknown` 은 `corral orchestration worker-show --dispatch <ctx>` 가 복구다.** 두 번째 close 로 우회하지
  않는다 — corral 스스로 그 우회를 권하지 않는다. `worker-stop` 의 닫기가 확인되지 않아도 시도는 정산된다
  (`release.state: unknown` + `worker-show` 복구).
- **하지 말 우회**: 회수가 실제 프로세스를 닫았다고 **가정하지 않는다.** 능력 수명 ≠ 프로세스 수명 —
  정산·중단·포기·회수는 모두 `capabilityRevokedAt` 을 기록하고, pane 이 살아 있어도 그 시도의 보고는 거절된다.
  사용자 확인용 worktree 는 task-coordinate 가 정한 시점까지 유지한다 — **터미널 유지와 worktree 유지의 수명은 다르다.**

## 『세션 기록 오라클』

### 명령
```bash
# 1) 이 pane 이 소유한 기록의 경로를 응답에서 꺼낸다 (짐작하지 않는다)
#    worker-start → result.input.agent.sessionRecord.path · terminal prompt → result.record.path
# 2) 그 경로를 인자로 주고 읽는다 — jq 블록은 capabilities.md H6 참조
```

경로는 위 응답 필드에서만 꺼낸다. 읽는 방법(무엇이 들어갔고 무엇이 응답됐나, 줄 종류 세기)과 provider 별 기록 위치·홈 변수는
capabilities.md H6 에 있다. Codex·Grok 기록은 필드 이름이 다르므로 **먼저 한 줄을 열어 키를 확인한 뒤** 같은 요령으로 읽는다.

### 보장 수준
**관측.** corral 은 provider 훅을 설치하지 않는다. `terminal prompt` 의 `record.matchCount` 는 corral 이
**이 pane 이 소유했음을 증명할 수 있는 기록**만 읽어 만든 값이라 증명이지만, 사람이 직접 파일을 읽는 이 경로는
관측이다 — 어느 기록에도 **사람이 친 입력과 주입된 입력을 가르는 필드가 없다**(H1·H2).

### 상황 → 행동
- **차단 화면**: 해당 없음 — 기록 파일을 읽는 것뿐이라 화면을 거치지 않는다.
- **타임아웃·빈 결과**: 기록 파일이 없는 것은 배달 실패의 증거가 **아니다** — provider 가 아직 쓰지 않았거나
  기록을 끄고 있을 수 있다(H1).
- **부분 실패**: 같은 cwd 에 세션이 여럿이면 어느 것이 이 pane 인지 corral 도 unknown 으로 답한다 —
  사람이 짚을 때도 같은 모호함을 안고 짚는 것이다. 짚은 근거를 함께 적는다.
- **복구**: pane 소유 기록이 필요하면 『본문 주입』 응답의 `agent.sessionRecord.path` 를 쓴다.
- **하지 말 우회**: 세션 기록을 『완료 감지』 대용으로 쓰지 않는다. 판정표의 완료 칸에 기록 파일을 근거로 적지 않는다.

## 『제어 문맥 격리』

### 명령
```bash
corral orchestration run-current --json                      # 지금 바인딩된 Run
corral orchestration run-create --objective "<목적>" --json   # ⚠ 만든 Run 으로 현재 바인딩을 재설정한다
corral orchestration run-use --id <run_id> --json            # 바인딩 복원
# 그리고 --run 을 받는 orchestration 명령 전부에 --run <run_id> 를 명시한다 (아래 목록 참고)
```

### `--run` 을 받는 명령 / 받지 않는 명령

**받는다 (15개)** — 여기에는 반드시 명시한다:
`corral orchestration task-create` · `corral orchestration task-list` · `corral orchestration task-update` ·
`corral orchestration dispatch` · `corral orchestration worker-start` · `corral orchestration worker-list` ·
`corral orchestration worker-read` · `corral orchestration send` · `corral orchestration reply` ·
`corral orchestration check` · `corral orchestration inbox` · `corral orchestration worker-retain` ·
`corral orchestration worker-release` · `corral orchestration worker-stop` · `corral orchestration worker-abandon`

**받지 않는다 (9개)** — 붙이면 `invalid_argument: Invalid flag for orchestration <명령>: --run` 으로 **튕긴다**:
`corral orchestration run-create` · `corral orchestration run-use` · `corral orchestration run-current` ·
`corral orchestration run-list` · `corral orchestration run-show` · `corral orchestration dispatch-show` ·
`corral orchestration worker-show` · `corral orchestration ask` · `corral orchestration request-show`

(이 목록은 **완전 표기로 적는다** — 이 매핑의 표기 규약이자, 이름이 바뀌면 『전제 점검』이 이 줄에서 멈추게 하는 장치다.)

**이 9개는 전부 현재 바인딩(또는 `--id`/`--task`/`--dispatch` 로 지목한 대상)을 따라간다.**
그중 **복구 국면에서 쓰는 조회 명령(`dispatch-show`·`worker-show`·`request-show`)** 에 `--run` 을 붙이면
복구 중에 거절당한다 — "런타임이 이상하다" 로 오진하기 쉬운 지점이다. `ask` 는 특히 위험하다(아래 하지 말 우회).


### 보장 수준
**증명(단 구멍 하나).** **현재 Run 은 프로필 단위로 바인딩된다 — 부르는 터미널 단위가 아니다.**
`--run <id>` 는 그 한 번의 호출에만 적용되고 바인딩을 바꾸지 않는다. Run 이 없으면 `run_required` 로
효과 이전에 실패한다. **구멍: `corral orchestration ask` 에는 `--run` 이 없다**(`corral orchestration send`·`corral orchestration check`·`corral orchestration reply`·`task-*`·
`worker-*` 에는 있다) — 질문은 현재 바인딩을 따라간다.

### 상황 → 행동
- **차단 화면**: 해당 없음 — Run 바인딩 조회·전환은 화면과 무관하다.
- **타임아웃·빈 결과**: `run-use` 의 모르는 `--id` 는 `run_not_found` 이고 **이전 바인딩을 건드리지 않는다.**
- **부분 실패**: 두 코디네이터(또는 순환 검증 중인 워커)가 한 프로필에서 `run-create` 하면 상대의
  `corral orchestration check`·`corral orchestration send` 가 엉뚱한 Run 으로 간다. **규율: `--run` 을 받는 15개 명령에는 빠짐없이 `--run` 을 명시하고,
  받지 않는 9개를 쓸 때는 지금 바인딩이 무엇인지 먼저 확인한다**(`run-current`).
- **복구**: 바인딩을 바꿨다면 **바꾼 쪽이 복원한다** — `corral orchestration run-use --id <원래 Run>` 뒤 `run-current` 로 확인하고
  그 출력을 원자료로 남긴다. 워커 preamble 의 보고 명령에는 `--run` 이 없어 바인딩에 의존하므로, 바인딩을
  바꾼 구간이 자식 워커의 보고·회수를 덮으면 그 구간이 끝날 때까지 되돌리지 않는다.
- **하지 말 우회**: 남의 Run 에 `run-use` 하거나 남의 Run 의 메시지를 `--ack` 하지 않는다. 잔존 Run 을
  "아무도 안 쓰는 것 같으니" 재사용하지 않는다 — 새로 만들고 끝나면 복원한다.
  **절차 문서의 "기존 Run 을 우선 쓴다" 와 충돌하지 않는다 — 가르는 것은 소유다**: 그 Run 이 **내 작업의 것**
  (내가·내 코디네이터 세션이 이 일감으로 만든 것, `run-show` 의 `objective` 로 확인)이면 재사용한다.
  **남의 것이거나 누구 것인지 모르면 새로 만들고 끝나면 복원한다.** 모르는 채 재사용하면 남의 배치를
  `--ack` 하게 되고 그건 되돌릴 수 없다.
