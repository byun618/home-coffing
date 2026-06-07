---
ticket: 002
status: 🟡 리뷰 중
created: 2026-05-06
---

# Ticket 002 — Dev Plan

> **앵커:** [./ticket.md](./ticket.md), [../../spec/screens.md](../../spec/screens.md), [../../spec/event-taxonomy.md](../../spec/event-taxonomy.md), [../../spec/design-system.md](../../spec/design-system.md), [../../spec/design.pen](../../spec/design.pen)
> **영향 screens.md 라인:** 002는 인프라 ticket — 신규 화면 라인 추가 X. 기존 라인의 "사용 데이터" 변경도 spec엔 적지 않음 (코드 SoT). screens.md 갱신은 003·004·005 wave에서 진행.

---

## 0. 핵심 결정 (작성자 사전 정리 — 사용자 컨펌 대상)

### D1. 클라이언트 변경 범위 — **0** (API shape 호환 유지 전략)

ticket.md의 "Big bang (D4 정신)"은 **데이터 모델 한 번 갈아엎기**를 의미하지 클라이언트 동시 갈아엎기를 의미하지는 않는다고 해석. 근거:
- 003~005에서 wave별 UX 진입 → 002 머지 시점은 003 이전
- screens.md 라인이 003~005 wave에 분포 → 002만 머지된 직후엔 클라이언트 동작은 그대로여야 함
- 와이프와 공동 사용 중 → 클라이언트 동작 단절 회피

**전략:** 002에서 BE 데이터 모델만 16 entity로 재배치. **public API endpoint·DTO·Response shape은 동일 유지**. 서비스 레이어가 새 모델 ↔ 기존 shape 어댑터 역할. 클라이언트(`apps/app`, `apps/web`)·`packages/shared-types`는 **수정 0**.

→ 003 wave에서 새 shape으로 점진 전환.

### D2. 데이터 backfill — **별도 스크립트 (mikro-orm migration 아님)**

운영 데이터(본인+와이프 사용 중)는 보존. schema:update로 새 테이블/컬럼 생성 후, 별도 backfill 스크립트(`apps/api/src/scripts/backfill-002.ts` — ts-node로 수동 실행)로:
- 기존 `Bean (Cafe-scoped)` row → `Bean (Global)` row 1개 + `CafeBean` row 1개로 분할 (1:1 — 이번 단계에선 dedupe 안 함)
- 기존 `Equipment (Cafe-scoped)` row → `Equipment (Global)` + `CafeEquipment` 분할
- 기존 `Roaster` row에 `source='cafe'`, `createdBy=null` 채움
- 기존 `RecordBean.bean FK` → 새 `CafeBean.id` 재배선
- 기존 `Record.tasteNote JSON`이 있으면 → `TasteNote` row 1개 (author=record.user, createdAt=record.brewedAt)
- 기존 `Record.recipe JSON`은 → 폐기 (Recipe 글로벌화는 003+에서 사용자가 selector로 매핑. 여기선 데이터 손실 허용 — 본인+와이프 환경에서 재입력 가능. 사용자 컨펌 필요)

→ 운영 가드레일 차원에서 **사전 DB 백업 dump 1회** 후 진행.

### D3. 컬럼 drop은 schema:update 자동 — 단, 순서 중요

`Bean.cafe`, `Bean.totalGrams/remainGrams/.../finishedReason`, `Equipment.cafe/type` 등은 새 위치(CafeBean, Equipment global·CafeEquipment)로 이전. backfill 완료 **전**에 schema:update이 자동 drop하면 데이터 유실. 따라서:
1. schema:update은 **추가형(ADD COLUMN/CREATE TABLE)만 먼저**. (직접 SQL 또는 단계 분리)
2. backfill 스크립트 실행
3. schema:update 재실행 → drop 컬럼 정리

이 단계 분리를 사용자가 수동 실행 (자동화 X).

### D4. Recipe entity의 method enum

