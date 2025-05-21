# AI 模組架構說明

## 目錄結構

```
lib/ai/
├── config/         # 配置相關
│   ├── actions.yaml # AI 動作定義和參數驗證規則
│   └── forms.yaml  # UI 表單定義
├── types/          # 型別定義
│   └── llm.ts      # LLM 回應和表單型別
├── tools/          # AI 工具實作
│   ├── goal-tools.ts    # 目標相關工具
│   ├── suggestion-tools.ts # 建議相關工具
│   ├── utility-tools.ts # 工具類功能
│   └── types.ts    # 工具型別定義
├── utils/          # 工具函數
│   └── actionValidator.ts # 動作驗證器
└── services/       # 核心服務
    ├── chat.ts     # 聊天服務
    └── mindmap.ts  # 心智圖服務
```

## 工作流程

1. **動作定義**
   - `actions.yaml`: 定義 AI 動作的參數和回傳值型別
   - `forms.yaml`: 定義 UI 表單結構
   - 兩個檔案使用相同的 key 來對應動作

2. **工具實作**
   - `tools/`: 實作每個 AI 動作的邏輯
   - 每個工具都包含：
     - `name`: 對應 actions.yaml 中的 key
     - `description`: 工具描述
     - `form`: 從 forms.yaml 讀取的表單定義
     - `handler`: 實作邏輯

3. **服務層**
   - `mindmap.ts`: 
     - 處理使用者輸入
     - 呼叫 LLM 取得動作
     - 從 forms.yaml 讀取表單定義
     - 執行對應的工具

4. **驗證流程**
   - `actionValidator.ts`: 
     - 驗證動作參數
     - 驗證回傳值
     - 讀取 actions.yaml 的定義

## 範例

1. **定義動作**
```yaml
# actions.yaml
create_topic:
  description: "建立新主題"
  params:
    topic:
      type: string
      required: true
  returns:
    type: object
    properties:
      id: string
      title: string
```

2. **定義表單**
```yaml
# forms.yaml
create_topic:
  type: form
  title: "建立新主題"
  description: "請輸入主題名稱"
  fields:
    - name: topic
      label: "主題名稱"
      type: text
      required: true
```

3. **實作工具**
```typescript
// goal-tools.ts
export const createTopicTool: Tool<{ topic: string }, Goal> = {
  name: 'create_topic',
  description: '建立新的學習主題',
  form: forms.create_topic,
  handler: async (params) => {
    // 實作邏輯
  }
};
```

## 注意事項

1. 保持 actions.yaml 和 forms.yaml 的 key 一致
2. 工具實作時要確保參數和回傳值型別正確
3. 表單定義要考慮使用者體驗
4. 動作驗證要完整覆蓋所有情況 