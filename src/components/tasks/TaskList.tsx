import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronRight, AlertCircle, Clock } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  assignedBy?: string;
}

interface TaskListProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
  onTaskSelect?: (task: Task) => void;
  groupBy?: 'subject' | 'dueDate' | 'priority' | 'none';
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskToggle,
  onTaskSelect,
  groupBy = 'none'
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (group: string) => {
    if (expandedGroups.includes(group)) {
      setExpandedGroups(expandedGroups.filter(g => g !== group));
    } else {
      setExpandedGroups([...expandedGroups, group]);
    }
  };

  const getTasksByGroup = () => {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks };
    }

    return tasks.reduce((groups: Record<string, Task[]>, task) => {
      let groupKey: string;
      
      if (groupBy === 'subject') {
        groupKey = task.subject;
      } else if (groupBy === 'priority') {
        groupKey = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      } else if (groupBy === 'dueDate') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          groupKey = '已過期';
        } else if (diffDays === 0) {
          groupKey = '今天';
        } else if (diffDays === 1) {
          groupKey = '明天';
        } else if (diffDays < 7) {
          groupKey = '本週';
        } else {
          groupKey = '未來';
        }
      } else {
        groupKey = 'All Tasks';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(task);
      return groups;
    }, {});
  };

  const taskGroups = getTasksByGroup();
  const groupNames = Object.keys(taskGroups);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'medium':
        return <Clock size={16} className="text-orange-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return '已過期';
    } else if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '明天';
    } else {
      return new Intl.DateTimeFormat('zh-TW', { month: 'short', day: 'numeric' }).format(date);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {groupNames.map(group => {
        const isExpanded = expandedGroups.includes(group) || groupBy === 'none';
        const tasksInGroup = taskGroups[group];
        
        return (
          <div key={group} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            {groupBy !== 'none' && (
              <div 
                className="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-950 transition"
                onClick={() => toggleGroup(group)}
              >
                <div className="mr-2">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <h3 className="font-medium">{group}</h3>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({tasksInGroup.length})
                </span>
              </div>
            )}
            
            {isExpanded && (
              <ul>
                {tasksInGroup.map(task => (
                  <li 
                    key={task.id}
                    className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                    onClick={() => onTaskSelect && onTaskSelect(task)}
                  >
                    <div className="flex items-start">
                      <button
                        className="mt-0.5 mr-3 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskToggle(task.id);
                        }}
                      >
                        {task.completed ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center ml-2">
                            {getPriorityIcon(task.priority)}
                            <span className={`ml-1 text-xs ${
                              task.priority === 'high' 
                                ? 'text-red-500' 
                                : task.priority === 'medium' 
                                  ? 'text-orange-500' 
                                  : 'text-blue-500'
                            }`}>
                              {formatDueDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center mt-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {task.subject}
                          </span>
                          {task.assignedBy && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              由 {task.assignedBy} 指派
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                
                {tasksInGroup.length === 0 && (
                  <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    沒有任務
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;