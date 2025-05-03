import { SubjectType } from '../constants/subjects';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  templateType: string;
  status: string;
  dueDate: Date;
  progress: number;
  subject: SubjectType;
  createdAt: Date;
  actionItems: ActionItem[];
}

export type ActionItem = {
  id: string;
  description: string;
  estimatedTime?: string;
  status: 'todo' | 'in-progress' | 'done';
  addedToSchedule: boolean;
  priority: 'high' | 'medium' | 'low';
}; 