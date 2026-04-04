import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  Collection,
  OneToMany,
} from '@mikro-orm/core';
import { Bean } from './bean.entity';

@Entity()
export class Cafe {
  [OptionalProps]?: 'name' | 'createdAt' | 'beans';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ default: '홈 커핑' })
  name: string = '홈 커핑';

  @OneToMany(() => Bean, (bean) => bean.cafe)
  beans = new Collection<Bean>(this);

  @Property()
  createdAt: Date = new Date();
}
