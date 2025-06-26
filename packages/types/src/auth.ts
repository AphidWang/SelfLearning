export interface User {
  id: string;
  name: string;
  roles: ('student' | 'teacher' | 'mentor' | 'parent' | 'admin')[];
  avatar?: string;
  email?: string;
  color?: string;
  
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