ticket의 `Recipe.method (enum)` — 기존 RecipeJson.brewingMethod와 동일 enum 채택:
`v60` | `switch` | `espresso` | `moka` | `aeropress` | `french_press` | `other`

### D5. 추가 메타 필드 (Q3 deferred)

ticket Q3 (variety/altitude/imageUrl 등) — **이번엔 추가 X**. 현재 코드에 없는 메타는 003+ wave 진입 시 결정.

추가하는 것만:
- `Bean.process: string | null` — washed/natural/honey 등 자유 텍스트 (ticket 모델에 명시)
- `Bean.roastLevel: string | null` — light/medium/dark 등 자유 텍스트 (ticket 모델에 명시)
- `Bean.source: 'cafe' | 'global'` — 글로벌화 ready 플래그
- `Bean.createdBy: User | null` — 글로벌 catalog ownership
- 동일 패턴: Equipment, Roaster, Recipe에 `source`, `createdBy`

### D6. event-taxonomy 변경

현재 `apps/api/src/event/event.service.ts`는 NoOp wrapper, 클라이언트에서 호출 거의 없음 (`grep -r "track("` 결과 없음). spec/event-taxonomy.md 변경 **이번 ticket 범위 외**. 003+ wave에서 새 record/bean 이벤트 발화 시 갱신.

---

## 1. 변경 범위 요약

### API (`apps/api`)
- **신규 엔티티 5개**: Recipe, CafeBean, CafeEquipment, RecordEquipment, TasteNote
- **변경 엔티티 4개**:
  - `Bean` — Cafe-scoped → Global (cafe/totalGrams/remainGrams/dates/ROP/finishedReason 제거 → CafeBean으로 이전, source/createdBy/process/roastLevel 추가)
  - `Equipment` — Cafe-scoped → Global (cafe 제거 → CafeEquipment으로 이전, brand/model/source/createdBy 추가)
  - `Roaster` — source/createdBy 추가
  - `Record` — recipe JSON / tasteNote JSON / totalGrams 제거, recipe FK(nullable) 추가
- **변경 엔티티 (FK 재배선)**:
  - `RecordBean.bean FK` → `RecordBean.cafeBean FK` (이름·타입 변경)
  - `Cafe.beans` Collection → `Cafe.cafeBeans`로 rename (Cafe.equipments도 동일)

→ 기존 12 → 새 16 (+5 신규, -1 없음, 4 변경).

### App (`apps/app`)
- **변경 0** (D1 결정 — public API shape 유지)

### Web (`apps/web`)
- **변경 0** (D1 결정)

### shared-types (`packages/shared-types`)
- **변경 0** (D1 결정)

### 데이터
- 새 테이블 생성 + 기존 데이터 backfill + 기존 컬럼 drop (D2·D3)

### 이벤트
- **변경 0** (D6 결정)

---

## 2. API 작업 — 엔티티

### 2-1. 신규 엔티티

**Recipe** (`apps/api/src/common/entities/recipe.entity.ts`)
- id (PK)
- name (length 120)
- method (enum) — D4 enum 채택
- params (JSON) — RecipeParamsJson 인터페이스로 코드 type 정의 (현재 RecipeJson 구조 재활용 — brewingMethod 필드만 빼고)
- source ('cafe' | 'global')
- createdBy (User, nullable, deleteRule: 'set null')
- createdAt
- (Phase 3 ready: name unique 안 둠 — 사용자별 동명 허용)

**CafeBean** (`apps/api/src/common/entities/cafe-bean.entity.ts`)
- id (PK)
- cafe (Cafe, deleteRule: 'cascade')
- bean (Bean, deleteRule: 'restrict' — Bean 글로벌이므로 함부로 삭제 금지)
- totalGrams (decimal(10,1))
- remainGrams (decimal(10,1))
- orderedAt (date)
- roastedOn (date)
- arrivedAt (date, nullable)
- degassingDays (default 7)
- cupsPerDay (decimal(10,2), default 2)
- gramsPerCup (decimal(10,2), default 20)
- autoRopEnabled (default true)
- finishedAt (datetime, nullable)
- finishedReason (enum BeanFinishedReason, nullable)
- archivedAt (nullable)
- lastRopAlertAt (nullable)
- createdAt
- recordBeans (OneToMany)

