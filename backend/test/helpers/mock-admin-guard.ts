import { CanActivate, ExecutionContext } from '@nestjs/common';

export const MOCK_ADMIN_USER = {
  sub: 'test-admin-uuid-00000000-0000-0000-0000-000000000000',
  email: 'test@admin.com',
  role: 'admin',
  jti: 'test-jti',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

export class MockAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = MOCK_ADMIN_USER;
    return true;
  }
}

export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = MOCK_ADMIN_USER;
    return true;
  }
}

export class MockJwtRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = MOCK_ADMIN_USER;
    return true;
  }
}
