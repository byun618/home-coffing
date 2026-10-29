---
name: dto-sync
description: "home-coffing packages/shared-types에 DTO 추가/수정/제거 시 사용. API↔App 경계의 단일 진실원. 트리거: 'shared-types에 추가', 'DTO 정의', 'request/response 타입', 'API↔App 타입 동기화', 'enum 공유'. 코드 빌드(api/app) 변경은 entity-module / app-screen으로 분리."
---

# dto-sync — shared-types 단일 진실원

types-keeper가 사용. `packages/shared-types`(`@home-coffing/shared-types`)만 수정.

## 디렉토리

```
packages/shared-types/
├── src/
│   ├── index.ts             # 명시적 export 루트
│   ├── {entity}.ts          # entity별 DTO 그룹
│   └── enums.ts             # 공유 enum
└── package.json
```

명시적 export 사용. wildcard re-export 지양 (`export *` 금지). 변경 추적이 어려워짐.

## DTO 네이밍

- `{Entity}Response` — GET 응답 단일 객체
- `{Entity}ListItem` — 목록 응답 요소 (Response보다 필드 적어도 됨)
- `Create{Entity}Request`, `Update{Entity}Request` — body
- `{Entity}Detail` — detail 화면 전용 (Response + relations)

요청/응답 형태 우선. entity 1:1 매핑보다 **호출처에 맞춘 DTO**.

## 규칙

- **타입만 export.** class/function/상수도 제외 (zero-runtime).
- enum은 여기 단일 정의 → API entity와 App이 모두 import. API entity 안에 enum 중복 정의 금지.
- nullable / optional 명확히 (`field: string | null` vs `field?: string`).
- date는 `string` (ISO). API가 ISO 직렬화, App이 필요 시 `new Date()`. shared-types에 `Date` 타입 두지 마라.
- discriminated union 적극 활용. `as` / 과도한 제네릭 금지.

## 단계

1. 변경 대상 DTO 결정 (planner plan + 빌더 요청).
2. `src/{entity}.ts` 수정 또는 새 파일.
3. `src/index.ts`에 export 추가.
4. **사용처 grep** — 기존 DTO의 breaking change(필드 제거, 타입 변경, optional → required)는 영향 보고 후 진행:
   ```bash
   grep -rn "{TypeName}" apps/api/src apps/app/src
   ```
5. 변경 요약을 `issues/LIFE-N/types-changes.md`에 기록.
6. 양 빌더에게 SendMessage "DTO 잠금 완료" 알림.

## 충돌 처리

같은 이름 DTO를 양쪽 빌더가 다른 shape으로 요청 → 작업 중단, 사용자에게 의사결정 요청. 임의 병합 X.

## 트리거 금지

- API endpoint 로직 변경 → `entity-module`
- App 화면 / hook 변경 → `app-screen`
- 단순 import 정리, 리네임 (전체 grep + replace는 별도 작업)
