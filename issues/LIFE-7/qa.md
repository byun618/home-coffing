# 005 — QA 누적 로그

## R1. API 단독 (2026-05-12, step 8)

> **점검 범위**: dev-plan §3·§4 (entity·DTO·endpoint·seed·migration) 정합 + API tsc + DB 상태.
> **점검자**: qa-engineer (worktree `.claude/worktrees/blissful-sanderson-56c2e7`).
> **API tsc**: `cd apps/api && npx tsc --noEmit` → **0 errors**.
> **Web tsc**: `cd apps/web && npx tsc --noEmit` → **0 errors** (Web은 `BeanWithStats` legacy 타입을 그대로 import — 빌드는 통과하지만 런타임 응답 shape mismatch 위험은 별도 — 아래 Major-1 참고).

### Critical

(없음)

### Major

#### M1. Web `/beans` 라우트 충돌 — 홈/잔량/등록 화면 런타임 깨짐
- **위치**:
  - `apps/web/src/app/(main)/page.tsx:23` — `api<BeanWithStats[]>('/beans')`
  - `apps/web/src/app/(main)/beans/[id]/page.tsx:31,74,88` — `api<BeanWithStats[]>('/beans')`, `PATCH /beans/${id}`, `DELETE /beans/${id}`
  - `apps/web/src/components/bean/BeanAddModal.tsx:28` — `POST /beans` (body: name/totalAmount/orderedAt/...)
- **사유**: 005에서 `/beans`는 **Bean catalog**(`BeanCatalogController`)로 회수됨.
  - `GET /beans` → 이제 `BeanCatalogResponse[]` (`id/name/type/process/tastingNote`)만 반환. `BeanWithStats`(totalAmount/remainAmount/rop 등) 필드는 **존재하지 않음**.
  - `POST /beans`, `PATCH /beans/:id`, `DELETE /beans/:id` → 신규 `BeanCatalogController`에 미구현 → **404**.
  - tsc는 통과 (`BeanWithStats`는 shared-types에 보존 + 응답을 unsafe cast). 런타임에서 빈/잘못된 데이터 표시 + 신규 봉지 등록·수정·삭제 불가.
- **dev-plan과의 격차**: §2 "Web 영향 없음 — 005 범위 외 ... 확인 후 변경 없으면 skip"이라 판단했으나 실제 web 홈/잔량 화면 모두 `/beans` (=구 CafeBean list) 호출. 회수된 path 의미가 바뀌어 web 깨짐.
- **수정 권고** (택1):
  - **(권장)** Web도 신규 path로 마이그레이션: `/cafes/${cafeId}/cafe-beans`, `/cafe-beans/${id}` + 응답 타입 `CafeBeanResponse`로 교체. 등록 모달 body는 `beanId` + 시트 내 catalog picker 추가.
  - 또는 web을 *temporarily disable* (dogfooding이 app 위주라면 web home/bean 화면을 명시적 "준비 중" 상태로 두고 build 통과만 유지).
  - 어느 쪽이든 dev-plan 또는 후속 ticket으로 명시.
- **재현**: web 로컬 실행 → 로그인 → 홈 진입. `GET /beans` 응답은 잘려서 옴(`totalAmount`/`remainAmount`/`status` 누락) → `statsText()` 호출 시 `Number(undefined)`→`NaN`. "원두 추가" 모달 submit → 405 또는 404.

#### M2. 마이그레이션/seed 스크립트가 코드로 남아 있지 않음 (재현·검증 가능성 ↓)
- **dev-plan 명시**: §4-3 `apps/api/src/scripts/seed-beans.ts`, §4-4 `apps/api/src/scripts/migrate-beans-for-005.ts` 신규 작성 + 사용자 컨펌 후 실행.
- **현재 상태**: `apps/api/src/scripts/` = `seed-equipments.ts`, `_archived/backfill-002.ts`만 존재. **두 스크립트 모두 미존재** (git에 add 안 됨 + 워크트리에도 없음).
- **DB는 마이그레이션된 상태**:
  - `bean`: 40 rows, 전부 `source='global'`, name unique 인덱스 적용 (`bean_name_unique`), roaster_id/origin/roast_level 컬럼 drop 완료, type/tasting_note 컬럼 추가됨 (type NOT NULL, default 'single').
  - `cafe_bean`: 8 rows, 모두 valid `bean_id` FK (LEFT JOIN bean WHERE bean.id IS NULL → 0건).
  - Duplicate name: 0건.
- **사유**: 마이그레이션이 *수동* 또는 *외부 스크립트*로 실행됐을 가능성. dev-plan 7 작업 순서상 step 2~5 (사용자 컨펌 포함)와 어긋남.
- **수정 권고**:
  - 두 스크립트를 코드로 commit (재실행 시 idempotent 동작 보장). 향후 staging/prod 마이그레이션, 또는 dogfooding DB 리셋 후 복원에 필요.
  - 또는 dev-plan에 "수동 처리 완료 — 스크립트 미작성 결정"을 명시하고 ticket done 시 spec/screens.md·tickets/CLAUDE.md에도 기록.
- **재현**: `ls apps/api/src/scripts/` → seed-beans.ts·migrate-beans-for-005.ts 부재.

### Minor / 권장

#### m1. `ListBeanCatalogDto.activeOnly` Boolean 변환 동작 검증 필요
- **위치**: `apps/api/src/bean-catalog/dto.ts:20-22` — `@Type(() => Boolean) @IsBoolean()`
- **사유**: query string은 항상 문자열. `class-transformer`의 `Type(() => Boolean)`는 `"false"`/`"0"`/`"true"` 모두 truthy로 변환 가능(엄밀히 `Boolean("false") === true`). NestJS 권장 패턴은 `@Transform(({ value }) => value === 'true')` 또는 `ParseBoolPipe`.
- **현재 영향**: `?activeOnly=true` 호출은 의도대로 동작 (truthy). `?activeOnly=false` 호출도 truthy로 잘못 해석되어 `activeCafeBeans` 분기로 들어감 → 의도 아닌 결과 반환.
- **수정 권고**: `@Transform(({ value }) => value === 'true' || value === true)` 또는 명시적 enum string("true"/"false")로 받기.
- **재현**: `curl ".../beans?activeOnly=false&cafeId=1"` → activeOnly=true와 동일하게 처리.

#### m2. `BeanCatalogService.listCatalog` activeOnly+cafeId 부재 시 400 응답 코드 부적절
- **위치**: `apps/api/src/bean-catalog/bean-catalog.service.ts:35-37`
- **사유**: `activeOnly && !cafeId` 시 `new ApiError(HttpStatus.BAD_REQUEST, Errors.NOT_FOUND)`. status는 400 OK, 다만 errorCode가 `NOT_FOUND`. 의미상 `VALIDATION_FAILED` 또는 신규 `BAD_REQUEST` 코드가 어울림.
- **수정 권고**: 의미 맞는 errorCode 사용 (Errors enum 확인 후).

