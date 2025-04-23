import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, BookOpen } from 'lucide-react';
import { StudentProgressTableProps } from './types';
import { card, layout, subjects, taskStyles } from '../../../styles/tokens';

export const StudentProgressTable: React.FC<StudentProgressTableProps> = ({ 
  students,
  onViewDetails 
}) => {
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set(students.map(student => student.id))
  );

  const toggleExpand = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'waiting_feedback':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '進行中';
      case 'waiting_feedback':
        return '待回饋';
      default:
        return '待進行';
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // 計算日期差
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 優先判斷今天、明天、昨天
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    
    // 判斷是否在本週內
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    if (targetDate >= weekStart && targetDate <= weekEnd) {
      const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      return weekdays[targetDate.getDay()];
    }
    
    // 其他日期顯示月日
    return new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric' }).format(date);
  };

  const getDueDateStyle = (endDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(endDate);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return taskStyles.dueDate.overdue;  // 紅色
    } else if (diffDays === 0) {
      return taskStyles.dueDate.today;    // 橙色
    } else {
      return taskStyles.dueDate.upcoming; // 藍色
    }
  };

  return (
    <div className={`${card.base} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                學生
              </th>
              <th scope="col" className="w-5/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                任務完成率
              </th>
              <th scope="col" className="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                最近活動
              </th>
              <th scope="col" className="w-2/12 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                待回饋
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
                        onClick={() => toggleExpand(student.id)}
                        className="mr-3 flex items-center"
                      >
                        {expandedStudents.has(student.id) ? (
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
                    <div className="text-sm text-gray-900 dark:text-white">
                      {student.totalTasks > 0 ? (
                        <>
                          {student.completedTasks}/{student.totalTasks}
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {Math.round((student.completedTasks / student.totalTasks) * 100)}%
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          尚無任務
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {student.lastActive}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
                </tr>
                {expandedStudents.has(student.id) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4">
                      {(student.weeklyPlans?.length ?? 0) > 0 ? (
                        <div className="space-y-6">
                          {student.weeklyPlans?.map((plan, planIndex) => (
                            <div key={planIndex} className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                  {plan.curriculum}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${subjects.getSubjectStyle(plan.subject).bg} ${subjects.getSubjectStyle(plan.subject).text}`}>
                                  <BookOpen size={14} className="mr-1" />
                                  {plan.subject}
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                {plan.tasks.map((task) => (
                                  <div key={task.id} className="grid grid-cols-12 items-center bg-gray-50 dark:bg-gray-700/50 px-6 py-3 rounded-lg">
                                    <div className="col-span-3">
                                      <h3 className={taskStyles.title}>
                                        {task.title}
                                      </h3>
                                    </div>
                                    
                                    <div className="col-span-5">
                                      <p className={taskStyles.description}>
                                        {task.description}
                                      </p>
                                    </div>

                                    <div className="col-span-2 text-center">
                                      <span className={getDueDateStyle(task.endDate)}>
                                        <Clock size={14} className="mr-1" />
                                        {formatDate(task.endDate)}
                                      </span>
                                    </div>

                                    <div className="col-span-2 text-right">
                                      {task.status === 'waiting_feedback' ? (
                                        <span className={taskStyles.status.waiting_feedback}>
                                          待回饋
                                        </span>
                                      ) : task.progress === 100 && task.status === 'completed' ? (
                                        <span className={taskStyles.status.completed}>
                                          已完成
                                        </span>
                                      ) : task.progress > 0 ? (
                                        <span className={taskStyles.status.in_progress}>
                                          進行中 {task.progress}%
                                        </span>
                                      ) : (
                                        <span className={taskStyles.status.pending}>
                                          待完成
                                        </span>
                                      )}
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