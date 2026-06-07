# Design System

> 토큰(색·타이포·간격·라운딩) 사전은 여기 X. **`apps/app/tailwind.config.ts`가 SoT.**
> 여기엔 **톤·원칙·워딩 가이드 + 컴포넌트 카탈로그** 통합.
>
> 컴포넌트 visual: [design.pen](./design.pen) (screen frames + component frames)

## 현재 토큰

```
~/repos/byun618/home-coffing/apps/app/tailwind.config.ts
```

`$accent`, `$bg-primary`, `$bg-secondary`, `$text-primary`, `$radius-pill`, `$radius-xl` 등 변수 정의는 코드에. 본 문서는 **변수명**으로만 컴포넌트 spec 기술.

---

## 1. 디자인 톤

- **미니멀 + 고급 + 토스 스타일**
- 화려한 일러스트 X / 간결한 타이포 + 절제된 색 ✅
- 그림자 X — 배경색 대비로 카드 분리

### 컬러 의도
- 따뜻한 베이지 배경 (홈카페 원두 톤)
- 다크 브라운 액센트 (커피)

### 폰트
- **Pretendard** — 한글 가독성 + 모던

---

## 2. 핵심 디자인 원칙

### 1. 입력 부담 최소
- 빠른 기록 = 3 step 이내
- recipe·tasteNote 영역은 default collapsed

### 2. Calm technology
- 평소 존재감 없음 → ROP 시점에만 알림
- 화면 진입 시 깜빡임 없는 skeleton

### 3. 잔량 가시화 ≠ 다이어리
- 잔량은 **도구 신호**, 다이어리는 **자산**. 두 시각 균형 (Home에 둘 다 노출)

### 4. cross-user 시각화는 색·이니셜
- 텍스트 라벨 X — 시각으로 즉각 구분

---

## 3. 워딩 톤

- **친근하지만 군더더기 X** — 토스 스타일
- 한국어 자연스럽게 — "원두 다 마셨어요"가 "원두 소진됨"보다 좋음
- 에러: 사용자 잘못이라고 말하지 않음 — "다시 시도해주세요"
- 숫자: 단위 명시 ("250g" / "25잔" / "8일")

---

# 컴포넌트 카탈로그

> [design.pen](./design.pen)에 visual frame 존재. 본 문서는 spec(props·variants·사용처).

## C1. Alert Dialog (확인/완료 다이얼로그)

centered modal · `$bg-overlay` 배경 · 318w 카드 · `$radius-2xl`

### Variant A — Success Alert (✓ + 단일 확인 버튼)
- 56x56 round, `$E8F0E0` (success-pale), lucide check
- title 17/700 / subtitle 13 lineHeight 1.5
- single button 50h, `$success` fill, `$text-on-dark` 15/700

**사용 인스턴스:** Alert 등록 완료, Alert 기록 저장/수정/삭제 완료

**Props:** `title`, `subtitle`, `onConfirm`

### Variant B — Confirm Alert (⚠ + 취소·확정 dual 버튼)
- 56x56 round, `$bg-secondary`, ⚠ in `$danger`
- dual 버튼 50h pill, gap 8 — 좌(취소): `$bg-secondary` `$text-primary` 15/600 / 우(확정): `$danger` `$text-on-dark` 15/700

**사용 인스턴스:** 회원 탈퇴, 기록 삭제, 멤버 제거

**Props:** `title`, `subtitle`, `cancelText`, `confirmText`, `onCancel`, `onConfirm`, `variant?: 'danger' | 'default'`

---

## C2. Bottom Sheet (모달 시트)

화면 하단에서 올라오는 시트 모달.

- 시트: `$bg-primary`, `$radius-sheet` 상단만, padding `[14, 0, 44, 0]`, gap 18
- Wrapper: 390w/844h frame, `$bg-overlay`, justifyContent end
- Handle bar: 36w x 4h, `$bg-tertiary`, radius 2
- Header: title 18/700 + close icon ✕

