import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface HeaderProps {
  title: string;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { currentUser } = useUser();
  const [darkMode, setDarkMode] = React.useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 lg:px-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="hidden sm:flex items-center">
          {currentUser?.avatar && (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentUser?.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;