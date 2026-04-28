import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity()
export class Roaster {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 120, unique: true })
  name!: string;

  @Property()
  createdAt: Date = new Date();
}
