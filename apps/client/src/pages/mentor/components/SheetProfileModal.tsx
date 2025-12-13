/**
 * Sheet Profile 設定 Modal
 * 
 * 功能：
 * - 設定 sheet 的基本資訊（標題、科目、老師 email）
 * - 管理學生列表
 * - 設定日常課程時間
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { CourseSheet, CourseSheetStudent } from '../../../services/courseSchedulerApi';
import { SUBJECTS } from '../../../constants/subjects';
import { courseSchedulerApi } from '../../../services/courseSchedulerApi';

interface SheetProfileModalProps {
  sheet?: CourseSheet;
  defaultTeacherEmail?: string;
  onClose: () => void;
  onSave: (data: Partial<CourseSheet>) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: '星期日' },
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
];

export const SheetProfileModal: React.FC<SheetProfileModalProps> = ({
  sheet,
  defaultTeacherEmail = '',
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(sheet?.title || '');
  const [subject, setSubject] = useState(sheet?.subject || '');
  const [teacherEmail, setTeacherEmail] = useState(sheet?.teacher_email || defaultTeacherEmail);
  const [defaultEmailTitle, setDefaultEmailTitle] = useState(
    sheet?.default_email_title || '課程通知'
  );
  const [regularSchedule, setRegularSchedule] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  >(sheet?.regular_schedule || []);
  const [students, setStudents] = useState<CourseSheetStudent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sheet) {
      loadStudents();
    }
  }, [sheet]);

  const loadStudents = async () => {
    if (!sheet) return;
    try {
      const fullSheet = await courseSchedulerApi.getSheet(sheet.id);
      setStudents(fullSheet.students || []);
    } catch (error) {
      console.error('載入學生失敗:', error);
    }
  };

  const handleAddSchedule = () => {
    setRegularSchedule([
      ...regularSchedule,
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    setRegularSchedule(regularSchedule.filter((_, i) => i !== index));
  };

  const handleUpdateSchedule = (
    index: number,
    field: 'dayOfWeek' | 'startTime' | 'endTime',
    value: number | string
  ) => {
    const updated = [...regularSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setRegularSchedule(updated);
  };

  const handleAddStudent = async () => {
    if (!sheet) return;
    const nickname = prompt('請輸入學生暱稱:');
    const email = prompt('請輸入學生 email:');
    if (!nickname || !email) return;

    try {
      const newStudent = await courseSchedulerApi.addStudent(sheet.id, {
        student_nickname: nickname,
        student_email: email,
      });
      setStudents([...students, newStudent]);
    } catch (error) {
      console.error('新增學生失敗:', error);
      alert('新增失敗，請重試');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('確定要刪除這個學生嗎？')) return;
    try {
      await courseSchedulerApi.deleteStudent(studentId);
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('刪除學生失敗:', error);
      alert('刪除失敗，請重試');
    }
  };

  const handleSave = () => {
    if (!title || !subject || !teacherEmail) {
      alert('請填寫所有必填欄位');
      return;
    }

    onSave({
      title,
      subject,
      teacher_email: teacherEmail,
      default_email_title: defaultEmailTitle,
      regular_schedule: regularSchedule,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {sheet ? '編輯課程表設定' : '建立新課程表'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本資訊 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">課程表名稱 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="例如：數學課程表"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">科目 *</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                >
                  <option value="">請選擇</option>
                  {Object.values(SUBJECTS).map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">老師 Email *</label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="teacher@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">預設信件標題</label>
                <input
                  type="text"
                  value={defaultEmailTitle}
                  onChange={(e) => setDefaultEmailTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="課程通知"
                />
              </div>
            </div>
          </div>

          {/* 日常課程時間 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">日常課程時間</h3>
              <button
                onClick={handleAddSchedule}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
              >
                <Plus size={14} />
                新增時段
              </button>
            </div>
            <div className="space-y-2">
              {regularSchedule.map((schedule, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) =>
                      handleUpdateSchedule(index, 'dayOfWeek', parseInt(e.target.value))
                    }
                    className="px-2 py-1 border rounded dark:bg-gray-600"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => handleUpdateSchedule(index, 'startTime', e.target.value)}
                    className="px-2 py-1 border rounded dark:bg-gray-600"
                  />
                  <span>~</span>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => handleUpdateSchedule(index, 'endTime', e.target.value)}
                    className="px-2 py-1 border rounded dark:bg-gray-600"
                  />
                  <button
                    onClick={() => handleRemoveSchedule(index)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {regularSchedule.length === 0 && (
                <p className="text-sm text-gray-500">尚未設定日常課程時間</p>
              )}
            </div>
          </div>

          {/* 學生管理（僅編輯模式） */}
          {sheet && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">學生列表</h3>
                <button
                  onClick={handleAddStudent}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                >
                  <Plus size={14} />
                  新增學生
                </button>
              </div>
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div>
                      <div className="font-medium">{student.student_nickname}</div>
                      <div className="text-sm text-gray-500">{student.student_email}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-gray-500">尚未新增學生</p>
                )}
              </div>
            </div>
          )}

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
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
