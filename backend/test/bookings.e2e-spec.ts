import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { BookingsController } from '../src/modules/bookings/bookings.controller';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { AdminGuard } from '../src/modules/auth/guards/admin.guard';
import { createTestApp } from './helpers/create-test-app';
import { MockAdminGuard } from './helpers/mock-admin-guard';

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ANOTHER_UUID = 'b1ffcd00-0d1c-5fg9-cc7e-7cc0ce491b22';

describe('Bookings (e2e)', () => {
  let app: NestFastifyApplication;
  let bookingsService: jest.Mocked<BookingsService>;

  const mockBooking = {
    id: VALID_UUID,
    displayNumber: 'BKG-20241215-001',
    petId: VALID_UUID,
    customerId: VALID_UUID,
    serviceType: 'general_checkup',
    scheduledAt: '2024-12-15T09:00:00.000Z',
    status: 'pending',
  };

  beforeEach(async () => {
    const mockService = {
      list: jest.fn().mockResolvedValue({ data: [mockBooking], total: 1, page: 1, limit: 20 }),
      create: jest.fn().mockResolvedValue(mockBooking),
      getOne: jest.fn().mockResolvedValue(mockBooking),
      update: jest.fn().mockResolvedValue(mockBooking),
      updateStatus: jest.fn().mockResolvedValue(mockBooking),
      cancel: jest.fn().mockResolvedValue(undefined),
      getSlots: jest.fn().mockResolvedValue([]),
      getToday: jest.fn().mockResolvedValue([]),
      getUpcomingFollowups: jest.fn().mockResolvedValue([]),
    };

    app = await createTestApp(
      Test.createTestingModule({
        controllers: [BookingsController],
        providers: [{ provide: BookingsService, useValue: mockService }],
      }).overrideGuard(AdminGuard).useClass(MockAdminGuard),
    );
    bookingsService = app.get(BookingsService) as jest.Mocked<BookingsService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /v1/admin/bookings', () => {
    it('returns 200 with paginated data', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/bookings' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
    });
  });

  describe('GET /v1/admin/bookings/slots', () => {
    it('returns 200 with date query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/bookings/slots?date=2024-12-15',
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /v1/admin/bookings/today', () => {
    it('returns 200', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/bookings/today' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /v1/admin/bookings/upcoming-followups', () => {
    it('returns 200', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/bookings/upcoming-followups' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /v1/admin/bookings', () => {
    it('returns 201 with valid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/bookings',
        payload: {
          customerId: VALID_UUID,
          petId: VALID_UUID,
          serviceType: 'general_checkup',
          scheduledAt: '2024-12-15T09:00:00.000Z',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(bookingsService.create).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when customerId missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/bookings',
        payload: {
          petId: VALID_UUID,
          serviceType: 'general_checkup',
          scheduledAt: '2024-12-15T09:00:00.000Z',
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when petId missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/bookings',
        payload: {
          customerId: VALID_UUID,
          serviceType: 'general_checkup',
          scheduledAt: '2024-12-15T09:00:00.000Z',
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when serviceType is invalid enum', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/bookings',
        payload: {
          customerId: VALID_UUID,
          petId: VALID_UUID,
          serviceType: 'invalid_service',
          scheduledAt: '2024-12-15T09:00:00.000Z',
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when scheduledAt missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/bookings',
        payload: {
          customerId: VALID_UUID,
          petId: VALID_UUID,
          serviceType: 'general_checkup',
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /v1/admin/bookings/:id', () => {
    it('returns 200 when booking exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/bookings/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 when booking not found', async () => {
      bookingsService.getOne.mockRejectedValue(new NotFoundException('Not found'));
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/bookings/${ANOTHER_UUID}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /v1/admin/bookings/:id', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/bookings/${VALID_UUID}`,
        payload: { scheduledAt: '2024-12-16T10:00:00.000Z' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PATCH /v1/admin/bookings/:id/status', () => {
    it('returns 200 with valid status', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/bookings/${VALID_UUID}/status`,
        payload: { status: 'confirmed' },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 with invalid status', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/bookings/${VALID_UUID}/status`,
        payload: { status: 'invalid_status' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /v1/admin/bookings/:id', () => {
    it('returns 204', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/admin/bookings/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(204);
    });
  });
});