#### m3. `BeanCatalogService.findCatalogBean` non-GLOBAL 차단 시 errorCode 모호
- **위치**: `apps/api/src/cafe-bean/cafe-bean.service.ts:144-147`
- **사유**: `bean.source !== GLOBAL` 시 `HttpStatus.BAD_REQUEST, Errors.NOT_FOUND` — 위 m2와 동일 패턴. 의미상 "non-catalog bean 참조 금지"인데 NOT_FOUND라 디버깅 혼란.
- **수정 권고**: m2와 함께 errorCode 정리.

#### m4. seed 결과 데이터 빈약 — process/tastingNote 대부분 NULL
- **DB 현황**: bean 40 rows 중 process: NULL 38, honey 1, natural 1. tasting_note: 전부 NULL.
- **사유**: dev-plan §4-3 "research에서 라벨에 있는 것만 채움" — 의도된 동작일 수 있음. 다만 `BeanCatalogPickerSheet` (F2) row 노출 정보가 빈약해질 우려 (mockup.md C3 dropdown 표시 항목 확인 필요).
- **수정 권고**: research-bean-data.md를 다시 점검해 라벨 표기 가능한 process/tastingNote는 채워 seed 갱신 — client step에서 picker UI 확정 후 함께 결정.

#### m5. `RecentBeanCatalogDto.cafeId` 필수인데 query param이 빠지면 500 위험
- **위치**: `apps/api/src/bean-catalog/dto.ts:39-42` — `@IsInt() cafeId!: number;` (필수)
- **사유**: NestJS `ValidationPipe` global 적용 가정 시 400 떨어짐. 미적용이면 service에서 `assertCafeMember(undefined, …)` → MikroORM 쿼리에서 throw.
- **수정 권고**: `main.ts`에서 `app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))` 적용 여부 확인. 적용돼 있다면 OK.
- **재현**: `cd apps/api && grep -n "ValidationPipe" src/main.ts`.

### Pass

- ✅ Bean entity: name unique, type NOT NULL, process nullable enum, tasting_note JSON nullable, roaster/origin/roastLevel 모두 제거. `apps/api/src/common/entities/bean.entity.ts` + DB SHOW COLUMNS·SHOW INDEX 정합.
- ✅ enums.ts: BeanType/BeanProcess 추가, common/entities/index.ts에 export. `BeanType` ENUM에 `single`/`blend`/`decaf` 모두 포함.
- ✅ shared-types: BeanCatalogItem, BeanType, BeanProcess, RopStatus, RopInfo, BeanFinishedReason, CafeBeanCreateRequest, CafeBeanUpdateRequest, CafeBeanResponse 모두 정의 (`packages/shared-types/src/index.ts:270~345`). legacy `BeanWithStats`도 호환 유지.
- ✅ `BeanCatalogController` 라우트: `@Get('recent')` 선언이 `@Get()` 위에 — NestJS는 정적 경로 우선 매칭이라 `/beans/recent`가 `:id`/`/`보다 안전. 충돌 없음. (BeanCatalogController에 `:id` wildcard 없으므로 미충돌.)
- ✅ `CafeBeanController` 라우트: `cafes/:cafeId/cafe-beans` (list/create) + `cafe-beans/:id` (get/patch). prefix 다름.
- ✅ 인증/권한:
  - `BeanCatalogController`: `@UseGuards(JwtAuthGuard)` controller-level.
  - `BeanCatalogService.listCatalog`: cafeId 지정 시 `assertCafeMember` 내부 호출 (CafeUser 조회) — 비멤버 403.
  - `BeanCatalogService.listRecent`: cafeId 필수 + `assertCafeMember`.
  - `CafeBeanController.listActive`/`create`: `@UseGuards(CafeMemberGuard)` (Body 외부에서 cafe member 보장).
  - `CafeBeanController.getCafeBean`/`update`: cafeBeanId만 받는 path라 Guard 부착 불가 → `findCafeBeanWithMembership` 내부에서 `CafeUser` 조회로 권한 체크. 기존 003/004 패턴 일치.
- ✅ DTO 정합:
  - `CreateCafeBeanDto`: `beanId` (IsInt, Min 1) 필수, `name`/`origin`/`roasterId` 제거. totalGrams/orderedAt/roastedOn 등 기존 필드 유지.
  - `UpdateCafeBeanDto`: `beanId?` 추가, `name`/`origin`/`roasterId` 제거.
- ✅ Response shape: `CafeBeanResponse.bean: { id, name, type, process, tastingNote }` 객체 노출 (service.ts:255-282), origin/roaster 제거.
- ✅ `cafe_bean.totalGrams` 변경 시 remainGrams delta 자동 조정 (service.ts:102-111) — LIFE-5에서 도입된 로직 유지.
- ✅ DB 정합 (docker MySQL):
  - bean 40 rows, 전부 source=global.
  - bean_name_unique 인덱스 적용.
  - cafe_bean 8 rows, bean_id FK 모두 정상 (orphan 0건).
  - bean 컬럼: id/name/created_at/process(enum)/source(enum)/created_by_id/type(enum NOT NULL)/tasting_note(json) — roaster_id/origin/roast_level drop 완료.
- ✅ `BeanCatalogModule`, `CafeBeanModule` 모두 `app.module.ts` imports에 등록 (line 8-9, 26-27). BeanModule 흔적 없음 (grep -rn "BeanModule" 결과 0건; 단 CafeBeanModule·BeanCatalogModule만).
- ✅ `apps/api/src/bean/` 폴더 완전 삭제 (rename → cafe-bean).
- ✅ destructive query (DELETE/TRUNCATE without WHERE) — bean-catalog/cafe-bean 모듈 0건.
- ✅ `findCatalogBean` 방어: `bean.source !== GLOBAL` 시 차단 (m3에서 errorCode만 minor 지적, 동작 자체는 OK).
- ✅ API tsc clean: `cd apps/api && npx tsc --noEmit` → 0 errors.

### 후속 작업 (step 9~15 client에서 처리)

- **App-1**: `apps/app/src/lib/queries/beans.ts` → 신규 path(`/cafes/${cafeId}/cafe-beans`, `/cafe-beans/${id}`)로 교체 + DTO에서 `name`/`origin` 제거 + `beanId` 필수.
- **App-2**: `apps/app/src/lib/types.ts` (line 64-65) — `Bean` 타입의 `origin`/`roaster` 필드 제거 + `bean: BeanCatalogItem` 객체 추가.
- **App-3**: `apps/app/src/components/sheets/BeanFormSheet.tsx` — name TextField·origin TextField 제거, catalog selector chip 추가. line 33/46/60/113/132-149 모두 영향.
- **App-4**: `BeanCatalogPickerSheet` 신규 (F2 / F2-miss, 풀스크린, mode=all|active-only). `apps/app/src/lib/queries/bean-catalog.ts` (또는 동등 파일) 신규.
- **App-5**: `QuickRecordSheet` C1/C2/C3 — BottomSheet picker → in-place dropdown. (qa-engineer step 12·14에서 교차 점검 예정.)
- **App-6**: `BeanCard` subtext — origin/roaster 제거, type 표시 (Q10).
- **Web (필요 시)**: 위 Major-1. 신규 path + 신규 응답 shape으로 마이그레이션 또는 명시적 비활성. 어느 쪽이든 ticket 005 종료 전 dev-plan §9 ticket done 항목으로 결정 + 기록 필요.
- **scripts (필요 시)**: 위 Major-2. seed-beans.ts/migrate-beans-for-005.ts 코드 commit 또는 dev-plan에 "수동 처리 완료" 명시.
- **event-taxonomy.md**: dev-plan Q11 — 005에 placeholder만 추가 (006 SDK 전). step 16 통합 QA에서 점검.

