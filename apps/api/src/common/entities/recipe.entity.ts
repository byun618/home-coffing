import {
  Entity,
  Enum,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { EntitySource, RecipeMethod } from './enums';
import type { RecipeParamsJson } from '../types/recipe-params';

@Entity()
export class Recipe {
  [OptionalProps]?: 'params' | 'createdBy' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 120 })
  name!: string;

  @Enum(() => RecipeMethod)
  method!: RecipeMethod;

  @Property({ type: 'json', nullable: true })
  params: RecipeParamsJson | null = null;

  @Enum(() => EntitySource)
  source!: EntitySource;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  createdBy: User | null = null;

  @Property()
  createdAt: Date = new Date();
}
