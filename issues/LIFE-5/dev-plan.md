---
ticket: 003
status: 🟢 완료
created: 2026-05-06
updated: 2026-05-07
---

# Ticket 003 — Dev Plan

> **앵커:** [ticket.md](./ticket.md), [mockup.pen](./mockup.pen), [spec/screens.md](../../spec/screens.md), [spec/event-taxonomy.md](../../spec/event-taxonomy.md), [spec/design-system.md](../../spec/design-system.md), [spec/design.pen](../../spec/design.pen)
> **영향 screens.md 라인:** S05 빠른 기록(양만), S05c 맛 노트 입력 시트(신규), S06 기록 상세(맛 노트 list)
> **브랜치:** `ticket/003-wave-1-ux` (워크트리: `home-coffing-003`)
> **의존:** 002 done — Catalog/Instance 분리 + Record 1:N 적용 완료

---

## 1. 변경 범위 요약

| 영역 | 신규 | 수정 | 제거 |
|---|---|---|---|
| API (entities) | — | (없음 — TasteNote entity는 002에서 이미 1:N로 정착) | — |
| API (record) | TasteNote CRUD endpoints, dto | record dto에서 tasteNote 단일 제거, RecordResponse `tasteNote` → `tasteNotes[]`, service의 `applyTasteNoteUpdate` 단일 슬롯 로직 제거 | record dto의 `tasteNote` 단일 필드 |
| API (taste-note) | **신규 모듈** `taste-note/` (controller·service·dto·module) | — | — |
| shared-types | `TasteNoteResponse`, `TasteNoteCreateRequest`, `TasteNoteUpdateRequest`, `RecordResponse` 갱신 | — | — |
| App (sheets) | `TasteNoteSheet.tsx` (S05c) | `QuickRecordSheet.tsx` (메모·맛 필드 제거 → 양만), `RecordEditSheet.tsx` (메모·맛 필드 제거 → 양/원두/시각만) | — |
| App (records/[id]) | 맛 노트 list section, "+ 추가" CTA, row별 ✎(본인 작성한 노트), 빈 상태 카드 | header에서 title 패턴(memo 첫 줄) 제거 → 작성자/시각만 | record-level 메모 노출 |
| App (lib/queries) | `taste-notes.ts` (useTasteNoteCreate/Update/Delete), `lib/types.ts`에 `TasteNoteResponse` 추가 | `records.ts` CreateRecordInput/UpdateRecordInput에서 memo/recipe/tasteNote 제거, Record 타입의 `tasteNote` → `tasteNotes` | record-level memo 입력 path |
| 이벤트 (Amplitude wrapper) | `taste_note_created` 신규 발화 (입력 시트 저장 성공 시) | `record_created` 페이로드에서 `has_taste_note` / `taste_note_length` 제거 — 003부터 항상 false였음 | — |
| 데이터 모델 | (entity 변경 없음 — 002 완료분 활용) | — | — |
| 마이그레이션 | **schema:update 불필요** (entity 변경 없음) | — | — |

---

## 2. API 작업

### 2.1 record 모듈 (수정)

**dto.ts**
- `TasteNoteInput` interface 제거
- `CreateRecordDto`에서 `memo`, `recipe`, `tasteNote` 필드 제거 → 남는 필드: `beans`, `cups?`, `brewedAt`
- `UpdateRecordDto`에서 `memo`, `recipe`, `tasteNote` 필드 제거 → 남는 필드: `beans?`, `cups?`, `brewedAt?`
- `RecordResponse`:
  - `memo: string | null` 제거 (record 자체 메모 없음)
  - `recipe: RecipeParamsJson | null` 제거 (002 D1 호환 종료)
  - `tasteNote: { text, rating? } | null` 제거
  - **신규** `tasteNotes: TasteNoteResponse[]` (id 오름차순)
