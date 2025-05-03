import { Goal } from '../../types/goal';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  onClick: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      {/* ... 卡片內容 ... */}
    </button>
  );
};
