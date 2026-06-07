---
ticket: 004
qa_round: 1 (integrated)
created: 2026-05-08
---

# QA — Ticket 004 (Round 1, Integrated)

## Summary

API CRUD/권한/검증 골격은 dev-plan §8 체크리스트 모두 통과. shared-types ↔ API ↔ client는 필드 단위로 일관 — `as` 강제 narrowing 없이 discriminated union이 잘 분기된다(`recipe.service.ts:261`, `recipe-format.ts:55`). 다만 (1) **API DTO interface `RecipeResponse`/`RecordResponse`의 날짜 타입이 `Date` vs shared-types `string`** 으로 일치하지 않고 (런타임은 OK이나 type guarantee 누수), (2) **`RecordService.updateRecord`의 recipe 재할당 로직이 redundant query를 만들고**, (3) **wizard step state에 user 스타일 가이드 위반 `as 1|2|3|4|5` 잔존**이 눈에 띈다. 모두 Major 이하 — 배포 차단 항목 없음.

## Critical (배포 차단)

없음.

## Major (배포 전 수정 권장)

| # | 위치 | 이슈 | 수정 권고 |
|---|---|---|---|
| M1 | `apps/api/src/recipe/dto.ts:78` (`RecipeResponse.createdAt: Date`), `apps/api/src/record/dto.ts:90-100` (`brewedAt/loggedAt/createdAt: Date`) | API DTO interface는 Date 객체로 선언, shared-types는 `string`(ISO). 런타임은 NestJS가 JSON serialize하면서 ISO string으로 자동 변환되므로 동작 OK이나, **API 코드 안에서 RecipeResponse를 type-check할 때 Date로 다루게 되어 일관성이 깨진다**. 동일 객체에 대한 두 source-of-truth가 생김. | 둘 중 하나로 통일: API DTO도 `string`으로 선언하고 service에서 `.toISOString()` 명시 변환, **또는** shared-types를 따라가지 말고 백엔드만 Date 유지 + 클라이언트에서는 NestJS serialization 가정. 후자라면 shared-types `RecordResponse.brewedAt: string` 그대로 유지하되 API의 `RecordResponse` interface를 shared-types에서 import해 type-level 단일화 권장. |
| M2 | `apps/api/src/record/record.service.ts:169-177` | `dto.recipeId !== null`일 때 `resolveRecipe`로 검증 후 결과를 버리고 `em.getReference(Recipe, dto.recipeId)`로 재할당. 이후 `findOneOrFail`로 다시 populate 조회 → **불필요 SQL 1회 추가**. 또한 resolveRecipe가 returning한 entity를 그대로 assign하면 트랜잭션 내 identity-map으로 동일 reference로 처리되어 추가 query 없음. | `resolveRecipe(...)` 결과를 변수에 받아 `wrap(record).assign({ recipe })`로 직접 사용. |
| M3 | `apps/app/src/components/sheets/RecipeWizardSheet.tsx:398, 412` | `setStep(s => (s > 1 ? ((s - 1) as 1\|2\|3\|4\|5) : s))` — user style guide(`CLAUDE.md`)의 "as 단언 극도로 기피" 위반. step은 1~5 정수이므로 더 단순한 형태로 가능. | step state 타입을 `number`로 두고 사용처에서 `as` 제거하거나, `nextStep`/`prevStep` 헬퍼로 분리해 narrowing 없이 처리. |
| M4 | `apps/app/src/lib/queries/recipes.ts:43-50, 60-75, 80-93` | `useCreateRecipe(cafeId: number \| null)` / Update / Delete 모두 cafeId가 null인 상태에서 mutate 호출하면 URL이 `/cafes/null/recipes`로 빌드되어 서버에서 400/404. 호출자(wizard, recipes.tsx)는 항상 활성 cafeId를 보장하지만 **타입 시그니처가 그 보장을 강제하지 않음**. | mutationFn 안에서 `if (cafeId === null) throw new Error(...)` 가드 또는 hook 자체를 `cafeId: number`로 강제(호출자에서 conditional render 이미 함). |
| M5 | `apps/api/src/equipment/equipment.service.ts:97-99` (`toSourceDto`의 `case CAFE: return 'user'`) | EntitySource.CAFE row가 catalog list에 도달할 가능성은 0이지만, fallback이 'user'로 silent 변환 — 안전하지 않은 거짓말. 미래에 CAFE source가 다른 경로(예: recipe.equipments populate)로 응답에 흘러들면 클라이언트가 'user'로 오인. | 도달 불가능을 명시적으로 표현: `case CAFE: throw new Error('cafe-source equipment leaked to catalog response')` 또는 list 쿼리에서 GLOBAL/USER만 가져오도록 강제(이미 그렇긴 함) + `assertNever` 패턴. |

