import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, BookOpen } from 'lucide-react';
import { Student, StudentWeeklyPlan } from '../../../types/student';
import { TaskStatus } from '../../../types/task';
import { layout, subjects, taskStyles, text } from '../../../styles/tokens';
import { formatDate, getDueDateStyle } from '../../../utils/dateUtils';

interface StudentProgressTableProps {
  students: Student[];
  onViewDetails?: (studentId: string) => void;
}

export const StudentProgressTable: React.FC<StudentProgressTableProps> = ({ 
  students,
  onViewDetails 
}) => {
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const toggleExpand = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'waiting_feedback':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: // pending
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '進行中';
      case 'waiting_feedback':
        return '待回饋';
      case 'overdue':
        return '已逾期';
      default:
        return '未開始';
    }
  };

  const getOverdueTasks = (student: Student) => {
    let overdueCount = 0;
    student.weeklyPlans?.forEach(plan => {
      overdueCount += plan.tasks.filter(task => task.status === 'overdue').length;
    });
    return overdueCount;
  };

  return (
    <div className={`${layout.card.base} ${layout.card.border}`}>
      <div className={layout.card.padding}>
        <table className={layout.table}>
          <thead className={layout.tableHeader}>
            <tr>
              <th className={`${layout.tableHeaderCell} w-3/12`}>學生</th>
              <th className={`${layout.tableHeaderCell} w-2/12`}>進度</th>
              <th className={`${layout.tableHeaderCell} w-2/12`}>關注項目</th>
              <th className={`${layout.tableHeaderCell} w-2/12`}>待回饋</th>
              <th className={`${layout.tableHeaderCell} w-2/12`}>最後活動</th>
              <th className={`${layout.tableHeaderCell} w-1/12`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <React.Fragment key={student.id}>
                <tr className={layout.tableRow}>
                  <td className={layout.tableCell}>
                    <div className="flex items-center">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <span className={text.name}>
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className={layout.tableCell}>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className={text.meta}>
                        {student.progress}%
                      </span>
                    </div>
                  </td>
                  <td className={layout.tableCell}>
                    {getOverdueTasks(student) > 0 ? (
                      <span className={taskStyles.status.overdue}>
                        {getOverdueTasks(student)}
                      </span>
                    ) : (
                      <span className={text.meta}>正常</span>
                    )}
                  </td>
                  <td className={layout.tableCell}>
                    <span className={taskStyles.badge.feedback}>
                      {student.pendingFeedback}
                    </span>
                  </td>
                  <td className={layout.tableCell}>
                    <span className={text.meta}>
                      {student.lastActive}
                    </span>
                  </td>
                  <td className={`${layout.tableCell} text-center`}>
                    <button
                      onClick={() => toggleExpand(student.id)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {expandedStudents.has(student.id) ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedStudents.has(student.id) && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                        {student.weeklyPlans && student.weeklyPlans.length > 0 ? (
                          <div className={layout.section.content}>
                            {student.weeklyPlans.map((plan, planIndex) => (
                              <div key={`${student.id}-plan-${planIndex}`} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h3 className={text.name}>
                                      {plan.curriculum}
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${subjects.getSubjectStyle(plan.subject).bg} ${subjects.getSubjectStyle(plan.subject).text}`}>
                                      <BookOpen size={14} className="mr-1" />
                                      {plan.subject}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {plan.tasks.map((task, taskIndex) => (
                                    <div key={`${student.id}-plan-${planIndex}-task-${taskIndex}`} className="grid grid-cols-12 items-center bg-white dark:bg-gray-700/50 px-6 py-3 rounded-lg">
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
                                        <span className={getDueDateStyle(task.endDate, task.status)}>
                                          <Clock size={14} className="mr-1" />
                                          {formatDate(task.endDate)}
                                        </span>
                                      </div>

                                      <div className="col-span-2 text-right">
                                        <span className={taskStyles.status[task.status]}>
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
                      </div>
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