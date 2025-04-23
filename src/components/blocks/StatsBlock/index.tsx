import React from 'react';
import { User, CheckCircle, Clock, Calendar } from 'lucide-react';
import { colors, card, text, iconContainer } from '../../../styles/tokens';
import { StatsBlockProps } from './types';

const statsConfig = [
  {
    key: 'studentCount',
    icon: User,
    label: '學生數',
    color: 'indigo'
  },
  {
    key: 'completedTasks',
    icon: CheckCircle,
    label: '已完成任務',
    color: 'green'
  },
  {
    key: 'pendingTasks',
    icon: Clock,
    label: '待完成任務',
    color: 'orange'
  },
  {
    key: 'weeklyPlans',
    icon: Calendar,
    label: '本週計畫',
    color: 'purple'
  }
] as const;

export const StatsBlock: React.FC<StatsBlockProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
        <div 
          key={stat.key} 
          className={`${card.base} ${card.border} p-4`}
          style={{ borderLeftColor: colors[stat.color].border }}
        >
          <div className="flex items-center">
            <div className={`${iconContainer.base} ${colors[stat.color][100]}`}>
              <stat.icon className={`h-6 w-6 ${colors[stat.color][600]}`} />
            </div>
            <div className="ml-4">
              <p className={text.label}>{stat.label}</p>
              <p className={text.value}>{data[stat.key]}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
