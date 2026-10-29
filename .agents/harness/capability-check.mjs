#!/usr/bin/env node
// paddock:fixed
// 하네스 능력 대조 — 절차/매핑/런타임이 서로 어긋나면 멈춘다.
// 매핑은 이 폴더(.agents/harness/)에 깔린 `<도구>.md`(capabilities.md 제외) 전부다. 하나만 깔리는 것이 보통이다.
//
//   node .agents/harness/capability-check.mjs names
//     절차 문서가 쓰는 능력 이름 ⊆ capabilities.md 정본 ⊆ 깔린 매핑의 절. 매달린 능력 0.
//     절차 문서는 FLOW_DOCS 중 **있는 것만** 본다. 하나도 없으면(작업 흐름 층이 꺼진 레포) 건너뛰고 exit 0.
//   node .agents/harness/capability-check.mjs shape
//     매핑의 능력별 절이 명령 · 보장 수준 · 상황→행동(5항목)을 모두 갖는지.
//     **한계**: 라벨 존재 · "라벨만 있고 비었나" · 사유 없는 `해당 없음.` 까지만 본다. 적힌 내용이 그 상황에 맞는 행동인지,
//     보장 수준 칸의 어휘가 실제 보장과 맞는지는 **기계가 보지 않는다 — 리뷰어가 본다.**
//   node .agents/harness/capability-check.mjs runtime --tool corral|bare
//     매핑이 **선언한** 명령 ↔ 런타임이 광고하는 것 ↔ 매핑 본문이 실제로 쓰는 명령.
//
// ── 표기 허용 목록 (이 관문의 핵심) ───────────────────────────────────────────
// **아는 표기만 허용한다. 목록에 없는 형태는 전부 오류다.** 매핑이 어떤 표기를 꼭 써야 하면
// 아래 목록(ALLOWED)에 추가한다 — 추가하면 그 형태도 검사를 받는다. 목록 밖을 조용히 지나가게 두지 않는다.
//
//   A1. `<도구> [전역옵션…] <그룹> <명령> [플래그…]`      예: corral orchestration send --type …
//   A2. `<도구> [전역옵션…] <명령> [플래그…]`             예: corral status --json
//   A3. `node <경로>/corral.mjs …`                       → **도구 접두사로 정규화해 A1·A2 로 검사한다**
//       (매핑 스스로 권하는 대체 호출형이다. 정규화하지 않으면 이 표기로 쓴 오기가 조용히 지나간다)
//   A4. `tmux [전역옵션…] <명령> [플래그…]`               bare 의 도구 표기. `-L`·`-S`·`-f` 는 전역옵션이다
//   A5. `async_<이름>(…)`                                 iTerm2 Python API
//   A6. **플래그 없는 이름 언급** — 접두사를 생략할 수 있으나 레지스트리에서 **유일 해소**돼야 한다
//       (`check` 는 되고 `send` 는 terminal/orchestration 로 갈려 오류다)
//   A7. 허용된 **외부 명령** 목록(EXTERNAL)으로 시작하는 줄 — 이 관문의 대상이 아니다
//   A8. `<오류코드>: <메시지>` 형태의 오류 메시지 인용 — 명령 표기가 아니다
//
// 전역옵션은 도구별로 목록(GLOBAL_OPTS)에 있다. **목록에 없는 옵션이 명령 앞에 오면 오류다** —
// 도구 뒤에 옵션이 오면 스팬 전체를 버리는 판은 `corral --socket … worker-stop --reason` 같은 오기를 통과시킨다.
//
// 그 위에 선언 대조 규칙:
//   R1  명령줄(플래그가 있는 스팬)은 A1~A4 중 하나여야 한다. 접두사 없는 명령줄은 오류다.
//   R1b 명령줄로 쓴 명령은 `required-commands` 에 있어야 한다 — `mentioned-commands` 는 이름 언급 전용이고,
//       **레지스트리에 없는 이름이라도** 명령줄로 쓰면 오류다(선언에 있다는 이유로 명령줄을 이름으로 낮추지 않는다).
//   R3  해소된 모든 이름은 두 선언 블록 중 하나에 있어야 한다.
//   R4  `required` ⊆ 광고/레지스트리. `mentioned` 는 광고와 대조하지 않되 **사유 주석이 필수**다.
//   R5  선언 항목은 본문에 나와야 한다 (죽은 선언 금지).
// 왜 이렇게 좁히나: **"산문에서 명령을 더 똑똑하게 뽑는" 방식은 새 사각을 계속 냈다.**
// 허용 목록은 반대 방향이다 — 모르는 표기가 통과 쪽으로 떨어지지 않는다.
//
// ── 알려진 한계 (이 관문이 보지 못하는 것) ────────────────────────────────────
//   L-a. **백틱 없는 산문의 명령줄.** 검사 대상은 인라인 코드 스팬과 펜스 블록 줄이다. 산문에 그냥 쓴
//        `worker-stop --dispatch <ctx>` 는 어느 규칙에도 걸리지 않는다 → **명령은 반드시 코드 스팬으로 쓴다.**
//   L-b. **플래그 값의 의미.** 플래그 이름이 그 명령에 실제로 있는지는 이 관문이 보지 않는다 — 이름만 본다.
//   L-c. **다른 도구의 명령.** `--tool corral` 로 돌리면 다른 도구의 CLI 호출 스팬은 외부 명령으로 지난다.
//        레포에는 매핑이 하나 깔리므로 그 매핑의 도구로 돌린다.
//   L-d. **보장 수준·상황 설명의 내용.** 형식만 본다.
//   L-e. **허용 외부 명령 뒤에 오는 도구 명령.** 스팬의 첫 낱말이 EXTERNAL 이면 그 스팬은 검사 대상이 아니다 —
//        `export PATH=… && corral <그룹> <명령> --플래그` 처럼 한 줄에 이어 붙인 형태는 R1b·R3 를 지난다.
//
// 종료 코드: 0 통과 · 1 불일치(멈춘다) · 2 사용법·읽기 오류 · 3 대조 불가(광고가 없는 도구)
//   bare 는 규약·선언 검사를 **전부 돌린 뒤** 광고 대조만 공백이라 3 으로 끝난다. 규약을 어기면 1 이다.
// 뒷문(양성 대조 전용): `--mapping <경로>` 매핑 갈아끼우기 · `--advertised <경로>` 광고 목록 주입.
// 프로필 선택: `--socket <경로>`·`--instance <id>` 를 주면 그 런타임에 그대로 넘긴다 —
//   주지 않으면 기본 프로필을 본다. **다른 프로필을 쓰면서 이 관문을 기본으로 돌리면 쓰지 않는 런타임을 점검한다.**
//   **corral 전용이다**: bare 는 런타임이 없다 — bare 에 주면 여기서 exit 2 로 거절한다.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HARNESS_DIR, '..', '..');

