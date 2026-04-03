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
import { User } from './user.entity';
import { Consumption } from './consumption.entity';

@Entity()
export class Bean {
  [OptionalProps]?: 'createdAt' | 'consumptions';

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
  roastDate!: Date;

  @Property({ columnType: 'decimal(10,1)' })
  perCup!: number;

  @Property()
  deliveryDays!: number;

  @Property()
  degassingDays!: number;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany(() => Consumption, (consumption) => consumption.bean)
  consumptions = new Collection<Consumption>(this);

  @Property()
  createdAt: Date = new Date();
}
