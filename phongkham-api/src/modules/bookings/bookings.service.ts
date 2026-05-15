import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from 'drizzle-orm';
import { Resend } from 'resend';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { Booking, bookings } from '../../database/schema/bookings.schema';
import { customers } from '../../database/schema/customers.schema';
import { pets } from '../../database/schema/pets.schema';
import { invoices } from '../../database/schema/invoices.schema';
import { generateDisplayNumber } from '../../common/utils/display-number.util';
import {
  ACTIVE_SLOT_STATUSES,
  BookingServiceValue,
  BookingSourceValue,
  BookingStatusValue,
  CANCELLABLE_STATUSES,
  MAX_BOOKINGS_PER_SLOT,
  SERVICE_LABELS,
  SLOT_DURATION_MINUTES,
  SLOT_END_HOUR,
  SLOT_START_HOUR,
  STATUS_LABELS,
  TERMINAL_STATUSES,
  VALID_STATUS_TRANSITIONS,
  VN_TIMEZONE_OFFSET_MS,
} from './constants/booking.constants';
import {
  BookingListResponse,
  BookingResponse,
  TimeSlot,
} from './types/booking-response.type';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AiService } from '../ai/ai.service';

interface BookingJoinRow {
  booking: Booking;
  customerFullName: string;
  customerPhone: string;
  petName: string;
  petSpecies: string;
  petBreed: string | null;
  petAvatarUrl: string | null;
}

