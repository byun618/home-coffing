# API Stack — apps/api

> NestJS 11 + MikroORM v6 + MySQL 8. api-engineer가 작업 시 참고.

## 모듈 구조 표준

```
apps/api/src/{module}/
├── {module}.module.ts      # @Module
├── {module}.controller.ts  # 라우팅 + Guards
├── {module}.service.ts     # 비즈니스 로직
└── dto.ts                  # DTO + Response
```

엔티티는 **공통**: `apps/api/src/common/entities/`. 모듈은 `MikroOrmModule.forFeature([...])`로 등록만.

### bean.module.ts 표준 형태

```typescript
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Bean, CafeUser, RecordBean, Roaster } from '../common/entities';
import { BeanController } from './bean.controller';
import { BeanService } from './bean.service';

@Module({
  imports: [MikroOrmModule.forFeature([Bean, CafeUser, Roaster, RecordBean])],
  controllers: [BeanController],
  providers: [BeanService],
  exports: [BeanService],
})
export class BeanModule {}
```

### Service 표준 형태

```typescript
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Bean, CafeUser } from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';

@Injectable()
export class BeanService {
  constructor(private readonly em: EntityManager) {}

  async listActiveBeans(cafeId: number): Promise<BeanResponse[]> {
    const beans = await this.em.find(
      Bean,
      { cafe: cafeId, archivedAt: null, finishedAt: null },
      { populate: ['roaster'], orderBy: { createdAt: 'DESC' } },
    );
    return Promise.all(beans.map((bean) => this.toResponse(bean)));
  }

  private async toResponse(bean: Bean): Promise<BeanResponse> {
    return { id: bean.id, name: bean.name, /* ... */ };
  }
}
```

## DTO 컨벤션

- DTO는 **클래스 + class-validator 데코레이터**
- Response는 **인터페이스** (DTO 아님). Service의 `toResponse(entity)` 메서드에서 매핑
- 날짜는 `@IsDate() @Type(() => Date)`
- 옵셔널은 `@IsOptional()` 명시
- 클라이언트와 공유 필요한 Response 타입은 `packages/shared-types`로 export

## Guards

`apps/api/src/common/guards/`:
- `JwtAuthGuard` — 모든 보호 API 진입점, `req.user` 세팅
- `AdminGuard` — `CafeUser.role = admin` 검증
- `AuthorAuthGuard` — Record 작성자 검증

컨트롤러에서:
```typescript
@UseGuards(JwtAuthGuard)
@Post('beans')
async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBeanDto) { ... }
```

## 에러 처리

`apps/api/src/common/exceptions/api-error.exception.ts`의 `Errors` enum + `ApiError` 클래스. 새 도메인 에러는 enum에 추가.

```typescript
throw new ApiError(Errors.BEAN_DUPLICATE_BY_NAME_AND_ROASTED_AT);
```

## 스키마 변경

- 엔티티 변경 후: 컨테이너 시작 시 `pnpm schema:update` 자동 실행 (Dockerfile CMD)
- 로컬: `pnpm schema:update` 직접
- **파괴적 변경(컬럼 drop)**은 데이터 손실 가능. dev-plan에 명시 안 된 변경은 사용자 보고

## MikroORM v6 고정

- `^6` 핀: `apps/api/package.json`
- v7은 데코레이터 export breaking change → import 에러
- 올릴 때는 v7 stable + 공식 마이그레이션 가이드 후

## 환경 변수

- 루트 `.env` 한 파일. `apps/api/.env` 따로 두면 로드 X
- MikroORM config는 `../../../.env` 참조
- 신규 env는 `.env.example`에도 추가

## SQL alias 금지

raw query·QueryBuilder 작성 시 테이블 풀네임. `b`, `r` 같은 단축 금지.

## 데이터 모델 SoT

- **코드(ORM 엔티티)가 SoT.** spec/엔 데이터 모델 카탈로그 없음 (옛 spec/data-model.md는 폐기)
- 결정 사유는 호출 ticket 안에 누적 — `tickets/NNN/ticket.md` 또는 `design.md`
- shared-types를 통해 클라이언트와 공유

## 변상현 개인 코드 스타일

- `as` 단언 기피 — discriminated union + switch narrowing
- 파라미터 2개 이상이면 단일 객체 (데코레이터 등 기술 제약 예외)
- 수정 범위 최소화
- Guard와 Service 관심사 분리 (Guard: request 추출, Service: 순수 로직)
- 불필요한 추상화 지양 (3번째 등장은 OK, 첫 등장에 추상화 X)
