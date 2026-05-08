import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Equipment, User } from '../common/entities';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

@Module({
  imports: [MikroOrmModule.forFeature([Equipment, User])],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
