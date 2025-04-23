import React from 'react';
import { Book } from 'lucide-react';
import { RecentActivitiesBlockProps } from './types';
import { card, text, layout } from '../../../styles/tokens';

export const RecentActivitiesBlock: React.FC<RecentActivitiesBlockProps> = ({ 
  activities,
  onViewAll 
}) => {
  return (
    <div className={`${card.base} p-4`}>
      <div className={layout.section.header}>
        <h2 className={text.title}>學生最近活動</h2>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className={text.link}
          >
            查看全部
          </button>
        )}
      </div>
      <div className={layout.section.content}>
        {activities.map((activity) => (
          <div key={activity.id} className={layout.activity.container}>
            <div className={layout.icon.wrapper}>
              <div className={layout.icon.circle}>
                <Book size={16} className={layout.icon.base} />
              </div>
            </div>
            <div>
              <p className={text.activity}>
                <span className="font-semibold">{activity.student}</span> {activity.activity}
              </p>
              <p className={text.description}>{activity.detail}</p>
              <p className={`mt-1 ${text.meta}`}>{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 