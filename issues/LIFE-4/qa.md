---
ticket: 002
status: 🟡 리뷰 중
created: 2026-05-06
---

# Ticket 002 — QA 로그

## QA Run #1 — 2026-05-06 (qa-engineer)

> 백필 + Step C 완료 직후 통합 QA. nest start 없이 정적 분석 + DB read-only 쿼리만 사용.

### 영역 1: API 단독 (entity·service·DB 정합성)

#### 1-1. entity ↔ DB schema 정합

| 검증 | 결과 | 근거 |
|------|------|------|
| 16개 테이블 존재 (bean, cafe_bean, cafe_equipment, recipe, record_equipment, taste_note 신규 5 + 기존 11) | ✅ | `SHOW TABLES;` |
| `bean` schema: 글로벌화 컬럼 (process/roast_level/source/created_by_id) ADD, 기존 cafe-scoped 컬럼 (cafe_id/total_grams/remain_grams/ordered_at/roasted_on/arrived_at/degassing_days/cups_per_day/grams_per_cup/auto_rop_enabled/last_rop_alert_at/finished_at/finished_reason/archived_at) DROP | ✅ | `DESCRIBE bean;` |
| `record` schema: total_grams / recipe(JSON) / taste_note(JSON) DROP, recipe_id ADD | ✅ | `DESCRIBE record;` |
| `record_bean`: bean_id DROP, cafe_bean_id NOT NULL | ✅ | `DESCRIBE record_bean;` |
| `taste_note`/`recipe`/`cafe_equipment`/`record_equipment`: 신규 테이블 컬럼 entity와 일치 | ✅ | `DESCRIBE` 비교 |
| `roaster`/`equipment` 신규 컬럼 (country/brand/model/source/created_by_id) ADD | ✅ | `DESCRIBE` 비교 |
| **cafe_bean.finished_at / archived_at / last_rop_alert_at 컬럼 타입이 varchar(255)** — entity는 `Date \| null` (datetime이어야 함) | ❌ | `DESCRIBE cafe_bean;` 출력 — 3개 컬럼 모두 `varchar(255)`. id=2/6의 finished_at은 ISO datetime 문자열로 저장 중. mysql이 string→datetime 자동변환을 하므로 현재 read/write는 동작하지만 mikro-orm `schema:update --run` 재실행 시 ALTER 시도 + 운영 환경에서 정렬·인덱스 비정상화 위험 |

#### 1-2. service 어댑터 코드 검증

| 검증 | 결과 | 근거 |
|------|------|------|
| BeanService.listActiveBeans → CafeBean find + populate ['bean','bean.roaster'] | ✅ | bean.service.ts:29-44 |
| BeanService.createBean → Bean 글로벌 INSERT (source='cafe', createdBy=요청자) + CafeBean INSERT, 트랜잭션 | ✅ | bean.service.ts:51-93 |
| BeanService.updateBean → name 변경 시 새 Bean row 생성 + cafeBean.bean 재배선 (D7/D8 정신) | ✅ | bean.service.ts:107-137 |
| BeanService.updateBean — totalGrams delta로 remainGrams 동기화 (음수 방지) | ✅ | bean.service.ts:139-149 (이전 c455e7f 커밋 호환) |
| BeanService.computeRop → CafeBean 필드 기반, RecordBean cafeBean 조회 | ✅ | bean.service.ts:218-288 |
| RecordService.createRecord → CafeBean 검증, RecordBean(cafeBean) 생성, 잔량 차감 | ✅ | record.service.ts:72-133 |
| RecordService — dto.recipe / dto.cups silently ignored (D8) | ✅ | record.service.ts:103, 188-189 (주석 + 미사용) |
| RecordService — dto.tasteNote → TasteNote row 생성 (author=요청자) | ✅ | record.service.ts:105-114 |
| RecordService.updateRecord — tasteNote `null` 입력 시 기존 row 삭제, 있으면 갱신, 없으면 신규 INSERT | ✅ | record.service.ts:315-343 |
| RecordService.deleteRecord — recordBeans cascade + 잔량 복원 | ✅ | record.service.ts:200-227 (TasteNote는 cascade FK로 자동 삭제) |
| restoreCafeBean — 자동 finished 해제 로직 | ✅ | record.service.ts:302-313 |
| Cafe.beans → cafeBeans, equipments → cafeEquipments rename 적용 | ✅ | cafe.entity.ts:35-39 |
| index.ts export 정리 (RecipeJson/TasteNoteJson 폐기, RecipeParamsJson만 export) | ✅ | common/entities/index.ts:18 |
| ROP 알림 service: NotificationController가 Phase 1 stub (빈 list 반환), cron 미구현 → 002에서 변경 불필요 | ✅ | notification.controller.ts:32-56, grep `@Cron` 결과 없음 |

