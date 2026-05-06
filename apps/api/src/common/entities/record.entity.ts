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
import { User } from './user.entity';
import { Recipe } from './recipe.entity';
import { RecordBean } from './record-bean.entity';
import { RecordEquipment } from './record-equipment.entity';
import { TasteNote } from './taste-note.entity';

@Entity({ tableName: 'record' })
export class Record {
  [OptionalProps]?:
    | 'recipe'
    | 'memo'
    | 'loggedAt'
    | 'createdAt'
    | 'recordBeans'
    | 'recordEquipments'
    | 'tasteNotes';

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Cafe, { deleteRule: 'cascade' })
  cafe!: Cafe;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  brewedAt!: Date;

  @Property()
  loggedAt: Date = new Date();

  @Property({ length: 200, nullable: true })
  memo: string | null = null;

  @ManyToOne(() => Recipe, { nullable: true, deleteRule: 'set null' })
  recipe: Recipe | null = null;

  @OneToMany(() => RecordBean, (recordBean) => recordBean.record, {
    orphanRemoval: true,
  })
  recordBeans = new Collection<RecordBean>(this);

  @OneToMany(
    () => RecordEquipment,
    (recordEquipment) => recordEquipment.record,
    { orphanRemoval: true },
  )
  recordEquipments = new Collection<RecordEquipment>(this);

  @OneToMany(() => TasteNote, (tasteNote) => tasteNote.record, {
    orphanRemoval: true,
  })
  tasteNotes = new Collection<TasteNote>(this);

  @Property()
  createdAt: Date = new Date();
}
