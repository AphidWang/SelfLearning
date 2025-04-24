
import React, { useState } from 'react';
import { Star, Trophy, Medal, Gift, Plus } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'badge' | 'points' | 'achievement';
  requirements: string[];
  icon: string;
  value: number;
}

const mockRewards: Reward[] = [
  {
    id: '1',
    title: '科學探索者',
    description: '完成 5 個科學實驗',
    type: 'badge',
    requirements: ['完成 5 個實驗任務'],
    icon: 'medal',
    value: 100
  },
  {
    id: '2',
    title: '勤奮學習',
    description: '連續 7 天完成學習任務',
    type: 'achievement',
    requirements: ['連續 7 天登入', '每天完成至少 1 個任務'],
    icon: 'trophy',
    value: 150
  }
];

const RewardSystem: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const getRewardIcon = (icon: string) => {
    switch (icon) {
      case 'medal':
        return <Medal className="h-6 w-6" />;
      case 'trophy':
        return <Trophy className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">獎勵系統</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新增獎勵
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockRewards.map((reward) => (
          <div
            key={reward.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => setSelectedReward(reward)}
          >
            <div className="flex items-start">
              <div className={`
                p-2 rounded-lg mr-4
                ${reward.type === 'badge' 
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  : reward.type === 'achievement'
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }
              `}>
                {getRewardIcon(reward.icon)}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {reward.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {reward.description}
                </p>
                
                <div className="mt-3 space-y-1">
                  {reward.requirements.map((req, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                      {req}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 flex items-center">
                  <Gift className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {reward.value} 點數
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Reward Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                新增獎勵
              </h3>
              
              {/* Modal form content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    獎勵名稱
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="輸入獎勵名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    獎勵描述
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="描述獎勵內容和獲得條件"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    獎勵類型
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="badge">徽章</option>
                    <option value="points">點數</option>
                    <option value="achievement">成就</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    獎勵點數
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="設定獎勵點數"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    // Handle reward creation
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  建立
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardSystem;
