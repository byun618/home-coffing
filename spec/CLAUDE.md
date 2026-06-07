# Spec — 큰 그림 + 변경 이력

> spec/은 "단일 소스(SoT)"가 아니다. **코드가 SoT.**
> 다만 **코드만으론 안 보이는 것**(기능 단위 큰 그림, 변경 이력, 분석 의도, 디자인 톤)은 여기에 둔다.

## 무엇을 여기 두는가

| 파일 | 역할 |
|------|------|
| [screens.md](./screens.md) | ⭐ **탭/스크린별 기능 인벤토리 + ticket 변경 이력 + 스크린 ID(S##)** |
| [event-taxonomy.md](./event-taxonomy.md) | 이벤트 정의 + 분석 의도 (가설 매핑) |
| [design-system.md](./design-system.md) | 디자인 톤·원칙 + **컴포넌트 카탈로그 통합** (토큰은 tailwind config에) |
| [design.pen](./design.pen) | **visual master** — screen frames (S##), Pencil |
| [design-system.pen](./design-system.pen) | 컴포넌트 visual (design-system.md와 페어) |

## 무엇을 여기 두지 않는가

| 항목 | 어디에 |
|------|--------|
| 데이터 스키마 (필드 사전) | 코드 ORM (`apps/api/.../entities/`) |
| 화면별 행동/API/이벤트 발화 (코드 단위) | 코드 + 테스트 |
| 디자인 토큰 (색·간격·폰트) | `apps/app/tailwind.config.ts` |
| 결정 사유 (Dxx/PSxx anchor) | **ticket 분석 산출물에 누적** |
| Wireframe (옛 visual) | 폐기 (design.pen이 visual master) |

## Service 레이어와의 관계

- **service/** = 비즈니스·전략 ("왜") — 코드로 대체 불가, 그대로 유지
- **spec/** = 큰 그림 + 변경 이력 + 분석 의도 — 코드를 *보완*
- **code repo** = 마스터 ("무엇/어떻게") — 단일 소스

## screens.md ↔ ticket 관계 (핵심 메커니즘)

```
ticket open
   ↓
ticket analyzing — 결정 사유 정리 (ticket 안에 누적)
   ↓
ticket designing — mockup.pen / component-library.md 갱신 (필요 시)
   ↓
ticket developing — 코드 작성
   ↓
ticket done — screens.md에 라인 추가/수정 + ticket ref 표기
   ↓
(나중에 롤백 시)
새 ticket — screens.md의 해당 라인에 ~~취소선~~ + 롤백 ticket ref
```

**screens.md는 결국 "현재 운영 기능 + 그 history"의 단일 진실.** 코드는 *현재 상태*만 보여주지만 screens.md는 *시간*을 담는다.

## 작성 규약

### screens.md 라인 형식

```markdown
- ✅/🟡/🔴 기능 설명 — ticket-ref (날짜)
- ~~취소선 기능~~ — T### 추가 → T### 롤백 (날짜, 사유)
```

ticket-ref 종류:
- `pre-ticket (Sprint XX)` — ticket 시스템 도입 전 작업
- `T### (YYYY-MM-DD)` — ticket 도입 후 작업
- `T### → T###` — 추가 후 변경

### event-taxonomy 갱신
- 새 이벤트 정의 시 이 문서 + 코드 동시 갱신 (PR 묶어서)
- 이벤트 *발화 위치*는 적지 않음 (코드 grep)
- *왜* 이 이벤트를 측정하는지(가설 매핑)는 여기

### design-system / component-library 갱신
- 톤·원칙 변경 시 design-system.md
- 컴포넌트 추가/변경 시 component-library.md + .pen + 코드 동시
- 토큰 변경은 tailwind config에 (이 문서엔 적지 않음)

## 결정 ID는 ticket 안에 (F2/F3과 다른 점)

- 옛 Dxx/PSxx/Sxx anchor는 *역사적 참조*로 service/sprints에 남아있음
- 새 결정은 **ticket 폴더 내** `analysis.md` 또는 `ticket.md`의 분석 섹션에 누적
- spec엔 anchor 카탈로그 X (사용자 결정)

## 변경 플로우 요약

```
ticket developing 완료 → 코드 + 다음 산출물 갱신
   ↓
[코드만] entity/API/event 발화/tailwind config
[screens.md] 기능 인벤토리 라인 + ticket ref + 스크린 ID(S##)
[event-taxonomy.md] 새 이벤트 정의 + 가설 매핑 (필요 시)
[design-system.md] 톤·원칙 변경 또는 컴포넌트 카탈로그 변경 (필요 시)
[design.pen] visual 갱신 (필요 시)
```
