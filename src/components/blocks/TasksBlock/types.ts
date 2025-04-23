export interface Task {
  id: string;
  title: string;
  dueDate: string;
  students: string[];
}

export interface TasksBlockProps {
  tasks: Task[];
  onViewAll?: () => void;
} 