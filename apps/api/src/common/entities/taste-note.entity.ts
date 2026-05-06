import {
  Entity,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Record as RecordEntity } from './record.entity';
import { User } from './user.entity';

@Entity()
export class TasteNote {
  [OptionalProps]?: 'rating' | 'memo' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => RecordEntity, { deleteRule: 'cascade' })
  record!: RecordEntity;

  @ManyToOne(() => User)
  author!: User;

  @Property({ columnType: 'decimal(3,1)', nullable: true })
  rating: number | null = null;

  @Property({ length: 200, nullable: true })
  memo: string | null = null;

  @Property()
  createdAt: Date = new Date();
}
