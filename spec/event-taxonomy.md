# Event Taxonomy

> **상태:** ✅ 확정
> **Phase:** 1 (적용 스프린트: 03~05)
> **Last updated:** Sprint 03 (2026-04-22)
> **앵커:** [Service SPEC 05(가설)](../service/05-solution-hypothesis.md) / [Service SPEC 06(북극성)](../service/06-north-star.md) / [Data Model](./data-model.md)
>
> 05 Solution Hypothesis에서 정의한 신호를 **어떻게 측정할 것인가**.
> 데이터 분석가 관점: "나중에 이 데이터로 어떤 질문에 답할 수 있는가"부터 역산.

## 원칙: DB 저장 ≠ 분석 로깅

| 종류 | 저장소 | 성격 |
|---|---|---|
| **비즈니스 데이터** | MySQL (프로덕션 DB) | 원두·기록·소비 — 지워지면 안 됨, 트랜잭션 정합성 |
| **행동 로그** | Product Analytics (외부) | "어떻게 쓰는지" — 휘발성 OK, 분석 UI가 본체 |

분리 이유:
- 분석 쿼리가 프로덕션 DB 부하 안 주고, DB 스키마가 분석용 컬럼으로 오염되지 않음
- Funnel / Retention / Cohort UI를 공짜로 얻음 — 직접 구현하면 그 자체가 한 프로젝트
- `bean_gap` 같은 도출 메트릭은 코드보다 분석 도구에서 계산이 자연스러움

---

## 도구: Amplitude (확정)

- **Free tier 10K MTU / 월** — Early User 2명 → 공동 홈카페 수천 개까지 여유
- **Funnel / Cohort / Retention / Pathfinder** 완성도 높음, 제품 분석 표준
- **React Native + Node SDK** 공식 지원
- 운영 부담 0 (SaaS)

셀프호스트(PostHog 등)는 운영 부담이 더 큰 단계. 유저 급증·lock-in 우려 생기면 추후 이전 고려.

---

## Identify 전략

| ID | 용도 | 설정 시점 |
|---|---|---|
| **Device ID** | 익명 디바이스 식별 (SDK 자동 생성) | 앱 최초 실행 |
| **User ID** | 로그인 유저 (이메일 가입 기준). Record 작성자도 이 User ID | 회원가입 직후 `identify()` 호출 |
| **Cafe ID** | 홈카페 식별 (user property) | Cafe 생성/가입 시 |

**원칙**
- 로그인 전 이벤트는 Device ID로 수집 → 가입 직후 `identify(userId)` 호출로 병합
- 공동 홈카페에서 "누가 기록했는지" 필수 → User ID 없이는 H2.2 / H2.4 측정 불가
- 같은 유저가 여러 Cafe 소속 가능성은 Phase 3(S2)까지 없음. Phase 1은 User ↔ Cafe 1:1 가정 (DB는 N:M 지원)
- DB의 `Record.user`가 곧 Amplitude `user_id` — 중간 ID 개념 없음

---

## Naming Convention

**규칙**
- **Object-Action 과거형** (`bean_added`, `record_created`)
- **snake_case** 통일
- **영어만** — SDK 기본 언어, 다국어 혼용 금지
- 예외 없음. 구현 시 linter / 공통 enum으로 강제

**Object-Verb 매트릭스**

| Object | Verb (과거형) |
|---|---|
| `auth` | signed_up, signed_in, signed_out, signup_failed |
| `cafe` | created, invited, joined, left |
| `bean` | added, updated, finished, archived, viewed |
| `record` | created, updated, deleted, viewed |
| `notification` | sent, opened, dismissed |
| `app` | opened, backgrounded |
| `screen` | viewed |

---

## User Properties vs Event Properties