const NAME_RE = /『([^『』]+)』/g;
// 깔린 매핑 = 하네스 폴더의 `<도구>.md` 중 capabilities.md 를 뺀 것. {도구: 파일 이름}
function installedMappings() {
  const out = {};
  for (const file of readdirSync(HARNESS_DIR).sort()) {
    if (file.endsWith('.md') && file !== 'capabilities.md') out[file.slice(0, -3)] = file;
  }
  return out;
}
// 절차 문서 — 능력 이름으로만 말해야 하는 쪽. capabilities.md 는 정본이라 따로 센다.
// 목록은 고정이고, 실제로는 이 레포에 **있는 것만** 본다(모듈을 끈 파일은 없다).
const FLOW_DOCS = [
  'AGENTS.md',
  '.agents/agents/reviewer.md',
  '.agents/rules/validation.md',
  '.agents/skills/task-start/SKILL.md',
  '.agents/skills/task-coordinate/SKILL.md',
  '.agents/skills/task-coordinate/references/implementation.md',
  '.agents/skills/task-coordinate/references/bundle.md',
  '.agents/defaults.rules.md',
];
const SECTIONS = ['### 명령', '### 보장 수준', '### 상황 → 행동'];
const SITUATIONS = ['- **차단 화면**', '- **타임아웃·빈 결과**', '- **부분 실패**', '- **복구**', '- **하지 말 우회**'];
const PROOF_ROWS = ['본문이 정확히 한 번 전달됐다', '세대 불변', '오래된 시도', '사람 개입'];

