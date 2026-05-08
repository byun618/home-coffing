import {
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';
import { User } from './user.entity';
import { RecipeEquipment } from './recipe-equipment.entity';
import { EntitySource, RecipeMethod } from './enums';
import type { BrewingParams } from '../types/recipe-params';

@Entity()
export class Recipe {
  [OptionalProps]?:
    | 'name'
    | 'params'
    | 'createdBy'
    | 'createdAt'
    | 'recipeEquipments';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @Property({ length: 120, nullable: true })
  name: string | null = null;

  @Enum(() => RecipeMethod)
  method!: RecipeMethod;

  @Property({ type: 'json', nullable: true })
  params: BrewingParams | null = null;

  @Enum(() => EntitySource)
  source!: EntitySource;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  createdBy: User | null = null;

  @OneToMany(() => RecipeEquipment, (recipeEquipment) => recipeEquipment.recipe, {
    orphanRemoval: true,
  })
  recipeEquipments = new Collection<RecipeEquipment>(this);

  @Property()
  createdAt: Date = new Date();
}
