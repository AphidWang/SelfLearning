import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import Lottie from 'lottie-react';
import slothAnimation from '../../assets/lottie/sloth.json';
import { 
  X, 
  Mic, 
  Volume2, 
  Send, 
  Loader2, 
  MessageSquare,
  History,
  Settings,
  BookOpen,
  Brain,
  Gamepad
} from 'lucide-react';
import { ChatService } from '../../lib/ai/services/chat';
import { ChatResponse } from '../../lib/ai/types';

export type AssistantMode = 'idle' | 'asking' | 'thinking' | 'voice' | 'chat' | 'menu';

interface Choice {
  text: string;
  icon: React.ReactNode;
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
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  enabled = true,
  onToggle,
  dragConstraints,
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  onDragEnd,
  hideCloseButton = false,
  className = ''
}) => {
  const [mode, setMode] = useState<AssistantMode>('idle');
  const [message, setMessage] = useState('');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatService = React.useMemo(() => new ChatService(), []);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  
  useEffect(() => {
    if (enabled) {
      // 初始化助理
      setMode('asking');
      setMessage('嗨！今天想要做什麼呢？');
      setChoices([
        { 
          text: "我想問功課", 
          icon: <BookOpen className="h-12 w-12 text-indigo-600" />,
          description: "讓我來幫你解決課業上的疑問吧！",
          action: () => handleHomeworkQuestion() 
        },
        { 
          text: "我想學新東西", 
          icon: <Brain className="h-12 w-12 text-indigo-600" />,
          description: "一起探索有趣的新知識！",
          action: () => handleNewTopicQuestion() 
        },
        { 
          text: "我想玩遊戲", 
          icon: <Gamepad className="h-12 w-12 text-indigo-600" />,
          description: "來玩個益智遊戲吧！",
          action: () => handleGameQuestion() 
        }
      ]);
    }
  }, [enabled]);

  const handleHomeworkQuestion = () => {
    setMode('thinking');
    setTimeout(() => {
      setMode('asking');
      setMessage("太好了！讓我來幫你解決功課的問題。你想問哪一科的功課呢？");
      setChoices([
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
      ]);
    }, 1500);
  };

  const handleNewTopicQuestion = () => {
    setMode('thinking');
    setTimeout(() => {
      setMode('asking');
      setMessage("太棒了！想學習什麼新知識呢？");
      setChoices([
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
      ]);
    }, 1500);
  };

  const handleGameQuestion = () => {
    setMode('thinking');
    setTimeout(() => {
      setMode('chat');
      setMessage("好啊！想玩什麼類型的遊戲呢？");
      setInputText('');
    }, 1500);
  };

  const handleSubjectSelect = (subject: string) => {
    setMode('thinking');
    setTimeout(() => {
      setMode('chat');
      setMessage(`好的！讓我們來解決${subject}的問題。請告訴我你遇到了什麼困難？`);
      setInputText('');
    }, 1500);
  };

  const handleTopicSelect = (topic: string) => {
    setMode('thinking');
    setTimeout(() => {
      setMode('chat');
      setMessage(`${topic}真是個有趣的主題！你最想了解什麼呢？`);
      setInputText('');
    }, 1500);
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await chatService.sendMessage(inputText);
      setChatHistory(prev => [...prev, 
        { message: inputText, role: 'user' }, 
        { ...response, role: 'assistant' }
      ]);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatHistory(prev => [...prev, 
        { message: inputText, role: 'user' },
        { message: '抱歉，發生了一些錯誤，請稍後再試。', role: 'assistant', error: '發送失敗' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, chatService]);

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
        setMode('chat');
        setMessage("我聽到你的問題了！讓我想想...");
      }, 1000);
    }
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
          onDragEnd={(event, info) => {
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
                if (!isDragging) {
                  if (mode === 'idle') {
                    setMode('asking');
                    setMessage('嗨！今天想要做什麼呢？');
                    setChoices([
                      { 
                        text: "我想問功課", 
                        icon: <BookOpen className="h-12 w-12 text-indigo-600" />,
                        description: "讓我來幫你解決課業上的疑問吧！",
                        action: () => handleHomeworkQuestion() 
                      },
                      { 
                        text: "我想學新東西", 
                        icon: <Brain className="h-12 w-12 text-indigo-600" />,
                        description: "一起探索有趣的新知識！",
                        action: () => handleNewTopicQuestion() 
                      },
                      { 
                        text: "我想玩遊戲", 
                        icon: <Gamepad className="h-12 w-12 text-indigo-600" />,
                        description: "來玩個益智遊戲吧！",
                        action: () => handleGameQuestion() 
                      }
                    ]);
                  } else {
                    setMode('idle');
                    setMessage('');
                    setChoices([]);
                  }
                }
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
            <AnimatePresence>
              {mode !== 'idle' && mode !== 'menu' && (
                <>
                  {/* AI 回覆泡泡 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-0 right-full mr-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-[500px] min-w-[400px] pointer-events-auto select-text cursor-text"
                    style={{ 
                      pointerEvents: isDragging ? 'none' : 'auto',
                      transformOrigin: 'bottom right'
                    }}
                  >
                    {/* 訊息 */}
                    <div>
                      <p className="text-lg text-gray-800 dark:text-gray-200">{message}</p>
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

                  {/* 選項泡泡 */}
                  {choices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-[800px] min-w-[600px] pointer-events-auto cursor-default ${
                        mode === 'chat' ? 'bottom-[calc(100%+13rem)]' : 'bottom-full mb-3'
                      }`}
                      style={{ 
                        pointerEvents: isDragging ? 'none' : 'auto',
                        transformOrigin: 'bottom right'
                      }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {choices.map((choice, index) => (
                          <div
                            key={index}
                            className="w-full p-6 text-left bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex flex-col items-center text-center">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => choice.action()}
                                className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 cursor-pointer"
                              >
                                {choice.icon}
                              </motion.button>
                              <div className="select-text">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                  {choice.text}
                                </h3>
                                <p className="text-base text-gray-600 dark:text-gray-400 cursor-text">
                                  {choice.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 尾巴 */}
                      <div className="absolute bottom-0 right-6 transform translate-y-full">
                        <div className="w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
                      </div>
                    </motion.div>
                  )}

                  {/* 輸入泡泡 */}
                  {mode === 'chat' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-[calc(100%+2rem)] right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-[500px] min-w-[400px] pointer-events-auto"
                      style={{ 
                        pointerEvents: isDragging ? 'none' : 'auto',
                        transformOrigin: 'bottom right'
                      }}
                    >
                      <div className="flex flex-col">
                        {/* 最新一輪對話 */}
                        {chatHistory.length > 0 && (
                          <div className="mb-6 space-y-4">
                            {chatHistory.slice(-2).map((item, index) => (
                              <div
                                key={index}
                                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-lg p-4 ${
                                    item.role === 'user'
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                  }`}
                                >
                                  {item.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 提示文字 */}
                        <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                          和我分享你的想法吧
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
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="輸入訊息..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            rows={2}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputText.trim()}
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
                </>
              )}

              {/* 選單 */}
              {mode === 'menu' && (
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
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 