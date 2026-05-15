import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, desc, eq, gt, ilike, isNull, or, sql } from 'drizzle-orm';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { pets } from '../../database/schema/pets.schema';
import { customers } from '../../database/schema/customers.schema';
import { bookings } from '../../database/schema/bookings.schema';
import { medicalRecords } from '../../database/schema/medical-records.schema';
import { vaccines } from '../../database/schema/vaccines.schema';
import {
  GENDER_LABELS,
  PET_STATUS_LABELS,
  PetGenderValue,
  PetSpeciesValue,
  PetStatusValue,
  SPECIES_LABELS,
  VALID_PET_STATUS_TRANSITIONS,
} from './constants/pet.constants';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ListPetsDto } from './dto/list-pets.dto';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import {
  MedicalRecordSummary,
  PetListResponse,
  PetResponse,
  UpcomingAppointment,
  VaccineResponse,
} from './types/pet-response.type';

interface PetJoinRow {
  id: string;
  customerId: string;
  ownerPhone: string;
  ownerName: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string;
  dateOfBirth: string | null;
  weightKg: string | null;
  color: string | null;
  avatarUrl: string | null;
  status: string;
  knownAllergies: string[] | null;
  isNeutered: boolean | null;
  microchipId: string | null;
  notes: string | null;
  createdAt: Date;
  lastVisitAt: Date | null;
}

@Injectable()
export class PetsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private calculateAgeDisplay(dateOfBirth: string | null): string | null {
    if (!dateOfBirth) return null;

