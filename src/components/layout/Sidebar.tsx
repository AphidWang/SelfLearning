import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  CalendarDays, BookOpen, CheckSquare, 
  LineChart, ListTodo, Users, BookMarked, 
  Menu, X, LogOut 
} from 'lucide-react';
import { useUser, UserRole } from '../../contexts/UserContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser, logout } = useUser();
  const role = currentUser?.role as UserRole;

  const sidebarItems = {
    student: [
      { name: '儀表板', path: '/student', icon: <BookOpen size={20} /> },
      { name: '課表', path: '/student/schedule', icon: <CalendarDays size={20} /> },
      { name: '任務', path: '/student/tasks', icon: <CheckSquare size={20} /> },
      { name: '學習日誌', path: '/student/journal', icon: <BookMarked size={20} /> },
      { name: '目標與進度', path: '/student/goals', icon: <LineChart size={20} /> },
    ],
    mentor: [
      { name: '儀表板', path: '/mentor', icon: <BookOpen size={20} /> },
      { name: '任務管理', path: '/mentor/tasks', icon: <ListTodo size={20} /> },
    ]
  };

  const items = role ? sidebarItems[role] : [];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-30 lg:hidden bg-indigo-600 text-white p-2 rounded-md"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 bg-white dark:bg-gray-900 w-64 z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:translate-x-0 lg:z-0 shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and brand */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">學習進度追蹤</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {role === 'student' ? '學生版' : '指導老師版'}
            </p>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-2.5 text-sm rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {currentUser?.avatar && (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {role === 'student' ? '學生' : '指導老師'}
                </p>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="登出"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;