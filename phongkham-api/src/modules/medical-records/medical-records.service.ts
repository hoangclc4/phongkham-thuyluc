import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, isNull, sql } from 'drizzle-orm';
import { AiService } from '../ai/ai.service';
import { randomUUID } from 'crypto';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { medicalRecords } from '../../database/schema/medical-records.schema';
import { pets } from '../../database/schema/pets.schema';
import { customers } from '../../database/schema/customers.schema';
import { bookings } from '../../database/schema/bookings.schema';
import { adminUsers } from '../../database/schema/admin-users.schema';
import { StorageService } from '../../common/services/storage.service';
import { generateDisplayNumber } from '../../common/utils/display-number.util';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { ListMedicalRecordsDto } from './dto/list-medical-records.dto';
import { UpdateSharingDto } from './dto/update-sharing.dto';
import {
  ATTACHMENT_TYPE_LABELS,
  ATTACHMENT_TYPES,
  AllowedAttachmentMimeType,
  AttachmentTypeValue,
  MIME_TO_ATTACHMENT_TYPE,
  MIME_TO_EXT,
} from './constants/medical-record.constants';
import {
  AttachmentItem,
  LinkedBooking,
  MedicalRecordListItem,
  MedicalRecordListResponse,
  MedicalRecordResponse,
  TreatmentPlanItem,
} from './types/medical-record-response.type';