**구조:** Handle → Header → Form slot (padding [0, 24], gap 18-20) → CTA area (padding [8, 24, 0, 24]) → 44px breathing

**사용 인스턴스:** 원두 추가/수정 (S04/S04b), 빠른 기록 (S05/S05b), 기록 수정 (S07/S07b), 홈카페 설정 (S10), 초대 시트 (S14)

---

## C3. CTA Button (5 variants)

공통: 56h, `$radius-pill`, layout horizontal, justifyContent center

| Variant | Fill | Text | Weight | 사용 |
|---|---|---|---|---|
| Primary | `$accent` | `$text-on-dark` | 700 | 기록 저장 / 가입하기 |
| Secondary | `$bg-secondary` | `$text-primary` | 600 | 컨펌의 취소 |
| Danger | `$danger` | `$text-on-dark` | 700 | 컨펌의 탈퇴/삭제 |
| Disabled | `$bg-tertiary` | `$text-tertiary` | 500 | 폼 비어있을 때 |
| Success | `$success` | `$text-on-dark` | 700 | 완료 Alert 확인 |

추가:
- **Outline**: stroke 1 `$accent-light`, fill transparent (단계 추가 점선)
- **Pill chip**: `[8, 16]` padding, height auto, 11-13px — filter chip / member chip

---

## C4. Input Field

`$bg-secondary` · `$radius-lg` (14) · 56h · padding `[0, 18]`

- A. **Text input** — 14/normal `$text-primary` (placeholder `$text-tertiary`)
- B. **Number with unit** — 큰 숫자 좌측 + 단위 우측, justifyContent space_between
- C. **Password** — `••••••••` text, monospace
- D. **Disabled / Read-only** — `$bg-tertiary` fill + 🔒 icon right (예: 이메일)

**라벨 wrap:** v-stack gap 6 또는 8, 라벨 13/600 `$text-secondary`, "(선택)" suffix 옵션

---

## C5. Tab Bar (Pill)

3 tab · `$accent` 배경 · `$radius-pill` · 62h · 절대 위치 (24, 756) · 342w

- **Active**: `$text-on-dark`, 700, icon `$text-on-dark`
- **Inactive**: `$accent-cream` (흐린), 500, icon `$accent-cream`

**Icon (lucide):** 홈 `house` / 피드 `rss` / 더보기 `menu`

**Props:** `activeTab: 'home' | 'feed' | 'menu'`

---

## C6. FAB (Floating Action)

60x60 원형 · 절대 위치 (306, 680) on Home/Feed

- `$accent` fill
- shadow: outer, blur 16, offset (0, 6), color `#3A241940`
- icon: lucide `coffee`, 28x28, white

**사용 인스턴스:** S02 Home, S08 Feed

---

## C7. Member Avatar

원형 colored badge with letter

| 사이즈 | 폰트 | 사용처 |
|---|---|---|
| 24x24 | 11/700 | 기록 상세 헤더 |
| 28x28 | 11/600 | S03 기록 리스트 |
| 32x32 | 12/600 | S02 최근기록 / S08 Feed |
| 40x40 | 14/700 | S13 알림 / S10 멤버 리스트 |
| 56x56 | 22/700 | S09 더보기 프로필 |
| 80x80 | 32/700 | S11 계정 hero |

