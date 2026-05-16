# home-coffing 워크트리 (harness 브랜치)

home-coffing 모노레포의 코드 변경을 위한 워크트리. brain 레포(`~/brain/projects/home-coffing/`)의 ticket 사이클(developing/reviewing 단계)과 연동된다.

## 하네스: home-coffing dev 사이클 (ticket 기반)

**목표:** brain 레포에서 분석·디자인이 끝난 ticket을 입력으로, dev-plan 작성 → 코드 작성(apps/api·app) → 점진적 QA → ticket done(spec 갱신)까지 사용자-에이전트 협업으로 진행. dev-plan만 사용자 컨펌, 이후 자동 실행.

**트리거 규칙:**
- **dev 작업** (ticket developing/reviewing — dev-plan, 코드 작성, QA, screens.md 갱신, ticket done 처리) → `home-coffing-dev` 스킬
- **분석·디자인 작업** (ticket open/analyzing/designing) → 이 코드 레포가 아닌 **brain 레포**에서 진행 (이 하네스는 다루지 않음)

단순 질문·탐색은 직접 응답.

**관련 경로:**
- brain 산출물 (입력): `~/brain/projects/home-coffing/tickets/NNN/`, `spec/`, `service/`
- 코드 (출력): `apps/api`, `apps/app`, `packages/shared-types`
- 운영 가드레일: `docs/operations.md` / 배포 절차: `docs/deploy-runbook.md`
- 인프라 (외부 repo): `byun618/homelab-infra` — 운영 compose owner. `services/home-coffing/` (API 컨테이너), `services/_runner/` (GHA self-hosted runner)

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-30 | 초기 구성 | 전체 (.claude/agents 5명, .claude/skills 2개) | 하네스 신규 구축 |
| 2026-05-06 | 하네스 리셋 + dev 전용 재구축 | agents 3명(api/client/qa-engineer), skills 1개(home-coffing-dev) | brain 레포가 sprint 기반 → ticket 기반으로 전환됨. planning 사이클은 brain 레포로 이관, 이 코드 레포는 dev 사이클 전용. spec/data-model.md, spec/component-library.md 폐기 반영. |
| 2026-05-12 | apps/web 폐기 + skills/agents 갱신 | apps/web 삭제, shared-types legacy 정리, CLAUDE.md / SKILL.md / client-engineer / client-stack.md에서 web 참조 제거 | T005 진행 중 web `/beans` 회수 충돌 발견. web은 dogfooding 미사용 + 비전 미정 → 폐기. 향후 클라이언트는 Expo 앱(`apps/app`) 단일. |
| 2026-05-17 | T008 배포 자동화 (GHA self-hosted + 운영 compose 이관) | `.github/workflows/deploy-api.yml`, `docs/deploy-runbook.md`, `docs/operations.md`, skills 갱신. home-coffing repo의 `docker-compose.yml`/`infra/github-runner/` 제거, `homelab-infra/services/home-coffing/`·`services/_runner/`로 이전. Dockerfile CMD의 자동 schema:update 제거 | T005 누적 배포 회고에서 수동 ssh deploy 마찰(PATH/nvm/cloudflared 트랩) 노출. ncnc 패턴(app repo = build, infra repo = runtime compose owner) 차용. 외부 레지스트리(GHCR)는 dogfooding 단계 가치 < 셋업 비용 → mac mini local-only 이미지 관리로 단순화. |