## Minor (이슈 트래킹용)

| # | 위치 | 이슈 | 권고 |
|---|---|---|---|
| m1 | `apps/api/src/common/entities/recipe.entity.ts:39` | `params: BrewingParams \| null = null` — UI는 항상 params 채워서 보내고 service는 params 검증함. 그래서 nullable 필요성 약함(현재 운영상 null 들어갈 경로 없음). 그러나 entity는 nullable 허용 → toRecipeResponse에서 `params: BrewingParams \| null` 응답. shared-types도 nullable이라 일관 OK. | 그대로 두되 dev-plan §3-1 의도 그대로. 이슈 X — 기록만. |
| m2 | `apps/app/src/components/sheets/RecipeWizardSheet.tsx:130-138` | `initial.equipments` (shape: `RecipeEquipmentInfo`)를 EquipmentResponse-shape으로 변환할 때 `source: "user"`로 임의 채움. 실제 source 정보는 RecipeResponse가 안 내려줌. wizard에서 source 필드 사용처 없으므로 **표시 영향 없음**이나 거짓 데이터. | RecipeEquipmentInfo에 source 추가하거나, wizard 내부 state를 별도 타입으로 분리해 source 필드를 안 갖게. |
| m3 | `apps/api/src/recipe/recipe.service.ts:230-244` | `computeUsageCounts`의 raw SQL — alias 안 쓰는 user 스타일 정합 OK. 다만 `[recipeIds]` 배열 바인딩이 `IN (?)` 위치에 들어가는데 driver(MikroORM mysql2)가 자동 expand. 동작 확인 시 명시적 `?`*N 또는 `qb` 쿼리빌더가 안전. | 운영 수치(usage count) 정확성 한 번 확인. 코드만 보면 `[recipeIds]`는 outer array — `mysql2` 형식상 OK이나 raw 확인 권장. |
| m4 | `apps/app/src/components/sheets/RecipeWizardSheet.tsx:184-195` (`isDirty`) | label 변경, stage 시간 변경, pourStyle 변경 등은 isDirty 미감지. 사용자가 step 4에서 만지다가 X 누르면 confirm 없이 닫힘. | stage 별 deep 비교 또는 "사용자 인터랙션 발생" flag로 단순화. |
| m5 | `apps/api/src/recipe/recipe.service.ts` 전반 | stages 시간순/수량 모순(예: startSec > endSec, 다음 stage startSec < 이전 endSec, endWaterGrams > totalYieldGrams) 검증 없음. | params validation 강화 시기 추후 결정. 현재 UI도 강제 X — 데이터 신뢰도 낮은 상태로 시작. 후속 ticket 후보. |
| m6 | `apps/app/src/lib/queries/recipes.ts:104-113` (`useLastUsedRecipeId`) | `useRecordsList(cafeId, { limit: 1 })` — records list와 별도 queryKey(`['records', cafeId, opts]`)이므로 메인 records list 캐시와 분리되어 fetch 한 번 더 발생. limit=1이라 부담은 작음. | 메인 records list가 있으면 그걸로 derive하고, 없을 때만 limit=1 fetch. 또는 prefill UX가 가치 대비 비용이라면 그대로. |
| m7 | `apps/app/src/lib/queries/recipes.ts:33` (`useRecipe` enabled) | `recipeId !== null && cafeId > 0` — recipeId === 0이면 통과해 `/cafes/X/recipes/0` 호출. 현재 사용처 없으므로 dormant. | enabled에 `recipeId > 0` 추가. |
| m8 | `apps/app/src/components/sheets/RecipeWizardSheet.tsx:1` | `import { ChevronDown, X as XIcon }` — `as` 자체는 alias라 user 가이드의 단언과 다름(허용). | 기록만 — 영향 없음. |
| m9 | `apps/api/src/record/record.service.ts:179` 주석 `dto.cups는 entity 컬럼이 없으므로 silently ignored` | 003 시점 카멘트지만 004 dto에서도 cups 받음. dev-plan과 무관(004 변경 영역 X). | 003 OOS 잔재. 후속 ticket에서 dto에서도 제거. |
| m10 | `spec/event-taxonomy.md` | `recipe_created` / `recipe_used` / `equipment_created` / `record_created.recipeId` — dev-plan §6에 정의됐지만 코드에 analytics SDK 없음. ticket done 시 spec 추가 예정 (dev-plan §9 명시). | dev-plan 그대로 — ticket done 시 처리. |
| m11 | `spec/design.pen` | mockup.pen은 frame 정의됨 (Zlahn/Zh2uH/A6J0kL/h29jD/vupNk/Wr1xP/L6rJdU/S7llC/Zrmal). spec/design.pen 운영 화면 frame 갱신은 dev-plan §9 ticket done 시. | ticket done 시 처리. |

