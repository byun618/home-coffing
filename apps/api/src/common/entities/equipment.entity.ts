import {
  Entity,
  Enum,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';

export enum EquipmentType {
  GRINDER = 'grinder',
  BREWER = 'brewer',
  SCALE = 'scale',
  KETTLE = 'kettle',
}

@Entity()
export class Equipment {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @Enum(() => EquipmentType)
  type!: EquipmentType;

  @Property({ length: 120 })
  name!: string;

  @Property()
  createdAt: Date = new Date();
}
