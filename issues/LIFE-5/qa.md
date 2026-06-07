# Ticket 003 — QA Log

## 1차 (API) — 2026-05-06

**범위:** record 모듈 003 정리 + taste-note 신규 모듈 정적 검증.
**대상 파일:**
- `packages/shared-types/src/index.ts`
- `apps/api/src/record/dto.ts`, `apps/api/src/record/record.service.ts`
- `apps/api/src/taste-note/{dto.ts, mapper.ts, taste-note.controller.ts, taste-note.service.ts, taste-note.module.ts}`
- `apps/api/src/app.module.ts`, `apps/api/src/main.ts`
- `apps/api/src/common/entities/{record.entity.ts, taste-note.entity.ts}`

**검증 방식:** 정적 코드 리딩 + 경계면 교차 비교(API dto ↔ shared-types). 워크트리에 node_modules 미설치로 nest 빌드 시도는 skip(프로젝트 deps 미설치는 의도적 — root 레포 빌드는 별 워크트리에서).

### Critical
- 없음.

### Major
- 없음.

### Minor
- **M1 — ValidationPipe `forbidNonWhitelisted` 미설정 (main.ts:11-15).** dev-plan §6 API 체크리스트는 "Create/UpdateRecordDto에 memo/recipe/tasteNote 보내면 ValidationPipe 거부"를 기대하지만 현재 main.ts에는 `whitelist: true`, `transform: true`만 설정되어 있고 `forbidNonWhitelisted`가 없다. 따라서 클라이언트가 (마이그레이션 누락으로) memo/recipe/tasteNote를 동봉해도 **400이 아니라 silently stripped 후 200**으로 처리된다. dev-plan §8 D5에서 "클라이언트 동시 마이그레이션이라 그대로 진행"으로 명시 결정되었으므로 코드 자체는 결정과 일치 — 다만 **§6 체크리스트 문구("거부")가 D5와 모순**되니 dev-plan §6을 "silently stripped 확인"으로 정정하거나, 안전망으로 `forbidNonWhitelisted: true`를 추가하는 결정 필요. 코드 변경 없이 문구만 정리해도 됨.
- **M2 — `RecordResponse.cups`가 항상 `null`로 하드코딩 (record.service.ts:293).** dev-plan §2.4 "cups는 entity에 없고 dto 통과만 (silently ignored)"으로 명시 — 응답에서도 entity 컬럼이 없으니 null이 맞다. 다만 shared-types/api dto 모두 `cups: number | null`로 명목상 nullable이지만 실제로는 `null`만 가능. 향후 cups 컬럼 도입 ticket에서 SoT가 어디인지 혼란 소지. 003 범위에서는 변경 불필요, 메모만 남김.

### Nit
- **N1 — `TasteNoteModule.forFeature([TasteNote, RecordEntity, CafeUser, User])`** (taste-note.module.ts:14). 동일 엔티티가 record/auth/user 모듈에서 이미 forFeature 등록되어 있어 중복이지만, 프로젝트 다른 모듈(invitation/cafe/device)도 동일하게 자기 모듈이 쓰는 엔티티를 모두 등록하는 컨벤션이라 일관성 OK. 변경 불필요.
- **N2 — `record/dto.ts`가 `../taste-note/dto`에서 `TasteNoteResponse`를 import (record/dto.ts:12).** record가 taste-note에 의존하는 모양. 대안은 shared-types로 빼는 것이지만 dev-plan §2.1이 "taste-note 모듈에 두고 record가 import"로 명시한 결정 — 수용.

### Pass 항목 (체크리스트 대조)

**RecordResponse shape (dev-plan §2.1)**
- ✅ `tasteNotes: TasteNoteResponse[]` 동봉, id 오름차순 정렬 (record.service.ts:278-282 `sort((a,b)=>a.id-b.id)`)
- ✅ `memo`/`recipe`/단일 `tasteNote` 필드 부재 — record/dto.ts `RecordResponse`에서 모두 제거됨
- ✅ `user`(작성자) 필드는 기존대로 유지 (record.service.ts:286-290)
- ✅ TasteNote row의 `author: { id, email, displayName }` 동봉 (mapper.ts:6-12)

