import React from 'react';
import { Link } from 'react-router-dom';
import { Home, BookOpen } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const NotFound: React.FC = () => {
  const { currentUser } = useUser();
  const homeLink = currentUser?.role === 'student' ? '/student' : '/mentor';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mx-auto flex items-center justify-center mb-6">
          <BookOpen size={40} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">頁面未找到</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          抱歉，您要尋找的頁面不存在或已被移除。
        </p>
        
        <Link
          to={homeLink}
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Home size={20} className="mr-2" />
          返回首頁
        </Link>
      </div>
    </div>
  );
};

export default NotFound;