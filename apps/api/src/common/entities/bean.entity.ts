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
import { Cafe } from './cafe.entity';
import { Roaster } from './roaster.entity';
import { RecordBean } from './record-bean.entity';

export enum BeanFinishedReason {
  CONSUMED = 'consumed',
  DISCARDED = 'discarded',
}

@Entity()
export class Bean {
  [OptionalProps]?:
    | 'roaster'
    | 'origin'
    | 'arrivedAt'
    | 'degassingDays'
    | 'cupsPerDay'
    | 'gramsPerCup'
    | 'finishedAt'
    | 'finishedReason'
    | 'archivedAt'
    | 'autoRopEnabled'
    | 'lastRopAlertAt'
    | 'createdAt'
    | 'recordBeans';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @ManyToOne(() => Roaster, { nullable: true })
  roaster: Roaster | null = null;

  @Property({ length: 120 })
  name!: string;

  @Property({ length: 120, nullable: true })
  origin: string | null = null;

  @Property({ columnType: 'decimal(10,1)' })
  totalGrams!: number;

  @Property({ columnType: 'decimal(10,1)' })
  remainGrams!: number;

  @Property({ type: 'date' })
  orderedAt!: Date;

  @Property({ type: 'date' })
  roastedOn!: Date;

  @Property({ type: 'date', nullable: true })
  arrivedAt: Date | null = null;

  @Property({ default: 7 })
  degassingDays: number = 7;

  @Property({ columnType: 'decimal(10,2)', default: 2 })
  cupsPerDay: number = 2;

  @Property({ columnType: 'decimal(10,2)', default: 20 })
  gramsPerCup: number = 20;

  @Property({ nullable: true })
  finishedAt: Date | null = null;

  @Enum({ items: () => BeanFinishedReason, nullable: true })
  finishedReason: BeanFinishedReason | null = null;

  @Property({ nullable: true })
  archivedAt: Date | null = null;

  @Property({ default: true })
  autoRopEnabled: boolean = true;

  @Property({ nullable: true })
  lastRopAlertAt: Date | null = null;

  @OneToMany(() => RecordBean, (recordBean) => recordBean.bean)
  recordBeans = new Collection<RecordBean>(this);

  @Property()
  createdAt: Date = new Date();
}
