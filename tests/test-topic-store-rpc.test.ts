import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { useTopicStore } from '../apps/client/src/store/topicStore.full';
import { useTaskStore } from '../apps/client/src/store/taskStore';
import { useGoalStore } from '../apps/client/src/store/goalStore';
import { SUBJECTS } from '../apps/client/src/constants/subjects';
import { initTestAuth, cleanupTestData } from '../vitest.setup';

// This test suite focuses on RPC based helper functions in topicStore
// referenced in SUPABASE_RPC_FUNCTIONS.md.

describe('TopicStore RPC helpers', () => {
  let topicStore: ReturnType<typeof useTopicStore.getState>;
  let goalStore: ReturnType<typeof useGoalStore.getState>;
  let taskStore: ReturnType<typeof useTaskStore.getState>;
  let createdTopicId: string | null = null;
  let createdGoalId: string | null = null;
  let createdTaskId: string | null = null;

  beforeAll(async () => {
    await initTestAuth();
  });

  beforeEach(() => {
    topicStore = useTopicStore.getState();
    goalStore = useGoalStore.getState();
    taskStore = useTaskStore.getState();
    topicStore.reset();
    createdTopicId = null;
    createdGoalId = null;
    createdTaskId = null;
  });

  afterEach(async () => {
    if (createdTopicId) {
      try {
        await topicStore.deleteTopic(createdTopicId);
      } catch (err) {
        console.warn('failed to cleanup topic', err);
      }
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  const createBasicData = async () => {
    const topic = await topicStore.createTopic({
      title: 'RPC 測試主題',
      description: 'for rpc tests',
      subject: SUBJECTS.MATH,
      type: '學習目標',
      category: 'learning',
      status: 'active',
      goals: [],
      bubbles: [],
      is_collaborative: false,
      show_avatars: true
    });
    if (!topic) throw new Error('failed to create topic');
    createdTopicId = topic.id;

    const goal = await goalStore.addGoal(topic.id, {
      title: 'rpc goal',
      description: 'goal',
      status: 'todo',
      priority: 'medium',
      order_index: 0,
      tasks: []
    });
    if (!goal) throw new Error('failed to create goal');
    createdGoalId = goal.id;

    const task = await taskStore.addTask(goal.id, {
      title: 'rpc task',
      description: 'task',
      status: 'todo',
      priority: 'medium',
      order_index: 0,
      need_help: false,
      dueDate: new Date().toISOString(),
      task_type: 'single',
      task_config: {
        type: 'single'
      },
      cycle_config: {
        cycle_type: 'none',
        auto_reset: false
      },
      progress_data: {
        last_updated: new Date().toISOString(),
        completion_percentage: 0
      }
    });
    if (!task) throw new Error('failed to create task');
    createdTaskId = task.id;

    return { topicId: topic.id, goalId: goal.id, taskId: task.id };
  };

  it('getUserTaskActivitiesForDate should return activity data', async () => {
    const { taskId } = await createBasicData();

    // perform a check-in so there is activity
    await taskStore.performTaskAction(taskId, 'check_in');

    const today = new Date().toISOString().split('T')[0];
    const result = await taskStore.getUserTaskActivitiesForDate(today);

    // 基本檢查
    expect(result).toBeDefined();
    expect(result.all_activities).toBeDefined();
    expect(Array.isArray(result.all_activities)).toBe(true);
    expect(result.all_activities.length).toBeGreaterThan(0);

    // 檢查打卡活動
    expect(result.checked_in_tasks).toBeDefined();
    expect(Array.isArray(result.checked_in_tasks)).toBe(true);
    const checkedIn = result.checked_in_tasks.find(
      t => t.id === taskId && t.type === 'check_in'
    );
    expect(checkedIn).toBeDefined();
    expect(checkedIn).toMatchObject({
      id: taskId,
      title: 'rpc task',
      type: 'check_in'
    });

    // 檢查所有活動列表
    const activity = result.all_activities[0];
    expect(activity).toMatchObject({
      id: taskId,
      title: 'rpc task',
      type: 'check_in'
    });
  });

  it('getTopicsProgressForWeek should return progress data', async () => {
    await createBasicData();

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const result = await topicStore.getTopicsProgressForWeek(
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );

    expect(Array.isArray(result)).toBe(true);
  });

  it('getActiveTopicsWithProgress should list active topics', async () => {
    await createBasicData();

    const result = await topicStore.getActiveTopicsWithProgress();
    expect(Array.isArray(result)).toBe(true);
  });
});