### 즉시 차단 권고

**없음** (Critical 0건). M1/M2는 후속 client step 또는 ticket 종료 전에 결정·반영 필요하나, 현재 API 모듈 자체는 dev-plan §3·§4와 정합하므로 다음 step (9. App shared types/queries 갱신) 진입 가능.

---

## R2. B-add-bag flow (2026-05-12, step 12)

> **점검 범위**: dev-plan §5 (client step 9~11) B-add-bag create/edit flow + BeanCatalogPickerSheet + 호출처 cafe-bean shape 사용 교차 검증.
> **점검자**: qa-engineer (worktree `.claude/worktrees/blissful-sanderson-56c2e7`).
> **R1 잔여 결정**: M1 (web 충돌)은 apps/web 전체 폐기로 해소. M2 (scripts 미존재)는 `migrate-beans-for-005.ts`, `seed-beans.ts` 재작성으로 해소 (apps/api/src/scripts/, untracked).
> **API tsc**: 0 errors.
> **App tsc**: 새 에러 0건. (기존 LIFE-5 잔여 `MemberAvatar size=36` 1건만 — 005 범위 외.)

### Critical

(없음)

### Major

#### M3. CafeBeanResponse 응답 shape의 date 타입 — API DTO interface는 `Date`, shared-types는 `string` (런타임은 모두 string)
- **위치**:
  - `apps/api/src/cafe-bean/dto.ts:142-152` — `CafeBeanResponse.orderedAt: Date`, `roastedOn: Date`, `arrivedAt: Date | null`, `finishedAt: Date | null`, `archivedAt: Date | null`, `createdAt: Date`.
  - `packages/shared-types/src/index.ts:261-272` — 동일 필드 모두 `string`.
  - service `toResponse` (cafe-bean.service.ts:255~283): entity의 Date 객체를 그대로 응답에 흘림 (변환 없음). JSON.stringify가 ISO string으로 직렬화하므로 wire format은 string.
- **사유**: TS 컴파일에서 두 interface가 import path가 달라 충돌 안 남. 그러나 두 곳에 진실이 두 개. 누군가 API DTO interface를 import해 직접 쓰면 `bean.orderedAt.slice(0,10)` 호출 시 TS는 OK, 런타임 Date 객체에 `.slice` 없어 에러. (현재 client는 `shared-types.CafeBeanResponse`를 받는다고 가정하고 slice 호출 — 정상 동작.)
- **수정 권고**: API DTO `CafeBeanResponse` interface를 shared-types로 통일 (API service가 shared-types `CafeBeanResponse`를 implements/satisfies). 005 범위에서 진행하거나 별 ticket 분리.

### Minor / 권장

#### m6. BeanCatalogPickerSheet `mode='active-only'` 호출 시 cafeId 미전달 보호 없음
- **위치**: `apps/app/src/components/sheets/BeanCatalogPickerSheet.tsx:83-97` — `mode='active-only'`일 때 cafeId가 props 옵셔널이라 호출처가 빠뜨려도 컴파일 통과. 빠뜨리면 API가 `activeOnly=true & cafeId 없음` → R1 m2 분기로 400 응답.
- **현재 영향**: 본 PR(step 9~11)에는 'active-only' 호출처 없음. step 13~14의 C3 picker가 도입될 때 위험.
- **수정 권고**:
  - `Props` discriminated union: `{ mode:'all' } | { mode:'active-only'; cafeId: number }`.
  - 또는 컴포넌트 내부에서 `activeOnly && !cafeId`이면 children 안 렌더하고 에러 표시.

#### m7. BeanFormSheet edit submit이 PATCH에 빈 body 전송 가능
- **위치**: `apps/app/src/components/sheets/BeanFormSheet.tsx:185-216`.
- **사유**: edit mode에서 사용자가 아무 필드도 변경 안 한 채 "저장"을 눌러도 `canSubmit`이 true (`pickedBean !== null + totalGrams + orderedAt + roastedOn 모두 truthy`). diff input이 `{}`라도 mutateAsync 실행 → PATCH 빈 body → API는 no-op로 응답 200. 동작에 큰 문제는 없으나, 불필요한 네트워크 호출 + invalidateQueries 발화.
- **수정 권고**: `Object.keys(input).length === 0`이면 mutate 호출 skip + close. 또는 dirty 검사(이미 useDirtyClose에 있음)와 동일 기준으로 submit 활성화.

#### m8. BeanFormSheet `form.beanId` 상태와 `pickedBean` 이중 진실
- **위치**: `apps/app/src/components/sheets/BeanFormSheet.tsx:117-159`.
- **사유**: catalog picker 결과를 `pickedBean: BeanCatalogItem | null` (전체)과 `form.beanId: number | null` (id만) 두 곳에 저장. submit/canSubmit 모두 `pickedBean`만 봄. `form.beanId`는 dirty 비교용 외 사용처 없음.
- **현재 영향**: 동작 OK. 추후 유지보수 시 혼선.
- **수정 권고**: `form.beanId` 제거하고 dirty 비교를 `pickedBean?.id !== baselinePickedBean?.id`로 수렴 (edit mode는 어차피 read-only라 dirty 영향 0).

#### m9. shared-types `CafeBeanUpdateRequest.arrivedAt: string | null` ↔ API DTO `IsDate()` 만 — null 케이스 ValidationPipe 의존
- **위치**:
  - shared-types index.ts:245 — `arrivedAt?: string | null`
  - apps/api/src/cafe-bean/dto.ts:80-82 — `@IsOptional() @IsDate() @Type(() => Date)`
- **사유**: class-validator의 `@IsOptional()`은 null·undefined 둘 다 skip. 따라서 null 전송 시 IsDate 검증을 우회해 service가 `cafeBean.arrivedAt = null` 적용. cafe-bean.entity.ts:57는 nullable이므로 OK. 다만 `@IsOptional() @IsDate()` 패턴은 "null 명시적 허용"이 의도임을 코드만 보고 파악하기 어려움.
- **수정 권고**: 명시적 주석 추가 또는 `@ValidateIf((o) => o.arrivedAt !== null)` 사용. (의미 변화 없음, 가독성만.)

