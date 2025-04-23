export interface Activity {
  id: string;
  student: string;
  activity: string;
  detail: string;
  time: string;
}

export interface RecentActivitiesBlockProps {
  activities: Activity[];
  onViewAll?: () => void;
} 