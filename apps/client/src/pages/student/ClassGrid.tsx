import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, Plus, Trash2, Star, Brain, Eye, Heart } from 'lucide-react';
import { subjects as subjectTokens } from '../../styles/tokens';

// 課堂格子數據介面
interface ClassCell {
  id: string;
  subject: string;
  goal: string;
  difficulty: number; // 1-5
  efficiency: number; // 1-5
  focus: number; // 1-5
  mood: number; // 1-5
  hasSticker: boolean;
  completedCircles: number; // 完成的圓圈數量 (0-1, 總共1個實心圓圈)
}

// 預設科目選項（更新）
const SUBJECT_OPTIONS = [
  '國語',
  '英文',
  '閩南語',
  '數學',
  '自然',
  '社會',
  '資訊',
  '藝術',
  '音樂',
  '自選'
];

// 科目預設目標建議
const SUBJECT_DEFAULT_GOALS: Record<string, string> = {
  '國語': '完成自選分享（加入地點的描述與介紹）',
  '英文': '均一教材 5~10 分鐘，記錄單字與口說/造句',
  '閩南語': '認識歌詞並練習朗讀',
  '數學': '練習座標平面與代數',
  '自然': '探討「尺度」的問題',
  '社會': '了解嘉義、台南',
  '資訊': '規劃預算與花費',
  '藝術': '自由創作（不限主題）',
  '音樂': '認識歌詞並練習',
  '自選': '完成第一次分享'
};

const STORAGE_KEY = 'classGrid_data';
const GRID_SIZE_KEY = 'classGrid_gridSize';

