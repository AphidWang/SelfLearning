import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initSentry } from './config/sentry';

console.log('main.tsx 開始執行');

// 初始化 Sentry
initSentry();
console.log('Sentry 初始化呼叫完成');

// 暫時抑制 react-beautiful-dnd 的 defaultProps 警告
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes('Support for defaultProps will be removed from memo components')) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
