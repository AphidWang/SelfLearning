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
  operator: 'eq';
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
  topic_templates: new Map()
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
    single: () => {
      query.returnSingle = true;
      return builder;
    },
    then: async (callback) => {
      let result;
      if (table === 'topics') {
        if (query.filters.length > 0) {
          const filter = query.filters[0];
          result = mockData.topics.get(filter.value);
        } else {
          result = Array.from(mockData.topics.values());
        }
      } else if (table === 'topic_templates') {
        if (query.filters.length > 0) {
          const filter = query.filters[0];
          result = mockData.topic_templates.get(filter.value);
        } else {
          result = Array.from(mockData.topic_templates.values());
        }
      }

      return callback({
        data: query.returnSingle ? result : [result],
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
    })
  },
  from: vi.fn((table) => {
    const builder = {
      select: (fields = '*') => {
        return createQueryBuilder(table);
      },
      insert: (data) => {
        const newData = {
          id: 'test-id',
          ...data,
          goals: data.goals || [],
          bubbles: data.bubbles || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (table === 'topics') {
          mockData.topics.set(newData.id, {
            ...newData,
            topic_collaborators: []
          });
        } else if (table === 'topic_templates') {
          mockData.topic_templates.set(newData.id, {
            ...newData,
            topic_template_collaborators: []
          });
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
          let existing;
          if (table === 'topics') {
            existing = mockData.topics.get(value);
            if (existing) {
              const updated = {
                ...existing,
                ...updates,
                updated_at: new Date().toISOString()
              };
              mockData.topics.set(value, updated);
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
          } else if (table === 'topic_templates') {
            existing = mockData.topic_templates.get(value);
            if (existing) {
              const updated = {
                ...existing,
                ...updates,
                updated_at: new Date().toISOString()
              };
              mockData.topic_templates.set(value, updated);
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
          if (table === 'topics') {
            mockData.topics.delete(value);
          } else if (table === 'topic_templates') {
            mockData.topic_templates.delete(value);
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
  })
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockData.topics.clear();
  mockData.topic_templates.clear();
  
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
  
  mockSupabaseClient.auth.getUser.mockClear();
  mockSupabaseClient.auth.getSession.mockClear();
}); 