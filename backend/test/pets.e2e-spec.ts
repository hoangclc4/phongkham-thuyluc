import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PetsController } from '../src/modules/pets/pets.controller';
import { PetsService } from '../src/modules/pets/pets.service';
import { StorageService } from '../src/common/services/storage.service';
import { AdminGuard } from '../src/modules/auth/guards/admin.guard';
import { createTestApp } from './helpers/create-test-app';
import { MockAdminGuard } from './helpers/mock-admin-guard';

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MISSING_UUID = 'b1ffcd00-0d1c-4ef8-bb6d-6bb9bd380a22';

describe('Pets (e2e)', () => {
  let app: NestFastifyApplication;
  let petsService: jest.Mocked<PetsService>;

  const mockPet = {
    id: VALID_UUID,
    name: 'Mochi',
    species: 'dog',
    customerId: VALID_UUID,
  };

  const mockVaccine = {
    id: VALID_UUID,
    petId: VALID_UUID,
    vaccineName: 'Rabies',
    administeredAt: '2024-12-15',
  };

  beforeEach(async () => {
    const mockPetsService = {
      list: jest.fn().mockResolvedValue({ data: [mockPet], total: 1, page: 1, limit: 20 }),
      create: jest.fn().mockResolvedValue(mockPet),
      getOne: jest.fn().mockResolvedValue(mockPet),
      update: jest.fn().mockResolvedValue(mockPet),
      softDelete: jest.fn().mockResolvedValue(undefined),
      getMedicalRecords: jest.fn().mockResolvedValue([]),
      getVaccines: jest.fn().mockResolvedValue([mockVaccine]),
      addVaccine: jest.fn().mockResolvedValue(mockVaccine),
      updateAvatar: jest.fn().mockResolvedValue({ ...mockPet, avatarUrl: 'https://r2.example.com/test.jpg' }),
    };

    const mockStorageService = {
      uploadFile: jest.fn().mockResolvedValue('https://r2.example.com/test.jpg'),
    };

    app = await createTestApp(
      Test.createTestingModule({
        controllers: [PetsController],
        providers: [
          { provide: PetsService, useValue: mockPetsService },
          { provide: StorageService, useValue: mockStorageService },
        ],
      }).overrideGuard(AdminGuard).useClass(MockAdminGuard),
    );
    petsService = app.get(PetsService) as jest.Mocked<PetsService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /v1/admin/pets', () => {
    it('returns 200', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/pets' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /v1/admin/pets', () => {
    it('returns 201 with valid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/pets',
        payload: {
          customerId: VALID_UUID,
          name: 'Mochi',
          species: 'dog',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(petsService.create).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when customerId missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/pets',
        payload: { name: 'Mochi', species: 'dog' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when name missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/pets',
        payload: { customerId: VALID_UUID, species: 'dog' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when species is invalid enum', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/pets',
        payload: { customerId: VALID_UUID, name: 'Mochi', species: 'dragon' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /v1/admin/pets/:id', () => {
    it('returns 200 when pet exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/pets/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 when pet not found', async () => {
      petsService.getOne.mockRejectedValue(new NotFoundException('Not found'));
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/pets/${MISSING_UUID}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /v1/admin/pets/:id', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/pets/${VALID_UUID}`,
        payload: { name: 'Mochi Updated' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /v1/admin/pets/:id', () => {
    it('returns 204', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/admin/pets/${VALID_UUID}`,
      });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('GET /v1/admin/pets/:id/medical-records', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/pets/${VALID_UUID}/medical-records`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /v1/admin/pets/:id/vaccines', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/pets/${VALID_UUID}/vaccines`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /v1/admin/pets/:id/vaccines', () => {
    it('returns 201 with valid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/pets/${VALID_UUID}/vaccines`,
        payload: {
          vaccineName: 'Rabies',
          administeredAt: '2024-12-15',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(petsService.addVaccine).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when vaccineName missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/pets/${VALID_UUID}/vaccines`,
        payload: { administeredAt: '2024-12-15' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when administeredAt missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/pets/${VALID_UUID}/vaccines`,
        payload: { vaccineName: 'Rabies' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
