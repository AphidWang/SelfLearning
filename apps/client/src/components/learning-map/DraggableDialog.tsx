import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DraggableDialogProps {
  children: React.ReactNode;
  mapRect: { left: number; top: number; width: number; height: number };
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  headerSelector: string; // CSS selector for the draggable header element
}

export const DraggableDialog: React.FC<DraggableDialogProps> = ({
  children,
  mapRect,
  position,
  onPositionChange,
  headerSelector
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    isDragging: false
  });

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const headerEl = dialogEl.querySelector(headerSelector) as HTMLElement;
    if (!headerEl) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      dragRef.current.isDragging = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.initialX = position.x;
      dragRef.current.initialY = position.y;

      headerEl.style.cursor = 'grabbing';
      headerEl.style.userSelect = 'none';
      
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;

      e.preventDefault();
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newX = dragRef.current.initialX + deltaX;
      const newY = dragRef.current.initialY + deltaY;
      
      // 只限制標題不要超出地圖範圍
      const header = dialogEl.querySelector(headerSelector) as HTMLElement;
      if (header) {
        const headerRect = header.getBoundingClientRect();
        const minX = -mapRect.width + 40; // 留一點邊距
        const maxX = 40;
        const minY = 0;
        const maxY = mapRect.height - headerRect.height;
        
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));
        
        onPositionChange({ x: constrainedX, y: constrainedY });
      } else {
        onPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (!dragRef.current.isDragging) return;
      
      setIsDragging(false);
      dragRef.current.isDragging = false;
      
      headerEl.style.cursor = 'grab';
      headerEl.style.userSelect = '';
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    // 設置初始樣式
    headerEl.style.cursor = 'grab';
    headerEl.style.userSelect = 'none';

    // 添加事件監聽器
    headerEl.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 清理函數
    return () => {
      headerEl.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 重置樣式
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [position, mapRect, headerSelector, onPositionChange]);

  return (
    <motion.div
      ref={dialogRef}
      className="fixed z-50"
      style={{
        left: mapRect.left + mapRect.width + position.x,
        top: mapRect.top + position.y,
        height: mapRect.height - 40,
      }}
      animate={{
        left: mapRect.left + mapRect.width + position.x,
        top: mapRect.top + position.y,
      }}
      transition={{
        duration: isDragging ? 0 : 0.1,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}; 