#### m10. seed/migrate 스크립트 git untracked 상태
- **위치**:
  - `apps/api/src/scripts/migrate-beans-for-005.ts` — untracked
  - `apps/api/src/scripts/seed-beans.ts` — untracked
- **사유**: R1 M2 해결로 코드는 작성됐으나 git add 안 됨. ticket done 전 PR에 포함되도록 add 필요.
- **수정 권고**: step 16(integration QA) 또는 ticket done 전 `git add apps/api/src/scripts/{migrate-beans-for-005,seed-beans}.ts` 확인.

### Pass

- ✅ **B-add-bag create flow shape 정합**:
  - Client `BeanFormSheet` create payload (line 166-177): `{ beanId, totalGrams, orderedAt, roastedOn, arrivedAt?, degassingDays?, cupsPerDay?, gramsPerCup? }`.
  - API `CreateCafeBeanDto` (dto.ts:14-56): 동일 키, `beanId` 필수(IsInt Min 1), 이외 동일.
  - shared-types `CafeBeanCreateRequest` (index.ts:228-238): 일치.
  - name/origin TextField 제거됨 (mockup B-add-bag 명세). `CreateCafeBeanDto`에도 name/origin/roasterId 없음.
- ✅ **B-add-bag edit flow shape 정합 + beanId read-only**:
  - `BeanFormSheet` edit mode (line 185-216): payload에서 `beanId` 명시적 제외. (line 188 주석 "beanId는 edit mode에서 read-only — payload에 안 보냄".)
  - `CatalogChip readOnly` (line 233~245, 348~419): edit mode일 때 `pickerOpen` 안 토글 (line 236-239), 변경 안내 문구만 표시.
  - API `UpdateCafeBeanDto.beanId?` 옵셔널 — edit에서 보내지 않아도 OK. (catalog 재배선이 필요한 경우 별 ticket 명시 — service line 97~99에 분기 구현 완료.)
- ✅ **BeanCatalogPickerSheet F2 / F2-miss 동작**:
  - F2 hit: row tap → `onPick(bean)` 호출 + `onClose()` (line 184-185). `BeanCatalogItem` shape (id/name/type/process/tastingNote) 그대로 callback에 전달.
  - F2-miss: `EmptyState` (line 222-245). "검색 결과 없음" + 안내 문구. CTA 없음. mockup.md F2-miss "CTA 없음, 검색어 변경으로만 복귀" 명세와 일치.
  - 디바운스 200ms (line 78-81), 검색어 입력 도중 빈번한 refetch 방지.
  - 풀스크린 modal (presentationStyle="pageSheet", animationType="slide"), Q9 풀스크린 결정 정합.
- ✅ **bean-catalog query/API shape 정합**:
  - Client `useBeanCatalog({search, activeOnly, cafeId, limit})` → `GET /beans?search=&activeOnly=true&cafeId=&limit=`. `buildQuery` (bean-catalog.ts:27-42) — activeOnly=false나 undefined면 query param 자체 미발신. `?activeOnly=true`만 보냄. R1 m1 (Boolean parse 모호함) 호환 가능 — 실제로 boolean false는 wire에 안 실리므로 안전.
  - API `ListBeanCatalogDto` (bean-catalog/dto.ts:13-36): search/activeOnly/cafeId/limit 모두 옵셔널. `BeanCatalogResponse[]` 반환.
  - shared-types `BeanCatalogItem` (index.ts:206-212): API `BeanCatalogResponse`와 동일 shape.
- ✅ **recent endpoint shape**:
  - Client `useRecentBeanCatalog(cafeId, limit)` → `GET /beans/recent?cafeId=&limit=` (bean-catalog.ts:62-64).
  - API `RecentBeanCatalogDto` (bean-catalog/dto.ts:38-50): cafeId 필수 IsInt Min 1, limit 옵셔널 Max 50. `BeanCatalogService.listRecent`가 RecordBean × cafeBean.bean dedup으로 최근 사용 catalog 반환.
- ✅ **CafeBeanResponse.bean 객체 접근 패턴**:
  - 모든 호출처가 `bean.bean.name` (또는 `cafeBean.bean.name`) 형태로 catalog 정보 접근. 점검 위치:
    - `BeanCard.tsx:54` (`bean.bean.name`)
    - `app/beans/[id].tsx:135,211` (`bean.bean.name`)
    - `QuickRecordSheet.tsx:206, 549` (`bean!.bean.name`, `bean.bean.name`)
    - `RecordEditSheet.tsx:136` (`cafeBean.bean.name` — beansForPicker 매핑)
    - `BeanFormSheet.tsx:68` (`cafeBean.bean.id`)
  - 이전 `bean.name` 직접 접근 패턴 0건 (`grep`으로 확인). LIFE-4 legacy shape 잔재 없음.
- ✅ **인증/권한**:
  - `BeanCatalogController`: `@UseGuards(JwtAuthGuard)` (controller-level).
  - `BeanCatalogService.listCatalog`: cafeId 지정 시 `assertCafeMember` 호출 (line 38-40). FORBIDDEN 응답.
  - `BeanCatalogService.listRecent`: cafeId 필수 + `assertCafeMember` (line 91).
  - `CafeBeanController.listActive` / `create`: `@UseGuards(CafeMemberGuard)` 부착.
  - `CafeBeanController.getCafeBean` / `update`: cafeBeanId만 받는 path라 service 내부 `findCafeBeanWithMembership`로 권한 체크.
  - BeanFormSheet 호출처 (`(main)/index.tsx:202`, `feed.tsx:224`, `beans/[id].tsx:358`): `cafeId=activeCafeId` (zustand auth-store) 또는 `bean.cafeId` (edit) 정확히 전달.
  - BeanCatalogPickerSheet은 호출처 BeanFormSheet에서 `mode='all'` (line 330), cafeId 불필요. API listCatalog에서 cafeId 없으면 권한 체크 skip — `mode='all'`로 호출된 경우는 catalog 전체 노출, 정합.