interface MedicalRecordJoinRow {
  id: string;
  displayNumber: string;
  bookingId: string | null;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string | null;
  ownerName: string;
  ownerPhone: string;
  knownAllergies: string[] | null;
  bookingDisplayNumber: string | null;
  bookingServiceType: string | null;
  visitDate: string;
  weightAtVisit: string | null;
  temperatureCelsius: string | null;
  chiefComplaint: string;
  physicalExamination: string | null;
  diagnosis: string | null;
  diagnosisNotes: string | null;
  treatmentPlan: unknown;
  doctorNotes: string | null;
  followupDate: string | null;
  followupNotes: string | null;
  attachments: unknown;
  isSharedWithCustomer: boolean;
  requiresAttention: boolean;
  attentionReason: string | null;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AttachmentUploadParams {
  buffer: Buffer;
  mimeType: AllowedAttachmentMimeType;
  originalFilename: string;
  attachmentType?: AttachmentTypeValue;
}

@Injectable()
export class MedicalRecordsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
  ) {}

  private buildJoinSelect() {
    return {
      id: medicalRecords.id,
      displayNumber: medicalRecords.displayNumber,
      bookingId: medicalRecords.bookingId,
      petId: medicalRecords.petId,
      petName: pets.name,
      petSpecies: pets.species,
      petBreed: pets.breed,
      ownerName: customers.fullName,
      ownerPhone: customers.phone,
      knownAllergies: pets.knownAllergies,
      bookingDisplayNumber: bookings.displayNumber,
      bookingServiceType: bookings.serviceType,
      visitDate: medicalRecords.visitDate,
      weightAtVisit: medicalRecords.weightAtVisit,
      temperatureCelsius: medicalRecords.temperatureCelsius,
      chiefComplaint: medicalRecords.chiefComplaint,
      physicalExamination: medicalRecords.physicalExamination,
      diagnosis: medicalRecords.diagnosis,
      diagnosisNotes: medicalRecords.diagnosisNotes,
      treatmentPlan: medicalRecords.treatmentPlan,
      doctorNotes: medicalRecords.doctorNotes,
      followupDate: medicalRecords.followupDate,
      followupNotes: medicalRecords.followupNotes,
      attachments: medicalRecords.attachments,
      isSharedWithCustomer: medicalRecords.isSharedWithCustomer,
      requiresAttention: medicalRecords.requiresAttention,
      attentionReason: medicalRecords.attentionReason,
      createdByName: adminUsers.fullName,
      createdAt: medicalRecords.createdAt,
      updatedAt: medicalRecords.updatedAt,
    } as const;
  }

  private mapToResponse(row: MedicalRecordJoinRow): MedicalRecordResponse {
    const linkedBooking: LinkedBooking | null =
      row.bookingDisplayNumber && row.bookingServiceType
        ? { displayNumber: row.bookingDisplayNumber, serviceType: row.bookingServiceType }
        : null;

    return {
      id: row.id,
      displayNumber: row.displayNumber,
      pet: {
        name: row.petName,
        species: row.petSpecies,
        breed: row.petBreed,
        ownerName: row.ownerName,
        ownerPhone: row.ownerPhone,
        knownAllergies: row.knownAllergies,
      },
      linkedBooking,
      visitDate: row.visitDate,
      weightAtVisit: row.weightAtVisit,
      temperatureCelsius: row.temperatureCelsius,
      chiefComplaint: row.chiefComplaint,
      physicalExamination: row.physicalExamination,
      diagnosis: row.diagnosis,
      diagnosisNotes: row.diagnosisNotes,
      treatmentPlan: (row.treatmentPlan as TreatmentPlanItem[] | null) ?? null,
      doctorNotes: row.doctorNotes,
      followupDate: row.followupDate,
      followupNotes: row.followupNotes,
      attachments: (row.attachments as AttachmentItem[] | null) ?? [],
      isSharedWithCustomer: row.isSharedWithCustomer,
      requiresAttention: row.requiresAttention,
      attentionReason: row.attentionReason,
      createdBy: row.createdByName,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(dto: ListMedicalRecordsDto): Promise<MedicalRecordListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];

    if (dto.petId !== undefined) {
      conditions.push(eq(medicalRecords.petId, dto.petId));
    }

    if (dto.requiresAttention !== undefined) {
      conditions.push(eq(medicalRecords.requiresAttention, dto.requiresAttention));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      this.db
        .select({
          id: medicalRecords.id,
          displayNumber: medicalRecords.displayNumber,
          petId: medicalRecords.petId,
          petName: pets.name,
          petSpecies: pets.species,
          ownerName: customers.fullName,
          ownerPhone: customers.phone,
          visitDate: medicalRecords.visitDate,
          chiefComplaint: medicalRecords.chiefComplaint,
          diagnosis: medicalRecords.diagnosis,
          requiresAttention: medicalRecords.requiresAttention,
          attentionReason: medicalRecords.attentionReason,
          isSharedWithCustomer: medicalRecords.isSharedWithCustomer,
          createdAt: medicalRecords.createdAt,
        })
        .from(medicalRecords)
        .innerJoin(pets, eq(pets.id, medicalRecords.petId))
        .innerJoin(customers, eq(customers.id, pets.customerId))
        .where(whereClause)
        .orderBy(desc(medicalRecords.visitDate))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(medicalRecords)
        .where(whereClause),
    ]);

    const total = countRows[0]?.total ?? 0;

    const data: MedicalRecordListItem[] = rows.map((r) => ({
      id: r.id,
      displayNumber: r.displayNumber,
      petId: r.petId,
      petName: r.petName,
      petSpecies: r.petSpecies,
      ownerName: r.ownerName,
      ownerPhone: r.ownerPhone,
      visitDate: r.visitDate,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      requiresAttention: r.requiresAttention,
      attentionReason: r.attentionReason,
      isSharedWithCustomer: r.isSharedWithCustomer,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data, total, page, limit };
  }

  async getOne(id: string): Promise<MedicalRecordResponse> {
    const rows = await this.db
      .select(this.buildJoinSelect())
      .from(medicalRecords)
      .innerJoin(pets, eq(pets.id, medicalRecords.petId))
      .innerJoin(customers, eq(customers.id, pets.customerId))
      .leftJoin(bookings, eq(bookings.id, medicalRecords.bookingId))
      .innerJoin(adminUsers, eq(adminUsers.id, medicalRecords.createdBy))
      .where(eq(medicalRecords.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh lý');
    }

    return this.mapToResponse(rows[0] as MedicalRecordJoinRow);
  }

  async create(dto: CreateMedicalRecordDto, adminId: string): Promise<MedicalRecordResponse> {
    const petRows = await this.db
      .select({ id: pets.id })
      .from(pets)
      .where(and(eq(pets.id, dto.petId), isNull(pets.deletedAt)));

    if (!petRows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }

    if (dto.bookingId) {
      const bookingRows = await this.db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.id, dto.bookingId));

      if (!bookingRows[0]) {
        throw new NotFoundException('Không tìm thấy lịch hẹn');
      }
    }

    const displayNumber = await generateDisplayNumber('MED');

    const [inserted] = await this.db
      .insert(medicalRecords)
      .values({
        petId: dto.petId,
        bookingId: dto.bookingId,
        displayNumber,
        visitDate: dto.visitDate,
        weightAtVisit: dto.weightAtVisit,
        temperatureCelsius: dto.temperatureCelsius,
        chiefComplaint: dto.chiefComplaint,
        physicalExamination: dto.physicalExamination,
        diagnosis: dto.diagnosis,
        diagnosisNotes: dto.diagnosisNotes,
        treatmentPlan: dto.treatmentPlan ?? null,
        doctorNotes: dto.doctorNotes,
        followupDate: dto.followupDate,
        followupNotes: dto.followupNotes,
        attachments: [],
        isSharedWithCustomer: dto.isSharedWithCustomer ?? false,
        requiresAttention: dto.requiresAttention ?? false,
        attentionReason: dto.attentionReason,
        createdBy: adminId,
      })
      .returning({ id: medicalRecords.id });

    return this.getOne(inserted.id);
  }

  async update(id: string, dto: UpdateMedicalRecordDto): Promise<MedicalRecordResponse> {
    await this.verifyExists(id);

    const updateFields: Partial<typeof medicalRecords.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.visitDate !== undefined) updateFields.visitDate = dto.visitDate;
    if (dto.weightAtVisit !== undefined) updateFields.weightAtVisit = dto.weightAtVisit;
    if (dto.temperatureCelsius !== undefined) updateFields.temperatureCelsius = dto.temperatureCelsius;
    if (dto.chiefComplaint !== undefined) updateFields.chiefComplaint = dto.chiefComplaint;
    if (dto.physicalExamination !== undefined) updateFields.physicalExamination = dto.physicalExamination;
    if (dto.diagnosis !== undefined) updateFields.diagnosis = dto.diagnosis;
    if (dto.diagnosisNotes !== undefined) updateFields.diagnosisNotes = dto.diagnosisNotes;
    if (dto.treatmentPlan !== undefined) updateFields.treatmentPlan = dto.treatmentPlan;
    if (dto.doctorNotes !== undefined) updateFields.doctorNotes = dto.doctorNotes;
    if (dto.followupDate !== undefined) updateFields.followupDate = dto.followupDate;
    if (dto.followupNotes !== undefined) updateFields.followupNotes = dto.followupNotes;
    if (dto.isSharedWithCustomer !== undefined) updateFields.isSharedWithCustomer = dto.isSharedWithCustomer;
    if (dto.requiresAttention !== undefined) updateFields.requiresAttention = dto.requiresAttention;
    if (dto.attentionReason !== undefined) updateFields.attentionReason = dto.attentionReason;

    await this.db.update(medicalRecords).set(updateFields).where(eq(medicalRecords.id, id));

    const customerId = await this.getCustomerIdForRecord(id);
    if (customerId) this.aiService.invalidateCustomerContext(customerId).catch(() => {});

    return this.getOne(id);
  }

  async addAttachment(id: string, params: AttachmentUploadParams): Promise<MedicalRecordResponse> {
    const rows = await this.db
      .select({ id: medicalRecords.id, attachments: medicalRecords.attachments })
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh lý');
    }

    const ext = MIME_TO_EXT[params.mimeType];
    const url = await this.storageService.uploadFile(
      'medical-records',
      id,
      params.buffer,
      params.mimeType,
      ext,
    );

    const resolvedType = params.attachmentType ?? MIME_TO_ATTACHMENT_TYPE[params.mimeType];

    const newAttachment: AttachmentItem = {
      id: randomUUID(),
      filename: params.originalFilename,
      type: resolvedType,
      typeLabel: ATTACHMENT_TYPE_LABELS[resolvedType],
      url,
      uploadedAt: new Date().toISOString(),
    };

    const existing = (rows[0].attachments as AttachmentItem[] | null) ?? [];
    const updated = [...existing, newAttachment];

    await this.db
      .update(medicalRecords)
      .set({ attachments: updated, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id));

    return this.getOne(id);
  }

  async deleteAttachment(id: string, attachmentId: string): Promise<MedicalRecordResponse> {
    const rows = await this.db
      .select({ id: medicalRecords.id, attachments: medicalRecords.attachments })
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh lý');
    }

    const existing = (rows[0].attachments as AttachmentItem[] | null) ?? [];
    const filtered = existing.filter((a) => a.id !== attachmentId);

    if (filtered.length === existing.length) {
      throw new NotFoundException('Không tìm thấy tệp đính kèm');
    }

    await this.db
      .update(medicalRecords)
      .set({ attachments: filtered, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id));

    return this.getOne(id);
  }

  async updateSharing(id: string, dto: UpdateSharingDto): Promise<MedicalRecordResponse> {
    await this.verifyExists(id);

    await this.db
      .update(medicalRecords)
      .set({ isSharedWithCustomer: dto.isSharedWithCustomer, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id));

    return this.getOne(id);
  }

  private async verifyExists(id: string): Promise<void> {
    const rows = await this.db
      .select({ id: medicalRecords.id })
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh lý');
    }
  }

  private async getCustomerIdForRecord(recordId: string): Promise<string | null> {
    const rows = await this.db
      .select({ customerId: pets.customerId })
      .from(medicalRecords)
      .innerJoin(pets, eq(pets.id, medicalRecords.petId))
      .where(eq(medicalRecords.id, recordId));
    return rows[0]?.customerId ?? null;
  }
}
