import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  CalendarDays, BookOpen, CheckSquare, 
  LineChart, Users, BookMarked, 
  Menu, X, LogOut, Map, ChevronLeft, ChevronRight, Target, Grid3X3, 
  PenTool, Zap, SplitSquareHorizontal, Sun, Moon, AlertTriangle, RotateCcw, BarChart3
} from 'lucide-react';
import { useUser, UserRole } from '../../context/UserContext';
import { UserProfileDialog } from '../user-manager';
import { ReportDialog } from '../shared';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  title: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, title }) => {
  const { currentUser, logout, isLoading } = useUser();
  const location = useLocation();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const reportIssue = () => {
    setShowReportDialog(true);
  };
  
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
        { name: '時間表', path: '/student/schedule', icon: <CalendarDays size={16} /> },
        { name: '任務牆', path: '/student/task-wall', icon: <Grid3X3 size={16} /> },
        { name: '獨立任務', path: '/student/independent-tasks', icon: <CheckSquare size={16} /> },
        { name: '學習地圖', path: '/student/learning-map', icon: <Map size={16} /> },
        { name: '日誌', path: '/student/journal', icon: <PenTool size={16} /> },
        { name: '個人回顧', path: '/student/retro', icon: <RotateCcw size={16} /> },
        { name: '小組討論', path: '/student/group-retro', icon: <Users size={16} /> },
        { name: '週進度報表', path: '/student/weekly-progress', icon: <BarChart3 size={16} /> },
        { name: '課堂格子表', path: '/student/class-grid', icon: <Grid3X3 size={16} /> },
      ];
      
      // 如果有導師身份，加入導師視圖
      if (hasRole('mentor')) {
        studentItems.push({ name: '導師視圖', path: '/mentor', icon: <Target size={16} /> });
      }
      
      // 如果有管理員身份，加入用戶管理
      if (hasRole('admin')) {
        studentItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={16} /> });
      }
      
      return {
        items: studentItems,
        viewType: 'student'
      };
    }
    
    if (pathname.startsWith('/admin')) {
      return {
        items: [
          { name: '用戶管理', path: '/admin/users', icon: <Users size={16} /> },
          { name: '學生視圖', path: '/student', icon: <BookOpen size={16} /> },
          { name: '導師視圖', path: '/mentor', icon: <Target size={16} /> },
        ],
        viewType: 'admin'
      };
    }
    
    if (pathname.startsWith('/mentor')) {
      const mentorItems = [
        { name: '儀表板', path: '/mentor', icon: <BookOpen size={16} /> },
        { name: '課程規劃', path: '/mentor/curriculum', icon: <Map size={16} /> },
      ];
      
      // 如果有家長或學生身份，加入學生視圖
      if (hasRole('parent') || hasRole('student')) {
        mentorItems.push({ name: '學生視圖', path: '/student', icon: <BookOpen size={16} /> });
      }
      
      // 如果有管理員身份，加入用戶管理
      if (hasRole('admin')) {
        mentorItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={16} /> });
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
          { name: '用戶管理', path: '/admin/users', icon: <Users size={16} /> },
          { name: '學生視圖', path: '/student', icon: <BookOpen size={16} /> },
          { name: '導師視圖', path: '/mentor', icon: <Target size={16} /> },
        ],
        viewType: 'admin'
      };
    }
    
    if (role === 'mentor') {
      const mentorItems = [
        { name: '儀表板', path: '/mentor', icon: <BookOpen size={16} /> },
        { name: '課程規劃', path: '/mentor/curriculum', icon: <Map size={16} /> },
      ];
      
      // 如果有家長或學生身份，加入學生視圖
      if (hasRole('parent') || hasRole('student')) {
        mentorItems.push({ name: '學生視圖', path: '/student', icon: <BookOpen size={16} /> });
      }
      
      // 如果有管理員身份，加入用戶管理
      if (hasRole('admin')) {
        mentorItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={16} /> });
      }
      
      return {
        items: mentorItems,
        viewType: 'mentor'
      };
    }
    
    // 預設為學生視圖 (student, parent, admin 都可以看)
    const studentItems = [
      { name: '時間表', path: '/student/schedule', icon: <CalendarDays size={16} /> },
      { name: '任務牆', path: '/student/task-wall', icon: <Grid3X3 size={16} /> },
      { name: '獨立任務', path: '/student/independent-tasks', icon: <CheckSquare size={16} /> },
      { name: '學習地圖', path: '/student/learning-map', icon: <Map size={16} /> },
      { name: '日誌', path: '/student/journal', icon: <PenTool size={16} /> },
      { name: '個人回顧', path: '/student/retro', icon: <RotateCcw size={16} /> },
      { name: '小組討論', path: '/student/group-retro', icon: <Users size={16} /> },
    ];
    
    // 如果有導師身份，加入導師視圖
    if (hasRole('mentor')) {
      studentItems.push({ name: '導師視圖', path: '/mentor', icon: <Target size={16} /> });
    }
    
    // 如果有管理員身份，加入用戶管理
    if (hasRole('admin')) {
      studentItems.push({ name: '用戶管理', path: '/admin/users', icon: <Users size={16} /> });
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
        className="fixed top-3 left-3 z-30 lg:hidden bg-gradient-to-r from-orange-400 to-pink-400 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed lg:relative bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'w-20' : 'w-64'
        } h-full z-30 shadow-2xl border-r-2 border-orange-200 dark:border-purple-500`}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>

        <div className="flex flex-col h-full">
          {/* Logo and brand with page title */}
          <div className="p-4 border-b-2 border-orange-200 dark:border-purple-500 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-gray-700 dark:to-gray-800">
            {isCollapsed ? (
              // 壓縮模式：顯示用戶頭像
              !isLoading && currentUser && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowProfileDialog(true)}
                    className="rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 p-1"
                    title={`編輯 ${currentUser.name} 的個人資料`}
                  >
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-orange-300 dark:border-purple-400 shadow-lg"
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-orange-300 dark:border-purple-400 shadow-lg"
                        style={{ backgroundColor: currentUser.color || '#FF6B6B' }}
                      >
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                </div>
              )
            ) : (
              // 展開模式：顯示完整資訊
              <>
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent truncate">
                  🎓 學習追蹤
                </h1>
                <p className="text-xs text-orange-600 dark:text-purple-300 mt-1">
                  {viewType === 'student' ? '🌟 學生版' : 
                   viewType === 'mentor' ? '👨‍🏫 導師版' :
                   viewType === 'admin' ? '🛠️ 管理版' : '🌟 學生版'}
                </p>
                <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {title}
                  </h2>
                </div>
              </>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {isLoading ? (
                <li className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg">
                  載入中...
                </li>
              ) : items.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg">
                  {!currentUser ? '未登入' : '權限不足'}
                </li>
              ) : (
                items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ${
                        isActive && item.path === window.location.pathname
                          ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg font-medium' 
                          : 'text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800 bg-white/50 dark:bg-gray-800/50 hover:shadow-md'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={`${isCollapsed ? 'mx-auto' : 'mr-2'}`}>{item.icon}</span>
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </NavLink>
                </li>
              ))
              )}
            </ul>
          </nav>

          {/* Control buttons */}
          <div className="px-2 py-2 border-t-2 border-orange-200 dark:border-purple-500">
            <div className={`flex gap-1 ${isCollapsed ? 'flex-col' : 'flex-row'}`}>
              <button 
                className={`${isCollapsed ? 'p-2 flex justify-center' : 'flex-1 px-3 py-1.5'} bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm font-medium`}
                onClick={toggleDarkMode}
                title={darkMode ? '切換到淺色模式' : '切換到深色模式'}
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                {!isCollapsed && <span className="ml-1">{darkMode ? '淺色' : '深色'}</span>}
              </button>
              <button
                className={`${isCollapsed ? 'p-2 flex justify-center' : 'flex-1 px-3 py-1.5'} bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm font-medium`}
                onClick={reportIssue}
                title="回報問題"
              >
                <AlertTriangle size={14} />
                {!isCollapsed && <span className="ml-1">回報</span>}
              </button>
            </div>
          </div>

          {/* User profile and logout */}
          <div className="p-3 border-t-2 border-orange-200 dark:border-purple-500 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-gray-700 dark:to-gray-800">
            {isCollapsed ? (
              // 壓縮模式：只顯示登出按鈕
              !isLoading && currentUser && (
                <div className="flex justify-center">
                  <button 
                    onClick={logout}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110"
                    title="登出"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )
            ) : (
              // 展開模式：顯示完整用戶資訊
              <div className="flex items-center">
                {!isLoading && currentUser && (
                  <>
                    <button
                      onClick={() => setShowProfileDialog(true)}
                      className="flex items-center mr-2 p-1 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
                      title="編輯個人資料"
                    >
                      {currentUser.avatar ? (
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-orange-300 dark:border-purple-400 shadow-lg"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-orange-300 dark:border-purple-400 shadow-lg"
                          style={{ backgroundColor: currentUser.color || '#FF6B6B' }}
                        >
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-purple-300 truncate">
                        {viewType === 'student' ? '🌟 學生' : 
                         viewType === 'mentor' ? '👨‍🏫 導師' :
                         viewType === 'admin' ? '🛠️ 管理' : '🌟 學生'}
                      </p>
                    </div>
                    <button 
                      onClick={logout}
                      className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110"
                      title="登出"
                    >
                      <LogOut size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
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
      
      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
      />
    </>
  );
};

export default Sidebar;