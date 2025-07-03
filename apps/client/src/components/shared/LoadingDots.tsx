import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingDotsProps {
  isLoading?: boolean;
  color?: string;
  colors?: string[];
  size?: number;
  minLoadingTime?: number;
}

const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  isLoading = true,
  color,
  colors = defaultColors,
  size = 8,
  minLoadingTime = 500
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      // 當 isLoading 為 true 時立即顯示
      setShowLoading(true);
    } else {
      // 當 isLoading 為 false 時，等待最小時間後隱藏
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadingTime]);

  if (!showLoading) return null;

  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2
      }
    },
    end: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    start: {
      y: "50%"
    },
    end: {
      y: "150%"
    }
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const
  };

  const dotsColors = color ? Array(4).fill(color) : colors;

  return (
    <motion.div
      className="flex gap-2 items-center justify-center h-6"
      variants={containerVariants}
      initial="start"
      animate="end"
    >
      {[...Array(4)].map((_, i) => (
        <motion.span
          key={i}
          className="block rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: dotsColors[i % dotsColors.length]
          }}
          variants={dotVariants}
          transition={dotTransition}
        />
      ))}
    </motion.div>
  );
}; 