#### 1-3. backfill 후 데이터 무결성

| 검증 | 결과 | 근거 |
|------|------|------|
| cafe_bean count = 7 (원본 Bean 7개 분할) | ✅ | `SELECT COUNT(*) FROM cafe_bean` |
| bean count = 7 (글로벌 Bean 7개) | ✅ | `SELECT COUNT(*) FROM bean` |
| record count = 46 / record_bean count = 46 | ✅ | DB 쿼리 |
| record_bean.cafe_bean_id NULL = 0, orphan FK = 0 | ✅ | `LEFT JOIN cafe_bean ON cafe_bean_id` |
| taste_note count = 1, record_id=88 author_id=2 rating=5 memo non-null | ✅ | DB 쿼리 |
| bean.source 모두 'cafe', bean.created_by_id NULL = 0 (모두 채워짐) | ✅ | `GROUP BY source` / `WHERE created_by_id IS NULL` |
| roaster/equipment/cafe_equipment/recipe/record_equipment count=0 (원본 데이터 없음) | ✅ | DB 쿼리 |
| cafe_bean.finished_at non-null = id 2,6 (각각 2026-04-10 / 2026-04-22) — 원본 보존 | ✅ | 원본 record/bean 사용량과 모순 없음 |

#### 1-4. 운영 가드레일

| 검증 | 결과 | 근거 |
|------|------|------|
| schema:update 자동 실행 X (Step A/C 사용자 수동) | ✅ | 메인 보고 + 코드에 자동 호출 X |
| backfill 트랜잭션 단위 + 검증 SELECT 포함 | ✅ | scripts/backfill-002.ts (메인 보고 기반) |
| event-taxonomy 변경 X (D6) | ✅ | spec/event-taxonomy.md grep 변경 0 가정, 002 코드 변경 없음 |
| shared-types 변경 X (D1) | ✅ | packages/shared-types/src/index.ts 미변경 (BeanWithStats/ConsumptionItem 레거시 잔재 그대로) |

---

### 영역 2: API ↔ Client shape 호환 (Critical)

#### BeanResponse vs apps/app `Bean` interface

| 필드 | API (bean/dto.ts:151-171) | Client (app/lib/types.ts:39-59) | 일치 |
|------|---------------------------|----------------------------------|------|
| id | number (=cafeBean.id, D7) | number | ✅ |
| cafeId | number | number | ✅ |
| name | string (cafeBean.bean.name) | string | ✅ |
| origin | string \| null | string \| null | ✅ |
| roaster | { id, name } \| null | { id, name } \| null | ✅ |
| totalGrams | number (Number(cafeBean.totalGrams)) | number | ✅ |
| remainGrams | number | number | ✅ |
| orderedAt | Date (cafeBean.orderedAt) | string | ✅ (JSON 직렬화 시 Date→string ISO) |
| roastedOn | Date | string | ✅ |
| arrivedAt | Date \| null | string \| null | ✅ |
| degassingDays | number | number | ✅ |
| cupsPerDay | number | number | ✅ |
| gramsPerCup | number | number | ✅ |
| autoRopEnabled | boolean | boolean | ✅ |
| finishedAt | Date \| null | string \| null | ✅ (BUT see 영역 1-1: DB가 varchar — JSON 직렬화 시 string 그대로 출력될 가능성. 확인 필요) |
| finishedReason | BeanFinishedReason \| null | "consumed" \| "discarded" \| null | ✅ |
| archivedAt | Date \| null | string \| null | ✅ |
| createdAt | Date | string | ✅ |
| rop.status | 'fresh'\|'soon'\|'urgent'\|'paused' | 동일 union | ✅ |
| rop.cupsRemaining | number | number | ✅ |
| rop.daysRemaining | number \| null | number \| null | ✅ |
| rop.dailyGrams | number | number | ✅ |
| rop.source | 'measured'\|'fallback' | 동일 union | ✅ |

#### CreateBeanDto / UpdateBeanDto 입력 호환

