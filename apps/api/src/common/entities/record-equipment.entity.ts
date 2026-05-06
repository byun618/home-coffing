import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Unique,
} from '@mikro-orm/core';
import { Record as RecordEntity } from './record.entity';
import { CafeEquipment } from './cafe-equipment.entity';

@Entity()
@Unique({ properties: ['record', 'cafeEquipment'] })
export class RecordEquipment {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => RecordEntity, { deleteRule: 'cascade' })
  record!: RecordEntity;

  @ManyToOne(() => CafeEquipment)
  cafeEquipment!: CafeEquipment;
}