- ✅ **API 라우트 + global prefix 정합**: `apps/api/src/main.ts:9` `setGlobalPrefix('api')`. 클라이언트 `api.ts:9` `BASE = http://${host}:3001/api`. 결합하면 `/api/beans/recent`, `/api/cafes/:id/cafe-beans` 등 정합. controller 데코레이터 path 충돌 없음 — BeanCatalogController(`/beans` + `/beans/recent`), CafeBeanController(`/cafes/:cafeId/cafe-beans` + `/cafe-beans/:id`) prefix 다름.
- ✅ **ValidationPipe 전역 설정 확인 (R1 m5 해소)**: `apps/api/src/main.ts:10-16` — `whitelist: true, transform: true, enableImplicitConversion: true`. RecentBeanCatalogDto.cafeId 필수 + IsInt 검증이 query 누락 시 400으로 정상 응답.
- ✅ **event-taxonomy.md 갱신은 ticket done 시점에 진행 (Q11 placeholder 결정)** — 본 step 9~11 변경에 신규 이벤트 발화 0건 확인 (`grep -rn "Amplitude\|trackEvent" apps/app/` 0건 — 005 이전부터 SDK 없음, LIFE-8 SDK 도입 전까지 placeholder만).
- ✅ **records ↔ cafe-beans 연결 정합**:
  - `record.service.ts:352-353`: `beanId: recordBean.cafeBean.id`, `beanName: recordBean.cafeBean.bean.name` (CafeBean id + catalog name 조합). client RecordResponse의 `beans` array shape과 일치.
  - `RecordRow.tsx:23-25`, `app/records/[id].tsx:225, 245` 모두 `bean.beanName` 사용 — record DTO 정합.
  - `RecordEditSheet`의 `beansForPicker` (line 131-150): 활성 CafeBean에 없는 봉지(과거 finishedAt 봉지)도 record.beans[].beanName으로 fallback 표시.
- ✅ **client tsc**: 새 에러 0건. (`MemberAvatar size=36` 에러 1건은 LIFE-5 잔여, 005 무관.)
- ✅ **`apps/web` 폐기 완료**: `git status` deleted 마커 다수 — R1 M1 해소.

### 후속 (step 13+에서 처리)

- **step 13. QuickRecordSheet C1/C2/C3 in-place dropdown 전환**:
  - 현재 `QuickRecordSheet.tsx:486-500`에서 활성 봉지 선택은 별도 `BeanPickerSheet`(같은 파일 line 526~) BottomSheet로 분기. mockup C1(현 ROP 상위 5 + 풀-검색 진입)과 C3(전체 catalog 검색) 분기 미구현.
  - 권장 구조: 같은 sheet 안에서 dropdown으로 활성 봉지 5개 + "전체 검색" tap → `BeanCatalogPickerSheet mode='active-only' cafeId={cafeId}` 호출.
  - active-only 모드 첫 실 사용처가 step 13이므로 위 m6 (cafeId 강제) 검토 함께.
- **step 14. RecordEditSheet picker도 mockup 정합 검토**: 현재 BottomSheet picker라 in-place dropdown 패턴 미적용. 단 RecordEdit은 활성 봉지 + record의 finished 봉지를 합쳐 보여주는 특수 케이스라 catalog picker는 부적합. 그대로 두는 게 맞을 가능성 — dev-plan §5 결정 필요.
- **step 15. BeanCard subtext에 type 표시 (Q10)**: 현재 `BeanCard.tsx:31-37`은 `cupsRemaining + daysLabel/사용 적음`만 표시. `bean.bean.type` (싱글/블렌드/디카페인) 노출 미구현. mockup S01 카드 subtext 명세 재확인 + 추가.
- **step 16. 통합 QA에서**:
  - shared-types ↔ API DTO interface 통합 (M3) 처리 여부 결정.
  - scripts git add (m10).
  - spec/screens.md 갱신 (B-add-bag picker 변경, 잔량 화면 진입 흐름 등).
  - event-taxonomy.md Q11 placeholder 결정 반영.

### 즉시 차단 권고 (R2)

**없음** (Critical 0건). M3은 *런타임 영향 없는* 두-진실 문제 — step 13 진입 가능. Minor m6은 step 13 직전 보강하는 게 자연스러움 (active-only 첫 사용처 등장 시점).

---

## R3. 통합 + spec 정합 (2026-05-12, step 14+16)

> **점검 범위**: dev-plan §5 (step 13·15) QuickRecordSheet C1/C2/C3 + BeanCard subtext + 통합 (API↔Client, spec, 운영 가드레일, tsc, git).
> **점검자**: qa-engineer (worktree `.claude/worktrees/blissful-sanderson-56c2e7`).
> **R2 잔여 결정**: M3 (date 두-진실) → **별 ticket으로 분리** (런타임 영향 없음, 005 범위 외 — 사용자 결정 2026-05-12). m6 (BeanCatalogPickerSheet discriminated union) → 패치 완료. m10 (scripts untracked) → 본 round에서 git add 필수 항목으로 보고.
> **App tsc**: 새 에러 0건. (LIFE-5 잔여 `MemberAvatar size=36` 1건만 남음, 005 범위 외.)
> **API tsc**: 0 errors.
> **shared-types tsc**: 0 errors (`packages/shared-types`, root tsc 경유).
> **DB 상태**: bean 40 / source=global 100% / duplicate name 0 / cafe_bean 8 / orphan FK 0 — R1 시점 그대로 유지.

### Critical

(없음)

### Major

(없음)

### Minor / 권장

#### m11. m6 패치 — `BeanCatalogPickerSheet` Props discriminated union 적용 확인 (해소)
- **위치**: `apps/app/src/components/sheets/BeanCatalogPickerSheet.tsx:21-35` — `Props = { mode:'all' } | { mode:'active-only'; cafeId: number }`.
- **검증**: TS 컴파일 시 `mode='active-only'`에서 cafeId 누락 시 type error. QuickRecordSheet 호출처 (line 587-593) `mode="active-only" cafeId={cafeId}` 정상 전달.
- **상태**: ✅ 해소. R2 m6 후속 패치 정합.

#### m12. C3 dropdown row 표시 spec — mockup.md "최근 사용 catalog" vs 실제 "사용 가능한 활성 봉지" 차이
- **위치**: `apps/app/src/components/sheets/QuickRecordSheet.tsx:619-712` (`BeanDropdown`).
- **사유**: mockup.md C3 "최근 사용한 원두" 라벨은 *최근 사용 Bean catalog* 의미 (`Bean join RecordBean orderBy recordedAt desc distinct`). 현재 구현은 `beans` prop (활성 CafeBean list, 생성 역순)에서 상위 3개를 그대로 `recent`로 표시 — *생성 역순 활성 봉지*. 라벨과 데이터 의미가 일치하지 않음.
- **영향**: 사용자 dogfooding 규모(활성 봉지 1~3개)에서는 거의 동일한 결과지만, 봉지 4개 이상일 때 mockup 의도(최근 사용 catalog 3종)와 다른 항목 노출 가능.
- **권고 (택1)**:
  - (A) `useRecentBeanCatalog(cafeId, 3)` 활용 + 결과를 활성 CafeBean에 join. mockup 정합 정확.
  - (B) 라벨을 "활성 원두"로 바꿔 라벨↔데이터 정합 (간단). mockup 라벨과는 미세 차이.
- **현재 영향 미미** — 별 ticket 후보 또는 005 mockup 라벨 재확인 후 결정.

#### m13. m10 (seed/migrate 스크립트 untracked) — ticket done 전 git add 필수
- **위치**: 
  - `apps/api/src/scripts/migrate-beans-for-005.ts` (198 lines)
  - `apps/api/src/scripts/seed-beans.ts` (186 lines)
  - `apps/api/src/bean-catalog/` (모듈 전체 폴더)
  - `apps/app/src/components/sheets/BeanCatalogPickerSheet.tsx`
  - `apps/app/src/lib/queries/bean-catalog.ts`
