import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

import { defineConfig } from '@mikro-orm/mysql';

const mikroOrmConfig = defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  dbName: process.env.DB_NAME || 'home_coffing',
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  debug: process.env.NODE_ENV !== 'production',
  schemaGenerator: {
    disableForeignKeys: false,
  },
});

export { mikroOrmConfig };
export default mikroOrmConfig;