- `TasteNoteResponse` 정의 (record dto에서 import 가능 — taste-note 모듈에 두고 record가 import):
  ```ts
  export interface TasteNoteResponse {
    id: number;
    recordId: number;
    author: { id: number; email: string; displayName: string | null };
    rating: number | null;
    memo: string | null;
    createdAt: Date;
  }
  ```

**record.service.ts**
- `applyTasteNoteUpdate` 메서드 삭제
- `createRecord`: dto.tasteNote 처리 블록 삭제, dto.memo 라인 삭제, dto.recipe 주석 삭제. record entity 생성 시 memo 미설정 (entity는 nullable column 유지 — 데이터는 002 backfill로 남아있음, 003부터 신규는 null).
- `updateRecord`: `if (dto.tasteNote !== undefined) ...` 블록 삭제, `if (dto.memo !== undefined) ...` 블록 삭제. recipe 주석 정리.
- `toResponse`: `firstTasteNote` 단일 추출 로직 제거 → `tasteNotes` 배열 매핑(`.toResponseTasteNote(tn)` 헬퍼 또는 inline)으로 교체. `recipe`, `memo`, 단일 `tasteNote` 필드 제거.

**record entity는 변경 없음** (memo column 유지 — 기존 데이터 보존, 신규는 null. 향후 ticket에서 column drop 결정).

### 2.2 taste-note 모듈 (신규)

**경로**: `apps/api/src/taste-note/`

```
taste-note.module.ts
taste-note.controller.ts
taste-note.service.ts
dto.ts
```

**dto.ts**
```ts
export class CreateTasteNoteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;
}

export class UpdateTasteNoteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string | null;
}

export interface TasteNoteResponse { /* 위 정의 재사용 — taste-note dto에서 SoT */ }
```

**Endpoints (controller)** — 모두 `JwtAuthGuard`
| method | path | 권한 | 본문 |
|---|---|---|---|
| POST | `/records/:recordId/taste-notes` | record 소속 cafe member | `CreateTasteNoteDto` → `TasteNoteResponse` |
| PATCH | `/taste-notes/:id` | author 본인만 | `UpdateTasteNoteDto` → `TasteNoteResponse` |
| DELETE | `/taste-notes/:id` | author 본인만 | 204 |

> `GET /records/:recordId/taste-notes`는 **별도 엔드포인트 없음** — `RecordResponse.tasteNotes[]`에 동봉.

