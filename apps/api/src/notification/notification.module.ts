import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { NotificationController } from './notification.controller';

@Module({
  controllers: [NotificationController],
  providers: [FcmService],
  exports: [FcmService],
})
export class NotificationModule {}
