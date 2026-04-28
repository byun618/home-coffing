import {
  Entity,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { User } from './user.entity';

@Entity()
export class RefreshToken {
  [OptionalProps]?: 'deviceInfo' | 'revokedAt' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({ length: 255, unique: true })
  tokenHash!: string;

  @Property({ length: 200, nullable: true })
  deviceInfo: string | null = null;

  @Property()
  expiresAt!: Date;

  @Property({ nullable: true })
  revokedAt: Date | null = null;

  @Property()
  createdAt: Date = new Date();
}
