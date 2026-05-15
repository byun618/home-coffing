/**
 * seed-beans — Bean 글로벌 catalog 초기 시드 (T005)
 *
 * 실행:
 *   pnpm --filter @home-coffing/api ts-node src/scripts/seed-beans.ts
 *
 * idempotent upsert:
 *   - name으로 lookup
 *   - 없으면 INSERT (source=GLOBAL, createdBy=null)
 *   - 있으면 type/process/tastingNote 비교 후 변경분만 UPDATE
 *
 * 출처: research-bean-data.md 표 1·2·3 (원두반점 universe ~35종)
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '../../../../.env') });

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { mikroOrmConfig } from '../mikro-orm.config';
import { Bean, BeanType, BeanProcess, EntitySource } from '../common/entities';

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig)],
})
class SeedModule {}

interface SeedRow {
  name: string;
  type: BeanType;
  process: BeanProcess | null;
  tastingNote: string[] | null;
}

const SEEDS: SeedRow[] = [
  // 싱글오리진 — 아프리카 (10)
  { name: '에티오피아 예가체프 G4', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '에티오피아 예가체프 G2', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '에티오피아 시다모 G4', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '에티오피아 시다모 G2', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '에티오피아 코케허니 G1', type: BeanType.SINGLE, process: BeanProcess.HONEY, tastingNote: null },
  { name: '에티오피아 아리차 내추럴 G1', type: BeanType.SINGLE, process: BeanProcess.NATURAL, tastingNote: null },
  {
    name: '에티오피아 예가체프 아바야 게이샤 G1',
    type: BeanType.SINGLE,
    process: null,
    tastingNote: ['복숭아', '구아바', '밀크초콜릿'],
  },
  { name: '에티오피아 구지 겔레나 게이샤 G1', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '에티오피아 벤치마지 게이샤', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '케냐 AA', type: BeanType.SINGLE, process: null, tastingNote: null },

  // 싱글오리진 — 남미·중미 (5)
  { name: '브라질 세하도 파인컵 NY2', type: BeanType.SINGLE, process: null, tastingNote: null },
  { name: '콜롬비아 수프리모', type: BeanType.SINGLE, process: null, tastingNote: null },
  {
    name: '과테말라 안티구아 SHB',
    type: BeanType.SINGLE,
    process: null,
    tastingNote: ['다크초콜릿', '흑설탕', '블랙커런트'],
  },
  {
    name: '페루 엘 라우렐 게이샤 무산소 워시드',
    type: BeanType.SINGLE,
    process: BeanProcess.WASHED,
    tastingNote: null,
  },
  {
    name: '파나마 핀카 하트만 카투라 내추럴',
    type: BeanType.SINGLE,
    process: BeanProcess.NATURAL,
    tastingNote: null,
  },

  // 싱글오리진 — 아시아 (1)
  { name: '베트남 로부스타 G1', type: BeanType.SINGLE, process: null, tastingNote: null },

  // 블렌드 (11)
  { name: '산미없는 고소한 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 구수 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 고소 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 마일드 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '원두반점 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 에스프레소 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 스타 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 다크 스타 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 달콤 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 밸런스 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },
  { name: '더 스페셜 블렌드', type: BeanType.BLEND, process: null, tastingNote: null },

  // 디카페인 (10)
  { name: '디카페인 브라질', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 콜롬비아', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 과테말라', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 에티오피아', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 멕시코', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '더 디카페인 블렌드', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '더 다크 디카페인 블렌드', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 레인보우', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 밤', type: BeanType.DECAF, process: null, tastingNote: null },
  { name: '디카페인 나비잠', type: BeanType.DECAF, process: null, tastingNote: null },
];

function tastingNoteEquals(
  a: string[] | null,
  b: string[] | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function main(): Promise<void> {
  console.log('=== Seed beans (T005) ===');
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  const orm = app.get(MikroORM);
  const em = orm.em.fork();

  try {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const seed of SEEDS) {
      const existing = await em.findOne(Bean, { name: seed.name });

      if (!existing) {
        const bean = em.create(Bean, {
          name: seed.name,
          type: seed.type,
          process: seed.process,
          tastingNote: seed.tastingNote,
          source: EntitySource.GLOBAL,
          createdBy: null,
        });
        em.persist(bean);
        console.log(`  [INSERT] ${seed.name}`);
        inserted += 1;
        continue;
      }

      const sameType = existing.type === seed.type;
      const sameProcess = existing.process === seed.process;
      const sameTastingNote = tastingNoteEquals(existing.tastingNote, seed.tastingNote);

      if (sameType && sameProcess && sameTastingNote) {
        console.log(`  [SKIP] ${seed.name} (id=${existing.id})`);
        unchanged += 1;
        continue;
      }

      existing.type = seed.type;
      existing.process = seed.process;
      existing.tastingNote = seed.tastingNote;
      console.log(`  [UPDATE] ${seed.name} (id=${existing.id})`);
      updated += 1;
    }

    await em.flush();

    const total = SEEDS.length;
    console.log(
      `\nDone. inserted=${inserted}, updated=${updated}, unchanged=${unchanged}, total=${total}`,
    );
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
