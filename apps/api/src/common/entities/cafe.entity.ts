import {
  Collection,
  Entity,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { CafeUser } from './cafe-user.entity';
import { CafeBean } from './cafe-bean.entity';
import { CafeEquipment } from './cafe-equipment.entity';
import { Record as RecordEntity } from './record.entity';
import { Invitation } from './invitation.entity';

@Entity()
export class Cafe {
  [OptionalProps]?:
    | 'name'
    | 'createdAt'
    | 'members'
    | 'cafeBeans'
    | 'cafeEquipments'
    | 'records'
    | 'invitations';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 80, default: '내 홈카페' })
  name: string = '내 홈카페';

  @OneToMany(() => CafeUser, (cafeUser) => cafeUser.cafe)
  members = new Collection<CafeUser>(this);

  @OneToMany(() => CafeBean, (cafeBean) => cafeBean.cafe)
  cafeBeans = new Collection<CafeBean>(this);

  @OneToMany(() => CafeEquipment, (cafeEquipment) => cafeEquipment.cafe)
  cafeEquipments = new Collection<CafeEquipment>(this);

  @OneToMany(() => RecordEntity, (record) => record.cafe)
  records = new Collection<RecordEntity>(this);

  @OneToMany(() => Invitation, (invitation) => invitation.cafe)
  invitations = new Collection<Invitation>(this);

  @Property()
  createdAt: Date = new Date();
}
