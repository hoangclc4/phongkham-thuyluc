import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { Booking, bookings } from '../../database/schema/bookings.schema';
import { customers } from '../../database/schema/customers.schema';
import { pets } from '../../database/schema/pets.schema';
import { medicalRecords } from '../../database/schema/medical-records.schema';
import { vaccines } from '../../database/schema/vaccines.schema';
import { generateDisplayNumber } from '../../common/utils/display-number.util';
import {
  BOOKING_CANCEL_ADVANCE_HOURS,
  CUSTOMER_CANCELLABLE_STATUSES,
  SERVICE_LABELS,
  STATUS_LABELS,
  VN_OFFSET_MS,
} from './constants/customer-portal.constants';
import {
  CustomerBookingResponse,
  CustomerMedicalRecordResponse,
  CustomerPetResponse,
  CustomerProfileResponse,
  CustomerVaccineResponse,
} from './types/customer-portal-response.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateCustomerBookingDto } from './dto/create-customer-booking.dto';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked_in', 'in_progress'] as const;
const MAX_SLOT_CAPACITY = 2;
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 18;
const VALID_SLOT_MINUTES = [0, 30] as const;
const CANCEL_ADVANCE_MS = BOOKING_CANCEL_ADVANCE_HOURS * 60 * 60 * 1000;

interface BookingJoinRow {
  booking: Booking;
  petName: string;
  petSpecies: string;
}

