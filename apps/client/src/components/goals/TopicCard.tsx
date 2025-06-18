import { Topic } from '../../types/goal';

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onClick: () => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      {/* TODO: 實現主題卡片內容 */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {topic.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {topic.description}
          </p>
        </div>
      </div>
    </button>
  );
};
