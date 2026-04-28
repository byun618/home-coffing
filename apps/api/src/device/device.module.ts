import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DeviceToken, User } from '../common/entities';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

@Module({
  imports: [MikroOrmModule.forFeature([DeviceToken, User])],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