| 구분 | 성격 | 예시 |
|---|---|---|
| **User Properties** | 가변, 유저의 **현재 상태** | `email`, `cafe_id`, `cafe_role`, `beans_active_count`, `last_active_at` |
| **Event Properties** | 불변, 이벤트 **발생 시점의 맥락** | `bean_id`, `grams`, `brewed_at`, `delay_hours` |

**원칙**
- 시간이 지나도 "그 시점 값"이 필요하면 → Event Property
- "지금 이 유저가 어떤 상태인가" 판단용이면 → User Property
- User Property는 최신값 유지하되, 이벤트 스트림에는 발생 시점 스냅샷이 함께 기록됨 (Amplitude 지원)

---

## Common Event Properties (전 이벤트 공통)

SDK super properties로 설정. 모든 이벤트에 자동 포함.

| property | type | 값 |
|---|---|---|
| `platform` | string | "ios" / "android" / "web" |
| `app_version` | string | `1.2.3` |
| `cafe_id` | string | 유저 소속 홈카페 |
| `cafe_role` | string | "admin" / "member" |
| `locale` | string | "ko-KR" |
| `network` | string | "wifi" / "cellular" / "offline" |

---

## 이벤트 스키마

### Auth

| event | 언제 | properties |
|---|---|---|
| `auth_signed_up` | 이메일 가입 완료 | `method: "email"` |
| `auth_signed_in` | 로그인 성공 | `method: "email"` |
| `auth_signed_out` | 로그아웃 | — |
| `auth_signup_failed` | 가입 실패 | `reason: "email_taken" / "weak_password" / ...` |

### Cafe

| event | 언제 | properties |
|---|---|---|
| `cafe_created` | 홈카페 최초 생성 | `cafe_id` |
| `cafe_invited` | 초대 링크 생성 (Invitation row 생성) | `cafe_id`, `invitation_id` |
| `cafe_joined` | 초대 수락 | `cafe_id`, `invited_by`, `invitation_id` |
| `cafe_left` | 탈퇴 (CafeUser hard delete) | `cafe_id` |

**도출 메트릭 (와이프 합류 funnel)**
- `cafe_invited` → `cafe_joined` 전환율 (초대 후 수락까지)
- `cafe_invited`는 있는데 `cafe_joined` 없으면: 공유 안 함 / 가입 미완료 등 진단 가능

### Bean (원두 관리 — H1 계열)

| event | 언제 | properties |
|---|---|---|
| `bean_added` | 원두 등록 완료 | `cafe_bean_id`, `bean_id` (catalog), `bean_type: 'single'\|'blend'\|'decaf'`, `total_grams`, `roasted_on`, `ordered_on`, `lead_time_days` |
| `bean_finished` | `CafeBean.finishedAt` 세팅 (자동 또는 수동) | `cafe_bean_id`, `bean_id`, `finished_on`, `finished_reason: "consumed" \| "discarded"`, `total_records`, `lifespan_days` |
| `bean_updated` | 원두 정보 수정 | `cafe_bean_id`, `changed_fields: string[]` |
| `bean_archived` | 목록 숨김 (`CafeBean.archivedAt` 세팅) | `cafe_bean_id` |
| `bean_viewed` | 원두 상세 진입 | `cafe_bean_id`, `bean_id` |

**도출 메트릭 (Amplitude에서 계산)**
- `bean_gap` = `bean_finished.finished_on` ~ 다음 `record_created.brewed_at` 간격 → **H1.1 신호**
- `bean_lifespan_days` = `bean_added` ~ `bean_finished` 일수 → 평균 원두 소비 주기

> **LIFE-7 (2026-05-12) 변경**: `roaster`/`origin` property 폐기. `bean_id`는 Bean catalog id, `cafe_bean_id`는 봉지 id로 분리. `bean_type` 추가.

### Bean Catalog (Seed catalog — LIFE-7 도입) — placeholder, 발화는 LIFE-8 SDK 도입 후

> **상태**: placeholder (이벤트 정의만 add). 실제 발화는 LIFE-8 시점에 일괄 처리.

