export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  progress: number;
}

export interface WeeklyPlan {
  subject: string;
  curriculum: string;
  tasks: Task[];
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  completedTasks: number;
  totalTasks: number;
  lastActive: string;
  pendingFeedback: number;
  weeklyPlans?: WeeklyPlan[];
}

export interface StudentProgressTableProps {
  students: Student[];
  onViewDetails?: (studentId: string) => void;
} 