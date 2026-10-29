---
name: entity-module
description: "home-coffing apps/api(NestJS+MikroORM)에 entity 추가/수정 또는 새 도메인 모듈 생성 시 사용. 트리거: 'entity 추가/수정', 'API에 {도메인} 모듈 만들어줘', 'MikroORM entity', 'NestJS controller/service 추가', 'apps/api에 endpoint 추가'. apps/app 화면이나 shared-types만 건드릴 때는 트리거 X."
---

# entity-module — NestJS 모듈 패턴

api-builder가 사용. apps/api의 모든 도메인 모듈은 이 패턴을 따른다.

## 모듈 구조

```
apps/api/src/{name}/
├── {name}.controller.ts   # HTTP 진입, Guards, request DTO validation
├── {name}.service.ts      # 순수 비즈니스 로직, EntityManager 주입
├── {name}.module.ts       # @Module — MikroOrmModule.forFeature + controller/service
└── dto.ts                 # class-validator DTO + Response 인터페이스
```

entity는 모듈 디렉토리 X, **`apps/api/src/common/entities/{name}.entity.ts`**에 따로 둔다.

## 책임 분리

| 파일 | 들어가는 것 | 들어가면 안 되는 것 |
|---|---|---|
| controller | `@Get/@Post/@Patch/@Delete`, Guards, request DTO validation, service 호출, response 반환 | DB 쿼리, 비즈니스 로직, entity 직접 응답 (Response DTO로 변환 필요) |
| service | EntityManager 주입, transaction, 도메인 규칙. Guard가 세팅한 `req.user`는 인자로 받음 | `@Body/@Param`, HTTP 응답 |
| dto.ts | request DTO (class-validator), Response 인터페이스 | 비즈니스 로직, DB 접근 |
| module | imports / controllers / providers 선언 | 로직 |

## 단계

1. **Entity 생성/수정** — `apps/api/src/common/entities/{name}.entity.ts`. enum은 `common/entities/enums.ts` 재사용.
2. **`common/entities/index.ts`에 export 추가** — barrel 일관성 유지.
3. **Request DTO 정의** — `dto.ts`에 class-validator 데코레이터. Response 인터페이스는 **`@home-coffing/shared-types`의 타입과 매칭** (types-keeper와 협의).
4. **Service 작성** — `EntityManager` 주입. 권한 분기(admin/member)는 service 인자(`role`)로 받아 처리.
5. **Controller 작성** — endpoint 정의. `JwtAuthGuard` 등으로 인증, admin-only는 Guard로 명시. Response는 dto.ts의 Response 인터페이스 shape으로 반환.
6. **Module 작성 + `app.module.ts`에 import 추가** — `MikroOrmModule.forFeature([Entity])` 포함.
7. **Schema 영향 확인** — `pnpm schema:update --dump-sql` (실행 X, SQL만 확인). 파괴적이면 plan에 명시.

## 코드 컨벤션

- `as` 단언 기피. 타입 narrowing이 필요하면 discriminated union + switch.
- 함수 파라미터 2개 이상 → 단일 객체 (NestJS 데코레이터 제약 영역은 예외).
- SQL/QB에서 테이블 alias 축약 금지 — 풀네임.
- 수정 범위 최소화 — 무관한 파일·함수는 건드리지 X.

## DTO 단일 진실원

Response/공유 타입은 **`@home-coffing/shared-types`에서만** 정의. controller에 임시 interface 두지 마라. 필요 시 types-keeper에게 SendMessage.

## 이벤트 발화 (백엔드 측)

API에서 백엔드 이벤트 발화가 필요하면 `spec/event-taxonomy.md` 매핑을 따른다. 신규 이벤트는 plan에 명시되어 있어야 함.

## 트리거 금지

- packages/shared-types만 수정하는 경우 → `dto-sync` 사용
- apps/app 화면만 수정 → `app-screen` 사용
- 모듈 패턴이 아닌 임시 스크립트·마이그레이션 수동 작성
