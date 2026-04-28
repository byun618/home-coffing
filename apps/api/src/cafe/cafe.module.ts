import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Cafe,
  CafeUser,
  Invitation,
  User,
} from '../common/entities';
import { CafeController } from './cafe.controller';
import { CafeService } from './cafe.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Cafe, CafeUser, User, Invitation]),
  ],
  controllers: [CafeController],
  providers: [CafeService],
  exports: [CafeService],
})
export class CafeModule {}
