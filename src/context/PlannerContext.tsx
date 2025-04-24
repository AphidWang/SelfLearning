import React, { createContext, useContext, useState } from 'react';
import { Student, TaskStatus } from '../types/task';
import { useCurriculum } from './CurriculumContext';

interface Week {
  id: number;
  nodeIds: string[];  // 改用 nodeIds 而不是重複存儲任務數據
}

interface Assignment {
  nodeId: string;     // 改用 nodeId
  studentId: string;
  weekId: number;
  status: 'pending' | 'completed' | 'overdue';
  assignedAt: string;
  completedAt?: string;
}

interface PlannerContextType {
  weeks: Week[];
  students: Student[];
  assignments: Assignment[];
  setWeeks: React.Dispatch<React.SetStateAction<Week[]>>;
  // 任務管理
  assignNodeToWeek: (nodeId: string, weekId: number) => void;
  removeNodeFromWeek: (nodeId: string, weekId: number) => void;
  isNodeAssignable: (nodeId: string, weekId: number) => boolean;
  // 任務分配
  assignNodesToStudents: (params: {
    weekId: number;
    nodeIds: string[];
    studentIds: string[];
  }) => Promise<void>;
  getStudentNodes: (studentId: string) => string[];
  getWeekNodes: (weekId: number) => string[];
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [students] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const { nodes } = useCurriculum();  // 使用 CurriculumContext 的數據

  // 任務管理功能
  const assignNodeToWeek = (nodeId: string, weekId: number) => {
    setWeeks(prevWeeks => 
      prevWeeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            nodeIds: [...week.nodeIds, nodeId]
          };
        }
        return week;
      })
    );
  };

  const removeNodeFromWeek = (nodeId: string, weekId: number) => {
    setWeeks(prevWeeks =>
      prevWeeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            nodeIds: week.nodeIds.filter(id => id !== nodeId)
          };
        }
        return week;
      })
    );
  };

  const isNodeAssignable = (nodeId: string, weekId: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.requirements?.length) return true;

    return node.requirements.every(reqId => {
      const reqNode = nodes.find(n => n.id === reqId);
      const reqWeek = weeks.find(w => w.nodeIds.includes(reqId));
      return reqWeek && reqWeek.id < weekId;
    });
  };

  // 任務分配功能
  const assignNodesToStudents = async ({
    weekId,
    nodeIds,
    studentIds
  }: {
    weekId: number;
    nodeIds: string[];
    studentIds: string[];
  }) => {
    const newAssignments: Assignment[] = studentIds.flatMap(studentId =>
      nodeIds.map(nodeId => ({
        nodeId,
        studentId,
        weekId,
        status: 'pending',
        assignedAt: new Date().toISOString()
      }))
    );

    setAssignments(prev => [...prev, ...newAssignments]);
  };

  const getStudentNodes = (studentId: string) => {
    return assignments
      .filter(a => a.studentId === studentId)
      .map(a => a.nodeId);
  };

  const getWeekNodes = (weekId: number) => {
    return weeks.find(w => w.id === weekId)?.nodeIds || [];
  };

  return (
    <PlannerContext.Provider value={{
      weeks,
      students,
      assignments,
      setWeeks,
      assignNodeToWeek,
      removeNodeFromWeek,
      isNodeAssignable,
      assignNodesToStudents,
      getStudentNodes,
      getWeekNodes
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}; 