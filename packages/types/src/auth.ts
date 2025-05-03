export interface User {
  id: string;
  name: string;
  role: 'student' | 'mentor';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
} 