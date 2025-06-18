import React, { useState } from 'react';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { CircularProgress } from './CircularProgress';
import { Play, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface TopicProgressDialogProps {
  onClose: () => void;
  onTopicClick: (topicId: string) => void;
}

export const TopicProgressDialog: React.FC<TopicProgressDialogProps> = ({
  onClose,
  onTopicClick,
}) => {
  const { getActiveTopics, getActiveGoals, getCompletionRate } = useTopicStore();
  const topics = getActiveTopics();
  
  // 當前顯示的目標索引
  const [currentGoalIndexes, setCurrentGoalIndexes] = useState<Record<string, number>>({});

  // 獲取最近完成的目標
  const getRecentlyCompletedGoals = (topicId: string) => {
    // MOCK DATA - 之後要移除
    const mockGoals = [
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
    
    const goals = getActiveGoals(topicId);
    const realCompletedGoals = goals
      .filter(goal => goal.tasks.every(task => task.status === 'done'));
    
    // 用 topicId 的最後一個字元來決定是否回傳空陣列
    if (realCompletedGoals.length === 0) {
      const lastChar = topicId.charCodeAt(topicId.length - 1);
      return lastChar % 3 === 0 ? [] : mockGoals;
    }
    
    return realCompletedGoals.slice(-2);
  };

  // 獲取主題當前進行中的目標（最多2個）
  const getInProgressGoals = (topicId: string) => {
    // MOCK DATA - 之後要移除
    const mockGoals = {
      // 一個進行中的目標
      single: {
        id: 'mock-g1',
        title: '完成微積分第三章作業',
        tasks: [
          { status: 'in_progress' },
          { status: 'todo' }
        ]
      },
      // 兩個進行中的目標
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

    const goals = getActiveGoals(topicId);
    
    // 用 topicId 的字元來產生一個簡單的 hash
    const hash = topicId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // 每五個 hash 值就一個是空的
    if (hash % 5 === 0) {
      return [];
    }
    
    // 用 hash 決定要取幾個目標
    const shouldGetTwo = hash % 2 === 1;
    
    // 如果沒有真實目標，根據 hash 回傳假資料
    if (goals.length === 0) {
      if (shouldGetTwo) {
        return [mockGoals.double1, mockGoals.double2];
      } else {
        return [mockGoals.single];
      }
    }

    // 先找進行中的目標
    const inProgressGoals = goals.filter(goal => 
      goal.tasks.some(task => task.status === 'in_progress')
    );

    // 再找待開始的目標
    const todoGoals = goals.filter(goal => 
      !inProgressGoals.includes(goal) && 
      goal.tasks.some(task => task.status === 'todo')
    );

    // 組合目標
    const allGoals = [...inProgressGoals, ...todoGoals];
    
    // 如果沒有任何可用的目標，回傳空陣列
    if (allGoals.length === 0) {
      return [];
    }

    // 根據 shouldGetTwo 決定回傳一個還是兩個目標
    return shouldGetTwo ? allGoals.slice(0, 2) : allGoals.slice(0, 1);
  };

  // 處理目標切換 - 直接切換到另一個目標
  const handleGoalToggle = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    setCurrentGoalIndexes(prev => ({
      ...prev,
      [topicId]: prev[topicId] === 1 ? 0 : 1 // 在 0 和 1 之間切換
    }));
  };

  return (
    <div className="max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max px-4">
          {topics.map(topic => {
            const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
            const progress = getCompletionRate(topic.id);
            const currentGoals = getInProgressGoals(topic.id);
            const completedGoals = getRecentlyCompletedGoals(topic.id);
            const goals = getActiveGoals(topic.id);
            const totalGoals = goals.length;
            const completedGoalsCount = goals.filter(g => g.tasks.every(t => t.status === 'done')).length;
            
            // 當前顯示的目標索引
            const currentIndex = currentGoalIndexes[topic.id] || 0;
            const currentGoal = currentGoals[currentIndex];
            
            return (
              <div 
                key={topic.id}
                className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 shadow-xl w-64 flex-shrink-0 border-2 transition-all duration-200 hover:shadow-2xl relative"
                style={{ 
                  borderColor: subjectStyle.accent,
                  boxShadow: `0 10px 25px ${subjectStyle.accent}15`
                }}
              >
                {/* 打開主題按鈕 */}
                <button
                  onClick={() => onTopicClick(topic.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white dark:bg-gray-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  style={{
                    color: subjectStyle.accent,
                    borderColor: `${subjectStyle.accent}30`,
                    borderWidth: 1,
                  }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                {/* 主題名稱 */}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 pr-6">
                    {topic.title}
                  </h3>
                  <div 
                    className="text-xs px-2 py-1 rounded-md font-medium inline-block"
                    style={{ backgroundColor: subjectStyle.accent + '20', color: subjectStyle.accent }}
                  >
                    {topic.subject || '未分類'}
                  </div>
                </div>

                {/* 當前進行 */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" style={{ color: subjectStyle.accent }} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        當前進行
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      {completedGoalsCount}/{totalGoals} 目標
                    </div>
                  </div>
                  <div className="min-h-[76px] relative">
                    {currentGoals.length > 0 ? (
                      <>
                        <div 
                          className={`text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg transition-all duration-300 ${currentGoals.length > 1 ? 'cursor-pointer hover:shadow-md' : ''}`}
                          style={{ backgroundColor: `${subjectStyle.accent}08` }}
                          onClick={currentGoals.length > 1 ? (e) => handleGoalToggle(e, topic.id) : undefined}
                        >
                          <div className="font-medium mb-1 line-clamp-2">{currentGoal.title}</div>
                          <div className="text-xs text-gray-500">
                            {currentGoal.tasks.filter(t => t.status === 'in_progress').length > 0 
                              ? `${currentGoal.tasks.filter(t => t.status === 'in_progress').length} 個進行中`
                              : `${currentGoal.tasks.filter(t => t.status === 'todo').length} 個待開始`
                            }
                          </div>
                        </div>
                        {/* 目標指示點 */}
                        {currentGoals.length > 1 && (
                          <div className="absolute -bottom-2 left-0 right-0 flex justify-center items-center gap-2 mt-2">
                            {currentGoals.map((_, index) => (
                              <button
                                key={index}
                                className="w-1.5 h-1.5 rounded-full transition-all cursor-pointer hover:scale-125"
                                style={{ 
                                  backgroundColor: index === currentIndex ? subjectStyle.accent : `${subjectStyle.accent}40`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentGoalIndexes(prev => ({
                                    ...prev,
                                    [topic.id]: index
                                  }));
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => onTopicClick(topic.id)}
                        className="w-full text-sm text-gray-500 p-3 rounded-lg transition-all duration-200 hover:shadow-md flex flex-col items-center gap-2"
                        style={{ backgroundColor: `${subjectStyle.accent}08` }}
                      >
                        <div className="font-medium">現在沒有進行中的目標</div>
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
                    <CheckCircle2 className="w-4 h-4" style={{ color: subjectStyle.accent }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      最近完成
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completedGoals.length > 0 ? (
                      completedGoals.map(goal => (
                        <div 
                          key={goal.id}
                          className="text-xs text-gray-600 dark:text-gray-400 p-2 rounded flex items-center gap-2"
                          style={{ backgroundColor: `${subjectStyle.accent}05` }}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subjectStyle.accent }}
                          />
                          <span className="truncate">{goal.title}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 italic text-center py-2 px-3 rounded-lg" style={{ backgroundColor: `${subjectStyle.accent}05` }}>
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
                    color={subjectStyle.accent}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 如果沒有主題 */}
      {topics.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-200 dark:border-gray-600 max-w-md mx-auto">
            <div className="text-gray-600 dark:text-gray-300 text-lg mb-2 font-semibold">還沒有設定主題</div>
            <div className="text-sm text-gray-500">開始建立你的學習主題吧！</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 兼容性導出
export const GoalProgressDialog = TopicProgressDialog;
export type { TopicProgressDialogProps, TopicProgressDialogProps as GoalProgressDialogProps };