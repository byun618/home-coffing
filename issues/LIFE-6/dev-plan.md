---
ticket: 004
created: 2026-05-07
status: review
---

# Ticket 004 — Dev Plan

> **상태:** 🟡 사용자 컨펌 대기
> **앵커:** ./ticket.md, ./CLAUDE.md, ./mockup.pen, ../../spec/screens.md, ../../spec/event-taxonomy.md, ../../spec/design-system.md, ../../spec/design.pen
> **영향 screens.md 라인:** S05/S05b recipe 입력 동선, S06 기록 상세 recipe 표시 (+ 신규 S05d wizard, S05e E1 내 레시피 관리)

---

## 0. 진입 가정 (현 코드 상태)

- `Recipe` / `Equipment` / `CafeEquipment` / `RecordEquipment` 엔티티는 002에 정의됐으나 **runtime 사용처 0** (controller/service/DTO 참조 X). production 운영 data도 비어 있음.
- 따라서 본 ticket의 schema 변경은 **사실상 클린 리셋** — 002 backfill처럼 row 보존 마이그레이션 안 필요. Step A SQL 형태 X, `pnpm schema:update`만으로 처리 가능 (사용자 권한 요청 필요).
- 002에서 작성한 `apps/api/src/scripts/backfill-002.ts`는 이미 1회 실행 완료된 1회용 스크립트 — 이번에 신규 backfill 스크립트는 만들지 않는다.

---

## 1. 변경 범위 요약

| 레이어 | 작업 |
|---|---|
| 데이터 모델 | Recipe(+cafe FK, name nullable), RecipeEquipment 신규, Equipment 유지 + seed 추가, **CafeEquipment·RecordEquipment 제거**, Cafe·Record·Equipment 백참조 정리 |
| RecipeMethod enum | `pour-over` / `espresso` / `french-press` / `aeropress` 4개로 교체 (기존 7개 폐기) |
| EntitySource enum | (Round 3 정정) USER 멤버 추가했다가 다시 제거 — Equipment.source 자체를 폐기, EntitySource는 Recipe 전용 (cafe/global)로 회귀 |
| Recipe 입력 폼 | (Round 4) 5-step Option A → 4-step Option B (W1 method / W2-B 셋업 통합 / W3-B 푸어 / W4-B 마무리). PourStage Hybrid 모델: `{label, startSec(절대), pourGrams(delta), pourStyle?, direction?, notes?}` |
| 분쇄도 | (Round 5) `grindSize: string → number` 전 레이어 |
| W3-B 카드 styling | (Round 5/7) 누적 = 가운데 plain 2-line / 증분 = 우측 cream badge |
| 시간 입력 UX | (Round 8) `@quidone/react-native-wheel-picker` 도입 — W2-B 총 시간 + PS1 시점 모두 휠 picker (mm/ss 분리 휠 + ":" + 확인 버튼). cell tap → BottomSheet stack |
| Recipe 상세 화면 | (Round 7) `app/recipes/[id].tsx` (R1) 신규 — 상세 + footer [수정][복제][삭제]. E1·D1 동선 R1 경유로 재배치 |
| Wizard mode prop | (Round 7) `mode: 'create' \| 'edit' \| 'clone'` — clone은 createMutation + 이름 자동 "사본" suffix + cream banner |
| 홈 records 캐시 | (Round 6) `recordKeys.cafeList`가 limit 무시해 발생하는 캐시 충돌 fix — server-side limit 통일 + 클라이언트 slice |
| BrewingParams 타입 | discriminated union — PourOver/Espresso/FrenchPress/Aeropress |
| API | `GET/POST/PATCH/DELETE /cafes/:cafeId/recipes` + `GET /equipments` + `POST /equipments` + `GET /cafes/:cafeId/recipes/:id` 신규. Record DTO에 `recipeId` IN/OUT 노출 |
| Equipment seed | 운영 시작 데이터 삽입 (글로벌 catalog 8~12개, `source = global`) |
| App | QuickRecordSheet Recipe chip + inline dropdown(B1), Recipe wizard 5-step sheet (W1~W5), Equipment selector sheet F1 + 등록 form F1b, 기록 상세 Recipe 카드(D1/D2), 내 레시피 관리 풀스크린(E1) |
| shared-types | BrewingParams union, RecipeResponse, RecipeCreate/UpdateRequest, EquipmentResponse, EquipmentCreateRequest 추가 |
| event-taxonomy | recipe 관련 이벤트 신규 — `recipe_created`, `recipe_used` (record_created에 `recipe_id` 추가) |

