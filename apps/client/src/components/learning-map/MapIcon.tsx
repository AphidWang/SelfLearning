import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Topic } from '../../types/goal';
import { Compass, Book, Target } from 'lucide-react';

interface MapIconProps {
  id: string;
  title: string;
  src: string;
  left: number;
  top: number;
  onTopicClick: (topicId: string) => void;
  flip?: boolean;
  showOrbs?: boolean;
  orbTopics?: Topic[];
}

const RADIUS = 120;
const PARENT_SIZE = 128; // w-32 = 128px
const CANVAS_SIZE = RADIUS * 2;
const ORB_SIZE = 56; // 水晶球的大小 (w-14 = 56px)
const ORB_ANGLES = [150, 30, -90];

export const MapIcon: React.FC<MapIconProps> = ({ 
  id,
  title, 
  src, 
  left, 
  top, 
  onTopicClick, 
  flip,
  showOrbs = false,
  orbTopics = []
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredOrbArea, setHoveredOrbArea] = useState(false);

  // 計算實際位置
  const getOrbPosition = useCallback((angle: number) => {
    const radian = (angle * Math.PI) / 180;
    const centerOffset = CANVAS_SIZE / 2;
    const orbOffset = ORB_SIZE / 2;
    const position = {
      x: centerOffset + ((RADIUS - orbOffset) * Math.cos(radian)),
      y: centerOffset + ((RADIUS - orbOffset) * Math.sin(radian))
    };

    // 所有水晶球向左上移動
    position.x -= orbOffset;
    position.y -= orbOffset;

    return position;
  }, []);

  // 記憶化主要樣式
  const mainStyle = useMemo(() => ({
    left: `${left}%`,
    top: `${top}%`,
    transform: 'translate(-50%, -50%)',
    transformOrigin: 'center center'
  }), [left, top]);

  const imageStyle = useMemo(() => ({
    transform: flip ? 'scaleX(-1)' : 'none',
    transformOrigin: 'center'
  }), [flip]);

  const orbContainerStyle = useMemo(() => ({
    width: `${CANVAS_SIZE}px`,
    height: `${CANVAS_SIZE}px`,
    left: '0',
    top: '0',
    right: '0',
    bottom: '0',
    margin: 'auto',
    marginLeft: `${(PARENT_SIZE - CANVAS_SIZE) / 2}px`,
    marginTop: `${(PARENT_SIZE - CANVAS_SIZE) / 2}px`
  }), []);

  // 記憶化圖標列表
  const icons = useMemo(() => [
    <Target key="target" className="w-6 h-6 text-purple-500" />,
    <Book key="book" className="w-6 h-6 text-purple-500" />,
    <Compass key="compass" className="w-6 h-6 text-purple-500" />
  ], []);

  // 記憶化事件處理函數
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleOrbAreaEnter = useCallback(() => setHoveredOrbArea(true), []);
  const handleOrbAreaLeave = useCallback(() => {
    setHoveredOrbArea(false);
    setTimeout(() => {
      if (!isHovered) {
        setIsHovered(false);
      }
    }, 100);
  }, [isHovered]);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={mainStyle}
      animate={{
        scale: isHovered ? 1.15 : 1
      }}
      transition={{
        scale: { duration: 0.2 }
      }}
      initial={false}
      onHoverStart={handleMouseEnter}
      onHoverEnd={handleMouseLeave}
    >
      <img 
        src={src} 
        alt={title} 
        className="w-32 h-32 drop-shadow-lg object-contain"
        style={imageStyle}
      />

      {/* 水晶球容器 */}
      <AnimatePresence>
        {(isHovered || hoveredOrbArea) && showOrbs && (
          <motion.div
            className="absolute inset-0"
            style={orbContainerStyle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={handleOrbAreaEnter}
            onMouseLeave={handleOrbAreaLeave}
          >
            {ORB_ANGLES.map((angle, index) => {
              const orbTopic = orbTopics[index];
              if (!orbTopic) return null;

              const pos = getOrbPosition(angle);

              return (
                <motion.div
                  key={index}
                  className="absolute"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1
                  }}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <motion.button
                    className="w-14 h-14 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-2 border-purple-300 dark:border-purple-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-500 z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTopicClick(orbTopic.id);
                    }}
                    whileHover={{ y: -5 }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      y: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {icons[index]}
                  </motion.button>
                  <motion.div
                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-max"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {orbTopic.title}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 