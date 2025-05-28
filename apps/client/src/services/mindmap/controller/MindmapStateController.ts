import { stateMachine } from '../config/stateMachine';
import { EventType } from '../config/events';
import { StateConfig } from '../config/stateMachine';

export class MindmapStateController {
  private currentState: string;
  private stateHistory: string[] = [];
  private readonly maxHistoryLength = 10;

  constructor(initialState: string = 'idle') {
    this.currentState = initialState;
    this.stateHistory.push(initialState);
  }

  /**
   * 獲取當前狀態
   */
  getCurrentState(): string {
    return this.currentState;
  }

  /**
   * 獲取狀態歷史
   */
  getStateHistory(): string[] {
    return [...this.stateHistory];
  }

  /**
   * 獲取當前狀態的詳細信息
   */
  getCurrentStateInfo(): StateConfig | null {
    return stateMachine.getState(this.currentState);
  }

  /**
   * 檢查是否可以觸發某個事件
   */
  canTrigger(event: EventType): boolean {
    const nextState = stateMachine.getNextState(this.currentState, event);
    return nextState !== null;
  }

  /**
   * 處理使用者事件
   */
  handleUserEvent(eventType: EventType, payload?: any): { 
    allowed: boolean; 
    reason?: string;
    nextState?: string;
  } {
    // 使用者事件不應該觸發狀態轉換
    return {
      allowed: true,
      nextState: this.currentState
    };
  }

  /**
   * 處理 AI 動作
   */
  handleAIAction(actionType: EventType, payload?: any): {
    allowed: boolean;
    reason?: string;
    nextState?: string;
  } {
    const stateConfig = this.getCurrentStateInfo();
    if (!stateConfig) {
      return {
        allowed: false,
        reason: "invalid_state",
        nextState: this.currentState
      };
    }

    const nextState = stateConfig.transitions[actionType];
    if (!nextState) {
      return {
        allowed: false,
        reason: "invalid_transition",
        nextState: this.currentState
      };
    }

    return {
      allowed: true,
      nextState
    };
  }

  /**
   * 執行狀態轉換
   * @returns 是否成功轉換
   */
  transition(event: EventType): boolean {
    const actionResult = this.handleAIAction(event);
    if (!actionResult.allowed) {
      console.warn(`❌ 無法從 ${this.currentState} 轉換到 ${event} 事件: ${actionResult.reason}`);
      return false;
    }

    if (!actionResult.nextState) {
      console.warn(`❌ 無效的下一個狀態`);
      return false;
    }

    console.log(`🔄 狀態轉換: ${this.currentState} -> ${actionResult.nextState} (事件: ${event})`);
    this.currentState = actionResult.nextState;
    
    // 更新歷史記錄
    this.stateHistory.push(actionResult.nextState);
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
    }

    return true;
  }

  /**
   * 獲取當前狀態可用的工具列表
   */
  getAvailableTools(): string[] {
    return stateMachine.getAvailableTools(this.currentState);
  }

  /**
   * 檢查某個工具是否可用
   */
  isToolAllowed(tool: string): boolean {
    const availableTools = this.getAvailableTools();
    return availableTools.includes(tool);
  }

  /**
   * 獲取當前狀態可用的所有事件
   */
  getAvailableEvents(): EventType[] {
    return stateMachine.getAvailableEvents(this.currentState);
  }

  /**
   * 重置狀態
   */
  reset(initialState: string = 'idle'): void {
    this.currentState = initialState;
    this.stateHistory = [initialState];
  }

  /**
   * 檢查是否可以回退到上一個狀態
   */
  canRollback(): boolean {
    return this.stateHistory.length > 1;
  }

  /**
   * 回退到上一個狀態
   */
  rollback(): boolean {
    if (!this.canRollback()) {
      return false;
    }

    this.stateHistory.pop(); // 移除當前狀態
    this.currentState = this.stateHistory[this.stateHistory.length - 1];
    console.log(`↩️ 回退到上一個狀態: ${this.currentState}`);
    return true;
  }

  /**
   * 獲取狀態轉換建議
   */
  getTransitionSuggestions(): { event: EventType; description: string }[] {
    const availableEvents = this.getAvailableEvents();
    return availableEvents.map(event => ({
      event,
      description: `可以執行 ${event} 事件`
    }));
  }
} 