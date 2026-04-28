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
import { User } from './user.entity';
import { RecordBean } from './record-bean.entity';

export interface RecipeStep {
  label: string;
  atMark?: string;
  yieldGrams?: number;
  note?: string;
}

export interface RecipeJson {
  brewingMethod?:
    | 'v60'
    | 'switch'
    | 'espresso'
    | 'moka'
    | 'aeropress'
    | 'french_press'
    | 'other';
  coffeeGrams?: number;
  grindSize?: number;
  grindUnit?: string;
  waterTempCelsius?: number;
  totalYieldGrams?: number;
  totalTimeSeconds?: number;
  iceGrams?: number;
  steps?: RecipeStep[];
  extraNote?: string;
}

export interface TasteNoteJson {
  text: string;
  rating?: number;
}

@Entity({ tableName: 'record' })
export class Record {
  [OptionalProps]?:
    | 'cups'
    | 'recipe'
    | 'tasteNote'
    | 'memo'
    | 'loggedAt'
    | 'createdAt'
    | 'recordBeans';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @ManyToOne(() => User)
  user!: User;

  @Property({ columnType: 'decimal(10,1)' })
  totalGrams!: number;

  @Property({ columnType: 'decimal(10,2)', nullable: true })
  cups: number | null = null;

  @Property()
  brewedAt!: Date;

  @Property()
  loggedAt: Date = new Date();

  @Property({ length: 200, nullable: true })
  memo: string | null = null;

  @Property({ type: 'json', nullable: true })
  recipe: RecipeJson | null = null;

  @Property({ type: 'json', nullable: true })
  tasteNote: TasteNoteJson | null = null;

  @OneToMany(() => RecordBean, (recordBean) => recordBean.record, {
    orphanRemoval: true,
  })
  recordBeans = new Collection<RecordBean>(this);

  @Property()
  createdAt: Date = new Date();
}
