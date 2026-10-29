<!-- paddock:seed — 처음 한 번만 깔린다. 이후 내용은 이 프로젝트 소유 -->
# coding — 코드 작성 규칙

<!-- 같은 실수를 두 번째 만났을 때 한 줄씩 추가. 첫 번째는 .agents/learnings/ 에. 글로벌 스타일과 중복 금지 -->

## 작업 원칙 (옮겨 옴: 적용 전 CLAUDE.md 「작업 원칙」)

글로벌 CLAUDE.md 를 못 읽는 도구(Codex 등)도 같은 규칙으로 일하도록 여기 둔다.

- `as` 단언 극도로 기피 — discriminated union + switch narrowing 선호
- 파라미터 2개 이상이면 단일 객체 (NestJS 데코레이터 제약 영역만 예외)
- 수정 범위 최소화 — 무관한 코드 건드리지 X
- 관심사 분리 (Guard: request 추출, Service: 순수 로직)
- 불필요한 추상화 지양
- SQL 테이블 alias 금지 — 풀네임
