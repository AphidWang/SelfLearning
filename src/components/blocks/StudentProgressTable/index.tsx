import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { StudentProgressTableProps } from './types';
import { card, layout } from '../../../styles/tokens';

export const StudentProgressTable: React.FC<StudentProgressTableProps> = ({ 
  students,
  onViewDetails 
}) => {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return `進行中`;
      default:
        return '待進行';
    }
  };

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
              <React.Fragment key={student.id}>
                <tr className={`${layout.card.interactive}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                        className="mr-3 flex items-center"
                      >
                        {expandedStudent === student.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <img className="h-8 w-8 rounded-full" src={student.avatar} alt="" />
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
                {expandedStudent === student.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4">
                      {(student.weeklyPlans?.length ?? 0) > 0 ? (
                        <div className="space-y-6">
                          {student.weeklyPlans?.map((plan, planIndex) => (
                            <div key={planIndex} className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {plan.subject}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">·</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {plan.curriculum}
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                {plan.tasks.map((task) => (
                                  <div key={task.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-4">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                          {task.title}
                                        </h3>
                                        <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                                          <Clock size={14} className="mr-1" />
                                          {task.dueDate}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {task.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      {task.progress > 0 && task.progress < 100 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {task.progress}%
                                        </span>
                                      )}
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusStyle(task.status)}`}>
                                        {getStatusText(task.status)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          本週沒有安排的任務
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 