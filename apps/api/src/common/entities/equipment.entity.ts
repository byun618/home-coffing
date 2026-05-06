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
import { User } from './user.entity';
import { CafeEquipment } from './cafe-equipment.entity';
import { EntitySource } from './enums';

export enum EquipmentType {
  GRINDER = 'grinder',
  BREWER = 'brewer',
  SCALE = 'scale',
  KETTLE = 'kettle',
}

@Entity()
export class Equipment {
  [OptionalProps]?:
    | 'brand'
    | 'model'
    | 'createdBy'
    | 'createdAt'
    | 'cafeEquipments';

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

  @Enum(() => EntitySource)
  source!: EntitySource;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  createdBy: User | null = null;

  @OneToMany(() => CafeEquipment, (cafeEquipment) => cafeEquipment.equipment)
  cafeEquipments = new Collection<CafeEquipment>(this);

  @Property()
  createdAt: Date = new Date();
}
