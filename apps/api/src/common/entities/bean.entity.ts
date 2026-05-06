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
import { Roaster } from './roaster.entity';
import { User } from './user.entity';
import { CafeBean } from './cafe-bean.entity';
import { EntitySource } from './enums';

@Entity()
export class Bean {
  [OptionalProps]?:
    | 'roaster'
    | 'origin'
    | 'process'
    | 'roastLevel'
    | 'createdBy'
    | 'createdAt'
    | 'cafeBeans';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 120 })
  name!: string;

  @ManyToOne(() => Roaster, { nullable: true })
  roaster: Roaster | null = null;

  @Property({ length: 120, nullable: true })
  origin: string | null = null;

  @Property({ length: 60, nullable: true })
  process: string | null = null;

  @Property({ length: 30, nullable: true })
  roastLevel: string | null = null;

  @Enum(() => EntitySource)
  source!: EntitySource;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  createdBy: User | null = null;

  @OneToMany(() => CafeBean, (cafeBean) => cafeBean.bean)
  cafeBeans = new Collection<CafeBean>(this);

  @Property()
  createdAt: Date = new Date();
}
