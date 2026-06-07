# Ticket 005 — Dev Plan

> **상태:** 🟢 확정 (사용자 컨펌 2026-05-12, Q1=backfill, Q2~Q11=추천대로)
> **앵커:** [ticket.md](./ticket.md), [mockup.md](./mockup.md), [mockup.pen](./mockup.pen), [research-bean-data.md](./research-bean-data.md), [../../spec/screens.md](../../spec/screens.md), [../../spec/event-taxonomy.md](../../spec/event-taxonomy.md), [../../spec/design-system.md](../../spec/design-system.md), [../../spec/design.pen](../../spec/design.pen)
> **영향 screens.md 라인:** "원두 추가/수정 시트 — `[design.pen S04, S04b]`" 섹션 전체 + Home의 "원두 추가 버튼" 진입 흐름

## 0. 현재 코드와의 격차 (요약)

| 영역 | 현재 | 005 목표 |
|---|---|---|
| `Bean` entity | name·roaster·origin·process·roastLevel·source·createdBy | name(unique)·type·process(enum)·tastingNote·source·createdBy (roaster/origin/roastLevel **제거**, type/tastingNote **추가**) |
| Bean source | 자유 텍스트 → 매 봉지마다 새 Bean row (CAFE) | 운영자 seed만 (SEED). CafeBean 생성 시 catalog FK 강제. |
| `CafeBean.bean` | NOT NULL (already) | 변경 없음 |
| Bean catalog 조회 API | 없음 | `GET /beans` (검색·전체), 최근 사용 list |
| CafeBean 생성 DTO | `name` 자유텍스트 + roaster/origin | `beanId` FK 필수, roaster/origin 제거 |
| App `BeanFormSheet` | name TextField + origin TextField + 7개 필드 | catalog selector chip + 나머지 spec g1eO2 그대로 |
| Picker (catalog selector) | 없음 | 신규 `BeanCatalogPickerSheet` (F2 / F2-miss) |
| QuickRecordSheet C3 | BottomSheet picker (CafeBean 선택) | in-place dropdown — 활성 CafeBean list + "전체 검색" CTA + 블렌딩 pill |
| Seed | `seed-equipments.ts` 패턴만 있음 | 신규 `seed-beans.ts` — 원두반점 30+종 |

## 1. ❗ 결정 필요 사항 (사용자 컨펌)

### Q1. 마이그레이션 — 기존 데이터 처리 ✅ **backfill 결정 (2026-05-12)**
- **결정**: 기존 카페에 등록된 모든 Bean·CafeBean을 정상 사용 가능하도록 backfill.
- **전략 (script `migrate-beans-for-005.ts`):**
  1. 기존 모든 `Bean.source = 'cafe'` → `'global'` 전환 (사용자 입력 path 폐기 후 모든 Bean = catalog)
  2. **Name dedup**: 같은 `name`의 Bean rows 다수 시 → 가장 오래된 row를 canonical로 두고, 잉여 Bean을 참조하는 `CafeBean.bean` FK를 canonical로 재배선 → 잉여 Bean rows delete
  3. 기존 Bean rows에 `type='single'` 기본값 박음 (대량은 single·blend 식별 텍스트 매칭으로 추정: name에 "블렌드"|"blend" 포함 → blend, "디카페인"|"decaf" 포함 → decaf, 외 → single)
  4. `tastingNote = null` (기존 row는 정보 없음)
- **Order (schema:update + script 조합):**
  1. Bean entity 코드 갱신 — type/tastingNote 컬럼 add (type은 default 'single'로 두어 column add 시 자동 채움), roaster_id/origin/roast_level 보존 (drop은 step 4에서)
  2. `pnpm schema:update` (1차) — column add만
  3. `pnpm ts-node migrate-beans-for-005.ts` — source 변환 + dedup + type 추정
  4. Bean entity 코드 갱신 2차 — roaster/origin/roastLevel field 제거 + name unique 인덱스
  5. `pnpm schema:update` (2차) — column drop + unique index
  6. `pnpm ts-node seed-beans.ts` — 운영자 catalog upsert (name 매칭 시 update, 없으면 insert)
- **seed-beans 동작**: idempotent **upsert** (기존 사용자 등록 Bean과 name 매칭 시 type/process/tastingNote 갱신, 미매칭 시 insert)

### Q2. API path 정리 (모듈 명명 혼란)
- 기존: `GET/POST /cafes/:cafeId/beans`, `GET/PATCH /beans/:beanId` ← 둘 다 **CafeBean(봉지)** 핸들링
- 005 추가: `GET /beans` (Bean **catalog**) — path 충돌 발생
- **제안 A (rename, 깔끔):** 기존 path → `/cafes/:cafeId/cafe-beans`, `/cafe-beans/:id`. `/beans`는 catalog 전용으로 회수. App + 모듈 path도 업데이트.
- **제안 B (수용, 변경 최소):** 새 catalog endpoint를 `/bean-catalog` 또는 `/beans/catalog`로 둠. 기존 path 유지. → 명명 부채 지속.
- **추천:** A. 005가 명명을 바로잡기 가장 좋은 시점 (003/004 묶음 배포 전).

### Q3. C3 dropdown row 단위
- mockup.md "데이터 매핑": `Bean join RecordBean.cafeBean.bean orderBy recordedAt desc distinct` — *Bean(catalog)* 단위
- 같은 catalog의 활성 CafeBean(봉지) 여러 개일 때:
  - **3a.** Bean catalog 단위로 표시 + 봉지는 *가장 최근 활성*을 자동 선택 (활성 봉지 0개면 dropdown 미노출)
  - **3b.** CafeBean(봉지) 단위로 그대로 표시 — bean.name 같아도 봉지별 row (현재 동작과 가까움)
  - **3c.** Bean catalog 단위 + 활성 봉지 여러 개일 때 *2차 선택 step* (UX 복잡)
- **추천:** **3a** — 현실적으로 catalog당 활성 봉지 1개가 일반적. 여러 개 케이스는 *가장 최근 봉지* 자동 선택으로 단순화. (mockup의 "원두 단위" 표현과 fit)

### Q4. EntitySource enum
- ticket.md: `source enum: SEED` 명시
- 현재 enum: `EntitySource.CAFE` / `EntitySource.GLOBAL`
- **추천:** **GLOBAL 그대로 사용** — 의미가 같음 ("운영자가 박은 글로벌 카탈로그"). 별도 SEED 라벨 추가는 enum 부풀리기. ticket.md의 "SEED" 표현은 *컨텍스트 레이블*로 이해.
- Bean entity의 `source` 필드 사용처: 005 이후 모든 Bean = GLOBAL. CAFE 값은 폐기 마이그레이션에서 정리.

### Q5. Bean.tastingNote 컬럼 형태
- mockup.md "Open / TODO": "developing 결정"
- 옵션:
  - **5a.** JSON 컬럼 (`varchar` JSON serialize 또는 MySQL JSON 타입) — 단순
  - **5b.** 별 테이블 `BeanTastingNote(beanId, tag)` — 검색·정규화 가능
- **추천:** **5a (JSON 컬럼)** — 005 범위에서 사용자 입력 path 없음 (seed만). 검색은 후속(OCR ticket) 시점에 재검토. 단순함 우선.

### Q6. C3 → F2 "전체 검색" 진입 시 활성 봉지 없는 catalog
- F2 picker는 Bean catalog 전체. row 선택 시 → 호출자 복귀.
- C3에서 진입한 경우 *해당 catalog의 활성 CafeBean이 없으면* 기록 작성 불가.
- **추천:** **C3 "전체 검색" 진입의 F2는 *활성 CafeBean이 있는 Bean catalog만* 필터**. B-add-bag 진입 시는 전체 catalog. 호출 컨텍스트별로 filter param 제공 (`/beans?activeOnly=true&cafeId=`).

### Q7. C1/C2/C3 mockup vs 현재 QuickRecordSheet
- 현재 QuickRecordSheet: BeanPicker(`pickerFor`) BottomSheet — 활성 CafeBean list
- mockup C3: in-place dropdown (chip 바로 아래 펼침)
- **변경 사항**: BottomSheet picker → in-place dropdown 컴포넌트로 교체
- **확인 필요**: 003/004 이후 QuickRecordSheet 코드가 안정됐는데, dropdown UI 도입은 *작지 않은 UI 변경*. mockup 의도가 005에 포함되는지 (또는 005는 "B-add-bag + F2 catalog"만 다루고 C1/C2/C3는 후속)?
- **추천:** **C1/C2/C3 변경도 005 범위**. 이유: mockup.md가 명확히 포함시키고 있고, 블렌딩 pill·"전체 검색" CTA가 catalog selector와 묶음. 단, 변경 범위를 *디스플레이 + dropdown* 으로 한정 (multi-bean blending 로직은 이미 작동, UI tone만 mockup fit).

## 2. 변경 범위 요약

### API (apps/api)
- 신규 endpoint:
  - `GET /beans?search=&activeOnly=&cafeId=&limit=` — Bean catalog 검색/list
  - `GET /beans/recent?cafeId=` — 최근 사용 Bean (RecordBean → CafeBean.bean distinct)
- 변경 endpoint (path rename if Q2=A):
  - `GET/POST /cafes/:cafeId/cafe-beans` (CafeBean list/create) — DTO에서 `name` 폐기, `beanId` 필수
  - `GET/PATCH /cafe-beans/:id` (CafeBean detail/update) — DTO에서 `name`/`roasterId`/`origin` 폐기, `beanId` 변경 가능
- Bean entity 마이그레이션 (Q1 wipe 가정):
  - 컬럼 drop: roaster_id / origin / roast_level
  - 컬럼 add: type (enum NOT NULL) / tasting_note (JSON nullable)
  - unique index: name
- seed: `apps/api/src/scripts/seed-beans.ts` — 원두반점 universe (research-bean-data.md 기반)

### App (apps/app)
- `BeanFormSheet` 개편 (B-add-bag):
  - name TextField → catalog selector chip → `BeanCatalogPickerSheet` 호출
  - origin TextField **제거**
  - 나머지 필드(전체 용량·날짜 3종·디개싱·하루 잔수·1잔 용량) spec 그대로
  - 저장: `beanId` 필수 (chip 미선택 시 disabled)
  - edit mode: catalog 변경 가능 — but bean 변경은 *심각한 의미 변화*, **edit mode에선 catalog 잠금 (read-only chip)** + 필드만 수정 (추천). 또는 edit 시에도 변경 허용. → 사용자 결정 (간단한 결정이라 dev-plan에 같이 둠).
- 신규 `BeanCatalogPickerSheet` (F2 / F2-miss):
  - 풀스크린(또는 BottomSheet large) — mockup.pen은 풀스크린
  - 검색 input + Bean catalog list (substring filter)
  - 결과 0건: search-x icon + "검색 결과 없음" + "다른 검색어로 시도해보세요" — CTA 없음
  - `activeOnly`/`cafeId` query param 컨텍스트별로 (C3 호출 시 / B-add-bag 호출 시 다름)
- `QuickRecordSheet` C1/C2/C3 (mockup 정합):
  - 기존 BottomSheet picker(`pickerFor`) → in-place dropdown
  - dropdown row: 활성 CafeBean list + "전체 검색 →" CTA
  - 블렌딩 pill(`+ 원두 추가 (블렌딩)`)은 이미 `addEntry()` 함수로 동작 — UI 라벨/위치만 mockup fit
  - C2 빈 상태: empty chip "+ 원두 선택" + 블렌딩 pill (disabled tone) + 저장 disabled
- `BeanCard` (홈 잔량 카드): bean catalog 정보 표시 위해 BeanResponse 변경 반영 (origin/roaster 제거)
- 라우트 영향:
  - `app/beans/[id].tsx` — CafeBean 상세. path rename(Q2=A) 시 호출 경로 갱신.

### Web (apps/web)
- 영향 **없음** — web은 005 범위 외 (홈/잔량/기록 화면이 app만 가짐). 확인 후 변경 없으면 skip.

### shared-types (packages/shared-types)
- `BeanCreateRequest`: `name`/`origin` 제거, `beanId: number` 추가
- `BeanUpdateRequest`: `name`/`origin` 제거, `beanId?: number` 추가
- `BeanWithStats`: `origin`/`roaster` 제거, `bean: BeanCatalogItem` 객체 추가 (id/name/type/process/tastingNote)
- 신규: `BeanCatalogItem`, `BeanType` ('single'|'blend'|'decaf'), `BeanProcess` ('washed'|'natural'|'honey'|'anaerobic') 