- **사유**: `git status` Untracked. ticket done PR 빌드 시 누락되면 staging/prod 환경에서 빌드 깨짐 — Critical 잠재 위험. 단, 005 범위에서 메인 commit step만 남았으므로 *해당 step 의해 자연 해소* 예정.
- **권고**: ticket done 직전 `git add apps/api/src/{bean-catalog,scripts/migrate-beans-for-005.ts,scripts/seed-beans.ts} apps/app/src/components/sheets/BeanCatalogPickerSheet.tsx apps/app/src/lib/queries/bean-catalog.ts` 확인. PR diff에 모두 포함 필수.

#### m14. RecordEditSheet picker — mockup C1/C2/C3 dropdown 패턴 미적용 (의도된 결정)
- **위치**: `apps/app/src/components/sheets/RecordEditSheet.tsx` (별도 BottomSheet picker).
- **사유**: mockup.md C1/C2/C3는 *빠른 기록 작성* (`QuickRecordSheet`) 명세. RecordEdit은 기록의 finished 봉지까지 포함하는 특수 케이스라 picker 의미가 다름 — *그대로 BottomSheet 두는 게 fit* (R2 후속 섹션 step 14 권고와 동일).
- **상태**: ✅ Pass. mockup 범위 외, 변경 없이 두는 게 맞음. (식별 목적으로 기록만.)

### Pass

- ✅ **C1 chip filled (mockup 정합)**: `QuickRecordSheet.tsx:265-302` — `bg-accent` (filled tone) + Coffee icon + bean.bean.name + chipSubtext(remain + days) + chevron-down/up 전환. 모든 시각 항목 mockup.md C1 명세 일치.
- ✅ **C2 chip empty (mockup 정합)**: 같은 chip 컴포넌트 hasBean=false 분기 (line 275-281, 293-301). `bg-bg-secondary` (empty tone) + "+ 원두 선택" placeholder + chevron-down. mockup.md C2 "empty chip" 정합.
- ✅ **C3 dropdown 펼침 (mockup 정합)**:
  - chip tap → `dropdownFor` state 전환 → in-place dropdown 렌더 (line 322-335, BeanDropdown 컴포넌트 line 619-712).
  - dropdown 구조: "최근 사용한 원두" 라벨 + 활성 CafeBean row × 최대 3개 + divider + "전체 검색 →" CTA (chevron-right).
  - 활성 봉지 0건 시 "활성 원두가 없어요" 안내 (line 647-653).
  - chevron 전환 (`ChevronDown` ↔ `ChevronUp`, line 292-302) — mockup 정합.
- ✅ **블렌딩 pill 위치 + 라벨 (mockup 정합)**:
  - "+ 원두 추가 (블렌딩)" pill (line 377-390), `bg-bg-secondary` + 라벨 `text-accent`. entries.length < beans.length일 때만 노출 — 사용 가능 봉지 다 차면 hide.
  - 위치: 모든 bean entry + dropdown 아래(섹션 맨 끝) — mockup C1/C2/C3 모두 "필드 끝"에 위치하는 패턴과 일치.
  - 라벨 텍스트 mockup.md 명세 그대로.
- ✅ **dropdown row tap → entry.beanId 갱신 + 닫힘**: `onPick: (beanId) => { updateEntry(index, { beanId }); setDropdownFor(null); }` (line 326-329). 단일 동작에서 두 state 정상 전환.
- ✅ **"전체 검색" tap → BeanCatalogPickerSheet (mode='active-only', cafeId)**:
  - line 330-333 — `onOpenFullSearch: () => { setDropdownFor(null); setCatalogPickerFor(index); }`.
  - line 587-593 — `<BeanCatalogPickerSheet visible={catalogPickerFor !== null} mode="active-only" cafeId={cafeId} ... />`.
  - mode='active-only' 시 cafeId 필수 (m11 discriminated union 정합).
- ✅ **catalog 선택 → 활성 CafeBean lookup 후 entry.beanId 박음**:
  - `pickCatalog(item: BeanCatalogItem)` (line 152-161): `beans.find((b) => b.bean.id === item.id)` → match된 `matched.id` (= CafeBean.id) 박음.
  - mode='active-only'라 picker는 활성 봉지 있는 catalog만 노출 → 방어적으로 `if (!matched) return;` 있어 미스 시 silent (정상 케이스 0건).
- ✅ **multi-entry 블렌딩 — 각 entry 독립 dropdown**: `dropdownFor: number | null` (line 94) state로 단 하나의 entry index만 열림. 다른 entry chip tap 시 자동 교체 (line 252-254 `setDropdownFor(dropdownOpen ? null : index)`). 동시에 두 dropdown 펼침 불가 — 의도된 UX.
- ✅ **multi-entry 블렌딩 중복 봉지 차단**: `candidates = beans.filter((b) => !usedByOthers.has(b.id))` (line 245-247) — 다른 entry에서 이미 선택한 봉지는 dropdown에서 제외. addEntry() (line 143-150)도 unused bean 자동 prefill.
- ✅ **BeanCard subtext type 표시 (Q10)**: `BeanCard.tsx:11-21` `formatBeanType` — single→"싱글 오리진"/blend→"블렌드"/decaf→"디카페인". line 70-75에서 name 아래에 추가. mockup S01 카드 subtext 명세 정합. (R1 후속 step 15 해결.)
- ✅ **BeanCard urgent 상태에서 type 가독성**: subtitleClass `text-text-on-dark/70` (urgent) / `text-text-tertiary` (normal). 두 톤 모두 충분 대비. 잔량 표시 형식 (line 45-51) `cupsRemaining + daysLabel`은 변경 없음 — 기존 동작 유지.
- ✅ **API↔Client Record create payload 정합**:
  - Client `useCreateRecord` (`records.ts:69-72`): `CreateRecordInput = { beans: Array<{ beanId, grams }>, brewedAt, cups?, recipeId?, memo? }`. QuickRecordSheet submit (line 208-215) `beans: entries.map(e => ({ beanId: e.beanId, grams: Number(e.grams) }))` — entry.beanId는 CafeBean.id.
  - API `CreateRecordDto` (`record/dto.ts:18-49`): `beans!: RecordBeanDto[]` (`beanId!: number` + `grams!: number @Min(0.1)`).
  - `record.service.ts:88-112` — `cafeBeans = loadCafeBeansInCafe(em, cafeId, dto.beans)` (line 240-256) `em.find(CafeBean, { id: { $in: ids }, cafe: cafeId })` → dto.beans[].beanId가 CafeBean.id로 resolve됨. RecordBean.cafeBean = CafeBean (line 104-107). FK 정합 완료.
  - `record.service.ts:352-353`: response.beans[].beanId = cafeBean.id, beanName = cafeBean.bean.name — wire shape도 일관 CafeBean.id 기준.
