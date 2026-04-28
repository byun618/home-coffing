import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { CafeUser } from '../entities';
import { JwtPayload } from '../decorators/current-user.decorator';

/**
 * URL `:cafeId` 파라미터 기준으로 현재 user의 멤버십을 검증.
 * request.cafeMembership에 CafeUser 인스턴스를 주입한다.
 */
@Injectable()
export class CafeMemberGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{
        user?: JwtPayload;
        params: Record<string, string>;
        cafeMembership?: CafeUser;
      }>();

    const userId = request.user?.sub;
    if (!userId) throw new ForbiddenException('Unauthenticated');

    const cafeIdRaw = request.params.cafeId ?? request.params.id;
    const cafeId = Number(cafeIdRaw);
    if (!cafeId || Number.isNaN(cafeId)) {
      throw new ForbiddenException('Invalid cafe scope');
    }

    const membership = await this.em.findOne(CafeUser, {
      user: userId,
      cafe: cafeId,
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this cafe');
    }

    request.cafeMembership = membership;
    return true;
  }
}
