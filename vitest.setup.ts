import { vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 讀取 token
let token = null;
try {
  const tokenData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'temp-token.json'), 'utf-8'));
  token = tokenData.access_token;
} catch (error) {
  console.error('❌ 找不到 temp-token.json，請先執行 test-login.js');
  process.exit(1);
}

// 設置 localStorage mock (因為在 Node 環境中沒有 localStorage)
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'supabase.auth.token') {
      return JSON.stringify({ currentSession: { access_token: token } });
    }
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

global.localStorage = localStorageMock;

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  }
});

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
  }
});

// 定義型別
interface QueryFilter {
  column: string;
  value: string;
  operator: 'eq' | 'neq';
}

interface QueryState {
  table: string;
  filters: QueryFilter[];
  returnSingle: boolean;
  data: any;
  selectedFields: string;
}

// Mock Supabase client
const mockData = {
  topics: new Map(),
  topics_new: new Map(),
  goals: new Map(),
  tasks: new Map(),
  topic_templates: new Map(),
  topic_collaborators: new Map()
};

function createQueryBuilder(table: string) {
  const query: QueryState = {
    table,
    filters: [],
    returnSingle: false,
    data: null,
    selectedFields: '*'
  };

  const builder = {
    select: (fields = '*') => {
      query.selectedFields = fields;
      return builder;
    },
    eq: (column: string, value: string) => {
      query.filters.push({ column, value, operator: 'eq' });
      return builder;
    },
    neq: (column: string, value: string) => {
      query.filters.push({ column, value, operator: 'neq' });
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      // 暫時忽略排序，返回 builder
      return builder;
    },
    single: () => {
      query.returnSingle = true;
      return builder;
    },
    then: async (callback) => {
      let result;
      const tableName = table as keyof typeof mockData;
      
      if (mockData[tableName]) {
        if (query.filters.length > 0) {
          if (query.filters.some(f => f.operator === 'eq')) {
            // 如果有 eq 過濾器，獲取特定記錄
            const eqFilter = query.filters.find(f => f.operator === 'eq');
            result = mockData[tableName].get(eqFilter!.value);
            
            // 應用 neq 過濾器
            const neqFilters = query.filters.filter(f => f.operator === 'neq');
            if (result && neqFilters.length > 0) {
              for (const neqFilter of neqFilters) {
                if (result[neqFilter.column] === neqFilter.value) {
                  result = undefined; // 排除這個結果
                  break;
                }
              }
            }
            
            // 如果是查詢 topics_new，需要附加 goals 和 tasks
            if ((table === 'topics_new' || table === 'topics') && result) {
              const topicGoals = Array.from(mockData.goals.values()).filter(goal => 
                goal.topic_id === result.id && goal.status !== 'archived'
              );
              
              // 為每個 goal 附加 tasks
              const goalsWithTasks = topicGoals.map(goal => {
                const goalTasks = Array.from(mockData.tasks.values()).filter(task => 
                  task.goal_id === goal.id && task.status !== 'archived'
                );
                return { ...goal, tasks: goalTasks };
              });
              
              result = { ...result, goals: goalsWithTasks };
            }
          } else {
            // 如果只有 neq 過濾器，獲取所有記錄並過濾
            let allResults = Array.from(mockData[tableName].values());
            
            for (const filter of query.filters) {
              if (filter.operator === 'neq') {
                allResults = allResults.filter(item => item[filter.column] !== filter.value);
              } else if (filter.operator === 'eq') {
                allResults = allResults.filter(item => item[filter.column] === filter.value);
              }
            }
            
            result = allResults;
          }
        } else {
          result = Array.from(mockData[tableName].values());
        }
      }

      return callback({
        data: query.returnSingle ? result : (Array.isArray(result) ? result : [result]),
        error: null
      });
    }
  };

  return builder;
}

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        }
      },
      error: null
    }),
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          }
        }
      },
      error: null
    }),
    onAuthStateChange: vi.fn(() => {
      // 返回一個 unsubscribe 函數
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      };
    })
  },
  from: vi.fn((table) => {
    const builder = {
      select: (fields = '*') => {
        return createQueryBuilder(table);
      },
      insert: (data) => {
        const baseId = `test-${table}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newData = {
          id: baseId,
          ...data,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 對於 topics，添加空的 goals 和 bubbles
        if (table === 'topics' || table === 'topics_new') {
          newData.goals = data.goals || [];
          newData.bubbles = data.bubbles || [];
        }
        
        // 對於 goals，確保設置 topic_id
        if (table === 'goals' && data.topic_id) {
          newData.topic_id = data.topic_id;
        }
        
        // 對於 tasks，確保設置 goal_id
        if (table === 'tasks' && data.goal_id) {
          newData.goal_id = data.goal_id;
        }

        const tableName = table as keyof typeof mockData;
        if (mockData[tableName]) {
          if (table === 'topics' || table === 'topics_new') {
            mockData[tableName].set(newData.id, {
              ...newData,
              topic_collaborators: []
            });
          } else if (table === 'topic_templates') {
            mockData[tableName].set(newData.id, {
              ...newData,
              topic_template_collaborators: []
            });
          } else {
            mockData[tableName].set(newData.id, newData);
          }
        }

        return {
          select: () => ({
            single: () => ({
              then: async (callback) => callback({
                data: newData,
                error: null
              })
            })
          })
        };
      },
      update: (updates) => ({
        eq: (column: string, value: string) => {
          const tableName = table as keyof typeof mockData;
          let existing;
          
          if (mockData[tableName]) {
            existing = mockData[tableName].get(value);
            if (existing) {
              const updated = {
                ...existing,
                ...updates,
                version: (existing.version || 1) + 1,
                updated_at: new Date().toISOString()
              };
              mockData[tableName].set(value, updated);
              return {
                select: () => ({
                  single: () => ({
                    then: async (callback) => callback({
                      data: updated,
                      error: null
                    })
                  })
                })
              };
            }
          }
          
          return {
            select: () => ({
              single: () => ({
                then: async (callback) => callback({
                  data: null,
                  error: null
                })
              })
            })
          };
        }
      }),
      delete: () => ({
        eq: (column: string, value: string) => {
          const tableName = table as keyof typeof mockData;
          if (mockData[tableName]) {
            mockData[tableName].delete(value);
          }
          return {
            then: async (callback) => callback({
              data: null,
              error: null
            })
          };
        }
      })
    };

    return builder;
  }),
  
  // 添加 RPC 函數 mock
  rpc: vi.fn((functionName: string, params: any = {}) => {
    return {
      then: async (callback) => {
        let result;
        
        switch (functionName) {
          case 'safe_update_topic':
            const topic = mockData.topics_new.get(params.topic_id);
            if (topic && topic.version === params.expected_version) {
              const updated = {
                ...topic,
                ...params.updates,
                version: topic.version + 1,
                updated_at: new Date().toISOString()
              };
              mockData.topics_new.set(params.topic_id, updated);
              result = updated;
            } else {
              return callback({
                data: null,
                error: { message: 'Version conflict' }
              });
            }
            break;
            
          case 'safe_update_goal':
            const goal = mockData.goals.get(params.goal_id);
            if (goal && goal.version === params.expected_version) {
              const updated = {
                ...goal,
                ...params.updates,
                version: goal.version + 1,
                updated_at: new Date().toISOString()
              };
              mockData.goals.set(params.goal_id, updated);
              result = updated;
            } else {
              return callback({
                data: null,
                error: { message: 'Version conflict' }
              });
            }
            break;
            
          case 'safe_update_task':
            const task = mockData.tasks.get(params.task_id);
            if (task && task.version === params.expected_version) {
              const updated = {
                ...task,
                ...params.updates,
                version: task.version + 1,
                updated_at: new Date().toISOString()
              };
              mockData.tasks.set(params.task_id, updated);
              result = updated;
            } else {
              return callback({
                data: null,
                error: { message: 'Version conflict' }
              });
            }
            break;
            
          case 'get_active_tasks_for_user':
            result = Array.from(mockData.tasks.values()).filter(task => 
              task.status === 'todo' || task.status === 'in_progress'
            );
            break;
            
          default:
            result = null;
        }
        
        return callback({
          data: result,
          error: null
        });
      }
    };
  })
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockData.topics.clear();
  mockData.topics_new.clear();
  mockData.goals.clear();
  mockData.tasks.clear();
  mockData.topic_templates.clear();
  mockData.topic_collaborators.clear();
  
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
  
  mockSupabaseClient.auth.getUser.mockClear();
  mockSupabaseClient.auth.getSession.mockClear();
}); 