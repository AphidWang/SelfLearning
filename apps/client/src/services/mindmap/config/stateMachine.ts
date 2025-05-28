import states from './states.json';
import { EventType } from './events';

export interface StateConfig {
  name: string;
  description: string;
  defaultTools: string[];
  transitions: Record<string, string>;
}

export interface StateMachine {
  getNextState(current: string, event: EventType): string | null;
  getState(state: string): StateConfig | null;
  getAllStateKeys(): string[];
  isValidState(state: string): boolean;
  getAvailableEvents(current: string): EventType[];
  getAvailableTools(current: string): string[];
}

export const stateMachine: StateMachine = {
  getNextState(current: string, event: EventType): string | null {
    const state = states.states[current];
    return state?.transitions[event] ?? null;
  },

  getState(state: string): StateConfig | null {
    return states.states[state] ?? null;
  },

  getAllStateKeys(): string[] {
    return Object.keys(states.states);
  },

  isValidState(state: string): boolean {
    return state in states.states;
  },

  getAvailableEvents(current: string): EventType[] {
    const state = states.states[current];
    if (!state) return [];
    return Object.keys(state.transitions) as EventType[];
  },

  getAvailableTools(current: string): string[] {
    const state = states.states[current];
    return state?.defaultTools ?? [];
  }
}; 