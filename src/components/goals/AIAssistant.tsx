import { Sparkles, ArrowRight } from 'lucide-react';

interface AIAssistantProps {
  onBreakdownGoal: () => void;
  onSuggestResources: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onBreakdownGoal,
  onSuggestResources
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI 學習助理</h3>
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="text-sm opacity-90 mb-4">
        需要協助拆解目標或規劃學習路徑嗎？我可以幫你：
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onBreakdownGoal}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-left transition"
        >
          <ArrowRight className="h-4 w-4 mb-2" />
          將目標拆解成可執行的小步驟
        </button>
        <button 
          onClick={onSuggestResources}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-left transition"
        >
          <ArrowRight className="h-4 w-4 mb-2" />
          建議適合的學習資源和方法
        </button>
      </div>
    </div>
  );
}; 