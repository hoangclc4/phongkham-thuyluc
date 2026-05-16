import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CanActivate } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { AdminGuard } from '../src/modules/auth/guards/admin.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../src/modules/auth/guards/jwt-refresh.guard';
import { createTestApp } from './helpers/create-test-app';
import {
  MockAdminGuard,
  MockJwtAuthGuard,
  MockJwtRefreshGuard,
} from './helpers/mock-admin-guard';

class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;
  let authService: jest.Mocked<AuthService>;

  const mockAdminLoginResult = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    admin: { id: 'uuid', email: 'bs@phongkham.com', fullName: 'Bác sĩ Lục' },
  };

  beforeEach(async () => {
    const mockService = {
      loginAdmin: jest.fn().mockResolvedValue(mockAdminLoginResult),
      loginCustomer: jest.fn(),
      refresh: jest.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        refreshExpiresAtSeconds: 3600,
      }),
      logout: jest.fn().mockResolvedValue(undefined),
      forgotPassword: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      inviteCustomer: jest.fn().mockResolvedValue(undefined),
      setPassword: jest.fn(),
    };

    app = await createTestApp(
      Test.createTestingModule({
        controllers: [AuthController],
        providers: [{ provide: AuthService, useValue: mockService }],
      })
        .overrideGuard(ThrottlerGuard).useClass(MockThrottlerGuard)
        .overrideGuard(AdminGuard).useClass(MockAdminGuard)
        .overrideGuard(JwtAuthGuard).useClass(MockJwtAuthGuard)
        .overrideGuard(JwtRefreshGuard).useClass(MockJwtRefreshGuard),
    );
    authService = app.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/auth/admin/login', () => {
    it('returns 200 with accessToken when credentials valid', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/admin/login',
        payload: { email: 'bs@phongkham.com', password: 'password123' },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toHaveProperty('accessToken');
      expect(authService.loginAdmin).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when email missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/admin/login',
        payload: { password: 'password123' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when password missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/admin/login',
        payload: { email: 'bs@phongkham.com' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('returns 200 with new accessToken', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toHaveProperty('accessToken');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('returns 200 with success message', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/logout',
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toHaveProperty('message');
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    it('returns 200 when phone provided', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/forgot-password',
        payload: { phone: '0901234567' },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 when phone missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/forgot-password',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /v1/auth/customer/invite', () => {
    it('returns 200 when customerId valid UUID', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/customer/invite',
        payload: { customerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 when customerId not UUID', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/customer/invite',
        payload: { customerId: 'not-a-uuid' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