**CafeEquipment** (`apps/api/src/common/entities/cafe-equipment.entity.ts`)
- id, cafe, equipment, createdAt, recordEquipments (OneToMany)

**RecordEquipment** (`apps/api/src/common/entities/record-equipment.entity.ts`)
- id, record (FK, deleteRule: 'cascade'), cafeEquipment, @Unique(['record', 'cafeEquipment'])

**TasteNote** (`apps/api/src/common/entities/taste-note.entity.ts`)
- id, record (FK, deleteRule: 'cascade'), author (User), rating (1-5, nullable), memo (length 200, nullable), createdAt

### 2-2. 변경 엔티티

**Bean (Global로 변경)**
- 제거: cafe, totalGrams, remainGrams, orderedAt, roastedOn, arrivedAt, degassingDays, cupsPerDay, gramsPerCup, autoRopEnabled, lastRopAlertAt, finishedAt, finishedReason, archivedAt, recordBeans
- 유지: id, name, origin, roaster, createdAt
- 추가: process (length 60, nullable), roastLevel (length 30, nullable), source (enum 'cafe'|'global'), createdBy (User, nullable, deleteRule 'set null')
- 신규 OneToMany: cafeBeans

**Equipment (Global로 변경)**
- 제거: cafe
- 유지: id, name, type, createdAt
- 추가: brand (length 60, nullable), model (length 80, nullable), source, createdBy
- 신규 OneToMany: cafeEquipments

**Roaster**
- 추가: country (length 60, nullable), source, createdBy
- (ticket 모델에 명시된 country 포함)

**Record**
- 제거: totalGrams, recipe(JSON), tasteNote(JSON)
- 추가: recipe (Recipe, nullable, deleteRule 'set null')
- 유지: id, cafe, user, brewedAt, loggedAt, memo, createdAt, recordBeans
- 신규 OneToMany: recordEquipments, tasteNotes
- export type RecipeJson/TasteNoteJson은 → 별도 type 파일(`apps/api/src/common/types/recipe-params.ts`)로 이동. RecipeJson은 RecipeParamsJson으로 rename, TasteNoteJson은 폐기 (entity로 대체).

**RecordBean**
- 제거: bean FK
- 추가: cafeBean (CafeBean, deleteRule 'restrict')
- 컬럼명 grams 유지
- @Unique(['record', 'cafeBean'])

**Cafe**
- collection rename: beans → cafeBeans, equipments → cafeEquipments
- records collection 유지

### 2-3. index.ts export

5개 신규 + RecipeMethod enum + BeanSource (또는 EntitySource) enum 추가. RecipeJson/TasteNoteJson type export 제거 (Record entity에서 더는 노출 안 함). 대신 RecipeParamsJson type만 export.

---

## 3. API 작업 — 마이그레이션 / Backfill

### 3-1. 단계 분리 (D3 핵심)

```
[Step A] schema:update로 신규 테이블/컬럼만 ADD
  → Bean에 process/roastLevel/source/createdBy ADD (nullable)
  → Equipment에 brand/model/source/createdBy ADD
  → Roaster에 country/source/createdBy ADD
  → CafeBean/CafeEquipment/Recipe/RecordEquipment/TasteNote 테이블 CREATE
  → Record.recipe_id ADD (nullable FK)
  → RecordBean.cafe_bean_id ADD (nullable FK, 임시)

[Step B] backfill 스크립트 실행 (apps/api/src/scripts/backfill-002.ts)
  → 본 dev-plan §3-2 절차

[Step C] schema:update 재실행 → drop 컬럼 정리
  → Bean.cafe_id, totalGrams, remainGrams, orderedAt, roastedOn, arrivedAt,
     degassingDays, cupsPerDay, gramsPerCup, autoRopEnabled,
     lastRopAlertAt, finishedAt, finishedReason, archivedAt DROP
  → Equipment.cafe_id DROP
  → Record.totalGrams DROP, Record.recipe(JSON), Record.tasteNote(JSON) DROP
  → RecordBean.bean_id DROP, cafe_bean_id NOT NULL 전환
```

