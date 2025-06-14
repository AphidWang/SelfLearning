import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  CalendarDays, BookOpen, CheckSquare, 
  LineChart, ListTodo, Users, BookMarked, 
  Menu, X, LogOut, Map, Calendar, ChevronLeft, ChevronRight, Target 
} from 'lucide-react';
import { useUser, UserRole } from '../../context/UserContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { currentUser, logout } = useUser();
  const role = currentUser?.role as 'student' | 'mentor' | undefined;

  const sidebarItems = {
    student: [
      { name: '時間表', path: '/student/schedule', icon: <CalendarDays size={20} /> },
      { name: '儀表板', path: '/student', icon: <BookOpen size={20} /> },
      { name: '學習規劃', path: '/student/planning', icon: <Target size={20} /> },
      { name: '學習地圖', path: '/student/learning-map', icon: <Map size={20} /> },
      { name: '學習日誌', path: '/student/journal', icon: <BookMarked size={20} /> },
    ],
    mentor: [
      { name: '儀表板', path: '/mentor', icon: <BookOpen size={20} /> },
      { name: '任務管理', path: '/mentor/tasks', icon: <ListTodo size={20} /> },
      { name: '課程規劃', path: '/mentor/curriculum', icon: <Map size={20} /> },
      { name: '任務規劃', path: '/mentor/task-planner', icon: <Calendar size={20} /> },
      { name: '課程藍圖', path: '/mentor/course-blueprint', icon: <Target size={20} /> },
    ]
  };

  const items = role ? sidebarItems[role] : [];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

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
        className={`fixed lg:relative bg-white dark:bg-gray-900 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'w-16' : 'w-64'
        } h-full z-30 shadow-lg`}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-indigo-600 text-white items-center justify-center rounded-full shadow-lg hover:bg-indigo-700"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex flex-col h-full">
          {/* Logo and brand */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className={`text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate ${
              isCollapsed ? 'text-center' : ''
            }`}>
              {isCollapsed ? '學習' : '學習進度追蹤'}
            </h1>
            {!isCollapsed && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {role === 'student' ? '學生版' : '指導老師版'}
              </p>
            )}
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
                        isActive && item.path === window.location.pathname
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={isCollapsed ? 'mx-auto' : 'mr-3'}>{item.icon}</span>
                    {!isCollapsed && item.name}
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
                  className={`w-10 h-10 rounded-full object-cover ${
                    isCollapsed ? 'mx-auto' : 'mr-3'
                  }`}
                />
              )}
              {!isCollapsed && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;