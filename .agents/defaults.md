<!-- paddock:seed -->
# 작업 시작 기본 구성

**도구가 자동으로 읽는 파일이 아니다** — 각 스킬·역할 파일이 `.agents/defaults.md` 경로로 가리켜야 읽힌다.

신규 작업은 설정 질문 없이 아래 구성으로 시작한다. 역할 기본값의 원본은 이 파일 하나이고, 명시한 사용자 변경은 해당 작업에만 적용한다.
이 파일은 **값**만 둔다 — 운영 규칙·리뷰어 구성 변경 기록·리뷰어 사용 불가 시 자동 전환·외부 서치 한도·경쟁 구현의 **규칙**은 [`defaults.rules.md`](defaults.rules.md) 에 있다(paddock 고정).

## 역할 기본값

| 역할 | 도구 | 모델 | effort | advisor |
| --- | --- | --- | --- | --- |
| 본체 세션 (시작·마무리) | Claude Code | claude-sonnet-5-5 | high | 없음 |
| 코디네이터·판정 | Claude Code | claude-opus-5-5 | high | 없음 |
| 구현 워커 (단독·기본) | Claude Code | claude-opus-5-5 | medium | 없음 |
| 구현 워커 (경쟁 시 상대 측) | Codex | gpt-6-astra (계정 카탈로그에 있을 때만) | high | 해당 없음 |
| 코드 리뷰 ① 지정 리뷰어 | Codex | gpt-6-astra (계정 카탈로그에 없으면 자동 전환) | xhigh | 해당 없음 |
| 코드 리뷰 ② 대체 리뷰어 | Claude Code | claude-sonnet-5-5 | high | 없음 |
| 코드 리뷰 ③ 대체 리뷰어 | Grok | grok-search 설치 기본값 | 해당 없음 | 해당 없음 |
| 서브에이전트 | 부모 세션 상속 | 부모 상속 | 부모 상속 | 부모 상속 |

## 선택 근거

- 본체: 시작·마무리는 정해진 절차라 Sonnet high 로 충분하다.
- 코디네이터·판정: 기준 동결·리뷰 취합·판정이 품질을 가른다 — Opus high.
- 구현 워커: Opus 를 medium 으로 — 리뷰(xhigh)와 등급을 벌린다.
- 경쟁 상대 측: 다른 벤더(Codex) 모델이라야 경쟁의 의미가 있다. 카탈로그에 없으면 경쟁 불가로 보고한다(defaults.rules.md).
- 리뷰 ①: 구현자(Claude)와 다른 모델 — Codex gpt-6-astra xhigh. 카탈로그에 없으면 ②로 자동 전환.
- 리뷰 ②: 같은 Claude 계열이지만 구현자와 다른 모델(Sonnet)·새 세션.
- 리뷰 ③: 세 번째 벤더(Grok) — 모델·effort 는 grok-search 설치 기본값을 따른다.
- advisor: Claude 행은 쓰지 않는다(독립 리뷰로 대신). Codex·Grok 은 해당 기능이 없다.

- 구현과 리뷰의 등급을 벌려 둔다 — 높은 effort 가 만드는 미묘한 결함을 더 깊은 리뷰가 받는다.
- 리뷰어는 구현자와 다른 모델을 하나 이상 둔다 — 같은 모델은 같은 결함을 함께 놓친다.