3개 step 모두 사용자 권한 요청 후 수동 실행. 자동 실행 X.

### 3-2. backfill 스크립트 절차

```typescript
// apps/api/src/scripts/backfill-002.ts (개략)
// 1) Bean (Cafe-scoped) → Bean (Global) + CafeBean
//    - 각 row: 기존 Bean.id를 CafeBean.id로 보존하면 RecordBean FK 재배선이 단순.
//      (or: 기존 Bean row를 Bean Global로 그대로 재활용 + CafeBean 신규 row.
//       단 기존 Bean.id가 RecordBean.bean_id에 박혀 있으니, 새로 만들 CafeBean에
//       원래 Bean.id를 보존하기 어려움 → cafeBean.id는 신규 채번.)
//    실행 순서:
//      a. Bean 글로벌 row 신규 INSERT (source='cafe', createdBy = cafe owner의 user_id)
//         → bean_old_id_to_new_global_id 맵 보관
//      b. CafeBean INSERT (cafe_id, bean_id=새 글로벌, totalGrams 등 모두 이전)
//         → bean_old_id_to_cafe_bean_id 맵 보관
//      c. RecordBean UPDATE SET cafe_bean_id = (맵[bean_id])
//      d. (Optional) 기존 Bean row 자체는 글로벌화로 reuse — 하지만 cafe_id는 nullable로 두면 step C에서 자동 drop. 안전을 위해 새 row 생성 권장.
//
// 2) Equipment 동일 패턴
//
// 3) Roaster: source='cafe', createdBy = ? (없으면 null)
//
// 4) Record.tasteNote(JSON) → TasteNote row
//    - record.tasteNote != null인 경우만:
//      INSERT INTO taste_note (record_id, author_id, rating, memo, created_at)
//      VALUES (record.id, record.user_id, jsonRating, jsonText, record.brewed_at)
//
// 5) Record.recipe(JSON) → 폐기 (D2 결정 — 사용자 컨펌 필요)
//
// 6) Record.totalGrams → 폐기 (RecordBean.amountGrams 합으로 도출)
```

스크립트는 트랜잭션 단위로 실행. 실패 시 rollback. 진행 로그(table별 개수) stdout 출력.

### 3-3. 사전 DB 백업

backfill 직전 DB dump 1회. **사용자가 직접 실행** (`pnpm` 스크립트 또는 수동 mysqldump). dev-plan에서 자동화 X.

---

## 4. API 작업 — Service / Controller

### 4-1. BeanService (`apps/api/src/bean/`)
- 입력 shape (CreateBeanDto/UpdateBeanDto): **변경 X** (클라이언트 호환)
- 출력 shape (BeanResponse): **변경 X**
- 내부 구현 변경:
  - `listActiveBeans(cafeId)` → `em.find(CafeBean, { cafe: cafeId, archivedAt: null }, { populate: ['bean', 'bean.roaster'] })` 후 BeanResponse로 변환
  - `createBean(cafeId, dto)` → Bean 글로벌 row 생성(source='cafe', createdBy=요청자) + CafeBean 생성. dto.roasterId 있으면 Roaster lookup, 없으면 Bean.roaster=null.
    - **간단화**: 동일 cafe 내 동일 name+roaster의 Bean 글로벌이 이미 있으면 reuse? → **이번엔 항상 신규 Bean 생성**. dedupe는 003+ catalog selector 도입 시.
  - `getBean(beanId, userId)` → 클라이언트는 `beanId`로 호출 (실제로는 cafeBean.id). 내부에서 CafeBean lookup. **Bean 글로벌 id와 CafeBean.id가 다르므로 클라이언트가 어느 id를 쓰는지 일관성 유지 필요.**
    - 결정: **클라이언트가 보는 Bean.id = CafeBean.id** (D7 — 사용자 컨펌 필요. 핵심: 클라이언트는 cafe-scoped 뷰를 가졌고, 실제 글로벌 Bean은 BE 내부 디테일.)
  - `updateBean(beanId, userId, dto)` → CafeBean 업데이트. dto.name이 있으면 Bean 글로벌 row를 새로 만들거나(원본 글로벌 보호) reuse. **이번엔 Bean.name 변경 시 새 글로벌 row 생성 + CafeBean.bean FK 재배선** (간단화 — 003+에서 catalog selector 진입 시 재설계).
