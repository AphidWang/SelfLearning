import { describe, it, expect, beforeEach } from 'vitest';
import { useRetroStore } from '../apps/client/src/store/retroStore';

// 基本狀態與方法檢查

describe('Retro Store - Basic Tests', () => {
  beforeEach(() => {
    const store = useRetroStore.getState();
    store.reset();
  });

  it('應該有正確的初始狀態', () => {
    const state = useRetroStore.getState();
    expect(state.currentWeekStats).toBeNull();
    expect(state.questionBank.length).toBeGreaterThan(0);
    expect(state.currentSession).toBeNull();
    expect(state.recentAnswers).toEqual([]);
    expect(state.achievements).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.drawAnimation).toEqual({
      isAnimating: false,
      currentStep: 'idle',
      progress: 0
    });
  });

  it('應該定義所有核心方法', () => {
    const store = useRetroStore.getState();
    expect(typeof store.getCurrentWeekStats).toBe('function');
    expect(typeof store.drawQuestion).toBe('function');
    expect(typeof store.saveAnswer).toBe('function');
    expect(typeof store.updateAnswer).toBe('function');
    expect(typeof store.deleteAnswer).toBe('function');
  });

  it('應該定義所有 session 相關的方法', () => {
    const store = useRetroStore.getState();
    expect(typeof store.createSession).toBe('function');
    expect(typeof store.updateSession).toBe('function');
    expect(typeof store.getSessionHistory).toBe('function');
    expect(typeof store.getPersonalStats).toBe('function');
    expect(typeof store.getAchievements).toBe('function');
    expect(typeof store.getCurrentSession).toBe('function');
    expect(typeof store.saveSessionAnswer).toBe('function');
    expect(typeof store.updateSessionQuestions).toBe('function');
    expect(typeof store.completeSession).toBe('function');
  });

  it('應該能正確設置和重置狀態', () => {
    const store = useRetroStore.getState();
    store.setLoading(true);
    store.setError('error');
    store.clearCurrentSession();

    let state = useRetroStore.getState();
    expect(state.loading).toBe(true);
    expect(state.error).toBe('error');
    expect(state.currentSession).toBeNull();

    store.reset();

    state = useRetroStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.currentSession).toBeNull();
    expect(state.currentWeekStats).toBeNull();
  });

  it('drawQuestion 應該回傳有效問題', async () => {
    const store = useRetroStore.getState();
    const result = await store.drawQuestion();
    expect(result).not.toBeNull();
    expect(result?.question).toBeDefined();
  });

  it('getWeekId 應該正確格式化日期', () => {
    const store = useRetroStore.getState();
    const id = store.getWeekId('2024-01-03');
    expect(id).toMatch(/\d{4}-W\d{2}/);
  });
});
