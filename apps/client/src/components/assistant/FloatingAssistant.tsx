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
  Gamepad
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChatService } from '../../lib/ai/services/chat';
import { MindMapService } from '../../lib/ai/services/mindmap';
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
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  enabled = true,
  dragConstraints,
  initialPosition = { x: 0, y: 0 },
  onDragEnd,
  className = '',
  onActionSubmit
}) => {
  const [mode, setMode] = useState<AssistantMode>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatResponse[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const chatService = React.useMemo(() => new ChatService(), []);
  const mindMapService = React.useMemo(() => new MindMapService(), []);
  const dragControls = useDragControls();

  // UI 狀態
  const [uiState, setUIState] = useState<AssistantUIState>({
    showChoices: false,
    showInput: true,
    message: '',
    choices: [],
    inputText: '',
    inputPlaceholder: '和我分享你的想法吧'
  });

  // 根據 form 配置更新 UI 狀態
  const updateUIFromForm = (form: ActionForm) => {
    setUIState(prev => ({
      ...prev,
      showChoices: form.options.length > 0,
      showInput: !form.options.length,
      inputPlaceholder: form.description || '和我分享你的想法吧',
      choices: form.options.map(option => {
        if (Array.isArray(option.param)) {
          return option.param.map(item => ({
            text: item.label,
            icon: <Brain className="h-12 w-12 text-emerald-600" />,
            description: item.label,
            action: () => {
              if (item.action) {
                onActionSubmit?.(item.action.type, item.action.params);
              }
            }
          }));
        }
        return [{
          text: option.param.label,
          icon: <Brain className="h-12 w-12 text-emerald-600" />,
          description: option.param.label,
          action: () => {
            if (option.param.action) {
              onActionSubmit?.(option.param.action.type, option.param.action.params);
            }
          }
        }];
      }).flat()
    }));
  };

  useEffect(() => {
    if (enabled) {
      // 初始化助理
      setMode('idle');
      setUIState(prev => ({
        ...prev,
        message: '嗨！今天想要做什麼呢？',
        showChoices: true,
        showInput: false,
        choices: [
          { 
            text: "我想問功課", 
            icon: <BookOpen className="h-12 w-12 text-indigo-600" />,
            description: "讓我來幫你解決課業上的疑問吧！",
            action: () => handleHomeworkQuestion() 
          },
          { 
            text: "我想學新東西", 
            icon: <Brain className="h-12 w-12 text-emerald-600" />,
            description: "一起探索有趣的新知識！",
            action: () => handleNewTopicQuestion() 
          },
          { 
            text: "我想玩遊戲", 
            icon: <Gamepad className="h-12 w-12 text-orange-600" />,
            description: "來玩個益智遊戲吧！",
            action: () => handleGameQuestion() 
          }
        ]
      }));
    }
  }, [enabled]);

  const handleHomeworkQuestion = () => {
    setMode('thinking');
    setTimeout(() => {
      setUIState(prev => ({
        ...prev,
        message: "太好了！讓我來幫你解決功課的問題。你想問哪一科的功課呢？",
        showChoices: true,
        showInput: false,
        choices: [
          {
            text: "數學",
            icon: <span className="text-4xl">🔢</span>,
            description: "解決數學計算和應用題",
            action: () => handleSubjectSelect("數學")
          },
          {
            text: "自然",
            icon: <span className="text-4xl">🔬</span>,
            description: "探索科學和自然現象",
            action: () => handleSubjectSelect("自然")
          },
          {
            text: "語文",
            icon: <span className="text-4xl">📚</span>,
            description: "國語、英語學習指導",
            action: () => handleSubjectSelect("語文")
          }
        ]
      }));
      setMode('idle');
    }, 1500);
  };

  const handleNewTopicQuestion = () => {
    setMode('thinking');
    setTimeout(() => {
      setUIState(prev => ({
        ...prev,
        message: "太棒了！想學習什麼新知識呢？",
        showChoices: true,
        showInput: false,
        choices: [
          {
            text: "太空探索",
            icon: <span className="text-4xl">🚀</span>,
            description: "探索浩瀚的宇宙奧秘",
            action: () => handleTopicSelect("太空探索")
          },
          {
            text: "動物世界",
            icon: <span className="text-4xl">🦁</span>,
            description: "認識地球上的生物",
            action: () => handleTopicSelect("動物世界")
          }
        ]
      }));
      setMode('idle');
    }, 1500);
  };

  const handleGameQuestion = () => {
    setMode('thinking');
    setTimeout(() => {
      setUIState(prev => ({
        ...prev,
        message: "好啊！想玩什麼類型的遊戲呢？",
        showChoices: false,
        showInput: true,
        inputText: ''
      }));
      setMode('idle');
    }, 1500);
  };

  const handleSubjectSelect = (subject: string) => {
    setMode('thinking');
    setTimeout(() => {
      setUIState(prev => ({
        ...prev,
        message: `好的！讓我們來解決${subject}的問題。請告訴我你遇到了什麼困難？`,
        showChoices: false,
        showInput: true,
        inputText: ''
      }));
      setMode('idle');
    }, 1500);
  };

  const handleTopicSelect = (topic: string) => {
    setMode('thinking');
    setTimeout(() => {
      setUIState(prev => ({
        ...prev,
        message: `${topic}真是個有趣的主題！你最想了解什麼呢？`,
        showChoices: false,
        showInput: true,
        inputText: ''
      }));
      setMode('idle');
    }, 1500);
  };

  const handleSendMessage = useCallback(async () => {
    if (!uiState.inputText.trim() || isLoading) return;

    setIsLoading(true);
    setMode('thinking');
    try {
      // 使用 MindMapService 處理用戶輸入
      const response = await mindMapService.handleUserInput(uiState.inputText);
      
      // 更新聊天歷史
      setChatHistory(prev => [...prev, 
        { message: uiState.inputText, role: 'user' }
      ]);

      // 如果有表單，更新 UI
      if (response.form) {
        updateUIFromForm(response.form);
      }

      // 更新訊息
      setUIState(prev => ({
        ...prev,
        message: response.tool === 'ask_for_input' ? '請輸入你的想法' : '好的，我了解了',
        inputText: '',
        showInput: response.tool === 'ask_for_input'
      }));

      setMode('idle');
    } catch (error) {
      console.error('Failed to send message:', error);
      setUIState(prev => ({
        ...prev,
        message: '抱歉，發生了一些錯誤，請稍後再試。'
      }));
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

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      setTimeout(() => {
        setMode('idle');
        setUIState(prev => ({
          ...prev,
          message: "我聽到你的問題了！讓我想想..."
        }));
      }, 1000);
    }
  };

  // 修改點擊事件
  const handleAssistantClick = () => {
    console.log('Assistant clicked, current mode:', mode);
    console.log('isDragging:', isDragging);
    
    if (!isDragging) {
      if (mode === 'idle') {
        console.log('Setting up initial state');
        setMode('idle');
        setUIState(prev => {
          console.log('Previous UI state:', prev);
          const newState = {
            ...prev,
            message: '嗨！今天想要做什麼呢？',
            showChoices: true,
            showInput: false,
            choices: [
              { 
                text: "我想問功課", 
                icon: <BookOpen className="h-12 w-12 text-indigo-600" />,
                description: "讓我來幫你解決課業上的疑問吧！",
                action: () => handleHomeworkQuestion() 
              },
              { 
                text: "我想學新東西", 
                icon: <Brain className="h-12 w-12 text-emerald-600" />,
                description: "一起探索有趣的新知識！",
                action: () => handleNewTopicQuestion() 
              },
              { 
                text: "我想玩遊戲", 
                icon: <Gamepad className="h-12 w-12 text-orange-600" />,
                description: "來玩個益智遊戲吧！",
                action: () => handleGameQuestion() 
              }
            ]
          };
          console.log('New UI state:', newState);
          return newState;
        });
      } else {
        console.log('Resetting state');
        setMode('idle');
        setUIState(prev => {
          console.log('Previous UI state:', prev);
          const newState = {
            ...prev,
            message: '',
            showChoices: false,
            showInput: false,
            choices: []
          };
          console.log('New UI state:', newState);
          return newState;
        });
      }
    }
  };

  // 在 useEffect 中也加入 log
  useEffect(() => {
    console.log('Mode changed:', mode);
    console.log('UI State:', uiState);
  }, [mode, uiState]);

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
            className="relative w-24 h-24"
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
              className="w-full h-full rounded-full bg-white dark:bg-gray-800 shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative cursor-move"
            >
              <Lottie
                animationData={slothAnimation}
                loop={true}
                className="w-full h-full pointer-events-none"
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
                      className="absolute bottom-[calc(100%+2rem)] right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-[500px] min-w-[400px] pointer-events-auto select-text cursor-text min-h-[8rem] max-h-[60vh] overflow-y-auto"
                      style={{ 
                        pointerEvents: isDragging ? 'none' : 'auto',
                        transformOrigin: 'bottom right'
                      }}
                    >
                      {/* 訊息 */}
                      <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 font-sans leading-relaxed whitespace-pre-wrap">
                          {uiState.message}
                        </p>
                      </div>

                      {/* 思考中動畫 */}
                      {mode === 'thinking' && (
                        <div className="flex justify-center items-center space-x-3 py-4">
                          <motion.div
                            animate={{
                              scale: [1, 0.8, 1],
                              opacity: [1, 0.5, 1],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: 0,
                            }}
                            className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 0.8, 1],
                              opacity: [1, 0.5, 1],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                            className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 0.8, 1],
                              opacity: [1, 0.5, 1],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                            className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                          />
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
                      className="absolute bottom-[calc(100%+11rem)] right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-[500px] min-w-[400px] pointer-events-auto"
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
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleVoiceInput}
                            className={`p-3 rounded-full ${
                              isRecording 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <Mic className="h-5 w-5" />
                          </motion.button>
                          <textarea
                            value={uiState.inputText}
                            onChange={(e) => setUIState(prev => ({ ...prev, inputText: e.target.value }))}
                            onKeyPress={handleKeyPress}
                            placeholder="輸入訊息..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                      className={`absolute right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-[500px] min-w-[400px] pointer-events-auto cursor-default ${
                        uiState.showInput ? 'bottom-[calc(100%+20rem)]' : 'bottom-[calc(100%+11rem)]'
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
                            className="w-full p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-4"
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                              {choice.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {choice.text}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
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
                    className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <History className="h-4 w-4 mr-2" />
                    查看對話紀錄
                  </button>
                  <button
                    onClick={() => {/* Open settings */}}
                    className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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