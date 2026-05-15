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
import { User } from './user.entity';
import { CafeBean } from './cafe-bean.entity';
import { BeanProcess, BeanType, EntitySource } from './enums';

@Entity()
export class Bean {
  [OptionalProps]?:
    | 'process'
    | 'tastingNote'
    | 'createdBy'
    | 'createdAt'
    | 'cafeBeans';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 120, unique: true })
  name!: string;

  @Enum(() => BeanType)
  type!: BeanType;

  @Enum({ items: () => BeanProcess, nullable: true })
  process: BeanProcess | null = null;

  @Property({ type: 'json', nullable: true })
  tastingNote: string[] | null = null;

  @Enum(() => EntitySource)
  source!: EntitySource;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  createdBy: User | null = null;

  @OneToMany(() => CafeBean, (cafeBean) => cafeBean.bean)
  cafeBeans = new Collection<CafeBean>(this);

  @Property()
  createdAt: Date = new Date();
}
