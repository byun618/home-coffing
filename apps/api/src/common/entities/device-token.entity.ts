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

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

@Entity()
@Unique({ properties: ['user', 'token'] })
export class DeviceToken {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Enum(() => DevicePlatform)
  platform!: DevicePlatform;

  @Property({ length: 500 })
  token!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
