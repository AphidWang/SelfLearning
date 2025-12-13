/**
 * Row 編輯 Modal（手機寬度）
 * 
 * 功能：
 * - 編輯 row 的所有欄位
 * - 手機寬度適配
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CourseSheetRow, CourseSheetStudent } from '../../../services/courseSchedulerApi';

interface RowEditModalProps {
  row: CourseSheetRow;
  students: CourseSheetStudent[];
  nextFiveClasses: Array<{ value: string; label: string; date: Date }>;
  onClose: () => void;
  onSave: (rowData: Partial<CourseSheetRow>) => void;
}

export const RowEditModal: React.FC<RowEditModalProps> = ({
  row,
  students,
  nextFiveClasses,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(row.title || '');
  const [suggestedApproach, setSuggestedApproach] = useState(row.data?.suggested_approach || '');
  const [learningObjectives, setLearningObjectives] = useState(row.data?.learning_objectives || '');
  const [studentIds, setStudentIds] = useState<string[]>(row.student_ids || []);
  const [scheduledTime, setScheduledTime] = useState(row.scheduled_time || '');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState('');

  useEffect(() => {
    // 檢查時間是否在預設選項中
    if (scheduledTime) {
      const isInPreset = nextFiveClasses.some(c => {
        const presetTime = new Date(c.value).getTime();
        const rowTime = new Date(scheduledTime).getTime();
        return Math.abs(presetTime - rowTime) < 60000;
      });
      setIsCustomTime(!isInPreset);
      if (!isInPreset) {
        setCustomTimeValue(new Date(scheduledTime).toISOString().slice(0, 16));
      }
    }
  }, [scheduledTime, nextFiveClasses]);

  const handleSave = () => {
    const rowData: Partial<CourseSheetRow> = {
      title: title || null,
      scheduled_time: scheduledTime || null,
      student_ids: studentIds,
      data: {
        ...row.data,
        suggested_approach: suggestedApproach || null,
        learning_objectives: learningObjectives || null,
      },
    };

    onSave(rowData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">編輯課程</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 主題 */}
          <div>
            <label className="block text-sm font-medium mb-1">主題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              placeholder="課程主題"
            />
          </div>

          {/* 建議進行方式 */}
          <div>
            <label className="block text-sm font-medium mb-1">建議進行方式</label>
            <textarea
              value={suggestedApproach}
              onChange={(e) => setSuggestedApproach(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              rows={3}
              placeholder="建議進行方式"
            />
          </div>

          {/* 課堂目標 */}
          <div>
            <label className="block text-sm font-medium mb-1">課堂目標</label>
            <textarea
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              rows={3}
              placeholder="課堂目標"
            />
          </div>

          {/* 學生 */}
          <div>
            <label className="block text-sm font-medium mb-1">學生</label>
            <select
              multiple
              value={studentIds.length === 0 ? ['all'] : studentIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                if (selected.includes('all')) {
                  setStudentIds([]);
                } else {
                  setStudentIds(selected.filter(id => id !== 'all'));
                }
              }}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              size={Math.min(students.length + 1, 5)}
            >
              <option value="all">全部學生</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_nickname}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">按住 Ctrl/Cmd 可多選</p>
          </div>

          {/* 時間 */}
          <div>
            <label className="block text-sm font-medium mb-1">時間</label>
            <select
              value={isCustomTime ? 'custom' : scheduledTime}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomTime(true);
                } else {
                  setIsCustomTime(false);
                  setScheduledTime(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 mb-2"
            >
              <option value="">請選擇時間</option>
              {nextFiveClasses.map((classOption, idx) => (
                <option key={idx} value={classOption.value}>
                  {classOption.label}
                </option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {isCustomTime && (
              <input
                type="datetime-local"
                value={customTimeValue}
                onChange={(e) => {
                  setCustomTimeValue(e.target.value);
                  if (e.target.value) {
                    const localDate = new Date(e.target.value);
                    setScheduledTime(localDate.toISOString());
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