### 이벤트 (spec/event-taxonomy.md)
- 신규 이벤트 후보:
  - `bean_catalog_picker_open` (호출 컨텍스트 param: `from_quick_record` | `from_bean_form`)
  - `bean_catalog_select` (catalog_id, search_query?)
  - `bean_catalog_search_empty` (search_query)
- B-add-bag 자체는 기존 "bean_add_*" 이벤트와 연계 — 발화 위치만 점검.
- **결정 필요:** event-taxonomy에 추가할지 (현재 placeholder만 있는 상황 — 006 SDK 도입 전)

## 3. 데이터 모델 명세 (코드 SoT)

### Bean (변경)
```ts
@Entity()
export class Bean {
  @PrimaryKey() id!: number;
  @Property({ length: 120, unique: true }) name!: string;
  @Enum(() => BeanType) type!: BeanType;            // NOT NULL
  @Enum({ items: () => BeanProcess, nullable: true }) process: BeanProcess | null = null;
  @Property({ type: 'json', nullable: true }) tastingNote: string[] | null = null;
  @Enum(() => EntitySource) source!: EntitySource;  // GLOBAL only post-005
  @ManyToOne(() => User, { nullable: true }) createdBy: User | null = null;
  @OneToMany(() => CafeBean, ...) cafeBeans = new Collection<CafeBean>(this);
  @Property() createdAt: Date = new Date();
}

export enum BeanType { SINGLE = 'single', BLEND = 'blend', DECAF = 'decaf' }
export enum BeanProcess { WASHED = 'washed', NATURAL = 'natural', HONEY = 'honey', ANAEROBIC = 'anaerobic' }
```
- 제거: `roaster`, `origin`, `roastLevel`
- 추가: `type`, `tastingNote`
- name `unique` 인덱스

### Bean enum 위치
- `BeanType`, `BeanProcess`: `apps/api/src/common/entities/enums.ts`에 추가
- `EntitySource.CAFE` 값은 코드에서 남기되 (enum 호환), 신규 row는 `GLOBAL`만 박음. 마이그레이션으로 기존 CAFE row 정리 후 enum value도 제거 가능 (추후 cleanup).

### CafeBean (변경 없음)
- `bean!: Bean` 그대로 (NOT NULL)
- `freeName` 만들지 않음 — 그대로

### Roaster entity
- 005에서는 *코드 보존* (Bean의 roaster FK만 제거). Roaster table은 추후 정리(향후 ticket). 

## 4. API 작업 (세부)

### 4-1. Bean catalog 모듈 (신규 또는 bean 모듈 분리)
- 결정: 신규 `apps/api/src/bean-catalog/` 모듈 만들고 BeanCatalogController/Service. 기존 `bean` 모듈은 CafeBean 전용(rename은 Q2 결정 후).
- Endpoints:
  ```
  GET /beans?search=&activeOnly=&cafeId=&limit=20
  GET /beans/recent?cafeId=
  ```
- Service:
  - `listCatalog(opts)`: Bean.name substring, source=GLOBAL, optional activeOnly→Bean has any CafeBean(archivedAt: null, finishedAt: null, cafeId)
  - `listRecent(cafeId)`: RecordBean → CafeBean.bean distinct, last N

### 4-2. CafeBean 모듈 (변경, rename if Q2=A)
- DTO:
  - `CreateCafeBeanDto`: `beanId` (필수, IsInt) + 나머지 필드. `name`/`origin`/`roasterId` 제거.
  - `UpdateCafeBeanDto`: `beanId?` (선택 — edit 시 catalog 재배선 허용 여부는 Q7 추가 결정). `name`/`origin`/`roasterId` 제거.
- Service:
  - `createBean`: dto.beanId로 Bean lookup → 없으면 404. EntitySource.GLOBAL인지 확인 (방어). CafeBean.bean = Bean (재사용, 새 Bean row 생성 X).
  - `updateBean`: dto.beanId 변경 시 → 새 Bean lookup → cafeBean.bean = 새 Bean. **`renamedToNewBean` 로직 (자동 새 Bean 생성)은 제거**.
- Response (`BeanResponse` → 이름 그대로 유지 또는 `CafeBeanResponse`로 rename):
  - `bean: { id, name, type, process, tastingNote }` 객체 노출
  - `origin`, `roaster` 필드 제거

