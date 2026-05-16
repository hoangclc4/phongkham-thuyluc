import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { invoices } from '../../database/schema/invoices.schema';
import { customers } from '../../database/schema/customers.schema';
import { pets } from '../../database/schema/pets.schema';
import { bookings } from '../../database/schema/bookings.schema';
import { medicalRecords } from '../../database/schema/medical-records.schema';
import { generateDisplayNumber } from '../../common/utils/display-number.util';
import {
  BOOKING_SERVICE_LABELS,
  LINE_ITEM_CATEGORY_LABELS,
  NON_EDITABLE_PAYMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from './constants/invoice.constants';
import {
  InvoiceListItem,
  InvoiceListResponse,
  InvoiceResponse,
  LineItem,
} from './types/invoice-response.type';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';

interface InvoiceJoinRow {
  id:                       string;
  displayNumber:            string;
  bookingId:                string | null;
  medicalRecordId:          string | null;
  customerId:               string;
  petId:                    string;
  customerFullName:         string;
  customerPhone:            string;
  petName:                  string;
  petSpecies:               string;
  bookingDisplayNumber:     string | null;
  bookingServiceType:       string | null;
  medicalRecordDisplayNumber: string | null;
  lineItems:                unknown;
  subtotal:                 number;
  discountAmount:           number;
  discountReason:           string | null;
  totalAmount:              number;
  paymentMethod:            string | null;
  paymentStatus:            string;
  paidAmount:               number;
  paidAt:                   Date | null;
  notes:                    string | null;
  createdAt:                Date;
  updatedAt:                Date;
}

interface RawLineItem {
  description: string;
  category:    string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style:                'currency',
    currency:             'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

@Injectable()
export class InvoicesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private buildJoinSelect() {
    return {
      id:                       invoices.id,
      displayNumber:            invoices.displayNumber,
      bookingId:                invoices.bookingId,
      medicalRecordId:          invoices.medicalRecordId,
      customerId:               invoices.customerId,
      petId:                    invoices.petId,
      customerFullName:         customers.fullName,
      customerPhone:            customers.phone,
      petName:                  pets.name,
      petSpecies:               pets.species,
      bookingDisplayNumber:     bookings.displayNumber,
      bookingServiceType:       bookings.serviceType,
      medicalRecordDisplayNumber: medicalRecords.displayNumber,
      lineItems:                invoices.lineItems,
      subtotal:                 invoices.subtotal,
      discountAmount:           invoices.discountAmount,
      discountReason:           invoices.discountReason,
      totalAmount:              invoices.totalAmount,
      paymentMethod:            invoices.paymentMethod,
      paymentStatus:            invoices.paymentStatus,
      paidAmount:               invoices.paidAmount,
      paidAt:                   invoices.paidAt,
      notes:                    invoices.notes,
      createdAt:                invoices.createdAt,
      updatedAt:                invoices.updatedAt,
    } as const;
  }

  private mapToResponse(row: InvoiceJoinRow): InvoiceResponse {
    const rawItems = Array.isArray(row.lineItems) ? (row.lineItems as RawLineItem[]) : [];

    const mappedLineItems: LineItem[] = rawItems.map((item) => ({
      description:   item.description,
      category:      item.category,
      categoryLabel: LINE_ITEM_CATEGORY_LABELS[item.category] ?? item.category,
      quantity:      item.quantity,
      unitPrice:     item.unitPrice,
      total:         item.total,
    }));

    return {
      id:            row.id,
      displayNumber: row.displayNumber,
      linkedBooking: row.bookingDisplayNumber
        ? {
            displayNumber: row.bookingDisplayNumber,
            serviceLabel:  BOOKING_SERVICE_LABELS[row.bookingServiceType ?? ''] ?? row.bookingServiceType ?? '',
          }
        : null,
      linkedMedicalRecord: row.medicalRecordDisplayNumber
        ? { displayNumber: row.medicalRecordDisplayNumber }
        : null,
      customer: {
        fullName: row.customerFullName,
        phone:    row.customerPhone,
      },
      pet: {
        name:    row.petName,
        species: row.petSpecies,
      },
      lineItems:          mappedLineItems,
      subtotal:           row.subtotal,
      discountAmount:     row.discountAmount,
      discountReason:     row.discountReason,
      totalAmount:        row.totalAmount,
      totalDisplay:       formatVND(row.totalAmount),
      paymentMethod:      row.paymentMethod,
      paymentMethodLabel: row.paymentMethod ? (PAYMENT_METHOD_LABELS[row.paymentMethod] ?? null) : null,
      paymentStatus:      row.paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[row.paymentStatus] ?? row.paymentStatus,
      paidAmount:         row.paidAmount,
      paidAt:             row.paidAt?.toISOString() ?? null,
      notes:              row.notes,
      createdAt:          row.createdAt.toISOString(),
      updatedAt:          row.updatedAt.toISOString(),
    };
  }

  async getOne(id: string): Promise<InvoiceResponse> {
    const rows = await this.db
      .select(this.buildJoinSelect())
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .innerJoin(pets, eq(invoices.petId, pets.id))
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(medicalRecords, eq(invoices.medicalRecordId, medicalRecords.id))
      .where(eq(invoices.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy hoá đơn');
    }

    return this.mapToResponse(rows[0] as InvoiceJoinRow);
  }

  async list(dto: ListInvoicesDto): Promise<InvoiceListResponse> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];

    if (dto.customerId) {
      conditions.push(eq(invoices.customerId, dto.customerId));
    }

    if (dto.paymentStatus) {
      conditions.push(eq(invoices.paymentStatus, dto.paymentStatus as typeof invoices.paymentStatus._.data));
    }

    const whereClause = and(...conditions);

    const [rows, countRows] = await Promise.all([
      this.db
        .select({
          id:                invoices.id,
          displayNumber:     invoices.displayNumber,
          customerFullName:  customers.fullName,
          customerPhone:     customers.phone,
          petName:           pets.name,
          petSpecies:        pets.species,
          subtotal:          invoices.subtotal,
          discountAmount:    invoices.discountAmount,
          totalAmount:       invoices.totalAmount,
          paymentStatus:     invoices.paymentStatus,
          paidAmount:        invoices.paidAmount,
          createdAt:         invoices.createdAt,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .innerJoin(pets, eq(invoices.petId, pets.id))
        .where(whereClause)
        .orderBy(desc(invoices.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .innerJoin(pets, eq(invoices.petId, pets.id))
        .where(whereClause),
    ]);

    const total = countRows[0]?.total ?? 0;

    const data: InvoiceListItem[] = rows.map((row) => ({
      id:                 row.id,
      displayNumber:      row.displayNumber,
      customerFullName:   row.customerFullName,
      customerPhone:      row.customerPhone,
      petName:            row.petName,
      petSpecies:         row.petSpecies,
      subtotal:           row.subtotal,
      discountAmount:     row.discountAmount,
      totalAmount:        row.totalAmount,
      totalDisplay:       formatVND(row.totalAmount),
      paymentStatus:      row.paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[row.paymentStatus] ?? row.paymentStatus,
      paidAmount:         row.paidAmount,
      createdAt:          row.createdAt.toISOString(),
    }));

    return { data, total, page, limit };
  }

  async create(dto: CreateInvoiceDto, adminId: string): Promise<InvoiceResponse> {
    const customerRows = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, dto.customerId), eq(customers.isActive, true)));

    if (!customerRows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const petRows = await this.db
      .select({ id: pets.id })
      .from(pets)
      .where(and(eq(pets.id, dto.petId), eq(pets.customerId, dto.customerId)));

    if (!petRows[0]) {
      throw new NotFoundException('Không tìm thấy thú cưng hoặc thú cưng không thuộc khách hàng này');
    }

    if (dto.bookingId) {
      const bookingRows = await this.db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.id, dto.bookingId));

      if (!bookingRows[0]) {
        throw new NotFoundException('Không tìm thấy lịch khám');
      }
    }

    if (dto.medicalRecordId) {
      const medRows = await this.db
        .select({ id: medicalRecords.id })
        .from(medicalRecords)
        .where(eq(medicalRecords.id, dto.medicalRecordId));

      if (!medRows[0]) {
        throw new NotFoundException('Không tìm thấy hồ sơ bệnh lý');
      }
    }

    const computedLineItems = dto.lineItems.map((item) => ({
      description: item.description,
      category:    item.category,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      total:       item.quantity * item.unitPrice,
    }));

    const subtotal     = computedLineItems.reduce((sum, item) => sum + item.total, 0);
    const discount     = dto.discountAmount ?? 0;
    const totalAmount  = subtotal - discount;
    const displayNumber = await generateDisplayNumber('INV');

    const [inserted] = await this.db
      .insert(invoices)
      .values({
        displayNumber,
        customerId:      dto.customerId,
        petId:           dto.petId,
        bookingId:       dto.bookingId,
        medicalRecordId: dto.medicalRecordId,
        lineItems:       computedLineItems,
        subtotal,
        discountAmount:  discount,
        discountReason:  dto.discountReason,
        totalAmount,
        paymentStatus:   'pending',
        notes:           dto.notes,
        createdBy:       adminId,
      })
      .returning({ id: invoices.id });

    return this.getOne(inserted.id);
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<InvoiceResponse> {
    const existing = await this.db
      .select({ paymentStatus: invoices.paymentStatus, subtotal: invoices.subtotal, discountAmount: invoices.discountAmount, totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!existing[0]) {
      throw new NotFoundException('Không tìm thấy hoá đơn');
    }

    if (NON_EDITABLE_PAYMENT_STATUSES.includes(existing[0].paymentStatus as typeof NON_EDITABLE_PAYMENT_STATUSES[number])) {
      throw new BadRequestException('Không thể chỉnh sửa hoá đơn đã thanh toán/miễn phí/hoàn tiền');
    }

    const updateFields: Partial<typeof invoices.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.lineItems !== undefined) {
      const computedLineItems = dto.lineItems.map((item) => ({
        description: item.description,
        category:    item.category,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        total:       item.quantity * item.unitPrice,
      }));

      const subtotal    = computedLineItems.reduce((sum, item) => sum + item.total, 0);
      const discount    = dto.discountAmount ?? existing[0].discountAmount;
      const totalAmount = subtotal - discount;

      updateFields.lineItems      = computedLineItems;
      updateFields.subtotal       = subtotal;
      updateFields.discountAmount = discount;
      updateFields.totalAmount    = totalAmount;
    } else if (dto.discountAmount !== undefined) {
      const discount    = dto.discountAmount;
      const totalAmount = existing[0].subtotal - discount;

      updateFields.discountAmount = discount;
      updateFields.totalAmount    = totalAmount;
    }

    if (dto.discountReason !== undefined) updateFields.discountReason = dto.discountReason;
    if (dto.notes !== undefined)          updateFields.notes           = dto.notes;

    await this.db.update(invoices).set(updateFields).where(eq(invoices.id, id));

    return this.getOne(id);
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<InvoiceResponse> {
    const existing = await this.db
      .select({ id: invoices.id, paidAt: invoices.paidAt })
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!existing[0]) {
      throw new NotFoundException('Không tìm thấy hoá đơn');
    }

    const now = new Date();

    const updateFields: Partial<typeof invoices.$inferInsert> = {
      paymentMethod: dto.paymentMethod as typeof invoices.paymentMethod._.data,
      paymentStatus: dto.paymentStatus as typeof invoices.paymentStatus._.data,
      paidAmount:    dto.paidAmount,
      updatedAt:     now,
    };

    if (dto.notes !== undefined) {
      updateFields.notes = dto.notes;
    }

    if (dto.paymentStatus === 'pending') {
      updateFields.paidAt     = null;
      updateFields.paidAmount = 0;
    } else if (dto.paidAmount > 0 && !existing[0].paidAt) {
      updateFields.paidAt = now;
    }

    await this.db.update(invoices).set(updateFields).where(eq(invoices.id, id));

    return this.getOne(id);
  }
}
