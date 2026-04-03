import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';
import { User } from './user.entity';

@Entity()
@Unique({ properties: ['cafe', 'user'] })
export class CafeMember {
  [OptionalProps]?: 'joinedAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe)
  cafe!: Cafe;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  role!: 'admin' | 'member';

  @Property()
  joinedAt: Date = new Date();
}