    const birth = new Date(dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0) return `${months} tháng`;
    if (months === 0) return `${years} tuổi`;
    return `${years} tuổi ${months} tháng`;
  }

  private mapToResponse(
    row: PetJoinRow,
    upcomingAppointment: UpcomingAppointment | null = null,
  ): PetResponse {
    return {
      id: row.id,
      customerId: row.customerId,
      ownerPhone: row.ownerPhone,
      ownerName: row.ownerName,
      name: row.name,
      species: row.species,
      speciesLabel: SPECIES_LABELS[row.species as PetSpeciesValue] ?? row.species,
      breed: row.breed,
      gender: row.gender,
      genderLabel: GENDER_LABELS[row.gender as PetGenderValue] ?? row.gender,
      dateOfBirth: row.dateOfBirth,
      ageDisplay: this.calculateAgeDisplay(row.dateOfBirth),
      weightKg: row.weightKg,
      color: row.color,
      avatarUrl: row.avatarUrl,
      status: row.status,
      statusLabel: PET_STATUS_LABELS[row.status as PetStatusValue] ?? row.status,
      knownAllergies: row.knownAllergies,
      isNeutered: row.isNeutered ?? false,
      microchipId: row.microchipId,
      notes: row.notes,
      lastVisitDate: row.lastVisitAt ? row.lastVisitAt.toISOString().split('T')[0] : null,
      upcomingAppointment,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private buildJoinSelect() {
    return {
      id: pets.id,
      customerId: pets.customerId,
      ownerPhone: customers.phone,
      ownerName: customers.fullName,
      name: pets.name,
      species: pets.species,
      breed: pets.breed,
      gender: pets.gender,
      dateOfBirth: pets.dateOfBirth,
      weightKg: pets.weightKg,
      color: pets.color,
      avatarUrl: pets.avatarUrl,
      status: pets.status,
      knownAllergies: pets.knownAllergies,
      isNeutered: pets.isNeutered,
      microchipId: pets.microchipId,
      notes: pets.notes,
      createdAt: pets.createdAt,
      lastVisitAt: sql<Date | null>`MAX(CASE WHEN ${bookings.status} = 'completed' THEN ${bookings.scheduledAt} END)`,
    } as const;
  }

  async list(dto: ListPetsDto): Promise<PetListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [isNull(pets.deletedAt)];

    if (dto.search) {
      const searchCond = or(
        ilike(pets.name, `%${dto.search}%`),
        ilike(customers.fullName, `%${dto.search}%`),
        ilike(customers.phone, `%${dto.search}%`),
      );
      if (searchCond) conditions.push(searchCond);
    }

    if (dto.customerId) {
      conditions.push(eq(pets.customerId, dto.customerId));
    }

    if (dto.species) {
      conditions.push(eq(pets.species, dto.species as PetSpeciesValue));
    }

    if (dto.status) {
      conditions.push(eq(pets.status, dto.status as PetStatusValue));
    }

    const whereClause = and(...conditions);

    const [rows, countRows] = await Promise.all([
      this.db
        .select(this.buildJoinSelect())
        .from(pets)
        .innerJoin(customers, eq(customers.id, pets.customerId))
        .leftJoin(bookings, eq(bookings.petId, pets.id))
        .where(whereClause)
        .groupBy(pets.id, customers.id)
        .orderBy(desc(pets.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: sql<number>`COUNT(DISTINCT ${pets.id})::int` })
        .from(pets)
        .innerJoin(customers, eq(customers.id, pets.customerId))
        .where(whereClause),
    ]);

    const total = countRows[0]?.total ?? 0;

    return {
      data: rows.map((r) => this.mapToResponse(r as PetJoinRow)),
      total,
      page,
      limit,
    };
  }

  async getOne(id: string): Promise<PetResponse> {
    const rows = await this.db
      .select(this.buildJoinSelect())
      .from(pets)
      .innerJoin(customers, eq(customers.id, pets.customerId))
      .leftJoin(bookings, eq(bookings.petId, pets.id))
      .where(and(eq(pets.id, id), isNull(pets.deletedAt)))
      .groupBy(pets.id, customers.id);

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }

    const upcomingAppointment = await this.getUpcomingAppointment(id);

    return this.mapToResponse(rows[0] as PetJoinRow, upcomingAppointment);
  }

  private async getUpcomingAppointment(petId: string): Promise<UpcomingAppointment | null> {
    const now = new Date();

    const rows = await this.db
      .select({
        id: bookings.id,
        displayNumber: bookings.displayNumber,
        scheduledAt: bookings.scheduledAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.petId, petId),
          gt(bookings.scheduledAt, now),
          or(eq(bookings.status, 'pending'), eq(bookings.status, 'confirmed')),
        ),
      )
      .orderBy(asc(bookings.scheduledAt))
      .limit(1);

    if (!rows[0]) return null;

    return {
      id: rows[0].id,
      displayNumber: rows[0].displayNumber,
      scheduledAt: rows[0].scheduledAt.toISOString(),
    };
  }

  async create(dto: CreatePetDto): Promise<PetResponse> {
    const customerRows = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, dto.customerId), isNull(customers.deletedAt)));

    if (!customerRows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const insertValues: typeof pets.$inferInsert = {
      customerId: dto.customerId,
      name: dto.name,
      species: dto.species as PetSpeciesValue,
      breed: dto.breed,
      gender: (dto.gender as PetGenderValue | undefined) ?? 'unknown',
      dateOfBirth: dto.dateOfBirth,
      color: dto.color,
      weightKg: dto.weightKg,
      knownAllergies: dto.knownAllergies,
      isNeutered: dto.isNeutered ?? false,
      microchipId: dto.microchipId,
      notes: dto.notes,
    };

    const [inserted] = await this.db
      .insert(pets)
      .values(insertValues)
      .returning({ id: pets.id });

    return this.getOne(inserted.id);
  }

  async update(id: string, dto: UpdatePetDto): Promise<PetResponse> {
    const petRows = await this.db
      .select({ id: pets.id, status: pets.status })
      .from(pets)
      .where(and(eq(pets.id, id), isNull(pets.deletedAt)));

    if (!petRows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }

    if (dto.status && dto.status !== petRows[0].status) {
      const currentStatus = petRows[0].status as PetStatusValue;
      const newStatus = dto.status as PetStatusValue;
      const validTransitions = VALID_PET_STATUS_TRANSITIONS[currentStatus];

      if (!validTransitions.includes(newStatus)) {
        throw new BadRequestException(
          `Không thể chuyển từ "${PET_STATUS_LABELS[currentStatus]}" sang "${PET_STATUS_LABELS[newStatus]}"`,
        );
      }
    }

    const updateFields: Partial<typeof pets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.species !== undefined) updateFields.species = dto.species as PetSpeciesValue;
    if (dto.breed !== undefined) updateFields.breed = dto.breed;
    if (dto.gender !== undefined) updateFields.gender = dto.gender as PetGenderValue;
    if (dto.dateOfBirth !== undefined) updateFields.dateOfBirth = dto.dateOfBirth;
    if (dto.color !== undefined) updateFields.color = dto.color;
    if (dto.weightKg !== undefined) updateFields.weightKg = dto.weightKg;
    if (dto.knownAllergies !== undefined) updateFields.knownAllergies = dto.knownAllergies;
    if (dto.isNeutered !== undefined) updateFields.isNeutered = dto.isNeutered;
    if (dto.microchipId !== undefined) updateFields.microchipId = dto.microchipId;
    if (dto.notes !== undefined) updateFields.notes = dto.notes;
    if (dto.status !== undefined) updateFields.status = dto.status as PetStatusValue;

    await this.db.update(pets).set(updateFields).where(eq(pets.id, id));

    return this.getOne(id);
  }

  async softDelete(id: string): Promise<void> {
    const petRows = await this.db
      .select({ id: pets.id })
      .from(pets)
      .where(and(eq(pets.id, id), isNull(pets.deletedAt)));

    if (!petRows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }

    await this.db
      .update(pets)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(pets.id, id));
  }

  async getMedicalRecords(petId: string): Promise<MedicalRecordSummary[]> {
    await this.verifyPetExists(petId);

    const rows = await this.db
      .select({
        id: medicalRecords.id,
        displayNumber: medicalRecords.displayNumber,
        visitDate: medicalRecords.visitDate,
        chiefComplaint: medicalRecords.chiefComplaint,
        diagnosis: medicalRecords.diagnosis,
        createdAt: medicalRecords.createdAt,
      })
      .from(medicalRecords)
      .where(eq(medicalRecords.petId, petId))
      .orderBy(desc(medicalRecords.visitDate));

    return rows.map((r) => ({
      id: r.id,
      displayNumber: r.displayNumber,
      visitDate: r.visitDate,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getVaccines(petId: string): Promise<VaccineResponse[]> {
    await this.verifyPetExists(petId);

    const rows = await this.db
      .select()
      .from(vaccines)
      .where(eq(vaccines.petId, petId))
      .orderBy(desc(vaccines.administeredAt));

    return rows.map((r) => ({
      id: r.id,
      petId: r.petId,
      vaccineName: r.vaccineName,
      administeredAt: r.administeredAt,
      nextDueAt: r.nextDueAt ?? null,
      batchNumber: r.batchNumber ?? null,
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async addVaccine(petId: string, dto: CreateVaccineDto, adminId: string): Promise<VaccineResponse> {
    await this.verifyPetExists(petId);

    const [inserted] = await this.db
      .insert(vaccines)
      .values({
        petId,
        vaccineName: dto.vaccineName,
        administeredAt: dto.administeredAt,
        nextDueAt: dto.nextDueAt,
        batchNumber: dto.batchNumber,
        notes: dto.notes,
        createdBy: adminId,
      })
      .returning();

    return {
      id: inserted.id,
      petId: inserted.petId,
      vaccineName: inserted.vaccineName,
      administeredAt: inserted.administeredAt,
      nextDueAt: inserted.nextDueAt ?? null,
      batchNumber: inserted.batchNumber ?? null,
      notes: inserted.notes ?? null,
      createdAt: inserted.createdAt.toISOString(),
    };
  }

  async updateAvatar(petId: string, avatarUrl: string): Promise<PetResponse> {
    await this.db
      .update(pets)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(pets.id, petId));

    return this.getOne(petId);
  }

  private async verifyPetExists(petId: string): Promise<void> {
    const rows = await this.db
      .select({ id: pets.id })
      .from(pets)
      .where(and(eq(pets.id, petId), isNull(pets.deletedAt)));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }
  }
}