**002 backfill 노출**
- ✅ Record entity의 `tasteNotes` collection은 OneToMany로 살아있고(record.entity.ts:61-64), `RECORD_POPULATE`에 `'tasteNotes', 'tasteNotes.author'` 포함 (record.service.ts:31-32) → 002에서 backfill된 row 모두 GET /records/:id, GET /records 양쪽에 노출됨.

**POST /records/:recordId/taste-notes (dev-plan §2.2)**
- ✅ `JwtAuthGuard` 클래스 레벨 적용 (taste-note.controller.ts:26)
- ✅ record 미존재 → `NOT_FOUND` (taste-note.service.ts:28-30)
- ✅ cafe membership 없음 → `FORBIDDEN` (taste-note.service.ts:32-38)
- ✅ rating boundary: `@Min(0) @Max(5)` → 0/5 OK, 5.1/-1 거부 (dto.ts:6-8)
- ✅ memo MaxLength(200) → 200 OK, 201 reject (dto.ts:11-13)
- ✅ rating·memo 모두 미지정 허용 → `null` 저장 (taste-note.service.ts:48-49) — D2 결정 부합
- ✅ author·createdAt 자동 설정 (taste-note.service.ts:50)
- ✅ 트랜잭션 처리(`em.transactional`) — record/membership 조회와 insert 원자성 보장

**PATCH /taste-notes/:id**
- ✅ 미존재 → 404 (taste-note.service.ts:70-72)
- ✅ author !== userId → 403 (taste-note.service.ts:73-75)
- ✅ `dto.rating !== undefined` 체크로 null 허용 (taste-note.service.ts:77-79) — null 보내면 별점 삭제 가능
- ✅ `dto.memo !== undefined` 체크로 null 허용 (taste-note.service.ts:80-82)
- ✅ class-validator의 `@IsOptional()`은 null/undefined 둘 다 통과시키므로 `UpdateTasteNoteDto.rating: null`, `memo: null` 페이로드가 정상 통과 후 service에서 `null`로 set됨

**DELETE /taste-notes/:id**
- ✅ 미존재 → 404, author 검증 → 403 (taste-note.service.ts:96-101)
- ✅ `@HttpCode(HttpStatus.NO_CONTENT)` 204 응답 (taste-note.controller.ts:49)
- ✅ `em.remove` + flush — Record와 cascade 관계 영향 없음 (TasteNote.record 단방향, Record.tasteNotes에 orphanRemoval 있지만 단일 row 명시 remove라 충돌 없음)

**Record dto 003 정리 (§2.1)**
- ✅ `CreateRecordDto`에 memo/recipe/tasteNote 필드 없음 (record/dto.ts:23-38)
- ✅ `UpdateRecordDto`에 memo/recipe/tasteNote 필드 없음 (record/dto.ts:40-57)
- ✅ record.service.ts에 `applyTasteNoteUpdate` 메서드 삭제 확인 (grep 결과 0건)
- ✅ `createRecord`/`updateRecord`에 `dto.memo`, `dto.recipe`, `dto.tasteNote` 처리 블록 없음

**shared-types ↔ API dto 매핑 정합 (§4)**
- ✅ `TasteNoteResponse`/`RecordResponse` 신규 추가 (shared-types/index.ts:72-104)
- ✅ shared-types는 `string`(ISO), api dto는 `Date` — Bean/Consumption과 동일 컨벤션. JSON 직렬화 시 ISO string 변환되어 클라이언트 수신값과 일치. 클라이언트가 shared-types를 import하면 `string`으로 받게 되어 정합.
- ✅ `TasteNoteCreateRequest`(rating?, memo?), `TasteNoteUpdateRequest`(rating?: number|null, memo?: string|null) — api `CreateTasteNoteDto`/`UpdateTasteNoteDto` shape과 일치.

