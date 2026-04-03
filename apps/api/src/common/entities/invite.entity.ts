import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { Cafe } from './cafe.entity';
import { User } from './user.entity';

@Entity()
export class Invite {
  [OptionalProps]?: 'token' | 'usedAt' | 'usedBy';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe)
  cafe!: Cafe;

  @ManyToOne(() => User)
  invitedBy!: User;

  @Property({ unique: true })
  token: string = randomUUID();

  @Property()
  expiresAt!: Date;

  @Property({ nullable: true })
  usedAt: Date | null = null;

  @ManyToOne(() => User, { nullable: true })
  usedBy: User | null = null;
}
