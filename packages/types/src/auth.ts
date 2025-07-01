export interface User {
  id: string;
  name: string;
  roles: ('student' | 'teacher' | 'mentor' | 'parent' | 'admin')[];
  avatar?: string;
  email?: string;
  color?: string;
  
  // 新增：用戶狀態相關欄位
  banned_until?: string | null;
  is_banned?: boolean;
  
  /** @deprecated 請使用 roles 陣列，此欄位僅為向後兼容 */
  role?: 'student' | 'teacher' | 'mentor' | 'parent' | 'admin';
}

export interface TopicCollaborator {
  id: string;
  name: string;
  roles: ('student' | 'teacher' | 'mentor' | 'parent' | 'admin')[];
  avatar?: string;
  email?: string;
  color?: string;
  role?: 'student' | 'teacher' | 'mentor' | 'parent' | 'admin';
  permission: 'view' | 'edit';
}

export interface TemplateCollaborator {
  id: string;
  name: string;
  roles: ('student' | 'teacher' | 'mentor' | 'parent' | 'admin')[];
  avatar?: string;
  email?: string;
  color?: string;
  role?: 'student' | 'teacher' | 'mentor' | 'parent' | 'admin';
  permission: 'view' | 'edit' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
} 