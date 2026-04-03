import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/core';
import { Bean } from './bean.entity';
import { User } from './user.entity';

@Entity()
export class Consumption {
  [OptionalProps]?: 'water' | 'grindSize' | 'method' | 'note' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Bean)
  bean!: Bean;

  @ManyToOne(() => User)
  user!: User;

  @Property({ columnType: 'decimal(10,1)' })
  amount!: number;

  @Property({ nullable: true })
  water: number | null = null;

  @Property({ nullable: true })
  grindSize: string | null = null;

  @Property({ nullable: true })
  method: string | null = null;

  @Property({ nullable: true, columnType: 'text' })
  note: string | null = null;

  @Property()
  createdAt: Date = new Date();
}
