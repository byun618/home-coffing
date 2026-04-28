import {
  Collection,
  Entity,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { CafeUser } from './cafe-user.entity';
import { Bean } from './bean.entity';
import { Record as RecordEntity } from './record.entity';
import { Equipment } from './equipment.entity';
import { Invitation } from './invitation.entity';

@Entity()
export class Cafe {
  [OptionalProps]?:
    | 'name'
    | 'createdAt'
    | 'members'
    | 'beans'
    | 'records'
    | 'equipments'
    | 'invitations';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 80, default: '내 홈카페' })
  name: string = '내 홈카페';

  @OneToMany(() => CafeUser, (cafeUser) => cafeUser.cafe)
  members = new Collection<CafeUser>(this);

  @OneToMany(() => Bean, (bean) => bean.cafe)
  beans = new Collection<Bean>(this);

  @OneToMany(() => RecordEntity, (record) => record.cafe)
  records = new Collection<RecordEntity>(this);

  @OneToMany(() => Equipment, (equipment) => equipment.cafe)
  equipments = new Collection<Equipment>(this);

  @OneToMany(() => Invitation, (invitation) => invitation.cafe)
  invitations = new Collection<Invitation>(this);

  @Property()
  createdAt: Date = new Date();
}
