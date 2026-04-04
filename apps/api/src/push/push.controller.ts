import { Controller, Post, Get, Delete, Body } from '@nestjs/common';
import { PushService } from './push.service';
import { PushSubscribeDto } from './dto/push-subscribe.dto';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-key')
  getVapidKey() {
    return { vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '' };
  }

  @Post('subscribe')
  subscribe(@Body() dto: PushSubscribeDto) {
    return this.pushService.subscribe(dto);
  }

  @Delete('subscribe')
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.pushService.unsubscribe(body.endpoint);
  }
}
