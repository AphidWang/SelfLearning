export interface Student {
  id: string;
  name: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  lastActive: string;
  avatar: string;
  subjects: Array<{
    name: string;
    progress: number;
  }>;
  pendingFeedback: number;
}

export interface StudentProgressTableProps {
  students: Student[];
  onViewDetails?: (studentId: string) => void;
} 