---

## 2. 결정 정리 (ticket Open Q 처리)

| Q | 답 | 사유 |
|---|---|---|
| Q1 (직전 Recipe prefill) | **도입** — 빠른 기록 시트 진입 시 마지막 Record.recipe(없으면 첫 Recipe) 자동 채움. 003 `직전 원두 prefill` 패턴 일관성 |
| Q2 (RecipeMethod enum) | `pour-over` / `espresso` / `french-press` / `aeropress` 4개. ticket 결정 그대로. 기존 v60/switch/moka/other는 폐기 (data 없음) |
| Q3 (EquipmentType enum) | 현재 `grinder`/`brewer`/`scale`/`kettle` 4개 **유지**. ticket UX F1의 "드리퍼" 필터는 `brewer` 라벨로 수렴. `filter` 별도 type은 안 만듦 (seed에 없음) |
| Q4 (Recipe.name) | **nullable + 자동 placeholder**. UI에서 미입력 시 placeholder 그대로 저장 X — placeholder 텍스트는 클라이언트 표시용 fallback. DB는 null 허용 |
| Q5 (RecipeEquipment.setting JSON 키 표준) | **필드 자체 제거**. ticket UX 결정 8 그대로 — 그라인더 클릭값 등은 `Recipe.params.grindSize` 자유 텍스트에 통합 |
| Q6 (마이그레이션) | row 보존 안 함. `pnpm schema:update` 1회 (CafeEquipment·RecordEquipment DROP, Recipe ALTER, RecipeEquipment CREATE). 사용자 권한 요청 필수 |

---

## 3. API 작업

### 3-1. 엔티티 변경

**`Recipe`** (apps/api/src/common/entities/recipe.entity.ts)
```ts
@Entity()
class Recipe {
  id;
  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;                                     // ★ 신규 FK
  @Property({ length: 120, nullable: true })
  name: string | null = null;                      // ★ nullable
  @Enum(() => RecipeMethod)
  method!: RecipeMethod;
  @Property({ type: 'json', nullable: true })
  params: BrewingParams | null = null;             // ★ 타입 교체
  source: EntitySource;
  createdBy: User | null;
  createdAt: Date;
  @OneToMany(() => RecipeEquipment, re => re.recipe, { orphanRemoval: true })
  recipeEquipments = new Collection<RecipeEquipment>(this);
}
```

**`RecipeEquipment`** (신규 — apps/api/src/common/entities/recipe-equipment.entity.ts)
```ts
@Entity()
class RecipeEquipment {
  id;
  @ManyToOne(() => Recipe, { deleteRule: 'cascade' })
  recipe!: Recipe;
  @ManyToOne(() => Equipment, { deleteRule: 'restrict' })
  equipment!: Equipment;
  createdAt: Date;
}
```

**`Equipment`** — `cafeEquipments` 백참조 제거. 그 외 동일.
**`Cafe`** — `cafeEquipments` 백참조 제거. `recipes` collection 추가.
**`Record`** — `recordEquipments` 컬렉션 제거.

**제거 (파일 삭제)**: `cafe-equipment.entity.ts`, `record-equipment.entity.ts`. `entities/index.ts`에서도 export 제거.

**`enums.ts`**
```ts
export enum RecipeMethod {
  POUR_OVER = 'pour-over',
  ESPRESSO = 'espresso',
  FRENCH_PRESS = 'french-press',
  AEROPRESS = 'aeropress',
}

export enum EntitySource {
  CAFE = 'cafe',
  GLOBAL = 'global',
  USER = 'user',          // ★ 신규 — F1b 사용자 직접 등록 Equipment
}
```

### 3-2. BrewingParams 타입 (`apps/api/src/common/types/recipe-params.ts` 전면 교체)

