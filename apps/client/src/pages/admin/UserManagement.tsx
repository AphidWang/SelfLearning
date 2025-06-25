import React from 'react';
import { UserManager } from '../../components/user-manager';

export const UserManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <UserManager />
      </div>
    </div>
  );
}; 