export type EventType = 
  | 'topic_selected'      // 選擇了主題
  | 'input_received'      // 收到使用者輸入
  | 'suggest_steps_accepted'  // 接受建議的步驟
  | 'task_started'        // 開始任務
  | 'task_completed'      // 完成任務
  | 'ask_to_explore_more' // 要求探索更多
  | 'resume'             // 從暫停恢復
  | 'force_complete'     // 強制完成
  | 'force_pause'        // 強制暫停
  | 'force_reset'        // 強制重置
  | 'createTopic'        // 新增主題
  | 'createStep'         // 新增步驟
  | 'createTask'         // 新增任務
  | 'createTopics'       // 批量新增主題
  | 'createSteps'        // 批量新增步驟
  | 'createTasks'        // 批量新增任務
  | 'use_template_steps'; // 使用模板步驟

export const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  topic_selected: '選擇了一個新的學習主題',
  input_received: '收到使用者的輸入或回應',
  suggest_steps_accepted: '接受了建議的學習步驟',
  task_started: '開始執行某個任務',
  task_completed: '完成某個任務',
  ask_to_explore_more: '要求探索更多相關主題',
  resume: '從暫停狀態恢復學習',
  force_complete: '強制結束當前學習主題',
  force_pause: '強制暫停當前學習',
  force_reset: '強制重置學習狀態',
  createTopic: '新增一個學習主題',
  createStep: '新增一個學習步驟',
  createTask: '新增一個學習任務',
  createTopics: '批量新增學習主題',
  createSteps: '批量新增學習步驟',
  createTasks: '批量新增學習任務',
  use_template_steps: '使用預設的學習步驟模板'
};

export const EVENT_EMOJIS: Record<EventType, string> = {
  topic_selected: '🎯',
  input_received: '💭',
  suggest_steps_accepted: '✅',
  task_started: '🚀',
  task_completed: '🎉',
  ask_to_explore_more: '🔍',
  resume: '▶️',
  force_complete: '🏁',
  force_pause: '⏸️',
  force_reset: '🔄',
  createTopic: '📝',
  createStep: '📋',
  createTask: '📌',
  createTopics: '📚',
  createSteps: '📑',
  createTasks: '📎',
  use_template_steps: '📋'
}; 