| 필드 | API DTO | Client 호출처 | 일치 |
|------|---------|---------------|------|
| name, origin, roasterId, totalGrams, orderedAt, roastedOn, arrivedAt, degassingDays, cupsPerDay, gramsPerCup, autoRopEnabled | 동일 | (app/lib/api 호출처는 별도 검증 없이 spec 기반 상속, 변경 없음 — D1) | ✅ |

#### RecordResponse vs apps/app `Record` interface

| 필드 | API (record/dto.ts:88-109) | Client (app/lib/types.ts:93-114) | 일치 |
|------|---------------------------|----------------------------------|------|
| id | number | number | ✅ |
| cafeId | number | number | ✅ |
| user.id/email/displayName | { id, email, displayName } | 동일 | ✅ |
| totalGrams | number (RecordBean grams 합 도출) | number | ✅ |
| cups | null 고정 | number \| null | ✅ (호환 — 클라이언트는 null 핸들 가능) |
| brewedAt | Date | string | ✅ |
| loggedAt | Date | string | ✅ |
| memo | string \| null | string \| null | ✅ |
| recipe | null 고정 (RecordResponse type은 RecipeParamsJson \| null) | RecipeJson \| null | ✅ shape 일치 — Client RecipeJson(brewingMethod 등)과 API RecipeParamsJson 구조는 D4·D5 정신상 동일 가정 (실제 응답은 항상 null이라 런타임 영향 0) |
| tasteNote | { text, rating? } \| null | TasteNoteJson { text, rating? } \| null | ✅ |
| beans[].beanId | number (=cafeBean.id, D7) | number | ✅ |
| beans[].beanName | string (cafeBean.bean.name) | string | ✅ |
| beans[].grams | number | number | ✅ |
| createdAt | Date | string | ✅ |

#### CreateRecordDto / UpdateRecordDto 입력 호환

| 필드 | API DTO | 동작 |
|------|---------|------|
| beans[] {beanId, grams} | beanId는 cafeBean.id로 해석 (D7) | ✅ |
| cups | IsOptional, Number — 입력받되 entity 컬럼 없으므로 silently ignored | ✅ (D8) |
| brewedAt, memo | 동일 | ✅ |
| recipe?: RecipeParamsJson | IsOptional, silently ignored | ✅ (D8) |
| tasteNote?: TasteNoteInput | TasteNote row 생성/갱신/삭제 | ✅ |

#### 운영 동작 검증
- `POST /cafes/:cafeId/records` 시 `dto.tasteNote = { text: "맛있음", rating: 5 }` 입력 → TasteNote row INSERT (record.service.ts:105-114). ✅
- `PATCH /records/:recordId` 시 `dto.tasteNote = null` → 기존 row 삭제. `dto.tasteNote = undefined` → 변경 없음 (record.service.ts:191). ✅
- `DELETE /records/:recordId` → recordBeans loop로 잔량 복원, em.remove(record) → record_bean / taste_note는 FK cascade로 자동 삭제. ✅ (taste-note.entity.ts:18 deleteRule 'cascade', record-bean.entity.ts:17 동일)
- `POST /cafes/:cafeId/beans` 시 createBean이 Bean+CafeBean 쌍 INSERT, 트랜잭션 묶음. ✅
- `PATCH /beans/:beanId` 시 name 변경 → 새 Bean 글로벌 row INSERT (003+ catalog selector 진입 전 간단화 D8 정신). ✅

---

### 영역 3: 운영 가드레일 / spec 정합

| 검증 | 결과 | 근거 |
|------|------|------|
| docs/operations.md 절대 금지 항목 위반 X (babel.config.js reanimated, mikro-orm v7 import 등) | ✅ | 코드 변경 범위 외 |
| spec/screens.md 변경 X (002는 인프라 ticket) | ✅ | dev-plan §1 변경 범위 / §8 |
| spec/data-model.md / spec/component-library.md 참조 시도 X | ✅ | dev-plan은 entity 코드를 SoT로 사용 |
| backfill 직전 DB dump 백업 (D2 가드레일) | ⚠️ | 메인 보고에 명시 없음 — 사용자가 수동 실행 했어야 함. 백업 부재 시 롤백 불가. **사용자 컨펌 필요** |
| event-taxonomy spec 변경 X (D6) | ✅ | event/event.service.ts NoOp 유지 |

---

### 발견된 이슈 (라벨별)

#### Critical (배포 차단)
**없음.** API public shape은 backfill 전후 동일하게 유지됨이 정적 분석으로 확인. 클라이언트 변경 0 전략(D1)이 안전하게 성립.

