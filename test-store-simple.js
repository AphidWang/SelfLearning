/**
 * TopicTemplateStore 方法測試工具
 * 
 * 用途：測試 store 層的各種方法（不包含協作者查詢以避免 RLS 遞歸問題）
 * 先決條件：需要先執行 test-login.js 建立 temp-token.json
 * 使用方式：node test-store-simple.js
 * 
 * 環境變數：
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * 
 * 測試項目：
 * - fetchPublicTemplates() 
 * - fetchMyTemplates()
 * - createTemplate()
 * - getTemplate()
 * - getCollaborators() (獨立測試)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// 檢查必要的環境變數
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少必要的環境變數，請檢查 .env 文件：');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// TopicTemplateStore 模擬類別
class SimpleTopicTemplateService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.templates = [];
    this.loading = false;
    this.error = null;
  }

  async fetchPublicTemplates() {
    console.log('🔍 測試 fetchPublicTemplates (簡化版)...');
    
    try {
      // 不包含協作者查詢
      const { data, error } = await this.supabase
        .from('topic_templates')
        .select('*')  // 只選擇主表欄位
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      console.log('✅ fetchPublicTemplates 成功！找到', data?.length || 0, '個 public templates');
      return data || [];
    } catch (error) {
      console.error('❌ fetchPublicTemplates 失敗:', error.message);
      throw error;
    }
  }

  async fetchMyTemplates() {
    console.log('🔍 測試 fetchMyTemplates (簡化版)...');
    
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('👤 當前用戶:', user.email, '(ID:', user.id, ')');

      // 不包含協作者查詢
      const { data, error } = await this.supabase
        .from('topic_templates')
        .select('*')  // 只選擇主表欄位
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      console.log('✅ fetchMyTemplates 成功！找到', data?.length || 0, '個 my templates');
      return data || [];
    } catch (error) {
      console.error('❌ fetchMyTemplates 失敗:', error.message);
      throw error;
    }
  }

  async createTemplate(templateData) {
    console.log('🔍 測試 createTemplate (簡化版)...');
    
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('topic_templates')
        .insert({
          ...templateData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ createTemplate 成功！Template ID:', data.id);
      return data;
    } catch (error) {
      console.error('❌ createTemplate 失敗:', error.message);
      throw error;
    }
  }

  async getTemplate(id) {
    console.log('🔍 測試 getTemplate (簡化版)...', id);
    
    try {
      // 不包含協作者查詢
      const { data, error } = await this.supabase
        .from('topic_templates')
        .select('*')  // 只選擇主表欄位
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      console.log('✅ getTemplate 成功！Template:', data.title);
      return data;
    } catch (error) {
      console.error('❌ getTemplate 失敗:', error.message);
      return null;
    }
  }

  // 單獨測試協作者查詢
  async getCollaborators(templateId) {
    console.log('🔍 測試 getCollaborators...', templateId);
    
    try {
      const { data, error } = await this.supabase
        .from('topic_template_collaborators')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;

      console.log('✅ getCollaborators 成功！找到', data?.length || 0, '個協作者');
      return data || [];
    } catch (error) {
      console.error('❌ getCollaborators 失敗:', error.message);
      return [];
    }
  }
}

async function testSimpleStoreMethods() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const templateService = new SimpleTopicTemplateService(supabase);

    // 設置 authentication
    if (fs.existsSync('temp-token.json')) {
      const tokenData = JSON.parse(fs.readFileSync('temp-token.json', 'utf8'));
      console.log('🔑 使用存儲的 token');
      
      const { data, error } = await supabase.auth.setSession({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      });

      if (error) {
        console.error('❌ Session 設置失敗:', error.message);
        return;
      }
      
      console.log('✅ Session 設置成功，用戶:', data.user?.email);
    } else {
      console.log('⚠️  沒有找到 token 檔案，請先執行 test-login.js');
      return;
    }

    console.log('\n=== 測試簡化版 TopicTemplateStore 方法 ===\n');

    // 測試 1: fetchPublicTemplates (不包含協作者)
    console.log('📋 測試 1: fetchPublicTemplates');
    try {
      const publicTemplates = await templateService.fetchPublicTemplates();
      if (publicTemplates.length > 0) {
        console.log('📄 前三個 public templates:');
        publicTemplates.slice(0, 3).forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.title}`);
          console.log(`      ID: ${template.id}`);
          console.log(`      創建者: ${template.created_by}`);
        });
      } else {
        console.log('📄 沒有找到 public templates');
      }
    } catch (err) {
      console.log('⚠️  fetchPublicTemplates 測試失敗');
    }

    // 測試 2: fetchMyTemplates (不包含協作者)
    console.log('\n📋 測試 2: fetchMyTemplates');
    try {
      const myTemplates = await templateService.fetchMyTemplates();
      if (myTemplates.length > 0) {
        console.log('📄 我的 templates:');
        myTemplates.forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.title} (public: ${template.is_public})`);
        });
      } else {
        console.log('📄 沒有找到我的 templates');
      }
    } catch (err) {
      console.log('⚠️  fetchMyTemplates 測試失敗');
    }

    // 測試 3: createTemplate
    console.log('\n📋 測試 3: createTemplate');
    try {
      const testTemplate = {
        title: '簡化測試 Template - ' + new Date().toISOString(),
        description: '這是透過簡化 store 方法創建的測試 template',
        subject: 'test',
        category: 'general',
        template_type: 'mindmap',
        is_public: true,
        is_collaborative: false,
        goals: [],
        bubbles: []
      };

      const newTemplate = await templateService.createTemplate(testTemplate);
      
      if (newTemplate) {
        // 測試 4: getTemplate
        console.log('\n📋 測試 4: getTemplate');
        const retrievedTemplate = await templateService.getTemplate(newTemplate.id);
        
        if (retrievedTemplate) {
          console.log('✅ 成功獲取剛創建的 template');
          console.log('   Title:', retrievedTemplate.title);
          console.log('   Public:', retrievedTemplate.is_public);
          console.log('   Created by:', retrievedTemplate.created_by);
          
          // 測試 5: getCollaborators (單獨測試)
          console.log('\n📋 測試 5: getCollaborators');
          await templateService.getCollaborators(newTemplate.id);
        }
      }
      
    } catch (err) {
      console.log('⚠️  createTemplate 測試失敗:', err.message);
    }

    console.log('\n=== 簡化測試完成 ===');
    console.log('\n💡 關鍵發現:');
    console.log('- 不包含協作者查詢的操作應該都能正常工作');
    console.log('- 問題出在 topic_template_collaborators 的 RLS policy');
    console.log('- 需要修復 infinite recursion 問題');
    
  } catch (error) {
    console.error('💥 整體測試發生錯誤:', error);
  }
}

testSimpleStoreMethods(); 