| event | 언제 | properties |
|---|---|---|
| `bean_catalog_picker_opened` | F2 풀스크린 picker 열림 | `from: 'quick_record' \| 'bean_form'`, `mode: 'all' \| 'active-only'`, `cafe_id?` |
| `bean_catalog_selected` | picker row tap → 선택 완료 | `catalog_id`, `bean_type`, `from`, `search_query?` (검색 후 선택 시) |
| `bean_catalog_search_empty` | F2-miss (검색 결과 0건) 노출 | `search_query`, `from` |

**도출 메트릭 (Amplitude에서 계산, LIFE-8 발화 후)**
- catalog hit율 = `bean_catalog_selected` / `bean_catalog_picker_opened` → **H_J5 가설 2**
- F2-miss 비율 = `bean_catalog_search_empty` / `bean_catalog_picker_opened` → seed 갱신 우선순위 신호
- 검색어 → seed 추가 후보 (운영자 수집)

### Record (소비·브루잉 기록 — H2 계열) — 스프린트 04부터

| event | 언제 | properties |
|---|---|---|
| `record_created` | 기록 저장 완료 | `record_id`, `bean_ids: string[]` (블렌딩 대응), `total_grams`, `cups`, `brewed_at`, `logged_at`, `delay_hours`, `recipe_id: number\|null` |
| `record_updated` | 기록 수정 | `record_id`, `changed_fields: string[]` |
| `record_deleted` | 기록 삭제 (hard delete) | `record_id` |
| `record_viewed` | 기록 상세/리스트에서 열어봄 | `record_id`, `target_user_id`, `is_cross_user` (열람자 ≠ 작성자), `record_age_days` |

> **LIFE-5 (2026-05-07) 변경**: `record_created`에서 `recipe_param_count`, `has_taste_note`, `taste_note_length`, `has_rating` 제거. 003부터 빠른 기록은 양만이라 항상 false/0이며, 맛 노트는 별도 `taste_note_created` 이벤트로 분리. recipe는 LIFE-6에서 catalog 도입 시 재설계.
> **LIFE-6 (2026-05-08) 변경**: `record_created`에 `recipe_id` 추가 (Recipe catalog 도입). `recipe_param_count`는 부활 X — recipe 식별자만으로 충분.

### Recipe (brewing 프리셋 — H2.1/H2.2 계열) — LIFE-6 도입

| event | 언제 | properties |
|---|---|---|
| `recipe_created` | wizard 저장 완료 (신규) | `recipe_id`, `method`, `has_name: bool`, `equipment_count: int`, `stage_count: int` (pour-over만, 그 외 0) |
| `recipe_used` | record 생성/수정 시 recipe_id 변경 발생 | `recipe_id`, `method`, `source: 'quick_record'\|'record_detail'` |
| `equipment_created` | F1b 사용자 직접 등록 성공 | `equipment_id`, `type` |

**도출 메트릭**
- `recipe_used` by recipe_id → **프리셋 수렴 가정 검증** (10개 이내?). 카페별 unique recipe_id 분포로 base 레시피 페르소나 정합 측정
- `equipment_created` 빈도 → seed 카탈로그 부족 신호 (사용자 등록이 잦으면 admin 보강)
- `recipe_created.stage_count` → 입력 부담 지표 (너무 높으면 wizard W4 단순화 검토)

> **인프라 상태 (LIFE-6 시점)**: 003과 동일 — apps/app에 analytics SDK 미도입. wizard·picker에 발화 wrapper 박지 않음. SDK 도입 ticket에서 일괄 wire-up 예정.


### TasteNote (맛 노트 — H2.3/H2.4 계열) — LIFE-5 도입

| event | 언제 | properties |
|---|---|---|
| `taste_note_created` | 맛 노트 저장 완료 (입력 시트 추가 모드) | `record_id`, `cafe_id`, `taste_note_id`, `has_rating: bool`, `has_memo: bool`, `memo_length: int`, `delay_hours_from_record` (`record.brewed_at` → `now`) |

