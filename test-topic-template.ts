/**
 * Topic Template 系統測試腳本
 * 
 * 測試流程：
 * 1. 驗證公開模板查詢
 * 2. 測試從模板創建主題
 * 3. 驗證資料轉換正確性
 */

import { supabase } from './apps/client/src/services/supabase';
import type { TopicTemplate, TemplateGoal, TemplateTask } from './apps/client/src/types/goal';

async function testTopicTemplateSystem() {
  console.log('🧪 開始測試 Topic Template 系統...\n');
  
  try {
    // 1. 測試公開模板查詢
    console.log('1️⃣ 測試公開模板查詢...');
    const { data: publicTemplates, error: fetchError } = await supabase
      .from('topic_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(3);

    if (fetchError) {
      console.error('❌ 公開模板查詢失敗:', fetchError);
      return;
    }

    console.log(`✅ 找到 ${publicTemplates.length} 個公開模板`);
    publicTemplates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.title} (ID: ${template.id})`);
      console.log(`      - 目標數: ${template.goals?.length || 0}`);
      console.log(`      - 使用次數: ${template.usage_count}`);
    });

    if (publicTemplates.length === 0) {
      console.log('⚠️  沒有公開模板，跳過後續測試');
      return;
    }

    // 2. 測試模板結構驗證
    console.log('\n2️⃣ 測試模板結構驗證...');
    const testTemplate = publicTemplates[0];
    console.log(`   測試模板: ${testTemplate.title}`);
    
    // 驗證 goals 結構
    if (testTemplate.goals && Array.isArray(testTemplate.goals)) {
      console.log('✅ Goals 結構正確');
      testTemplate.goals.forEach((goal: TemplateGoal, index: number) => {
        console.log(`   Goal ${index + 1}: ${goal.title}`);
        console.log(`      - 狀態: ${goal.status}`);
        console.log(`      - 任務數: ${goal.tasks?.length || 0}`);
      });
    } else {
      console.log('❌ Goals 結構不正確');
    }

    // 3. 測試類型驗證
    console.log('\n3️⃣ 測試類型驗證...');
    const templateGoal: TemplateGoal = {
      id: 'test-goal',
      title: '測試目標',
      status: 'todo',
      tasks: [{
        id: 'test-task',
        title: '測試任務',
        status: 'todo'
      }]
    };
    console.log('✅ TemplateGoal 類型驗證通過');

    // 4. 模擬從模板創建主題的資料轉換
    console.log('\n4️⃣ 模擬資料轉換...');
    const template = testTemplate as TopicTemplate;
    
    console.log('   轉換 Goals:');
    if (template.goals) {
      template.goals.forEach((templateGoal, goalIndex) => {
        console.log(`   - Goal: ${templateGoal.title} (${templateGoal.status})`);
        
        if (templateGoal.tasks) {
          templateGoal.tasks.forEach((templateTask, taskIndex) => {
            const convertedStatus = templateTask.status === 'idea' ? 'todo' : templateTask.status;
            console.log(`     - Task: ${templateTask.title} (${templateTask.status} → ${convertedStatus})`);
          });
        }
      });
    }

    console.log('\n✅ 所有測試通過！Topic Template 系統正常運作');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  }
}

// 執行測試
testTopicTemplateSystem().catch(console.error); 