### 4-3. Seed script
- `apps/api/src/scripts/seed-beans.ts` — equipment seed 패턴 차용
- 원두반점 universe 30+종 (research-bean-data.md 표 1·2·3 기반):
  - 싱글오리진(아프리카) 10 + (남미·중미) 5 + (아시아) 1 = 16
  - 블렌드 11
  - 디카페인 10
- 각 row: `{ name, type, process, tastingNote }` — research에서 라벨에 있는 것만 채움
- idempotent: name unique 위반 시 skip
- 실행: `pnpm --filter @home-coffing/api ts-node src/scripts/seed-beans.ts`

### 4-4. 마이그레이션 (Q1=**backfill**)
- 실행 절차 (사용자 권한 필요, 순서대로):
  1. Bean entity 1차 갱신: type/tastingNote 컬럼 add (type은 default 'single' NOT NULL)
  2. `pnpm schema:update --run` (1차) — column add 반영
  3. **`pnpm --filter @home-coffing/api ts-node src/scripts/migrate-beans-for-005.ts`** (신규)
     - source CAFE → GLOBAL
     - 동일 name Bean rows dedup + CafeBean.bean FK 재배선
     - type 추정 (name 매칭 — 블렌드/디카페인/single)
     - 결과: count 보고 (변환·dedup·재배선 row 수)
  4. Bean entity 2차 갱신: roaster/origin/roastLevel 제거 + name unique 인덱스
  5. `pnpm schema:update --run` (2차) — column drop + unique 적용
  6. **`pnpm --filter @home-coffing/api ts-node src/scripts/seed-beans.ts`** (신규)
     - 원두반점 universe upsert (name match 시 update, 없으면 insert)
- **데이터 손실 없음** — 기존 사용자 등록 원두 모두 catalog로 promote, CafeBean 참조 유지.
- ⚠ 잠재 이슈: 동일 name이지만 *원두 의미가 다른* row가 있을 경우 dedup으로 merge됨. 사용자 dogfooding 규모상 가능성 낮음. migration script가 dedup 사례를 출력 → 사용자 review.

## 5. App 작업 (세부)

### 5-1. `BeanCatalogPickerSheet` (신규)
- 위치: `apps/app/src/components/sheets/BeanCatalogPickerSheet.tsx`
- Props: `visible, onClose, onPick: (bean: BeanCatalogItem) => void, mode: 'all' | 'active-only', cafeId?`
- 구조: 풀스크린 modal (mockup.pen) 또는 큰 BottomSheet. 결정: **풀스크린 modal** — EquipmentPickerSheet가 BottomSheet인데 *원두 catalog는 더 큰 list이고 검색 input이 핵심*이라 풀스크린이 fit.
  - 또는 EquipmentPickerSheet 일관성 유지 위해 BottomSheet. → 사용자 결정 항목으로 추가 (가벼움)
- 검색 + list + empty state (F2-miss) 한 컴포넌트

### 5-2. `BeanFormSheet` 개편 (B-add-bag)
- name TextField 제거, origin TextField 제거
- catalog selector chip 추가 (filled = bean.name, empty = "+ 원두 선택")
- chip tap → BeanCatalogPickerSheet (mode: 'all', cafeId optional)
- create mode: 필수
- edit mode: chip 잠금 (read-only) — 기존 catalog 표시만. *catalog 변경은 별 ticket으로 분리* (cafe-bean catalog 재배선은 의미 있는 변경이라 별도 처리 권장)
- ⚠ 005 mockup엔 edit mode 명시 없음. 결정 필요 (사용자에게 동시에 묻기).

### 5-3. `QuickRecordSheet` C1/C2/C3 (mockup 정합)
- 변경 범위: BottomSheet picker(`pickerFor`) → in-place dropdown
  - state: `dropdownIndex: number | null`로 어떤 entry의 dropdown이 열려 있는지
  - dropdown 내용: 활성 CafeBean list (현재 `beans` prop) + "전체 검색 →" CTA
  - "전체 검색" → BeanCatalogPickerSheet (mode: 'active-only', cafeId) → 선택 시 *해당 Bean의 활성 CafeBean 자동 선택* (Q3 추천 3a)