**모듈 등록 (§2.2)**
- ✅ `TasteNoteModule`이 `app.module.ts:10, 25`에 정확히 import + imports 배열 등록.

**운영 가드레일 (§9)**
- ✅ entity 변경 0 — record.entity.ts/taste-note.entity.ts 모두 002 그대로. 마이그레이션·schema:update 불필요.
- ✅ MikroORM v6 패턴 유지(`em.transactional`, `populate`, `Collection`) — v7 import 없음.
- ✅ 인증/권한 분리: cafe member(POST) ↔ author(PATCH/DELETE) 분리 검증.

**경계면 교차 비교**
- ✅ `record/dto.ts:RecordResponse.tasteNotes` ↔ `taste-note/dto.ts:TasteNoteResponse` 동일 type 사용 (single source).
- ✅ `mapTasteNote` 결과가 `TasteNoteResponse` shape을 그대로 만족 — `rating`은 `Number(...)`로 decimal→number 변환 (mapper.ts:13).

### 후속 작업 권고
1. **dev-plan §6 문구 정정** (M1): "ValidationPipe 거부" → "silently stripped 확인 (D5 결정 반영)" 또는 main.ts에 `forbidNonWhitelisted: true` 추가. 결정만 필요, 코드 변경 옵션.
2. App 단계(Task #5~) 진입 시 `apps/app/src/lib/types.ts`의 `Record.tasteNotes` 매핑이 shared-types `RecordResponse.tasteNotes`(string createdAt)와 정확히 일치하는지 2차 QA에서 재확인.

**즉시 차단 권고 없음.** Task #5(App lib/types) 진행 OK.

---

## 2차 (App ↔ API) — 2026-05-07

**범위:** Task #5~#8 산출물 정적 검증 + 경계면 교차 비교.
**대상 파일:**
- `packages/shared-types/src/index.ts` (1차 통과 그대로)
- `apps/app/src/lib/types.ts`, `apps/app/src/lib/queries/{records.ts, taste-notes.ts}`
- `apps/app/src/components/sheets/{QuickRecordSheet.tsx, RecordEditSheet.tsx, TasteNoteSheet.tsx}`
- `apps/app/src/components/RecordCard.tsx`
- `apps/app/src/components/form/RecipeFields.tsx` (삭제), `apps/app/src/components/form/RatingField.tsx` (orphan → 본 QA에서 삭제)
- `apps/app/app/records/[id].tsx`

**검증 방식:** 정적 코드 리딩 + grep 기반 stale ref 탐색. node_modules 미설치라 tsc/expo build skip.

### Critical
- 없음.

### Major
- 없음.

### Minor
- **M3 — `RatingField.tsx` orphan.** TasteNoteSheet은 자체 `HalfStarRating` (0.5 단위) 인라인 helper 사용. 정수 only `RatingField`는 003 시점 사용처 0건. 본 QA에서 삭제 처리. RecipeFields.tsx 삭제 패턴과 일관.
- **M4 — `Record` 타입에 `RecipeJson`/`TasteNoteJson` 정의 잔존 (apps/app/src/lib/types.ts).** Record interface에서는 제거됐으나 type 정의 자체는 keep. dev-plan §3.6 "RecipeJson, TasteNoteJson 타입은 삭제 (사용처 cleanup)"와 모순이지만, RecipeFields.tsx가 삭제됐고 사용처가 0이라 정의도 삭제 가능. 304 wave에서 recipe 다시 도입 시 어차피 재설계 예정이라 삭제가 깔끔. **결정 보류 — 수정 범위 최소화 원칙에 따라 keep도 OK.**

### Nit
- **N3 — TasteNoteSheet `useEffect` deps에 `initialRating`/`initialMemo` 누락 (eslint-disable 주석 명시).** visible toggle 시점에만 reset하는 의도 명확. 수정 불필요.
- **N4 — TasteNoteSheet 색상 hex 값 하드코딩 (`#3A2419`, `#A89A8C` 등).** 기존 records/[id].tsx도 동일 패턴(design-system token이 RN class에는 mapping되지만 lucide icon prop엔 직접 hex). 컨벤션 일관 OK.

### Pass 항목 (체크리스트 대조)

**1. Shape 일치**
- ✅ `apps/app/src/lib/types.ts:Record` shape ↔ API `RecordResponse` 일치 (id, cafeId, user, totalGrams, cups, brewedAt, loggedAt, tasteNotes, beans, createdAt). `Date` ↔ `string` 변환은 JSON 직렬화로 자동.
- ✅ `TasteNoteResponse` shape ↔ API `taste-note/dto.ts:TasteNoteResponse` 일치 (id, recordId, author{id,email,displayName}, rating, memo, createdAt).
- ✅ TasteNote CRUD 훅(`useTasteNoteCreate/Update/Delete`)이 받는 input shape ↔ API `CreateTasteNoteDto`/`UpdateTasteNoteDto` 일치 (rating?, memo?; update는 null 허용).
- ✅ `useCreateRecord`/`useUpdateRecord` payload({ beans, brewedAt, cups? })가 API `Create/UpdateRecordDto`와 정합 — memo/recipe/tasteNote 모두 부재.
- ✅ Stale ref 0건 (`record.tasteNote`, `record.recipe`, `record.memo` grep 결과 — types.ts 내 RecipeJson/TasteNoteJson 정의만 잔존, M4 참조).

**2. 권한 분기 UI** (records/[id].tsx)
- ✅ 본인 record (`isMine = record.user.id === currentUserId`) → ⋯ 메뉴 노출 (line 126-135).
- ✅ 다른 사람 record → ⋯ 자리 spacer (`<View className="w-10" />`)로 layout 유지하면서 메뉴 숨김.
- ✅ TasteNoteRow의 ✎: `isMine={note.author.id === currentUserId}` 일 때만 (line 266, 409-417).
- ✅ RecordEditSheet은 본인일 때만 진입 (⋯ 메뉴 → 수정).

**3. 빠른 기록 / 기록 수정 시트**
- ✅ QuickRecordSheet: memo/recipe/tasteNote state·필드·payload 0건. import에서 RatingField/TextField 정리.
- ✅ RecordEditSheet: 동일하게 0건. payload `{ beans, brewedAt? }`만 (cups는 UI 없음 — Task #6 보고 메모 그대로).

**4. 기록 상세**
- ✅ title 패턴(`record.memo` 첫 줄) 제거. header = MemberAvatar + author + 시각만 (line 148-174).
- ✅ 빈 상태(`tasteNotes.length === 0`): dashed border CTA 카드, "맛 노트 추가하기" + Plus icon + 보조 카피 (line 241-259).
- ✅ N개 mixed: TasteNoteRow가 author 단위 그룹핑 없이 시간순(API 순서 = id 오름차순) 렌더 (line 261-272).
- ✅ "+ 맛 노트 추가" 버튼 항상 노출 — list 아래 별도 (line 275-289). 빈 상태에서도, N개 있어도, 둘 다에서 추가 가능.

**5. TasteNoteSheet (S05c, C1/C2)**
- ✅ 둘 다 빈 → 저장 disabled (`canSubmit = !isLoading && (rating > 0 || trimmedMemo.length > 0)`, line 80-81).
- ✅ 별점만 / 메모만 → 저장 OK.
- ✅ 별점 0.5 단위: `HalfStarRating` 별 5개, 각 별 좌 18px = `slot - 0.5`, 우 18px = `slot` (line 256-267). `value >= slot` full / `value >= slot - 0.5` half / 그 외 outline (line 220-254).
- ✅ "별점 지우기" link: `rating > 0`일 때만 노출, tap → `setRating(0)` (line 132-138).
- ✅ create payload: `rating > 0 ? rating : undefined`, `memo > 0 ? trimmedMemo : undefined` (line 87-90).
- ✅ update payload: `rating > 0 ? rating : null`, `memo > 0 ? trimmedMemo : null` (line 93-96) — null 명시로 별점/메모 비우기 가능.
- ✅ update 모드 "맛 노트 삭제" 빨간 link → ConfirmDialog → useTasteNoteDelete (line 158-168, 105-117, 179-187).
- ✅ dirty close: `isDirty` 계산 후 `useDirtyClose` + ConfirmDialog (line 71-73, 189-197).

**6. 빌드 / 시그니처 정합**
- ✅ TasteNoteSheet props discriminated union: `{ mode: 'create', recordId } | { mode: 'update', tasteNote: TasteNoteResponse }` + 공통 visible/onClose/cafeId.
- ✅ records/[id].tsx의 TasteNoteSheet 호출처 — create는 `mode="create" recordId={record.id}`, update는 `mode="update" tasteNote={tasteSheet.tasteNote}` (line 339-355). 시그니처 일치.
- ✅ 타입 단언(as) 0건 — discriminated union으로 narrowing (TasteNoteSheet의 `props.mode === 'update'` 체크).

**7. invalidate 키**
- ✅ useTasteNoteCreate/Delete: `recordKeys.detail(recordId)` + `recordKeys.cafeList(cafeId)`. 기록 상세 + 리스트 재로드.
- ✅ useTasteNoteUpdate: `recordKeys.detail(recordId)`만. 리스트 cache는 노트 메타가 카드에 안 보이므로 invalidate 불필요 — 적절.

### 후속 작업 권고
1. **M4 결정**: RecipeJson/TasteNoteJson 정의 삭제 vs keep — 사용자 컨펌 필요 (수정 범위 최소화 원칙 vs dev-plan §3.6 명시). 삭제 추천.
2. **이벤트 발화** (Task #10): apps/app에 amplitude/track wrapper 부재 확인 — 003 범위에서는 발화 위치에 placeholder 주석만 박고, SDK 도입은 별도 ticket(Tech-debt or External)으로 분리.
3. **expo build/typecheck** 워크트리 deps 미설치로 skip — 사용자가 별도 환경에서 확인 필요. (root 워크트리 또는 본 워크트리 `pnpm install` 후 `pnpm --filter app exec tsc --noEmit`.)

**즉시 차단 권고 없음.** Task #10(이벤트 발화 검증 + 최종 통합 QA) 진행 OK.

---

## 3차 (이벤트 + 최종 통합) — 2026-05-07

**범위:** 이벤트 발화 wire-up 점검 + 전체 흐름 + spec 정합 + M4 후속 처리.

### M4 처리
- ✅ `RecipeJson`/`TasteNoteJson`/`RecipeStep` 정의 삭제 (`apps/app/src/lib/types.ts`). 사용처 0건 grep 확인.
- 참고: API의 `apps/api/src/common/types/recipe-params.ts`의 `RecipeStep`은 entity recipe 관련 별개 타입. record entity의 recipe FK는 003 범위에서 keep — 004 wave에서 재설계 예정.

### 이벤트 발화 (dev-plan §6 단계 10)
- **`taste_note_created`**: `useTasteNoteCreate.onSuccess`에 `TODO(analytics)` 주석 placeholder 박음 (apps/app/src/lib/queries/taste-notes.ts). 페이로드 후보(record_id, cafe_id, taste_note_id, has_rating, has_memo, memo_length, delay_hours_from_record) 명시. SDK 도입 ticket에서 wire-up.
- **`record_created` 페이로드 정정 (`has_taste_note`, `taste_note_length` 제거)**: 현재 클라이언트에 amplitude/track wrapper 자체가 없음 (`grep amplitude/track/analytics` 결과 0). `record_created` 발화 코드 자체 부재 → 정정 대상 없음. SDK 도입 ticket 작성 시 003부터는 `has_taste_note` 필드 미포함이라는 점만 명시하면 OK.
- **`taste_note_updated` / `taste_note_deleted`**: 003 미발화 결정(dev-plan §2.5). 주석 placeholder도 생략 — 미래 결정 사항.

### Critical
- 없음.

### Major
- 없음.

### Minor
- **M5 (구조적) — Amplitude SDK + 공통 track wrapper 부재.** apps/app 전체에 analytics 인프라가 0. `event-taxonomy.md`는 스프린트 03에서 도입 예정으로 명시되어 있으나 코드는 미진행. 003 scope 외 — 별도 ticket("analytics SDK 도입 + 공통 track wrapper") 분리 권장. 본 ticket done 후 brain 레포에 새 ticket 등록 필요.

### 통합 흐름 점검 (정적)

- ✅ **빠른 기록 → 기록 상세**: QuickRecordSheet 저장 → useCreateRecord onSuccess → records.cafeList/beans invalidate → Home 이동 시 자동 리스트 갱신. 기록 상세 진입 시 useRecordDetail로 fetch — `tasteNotes` 빈 배열로 시작.
- ✅ **노트 추가**: 기록 상세 빈 상태 CTA 또는 "+ 추가" → TasteNoteSheet create → useTasteNoteCreate → records.detail invalidate → list refetch → TasteNoteRow 렌더.
- ✅ **노트 수정**: 본인 노트 ✎ → TasteNoteSheet update mode (tasteNote 객체 전달) → useTasteNoteUpdate → records.detail invalidate → row 갱신.
- ✅ **노트 삭제**: TasteNoteSheet update 내 "맛 노트 삭제" link → ConfirmDialog → useTasteNoteDelete → records.detail invalidate → row 사라짐.
- ✅ **권한 cross-user**: 본인 record면 ⋯ 노출, 다른 사람 record면 spacer로 layout 유지하며 숨김. 노트 row의 ✎도 author 본인일 때만.

### Spec 정합 (ticket done 갱신 항목 사전 점검)

- ✅ **screens.md**: dev-plan §7 명시한 라인 갱신 항목 모두 ticket done 단계에서 처리 가능 (S05 라인 003 변경, S05c 신규 섹션, S06 미진입 → 운영 라인 갱신).
- ✅ **event-taxonomy.md**: `taste_note_created` 신규 + `record_created` 페이로드 003 변경 — ticket done 단계에서 spec에 추가. SDK 부재 메모도 함께.
- ✅ **design-system.md**: "맛 노트 카드 (list row)", "맛 노트 입력 시트", "약한 CTA 카드(빈 상태용)" 컴포넌트 카탈로그 추가 — ticket done 단계.
- ✅ **design.pen**: mockup.pen 9 frame을 spec design.pen에 반영 — ticket done 단계, Pencil MCP 필요. 본 QA 시점에 Pencil MCP 끊긴 상태라 후속 작업.

### 운영 가드레일 재점검
- ✅ 파괴적 마이그레이션 0 (entity 변경 0, schema:update 불필요).
- ✅ 인증/권한 분리 (cafe member vs author).
- ✅ shared-types 단일 SoT.
- ✅ apps/web 변경 0 (web에 기록 화면 부재 — 003 scope 외).

### 후속 작업 (ticket done 단계로 위임)
1. **screens.md 갱신** — dev-plan §7 명세대로.
2. **event-taxonomy.md 갱신** — `taste_note_created` 신규, `record_created` 페이로드 003 변경 메모, "Amplitude SDK 미도입" 상태 명시.
3. **design-system.md 갱신** — 신규 컴포넌트 카탈로그 3종.
4. **design.pen 갱신** — mockup.pen → design.pen 반영 (Pencil MCP 복구 후).
5. **신규 ticket 등록 (brain 레포)** — "analytics SDK 도입 + 공통 track wrapper" Tech-debt ticket. dev-plan §6에서 placeholder 주석 박은 위치(apps/app/src/lib/queries/taste-notes.ts) 인계.
6. **expo build / typecheck** — 사용자 환경에서 별도 검증.

**즉시 차단 권고 없음. 003 코드 작업 클로즈 — ticket done 단계 진입 가능.**
