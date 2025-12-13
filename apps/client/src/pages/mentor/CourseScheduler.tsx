/**
 * 課程排程系統主頁面
 * 
 * 功能：
 * - 顯示所有 course sheets
 * - 建立新 sheet
 * - 編輯/刪除 sheet
 * - 進入 sheet 編輯器
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Calendar, Users, BookOpen, X } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { courseSchedulerApi, CourseSheet } from '../../services/courseSchedulerApi';
import { SUBJECTS } from '../../constants/subjects';
import { useUser } from '../../context/UserContext';
import { SheetEditor } from './components/SheetEditor';
import { SheetProfileModal } from './components/SheetProfileModal';

const CourseScheduler: React.FC = () => {
  const { currentUser } = useUser();
  const [sheets, setSheets] = useState<CourseSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<CourseSheet | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSheet, setEditingSheet] = useState<CourseSheet | null>(null);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const data = await courseSchedulerApi.getSheets();
      setSheets(data);
    } catch (error) {
      console.error('載入 sheets 失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async (sheetData: Partial<CourseSheet>) => {
    try {
      await courseSchedulerApi.createSheet(sheetData);
      await loadSheets();
      setShowCreateModal(false);
    } catch (error) {
      console.error('建立 sheet 失敗:', error);
      alert('建立失敗，請重試');
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!confirm('確定要刪除這個課程表嗎？')) return;

    try {
      await courseSchedulerApi.deleteSheet(sheetId);
      await loadSheets();
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(null);
      }
    } catch (error) {
      console.error('刪除 sheet 失敗:', error);
      alert('刪除失敗，請重試');
    }
  };

  const handleEditSheet = async (sheetId: string, sheetData: Partial<CourseSheet>) => {
    try {
      await courseSchedulerApi.updateSheet(sheetId, sheetData);
      await loadSheets();
      setEditingSheet(null);
      // 如果正在編輯的 sheet 被選中，重新載入
      if (selectedSheet?.id === sheetId) {
        const updated = await courseSchedulerApi.getSheet(sheetId);
        setSelectedSheet(updated as any);
      }
    } catch (error) {
      console.error('更新 sheet 失敗:', error);
      alert('更新失敗，請重試');
    }
  };

  const handleSelectSheet = async (sheet: CourseSheet) => {
    try {
      const fullSheet = await courseSchedulerApi.getSheet(sheet.id);
      setSelectedSheet(fullSheet as any);
    } catch (error) {
      console.error('載入 sheet 詳情失敗:', error);
    }
  };

  if (selectedSheet) {
    // 如果正在編輯，顯示編輯 modal
    if (editingSheet) {
      return (
        <PageLayout title="課程排程">
          <SheetProfileModal
            sheet={editingSheet}
            onClose={() => {
              setEditingSheet(null);
              // 關閉時重新載入 sheet 資料
              handleSelectSheet(editingSheet);
            }}
            onSave={async (data) => {
              await handleEditSheet(editingSheet.id, data);
              // 更新後重新載入選中的 sheet
              const updated = await courseSchedulerApi.getSheet(editingSheet.id);
              setSelectedSheet(updated as any);
            }}
          />
        </PageLayout>
      );
    }

    return (
      <PageLayout title="課程排程">
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setSelectedSheet(null)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <X size={20} />
            </button>
            <h1 className="text-2xl font-bold">{selectedSheet.title}</h1>
            <button
              onClick={() => setEditingSheet(selectedSheet)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Edit3 size={16} />
              編輯設定
            </button>
          </div>
          <SheetEditor sheet={selectedSheet} onSheetUpdate={loadSheets} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="課程排程">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">課程排程管理</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={20} />
            新增課程表
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">載入中...</div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">還沒有建立任何課程表</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              建立第一個課程表
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectSheet(sheet)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{sheet.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen size={16} />
                      <span>{sheet.subject}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSheet(sheet);
                      }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.id);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} />
                    <span>老師: {sheet.teacher_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>
                      {sheet.regular_schedule.length > 0
                        ? `${sheet.regular_schedule.length} 個時段`
                        : '未設定時段'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 建立 Sheet Modal */}
        {showCreateModal && (
          <SheetProfileModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateSheet}
            defaultTeacherEmail={currentUser?.email || ''}
          />
        )}

        {/* 編輯 Sheet Modal */}
        {editingSheet && (
          <SheetProfileModal
            sheet={editingSheet}
            onClose={() => setEditingSheet(null)}
            onSave={(data) => handleEditSheet(editingSheet.id, data)}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default CourseScheduler;