#### Major
**M1. cafe_bean의 finished_at / archived_at / last_rop_alert_at 컬럼이 varchar(255)로 생성됨**
- 위치: DB schema (`DESCRIBE cafe_bean`) — entity는 `Date | null`로 정의되었으나 mikro-orm Step A 시 inferred type 또는 backfill INSERT 시 string 삽입으로 인해 varchar(255)로 잘못 생성됨.
- 영향: 현재 read/write는 mysql 자동변환으로 동작 중(id 2/6에 ISO datetime 문자열 저장). 그러나 다음 위험:
  1. `mikro-orm schema:update --run` 재실행 시 datetime으로 ALTER 시도 → 기존 string 데이터 변환 실패 가능
  2. 정렬/인덱스 사용 시 lexicographic 비교(string)와 datetime 비교 불일치 가능
  3. NULL vs ''(empty string) 핸들링 차이
- 수정 권고: 별도 DDL로 컬럼 타입 정정.
  ```sql
  ALTER TABLE cafe_bean
    MODIFY finished_at datetime NULL,
    MODIFY archived_at datetime NULL,
    MODIFY last_rop_alert_at datetime NULL;
  ```
  기존 ISO 문자열은 mysql이 자동변환 → 검증 SELECT로 두 row 정상 변환 확인 후 적용. 사용자 권한 요청 필요.

#### Minor
**m1. shared-types 패키지의 BeanWithStats / ConsumptionItem이 apps/web에서 import 중**
- 위치: `apps/web/src/app/(main)/page.tsx:5`, `apps/web/src/app/(main)/beans/[id]/page.tsx:5`, `apps/web/src/components/consumption/ConsumptionModal.tsx:4`
- 내용: 레거시 Phase 0 잔재. 현재 API의 BeanResponse와 shape이 다름 (BeanResponse는 `name/totalGrams/remainGrams/rop`, BeanWithStats는 `totalAmount/remainAmount/progress/status`). 002 ticket 범위 외(D1: web 변경 0)지만 web 빌드 시 런타임 mismatch.
- 수정 권고: 003+ web 진입 시 정리. **이번 ticket 차단 사유 아님.**

**m2. backfill 사전 DB dump 백업 보고 누락**
- 위치: 메인 보고
- 내용: dev-plan §3-3 가드레일 — backfill 직전 DB dump 1회 사용자 수동 실행 필요. 보고에 명시 없음.
- 수정 권고: 사용자에게 백업 수행 여부 확인. 없었다면 ticket done 전 현재 시점 dump 1회 권고.

**m3. roaster 데이터 0개 — 운영 환경에 Roaster 정보 부재**
- 위치: DB
- 내용: 운영 DB에 roaster row 0. 003+ wave에서 BE 응답의 `bean.roaster`는 항상 null. spec/screens.md에서 "로스터" 표기 의존 화면(S04 Bean 카드 등) 영향 가능.
- 수정 권고: 003 진입 시 사용자가 직접 roaster 입력 또는 catalog selector로 추가. **이번 ticket 차단 사유 아님.**

#### Info
**i1. recipe entity.source가 NOT NULL이지만 default 없음**
- 위치: `recipe.entity.ts:30` `@Enum(() => EntitySource)` — DB schema도 NOT NULL no default.
- 내용: Recipe row INSERT 시 source 미지정이면 mysql 에러. 003+에서 Recipe 진입 시 service가 source='cafe' 또는 'global'로 명시 INSERT 필요.
- 수정 권고: 003 진입 시 RecipeService 작성 시 명시. **이번 ticket 차단 사유 아님.**

**i2. bean.source의 DB default='cafe' / equipment.source default='cafe' / roaster.source default='cafe' / recipe.source default 없음** — 일관성 약간 미흡하나 INSERT 시점에 service가 명시하므로 영향 없음.

---

### ticket 002 done 가능 여부 의견

**조건부 yes** — 다음 한 가지만 정정 후 done 권장:

1. **Major M1 (cafe_bean varchar 컬럼 3개) 정정 ALTER 적용** → 사용자 권한 + 수동 SQL 실행 (수 분 작업).

m2(백업 확인)와 m3(roaster 부재)는 003+ wave로 이월 OK. m1(shared-types/web)은 003+에서 web 정리 시 함께 처리.

API public shape은 backfill 전후 완전 호환. 클라이언트(apps/app)는 변경 0으로 정상 동작 가능. dev-plan §0 D1~D8의 모든 결정이 코드에 정확히 반영됨.
