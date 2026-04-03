import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
  Collection,
  OneToMany,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { CafeMember } from './cafe-member.entity';
import { Bean } from './bean.entity';
import { Invite } from './invite.entity';

@Entity()
export class Cafe {
  [OptionalProps]?: 'name' | 'createdAt' | 'members' | 'beans' | 'invites';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ default: '우리집 카페' })
  name: string = '우리집 카페';

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany(() => CafeMember, (member) => member.cafe)
  members = new Collection<CafeMember>(this);

  @OneToMany(() => Bean, (bean) => bean.cafe)
  beans = new Collection<Bean>(this);

  @OneToMany(() => Invite, (invite) => invite.cafe)
  invites = new Collection<Invite>(this);

  @Property()
  createdAt: Date = new Date();
}
