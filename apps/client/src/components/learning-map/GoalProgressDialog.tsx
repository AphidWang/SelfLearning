import React, { useState } from 'react';
import { useGoalStore } from '../../store/goalStore';
import { subjectColors } from '../../styles/tokens';
import { CircularProgress } from './CircularProgress';
import { Play, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface GoalProgressDialogProps {
  onClose: () => void;
  onGoalClick: (goalId: string) => void;
}

export const GoalProgressDialog: React.FC<GoalProgressDialogProps> = ({
  onClose,
  onGoalClick,
}) => {
  const { getActiveGoals, getActiveSteps, getCompletionRate } = useGoalStore();
  const goals = getActiveGoals();
  
  // 當前顯示的步驟索引
  const [currentStepIndexes, setCurrentStepIndexes] = useState<Record<string, number>>({});

  // 獲取最近完成的步驟
  const getRecentlyCompletedSteps = (goalId: string) => {
    // MOCK DATA - 之後要移除
    const mockSteps = [
      {
        id: 'mock1',
        title: '完成第一章節練習題',
        tasks: [{ status: 'done' }]
      },
      {
        id: 'mock2',
        title: '觀看線性代數基礎影片',
        tasks: [{ status: 'done' }]
      }
    ];
    
    const steps = getActiveSteps(goalId);
    const realCompletedSteps = steps
      .filter(step => step.tasks.every(task => task.status === 'done'));
    
    // 用 goalId 的最後一個字元來決定是否回傳空陣列
    if (realCompletedSteps.length === 0) {
      const lastChar = goalId.charCodeAt(goalId.length - 1);
      return lastChar % 3 === 0 ? [] : mockSteps;
    }
    
    return realCompletedSteps.slice(-2);
  };

  // 獲取目標當前進行中的步驟（最多2個）
  const getInProgressSteps = (goalId: string) => {
    // MOCK DATA - 之後要移除
    const mockSteps = {
      // 一個進行中的步驟
      single: {
        id: 'mock-s1',
        title: '完成微積分第三章作業',
        tasks: [
          { status: 'in_progress' },
          { status: 'todo' }
        ]
      },
      // 兩個進行中的步驟
      double1: {
        id: 'mock-d1',
        title: '觀看向量空間概念影片',
        tasks: [
          { status: 'in_progress' },
          { status: 'todo' }
        ]
      },
      double2: {
        id: 'mock-d2',
        title: '完成線性轉換練習',
        tasks: [
          { status: 'todo' },
          { status: 'todo' }
        ]
      }
    };

    const steps = getActiveSteps(goalId);
    
    // 用 goalId 的字元來產生一個簡單的 hash
    const hash = goalId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // 每五個 hash 值就一個是空的
    if (hash % 5 === 0) {
      return [];
    }
    
    // 用 hash 決定要取幾個步驟
    const shouldGetTwo = hash % 2 === 1;
    
    // 如果沒有真實步驟，根據 hash 回傳假資料
    if (steps.length === 0) {
      if (shouldGetTwo) {
        return [mockSteps.double1, mockSteps.double2];
      } else {
        return [mockSteps.single];
      }
    }

    // 先找進行中的步驟
    const inProgressSteps = steps.filter(step => 
      step.tasks.some(task => task.status === 'in_progress')
    );

    // 再找待開始的步驟
    const todoSteps = steps.filter(step => 
      !inProgressSteps.includes(step) && 
      step.tasks.some(task => task.status === 'todo')
    );

    // 組合步驟
    const allSteps = [...inProgressSteps, ...todoSteps];
    
    // 如果沒有任何可用的步驟，回傳空陣列
    if (allSteps.length === 0) {
      return [];
    }

    // 根據 shouldGetTwo 決定回傳一個還是兩個步驟
    return shouldGetTwo ? allSteps.slice(0, 2) : allSteps.slice(0, 1);
  };

  // 處理步驟切換 - 直接切換到另一個步驟
  const handleStepToggle = (e: React.MouseEvent, goalId: string) => {
    e.stopPropagation();
    setCurrentStepIndexes(prev => ({
      ...prev,
      [goalId]: prev[goalId] === 1 ? 0 : 1 // 在 0 和 1 之間切換
    }));
  };

  return (
    <div className="max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max px-4">
          {goals.map(goal => {
            const subjectColor = subjectColors[goal.subject || '未分類'];
            const progress = getCompletionRate(goal.id);
            const currentSteps = getInProgressSteps(goal.id);
            const completedSteps = getRecentlyCompletedSteps(goal.id);
            const steps = getActiveSteps(goal.id);
            const totalSteps = steps.length;
            const completedStepsCount = steps.filter(s => s.tasks.every(t => t.status === 'done')).length;
            
            // 當前顯示的步驟索引
            const currentIndex = currentStepIndexes[goal.id] || 0;
            const currentStep = currentSteps[currentIndex];
            
            return (
              <div 
                key={goal.id}
                className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 shadow-xl w-64 flex-shrink-0 border-2 transition-all duration-200 hover:shadow-2xl relative"
                style={{ 
                  borderColor: subjectColor,
                  boxShadow: `0 10px 25px ${subjectColor}15`
                }}
              >
                {/* 打開目標按鈕 */}
                <button
                  onClick={() => onGoalClick(goal.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white dark:bg-gray-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  style={{
                    color: subjectColor,
                    borderColor: `${subjectColor}30`,
                    borderWidth: 1,
                  }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                {/* 目標名稱 */}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 pr-6">
                    {goal.title}
                  </h3>
                  <div 
                    className="text-xs px-2 py-1 rounded-md font-medium inline-block"
                    style={{ backgroundColor: subjectColor + '20', color: subjectColor }}
                  >
                    {goal.subject || '未分類'}
                  </div>
                </div>

                {/* 當前進行 */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" style={{ color: subjectColor }} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        當前進行
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      {completedStepsCount}/{totalSteps} 步驟
                    </div>
                  </div>
                  <div className="min-h-[76px] relative">
                    {currentSteps.length > 0 ? (
                      <>
                        <div 
                          className={`text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg transition-all duration-300 ${currentSteps.length > 1 ? 'cursor-pointer hover:shadow-md' : ''}`}
                          style={{ backgroundColor: `${subjectColor}08` }}
                          onClick={currentSteps.length > 1 ? (e) => handleStepToggle(e, goal.id) : undefined}
                        >
                          <div className="font-medium mb-1 line-clamp-2">{currentStep.title}</div>
                          <div className="text-xs text-gray-500">
                            {currentStep.tasks.filter(t => t.status === 'in_progress').length > 0 
                              ? `${currentStep.tasks.filter(t => t.status === 'in_progress').length} 個進行中`
                              : `${currentStep.tasks.filter(t => t.status === 'todo').length} 個待開始`
                            }
                          </div>
                        </div>
                        {/* 步驟指示點 */}
                        {currentSteps.length > 1 && (
                          <div className="absolute -bottom-2 left-0 right-0 flex justify-center items-center gap-2 mt-2">
                            {currentSteps.map((_, index) => (
                              <button
                                key={index}
                                className="w-1.5 h-1.5 rounded-full transition-all cursor-pointer hover:scale-125"
                                style={{ 
                                  backgroundColor: index === currentIndex ? subjectColor : `${subjectColor}40`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentStepIndexes(prev => ({
                                    ...prev,
                                    [goal.id]: index
                                  }));
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => onGoalClick(goal.id)}
                        className="w-full text-sm text-gray-500 p-3 rounded-lg transition-all duration-200 hover:shadow-md flex flex-col items-center gap-2"
                        style={{ backgroundColor: `${subjectColor}08` }}
                      >
                        <div className="font-medium">現在沒有進行中的步驟</div>
                        <div className="text-xs flex items-center gap-1.5">
                          一起挑選一個吧
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* 最近完成 */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4" style={{ color: subjectColor }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      最近完成
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completedSteps.length > 0 ? (
                      completedSteps.map(step => (
                        <div 
                          key={step.id}
                          className="text-xs text-gray-600 dark:text-gray-400 p-2 rounded flex items-center gap-2"
                          style={{ backgroundColor: `${subjectColor}05` }}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subjectColor }}
                          />
                          <span className="truncate">{step.title}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 italic text-center py-2 px-3 rounded-lg" style={{ backgroundColor: `${subjectColor}05` }}>
                        趕快來紀錄你完成的任務吧！
                      </div>
                    )}
                  </div>
                </div>

                {/* 進度圓圈 - 右下角 */}
                <div className="absolute bottom-4 right-4">
                  <CircularProgress 
                    value={progress} 
                    size={32} 
                    strokeWidth={3}
                    color={subjectColor}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 如果沒有目標 */}
      {goals.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-200 dark:border-gray-600 max-w-md mx-auto">
            <div className="text-gray-600 dark:text-gray-300 text-lg mb-2 font-semibold">還沒有設定目標</div>
            <div className="text-sm text-gray-500">開始建立你的學習目標吧！</div>
          </div>
        </div>
      )}
    </div>
  );
};