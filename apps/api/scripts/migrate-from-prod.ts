/**
 * Phase 1 데이터 마이그레이션 — 옛 prod DB → 새 스키마
 *
 * 옛 스키마: cafe / bean(total_amount,remain_amount,roast_date) / consumption(bean_id, amount)
 * 새 스키마: User / Cafe / CafeUser / Bean(totalGrams,remainGrams,roastedOn,...) / Record / RecordBean
 *
 * 가정:
 * - 새 DB에 이미 admin User 1명 + Cafe 1개가 가입 플로우로 생성돼 있음
 * - 모든 옛 데이터는 이 단일 User/Cafe에 귀속 (와이프는 추후 invitation으로 합류)
 *
 * 실행: pnpm --filter @home-coffing/api migrate:prod -- --dry-run
 *       pnpm --filter @home-coffing/api migrate:prod -- --user-id=1 --cafe-id=1 --commit
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

import mysql, { Connection, RowDataPacket } from 'mysql2/promise';

interface Args {
  userId: number;
  cafeId: number;
  commit: boolean;
  dryRun: boolean;
  cafeName: string | null;
}

interface OldCafe extends RowDataPacket {
  id: number;
  name: string;
  created_at: Date;
}

interface OldBean extends RowDataPacket {
  id: number;
  cafe_id: number;
  name: string;
  total_amount: string;
  remain_amount: string;
  ordered_at: Date;
  roast_date: Date;
  arrived_at: Date | null;
  degassing_days: number;
  cups_per_day: string;
  grams_per_cup: string;
  created_at: Date;
}

interface OldConsumption extends RowDataPacket {
  id: number;
  bean_id: number;
  amount: string;
  created_at: Date;
}

const PROD_CONFIG = {
  host: process.env.PROD_DB_HOST ?? '100.103.94.120',
  port: Number(process.env.PROD_DB_PORT ?? 3306),
  user: process.env.PROD_DB_USER ?? 'home_coffing',
  password: process.env.PROD_DB_PASSWORD ?? '',
  database: process.env.PROD_DB_NAME ?? 'home_coffing',
  charset: 'utf8mb4',
};

const LOCAL_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'home_coffing',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'home_coffing',
  charset: 'utf8mb4',
  multipleStatements: false,
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (key: string): string | undefined => {
    const hit = argv.find((a) => a.startsWith(`--${key}=`));
    return hit ? hit.slice(key.length + 3) : undefined;
  };
  const has = (key: string) => argv.includes(`--${key}`);

  return {
    userId: Number(get('user-id') ?? 1),
    cafeId: Number(get('cafe-id') ?? 1),
    commit: has('commit'),
    dryRun: !has('commit'),
    cafeName: get('cafe-name') ?? null,
  };
}

async function main() {
  const args = parseArgs();

  console.log('=== Migration: prod → new schema ===');
  console.log(`Mode: ${args.dryRun ? 'DRY RUN (read only)' : 'COMMIT'}`);
  console.log(`Target user: id=${args.userId}, cafe: id=${args.cafeId}`);

  const prod = await mysql.createConnection(PROD_CONFIG);
  const local = await mysql.createConnection(LOCAL_CONFIG);

  try {
    await ensureTargetExists(local, args);

    const [oldCafes] = await prod.query<OldCafe[]>(
      'SELECT id, name, created_at FROM cafe ORDER BY id',
    );
    const [oldBeans] = await prod.query<OldBean[]>(
      'SELECT id, cafe_id, name, total_amount, remain_amount, ordered_at, roast_date, arrived_at, degassing_days, cups_per_day, grams_per_cup, created_at FROM bean ORDER BY id',
    );
    const [oldConsumptions] = await prod.query<OldConsumption[]>(
      'SELECT id, bean_id, amount, created_at FROM consumption ORDER BY created_at',
    );

    console.log('\n--- prod source ---');
    console.log(`cafe: ${oldCafes.length} rows`);
    console.log(`bean: ${oldBeans.length} rows`);
    console.log(`consumption: ${oldConsumptions.length} rows`);

    if (args.cafeName ?? oldCafes[0]?.name) {
      const newName = args.cafeName ?? oldCafes[0].name;
      if (args.commit) {
        await local.query('UPDATE cafe SET name = ? WHERE id = ?', [
          newName,
          args.cafeId,
        ]);
      }
      console.log(`Cafe name → "${newName}"`);
    }

    const lastConsumptionByBean = new Map<number, Date>();
    for (const consumption of oldConsumptions) {
      const prev = lastConsumptionByBean.get(consumption.bean_id);
      if (!prev || consumption.created_at > prev) {
        lastConsumptionByBean.set(consumption.bean_id, consumption.created_at);
      }
    }

    const beanIdMap = new Map<number, number>();
    console.log('\n--- bean migration ---');
    for (const oldBean of oldBeans) {
      const remain = Number(oldBean.remain_amount);
      const isFinished = remain === 0;
      const finishedAt = isFinished
        ? lastConsumptionByBean.get(oldBean.id) ?? oldBean.created_at
        : null;
      const finishedReason = isFinished ? 'consumed' : null;

      const insertSql = `
        INSERT INTO bean
          (cafe_id, name, total_grams, remain_grams, ordered_at, roasted_on, arrived_at,
           degassing_days, cups_per_day, grams_per_cup, finished_at, finished_reason,
           archived_at, auto_rop_enabled, last_rop_alert_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, NULL, ?)
      `;
      const params = [
        args.cafeId,
        oldBean.name,
        oldBean.total_amount,
        oldBean.remain_amount,
        oldBean.ordered_at,
        oldBean.roast_date,
        oldBean.arrived_at,
        oldBean.degassing_days,
        oldBean.cups_per_day,
        oldBean.grams_per_cup,
        finishedAt,
        finishedReason,
        oldBean.created_at,
      ];

      if (args.commit) {
        const [result] = await local.query(insertSql, params);
        const newId = (result as mysql.ResultSetHeader).insertId;
        beanIdMap.set(oldBean.id, newId);
        console.log(
          `  ${oldBean.id} → ${newId}: ${oldBean.name} (${oldBean.total_amount}/${oldBean.remain_amount}g${
            isFinished ? `, finished@${finishedAt?.toISOString().slice(0, 10)}` : ''
          })`,
        );
      } else {
        beanIdMap.set(oldBean.id, oldBean.id);
        console.log(
          `  [DRY] ${oldBean.id}: ${oldBean.name} (${oldBean.total_amount}/${oldBean.remain_amount}g${
            isFinished ? `, finished@${finishedAt?.toISOString().slice(0, 10)}` : ''
          })`,
        );
      }
    }

    console.log('\n--- consumption → record migration ---');
    let recordCount = 0;
    let skippedCount = 0;
    for (const consumption of oldConsumptions) {
      const newBeanId = beanIdMap.get(consumption.bean_id);
      if (!newBeanId) {
        skippedCount += 1;
        continue;
      }

      if (args.commit) {
        const [recordResult] = await local.query(
          `
            INSERT INTO record
              (cafe_id, user_id, total_grams, cups, brewed_at, logged_at, memo, recipe, taste_note, created_at)
            VALUES (?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, ?)
          `,
          [
            args.cafeId,
            args.userId,
            consumption.amount,
            consumption.created_at,
            consumption.created_at,
            consumption.created_at,
          ],
        );
        const recordId = (recordResult as mysql.ResultSetHeader).insertId;

        await local.query(
          `INSERT INTO record_bean (record_id, bean_id, grams) VALUES (?, ?, ?)`,
          [recordId, newBeanId, consumption.amount],
        );
      }
      recordCount += 1;
    }

    console.log(
      `Records ${args.commit ? 'inserted' : 'would insert'}: ${recordCount}${
        skippedCount > 0 ? ` (skipped: ${skippedCount})` : ''
      }`,
    );

    console.log('\n--- summary ---');
    const [[localBean]] = await local.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n FROM bean WHERE cafe_id = ?',
      [args.cafeId],
    );
    const [[localRecord]] = await local.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n FROM record WHERE cafe_id = ?',
      [args.cafeId],
    );
    const [[localRecordBean]] = await local.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM record_bean record_bean
       JOIN record record ON record_bean.record_id = record.id
       WHERE record.cafe_id = ?`,
      [args.cafeId],
    );
    console.log(`bean (cafe=${args.cafeId}): ${localBean.n}`);
    console.log(`record (cafe=${args.cafeId}): ${localRecord.n}`);
    console.log(`record_bean (cafe=${args.cafeId}): ${localRecordBean.n}`);

    if (args.dryRun) {
      console.log(
        '\n[DRY RUN] no writes committed. Re-run with --commit to apply.',
      );
    } else {
      console.log('\n✅ migration complete.');
    }
  } finally {
    await prod.end();
    await local.end();
  }
}

async function ensureTargetExists(conn: Connection, args: Args): Promise<void> {
  const [[user]] = await conn.query<RowDataPacket[]>(
    'SELECT id FROM user WHERE id = ?',
    [args.userId],
  );
  if (!user) {
    throw new Error(
      `Target user id=${args.userId} not found. Sign up first via POST /auth/signup.`,
    );
  }
  const [[cafe]] = await conn.query<RowDataPacket[]>(
    'SELECT id FROM cafe WHERE id = ?',
    [args.cafeId],
  );
  if (!cafe) {
    throw new Error(`Target cafe id=${args.cafeId} not found.`);
  }
  const [[membership]] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM cafe_user WHERE user_id = ? AND cafe_id = ? AND role = 'admin'`,
    [args.userId, args.cafeId],
  );
  if (!membership) {
    throw new Error(
      `User id=${args.userId} is not admin of cafe id=${args.cafeId}.`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