- chip 디자인: filled tone vs empty tone (mockup.md C1 vs C2)
- 블렌딩 pill: `+ 원두 추가 (블렌딩)` 라벨로 통일 (현재 button text 확인 후 갱신)

### 5-4. `BeanCard` (잔량 카드) — minor
- BeanResponse.origin/roaster 제거 반영
- subtext에 표시되던 origin 자리 → bean.type 또는 bean.process로 교체 (mockup 미명세 → 기본은 *제거*)
- 결정: subtext에 무엇을 보여줄지 — 사용자 결정 (사소)

### 5-5. 잔량 화면 "원두 추가" 진입점
- mockup.md에 명시: B-add-bag은 spec g1eO2 (S04b) 패턴. 현재 BeanFormSheet 호출 위치 그대로 두고 sheet 내용만 교체.

### 5-6. shared `types.ts` (apps/app/src/lib/types.ts)
- BeanCatalogItem, BeanType, BeanProcess 추가
- Bean (= CafeBeanResponse) 타입의 origin/roaster 필드 제거 + bean 객체 추가

## 6. shared-types 변경 (packages/shared-types)
- 위 4·5 변경 일관 export
- App·Web 둘 다 import — Web 영향 없으면 type 변경만 (런타임 영향 X)

## 7. 작업 순서 (의존 그래프)

```
1. (메인) shared-types 갱신 — BeanCatalogItem/BeanType/BeanProcess enum, request/response 변경
2. (api-engineer) Bean entity 1차 변경 (type/tastingNote add) + enums.ts + migrate-beans-for-005.ts + seed-beans.ts
3. (사용자) schema:update 1차 + migration script 실행 — 사용자 컨펌 후
4. (api-engineer) Bean entity 2차 변경 (roaster/origin/roastLevel 제거 + name unique)
5. (사용자) schema:update 2차 + seed-beans 실행 — 사용자 컨펌 후
6. (api-engineer) bean-catalog 모듈 신규 (GET /beans, /beans/recent)
7. (api-engineer) bean 모듈 변경 (path rename → cafe-beans, DTO name 제거 beanId 필수)
8. (qa-engineer) API 단독 점검: entity, DTO, endpoint shape, seed/migration 결과
9. (client-engineer) shared types.ts 갱신 + queries/beans.ts → cafe-beans + 신규 queries/bean-catalog.ts
10. (client-engineer) BeanCatalogPickerSheet 신규 (풀스크린 modal, F2/F2-miss)
11. (client-engineer) BeanFormSheet 개편 (B-add-bag — catalog chip + origin 제거, edit read-only)
12. (qa-engineer) API ↔ Client B-add-bag flow 교차 점검
13. (client-engineer) QuickRecordSheet C1/C2/C3 mockup 정합 (in-place dropdown + 블렌딩 pill)
14. (qa-engineer) API ↔ Client 기록 작성 flow 교차 점검
15. (client-engineer) BeanCard subtext 정리 (type 표시)
16. (qa-engineer) 통합 QA — spec 정합 + event-taxonomy(placeholder) + design-system tone
```

**자동 실행 중 사용자 개입 지점**: step 3 (schema 1차 + migration), step 5 (schema 2차 + seed). 두 지점에서 출력 확인 후 진행.

## 8. QA 체크리스트 (모듈별)

### API
- [ ] Bean.name unique 제약 동작 (중복 insert 시 409 또는 500 적절)
- [ ] CafeBean 생성 시 beanId 없음/잘못된 경우 400/404
- [ ] CafeBean 생성 시 EntitySource.CAFE인 Bean에 FK 박으면 차단 (방어 코드)
- [ ] GET /beans?search 한국어 substring 동작
- [ ] GET /beans?activeOnly=true → 활성 CafeBean 있는 Bean만
- [ ] GET /beans/recent — distinct + orderBy recordedAt desc
- [ ] CafeBean response 모양 — origin/roaster 없음, bean 객체 있음
- [ ] seed-beans.ts idempotent (재실행 OK)

