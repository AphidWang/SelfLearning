import { Task } from '../../../types/task';

export interface TasksBlockProps {
  tasks: Task[];
  onViewAll?: () => void;
} 