ticket.md §"BrewingParams" 기준 + Round 4(2026-05-08)에서 PourStage Hybrid로 갱신:
- `PourOverParams` — method, doseGrams, grindSize, waterTempC, serveMode('hot'|'iced'), iceGrams?, totalYieldGrams, totalTimeSec, stages: PourStage[], notes?
- `PourStage` (Hybrid ★ R4 채택) — `{ label, startSec(절대), pourGrams(delta), pourStyle?, direction?, notes? }`
- `PourStyle` — 'center' | 'circle-out' | 'circle-in' | 'spiral' | 'pulse' | 'continuous' | 'bloom-only'
- `EspressoParams` / `FrenchPressParams` / `AeropressParams` (모델만)
- 통합 `BrewingParams = PourOverParams | EspressoParams | FrenchPressParams | AeropressParams`
- discriminator = `method` 필드. service에서 `switch(params.method)` 로 narrow (`as` 금지)

기존 `RecipeParamsJson`/`RecipeStep` 폐기.

### 3-3. 신규 모듈 — `recipe`

**위치**: `apps/api/src/recipe/`
**파일**: `recipe.module.ts`, `recipe.controller.ts`, `recipe.service.ts`, `dto.ts`

**엔드포인트** (모두 JwtAuth + cafe membership 가드):
| Method | Path | 설명 |
|---|---|---|
| GET | `/cafes/:cafeId/recipes` | 카페 Recipe list (createdAt DESC), 사용 횟수 포함 |
| GET | `/cafes/:cafeId/recipes/:id` | 단건 조회 (RecipeEquipment populate) |
| POST | `/cafes/:cafeId/recipes` | 생성 (method, params, name?, equipmentIds?) |
| PATCH | `/cafes/:cafeId/recipes/:id` | 수정 (작성자 본인만, name·params·equipmentIds) |
| DELETE | `/cafes/:cafeId/recipes/:id` | 삭제 (작성자 본인만, Record.recipe는 set null) |

**DTO 검증**:
- `params.method`와 path/dto의 `method`가 일치하는지 service에서 검증 → `INVALID_RECIPE_PARAMS`
- 각 method별 required 필드 검증 (PourOver는 stages 1+개)
- equipmentIds는 글로벌 Equipment에 존재하는 id만 허용

**RecipeResponse 형태**:
```ts
{
  id, cafeId, name: string | null, method,
  params: BrewingParams | null,
  equipments: { id, type, name, brand, model }[],
  createdBy: { id, displayName } | null,
  createdAt,
  usageCount: number,           // E1 list에 표시
}
```

### 3-4. 신규 모듈 — `equipment`

**위치**: `apps/api/src/equipment/`
**엔드포인트** (모두 JwtAuth):
| Method | Path | 설명 |
|---|---|---|
| GET | `/equipments?type=brewer\|grinder\|...` | 전역 list (`source` 무관, `global`+`user` 모두 노출). type 필터 optional |
| POST | `/equipments` | 사용자 직접 등록 — `Equipment.source = USER`, `createdBy = me`. F1b form 대응 |

**POST 검증**:
- `type` 필수 (EquipmentType enum)
- `name` 필수 (length 1~120)
- `brand`, `model` optional (length ≤ 60/80)
- (name, brand, model, type) 동일한 `source = global` row가 이미 있으면 그 id 재사용 (중복 방지) — service에서 자동 처리, 클라이언트 영향 없음

`EquipmentResponse = { id, type, name, brand: string|null, model: string|null, source: 'global'|'user' }`.

> **`source` 노출 사유**: 클라이언트가 user-uploaded vs official 시각 구분이 필요할 때(예: F1 list에 작은 'My' 라벨)에 대비. 현 ticket UX는 동일하게 표시하지만, 필드는 미리 내려둔다 — 추후 admin verify 도입 시 enum 확장만으로 처리 가능.

### 3-5. Equipment seed

`apps/api/src/scripts/seed-equipments.ts` 신규 (1회용 idempotent 스크립트, ts-node):
- `Hario V60 02` (brewer), `Kalita Wave 185` (brewer), `Origami` (brewer)
- `Comandante C40` (grinder), `Timemore C2` (grinder), `1Zpresso K-Plus` (grinder)
- `Brewista Artisan` (kettle), `Fellow Stagg EKG` (kettle)
- `Acaia Pearl` (scale), `Hario V60 Drip Scale` (scale)
- 모두 `source = 'global'`, `createdBy = null`
- 실행: 사용자가 `pnpm --filter @home-coffing/api ts-node src/scripts/seed-equipments.ts` 직접 실행 (사용자 권한 요청 필수)

### 3-6. Record 모듈 수정

