import {
  Entity,
  Enum,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { User } from './user.entity';

export enum EquipmentType {
  GRINDER = 'grinder',
  BREWER = 'brewer',
  SCALE = 'scale',
  KETTLE = 'kettle',
}

@Entity()
export class Equipment {
  [OptionalProps]?: 'brand' | 'model' | 'createdBy' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Enum(() => EquipmentType)
  type!: EquipmentType;

  @Property({ length: 120 })
  name!: string;

  @Property({ length: 60, nullable: true })
  brand: string | null = null;

  @Property({ length: 80, nullable: true })
  model: string | null = null;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  createdBy: User | null = null;

  @Property()
  createdAt: Date = new Date();
}