**service 로직**
- `create(recordId, userId, dto)`:
  - record 조회 + cafeUser membership 검증 (record.service의 `findRecordWithMembership` 패턴 차용 — 공통 헬퍼로 추출하거나 taste-note service에서 다시 구현. **결정: 다시 구현 (수정 범위 최소화).**
  - rating, memo 모두 비어있어도 허용 (별점 없는 메모, 메모 없는 별점, 둘 다 빈 row 모두 허용 — design 명세에 둘 다 옵션). 단 둘 다 빈 경우는 클라이언트에서 막음 (저장 버튼 disabled).
  - TasteNote 생성, author = userId, createdAt = now.
- `update(id, userId, dto)`: TasteNote 조회 → `author.id !== userId` → FORBIDDEN. dto 필드만 갱신 (null 허용 — 별점/메모 개별 비우기).
- `delete(id, userId)`: TasteNote 조회 → author 검증 → remove.

**module 등록**: `app.module.ts`에 `TasteNoteModule` 추가.

### 2.3 마이그레이션

- **schema:update 불필요** — entity 변경 없음.
- record entity의 `memo` column은 유지 (기존 데이터 보존).

### 2.4 Cup 필드

`Record.cups`는 **2.1에서 변경 없음**. `cups`는 entity에 없고 dto 통과만 (silently ignored) — 003 범위 외. UpdateRecordDto에 유지.

### 2.5 이벤트 발화 (Q4 결정)

**API 측 발화 없음.** Amplitude는 클라이언트 wrapper에서 발화 (현재 정책 — `references/operations-summary.md` 확인 필요). 003에서 추가 이벤트:
- `taste_note_created` — 클라이언트 `useTasteNoteCreate` onSuccess에서 발화
  - properties: `record_id`, `cafe_id`, `taste_note_id`, `has_rating: bool`, `has_memo: bool`, `memo_length: int`, `delay_hours_from_record: number` (record.brewedAt → now)
- 수정/삭제 이벤트는 003에서 발화 안 함 (taxonomy에 추가 deferred)
- `record_created` 페이로드에서 `has_taste_note`, `taste_note_length` 제거 (003부터 양만이라 항상 false)

> taxonomy에 신규 이벤트 추가는 ticket done 시 spec 갱신 단계에서 반영.

---

## 3. App 작업

### 3.1 빠른 기록 시트 — `QuickRecordSheet.tsx` (S05 v003)

**제거**:
- 메모 입력 필드 (record-level memo)
- "더 자세히 입력" 토글 (이전부터 없었으면 그대로)
- recipe 파라미터 (있으면)
- tasteNote 입력

**유지**:
- 원두 선택 (블렌딩 N개)
- 양 입력 (g)
- 시간 모드: "지금" / "시간 지정" 토글
- 빈 상태 / 채워진 상태 / 시간 지정 상태 — mockup A1/A2/A3 매칭

**API**: `useCreateRecord` 호출 시 payload는 `{ beans, brewedAt }`만.

### 3.2 기록 수정 시트 — `RecordEditSheet.tsx` (S07 v003)

**제거**: 메모, 맛 노트 입력 필드.
**유지**: 원두/양/시각.

(맛 노트 편집은 기록 상세에서만 — Q2 결정 일관성)

### 3.3 기록 상세 — `app/records/[id].tsx` (S06 v003)

**header**:
- 작성자 아바타 + 이름 + 시각 (브루잉 시각 + 상대 시각)
- 본인 작성 시: ⋯ 메뉴 → "수정"·"삭제"
- 와이프 작성 시: ⋯ 메뉴 노출 X (Q6 결정)
- title 패턴(memo 첫 줄) **제거** (Q5)

**원두 카드**: 기존 유지 (블렌딩 시 N개 row).

**맛 노트 섹션** (신규):
- 헤더: "맛 노트" + 카운트 (있을 때만)
- 빈 상태 (B1, B4): 약한 CTA 카드 "맛 노트 추가하기" — 탭하면 S05c 시트 추가 모드
- 노트 list (B2, B3): row별
  - 좌: author 아바타
  - 본문: author 이름 · 시각(상대) · 별점(있으면) · 메모(있으면)
  - 본인 작성한 노트일 때만 우측 ✎ 아이콘 → S05c 시트 수정 모드
- 하단: "+ 추가" 버튼 — 항상 노출 (이미 있어도 N개 추가 가능)

**섹션 정렬**: tasteNotes[]는 createdAt 오름차순으로 그대로 표시 (API에서 id 오름차순 = 시간 오름차순).

### 3.4 맛 노트 입력 시트 — `TasteNoteSheet.tsx` (S05c, 신규)

**경로**: `apps/app/src/components/sheets/TasteNoteSheet.tsx`

**모드**:
- `mode: 'create'` (recordId 필수)
- `mode: 'update'` (tasteNoteId 필수, 초기값 prefill)

**필드**:
- 별점 (0.5 ~ 5.0, **0.5 단위** — entity decimal(3,1) 활용). 별 5개, 각 별의 좌/우 절반 탭으로 0.5/1.0 입력. 0 = 별점 없음(비우기 액션 별도 — 길게 누르기 또는 "별점 지우기" link).
- 메모 (선택, 200자, multiline)

**액션**:
- 저장: rating·memo 둘 다 비어있으면 disabled
- 수정 모드 추가 액션: "맛 노트 삭제" link → ConfirmDialog → DELETE
- 닫기: dirty 시 useDirtyClose 훅 적용

**완료 후**: 시트 닫기 + 기록 상세 invalidate (TanStack Query).

### 3.5 lib/queries — `taste-notes.ts` (신규)

```ts
export const tasteNoteKeys = { all: ['taste-notes'] as const };

export function useTasteNoteCreate(recordId, cafeId) {
  // POST /records/:recordId/taste-notes
  // onSuccess: invalidate recordKeys.detail(recordId), recordKeys.cafeList(cafeId)
  // amplitude: track('taste_note_created', { record_id, cafe_id, taste_note_id, has_rating, has_memo, memo_length, delay_hours_from_record })
}
export function useTasteNoteUpdate(tasteNoteId, recordId, cafeId) {
  // PATCH /taste-notes/:id
  // onSuccess: invalidate recordKeys.detail(recordId)
}
export function useTasteNoteDelete(recordId, cafeId) {
  // DELETE /taste-notes/:id
  // onSuccess: invalidate recordKeys.detail(recordId), recordKeys.cafeList(cafeId)
}
```

### 3.6 lib/types.ts — `Record` 타입 갱신

```ts
export interface Record {
  id: number;
  cafeId: number;
  user: { id: number; email: string; displayName: string | null };
  totalGrams: number;
  cups: number | null;
  brewedAt: string;
  loggedAt: string;
  // memo 제거
  // recipe 제거
  // tasteNote (단일) 제거
  tasteNotes: TasteNoteResponse[]; // 신규
  beans: Array<{ beanId: number; beanName: string; grams: number }>;
  createdAt: string;
}

export interface TasteNoteResponse {
  id: number;
  recordId: number;
  author: { id: number; email: string; displayName: string | null };
  rating: number | null;
  memo: string | null;
  createdAt: string;
}
```

`RecipeJson`, `TasteNoteJson` 타입은 삭제 (사용처 cleanup).

### 3.7 records.ts — 입력 인터페이스 정리

- `CreateRecordInput`: `memo`, `recipe`, `tasteNote` 필드 제거 → `{ beans, brewedAt, cups? }`
- `UpdateRecordInput`: 동일하게 `memo`, `recipe`, `tasteNote` 제거

---

## 4. shared-types 변경

```ts
// === Record ===

export interface RecordResponse {
  id: number;
  cafeId: number;
  user: { id: number; email: string; displayName: string | null };
  totalGrams: number;
  cups: number | null;
  brewedAt: string;
  loggedAt: string;
  tasteNotes: TasteNoteResponse[];
  beans: Array<{ beanId: number; beanName: string; grams: number }>;
  createdAt: string;
}

// === TasteNote ===

export interface TasteNoteResponse {
  id: number;
  recordId: number;
  author: { id: number; email: string; displayName: string | null };
  rating: number | null;
  memo: string | null;
  createdAt: string;
}

export interface TasteNoteCreateRequest {
  rating?: number;
  memo?: string;
}

export interface TasteNoteUpdateRequest {
  rating?: number | null;
  memo?: string | null;
}
```

> shared-types는 현재 record 관련 타입이 들어있지 않아 보임 — 신규 추가. `apps/web`에서도 사용 가능.

---

## 5. 작업 순서 (의존 그래프)

1. **shared-types** — `TasteNoteResponse`, `RecordResponse` (003 shape) 추가
2. **API record 모듈 정리** — dto/service/response 003 shape으로 (build green 확보)
3. **API taste-note 모듈 신규** — module/controller/service/dto + app.module 등록
4. **API 통합 테스트** — POST/PATCH/DELETE 권한 분기, RecordResponse.tasteNotes shape 확인 (qa-engineer 1차)
5. **App lib/types + queries (records, taste-notes)** — 타입 갱신, 신규 훅
6. **App QuickRecordSheet / RecordEditSheet** — 필드 제거
7. **App TasteNoteSheet (신규)**
8. **App records/[id].tsx** — 헤더 + 맛 노트 섹션
9. **App ↔ API 통합 QA** (qa-engineer 2차) — shape 일치, 권한 분기 UI, 빈 상태/단일/N개 렌더, ⋯ 메뉴 분기
10. **이벤트 발화 검증** — `taste_note_created` 페이로드, `record_created` 페이로드 변경 확인 (qa-engineer 3차)
11. **통합 QA 1회** — 전체 흐름(빠른기록→상세→노트추가→수정→삭제), spec 정합

---

## 6. QA 체크리스트 (모듈별)

**API record (단계 4):**
- CreateRecordDto에 memo/recipe/tasteNote 보내면 → class-validator로 거부? (whitelist + forbidNonWhitelisted) 또는 silently ignored? **확인**: 현재 `app.module`/`main.ts`의 ValidationPipe 옵션에 따라 다름. 현재 `forbidNonWhitelisted: true`면 client 마이그레이션 동안 충돌. **결정: 그대로 두되 클라이언트가 동시에 변경되므로 문제 없음**.
- RecordResponse에 tasteNotes 배열 포함, 각 row에 author 정보 동봉
- 002 backfill로 생긴 TasteNote가 제대로 노출되는지 확인

**API taste-note (단계 4):**
- POST: cafe member 아니면 403, record 없으면 404
- PATCH/DELETE: author 아니면 403
- rating boundary (0, 5, 5.1, -1)
- memo length boundary (200, 201)

**App (단계 9):**
- API ↔ client shape 일치 (특히 tasteNotes[] 매핑)
- 인증 흐름 (401 → refresh → logout)
- 권한 분기 UI:
  - 본인 작성 record → ⋯ 메뉴 보임
  - 와이프 작성 record → ⋯ 메뉴 숨김
  - 본인 작성 노트 → ✎ 보임
  - 와이프 작성 노트 → ✎ 숨김
- 빠른 기록: 메모/맛 입력 필드 사라짐
- 기록 수정: 메모/맛 입력 필드 사라짐
- 빈 상태(B1/B4) — "맛 노트 추가하기" 약한 CTA 카드만, 별도 진입 동선 X
- N개 노트 mixed (B3) — 같은 author N개 OK, author 별로 그룹핑 X (시간순)
- 입력 시트 (C1/C2):
  - 둘 다 빈 상태 → 저장 disabled
  - 별점만 / 메모만 → 저장 가능
  - 수정 모드 → "삭제" link 노출 + Confirm
- design-system 톤 정합:
  - 맛 노트 list row 컴포넌트 톤
  - 별점 컴포넌트 (mockup 매칭)
  - 입력 시트 톤 (기존 시트들과 일관)

**이벤트 (단계 10):**
- `taste_note_created` 발화 위치: 입력 시트 저장 성공 onSuccess
- 페이로드: `record_id`, `cafe_id`, `taste_note_id`, `has_rating`, `has_memo`, `memo_length`, `delay_hours_from_record`
- `record_created` 페이로드에서 `has_taste_note` / `taste_note_length` 제거 확인
- screen_viewed: `record_detail`, `taste_note_sheet` (기존 정책에 맞춰)

---

## 7. ticket done 시 spec 갱신 항목

- **screens.md**:
  - `S05` 빠른 기록 — recipe/tasteNote 라인 (🔴 LIFE-3 진행 예정) → 003에서 변경됨 표시. 라인 재구성:
    - ✅ 원두 선택 + 양 입력 — pre-ticket
    - ✅ 시간 모드 (지금/지정) — pre-ticket
    - ~~"더 자세히 입력" 토글~~ — LIFE-3 → LIFE-5 (2026-MM-DD, 양만으로 단순화)
    - ~~recipe/tasteNote 필드~~ — 동일
  - `S05c` (신규 라인 섹션) "맛 노트 입력 시트": ✅ 별점·메모 입력 (추가/수정), ✅ 삭제 link — LIFE-5
  - `S06` 기록 상세 — 미진입(🔴) 라인을 진행(🟡)/운영(✅)으로:
    - ✅ 기록 1건 정보 (원두 카드 + 맛 노트 list) — LIFE-5
    - ✅ 작성자 표시 (아바타+이름+시각) — LIFE-5
    - ✅ 본인 기록 시 ⋯ 메뉴 (수정/삭제) — LIFE-5
    - ✅ 맛 노트 list (1:N, author 무관) — LIFE-5
    - ✅ 본인 작성 노트만 ✎ — LIFE-5
- **event-taxonomy.md**:
  - Record 섹션 `record_created` 페이로드: `has_taste_note`, `taste_note_length` 제거 (003 시점부터 양만)
  - 신규 TasteNote 섹션 추가:
    - `taste_note_created` — 입력 시트 저장 시 — `record_id`, `taste_note_id`, `has_rating`, `has_memo`, `memo_length`, `delay_hours_from_record`
- **design-system.md**:
  - 컴포넌트 카탈로그 추가:
    - "맛 노트 카드 (list row)" — 아바타+이름+시각+별점+메모+✎
    - "맛 노트 입력 시트" — 별점 picker + 메모 textarea + 삭제 link(수정 모드)
    - "약한 CTA 카드" — 빈 상태용 (B1/B4)
- **design.pen**: mockup.pen 9 frame을 spec design.pen에 반영 (S05 A1/A2/A3, S06 B1/B2/B3/B4, S05c C1/C2). client-engineer가 ticket done 시 Pencil MCP로 진행.
- **tickets/CLAUDE.md**: Designing → Done 이동, 003 라인.
- **003/CLAUDE.md, ticket.md** frontmatter: `status: done`, `updated: YYYY-MM-DD`.

---

## 8. 미해결 이슈 / 결정 필요

| ID | 이슈 | 잠정 결정 | 사용자 확인 필요 |
|---|---|---|---|
| D1 | 별점 정수(1~5) vs 0.5 단위 | **0.5 단위 (0.5 ~ 5.0)** — entity decimal(3,1) 그대로 활용 | ✅ resolved 2026-05-06 |
| D2 | rating·memo 둘 다 빈 노트 허용 (API) vs 거부 | API는 허용 (양쪽 옵션), 클라이언트 저장 버튼 disabled로 막음 | — |
| D3 | record entity `memo` column drop | 003에서는 keep (기존 데이터). 향후 별도 ticket | — |
| D4 | record entity `recipe` FK 제거 | 003에서는 keep nullable. 004 (recipe wave) 진입 시 재설계 | — |
| D5 | ValidationPipe `forbidNonWhitelisted` 동작 | 클라이언트 동시 마이그레이션이라 문제 없음 — 그대로 진행 | — |
| D6 | 다른 사람 작성 record 본문 ⋯ 메뉴 | 숨김 (Q6 resolved) | — |
| D7 | `record_updated` 페이로드 `changed_fields`에 `taste_notes` 추가 여부 | **추가 안 함** — record 자체 update에서 taste_notes는 더 이상 변경 대상 아님 | — |

---

## 9. 운영 가드레일 점검

- ✅ 파괴적 마이그레이션 없음 (entity 변경 0)
- ✅ 인증/권한: cafe member + author 분리 검증
- ✅ shared-types 단일 소스로 client/web 양쪽 적용
- ⚠️ `apps/web`은 본 ticket에서 변경 X (현재 web에 기록 화면 없음 — 변경 시 별도 명시 필요)

---

## Change log

- 2026-05-06: 신규 작성. 사용자 컨펌.
- 2026-05-07: 전 task 완료. spec 갱신(screens.md / event-taxonomy.md / design-system.md) + main 병합. design.pen 갱신은 Pencil MCP 복구 후로 deferred. 배포는 wave 2/3 묶음 결정.