const argv = process.argv.slice(2);
const mode = argv[0];
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const read = (rel) => {
  const p = rel.startsWith('/') ? rel : join(ROOT, rel);
  if (!existsSync(p)) fail(2, `읽을 수 없다: ${p}`);
  return readFileSync(p, 'utf8');
};
const problems = [];
const note = (s) => console.log(s);
function fail(code, msg) {
  console.error(`[capability-check] ${msg}`);
  process.exit(code);
}
function verdict(label) {
  if (problems.length === 0) {
    note(`\n[capability-check] ${label}: 통과`);
    process.exit(0);
  }
  console.error(`\n[capability-check] ${label}: 불일치 ${problems.length}건 — 멈춘다`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// 정본 능력 목록 = capabilities.md 의 "능력 목록" 표에서 행 머리의 『…』
function canonicalNames() {
  const text = read('.agents/harness/capabilities.md');
  const names = [];
  for (const line of text.split('\n')) {
    const m = /^\|\s*『([^『』]+)』\s*\|/.exec(line);
    if (m) names.push(m[1]);
  }
  if (names.length === 0) fail(2, 'capabilities.md 의 능력 목록 표를 찾지 못했다');
  return names;
}

function usedNames(text) {
  const out = new Set();
  let m;
  NAME_RE.lastIndex = 0;
  while ((m = NAME_RE.exec(text)) !== null) out.add(m[1]);
  return out;
}

function checkNames() {
  const flowDocs = FLOW_DOCS.filter((doc) => existsSync(join(ROOT, doc)));
  if (flowDocs.length === 0) {
    note('흐름 문서 없음 — 건너뜀');
    process.exit(0);
  }
  const mappings = installedMappings();
  if (Object.keys(mappings).length === 0) fail(2, '깔린 매핑이 없다 (.agents/harness/<도구>.md)');
  const canon = canonicalNames();
  note(`정본 능력 ${canon.length}개: ${canon.map((n) => `『${n}』`).join(' ')}`);
  const usedInFlow = new Set();
  for (const doc of flowDocs) {
    const used = usedNames(read(doc));
    for (const n of used) {
      usedInFlow.add(n);
      if (!canon.includes(n)) problems.push(`${doc}: 정본에 없는 능력 이름 『${n}』`);
    }
  }
  for (const file of Object.values(mappings)) {
    const text = read(`.agents/harness/${file}`);
    const heads = new Set();
    for (const line of text.split('\n')) {
      const m = /^##\s+『([^『』]+)』\s*$/.exec(line);
      if (m) heads.add(m[1]);
    }
    for (const n of canon) if (!heads.has(n)) problems.push(`${file}: 능력 『${n}』 의 절(## 『…』)이 없다`);
    for (const n of heads) if (!canon.includes(n)) problems.push(`${file}: 정본에 없는 절 『${n}』 (매달린 능력)`);
    note(`${file}: 능력 절 ${heads.size}개`);
  }
  for (const n of canon) {
    if (!usedInFlow.has(n)) problems.push(`절차 문서 어디에서도 쓰지 않는 능력 『${n}』 (매달린 능력)`);
  }
  note(`절차 문서가 쓰는 능력 ${usedInFlow.size}개 / 정본 ${canon.length}개`);
  verdict('names');
}

function checkShape() {
  const mappings = installedMappings();
  if (Object.keys(mappings).length === 0) fail(2, '깔린 매핑이 없다 (.agents/harness/<도구>.md)');
  const canon = canonicalNames();
  for (const file of Object.values(mappings)) {
    const text = read(`.agents/harness/${file}`);
    for (const row of PROOF_ROWS) {
      if (!text.includes(row)) problems.push(`${file}: 보장 요약에 "${row}" 줄이 없다`);
    }
    const lines = text.split('\n');
    const starts = [];
    lines.forEach((line, i) => {
      const m = /^##\s+『([^『』]+)』\s*$/.exec(line);
      if (m) starts.push({ name: m[1], at: i });
    });
    for (let k = 0; k < starts.length; k += 1) {
      const end = k + 1 < starts.length ? starts[k + 1].at : lines.length;
      const body = lines.slice(starts[k].at, end).join('\n');
      for (const s of SECTIONS) {
        if (!body.includes(s)) problems.push(`${file} 『${starts[k].name}』: "${s}" 가 없다`);
      }
      for (const s of SITUATIONS) {
        if (!body.includes(s)) { problems.push(`${file} 『${starts[k].name}』: 상황 항목 "${s}" 가 없다`); continue; }
        // 라벨만 있고 뒤가 빈 항목을 잡는다. **내용의 타당성은 이 관문이 보지 않는다(리뷰 몫).**
        const at = body.indexOf(s) + s.length;
        const rest = body.slice(at, body.indexOf('\n- **', at) === -1 ? undefined : body.indexOf('\n- **', at));
        const filled = rest.replace(/[\s:·.]/g, '');
        // 임계 3자: `해당 없음.` 같은 정당한 짧은 답은 통과시키고 **라벨만 있고 빈 칸**만 잡는다.
        // 내용이 타당한지는 이 관문이 판단하지 않는다 — 리뷰어 몫이다(머리 주석의 한계 L-d).
        if (filled.length < 3) problems.push(`${file} 『${starts[k].name}』: 상황 항목 "${s}" 가 라벨만 있고 비었다(유효 ${filled.length}자)`);
        // 문구는 **"해당 없음 — 이유"** 다. 사유 없는 `해당 없음.` 은 통과시키지 않는다.
        else if (/^\s*:?\s*해당\s*없음\s*[.。]?\s*$/.test(rest.split('\n')[0])) {
          problems.push(`${file} 『${starts[k].name}』: 상황 항목 "${s}" 가 사유 없는 "해당 없음." 이다 — \`해당 없음 — 이유\` 를 요구한다`);
        }
      }
    }
    note(`${file}: 절 ${starts.length}개 × (절 3개 + 상황 5개) 검사`);
    if (starts.length !== canon.length) problems.push(`${file}: 절 수 ${starts.length} ≠ 정본 ${canon.length}`);
  }
  verdict('shape');
}

// ── 선언 블록 ───────────────────────────────────────────────────────────────
// ```required-commands / ```mentioned-commands / ```required-tokens 를 읽는다.
// `#` 뒤는 주석(mentioned 에서는 **사유**라 필수), 빈 줄은 무시.
export function declaredBlock(text, kind) {
  const re = new RegExp('```' + kind + '\\n([\\s\\S]*?)```', 'g');
  const entries = [];
  const noReason = [];
  let found = false;
  let m;
  while ((m = re.exec(text)) !== null) {
    found = true;
    for (const raw of m[1].split('\n')) {
      const hash = raw.indexOf('#');
      const name = (hash === -1 ? raw : raw.slice(0, hash)).trim();
      const reason = hash === -1 ? '' : raw.slice(hash + 1).trim();
      if (!name) continue;
      entries.push(name);
      if (!reason) noReason.push(name);
    }
  }
  return { found, entries: [...new Set(entries)].sort(), noReason };
}

// ── 표기 규약 검사 ──────────────────────────────────────────────────────────
// 펜스 블록과 그 밖의 산문을 갈라 준다. ``` 의 세 번째 백틱이 산문과 짝지어 **가짜 스팬**을 만들기 때문에
// 인라인 스팬은 반드시 "펜스 밖" 에서만 센다 .
export function splitFences(text) {
  const fences = [];
  const outside = text.replace(/```[a-z-]*\n[\s\S]*?```/g, (m) => {
    fences.push(m.replace(/^```[a-z-]*\n/, '').replace(/```$/, ''));
    return '\n\n';
  });
  return { outside, fences };
}


// 도구별 어휘. corral 은 런타임이 알려 주고, bare 는 광고가 없으니 **선언이 어휘다**.
export function lexicon(tool, oracleNames) {
  const names = [...new Set(oracleNames)];
  const byLast = new Map();
  const firsts = new Set();
  for (const n of names) {
    const parts = n.split(' ');
    firsts.add(parts[0]);
    const last = parts[parts.length - 1];
    if (!byLast.has(last)) byLast.set(last, []);
    byLast.get(last).push(n);
  }
  return { names, byLast, firsts };
}

// ── 허용 표기 목록 (ALLOWED). 여기 없는 형태는 오류다 ─────────────────────────
// 전역옵션: 값을 먹는 것과 안 먹는 것을 구분한다. 목록 밖 옵션이 명령 앞에 오면 오류.
const GLOBAL_OPTS = {
  corral: { valued: ['--socket', '--instance', '--timeout-ms', '--request-id'], plain: ['--json'] },
  tmux: { valued: ['-L', '-S', '-f'], plain: [] },
};
// 도구 CLI 를 다른 경로로 부르는 형태 (A3) — 도구 접두사로 정규화한다
const TOOL_SCRIPT = /(?:^|\/)(corral)\.mjs$/;
// 매핑에 나와도 되는 외부 명령 (A7). **목록에 없는 첫 단어 + 플래그 = 오류다.**
// 늘릴 때는 "매핑이 정말 그 명령을 적어야 하나" 를 먼저 묻는다.
const EXTERNAL = new Set([
  'node',              // 이 관문 자신을 부르는 줄 (`node .agents/harness/capability-check.mjs …`)
  'capability-check',  // 같은 것을 이름만으로 부르는 줄
  'claude', 'codex', 'grok',  // 에이전트 CLI (세션 기동 원자료 설명)
  'jq', 'git', 'sh', 'shasum', 'osascript', 'export', 'command',
]);

// 스팬 하나를 허용 목록에 비춰 본다. 반환: {kind, name?, msg?}
//   kind: 'none'(검사 대상이 아니다) · 'name'(이름 언급, 해소됨) · 'line'(도구 명령줄) · 'error'
export function classifySpan(span, tool, lex, declared) {
  const s = span.trim();
  if (!s) return { kind: 'none' };
  // A8 — `invalid_argument: …` 류 **오류 메시지 인용**. 명령 표기가 아니다
  if (/^[a-z][a-z_]*:\s/.test(s)) return { kind: 'none' };
  let words = s.split(/\s+/);
  const hasFlag = /(^|\s)--[a-z]/.test(s);
  const isLine = hasFlag || /<[^>]+>/.test(s);
  const toolWord = tool === 'bare' ? 'tmux' : tool;

  // A3 — `node <경로>/corral.mjs …` 를 도구 표기로 정규화한다
  if (words[0] === 'node' && words[1] && TOOL_SCRIPT.test(words[1])) {
    const which = TOOL_SCRIPT.exec(words[1])[1];
    if (which !== toolWord) return { kind: 'none' };      // 다른 도구의 CLI (L-c)
    words = [toolWord, ...words.slice(2)];
  }

  if (words[0] === toolWord) {
    // 전역옵션을 먼저 걷어낸다 (여기서 스팬을 버리면 옵션이 낀 명령줄이 검사를 빠져나간다)
    const opts = GLOBAL_OPTS[toolWord] || { valued: [], plain: [] };
    let i = 1;
    // 값 하나를 먹는다. `<전용 소켓 이름>` 처럼 자리표시자에 공백이 있으면 `>` 까지 먹는다
    const eatValue = (at) => {
      if (at >= words.length) return at;
      if (!words[at].startsWith('<') || words[at].endsWith('>')) return at + 1;
      let j = at;
      while (j < words.length && !words[j].endsWith('>')) j += 1;
      return j + 1;
    };
    while (i < words.length && /^-/.test(words[i])) {
      const w = words[i];
      const bare = w.split('=')[0];
      if (opts.valued.includes(bare)) { i = w.includes('=') ? i + 1 : eatValue(i + 1); continue; }
      if (opts.plain.includes(bare)) { i += 1; continue; }
      if (bare === '--help') { i += 1; continue; }
      // 명령 앞의 모르는 옵션 — 허용 목록에 없다
      return { kind: 'error', msg: `허용하지 않는 전역옵션 표기: \`${s}\` (전역옵션 목록: ${[...opts.valued, ...opts.plain].join(' ')})` };
    }
    const rest = words.slice(i);
    if (rest.length === 0) return { kind: 'none' };        // 도구 이름 + 전역옵션만
    if (/^[<[]/.test(rest[0])) return { kind: 'none' };     // `corral <명령> --help` 류 일반형
    const two = rest[0] && rest[1] && /^[a-z][a-z-]*$/.test(rest[1]) ? `${rest[0]} ${rest[1]}` : null;
    const one = /^[a-z][a-z-]*$/.test(rest[0]) ? rest[0] : null;
    if (!one) return { kind: 'error', msg: `도구 뒤에 명령 이름이 아닌 것이 왔다: \`${s}\`` };
    if (toolWord === 'tmux') {
      const pair = `tmux ${one}`;
      if (lex.names.includes(pair)) return { kind: isLine ? 'line' : 'name', name: pair };
      if (declared.has(pair)) return isLine
        ? { kind: 'error', msg: `R1b 위반 — 선언(언급만)에 있는 이름을 명령줄로 지시한다: \`${s}\`` }
        : { kind: 'name', name: pair };
      return { kind: 'error', msg: `선언에 없는 tmux 명령: \`${s}\`` };
    }
    for (const cand of [two, one]) {
      if (!cand) continue;
      if (lex.names.includes(cand)) return { kind: isLine ? 'line' : 'name', name: cand };
    }
    // 레지스트리에 없다. 선언(언급만)에 있으면 **이름 언급일 때만** 받는다 —
    // 명령줄이면 R1b 다 — 명령줄을 이름으로 낮추면 R1b 를 건너뛴다.
    for (const cand of [two, one]) {
      if (!cand) continue;
      if (declared.has(cand)) {
        return isLine
          ? { kind: 'error', msg: `R1b 위반 — 광고·레지스트리에 없는 이름(언급만 선언)을 명령줄로 지시한다: \`${s}\`` }
          : { kind: 'name', name: cand };
      }
    }
    return { kind: 'error', msg: `광고·레지스트리에 없는 명령 표기: \`${s}\` (없다는 사실을 적는 것이면 mentioned-commands 에 사유와 함께 선언한다)` };
  }

  // A5 — iTerm2 Python API
  if (/^async_[a-z_]+/.test(words[0])) {
    const name = words[0].replace(/\(.*$/, '');
    if (lex.names.includes(name)) return { kind: isLine ? 'line' : 'name', name };
    return { kind: 'error', msg: `선언에 없는 iTerm2 API: \`${s}\`` };
  }

  // A7 — 허용된 외부 명령
  if (EXTERNAL.has(words[0])) return { kind: 'none' };
  // 플래그 이름만 적는 스팬 (`--run`, `--timeout-ms 120000`)
  if (/^-/.test(words[0])) return { kind: 'none' };

  // 여기부터 접두사가 없다.
  // **플래그가 있으면 무조건 오류다** — 알려진 명령이든(R1 위반) 오타든(허용 목록 밖) 같다.
  if (hasFlag) {
    return { kind: 'error', msg: `허용 표기 목록에 없는 명령줄: \`${s}\` — 도구 이름부터 쓴다(A1·A2). 외부 명령이면 EXTERNAL 에 올린다` };
  }
  // 플래그 없는 이름 언급 (A6) — 유일 해소를 요구한다
  const two = words[1] ? `${words[0]} ${words[1]}` : null;
  let resolved = null;
  let ambiguous = null;
  if (two && lex.names.includes(two)) resolved = two;
  else if (lex.names.includes(words[0])) resolved = words[0];
  else if (lex.byLast.has(words[0])) {
    const cands = lex.byLast.get(words[0]);
    if (cands.length === 1) [resolved] = cands;
    else ambiguous = cands;
  } else if (lex.firsts.has(words[0])) {
    if (two && declared.has(two)) return { kind: 'name', name: two };
    return { kind: 'error', msg: `알려진 그룹으로 시작하지만 해소되지 않는다: \`${s}\` (없는 명령이면 mentioned-commands 에 선언한다)` };
  }
  if (!resolved && !ambiguous) return { kind: 'none' };
  if (isLine) return { kind: 'error', msg: `R1 위반 — 명령줄은 \`${toolWord} …\` 완전 표기로 쓴다: \`${s}\`` };
  if (ambiguous) return { kind: 'error', msg: `R2 위반 — \`${s}\` 는 ${ambiguous.join(' / ')} 로 갈린다. 완전 표기로 쓴다` };
  return { kind: 'name', name: resolved };
}

// ── runtime ────────────────────────────────────────────────────────────────
function advertisedFromFile(path) {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  const caps = parsed?.result?.runtime?.capabilities;
  if (Array.isArray(caps)) return caps;
  fail(2, `${path}: 능력 배열을 찾지 못했다`);
}

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    fail(2, `${cmd} ${args.join(' ')} 실패: ${e.stderr || e.message}`);
  }
}

function checkRuntime() {
  const tool = flag('--tool');
  if (tool !== 'corral' && tool !== 'bare') fail(2, 'runtime 모드는 --tool corral|bare 가 필요하다');
  const mappingPath = flag('--mapping') || join(HARNESS_DIR, `${tool}.md`);
  if (!existsSync(mappingPath)) fail(2, `깔린 매핑이 아니다: ${mappingPath}`);
  const mapping = readFileSync(mappingPath, 'utf8');
  const advFile = flag('--advertised');
  // 실제로 읽은 파일을 적는다 — 뒷문으로 갈아 끼웠는데 원본 이름을 찍으면 양성 대조가 거짓말이 된다
  note(`매핑: ${mappingPath}`);
  // 프로필 선택 인자를 그대로 넘긴다. 주지 않으면 기본 프로필이다
  const profile = [];
  if (flag('--socket')) profile.push('--socket', flag('--socket'));
  if (flag('--instance')) profile.push('--instance', flag('--instance'));
  if (profile.length && tool !== 'corral') {
    fail(2, `${tool} 는 --socket·--instance 를 받지 않는다 — 프로필 선택은 corral 전용이다. 그 축은 ${tool} 에서 공백이다`);
  }
  note(profile.length ? `프로필 인자: ${profile.join(' ')}` : '프로필: 기본 (--socket·--instance 없음)');

  // (1) 선언 블록
  const decl = declaredBlock(mapping, 'required-commands');
  const ment = declaredBlock(mapping, 'mentioned-commands');
  if (!decl.found) problems.push('```required-commands 선언 블록이 없다 (요구를 안 적었다)');
  else if (decl.entries.length === 0) problems.push('```required-commands 선언이 비어 있다 — 요구 0개는 통과가 아니다');
  for (const n of ment.noReason) problems.push(`R4 위반 — mentioned-commands \`${n}\` 에 사유 주석이 없다`);
  note(`선언: 요구 ${decl.entries.length}개 · 언급만 ${ment.entries.length}개`);
  const declared = new Set([...decl.entries, ...ment.entries]);

  // (2) 광고/레지스트리
  let advertised = null;
  let registry = null;
  if (tool === 'bare') {
    note('bare: 광고하는 능력이 없다 — 어휘는 이 매핑의 선언이다.');
  } else if (advFile) {
    advertised = new Set(advertisedFromFile(advFile));
    note(`광고 출처: ${advFile} (주입 — 양성 대조용)`);
  } else {
    const parsed = JSON.parse(run(tool, ['status', '--json', ...profile]));
    advertised = new Set(parsed?.result?.runtime?.capabilities || []);
    if (advertised.size === 0) fail(2, `${tool} status --json 에 runtime.capabilities 가 없다`);
    note(`광고 출처: ${tool} status --json${profile.length ? ' ' + profile.join(' ') : ''} (실행)`);
  }
  if (tool === 'corral') {
    registry = advertised; // corral 의 광고가 곧 명령 이름 집합이다
  } else {
    registry = declared; // bare
  }
  if (advertised) note(`광고 ${advertised.size}개`);

  // (3) 표기 규약 + 본문이 쓰는 명령 수집
  const prose = mapping.replace(/```required-commands\n[\s\S]*?```/g, '')
                       .replace(/```mentioned-commands\n[\s\S]*?```/g, '');
  const lex = lexicon(tool, [...registry]);
  const used = new Set();
  const ranAsLine = new Set();
  let spans = 0;
  let lines = 0;
  const take = (raw) => {
    spans += 1;
    const r = classifySpan(raw, tool, lex, declared);
    if (r.kind === 'error') problems.push(r.msg);
    else if (r.kind === 'name' || r.kind === 'line') {
      used.add(r.name);
      if (r.kind === 'line') { lines += 1; ranAsLine.add(r.name); }
    }
  };
  const split = splitFences(prose);
  // ⓐ 인라인 코드 스팬 — 펜스 **밖**에서만
  for (const m of split.outside.matchAll(/`([^`\n]+)`/g)) take(m[1]);
  // ⓑ 펜스 블록의 각 줄 — 『명령』 절이 바로 여기다. 주석·이어지는 플래그 줄은 건너뛴다
  let fenced = 0;
  for (const body of split.fences) {
    for (const raw of body.split('\n')) {
      const line = raw.replace(/\\$/, '').replace(/\s+#.*$/, '').trim();
      // 건너뛰는 줄: 주석 · 플래그로 시작하는 **이어짐 줄**(`--x …`, `[--x …]`) · 표 줄
      if (!line || line.startsWith('#') || line.startsWith('--') || line.startsWith('[--') || line.startsWith('|')) continue;
      fenced += 1;
      take(line);
    }
  }
  note(`코드 스팬 ${spans}개(인라인 + 펜스 ${fenced}줄) 검사 — 완전 표기 명령줄 ${lines}건 · 본문이 쓰는 명령 ${used.size}종`);

  // (4) 본문 ⊆ 선언 (R3) — bare 에서도 돈다
  for (const n of [...used].sort()) {
    if (!declared.has(n)) problems.push(`R3 위반 — 선언에 없는데 본문이 쓰는 명령: ${n}`);
  }
  // (4b) **명령줄로 쓴 명령은 required 여야 한다.** mentioned 는 "이름만 언급" 칸이므로
  // 거기 있는 이름으로 실행을 지시하면 조용히 통과한다 — 그 구멍을 막는다.
  for (const n of [...ranAsLine].sort()) {
    if (!decl.entries.includes(n)) {
      problems.push(`R1b 위반 — mentioned(또는 미선언) 명령을 명령줄로 지시한다: ${n} — 실행을 지시하려면 required-commands 에 올린다`);
    }
  }
  // (5) required ⊆ 광고/레지스트리 (R4). bare 는 대조할 광고가 없다
  if (tool !== 'bare') {
    for (const n of decl.entries) {
      if (!registry.has(n)) problems.push(`광고에 없는 명령: ${tool} ${n}`);
    }
  }
  // (6) 죽은 선언 (R5)
  for (const n of [...declared].sort()) {
    if (!used.has(n)) problems.push(`R5 위반 — 선언에만 있고 본문에 없는 명령: ${n}`);
  }
  if (tool === 'bare') {
    if (problems.length > 0) verdict('runtime --tool bare');
    note('bare: 규약·선언·본문 세 방향은 돌렸다. **광고 대조만 불가**다 —');
    note('  tmux·iTerm2 어느 쪽도 "무엇을 보장하는가" 를 기계가 읽을 형태로 내놓지 않는다.');
    note('  → 그 한 방향은 공백이다. 판정표에 공백으로 적어라 (bare.md 『전제 점검』).');
    process.exit(3);
  }
  verdict(`runtime --tool ${tool}`);
}

// 직접 실행일 때만 검사를 돈다. 다른 도구가 **같은 허용 목록**을 쓰도록 import 할 수 있어야 하기 때문이다 —
// 목록이 두 벌이면 한쪽만 좁아진다.
const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  if (mode === 'names') checkNames();
  else if (mode === 'shape') checkShape();
  else if (mode === 'runtime') checkRuntime();
  else fail(2, '사용법: capability-check.mjs names|shape|runtime [--tool corral|bare]');
}
