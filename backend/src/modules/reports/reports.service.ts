import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as path from 'path';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { bookings } from '../../database/schema/bookings.schema';
import { invoices } from '../../database/schema/invoices.schema';
import { customers } from '../../database/schema/customers.schema';
import { pets } from '../../database/schema/pets.schema';
import { medicalRecords } from '../../database/schema/medical-records.schema';
import { DailyReportDto } from './dto/daily-report.dto';
import { WeeklyReportDto } from './dto/weekly-report.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';
import {
  DailyReportResponse,
  DailySummary,
  MonthlyReportResponse,
  MonthlyWeekSummary,
  RevenueByCategory,
  RevenueByMethod,
  ScheduleItem,
  SummaryResponse,
  WeeklyDaySummary,
  WeeklyReportResponse,
} from './types/report-response.type';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

interface InvoiceRow {
  totalAmount:   number;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAmount:    number;
  lineItems:     unknown;
}

interface RawLineItem {
  category:  string;
  total:     number;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style:                'currency',
      currency:             'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private parseVnDate(dateStr: string): { start: Date; end: Date } {
    const parts = dateStr.split('-').map(Number);
    const [year, month, day] = parts;
    const utcMidnight = Date.UTC(year, month - 1, day);
    const start = new Date(utcMidnight - VN_OFFSET_MS);
    const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private toVnDateString(date: Date): string {
    const vnMs   = date.getTime() + VN_OFFSET_MS;
    const vnDate = new Date(vnMs);
    const y = vnDate.getUTCFullYear();
    const m = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(vnDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private computeRevenue(invoiceRows: InvoiceRow[]): {
    totalRevenue:    number;
    paidRevenue:     number;
    pendingRevenue:  number;
    revenueByMethod: RevenueByMethod;
    revenueByCategory: RevenueByCategory;
  } {
    const revenueByMethod: RevenueByMethod = {
      cash:          0,
      bank_transfer: 0,
      momo:          0,
      zalopay:       0,
      other:         0,
    };

    const revenueByCategory: RevenueByCategory = {
      examination: 0,
      medication:  0,
      lab:         0,
      surgery:     0,
      grooming:    0,
      other:       0,
    };

    let totalRevenue   = 0;
    let paidRevenue    = 0;
    let pendingRevenue = 0;

    for (const inv of invoiceRows) {
      totalRevenue += inv.totalAmount;

      const isPaid = inv.paymentStatus === 'paid' || inv.paymentStatus === 'partially_paid';
      if (isPaid) {
        paidRevenue += inv.paidAmount;
      } else {
        pendingRevenue += inv.totalAmount;
      }

      if (inv.paymentMethod && inv.paymentMethod in revenueByMethod) {
        revenueByMethod[inv.paymentMethod as keyof RevenueByMethod] += inv.totalAmount;
      }

      const rawItems = Array.isArray(inv.lineItems) ? (inv.lineItems as RawLineItem[]) : [];
      for (const item of rawItems) {
        const cat = item.category in revenueByCategory ? item.category as keyof RevenueByCategory : 'other';
        revenueByCategory[cat] += item.total;
      }
    }

    return { totalRevenue, paidRevenue, pendingRevenue, revenueByMethod, revenueByCategory };
  }

  private buildDailySummary(params: {
    totalBookings:     number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings:    number;
    newCustomers:      number;
    totalRevenue:      number;
    paidRevenue:       number;
    pendingRevenue:    number;
  }): DailySummary {
    return {
      totalBookings:       params.totalBookings,
      completedBookings:   params.completedBookings,
      cancelledBookings:   params.cancelledBookings,
      noShowBookings:      params.noShowBookings,
      newCustomers:        params.newCustomers,
      totalRevenue:        params.totalRevenue,
      totalRevenueDisplay: this.formatVND(params.totalRevenue),
      paidRevenue:         params.paidRevenue,
      pendingRevenue:      params.pendingRevenue,
    };
  }

  private async fetchDayData(start: Date, end: Date): Promise<{
    totalBookings:     number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings:    number;
    newCustomers:      number;
    invoiceRows:       InvoiceRow[];
  }> {
    const [bookingRows, customerRows, invoiceRows] = await Promise.all([
      this.db
        .select({ status: bookings.status, count: sql<number>`COUNT(*)::int` })
        .from(bookings)
        .where(and(gte(bookings.scheduledAt, start), lt(bookings.scheduledAt, end)))
        .groupBy(bookings.status),
      this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(customers)
        .where(and(gte(customers.createdAt, start), lt(customers.createdAt, end))),
      this.db
        .select({
          totalAmount:   invoices.totalAmount,
          paymentStatus: invoices.paymentStatus,
          paymentMethod: invoices.paymentMethod,
          paidAmount:    invoices.paidAmount,
          lineItems:     invoices.lineItems,
        })
        .from(invoices)
        .where(and(gte(invoices.createdAt, start), lt(invoices.createdAt, end))),
    ]);

    let totalBookings     = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let noShowBookings    = 0;

    for (const row of bookingRows) {
      totalBookings += row.count;
      if (row.status === 'completed')  completedBookings = row.count;
      if (row.status === 'cancelled')  cancelledBookings = row.count;
      if (row.status === 'no_show')    noShowBookings    = row.count;
    }

    const newCustomers = customerRows[0]?.count ?? 0;

    return { totalBookings, completedBookings, cancelledBookings, noShowBookings, newCustomers, invoiceRows };
  }

  async daily(dto: DailyReportDto): Promise<DailyReportResponse> {
    const { start, end } = this.parseVnDate(dto.date);

    const dayData = await this.fetchDayData(start, end);
    const revenue = this.computeRevenue(dayData.invoiceRows);

    const summary = this.buildDailySummary({
      totalBookings:     dayData.totalBookings,
      completedBookings: dayData.completedBookings,
      cancelledBookings: dayData.cancelledBookings,
      noShowBookings:    dayData.noShowBookings,
      newCustomers:      dayData.newCustomers,
      totalRevenue:      revenue.totalRevenue,
      paidRevenue:       revenue.paidRevenue,
      pendingRevenue:    revenue.pendingRevenue,
    });

    return {
      date:              dto.date,
      summary,
      revenueByMethod:   revenue.revenueByMethod,
      revenueByCategory: revenue.revenueByCategory,
    };
  }

  async weekly(dto: WeeklyReportDto): Promise<WeeklyReportResponse> {
    const DAY_MS      = 24 * 60 * 60 * 1000;
    const weekStartMs = this.parseVnDate(dto.weekStart).start.getTime();
    const weekEndDate = new Date(weekStartMs + 7 * DAY_MS);

    const byDay: WeeklyDaySummary[] = [];

    let aggTotal     = 0;
    let aggCompleted = 0;
    let aggCancelled = 0;
    let aggNoShow    = 0;
    let aggCustomers = 0;
    let aggRevenue   = 0;
    let aggPaid      = 0;
    let aggPending   = 0;

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStartMs + i * DAY_MS);
      const dayEnd   = new Date(weekStartMs + (i + 1) * DAY_MS);
      const dateStr  = this.toVnDateString(dayStart);

      const dayData = await this.fetchDayData(dayStart, dayEnd);
      const revenue = this.computeRevenue(dayData.invoiceRows);

      byDay.push({
        date:              dateStr,
        totalBookings:     dayData.totalBookings,
        completedBookings: dayData.completedBookings,
        revenue:           revenue.totalRevenue,
        revenueDisplay:    this.formatVND(revenue.totalRevenue),
      });

      aggTotal     += dayData.totalBookings;
      aggCompleted += dayData.completedBookings;
      aggCancelled += dayData.cancelledBookings;
      aggNoShow    += dayData.noShowBookings;
      aggCustomers += dayData.newCustomers;
      aggRevenue   += revenue.totalRevenue;
      aggPaid      += revenue.paidRevenue;
      aggPending   += revenue.pendingRevenue;
    }

    const summary = this.buildDailySummary({
      totalBookings:     aggTotal,
      completedBookings: aggCompleted,
      cancelledBookings: aggCancelled,
      noShowBookings:    aggNoShow,
      newCustomers:      aggCustomers,
      totalRevenue:      aggRevenue,
      paidRevenue:       aggPaid,
      pendingRevenue:    aggPending,
    });

    return {
      weekStart: dto.weekStart,
      weekEnd:   this.toVnDateString(new Date(weekEndDate.getTime() - 1)),
      summary,
      byDay,
    };
  }

