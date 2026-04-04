import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mikroOrmConfig } from './mikro-orm.config';
import { CafeModule } from './cafe/cafe.module';
import { BeanModule } from './bean/bean.module';
import { ConsumptionModule } from './consumption/consumption.module';
import { PushModule } from './push/push.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    ScheduleModule.forRoot(),
    CafeModule,
    BeanModule,
    ConsumptionModule,
    PushModule,
    SchedulerModule,
  ],
})
export class AppModule {}
