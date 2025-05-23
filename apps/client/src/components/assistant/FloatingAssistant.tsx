import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import Lottie from 'lottie-react';
import slothAnimation from '../../assets/lottie/sloth.json';
import { 
  Mic, 
  Send, 
  Loader2, 
  History,
  Settings,
  BookOpen,
  Brain,
  Gamepad,
  Lightbulb,
  ListChecks,
  Target,
  Bookmark,
  CheckCircle,
  Compass,
  MessageSquare
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChatService } from '../../lib/ai/services/chat';
import { MindMapService } from '../../services/mindmap';
import { ChatResponse } from '../../lib/ai/types';
import type { LLMResponse, ActionForm } from '../../lib/ai/types/llm';

// Avatar 的行為狀態
export type AssistantMode = 'idle' | 'thinking' | 'voice' | 'menu';

// UI 元素的顯示狀態
interface AssistantUIState {
  showChoices: boolean;
  showInput: boolean;
  message: string;
  choices: Choice[];
  inputText: string;
  inputPlaceholder?: string;
}

interface Choice {
  text: string;
  icon: React.ReactElement;
  description: string;
  action: () => void;
}

interface FloatingAssistantProps {
  enabled?: boolean;
  onToggle?: () => void;
  dragConstraints?: React.RefObject<HTMLElement>;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  hideCloseButton?: boolean;
  className?: string;
  onActionSubmit?: (action: string, params: Record<string, any>) => void;
  goalId?: string | null;
  onFocus?: (focus: string) => void;
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  enabled = true,
  dragConstraints,
  initialPosition = { x: 0, y: 0 },
  onDragEnd,
  className = '',
  onActionSubmit,
  goalId = null,
  onFocus
}) => {
  const [mode, setMode] = useState<AssistantMode>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatResponse[]>([]);
  const chatService = React.useMemo(() => new ChatService(), []);
  const mindMapService = React.useMemo(() => new MindMapService(goalId), [goalId]);
  const dragControls = useDragControls();

  // UI 狀態
  const [uiState, setUIState] = useState<AssistantUIState>({
    showChoices: false,
    showInput: false,
    message: '',
    choices: [],
    inputText: '',
    inputPlaceholder: '和我分享你的想法吧'
  });

  // 新增 helper 函數
  const updateUIState = (updater: (prev: AssistantUIState) => Partial<AssistantUIState>, source: string) => {
    setUIState(prev => {
      const updates = updater(prev);
      const newState = { ...prev, ...updates };
      
      // 如果沒有明確設定 showInput，就根據 choices 長度決定
      if (!('showInput' in updates)) {
        newState.showInput = !(newState.choices?.length > 0);
      }
      
      console.log(`🔍 [${source}] New state:`, newState);
      return newState;
    });
  };

  // 根據 form 配置更新 UI 狀態
  const updateUIFromForm = (form: ActionForm, message?: string) => {
    console.log('🔍 Form config:', form);
    updateUIState(prev => ({
      message: message || prev.message,
      showChoices: (form.options?.length ?? 0) > 0,
      showInput: form.showInput ?? !(form.options?.length ?? 0),
      inputPlaceholder: form.description || '和我分享你的想法吧',
      choices: form.options?.map(option => ({
        text: option.label,
        icon: getActionIcon(option.action.type),
        description: '',
        action: async () => {
          try {
            setMode('thinking');
            await mindMapService.handleAction(option.action.type, option.action.params);
            setMode('idle');
          } catch (error) {
            console.error('Failed to handle option click:', error);
            const errorMessage = error instanceof Error ? error.message : '未知的錯誤';
            updateUIState(prev => ({
              message: `哎呀！好像遇到了一點問題... 讓我看看`
            }), 'handleOptionClick-error');
            setMode('idle');
            throw error;
          }
        }
      })) || [],
    }), 'updateUIFromForm');
  };

  useEffect(() => {
    if (enabled) {
      updateUIState(prev => ({
        message: '嗨！今天想要做什麼呢？',
        showChoices: true,
        showInput: false,
        inputText: '',
        inputPlaceholder: '和我分享你的想法吧',
        choices: [
          { 
            text: "幫我想分類", 
            icon: <ListChecks className="h-12 w-12 text-indigo-600" />,
            description: "幫你規劃學習目標的分類",
            action: () => handleDirectInput("根據現在的主題和結構, 幫我建議 1~3 個學習步驟") 
          },
          { 
            text: "幫我想任務", 
            icon: <Target className="h-12 w-12 text-emerald-600" />,
            description: "幫你規劃具體的學習任務",
            action: () => handleDirectInput("根據現在的主題和結構, 幫我建議 1~3 個新的學習任務") 
          },
          { 
            text: "跟我聊聊這個主題", 
            icon: <MessageSquare className="h-12 w-12 text-orange-600" />,
            description: "討論這個主題的相關內容",
            action: () => handleDirectInput("跟我聊聊這個主題, 有沒有推薦的方向呢？") 
          },
          { 
            text: "隨便聊聊天", 
            icon: <Brain className="h-12 w-12 text-purple-600" />,
            description: "來聊聊天吧！",
            action: () => handleChatMode() 
          }
        ]
      }), 'initialSetup');
    }
  }, [enabled]);

  const handleDirectInput = (text: string) => {
    setMode('thinking');
    // 直接將文字作為使用者輸入處理
    handleSendMessage(text);
  };

  const handleChatMode = () => {
    setMode('idle');
    updateUIState(prev => ({
      message: '好啊！想聊什麼呢？',
      showChoices: false,
      showInput: true,
      inputText: '',
      inputPlaceholder: '想聊什麼都可以喔！'
    }), 'handleChatMode');
  };

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || uiState.inputText;
    if (!textToSend.trim() || isLoading) return;

    setIsLoading(true);
    setMode('thinking');
    
    // 立即清空輸入框
    updateUIState(prev => ({
      ...prev,
      inputText: ''
    }), 'handleSendMessage-clear');

    try {
      const response = await mindMapService.handleUserInput(textToSend);
      
      setChatHistory(prev => [...prev, 
        { message: textToSend, role: 'user' }
      ]);

      // 更新 UI 狀態
      if (response.form) {
        updateUIFromForm(response.form, response.message);
      } else {
        updateUIState(prev => ({
          message: response.message || '你想跟我說什麼呢'
        }), 'handleSendMessage');
      }

      setMode('idle');
    } catch (error) {
      console.error('Failed to send message:', error);
      updateUIState(prev => ({
        message: '抱歉，發生了一些錯誤，請稍後再試。'
      }), 'handleSendMessage-error');
      setMode('idle');
    } finally {
      setIsLoading(false);
    }
  }, [uiState.inputText, isLoading, mindMapService]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 修改點擊事件
  const handleAssistantClick = () => {
    if (!isDragging) {
      if (mode === 'idle' && !uiState.message && !uiState.showChoices && !uiState.showInput) {
        // 如果目前沒有顯示任何泡泡，就顯示初始選項
        setMode('idle');
        updateUIState(prev => ({
          message: '嗨！今天想要做什麼呢？',
          showChoices: true,
          showInput: false,
          inputText: '',
          inputPlaceholder: '和我分享你的想法吧',
          choices: [
            { 
              text: "幫我想分類", 
              icon: <ListChecks className="h-12 w-12 text-indigo-600" />,
              description: "幫你規劃學習目標的分類",
              action: () => handleDirectInput("根據現在的主題和結構, 幫我建議 1~3 個學習步驟") 
            },
            { 
              text: "幫我想任務", 
              icon: <Target className="h-12 w-12 text-emerald-600" />,
              description: "幫你規劃具體的學習任務",
              action: () => handleDirectInput("根據現在的主題和結構, 幫我建議 1~3 個新的學習任務") 
            },
            { 
              text: "跟我聊聊這個主題", 
              icon: <MessageSquare className="h-12 w-12 text-orange-600" />,
              description: "討論這個主題的相關內容",
              action: () => handleDirectInput("跟我聊聊這個主題, 有沒有推薦的方向呢？") 
            },
            { 
              text: "隨便聊聊天", 
              icon: <Brain className="h-12 w-12 text-purple-600" />,
              description: "來聊聊天吧！",
              action: () => handleChatMode() 
            }
          ]
        }), 'handleAssistantClick-show');
      } else {
        // 如果有任何泡泡顯示，就全部隱藏
        setMode('idle');
        updateUIState(prev => ({
          message: '',
          showChoices: false,
          showInput: false,
          inputText: '',
          choices: []
        }), 'handleAssistantClick-hide');
      }
    }
  };

  // 在 useEffect 中也加入 log
  useEffect(() => {
  }, [mode, uiState]);

  const getActionIcon = (actionType: string) => {
    const icons = [
      <Lightbulb className="h-12 w-12 text-yellow-500" />,
      <ListChecks className="h-12 w-12 text-blue-500" />,
      <Target className="h-12 w-12 text-red-500" />,
      <Bookmark className="h-12 w-12 text-purple-500" />,
      <CheckCircle className="h-12 w-12 text-green-500" />,
      <Compass className="h-12 w-12 text-indigo-500" />,
      <MessageSquare className="h-12 w-12 text-teal-500" />,
      <Brain className="h-12 w-12 text-emerald-600" />
    ];
    
    const randomIndex = Math.floor(Math.random() * icons.length);
    return icons[randomIndex];
  };

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          drag
          dragControls={dragControls}
          dragConstraints={dragConstraints}
          dragMomentum={false}
          dragElastic={0}
          initial={initialPosition}
          dragListener={false}
          onDragStart={() => {
            setIsDragging(true);
          }}
          onDragEnd={(_, info) => {
            setIsDragging(false);
            if (onDragEnd) {
              onDragEnd({ x: info.point.x, y: info.point.y });
            }
          }}
          style={{ 
            position: 'absolute',
            zIndex: isDragging ? 50 : 40
          }}
          className={`${className}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.div 
            style={{ 
              position: 'absolute',
              zIndex: isDragging ? 50 : 40
            }}
            className="relative w-36 h-36"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* 助理圖示 */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                dragControls.start(e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAssistantClick();
              }}
              className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative cursor-move translate-x-12"
            >
              <Lottie
                animationData={slothAnimation}
                loop={true}
                className="w-[120%] h-[120%] -translate-x-[7%] -translate-y-[5%] pointer-events-none"
              />
            </button>

            {/* 設定按鈕 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMode(mode === 'menu' ? 'idle' : 'menu')}
              className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md"
            >
              <Settings className="h-4 w-4 text-indigo-500" />
            </motion.button>

            {/* 聊天泡泡 */}
            <AnimatePresence mode="wait">
              {mode !== 'menu' ? (
                <>
                  {/* AI 回覆泡泡 */}
                  {uiState.message && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-[calc(100%+1rem)] right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 max-w-[300px] min-w-[200px] pointer-events-auto select-text cursor-text min-h-[6rem] max-h-[6rem] overflow-y-auto flex items-center"
                      style={{ 
                        pointerEvents: isDragging ? 'none' : 'auto',
                        transformOrigin: 'bottom right'
                      }}
                    >
                      {/* 訊息 */}
                      <div className={`relative w-full ${mode === 'thinking' ? 'blur-[1px]' : ''}`}>
                        <p className="text-base font-bold text-gray-800 dark:text-gray-200 font-sans leading-relaxed whitespace-pre-wrap">
                          {uiState.message}
                        </p>
                      </div>

                      {/* 思考中動畫 */}
                      {mode === 'thinking' && (
                        <div className="absolute inset-0 flex justify-center items-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-[1px] rounded-2xl">
                          <div className="flex justify-center items-center space-x-4">
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0,
                              }}
                              className="w-4 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                            />
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.3,
                              }}
                              className="w-4 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                            />
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.6,
                              }}
                              className="w-4 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* 尾巴 */}
                      <div className="absolute bottom-0 right-0 transform translate-x-full">
                        <div className="w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
                      </div>
                    </motion.div>
                  )}

                  {/* 輸入泡泡 */}
                  {uiState.showInput && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-[calc(100%+8rem)] right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 max-w-[350px] min-w-[250px] pointer-events-auto cursor-default"
                      style={{ 
                        pointerEvents: isDragging ? 'none' : 'auto',
                        transformOrigin: 'bottom right'
                      }}
                    >
                      <div className="flex flex-col">
                        {/* 提示文字 */}
                        <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                          {uiState.inputPlaceholder}
                        </div>

                        {/* 輸入區域 */}
                        <div className="flex items-center space-x-3">
                          <textarea
                            value={uiState.inputText}
                            onChange={(e) => setUIState(prev => ({ ...prev, inputText: e.target.value }))}
                            onKeyPress={handleKeyPress}
                            placeholder="輸入訊息..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            rows={2}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendMessage}
                            disabled={isLoading || !uiState.inputText.trim()}
                            className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {/* 尾巴 */}
                      <div className="absolute bottom-0 right-6 transform translate-y-full">
                        <div className="w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
                      </div>
                    </motion.div>
                  )}

                  {/* 選項泡泡 */}
                  {uiState.showChoices && uiState.choices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 max-w-[350px] min-w-[250px] pointer-events-auto cursor-default ${
                        uiState.showInput ? 'bottom-[calc(100%+16rem)]' : 'bottom-[calc(100%+8rem)]'
                      }`}
                      style={{ 
                        pointerEvents: isDragging ? 'none' : 'auto',
                        transformOrigin: 'bottom right'
                      }}
                    >
                      <div className="space-y-4">
                        {uiState.choices.map((choice, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => choice.action()}
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-3"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                              {choice.icon}
                            </div>
                            <div className="flex-1 text-left min-w-[200px]">
                              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {choice.text}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-xs">
                                {choice.description}
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* 尾巴 */}
                      <div className="absolute bottom-0 right-6 transform translate-y-full">
                        <div className="w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
                      </div>
                    </motion.div>
                  )}
                </>
              ) : null}

              {/* 選單 */}
              {mode === 'menu' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-0 right-0 mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 w-48"
                >
                  <button
                    onClick={() => {/* Navigate to history */}}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <History className="h-4 w-4 mr-2" />
                    查看對話紀錄
                  </button>
                  <button
                    onClick={() => {/* Open settings */}}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    設定
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 