import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mikroOrmConfig } from './mikro-orm.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CafeModule } from './cafe/cafe.module';
import { InvitationModule } from './invitation/invitation.module';
import { BeanModule } from './bean/bean.module';
import { RecordModule } from './record/record.module';
import { DeviceModule } from './device/device.module';
import { NotificationModule } from './notification/notification.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    EventModule,
    AuthModule,
    UserModule,
    CafeModule,
    InvitationModule,
    BeanModule,
    RecordModule,
    DeviceModule,
    NotificationModule,
  ],
})
export class AppModule {}
