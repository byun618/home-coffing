import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity()
export class PushSubscription {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ columnType: 'text' })
  endpoint!: string;

  @Property()
  p256dh!: string;

  @Property()
  auth!: string;

  @Property()
  createdAt: Date = new Date();
}
