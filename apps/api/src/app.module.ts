import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mikroOrmConfig } from './mikro-orm.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CafeModule } from './cafe/cafe.module';
import { InvitationModule } from './invitation/invitation.module';
import { CafeBeanModule } from './cafe-bean/cafe-bean.module';
import { BeanCatalogModule } from './bean-catalog/bean-catalog.module';
import { RecordModule } from './record/record.module';
import { RecipeModule } from './recipe/recipe.module';
import { EquipmentModule } from './equipment/equipment.module';
import { TasteNoteModule } from './taste-note/taste-note.module';
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
    BeanCatalogModule,
    CafeBeanModule,
    RecordModule,
    RecipeModule,
    EquipmentModule,
    TasteNoteModule,
    DeviceModule,
    NotificationModule,
  ],
})
export class AppModule {}
