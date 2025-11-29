import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Save, Minus, Palette, Check } from 'lucide-react';
import { 
  weeklyPlanStorage, 
  WeeklyPlanData, 
  DaySchedule
} from '../../services/weeklyPlanStorage';

// 顏色選項
const BACKGROUND_COLORS = [
  { name: '白色', value: 'ffffff', hex: '#FFFFFF' },
  { name: '粉紅', value: 'ffd5dc', hex: '#FFD5DC' },
  { name: '淺藍', value: 'e0f2fe', hex: '#E0F2FE' },
  { name: '淺橙', value: 'fff3e0', hex: '#FFF3E0' },
  { name: '淺紫', value: 'f3e5f5', hex: '#F3E5F5' },
  { name: '淺黃', value: 'fff8e1', hex: '#FFF8E1' },
  { name: '淺綠', value: 'e8f5e8', hex: '#E8F5E8' },
  { name: '淺桃', value: 'fce4ec', hex: '#FCE4EC' },
  { name: '淺天藍', value: 'e3f2fd', hex: '#E3F2FD' },
  { name: '淺檸檬', value: 'fffde7', hex: '#FFFDE7' },
  { name: '淺薄荷', value: 'f1f8e9', hex: '#F1F8E9' },
  { name: '淺紫羅蘭', value: 'fef7ff', hex: '#FEF7FF' },
  { name: '淺青', value: 'e0f7fa', hex: '#E0F7FA' }
];

const WEEKDAYS = [
  { key: 'monday', label: '週一' },
  { key: 'tuesday', label: '週二' },
  { key: 'wednesday', label: '週三' },
  { key: 'thursday', label: '週四' },
  { key: 'friday', label: '週五' },
  { key: 'saturday', label: '週六' },
  { key: 'sunday', label: '週日' }
] as const;

const SLOTS = [
  { key: 'clubBefore', label: '社團活動', width: 'w-20' },
  { key: 'morning', label: '上午', width: 'w-36' },
  { key: 'afternoon', label: '下午', width: 'w-36' },
  { key: 'clubAfter', label: '社團活動', width: 'w-20' },
  { key: 'noteAfter', label: '小紀錄 / 心情', width: 'w-20', isNote: true }
] as const;