`apps/api/src/record/dto.ts` — `CreateRecordDto`/`UpdateRecordDto`에 `recipeId?: number | null` 추가.
`record.service.ts`:
- create: `recipeId` 있으면 `em.findOne(Recipe, { id, cafe: cafeId })` 검증 후 `record.recipe = recipe`. 없거나 null이면 그대로 null.
- update: `recipeId` 분기 동일. `null` 명시 시 set null.
- `RECORD_POPULATE`에 `'recipe', 'recipe.recipeEquipments', 'recipe.recipeEquipments.equipment', 'recipe.createdBy'` 추가
- `toResponse`에 `recipe: RecipeResponse | null` 포함 (RecipeService에 매퍼 분리 노출)

### 3-7. App module 등록

`app.module.ts` MikroORM entities에 `Recipe`, `RecipeEquipment` 추가, `CafeEquipment`/`RecordEquipment` 제거. `RecipeModule`, `EquipmentModule` import.

---

## 4. shared-types 변경 (`packages/shared-types/src/index.ts`)

추가:
```ts
// === Recipe ===
export type RecipeMethod = 'pour-over' | 'espresso' | 'french-press' | 'aeropress';
export type PourStyle = 'center' | 'circle-out' | 'circle-in' | 'spiral' | 'pulse' | 'continuous' | 'bloom-only';

export interface PourStage { label; startWaterGrams; endWaterGrams; startSec; endSec; pourStyle; direction?: 'cw'|'ccw'; notes?; }
export interface PourOverParams { method: 'pour-over'; doseGrams; grindSize; waterTempC; serveMode: 'hot'|'iced'; iceGrams?; totalYieldGrams; totalTimeSec; stages: PourStage[]; notes?; }
export interface EspressoParams { method: 'espresso'; doseGrams; grindSize; waterTempC; yieldGrams; pressureBar; preinfusionSec?; }
export interface FrenchPressParams { method: 'french-press'; doseGrams; grindSize; waterTempC; totalYieldGrams; steepTimeSec; }
export interface AeropressParams { method: 'aeropress'; doseGrams; grindSize; waterTempC; yieldGrams; steepTimeSec; orientation: 'standard'|'inverted'; }
export type BrewingParams = PourOverParams | EspressoParams | FrenchPressParams | AeropressParams;

export interface RecipeEquipmentInfo { id: number; type: EquipmentType; name: string; brand: string|null; model: string|null; }
export interface RecipeResponse { id; cafeId; name: string|null; method: RecipeMethod; params: BrewingParams|null; equipments: RecipeEquipmentInfo[]; createdBy: { id; displayName: string|null }|null; createdAt: string; usageCount: number; }
export interface RecipeCreateRequest { method; name?; params; equipmentIds?: number[]; }
export interface RecipeUpdateRequest { name?: string|null; params?: BrewingParams; equipmentIds?: number[]; }

// === Equipment ===
export type EquipmentType = 'grinder' | 'brewer' | 'scale' | 'kettle';
export type EquipmentSource = 'global' | 'user';
export interface EquipmentResponse { id; type: EquipmentType; name: string; brand: string|null; model: string|null; source: EquipmentSource; }
export interface EquipmentCreateRequest { type: EquipmentType; name: string; brand?: string; model?: string; }
```

수정:
- `RecordResponse`에 `recipe: RecipeResponse | null` 추가
- record create/update 요청 타입(현재 명시 export 없음 → 필요 시 추가)에 `recipeId?: number|null`

---

## 5. App 작업 (apps/app)

### 5-1. 신규 컴포넌트·sheet

| 파일 | 역할 | mockup |
|---|---|---|
| `src/components/RecipeChip.tsx` | 빠른 기록 시트의 Recipe chip (채워짐/빈 상태) | A1, A2 |
| `src/components/RecipeSummary.tsx` | Recipe 1줄 요약 ("V60 21g · 1:9 · 2'20") + method 배지 | B1, D1, E1 |
| `src/components/sheets/RecipeWizardSheet.tsx` | 5-step wizard (W1~W5), 내부 step state | W1-W5 |
| `src/components/sheets/EquipmentPickerSheet.tsx` | F1 — Equipment list + type pills + 하단 "+ 새 장비 등록" CTA | F1 |
| `src/components/sheets/EquipmentRegisterSheet.tsx` | F1b — 새 장비 등록 form (type chip + 이름·브랜드·모델). F1 위에 stack | F1b |
| `app/recipes.tsx` | E1 풀스크린 — 내 레시피 관리 (list + 우상단 + 새 레시피 → wizard) | E1 |
| `app/recipes/[id].tsx` | (선택) Recipe 상세·수정. **MVP 범위에서는 wizard 재진입으로 처리, 별도 라우트 미생성** | - |

