export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'mentor' | 'parent' | 'admin';
  avatar?: string;
  email?: string;
  color?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
} 