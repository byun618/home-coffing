import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Cafe,
  CafeUser,
  Equipment,
  Recipe,
  RecipeEquipment,
  Record as RecordEntity,
  User,
} from '../common/entities';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Recipe,
      RecipeEquipment,
      Equipment,
      Cafe,
      CafeUser,
      RecordEntity,
      User,
    ]),
  ],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
