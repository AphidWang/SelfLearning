import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { 
  Target, ChevronRight, Plus, Calendar, 
  ArrowRight, Sparkles, Brain, BookOpen,
  Lightbulb, CheckCircle2, AlertCircle
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'personal' | 'project';
  status: 'active' | 'completed' | 'paused';
  dueDate?: Date;
  progress: number;
  actionItems: ActionItem[];
  source: 'student' | 'mentor';
  createdAt: Date;
}

interface ActionItem {
  id: string;
  description: string;
  estimatedTime?: string;
  status: 'todo' | 'in-progress' | 'done';
  addedToSchedule: boolean;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

const mockGoals: Goal[] = [
  {
    id: '1',
    title: '完成科學探索專案',
    description: '透過觀察、實驗和記錄，探索自然現象並培養科學思維',
    category: 'learning',
    status: 'active',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    progress: 35,
    source: 'mentor',
    createdAt: new Date(),
    actionItems: [
      {
        id: '1-1',
        description: '閱讀科學家傳記，了解科學研究方法',
        estimatedTime: '2小時',
        status: 'done',
        addedToSchedule: true,
        priority: 'high'
      },
      {
        id: '1-2',
        description: '進行水的三態實驗並記錄觀察',
        estimatedTime: '1.5小時',
        status: 'in-progress',
        addedToSchedule: true,
        priority: 'high'
      },
      {
        id: '1-3',
        description: '整理實驗數據並製作圖表',
        status: 'todo',
        addedToSchedule: false,
        priority: 'medium'
      }
    ]
  },
  {
    id: '2',
    title: '環島旅行學習計畫',
    description: '結合地理、歷史和文化的實地探索之旅',
    category: 'project',
    status: 'active',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 60)),
    progress: 20,
    source: 'student',
    createdAt: new Date(),
    actionItems: [
      {
        id: '2-1',
        description: '規劃路線並研究各地特色',
        estimatedTime: '3小時',
        status: 'done',
        addedToSchedule: true,
        priority: 'high'
      },
      {
        id: '2-2',
        description: '準備旅行日誌模板',
        status: 'todo',
        addedToSchedule: false,
        priority: 'medium'
      }
    ]
  }
];

const goalTemplates = [
  {
    icon: <Brain className="h-5 w-5 text-purple-500" />,
    title: '學習目標',
    description: '設定特定科目或技能的學習目標',
    category: 'learning'
  },
  {
    icon: <Target className="h-5 w-5 text-blue-500" />,
    title: '個人成長',
    description: '培養習慣、發展興趣或自我提升',
    category: 'personal'
  },
  {
    icon: <Sparkles className="h-5 w-5 text-green-500" />,
    title: '專案計畫',
    description: '規劃並執行一個完整的學習專案',
    category: 'project'
  }
];

const StudentPlanning: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showActionItemModal, setShowActionItemModal] = useState(false);

  const handleAddToSchedule = (goalId: string, actionItemId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          actionItems: goal.actionItems.map(item => 
            item.id === actionItemId 
              ? { ...item, addedToSchedule: true }
              : item
          )
        };
      }
      return goal;
    }));
  };

  return (
    <PageLayout title="學習計畫">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Goals List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">我的目標</h2>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增目標
              </button>
            </div>

            <div className="space-y-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedGoal?.id === goal.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                      : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {goal.description}
                      </p>
                    </div>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      goal.source === 'mentor'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {goal.source === 'mentor' ? '老師指派' : '自訂'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">進度</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {goal.dueDate && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Intl.DateTimeFormat('zh-TW', {
                        month: 'long',
                        day: 'numeric'
                      }).format(goal.dueDate)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              目標設定小技巧
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    具體且可衡量
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    設定明確的目標和可量化的指標
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    分解大目標
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    將大目標拆解成小步驟，逐步達成
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                  <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    定期回顧
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    每週檢視進度，適時調整計畫
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Goal Details & Action Items */}
        <div className="lg:col-span-2">
          {selectedGoal ? (
            <div className="space-y-6">
              {/* Goal Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedGoal.title}
                    </h2>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {selectedGoal.description}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">總進度</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedGoal.progress}%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">已完成項目</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedGoal.actionItems.filter(item => item.status === 'done').length}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">待辦項目</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedGoal.actionItems.filter(item => item.status === 'todo').length}
                    </p>
                  </div>
                </div>

                {/* Action Items */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      行動計畫
                    </h3>
                    <button
                      onClick={() => setShowActionItemModal(true)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新增行動項目
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedGoal.actionItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <div className="flex-shrink-0 mr-3">
                          {item.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : item.status === 'in-progress' ? (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${
                            item.status === 'done'
                              ? 'text-gray-500 dark:text-gray-400 line-through'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {item.description}
                          </p>
                          <div className="mt-1 flex items-center space-x-3 text-sm">
                            {item.estimatedTime && (
                              <span className="text-gray-500 dark:text-gray-400">
                                預計 {item.estimatedTime}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.priority === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : item.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {item.priority === 'high' ? '優先' : item.priority === 'medium' ? '一般' : '次要'}
                            </span>
                          </div>
                        </div>
                        {!item.addedToSchedule && (
                          <button
                            onClick={() => handleAddToSchedule(selectedGoal.id, item.id)}
                            className="ml-4 inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            加入課表
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI 學習助理</h3>
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm opacity-90 mb-4">
                  需要協助拆解目標或規劃學習路徑嗎？我可以幫你：
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-left transition">
                    <ArrowRight className="h-4 w-4 mb-2" />
                    將目標拆解成可執行的小步驟
                  </button>
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-left transition">
                    <ArrowRight className="h-4 w-4 mb-2" />
                    建議適合的學習資源和方法
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="max-w-sm mx-auto">
                <Target className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  選擇一個目標開始
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  從左側選擇一個目標，或點擊「新增目標」來開始規劃你的學習之旅。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                選擇目標類型
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {goalTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setShowTemplateModal(false);
                      setShowNewGoalModal(true);
                    }}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition text-left"
                  >
                    <div className="flex items-center mb-3">
                      {template.icon}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {template.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default StudentPlanning;