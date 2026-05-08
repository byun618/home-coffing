/**
 * Backfill 002 — Catalog/Instance 분리 (dev-plan §3 참조)
 *
 * 실행 절차 (사용자 수동):
 *   1) Step A SQL을 mysql 클라이언트로 실행 (ADD/CREATE only — 데이터 보존)
 *   2) DB dump 백업 (mysqldump)
 *   3) 본 스크립트 --dry-run 실행 → 로그 검토
 *        pnpm --filter @home-coffing/api ts-node src/scripts/backfill-002.ts --dry-run
 *   4) 본 스크립트 --execute 실행
 *        pnpm --filter @home-coffing/api ts-node src/scripts/backfill-002.ts --execute
 *   5) Step C SQL 실행 (DROP/RENAME — backfill 완료 후라야 안전)
 *
 *   모든 SQL/스크립트 실행은 사용자가 직접 수행. 자동화 X.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Step A SQL (ADD/CREATE only — backfill 전에 실행)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SET names utf8mb4;
 *
 * -- 신규 테이블 5개 (Recipe, TasteNote, CafeEquipment, RecordEquipment, CafeBean)
 * CREATE TABLE `recipe` (
 *   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 *   `name` VARCHAR(120) NOT NULL,
 *   `method` ENUM('v60','switch','espresso','moka','aeropress','french_press','other') NOT NULL,
 *   `params` JSON NULL,
 *   `source` ENUM('cafe','global') NOT NULL,
 *   `created_by_id` INT UNSIGNED NULL,
 *   `created_at` DATETIME NOT NULL
 * ) DEFAULT CHARACTER SET utf8mb4 ENGINE = InnoDB;
 * ALTER TABLE `recipe` ADD INDEX `recipe_created_by_id_index`(`created_by_id`);
 * ALTER TABLE `recipe` ADD CONSTRAINT `recipe_created_by_id_foreign`
 *   FOREIGN KEY (`created_by_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE ON DELETE SET NULL;
 *
 * CREATE TABLE `taste_note` (
 *   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 *   `record_id` INT UNSIGNED NOT NULL,
 *   `author_id` INT UNSIGNED NOT NULL,
 *   `rating` DECIMAL(3,1) NULL,
 *   `memo` VARCHAR(200) NULL,
 *   `created_at` DATETIME NOT NULL
 * ) DEFAULT CHARACTER SET utf8mb4 ENGINE = InnoDB;
 * ALTER TABLE `taste_note` ADD INDEX `taste_note_record_id_index`(`record_id`);
 * ALTER TABLE `taste_note` ADD INDEX `taste_note_author_id_index`(`author_id`);
 * ALTER TABLE `taste_note` ADD CONSTRAINT `taste_note_record_id_foreign`
 *   FOREIGN KEY (`record_id`) REFERENCES `record` (`id`) ON UPDATE CASCADE ON DELETE CASCADE;
 * ALTER TABLE `taste_note` ADD CONSTRAINT `taste_note_author_id_foreign`
 *   FOREIGN KEY (`author_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;
 *
 * CREATE TABLE `cafe_equipment` (
 *   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 *   `cafe_id` INT UNSIGNED NOT NULL,
 *   `equipment_id` INT UNSIGNED NOT NULL,
 *   `created_at` DATETIME NOT NULL
 * ) DEFAULT CHARACTER SET utf8mb4 ENGINE = InnoDB;
 * ALTER TABLE `cafe_equipment` ADD INDEX `cafe_equipment_cafe_id_index`(`cafe_id`);
 * ALTER TABLE `cafe_equipment` ADD INDEX `cafe_equipment_equipment_id_index`(`equipment_id`);
 * ALTER TABLE `cafe_equipment` ADD CONSTRAINT `cafe_equipment_cafe_id_foreign`
 *   FOREIGN KEY (`cafe_id`) REFERENCES `cafe` (`id`) ON UPDATE CASCADE ON DELETE CASCADE;
 * ALTER TABLE `cafe_equipment` ADD CONSTRAINT `cafe_equipment_equipment_id_foreign`
 *   FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT;
 *
 * CREATE TABLE `record_equipment` (
 *   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 *   `record_id` INT UNSIGNED NOT NULL,
 *   `cafe_equipment_id` INT UNSIGNED NOT NULL
 * ) DEFAULT CHARACTER SET utf8mb4 ENGINE = InnoDB;
 * ALTER TABLE `record_equipment` ADD INDEX `record_equipment_record_id_index`(`record_id`);
 * ALTER TABLE `record_equipment` ADD INDEX `record_equipment_cafe_equipment_id_index`(`cafe_equipment_id`);
 * ALTER TABLE `record_equipment` ADD UNIQUE `record_equipment_record_id_cafe_equipment_id_unique`(`record_id`, `cafe_equipment_id`);
 * ALTER TABLE `record_equipment` ADD CONSTRAINT `record_equipment_record_id_foreign`
 *   FOREIGN KEY (`record_id`) REFERENCES `record` (`id`) ON UPDATE CASCADE ON DELETE CASCADE;
 * ALTER TABLE `record_equipment` ADD CONSTRAINT `record_equipment_cafe_equipment_id_foreign`
 *   FOREIGN KEY (`cafe_equipment_id`) REFERENCES `cafe_equipment` (`id`) ON UPDATE CASCADE;
 *
 * CREATE TABLE `cafe_bean` (
 *   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 *   `cafe_id` INT UNSIGNED NOT NULL,
 *   `bean_id` INT UNSIGNED NOT NULL,
 *   `total_grams` DECIMAL(10,1) NOT NULL,
 *   `remain_grams` DECIMAL(10,1) NOT NULL,
 *   `ordered_at` DATE NOT NULL,
 *   `roasted_on` DATE NOT NULL,
 *   `arrived_at` DATE NULL,
 *   `degassing_days` INT NOT NULL DEFAULT 7,
 *   `cups_per_day` DECIMAL(10,2) NOT NULL DEFAULT 2,
 *   `grams_per_cup` DECIMAL(10,2) NOT NULL DEFAULT 20,
 *   `auto_rop_enabled` TINYINT(1) NOT NULL DEFAULT 1,
 *   `finished_at` VARCHAR(255) NULL,
 *   `finished_reason` ENUM('consumed','discarded') NULL,
 *   `archived_at` VARCHAR(255) NULL,
 *   `last_rop_alert_at` VARCHAR(255) NULL,
 *   `created_at` DATETIME NOT NULL
 * ) DEFAULT CHARACTER SET utf8mb4 ENGINE = InnoDB;
 * ALTER TABLE `cafe_bean` ADD INDEX `cafe_bean_cafe_id_index`(`cafe_id`);
 * ALTER TABLE `cafe_bean` ADD INDEX `cafe_bean_bean_id_index`(`bean_id`);
 * ALTER TABLE `cafe_bean` ADD CONSTRAINT `cafe_bean_cafe_id_foreign`
 *   FOREIGN KEY (`cafe_id`) REFERENCES `cafe` (`id`) ON UPDATE CASCADE ON DELETE CASCADE;
 * ALTER TABLE `cafe_bean` ADD CONSTRAINT `cafe_bean_bean_id_foreign`
 *   FOREIGN KEY (`bean_id`) REFERENCES `bean` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT;
 *
 * -- 기존 테이블에 컬럼 ADD (nullable 또는 NOT NULL with default)
 * ALTER TABLE `roaster`
 *   ADD COLUMN `country` VARCHAR(60) NULL,
 *   ADD COLUMN `source` ENUM('cafe','global') NOT NULL DEFAULT 'cafe',
 *   ADD COLUMN `created_by_id` INT UNSIGNED NULL;
 * ALTER TABLE `roaster` ADD INDEX `roaster_created_by_id_index`(`created_by_id`);
 * ALTER TABLE `roaster` ADD CONSTRAINT `roaster_created_by_id_foreign`
 *   FOREIGN KEY (`created_by_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE ON DELETE SET NULL;
 *
 * ALTER TABLE `bean`
 *   ADD COLUMN `process` VARCHAR(60) NULL,
 *   ADD COLUMN `roast_level` VARCHAR(30) NULL,
 *   ADD COLUMN `source` ENUM('cafe','global') NOT NULL DEFAULT 'cafe',
 *   ADD COLUMN `created_by_id` INT UNSIGNED NULL;
 * ALTER TABLE `bean` ADD INDEX `bean_created_by_id_index`(`created_by_id`);
 * ALTER TABLE `bean` ADD CONSTRAINT `bean_created_by_id_foreign`
 *   FOREIGN KEY (`created_by_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE ON DELETE SET NULL;
 *
 * ALTER TABLE `equipment`
 *   ADD COLUMN `brand` VARCHAR(60) NULL,
 *   ADD COLUMN `model` VARCHAR(80) NULL,
 *   ADD COLUMN `source` ENUM('cafe','global') NOT NULL DEFAULT 'cafe',
 *   ADD COLUMN `created_by_id` INT UNSIGNED NULL;
 * ALTER TABLE `equipment` ADD INDEX `equipment_created_by_id_index`(`created_by_id`);
 * ALTER TABLE `equipment` ADD CONSTRAINT `equipment_created_by_id_foreign`
 *   FOREIGN KEY (`created_by_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE ON DELETE SET NULL;
 *
 * ALTER TABLE `record`
 *   ADD COLUMN `recipe_id` INT UNSIGNED NULL;
 * ALTER TABLE `record` ADD INDEX `record_recipe_id_index`(`recipe_id`);
 * ALTER TABLE `record` ADD CONSTRAINT `record_recipe_id_foreign`
 *   FOREIGN KEY (`recipe_id`) REFERENCES `recipe` (`id`) ON UPDATE CASCADE ON DELETE SET NULL;
 *
 * -- record_bean: cafe_bean_id를 nullable로 추가 (기존 bean_id 컬럼은 Step A에서는 유지)
 * ALTER TABLE `record_bean`
 *   ADD COLUMN `cafe_bean_id` INT UNSIGNED NULL;
 * ALTER TABLE `record_bean` ADD INDEX `record_bean_cafe_bean_id_index`(`cafe_bean_id`);
 * ALTER TABLE `record_bean` ADD CONSTRAINT `record_bean_cafe_bean_id_foreign`
 *   FOREIGN KEY (`cafe_bean_id`) REFERENCES `cafe_bean` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT;
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Step C SQL (backfill --execute 완료 후 실행 — DROP/RENAME)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * -- bean: cafe-scoped 컬럼 모두 DROP
 * ALTER TABLE `bean` DROP FOREIGN KEY `bean_cafe_id_foreign`;
 * ALTER TABLE `bean` DROP INDEX `bean_cafe_id_index`;
 * ALTER TABLE `bean`
 *   DROP COLUMN `cafe_id`,
 *   DROP COLUMN `total_grams`,
 *   DROP COLUMN `remain_grams`,
 *   DROP COLUMN `ordered_at`,
 *   DROP COLUMN `roasted_on`,
 *   DROP COLUMN `arrived_at`,
 *   DROP COLUMN `degassing_days`,
 *   DROP COLUMN `cups_per_day`,
 *   DROP COLUMN `grams_per_cup`,
 *   DROP COLUMN `finished_at`,
 *   DROP COLUMN `finished_reason`,
 *   DROP COLUMN `archived_at`,
 *   DROP COLUMN `auto_rop_enabled`,
 *   DROP COLUMN `last_rop_alert_at`;
 *
 * -- equipment: cafe_id DROP
 * ALTER TABLE `equipment` DROP FOREIGN KEY `equipment_cafe_id_foreign`;
 * ALTER TABLE `equipment` DROP INDEX `equipment_cafe_id_index`;
 * ALTER TABLE `equipment` DROP COLUMN `cafe_id`;
 *
 * -- record: 폐기 컬럼 DROP
 * ALTER TABLE `record`
 *   DROP COLUMN `total_grams`,
 *   DROP COLUMN `cups`,
 *   DROP COLUMN `recipe`,
 *   DROP COLUMN `taste_note`;
 *
 * -- record_bean: 옛 bean_id 정리, cafe_bean_id NOT NULL + unique 재설정
 * ALTER TABLE `record_bean` DROP FOREIGN KEY `record_bean_bean_id_foreign`;
 * ALTER TABLE `record_bean` DROP INDEX `record_bean_bean_id_index`;
 * ALTER TABLE `record_bean` DROP INDEX `record_bean_record_id_bean_id_unique`;
 * ALTER TABLE `record_bean` DROP COLUMN `bean_id`;
 * ALTER TABLE `record_bean` MODIFY COLUMN `cafe_bean_id` INT UNSIGNED NOT NULL;
 * ALTER TABLE `record_bean` ADD UNIQUE `record_bean_record_id_cafe_bean_id_unique`(`record_id`, `cafe_bean_id`);
 *
 * -- (선택) Step A에서 NOT NULL DEFAULT로 추가한 source 컬럼의 기본값 제거 (스키마 정리)
 * --   → ORM 산출 schema는 default 없음. 003+ schema:update 실행 시 자동 정렬됨. 필수 아님.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 본 스크립트 동작 (Step B)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 한 트랜잭션으로 다음을 수행:
 *   1) 기존 Bean row 자체를 글로벌화로 reuse: source='cafe', created_by_id = cafe admin
 *   2) 그 bean을 참조하는 CafeBean row 신규 INSERT (cafe_id, bean_id, totalGrams 등 복사)
 *   3) 기존 Equipment row reuse + CafeEquipment row 신규 INSERT
 *   4) Roaster: source='cafe' UPDATE (createdBy는 null)
 *   5) RecordBean.cafe_bean_id 채우기 (Map[bean_id] → cafeBean.id)
 *   6) Record.taste_note JSON → TasteNote row 변환 (author=record.user, createdAt=record.brewedAt)
 *
 * Record.recipe JSON / Record.totalGrams / Record.cups는 손대지 않음 (Step C에서 DROP).
 *
 * 검증 SELECT (트랜잭션 마지막):
 *   - COUNT(cafe_bean) === 사전 Bean count
 *   - COUNT(cafe_equipment) === 사전 Equipment count
 *   - COUNT(record_bean WHERE cafe_bean_id IS NULL) === 0
 *   - COUNT(taste_note) === 사전 Record(taste_note IS NOT NULL) count
 * 검증 실패 시 throw → rollback.
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '../../../../.env') });

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { mikroOrmConfig } from '../mikro-orm.config';

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig)],
})
class BackfillModule {}

interface Args {
  dryRun: boolean;
}

interface OldBeanRow {
  id: number;
  cafe_id: number;
  total_grams: string | number;
  remain_grams: string | number;
  ordered_at: Date | string;
  roasted_on: Date | string;
  arrived_at: Date | string | null;
  degassing_days: number;
  cups_per_day: string | number;
  grams_per_cup: string | number;
  auto_rop_enabled: number | boolean;
  finished_at: string | Date | null;
  finished_reason: 'consumed' | 'discarded' | null;
  archived_at: string | Date | null;
  last_rop_alert_at: string | Date | null;
  created_at: Date;
}

interface OldEquipmentRow {
  id: number;
  cafe_id: number;
  created_at: Date;
}

interface RecordWithTasteNote {
  id: number;
  user_id: number;
  brewed_at: Date;
  taste_note: string | null;
}

interface CountRow {
  n: number | string;
}

interface CafeAdminRow {
  cafe_id: number;
  user_id: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const dryRun = !argv.includes('--execute');
  if (!dryRun && argv.includes('--dry-run')) {
    throw new Error('Cannot pass both --execute and --dry-run.');
  }
  return { dryRun };
}

function num(value: string | number): number {
  return typeof value === 'string' ? Number(value) : value;
}

function toIsoOrNull(value: Date | string | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

interface ParsedTasteNote {
  text: string;
  rating: number | null;
}

function parseTasteNoteJson(raw: string): ParsedTasteNote | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const text = typeof obj.text === 'string' ? obj.text : '';
  const ratingRaw = obj.rating;
  const rating =
    typeof ratingRaw === 'number' && Number.isFinite(ratingRaw)
      ? ratingRaw
      : null;
  if (text === '' && rating === null) return null;
  return { text, rating };
}

async function buildCafeAdminMap(
  em: EntityManager,
): Promise<Map<number, number | null>> {
  const rows = await em.getConnection().execute<CafeAdminRow[]>(
    `SELECT cafe_user.cafe_id AS cafe_id, cafe_user.user_id AS user_id
     FROM cafe_user
     WHERE cafe_user.role = 'admin'
     ORDER BY cafe_user.cafe_id, cafe_user.joined_at ASC, cafe_user.id ASC`,
  );
  const map = new Map<number, number | null>();
  for (const row of rows) {
    if (!map.has(row.cafe_id)) {
      map.set(row.cafe_id, row.user_id);
    }
  }

  const memberRows = await em.getConnection().execute<CafeAdminRow[]>(
    `SELECT cafe_user.cafe_id AS cafe_id, cafe_user.user_id AS user_id
     FROM cafe_user
     ORDER BY cafe_user.cafe_id, cafe_user.joined_at ASC, cafe_user.id ASC`,
  );
  for (const row of memberRows) {
    if (!map.has(row.cafe_id)) {
      map.set(row.cafe_id, row.user_id);
    }
  }
  return map;
}

async function backfillBeans(
  em: EntityManager,
  args: Args,
  cafeAdminMap: Map<number, number | null>,
): Promise<{ beanIdToCafeBeanId: Map<number, number>; preCount: number }> {
  const beans = await em.getConnection().execute<OldBeanRow[]>(
    `SELECT bean.id, bean.cafe_id, bean.total_grams, bean.remain_grams,
            bean.ordered_at, bean.roasted_on, bean.arrived_at,
            bean.degassing_days, bean.cups_per_day, bean.grams_per_cup,
            bean.auto_rop_enabled,
            bean.finished_at, bean.finished_reason, bean.archived_at,
            bean.last_rop_alert_at, bean.created_at
     FROM bean
     ORDER BY bean.id`,
  );
  console.log(`Step 1/6: Bean reuse + CafeBean INSERT — ${beans.length} rows`);

  const beanIdToCafeBeanId = new Map<number, number>();

  for (const bean of beans) {
    const adminUserId = cafeAdminMap.get(bean.cafe_id) ?? null;

    const updateBeanSql = `UPDATE bean SET source = 'cafe', created_by_id = ? WHERE id = ?`;
    const updateBeanParams = [adminUserId, bean.id];

    const insertCafeBeanSql = `
      INSERT INTO cafe_bean
        (cafe_id, bean_id, total_grams, remain_grams,
         ordered_at, roasted_on, arrived_at,
         degassing_days, cups_per_day, grams_per_cup,
         auto_rop_enabled, finished_at, finished_reason,
         archived_at, last_rop_alert_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertCafeBeanParams = [
      bean.cafe_id,
      bean.id,
      bean.total_grams,
      bean.remain_grams,
      bean.ordered_at,
      bean.roasted_on,
      bean.arrived_at,
      bean.degassing_days,
      num(bean.cups_per_day),
      num(bean.grams_per_cup),
      bean.auto_rop_enabled ? 1 : 0,
      toIsoOrNull(bean.finished_at),
      bean.finished_reason,
      toIsoOrNull(bean.archived_at),
      toIsoOrNull(bean.last_rop_alert_at),
      bean.created_at,
    ];

    if (args.dryRun) {
      console.log(
        `  [DRY] bean.id=${bean.id} cafe_id=${bean.cafe_id} → reuse + cafe_bean(total=${bean.total_grams}, remain=${bean.remain_grams})`,
      );
      // dry-run에선 cafe_bean.id를 알 수 없음 → 가짜 id (bean.id)로 매핑하여 후속 step UPDATE만 시뮬레이션
      beanIdToCafeBeanId.set(bean.id, bean.id);
      continue;
    }

    await em.getConnection().execute(updateBeanSql, updateBeanParams);
    const insertResult = await em
      .getConnection()
      .execute<{ insertId: number; affectedRows: number }>(
        insertCafeBeanSql,
        insertCafeBeanParams,
        'run',
      );
    const newCafeBeanId = insertResult.insertId;
    beanIdToCafeBeanId.set(bean.id, newCafeBeanId);
    console.log(
      `  bean.id=${bean.id} → cafe_bean.id=${newCafeBeanId} (cafe_id=${bean.cafe_id}, admin=${adminUserId ?? 'null'})`,
    );
  }

  return { beanIdToCafeBeanId, preCount: beans.length };
}

async function backfillEquipments(
  em: EntityManager,
  args: Args,
  cafeAdminMap: Map<number, number | null>,
): Promise<{ preCount: number }> {
  const equipments = await em.getConnection().execute<OldEquipmentRow[]>(
    `SELECT equipment.id, equipment.cafe_id, equipment.created_at
     FROM equipment
     ORDER BY equipment.id`,
  );
  console.log(
    `Step 2/6: Equipment reuse + CafeEquipment INSERT — ${equipments.length} rows`,
  );

  for (const equipment of equipments) {
    const adminUserId = cafeAdminMap.get(equipment.cafe_id) ?? null;
    const updateEquipmentSql = `UPDATE equipment SET source = 'cafe', created_by_id = ? WHERE id = ?`;
    const insertCafeEquipmentSql = `
      INSERT INTO cafe_equipment (cafe_id, equipment_id, created_at)
      VALUES (?, ?, ?)
    `;

    if (args.dryRun) {
      console.log(
        `  [DRY] equipment.id=${equipment.id} cafe_id=${equipment.cafe_id} → reuse + cafe_equipment INSERT`,
      );
      continue;
    }

    await em
      .getConnection()
      .execute(updateEquipmentSql, [adminUserId, equipment.id]);
    await em
      .getConnection()
      .execute(insertCafeEquipmentSql, [
        equipment.cafe_id,
        equipment.id,
        equipment.created_at,
      ]);
    console.log(
      `  equipment.id=${equipment.id} → cafe_equipment INSERT (cafe_id=${equipment.cafe_id})`,
    );
  }

  return { preCount: equipments.length };
}

async function backfillRoasters(
  em: EntityManager,
  args: Args,
): Promise<void> {
  const roasterCountRows = await em
    .getConnection()
    .execute<CountRow[]>(`SELECT COUNT(*) AS n FROM roaster`);
  const roasterCount = Number(roasterCountRows[0]?.n ?? 0);
  console.log(`Step 3/6: Roaster source='cafe' UPDATE — ${roasterCount} rows`);

  if (args.dryRun) {
    console.log(`  [DRY] UPDATE roaster SET source='cafe' (createdBy left null)`);
    return;
  }
  await em
    .getConnection()
    .execute(`UPDATE roaster SET source = 'cafe' WHERE source IS NULL OR source <> 'cafe'`);
}

async function backfillRecordBeans(
  em: EntityManager,
  args: Args,
  beanIdToCafeBeanId: Map<number, number>,
): Promise<void> {
  const recordBeans = await em
    .getConnection()
    .execute<{ id: number; bean_id: number }[]>(
      `SELECT record_bean.id, record_bean.bean_id FROM record_bean ORDER BY record_bean.id`,
    );
  console.log(
    `Step 4/6: RecordBean.cafe_bean_id rewire — ${recordBeans.length} rows`,
  );

  let missing = 0;
  for (const recordBean of recordBeans) {
    const cafeBeanId = beanIdToCafeBeanId.get(recordBean.bean_id);
    if (cafeBeanId === undefined) {
      missing += 1;
      console.warn(
        `  [WARN] record_bean.id=${recordBean.id} bean_id=${recordBean.bean_id} → no mapping (orphan)`,
      );
      continue;
    }
    if (args.dryRun) {
      console.log(
        `  [DRY] record_bean.id=${recordBean.id} bean_id=${recordBean.bean_id} → cafe_bean_id=${cafeBeanId}`,
      );
      continue;
    }
    await em
      .getConnection()
      .execute(`UPDATE record_bean SET cafe_bean_id = ? WHERE id = ?`, [
        cafeBeanId,
        recordBean.id,
      ]);
  }
  if (missing > 0) {
    throw new Error(
      `RecordBean rewire incomplete: ${missing} rows without mapping. Aborting.`,
    );
  }
}

async function backfillTasteNotes(
  em: EntityManager,
  args: Args,
): Promise<{ preCount: number }> {
  const records = await em.getConnection().execute<RecordWithTasteNote[]>(
    `SELECT record.id, record.user_id, record.brewed_at, record.taste_note
     FROM record
     WHERE record.taste_note IS NOT NULL
     ORDER BY record.id`,
  );
  console.log(
    `Step 5/6: Record.taste_note JSON → TasteNote row — ${records.length} rows`,
  );

  let inserted = 0;
  for (const record of records) {
    if (record.taste_note === null) continue;
    const rawString =
      typeof record.taste_note === 'string'
        ? record.taste_note
        : JSON.stringify(record.taste_note);
    const parsed = parseTasteNoteJson(rawString);
    if (parsed === null) {
      console.warn(
        `  [WARN] record.id=${record.id} taste_note JSON unparseable or empty — skipping`,
      );
      continue;
    }
    if (args.dryRun) {
      console.log(
        `  [DRY] record.id=${record.id} → taste_note(text="${parsed.text.slice(0, 30)}", rating=${parsed.rating ?? 'null'})`,
      );
      inserted += 1;
      continue;
    }
    await em.getConnection().execute(
      `INSERT INTO taste_note (record_id, author_id, rating, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.user_id, parsed.rating, parsed.text, record.brewed_at],
    );
    inserted += 1;
  }

  return { preCount: inserted };
}

async function verify(
  em: EntityManager,
  args: Args,
  expected: { beans: number; equipments: number; tasteNotes: number },
): Promise<void> {
  console.log(`Step 6/6: Verification`);
  if (args.dryRun) {
    console.log('  [DRY] verification skipped (no writes performed)');
    return;
  }

  const cafeBeanCountRows = await em
    .getConnection()
    .execute<CountRow[]>(`SELECT COUNT(*) AS n FROM cafe_bean`);
  const cafeBeanCount = Number(cafeBeanCountRows[0]?.n ?? 0);
  if (cafeBeanCount !== expected.beans) {
    throw new Error(
      `Verify failed: cafe_bean count=${cafeBeanCount} expected=${expected.beans}`,
    );
  }
  console.log(`  cafe_bean count=${cafeBeanCount} (expected ${expected.beans}) OK`);

  const cafeEquipmentCountRows = await em
    .getConnection()
    .execute<CountRow[]>(`SELECT COUNT(*) AS n FROM cafe_equipment`);
  const cafeEquipmentCount = Number(cafeEquipmentCountRows[0]?.n ?? 0);
  if (cafeEquipmentCount !== expected.equipments) {
    throw new Error(
      `Verify failed: cafe_equipment count=${cafeEquipmentCount} expected=${expected.equipments}`,
    );
  }
  console.log(
    `  cafe_equipment count=${cafeEquipmentCount} (expected ${expected.equipments}) OK`,
  );

  const recordBeanNullRows = await em
    .getConnection()
    .execute<CountRow[]>(
      `SELECT COUNT(*) AS n FROM record_bean WHERE cafe_bean_id IS NULL`,
    );
  const recordBeanNullCount = Number(recordBeanNullRows[0]?.n ?? 0);
  if (recordBeanNullCount !== 0) {
    throw new Error(
      `Verify failed: record_bean.cafe_bean_id NULL rows=${recordBeanNullCount}`,
    );
  }
  console.log(`  record_bean.cafe_bean_id NULL count=0 OK`);

  const tasteNoteCountRows = await em
    .getConnection()
    .execute<CountRow[]>(`SELECT COUNT(*) AS n FROM taste_note`);
  const tasteNoteCount = Number(tasteNoteCountRows[0]?.n ?? 0);
  if (tasteNoteCount !== expected.tasteNotes) {
    throw new Error(
      `Verify failed: taste_note count=${tasteNoteCount} expected=${expected.tasteNotes}`,
    );
  }
  console.log(
    `  taste_note count=${tasteNoteCount} (expected ${expected.tasteNotes}) OK`,
  );
}

async function main(): Promise<void> {
  const args = parseArgs();

  console.log('=== Backfill 002 — Catalog/Instance 분리 ===');
  console.log(`Mode: ${args.dryRun ? 'DRY RUN (no writes)' : 'EXECUTE (writes)'}`);

  const app = await NestFactory.createApplicationContext(BackfillModule, {
    logger: ['error', 'warn'],
  });
  const orm = app.get(MikroORM);
  const em = orm.em.fork();

  try {
    await em.transactional(async (txEm) => {
      const cafeAdminMap = await buildCafeAdminMap(txEm);
      console.log(
        `\nCafe admin map built: ${cafeAdminMap.size} cafes\n`,
      );

      const { beanIdToCafeBeanId, preCount: beanPreCount } =
        await backfillBeans(txEm, args, cafeAdminMap);
      const { preCount: equipmentPreCount } = await backfillEquipments(
        txEm,
        args,
        cafeAdminMap,
      );
      await backfillRoasters(txEm, args);
      await backfillRecordBeans(txEm, args, beanIdToCafeBeanId);
      const { preCount: tasteNotePreCount } = await backfillTasteNotes(
        txEm,
        args,
      );

      await verify(txEm, args, {
        beans: beanPreCount,
        equipments: equipmentPreCount,
        tasteNotes: tasteNotePreCount,
      });

      if (args.dryRun) {
        console.log(
          '\n[DRY RUN] rolling back transaction (no writes committed).',
        );
        throw new DryRunRollback();
      }
    });

    console.log('\n✅ Backfill 002 complete.');
  } catch (err) {
    if (err instanceof DryRunRollback) {
      console.log('\n[DRY RUN] complete. Re-run with --execute to commit.');
    } else {
      console.error('\n❌ Backfill 002 failed — transaction rolled back.');
      console.error(err);
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

class DryRunRollback extends Error {
  constructor() {
    super('dry-run rollback');
    this.name = 'DryRunRollback';
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