**미발화 (LIFE-5 결정 — 미래 ticket에서 추가)**
- `taste_note_updated`, `taste_note_deleted` — 003에서는 발화 안 함

**도출 메트릭**
- `delay_hours_from_record` → **H2.3 (레시피·맛 지연 입력) 직접 측정** — record 시점 vs 맛 노트 입력 시점 차이
- `taste_note_created` by 와이프 user_id → **H2.4 (공동 멤버 참여)** 신호 (와이프 자발 작성 빈도)
- `has_rating` / `has_memo` → 입력 형태 분포 (별점만? 메모만? 둘 다?)

> **인프라 상태 (LIFE-5 시점)**: apps/app에 amplitude SDK / 공통 track wrapper 미도입. `useTasteNoteCreate.onSuccess`에 `TODO(analytics)` placeholder 주석으로 발화 위치만 박아둠. SDK 도입은 별도 Tech-debt ticket 예정.

**핵심 속성**
- `delay_hours = logged_at - brewed_at` → **H1.2 / H2.3 지연 측정의 핵심**
- `is_cross_user` → **H2.2 상호 조회율** (열람자.user ≠ record.user)
- `has_taste_note` (boolean) → **H2.4 맛 메모 참여 신호**
- `taste_note_length` → PII 원문 대신 길이로 참여 강도 측정
- `has_rating` (boolean) → rating 채움 여부
- `record_age_days` → 재조회 패턴 (과거 n일 이전 기록을 보는가)
- `recipe_param_count` → recipe JSON의 non-null 필드 수 (레시피 상세도 지표)

### Notification (ROP 알림)

| event | 언제 | properties |
|---|---|---|
| `notification_sent` | 서버 스케줄러 발송 | `notification_type: "rop_alert"`, `bean_id`, `rop_progress` |
| `notification_opened` | 알림 탭해서 앱 진입 | `notification_type`, `bean_id`, `time_to_open_hours` |
| `notification_dismissed` | 알림 스와이프 삭제 (가능한 플랫폼만) | `notification_type`, `bean_id` |

### App Lifecycle

| event | 언제 | properties |
|---|---|---|
| `app_opened` | cold/warm start | `is_first_open`, `session_id`, `cold_start: boolean` |
| `app_backgrounded` | 백그라운드 진입 | `session_duration_sec` |
| `screen_viewed` | 화면 전환 | `screen_name`, `previous_screen` |

---

## User Properties 스키마

| property | type | 갱신 시점 |
|---|---|---|
| `email` | string (hash 권장) | 가입 |
| `display_name` | string | 가입/수정 |
| `signed_up_at` | ISO datetime | 가입 |
| `cafe_id` | string | cafe_created / cafe_joined |
| `cafe_role` | "admin" \| "member" | cafe 변경 시 |
| `cafe_member_count` | int | cafe 인원 변경 시 |
| `beans_active_count` | int | bean_added / bean_finished / bean_archived |
| `records_total_count` | int | record_created / record_deleted |
| `last_record_at` | ISO datetime | record_created |
| `last_active_at` | ISO datetime | app_opened |

---

## 가설별 신호 매핑

| 가설 | 주요 이벤트 | 도출 메트릭 |
|---|---|---|
| **H1.1** 원두 유지 | `bean_finished`, `record_created` | `bean_gap` = 0 (공백 일수) |
| **H1.2** 소비 기록 지연 | `record_created.delay_hours` | 당일 기록률 = `delay_hours < 24` 비율 > 70% |
| **H2.1** 개인 비교·학습 | `record_viewed` (record_age_days > n) | 재조회율 = `record_viewed` / `record_created` |
| **H2.2** 공동 공유 | `record_viewed` (is_cross_user=true) | 상호 조회율 |
| **H2.3** 레시피·맛 지연 | `record_created` (has_taste_note, delay_hours) | 당일 기록률 > 80%, 맛 메모 동반율 > 80% |
| **H2.4** 공동 멤버 참여 | `record_created` (by 공동 유저) | 공동 유저 주 1회+ 맛 메모 기록 |
| **북극성 (참조 활성 홈카페)** | `app_opened`, `record_viewed`, `record_created` | WAU 중 기록 참조 행동 있는 홈카페 비율 |

