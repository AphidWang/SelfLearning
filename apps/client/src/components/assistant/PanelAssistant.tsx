import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MessageSquare,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChatService } from '../../lib/ai/services/chat';
import { MindMapService } from '../../services/mindmap';
import { ChatResponse } from '../../lib/ai/types';
import type { LLMResponse, ActionForm } from '../../lib/ai/types/llm';
import { EventType } from '../../services/mindmap/config/events';

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
  chatHistory: ChatResponse[];
}

interface Choice {
  text: string;
  icon: React.ReactElement;
  description: string;
  action: () => void;
}

interface PanelAssistantProps {
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

export const PanelAssistant: React.FC<PanelAssistantProps> = ({
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
  const chatService = React.useMemo(() => new ChatService(), []);
  const mindMapService = React.useMemo(() => new MindMapService(goalId), [goalId]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // UI 狀態
  const [uiState, setUIState] = useState<AssistantUIState>({
    showChoices: false,
    showInput: false,
    message: '',
    choices: [],
    inputText: '',
    inputPlaceholder: '和我分享你的想法吧',
    chatHistory: []
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
            await mindMapService.handleAction(option.action.type as EventType, option.action.params);
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

  // 新增自動捲動函數
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // 監聽聊天記錄變化
  useEffect(() => {
    scrollToBottom();
  }, [uiState.chatHistory, scrollToBottom]);

  // 監聽思考狀態變化
  useEffect(() => {
    if (mode === 'thinking') {
      scrollToBottom();
    }
  }, [mode, scrollToBottom]);

  // 當 goalId 改變時重置到初始狀態
  useEffect(() => {
    setUIState(prev => ({
      ...prev,
      chatHistory: [],
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
    }));
  }, [goalId]);

  const handleDirectInput = (text: string) => {
    setMode('thinking');
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
    
    updateUIState(prev => ({
      ...prev,
      inputText: '',
      chatHistory: [...prev.chatHistory, { message: textToSend, role: 'user' }]
    }), 'handleSendMessage-clear');

    try {
      const response = await mindMapService.handleUserInput(textToSend);
      
      // 更新 UI 狀態
      if (response.form) {
        updateUIFromForm(response.form, response.message);
        updateUIState(prev => ({
          chatHistory: [...prev.chatHistory, { 
            message: response.message.replace(/\\n/g, '\n'), 
            role: 'assistant' 
          }]
        }), 'handleSendMessage-response');
      } else {
        updateUIState(prev => ({
          message: response.message || '你想跟我說什麼呢',
          chatHistory: [...prev.chatHistory, { 
            message: response.message.replace(/\\n/g, '\n'), 
            role: 'assistant' 
          }]
        }), 'handleSendMessage');
      }

      setMode('idle');
    } catch (error) {
      console.error('Failed to send message:', error);
      updateUIState(prev => ({
        message: '抱歉，發生了一些錯誤，請稍後再試。',
        chatHistory: [...prev.chatHistory, { message: '抱歉，發生了一些錯誤，請稍後再試。', role: 'assistant' }]
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
          className={`fixed bottom-6 right-6 z-50 ${className}`}
          initial={false}
          animate={{
            width: mode === 'idle' && !uiState.message && !uiState.showChoices && !uiState.showInput ? '80px' : '400px',
            height: mode === 'idle' && !uiState.message && !uiState.showChoices && !uiState.showInput ? '80px' : 'calc(100vh - 48px)',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* 懸浮小球模式 */}
          {mode === 'idle' && !uiState.message && !uiState.showChoices && !uiState.showInput ? (
            <motion.button
              onClick={handleAssistantClick}
              className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative cursor-pointer"
            >
              <Lottie
                animationData={slothAnimation}
                loop={true}
                className="w-[120%] h-[120%] -translate-x-[7%] -translate-y-[5%] pointer-events-none"
              />
            </motion.button>
          ) : (
            /* 面板模式 */
            <motion.div
              className="w-full h-full bg-gradient-to-br from-purple-100/90 to-pink-100/90 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col overflow-hidden relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* 網格背景 */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />

              {/* 放大的 sloth 動畫 */}
              <div className="absolute top-4 right-4 w-24 h-24 z-10">
                <Lottie
                  animationData={slothAnimation}
                  loop={true}
                  className="w-full h-full"
                />
              </div>

              {/* 標題列 */}
              <div className="flex items-center p-4 relative">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-purple-800/90 dark:text-purple-200/90 select-text">樹懶小幫手</h2>
                </div>
              </div>

              {/* 聊天記錄區域 */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              >
                {uiState.chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 backdrop-blur-sm select-text ${
                        chat.role === 'user'
                          ? 'bg-purple-500/90 text-white shadow-md'
                          : 'bg-white/80 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100 shadow-sm'
                      }`}
                    >
                      {chat.message.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                          {i < chat.message.split('\n').length - 1 && (
                            <>
                              <br />
                              <br />
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
                {mode === 'thinking' && (
                  <div className="flex justify-start">
                    <div className="bg-white/80 dark:bg-purple-900/30 rounded-2xl p-3 shadow-sm backdrop-blur-sm">
                      <div className="flex space-x-2">
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
                          className="w-2 h-2 bg-purple-500/80 rounded-full"
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
                          className="w-2 h-2 bg-purple-500/80 rounded-full"
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
                          className="w-2 h-2 bg-purple-500/80 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 選項區域 */}
              {uiState.showChoices && uiState.choices.length > 0 && (
                <div className="p-4 relative">
                  <div className="space-y-2">
                    {uiState.choices.map((choice, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => choice.action()}
                        className="w-full p-3 bg-white/80 dark:bg-purple-900/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-3 backdrop-blur-sm"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-50/80 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                          {choice.icon}
                        </div>
                        <div className="flex-1 text-left">
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
                </div>
              )}

              {/* 輸入區域 - 總是顯示 */}
              <div className="p-4 bg-white/80 dark:bg-purple-900/30 backdrop-blur-sm relative">
                <div className="flex items-center space-x-3">
                  <textarea
                    value={uiState.inputText}
                    onChange={(e) => setUIState(prev => ({ ...prev, inputText: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    placeholder={uiState.inputPlaceholder || "和我分享你的想法吧..."}
                    className="flex-1 resize-none rounded-lg border border-purple-200/50 dark:border-purple-700/50 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-white/80 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100 text-sm backdrop-blur-sm"
                    rows={2}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !uiState.inputText.trim()}
                    className="p-3 bg-purple-500/90 text-white rounded-lg hover:bg-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 