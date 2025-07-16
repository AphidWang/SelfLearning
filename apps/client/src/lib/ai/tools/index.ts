import { createTopicTool, createGoalTool, createTaskTool, useTemplateGoalsTool, completeTopicTool, markAsBookmarkTool } from './goal-tools';
import { suggestTopicsTool, suggestStepsTool, suggestTasksTool, exploreMoreTool } from './suggestion-tools';

export const tools = [
  createTopicTool,
  createGoalTool,
  createTaskTool,
  suggestTopicsTool,
  suggestStepsTool,
  suggestTasksTool,
  useTemplateGoalsTool,
  markAsBookmarkTool,
  completeTopicTool,
  exploreMoreTool,
];

export * from './goal-tools';
export * from './suggestion-tools';