const ClassGrid: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [cells, setCells] = useState<ClassCell[]>([]);
  const [gridSize, setGridSize] = useState({ rows: 4, cols: 5 }); // 4x5 = 20格
  const [isLoading, setIsLoading] = useState(true);
  const [skipNextInit, setSkipNextInit] = useState(false);
  const didLoadRef = useRef(false);

  // 載入資料
  useEffect(() => {
    if (didLoadRef.current) {
      console.log('[ClassGrid] loadData skipped (already ran once)');
      return;
    }
    didLoadRef.current = true;
    const loadData = () => {
      try {
        // 載入 grid size
        const savedGridSizeRaw = localStorage.getItem(GRID_SIZE_KEY);
        const savedGridSize = savedGridSizeRaw ? JSON.parse(savedGridSizeRaw) : null;
        const effectiveGridSize = savedGridSize || { rows: 4, cols: 5 };
        console.log('[ClassGrid] loadData: gridSizeRaw=', savedGridSizeRaw, 'effective=', effectiveGridSize);
        setGridSize(effectiveGridSize);

        // 載入 cells data
        const savedCellsRaw = localStorage.getItem(STORAGE_KEY);
        console.log('[ClassGrid] loadData: cellsRaw length=', savedCellsRaw ? savedCellsRaw.length : 0);
        if (savedCellsRaw) {
          const parsed = JSON.parse(savedCellsRaw);
          console.log('[ClassGrid] parsed cells count=', Array.isArray(parsed) ? parsed.length : 'not array');
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCells(parsed);
            // 避免接下來 gridSize effect 重新初始化把剛載入的資料覆蓋
            setSkipNextInit(true);
          } else {
            // 有儲存但為空陣列 -> 以目前 grid size 初始化
            console.log('[ClassGrid] saved cells empty, initialize with effectiveGridSize');
            initializeCells(effectiveGridSize);
          }
        } else {
          // 如果沒有儲存的資料，初始化
          console.log('[ClassGrid] no saved cells, initialize with effectiveGridSize');
          initializeCells(effectiveGridSize);
        }
      } catch (error) {
        console.error('[ClassGrid] 載入資料失敗:', error);
        // 如果載入失敗，使用預設值
        initializeCells({ rows: 4, cols: 5 });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 載入完成後若仍然沒有 cells，做保底初始化
  useEffect(() => {
    if (!isLoading && cells.length === 0) {
      initializeCells(gridSize);
    }
  }, [isLoading, cells.length]);

  // 初始化格子
  const initializeCells = (size: { rows: number, cols: number }) => {
    const totalCells = size.rows * size.cols;
    console.log('[ClassGrid] initializeCells size=', size, 'total=', totalCells);
    const initialCells: ClassCell[] = [];
    
    for (let i = 0; i < totalCells; i++) {
      initialCells.push({
        id: `cell-${i}`,
        subject: '',
        goal: '',
        difficulty: 0,
        efficiency: 0,
        focus: 0,
        mood: 0,
        hasSticker: false,
        completedCircles: 0
      });
    }
    
    setCells(initialCells);
  };

  // 當 gridSize 改變時重新初始化
  useEffect(() => {
    if (!isLoading) {
      console.log('[ClassGrid] gridSize effect: gridSize=', gridSize, 'skipNextInit=', skipNextInit, 'cells.length=', cells.length);
      // 初次載入時若已經從 localStorage 載入 cells，跳過這一次 re-init，避免覆蓋
      if (skipNextInit) {
        console.log('[ClassGrid] skipNextInit=true: skip re-init, just persist gridSize');
        setSkipNextInit(false);
        localStorage.setItem(GRID_SIZE_KEY, JSON.stringify(gridSize));
        return;
      }
      // 只有在目前沒有資料的情況才初始化，避免覆蓋已載入/已編輯的資料
      if (cells.length === 0) {
        initializeCells(gridSize);
      }
      localStorage.setItem(GRID_SIZE_KEY, JSON.stringify(gridSize));
    }
  }, [gridSize, isLoading]);

  // 自動儲存
  useEffect(() => {
    if (!isLoading && cells.length > 0) {
      const saveData = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cells));
          console.log('[ClassGrid] auto-saved cells count=', cells.length);
        } catch (error) {
          console.error('[ClassGrid] 自動儲存失敗:', error);
        }
      };
      
      // 延遲儲存避免過於頻繁
      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [cells, isLoading]);

  const updateCell = (id: string, field: keyof ClassCell, value: any) => {
    console.log('[ClassGrid] updateCell id=', id, 'field=', field, 'value=', value);
    setCells(prev => prev.map(cell => 
      cell.id === id ? { ...cell, [field]: value } : cell
    ));
  };

  const toggleSticker = (id: string) => {
    if (isEditMode) return;
    updateCell(id, 'hasSticker', !cells.find(c => c.id === id)?.hasSticker);
  };

  const toggleCircle = (cellId: string, circleIndex: number) => {
    if (isEditMode) return;
    
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    
    const newCompleted = circleIndex < cell.completedCircles 
      ? circleIndex 
      : circleIndex + 1;
    updateCell(cellId, 'completedCircles', Math.min(newCompleted, 1)); // 最多1個圓圈
  };

  const renderCircles = (cell: ClassCell) => {
    const circles: React.ReactElement[] = [];
    const totalCircles = 1; // 只有1個實心圓圈
    
    for (let i = 0; i < totalCircles; i++) {
      const isCompleted = i < cell.completedCircles;
      
      // 實線圓圈
      circles.push(
        <motion.div
          key={i}
          className={`w-8 h-8 border-2 rounded-full cursor-pointer transition-all duration-200 progress-circle ${
            isCompleted 
              ? 'bg-gradient-to-r from-green-400 to-emerald-400 border-green-500 completed' 
              : 'bg-white border-gray-300 hover:border-orange-400'
          }`}
          onClick={() => toggleCircle(cell.id, i)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      );
    }
    return circles;
  };

  const renderIcon = (type: 'difficulty' | 'efficiency' | 'focus' | 'mood', value: number) => {
    const icons = {
      difficulty: Star,
      efficiency: Brain,
      focus: Eye,
      mood: Heart
    };
    
    const colors = {
      difficulty: 'text-red-800',
      efficiency: 'text-blue-800',
      focus: 'text-green-800',
      mood: 'text-pink-800'
    };
    
    const Icon = icons[type];
    const baseClass = `h-6 w-6 ${colors[type]} stroke-[2] drop-shadow-sm`;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Icon
            key={i}
            className={`${baseClass} ${i <= value ? 'opacity-100' : 'opacity-50'}`}
            fill={i <= value ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  // 將目標字串拆成最多兩行，讓兩行長度盡量相近
  const splitBalancedTwoLines = (text: string): string[] => {
    const t = (text || '').trim();
    if (t.length === 0) return [];
    // 若字數不多，單行顯示即可
    if (t.length <= 10) return [t];

    // 若包含空白，以詞為單位平衡
    if (t.includes(' ')) {
      const words = t.split(/\s+/);
      const totalLen = words.join('').length + (words.length - 1); // 粗略計長度
      const target = Math.round(totalLen / 2);
      let line1: string[] = [];
      let len1 = 0;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const extra = (line1.length > 0 ? 1 : 0) + w.length; // 空白 + 字長
        if (len1 + extra <= target || line1.length === 0) {
          line1.push(w);
          len1 += extra;
        } else {
          const line2 = words.slice(i).join(' ');
          return [line1.join(' '), line2];
        }
      }
      return [line1.join(' '), ''];
    }

    // 否則用字元長度平衡，優先在接近中點的位置切
    const mid = Math.floor(t.length / 2);
    // 嘗試在中點附近尋找標點或空白（中英文）
    const candidates: number[] = [];
    for (let delta = 0; delta <= 4; delta++) {
      const left = mid - delta;
      const right = mid + delta;
      if (left > 0) candidates.push(left);
      if (right < t.length) candidates.push(right);
    }
    let splitIdx = mid;
    const sepRegex = /[\s\-，。；、,.!?]/;
    for (const idx of candidates) {
      if (sepRegex.test(t[idx])) {
        splitIdx = idx + 1;
        break;
      }
    }
    const l1 = t.slice(0, splitIdx).trim();
    const l2 = t.slice(splitIdx).trim();
    return [l1, l2];
  };

  const renderEditModal = (cell: ClassCell) => {
    if (!isEditMode) return null;
    
    return (
      <div className="absolute inset-0 bg-white border-2 border-orange-400 rounded-lg p-2 z-10 shadow-lg">
        {/* 科目選擇 */}
        <div className="mb-2">
          <select
            value={cell.subject}
            onChange={(e) => {
              const val = e.target.value;
              updateCell(cell.id, 'subject', val);
              if (!cell.goal || cell.goal.trim() === '') {
                const suggested = SUBJECT_DEFAULT_GOALS[val] || '';
                if (suggested) {
                  updateCell(cell.id, 'goal', suggested);
                }
              }
            }}
            className="w-full text-xs border border-gray-300 rounded p-1"
          >
            <option value="">選擇科目</option>
            {SUBJECT_OPTIONS.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
        
        {/* 目標輸入（支援換行） */}
        <div className="mb-2">
          <textarea
            value={cell.goal}
            onChange={(e) => updateCell(cell.id, 'goal', e.target.value)}
            placeholder="目標（可按 Enter 換行）"
            rows={3}
            className="w-full text-xs border border-gray-300 rounded p-1 resize-y"
          />
        </div>
        
        {/* Icon 評分 */}
        <div className="space-y-1">
          {(['difficulty', 'efficiency', 'focus', 'mood'] as const).map(type => (
            <div key={type} className="flex items-center gap-1">
              {renderIcon(type, 1)}
              <select
                value={cell[type]}
                onChange={(e) => updateCell(cell.id, type, parseInt(e.target.value))}
                className="flex-1 text-xs border border-gray-300 rounded p-1"
              >
                <option value={0}>未設定</option>
                {[1, 2, 3, 4, 5].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
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

  // 科目名稱正規化（對齊 tokens 定義）
  const normalizeSubjectName = (name: string): string => {
    const n = (name || '').trim();
    if (!n) return '';
    const map: Record<string, string> = {
      '英文': '英語',
      '自選': '自訂',
      '資訊': '資訊',
      '閩南語': '閩南語',
    };
    return map[n] || n;
  };

  // 輕量淡色系的本地備援樣式（tokens 未定義時使用）
  const fallbackLightStyles: Record<string, { bg: string; text: string; accent: string }> = {
    '資訊': { bg: 'bg-sky-100', text: 'text-sky-800', accent: '#0EA5E9' },
    '閩南語': { bg: 'bg-rose-100', text: 'text-rose-800', accent: '#E11D48' },
  };

  // 特定科目的更淡配色覆蓋（以視覺更清爽）
  const lightOverrides: Record<string, { bg?: string; text?: string }> = {
    '國語': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '英語': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
    '數學': { bg: 'bg-orange-50', text: 'text-orange-700' },
    '自然': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    '社會': { bg: 'bg-amber-50', text: 'text-amber-700' },
    '藝術': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
    '體育': { bg: 'bg-rose-50', text: 'text-rose-700' },
    '自訂': { bg: 'bg-violet-50', text: 'text-violet-700' },
    '資訊': { bg: 'bg-sky-50', text: 'text-sky-700' },
    '閩南語': { bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 landscape;
            margin: 10mm;
          }
          .no-print { display: none !important; }
          body { 
            background: white !important;
            font-size: 10px !important;
          }
          * { 
            background: white !important; 
            color: black !important;
            box-shadow: none !important;
          }
          .grid-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
          .cell-grid {
            border: 2px solid #000 !important;
            border-radius: 0 !important;
          }
          .grid-cell {
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            background: white !important;
            min-height: 60px !important;
          }
          .sticker-area {
            border: 1px dashed #888 !important;
            background: #f8f8f8 !important;
          }
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
          .progress-circle.border-dashed {
            border: 1px dashed #888 !important;
            background: transparent !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 print:p-2 print:bg-white">
        <div className="max-w-7xl mx-auto print:max-w-none grid-container">
          {/* Edit Button - Outside the orange frame */}
          <motion.div 
            className="mb-4 no-print"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-end">
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
                    完成編輯
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    編輯模式
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Header with Grid inside */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border-2 border-orange-200 p-6">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  自學紀錄
                </h1>
              </div>

              {/* Class Grid inside the orange frame */}
              <div 
                className="grid gap-3"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)` ,
                  gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`
                }}
              >
                {cells.map((cell, index) => {
                  const norm = normalizeSubjectName(cell.subject || '');
                  const tokenStyle = subjectTokens.getSubjectStyle(norm || '');
                  const fallback = fallbackLightStyles[norm];
                  let styleForSubject = fallback
                    ? { bg: fallback.bg, text: fallback.text, accent: fallback.accent, gradient: '' }
                    : tokenStyle;
                  const override = lightOverrides[norm];
                  if (override) {
                    styleForSubject = {
                      ...styleForSubject,
                      bg: override.bg || styleForSubject.bg,
                      text: override.text || styleForSubject.text,
                    };
                  }
                  const hasSubject = !!cell.subject && cell.subject.trim() !== '';
                  const cellBgClass = hasSubject ? styleForSubject.bg : 'bg-white';
                  const cellTextClass = hasSubject ? styleForSubject.text : '';
                  const borderColor = hasSubject ? `${styleForSubject.accent}80` : undefined; // 加一點透明度
                  return (
                  <motion.div
                    key={cell.id}
                    className={`grid-cell relative border-2 rounded-lg p-2 transition-all duration-200 ${cellBgClass} ${cellTextClass}`}
                    style={{ aspectRatio: '1.1/1', borderColor: borderColor }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                  >
                  {/* 課程資訊 */}
                  <div className="grid grid-rows-[auto_1fr_auto] h-full relative">
                    {/* 上層：貼紙 + 科目 */}
                    <div className="relative h-8">
                      {/* 貼紙區域 - 左上角 */}
                      <div className="absolute top-0 left-0 flex flex-col items-start gap-1">
                        {/* 貼紙 */}
                        <div 
                          className="cursor-pointer"
                          onClick={() => toggleSticker(cell.id)}
                        >
                          {cell.hasSticker && (
                            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 圓圈 */}
                        <div className="flex gap-1">
                          {renderCircles(cell)}
                        </div>
                      </div>

                      {/* 科目 - 右上角 */}
                      {cell.subject && (
                        <div className={`absolute top-1 right-0 font-semibold text-lg ${styleForSubject.text} px-3.5 py-1.5`}>
                          {cell.subject}
                        </div>
                      )}
                    </div>

                    {/* 中間：目標 */}
                    <div className="flex items-center justify-center px-4 text-center">
                      {cell.goal && (() => {
                        const raw = cell.goal || '';
                        const explicit = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        const lines = explicit.length > 0
                          ? explicit.slice(0, 2)
                          : splitBalancedTwoLines(raw);
                        if (lines.length <= 1) {
                          return (
                            <div className="text-xl text-gray-700 leading-tight font-medium whitespace-pre-wrap">
                              {raw}
                            </div>
                          );
                        }
                        return (
                          <div className="text-xl text-gray-700 leading-tight font-medium">
                            <div>{lines[0]}</div>
                            <div>{lines[1]}</div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 底部：Icons（三列，一列一種） */}
                    <div className="flex flex-col items-center gap-1.5 mb-1 px-2">
                      <div className="flex items-center justify-center">
                        {renderIcon('difficulty', cell.difficulty)}
                      </div>
                      <div className="flex items-center justify-center">
                        {renderIcon('efficiency', cell.efficiency)}
                      </div>
                      <div className="flex items-center justify-center">
                        {renderIcon('focus', cell.focus)}
                      </div>
                    </div>
                  </div>

                    {/* 編輯模式覆蓋層 */}
                    {isEditMode && renderEditModal(cell)}
                  </motion.div>
                  );
                })}
              </div>

              {/* Icons Legend moved inside the orange frame (bottom) */}
              <div className="mt-4 pt-2 border-t border-orange-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-red-700" />
                    <div>
                      <span className="font-semibold">難度</span> - 學習內容的困難程度
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-700" />
                    <div>
                      <span className="font-semibold">學習效果</span> - 學習的效果如何
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-700" />
                    <div>
                      <span className="font-semibold">專心程度</span> - 上課時的專注力
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          

          {/* Grid Size Control at bottom */}
          <motion.div 
            className="no-print"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-blue-200 p-4">
              <h3 className="text-lg font-semibold mb-3">表格設定</h3>
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">行數</label>
                  <input
                    type="number"
                    value={gridSize.rows}
                    onChange={(e) => setGridSize(prev => ({...prev, rows: Math.max(1, parseInt(e.target.value) || 1)}))}
                    className="w-20 p-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">列數</label>
                  <input
                    type="number"
                    value={gridSize.cols}
                    onChange={(e) => setGridSize(prev => ({...prev, cols: Math.max(1, parseInt(e.target.value) || 1)}))}
                    className="w-20 p-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default ClassGrid;
