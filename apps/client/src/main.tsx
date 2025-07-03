import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.tsx';
import './index.css';
import { initSentry } from './config/sentry';

// 初始化 Sentry 錯誤監控
initSentry();

// 暫時抑制 react-beautiful-dnd 的 defaultProps 警告
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes('Support for defaultProps will be removed from memo components')) {
    return;
  }
  originalWarn.apply(console, args);
};

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(<App />);
