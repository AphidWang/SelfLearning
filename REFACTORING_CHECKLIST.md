# 統一錯誤處理重構檢查清單

## 🎯 目標
將專案中的所有 API 調用和非同步操作統一使用 `ErrorContext` + `useAsyncOperation` 進行錯誤處理，避免用戶卡在錯誤狀態。

## 📋 重構檢查清單

### ✅ 已完成
- [x] ErrorContext 實作 (`src/context/ErrorContext.tsx`)
- [x] useAsyncOperation Hook (`src/utils/errorHandler.ts`)
- [x] App.tsx 整合 ErrorProvider
- [x] useTopicReview Hook 範例實作
- [x] 專案規則文件更新 (ARCHITECTURE.md, ERROR_HANDLING_GUIDE.md)

### 🔄 進行中 - 核心頁面組件

#### 1. StudentLearningMap.tsx (高優先級) 🎯
**位置**: `apps/client/src/pages/student/StudentLearningMap.tsx`

**需要修改的函數**:
- [ ] `useEffect(() => { fetchTopics(); }, [])` - 初始化載入
- [ ] `handleAddTopic()` - 新增主題
- [ ] `handleTemplateSelected()` - 模板選擇
- [ ] `handleCreateBlankTopic()` - 建立空白主題
- [ ] `handleUpdate()` - 刷新資料

**修改方式**:
```typescript
import { useAsyncOperation } from '../../utils/errorHandler';

const { executeWithLoading, executeWithErrorHandling } = useAsyncOperation();

// 替換初始化載入
useEffect(() => {
  executeWithErrorHandling(
    async () => {
      await fetchTopics();
    },
    {
      context: '載入學習地圖',
      retryable: true,
      retryCount: 2
    }
  );
}, []);
```

#### 2. TaskWallPage.tsx (高優先級) 🎯
**位置**: `apps/client/src/pages/student/TaskWallPage.tsx`

**需要修改的函數**:
- [ ] `initializeData()` - 初始化資料載入
- [ ] `handleTaskStatusUpdate()` - 任務狀態更新
- [ ] `handleAddTaskToGoal()` - 新增任務
- [ ] `handleRestoreTask()` - 恢復任務
- [ ] `handleSaveRecord()` - 保存記錄

**目前問題**:
- 使用 `toast.error()` 顯示錯誤（不一致）
- 複雜的 `try-catch` 邏輯
- 沒有自動重試機制

**修改範例**:
```typescript
const [isLoading, handleTaskStatusUpdate] = executeWithLoading(
  async (taskId: string, goalId: string, topicId: string, newStatus: TaskStatus) => {
    let result;
    switch (newStatus) {
      case 'done':
        result = await markTaskCompleted(topicId, goalId, taskId, true);
        break;
      case 'in_progress':
        result = await markTaskInProgress(topicId, goalId, taskId);
        break;
      case 'todo':
        result = await markTaskTodo(topicId, goalId, taskId);
        break;
    }
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    // 成功時的動畫
    if (newStatus === 'done') {
      setIsStarAnimating(true);
      setTimeout(() => setIsStarAnimating(false), 1000);
    }
  },
  {
    successMessage: "任務狀態更新成功！",
    errorTitle: "任務狀態更新失敗",
    retryable: true
  }
);
```

#### 3. TopicReviewPage.tsx (中優先級)
**位置**: `apps/client/src/components/learning-map/TopicReviewPage.tsx`

**需要修改的函數**:
- [ ] `refreshTopic()` - 已使用 useAsyncOperation，但其他函數未使用
- [ ] `handleStatusSelect()` - 任務狀態選擇
- [ ] `handleAddTask()` - 新增任務
- [ ] `confirmDeleteTaskFromList()` - 刪除任務
- [ ] `handleDeleteGoal()` - 刪除目標

### 🔄 進行中 - 子組件

#### 4. TopicDetailsDialog.tsx (中優先級)
**位置**: `apps/client/src/components/learning-map/TopicDetailsDialog.tsx`

**需要修改的函數**:
- [ ] `handleAddTask()` - 新增任務

#### 5. TaskCard.tsx (中優先級)  
**位置**: `apps/client/src/pages/student/components/TaskCard.tsx`

**需要修改的函數**:
- [ ] `handleCompleteTask()` - 完成任務

#### 6. TopicDetails.tsx (中優先級)
**位置**: `apps/client/src/components/learning-map/TopicDetails.tsx`

**需要修改的函數**:
- [ ] `handleAddTask()` - 新增任務
- [ ] `handleTaskStatusChange()` - 任務狀態變更

### 🔄 進行中 - Store 層級

#### 7. topicStore.ts (低優先級)
**位置**: `apps/client/src/store/topicStore.ts`

**考慮事項**:
- Store 層級是否需要統一錯誤處理？
- 目前 Store 已有基本錯誤處理，主要是組件層級需要改善
- 建議保持 Store 輕量，錯誤處理主要在組件層級

### 📝 修改指導原則

#### 替換模式
```typescript
// ❌ 舊模式
try {
  setLoading(true);
  const result = await apiCall();
  if (!result) {
    alert('操作失敗');
  }
} catch (error) {
  console.error(error);
  alert('系統錯誤');
} finally {
  setLoading(false);
}

// ✅ 新模式  
const [isLoading, handleOperation] = executeWithLoading(
  async () => {
    const result = await apiCall();
    if (!result) {
      throw new Error('操作失敗，請稍後再試');
    }
    return result;
  },
  {
    successMessage: "操作成功！",
    errorTitle: "操作失敗",
    retryable: true,
    retryCount: 2
  }
);
```

#### 錯誤類型處理
```typescript
// 針對不同錯誤類型的處理
const handleSpecificErrors = executeWithErrorHandling(
  async () => {
    // API 調用
  },
  {
    errorPatterns: {
      401: { 
        title: '登入已過期', 
        message: '請重新登入',
        action: { label: '前往登入', handler: () => navigate('/login') }
      },
      403: { 
        title: '權限不足', 
        message: '請聯絡管理員' 
      },
      network: { 
        title: '網路問題', 
        message: '請檢查網路連線',
        retryable: true 
      }
    }
  }
);
```

## 🎯 下一步行動

### 立即執行 (本週)
1. 修改 `StudentLearningMap.tsx` 和 `TaskWallPage.tsx` 的錯誤處理
2. 測試錯誤場景（網路斷線、權限錯誤等）
3. 確認用戶不會卡在 loading 狀態

### 短期目標 (下週)
1. 修改其餘組件的錯誤處理
2. 建立錯誤處理測試案例
3. 更新開發者文件

### 長期目標 (本月)
1. 全專案錯誤處理一致性檢查
2. 效能優化和用戶體驗改善
3. 錯誤監控和分析系統

## 🧪 測試檢查項目

### 功能測試
- [ ] 網路斷線時的錯誤處理
- [ ] API 錯誤時的用戶引導
- [ ] 重試機制的正確運作
- [ ] 成功操作的反饋

### 用戶體驗測試
- [ ] 錯誤對話框的美觀性
- [ ] 錯誤訊息的易讀性
- [ ] 操作流程的順暢性
- [ ] 無障礙功能支援

---

## 📚 參考資料
- [錯誤處理指南](./ERROR_HANDLING_GUIDE.md)
- [架構文件](./ARCHITECTURE.md)
- [ErrorContext 實作](./apps/client/src/context/ErrorContext.tsx)
- [useAsyncOperation Hook](./apps/client/src/utils/errorHandler.ts) 