- ✅ **C3 dropdown row의 beanId가 CafeBean.id임 (catalog id 아님)**: BeanDropdown `recent.map((bean) => ...)` (line 655-693). bean은 prop `beans` (활성 CafeBean) 요소 → bean.id = CafeBean.id. `onPick(bean.id)` 호출 (line 660) — CafeBean.id 전달. 위 record payload shape 정합 검증과 함께 통합 OK.
- ✅ **scripts/seed-beans + migrate-beans-for-005 코드 idempotent 설계**:
  - migrate: step 1 (CAFE→GLOBAL UPDATE), step 2 (name dedup, canonical=min id + CafeBean.bean_id rewire + 잉여 DELETE), step 3 (type 추정 UPDATE) — 모두 *이미 적용 상태에서 재실행 시* 변경 row 0건.
  - seed: name lookup → 없으면 INSERT, 있으면 type/process/tastingNote 비교 후 변경분만 UPDATE. SEEDS 35개 (싱글16 + 블렌드11 + 디카페인10).
  - dev-plan §4-3, §4-4 명세와 정합.
- ✅ **DB 상태 (재확인, R1과 동일)**:
  - bean 40 rows, 전부 source='global', duplicate name 0건, type 분포 (single 18, blend 12, decaf 10).
  - cafe_bean 8 rows, orphan FK 0건.
  - migration/seed 모두 이미 적용된 종료 상태.
- ✅ **운영 가드레일 위반 0건**:
  - babel.config.js reanimated plugin 수동 추가 흔적 없음 (Expo SDK 53 자동 처리, `apps/app/babel.config.js` 미존재 — 기본 동작 유지).
  - MikroORM v7 import 없음 — `package.json`은 `@mikro-orm/core` 6.x 계열 유지.
  - 신규 DELETE/TRUNCATE without WHERE 0건 (migrate-beans-for-005.ts step 2의 DELETE는 specific id list 대상).
- ✅ **spec/event-taxonomy.md 발화 0건 확인**: `grep -rn "amplitude\|trackEvent" apps/app/src/ apps/api/src/` 0건. Q11 placeholder 결정 (005에서 정의만 add, 006에서 발화 구현) 정합.
- ✅ **client tsc**: 새 에러 0건. LIFE-5 잔여 1건만 — 005 범위 외.
- ✅ **API tsc**: 0 errors.
- ✅ **shared-types tsc**: 0 errors.

### spec 갱신 후보 (메인이 ticket done에서 처리)

#### screens.md 갱신 라인 후보
- **L85 (FAB → 빠른 기록)** "✅ 원두 선택 + 양 입력 (3 step 이내) — pre-ticket":
  - 갱신: "✅ 원두 선택 (in-place dropdown + 전체 검색 picker) + 양 입력 — LIFE-7 (2026-05-12, C1/C2/C3 dropdown + BeanCatalogPickerSheet)"
- **L135~ (원두 추가/수정 시트 — `[design.pen S04, S04b]`)** 섹션 전체:
  - 갱신 항목들:
    - "이름 자유 텍스트 입력" → "Bean catalog 선택 chip (catalog FK 강제)" — LIFE-7
    - "origin / roaster 텍스트 입력" → 제거 — LIFE-7 (catalog 정보만 표시)
    - "BeanCatalogPickerSheet (F2/F2-miss, 풀스크린)" — LIFE-7 신규
    - "Bean catalog 폐기 path: 자유 텍스트 / 기타 row / freeName" — LIFE-7 폐기
- **L130~ (원두 상세 페이지 — `[design.pen S03]`)**:
  - subtext 표시: origin/roaster → type (싱글 오리진/블렌드/디카페인) — LIFE-7 (Q10)
- **L45 (Home Tab — `[design.pen S02]`)**:
  - BeanCard subtext: origin → type — LIFE-7

#### event-taxonomy.md placeholder 후보 (005에서 정의만, 006에서 발화)
- `bean_catalog_picker_open` (event_property: `from: 'quick_record' | 'bean_form'`)
- `bean_catalog_select` (event_property: `catalog_id`, `search_query?`)
- `bean_catalog_search_empty` (event_property: `search_query`)
- 위 3건을 "Object-Verb 매트릭스" `bean` 행에 추가 후보 (catalog_picker_opened, catalog_selected, catalog_search_empty_returned 정도 — 005 placeholder만, 발화는 006).

#### design-system.md 컴포넌트 카탈로그 후보 (별도 ticket 또는 005 done)
- **Catalog selector chip** (B-add-bag, BeanFormSheet): `$bg-secondary` empty tone + chevron-down / `$accent` filled tone + Coffee icon + label.
- **In-place dropdown chip + dropdown 패턴** (C1/C2/C3): chip 바로 아래 dropdown 펼침, chevron 전환, row × 3 + divider + "전체 검색" CTA. EquipmentPickerSheet의 BottomSheet 패턴과 구분되는 신규 카탈로그.
- **풀스크린 picker modal** (BeanCatalogPickerSheet): `presentationStyle='pageSheet'` + 검색 input + list + F2-miss empty state. EquipmentPickerSheet의 BottomSheet 패턴 대비 큰 list + 검색 핵심 케이스용.

#### design.pen 갱신 위임 frame (client-engineer가 ticket done 시점)
- **S02** (Home Tab) — BeanCard subtext 변경 (type label)
- **S04, S04b** (원두 추가/수정 시트) — name TextField → catalog chip, origin TextField 제거
- **S05** (빠른 기록 시트 — C1/C2/C3) — chip filled/empty + chevron + in-place dropdown + 블렌딩 pill
- **신규 F2 / F2-miss** — 풀스크린 picker (mockup.pen에서는 정의됨, design.pen에서는 미존재 또는 갱신 필요)
- 일관 변경: 자유텍스트 원두 입력 path 제거 (모든 frame)

### 즉시 차단 권고 (R3)

**없음** (Critical 0건, Major 0건). m13 (untracked git 파일)은 ticket done 직전 commit step에서 자연 해소 — 메인이 `git add` 실행만 확인.

### 005 done 후 처리할 후속 항목 (별 ticket 후보)

1. **shared-types ↔ API DTO date 두-진실** (R2 M3, 사용자 결정으로 분리)
2. **OCR/Vision ticket** — 사용자 catalog 등록 path 도입 (F2-miss 막다른 골목 해소)
3. **Catalog seed 갱신 UI / B-manage** — 운영자가 운영 중 catalog 추가/수정하는 path
4. **event-taxonomy.md 본격 발화 구현** — Amplitude SDK 도입(006)과 묶음
5. **design.pen 갱신** — LIFE-7 시각 변경 모든 frame (위 client-engineer 위임 후보 list)
6. **apps/web 폐기 정리** — docker-compose / port 정리 (web container 더 이상 빌드되지 않으면 docker 정의 삭제)
7. **m12 — C3 dropdown 데이터 소스** "최근 사용 catalog" 정확 join 또는 라벨 변경 (mockup 정합 정확화)
8. **m7 — BeanFormSheet edit 빈 body PATCH 회피** (R2 잔재)
9. **m8 — BeanFormSheet form.beanId 이중 진실 제거** (R2 잔재)
10. **m9 — `@IsOptional() @IsDate()` null 명시화** (R2 잔재)

