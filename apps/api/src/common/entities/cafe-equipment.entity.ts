import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';
import { Equipment } from './equipment.entity';
import { RecordEquipment } from './record-equipment.entity';

@Entity()
export class CafeEquipment {
  [OptionalProps]?: 'createdAt' | 'recordEquipments';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @ManyToOne(() => Equipment, { deleteRule: 'restrict' })
  equipment!: Equipment;

  @OneToMany(
    () => RecordEquipment,
    (recordEquipment) => recordEquipment.cafeEquipment,
  )
  recordEquipments = new Collection<RecordEquipment>(this);

  @Property()
  createdAt: Date = new Date();
}
