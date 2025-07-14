/**
 * ParticipantSelector - 參與者選擇組件
 * 
 * 🎯 功能說明：
 * - 顯示可選擇的參與者列表
 * - 支援多選功能
 * - 搜尋和篩選功能
 * - 顯示參與者的週進度概覽
 * - 顯示最近一次個人 Retro 的時間和資料
 * 
 * 🏗️ 架構設計：
 * - 使用 GroupRetroStore 管理狀態
 * - 支援實時搜尋
 * - 響應式設計
 * - 動畫效果
 * 
 * 🎨 視覺設計：
 * - 用戶卡片設計
 * - 顏色標識系統
 * - 選擇狀態動畫
 * - 載入和空狀態
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Check, X, RefreshCw, Clock } from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { LoadingDots } from '../shared/LoadingDots';
import type { ParticipantWeeklySummary } from '../../types/groupRetro';

// Debug 開關
const DEBUG_PARTICIPANT_SELECTOR = true;

const debugLog = (...args: any[]) => {
  if (DEBUG_PARTICIPANT_SELECTOR) {
    console.log(...args);
  }
};

interface ParticipantSelectorProps {
  onSelectionChange?: (participants: ParticipantWeeklySummary[]) => void;
}

interface ParticipantCardProps {
  participant: ParticipantWeeklySummary;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isSelected,
  onSelect,
  onRemove,
  disabled = false
}) => {
  const { user, weeklyStats, hasCompletedPersonalRetro, mainTopics, energyDescription, colorTheme, lastRetroDate } = participant;
  
  // 用戶頭像或初始化字母
  const userInitial = user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';
  
  // 格式化 Retro 時間
  const formatRetroTime = (date?: string) => {
    if (!date) return '尚未完成';
    
    const retroDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - retroDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} 小時前`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} 天前`;
    } else {
      return retroDate.toLocaleDateString('zh-TW', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  return (
    <motion.div
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-orange-400 bg-orange-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
      }`}
      onClick={disabled ? undefined : (isSelected ? onRemove : onSelect)}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      layout
    >
      {/* 選擇狀態指示器 */}
      {isSelected && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
      
      {/* 個人 Retro 完成狀態 */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${hasCompletedPersonalRetro ? 'bg-green-500' : 'bg-gray-300'}`} 
             title={hasCompletedPersonalRetro ? '已完成個人 Retro' : '尚未完成個人 Retro'} />
      </div>
      
      <div className="flex items-start space-x-4">
        {/* 用戶頭像 */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${colorTheme}`}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name || '用戶'} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg">{userInitial}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* 用戶名稱 */}
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-800 truncate">
              {user.name || '匿名用戶'}
            </h3>
            {hasCompletedPersonalRetro && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          
          {/* 用戶郵箱 */}
          <p className="text-sm text-gray-500 truncate mb-2">
            {user.email}
          </p>
          
          {/* 週進度概覽 */}
          <div className="space-y-1">
            {/* 最近 Retro 時間 */}
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">
                Retro: {formatRetroTime(lastRetroDate)}
              </span>
            </div>
            
            {/* 能量狀態 */}
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">{energyDescription}</span>
            </div>
            
            {/* 主要主題 */}
            {mainTopics.length > 0 && (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">
                  {mainTopics.slice(0, 2).join(', ')}
                  {mainTopics.length > 2 && '...'}
                </span>
              </div>
            )}
            
            {/* 打卡次數 */}
            <div className="flex items-center space-x-2">
              <Check className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">
                本週打卡 {weeklyStats.totalCheckIns} 次
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ onSelectionChange }) => {
  debugLog('🔵 [ParticipantSelector] 組件渲染開始');
  
  // 組件狀態
  const [searchQuery, setSearchQuery] = useState('');
  
  // 使用 useRef 來跟蹤載入狀態，避免組件重新掛載時被重置
  const loadingStateRef = useRef({
    hasLoaded: false,
    lastFilters: ''
  });

  // Store 狀態
  const {
    availableParticipants,
    selectedParticipants,
    loading,
    error,
    loadAvailableParticipants,
    selectParticipant,
    removeParticipant
  } = useGroupRetroStore();

  debugLog('🔵 [ParticipantSelector] loadingStateRef.current:', loadingStateRef.current);
  debugLog('🔵 [ParticipantSelector] 狀態:', {
    searchQuery,
    availableParticipants: availableParticipants.length,
    selectedParticipants: selectedParticipants.length,
    loading
  });

  // 計算當前篩選條件 - 只有搜尋查詢
  const currentFilters = useMemo(() => {
    const filters = searchQuery;
    debugLog('🟡 [ParticipantSelector] currentFilters 計算:', filters);
    return filters;
  }, [searchQuery]);

  debugLog('🔵 [ParticipantSelector] currentFilters:', currentFilters);
  debugLog('🔵 [ParticipantSelector] lastFilters:', loadingStateRef.current.lastFilters);
  debugLog('🔵 [ParticipantSelector] 篩選條件比較:', currentFilters === loadingStateRef.current.lastFilters);

  // 載入可用參與者
  useEffect(() => {
    debugLog('🟡 [ParticipantSelector] useEffect 觸發');
    debugLog('🟡 [ParticipantSelector] 狀態檢查:', {
      storeLoading: loading,
      hasLoaded: loadingStateRef.current.hasLoaded,
      lastFilters: loadingStateRef.current.lastFilters,
      currentFilters: currentFilters,
      filtersEqual: loadingStateRef.current.lastFilters === currentFilters
    });
    
    // 修復：統一使用 store 的 loading 狀態
    if (loading) {
      debugLog('🔴 [ParticipantSelector] Store 正在載入中，跳過');
      return;
    }
    
    // 如果篩選條件沒有變化且已經載入過，也不要重複載入
    if (loadingStateRef.current.hasLoaded && loadingStateRef.current.lastFilters === currentFilters) {
      debugLog('🔴 [ParticipantSelector] 篩選條件未變化且已載入，跳過');
      return;
    }
    
    debugLog('🟢 [ParticipantSelector] 開始載入 - 條件滿足');
    
    const loadParticipants = async () => {
      try {
        // 立即設置本地載入狀態，避免重複觸發
        loadingStateRef.current = {
          hasLoaded: false,
          lastFilters: currentFilters // 預先設置以防止重複觸發
        };
        
        debugLog('🟢 [ParticipantSelector] 調用 loadAvailableParticipants');
        await loadAvailableParticipants({
          searchQuery: searchQuery.trim() || undefined
        });
        
        debugLog('🟢 [ParticipantSelector] 載入成功，更新狀態');
        // 載入成功後更新狀態
        loadingStateRef.current = {
          hasLoaded: true,
          lastFilters: currentFilters
        };
        
        debugLog('🟢 [ParticipantSelector] 載入完成，最終狀態:', loadingStateRef.current);
      } catch (error) {
        debugLog('🔴 [ParticipantSelector] 載入參與者失敗:', error);
        // 載入失敗時重置狀態
        loadingStateRef.current = {
          hasLoaded: false,
          lastFilters: ''
        };
      }
    };
    
    loadParticipants();
  }, [currentFilters]); // 修復：統一使用 currentFilters，移除 loading 避免額外觸發
  
  // 通知父組件選擇變化
  useEffect(() => {
    debugLog('🟡 [ParticipantSelector] 選擇變化通知 useEffect 觸發');
    if (onSelectionChange) {
      onSelectionChange(selectedParticipants);
    }
  }, [selectedParticipants]); // 修復：移除 onSelectionChange 依賴項，避免父組件重新渲染時觸發

  // 篩選和搜尋參與者
  const filteredParticipants = useMemo(() => {
    let filtered = [...availableParticipants];
    
    // 排除當前用戶（如果需要）
    // 這裡的 currentUser 需要從 context 或 store 中獲取，目前暫時移除
    // if (currentUser) {
    //   filtered = filtered.filter(p => p.user.id !== currentUser.id);
    // }
    
    // 搜尋過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.user.name?.toLowerCase().includes(query) ||
        p.user.email?.toLowerCase().includes(query) ||
        p.mainTopics.some(topic => topic.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [availableParticipants, searchQuery]);
  
  // 處理參與者選擇
  const handleParticipantSelect = (participant: ParticipantWeeklySummary) => {
    selectParticipant(participant);
  };
  
  // 處理參與者移除
  const handleParticipantRemove = (userId: string) => {
    removeParticipant(userId);
  };
  
  // 判斷參與者是否已選擇
  const isParticipantSelected = (userId: string) => {
    return selectedParticipants.some(p => p.user.id === userId);
  };

  return (
    <div className="space-y-4">
      {/* 搜尋框 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋夥伴姓名或主題..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* 已選擇的參與者 */}
      {selectedParticipants.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4" />
              已選擇的討論夥伴 ({selectedParticipants.length})
            </h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedParticipants.map((participant) => (
              <motion.div
                key={participant.user.id}
                className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-orange-300"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${participant.colorTheme}`}>
                  {participant.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-700">
                  {participant.user.name || '匿名用戶'}
                </span>
                <button
                  onClick={() => handleParticipantRemove(participant.user.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* 載入狀態 */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingDots />
        </div>
      )}
      
      {/* 錯誤提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* 參與者列表 */}
      {!loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">
              可選擇的夥伴 ({filteredParticipants.length})
            </h4>
          </div>
          
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">沒有找到符合條件的夥伴</p>
              <p className="text-xs text-gray-400 mt-1">
                試試調整搜尋條件
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.user.id}
                  participant={participant}
                  isSelected={isParticipantSelected(participant.user.id)}
                  onSelect={() => handleParticipantSelect(participant)}
                  onRemove={() => handleParticipantRemove(participant.user.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 選擇提示 */}
      {filteredParticipants.length > 0 && selectedParticipants.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-blue-700">
            <Users className="w-5 h-5" />
            <p className="text-sm">
              <strong>提示：</strong> 請選擇至少 2 位夥伴開始小組討論
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 