## OK (확인됨)

- **Recipe CRUD 권한 분기** — `assertMembership` (recipe.service:182), 작성자 본인만 PATCH/DELETE (`recipe.service:122-124, 172-174`), `findOne({id, cafe: cafeId})`로 다른 카페 id 접근 시 404 → `recipe.service:166`. 기준 통과.
- **`params.method` ↔ `Recipe.method` 일치 검증** — `validateBrewingParams` 첫 분기 (`recipe.service:255-260`).
- **method별 required 필드 검증 + PourOver stages 1+개** — `recipe.service:262-326`.
- **equipmentIds catalog 검증** — `resolveEquipments` (recipe.service:210-224)에서 GLOBAL+USER만, count mismatch 시 400.
- **POST /equipments 중복 차단** — `equipment.service:46-69`. (type, name, brand=null, model=null, source=global) 기존 row 있으면 그 id 반환.
- **POST /equipments invalid 입력** — class-validator (`@MinLength(1)`, `@IsEnum`) + controller의 query string `parseEquipmentType`.
- **Record.recipeId 다른 카페 → 404** — `record.service.resolveRecipe`가 `{id, cafe: cafeId}` 조건 → 미발견 시 NOT_FOUND.
- **Recipe 삭제 시 Record.recipe set null** — `record.entity.ts:44` `deleteRule: 'set null'`. 사용자 schema:update 완료 명시.
- **`RECORD_POPULATE`** — recipe + recipeEquipments + equipment + createdBy 모두 포함 (`record.service:29-40`).
- **API build 통과** — `pnpm --filter @home-coffing/api build` 성공 (lint/타입 OK).
- **`as` 단언 극도로 기피** — API 코드 전체에 `as <type>` 단언 없음(`as RecordEntity`/`as const`만). recipe-format/wizard도 `as const`만 (M3 step narrowing 빼고). discriminated union narrowing 모두 `switch(params.method)` 패턴.
- **shared-types ↔ API ↔ client field shape 정합** — Recipe / Equipment / RecordResponse.recipe / RecipeEquipmentInfo / EquipmentResponse 필드명·옵셔널·null 허용 모두 일치. (M1 Date vs string 제외)
- **RecipeChip 채워짐/빈 상태 분기** — `RecipeChip.tsx:21-39, 44-73`. 빈 상태 점선 + "+ 레시피 추가". 정합 OK.
- **chip 빈 상태 → 곧장 wizard** — QuickRecord:359-365 `if (!hasSelection) setWizardOpen(true)`.
- **inline dropdown (sheet 아님)** — QuickRecord:367-468 같은 BottomSheet 안 inline 확장. 별도 sheet 호출 없음.
- **Wizard 5-step + indicator + 이전/다음/저장 + dirty close** — RecipeWizardSheet:103, 341, 395-424, 197 (useDirtyClose).
- **W3 iced → iceGrams 토글** — RecipeWizardSheet:633-640 `serveMode === "iced"`일 때만 iceGrams 입력 노출.
- **F1 EquipmentPicker — type pills (전체/그라인더/드리퍼=brewer/케틀/저울) + list + "+ 새 장비 등록" 점선 CTA** — EquipmentPickerSheet:19-25, 132-149.
- **F1b — type/이름/브랜드/모델 + 등록 후 자동 선택 + list refetch** — EquipmentRegisterSheet:62-77, EquipmentPickerSheet:153-161 (onCreated → onPick + invalidate by query key).
- **D1/D2 기록 상세 Recipe 카드 — 본인 기록만 변경 가능** — records/[id].tsx:255-263. `if (!isMine) return`. 변경 BottomSheet inline list (395-466).
- **E1 풀스크린 — list + 사용 횟수 + 우상단 + + tap=수정 wizard + longPress=삭제** — recipes.tsx:79-85 (+), 134-178 (카드, longPress→actions sheet→삭제).
- **last-used Recipe prefill** — `useLastUsedRecipeId`: records 첫 항목.recipe.id 우선, 없으면 첫 recipe (recipes.ts:104-113). QuickRecord:84-88 `recipeTouched=false`인 동안만 prefill.
- **운영 가드레일** — metro.config.js / babel.config.js / app.json / pnpm-workspace.yaml / packageManager 미변경(git diff 범위 밖). 새 dependency import 없음 (lucide-react-native 기존, @gorhom/bottom-sheet 미도입). MikroORM v6 import 그대로(`@mikro-orm/core`, `@mikro-orm/mysql`, `@mikro-orm/nestjs`).
- **app.module.ts** — RecipeModule, EquipmentModule 등록, CafeEquipment/RecordEquipment 모듈/엔티티 제거됨.
- **entities/index.ts** — Recipe, RecipeEquipment, Equipment 그대로 export, CafeEquipment/RecordEquipment export 제거됨.