---

## 데이터 품질 원칙

1. **의도 있는 이벤트만** — `screen_viewed`는 자동 수집, CTA 클릭은 "결과" 이벤트로 통합 (예: `bean_add_clicked` 대신 `bean_added`)
2. **실패 이벤트도 로깅** — `record_create_failed`, `auth_signup_failed` 등 funnel drop 분석용
3. **PII 원문 금지** — 이메일은 해시, 맛 메모는 `has_taste_note: bool` + `taste_note_length: int`만. 원문은 프로덕션 DB에만
4. **스키마 변경은 추가만** — property 이름 변경 금지 (히스토리 단절). 새 속성 추가하고 기존 deprecate
5. **환경 분리** — dev / prod Amplitude project 분리. 개발 중 테스트 이벤트가 지표 오염시키지 않게
6. **초기 1~2주 수동 오라클** — 본인 메모 vs 앱 로그 대조로 누락·중복 검증 (05 원칙). 이후 중단
7. **시각 두 종류 명시** — `brewed_at`(선언된 행동 시점) vs `logged_at`(입력 시점, 자동). 지연 측정의 핵심이라 혼동 금지

---

## 스프린트별 구현 범위

| 스프린트 | 도입 이벤트 |
|---|---|
| **03** | `auth_*`, `cafe_*`, `bean_*`, `notification_*`, `app_*`, `screen_viewed` |
| **04** | `record_created` / `updated` / `deleted` / `viewed` (개인 시나리오) |
| **05** | `record_viewed.is_cross_user` 시나리오 검증, 공동 홈카페 funnel |

스프린트 03 구현 시 공통 인프라(SDK 세팅, identify, common properties, 환경 분리)는 한 번에 끝내고, 스프린트마다 이벤트만 추가.

## 가드레일 지표 측정 범위 (스프린트별)

06 북극성의 가드레일(`bean_gap` / 당일 기록률(원두) / 당일 내 기록률(레시피·맛) / 주간 기록 성립) 중 스프린트 03 시점에서 측정 가능한 것은 **`bean_gap`뿐**. 이유는 `record_created` 이벤트가 04부터 도입되기 때문.

| 가드레일 지표 | 필요 이벤트 | 측정 가능 시점 |
|---|---|---|
| `bean_gap` 0 일수 비율 | `bean_finished`, `record_created` (`brewed_at`) | 04부터 (record_created가 도입되는 시점) |
| 당일 기록률 (원두 소비) | `record_created.delay_hours` | 04부터 |
| 당일 내 기록률 (레시피·맛) | `record_created` (`has_taste_note`, `delay_hours`) | 04부터 |
| 주간 기록 성립 | `record_created` 주간 수 | 04부터 |

**→ 스프린트 03의 측정 범위:**
- H1.1 메커니즘 신호 중 `bean_added` / `bean_finished` / `bean_archived` 기반 기본 활동량만
- 본격 가드레일 추적은 04 스프린트부터
- 03은 "측정 인프라(Amplitude SDK, identify, 공통 속성, 환경 분리)를 깔고 이벤트 스키마가 실제로 흐르는지 검증"이 핵심

---

## 다음

1. **SDK 연동 가이드** — React Native (클라이언트) + NestJS (서버 이벤트: `notification_sent`, `bean_finished` 배치 판정)
2. **스프린트 03 기능 명세에 이벤트 포인트 명시** — 각 화면/API에 어느 이벤트가 찍히는지 매핑
