import React, { createContext, useContext, useState } from 'react';
import { Task, TaskStatus } from '../types/task';
import { WeekPlan, TaskAssignment } from '../types/planner';
import { useCurriculum } from './CurriculumContext';

interface PlannerContextType {
  weeks: WeekPlan[];
  tasks: Task[];
  assignments: TaskAssignment[];
  
  // 週任務管理
  assignTaskToWeek: (taskId: string, weekId: number) => void;
  removeTaskFromWeek: (taskId: string, weekId: number) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  
  // 任務分配
  assignTasksToStudents: (params: {
    weekId: number;
    taskIds: string[];
    studentIds: string[];
  }) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const { nodes } = useCurriculum();

  // 週任務管理功能
  const assignTaskToWeek = (taskId: string, weekId: number) => {
    setWeeks(prevWeeks => 
      prevWeeks.map(week => {
        if (week.id === weekId) {
          const task = tasks.find(t => t.id === taskId);
          if (!task) return week;
          
          return {
            ...week,
            tasks: [...week.tasks, { ...task, weekId }]
          };
        }
        return week;
      })
    );
  };

  const removeTaskFromWeek = (taskId: string, weekId: number) => {
    setWeeks(prevWeeks =>
      prevWeeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            tasks: week.tasks.filter(task => task.id !== taskId)
          };
        }
        return week;
      })
    );
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status }
          : task
      )
    );

    // 同時更新週任務中的狀態
    setWeeks(prevWeeks =>
      prevWeeks.map(week => ({
        ...week,
        tasks: week.tasks.map(task =>
          task.id === taskId
            ? { ...task, status }
            : task
        )
      }))
    );
  };

  // 任務分配功能
  const assignTasksToStudents = async ({
    weekId,
    taskIds,
    studentIds
  }: {
    weekId: number;
    taskIds: string[];
    studentIds: string[];
  }) => {
    const newAssignments: TaskAssignment[] = studentIds.flatMap(studentId =>
      taskIds.map(taskId => ({
        id: `${taskId}-${studentId}-${weekId}`, // 生成唯一 ID
        taskId,
        studentId,
        weekId,
        status: 'pending',
        assignedAt: new Date().toISOString(),
        assignedBy: 'current-teacher-id', // TODO: 從 auth context 獲取
      }))
    );

    setAssignments(prev => [...prev, ...newAssignments]);

    // 更新任務狀態為進行中
    taskIds.forEach(taskId => {
      updateTaskStatus(taskId, 'in_progress');
    });
  };

  // 初始化週數
  React.useEffect(() => {
    if (weeks.length === 0) {
      const initialWeeks: WeekPlan[] = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        tasks: [],
        nodeIds: [], // 保留向後兼容
        subjectId: '', // TODO: 從課程資料獲取
        creatorId: 'current-teacher-id', // TODO: 從 auth context 獲取
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setWeeks(initialWeeks);
    }
  }, []);

  const value = {
    weeks,
    tasks,
    assignments,
    assignTaskToWeek,
    removeTaskFromWeek,
    updateTaskStatus,
    assignTasksToStudents
  };

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}; 