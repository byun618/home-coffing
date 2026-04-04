import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
  Collection,
  OneToMany,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';
import { Consumption } from './consumption.entity';

@Entity()
export class Bean {
  [OptionalProps]?: 'arrivedAt' | 'createdAt' | 'consumptions';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe)
  cafe!: Cafe;

  @Property()
  name!: string;

  @Property({ columnType: 'decimal(10,1)' })
  totalAmount!: number;

  @Property({ columnType: 'decimal(10,1)' })
  remainAmount!: number;

  @Property({ type: 'date' })
  orderedAt!: Date;

  @Property({ type: 'date' })
  roastDate!: Date;

  @Property({ type: 'date', nullable: true })
  arrivedAt: Date | null = null;

  @Property({ default: 7 })
  degassingDays!: number;

  @Property({ columnType: 'decimal(10,2)', default: 2 })
  cupsPerDay!: number;

  @Property({ columnType: 'decimal(10,2)', default: 20 })
  gramsPerCup!: number;

  @OneToMany(() => Consumption, (consumption) => consumption.bean)
  consumptions = new Collection<Consumption>(this);

  @Property()
  createdAt: Date = new Date();
}
