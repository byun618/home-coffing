/**
 * migrate-beans-for-005 — T005 Bean backfill (idempotent)
 *
 * 실행:
 *   pnpm --filter @home-coffing/api ts-node src/scripts/migrate-beans-for-005.ts
 *
 * 절차 (재실행 안전):
 *   [1] source CAFE → GLOBAL 일괄 전환 (사용자 입력 path 폐기)
 *   [2] name dedup (case-insensitive, NFC normalize 기준)
 *       — canonical = 같은 이름 그룹에서 id 최소 row
 *       — 잉여 Bean을 참조하는 CafeBean.bean_id를 canonical로 rewire
 *       — 잉여 Bean DELETE
 *   [3] type 추정 (column add 시 default 'single'을 명시 분류)
 *       — name "디카페인"|"decaf" → 'decaf'
 *       — name "블렌드"|"blend"  → 'blend' (decaf가 우선)
 *       — 그 외 → 'single' (default 유지)
 *
 * 멱등성: step 1은 CAFE row 0이면 변화 0,
 *         step 2는 group 0이면 변화 0,
 *         step 3는 추정 결과가 이미 박혀 있으면 UPDATE 0건.
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '../../../../.env') });

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { mikroOrmConfig } from '../mikro-orm.config';
import { Bean, CafeBean, BeanType, EntitySource } from '../common/entities';

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig)],
})
class MigrateModule {}

function normalizeName(name: string): string {
  return name.normalize('NFC').toLowerCase();
}

function inferType(name: string): BeanType {
  const lower = name.toLowerCase();
  if (lower.includes('디카페인') || lower.includes('decaf')) {
    return BeanType.DECAF;
  }
  if (lower.includes('블렌드') || lower.includes('blend')) {
    return BeanType.BLEND;
  }
  return BeanType.SINGLE;
}

interface Step1Result {
  converted: number;
}

async function step1ConvertSource(em: EntityManager): Promise<Step1Result> {
  const targets = await em.find(Bean, { source: EntitySource.CAFE });
  for (const bean of targets) {
    bean.source = EntitySource.GLOBAL;
  }
  await em.flush();
  return { converted: targets.length };
}

interface Step2Result {
  groups: number;
  cafeBeansRewired: number;
  beansDeleted: number;
}

async function step2Dedup(em: EntityManager): Promise<Step2Result> {
  const beans = await em.find(
    Bean,
    {},
    { orderBy: { name: 'asc', id: 'asc' } },
  );

  const groups = new Map<string, Bean[]>();
  for (const bean of beans) {
    const key = normalizeName(bean.name);
    const existing = groups.get(key);
    if (existing) {
      existing.push(bean);
    } else {
      groups.set(key, [bean]);
    }
  }

  let dedupGroups = 0;
  let cafeBeansRewired = 0;
  let beansDeleted = 0;

  for (const [, beanGroup] of groups) {
    if (beanGroup.length < 2) continue;
    dedupGroups += 1;

    // id 오름차순으로 정렬되어 있음 (find orderBy 보장)
    const [canonical, ...redundant] = beanGroup;
    const redundantIds = redundant.map((b) => b.id);

    const cafeBeans = await em.find(CafeBean, { bean: { $in: redundantIds } });
    for (const cafeBean of cafeBeans) {
      cafeBean.bean = canonical;
      cafeBeansRewired += 1;
    }
    await em.flush();

    for (const dupe of redundant) {
      em.remove(dupe);
      beansDeleted += 1;
    }
    await em.flush();
  }

  return { groups: dedupGroups, cafeBeansRewired, beansDeleted };
}

interface Step3Result {
  blend: number;
  decaf: number;
  single: number;
  updated: number;
}

async function step3InferType(em: EntityManager): Promise<Step3Result> {
  const beans = await em.find(Bean, {});
  let blend = 0;
  let decaf = 0;
  let single = 0;
  let updated = 0;

  for (const bean of beans) {
    const inferred = inferType(bean.name);
    switch (inferred) {
      case BeanType.DECAF:
        decaf += 1;
        break;
      case BeanType.BLEND:
        blend += 1;
        break;
      case BeanType.SINGLE:
        single += 1;
        break;
    }
    if (bean.type !== inferred) {
      bean.type = inferred;
      updated += 1;
    }
  }
  await em.flush();

  return { blend, decaf, single, updated };
}

async function main(): Promise<void> {
  console.log('=== Migrate beans for T005 ===');
  const app = await NestFactory.createApplicationContext(MigrateModule, {
    logger: ['error', 'warn'],
  });
  const orm = app.get(MikroORM);
  const em = orm.em.fork();

  try {
    const r1 = await step1ConvertSource(em);
    console.log(`[1] source CAFE→GLOBAL: ${r1.converted} row(s)`);

    const r2 = await step2Dedup(em);
    console.log(
      `[2] dedup groups=${r2.groups}, cafeBeans rewired=${r2.cafeBeansRewired}, beans deleted=${r2.beansDeleted}`,
    );

    const r3 = await step3InferType(em);
    console.log(
      `[3] type inferred — blend=${r3.blend}, decaf=${r3.decaf}, single=${r3.single} (updated=${r3.updated})`,
    );

    console.log('\n=== Summary ===');
    console.log(`  source converted    : ${r1.converted}`);
    console.log(`  dedup groups        : ${r2.groups}`);
    console.log(`  cafeBeans rewired   : ${r2.cafeBeansRewired}`);
    console.log(`  beans deleted       : ${r2.beansDeleted}`);
    console.log(`  type updates        : ${r3.updated}`);
    console.log('Done.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