### Client
- [ ] B-add-bag chip 미선택 시 저장 disabled
- [ ] B-add-bag picker 호출 시 mode=all, 전체 catalog 표시
- [ ] QuickRecord C3 dropdown 활성 봉지만, "전체 검색" picker는 activeOnly=true
- [ ] F2-miss empty state — "검색 결과 없음" 안내, CTA 없음
- [ ] BeanCard subtext 변경 (origin/roaster 안 보임)
- [ ] 블렌딩 pill 라벨 mockup 일치
- [ ] BeanFormSheet edit mode — chip read-only

### 인증/권한
- [ ] GET /beans 인증 필요 (Bean catalog는 글로벌이지만 비로그인 차단)
- [ ] /beans?activeOnly=true&cafeId= — cafe member 권한 (CafeMemberGuard)

### Spec 정합
- [ ] screens.md 원두 추가/수정 시트 섹션 갱신 후보 식별
- [ ] event-taxonomy.md 신규 이벤트 결정 (placeholder만 박을지 본격 등록할지) — Q 결정
- [ ] design-system.md — chip + dropdown tone 추가 후보 확인

### 운영 가드레일
- [ ] schema:update destructive change (column drop) 사용자 컨펌 후 실행
- [ ] seed-beans 실행 명령 사용자에게 명시
- [ ] DB wipe = 003/004 dogfooding 데이터 소실 명시적 경고

## 9. ticket done 시 spec 갱신 항목

### screens.md
- "원두 추가/수정 시트 — `[design.pen S04, S04b]`" 섹션의 행들을 catalog selector / picker 흐름으로 갱신:
  - 🟡 → ✅ "원두 추가/수정 시트 — `[design.pen S04, S04b]`" 카탈로그 selector chip — LIFE-7 (2026-05-NN)
  - ✅ "원두 선택 picker — 풀스크린 검색·catalog list (F2 / F2-miss)" — LIFE-7 (2026-05-NN, 신규)
- ~~"이름 자유 텍스트 입력"~~ — LIFE-7 catalog selector로 교체 (2026-05-NN)
- 빠른 기록 — "원두 선택 + 양 입력 (3 step 이내)" 행에 dropdown UI ref (LIFE-7 보강)

### event-taxonomy.md
- 신규 추가 (사용자 결정 후 — 006 SDK 도입 전 placeholder만 채울 수도)

### design-system.md
- chip pattern 카탈로그 (filled / empty / chevron-down 변형) — 이미 있으면 ref만
- dropdown component pattern — C3 in-place dropdown 신규

### design.pen
- ⚠ visual 변경 큼 (B-add-bag, F2, F2-miss, C3 dropdown). Pencil MCP로 spec/design.pen 갱신 — client-engineer 후속.

### tickets/CLAUDE.md 인덱스
- 005 → Done 섹션. status frontmatter = done, updated = 작업 완료일.

## 10. 결정 확정 (2026-05-12)

| # | 결정 |
|---|---|
| Q1 | **backfill** — 기존 카페에 등록된 모든 원두 정상 사용 가능 (migration script로 promote + dedup) |
| Q2 | API path rename: `/cafe-beans/:id` (A) |
| Q3 | C3 dropdown: Bean catalog 단위 + 활성 봉지 자동 매핑 (3a) |
| Q4 | EntitySource: GLOBAL 재사용 (CAFE는 legacy로 enum 보존, 신규 row 없음) |
| Q5 | Bean.tastingNote: JSON 컬럼 |
| Q6 | C3→F2 진입 시 activeOnly filter |
| Q7 | C1/C2/C3 변경 005 포함 |
| Q8 | BeanFormSheet edit mode: catalog chip read-only |
| Q9 | BeanCatalogPickerSheet: 풀스크린 modal |
| Q10 | BeanCard subtext: type만 (single/blend/decaf) |
| Q11 | event-taxonomy 신규 이벤트: 006과 함께 (placeholder만 005에 추가) |

## 11. 운영 가드레일 점검

- ❌ 절대 금지 위반 없음.
- ⚠ schema:update destructive (2차) — 컬럼 drop. 사용자 컨펌 후 실행.
- ⚠ migration script `migrate-beans-for-005.ts` — Bean dedup + FK 재배선 (DB 변경). 사용자 컨펌 후 실행, 결과 출력 후 다음 step.
- ⚠ seed 스크립트 — pnpm 외부 의존 실행. 사용자 컨펌.

---

> **Next:** Phase 2 자동 실행 진입 (2026-05-12).