  async monthly(dto: MonthlyReportDto): Promise<MonthlyReportResponse> {
    const DAY_MS       = 24 * 60 * 60 * 1000;
    const daysInMonth  = new Date(dto.year, dto.month, 0).getDate();

    const monthStart = this.parseVnDate(`${dto.year}-${String(dto.month).padStart(2, '0')}-01`).start;

    let aggTotal     = 0;
    let aggCompleted = 0;
    let aggCancelled = 0;
    let aggNoShow    = 0;
    let aggCustomers = 0;
    let aggRevenue   = 0;
    let aggPaid      = 0;
    let aggPending   = 0;

    const weekMap = new Map<string, MonthlyWeekSummary>();

    for (let day = 0; day < daysInMonth; day++) {
      const dayStart = new Date(monthStart.getTime() + day * DAY_MS);
      const dayEnd   = new Date(dayStart.getTime() + DAY_MS);

      const vnMs   = dayStart.getTime() + VN_OFFSET_MS;
      const vnDate = new Date(vnMs);

      const dayOfWeek   = vnDate.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const mondayMs    = vnMs + mondayOffset * DAY_MS;
      const mondayUtc   = new Date(mondayMs - VN_OFFSET_MS);
      const sundayUtc   = new Date(mondayUtc.getTime() + 6 * DAY_MS);
      const weekKey     = this.toVnDateString(mondayUtc);

      const dayData = await this.fetchDayData(dayStart, dayEnd);
      const revenue = this.computeRevenue(dayData.invoiceRows);

      const existing = weekMap.get(weekKey);
      if (existing) {
        existing.totalBookings     += dayData.totalBookings;
        existing.completedBookings += dayData.completedBookings;
        existing.revenue           += revenue.totalRevenue;
        existing.revenueDisplay     = this.formatVND(existing.revenue);
      } else {
        weekMap.set(weekKey, {
          weekStart:         weekKey,
          weekEnd:           this.toVnDateString(sundayUtc),
          totalBookings:     dayData.totalBookings,
          completedBookings: dayData.completedBookings,
          revenue:           revenue.totalRevenue,
          revenueDisplay:    this.formatVND(revenue.totalRevenue),
        });
      }

      aggTotal     += dayData.totalBookings;
      aggCompleted += dayData.completedBookings;
      aggCancelled += dayData.cancelledBookings;
      aggNoShow    += dayData.noShowBookings;
      aggCustomers += dayData.newCustomers;
      aggRevenue   += revenue.totalRevenue;
      aggPaid      += revenue.paidRevenue;
      aggPending   += revenue.pendingRevenue;
    }

    const summary = this.buildDailySummary({
      totalBookings:     aggTotal,
      completedBookings: aggCompleted,
      cancelledBookings: aggCancelled,
      noShowBookings:    aggNoShow,
      newCustomers:      aggCustomers,
      totalRevenue:      aggRevenue,
      paidRevenue:       aggPaid,
      pendingRevenue:    aggPending,
    });

    return {
      year:    dto.year,
      month:   dto.month,
      summary,
      byWeek:  Array.from(weekMap.values()),
    };
  }