const WeeklyPlan: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [data, setData] = useState<WeeklyPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [colorPickerItem, setColorPickerItem] = useState<{
    dayKey: keyof WeeklyPlanData['weeklyPlan'];
    slotKey: keyof DaySchedule;
    itemIndex: number;
  } | null>(null);
  const [selectedCard, setSelectedCard] = useState<{
    dayKey: keyof WeeklyPlanData['weeklyPlan'];
    slotKey: keyof DaySchedule;
    itemIndex: number;
  } | null>(null);

  // 點擊外部關閉顏色選擇器
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerItem && !(e.target as Element).closest('.color-picker-container')) {
        setColorPickerItem(null);
      }
    };
    
    if (colorPickerItem) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [colorPickerItem]);

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const loaded = await weeklyPlanStorage.loadData();
        setData(loaded);
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
    if (!isLoading && data) {
      const saveData = async () => {
        try {
          await weeklyPlanStorage.saveData(data);
          console.log('資料已自動儲存到 localStorage');
        } catch (error) {
          console.error('自動儲存失敗:', error);
        }
      };
      
      // 延遲儲存，避免過於頻繁
      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [data, isLoading]);

  // 頁面卸載前強制儲存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (data && !isLoading) {
        try {
          // localStorage.setItem 是同步的，所以可以直接調用
          // 直接使用同步方式儲存，確保在頁面關閉前完成
          const dataToSave: WeeklyPlanData = {
            ...data,
            lastUpdated: new Date().toISOString(),
            version: '2.1.0'
          };
          try {
            localStorage.setItem('weekly-plan-v2', JSON.stringify(dataToSave));
          } catch (e) {
            console.error('localStorage 儲存失敗:', e);
          }
        } catch (error) {
          console.error('頁面卸載前儲存失敗:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 組件卸載時也嘗試儲存
      if (data && !isLoading) {
        weeklyPlanStorage.saveData(data).catch(err => 
          console.error('組件卸載時儲存失敗:', err)
        );
      }
    };
  }, [data, isLoading]);

  // 生成新 ID
  const generateId = (): string => {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };


  // 更新計劃項目
  const updatePlanItem = (
    dayKey: keyof WeeklyPlanData['weeklyPlan'],
    slotKey: keyof DaySchedule,
    itemIndex: number,
    field: 'subject' | 'goal' | 'task' | 'backgroundColor',
    value: string
  ) => {
    if (!data) return;
    
    setData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      const day = { ...newData.weeklyPlan[dayKey] };
      const slot = { ...day[slotKey] };
      const items = [...slot.items];
      
      items[itemIndex] = { 
        ...items[itemIndex], 
        [field]: value,
        backgroundColor: items[itemIndex].backgroundColor || 'ffffff'
      };
      
      // 確保最後一個項目之後還有一個空行
      const lastItem = items[items.length - 1];
      if (!lastItem || (lastItem.subject || lastItem.goal || lastItem.task)) {
        items.push({ id: generateId(), subject: '', goal: '', task: '', backgroundColor: 'ffffff' });
      }
      
      slot.items = items;
      day[slotKey] = slot;
      newData.weeklyPlan[dayKey] = day;
      
      return newData;
    });
  };


  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl+C 或 Cmd+C 複製
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCard && data) {
        e.preventDefault();
        const item = data.weeklyPlan[selectedCard.dayKey][selectedCard.slotKey].items[selectedCard.itemIndex];
        if (item) {
          const clipboardData = {
            subject: item.subject || '',
            goal: item.goal || '',
            task: item.task || '',
            backgroundColor: item.backgroundColor || 'ffffff'
          };
          try {
            await navigator.clipboard.writeText(JSON.stringify(clipboardData));
          } catch (error) {
            console.error('複製失敗:', error);
          }
        }
      }
      
      // Ctrl+V 或 Cmd+V 貼上
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedCard && data) {
        e.preventDefault();
        try {
          const clipboardText = await navigator.clipboard.readText();
          const clipboardData = JSON.parse(clipboardText);
          
          if (clipboardData.subject !== undefined || clipboardData.goal !== undefined || clipboardData.task !== undefined) {
            setData(prev => {
              if (!prev) return prev;
              
              const newData = { ...prev };
              const day = { ...newData.weeklyPlan[selectedCard.dayKey] };
              const slot = { ...day[selectedCard.slotKey] };
              const items = [...slot.items];
              
              if (items[selectedCard.itemIndex]) {
                items[selectedCard.itemIndex] = {
                  ...items[selectedCard.itemIndex],
                  subject: clipboardData.subject || '',
                  goal: clipboardData.goal || '',
                  task: clipboardData.task || '',
                  backgroundColor: clipboardData.backgroundColor || 'ffffff'
                };
              }
              
              slot.items = items;
              day[selectedCard.slotKey] = slot;
              newData.weeklyPlan[selectedCard.dayKey] = day;
              
              return newData;
            });
          }
        } catch (error) {
          console.error('貼上失敗:', error);
        }
      }
    };
    
    if (isEditMode) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedCard, data, isEditMode]);

  // 刪除計劃項目
  const removePlanItem = (
    dayKey: keyof WeeklyPlanData['weeklyPlan'],
    slotKey: keyof DaySchedule,
    itemId: string
  ) => {
    if (!data) return;
    
    setData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      const day = { ...newData.weeklyPlan[dayKey] };
      const slot = { ...day[slotKey] };
      
      slot.items = slot.items.filter(item => item.id !== itemId);
      
      // 確保至少有一個空行
      if (slot.items.length === 0) {
        slot.items.push({ id: generateId(), subject: '', goal: '', task: '', backgroundColor: 'ffffff' });
      } else {
        // 確保最後一個是空行
        const lastItem = slot.items[slot.items.length - 1];
        if (lastItem && (lastItem.subject || lastItem.goal || lastItem.task)) {
          slot.items.push({ id: generateId(), subject: '', goal: '', task: '', backgroundColor: 'ffffff' });
        }
      }
      
      day[slotKey] = slot;
      newData.weeklyPlan[dayKey] = day;
      
      return newData;
    });
  };

  // 添加重要事紀
  const addImportantEvent = () => {
    if (!data) return;
    
    setData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        importantEvents: [
          ...prev.importantEvents,
          { id: generateId(), title: '', current: 0, total: 0 }
        ]
      };
    });
  };

  // 更新重要事紀
  const updateImportantEvent = (
    eventId: string,
    field: 'title' | 'current' | 'total',
    value: string | number
  ) => {
    if (!data) return;
    
    setData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        importantEvents: prev.importantEvents.map(event =>
          event.id === eventId ? { ...event, [field]: value } : event
        )
      };
    });
  };

  // 刪除重要事紀
  const removeImportantEvent = (eventId: string) => {
    if (!data) return;
    
    setData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        importantEvents: prev.importantEvents.filter(event => event.id !== eventId)
      };
    });
  };

  // Loading 狀態
  if (isLoading || !data) {
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
        /* 屏幕顯示時上午下午欄位高度 */
        .morning-cell,
        .afternoon-cell {
          min-height: 180px !important;
        }
        .morning-cell > div,
        .afternoon-cell > div {
          min-height: 160px !important;
        }
        /* 小紀錄欄位高度 */
        .note-cell {
          min-height: 60px !important;
        }
        
        @media print {
          @page { 
            size: A4 landscape;
            margin: 10mm;
          }
          .no-print { display: none !important; }
          body { 
            background: white !important;
            font-size: 12px !important;
          }
          * { 
            background: white !important; 
            color: black !important;
            box-shadow: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* 確保內容適合 A4 頁面 */
          .max-w-\[297mm\] {
            max-width: 100% !important;
          }
          .day-column {
            border: 1px solid #000 !important;
            page-break-inside: avoid;
          }
          .slot-cell {
            border: 1px solid #333 !important;
            padding: 4px !important;
            min-height: 80px !important;
          }
          .slot-cell.morning-cell,
          .slot-cell.afternoon-cell {
            min-height: 150px !important;
          }
          .slot-cell.note-cell {
            min-height: 50px !important;
          }
          .plan-item {
            border-bottom: 1px dashed #ccc !important;
            padding: 4px 0 !important;
            margin-bottom: 4px !important;
            min-height: 28px !important;
          }
          .plan-item:last-child {
            border-bottom: none !important;
            min-height: 50px !important;
          }
          .empty-line {
            min-height: 50px !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white p-6 print:p-0">
        <div className="w-full mx-auto max-w-[297mm] print:w-full print:max-w-full print-container">
          {/* Header */}
          <motion.div 
            className="mb-6 no-print"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border-2 border-orange-200 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    週計劃表
                  </h1>
                  <p className="text-gray-600 mt-2">
                    規劃本週的學習與活動安排
                  </p>
                </div>
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
          </motion.div>

          {/* Main Content - A4 Landscape Ratio Container */}
          <div className="flex flex-col gap-4 max-w-[297mm] mx-auto print:max-w-full">
            {/* Weekly Plan Table */}
            <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-black overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-20" />
                    {WEEKDAYS.map((day, index) => {
                      // 週六和週日窄一點
                      const isWeekend = day.key === 'saturday' || day.key === 'sunday';
                      // 週一到週五各 15%，週六和週日各 12.5%（總計：15%*5 + 12.5%*2 = 100%）
                      const widthPercent = isWeekend ? 12.5 : 15;
                      return (
                        <col key={`col-${index}`} style={{ width: `${widthPercent}%` }} />
                      );
                    })}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-100 border-b-2 border-r border-black">
                        時間
                      </th>
                      {WEEKDAYS.map((day) => (
                        <th
                          key={day.key}
                          className="day-column px-2 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-100 border-b-2 border-r border-black"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                    <tbody>
                      {SLOTS.map((slot) => (
                        <tr key={slot.key}>
                          <td className="px-2 py-3 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-r border-b border-black align-middle">
                            {slot.label}
                          </td>
                          {WEEKDAYS.map((day) => {
                            const daySchedule = data.weeklyPlan[day.key];
                            const slotData = daySchedule[slot.key];
                            
                            return (
                              <td
                                key={`${day.key}-${slot.key}`}
                              className={`slot-cell align-top border-r border-b border-black bg-white p-1 ${
                                slot.key === 'morning' ? 'morning-cell' : slot.key === 'afternoon' ? 'afternoon-cell' : ''
                              } ${(slot as any).isNote ? 'note-cell' : ''}`}
                            >
                                {/* 小紀錄：簡單文本區域 */}
                                {(slot as any).isNote ? (
                                  <div className="p-2 min-h-[50px]">
                                    {isEditMode ? (
                                      <textarea
                                        value={slotData.items[0]?.goal || ''}
                                        onChange={(e) => updatePlanItem(day.key, slot.key, 0, 'goal', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-400 rounded bg-white/90 focus:ring-1 focus:ring-orange-400 focus:border-transparent resize-none"
                                        placeholder="小紀錄..."
                                        rows={2}
                                      />
                                    ) : (
                                      <div className="text-xs text-gray-700 whitespace-pre-wrap min-h-[40px]">
                                        {slotData.items[0]?.goal || ''}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                /* Plan Items - Calendar Style Grid */
                                <div className={`flex flex-wrap gap-1 ${
                                  slot.key === 'morning' || slot.key === 'afternoon' ? 'min-h-[160px]' : 'min-h-[60px]'
                                }`}>
                                  {slotData.items.map((item, itemIndex) => {
                                    const isLastEmpty = itemIndex === slotData.items.length - 1 && 
                                                        !item.subject && !item.goal && !item.task;
                                    const hasContent = item.subject || item.goal || item.task;
                                    const bgColor = item.backgroundColor || 'ffffff';
                                    const showColorPicker = colorPickerItem?.dayKey === day.key && 
                                                           colorPickerItem?.slotKey === slot.key && 
                                                           colorPickerItem?.itemIndex === itemIndex;
                                    const shouldHideInView = !isEditMode && isLastEmpty && !hasContent;
                                    
                                    return (
                                      <div
                                        key={item.id}
                                        className={`relative rounded-lg border-2 transition-all ${
                                          isLastEmpty ? 'border-dashed border-gray-300 min-h-[60px] flex-1' : 
                                          'border-gray-300 shadow-sm hover:shadow-md'
                                        } ${
                                          selectedCard?.dayKey === day.key && 
                                          selectedCard?.slotKey === slot.key && 
                                          selectedCard?.itemIndex === itemIndex
                                            ? 'border-blue-500' 
                                            : ''
                                        }`}
                                        style={{
                                          backgroundColor: `#${bgColor}`,
                                          flex: hasContent ? '1 1 0' : '0 1 auto',
                                          minWidth: hasContent ? '140px' : '100px',
                                          ...(shouldHideInView ? { 
                                            visibility: 'hidden',
                                            height: 0,
                                            minHeight: 0,
                                            margin: 0,
                                            padding: 0,
                                            overflow: 'hidden'
                                          } : {})
                                        }}
                                      >
                                        {isEditMode ? (
                                          <div 
                                            className="p-2 space-y-1 relative z-10"
                                            onClick={(e) => {
                                              // 點擊卡片空白區域時選中，點擊輸入框或按鈕時不選中
                                              const target = e.target as HTMLElement;
                                              if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && 
                                                  !target.closest('input') && !target.closest('button') &&
                                                  !target.closest('.color-picker-container')) {
                                                setSelectedCard({
                                                  dayKey: day.key,
                                                  slotKey: slot.key,
                                                  itemIndex
                                                });
                                              }
                                            }}
                                          >
                                            {/* 選中指示器 */}
                                            {selectedCard?.dayKey === day.key && 
                                             selectedCard?.slotKey === slot.key && 
                                             selectedCard?.itemIndex === itemIndex && (
                                              <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" title="已選中 (Ctrl+C 複製, Ctrl+V 貼上)" />
                                            )}
                                            
                                            {/* 顏色選擇按鈕 */}
                                            <div className="flex items-center justify-between mb-1">
                                              <button
                                                onClick={() => setColorPickerItem({
                                                  dayKey: day.key,
                                                  slotKey: slot.key,
                                                  itemIndex
                                                })}
                                                className="p-1 rounded hover:bg-black/10 transition-colors"
                                                title="選擇顏色"
                                              >
                                                <Palette className="h-3 w-3 text-gray-600" />
                                              </button>
                                              {slotData.items.length > 1 && (
                                                <button
                                                  onClick={() => removePlanItem(day.key, slot.key, item.id)}
                                                  className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                                                  title="刪除"
                                                >
                                                  <Minus className="h-3 w-3" />
                                                </button>
                                              )}
                                            </div>
                                            
                                            {/* 顏色選擇器 */}
                                            {showColorPicker && (
                                              <div className="color-picker-container absolute top-8 left-0 z-50 bg-white rounded-lg shadow-xl border-2 border-gray-300 p-3 grid grid-cols-4 gap-2">
                                                {BACKGROUND_COLORS.map((color) => (
                                                  <button
                                                    key={color.value}
                                                    onClick={() => {
                                                      updatePlanItem(day.key, slot.key, itemIndex, 'backgroundColor', color.value);
                                                      setColorPickerItem(null);
                                                    }}
                                                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                                                      bgColor === color.value 
                                                        ? 'border-black ring-2 ring-gray-400' 
                                                        : 'border-gray-300'
                                                    }`}
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name}
                                                  >
                                                    {bgColor === color.value && (
                                                      <Check className="w-4 h-4 mx-auto text-gray-700" />
                                                    )}
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                            
                                            <input
                                              type="text"
                                              value={item.subject || ''}
                                              onChange={(e) => updatePlanItem(day.key, slot.key, itemIndex, 'subject', e.target.value)}
                                              className="w-full px-2 py-1 text-xs border border-gray-400 rounded bg-white/80 focus:ring-1 focus:ring-orange-400 focus:border-transparent cursor-text"
                                              placeholder="科目"
                                              style={{ userSelect: 'text', cursor: 'text' }}
                                            />
                                            <input
                                              type="text"
                                              value={item.goal || ''}
                                              onChange={(e) => updatePlanItem(day.key, slot.key, itemIndex, 'goal', e.target.value)}
                                              className="w-full px-2 py-1 text-xs border border-gray-400 rounded bg-white/80 focus:ring-1 focus:ring-orange-400 focus:border-transparent cursor-text"
                                              placeholder="目標"
                                              style={{ userSelect: 'text', cursor: 'text' }}
                                            />
                                            <input
                                              type="text"
                                              value={item.task || ''}
                                              onChange={(e) => updatePlanItem(day.key, slot.key, itemIndex, 'task', e.target.value)}
                                              className="w-full px-2 py-1 text-xs border border-gray-400 rounded bg-white/80 focus:ring-1 focus:ring-orange-400 focus:border-transparent cursor-text"
                                              placeholder="任務"
                                              style={{ userSelect: 'text', cursor: 'text' }}
                                            />
                                          </div>
                                        ) : (
                                          <div className="px-2 py-2 text-xs text-gray-700">
                                            {item.subject && (
                                              <div className="font-medium mb-1">{item.subject}</div>
                                            )}
                                            {item.goal && (
                                              <div className="mb-1">{item.goal}</div>
                                            )}
                                            {item.task && (
                                              <div className="mb-1 text-gray-600">{item.task}</div>
                                            )}
                                            
                                            {/* 空白行供寫字用 */}
                                            {hasContent && (
                                              <>
                                                {item.task ? (
                                                  <>
                                                    <div className="min-h-[24px] border-b border-gray-300 mt-2"></div>
                                                   
                                                  </>
                                                ) : (
                                                  <div className="min-h-[24px] border-b border-gray-300 mt-2"></div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>
            </div>

            {/* Important Events - Bottom Section */}
            <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-black p-4">
              <div className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-black">
                重要事紀
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.importantEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border-2 border-gray-300 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {isEditMode ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={event.title}
                          onChange={(e) => updateImportantEvent(event.id, 'title', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-400 rounded focus:ring-1 focus:ring-orange-400 focus:border-transparent"
                          placeholder="事紀名稱"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={event.current || 0}
                            onChange={(e) => updateImportantEvent(event.id, 'current', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-gray-400 rounded focus:ring-1 focus:ring-orange-400 focus:border-transparent"
                            placeholder="當前"
                          />
                          <span className="text-gray-500">/</span>
                          <input
                            type="number"
                            value={event.total || 0}
                            onChange={(e) => updateImportantEvent(event.id, 'total', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-gray-400 rounded focus:ring-1 focus:ring-orange-400 focus:border-transparent"
                            placeholder="總計"
                          />
                          <button
                            onClick={() => removeImportantEvent(event.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">{event.title || <span className="text-gray-300">未命名事紀</span>}</div>
                        {((event.current !== undefined && event.current !== null) || 
                          (event.total !== undefined && event.total !== null)) &&
                         (event.current !== 0 || event.total !== 0) ? (
                          <div className="mt-1 text-xs text-gray-600 font-medium">
                            {event.current || 0} / {event.total || 0}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {isEditMode && (
                <button
                  onClick={addImportantEvent}
                  className="mt-3 w-full px-4 py-2 text-sm border-2 border-dashed border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  新增重要事紀
                </button>
              )}
            </div>
          </div>
          
          {/* 底部空白區域，方便截圖時置中 */}
          <div className="h-32 print:h-24 bg-transparent"></div>
        </div>
      </div>
    </>
  );
};

export default WeeklyPlan;

