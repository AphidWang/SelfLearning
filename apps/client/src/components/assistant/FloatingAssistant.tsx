import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import Lottie from 'lottie-react';
import slothAnimation from '../../assets/lottie/sloth.json';
import { X, Mic, Volume2 } from 'lucide-react';

export type AssistantMode = 'idle' | 'asking' | 'thinking' | 'voice';

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
  const [options, setOptions] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // 使用 ref 來追蹤上一次的位置
  const lastPositionRef = useRef(initialPosition);
  
  // 使用 Framer Motion 的 useMotionValue 來追蹤位置
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);

  // 當 initialPosition 改變時更新位置
  useEffect(() => {
    if (
      initialPosition.x !== lastPositionRef.current.x ||
      initialPosition.y !== lastPositionRef.current.y
    ) {
      x.set(initialPosition.x);
      y.set(initialPosition.y);
      lastPositionRef.current = initialPosition;
    }
  }, [initialPosition.x, initialPosition.y]);

  useEffect(() => {
    if (enabled) {
      // 初始化助理
      setMode('asking');
      setMessage('嗨！今天想要做什麼呢？');
      setOptions(['規劃我的目標', '檢視我的進度', '來聊聊天']);
    }
  }, [enabled]);

  const handleOptionClick = (option: string) => {
    setMode('thinking');
    setMessage('讓我想想...');
    setOptions([]);

    // 模擬思考
    setTimeout(() => {
      setMode('asking');
      switch (option) {
        case '規劃我的目標':
          setMessage('好的！讓我們來規劃新目標。想從哪裡開始？');
          setOptions(['學習目標', '個人成長', '專案計畫']);
          break;
        case '檢視我的進度':
          setMessage('來看看你的學習進度！想了解哪個部分？');
          setOptions(['整體概況', '最近目標', '待辦事項']);
          break;
        case '來聊聊天':
          setMode('voice');
          setMessage('好啊！想聊什麼呢？');
          setOptions([]);
          break;
        default:
          setMode('idle');
          break;
      }
    }, 1500);
  };

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          drag
          dragConstraints={dragConstraints}
          dragMomentum={false}
          dragElastic={0.1}
          style={{ 
            x,
            y,
            position: 'absolute',
            zIndex: isDragging ? 50 : 40
          }}
          onDragStart={() => setIsDragging(true)}
          onDrag={(event, info) => {
            if (onPositionChange) {
              onPositionChange({ x: info.point.x, y: info.point.y });
            }
          }}
          onDragEnd={(event, info) => {
            setIsDragging(false);
            if (onDragEnd) {
              onDragEnd({ x: info.point.x, y: info.point.y });
            }
          }}
          className={`${className}`}
        >
          {/* 主容器 */}
          <motion.div className="relative w-24 h-24">
            {/* 助理圖示 */}
            <button
              onClick={() => {
                if (!isDragging) {
                  if (mode === 'idle') {
                    setMode('asking');
                    setMessage('嗨！今天想要做什麼呢？');
                    setOptions(['規劃我的目標', '檢視我的進度', '來聊聊天']);
                  } else {
                    setMode('idle');
                    setMessage('');
                    setOptions([]);
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

            {/* 聊天泡泡 */}
            <AnimatePresence>
              {mode !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-full right-0 mb-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 max-w-[360px] min-w-[200px] pointer-events-auto"
                  style={{ 
                    pointerEvents: isDragging ? 'none' : 'auto',
                    transformOrigin: 'bottom right'
                  }}
                >
                  {/* 訊息 */}
                  <div className="mb-3">
                    <p className="text-gray-800 dark:text-gray-200">{message}</p>
                  </div>

                  {/* 選項按鈕 */}
                  {options.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      {options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleOptionClick(option)}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 語音模式 */}
                  {mode === 'voice' && (
                    <div className="flex justify-center items-center py-4">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="relative"
                      >
                        <motion.div
                          animate={{
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 bg-indigo-200 dark:bg-indigo-900/50 rounded-full"
                        />
                        <button
                          onClick={() => setMode('asking')}
                          className="relative z-10 p-4 bg-indigo-500 dark:bg-indigo-600 text-white rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors"
                        >
                          {mode === 'voice' ? (
                            <Volume2 className="h-6 w-6" />
                          ) : (
                            <Mic className="h-6 w-6" />
                          )}
                        </button>
                      </motion.div>
                    </div>
                  )}

                  {/* 思考中動畫 */}
                  {mode === 'thinking' && (
                    <div className="flex justify-center items-center space-x-2 py-2">
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
                        className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"
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
                        className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"
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
                        className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                      />
                    </div>
                  )}

                  {/* 尾巴 */}
                  <div className="absolute bottom-0 right-6 transform translate-y-full">
                    <div className="w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 