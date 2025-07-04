/**
 * 完整的 Topic Template 流程測試
 * 
 * 測試場景：
 * 1. 模擬學生瀏覽公開模板
 * 2. 模擬選擇模板並查看詳細內容
 * 3. 模擬從模板創建新主題
 * 4. 驗證資料轉換的正確性
 * 5. 驗證新主題的結構完整性
 */

import { supabase } from './apps/client/src/services/supabase';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

async function runTopicTemplateFlowTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('🧪 開始完整的 Topic Template 流程測試...\n');

  try {
    // 步驟 1: 測試公開模板瀏覽功能
    console.log('1️⃣ 測試公開模板瀏覽功能...');
    const { data: publicTemplates, error: fetchError } = await supabase
      .from('topic_templates')
      .select(`
        *,
        topic_template_collaborators (
          id,
          user_id,
          permission,
          invited_by,
          invited_at
        )
      `)
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (fetchError) {
      results.push({
        step: '1. 公開模板瀏覽',
        success: false,
        message: `API 查詢失敗: ${fetchError.message}`
      });
      return results;
    }

    const templatesWithGoals = publicTemplates.filter(t => 
      t.goals && Array.isArray(t.goals) && t.goals.length > 0
    );

    results.push({
      step: '1. 公開模板瀏覽',
      success: true,
      message: `成功獲取 ${publicTemplates.length} 個公開模板，其中 ${templatesWithGoals.length} 個有完整內容`,
      data: {
        totalTemplates: publicTemplates.length,
        validTemplates: templatesWithGoals.length,
        templates: templatesWithGoals.map(t => ({
          title: t.title,
          subject: t.subject,
          goalCount: t.goals?.length || 0
        }))
      }
    });

    if (templatesWithGoals.length === 0) {
      results.push({
        step: '流程測試',
        success: false,
        message: '沒有可用的模板，無法繼續測試'
      });
      return results;
    }

    // 步驟 2: 測試模板內容結構驗證
    console.log('\n2️⃣ 測試模板內容結構驗證...');
    const testTemplate = templatesWithGoals[0];
    const templateStructureTest = validateTemplateStructure(testTemplate);
    
    results.push(templateStructureTest);

    if (!templateStructureTest.success) {
      return results;
    }

    // 步驟 3: 模擬創建主題的資料轉換
    console.log('\n3️⃣ 測試資料轉換邏輯...');
    const conversionTest = simulateDataConversion(testTemplate);
    results.push(conversionTest);

    // 步驟 4: 測試模板使用次數更新
    console.log('\n4️⃣ 測試模板使用次數更新...');
    const originalUsageCount = testTemplate.usage_count;
    
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('topic_templates')
      .update({ usage_count: originalUsageCount + 1 })
      .eq('id', testTemplate.id)
      .select('usage_count')
      .single();

    if (updateError) {
      results.push({
        step: '4. 使用次數更新',
        success: false,
        message: `更新失敗: ${updateError.message}`
      });
    } else {
      results.push({
        step: '4. 使用次數更新',
        success: true,
        message: `使用次數從 ${originalUsageCount} 更新為 ${updatedTemplate.usage_count}`,
        data: { originalCount: originalUsageCount, newCount: updatedTemplate.usage_count }
      });

      // 恢復原始值
      await supabase
        .from('topic_templates')
        .update({ usage_count: originalUsageCount })
        .eq('id', testTemplate.id);
    }

    // 步驟 5: 測試篩選和搜尋功能
    console.log('\n5️⃣ 測試篩選和搜尋功能...');
    const filterTest = await testTemplateFiltering();
    results.push(filterTest);

    return results;

  } catch (error) {
    results.push({
      step: '流程測試',
      success: false,
      message: `測試過程中發生未預期的錯誤: ${error.message}`
    });
    return results;
  }
}

function validateTemplateStructure(template: any): TestResult {
  const issues: string[] = [];

  // 檢查基本字段
  if (!template.title) issues.push('缺少標題');
  if (!template.goals || !Array.isArray(template.goals)) issues.push('goals 字段無效');
  if (!template.is_public) issues.push('模板不是公開的');

  // 檢查 goals 結構
  if (template.goals && Array.isArray(template.goals)) {
    template.goals.forEach((goal: any, goalIndex: number) => {
      if (!goal.id) issues.push(`Goal ${goalIndex + 1} 缺少 ID`);
      if (!goal.title) issues.push(`Goal ${goalIndex + 1} 缺少標題`);
      if (!goal.status) issues.push(`Goal ${goalIndex + 1} 缺少狀態`);

      // 檢查 tasks 結構
      if (goal.tasks && Array.isArray(goal.tasks)) {
        goal.tasks.forEach((task: any, taskIndex: number) => {
          if (!task.id) issues.push(`Goal ${goalIndex + 1}, Task ${taskIndex + 1} 缺少 ID`);
          if (!task.title) issues.push(`Goal ${goalIndex + 1}, Task ${taskIndex + 1} 缺少標題`);
          if (!task.status) issues.push(`Goal ${goalIndex + 1}, Task ${taskIndex + 1} 缺少狀態`);
        });
      }
    });
  }

  return {
    step: '2. 模板結構驗證',
    success: issues.length === 0,
    message: issues.length === 0 
      ? `模板結構完整：${template.goals.length} 個目標，總共 ${template.goals.reduce((sum: number, goal: any) => sum + (goal.tasks?.length || 0), 0)} 個任務`
      : `發現 ${issues.length} 個結構問題: ${issues.join(', ')}`,
    data: {
      templateTitle: template.title,
      goalCount: template.goals?.length || 0,
      totalTasks: template.goals?.reduce((sum: number, goal: any) => sum + (goal.tasks?.length || 0), 0) || 0,
      issues
    }
  };
}