### 5-2. 기존 화면 수정

- `src/components/sheets/QuickRecordSheet.tsx`:
  - 기록 시각 아래에 `<RecipeChip />` 영역 추가 (selected recipe state).
  - chip tap → inline dropdown 영역 toggle (이 sheet 내부에서 height 720→920로 visual 확장; 별도 sheet 아님)
  - dropdown list = 카페 Recipe + "⚙ 내 레시피 관리" 링크 + "+ 새 레시피" → wizard 진입
  - submit 시 `recipeId` 함께 전송. recipe nullable 유지(통과 가능).
  - 직전 Recipe prefill: 화면 mount 시 `useLastUsedRecipe(cafeId)` 훅 (lib/queries/recipes.ts 내부) → 가장 최근 Record.recipe.id로 default 설정. 없으면 빈 chip.

- `app/records/[id].tsx` (S06):
  - 원두 카드와 맛 노트 사이에 Recipe 카드 추가. 채움(D1) / 빈 placeholder(D2).
  - "변경" CTA → BottomSheet에 inline list (B1과 같은 형태) + "+ 새 레시피" → wizard
  - 본인 기록만 변경 가능 (record.user.id === me.id)

### 5-3. 신규 query 모듈

`apps/app/src/lib/queries/recipes.ts`:
- `useRecipes(cafeId)` — list, queryKey `['recipes', cafeId]`
- `useCreateRecipe(cafeId)` / `useUpdateRecipe` / `useDeleteRecipe` — invalidate `['recipes', cafeId]` + `['records', cafeId]`
- `useLastUsedRecipe(cafeId)` — records list 첫 항목의 recipe id 추출 (records 쿼리 재사용)

`apps/app/src/lib/queries/equipments.ts`:
- `useEquipments(type?)` — list (`global`+`user` 모두), queryKey `['equipments', type ?? 'all']`, staleTime 1시간
- `useCreateEquipment()` — F1b 등록. 성공 시 `['equipments', ...]` invalidate 후 새 id를 caller에 반환 → F1에서 자동 선택 처리

### 5-4. UX 세부

- **Wizard 5-step**: 토스 스타일 (큰 타이틀, helper text, step indicator 5 dots, 이전/다음 CTA). 각 step에서 invalid 시 "다음" disabled.
  - W1: 4 method 카드 list. pour-over는 active, 나머지 3개 disabled with "곧 출시" 칩 (ticket UX 결정 3)
  - W2: dose / grindSize (text input) / waterTemp
  - W3: hot / iced segmented + totalYield + totalTime (mm:ss). iced일 때 iceGrams 필드 토글 노출 (mockup vupNk)
  - W4: stages 추가/삭제 (default 1개 = "전체"), 각 row inline 입력
  - W5: equipment chip add → F1 sheet (F1 하단 "+ 새 장비 등록" tap → F1b form → 등록 성공 시 F1b 닫고 F1 list refetch + 새 등록 항목 자동 선택 → W5 복귀), name input(placeholder 자동), `[저장]` CTA
- **placeholder 자동 생성**: `${methodLabel} ${dose}g 1:${ratio} ${temp}°C`. helper 함수 `lib/recipe-format.ts`에 분리. 서버 저장은 placeholder로 미저장 (null 유지).
- **chip 빈 상태 → 곧장 wizard 진입** (ticket UX 결정 1 — A2 → W1)

### 5-5. 신규 라우트 등록

`app/_layout.tsx` Stack에 `recipes` 추가 (presentation: 'card', headerShown).

---

## 6. 이벤트 추가 (event-taxonomy.md)