**Color:**
- K (본인): `$member-self` (#3A2419)
- S (와이프): `$member-wife` (#8B6F5C)

**Props:** `letter`, `size`, `member: 'self' | 'wife'`

---

## C8. Bean Card (단일 원두)

기록 상세에서 사용된 원두 표시. horizontal · `$bg-secondary` · `$radius-xl` (16) · padding 18 · gap 14

- icon (☕ 32x32 `$accent`) + 원두명 15/600
- meta: 사용량 13/600 `$accent` · 잔량 13 `$text-secondary`

**Variant — 블렌딩**: 동일 카드 2개 연속, 상단 라벨 "에티오피아 + 콜롬비아 · 총 30g" 13/700 `$accent`

---

## C9. Bean Card (Home grid)

Home 원두 잔량 카드 — 200x150 grid

- `$bg-secondary` (여유) 또는 `$accent` (ROP 임박, 강조)
- `$radius-xl` (20), padding 18, gap 6
- 원두명 12 · 잔량 32/700 · meta (▓▓▓░░░ progress bar + "X잔 · ~Y일")

---

## C10. Record Card (Feed)

S08 Feed의 기록 카드. `$bg-secondary` · `$radius-xl` · padding 18 · gap 12

- 헤더 row: avatar + name + time / 사용량 우측 강조
- 메모 텍스트 15/500 (한 줄 메모 = 타이틀)
- bean chip: `$bg-primary` · `$radius-md` · padding `[10, 14]` · ☕ icon + 원두명

---

## C11. Setting Row (리스트 행)

S09/S11/S10 등 설정. horizontal · `$radius-xl` · padding `[16, 18]` · justifyContent space_between

- 좌: icon (lucide) + 라벨 15/500
- 우: › chevron 18 `$text-tertiary`
- 행 사이 1px `$divider` rectangle

---

## C12. Taste Note Row (기록 상세 맛 노트 list 행) — LIFE-5

S06 기록 상세의 맛 노트 list row. `$bg-secondary` · `$radius-xl` · padding 16 · gap 12 · horizontal

- 좌: MemberAvatar 32 (cross-user variant — `self`/`wife`)
- 본문 column (gap 1.5):
  - row: author 이름 13/600 + " · " + 상대 시각 12 `$text-tertiary`
  - 별점 row (rating > 0일 때만): 0.5 단위 별 5개 14px (Star + StarHalf 오버레이) + 점수 텍스트 "4.5" 12/500
  - 메모: 14/400 leading-5 (있을 때만)
- 우: ✎ Pencil 16 `$text-tertiary` (본인이 작성한 노트만)

## C13. Taste Note Sheet (S05c — 맛 노트 입력 시트) — LIFE-5

C2 BottomSheet 변형. title "맛 노트 추가" / "맛 노트 수정"

- 별점 picker: `$bg-secondary` · `$radius` 14 · padding-vertical 16 · 별 5개(32px) · 좌/우 절반 탭으로 0.5/1.0 단위. outline + filled 오버레이
  - 라벨 row 우측 "별점 지우기" link 12/500 underline `$text-tertiary` (rating > 0일 때만)
- 메모 TextField (multiline, 200자, "맛, 향, 다음에 시도할 점을 적어보세요")
- update 모드만: "맛 노트 삭제" link 13/500 `$danger` self-center
- 저장 PrimaryButton: rating·memo 둘 다 비어있으면 disabled
- dirty close: ConfirmDialog ("변경사항이 사라져요" / "작성 중인 내용을 닫을까요?")

## C14. Empty CTA Card (약한 진입 유도 카드) — LIFE-5

빈 상태에서 "X 추가하기" 약한 진입 동선. S06의 맛 노트 빈 상태가 첫 사용처. 기존 강한 PrimaryButton과 구분되는 "톤 낮은 invitation".

- `$bg-secondary` · 1px dashed `$divider` border · `$radius-xl` · padding-vertical 28 · items-center · gap 6
- icon 20 `$text-secondary` (Plus / Coffee 등 컨텍스트별)
- 메인 카피 14/500 `$text-secondary`
- 보조 카피 12/400 `$text-tertiary` (의도/타이밍 힌트, 한 줄)
- active:opacity-80

---

## 갱신 룰

1. **토큰**: tailwind config에 먼저 (코드 SoT). 본 문서엔 변수명만 사용.
2. **새 컴포넌트**: 본 문서에 추가 (Cn) + design.pen에 frame 추가 + 코드 컴포넌트 작성 (3 동기)
3. **컴포넌트 변경**: ticket의 design.md에 변경분 정리 → ticket done 시 본 문서 갱신
4. **사용처(`사용 인스턴스`)**: screens.md의 화면 ID 참조 (S01, S02, ...)
