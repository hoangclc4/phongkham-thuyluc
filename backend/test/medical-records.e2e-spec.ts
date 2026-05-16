import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MedicalRecordsController } from '../src/modules/medical-records/medical-records.controller';
import { MedicalRecordsService } from '../src/modules/medical-records/medical-records.service';
import { AdminGuard } from '../src/modules/auth/guards/admin.guard';
import { createTestApp } from './helpers/create-test-app';
import { MockAdminGuard } from './helpers/mock-admin-guard';

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MISSING_UUID = 'b1ffcd00-0d1c-4ef8-bb6d-6bb9bd380a22';
const ATTACHMENT_UUID = 'c2ggde11-1e2d-5fg0-dd8f-8dd1df502c33';

describe('MedicalRecords (e2e)', () => {
  let app: NestFastifyApplication;
  let medicalRecordsService: jest.Mocked<MedicalRecordsService>;

  const mockRecord = {
    id: VALID_UUID,
    petId: VALID_UUID,
    visitDate: '2024-12-15',
    chiefComplaint: 'Bé bỏ ăn',
    displayNumber: 'MED-20241215-001',
  };

  beforeEach(async () => {
    const mockService = {
      list: jest.fn().mockResolvedValue({ data: [mockRecord], total: 1, page: 1, limit: 20 }),
      create: jest.fn().mockResolvedValue(mockRecord),
      getOne: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
      addAttachment: jest.fn().mockResolvedValue({ url: 'https://r2.example.com/file.pdf' }),
      deleteAttachment: jest.fn().mockResolvedValue({ deleted: true }),
      updateSharing: jest.fn().mockResolvedValue({ ...mockRecord, isSharedWithCustomer: true }),
    };

    app = await createTestApp(
      Test.createTestingModule({
        controllers: [MedicalRecordsController],
        providers: [{ provide: MedicalRecordsService, useValue: mockService }],
      }).overrideGuard(AdminGuard).useClass(MockAdminGuard),
    );
    medicalRecordsService = app.get(MedicalRecordsService) as jest.Mocked<MedicalRecordsService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /v1/admin/medical-records', () => {
    it('returns 200', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/medical-records' });
      expect(res.statusCode).toBe(200);
    });

    it('returns 200 when filtering by petId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/medical-records?petId=${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 200 when filtering by requiresAttention', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/medical-records?requiresAttention=true',
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /v1/admin/medical-records', () => {
    it('returns 201 with valid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/medical-records',
        payload: {
          petId: VALID_UUID,
          visitDate: '2024-12-15',
          chiefComplaint: 'Bé bỏ ăn',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(medicalRecordsService.create).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when petId missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/medical-records',
        payload: { visitDate: '2024-12-15', chiefComplaint: 'Bé bỏ ăn' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when visitDate missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/medical-records',
        payload: { petId: VALID_UUID, chiefComplaint: 'Bé bỏ ăn' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when chiefComplaint missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/medical-records',
        payload: { petId: VALID_UUID, visitDate: '2024-12-15' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /v1/admin/medical-records/:id', () => {
    it('returns 200 when record exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/medical-records/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 when record not found', async () => {
      medicalRecordsService.getOne.mockRejectedValue(new NotFoundException('Not found'));
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/medical-records/${MISSING_UUID}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /v1/admin/medical-records/:id', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/medical-records/${VALID_UUID}`,
        payload: { chiefComplaint: 'Updated complaint' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PATCH /v1/admin/medical-records/:id', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/medical-records/${VALID_UUID}`,
        payload: { diagnosis: 'Viêm dạ dày' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /v1/admin/medical-records/:id/attachments/:attachmentId', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/admin/medical-records/${VALID_UUID}/attachments/${ATTACHMENT_UUID}`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PATCH /v1/admin/medical-records/:id/sharing', () => {
    it('returns 200 with valid isSharedWithCustomer', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/medical-records/${VALID_UUID}/sharing`,
        payload: { isSharedWithCustomer: true },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 when isSharedWithCustomer is not boolean', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/medical-records/${VALID_UUID}/sharing`,
        payload: { isSharedWithCustomer: 'yes' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
