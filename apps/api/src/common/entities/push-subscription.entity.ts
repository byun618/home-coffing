import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/core';
import { User } from './user.entity';

@Entity()
export class PushSubscription {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property({ columnType: 'text' })
  endpoint!: string;

  @Property()
  p256dh!: string;

  @Property()
  auth!: string;

  @Property()
  createdAt: Date = new Date();
}
