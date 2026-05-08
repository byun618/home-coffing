/**
 * seed-equipments — Equipment 글로벌 catalog 초기 시드 (T004)
 *
 * 실행:
 *   pnpm --filter @home-coffing/api ts-node src/scripts/seed-equipments.ts
 *
 * idempotent: 같은 (type, name, brand, model)이 이미 있으면 skip.
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '../../../../.env') });

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { mikroOrmConfig } from '../mikro-orm.config';
import { Equipment, EquipmentType } from '../common/entities';

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig)],
})
class SeedModule {}

interface SeedRow {
  type: EquipmentType;
  name: string;
  brand: string | null;
  model: string | null;
}

const SEEDS: SeedRow[] = [
  // Brewer (드리퍼/이머전)
  { type: EquipmentType.BREWER, name: 'Hario V60 02', brand: 'Hario', model: 'V60-02' },
  { type: EquipmentType.BREWER, name: 'Hario V60 03', brand: 'Hario', model: 'V60-03' },
  { type: EquipmentType.BREWER, name: 'Hario Switch', brand: 'Hario', model: 'Switch' },
  { type: EquipmentType.BREWER, name: 'Kalita Wave 155', brand: 'Kalita', model: 'Wave 155' },
  { type: EquipmentType.BREWER, name: 'Kalita Wave 185', brand: 'Kalita', model: 'Wave 185' },
  { type: EquipmentType.BREWER, name: 'Origami Dripper M', brand: 'Origami', model: 'M' },
  { type: EquipmentType.BREWER, name: 'Chemex 6-cup', brand: 'Chemex', model: '6-cup' },
  { type: EquipmentType.BREWER, name: 'Aeropress', brand: 'Aeropress', model: 'Original' },

  // Grinder
  { type: EquipmentType.GRINDER, name: 'Comandante C40', brand: 'Comandante', model: 'C40 MK4' },
  { type: EquipmentType.GRINDER, name: 'Timemore C2', brand: 'Timemore', model: 'C2' },
  { type: EquipmentType.GRINDER, name: 'Timemore C3', brand: 'Timemore', model: 'C3' },
  { type: EquipmentType.GRINDER, name: '1Zpresso K-Plus', brand: '1Zpresso', model: 'K-Plus' },
  { type: EquipmentType.GRINDER, name: '1Zpresso JX-Pro', brand: '1Zpresso', model: 'JX-Pro' },
  { type: EquipmentType.GRINDER, name: 'Wilfa Svart', brand: 'Wilfa', model: 'Svart' },
  { type: EquipmentType.GRINDER, name: 'Niche Zero', brand: 'Niche', model: 'Zero' },
  { type: EquipmentType.GRINDER, name: 'Fellow Ode Gen 2', brand: 'Fellow', model: 'Ode Gen 2' },

  // Kettle
  { type: EquipmentType.KETTLE, name: 'Brewista Artisan', brand: 'Brewista', model: 'Artisan' },
  { type: EquipmentType.KETTLE, name: 'Fellow Stagg EKG', brand: 'Fellow', model: 'Stagg EKG' },
  { type: EquipmentType.KETTLE, name: 'Hario V60 Power Kettle', brand: 'Hario', model: 'V60 Power' },
  { type: EquipmentType.KETTLE, name: 'Bonavita Variable Temp', brand: 'Bonavita', model: 'Variable Temp' },

  // Scale
  { type: EquipmentType.SCALE, name: 'Acaia Pearl', brand: 'Acaia', model: 'Pearl' },
  { type: EquipmentType.SCALE, name: 'Acaia Lunar', brand: 'Acaia', model: 'Lunar' },
  { type: EquipmentType.SCALE, name: 'Hario V60 Drip Scale', brand: 'Hario', model: 'V60 Drip Scale' },
  { type: EquipmentType.SCALE, name: 'Felicita Arc', brand: 'Felicita', model: 'Arc' },
  { type: EquipmentType.SCALE, name: 'Timemore Black Mirror', brand: 'Timemore', model: 'Black Mirror' },
];

async function main(): Promise<void> {
  console.log('=== Seed equipments (T004) ===');
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  const orm = app.get(MikroORM);
  const em = orm.em.fork();

  try {
    let inserted = 0;
    let skipped = 0;
    for (const seed of SEEDS) {
      const existing = await em.findOne(Equipment, {
        type: seed.type,
        name: seed.name,
        brand: seed.brand,
        model: seed.model,
      });
      if (existing) {
        console.log(`  [SKIP] ${seed.type} ${seed.name} (id=${existing.id})`);
        skipped += 1;
        continue;
      }
      const equipment = em.create(Equipment, {
        type: seed.type,
        name: seed.name,
        brand: seed.brand,
        model: seed.model,
        createdBy: null,
      });
      em.persist(equipment);
      console.log(`  [INSERT] ${seed.type} ${seed.name}`);
      inserted += 1;
    }
    await em.flush();
    console.log(`\nDone. inserted=${inserted}, skipped=${skipped}`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
