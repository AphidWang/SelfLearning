export interface StatsData {
  studentCount: number;
  completedTasks: number;
  pendingTasks: number;
  weeklyPlans: number;
}

export interface StatsBlockProps {
  data: StatsData;
} 