| event | properties | 발화 위치 |
|---|---|---|
| `recipe_created` | recipeId, method, hasName(boolean), equipmentCount, stageCount(pour-over만) | W5 저장 성공 시 |
| `recipe_used` | recipeId, method, source('quick_record'\|'record_detail') | record create/update 성공 시 (recipeId 변경 있을 때만) |
| `equipment_created` | equipmentId, type | F1b 등록 성공 시 (사용자 catalog 보강 양 관찰용) |
| `record_created` (수정) | 기존 + `recipeId: number\|null` 추가. LIFE-5에서 제거됐던 `recipe_param_count` 부활 X (recipe 자체 식별로 충분) |

ticket done 시 event-taxonomy.md에 위 3건 등록.

---

## 7. 작업 순서 (의존 그래프)

> Phase 2 자동 실행 순서. shared-types와 enum 변경이 양 끝단 의존이라 가장 먼저.

1. **shared-types** 추가 (api·app 양쪽 import 가능하게) — 메인 직접
2. **API enum/entity 변경** (api-engineer)
   - 2-1. enums.ts RecipeMethod 교체, recipe-params.ts 타입 교체
   - 2-2. Recipe 엔티티 ALTER (cafe FK, name nullable, params 타입), RecipeEquipment 신규 생성, CafeEquipment/RecordEquipment 파일 삭제, Cafe/Record/Equipment 백참조 정리, entities/index.ts 정리
   - 2-3. **사용자에게 `pnpm schema:update` 권한 요청** → 실행 후 진행
3. **API recipe / equipment 모듈 신규** (api-engineer)
4. **Equipment seed 스크립트 작성** (api-engineer) → **사용자에게 실행 권한 요청**
5. **API record 모듈 수정** (api-engineer, recipe 모듈 의존)
6. **QA 1차** (qa-engineer): API 단독 — DTO/엔티티/이벤트/권한 분기
7. **App query 모듈** (client-engineer) — recipes.ts, equipments.ts
8. **App 신규 sheets** (client-engineer) — RecipeWizardSheet, EquipmentPickerSheet, RecipeChip, RecipeSummary, recipe-format helper
9. **App QuickRecordSheet 수정** (client-engineer)
10. **App 기록 상세 Recipe 카드** (client-engineer)
11. **App 내 레시피 관리 화면 E1** (client-engineer)
12. **QA 2차** (qa-engineer): API ↔ Client shape, 권한, 이벤트 발화 위치, design.pen S05/S06 정합
13. **통합 QA + design.pen 갱신 위임** (client-engineer 보조)

---

## 8. QA 체크리스트 (모듈별)

**API 단독:**
- [ ] Recipe CRUD 401/403/404 (cafe 비멤버, 작성자 아닌 사람의 PATCH/DELETE)
- [ ] params.method ↔ Recipe.method 불일치 → 400 INVALID_RECIPE_PARAMS
- [ ] equipmentIds catalog(`source` global+user)에 없는 id → 400
- [ ] POST /equipments — 동일 (name, brand, model, type, source=global) row 존재 시 그 id 재사용 (중복 차단)
- [ ] POST /equipments — name 누락 / type invalid → 400
- [ ] Record.recipeId 다른 카페의 recipe id → 400/404
- [ ] Recipe 삭제 시 Record.recipe set null (FK rule 검증)
- [ ] schema:update 후 lint·build 통과

**API ↔ Client:**
- [ ] RecipeResponse, RecordResponse.recipe shape 일치 (snake/camel 없음)
- [ ] BrewingParams discriminated union이 client에서 `as` 없이 narrow 되는지
- [ ] 401 시 refresh → recipe API 재시도 흐름

**App UX:**
- [ ] A1/A2 chip 상태 토글 (recipe 있음/없음)
- [ ] B1 dropdown inline 확장(별도 sheet 아님)
- [ ] Wizard 5-step 진행 + back/cancel/dirty close
- [ ] iced일 때만 iceGrams 필드 노출 (W3iced)
- [ ] F1 type pill 전환·Equipment 카드 선택 → W5 복귀
- [ ] F1 하단 "+ 새 장비 등록" → F1b form → 등록 성공 시 자동 선택 + F1 list refetch
- [ ] D1/D2 Recipe 카드 + 변경 동선
- [ ] E1 풀스크린 + 사용 횟수 표시

**Spec 정합:**
- [ ] design-system.md 색·tone과 신규 sheet 일치 (별도 토큰 추가 없음)
- [ ] event-taxonomy.md 신규 이벤트 3건 등록
- [ ] design.pen S05b/S05d/S05e/S06 frame 갱신 (Pencil MCP)