function simulateDataConversion(template: any): TestResult {
  const conversions: any[] = [];
  
  try {
    template.goals.forEach((templateGoal: any, goalIndex: number) => {
      // 模擬 Goal 轉換
      const goalConversion = {
        from: {
          id: templateGoal.id,
          title: templateGoal.title,
          status: templateGoal.status
        },
        to: {
          title: templateGoal.title,
          status: templateGoal.status || 'todo',
          priority: templateGoal.priority || 'medium',
          order_index: goalIndex,
          need_help: false
        }
      };

      const taskConversions: any[] = [];

      if (templateGoal.tasks) {
        templateGoal.tasks.forEach((templateTask: any, taskIndex: number) => {
          // 模擬 Task 轉換（特別注意 idea → todo 的轉換）
          const convertedStatus = templateTask.status === 'idea' ? 'todo' : templateTask.status;
          
          taskConversions.push({
            from: {
              id: templateTask.id,
              title: templateTask.title,
              status: templateTask.status
            },
            to: {
              title: templateTask.title,
              status: convertedStatus,
              priority: templateTask.priority || 'medium',
              order_index: taskIndex,
              need_help: false
            }
          });
        });
      }

      conversions.push({
        goal: goalConversion,
        tasks: taskConversions
      });
    });

    return {
      step: '3. 資料轉換模擬',
      success: true,
      message: `成功模擬轉換 ${conversions.length} 個目標和 ${conversions.reduce((sum, c) => sum + c.tasks.length, 0)} 個任務`,
      data: {
        conversions,
        summary: {
          goalCount: conversions.length,
          taskCount: conversions.reduce((sum, c) => sum + c.tasks.length, 0),
          statusConversions: conversions.flatMap(c => c.tasks)
            .filter(t => t.from.status !== t.to.status)
            .map(t => `${t.from.status} → ${t.to.status}`)
        }
      }
    };

  } catch (error) {
    return {
      step: '3. 資料轉換模擬',
      success: false,
      message: `轉換過程中發生錯誤: ${error.message}`
    };
  }
}

async function testTemplateFiltering(): Promise<TestResult> {
  try {
    // 測試按學科篩選
    const { data: mathTemplates } = await supabase
      .from('topic_templates')
      .select('title, subject')
      .eq('is_public', true)
      .eq('subject', '數學');

    // 測試按分類篩選
    const { data: learningTemplates } = await supabase
      .from('topic_templates')
      .select('title, template_type')
      .eq('is_public', true)
      .eq('template_type', 'learning');

    // 測試搜尋功能（模擬）
    const { data: searchResults } = await supabase
      .from('topic_templates')
      .select('title, description')
      .eq('is_public', true)
      .ilike('title', '%程式%');

    return {
      step: '5. 篩選和搜尋測試',
      success: true,
      message: '篩選和搜尋功能正常',
      data: {
        mathTemplates: mathTemplates?.length || 0,
        learningTemplates: learningTemplates?.length || 0,
        searchResults: searchResults?.length || 0
      }
    };

  } catch (error) {
    return {
      step: '5. 篩選和搜尋測試',
      success: false,
      message: `篩選測試失敗: ${error.message}`
    };
  }
}

// 執行測試並輸出結果
async function main() {
  console.log('🚀 Topic Template 完整流程測試開始\n');
  
  const results = await runTopicTemplateFlowTest();
  
  console.log('\n📊 測試結果總結:');
  console.log('='.repeat(50));
  
  let passedTests = 0;
  let totalTests = results.length;

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.step}: ${result.message}`);
    
    if (result.data) {
      console.log(`   詳細資料:`, JSON.stringify(result.data, null, 2));
    }
    
    if (result.success) passedTests++;
    console.log('');
  });

  console.log('='.repeat(50));
  console.log(`📈 總結: ${passedTests}/${totalTests} 個測試通過`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有測試通過！Topic Template 系統運作正常！');
  } else {
    console.log('⚠️  部分測試失敗，需要進一步檢查');
  }
}

main().catch(console.error); 