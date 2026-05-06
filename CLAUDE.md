# home-coffing 워크트리 (harness 브랜치)

home-coffing 모노레포의 코드 변경을 위한 워크트리. brain 레포(`~/brain/projects/home-coffing/`)의 ticket 사이클(developing/reviewing 단계)과 연동된다.

## 하네스: home-coffing dev 사이클 (ticket 기반)

**목표:** brain 레포에서 분석·디자인이 끝난 ticket을 입력으로, dev-plan 작성 → 코드 작성(apps/api·app·web) → 점진적 QA → ticket done(spec 갱신)까지 사용자-에이전트 협업으로 진행. dev-plan만 사용자 컨펌, 이후 자동 실행.

**트리거 규칙:**
- **dev 작업** (ticket developing/reviewing — dev-plan, 코드 작성, QA, screens.md 갱신, ticket done 처리) → `home-coffing-dev` 스킬
- **분석·디자인 작업** (ticket open/analyzing/designing) → 이 코드 레포가 아닌 **brain 레포**에서 진행 (이 하네스는 다루지 않음)

단순 질문·탐색은 직접 응답.

**관련 경로:**
- brain 산출물 (입력): `~/brain/projects/home-coffing/tickets/NNN/`, `spec/`, `service/`
- 코드 (출력): `apps/api`, `apps/app`, `apps/web`, `packages/shared-types`
- 운영 가드레일: `docs/operations.md`

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-30 | 초기 구성 | 전체 (.claude/agents 5명, .claude/skills 2개) | 하네스 신규 구축 |
| 2026-05-06 | 하네스 리셋 + dev 전용 재구축 | agents 3명(api/client/qa-engineer), skills 1개(home-coffing-dev) | brain 레포가 sprint 기반 → ticket 기반으로 전환됨. planning 사이클은 brain 레포로 이관, 이 코드 레포는 dev 사이클 전용. spec/data-model.md, spec/component-library.md 폐기 반영. |
