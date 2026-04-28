import {
  Entity,
  Enum,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { Cafe } from './cafe.entity';

export enum CafeUserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity()
@Unique({ properties: ['user', 'cafe'] })
export class CafeUser {
  [OptionalProps]?: 'role' | 'joinedAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @Enum(() => CafeUserRole)
  role: CafeUserRole = CafeUserRole.MEMBER;

  @Property()
  joinedAt: Date = new Date();
}
