import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  CalendarDays, BookOpen, CheckSquare, 
  LineChart, Users, BookMarked, 
  Menu, X, LogOut, Map, Calendar, ChevronLeft, ChevronRight, Target, Grid3X3, 
  PenTool
} from 'lucide-react';
import { useUser, UserRole } from '../../context/UserContext';
import { UserProfileDialog } from '../user-manager';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { currentUser, logout, isLoading } = useUser();
  const location = useLocation();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  // 根據當前路由決定顯示的導航項目
  const getNavigationItems = () => {
    const pathname = location.pathname;
    
    // 如果用戶資料還在載入或者沒有用戶，返回空的導航項目
    if (isLoading || !currentUser) {
      return {
        items: [],
        viewType: 'student'
      };
    }
    
    // 獲取用戶的所有角色（支援新舊格式）
    const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : ['student']);
    const hasRole = (role: string) => userRoles.includes(role as any);
    
    if (pathname.startsWith('/student')) {
      const studentItems = [
        { name: '時間表', path: '/student/schedule', icon: <CalendarDays size={20} /> },
        { name: '任務牆', path: '/student/task-wall', icon: <Grid3X3 size={20} /> },
        { name: '學習地圖', path: '/student/learning-map', icon: <Map size={20} /> },
        { name: '日誌', path: '/student/journal', icon: <PenTool size={20} /> },
      ];
      
      // 如果有導師身份，加入導師視圖
      if (hasRole('mentor')) {
        studentItems.push({ name: '導師視圖', path: '/mentor', icon: <Target size={20} /> });
      }
      
      // 如果有管理員身份，加入用戶管理
      if (hasRole('admin')) {
        studentItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={20} /> });
      }
      
      return {
        items: studentItems,
        viewType: 'student'
      };
    }
    
    if (pathname.startsWith('/admin')) {
      return {
        items: [
          { name: '用戶管理', path: '/admin/users', icon: <Users size={20} /> },
          { name: '學生視圖', path: '/student', icon: <BookOpen size={20} /> },
          { name: '導師視圖', path: '/mentor', icon: <Target size={20} /> },
        ],
        viewType: 'admin'
      };
    }
    
    if (pathname.startsWith('/mentor')) {
      const mentorItems = [
        { name: '儀表板', path: '/mentor', icon: <BookOpen size={20} /> },
        { name: '課程規劃', path: '/mentor/curriculum', icon: <Map size={20} /> },
        { name: '任務規劃', path: '/mentor/task-planner', icon: <Calendar size={20} /> },
        { name: '課程藍圖', path: '/mentor/course-blueprint', icon: <Target size={20} /> },
      ];
      
      // 如果有家長或學生身份，加入學生視圖
      if (hasRole('parent') || hasRole('student')) {
        mentorItems.push({ name: '學生視圖', path: '/student', icon: <BookOpen size={20} /> });
      }
      
      // 如果有管理員身份，加入用戶管理
      if (hasRole('admin')) {
        mentorItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={20} /> });
      }
      
      return {
        items: mentorItems,
        viewType: 'mentor'
      };
    }
    
    // 如果路由不匹配，根據用戶角色決定預設顯示
    const role = currentUser?.role;
    if (role === 'admin') {
      return {
        items: [
          { name: '用戶管理', path: '/admin/users', icon: <Users size={20} /> },
          { name: '學生視圖', path: '/student', icon: <BookOpen size={20} /> },
          { name: '導師視圖', path: '/mentor', icon: <Target size={20} /> },
        ],
        viewType: 'admin'
      };
    }
    
    if (role === 'mentor') {
      const mentorItems = [
        { name: '儀表板', path: '/mentor', icon: <BookOpen size={20} /> },
        { name: '課程規劃', path: '/mentor/curriculum', icon: <Map size={20} /> },
        { name: '任務規劃', path: '/mentor/task-planner', icon: <Calendar size={20} /> },
        { name: '課程藍圖', path: '/mentor/course-blueprint', icon: <Target size={20} /> },
      ];
      
      // 如果有家長或學生身份，加入學生視圖
      if (hasRole('parent') || hasRole('student')) {
        mentorItems.push({ name: '學生視圖', path: '/student', icon: <BookOpen size={20} /> });
      }
      
      // 如果有管理員身份，加入用戶管理
      if (hasRole('admin')) {
        mentorItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={20} /> });
      }
      
      return {
        items: mentorItems,
        viewType: 'mentor'
      };
    }
    
    // 預設為學生視圖 (student, parent, admin 都可以看)
    const studentItems = [
      { name: '時間表', path: '/student/schedule', icon: <CalendarDays size={20} /> },
      { name: '任務牆', path: '/student/task-wall', icon: <Grid3X3 size={20} /> },
      { name: '學習地圖', path: '/student/learning-map', icon: <Map size={20} /> },
      { name: '日誌', path: '/student/journal', icon: <PenTool size={20} /> },
    ];
    
    // 如果有導師身份，加入導師視圖
    if (hasRole('mentor')) {
      studentItems.push({ name: '導師視圖', path: '/mentor', icon: <Target size={20} /> });
    }
    
    // 如果有管理員身份，加入用戶管理
    if (hasRole('admin')) {
      studentItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={20} /> });
    }
    
    return {
      items: studentItems,
      viewType: 'student'
    };
  };

  const { items, viewType } = getNavigationItems();

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
                {viewType === 'student' ? '學生版' : 
                 viewType === 'mentor' ? '指導老師版' :
                 viewType === 'admin' ? '管理員版' : '學生版'}
              </p>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {isLoading ? (
                <li className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  載入中...
                </li>
              ) : items.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  {!currentUser ? '未登入' : '權限不足'}
                </li>
              ) : (
                items.map((item) => (
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
              ))
              )}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {/* 可點擊的頭像區域 */}
              {!isLoading && currentUser && (
                <button
                  onClick={() => setShowProfileDialog(true)}
                  className={`rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    isCollapsed ? 'w-full flex justify-center p-2' : 'flex items-center mr-3'
                  }`}
                  title={isCollapsed ? `編輯 ${currentUser.name} 的個人資料` : '編輯個人資料'}
                >
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: currentUser.color || '#FF6B6B' }}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              )}
              
              {!isCollapsed && !isLoading && currentUser && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {viewType === 'student' ? '學生' : 
                       viewType === 'mentor' ? '指導老師' :
                       viewType === 'admin' ? '管理員' : '學生'}
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
      
      {/* User Profile Dialog */}
      {!isLoading && currentUser && (
        <UserProfileDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          user={currentUser}
          isAdminMode={false}
        />
      )}
    </>
  );
};

export default Sidebar;