# Screens — 통합본 (2026-06-07)

> **이 파일은 통합본**. 옛 spec/screens.md (축약 master) + Sprint 03 functional-spec (상세) + LIFE-6 / LIFE-7 / LIFE-14 mockup delta를 단순 append로 합침. 후속 디자인 작업 시 `issue-design` 룰로 자연 merge.
>
> *코드 = ground truth*. spec은 코드만으론 안 보이는 *기능 큰 그림 + 변경 이력*만.

---

# 영역 1 — 옛 spec/screens.md (master 축약본)

> 탭/스크린별 *현재 운영 기능* + *ticket 변경 이력*을 inline으로 표기. 코드 단위는 적지 않음 — 코드가 SoT.
>
> 각 기능은 **현재 상태 + ticket 변경 이력** inline.
>
> 화면 visual은 [design.pen](./design.pen) 참조 — 스크린 ID(S##) 표기.

## 표기 규칙

| 마커 | 의미 |
|------|------|
| ✅ | 운영 중 |
| 🟡 | 진행 중 (개발) |
| 🔴 | 미진입 (계획) |
| ~~취소선~~ | 롤백되어 더 이상 운영 X |

ticket 참조:
- `pre-ticket (Sprint XX)` — ticket 시스템 도입 전 작업
- `T### (YYYY-MM-DD)` — 추가/변경한 ticket
- `T### → T###` — 추가 후 롤백/변경

스크린 ID:
- `S##` 또는 `S##b`(variant) — [design.pen](./design.pen)의 frame 이름과 일치
- 본 문서의 ID는 *frame 찾기 용도*. PS15 Sprint 03 design phase 정정본 기준.

⚠️ 본 문서의 ticket ID들은 *예시* — 실제 ticket 진행 시 채워짐.

---

## IA 큰 그림

```
┌────────────────────────────────────────┐
│  [Home]   [Feed]   [더보기]  ☕FAB    │  ← Bottom Tab + FAB
└────────────────────────────────────────┘
```

- **3-Tab + FAB ☕** — 메인 행동 = 빠른 기록. 잔량/피드/설정은 탭으로.
- **원두 별도 탭 없음** — Home 섹션 처리 (등록 빈도 << 기록 빈도)
- **다이어리형** — "기록"이 주된 자산 (recipe + tasteNote)

---

## Home Tab — `[design.pen S02]`

### 잔량 카드 섹션
- ✅ 원두별 잔량 표시 (g / 잔수 / 일수) — pre-ticket (Sprint 01-03)
- ✅ 카드 subtext: 원두명 + type 라벨 (싱글/블렌드/디카페인) — LIFE-7 (2026-05-12)
- ✅ 원두 추가 버튼 (+) → B-add-bag (catalog 선택 필수) — pre-ticket / LIFE-7 (2026-05-12)
- 🟡 ROP 도달 강조 카드 (`$accent` 배경) — pre-ticket (Sprint 03 갱신)
- 🔴 다이어리형 전환 진입 (피드 + 잔량 동시 노출) — Sprint 03 design phase 정립, 구현 진행

### 기록 피드 섹션 (Home 내)
- 🔴 최근 기록 N개 시간순 — 미진입 (Phase 1 개인 기록)
- 🔴 cross-user 색상 구분 — 미진입 (Phase 1 공동 공유)

### 진입 / 이탈
- ✅ 진입: 앱 첫 진입 / 알림 탭 → Home — pre-ticket
- ✅ 이탈: FAB → 빠른 기록 / 원두 카드 → 원두 상세 / 탭 — pre-ticket

---

## Feed Tab — `[design.pen S08]`

- 🔴 모든 멤버 기록 시간순 — 미진입 (Phase 1)
- 🔴 cross-user 시각 구분 (색상·이니셜) — 미진입
- 🔴 기록 카드 → 상세 진입 — 미진입
- 🔴 FAB ☕ 노출 (모든 탭 공통) — 미진입

---

## 더보기 Tab — `[design.pen S09]`

- 🟡 홈카페 설정 진입 — pre-ticket (Sprint 03)
- 🟡 알림 설정 진입 — pre-ticket
- 🟡 멤버 초대 (링크 생성) 진입 — pre-ticket
- 🟡 계정 관리 진입 — pre-ticket
- 🔴 홈카페 리스트·전환 — Phase 2 이연 (1인 1 홈카페 가정 동안 미진입)

---

## FAB ☕ → 빠른 기록 시트 — `[design.pen S05, S05b, S05c, S05d, S05e, S05f]`

`[design.pen S05]` — 03 범위 (양만) + 04 chip + 05 Bean chip dropdown
- ✅ 원두 선택 + 양 입력 (3 step 이내) — pre-ticket
- ✅ 직전 원두·직전 레시피 기본값 복원 — pre-ticket / LIFE-6 (2026-05-08, last-used Recipe prefill)
- ✅ 지연 입력 ("방금 전 / 오전 / 어제") — pre-ticket
- ✅ Recipe chip (채워짐 / 빈 점선) — LIFE-6 (2026-05-08)
- ✅ Bean chip (filled / empty) + chip tap → in-place dropdown (활성 본 봉지 list + "전체 검색" CTA + "+ 원두 추가 (블렌딩)" pill) — LIFE-7 (2026-05-12, C1/C2/C3 mockup)
- ✅ "전체 검색" → F2 풀스크린 picker (activeOnly=true, cafeId) → catalog 선택 시 해당 활성 봉지 자동 매핑 — LIFE-7 (2026-05-12)
- ~~"더 자세히 입력" 토글 / recipe 파라미터 / tasteNote~~ — LIFE-3 → LIFE-5 (2026-05-07, 양만으로 단순화: 빠른 기록 = 양 + 시간만, 맛 노트는 기록 상세에서 N개 추가 가능)

`[design.pen S05b]` — Recipe inline dropdown (B1)
- ✅ chip tap → 같은 sheet 안 inline list 확장 (별도 sheet 아님) — LIFE-6 (2026-05-08)
- ✅ 등록 Recipe 카드 list + "⚙ 내 레시피 관리" link + "+ 새 레시피" — LIFE-6 (2026-05-08)

`[design.pen S05c]` — 맛 노트 입력 시트 (003 신규)
- ✅ 별점(0.5~5.0, 0.5 단위) + 메모(선택, 200자) — LIFE-5 (2026-05-07)
- ✅ 추가 / 수정 / 삭제 (작성자 본인만) — LIFE-5 (2026-05-07)

`[design.pen S05d]` — Recipe wizard 4-step (W1·W2-B·W3-B·W4-B, Option B 채택)
- ✅ W1 method 선택 (pour-over active, 나머지 "곧 출시") — LIFE-6 (2026-05-08)
- ✅ W2-B 셋업 통합 (dose / grindSize / waterTempC / 모드 hot·iced / totalYield / totalTime / iceGrams) — LIFE-6 (2026-05-08)
- ✅ W3-B 푸어 단계 list — Hybrid 모델 (startSec 절대 시점 + pourGrams delta + pourStyle?·direction?·notes?) — LIFE-6 (2026-05-08)
- ✅ W3-B 단계 카드 좌→우 위계: 라벨 / center 누적g+시점 2-line / 우측 cream badge "+pourGrams" / chevron — LIFE-6 (2026-05-08)
- ✅ W4-B 마무리 (equipment list + 이름 자동 placeholder + 저장) — LIFE-6 (2026-05-08)
- ✅ wizard mode 'create' / 'edit' / 'clone' (cream banner로 mode 표시) — LIFE-6 (2026-05-08)
- ✅ PS1 푸어 단계 입력 sub-sheet (라벨 / 시점 wheel picker / pourGrams / pourStyle 선택 / direction 선택 / notes) — LIFE-6 (2026-05-08)
- ✅ 장비 선택 sub-flow F1 (type pills + 카드 list + "+ 새 장비 등록") — LIFE-6 (2026-05-08)
- ✅ 새 장비 등록 form F1b (type/이름/브랜드/모델, source=USER, 등록 즉시 글로벌) — LIFE-6 (2026-05-08)

`[design.pen S05e]` — 내 레시피 관리 풀스크린 (E1)
- ✅ Recipe 카드 list (이름/method 배지/summary/사용 횟수) + 우상단 "+" → wizard — LIFE-6 (2026-05-08)
- ✅ 카드 tap → **R1 풀스크린 navigate** (자세히 보기) — LIFE-6 (2026-05-08)
- 진입 동선: 빠른 기록·기록 상세 dropdown 안 "⚙ 내 레시피 관리" link / 홈카페 설정 카페 자원

`[design.pen S05f]` — Recipe 상세 풀스크린 (R1) ★ LIFE-6 신규
- ✅ 헤더 (이름 + ⋯) + meta (method chip + 사용 횟수 + ratio) — LIFE-6 (2026-05-08)
- ✅ 셋업 grid 6 cells (원두/분쇄도/물 온도 + 모드/총 추출량/총 시간) — LIFE-6 (2026-05-08)
- ✅ 푸어 단계 list (W3-B 동일 styling, read-only) — LIFE-6 (2026-05-08)
- ✅ 장비 list (icon + type · name) — LIFE-6 (2026-05-08)
- ✅ footer 3-button [수정] [복제] [삭제] — LIFE-6 (2026-05-08)
- ✅ 수정 → wizard 'edit' mode prefilled, 동일 Recipe 갱신 — LIFE-6 (2026-05-08)
- ✅ 복제 → wizard 'clone' mode prefilled, 새 Recipe row 생성 (이름 "(사본)" suffix) — LIFE-6 (2026-05-08)
- ✅ 삭제 → confirm dialog (record reference 안내) → record.recipeId nullable 처리 — LIFE-6 (2026-05-08)
- 진입: E1 카드 tap / D1 Recipe 카드 body tap

---

## 원두 페이지

### 원두 상세 페이지 — `[design.pen S03]`
- ✅ 원두 정보 헤더 (이름·삭제) — pre-ticket
- ✅ 수정 폼 (edit mode: 원두 catalog **read-only**, 나머지 필드만 변경) — pre-ticket / LIFE-7 (2026-05-12, edit 시 catalog 잠금)
- 🟡 해당 원두 소비 기록 리스트 — pre-ticket (Sprint 03 갱신)
- ✅ BeanCard subtext: ~~origin~~ → type 한국어 (싱글 오리진 / 블렌드 / 디카페인) — LIFE-7 (2026-05-12)

### 원두 추가/수정 시트 (B-add-bag) — `[design.pen S04, S04b]`
- ✅ ~~이름 자유 텍스트 입력~~ → **catalog selector chip** (필수, "+ 원두 선택" empty / filled = 원두명+type) — LIFE-7 (2026-05-12)
- ✅ chip tap → F2 풀스크린 picker (catalog 전체 검색) — LIFE-7 (2026-05-12, mode='all')
- ✅ 용량 / 날짜 (주문/로스팅/배송) / 디개싱 / 하루 잔수 / 1잔 용량 — pre-ticket
- ✅ ~~origin / roaster TextField~~ — LIFE-7 (2026-05-12, 폐기 — catalog 단위로 일원화)
- ✅ archive Confirm — pre-ticket

### 원두 카탈로그 picker (F2 / F2-miss) — `[design.pen 미존재, LIFE-7 신규]`
- ✅ F2 풀스크린 modal: 검색 input + Bean catalog list (icon + 원두명 + type/process subline) — LIFE-7 (2026-05-12)
- ✅ row tap → 호출자(B-add-bag 또는 빠른 기록 C3) 복귀 + 선택값 반영 — LIFE-7 (2026-05-12)
- ✅ F2-miss: 결과 0건 시 search-x icon + "검색 결과 없음" + "다른 검색어로 시도해보세요" — CTA 없음 (silent dead-end, 후속 OCR ticket으로 사용자 등록 path 도입 예정) — LIFE-7 (2026-05-12)
- ✅ mode='all' (B-add-bag 진입) / mode='active-only' (빠른 기록 C3 "전체 검색" 진입) 분기 — LIFE-7 (2026-05-12)
- ✅ Bean catalog seed: 원두반점 universe 34종 (싱글 16 + 블렌드 11 + 디카페인 10) seed-only — LIFE-7 (2026-05-12, 운영자 DB script로 갱신)
- ✅ ~~"기타" Bean / freeName / 자유 텍스트 fallback~~ — LIFE-7 (2026-05-12, 폐기 — silent dead-end)

---

## 기록 페이지

### 기록 상세 — `[design.pen S06]`
- ✅ 기록 1건 정보 (원두 카드 + 맛 노트 list) — LIFE-5 (2026-05-07)
- ✅ 작성자 표시 (아바타 + 이름 + 시각, cross-user 색상) — LIFE-5 (2026-05-07)
- ✅ 본인 기록 시 ⋯ 메뉴 (수정/삭제) — LIFE-5 (2026-05-07)
- ✅ 맛 노트 list (1:N, author 무관 N개) — LIFE-5 (2026-05-07)
- ✅ 본인이 작성한 노트만 ✎ 수정 가능 — LIFE-5 (2026-05-07)
- ✅ "+ 맛 노트 추가" 버튼 (이미 N개 있어도 항상 노출) — LIFE-5 (2026-05-07)
- ✅ Recipe 카드 (D1 박힘 / D2 점선 placeholder) — LIFE-6 (2026-05-08, 본인 기록만 변경 가능)
- ✅ Recipe 카드 body tap → **R1 풀스크린 navigate** (자세히 보기) — LIFE-6 (2026-05-08)
- ✅ Recipe 카드 "변경" link → B1 dropdown selector (다른 Recipe로 교체) — LIFE-6 (2026-05-08)

### 기록 수정 시트 — `[design.pen S07, S07b]`
- 🔴 본인만 수정 가능 (작성자 권한) — 미진입

---

## 홈카페 / 멤버 / 알림

### 홈카페 설정 시트 — `[design.pen S10]`
- 🟡 홈카페 이름 변경 — pre-ticket
- 🟡 멤버 리스트 표시 — pre-ticket
- 🟡 admin-only 액션 (멤버 제거 등) — pre-ticket
- ✅ "카페 자원 → 내 레시피 관리" 진입 (Recipe = 카페 종속 자원) — LIFE-6 (2026-05-08)

### 계정 관리 — `[design.pen S11]`
- 🟡 프로필 hero (avatar 80x80) — pre-ticket
- 🟡 이메일 read-only 표시 — pre-ticket
- 🟡 회원 탈퇴 — pre-ticket

### 알림 설정 — `[design.pen S13]`
- 🟡 알림 ON/OFF — pre-ticket
- 🟡 푸시 권한 거부 fallback (Home ROP 카드 강조) — pre-ticket

---

## 초대 / 인증

### 가입 — `[design.pen S01]`
- 🟡 이메일 + 패스워드 — pre-ticket
- 🟡 자동 홈카페 생성 — pre-ticket
- 🟡 첫 원두 등록 후 와이프 합류 prompt 1회 — pre-ticket

### 로그인 — `[design.pen S17]`
- 🟡 이메일 + 패스워드 (가입과 분리) — pre-ticket (Sprint 03 design phase 신설)

### 초대 시트 — `[design.pen S14]`
- 🟡 링크 생성 (admin) — pre-ticket
- 🟡 링크 복사 / 공유 — pre-ticket

### 초대 코드 입력 — `[design.pen S15]`
- 🟡 비로그인 상태에서 초대 코드 입력 — pre-ticket (Sprint 03 design phase 신설)

### 인증 분기 — `[design.pen S12]`
- 🟡 deep link 진입 시 미인증 → 가입/로그인 분기 — pre-ticket
- 🟡 만료된 초대 처리 — pre-ticket
- 🟡 이미 수락된 초대 처리 — pre-ticket

---

## Confirm · Alert (전역)

### Confirm 다이얼로그 (3종)
- 🟡 원두 archive Confirm — pre-ticket
- 🔴 기록 삭제 Confirm — 미진입
- 🔴 멤버 제거 Confirm — 미진입

(컴포넌트: [design-system.md C1 — Variant B](./design-system.md#c1-alert-dialog-확인완료-다이얼로그))

### Success Alert (4종, 3초 자동 dismiss)
- 🟡 원두 추가/수정 성공 — pre-ticket
- 🔴 기록 추가 성공 — 미진입
- 🔴 초대 발송 성공 — 미진입
- 🔴 멤버 합류 성공 — 미진입

(컴포넌트: [design-system.md C1 — Variant A](./design-system.md#c1-alert-dialog-확인완료-다이얼로그))

---

## 백그라운드 / 자동

### ROP 알림 (cron 매일 09:00)
- ✅ 잔량 임계 도달 시 푸시 발송 — pre-ticket (MVP)
- ✅ 자동 ROP 계산 + `autoRopEnabled` fallback — pre-ticket (MVP)

### 알림 탭 → 앱 진입
- 🟡 ROP 알림 클릭 → Home + 강조 카드 — pre-ticket (Sprint 03)

---

## 공통 패턴 (자주 안 변하므로 inline ticket ref 생략)

- **가드 패턴** — `useEffect` 인증 확인, 미인증 시 redirect
- **모달 → 닫힘 → refetch** — TanStack Query `invalidateQueries`
- **Toast 패턴** — Success Alert 3초, Error는 dismiss 수동
- **에러 핸들링** — 401 → refresh 재시도 → 실패 시 logout
- **cross-user 표시** — 색·이니셜 (Feed/기록 상세 공통)
- **권한 모델** — 본인 기록만 수정·삭제 / admin-only: 멤버 초대·제거·홈카페 설정

---

## 갱신 룰

1. **ticket이 done 상태로 갈 때** screens.md 업데이트:
   - 새 기능 → 라인 추가 + ticket ref + 스크린 ID(있다면)
   - 변경 → 기존 라인 수정 + ticket ref 추가
   - 롤백 → ~~취소선~~ + 롤백 ticket ref
2. **코드 단위는 적지 않음** — "엔티티 필드", "API path", "이벤트 발화 위치" 등은 코드 SoT
3. **카테고리(✅/🟡/🔴)와 ticket ref는 함께** — 단독 X
4. **새 화면 추가 시 스크린 ID** — 다음 번호 (S18, S19...) + design.pen frame 추가
5. **pre-ticket** = Sprint 01~03 시기 작업 (ticket 시스템 도입 전)

---

## Out of Scope

- 오프라인 캐싱 / sync (홈카페 = wifi 가능 가정)
- 레시피 재사용 / 즐겨찾기 (Phase 2 트리거: 분리 시점)
- 복수 홈카페 화면 전환 (Phase 2 이연, 데이터 모델만 유지)

---

## 코드 SoT 참조

| 알고 싶은 것 | 어디 |
|--------------|------|
| 라우터 / 컴포넌트 트리 | `~/repos/byun618/home-coffing/apps/app/app/` |
| API 핸들러 | `~/repos/byun618/home-coffing/apps/api/src/` |
| 데이터 스키마 | `apps/api/src/common/entities/` |
| 디자인 토큰 | `apps/app/tailwind.config.ts` |
| 이벤트 발화 | `grep -r "track(" ~/repos/byun618/home-coffing/apps/` |

---
---

# 영역 2 — Sprint 03 Functional Spec (상세, 1109 lines, 2026-04-28 확정)

> Sprint 03 종료. v2 canonical functional spec. 메인 16 + 변형 11 + 컨펌 3 + Success Alert 4 화면의 행동·API·이벤트 상세 명세. 위 영역 1의 상세 보강.

## 0. 사용 범례

```
[진입]      어디서 들어오는지 (사용자 행동 또는 deep link)
[표시]      화면이 보여주는 데이터 (Data Model 필드 매핑)
[행동]      탭 가능한 요소 → API 호출 / 이벤트 / 다음 화면
[상태]      빈 / 로딩 / 에러 / 분기 등
[권한]      who can see / act
[이벤트]    Amplitude 이벤트 매핑 (event-taxonomy.md 기준)
```

권한 표기:
- **모든 사용자** = 인증 + 홈카페 소속
- **admin** = `CafeUser.role = admin`
- **member** = `CafeUser.role = member`
- **작성자** = Record.user = current user

## 1. 공통 패턴

### 1.1 인증 헤더

모든 보호 API 호출은 `Authorization: Bearer <accessToken>`. 만료(401) 시:
- 클라이언트가 `POST /auth/refresh` 호출 (refresh token cookie/storage)
- 성공: 새 access token으로 원 요청 재시도
- 실패: 토큰 폐기 → S17 로그인으로 강제 이동

### 1.2 에러 처리 패턴

| HTTP | 처리 |
|---|---|
| 400 | 인라인 에러 메시지 (필드 단위) |
| 401 | refresh 시도 → 실패 시 S17 |
| 403 | "권한이 없어요" 토스트 |
| 404 | "찾을 수 없어요" 페이지 또는 토스트 |
| 409 | 도메인 에러 (예: "이미 가입된 홈카페예요") — 인라인 메시지 |
| 500+ | "잠시 후 다시 시도해주세요" 토스트 |
| Network | "연결을 확인해주세요" 토스트 + 재시도 버튼 |

### 1.3 권한 분기 UI

- **admin only** 액션은 **member에겐 비노출** (disabled 아님)
- **작성자 only** 액션은 **다른 사람에겐 비노출**

### 1.4 공통 이벤트

- `app_opened` — 앱 cold/warm start 시 자동 (`is_first_open`, `cold_start`, `session_id`)
- `screen_viewed` — 화면 전환 시 자동 (`screen_name`, `previous_screen`)

### 1.5 Identify 전략

- 앱 시작 → device_id로 익명 수집
- `auth_signed_up` / `auth_signed_in` 후 → `identify(user_id)` 호출, super properties (`cafe_id`, `cafe_role`) 세팅
- `auth_signed_out` → `reset()` 호출

### 1.6 앱 시작 / 인증 상태 복원

```
앱 cold start
  → app_opened 이벤트 (cold_start: true)
  → 로컬 저장소에서 access/refresh 토큰 조회
  ├─ 토큰 없음:           → S17 로그인 (default landing)
  ├─ access 유효 + cafe_id: → S02 Home (해당 Cafe)
  ├─ access 만료 + refresh 유효: → POST /auth/refresh → 성공: S02 / 실패: 토큰 폐기 → S17
  └─ refresh도 만료/revoked: 토큰 폐기 → S17
```

- 토큰 복원 시 동시 요청 다발 방지: refresh 호출은 **싱글톤 lock** (in-flight 1건만 허용)
- 인증 후 **GET `/me`** 호출하여 최신 user + memberships 캐싱

### 1.7 Alert 자동 dismiss (Phase 1)

Success Alert 4종은 표시 후 **2초 자동 dismiss** + 사용자 [확인] 탭 시 즉시 dismiss. Confirm Dialog는 자동 dismiss 없음.

### 1.8 PATCH semantics

- 모든 PATCH 엔드포인트는 **partial update** (요청 body에 명시된 필드만 갱신)
- 서버는 `changed_fields = Object.keys(body)` 로 이벤트 property 산출

## 2. 화면별 행동 명세

### S01 가입 / S17 로그인 / S12 인증 분기 / S15 초대 코드

화면 본질 + API + 이벤트:

- **S01 가입**: `POST /auth/signup` → 응답 `{accessToken, refreshToken, user}` + Cafe auto-create + CafeUser(admin). 이벤트 `auth_signed_up`+`cafe_created`. 실패 409 email_taken / 400 weak_password.
- **S17 로그인**: `POST /auth/login` → 성공 시 User에 defaultCafe 있으면 S02, 없으면 S12. 실패 401 인라인.
- **S12 인증 분기**: [홈카페 만들기]→S02 / [초대 받기]→S15
- **S15 초대 코드**: `POST /invitations/{code}/accept` → CafeUser(member) 생성. 실패 404/410 → S15b 변형.

### S02 Home (탭)

[진입] 앱 시작 / S17 / S15 / S12 / 모든 뒤로

[표시] 헤더 "내 홈카페 ⌄" + 🔔 / "원두" 가로 스크롤 카드 / "최근 기록" 최근 3개 / FAB ☕ / Tab Bar

[행동]
- [🔔] → S13 (0건이면 S13b)
- [+ 원두] → S04 (mode=create)
- 원두 카드 → S03 (`bean_viewed`)
- 최근 기록 row → S06 (본인) / S06c (다른 사람) (`record_viewed` 04~)
- FAB ☕ → S05

[상태] 빈(S02b): Bean 0 → "첫 원두 등록하기" CTA / 로딩 스켈레톤 / 에러

### S08 Feed (탭)

[표시] 헤더 / "우리집 기록 · 이번 주 N잔 함께" / 필터 칩 (전체/멤버별) / 날짜 그룹 / 카드 (avatar+name+시간/-Xg/메모/원두 chip)

[행동] 카드→S06/S06c / 필터 클라이언트 / FAB→S05

[상태] 빈(S08b): "첫 한 잔 기록하기" → S05

### S09 더보기 (탭)

[표시] 프로필 카드 / 홈카페 카드 + ⚙ / 설정 list (알림/계정관리/피드백) / "홈 커핑 v0.3.0"

[행동] ⚙→S10 / 계정관리→S11 / 알림설정→토스트 "준비 중이에요" / 피드백→external

### S03 원두 상세 (+ S03b ROP 임박)

[표시] 잔량 카드 + 진행 바 + "약 N잔 · ~M일" / 원두 정보 2열 grid / "이 원두 기록 (N)" + 날짜 그룹

[행동] ⋯ 메뉴:
- [수정]→S04 (mode=edit)
- [다 썼어요]→`PATCH /beans/{id} { finishedAt: now, finishedReason: 'consumed' }` (`bean_finished`)
- [버렸어요]→ `finishedReason: 'discarded'`
- [보관함으로]→`{ archivedAt: now }` (`bean_archived`)

[상태] S03b: autoRop ≤ ROP 임계 → 빨강 강조 + [다음 원두 주문하기] CTA

### S04 / S04b 원두 추가/수정 (시트)

[진입] S02 [+ 원두] / S02b CTA / S03 [수정]

**모드:** `create | edit` — 헤더 텍스트, prefill, API 분기

[표시] handle / 헤더 / 이름·전체 용량·주문/로스팅/배송일·디개싱 일수·하루 잔수·1잔 용량

[행동] [저장]:
- create: `POST /cafes/{cafeId}/beans` (`bean_added { bean_id, total_grams, ordered_on, roasted_on, lead_time_days }`)
- edit: `PATCH /beans/{id} { ...changedFields }` (`bean_updated`)

[상태] S04b: 모든 필드 placeholder, CTA muted. 필수(이름·용량·주문일·로스팅일) 채워야 enabled.

### S05 / S05b 빠른 기록 (시트)

[진입] FAB ☕ (활성 원두 ≥1) — 활성 0이면 토스트 "원두를 먼저 등록해주세요" + [+ 원두 등록]

[표시] 원두 chip (default: 1개면 자동, ≥2면 미선택) / [+ 원두 추가 (블렌딩)] / 사용량 (36px 숫자) / 기록 시각 toggle / 메모 / 맛 노트 chips

[행동] [기록 저장]: `POST /cafes/{cafeId}/records`
- request `{ beans: [{beanId, grams},...], totalGrams, brewedAt, memo?, tasteNote? }`
- 서버 트랜잭션: Record + RecordBean 생성 → Bean.remainGrams 차감
- **음수 차단:** `remainGrams < 0` → 400 `INSUFFICIENT_BEAN` → 인라인 "잔량이 부족해요 (남은 양: Xg)"
- `remainGrams == 0` 정확히 → 자동 `finishedAt`, `finishedReason='consumed'` → `bean_finished`
- 이벤트 (04~): `record_created`

[상태] S05b: 원두 미선택 / 0g / 메모 placeholder / 맛 노트 0 / CTA disabled

### S06 / S06b / S06c 기록 상세

**라우팅:** `GET /records/{id}` 호출 후 클라가 `record.user.id == currentUser.id` 비교 → 일치 시 S06, 불일치 시 S06c

- **S06** (본인): ⋯ 메뉴 [수정]→S07 / [삭제]→S16c→DELETE
- **S06b** (블렌딩): 원두 카드 자리에 "에티오피아 + 콜롬비아 디카페인 · 총 30g" + bullet list
- **S06c** (다른 사람): ⋯ 메뉴 없음, read-only

### S07 / S07b 기록 수정 (시트)

S05 동일 폼 + 차이: 헤더 "기록 수정" / 모든 prefill / CTA Row [삭제 (danger outline)] + [저장 (Primary)]

[행동] [저장]: `PATCH /records/{id}` (`record_updated`) / [삭제]: S16c→`DELETE /records/{id}` (`record_deleted`)

### S10 홈카페 설정 (시트)

[표시] 홈카페 이름 input / "멤버 (N/2)" 헤더 + [+ 초대] (admin only) + 멤버 list / "위험 영역" [홈카페 떠나기]

[행동]
- 이름 변경 (admin only) → `PATCH /cafes/{id} { name }`
- [+ 초대] (admin) → `POST /cafes/{id}/invitations` → S14
- [홈카페 떠나기] → S16b → `DELETE /cafes/{id}/members/me`
  - 성공 (`cafe_left`) → 다른 Cafe / 없으면 S12 인증 분기
  - 실패 (마지막 admin + 다른 멤버 ≥1) → 차단 모달 "다른 호스트로 권한을 이전한 후"

### S14 초대 시트

[표시] 코드 카드 (espresso bg, "BREW-XXXX" 32px letterSpacing 4, "7일 후 만료") / [📋 코드 복사] / [🔗 링크 공유]

[행동]
- 복사 → 클립보드 + 토스트
- 공유 → OS Share Sheet (Phase 1 텍스트 / Phase 2 deep link)

[데이터] `Invitation.code` (UUID v4, UI 표기 `BREW-XXXX`), `expiresAt = createdAt + 7일` (D3)

### S11 / S11b 계정 관리

- [수정] (닉네임) → S11b sheet → `PATCH /me { displayName }`
- [로그아웃] → `POST /auth/logout` (서버: RefreshToken revoke + DeviceToken hard delete) → 토큰 폐기 + reset() → S17
- [회원 탈퇴] → S16a → `DELETE /me` (마지막 admin 보호) → reset() → S01

### S13 / S13b 알림

[표시] 시간 그룹 (오늘/이번 주) / [모두 읽음] / 알림 카드 (icon + 메시지 + 시간 + read dot)

**Notification type 스키마:**

| type | icon | 메시지 템플릿 | 탭 시 이동 |
|---|---|---|---|
| `rop_alert` | bell ($accent) | "{bean.name}이 곧 떨어져요" | S03 |
| `record_added` | coffee ($member-{role}) | "{member}님이 새 기록을 남겼어요" + memo | S06 / S06c |
| `bean_added` | coffee ($accent-light) | "{member}님이 새 원두를 등록했어요" | S03 |
| `cafe_joined` | check-circle ($success) | "{member}님이 초대를 수락했어요" | S10 |
| `bean_finished` (Phase 2) | coffee-off | "{bean.name} 다 마셨어요" | S03 |

[행동] [모두 읽음] → `PATCH /notifications/mark-all-read` / 카드 탭 → `PATCH /notifications/{id}/read` + `notification_opened` 이벤트 + 이동

### S16a / S16b / S16c 컨펌 다이얼로그 / Success Alert

- **S16a 회원 탈퇴**: 빨강 ⚠ / "내 기록이 모두 사라져요" / [취소] + [탈퇴]
- **S16b 홈카페 떠나기**: "내 기록은 유지되지만 멤버에서 빠져요" / [취소] + [떠나기]
- **S16c 기록 삭제**: "완전히 사라지며 되돌릴 수 없어요" / [취소] + [삭제]

**Success Alert 4종** (✓ 올리브 + #E8F0E0 bg circle): 등록/저장/수정/삭제 완료. 2초 자동 dismiss + [확인] 즉시 dismiss + dismiss 후 진입 화면 refetch

## 3. API 인벤토리

### Auth

| Method | Path | 설명 |
|---|---|---|
| POST | `/auth/signup` | 가입 + Cafe auto-create + tokens |
| POST | `/auth/login` | 로그인 + tokens |
| POST | `/auth/refresh` | refresh → access 재발급 |
| POST | `/auth/logout` | refresh 토큰 revoke |

### User

| Method | Path | 설명 |
|---|---|---|
| GET | `/me` | 본인 정보 (User + memberships) |
| PATCH | `/me` | displayName / defaultCafe 수정 |
| DELETE | `/me` | 회원 탈퇴 (마지막 admin 검증) |

### Cafe

| Method | Path | 설명 |
|---|---|---|
| POST | `/cafes` | 홈카페 생성 — Phase 2 |
| GET | `/cafes/{id}` | Cafe + 멤버 목록 |
| PATCH | `/cafes/{id}` | name 수정 (admin only) |
| DELETE | `/cafes/{id}/members/me` | 본인 떠나기 |
| POST | `/cafes/{id}/invitations` | 초대 코드 발급 (admin only) |

### Invitation / Bean / Record / Notification / Device

| Method | Path | 설명 |
|---|---|---|
| POST | `/invitations/{code}/accept` | 초대 수락 |
| GET | `/cafes/{id}/beans` | 활성 원두 list |
| POST | `/cafes/{id}/beans` | 원두 등록 |
| GET | `/beans/{id}` | 상세 + ROP + 기록 list |
| PATCH | `/beans/{id}` | 정보 수정 / finishedAt / archivedAt |
| GET | `/cafes/{id}/records?limit=N&before=...` | 기록 timeline |
| GET | `/cafes/{id}/records?bean={beanId}` | 원두별 |
| POST | `/cafes/{id}/records` | 기록 생성 (RecordBean 트랜잭션) |
| GET | `/records/{id}` | 상세 |
| PATCH | `/records/{id}` | 수정 |
| DELETE | `/records/{id}` | 삭제 (작성자 only) |
| GET | `/notifications` | 본인 알림 list |
| PATCH | `/notifications/{id}/read` | 단일 read |
| PATCH | `/notifications/mark-all-read` | 전체 read |
| POST | `/me/devices` | FCM 토큰 등록/갱신 |
| DELETE | `/me/devices/{id}` | 토큰 폐기 |

## 4. 이벤트 매핑 매트릭스

| 화면 | 이벤트 (sprint 03 활성) | 비고 (04~) |
|---|---|---|
| 모든 화면 | `app_opened`, `screen_viewed` | super properties: cafe_id, cafe_role, platform, app_version |
| S01 | `auth_signed_up`, `auth_signup_failed` | — |
| S17 | `auth_signed_in`, `auth_signin_failed` | — |
| S15 | `cafe_joined` | — |
| S02 | `bean_viewed` | `record_viewed` (04~) |
| S08 | — | `record_viewed` (04~) |
| S03 | `bean_viewed`, `bean_finished` / `bean_archived` | `record_viewed` (04~) |
| S04 | `bean_added`, `bean_updated` | — |
| S05 | — | `record_created` (04~) |
| S06/b/c | — | `record_viewed`, `record_updated` / `record_deleted` (04~) |
| S07 | — | `record_updated` / `record_deleted` (04~) |
| S10 | `cafe_invited`, `cafe_left` | — |
| S11 | `auth_signed_out` | (탈퇴는 `auth_signed_out`로 대체) |
| S13 | `notification_opened` | — |
| 시스템 | `notification_sent` | — |

## 5. 권한 매트릭스

| 액션 | 비인증 | member | admin | 작성자 |
|---|---|---|---|---|
| 가입 / 로그인 | ✅ | — | — | — |
| Cafe 보기 | — | ✅ (자기 cafe) | ✅ | — |
| Bean CRUD / finish / archive | — | ✅ | ✅ | — |
| Record 생성 | — | ✅ | ✅ | — |
| Record 수정 / 삭제 | — | — | — | ✅ (본인) |
| Cafe.name 수정 | — | — | ✅ | — |
| Cafe 초대 발급 | — | — | ✅ | — |
| Cafe 떠나기 (본인) | — | ✅ | ✅ (마지막 admin 보호) | — |
| 회원 탈퇴 | — | ✅ | ✅ (마지막 admin 보호) | — |

## 6. Sprint 03 구현 범위 (vs 04~)

| 항목 | 03 구현 | 04~ |
|---|---|---|
| Auth (가입/로그인/refresh/로그아웃) | ✅ | — |
| Cafe / CafeUser / Invitation | ✅ | — |
| Bean CRUD + ROP autoCalc | ✅ | — |
| Record CRUD + RecordBean | 스키마/API ✅ / UX 일부 (S05만) | S06/S07/S08 풀 UX (04) |
| Recipe / TasteNote 입력 UX | — | 04~ |
| Notification (DeviceToken / FCM / S13) | ✅ | — |
| Amplitude `auth_*`, `cafe_*`, `bean_*`, `notification_*`, `app_*`, `screen_viewed` | ✅ | — |
| Amplitude `record_*` | — (스키마만) | 04 |
| 복수 Cafe 전환 | — | Phase 2 |
| Picker UI | — (네이티브 입력으로 대체) | Phase 2 |

## 7. Open Questions (sprint 03)

1. **S05 default 원두 선택** — Phase 1: 활성 1개 자동, ≥2 미선택. 04 데이터 보고 조정
2. **S04 ⋯ menu UX** — Phase 1 네이티브 ActionSheet stub
3. **S10 멤버 row ⋯ menu** — Phase 2
4. **S13 알림 권한 prompt** — 가입 직후 1회 / 거부 시 안내 배너
5. **S05 Bean 부족** — `INSUFFICIENT_BEAN` 정책, Phase 2 "강제 0g 차감" 옵션
6. **변경사항 보호 confirm modal** — Sheet dirty form, Phase 2

---
---

# 영역 3 — LIFE-6 mockup delta (Recipe wizard)

> 004 ticket — Recipe wizard 4-step + R1 상세 + PS1 푸어 단계 sub-sheet + F1 장비 sub-flow. 자유 텍스트(notes) 추가.

## 캔버스 layout (overview)

```
INVENTORY:
  y=0    Row 1 (h=720): A1   A2                          빠른 기록 (chip 채워짐/빈)
  y=800  Row 2 (h=920): B1   E1   G1                     Recipe selector + 관리 + 홈카페 설정
  y=1800 Row 3 (h=640): F1   F1b                          장비 sub-flow (selector + 등록 form)
  y=2520 Row 4 (h=640): D1   D2                          기록 상세

STORYBOARDS + PS1 SUB-FLOW:
  y=3160-3920  J1 신규 등록 (7 frames, 6 arrows) — 4-step
  y=3960-4660  PS1 sub-flow (W3-B의 stage tap 결과) — PS1 main + 4 단계 예시
  y=4760-5280  J2 Recipe 변경
  y=5800-6480  J3 E1 진입
  y=6840-7440  J4 장비 추가

R1 RECIPE 상세 + 수정/복제/삭제 sub-screens (J4 아래):
  y=7480-8460  4 frames horizontal at x=0/420/840/1260
    R1 (`I7mi2`)        — base, footer 3-button [수정][복제][삭제]
    R1-edit (`KRblT`)   — [수정] tap → wizard 편집 prefilled
    R1-clone (`KiRyB`)  — [복제] tap → wizard clone, name "사본" suffix
    R1-delete (`gy11n`) — [삭제] tap → R1 + dim + confirm dialog
```

## 인벤토리 frame

### A1 빠른 기록 (Recipe chip 채워짐) — `Zlahn`

**진입**: 홈 FAB ☕ tap (직전 사용 Recipe 있는 경우)

**구조** (위→아래):
1. drag handle
2. header: "빠른 기록" 타이틀 + ⋯ 메뉴
3. 원두 section: label + 원두 카드 + "+ 원두 추가 (블렌딩)" CTA
4. 사용량 section: g 입력 (default 18g 또는 직전 값)
5. 기록 시각: "지금" / "시간 지정" 토글
6. **레시피 section** (옵셔널): chip (아이콘 + 이름 + summary "21g · 1:9 · 90°C · 2'20\"" + chevron-right)
7. CTA: "기록 저장"

**인터랙션**: chip tap → B1 상태 전환 (inline dropdown 펼침). 저장 → recipe FK 포함 record 생성 → S06 (D1) navigate

### A2 빠른 기록 (Recipe chip 빈) — `Zh2uH`

A1과 동일 + 레시피 section만: 점선 placeholder "+ 레시피 추가"

**인터랙션**: placeholder tap → **곧장 wizard W1 진입** (dropdown 거치지 않음). 저장 → `recipe: null` 로 record (nullable)

### B1 빠른 기록 + Recipe dropdown 펼침 — `A6J0kL`

**상태**: A1의 chip이 inline expanded

**구조**: A1 그대로 + 레시피 chip 영역 dropdown panel 확장:
- panel: bg-secondary, radius-xl, drop shadow
- Recipe 카드 list (선택된 항목 dark + check) / divider / "⚙ 내 레시피 관리" link / "+ 새 레시피" link (accent, bold)

**인터랙션**: 카드 tap → chip 갱신 + collapse / "관리" → E1 navigate / "+ 새 레시피" → wizard W1 / 외부 tap → collapse

**데이터**: `GET /cafes/:cafeId/recipes` (정렬: lastUsedAt desc)

### E1 내 레시피 관리 — `h29jD`

**진입**: B1 dropdown / G1 홈카페 설정 resSec

**스크린 타입**: 풀스크린 navigation (sheet 아님)

**구조**:
1. header: ← back + "내 레시피" + "+ 새 레시피" pill (top-right, accent)
2. subtitle: "{N}개 레시피 · 카드 탭하면 자세히"
3. Recipe 카드 list — 카드: 이름 + method 배지 + summary + "기구 N개 · M회 사용" + chevron-right
4. hint footer: "💡 자세한 정보·수정·복제·삭제는 카드 탭"

**인터랙션** (★ R7 변경): 카드 tap → **R1 풀스크린 navigate** (기존 wizard 직접 진입에서 변경)

### R1 Recipe 상세 — `I7mi2`

**진입**: E1 카드 tap / D1 Recipe 카드 tap

**스크린 타입**: 풀스크린 navigation

**구조**:
1. header: ← back + 이름 ("내 모닝 V60") + ⋯
2. meta row: method chip + "{N}회 사용 · 1:{ratio}"
3. **셋업**: grid 6 cells (원두/분쇄도/물 온도 + 모드/총 추출량/총 시간)
4. **푸어 단계**: stage list (W3-B 동일 styling, read-only — 라벨 / center 누적+시점 2-line / 우측 cream badge "+pourGrams")
5. **장비**: equipment list (icon + type · name)
6. footer: 3-button **[수정] [복제] [삭제]**

#### R1 sub-screens

| sub-screen | Frame | trigger | 결과 |
|---|---|---|---|
| **R1-edit** | `KRblT` | [수정] tap | wizard 편집 모드 — cream banner "수정 모드 — 동일 Recipe에 변경사항 저장" + W2-B prefilled |
| **R1-clone** | `KiRyB` | [복제] tap | wizard 복제 모드 — cream banner "복제 모드 — 새 Recipe로 저장 (이름: 내 모닝 V60 사본)" |
| **R1-delete** | `gy11n` | [삭제] tap | R1 + dim + center confirm "이 레시피를 삭제할까요? 24개 record 사용 중..." [취소] [삭제] |

**API**: 수정 `PATCH /cafes/:cafeId/recipes/:id`, 복제 `POST` + name suffix "(사본)", 삭제 `DELETE` + record.recipe FK nullable

### G1 홈카페 설정 — `w3kh6m`

**진입**: 홈/메뉴 → "내 카페" / "설정"

**구조**: header / g1hero (카페 이름 + summary) / infoSec (기본 정보) / **resSec (★ LIFE-6 신규)**: 카페 자원 — *"내 레시피 관리" → E1* / memSec (멤버)

### Wizard 4-step (Option B)

**캔버스**: y=7680 row — `KR6pU` (W2-B 셋업) / `HCSHL` (W3-B 푸어) / `tcjvN` (W4-B 마무리). W1은 J1 storyboard `Kooj9`.

#### W1 방식 — `J1.2 Kooj9`

**구조**:
- step indicator (4 dots, 1st active)
- title: "어떤 방식으로 내려요?"
- method 카드: **Pour-over** (active) / Espresso·French Press·Aeropress (disabled, "곧 출시")
- footer: "다음 →"

**데이터**: `Recipe.method = 'pour-over'` 임시 상태

#### W2-B 셋업 — `KR6pU`

**구조**:
- title: "셋업 한 번에"
- subtitle: "원두 · 분쇄도 · 물 온도 · 모드 · 추출량 · 시간"
- row 1 (3 cells): **원두 양** ("21g") + **분쇄도** ("22 클릭") + **물 온도** ("90°C")
- mode toggle: ☀ Hot / ❄ Iced
- row 2 (3 cells): **총 추출량** ("200g") + **총 시간** ("2'20\"") + 얼음 cell (iced 모드)
- footer: ← prev / "다음 →"

**데이터 매핑** (`PourOverParams`):
- 원두 양 → `params.doseGrams: number`
- 분쇄도 → `params.grindSize: number` (★ R5 — 숫자만)
- 물 온도 → `params.waterTempC: number`
- mode → `params.serveMode: 'hot' | 'iced'`
- 얼음 → `params.iceGrams?: number` (iced)
- 총 추출량 → `params.totalYieldGrams: number` (target)
- 총 시간 → `params.totalTimeSec: number` (target)

> **목표값 vs stages 값**: W2-B의 totalYield/totalTime은 *recipe target*. W3-B stages는 *target 달성 breakdown*. target과 정확 일치는 의무 X.

> ratio = totalYieldGrams / doseGrams (display만)

#### W3-B 푸어 단계 — `HCSHL`

**구조**:
- title: "어떻게 부어요?"
- **summary card** (top, dark accent): 총 추출량 (sum of pourGrams) · 총 시간 (last stage startSec)
- stage 카드 list — 좌→우 4 컬럼 (★ 2026-05-08 R6 — 누적 중앙 / 증분 우측 강조):
  1. 라벨 chip (뜸 / 1차 / 2차 + sub-label "bloom"/"circle ↻")
  2. **center 2-line**: "{cumulative}g" (누적 큰글씨 dark) + "{startSec}" (시간 작은글씨)
  3. **우측 증분 stat badge** (`$accent-cream` bg, `$accent` text) — "+{pourGrams}"
  4. chevron-right
- "+ 단계 추가" 점선 CTA
- footer: ← prev / "다음 →"

**인터랙션**: stage 카드 tap → PS1 편집 sheet / "+ 단계 추가" → PS1 신규 sheet (empty)

**데이터** (Hybrid):
- `params.stages: PourStage[]` — startSec asc 정렬
- `PourStage`: `{ label, startSec, pourGrams, pourStyle?, direction?, notes? }`
- 누적 stat badge = `stages.slice(0, idx+1).reduce((s, x) => s + x.pourGrams, 0)`
- summary card = W2-B 입력값 (totalYieldGrams / totalTimeSec) — stages.reduce 아님

#### W4-B 마무리 — `tcjvN`

**구조**:
- title: "마무리"
- subtitle: "장비는 선택사항. 이름 안 적으면 자동으로 채워줘요."
- 장비 (선택) section: label + "+ 추가" right + RecipeEquipment 카드 list
- 이름 (선택) input: placeholder = `{method} {grindSize} {ratio} {temp}°C`
- footer: ← prev / "저장" CTA

**인터랙션**: "+ 추가" → F1 (장비 시트) / 카드 tap → 제거 confirm / 저장 → API POST Recipe + RecipeEquipment[] + chip 갱신

**데이터 저장**: `POST /cafes/:cafeId/recipes` body `{ method, params, name?, equipmentIds: number[] }`

### PS1 푸어 단계 입력 sheet — `y2ChKK`

**핵심 멘탈 모델 (Hybrid)** ★ 채택:
- **시간 = 절대 시작 시간** (레시피 카드 표기 그대로 — "0:45에 시작")
- **물량 = delta** (이번 단계에서 +Xg 부음)
- 푸어 스타일 / 방향 = **선택사항**

**구조**:
- drag handle
- header: ← back + ✕
- **라벨** input (자유 텍스트, 예: "뜸"·"1차"·"2차"·"마무리")
- **시점 (시작 시간)** — single cell, 절대 시간 ("0:45")
- **이번에 부은 양 (g)** — single cell, delta ("60g")
- **푸어 스타일 (선택)** chip grid (7 enum):
  - center / circle-out / circle-in / spiral / pulse / continuous / bloom-only
- **방향 (선택)** toggle (cw / ccw) — circle 계열만 의미
- **메모 (선택)** input — 자유 텍스트 (스위치 열기/닫기, 흔들기, 포트에 상온수 추가 등 hybrid brewer 동작)
- footer: 🗑 삭제 link + 저장 CTA

**데이터 매핑** (`PourStage`): label / startSec / pourGrams / pourStyle? / direction? / notes?

> **Schema 변경**: 002 누적 4-tuple → 1차 delta 2-tuple → **확정 hybrid** (time absolute, water delta)

**검증**: 라벨 필수 / startSec ≥ 0, pourGrams > 0 / stages startSec asc 정렬 / 총 추출량 = sum pourGrams / 총 시간 = last stage startSec

### 단계별 입력 예시

mockup.pen y=8400 row — PS1 main 옆 가로 4 frames. 사용자 발화 레시피:

| 위치 | Frame | 라벨 | 시점 | 부은 양 (delta) | 누적 |
|---|---|---|---|---|---|
| x=0 | `y2ChKK` (PS1 main) | 1차 | 0:45 | +60g | — |
| x=420 | `w2lGVo` | 뜸 | 0:00 | +25g | 25g |
| x=840 | `i7N6cF` | 1단계 | 0:45 | +35g | 60g |
| x=1260 | `k2tMuq` | 2단계 | 1:30 | +30g | 90g |
| x=1680 | `uh149` | 3단계 | 2:15 | +30g | 120g |

### F1 장비 선택 시트 — `Wr1xP`

**구조**: handle / header "장비 추가" + ✕ / type filter pills (전체/그라인더/드리퍼/케틀/저울) / Equipment 카드 list (icon + name + brand·model) / "+ 새 장비 등록" 점선 CTA

**인터랙션**: 필터 tap / 카드 tap → W4-B 복귀 + RecipeEquipment 추가 / "+ 새 장비 등록" → F1b

**데이터**: `GET /equipments?type=…`

### F1b 새 장비 등록 form — `L6rJdU`

**구조**: header ← back + "새 장비 등록" + ✕ / 종류 chip row (그라인더/드리퍼/케틀/저울) / 이름 [필수] / 브랜드 (선택) / 모델 (선택) / hint "💡 등록한 장비는 다른 사용자도 선택 가능" / "등록" CTA

**데이터**: `POST /equipments` body `{ type, name, brand?, model? }` — `source: USER` 자동 set

### D1 / D2 기록 상세

**D1 — Recipe 박힘** `S7llC`:
1. header: ← + "기록 상세" + ⋯
2. member info row: avatar + 이름 + 시각
3. 원두 카드
4. **Recipe 카드** (NEW for 004): dark accent fill / 이름 + method 배지 + summary / "변경 →" link
5. 맛 노트 section (003 그대로)

**인터랙션** (★ R7 변경): Recipe **카드 body tap** → **R1 풀스크린 navigate** / "변경" link → B1 dropdown

**D2 — Recipe 없음** `Zrmal`: D1과 동일 + Recipe 자리 점선 placeholder "+ 레시피 추가" → B1 selector

## Storyboard (user journeys)

### J1 신규 등록 (Option B 4-step)

**확정 flow** (7 frames + 6 arrows):
A2 → W1 → W2-B → W3-B → W4-B → A1' (chip 갱신) → D1

**arrow 트리거**:
1. A2 chip placeholder tap → W1 ("+ 레시피 추가")
2. W1 방식 선택 + 다음 → W2-B
3. W2-B 셋업 + 다음 → W3-B
4. W3-B 푸어 + 다음 → W4-B
5. W4-B 장비/이름 + 저장 → A1' ("저장")
6. A1' "기록 저장" → D1

### J2 Recipe 변경

A1 → tap chip → B1 (펼침) → 카드 선택 → A1' (갱신) → 저장 → D1

### J3 E1 진입 (관리)

A1 → tap chip → B1 → "내 레시피 관리" → E1 풀스크린

### J4 장비 추가 sub-flow

W4-B → "+ 장비 추가" → F1 (sheet) → 카드 선택 → W4-B' (장비 추가됨)

> F1 → "+ 새 장비 등록" → F1b → 등록 → F1 (list 갱신 + 자동 선택) sub-sub-flow는 별도 storyboard 없음, dev-plan에서 명시.

## 데이터 모델 요약 (LIFE-6)

```ts
Recipe {
  id, cafe FK, name?, method (enum),
  params: BrewingParams,
  source, createdBy, createdAt,
  recipeEquipments: RecipeEquipment[]
}

RecipeEquipment {
  id, recipe FK, equipment FK   // setting JSON 제거
}

Equipment {  // 글로벌 catalog
  id, type, name, brand?, model?, source, createdBy
}

PourOverParams {
  method: 'pour-over',
  doseGrams,
  grindSize: string,
  waterTempC: number,
  serveMode: 'hot' | 'iced',
  iceGrams?: number,
  totalYieldGrams, totalTimeSec,
  stages: PourStage[],
  notes?
}

PourStage {
  label: string,
  startSec: number,            // 절대 시작 시점
  pourGrams: number,           // 이 단계 delta
  pourStyle?: PourStyle,
  direction?: 'cw' | 'ccw',
  notes?: string
}
```

## LIFE-6 Open / TODO

- W4-B → F1 → F1b → F1 → W4-B sub-sub-flow storyboard 미작성
- vupNk (W3iced) 폐기 — Option B에 흡수, 잉여
- Equipment 카드 type prefix 일관 점검 — `{type} · {name}` (W4-B / F1 / D1)

---
---

# 영역 4 — LIFE-7 mockup delta (Bean catalog)

> 005 ticket — Bean catalog selector (seed-only) + F2 picker (hit/miss) + B-add-bag (catalog selector chip) + 블렌딩 pill. "기타" Bean 폐기, freeName 폐기.

> **시나리오 Y″** (2026-05-11 후 + "기타" 폐기 재정리). seed-only catalog, free text 없음, 블렌딩 pill.

## Frame inventory

| 코드 | 이름 | 역할 |
|---|---|---|
| **C1** | 빠른 기록 (Bean chip 채워짐) | 정상 상태. catalog 선택됨. 블렌딩 pill 포함. |
| **C2** | 빠른 기록 (Bean chip 빈) | entry. CTA "원두 선택" + 블렌딩 pill (disabled tone) |
| **C3** | 기록 + Bean dropdown 펼침 | chip tap 시 즉시 펼침. 최근 catalog list + "전체 검색" + 블렌딩 pill |
| **F2** | 원두 선택 picker (hit) | 풀스크린 검색. catalog list만. register CTA 없음. |
| **F2-miss** | 원두 선택 picker (검색 0건) | 결과 없음 안내 + "검색어 바꿔보기" CTA. *등록 path 없음* |
| **B-add-bag** | 카페에 본 봉지 등록 (바텀시트) | 이름 input → catalog selector chip 교체. 나머지는 spec 그대로. empty / filled variants. |

> **폐기**: F2b register · "기타" Bean · CafeBean.freeName · F2의 "기타" row · J2의 freeName section.

## 화면별 명세

### C1 — 빠른 기록 (Bean chip 채워짐)

**진입**: 최근 선택한 원두 또는 활성 본 봉지 prefill

**구조** (위→아래):
- Header: title "빠른 기록", overflow "···"
- Section "원두":
  - Bean chip (filled, accent bg) — icon · 원두명 · subtext · chevron-down
  - **"+ 원두 추가 (블렌딩)" pill** (bg-secondary, full width) — 002 RecordBean 1:N
- Section 사용량 (003)
- Section 레시피 (004)
- 저장 btn

**인터랙션**: chip tap → C3 (펼침) / 블렌딩 pill tap → 두 번째 chip 추가 (multi-bean) / 저장 → record 생성

### C2 — 빠른 기록 (Bean chip 빈)

**진입**: 첫 진입 + 활성 본 봉지 없음

**구조**: Header / empty chip ("+ 원두 선택") / **블렌딩 pill (disabled tone)** / 나머지 / 저장 btn (disabled)

### C3 — Bean dropdown 펼침

**구조**:
- Header, chip (filled, chevron-up)
- Dropdown list (chip 아래):
  - "최근 사용한 원두"
  - 최근 catalog row × 3
  - CTA row: "전체 검색 →"
- **"+ 원두 추가 (블렌딩)" pill** (dropdown 아래)

**인터랙션**: row tap → C1 갱신 / "전체 검색" → F2 / chevron-up → 닫힘

### F2 — 원두 선택 picker (hit)

**진입**: C3 "전체 검색" 또는 B-add-bag empty chip tap

**구조**: Header ← back + "원두 선택" / 검색 input / Catalog list (Bean 전체, source=SEED) — row: icon + 원두명 + (type/process subline)

**인터랙션**: 검색어 → filter (substring) / row tap → 호출자 복귀 + chip 갱신

### F2-miss — picker (검색 0건)

**구조**: Header / 검색 input (검색어 채워짐) / empty state: search-x icon + "검색 결과 없음" + "다른 검색어로 시도해보세요" / *CTA 없음*

**인터랙션**: 검색 input 변경으로만 복귀. catalog 미매칭은 silent dead-end.

**노트**: 운영자가 DB seed 추가로 해결. → 후속 OCR ticket에서 사용자 등록 path 도입.

### B-add-bag — 카페에 본 봉지 등록 (바텀시트, spec g1eO2 기반)

**진입**: 홈/잔량 화면의 "원두 추가" CTA

**스크린 타입**: bottom sheet

**구조**:
- Handle bar
- Header: title "원두 추가" + ✕
- Form:
  - **원두 (catalog selector)** — chip empty CTA "+ 원두 선택" 또는 filled
  - 전체 용량 (g)
  - 주문일·로스팅일·배송일 (3 column dates)
  - 디개싱 일수 (+ "일")
  - 하루 평균 잔수 (+ "잔") · 1잔 용량 (+ "g") (2 column)
- ctaArea: 저장 btn (chip filled + 필수 채워짐 → 활성)

**인터랙션**: 원두 chip tap → F2 picker → row 선택 → B-add-bag 복귀 / 저장 → `POST /cafe-beans`

**검증**: bean 필수 (catalog FK NOT NULL) / 전체 용량 > 0 / 디개싱 ≥ 0 / 날짜 미래 X

**변경 사항** vs spec g1eO2: 이름 input (자유 텍스트) → **catalog selector chip**

## Storyboard

### J1 — Catalog hit (기록 작성 흐름)

`C2 빈` → *chip tap* → `C3 dropdown` → *row 선택* → `C1 채워짐`

### J2 — 카페 본 봉지 등록 (catalog 선택 흐름)

`B-add-bag (chip 빈)` → *chip tap* → `F2 picker` → *row 선택* → `B-add-bag (chip 채워짐)` → *총량/날짜 → 등록*

미매칭 시: F2-miss → 검색어 변경 또는 운영자 seed 추가까지 대기.

## 데이터 매핑

| UI 필드 | DB |
|---|---|
| C3 dropdown 최근 list | `Bean` join `RecordBean.cafeBean.bean` orderBy `recordedAt desc` distinct |
| F2 catalog list | `Bean` (전체 source=SEED) orderBy `name asc` |
| F2 검색 | `Bean.name` substring |
| B-add-bag 원두 chip | `CafeBean.bean` FK (NOT NULL) |
| B-add-bag 총량 | `CafeBean.totalGrams` |
| 등록자 추적 | `CafeBean.createdBy` |

## LIFE-7 Open / TODO

- Bean.tastingNote 컬럼 형태 — JSON 또는 별 테이블
- Seed script 형식 — 002 Equipment seed 패턴 (`apps/api/src/scripts/seed-beans.ts`). 원두반점 30종
- 블렌딩 multi-bean state mockup — 004 검증된 패턴이라 별도 frame 생략
- catalog 미매칭 시 사용자→운영자 알림 채널 — 후속 (피드백 ticket)
- 라벨 이미지 OCR/Vision — 후속 ticket (가치 ↑↑)

## 데이터 모델 요약 (LIFE-7)

- `Bean` (글로벌 catalog):
  - `name` unique text
  - `type` enum: `single` / `blend` / `decaf`
  - `process` enum (nullable)
  - `tastingNote` (nullable, tag list)
  - `source` enum: `SEED`
  - `createdBy` nullable
- `CafeBean`:
  - `bean` **NOT NULL**
  - `freeName`: *없음*
  - 나머지 002 그대로
- "기타" Bean: 없음

---
---

# 영역 5 — LIFE-14 mockup delta (Blend / 사용자 등록)

> 012 ticket — Bean type enum 폐기 (→ isDecaf attribute), 블렌드 CafeBean 책임, BeanRegisterSheet 신설 (사용자 등록 + 유사도 prompt), BlendComponentPickerSheet 신설.

> **재사용 출처**: LIFE-7 `Qb89f`/`FUU3e` (B-add-bag sheet 패턴), `jJE5h` (F2 picker), spec `mlXSq` S04 sheet 골격.

## 데이터 모델 영향 (요약)

기획 수준 자연어. 컬럼 type·precision·nullable·index 같은 schema detail은 *dev에서 결정* + 코드 ground truth.

- **Bean 카탈로그** = single + decaf만. **`BeanType` enum 폐기 → 디카페인은 attribute(flag)**로.
- **CafeBean이 블렌드 표현 책임**을 가짐 — 싱글 Bean 참조 *또는* 컴포넌트 set 보유 (블렌드 instance). 블렌드일 땐 카탈로그 row 없음.
- **블렌드 컴포넌트 = 신규 N:M 관계** (블렌드 instance ↔ 싱글 Bean). 선택적 비율 정보.
- **블렌드 식별 = derived 매칭** — 동일 컴포넌트 set이면 "같은 블렌드". 별도 카탈로그 테이블 X.
- **상품명(display)** optional — 로스터리 마케팅 이름. 식별엔 안 쓰임.
- **Bean.name 자유 텍스트 unique** 유지 — 사용자가 직접 등록 가능 (LIFE-7 seed-only 뒤집기). source 속성에 user 추가.

## Frame 명세

### F2 picker — 미매칭 → "새로 등록" CTA (inventory `EhF2o`)

**구조**: header(← 원두 검색) / search input / 검색 결과 list 또는 empty state (검색 결과 0) + register CTA card (accent)

**인터랙션**:
- 결과 row tap → 선택 + caller 복귀 (LIFE-7 그대로)
- **register CTA tap → BeanRegisterSheet 호출** (검색어 prefill, caller context 유지)

**검증**: 검색어 trim 후 비어 있지 않을 때만 CTA 활성

### B-add-bag (블렌드 토글 ON, 컴포넌트 채워짐) — inventory `iVNPs`

**구조**: hc / head / **typeToggle(싱글 / 블렌드 pill segmented)** / form: blendName? + components section (count + 편집 + rows + addPill) + 전체 용량 + 로스팅/받은 + 디개싱 + 하루 잔수·잔당 / saveBtn

**인터랙션**:
- typeToggle: 싱글 ↔ 블렌드 즉시 form morph (기존 입력값 캐싱, 복원)
- components section:
  - "원두 추가" pill tap → BlendComponentPickerSheet 호출
  - 채워진 row tap → ratio inline edit
  - "편집" 라벨 → BlendComponentPickerSheet 재진입 (preserve)
  - row ratio "40%" — 미입력 시 "—"

**데이터**:
- 토글 ON = 블렌드 → blendName + components, 싱글 Bean 참조 X
- 토글 OFF = 싱글 → Bean 참조, components 없음

**검증**:
- 블렌드: 컴포넌트 ≥1 필수
- 싱글: Bean 필수
- blendName: optional
- ratio: optional / *모두 입력 시*만 합 100% 검증
- 블렌드 mode에서 isDecaf 토글 안 보임 — 컴포넌트 중 디카페인 있으면 derived

### BeanRegisterSheet (싱글 사용자 등록 + 유사도 prompt) — inventory `Rga8R` / Story 3 variant `sz3Xy`

**진입**: F2 picker register CTA / BlendComponentPickerSheet 미매칭 CTA

**구조**: hc / head(원두 등록 ✕) / form:
- name input (caller 검색어 prefill)
- **유사도 후보 prompt area** (조건부) — 후보 있을 때: accent-cream box + 후보 row + "혹시 같은 원두 아닌가요?" / 후보 없을 때 (sz3Xy): info box "비슷한 원두가 없어요. 새로 등록할게요"
- 디카페인 toggle (off default)
- 가공 (선택) — process pill grid (washed/natural/honey/anaerobic)
- 맛 노트 (선택) — chip 입력

**인터랙션**:
- **후보 row tap** → 기존 Bean 선택으로 종료 (신규 등록 안 함)
- **새 원두로 등록 (CTA)** → 신규 Bean 생성 → caller에 전달
- 이름 변경 시 유사도 후보 *실시간 갱신* (debounce — dev)

**데이터**: 입력값 → Bean 카탈로그 신규 row (source=user, createdBy=현재 사용자)

**유사도 후보 UX**: 후보 N개 중 top-3까지 표시 (4개 이상 잘라냄). *알고리즘·threshold dev에서 결정·튜닝* (Open).

### BlendComponentPickerSheet (싱글 다중 선택 + ratio) — inventory `D2E6y8` / Story 1 variant `FrasP`

**진입**: B-add-bag (블렌드 mode) "원두 추가" pill / "편집"

**구조**: hc / head(블렌드 구성 ✕) / **selected section**: count + 합 100% badge (조건부) + 선택된 row (accent-cream box, name + ratio numeric input + ✕) / search input / candidate list (싱글 Bean catalog, "+ tap" 추가) / **missCTA**: dashed "찾는 원두가 없다면 직접 등록" / saveCTA: "선택 완료 (N)"

**인터랙션**:
- candidate row "+" → 선택 push (ratio 미입력)
- selected row ratio input → numeric (빈 = ratio 없음)
- selected row ✕ → 제거
- 검색 — 카탈로그 이름. 디카페인 컴포넌트 허용
- missCTA → BeanRegisterSheet (caller=BlendComponentPicker, 등록 후 자동 push)

**합 100% 표시 룰**:
- 모두 입력 AND 합 = 100% → "합 100%" badge accent (저장 OK)
- 모두 입력 AND 합 ≠ 100% → "합 {sum}%" badge warning
- 일부 빈 → badge 미표시 (검증 X)

**검증**: 선택 N ≥ 1 (mockup엔 N≥2 가정) / ratio: optional, 모두 입력 시 합 100% 강제 / 같은 Bean 중복 막기

## User Flow

각 storyboard = *Entry → 종착* 단위. arrow 3요소 (trigger / 상태 변화 / 다음 frame) 표.

### Story 1 — 본인 새 블렌드 등록

**Entry**: S02 Home `[+ 원두]` FAB → **종착**: Alert "원두 등록 완료" → S02 복귀

| 단계 | frame | trigger | 상태 변화 | 다음 |
|---|---|---|---|---|
| (생략) | B-add-bag 빈 (싱글 default) | FAB tap | sheet 열림 | B-add-bag 빈 |
| (생략) | B-add-bag 블렌드 토글 ON, 컴포넌트 0 | typeToggle '블렌드' tap | form morph | BlendComponentPicker 진입 가능 |
| S1.1 | BlendComponentPicker (선택 0) `FrasP` | "원두 추가" pill tap | picker 열림 | candidate list 노출 |
| S1.2 | BlendComponentPicker (선택 3) `D2E6y8` | candidate "+" 3회 + ratio 입력 (선택) | 누적, 합 100% badge | "선택 완료" 가능 |
| S1.3 | B-add-bag (블렌드, 채워짐) `iVNPs` | "선택 완료 (3)" tap | components 반환 | 저장 가능 |
| (생략) | Alert → S02 | "저장" tap | 신규 CafeBean(블렌드) 생성 | S02 |

### Story 2 — 미매칭 싱글 (유사도 hit → 기존 매칭)

**Entry**: B-add-bag 싱글 chip tap → F2 picker → 미매칭 검색어 → **종착**: B-add-bag 싱글 chip이 *기존* Bean으로 채워짐

| 단계 | frame | trigger | 상태 변화 | 다음 |
|---|---|---|---|---|
| S2.1 | F2 picker 미매칭 `EhF2o` | 결과 0건 | 검색어 캐싱, register CTA 활성 | CTA 가능 |
| S2.2 | BeanRegisterSheet 유사도 prompt `Rga8R` | register CTA tap | sheet 열림, 유사도 후보 ≥1 | 후보 row tap 가능 |
| (생략) | B-add-bag chip 채워짐 (기존 Bean) | 후보 row tap | 기존 Bean 선택 종료, sheet+picker 양쪽 dismiss | (계속 등록) |

### Story 3 — 미매칭 싱글 (유사도 miss → 신규 생성)

**Entry**: B-add-bag 싱글 chip tap → F2 picker → 미매칭 → **종착**: 신규 Bean row 생성 + B-add-bag chip이 신규 Bean으로 채워짐

| 단계 | frame | trigger | 상태 변화 | 다음 |
|---|---|---|---|---|
| S3.1 | F2 picker 미매칭 `EhF2o` | 결과 0건 | register CTA 활성 | CTA 가능 |
| S3.2 | BeanRegisterSheet 유사도 0 `sz3Xy` | register CTA tap | sheet 열림, 후보 0건, info "비슷한 원두 없음" | "새 원두로 등록" 가능 |
| (생략) | B-add-bag chip 채워짐 (신규) | "새 원두로 등록" tap | 신규 Bean (source=user), sheet+picker dismiss | (계속 등록) |

### Entry point inventory

- **Story 1 Entry**: S02 Home `[+ 원두]` FAB
- **Story 2/3 Entry**: B-add-bag (S04) 싱글 chip tap → F2 picker → 미매칭 검색어. Story 2와 3은 같은 Entry에서 *유사도 결과*에 따라 분기.

분기 시각화: Story 2/3은 F2 picker 미매칭에서 *Y-branching* — BeanRegisterSheet 변형 2개 (유사도 prompt vs 0)로 가지.

## LIFE-14 Open / TODO

- 유사도 검출 알고리즘 — 선택(substring / 편집거리 / 토큰 유사도) + threshold + 후보 cap. 운영하며 튜닝
- 블렌드 컴포넌트 N=1 허용 여부 — 현재 N ≥ 2 가정
- operator merge tool — mockup OOS. dev에서 minimal admin route + manual SQL
- isDecaf 명명 — 컬럼·필드 명명 confirm (dev)
- 블렌드 카탈로그 검색 edge case — 사용자가 *블렌드* 검색 시도 시 hint 검토
- debounce 시간 — 유사도 후보 실시간 갱신 적정값 (dev)

## 정합성 (LIFE-7 결정 부분 뒤집기)

| LIFE-7 결정 | LIFE-14에서 | 이유 |
|---|---|---|
| `BeanType` 3-way enum | 폐기, `isDecaf` flag로 | BLEND row 사라짐, decaf는 attribute로 충분 |
| F2-miss silent dead-end | "새로 등록" CTA | 사용자 등록 허용 결정 |
| Bean catalog seed-only 운영자만 | 사용자 등록 허용 | 운영 부담 분산 |
| `Bean.name` 자유 텍스트 unique | **유지** | 의식적 trade-off — 블렌드 매칭은 컴포넌트 기준 best-effort |
| C1/C2/C3 빠른 기록 블렌딩 pill | **변경 없음** | 빠른 기록은 *기존 CafeBean 사용*, 등록 흐름 아님 |