  async summary(): Promise<SummaryResponse> {
    const now          = new Date();
    const vnMs         = now.getTime() + VN_OFFSET_MS;
    const vnDate       = new Date(vnMs);
    const todayDateStr = `${vnDate.getUTCFullYear()}-${String(vnDate.getUTCMonth() + 1).padStart(2, '0')}-${String(vnDate.getUTCDate()).padStart(2, '0')}`;

    const { start: todayStart, end: todayEnd } = this.parseVnDate(todayDateStr);

    const UPCOMING_SCHEDULE_STATUSES = ['confirmed', 'pending', 'checked_in'] as const;
    const UNPAID_STATUSES            = ['pending', 'partially_paid'] as const;

    const [
      bookingCountRows,
      pendingBookingsRows,
      invoicesToProcessRows,
      unpaidInvoicesRows,
      scheduleRows,
      todayPaidInvoiceRows,
      followupRows,
    ] = await Promise.all([
      this.db
        .select({ status: bookings.status, count: sql<number>`COUNT(*)::int` })
        .from(bookings)
        .where(and(gte(bookings.scheduledAt, todayStart), lt(bookings.scheduledAt, todayEnd)))
        .groupBy(bookings.status),

      this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(bookings)
        .where(eq(bookings.status, 'pending')),

      this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, 'completed'),
            sql`NOT EXISTS (SELECT 1 FROM invoices WHERE invoices.booking_id = ${bookings.id})`,
          ),
        ),