### ticket done 진행 OK 판단

**OK** — Critical / Major 0건. R1~R3 누적 Critical 0건. dev-plan §1 Q1~Q11 + §3 데이터 모델 + §4 API + §5 App 모든 항목 정합. ticket done 절차 진행 가능.


---

## R4. 실기기 QA — 사용자 피드백 (2026-05-12)

> 사용자가 dev 머지 전 ticket/005 워크트리에서 직접 실기기 QA 진행. 발견된 항목은 005 안에서 즉시 고치지 않고 *기록*만.

### Minor / UX 피드백

- **m15. 시트 깊이 불일치** — *원두 추가*(BeanFormSheet)는 **바텀시트**, 그 안에서 호출되는 *원두 선택*(BeanCatalogPickerSheet)은 **풀스크린 modal**. 두 시트가 연속으로 열릴 때 결이 어색함.
  - 사용자 결정: 005 범위에서는 두지 않음 (기록만).
  - 후속 별 ticket에서 통일 검토:
    - 옵션 A — 원두 선택도 바텀시트로 (검색 input + list, EquipmentPickerSheet 패턴 차용)
    - 옵션 B — 원두 추가도 풀스크린으로 (큰 form이라 자연스러울 수도)
    - 옵션 C — depth 표현으로 정당화 (현재 패턴 유지, 시각 hint 보강)
  - dev-plan Q9에서 mockup.pen 따라 풀스크린 modal 결정했었음. 실기기에서 어색이 드러남.

### 005 done 후 처리할 후속 항목 (별 ticket 후보 추가)

11. **m15 — 원두 선택 시트 depth 통일** (실기기 UX 피드백)

---

## R5. 메인 자체 코드 리뷰 (2026-05-12)

> dev 사이클 마무리 후 메인이 git diff 전수 훑기 + 사용자 코드 스타일 정합 + spec 일관성 점검. sub-agent 위임 QA(R1~R3)와 사용자 실기기 QA(R4)로 못 잡힌 잔재 식별.

### Minor / 잔재

- **m16. `as Array<keyof FormState>` 단언 1건** — `apps/app/src/components/sheets/BeanFormSheet.tsx:133`. 사용자 스타일 "`as` 단언 기피" 위반이지만 *pre-LIFE-7 잔재* (9cc5f1b 커밋, "Sheet dirty 보호 confirm"). LIFE-7 작업이 *수정 범위 최소화* 원칙으로 그대로 둠.
  - 후속: 모든 form sheet의 isDirty 패턴 통일 시 `for...of`로 narrowing — 별 ticket 또는 점진적 정리.

- **m17. errorCode ↔ HTTP status mismatch 2건**
  - `apps/api/src/cafe-bean/cafe-bean.service.ts:146` — `BAD_REQUEST + Errors.NOT_FOUND` (catalog source ≠ GLOBAL 시 던짐). status는 400, error code는 NOT_FOUND라 모호.
  - `apps/api/src/bean-catalog/bean-catalog.service.ts:36` — `BAD_REQUEST + Errors.NOT_FOUND` (activeOnly=true인데 cafeId 누락).
  - 둘 다 R2 m9 (`Errors enum 모호`) 영역. Errors enum에 `INVALID_INPUT` 같은 항목 도입 필요. 4번째 발생 시 새 enum 추가 — 후속 별 ticket 후보 m17로 합류.

- **m18. `$like` 와일드카드 escape 누락** — `apps/api/src/bean-catalog/bean-catalog.service.ts:66, 80`. 사용자가 검색에 `%`/`_` 입력 시 의도 외 매칭. 한국어 검색에서 발생 가능성 낮음. minor SQL 안정성. 별 ticket 또는 후속 OCR ticket과 묶음.

- **m19. `listCatalog` activeOnly 두 번 쿼리 — 미세 최적화 여지** — `bean-catalog.service.ts:46-72`. activeCafeBeans 조회 → beanIds Set → Bean 조회 두 번. 한 번에 join (QueryBuilder 또는 raw SQL)으로 가능하지만 가독성 trade-off. cafe scope 좁아 실용 영향 미미. 그대로 두기.

- **m20. event-taxonomy 라벨 비통일** — `spec/event-taxonomy.md:131` `bean_added`는 005에서 `cafe_bean_id` / `bean_id` 분리됐는데, `record_created.bean_ids: string[]` (라인 162), `notification_sent.bean_id` (215~217)는 *어느쪽 id인지* 명시 없음. 모두 봉지(CafeBean.id) 의미 추정. 005 외 영역 (record/notification 이벤트는 별 ticket에서 함께 정리). 후속 별 ticket 후보 (LIFE-8 SDK 도입과 묶음 권장).

### Pass (재확인)

- API 모듈 구조: bean-catalog (catalog) / cafe-bean (instance) 명확 분리 ✓
- Bean entity: name unique, type/process enum, tastingNote JSON — dev-plan §3 정합 ✓
- migrate-beans-for-005.ts: idempotent 3단계 (source/dedup/type) — 재실행 안전 ✓
- seed-beans.ts: upsert 패턴, 원두반점 34종 ✓
- BeanCatalogPickerSheet: discriminated union Props (m6 패치) ✓
- BeanFormSheet edit mode: chip read-only + dirty 비교 정합 ✓
- QuickRecordSheet C3 dropdown: 단일 state(`dropdownFor`)로 multi-entry 충돌 방지 ✓
- BeanCard subtext: type 한국어 라벨 ✓
- screens.md 갱신: 빠른 기록 C1/C2/C3 + B-add-bag + F2/F2-miss + Home 카드 subtext — 일관 ✓
- event-taxonomy.md 갱신: bean_added 분리 + Bean Catalog 3 placeholder ✓
- shared-types: legacy stub(BeanCreateRequest/BeanWithStats/Consumption*) apps/web 폐기와 함께 제거 ✓

### 005 done 후 처리할 후속 항목 (별 ticket 후보 추가)

12. **m16 — 모든 form sheet의 isDirty 패턴 통일** (`as Array<keyof>` 제거)
13. **m17 — Errors enum에 INVALID_INPUT 추가** (status ↔ code mismatch 해소)
14. **m18 — bean catalog 검색 `$like` 와일드카드 escape**
15. **m20 — event-taxonomy bean_id ↔ cafe_bean_id 라벨 통일** (record_created, notification_sent 등)

### 즉시 차단 권고 (R5)

**없음.** Critical / Major 0건. 발견된 5건 모두 minor 또는 *수정 범위 최소화 원칙으로 의도된 잔재*. ticket done 진행 유지 OK.
