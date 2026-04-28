import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Record as RecordEntity } from './record.entity';
import { Bean } from './bean.entity';

@Entity()
@Unique({ properties: ['record', 'bean'] })
export class RecordBean {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => RecordEntity, { deleteRule: 'cascade' })
  record!: RecordEntity;

  @ManyToOne(() => Bean)
  bean!: Bean;

  @Property({ columnType: 'decimal(10,1)' })
  grams!: number;
}
