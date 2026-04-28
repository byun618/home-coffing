import {
  Entity,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';
import { User } from './user.entity';

@Entity()
export class Invitation {
  [OptionalProps]?: 'acceptedBy' | 'acceptedAt' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @ManyToOne(() => User)
  invitedBy!: User;

  @Property({ length: 36, unique: true })
  code!: string;

  @Property()
  expiresAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  acceptedBy: User | null = null;

  @Property({ nullable: true })
  acceptedAt: Date | null = null;

  @Property()
  createdAt: Date = new Date();
}