- ROP 계산 로직(`computeRopInfo` 등): CafeBean 필드로 동작 — 시그니처만 바꿈.

### 4-2. RecordService (`apps/api/src/record/`)
- 입력/출력 shape: **변경 X**
- 내부 구현:
  - `createRecord(cafeId, userId, dto)` →
    - dto.beans (`{beanId, grams}[]`)에서 beanId는 **CafeBean.id로 해석** (D7)
    - `em.find(CafeBean, { id: { $in }, cafe: cafeId })`로 검증
    - Record row 생성 (totalGrams, recipe JSON, tasteNote JSON 없음 — 컬럼 폐기됨)
    - RecordBean row 생성 (cafeBean FK)
    - **dto.tasteNote가 있으면 TasteNote row 생성** (author=요청자, createdAt=now)
    - **dto.recipe가 있으면? — 무시하고 그냥 진행** (Record.recipe FK 글로벌 매핑 모호. 003+ Recipe selector 진입 시 처리). **사용자 컨펌 필요 — D8**
  - `updateRecord` → 동일 원칙
  - `getRecord` / `listByCafe` → RecordResponse 변환:
    - `cups`: 폐기됐으나 Response에는 null 유지 (클라이언트 호환)
    - `totalGrams`: 폐기됐으나 Response에는 RecordBean grams 합 도출하여 채움 (클라이언트 호환)
    - `recipe`: null 고정 (Record.recipe FK는 003+ Recipe selector 도입 시 채움)
    - `tasteNote`: 첫 TasteNote row 1개를 `{text, rating}` shape으로 변환 (있으면). 클라이언트는 1:1 가정.
    - `beans[].beanId`: **cafeBean.id**로 채움 (D7)
- 잔량 차감/복원 로직(`deductBean`/`restoreBean`): Bean → CafeBean으로 시그니처만 바꿈.

### 4-3. CafeService 등 그 외
- `Cafe.beans` collection → `Cafe.cafeBeans`로 reference 수정
- `Cafe.equipments` → `Cafe.cafeEquipments`로 reference 수정
- 응답 shape에 영향 없음

### 4-4. notification (ROP 알림)
- `bean` 테이블 직접 조회 → CafeBean 조회로 변경
- shape (DeviceToken FCM payload) 변경 X

### 4-5. Controller
- **변경 0** — path / dto / response 동일

---

## 5. shared-types
- **변경 0**

→ 003+ wave에서 RecordEquipment·TasteNote N개·Recipe selector 도입 시 추가.

---

## 6. 작업 순서 (의존 그래프)

```
1. 신규 엔티티 5개 작성 (Recipe, CafeBean, CafeEquipment, RecordEquipment, TasteNote)
2. 기존 엔티티 변경 (Bean Global, Equipment Global, Roaster, Record, RecordBean)
3. Cafe collection rename
4. index.ts export 정리
5. (수동) Step A: schema:update --run 으로 신규 테이블 + 신규 컬럼 ADD
6. backfill 스크립트 작성 + 검토
7. (수동) DB dump 백업
8. (수동) backfill 실행
9. Service 레이어 변경 (BeanService → CafeBean, RecordService → CafeBean·TasteNote, NotificationService)
10. (수동) Step C: schema:update --run 으로 폐기 컬럼 DROP
11. API 자가 검증 (수동 curl 또는 통합 QA)
12. 클라이언트 회귀 QA (Expo 앱 실기 — 잔량 카드 / 기록 작성 / 기록 리스트 / 기록 상세)
13. spec 갱신 (003+ wave에서 — 002에선 변경 X)
14. ticket frontmatter status → done, tickets/CLAUDE.md 인덱스 갱신
```