## Recommendations

### ticket done 시 처리 항목 (dev-plan §9 그대로)

- `spec/event-taxonomy.md`에 `recipe_created` / `recipe_used` / `equipment_created` 추가, `record_created`에 `recipeId` 추가
- `spec/screens.md` S05/S05b/S05d/S05e/S06 라인 갱신
- `spec/design.pen` S05·S05b·S05d·S05e·S06·F1·F1b frame 갱신 (Pencil MCP)
- `tickets/CLAUDE.md` 004 → Done 섹션, status: done

### 후속 ticket 분리 권장

1. **stages 무결성 검증** (m5) — 시간/수량 모순 검사 + UI 가드. 데이터 신뢰도 우선순위 결정 후 별도 ticket.
2. **API DTO ↔ shared-types 단일 source-of-truth** (M1) — 현재 RecordResponse 등 한쪽 type-level만 정확. shared-types를 API에서 직접 import 하는 패턴으로 통일하는 리팩 ticket.
3. **analytics SDK 통합** (m10) — event-taxonomy 정의는 있으나 발화 wrapper 없음. event 도입 ticket이 별도로 살아있다면 거기서 처리.
4. **dto.cups 잔재 제거** (m9) — 003 OOS 마무리.

### 즉시 차단 권고

없음 — Critical/운영 가드레일 위반 0건.

---

## Round 2 — Major fix log (2026-05-08)

