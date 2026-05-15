export type UserRole = 'admin' | 'customer';

export interface AdminUser {
  sub: string;
  role: 'admin';
  email: string;
}

export interface CustomerUser {
  sub: string;
  role: 'customer';
  phone: string;
  name: string;
}

export type AuthUser = AdminUser | CustomerUser;

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