**1~4·9는 api-engineer 에이전트 위임.**
**6은 api-engineer (스크립트 작성).**
**5·7·8·10은 사용자 수동 실행 — 본 스킬은 가이드만 제공.**
**11·12는 qa-engineer 통합 QA.**

---

## 7. QA 체크리스트

### API 단독 (entity·service 단위)
- [ ] 5개 신규 엔티티 schema:update 산출 SQL 확인 (불필요한 column 누락 없음)
- [ ] Bean·Equipment·Roaster ADD 컬럼 정상 nullable
- [ ] backfill 스크립트 dry-run 모드 (`--dry-run` 플래그) 시 실제 INSERT 안 함
- [ ] backfill 후 모든 RecordBean.cafe_bean_id NOT NULL
- [ ] backfill 후 Record.tasteNote JSON이 있던 row의 TasteNote row 존재
- [ ] Step C 후 기존 Bean.cafe_id, Bean.totalGrams 등 컬럼 부재

### API ↔ Client shape 호환 (Critical)
- [ ] `GET /cafes/:cafeId/beans` 응답이 backfill 전후 동일한 BeanResponse 구조
- [ ] `GET /beans/:beanId` 동일
- [ ] `POST /cafes/:cafeId/beans` 동일 (입출력)
- [ ] `PATCH /beans/:beanId` 동일
- [ ] `GET /cafes/:cafeId/records` 동일 — `tasteNote` 필드 1:1 변환 (TasteNote row 0개면 null, 1개+면 첫 row)
- [ ] `POST /cafes/:cafeId/records` — dto.tasteNote 입력이 TasteNote row로 저장. dto.recipe 입력은 무시(silently ignored — D8 컨펌 결과)
- [ ] `PATCH /records/:recordId` 동일
- [ ] `DELETE /records/:recordId` — TasteNote/RecordBean cascade 삭제 + 잔량 복원

### 클라이언트 회귀 QA (Expo 앱 실기 — 사용자 수동 또는 client-engineer 보조)
- [ ] Home — 잔량 카드 표시
- [ ] Bean 추가 시트 → 추가 → 잔량 카드 갱신
- [ ] Bean 상세 → 수정 → 반영
- [ ] Bean archive → 사라짐
- [ ] FAB 빠른 기록 → 원두+양 입력 → 기록 생성
- [ ] 기록 리스트 → 시간순 표시
- [ ] 기록 상세(있다면) → 정상 표시
- [ ] ROP 알림 발송 (cron 임시 trigger 가능 시)

### 운영 가드레일
- [ ] schema:update --drop 자동 실행 X (수동 실행만)
- [ ] backfill은 트랜잭션 + dry-run 옵션 + 백업 후 실행
- [ ] event-taxonomy spec 변경 X (이번 ticket 범위 외)

---

## 8. ticket done 시 spec 갱신 항목

**원칙: 002는 데이터 인프라 ticket — spec 변경 거의 없음. UX는 003~005 wave에서.**

- [ ] `screens.md` — **변경 X** (사용자 인지 동작 동일)
- [ ] `event-taxonomy.md` — **변경 X** (D6)
- [ ] `design-system.md` — **변경 X**
- [ ] `design.pen` — **변경 X**
- [ ] `tickets/CLAUDE.md` 인덱스 → 002를 Done 섹션으로 이동, ref `LIFE-4 (YYYY-MM-DD)`
- [ ] `LIFE-4` + `ticket.md` frontmatter `status: done`, `updated`

---

## 9. 미해결 이슈 / 사용자 결정 필요