| # | 처리 | 위치 |
|---|---|---|
| M2 | ✅ resolveRecipe 결과를 그대로 assign — redundant getReference + 중복 query 제거 | `apps/api/src/record/record.service.ts:169-175` |
| M3 | ✅ step state를 `number`로 변경, `as 1\|2\|3\|4\|5` 제거. `Math.max(1, s-1)` / `Math.min(5, s+1)`로 단순화. canAdvance에 default 분기 추가 (number 타입 호환) | `apps/app/src/components/sheets/RecipeWizardSheet.tsx:103, 295, 398, 411` |
| M4 | ✅ recipes mutation 훅 3종에 `assertCafeId` 가드 추가 — null/0 호출 시 mutate 단계에서 예외 (URL `/cafes/null/recipes` 차단) | `apps/app/src/lib/queries/recipes.ts:40-95` |
| M5 | ✅ `toSourceDto`의 `case CAFE`를 silent fallback에서 `throw new Error(...)`로 교체 — 안전하지 않은 거짓말 제거 | `apps/api/src/equipment/equipment.service.ts:97-99` |
| M1 | ⏸ 후속 ticket으로 분리 — API DTO Date vs shared-types string 정합 정정은 RecipeResponse 한 곳이 아닌 RecordResponse 등 광범위 영향. ticket 004 scope 외 일관 cleanup으로 처리 권장 |

빌드 결과:
- `pnpm --filter @home-coffing/api build` ✅
- `pnpm --filter app exec tsc --noEmit` ✅ (LIFE-6 신규 코드 0 에러. `app/records/[id].tsx:184` MemberAvatar size 36 에러는 본 ticket 외 기존 main 문제 — 별도 ticket 권장)

DB 마이그레이션:
- `pnpm --filter @home-coffing/api schema:update` ✅ (cafe_equipment·record_equipment DROP, recipe ALTER, recipe_equipment CREATE)
- `seed-equipments.ts` ✅ inserted=10 (V60 02/Kalita Wave 185/Origami/Comandante C40/Timemore C2/1Zpresso K-Plus/Brewista Artisan/Fellow Stagg EKG/Acaia Pearl/V60 Drip Scale)

---

## Round 3 — Equipment 모델 단순화 + 카탈로그 확장 (2026-05-08)

사용자 결정 따른 follow-up:

| 변경 | 위치 |
|---|---|
| ✅ `Equipment.source` 컬럼·필드 제거 — 클라이언트 실사용 0이라 응답·shared-types까지 정직하게 정리 | `apps/api/src/common/entities/equipment.entity.ts` (source 필드 제거), `enums.ts` (USER 멤버 제거) |
| ✅ `equipment.service.ts` — list orderBy를 source 무관 name asc만, create 중복 차단도 (type, name, brand, model)로 단순화 (source 분기 제거). `toSourceDto`/M5 throw 자연 소멸 | `apps/api/src/equipment/{equipment.service.ts, dto.ts}` |
| ✅ shared-types `EquipmentSource` 제거, `EquipmentResponse.source` 제거 | `packages/shared-types/src/index.ts` |
| ✅ `RecipeWizardSheet.tsx:137` 거짓 source 채움 자리 자연 제거 (m2 동시 해소) | `apps/app/src/components/sheets/RecipeWizardSheet.tsx` |
| ✅ `apps/app/src/lib/types.ts` — EquipmentSource re-export 제거 | 동 파일 |
| ✅ `recipe.service.ts:resolveEquipments` — source IN [GLOBAL, USER] 필터 제거 (catalog 통일) | 동 파일 |
| ✅ Equipment 카탈로그 확장 10 → 25 (brewer 8 / grinder 8 / kettle 4 / scale 5) | `seed-equipments.ts` |
| ✅ schema:update 재실행 → source 컬럼 DROP, EntitySource enum value 변경 | DB |
| ✅ seed 재실행 (inserted=16, skipped=9) + 구버전 'Origami(model null)' 행 1개 수동 cleanup → 최종 25 rows | DB |

**brand·type 정규화** — 사용자 결정대로 후속 ticket. type=enum 4종, brand=free string 유지.

**displayOrder 컬럼**: 미도입 (사용자 명시 컨펌 X). 정렬은 name asc. 후속 가치 명확해지면 추가 ticket.

### E1 진입점 추가 — 홈카페 설정 → 카페 자원 (2026-05-08)

