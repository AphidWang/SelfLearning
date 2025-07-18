import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Users, Database, AlertTriangle } from 'lucide-react';
import { UserManager } from '../../components/user-manager';
import { useUserStore } from '../../store/userStore';
import PageLayout from '../../components/layout/PageLayout';

export const UserAdminPage: React.FC = () => {
  const { users, loading, error, getUsers, clearError } = useUserStore();
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    mentors: 0,
    parents: 0,
    admins: 0
  });

  useEffect(() => {
    // 載入用戶資料
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    // 計算統計數據，支援多角色
    const newStats = {
      total: users.length,
      students: users.filter(u => {
        const userRoles = u.roles || (u.role ? [u.role] : []);
        return userRoles.includes('student');
      }).length,
      mentors: users.filter(u => {
        const userRoles = u.roles || (u.role ? [u.role] : []);
        return userRoles.includes('mentor');
      }).length,
      parents: users.filter(u => {
        const userRoles = u.roles || (u.role ? [u.role] : []);
        return userRoles.includes('parent');
      }).length,
      admins: users.filter(u => {
        const userRoles = u.roles || (u.role ? [u.role] : []);
        return userRoles.includes('admin');
      }).length
    };
    setStats(newStats);
  }, [users]);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon, color, bgColor }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900' : 
                                       color.includes('green') ? 'bg-green-100 dark:bg-green-900' :
                                       color.includes('purple') ? 'bg-purple-100 dark:bg-purple-900' :
                                       color.includes('pink') ? 'bg-pink-100 dark:bg-pink-900' :
                                       color.includes('yellow') ? 'bg-yellow-100 dark:bg-yellow-900' :
                                       'bg-gray-100 dark:bg-gray-700'}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <PageLayout title="用戶管理中心">
      <div className="space-y-6">
        {/* 錯誤提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* 頁面標題和狀態 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                用戶管理中心
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                管理系統中的所有用戶帳號
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {loading ? '同步中...' : '已同步'}
            </span>
          </div>
        </div>

        {/* 統計數據 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="總用戶數"
            value={stats.total}
            icon={<Users className="w-5 h-5" />}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="學生"
            value={stats.students}
            icon={<Users className="w-5 h-5" />}
            color="text-green-600 dark:text-green-400"
            bgColor="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="導師"
            value={stats.mentors}
            icon={<Users className="w-5 h-5" />}
            color="text-indigo-600 dark:text-indigo-400"
            bgColor="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="家長"
            value={stats.parents}
            icon={<Users className="w-5 h-5" />}
            color="text-pink-600 dark:text-pink-400"
            bgColor="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="管理員"
            value={stats.admins}
            icon={<Shield className="w-5 h-5" />}
            color="text-yellow-600 dark:text-yellow-400"
            bgColor="bg-white dark:bg-gray-800"
          />
        </div>

        {/* 用戶管理器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                用戶管理
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              新增、編輯、刪除用戶，以及管理用戶權限和資訊
            </p>
          </div>
          
          <div className="p-6">
            <UserManager />
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}; 