import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TopicOverviewDialog } from './TopicOverviewDialog';
import { useTopicStore } from '../../store/topicStore';

/**
 * TopicOverviewDialog 使用示例
 * 
 * 這個組件展示如何在你的應用中使用 TopicOverviewDialog
 */
interface Props {
  topicId?: string;
}

export const TopicOverviewExample: React.FC<Props> = ({ topicId }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const { getActiveTopics } = useTopicStore();
  
  const activeTopics = getActiveTopics();
  const currentTopic = topicId ? activeTopics.find(t => t.id === topicId) : activeTopics[0];
  
  if (!currentTopic) {
    return null;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">主題概覽示例</h2>
      
      {/* 主題選擇按鈕 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {activeTopics.map(topic => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopicId(topic.id)}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 text-left"
            style={{ borderLeftColor: '#6366f1' }} // 可以根據學科顏色調整
          >
            <h3 className="font-semibold text-gray-800 mb-2">{topic.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{topic.description}</p>
            <div className="mt-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {topic.subject || '未分類'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* TopicOverviewDialog */}
      <AnimatePresence>
        {selectedTopicId && (
          <TopicOverviewDialog
            topicId={selectedTopicId}
            onClose={() => setSelectedTopicId(null)}
            onTopicClick={(topicId) => {
              console.log('點擊進入主題詳情:', topicId);
              // 這裡可以導航到主題詳情頁面
              // 例如：router.push(`/topics/${topicId}`)
            }}
          />
        )}
      </AnimatePresence>

      {/* 使用說明 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">使用說明</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>📱 響應式設計：</strong> 自動適應不同屏幕大小，任務卡片會根據屏幕寬度調整列數</p>
          <p><strong>📊 週進度追蹤：</strong> 自動標示本週新完成的任務，用綠色高亮和動畫顯示</p>
          <p><strong>🎨 學科主題色：</strong> 根據主題的學科自動調整顏色主題</p>
          <p><strong>📈 進度視覺化：</strong> 時間軸式目標展示，每個目標顯示完成百分比</p>
          <p><strong>🔄 即時更新：</strong> 與 topicStore 同步，任何狀態變更都會即時反映</p>
        </div>
      </div>

      {/* 代碼示例 */}
      <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <div className="text-gray-300 mb-2">// 基本用法</div>
        <pre>{`import { TopicOverviewDialog } from './components/learning-map';

// 在你的組件中
const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

return (
  <AnimatePresence>
    {selectedTopicId && (
      <TopicOverviewDialog
        topicId={selectedTopicId}
        onClose={() => setSelectedTopicId(null)}
        onTopicClick={(topicId) => {
          // 處理點擊進入主題詳情
          router.push(\`/topics/\${topicId}\`);
        }}
      />
    )}
  </AnimatePresence>
);`}</pre>
      </div>
    </div>
  );
};

// 兼容性導出
export const GoalOverviewExample = TopicOverviewExample;
export default TopicOverviewExample; 