| 변경 | 위치 |
|---|---|
| ✅ `cafe-settings.tsx`에 "카페 자원" 섹션 + "내 레시피 관리" Pressable → `router.push('/recipes')` (Coffee 아이콘) | `apps/app/app/cafe-settings.tsx` |
| ✅ `spec/screens.md` S10에 라인 추가 (LIFE-6 ref) | brain repo |
| ✅ `LIFE-6`에 G1 frame 신규 (`w3kh6m`) | brain repo |
| ✅ ticket.md / CLAUDE.md mockup 인덱스에 G1 추가 | brain repo |

**사유**: 빈 chip 상태(레시피 0개)인 첫 사용자가 E1 못 들어가던 dead-end 해소 + Recipe = 카페 종속 자원이라는 모델 표현 정합. ticket UX §7 "B1 dropdown 한 곳"은 *빠른 기록의 ⋯ 메뉴*를 거부한 결정이지 카페 설정과는 다른 면 — 의도와 충돌 X.

---

## Round 4 — Wizard 4-step + Hybrid PourStage 전환 (2026-05-08)

사용자 디자인 단계 재진입 후 결정 (brain repo commit `6f3ffd3`, `3ebb745`, `b911e3b`, `ab8741f`):

### 결정 요약
- **Wizard 5-step → 4-step**: W1 method / W2-B 셋업 / W3-B 푸어 / W4-B 마무리
- **W2-B 셋업** = 모든 메타 입력 한 화면 (dose / grindSize / waterTempC / mode / totalYield / totalTime / iceGrams). derive 아닌 명시 입력 — W3-B 상단 dark summary는 W2-B target 값 인용.
- **PourStage Hybrid 모델 ★**: `{ label, startSec(절대), pourGrams(delta), pourStyle?, direction?, notes? }` — 시간 절대 / 물량 delta / 스타일·방향 선택 / 메모 자유.
- **W3iced 폐기** (vupNk frame 캔버스에는 잔존, mockup index 제외)
- 누적 stat badge = `stages.slice(0, idx+1).reduce(pourGrams)`

### 변경 처리
| # | 처리 | 위치 |
|---|---|---|
| ✅ shared-types `PourStage` 교체 (Hybrid) | `packages/shared-types/src/index.ts` |
| ✅ API `recipe-params.ts` PourStage 동기 | `apps/api/src/common/types/recipe-params.ts` |
| ✅ `recipe.service.validateBrewingParams` PourOver stages 검증 재작성 (label 1+ / startSec ≥ 0 / pourGrams > 0 / startSec asc 정렬 in-place) | `apps/api/src/recipe/recipe.service.ts` |
| ✅ `RecipeWizardSheet.tsx` 5-step → 4-step 전면 재작업: Step1 W1 그대로 / Step2 W2-B 통합(dose/분쇄도/온도 + mode + yield/time/ice) / Step3 W3-B 푸어(요약 카드 + compact stage 카드 + 누적 badge) / Step4 W4-B 마무리(장비 list + 이름 + 저장) | `apps/app/src/components/sheets/RecipeWizardSheet.tsx` |
| ✅ PourStageEditSheet (PS1) 신규 — 라벨/시점/부은 양/스타일/방향/메모 + 삭제·저장 | 동 파일 내 자식 sheet |
| ✅ StageDraft 모델 hybrid 통일 (`label/startSec/pourGrams/pourStyle/direction/notes`) | 동 파일 |
| ✅ `recipe-format.ts`에 `cumulativePourGrams`, `pourStyleShort` 헬퍼 추가 | `apps/app/src/lib/recipe-format.ts` |

### 빌드
- `pnpm --filter @home-coffing/api build` ✅
- `pnpm --filter app exec tsc --noEmit` ✅ (LIFE-6 신규 0 에러. 기존 MemberAvatar 36만 잔존)
- DB 변경 없음 (`Recipe.params`는 JSON column, schema:update 불필요)