**운영 가드레일:**
- [ ] metro.config.js·babel.config.js·app.json 미변경
- [ ] 새 dependency 도입 없음 (또는 `npx expo install`로만 추가 — 사용자 권한 요청)
- [ ] schema:update / seed 스크립트 실행은 **모두 사용자가 직접**

---

## 9. ticket done 시 spec 갱신 항목

- **screens.md**:
  - S05 라인 추가: `🟡 Recipe chip + inline dropdown(B1) — LIFE-6 (2026-05-XX)` (기존 S05 양만 라인 유지)
  - S05b: `🟡 → ✅ Recipe wizard 5-step (W1~W5, F1 sub-sheet) — LIFE-6 (2026-05-XX)`
  - S05 신규: `✅ 직전 Recipe prefill — LIFE-6` (003 직전 원두 prefill 라인과 같은 패턴)
  - S06: `🔴 → ✅ Recipe 카드 표시 + 변경 동선 — LIFE-6 (2026-05-XX)`
  - 신규 entry: `## 내 레시피 관리 — [design.pen S05e]` (E1 풀스크린, recipe 카드 list + 새 레시피 진입)
- **event-taxonomy.md**: `recipe_created`, `recipe_used`, `equipment_created` 추가 / `record_created`에 `recipeId` 추가 (LIFE-5에서 제거된 `recipe_param_count`는 부활 X)
- **design-system.md**: 변경 없음 (기존 토큰·컴포넌트 카탈로그 재사용)
- **design.pen**: S05 chip variant, S05b inline dropdown, S05d wizard 5-step(W1~W5), F1 selector + F1b 등록 form, S05e E1 frame, S06 Recipe 카드 — Pencil MCP로 갱신
- **tickets/CLAUDE.md**: Done 섹션으로 이동, status: done

---

## 10. 미해결 / 사용자 컨펌 필요 항목

1. **`pnpm schema:update` 실행 — 사용자가 직접**: CafeEquipment·RecordEquipment 테이블 DROP 포함. 002 backfill로 들어간 이 테이블의 row가 정말 비어있는지 사용자 확인 필요(prod DB 기준).
2. **Equipment seed 카탈로그 10개**: 위 3-5의 list가 적절한지 사용자 confirm. 추가/삭제 의견 있으면 dev-plan 단계에서 정정.
3. **W1의 비-pour-over 3개 method 처리**: ticket은 "곧 출시" disabled로 정의 → MVP 그대로 진행. 만약 wizard 자체를 pour-over만 노출하고 싶으면 변경.
4. **E1 `app/recipes.tsx` 라우트 위치**: `(main)` 탭 안 X / 풀스크린 push만 (B1 dropdown에서만 진입). ticket UX 결정 7 그대로.
5. **F1b 사용자 등록 Equipment의 가시성**: 등록 직후 *모든 카페 멤버에게* 즉시 글로벌 노출 (admin verify 없음). ticket 결정 그대로 진행. user-source row가 catalog를 오염시킬 우려는 추후 OOS 6의 admin verify로 해결 예정.

---

## 11. 작업 단위 (Phase 2 TaskCreate 매핑 예정)

| Task | 담당 | blockedBy |
|---|---|---|
| T1 shared-types | 메인 | - |
| T2 API enum/entity reshape | api-engineer | T1 |
| T3 schema:update (사용자) | 사용자 | T2 |
| T4 API recipe/equipment 모듈 | api-engineer | T3 |
| T5 Equipment seed 스크립트 | api-engineer | T4 |
| T6 seed 실행 (사용자) | 사용자 | T5 |
| T7 API record 수정 | api-engineer | T4 |
| T8 QA 1차 (API) | qa-engineer | T7 |
| T9 App query 모듈 | client-engineer | T1 |
| T10 App 신규 sheets/components (RecipeWizard, EquipmentPicker, EquipmentRegister, RecipeChip, RecipeSummary) | client-engineer | T9 |
| T11 App QuickRecordSheet 수정 | client-engineer | T10 |
| T12 App 기록 상세 Recipe 카드 | client-engineer | T10 |
| T13 App E1 라우트 | client-engineer | T10 |
| T14 QA 2차 (통합) | qa-engineer | T11, T12, T13 |
| T15 design.pen 갱신 | client-engineer | T14 |
