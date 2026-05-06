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
import { Bean } from './bean.entity';
import { RecordBean } from './record-bean.entity';

export enum BeanFinishedReason {
  CONSUMED = 'consumed',
  DISCARDED = 'discarded',
}

@Entity()
export class CafeBean {
  [OptionalProps]?:
    | 'arrivedAt'
    | 'degassingDays'
    | 'cupsPerDay'
    | 'gramsPerCup'
    | 'autoRopEnabled'
    | 'finishedAt'
    | 'finishedReason'
    | 'archivedAt'
    | 'lastRopAlertAt'
    | 'createdAt'
    | 'recordBeans';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @ManyToOne(() => Bean, { deleteRule: 'restrict' })
  bean!: Bean;

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

  @Property({ default: true })
  autoRopEnabled: boolean = true;

  @Property({ nullable: true })
  finishedAt: Date | null = null;

  @Enum({ items: () => BeanFinishedReason, nullable: true })
  finishedReason: BeanFinishedReason | null = null;

  @Property({ nullable: true })
  archivedAt: Date | null = null;

  @Property({ nullable: true })
  lastRopAlertAt: Date | null = null;

  @OneToMany(() => RecordBean, (recordBean) => recordBean.cafeBean)
  recordBeans = new Collection<RecordBean>(this);

  @Property()
  createdAt: Date = new Date();
}
