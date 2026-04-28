import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Phase 1 stub — FCM 미연동, 서버측 Notification 엔티티도 없음.
 * S13 화면이 빈 상태("알림이 없어요")로 동작할 수 있도록 빈 list만 반환.
 * Phase 2: Notification 엔티티 추가 + ROP 임박 알림 발송 로직 구현 시 대체.
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  @Get()
  async list(
    @CurrentUser() _user: JwtPayload,
  ): Promise<NotificationItem[]> {
    return [];
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() _user: JwtPayload,
    @Param('notificationId', ParseIntPipe) _notificationId: number,
  ): Promise<void> {
    return;
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() _user: JwtPayload): Promise<void> {
    return;
  }
}
