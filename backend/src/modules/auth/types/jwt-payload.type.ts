export interface AdminJwtPayload {
  sub: string;
  role: 'admin';
  email: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface CustomerJwtPayload {
  sub: string;
  role: 'customer';
  phone: string;
  name: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export type JwtPayload = AdminJwtPayload | CustomerJwtPayload;
