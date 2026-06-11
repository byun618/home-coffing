---
name: boundary-qa
description: "home-coffing API↔App 경계면 교차 검증. 빌더 완료마다 점진 실행. 트리거: 'QA 실행', '경계면 검증', 'API 응답 ↔ 훅 비교', 'shared-types 사용처 확인', 'schema:update 영향', 'feature 빌드 검증', '재검증', '이전 QA 다시', '이벤트 매핑 점검', '권한 분기 확인'. 단위 테스트 작성·E2E는 X."
---

# boundary-qa — 경계면 교차 검증

qa 에이전트가 사용. **존재 확인이 아니라 교차 비교**가 본질.

## 검증 매트릭스

각 변경 endpoint마다 4개 위치를 동시에 읽고 비교:

| # | 위치 | 확인 |
|---|---|---|
| 1 | `apps/api/src/{module}/{module}.controller.ts` | route, Guards, request DTO, response 타입 |
| 2 | `apps/api/src/{module}/{module}.service.ts` | response 실제 필드 (entity → Response 변환) |
| 3 | `packages/shared-types/src/{entity}.ts` | DTO 선언 |
| 4 | `apps/app/src/lib/api/{entity}.ts` + 사용 hook/화면 | App 기대 shape |

## 경계면 버그 패턴 (체크리스트)

- [ ] service가 누락한 필드 → App이 기대 (undefined runtime)
- [ ] nullable 필드 → App이 non-null로 처리 (`response.x.y` 안전성)
- [ ] enum 케이스 불일치 (`'active'` vs `'ACTIVE'`)
- [ ] date 직렬화: API `string` (ISO) ↔ App `Date` 가정
- [ ] 새 nullable 컬럼이 기존 row에 영향 (schema:update 시)
- [ ] archived/soft-delete 필터링이 빠진 list endpoint
- [ ] admin only API에 member가 도달 가능한 UI 경로 남아있음

## 추가 점검 영역

- **이벤트 매핑**: `spec/event-taxonomy.md`의 이벤트 정의가 실제 Amplitude wrapper 호출과 일치하는지. wrapper 우회 직접 호출 없는지.
- **디자인 톤 정합**: `spec/design-system.md` 톤·원칙 위반 여부. 새 컴포넌트가 기존 카탈로그와 모순 없는지.
- **design.pen 매핑**: 변경 화면이 `spec/design.pen` S## frame과 매핑되는지 (Pencil MCP로 visual 확인 — 레이아웃·구성 정합성만).
- **권한 분기 UI**: admin only 액션 비노출, 작성자 only 액션 비노출.
- **운영 가드레일**: `docs/operations.md` 절대 금지 항목 위반 여부.

## 단계

### 1. 입력 로딩
`issues/LIFE-N/{api,app,types}-changes.md` 3개 동시 읽기. 하나라도 없으면 해당 빌더에게 요청 후 대기.

### 2. Endpoint별 비교
변경된 endpoint마다 위 매트릭스 4 위치를 grep + Read. 필드 단위 표로 정리.

### 3. shared-types 사용처 확인
DTO 변경 시:
```bash
grep -rn "{TypeName}" apps/api/src apps/app/src
```
import 경로가 일관되게 `@home-coffing/shared-types`인지 확인.

### 4. 이벤트 매핑 확인
`spec/event-taxonomy.md`의 신규/변경 이벤트가 `apps/app` 코드에서 발화되는지 grep:
```bash
grep -rn "{event_name}" apps/app/src
```

### 5. 권한 분기 + 디자인 톤
- admin only API의 클라이언트 사용처가 권한 분기 처리되는지
- 새 컴포넌트가 `spec/design-system.md` 카탈로그 톤과 모순 없는지

### 6. 빌드 검증 (최종 1회)
사용자 승인 후:
```bash
pnpm --filter @home-coffing/api build
pnpm --filter @home-coffing/api test
pnpm --filter @home-coffing/app exec tsc --noEmit
```

매 모듈마다 실행 X. 모든 변경 종료 후 1회.

### 7. Schema 영향
entity 변경 있을 시 `pnpm schema:update --dump-sql`로 SQL 검토 (실행 X). 파괴적이면 Critical.

### 8. 보고서 작성
`issues/LIFE-N/qa.md` 생성. Critical / Major / Minor 분리.

## 우선순위 라벨링

| 라벨 | 의미 |
|---|---|
| **Critical** | 데이터 손실·보안·인증 흐름 깨짐, 운영 가드레일 위반, 빌드 실패, breaking schema |
| **Major** | shape 불일치 (필드 누락/타입 차이), 기능이 dev-plan/analysis와 어긋남, 권한 분기 누락 |
| **Minor** | 권장 리팩터, 톤·네이밍 일관성 |

## 재호출

이전 `qa.md`가 있으면:
- Critical/Major 이슈 목록만 다시 검증
- 통과 항목은 재확인 생략 (변경 영역 grep으로 영향 없음 확인)

## 트리거 금지

- E2E / Playwright
- 코드 리뷰 (스타일·리뷰 코멘트) — `review` 스킬이 별도 담당
