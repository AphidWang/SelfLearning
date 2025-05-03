import React, { useState } from 'react';
import { Plus, Upload, Download, BookOpen, Target, Clock } from 'lucide-react';

interface CurriculumTemplate {
  id: string;
  title: string;
  description: string;
  subjects: string[];
  duration: string;
  objectives: string[];
}

interface CurriculumPlannerProps {
  onCreatePlan?: (plan: any) => void;
  onImportPlan?: (file: File) => void;
}

const mockTemplates: CurriculumTemplate[] = [
  {
    id: '1',
    title: '自然科學基礎課程',
    description: '適合國小高年級的基礎自然科學課程',
    subjects: ['自然科學'],
    duration: '一學期',
    objectives: [
      '理解基本科學概念',
      '培養觀察能力',
      '學習實驗方法'
    ]
  },
  {
    id: '2',
    title: '數學思維訓練',
    description: '培養邏輯思維和解題能力',
    subjects: ['數學'],
    duration: '一學期',
    objectives: [
      '強化邏輯推理',
      '提升解題技巧',
      '建立數學概念'
    ]
  }
];

const CurriculumPlanner: React.FC<CurriculumPlannerProps> = ({
  onCreatePlan,
  onImportPlan
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportPlan) {
      onImportPlan(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-6 w-6 text-indigo-500 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">建立新課程</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">從頭開始規劃新的課程</p>
        </button>

        <label className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          <input type="file" className="hidden" onChange={handleFileImport} accept=".csv,.xlsx" />
          <Upload className="h-6 w-6 text-green-500 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">匯入課程</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">從 CSV 或 Excel 匯入</p>
        </label>

        <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Download className="h-6 w-6 text-blue-500 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">匯出課程</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">下載課程規劃範本</p>
        </button>
      </div>

      {/* Template Library */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">課程範本庫</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Target className="h-4 w-4 mr-2" />
                  <span>目標：{template.objectives[0]}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>時長：{template.duration}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {template.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                選擇課程範本
              </h3>
              {/* Modal content */}
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    // Handle template selection
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  使用範本
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumPlanner;