import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CafeUser, CafeUserRole } from '../entities';

/**
 * CafeMemberGuard를 통과한 후 사용. request.cafeMembership.role === admin 검증.
 * 컨트롤러에 @UseGuards(JwtAuthGuard, CafeMemberGuard, AdminGuard) 순서로 사용.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ cafeMembership?: CafeUser }>();

    const membership = request.cafeMembership;
    if (!membership) {
      throw new ForbiddenException(
        'CafeMemberGuard must run before AdminGuard',
      );
    }
    if (membership.role !== CafeUserRole.ADMIN) {
      throw new ForbiddenException('Admin only');
    }
    return true;
  }
}
