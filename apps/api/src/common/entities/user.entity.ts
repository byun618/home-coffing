import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity()
export class User {
  [OptionalProps]?: 'defaultCupsPerDay' | 'defaultGramsPerCup' | 'createdAt';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Property({ nullable: true })
  defaultCupsPerDay: number | null = null;

  @Property({ nullable: true })
  defaultGramsPerCup: number | null = null;

  @Property()
  createdAt: Date = new Date();
}
