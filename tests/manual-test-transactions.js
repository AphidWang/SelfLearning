const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 從 temp-token.json 讀取認證信息
let authData;
try {
  authData = JSON.parse(fs.readFileSync('temp-token.json', 'utf8'));
} catch (error) {
  console.error('❌ 無法讀取認證文件，請先執行：node tests/test-login.js');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dhqjpogfrtnpksrfmtsp.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocWpwb2dmcnRucGtzcmZtdHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3ODg5NjYsImV4cCI6MjA0ODM2NDk2Nn0.0ww9p-ufm2aVEQfzBHvr6-UNOPSSPYbcGp8KwLMslgs'
);

// 設置認證
supabase.auth.setSession({
  access_token: authData.access_token,
  refresh_token: authData.refresh_token
});

async function testTaskActions() {
  console.log('🧪 開始測試任務動作 transactions...\n');

  try {
    // 1. 找到測試任務
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('title', '趕快把系統修好')
      .limit(1);

    if (tasksError || !tasks.length) {
      console.error('❌ 找不到測試任務');
      return;
    }

    const task = tasks[0];
    console.log('✅ 找到測試任務:', task.title);
    console.log('📊 當前進度:', task.progress_data);

    // 2. 測試今天是否已經打卡
    const today = new Date().toISOString().split('T')[0];
    const isCheckedInToday = (task.progress_data?.check_in_dates || []).includes(today);
    
    if (isCheckedInToday) {
      console.log('⚠️  今天已經打卡，測試取消打卡功能...');
      
      // 測試取消打卡
      const { data: cancelResult, error: cancelError } = await supabase.rpc(
        'cancel_today_check_in_transaction', 
        {
          p_task_id: task.id,
          p_user_id: authData.user.id,
          p_today: today
        }
      );

      if (cancelError) {
        console.error('❌ 取消打卡失敗:', cancelError);
        return;
      }

      console.log('✅ 取消打卡成功:', cancelResult);
      
      if (cancelResult.success) {
        console.log('📊 更新後進度:', cancelResult.task.progress_data);
      }
    } else {
      console.log('📝 今天還沒打卡，測試打卡功能...');
      
      // 測試打卡
      const { data: checkInResult, error: checkInError } = await supabase.rpc(
        'perform_task_action_transaction', 
        {
          p_task_id: task.id,
          p_action_type: 'check_in',
          p_action_date: today,
          p_action_timestamp: new Date().toISOString(),
          p_user_id: authData.user.id,
          p_action_data: {}
        }
      );

      if (checkInError) {
        console.error('❌ 打卡失敗:', checkInError);
        return;
      }

      console.log('✅ 打卡成功:', checkInResult);
      
      if (checkInResult.success) {
        console.log('📊 更新後進度:', checkInResult.task.progress_data);
      }
    }

    // 3. 驗證數據一致性
    console.log('\n🔍 驗證數據一致性...');
    
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('progress_data')
      .eq('id', task.id)
      .single();

    const { data: taskActions } = await supabase
      .from('task_actions')
      .select('action_date')
      .eq('task_id', task.id)
      .eq('action_type', 'check_in');

    const progressCheckInDates = updatedTask?.progress_data?.check_in_dates || [];
    const actionDates = taskActions?.map(a => a.action_date) || [];

    console.log('📋 progress_data 中的打卡日期:', progressCheckInDates);
    console.log('📋 task_actions 中的打卡日期:', actionDates);

    const isConsistent = progressCheckInDates.length === actionDates.length &&
      progressCheckInDates.every(date => actionDates.includes(date));

    if (isConsistent) {
      console.log('✅ 數據一致性檢查通過！');
    } else {
      console.log('❌ 數據不一致！');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  }
}

// 運行測試
testTaskActions(); 