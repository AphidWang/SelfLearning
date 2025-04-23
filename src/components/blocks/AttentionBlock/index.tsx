import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { AttentionBlockProps } from './types';
import { card } from '../../../styles/tokens';

export const AttentionBlock: React.FC<AttentionBlockProps> = ({ items }) => {
  const getAlertStyles = (type: 'error' | 'warning' | 'success') => {
    const styles = {
      error: {
        border: 'border-red-500',
        bg: 'bg-red-50 dark:bg-red-900/10',
        icon: 'text-red-400',
        title: 'text-red-800 dark:text-red-300',
        description: 'text-red-700 dark:text-red-200'
      },
      warning: {
        border: 'border-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        icon: 'text-orange-400',
        title: 'text-orange-800 dark:text-orange-300',
        description: 'text-orange-700 dark:text-orange-200'
      },
      success: {
        border: 'border-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        icon: 'text-blue-400',
        title: 'text-blue-800 dark:text-blue-300',
        description: 'text-blue-700 dark:text-blue-200'
      }
    };
    return styles[type];
  };

  return (
    <div className={`${card.base} p-4`}>
      <div className="space-y-4">
        {items.map((item, index) => {
          const styles = getAlertStyles(item.type);
          return (
            <div 
              key={index} 
              className={`p-3 border-l-4 ${styles.border} ${styles.bg} rounded-r-lg`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {item.type === 'success' ? (
                    <TrendingUp className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
                  ) : (
                    <AlertTriangle className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${styles.title}`}>
                    {item.title}
                  </h3>
                  <div className={`mt-1 text-sm ${styles.description}`}>
                    <p>{item.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 