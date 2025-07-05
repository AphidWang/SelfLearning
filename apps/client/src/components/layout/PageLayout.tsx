import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 移除認證檢查，因為路由層已經有 RoleProtectedRoute 保護

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <div className="flex-1 flex flex-col">
        <Header title={title} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;