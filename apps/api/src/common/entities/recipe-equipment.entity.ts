import {
  Entity,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Recipe } from './recipe.entity';
import { Equipment } from './equipment.entity';

@Entity()
export class RecipeEquipment {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Recipe, { deleteRule: 'cascade' })
  recipe!: Recipe;

  @ManyToOne(() => Equipment, { deleteRule: 'restrict' })
  equipment!: Equipment;

  @Property()
  createdAt: Date = new Date();
}