@Injectable()
export class CustomerService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private getVietnamHourMinute(utcDate: Date): { hour: number; minute: number } {
    const vnMs = utcDate.getTime() + VN_OFFSET_MS;
    const vnDate = new Date(vnMs);
    return { hour: vnDate.getUTCHours(), minute: vnDate.getUTCMinutes() };
  }

  private mapToBookingResponse(row: BookingJoinRow): CustomerBookingResponse {
    const b = row.booking;
    return {
      id: b.id,
      displayNumber: b.displayNumber,
      petId: b.petId,
      petName: row.petName,
      petSpecies: row.petSpecies,
      serviceType: b.serviceType,
      serviceLabel: SERVICE_LABELS[b.serviceType] ?? b.serviceType,
      scheduledAt: b.scheduledAt.toISOString(),
      durationMinutes: b.durationMinutes,
      status: b.status,
      statusLabel: STATUS_LABELS[b.status] ?? b.status,
      notes: b.notes,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      cancelledReason: b.cancelledReason,
      createdAt: b.createdAt.toISOString(),
    };
  }

  private async verifyPetOwnership(customerId: string, petId: string): Promise<void> {
    const petRows = await this.db
      .select({ id: pets.id })
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.customerId, customerId), isNull(pets.deletedAt)));

    if (!petRows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }
  }

  async getProfile(customerId: string): Promise<CustomerProfileResponse> {
    const rows = await this.db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        createdAt: customers.createdAt,
        lastLoginAt: customers.lastLoginAt,
      })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const c = rows[0];
    return {
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      address: c.address,
      createdAt: c.createdAt.toISOString(),
      lastLoginAt: c.lastLoginAt?.toISOString() ?? null,
    };
  }

  async updateProfile(customerId: string, dto: UpdateProfileDto): Promise<CustomerProfileResponse> {
    const rows = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    await this.db
      .update(customers)
      .set({ email: dto.email, address: dto.address, updatedAt: new Date() })
      .where(eq(customers.id, customerId));

    return this.getProfile(customerId);
  }

  async changePassword(customerId: string, dto: ChangePasswordDto): Promise<void> {
    const rows = await this.db
      .select({ passwordHash: customers.passwordHash })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    if (!rows[0].passwordHash) {
      throw new BadRequestException('Tài khoản chưa có mật khẩu');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, rows[0].passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.db
      .update(customers)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }

  async listPets(customerId: string): Promise<CustomerPetResponse[]> {
    const rows = await this.db
      .select()
      .from(pets)
      .where(and(eq(pets.customerId, customerId), isNull(pets.deletedAt)))
      .orderBy(asc(pets.name));

    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      color: p.color,
      weightKg: p.weightKg,
      avatarUrl: p.avatarUrl,
      status: p.status,
      knownAllergies: p.knownAllergies,
      microchipId: p.microchipId,
      notes: p.notes,
      isNeutered: p.isNeutered,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async getPet(customerId: string, petId: string): Promise<CustomerPetResponse> {
    const rows = await this.db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.customerId, customerId), isNull(pets.deletedAt)));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }

    const p = rows[0];
    return {
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      color: p.color,
      weightKg: p.weightKg,
      avatarUrl: p.avatarUrl,
      status: p.status,
      knownAllergies: p.knownAllergies,
      microchipId: p.microchipId,
      notes: p.notes,
      isNeutered: p.isNeutered,
      createdAt: p.createdAt.toISOString(),
    };
  }

  async listMedicalRecords(
    customerId: string,
    petId: string,
  ): Promise<CustomerMedicalRecordResponse[]> {
    await this.verifyPetOwnership(customerId, petId);

    const rows = await this.db
      .select({
        id: medicalRecords.id,
        displayNumber: medicalRecords.displayNumber,
        visitDate: medicalRecords.visitDate,
        weightAtVisit: medicalRecords.weightAtVisit,
        temperatureCelsius: medicalRecords.temperatureCelsius,
        chiefComplaint: medicalRecords.chiefComplaint,
        diagnosis: medicalRecords.diagnosis,
        diagnosisNotes: medicalRecords.diagnosisNotes,
        treatmentPlan: medicalRecords.treatmentPlan,
        followupDate: medicalRecords.followupDate,
        followupNotes: medicalRecords.followupNotes,
        attachments: medicalRecords.attachments,
        createdAt: medicalRecords.createdAt,
      })
      .from(medicalRecords)
      .where(
        and(
          eq(medicalRecords.petId, petId),
          eq(medicalRecords.isSharedWithCustomer, true),
        ),
      )
      .orderBy(desc(medicalRecords.visitDate));

    return rows.map((r) => ({
      id: r.id,
      displayNumber: r.displayNumber,
      visitDate: r.visitDate,
      weightAtVisit: r.weightAtVisit,
      temperatureCelsius: r.temperatureCelsius,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      diagnosisNotes: r.diagnosisNotes,
      treatmentPlan: r.treatmentPlan,
      followupDate: r.followupDate,
      followupNotes: r.followupNotes,
      attachments: r.attachments,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getMedicalRecord(
    customerId: string,
    petId: string,
    recordId: string,
  ): Promise<CustomerMedicalRecordResponse> {
    await this.verifyPetOwnership(customerId, petId);

    const rows = await this.db
      .select({
        id: medicalRecords.id,
        displayNumber: medicalRecords.displayNumber,
        visitDate: medicalRecords.visitDate,
        weightAtVisit: medicalRecords.weightAtVisit,
        temperatureCelsius: medicalRecords.temperatureCelsius,
        chiefComplaint: medicalRecords.chiefComplaint,
        diagnosis: medicalRecords.diagnosis,
        diagnosisNotes: medicalRecords.diagnosisNotes,
        treatmentPlan: medicalRecords.treatmentPlan,
        followupDate: medicalRecords.followupDate,
        followupNotes: medicalRecords.followupNotes,
        attachments: medicalRecords.attachments,
        createdAt: medicalRecords.createdAt,
      })
      .from(medicalRecords)
      .where(
        and(
          eq(medicalRecords.id, recordId),
          eq(medicalRecords.petId, petId),
          eq(medicalRecords.isSharedWithCustomer, true),
        ),
      );

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh lý');
    }

    const r = rows[0];
    return {
      id: r.id,
      displayNumber: r.displayNumber,
      visitDate: r.visitDate,
      weightAtVisit: r.weightAtVisit,
      temperatureCelsius: r.temperatureCelsius,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      diagnosisNotes: r.diagnosisNotes,
      treatmentPlan: r.treatmentPlan,
      followupDate: r.followupDate,
      followupNotes: r.followupNotes,
      attachments: r.attachments,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async listVaccines(customerId: string, petId: string): Promise<CustomerVaccineResponse[]> {
    await this.verifyPetOwnership(customerId, petId);

    const rows = await this.db
      .select({
        id: vaccines.id,
        vaccineName: vaccines.vaccineName,
        administeredAt: vaccines.administeredAt,
        nextDueAt: vaccines.nextDueAt,
        batchNumber: vaccines.batchNumber,
        notes: vaccines.notes,
      })
      .from(vaccines)
      .where(eq(vaccines.petId, petId))
      .orderBy(desc(vaccines.administeredAt));

    return rows.map((v) => ({
      id: v.id,
      vaccineName: v.vaccineName,
      administeredAt: v.administeredAt,
      nextDueAt: v.nextDueAt,
      batchNumber: v.batchNumber,
      notes: v.notes,
    }));
  }

  async listBookings(customerId: string): Promise<CustomerBookingResponse[]> {
    const rows = await this.db
      .select({
        booking: bookings,
        petName: pets.name,
        petSpecies: pets.species,
      })
      .from(bookings)
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.scheduledAt));

    return rows.map((r) => this.mapToBookingResponse(r));
  }

  async getBooking(customerId: string, bookingId: string): Promise<CustomerBookingResponse> {
    const rows = await this.db
      .select({
        booking: bookings,
        petName: pets.name,
        petSpecies: pets.species,
      })
      .from(bookings)
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, customerId)));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy lịch khám');
    }

    return this.mapToBookingResponse(rows[0]);
  }

  async createBooking(
    customerId: string,
    dto: CreateCustomerBookingDto,
  ): Promise<CustomerBookingResponse> {
    await this.verifyPetOwnership(customerId, dto.petId);

    const scheduledAt = new Date(dto.scheduledAt);

    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Thời gian đặt lịch phải trong tương lai');
    }

    const { hour, minute } = this.getVietnamHourMinute(scheduledAt);
    const isValidHour = hour >= SLOT_START_HOUR && hour < SLOT_END_HOUR;
    const isValidMinute = (VALID_SLOT_MINUTES as readonly number[]).includes(minute);

    if (!isValidHour || !isValidMinute) {
      throw new BadRequestException(
        `Giờ khám phải trong khung ${SLOT_START_HOUR}:00-${SLOT_END_HOUR}:00 và bắt đầu vào đầu giờ hoặc 30 phút`,
      );
    }

    const existingAtSlot = await this.db
      .select({ id: bookings.id, customerId: bookings.customerId })
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduledAt, scheduledAt),
          inArray(bookings.status, [...ACTIVE_STATUSES]),
        ),
      );

    const hasDuplicate = existingAtSlot.some((b) => b.customerId === customerId);
    if (hasDuplicate) {
      throw new ConflictException('Bạn đã có lịch khám trong khung giờ này');
    }

    if (existingAtSlot.length >= MAX_SLOT_CAPACITY) {
      throw new ConflictException('Khung giờ này đã đầy, vui lòng chọn giờ khác');
    }

    const displayNumber = await generateDisplayNumber('BKG', scheduledAt);

    const [inserted] = await this.db
      .insert(bookings)
      .values({
        displayNumber,
        customerId,
        petId: dto.petId,
        serviceType: dto.serviceType as typeof bookings.$inferInsert['serviceType'],
        scheduledAt,
        durationMinutes: 30,
        status: 'pending',
        source: 'customer_portal',
        notes: dto.notes,
        createdBy: null,
      })
      .returning({ id: bookings.id });

    return this.getBooking(customerId, inserted.id);
  }

  async cancelBooking(customerId: string, bookingId: string): Promise<void> {
    const rows = await this.db
      .select({ status: bookings.status, scheduledAt: bookings.scheduledAt })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, customerId)));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy lịch khám');
    }

    const { status, scheduledAt } = rows[0];
    const isCancellable = (CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status);

    if (!isCancellable) {
      throw new BadRequestException('Lịch này không thể huỷ');
    }

    const msUntilAppointment = scheduledAt.getTime() - Date.now();
    if (msUntilAppointment < CANCEL_ADVANCE_MS) {
      throw new BadRequestException('Chỉ có thể huỷ trước 24 giờ');
    }

    const now = new Date();
    await this.db
      .update(bookings)
      .set({ status: 'cancelled', cancelledAt: now, cancelledBy: 'customer', updatedAt: now })
      .where(eq(bookings.id, bookingId));
  }
}