@Injectable()
export class BookingsService {
  private _resend: Resend | undefined;
  private get resend(): Resend {
    if (!this._resend) this._resend = new Resend(process.env.RESEND_API_KEY);
    return this._resend;
  }

  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly aiService: AiService,
  ) {}

  private mapToResponse(row: BookingJoinRow): BookingResponse {
    const b = row.booking;
    return {
      id: b.id,
      displayNumber: b.displayNumber,
      customer: {
        id: b.customerId,
        displayName: row.customerFullName,
        phone: row.customerPhone,
      },
      pet: {
        id: b.petId,
        name: row.petName,
        species: row.petSpecies,
        breed: row.petBreed,
        avatarUrl: row.petAvatarUrl,
      },
      serviceType: b.serviceType,
      serviceLabel: SERVICE_LABELS[b.serviceType],
      scheduledAt: b.scheduledAt.toISOString(),
      durationMinutes: b.durationMinutes,
      status: b.status,
      statusLabel: STATUS_LABELS[b.status],
      source: b.source,
      notes: b.notes,
      adminNotes: b.adminNotes,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      cancelledBy: b.cancelledBy,
      cancelledReason: b.cancelledReason,
      createdAt: b.createdAt.toISOString(),
    };
  }

  private getVietnamHourMinute(utcDate: Date): { hour: number; minute: number } {
    const vnMs = utcDate.getTime() + VN_TIMEZONE_OFFSET_MS;
    const vnDate = new Date(vnMs);
    return { hour: vnDate.getUTCHours(), minute: vnDate.getUTCMinutes() };
  }

  private formatVNTime(utcDate: Date): string {
    const { hour, minute } = this.getVietnamHourMinute(utcDate);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private parseVietnamDate(dateStr: string): { start: Date; end: Date } {
    const parts = dateStr.split('-').map(Number);
    const [year, month, day] = parts;
    const start = new Date(Date.UTC(year, month - 1, day) - VN_TIMEZONE_OFFSET_MS);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private getVietnamDayBounds(date: Date): { start: Date; end: Date } {
    const vnMs = date.getTime() + VN_TIMEZONE_OFFSET_MS;
    const vnDate = new Date(vnMs);
    const vnMidnightUTC = Date.UTC(
      vnDate.getUTCFullYear(),
      vnDate.getUTCMonth(),
      vnDate.getUTCDate(),
    );
    const start = new Date(vnMidnightUTC - VN_TIMEZONE_OFFSET_MS);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private buildJoinSelect() {
    return {
      booking: bookings,
      customerFullName: customers.fullName,
      customerPhone: customers.phone,
      petName: pets.name,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petAvatarUrl: pets.avatarUrl,
    } as const;
  }

  async list(dto: ListBookingsDto): Promise<BookingListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (dto.date) {
      const { start, end } = this.parseVietnamDate(dto.date);
      conditions.push(gte(bookings.scheduledAt, start));
      conditions.push(lt(bookings.scheduledAt, end));
    }

    if (!dto.date && dto.dateFrom) {
      const { start } = this.parseVietnamDate(dto.dateFrom);
      conditions.push(gte(bookings.scheduledAt, start));
    }

    if (!dto.date && dto.dateTo) {
      const { end } = this.parseVietnamDate(dto.dateTo);
      conditions.push(lt(bookings.scheduledAt, end));
    }

    if (dto.status) {
      conditions.push(eq(bookings.status, dto.status as BookingStatusValue));
    }

    if (dto.serviceType) {
      conditions.push(eq(bookings.serviceType, dto.serviceType as BookingServiceValue));
    }

    if (dto.customerId) {
      conditions.push(eq(bookings.customerId, dto.customerId));
    }

    if (dto.petId) {
      conditions.push(eq(bookings.petId, dto.petId));
    }

    if (dto.search) {
      const searchCond = or(
        ilike(customers.fullName, `%${dto.search}%`),
        ilike(pets.name, `%${dto.search}%`),
      );
      if (searchCond) conditions.push(searchCond);
    }

    const whereClause = and(...conditions);

    const orderByCol =
      dto.sortBy === 'createdAt' ? bookings.createdAt : bookings.scheduledAt;
    const orderFn = dto.sortOrder === 'desc' ? desc(orderByCol) : asc(orderByCol);

    const [rows, countRows] = await Promise.all([
      this.db
        .select(this.buildJoinSelect())
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .innerJoin(pets, eq(bookings.petId, pets.id))
        .where(whereClause)
        .orderBy(orderFn)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .innerJoin(pets, eq(bookings.petId, pets.id))
        .where(whereClause),
    ]);

    const total = countRows[0]?.total ?? 0;

    return {
      data: rows.map((r) => this.mapToResponse(r)),
      total,
      page,
      limit,
    };
  }

  async getOne(id: string): Promise<BookingResponse> {
    const rows = await this.db
      .select(this.buildJoinSelect())
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(eq(bookings.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy lịch khám');
    }

    return this.mapToResponse(rows[0]);
  }

  async create(dto: CreateBookingDto, adminId: string): Promise<BookingResponse> {
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

    const scheduledAt = new Date(dto.scheduledAt);

    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Thời gian đặt lịch phải trong tương lai');
    }

    const { hour, minute } = this.getVietnamHourMinute(scheduledAt);
    if (
      hour < SLOT_START_HOUR ||
      hour >= SLOT_END_HOUR ||
      minute % SLOT_DURATION_MINUTES !== 0
    ) {
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
          inArray(bookings.status, ACTIVE_SLOT_STATUSES),
        ),
      );

    const customerDuplicate = existingAtSlot.find((b) => b.customerId === dto.customerId);
    if (customerDuplicate) {
      throw new ConflictException('Khách hàng này đã có lịch khám trong khung giờ đó');
    }

    if (existingAtSlot.length >= MAX_BOOKINGS_PER_SLOT && !dto.overrideSlotFull) {
      throw new ConflictException(
        `Khung giờ này đã đủ ${MAX_BOOKINGS_PER_SLOT} lịch. Đặt overrideSlotFull=true để tiếp tục`,
      );
    }

    const displayNumber = await generateDisplayNumber('BKG', scheduledAt);

    const [inserted] = await this.db
      .insert(bookings)
      .values({
        displayNumber,
        customerId: dto.customerId,
        petId: dto.petId,
        serviceType: dto.serviceType as BookingServiceValue,
        scheduledAt,
        durationMinutes: dto.durationMinutes ?? 30,
        status: 'pending',
        source: (dto.source as BookingSourceValue | undefined) ?? 'admin',
        notes: dto.notes,
        adminNotes: dto.adminNotes,
        createdBy: adminId,
      })
      .returning({ id: bookings.id });

    const created = await this.getOne(inserted.id);
    this.aiService.invalidateCustomerContext(dto.customerId).catch(() => {});
    return created;
  }

  async update(id: string, dto: UpdateBookingDto): Promise<BookingResponse> {
    const rows = await this.db
      .select({ status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy lịch khám');
    }

    if (TERMINAL_STATUSES.includes(rows[0].status)) {
      throw new BadRequestException(
        'Không thể chỉnh sửa lịch khám đã hoàn thành, huỷ, hoặc không đến',
      );
    }

    const updateFields: Partial<typeof bookings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.serviceType !== undefined) {
      updateFields.serviceType = dto.serviceType as BookingServiceValue;
    }

    if (dto.scheduledAt !== undefined) {
      const newScheduledAt = new Date(dto.scheduledAt);
      if (newScheduledAt <= new Date()) {
        throw new BadRequestException('Thời gian đặt lịch phải trong tương lai');
      }
      updateFields.scheduledAt = newScheduledAt;
    }

    if (dto.durationMinutes !== undefined) {
      updateFields.durationMinutes = dto.durationMinutes;
    }

    if (dto.notes !== undefined) updateFields.notes = dto.notes;
    if (dto.adminNotes !== undefined) updateFields.adminNotes = dto.adminNotes;

    await this.db.update(bookings).set(updateFields).where(eq(bookings.id, id));

    return this.getOne(id);
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    adminId: string,
  ): Promise<BookingResponse> {
    const rows = await this.db
      .select({
        booking: bookings,
        customerEmail: customers.email,
        customerFullName: customers.fullName,
        petName: pets.name,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(eq(bookings.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy lịch khám');
    }

    const { booking, customerEmail, customerFullName, petName } = rows[0];
    const currentStatus = booking.status;
    const newStatus = dto.status as BookingStatusValue;

    const validNext = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validNext.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ "${STATUS_LABELS[currentStatus]}" sang "${STATUS_LABELS[newStatus]}"`,
      );
    }

    const now = new Date();
    const updateFields: Partial<typeof bookings.$inferInsert> = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'confirmed') updateFields.confirmedAt = now;
    if (newStatus === 'checked_in') updateFields.checkedInAt = now;
    if (newStatus === 'completed') updateFields.completedAt = now;
    if (newStatus === 'cancelled') {
      updateFields.cancelledAt = now;
      updateFields.cancelledBy = 'admin';
      updateFields.cancelledReason = dto.cancelledReason ?? null;
    }

    await this.db.update(bookings).set(updateFields).where(eq(bookings.id, id));

    if (newStatus === 'confirmed' || newStatus === 'cancelled') {
      this.aiService.invalidateCustomerContext(booking.customerId).catch(() => {});
    }

    if (newStatus === 'confirmed' && customerEmail) {
      await this.sendConfirmationEmail(
        customerEmail,
        customerFullName,
        petName,
        booking.displayNumber,
        booking.scheduledAt,
      );
    }

    if (newStatus === 'completed') {
      await this.createDraftInvoice(booking.id, booking.customerId, booking.petId, adminId);
    }

    return this.getOne(id);
  }

  async cancel(id: string): Promise<void> {
    const rows = await this.db
      .select({ status: bookings.status, customerId: bookings.customerId })
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy lịch khám');
    }

    if (!CANCELLABLE_STATUSES.includes(rows[0].status)) {
      throw new BadRequestException(
        'Chỉ có thể huỷ lịch ở trạng thái chờ xác nhận hoặc đã xác nhận',
      );
    }

    const now = new Date();
    await this.db
      .update(bookings)
      .set({ status: 'cancelled', cancelledAt: now, cancelledBy: 'admin', updatedAt: now })
      .where(eq(bookings.id, id));

    this.aiService.invalidateCustomerContext(rows[0].customerId).catch(() => {});
  }

  async getSlots(date: string, customerId?: string): Promise<TimeSlot[]> {
    const { start, end } = this.parseVietnamDate(date);

    const activeRows = await this.db
      .select({
        scheduledAt: bookings.scheduledAt,
        customerId: bookings.customerId,
        displayNumber: bookings.displayNumber,
        customerFullName: customers.fullName,
        petName: pets.name,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(
        and(
          gte(bookings.scheduledAt, start),
          lt(bookings.scheduledAt, end),
          inArray(bookings.status, ACTIVE_SLOT_STATUSES),
        ),
      );

    type SlotRow = (typeof activeRows)[number];
    const slotMap = new Map<string, SlotRow[]>();

    for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
      slotMap.set(`${String(h).padStart(2, '0')}:00`, []);
      slotMap.set(`${String(h).padStart(2, '0')}:30`, []);
    }

    for (const row of activeRows) {
      const { hour, minute } = this.getVietnamHourMinute(row.scheduledAt);
      const slotKey = `${String(hour).padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
      const bucket = slotMap.get(slotKey);
      if (bucket) bucket.push(row);
    }

    return Array.from(slotMap.entries()).map(([time, slotRows]) => ({
      time,
      bookingCount: slotRows.length,
      available: slotRows.length < MAX_BOOKINGS_PER_SLOT,
      customerAlreadyBooked: customerId
        ? slotRows.some((r) => r.customerId === customerId)
        : false,
      bookings: slotRows.map((r) => ({
        displayNumber: r.displayNumber,
        customerName: r.customerFullName,
        petName: r.petName,
      })),
    }));
  }

  async getToday(): Promise<BookingResponse[]> {
    const { start, end } = this.getVietnamDayBounds(new Date());

    const rows = await this.db
      .select(this.buildJoinSelect())
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(and(gte(bookings.scheduledAt, start), lt(bookings.scheduledAt, end)))
      .orderBy(asc(bookings.scheduledAt));

    return rows.map((r) => this.mapToResponse(r));
  }

  async getUpcomingFollowups(): Promise<BookingResponse[]> {
    const rows = await this.db
      .select(this.buildJoinSelect())
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(
        and(
          eq(bookings.serviceType, 'followup'),
          gte(bookings.scheduledAt, new Date()),
          inArray(bookings.status, ['pending', 'confirmed']),
        ),
      )
      .orderBy(asc(bookings.scheduledAt));

    return rows.map((r) => this.mapToResponse(r));
  }

  async sendReminderEmails(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { start, end } = this.getVietnamDayBounds(tomorrow);

    const rows = await this.db
      .select({
        booking: bookings,
        customerEmail: customers.email,
        customerFullName: customers.fullName,
        petName: pets.name,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(pets, eq(bookings.petId, pets.id))
      .where(
        and(
          gte(bookings.scheduledAt, start),
          lt(bookings.scheduledAt, end),
          eq(bookings.status, 'confirmed'),
        ),
      );

    const emailPromises = rows
      .filter((r) => r.customerEmail !== null)
      .map((r) =>
        this.resend.emails.send({
          from: 'Phòng Khám Thú Y Bác Sĩ Lục <noreply@phongkhamthuyluc.com>',
          to: r.customerEmail as string,
          subject: `Nhắc lịch khám ngày mai — ${r.booking.displayNumber}`,
          html: `<p>Xin chào ${r.customerFullName},</p>
<p>Nhắc nhở lịch khám <strong>${r.booking.displayNumber}</strong> cho <strong>${r.petName}</strong> vào lúc <strong>${this.formatVNTime(r.booking.scheduledAt)}</strong> ngày mai.</p>
<p>Địa chỉ: 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM. SĐT: 028 3873 0496</p>`,
        }),
      );

    await Promise.allSettled(emailPromises);
  }

  private async sendConfirmationEmail(
    email: string,
    customerName: string,
    petName: string,
    displayNumber: string,
    scheduledAt: Date,
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'Phòng Khám Thú Y Bác Sĩ Lục <noreply@phongkhamthuyluc.com>',
      to: email,
      subject: `Lịch khám ${displayNumber} đã được xác nhận`,
      html: `<p>Xin chào ${customerName},</p>
<p>Lịch khám <strong>${displayNumber}</strong> cho <strong>${petName}</strong> vào lúc <strong>${this.formatVNTime(scheduledAt)}</strong> đã được xác nhận.</p>
<p>Địa chỉ: 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM. SĐT: 028 3873 0496</p>`,
    });
  }

  private async createDraftInvoice(
    bookingId: string,
    customerId: string,
    petId: string,
    adminId: string,
  ): Promise<void> {
    const displayNumber = await generateDisplayNumber('INV', new Date());
    await this.db.insert(invoices).values({
      displayNumber,
      bookingId,
      customerId,
      petId,
      lineItems: [],
      subtotal: 0,
      discountAmount: 0,
      totalAmount: 0,
      paymentStatus: 'pending',
      createdBy: adminId,
    });
  }
}