      this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(invoices)
        .where(inArray(invoices.paymentStatus, [...UNPAID_STATUSES])),

      this.db
        .select({
          scheduledAt:   bookings.scheduledAt,
          displayNumber: bookings.displayNumber,
          petName:       pets.name,
          ownerName:     customers.fullName,
          serviceType:   bookings.serviceType,
        })
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .innerJoin(pets, eq(bookings.petId, pets.id))
        .where(
          and(
            gte(bookings.scheduledAt, todayStart),
            lt(bookings.scheduledAt, todayEnd),
            inArray(bookings.status, [...UPCOMING_SCHEDULE_STATUSES]),
            gte(bookings.scheduledAt, now),
          ),
        )
        .orderBy(asc(bookings.scheduledAt))
        .limit(3),

      this.db
        .select({ paidAmount: invoices.paidAmount })
        .from(invoices)
        .where(
          and(
            gte(invoices.createdAt, todayStart),
            lt(invoices.createdAt, todayEnd),
            inArray(invoices.paymentStatus, ['paid', 'partially_paid']),
          ),
        ),

      this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(medicalRecords)
        .where(eq(medicalRecords.followupDate, todayDateStr)),
    ]);

    let todayTotal     = 0;
    let todayCompleted = 0;
    for (const row of bookingCountRows) {
      todayTotal += row.count;
      if (row.status === 'completed') todayCompleted = row.count;
    }

    const todayRevenue = todayPaidInvoiceRows.reduce((sum, row) => sum + row.paidAmount, 0);

    const scheduleItems: ScheduleItem[] = scheduleRows.map((row) => {
      const vnRowMs  = row.scheduledAt.getTime() + VN_OFFSET_MS;
      const vnRowDate = new Date(vnRowMs);
      const hour     = String(vnRowDate.getUTCHours()).padStart(2, '0');
      const minute   = String(vnRowDate.getUTCMinutes()).padStart(2, '0');

      return {
        time:          `${hour}:${minute}`,
        displayNumber: row.displayNumber,
        petName:       row.petName,
        ownerName:     row.ownerName,
        service:       row.serviceType,
      };
    });

    const followupCount = followupRows[0]?.count ?? 0;
    const alerts = followupCount > 0
      ? [{ type: 'followup_due', message: `${followupCount} thú cưng cần tái khám hôm nay` }]
      : [];

    return {
      today: {
        bookings:       todayTotal,
        completed:      todayCompleted,
        revenue:        todayRevenue,
        revenueDisplay: this.formatVND(todayRevenue),
      },
      pendingActions: {
        bookingsToConfirm: pendingBookingsRows[0]?.count ?? 0,
        invoicesToProcess: invoicesToProcessRows[0]?.count ?? 0,
        unpaidInvoices:    unpaidInvoicesRows[0]?.count   ?? 0,
      },
      todaysSchedule: scheduleItems,
      alerts,
    };
  }

  private get fontPath(): string {
    return path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf');
  }

  async exportDailyPdf(dto: DailyReportDto): Promise<Buffer> {
    const report = await this.daily(dto);

    const PAYMENT_METHOD_LABELS: Record<string, string> = {
      cash: 'Tien mat',
      bank_transfer: 'Chuyen khoan',
      momo: 'MoMo',
      zalopay: 'ZaloPay',
      other: 'Khac',
    };

    const CATEGORY_LABELS: Record<string, string> = {
      examination: 'Phi kham',
      medication: 'Thuoc',
      lab: 'Xet nghiem',
      surgery: 'Phau thuat',
      grooming: 'Grooming',
      other: 'Khac',
    };

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const font = this.fontPath;

      doc.font(font).fontSize(18).text('BAO CAO NGAY', { align: 'center' });
      doc.font(font).fontSize(12).text('Phong Kham Thu Y Bac Si Luc', { align: 'center' });
      doc.font(font).fontSize(11).text('990 Huynh Tan Phat, Tan My, TP. Ho Chi Minh', { align: 'center' });
      doc.font(font).fontSize(11).text(`Ngay: ${report.date}`, { align: 'center' });
      doc.moveDown();

      doc.font(font).fontSize(13).text('TONG QUAN', { underline: true });
      doc.moveDown(0.3);

      const summaryRows: [string, string][] = [
        ['Tong lich hen', String(report.summary.totalBookings)],
        ['Hoan thanh', String(report.summary.completedBookings)],
        ['Da huy', String(report.summary.cancelledBookings)],
        ['Khong den', String(report.summary.noShowBookings)],
        ['Khach hang moi', String(report.summary.newCustomers)],
        ['Tong doanh thu', report.summary.totalRevenueDisplay],
        ['Da thu', this.formatVND(report.summary.paidRevenue)],
        ['Cho thu', this.formatVND(report.summary.pendingRevenue)],
      ];

      for (const [label, value] of summaryRows) {
        doc.font(font).fontSize(11).text(`${label}: ${value}`);
      }

      doc.moveDown();
      doc.font(font).fontSize(13).text('DOANH THU THEO PHUONG THUC THANH TOAN', { underline: true });
      doc.moveDown(0.3);

      for (const [key, value] of Object.entries(report.revenueByMethod)) {
        const label = PAYMENT_METHOD_LABELS[key] ?? key;
        doc.font(font).fontSize(11).text(`${label}: ${this.formatVND(value)}`);
      }

      doc.moveDown();
      doc.font(font).fontSize(13).text('DOANH THU THEO DANH MUC', { underline: true });
      doc.moveDown(0.3);

      for (const [key, value] of Object.entries(report.revenueByCategory)) {
        const label = CATEGORY_LABELS[key] ?? key;
        doc.font(font).fontSize(11).text(`${label}: ${this.formatVND(value)}`);
      }

      doc.end();
    });
  }

  async exportMonthlyExcel(dto: MonthlyReportDto): Promise<Buffer> {
    const report = await this.monthly(dto);
    const monthLabel = `${String(dto.month).padStart(2, '0')}/${dto.year}`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Phong Kham Thu Y Bac Si Luc';

    const summarySheet = workbook.addWorksheet('Tong hop');
    summarySheet.columns = [
      { header: 'Chi so', key: 'label', width: 30 },
      { header: 'Gia tri', key: 'value', width: 20 },
    ];
    summarySheet.getRow(1).font = { bold: true };

    summarySheet.addRows([
      { label: 'Thang', value: monthLabel },
      { label: 'Tong lich hen', value: report.summary.totalBookings },
      { label: 'Hoan thanh', value: report.summary.completedBookings },
      { label: 'Da huy', value: report.summary.cancelledBookings },
      { label: 'Khong den', value: report.summary.noShowBookings },
      { label: 'Khach hang moi', value: report.summary.newCustomers },
      { label: 'Tong doanh thu (VND)', value: report.summary.totalRevenue },
      { label: 'Da thu (VND)', value: report.summary.paidRevenue },
      { label: 'Cho thu (VND)', value: report.summary.pendingRevenue },
    ]);

    const weekSheet = workbook.addWorksheet('Theo tuan');
    weekSheet.columns = [
      { header: 'Tuan', key: 'week', width: 8 },
      { header: 'Tu ngay', key: 'weekStart', width: 14 },
      { header: 'Den ngay', key: 'weekEnd', width: 14 },
      { header: 'Tong lich hen', key: 'totalBookings', width: 16 },
      { header: 'Hoan thanh', key: 'completedBookings', width: 14 },
      { header: 'Doanh thu (VND)', key: 'revenue', width: 20 },
    ];
    weekSheet.getRow(1).font = { bold: true };

    report.byWeek.forEach((w, idx) => {
      weekSheet.addRow({
        week: idx + 1,
        weekStart: w.weekStart,
        weekEnd: w.weekEnd,
        totalBookings: w.totalBookings,
        completedBookings: w.completedBookings,
        revenue: w.revenue,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
