import React from 'react';
import { StudentProgressTableProps } from './types';
import { card, text } from '../../../styles/tokens';

export const StudentProgressTable: React.FC<StudentProgressTableProps> = ({ 
  students,
  onViewDetails 
}) => {
  return (
    <div className={`${card.base} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                學生
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                總進度
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                任務完成率
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                最近活動
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                待回饋
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full object-cover" src={student.avatar} alt={student.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                      <div 
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {student.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {student.completedTasks}/{student.totalTasks}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round((student.completedTasks / student.totalTasks) * 100)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {student.lastActive}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {student.pendingFeedback > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {student.pendingFeedback}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      無
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onViewDetails?.(student.id)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                  >
                    詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 