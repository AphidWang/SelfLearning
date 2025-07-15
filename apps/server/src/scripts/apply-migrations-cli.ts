import { execSync } from 'child_process';
import path from 'path';

async function main() {
  console.log('開始執行 migrations...\n');
  
  try {
    const supabasePath = path.join(__dirname, '../../../../supabase');
    process.chdir(supabasePath);
    
    // 執行 supabase db push
    execSync('supabase db push', { stdio: 'inherit' });
    
    console.log('\n✨ 所有 migrations 執行完成');
  } catch (error) {
    console.error('Migration 失敗:', error);
    process.exit(1);
  }
}

main().catch(console.error); 