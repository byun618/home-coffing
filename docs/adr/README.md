<!-- paddock:fixed -->
# ADR — 오래 남을 결정 기록

home-coffing 의 구조·작업 방식에서 **오래 남을 결정**과 그 이유를 남긴다. 형식은 [MADR](https://adr.github.io/madr/) 이고
템플릿은 [`template.md`](template.md) 다. ADR 의 번호·상태·수정 규칙의 원본은 이 파일 한 곳이다.

## 언제 쓰나

- 되돌리기 비싸거나, 나중에 「왜 이렇게 했지」를 다시 물을 결정 — 비교한 안과 기각 사유가 있는 것.
- 일회성 선호·구체적 동작·덜 검증된 지침은 ADR 이 아니다 — 목적지 분류는 `.agents/learnings/README.md`.

## 흐름과 번호

- 초안을 언제 쓰고 언제 채택하는지는 그 절차를 실행하는 스킬이 정한다. 그런 스킬이 없으면 결정한 세션이 초안을 쓰고 사용자가 채택한다.
- 초안 = 게이트 ②(task-coordinate §8).
- 파일 이름 `docs/adr/NNNN-<제목-케밥>.md`. 초안은 번호 없이 `status: proposed`.
- **번호는 채택할 때 매긴다** — 이 폴더의 가장 큰 번호 + 1, 네 자리(`0001`). 초안 단계에서 번호를 집지 않는다
  (병렬 작업이 같은 번호를 집는다).
- 공개될 수 있는 레포 주의는 `.agents/learnings/README.md` 「형식」의 공개 레포 줄과 같다. 근거는 일감 번호로.

## 상태

front matter `status` 값: `proposed` · `accepted` · `rejected` · `deprecated` · `superseded by ADR-NNNN`.

- **accepted 뒤에는 본문을 고치지 않는다.** 결정이 바뀌면 새 ADR 을 쓰고, 옛 ADR 은 `status` 만
  `superseded by ADR-NNNN` 으로 바꾼다(오타·깨진 링크 수정은 예외).
- 이 폴더에 들어오는 것은 채택된 결정뿐이라 `proposed`·`rejected` 는 초안에서만 쓴다.
