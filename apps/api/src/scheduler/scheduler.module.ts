import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { BeanModule } from '../bean/bean.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [BeanModule, PushModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
