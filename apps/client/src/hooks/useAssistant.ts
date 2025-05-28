import { useState } from 'react';

interface AssistantState {
  isVisible: boolean;
  position: { x: number; y: number };
}

export const useAssistant = (initialState?: Partial<AssistantState>) => {
  const [isVisible, setIsVisible] = useState(initialState?.isVisible ?? true);
  const [position, setPosition] = useState(initialState?.position ?? { x: 0, y: 0 });

  const toggleAssistant = () => setIsVisible(!isVisible);
  
  const reset = () => {
    setIsVisible(initialState?.isVisible ?? true);
    setPosition(initialState?.position ?? { x: 0, y: 0 });
  };

  return {
    isVisible,
    position,
    setPosition,
    toggleAssistant,
    reset
  };
}; 