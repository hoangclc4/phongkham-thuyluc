import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CustomersController } from '../src/modules/customers/customers.controller';
import { CustomersService } from '../src/modules/customers/customers.service';
import { AdminGuard } from '../src/modules/auth/guards/admin.guard';
import { createTestApp } from './helpers/create-test-app';
import { MockAdminGuard } from './helpers/mock-admin-guard';

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MISSING_UUID = 'b1ffcd00-0d1c-4ef8-bb6d-6bb9bd380a22';

describe('Customers (e2e)', () => {
  let app: NestFastifyApplication;
  let customersService: jest.Mocked<CustomersService>;

  const mockCustomer = {
    id: VALID_UUID,
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
  };

  beforeEach(async () => {
    const mockService = {
      list: jest.fn().mockResolvedValue({ data: [mockCustomer], total: 1, page: 1, limit: 20 }),
      create: jest.fn().mockResolvedValue(mockCustomer),
      getOne: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn().mockResolvedValue(mockCustomer),
      softDelete: jest.fn().mockResolvedValue(undefined),
      getCustomerPets: jest.fn().mockResolvedValue([]),
      getCustomerBookings: jest.fn().mockResolvedValue([]),
      getStats: jest.fn().mockResolvedValue({ totalBookings: 0, totalInvoices: 0 }),
      sendInvite: jest.fn().mockResolvedValue(undefined),
    };

    app = await createTestApp(
      Test.createTestingModule({
        controllers: [CustomersController],
        providers: [{ provide: CustomersService, useValue: mockService }],
      }).overrideGuard(AdminGuard).useClass(MockAdminGuard),
    );
    customersService = app.get(CustomersService) as jest.Mocked<CustomersService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /v1/admin/customers', () => {
    it('returns 200', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/customers' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /v1/admin/customers', () => {
    it('returns 201 with valid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/customers',
        payload: { fullName: 'Nguyễn Văn A', phone: '0901234567' },
      });
      expect(res.statusCode).toBe(201);
      expect(customersService.create).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when fullName missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/customers',
        payload: { phone: '0901234567' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when phone missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/customers',
        payload: { fullName: 'Nguyễn Văn A' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /v1/admin/customers/:id', () => {
    it('returns 200 when customer exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/customers/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 when customer not found', async () => {
      customersService.getOne.mockRejectedValue(new NotFoundException('Not found'));
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/customers/${MISSING_UUID}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /v1/admin/customers/:id', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/customers/${VALID_UUID}`,
        payload: { fullName: 'Nguyễn Văn B', phone: '0901234567' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /v1/admin/customers/:id', () => {
    it('returns 204', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/admin/customers/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('GET /v1/admin/customers/:id/pets', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/customers/${VALID_UUID}/pets`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /v1/admin/customers/:id/bookings', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/customers/${VALID_UUID}/bookings`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /v1/admin/customers/:id/stats', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/customers/${VALID_UUID}/stats`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /v1/admin/customers/:id/invite', () => {
    it('returns 204', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/customers/${VALID_UUID}/invite`,
      });
      expect(res.statusCode).toBe(204);
    });
  });
});
