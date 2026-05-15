import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Bean,
  CafeBean,
  CafeUser,
  RecordBean,
} from '../common/entities';
import { BeanCatalogController } from './bean-catalog.controller';
import { BeanCatalogService } from './bean-catalog.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Bean, CafeBean, CafeUser, RecordBean]),
  ],
  controllers: [BeanCatalogController],
  providers: [BeanCatalogService],
  exports: [BeanCatalogService],
})
export class BeanCatalogModule {}
