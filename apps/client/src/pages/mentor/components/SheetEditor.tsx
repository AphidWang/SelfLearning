/**
 * Sheet Editor 組件
 * 
 * 功能：
 * - 類似 Excel 的互動式編輯器
 * - 單點選中、雙點編輯
 * - 複製貼上
 * - 方向鍵移動
 * - 自動複製上一列內容（時間除外）
 * - 建立/更新 Google Calendar Event
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Check, Copy, Plus, MoreVertical, Edit3, Trash2, X, CalendarDays } from 'lucide-react';
import {
  CourseSheetWithDetails,
  CourseSheetRow,
  CourseSheetStudent,
} from '../../../services/courseSchedulerApi';
import { courseSchedulerApi } from '../../../services/courseSchedulerApi';
import { RowEditModal } from './RowEditModal';

interface SheetEditorProps {
  sheet: CourseSheetWithDetails;
  onSheetUpdate: () => void;
}

interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

type CellField = 'title' | 'suggested_approach' | 'learning_objectives' | 'materials' | 'student_ids' | 'scheduled_time';

const COLUMNS: Array<{ key: CellField; label: string; width: string }> = [
  { key: 'title', label: '主題', width: '200px' },
  { key: 'suggested_approach', label: '建議進行方式', width: '250px' },
  { key: 'learning_objectives', label: '課堂目標', width: '250px' },
  { key: 'materials', label: '素材', width: '250px' },
  { key: 'student_ids', label: '學生', width: '150px' },
  { key: 'scheduled_time', label: '時間', width: '180px' },
];

export const SheetEditor: React.FC<SheetEditorProps> = ({ sheet, onSheetUpdate }) => {
  const [rows, setRows] = useState<CourseSheetRow[]>(sheet.rows || []);
  const [students, setStudents] = useState<CourseSheetStudent[]>(sheet.students || []);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [copiedCell, setCopiedCell] = useState<{ rowIndex: number; colIndex: number; value: any } | null>(null);
  const [creatingEvent, setCreatingEvent] = useState<Set<string>>(new Set());
  const [openMenuRow, setOpenMenuRow] = useState<number | null>(null); // 哪個 row 的選單是打開的
  const [editingRow, setEditingRow] = useState<number | null>(null); // 正在編輯的 row index
  const [openTimeMenuRow, setOpenTimeMenuRow] = useState<number | null>(null); // 哪個 row 的時間選單是打開的
  const [editedRows, setEditedRows] = useState<Map<number, Partial<CourseSheetRow>>>(new Map()); // 追蹤編輯過的 row
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set()); // 追蹤已儲存的 row ID

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeMenuRef = useRef<HTMLDivElement>(null);
  const timeModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRows(sheet.rows || []);
    setStudents(sheet.students || []);
    // 初始化已儲存的 row IDs
    const savedIds = new Set((sheet.rows || []).map(r => r.id));
    setSavedRows(savedIds);
  }, [sheet]);

  // 當進入編輯模式時，聚焦輸入框
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  // 獲取後面五堂課的時間選項
  const getNextFiveClasses = useCallback((): Array<{ value: string; label: string; date: Date }> => {
    if (!sheet.regular_schedule || sheet.regular_schedule.length === 0) {
      return [];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 找出所有已使用的時間
    const usedTimes = rows
      .map((r) => r.scheduled_time)
      .filter(Boolean)
      .map((t) => new Date(t!).getTime());

    const classes: Array<{ value: string; label: string; date: Date }> = [];
    const DAYS_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

    // 檢查未來 8 週（確保能找到 5 個空堂）
    for (let weekOffset = 0; weekOffset < 8 && classes.length < 5; weekOffset++) {
      for (const schedule of sheet.regular_schedule) {
        if (classes.length >= 5) break;
        
        const scheduleDate = new Date(today);
        const dayDiff = schedule.dayOfWeek - today.getDay();
        scheduleDate.setDate(scheduleDate.getDate() + weekOffset * 7 + dayDiff);
        
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const scheduleTime = new Date(scheduleDate);
        scheduleTime.setHours(startHour, startMinute, 0, 0);

        const timeKey = scheduleTime.getTime();
        if (scheduleTime.getTime() > now.getTime() && !usedTimes.includes(timeKey)) {
          const dateStr = scheduleTime.toISOString();
          const label = `${scheduleTime.getMonth() + 1}/${scheduleTime.getDate()} (${DAYS_LABELS[schedule.dayOfWeek]}) ${schedule.startTime}-${schedule.endTime}`;
          classes.push({ value: dateStr, label, date: scheduleTime });
        }
      }
    }

    return classes;
  }, [sheet.regular_schedule, rows]);

  // 獲取下一個空堂時間（向後兼容）
  const getNextAvailableTime = useCallback((): Date | null => {
    const classes = getNextFiveClasses();
    return classes.length > 0 ? classes[0].date : null;
  }, [getNextFiveClasses]);

  // 獲取 cell 的值（優先顯示編輯中的值）
  const getCellValue = (rowIndex: number, colIndex: number): string => {
    const field = COLUMNS[colIndex].key;
    const editedData = editedRows.get(rowIndex);
    const row = rows[rowIndex];

    // 優先使用編輯中的值
    const displayRow = editedData ? { ...row, ...editedData } : row;
    if (!displayRow && rowIndex < rows.length) return '';

    if (field === 'student_ids') {
      const studentIds = displayRow?.student_ids || [];
      if (!studentIds || studentIds.length === 0) {
        return '全部學生';
      }
      const selectedStudents = students.filter((s) => studentIds.includes(s.id));
      if (selectedStudents.length === 0) {
        return '全部學生';
      }
      return selectedStudents.map((s) => s.student_nickname).join(', ');
    }

    if (field === 'scheduled_time') {
      const scheduledTime = displayRow?.scheduled_time;
      if (!scheduledTime) return '';
      const date = new Date(scheduledTime);
      const DAYS_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
      const dayLabel = DAYS_LABELS[date.getDay()];
      return `${date.getMonth() + 1}/${date.getDate()} (${dayLabel}) ${date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    // 從 data JSONB 中讀取（向後兼容）
    if (field === 'suggested_approach' || field === 'learning_objectives' || field === 'materials') {
      const rowData = displayRow?.data || {};
      if (field === 'materials') {
        // materials 可能是陣列，轉換為字串顯示
        const materials = rowData[field];
        if (Array.isArray(materials)) {
          return materials.join(', ');
        }
        return materials || '';
      }
      return rowData[field] || '';
    }

    return displayRow?.[field] || '';
  };

  // 獲取 cell 的原始值（用於編輯）
  const getCellRawValue = (rowIndex: number, field: CellField): any => {
    const editedData = editedRows.get(rowIndex);
    const row = rows[rowIndex];
    const displayRow = editedData ? { ...row, ...editedData } : row;

    if (field === 'suggested_approach' || field === 'learning_objectives' || field === 'materials') {
      const value = displayRow?.data?.[field];
      if (field === 'materials' && Array.isArray(value)) {
        // materials 如果是陣列，轉換為字串供編輯
        return value.join(', ');
      }
      return value || '';
    }

    return displayRow?.[field] || '';
  };

  // 處理 cell 點擊（直接進入編輯模式）
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const field = COLUMNS[colIndex].key;
    
    // 時間欄位和學生欄位不進入文字編輯模式
    if (field === 'scheduled_time' || field === 'student_ids') {
      setSelectedCell({ rowIndex, colIndex });
      return;
    }

    setSelectedCell({ rowIndex, colIndex });
    setEditingCell({ rowIndex, colIndex });
    
    // 從編輯狀態或原始資料中讀取
    const currentValue = getCellRawValue(rowIndex, field);
    setEditValue(Array.isArray(currentValue) ? '' : String(currentValue || ''));
  };

  // 處理 cell 雙擊（保持原有行為）
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    handleCellClick(rowIndex, colIndex);
  };

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      setSelectedCell({ rowIndex: rowIndex - 1, colIndex });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCell({ rowIndex: rowIndex + 1, colIndex });
    } else if (e.key === 'ArrowLeft' && colIndex > 0) {
      e.preventDefault();
      setSelectedCell({ rowIndex, colIndex: colIndex - 1 });
    } else if (e.key === 'ArrowRight' && colIndex < COLUMNS.length - 1) {
      e.preventDefault();
      setSelectedCell({ rowIndex, colIndex: colIndex + 1 });
    } else if (e.key === 'Enter') {
      handleCellDoubleClick(rowIndex, colIndex);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCell) {
      // 複製
      e.preventDefault();
      const value = rows[selectedCell.rowIndex]?.[COLUMNS[selectedCell.colIndex].key];
      setCopiedCell({ rowIndex: selectedCell.rowIndex, colIndex: selectedCell.colIndex, value });
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedCell) {
      // 貼上
      e.preventDefault();
      handlePaste(copiedCell.rowIndex, copiedCell.colIndex, rowIndex, colIndex);
    }
  };

  // 處理貼上
  const handlePaste = async (
    sourceRowIndex: number,
    sourceColIndex: number,
    targetRowIndex: number,
    targetColIndex: number
  ) => {
    const sourceField = COLUMNS[sourceColIndex].key;
    const targetField = COLUMNS[targetColIndex].key;

    if (sourceField !== targetField) return;

    const sourceRow = rows[sourceRowIndex];
    if (!sourceRow) return;

    const value = sourceRow[sourceField];
    await updateCell(targetRowIndex, targetField, value);
  };

  // 儲存編輯（前端暫存）
  const handleSaveEdit = () => {
    if (!editingCell) return;

    const { rowIndex, colIndex } = editingCell;
    const field = COLUMNS[colIndex].key as CellField;

    // 如果是 data JSONB 中的欄位，需要特殊處理
    if (field === 'suggested_approach' || field === 'learning_objectives' || field === 'materials') {
      const row = rows[rowIndex];
      const currentData = row?.data || {};
      let value: any = editValue;
      
      // materials 如果是字串，可以轉換為陣列（用逗號分隔）
      if (field === 'materials' && editValue) {
        value = editValue.split(',').map((item: string) => item.trim()).filter(Boolean);
      }
      
      updateCell(rowIndex, 'data', {
        ...currentData,
        [field]: value,
      });
    } else if (field !== 'student_ids' && field !== 'scheduled_time') {
      // 只有非下拉選單和時間欄位才需要手動 updateCell
      updateCell(rowIndex, field, editValue);
    }
    
    setEditingCell(null);
  };

  // 更新 cell（前端編輯，不立即儲存）
  const updateCell = (rowIndex: number, field: CellField | 'data', value: any) => {
    if (rowIndex >= rows.length) {
      // 建立新 row（前端暫存）
      const newRow: Partial<CourseSheetRow> = {
        title: null,
        student_ids: [],
        scheduled_time: null,
        data: {
          suggested_approach: null,
          learning_objectives: null,
          materials: [],
          homework: null,
          notes: null,
          attachments: [],
        },
        custom_fields: {},
      };

      // 複製上一列的內容（除了時間）
      if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        newRow.title = lastRow.title;
        newRow.student_ids = [...(lastRow.student_ids || [])];
        newRow.data = { ...(lastRow.data || {}) };
        newRow.custom_fields = { ...(lastRow.custom_fields || {}) };
      }

      // 設定欄位值
      if (field === 'data') {
        newRow.data = { ...(newRow.data || {}), ...value };
      } else {
        (newRow as any)[field] = value;
      }

      // 儲存到編輯狀態
      const existingEdit = editedRows.get(rowIndex) || {};
      setEditedRows(new Map(editedRows.set(rowIndex, { ...existingEdit, ...newRow })));
    } else {
      // 更新現有 row（前端暫存）
      const row = rows[rowIndex];
      if (!row) return;
      
      const existingEdit = editedRows.get(rowIndex) || {};
      const updated: Partial<CourseSheetRow> = { ...existingEdit };
      
      if (field === 'data') {
        const currentData = updated.data || row.data || {};
        updated.data = { ...currentData, ...value };
      } else {
        (updated as any)[field] = value;
      }

      // 確保設置編輯狀態（創建新的 Map 以觸發重新渲染）
      const newEditedRows = new Map(editedRows);
      newEditedRows.set(rowIndex, updated);
      setEditedRows(newEditedRows);
      
      // 如果這個 row 之前已經儲存過，現在有編輯，需要從 savedRows 中移除
      if (row.id && savedRows.has(row.id)) {
        const newSavedRows = new Set(savedRows);
        newSavedRows.delete(row.id);
        setSavedRows(newSavedRows);
      }
    }
  };

  // 儲存 row（實際 API 呼叫）
  const handleSaveRow = async (rowIndex: number) => {
    const row = rows[rowIndex];
    const editedData = editedRows.get(rowIndex);

    if (!editedData) {
      // 沒有編輯，不需要儲存
      return;
    }

    try {
      if (!row) {
        // 新 row，需要建立
        const newRow = editedData as Partial<CourseSheetRow>;
        // 確保有必要的預設值
        if (!newRow.data) {
          newRow.data = {
            suggested_approach: null,
            learning_objectives: null,
            materials: [],
            homework: null,
            notes: null,
            attachments: [],
          };
        }
        if (!newRow.custom_fields) {
          newRow.custom_fields = {};
        }
        
        const created = await courseSchedulerApi.createRow(sheet.id, newRow);
        const newRows = [...rows, created];
        setRows(newRows);
        setSavedRows(new Set([...savedRows, created.id]));
        
        // 清除編輯狀態（新 row 的 index 會改變）
        const newEditedRows = new Map(editedRows);
        newEditedRows.delete(rowIndex);
        setEditedRows(newEditedRows);
      } else {
        // 更新現有 row
        const updated = { ...row, ...editedData };
        const saved = await courseSchedulerApi.updateRow(row.id, updated);
        const newRows = [...rows];
        newRows[rowIndex] = saved;
        setRows(newRows);
        setSavedRows(new Set([...savedRows, saved.id]));
        
        // 清除編輯狀態
        const newEditedRows = new Map(editedRows);
        newEditedRows.delete(rowIndex);
        setEditedRows(newEditedRows);
      }

      onSheetUpdate();
    } catch (error) {
      console.error('儲存 row 失敗:', error);
      alert('儲存失敗，請重試');
    }
  };

  // 處理時間選擇（已移除，改用 updateCell）

  // 建立/更新 Calendar Event（如果有未儲存的變更，先儲存）
  const handleCreateCalendarEvent = async (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row) return;

    // 檢查是否有未儲存的變更
    const hasEdits = editedRows.has(rowIndex);
    const isSaved = savedRows.has(row.id);
    
    // 如果有編輯但未儲存，先儲存
    if (hasEdits) {
      try {
        await handleSaveRow(rowIndex);
        // 儲存後，row 可能會更新，需要重新獲取
        const updatedRows = [...rows];
        const updatedRow = updatedRows[rowIndex];
        if (!updatedRow) return;
        
        if (!updatedRow.scheduled_time) {
          alert('請先設定課程時間');
          return;
        }
      } catch (error) {
        console.error('儲存失敗:', error);
        alert('儲存失敗，請重試');
        return;
      }
    } else if (!isSaved) {
      // 如果沒有編輯但未儲存（新 row），提示儲存
      alert('請先儲存課程');
      return;
    }

    // 確保 row 已儲存且有時間
    const finalRow = rows[rowIndex];
    if (!finalRow) return;
    
    if (!finalRow.scheduled_time) {
      alert('請先設定課程時間');
      return;
    }

    setCreatingEvent(new Set([...creatingEvent, finalRow.id]));

    try {
      await courseSchedulerApi.createCalendarEvent(finalRow.id);
      alert('Calendar Event 已建立/更新');
      onSheetUpdate();
    } catch (error: any) {
      console.error('建立 Calendar Event 失敗:', error);
      alert(`建立失敗: ${error.message || '請重試'}`);
    } finally {
      setCreatingEvent(new Set([...Array.from(creatingEvent)].filter((id) => id !== finalRow.id)));
    }
  };

  // 處理複製 row
  const handleCopyRow = async (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row) return;

    const newRow: Partial<CourseSheetRow> = {
      title: row.title,
      student_ids: [...(row.student_ids || [])],
      scheduled_time: null, // 時間不複製
      data: { ...(row.data || {}) },
      custom_fields: { ...(row.custom_fields || {}) },
    };

    try {
      const created = await courseSchedulerApi.createRow(sheet.id, newRow);
      setRows([...rows, created]);
      onSheetUpdate();
      setOpenMenuRow(null);
    } catch (error) {
      console.error('複製 row 失敗:', error);
      alert('複製失敗，請重試');
    }
  };

  // 處理刪除 row
  const handleDeleteRow = async (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row) return;

    if (!confirm('確定要刪除這個課程嗎？')) return;

    try {
      await courseSchedulerApi.deleteRow(row.id);
      const newRows = rows.filter((_, idx) => idx !== rowIndex);
      setRows(newRows);
      onSheetUpdate();
      setOpenMenuRow(null);
    } catch (error) {
      console.error('刪除 row 失敗:', error);
      alert('刪除失敗，請重試');
    }
  };

  // 處理編輯 row
  const handleEditRow = async (rowIndex: number, rowData: Partial<CourseSheetRow>) => {
    const row = rows[rowIndex];
    if (!row) return;

    try {
      const saved = await courseSchedulerApi.updateRow(row.id, rowData);
      const newRows = [...rows];
      newRows[rowIndex] = saved;
      setRows(newRows);
      onSheetUpdate();
      setEditingRow(null);
    } catch (error) {
      console.error('更新 row 失敗:', error);
      alert('更新失敗，請重試');
    }
  };

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (openMenuRow !== null && menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuRow(null);
      }
      
      if (openTimeMenuRow !== null) {
        // 檢查是否點擊在時間選擇容器或 modal 內
        const timeCellRef = timeMenuRef.current;
        const modalRef = timeModalRef.current;
        const clickedInTimeCell = timeCellRef?.contains(target);
        const clickedInModal = modalRef?.contains(target);
        
        console.log('🕐 [Click Outside] checking', { 
          openTimeMenuRow, 
          timeCellRefExists: !!timeCellRef,
          modalRefExists: !!modalRef,
          clickedInTimeCell,
          clickedInModal,
          target: (target as HTMLElement)?.tagName,
          targetClass: (target as HTMLElement)?.className
        });
        
        // 如果點擊在時間欄位或 modal 外，才關閉
        if (!clickedInTimeCell && !clickedInModal) {
          console.log('🕐 [Click Outside] closing time menu');
          setOpenTimeMenuRow(null);
          setEditingCell(null);
        } else {
          console.log('🕐 [Click Outside] click is inside time menu/modal, not closing');
        }
      }
    };

    if (openMenuRow !== null || openTimeMenuRow !== null) {
      // 使用 capture phase 來更早捕獲事件
      document.addEventListener('mousedown', handleClickOutside, true);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [openMenuRow, openTimeMenuRow]);

  // 新增 row
  const handleAddRow = async () => {
    const newRow: Partial<CourseSheetRow> = {
      title: null,
      student_ids: [],
      scheduled_time: getNextAvailableTime()?.toISOString() || null,
      data: {
        suggested_approach: null,
        learning_objectives: null,
        materials: [],
        homework: null,
        notes: null,
        attachments: [],
      },
      custom_fields: {},
    };

    // 複製上一列的內容（除了時間）
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      newRow.title = lastRow.title;
      newRow.student_ids = [...(lastRow.student_ids || [])];
      newRow.data = { ...(lastRow.data || {}) };
      newRow.custom_fields = { ...(lastRow.custom_fields || {}) };
    }

    try {
      const created = await courseSchedulerApi.createRow(sheet.id, newRow);
      setRows([...rows, created]);
      onSheetUpdate();
    } catch (error) {
      console.error('建立 row 失敗:', error);
      alert('建立失敗，請重試');
    }
  };

  // 渲染 cell
  const renderCell = (rowIndex: number, colIndex: number) => {
    const field = COLUMNS[colIndex].key as CellField;
    const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex;
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;
    const row = rows[rowIndex];

    if (field === 'student_ids') {
      // 學生下拉選單
      const editedData = editedRows.get(rowIndex);
      const displayRow = editedData ? { ...row, ...editedData } : row;
      const studentIds = displayRow?.student_ids || [];
      const isAllStudents = !studentIds || studentIds.length === 0;
      
      return (
        <select
          ref={inputRef as any}
          value={isAllStudents ? 'all' : studentIds[0] || ''}
          onChange={(e) => {
            const newStudentIds = e.target.value === 'all' ? [] : [e.target.value];
            updateCell(rowIndex, 'student_ids', newStudentIds);
          }}
          className="w-full h-full px-2 py-1 border rounded"
          onFocus={() => {
            setSelectedCell({ rowIndex, colIndex });
            setEditingCell({ rowIndex, colIndex });
          }}
          onBlur={() => setEditingCell(null)}
        >
          <option value="all">全部學生</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.student_nickname}
            </option>
          ))}
        </select>
      );
    }

    if (field === 'scheduled_time') {
      // 時間顯示 + 日曆 icon modal
      const editedData = editedRows.get(rowIndex);
      const displayRow = editedData ? { ...row, ...editedData } : row;
      const nextFiveClasses = getNextFiveClasses();
      const currentTime = displayRow?.scheduled_time ? new Date(displayRow.scheduled_time).toISOString() : '';
      const isTimeMenuOpen = openTimeMenuRow === rowIndex;

      // 顯示時間文字
      const displayTime = currentTime
        ? (() => {
            const date = new Date(currentTime);
            const DAYS_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
            const dayLabel = DAYS_LABELS[date.getDay()];
            return `${date.getMonth() + 1}/${date.getDate()} (${dayLabel}) ${date.toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}`;
          })()
        : '點擊選擇時間';

      return (
        <div 
          className="w-full h-full flex items-center gap-2 px-2 py-1 relative cursor-pointer"
          onClick={(e) => {
            console.log('🕐 [Time Cell] onClick triggered', { rowIndex, isTimeMenuOpen });
            e.stopPropagation();
            e.preventDefault();
            setOpenTimeMenuRow(isTimeMenuOpen ? null : rowIndex);
            setEditingCell({ rowIndex, colIndex });
          }}
          onMouseDown={(e) => {
            console.log('🕐 [Time Cell] onMouseDown triggered', { rowIndex });
            e.stopPropagation();
          }}
          ref={timeMenuRef}
        >
          <span className="flex-1 text-sm">{displayTime}</span>
          <CalendarDays size={16} className="text-gray-500" />
          {isTimeMenuOpen && (
            <div 
              ref={timeModalRef}
              className="fixed bg-white dark:bg-gray-800 border rounded-lg shadow-xl z-[9999] min-w-[280px]"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => {
                console.log('🕐 [Time Modal] onMouseDown', e.target);
                e.stopPropagation();
              }}
              onClick={(e) => {
                console.log('🕐 [Time Modal] onClick', e.target);
                e.stopPropagation();
              }}
            >
              <div className="p-3 space-y-3">
                  {/* 快速選擇：後面五堂課 */}
                  {nextFiveClasses.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">快速選擇</label>
                      {nextFiveClasses.map((cls) => {
                        const clsValue = cls.value;
                        const isSelected = currentTime === clsValue;
                        return (
                          <button
                            key={clsValue}
                            type="button"
                            onMouseDown={(e) => {
                              console.log('🕐 [Time Option] onMouseDown', clsValue);
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              console.log('🕐 [Time Option] onClick', clsValue);
                              e.stopPropagation();
                              e.preventDefault();
                              updateCell(rowIndex, 'scheduled_time', clsValue);
                              setOpenTimeMenuRow(null);
                              setEditingCell(null);
                            }}
                            className={`w-full px-3 py-2 text-left border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              isSelected ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : ''
                            }`}
                          >
                            {cls.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 自訂時間 */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">自訂時間</label>
                    <input
                      type="datetime-local"
                      value={currentTime ? new Date(currentTime).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        console.log('🕐 [Time Input] onChange', e.target.value);
                        e.stopPropagation();
                        if (e.target.value) {
                          const localDate = new Date(e.target.value);
                          updateCell(rowIndex, 'scheduled_time', localDate.toISOString());
                          setOpenTimeMenuRow(null);
                          setEditingCell(null);
                        }
                      }}
                      onMouseDown={(e) => {
                        console.log('🕐 [Time Input] onMouseDown');
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        console.log('🕐 [Time Input] onClick');
                        e.stopPropagation();
                      }}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  
                  {/* 清除時間 */}
                  {currentTime && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        console.log('🕐 [Clear Button] onMouseDown');
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        console.log('🕐 [Clear Button] onClick');
                        e.stopPropagation();
                        e.preventDefault();
                        updateCell(rowIndex, 'scheduled_time', null);
                        setOpenTimeMenuRow(null);
                        setEditingCell(null);
                      }}
                      className="w-full px-3 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900 border border-red-300 dark:border-red-700 rounded transition-colors"
                    >
                      清除時間
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>
      );
    }

    // 一般顯示（點擊即可編輯）
    const displayValue = getCellValue(rowIndex, colIndex);
    const isTextarea = field === 'suggested_approach' || field === 'learning_objectives';
    
    return (
      <div
        className={`w-full h-full px-2 py-1 flex items-center ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
        } ${!isEditing ? 'cursor-text' : ''}`}
        onClick={() => {
          if (!isEditing) {
            handleCellClick(rowIndex, colIndex);
          }
        }}
      >
        {isEditing ? (
          (() => {
            const InputComponent = isTextarea ? 'textarea' : 'input';
            return (
              <InputComponent
                ref={inputRef as any}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isTextarea) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
                className="w-full px-2 py-1 border-2 border-blue-500 rounded"
                style={{ minHeight: isTextarea ? '80px' : 'auto' }}
                autoFocus
              />
            );
          })()
        ) : (
          displayValue || <span className="text-gray-400">點擊編輯</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto border rounded-lg bg-white dark:bg-gray-800 relative">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
            <tr>
              <th className="border p-2 w-12">操作</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="border p-2 text-left"
                  style={{ minWidth: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const editedData = editedRows.get(rowIndex);
              const hasEdits = editedData !== undefined && Object.keys(editedData).length > 0;
              const isSaved = savedRows.has(row.id);
              const displayRow = editedData ? { ...row, ...editedData } : row;
              
              return (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border p-1 relative">
                  <div className="flex items-center gap-1">
                    {/* 如果有編輯但未儲存，顯示 Save 按鈕 */}
                    {hasEdits && !isSaved && (
                      <button
                        onClick={() => handleSaveRow(rowIndex)}
                        className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                        title="儲存變更"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    {/* 如果已儲存且沒有未儲存的變更，顯示 Mail 按鈕 */}
                    {isSaved && !hasEdits && (
                      <button
                        onClick={() => handleCreateCalendarEvent(rowIndex)}
                        disabled={creatingEvent.has(row.id) || !displayRow?.scheduled_time}
                        className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded disabled:opacity-50"
                        title="確認課程 / 送出通知"
                      >
                        {creatingEvent.has(row.id) ? (
                          <Calendar size={16} className="animate-spin" />
                        ) : (
                          <Calendar size={16} />
                        )}
                      </button>
                    )}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuRow(openMenuRow === rowIndex ? null : rowIndex);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="更多選項"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuRow === rowIndex && (
                        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEditingRow(rowIndex);
                              setOpenMenuRow(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit3 size={14} />
                            編輯
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCopyRow(rowIndex);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Copy size={14} />
                            複製
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteRow(rowIndex);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-red-100 dark:hover:bg-red-900 text-red-500 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            刪除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {COLUMNS.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className="border p-0"
                    style={{ minWidth: col.width, height: '40px' }}
                    onClick={(e) => {
                      // 時間欄位不觸發 handleCellClick，因為 renderCell 中已經處理
                      if (col.key === 'scheduled_time') {
                        // 讓時間欄位的點擊事件冒泡到 renderCell 中的處理
                        return;
                      }
                      handleCellClick(rowIndex, colIndex);
                    }}
                    onDoubleClick={(e) => {
                      if (col.key === 'scheduled_time') {
                        return;
                      }
                      handleCellDoubleClick(rowIndex, colIndex);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    tabIndex={0}
                  >
                    {renderCell(rowIndex, colIndex)}
                  </td>
                ))}
              </tr>
              );
            })}
            {/* 空 row（用於新增） */}
            {(() => {
              const newRowIndex = rows.length;
              const hasNewRowEdits = editedRows.has(newRowIndex);
              
              return (
              <tr key={`new-row-${newRowIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border p-1">
                  {hasNewRowEdits && (
                    <button
                      onClick={() => handleSaveRow(newRowIndex)}
                      className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                      title="儲存新課程"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </td>
              {COLUMNS.map((col, colIndex) => (
                <td
                  key={col.key}
                  className="border p-0"
                  style={{ minWidth: col.width, height: '40px' }}
                  onClick={(e) => {
                    if (col.key === 'scheduled_time') {
                      return;
                    }
                    handleCellClick(rows.length, colIndex);
                  }}
                  onDoubleClick={(e) => {
                    if (col.key === 'scheduled_time') {
                      return;
                    }
                    handleCellDoubleClick(rows.length, colIndex);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, rows.length, colIndex)}
                  tabIndex={0}
                >
                  {renderCell(rows.length, colIndex)}
                </td>
              ))}
              </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      {copiedCell && (
        <div className="mt-2 text-sm text-gray-500">
          已複製：{getCellValue(copiedCell.rowIndex, copiedCell.colIndex)} (Ctrl+V 貼上)
        </div>
      )}

      {/* Row 編輯 Modal */}
      {editingRow !== null && rows[editingRow] && (
        <RowEditModal
          row={rows[editingRow]}
          students={students}
          nextFiveClasses={getNextFiveClasses()}
          onClose={() => setEditingRow(null)}
          onSave={(rowData) => handleEditRow(editingRow, rowData)}
        />
      )}
    </div>
  );
};
