import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Cafe } from './cafe.entity';
import { CafeUser } from './cafe-user.entity';
import { Record as RecordEntity } from './record.entity';
import { DeviceToken } from './device-token.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity()
export class User {
  [OptionalProps]?:
    | 'displayName'
    | 'defaultCafe'
    | 'createdAt'
    | 'memberships'
    | 'records'
    | 'devices'
    | 'refreshTokens';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 255, unique: true })
  email!: string;

  @Property({ length: 255 })
  passwordHash!: string;

  @Property({ length: 80, nullable: true })
  displayName: string | null = null;

  @ManyToOne(() => Cafe, { nullable: true })
  defaultCafe: Cafe | null = null;

  @OneToMany(() => CafeUser, (cafeUser) => cafeUser.user)
  memberships = new Collection<CafeUser>(this);

  @OneToMany(() => RecordEntity, (record) => record.user)
  records = new Collection<RecordEntity>(this);

  @OneToMany(() => DeviceToken, (token) => token.user)
  devices = new Collection<DeviceToken>(this);

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens = new Collection<RefreshToken>(this);

  @Property()
  createdAt: Date = new Date();
}
