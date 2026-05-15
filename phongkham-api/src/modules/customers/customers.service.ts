import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { customers } from '../../database/schema/customers.schema';
import { pets } from '../../database/schema/pets.schema';
import { bookings } from '../../database/schema/bookings.schema';
import { invoices } from '../../database/schema/invoices.schema';
import { AuthService } from '../auth/auth.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';
import {
  CustomerListItem,
  CustomerListResponse,
  CustomerResponse,
  CustomerStatsResponse,
} from './types/customer-response.type';

interface CustomerWithStats {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  isActive: boolean;
  passwordHash: string | null;
  address: string | null;
  internalNotes: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  totalVisits: number;
  totalSpent: number;
  petsCount: number;
  lastVisitAt: Date | null;
}

@Injectable()
export class CustomersService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly authService: AuthService,
  ) {}

  private buildStatsSelect() {
    return {
      id: customers.id,
      phone: customers.phone,
      fullName: customers.fullName,
      email: customers.email,
      isActive: customers.isActive,
      passwordHash: customers.passwordHash,
      address: customers.address,
      internalNotes: customers.internalNotes,
      lastLoginAt: customers.lastLoginAt,
      createdAt: customers.createdAt,
      totalVisits: sql<number>`COUNT(DISTINCT CASE WHEN ${bookings.status} = 'completed' THEN ${bookings.id} END)::int`,
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.paymentStatus} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)::bigint`,
      petsCount: sql<number>`COUNT(DISTINCT CASE WHEN ${pets.deletedAt} IS NULL THEN ${pets.id} END)::int`,
      lastVisitAt: sql<Date | null>`MAX(CASE WHEN ${bookings.status} = 'completed' THEN ${bookings.scheduledAt} END)`,
    } as const;
  }

  private mapToListItem(row: CustomerWithStats): CustomerListItem {
    const stats: CustomerStatsResponse = {
      totalVisits: row.totalVisits,
      totalSpent: row.totalSpent,
      lastVisitDate: row.lastVisitAt ? row.lastVisitAt.toISOString().split('T')[0] : null,
      petsCount: row.petsCount,
    };

    return {
      id: row.id,
      phone: row.phone,
      fullName: row.fullName,
      email: row.email,
      isActive: row.isActive,
      hasAccount: row.passwordHash !== null,
      stats,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapToResponse(row: CustomerWithStats): CustomerResponse {
    return {
      ...this.mapToListItem(row),
      address: row.address,
      internalNotes: row.internalNotes,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    };
  }

  async list(dto: ListCustomersDto): Promise<CustomerListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [isNull(customers.deletedAt)];

    if (dto.search) {
      const searchCond = or(
        ilike(customers.fullName, `%${dto.search}%`),
        ilike(customers.phone, `%${dto.search}%`),
      );
      if (searchCond) conditions.push(searchCond);
    }

    if (dto.isActive !== undefined) {
      conditions.push(eq(customers.isActive, dto.isActive));
    }

    const whereClause = and(...conditions);

    const [rows, countRows] = await Promise.all([
      this.db
        .select(this.buildStatsSelect())
        .from(customers)
        .leftJoin(bookings, eq(bookings.customerId, customers.id))
        .leftJoin(invoices, eq(invoices.customerId, customers.id))
        .leftJoin(pets, eq(pets.customerId, customers.id))
        .where(whereClause)
        .groupBy(customers.id)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(customers)
        .where(whereClause),
    ]);

    const total = countRows[0]?.total ?? 0;

    return {
      data: rows.map((r) => this.mapToListItem(r as CustomerWithStats)),
      total,
      page,
      limit,
    };
  }

  async getOne(id: string): Promise<CustomerResponse> {
    const rows = await this.db
      .select(this.buildStatsSelect())
      .from(customers)
      .leftJoin(bookings, eq(bookings.customerId, customers.id))
      .leftJoin(invoices, eq(invoices.customerId, customers.id))
      .leftJoin(pets, eq(pets.customerId, customers.id))
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .groupBy(customers.id);

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return this.mapToResponse(rows[0] as CustomerWithStats);
  }

  async create(dto: CreateCustomerDto): Promise<CustomerResponse> {
    const existing = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.phone, dto.phone), isNull(customers.deletedAt)));

    if (existing[0]) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    const [inserted] = await this.db
      .insert(customers)
      .values({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        internalNotes: dto.internalNotes,
      })
      .returning({ id: customers.id });

    return this.getOne(inserted.id);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponse> {
    const customerRows = await this.db
      .select({ id: customers.id, phone: customers.phone })
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)));

    if (!customerRows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    if (dto.phone && dto.phone !== customerRows[0].phone) {
      const phoneConflict = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.phone, dto.phone), isNull(customers.deletedAt)));

      if (phoneConflict[0]) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const updateFields: Partial<typeof customers.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.fullName !== undefined) updateFields.fullName = dto.fullName;
    if (dto.phone !== undefined) updateFields.phone = dto.phone;
    if (dto.email !== undefined) updateFields.email = dto.email;
    if (dto.address !== undefined) updateFields.address = dto.address;
    if (dto.internalNotes !== undefined) updateFields.internalNotes = dto.internalNotes;
    if (dto.isActive !== undefined) updateFields.isActive = dto.isActive;

    await this.db.update(customers).set(updateFields).where(eq(customers.id, id));

    return this.getOne(id);
  }

  async softDelete(id: string): Promise<void> {
    const customerRows = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)));

    if (!customerRows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    await this.db
      .update(customers)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  async getCustomerPets(customerId: string) {
    await this.verifyCustomerExists(customerId);

    return this.db
      .select({
        id: pets.id,
        name: pets.name,
        species: pets.species,
        breed: pets.breed,
        status: pets.status,
        avatarUrl: pets.avatarUrl,
        knownAllergies: pets.knownAllergies,
      })
      .from(pets)
      .where(and(eq(pets.customerId, customerId), isNull(pets.deletedAt)));
  }

  async getCustomerBookings(customerId: string) {
    await this.verifyCustomerExists(customerId);

    return this.db
      .select({
        id: bookings.id,
        displayNumber: bookings.displayNumber,
        scheduledAt: bookings.scheduledAt,
        status: bookings.status,
        serviceType: bookings.serviceType,
        petId: bookings.petId,
        petName: pets.name,
        petSpecies: pets.species,
      })
      .from(bookings)
      .leftJoin(pets, eq(pets.id, bookings.petId))
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.scheduledAt));
  }

  async getStats(customerId: string): Promise<CustomerStatsResponse> {
    await this.verifyCustomerExists(customerId);

    const [stats] = await this.db
      .select({
        totalVisits: sql<number>`COUNT(DISTINCT CASE WHEN ${bookings.status} = 'completed' THEN ${bookings.id} END)::int`,
        totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.paymentStatus} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)::bigint`,
        petsCount: sql<number>`COUNT(DISTINCT CASE WHEN ${pets.deletedAt} IS NULL THEN ${pets.id} END)::int`,
        lastVisitAt: sql<Date | null>`MAX(CASE WHEN ${bookings.status} = 'completed' THEN ${bookings.scheduledAt} END)`,
      })
      .from(customers)
      .leftJoin(bookings, eq(bookings.customerId, customers.id))
      .leftJoin(invoices, eq(invoices.customerId, customers.id))
      .leftJoin(pets, eq(pets.customerId, customers.id))
      .where(eq(customers.id, customerId))
      .groupBy(customers.id);

    return {
      totalVisits: stats?.totalVisits ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      lastVisitDate: stats?.lastVisitAt ? stats.lastVisitAt.toISOString().split('T')[0] : null,
      petsCount: stats?.petsCount ?? 0,
    };
  }

  async sendInvite(customerId: string): Promise<void> {
    await this.verifyCustomerExists(customerId);
    await this.authService.inviteCustomer({ customerId });
  }

  private async verifyCustomerExists(customerId: string): Promise<void> {
    const rows = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), isNull(customers.deletedAt)));

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
  }
}