### 미해결 / 후속 메모
- **stages 중복 startSec**: service 검증에서 명시 거부 X — sort만 적용. 후속 ticket에서 중복 룰 필요해지면 추가.
- **direction 정규화**: pourStyle이 circle 계열 외인데 direction 박혀 있어도 service raw 저장. 클라이언트는 circle 외 → direction 자동 null 클리어로 처리.
- **PS1 dirty close confirm 미적용**: wizard 본체엔 useDirtyClose, PS1 sub-sheet은 명시적 ←/✕/저장 액션만 — 우선 단순화.
- **타이머 모드 (라이브 녹화)** — mockup §"미래 확장" OOS, 후속 ticket.

---

## Round 5 — UX 미세 조정 (2026-05-08)

실기기 점검 직전 사용자 피드백 3건 반영:

| # | 변경 | 위치 |
|---|---|---|
| 1 | **mm:ss 시간 입력 마스킹** — 사용자가 콜론 삭제 불가. `maskMmSs(input)` 헬퍼 신규: 숫자만 추출 → "045" → "0:45" 자동 포맷. keyboard `numeric` 강제. W2-B 총 시간 + PS1 시점 둘 다 적용 | `apps/app/src/lib/recipe-format.ts` (헬퍼), `apps/app/src/components/sheets/RecipeWizardSheet.tsx` (W2-B CellText·PS1 startSec input) |
| 2 | **분쇄도 number만** — `grindSize: string → number` 전 레이어. shared-types / API recipe-params / recipe.service.validateBrewingParams / wizard W2-B input(CellText → CellNumber) / placeholder format | `packages/shared-types/src/index.ts`, `apps/api/src/common/types/recipe-params.ts`, `apps/api/src/recipe/recipe.service.ts`, `apps/app/src/components/sheets/RecipeWizardSheet.tsx` |
| 3 | **W3-B 카드 컬럼 swap** — 라벨 → **누적 badge(가운데, accent 강조)** → +pourGrams/시점(우측 flex) → chevron. 누적값이 사용자 인지 우선순위 ↑ | mockup `HCSHL` + J1.4 사본 `k8kw3`(Pencil M op), `apps/app/src/components/sheets/RecipeWizardSheet.tsx` Step3Stages 카드, `mockup.md` §W3-B 갱신 |

빌드:
- `pnpm --filter @home-coffing/api build` ✅
- `pnpm --filter app exec tsc --noEmit` ✅ (LIFE-6 신규 0 에러)
- DB 변경 없음 (params JSON 그대로)

빌드 확인:
- `pnpm --filter @home-coffing/api build` ✅
- `pnpm --filter app exec tsc --noEmit` ✅ (LIFE-6 신규/수정 코드 0 에러. MemberAvatar 36 기존 에러만 잔존)

후속 권장 ticket 1번(M1)은 그대로 유지. m5(stages 무결성 검증), 새 장비 등록(F1b) UX의 `displayOrder`/인기순 정렬은 운영 데이터 누적 후 결정.

---

## Round 6 — records list cache 버그 fix (2026-05-08)

실기기에서 발견된 데이터 표시 버그 (홈 탭 + 피드 탭).

**증상:**
- 첫 진입 시 records list가 일부만 뜸
- pull to refresh → 더 뜸
- 다른 탭 다녀오면 풀 list 정상

**원인:** `recordKeys.cafeList(cafeId, beanId)` queryKey가 limit을 무시 → 셋이 같은 캐시 슬롯 공유:
- 홈: `useRecordsList({ limit: 5 })`
- 피드: `useRecordsList({ limit: 50 })`
- `useLastUsedRecipeId` 안: `useRecordsList({ limit: 1 })`

가장 먼저 fetch한 limit의 응답이 캐시에 박혀 다른 호출자도 그걸 봄.

**해결:** server-side limit 통일 + 클라이언트 slice. `apps/app/src/lib/queries/records.ts`:
- `CAFE_RECORDS_LIMIT = 50` 상수 — 모든 호출처 공유
- `useRecordsList`은 항상 50건 fetch, requestedLimit 있으면 `query.data.slice(0, requestedLimit)` 반환
- queryKey 분리는 의도적으로 안 함 (invalidate 일관성 + 데이터 fan-out 방지)

