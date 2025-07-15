import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// 載入環境變數
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// 從 Supabase URL 建立 PostgreSQL 連線字串
const supabaseUrl = process.env.SUPABASE_URL;
const dbPassword = process.env.SUPABASE_PASSWORD;

if (!supabaseUrl) throw new Error('SUPABASE_URL is required');
if (!dbPassword) throw new Error('SUPABASE_PASSWORD is required');

const projectId = supabaseUrl.split('.')[0].split('//')[1];
const dbHost = `db.${projectId}.supabase.co`;
const connectionString = `postgresql://postgres:${dbPassword}@${dbHost}:5432/postgres`;

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
});

async function applyMigration(filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`執行 migration: ${path.basename(filePath)}`);

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Migration 成功: ${path.basename(filePath)}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration 失敗: ${path.basename(filePath)}`);
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  console.log('開始執行 migrations...\n');
  
  try {
    await client.connect();
    
    const migrationsDir = path.join(__dirname, '../../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();  // 按檔名排序
    
    for (const file of files) {
      await applyMigration(path.join(migrationsDir, file));
    }
    
    console.log('\n✨ 所有 migrations 執行完成');
  } catch (error) {
    console.error('連線失敗:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error); 