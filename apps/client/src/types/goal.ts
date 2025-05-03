export type Goal = {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'personal' | 'project';
  status: 'active' | 'completed' | 'archived';
  dueDate: Date;
  progress: number;
  source: 'mentor' | 'student';
  createdAt: Date;
  actionItems: ActionItem[];
};

export type ActionItem = {
  id: string;
  description: string;
  estimatedTime?: string;
  status: 'todo' | 'in-progress' | 'done';
  addedToSchedule: boolean;
  priority: 'high' | 'medium' | 'low';
}; 