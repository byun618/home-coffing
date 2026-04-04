import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/core';
import { Bean } from './bean.entity';

@Entity()
export class Consumption {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Bean)
  bean!: Bean;

  @Property({ columnType: 'decimal(10,1)' })
  amount!: number;

  @Property()
  createdAt: Date = new Date();
}
