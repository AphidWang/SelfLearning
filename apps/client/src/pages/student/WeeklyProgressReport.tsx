import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, Plus, Trash2, Minus, Star, Brain, Eye } from 'lucide-react';
import { weeklyReportStorage, SubjectData } from '../../services/weeklyReportStorage';

// SubjectData 介面已在 weeklyReportStorage 中定義

const WeeklyProgressReport: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [columnWidths, setColumnWidths] = useState({
    subject: 120,        // 科目欄
    goals: 280,          // 目標欄
    extraGoals: 220,     // 額外目標欄
    progress: 160,       // 進度欄
    difficulty: 100,     // 難度欄
    efficiency: 100,     // 效率欄
    focus: 100,          // 專心欄
    mood: 100,           // 心情欄
    actions: 90          // 操作欄
  });
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await weeklyReportStorage.loadData();
        setSubjects(data);
      } catch (error) {
        console.error('載入資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 自動儲存
  useEffect(() => {
    if (!isLoading && subjects.length > 0) {
      const saveData = async () => {
        try {
          await weeklyReportStorage.saveData(subjects);
        } catch (error) {
          console.error('自動儲存失敗:', error);
        }
      };
      
      // 延遲儲存避免過於頻繁
      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [subjects, isLoading]);

  const handleEditSubject = (id: string, field: keyof SubjectData, value: string | number) => {
    setSubjects(prev => prev.map(subject => 
      subject.id === id ? { ...subject, [field]: value } : subject
    ));
  };

  const handleEditGoal = (id: string, goalIndex: number, value: string) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === id) {
        const newGoals = [...subject.goals];
        newGoals[goalIndex] = value;
        return { ...subject, goals: newGoals };
      }
      return subject;
    }));
  };

  const handleEditExtraGoal = (id: string, goalIndex: number, value: string) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === id) {
        const newExtraGoals = [...(subject.extraGoals || [''])];
        newExtraGoals[goalIndex] = value;
        return { ...subject, extraGoals: newExtraGoals };
      }
      return subject;
    }));
  };

  const addGoal = (subjectId: string) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        return { ...subject, goals: [...subject.goals, ''] };
      }
      return subject;
    }));
  };

  const removeGoal = (subjectId: string, goalIndex: number) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId && subject.goals.length > 1) {
        const newGoals = subject.goals.filter((_, index) => index !== goalIndex);
        return { ...subject, goals: newGoals };
      }
      return subject;
    }));
  };

  const addExtraGoal = (subjectId: string) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        return { ...subject, extraGoals: [...(subject.extraGoals || ['']), ''] };
      }
      return subject;
    }));
  };

  const removeExtraGoal = (subjectId: string, goalIndex: number) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId && (subject.extraGoals || ['']).length > 1) {
        const newExtraGoals = (subject.extraGoals || ['']).filter((_, index) => index !== goalIndex);
        return { ...subject, extraGoals: newExtraGoals };
      }
      return subject;
    }));
  };

  const addNewSubject = () => {
    const newId = Math.max(...subjects.map(s => parseInt(s.id))) + 1;
    setSubjects(prev => [...prev, {
      id: newId.toString(),
      subject: '',
      topic: '',
      goals: [''],
      extraGoals: [''],
      plannedSessions: 0,
      difficulty: 0,
      efficiency: 0,
      focus: 0,
      mood: '',
      completedSessions: 0
    }]);
  };

  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(subject => subject.id !== id));
  };


  const handleColumnResize = (column: keyof typeof columnWidths, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(50, width) // 最小寬度 50px
    }));
  };

  const ResizableColumnHeader: React.FC<{
    children: React.ReactNode;
    column: keyof typeof columnWidths;
    className?: string;
  }> = ({ children, column, className = "" }) => {
    const [isResizing, setIsResizing] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isEditMode) return;
      
      const startX = e.clientX;
      const startWidth = columnWidths[column];
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff);
        handleColumnResize(column, newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      setIsResizing(true);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      e.preventDefault();
      e.stopPropagation();
    };

    return (
      <th 
        className={className}
        style={{ width: `${columnWidths[column]}px`, minWidth: `${columnWidths[column]}px` }}
      >
        <div className="flex items-center justify-between relative">
          <span>{children}</span>
          {isEditMode && (
            <div
              className={`w-3 h-8 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 cursor-col-resize ml-2 rounded-sm shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                isResizing ? 'scale-110 from-orange-500 to-pink-500' : ''
              }`}
              onMouseDown={handleMouseDown}
              title="拖拽調整欄寬"
            >
              <div className="w-0.5 h-4 bg-white rounded-full opacity-60"></div>
            </div>
          )}
        </div>
      </th>
    );
  };

  const toggleSessionComplete = (subjectId: string, sessionIndex: number) => {
    if (isEditMode) return;
    
    setSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        const newCompleted = sessionIndex < subject.completedSessions 
          ? sessionIndex 
          : sessionIndex + 1;
        return { ...subject, completedSessions: Math.min(newCompleted, subject.plannedSessions) };
      }
      return subject;
    }));
  };

  const renderSessionCircles = (subject: SubjectData) => {
    const circles: React.ReactElement[] = [];
    const totalCircles = 6; // 總是顯示6個圈圈
    
    for (let i = 0; i < totalCircles; i++) {
      const isPlanned = i < subject.plannedSessions; // 是否在計劃範圍內
      const isCompleted = i < subject.completedSessions;
      
      if (isPlanned) {
        // 實線圈圈 (計劃內的堂數)
        circles.push(
          <motion.div
            key={i}
            className={`w-12 h-12 border-2 rounded-full cursor-pointer transition-all duration-200 progress-circle ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 border-green-500 completed' 
                : 'bg-white border-gray-300 hover:border-orange-400'
            }`}
            onClick={() => toggleSessionComplete(subject.id, i)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        );
      } else {
        // 虛線圈圈 (填補到6個)
        circles.push(
          <div
            key={i}
            className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-full progress-circle opacity-70"
          />
        );
      }
    }
    return circles;
  };

  const renderRatingIcons = (type: 'difficulty' | 'efficiency' | 'focus', value: number) => {
    const Icon = type === 'difficulty' ? Star : type === 'efficiency' ? Brain : Eye;
    const colorClass = type === 'difficulty' ? 'text-red-800' : type === 'efficiency' ? 'text-blue-800' : 'text-green-800';
    const baseClass = `h-4 w-4 ${colorClass} stroke-[2]`;
    // 規則布局：難度 2+3、效率 3+2、專心 2+3
    const layouts: Record<string, { rows: number[][] }> = {
      difficulty: { rows: [[1, 2], [3, 4, 5]] },
      efficiency: { rows: [[1, 2, 3], [4, 5]] },
      focus: { rows: [[1, 2], [3, 4, 5]] },
    };
    const layout = layouts[type];
    return (
      <div className="flex flex-col items-center gap-0.5">
        {layout.rows.map((indices, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {indices.map((i) => (
              <Icon
                key={`${type}-${i}`}
                className={`${baseClass} ${i <= value ? 'opacity-100' : 'opacity-40'}`}
                fill={i <= value ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Loading 狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border-2 border-orange-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg text-gray-700">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 landscape;
            margin: 15mm;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { 
            background: white !important;
            font-size: 13px !important;
          }
          * { 
            background: white !important; 
            color: black !important;
            box-shadow: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table { 
            border-collapse: separate !important;
            border-spacing: 0 !important;
            border: 2px solid #000 !important;
            border-radius: 0 !important;
            width: 100% !important;
            table-layout: fixed !important;
            font-size: 11px !important;
          }
          /* 使用固定寬度比例來保持一致性 */
          table th:nth-child(1), table td:nth-child(1) { 
            width: ${columnWidths.subject}px !important;
            min-width: ${columnWidths.subject}px !important;
            max-width: ${columnWidths.subject}px !important;
          }
          table th:nth-child(2), table td:nth-child(2) { 
            width: ${columnWidths.goals}px !important;
            min-width: ${columnWidths.goals}px !important;
            max-width: ${columnWidths.goals}px !important;
          }
          table th:nth-child(3), table td:nth-child(3) { 
            width: ${columnWidths.extraGoals}px !important;
            min-width: ${columnWidths.extraGoals}px !important;
            max-width: ${columnWidths.extraGoals}px !important;
          }
          table th:nth-child(4), table td:nth-child(4) { 
            width: ${columnWidths.progress}px !important;
            min-width: ${columnWidths.progress}px !important;
            max-width: ${columnWidths.progress}px !important;
          }
          table th:nth-child(5), table td:nth-child(5) { 
            width: ${columnWidths.difficulty}px !important;
            min-width: ${columnWidths.difficulty}px !important;
            max-width: ${columnWidths.difficulty}px !important;
          }
          table th:nth-child(6), table td:nth-child(6) { 
            width: ${columnWidths.efficiency}px !important;
            min-width: ${columnWidths.efficiency}px !important;
            max-width: ${columnWidths.efficiency}px !important;
          }
          table th:nth-child(7), table td:nth-child(7) { 
            width: ${columnWidths.focus}px !important;
            min-width: ${columnWidths.focus}px !important;
            max-width: ${columnWidths.focus}px !important;
          }
          table th:nth-child(8), table td:nth-child(8) { 
            width: ${columnWidths.mood}px !important;
            min-width: ${columnWidths.mood}px !important;
            max-width: ${columnWidths.mood}px !important;
          }
          th, td { 
            border-top: 1px solid #000 !important;
            border-left: 1px solid #000 !important;
            background: white !important;
            border-radius: 0 !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
          }
          /* 第一欄的左邊框設為粗線 */
          table tr td:first-child,
          table tr th:first-child {
            border-left: 2px solid #000 !important;
          }
          /* 最後一欄的右邊框 */
          table tr td:last-child,
          table tr th:last-child {
            border-right: 2px solid #000 !important;
          }
          /* 第一行的上邊框設為粗線 */
          table thead tr:first-child th {
            border-top: 2px solid #000 !important;
          }
          /* 最後一行的底邊框 */
          table tbody tr:last-child td {
            border-bottom: 2px solid #000 !important;
          }
          /* 進度圓圈在列印時的樣式 */
          .progress-circle {
            width: 12px !important;
            height: 12px !important;
            border: 1px solid #000 !important;
            border-radius: 50% !important;
            display: inline-block !important;
            margin: 0 1px !important;
          }
          .progress-circle.completed {
            background: #000 !important;
          }
          /* 虛線圓圈在列印時的樣式 */
          .progress-circle.border-dashed {
            border: 1px dashed #888 !important;
            background: transparent !important;
          }
          .bg-gradient-to-r { background: white !important; }
          .backdrop-blur-md { backdrop-filter: none !important; }
          .rounded-xl, .rounded-2xl, .rounded-lg, .rounded-sm { border-radius: 0 !important; }
          .overflow-hidden { overflow: visible !important; }
          .rounded-full { border-radius: 50% !important; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 print:p-2 print:bg-white text-[16px] md:text-[17px]">
        <div className="w-[70%] mx-auto max-w-none print:w-full print:max-w-none print-container">
        {/* Header */}
        <motion.div 
          className="mb-8 no-print"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border-2 border-orange-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  週學習進度報表
                </h1>
                <p className="text-gray-600 mt-2">
                  追蹤本週各科目的學習進度與目標達成情況
                  {isEditMode && (
                    <span className="block text-sm text-orange-600 mt-1">
                      💡 拖拽表頭右側的橙色調整桿可以改變欄寬
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3 no-print">
                {isEditMode && (
                  <motion.button
                    onClick={addNewSubject}
                    className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-4 w-4" />
                    新增科目
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-6 py-2 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2 ${
                    isEditMode 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                      : 'bg-gradient-to-r from-orange-400 to-pink-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEditMode ? (
                    <>
                      <Save className="h-4 w-4" />
                      儲存
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      編輯
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Table */}
        <motion.div 
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-black overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-gray-100">
                <tr>
                  <ResizableColumnHeader 
                    column="subject"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    科目
                  </ResizableColumnHeader>
                  <ResizableColumnHeader 
                    column="goals"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    目標
                  </ResizableColumnHeader>
                  <ResizableColumnHeader 
                    column="extraGoals"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    額外目標
                  </ResizableColumnHeader>
                  <ResizableColumnHeader 
                    column="progress"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    進度追蹤
                  </ResizableColumnHeader>
                  {/* 移除主表的本月主題欄，改為下方獨立表格顯示 */}
                  <ResizableColumnHeader 
                    column="difficulty"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    難度
                  </ResizableColumnHeader>
                  <ResizableColumnHeader 
                    column="efficiency"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    效率
                  </ResizableColumnHeader>
                  <ResizableColumnHeader 
                    column="focus"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    專心
                  </ResizableColumnHeader>
                  <ResizableColumnHeader 
                    column="mood"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-r border-black"
                  >
                    心情
                  </ResizableColumnHeader>
                  {isEditMode && (
                    <ResizableColumnHeader 
                      column="actions"
                      className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b border-black"
                    >
                      操作
                    </ResizableColumnHeader>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {subjects.map((subject, index) => (
                  <motion.tr 
                    key={subject.id}
                    className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.subject}px`, minWidth: `${columnWidths.subject}px` }}
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={subject.subject}
                          onChange={(e) => handleEditSubject(subject.id, 'subject', e.target.value)}
                          className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="科目名稱"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{subject.subject}</span>
                      )}
                    </td>

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.goals}px`, minWidth: `${columnWidths.goals}px` }}
                    >
                      {isEditMode ? (
                        <div className="space-y-2">
                          {subject.goals.map((goal, goalIndex) => (
                            <div key={goalIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={goal}
                                onChange={(e) => handleEditGoal(subject.id, goalIndex, e.target.value)}
                                className="flex-1 p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                                placeholder={`目標 ${goalIndex + 1}`}
                              />
                              {subject.goals.length > 1 && (
                                <button
                                  onClick={() => removeGoal(subject.id, goalIndex)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="刪除目標"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addGoal(subject.id)}
                            className="w-full p-2 border-2 border-dashed border-black text-black rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            新增目標
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {subject.goals.map((goal, goalIndex) => (
                            <div 
                              key={goalIndex}
                              className="text-gray-700 text-base py-1 border-b border-gray-200 min-h-[24px]"
                            >
                              {goal}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.extraGoals}px`, minWidth: `${columnWidths.extraGoals}px` }}
                    >
                      {isEditMode ? (
                        <div className="space-y-2">
                          {(subject.extraGoals || ['']).map((goal, goalIndex) => (
                            <div key={goalIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={goal}
                                onChange={(e) => handleEditExtraGoal(subject.id, goalIndex, e.target.value)}
                                className="flex-1 p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder={`額外目標 ${goalIndex + 1}`}
                              />
                              {(subject.extraGoals || ['']).length > 1 && (
                                <button
                                  onClick={() => removeExtraGoal(subject.id, goalIndex)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="刪除額外目標"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addExtraGoal(subject.id)}
                            className="w-full p-2 border-2 border-dashed border-black text-black rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            新增額外目標
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(subject.extraGoals || []).map((goal, goalIndex) => (
                            <div 
                              key={goalIndex}
                              className="text-gray-700 text-base py-1 min-h-[24px]"
                            >
                              {goal}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.progress}px`, minWidth: `${columnWidths.progress}px` }}
                    >
                      <div className="flex justify-start items-center gap-2">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={subject.plannedSessions}
                            onChange={(e) => handleEditSubject(subject.id, 'plannedSessions', parseInt(e.target.value) || 0)}
                            className="w-16 p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
                            min="0"
                            max="20"
                          />
                        ) : (
                          <div className="flex gap-1">
                            {renderSessionCircles(subject)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 本月主題欄位已移除 */}

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.difficulty}px`, minWidth: `${columnWidths.difficulty}px` }}
                    >
                      {isEditMode ? (
                        <input
                          type="number"
                          value={subject.difficulty || 0}
                          onChange={(e) => handleEditSubject(subject.id, 'difficulty', Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                          className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
                          placeholder="0-5"
                          min="0"
                          max="5"
                        />
                      ) : (
                        <div className="flex items-center justify-center">{renderRatingIcons('difficulty', Number(subject.difficulty || 0))}</div>
                      )}
                    </td>

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.efficiency}px`, minWidth: `${columnWidths.efficiency}px` }}
                    >
                      {isEditMode ? (
                        <input
                          type="number"
                          value={subject.efficiency || 0}
                          onChange={(e) => handleEditSubject(subject.id, 'efficiency', Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                          className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
                          placeholder="0-5"
                          min="0"
                          max="5"
                        />
                      ) : (
                        <div className="flex items-center justify-center">{renderRatingIcons('efficiency', Number(subject.efficiency || 0))}</div>
                      )}
                    </td>

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.focus}px`, minWidth: `${columnWidths.focus}px` }}
                    >
                      {isEditMode ? (
                        <input
                          type="number"
                          value={Number(subject.focus || 0)}
                          onChange={(e) => handleEditSubject(subject.id, 'focus' as keyof SubjectData, Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                          className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
                          placeholder="0-5"
                          min="0"
                          max="5"
                        />
                      ) : (
                        <div className="flex items-center justify-center">{renderRatingIcons('focus', Number(subject.focus || 0))}</div>
                      )}
                    </td>

                    <td 
                      className="px-4 py-4 border-b border-r border-black"
                      style={{ width: `${columnWidths.mood}px`, minWidth: `${columnWidths.mood}px` }}
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={subject.mood || ''}
                          onChange={(e) => handleEditSubject(subject.id, 'mood', e.target.value)}
                          className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
                          placeholder="心情"
                        />
                      ) : (
                        <div className="text-gray-700 text-center">{subject.mood || ''}</div>
                      )}
                    </td>

                    {isEditMode && (
                      <td 
                        className="px-6 py-4 border-b border-black text-center"
                        style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
                      >
                        <button
                          onClick={() => removeSubject(subject.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="刪除科目"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Progress Summary */}
        <motion.div 
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 no-print"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-orange-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">總計劃堂數</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              {subjects.reduce((sum, subject) => sum + subject.plannedSessions, 0)}
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-green-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">已完成堂數</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {subjects.reduce((sum, subject) => sum + subject.completedSessions, 0)}
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">完成率</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {subjects.reduce((sum, subject) => sum + subject.plannedSessions, 0) > 0 
                ? Math.round((subjects.reduce((sum, subject) => sum + subject.completedSessions, 0) / 
                   subjects.reduce((sum, subject) => sum + subject.plannedSessions, 0)) * 100)
                : 0}%
            </div>
          </div>
        </motion.div>

        {/* Topic Table placed under total planned sessions */}
        <motion.div 
          className="mt-6 no-print"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-orange-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 border-b border-orange-200 text-sm font-semibold text-gray-700">科目 / 本月主題</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r border-black" style={{ width: '200px' }}>科目</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-black">本月主題</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={`topic-${s.id}`} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all duration-200">
                      <td className="px-4 py-3 border-b border-r border-black">
                        <span className="font-medium text-gray-800">{s.subject}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-black">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={s.topic}
                            onChange={(e) => handleEditSubject(s.id, 'topic', e.target.value)}
                            className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="本月學習主題"
                          />
                        ) : (
                          <span className="text-gray-700">{s.topic}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </>
  );
};

export default WeeklyProgressReport;