### Q1 (D1 컨펌). API shape 호환 유지 전략 채택?
- **권장**: 채택 (클라이언트 변경 0).
- 대안: Big bang으로 클라이언트도 동시 변경 (002의 작업량 2~3배 + 003 wave가 재변경) — 비추.

### Q2 (D2·D3 컨펌). 데이터 backfill 디테일
- **권장**: 별도 스크립트 + DB 백업 + 3-step schema:update 분리. 사용자 수동 실행.
- 대안: schema:update만으로 자동화 — **데이터 손실 위험으로 채택 X**.

### Q3 (D2 컨펌). Record.recipe JSON 폐기 시 데이터 손실 허용?
- 현재 운영 중인 `Record.recipe` JSON row가 몇 개인지 backfill 직전 SELECT로 확인.
- **0개면** 손실 우려 없음 → 그대로 폐기.
- **N개면** 사용자 결정: (a) 데이터 그대로 폐기 (b) JSON을 임시 보존 컬럼으로 옮김 (003에서 처리) (c) 003 도입까지 기다리고 002 보류.
- **권장**: 본인+와이프만이고 003이 곧 진입할 거면 (a). 사용자 컨펌.

### Q4 (D7 컨펌). 클라이언트가 보는 `Bean.id` = `CafeBean.id`?
- 영향: BeanResponse.id, RecordResponse.beans[].beanId, /beans/:beanId path param 모두 CafeBean.id 의미.
- **권장**: yes — 클라이언트 인지 모델은 cafe-scoped Bean. 글로벌 Bean.id는 BE 내부.
- 대안: yes/no 외에 두 ID 모두 노출 (`{ cafeBeanId, globalBeanId }`) — 003 catalog selector 도입 전엔 불필요.

### Q5 (D8 컨펌). POST /records의 dto.recipe 입력 처리
- 현재 클라이언트는 recipe 거의 안 보냄(03 범위는 양만 — screens.md S05). 003에서 진입.
- **권장**: 002 단계에서 들어오면 silently ignored (record.recipe FK = null 유지). 클라이언트 코드 변경 없으니 문제 없음.

### Q6. Bean dedupe 전략
- 002에서 매번 새 Bean 글로벌 row 생성? → 동일 cafe 내 동명 Bean 등록 시 중복 row 발생.
- **권장**: 002에선 매번 신규 (간단화). 003+ catalog selector 도입 시 사용자가 직접 선택해 dedupe.

---

## 10. 작업 흐름 (Phase 2 진입 시)

```
TeamCreate("home-coffing-dev-002", [api-engineer, qa-engineer])
  // client-engineer는 회귀 QA 단계에서만 호출

Task A: 신규 엔티티 5개 + 기존 엔티티 변경 + Cafe collection rename + index.ts (api-engineer)
  → 완료 보고
  → qa-engineer: entity 단독 점검 (FK·collection·deleteRule)

Task B: backfill 스크립트 작성 (api-engineer, blockedBy: A)
  → 완료 보고

[수동 단계 — 사용자 권한 요청]
  Step A: pnpm schema:update --run (ADD only — 사용자 검토)
  DB dump 백업
  backfill --dry-run 검증
  backfill --execute
  Step C: pnpm schema:update --run (DROP — 사용자 검토)

Task C: BeanService·RecordService·NotificationService 어댑터 변경 (api-engineer, blockedBy: B + 수동 단계)
  → 완료 보고
  → qa-engineer: API ↔ shared-types shape 교차 비교 (Critical)

Task D: 클라이언트 회귀 QA (qa-engineer, blockedBy: C)
  → Expo 앱 실기 — Home/Bean/Record 화면 정상 동작 확인
  → Critical 이슈 시 client-engineer 호출 (이번엔 호환 전략이라 변경 없을 것 — 만약 깨지면 BE 어댑터 버그)

Task E: 통합 QA (qa-engineer, blockedBy: D)
  → spec 정합성, 운영 가드레일 점검

[Phase 3 — 메인 직접]
  ticket frontmatter status=done, tickets/CLAUDE.md 인덱스 이동
```