빌드: typecheck ✅ (LIFE-6 신규 0 에러)

---

## Round 7 — R-screens (Recipe 상세) + 동선 재배치 + W3-B styling 정정 (2026-05-08)

brain repo commit `d00058f` (R-screens) + `481b0a4` (W3-B 카드 styling) 반영.

### 결정
- **R1 Recipe 상세** 풀스크린 신규 — header / meta / 셋업 grid / 푸어 단계 read-only / 장비 list / footer **[수정][복제][삭제]**
- 동선 변경:
  - E1 카드 tap: ~~wizard 직접 편집~~ → `router.push('/recipes/{id}')` (R1)
  - E1 long-press 삭제 흐름 제거 (R1으로 이관)
  - D1 Recipe 카드 body tap → R1, "변경" link → BottomSheet selector (그대로)
  - R1 footer 3-button = 명시적 분기. 작성자 본인일 때만 노출.
- Wizard `mode: 'create' | 'edit' | 'clone'` props 추가 + cream banner ("수정 모드"/"복제 모드"). clone 저장 → 새 Recipe 생성, 이름 자동 "{원본} 사본", `router.replace('/recipes/{newId}')`.
- W3-B 카드 styling: 가운데 = plain 2-line ("{cumulative}g" + "{startSec}") / 우측 = `bg-accent-cream` badge "+{pourGrams}g".

### 변경 파일
- 신규: `apps/app/app/recipes/[id].tsx`
- 수정: `apps/app/app/_layout.tsx` (Stack 등록), `apps/app/app/recipes.tsx` (E1), `apps/app/app/records/[id].tsx` (D1), `apps/app/src/components/sheets/RecipeWizardSheet.tsx` (mode prop + cream banner + W3-B 카드 styling 정정)

빌드: typecheck ✅ (신규 0 에러)

---

## Round 8 — 시간 입력 휠 picker로 전환 (2026-05-08)

실기기 피드백: 마스킹 input은 RN에서 cursor 위치가 불안정해 사용자가 드래그로 커서 옮겨야 함 → **휠 picker로 교체**.

### 의존성
- `@quidone/react-native-wheel-picker@1.6.4` 신규 — JS-only, peer는 react/react-native만, 의존하는 reanimated/gesture-handler는 Expo SDK 54 기본 포함. **새 native build 불필요**.
- `npx expo install` 사용 (사용자 승인 후 자동 실행).

### 구현
- 신규: `apps/app/src/components/sheets/TimeWheelSheet.tsx` — BottomSheet에 mm/ss 두 휠 + ":" + 확인 버튼. mm 0~30, ss 0~59. 외부 contract "mm:ss" 텍스트 그대로 (parseTimeMmSs 호환).
- W2-B 총 시간 cell → `TimeDisplayCell` (Pressable display) → tap = TimeWheelSheet open
- PS1 시점 input → Pressable display (24/bold) → tap = TimeWheelSheet open
- `timeWheelTarget` state 통합 (`'total' | number | null`) — 두 호출 단일 sheet
- 기존 `MmSsCell`/`MmSsLargeField`는 코드만 보존 (unused, fallback 가능)

### 표시 포맷 통일 (R8 후속)
- `formatTimeMmSs(sec)` 출력 mm padStart 제거 → `"M:SS"` 컨벤션 ("0:45" / "2:15"). 이전 `"02:15"`처럼 mm 패딩되던 표시와 휠 출력 `"2:15"` 불일치 해소.
- 모든 default `"00:00"` → `"0:00"` 일괄 교체.

### 효과
- 커서 위치 페인 **구조적으로 0** — 입력 필드 자체 사라짐
- iOS 시계 알람·타이머 앱 동급 모던 UX
- 콜론 삭제 불가능 (구조적)

빌드: typecheck ✅ (LIFE-6 신규 0 에러, 기존 MemberAvatar 36 잔존)
