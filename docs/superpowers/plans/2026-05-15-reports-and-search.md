# Reports Completion & Medical Records Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the admin reports page (weekly/monthly tabs + PDF/Excel export) and fix medical records search to be server-side.

**Architecture:** Backend-first for each feature: add DTO fields + service logic, then wire up frontend types → API calls → hooks → UI. The PDF export uses pdfkit with embedded Roboto font for Vietnamese support; Excel uses exceljs.

**Tech Stack:** NestJS/Fastify (backend), pdfkit, exceljs, React/TanStack Router/Recharts (frontend)

---

## Files Map

### phongkham-api
| File | Action |
|------|--------|
| `src/modules/medical-records/dto/list-medical-records.dto.ts` | Modify — add `petName` |
| `src/modules/medical-records/medical-records.service.ts` | Modify — add ilike, fix count join, add totalPages, nest pet in response |
| `src/modules/reports/reports.service.ts` | Modify — add `exportDailyPdf()`, `exportMonthlyExcel()` |
| `src/modules/reports/reports.controller.ts` | Modify — add 2 export endpoints with `@Res()` |
| `src/assets/fonts/Roboto-Regular.ttf` | Create — download font for pdfkit Unicode support |

### phongkham-web/.tanstack/src
| File | Action |
|------|--------|
| `api/reports.api.ts` | Modify — fix URL bug + add getWeekly, getMonthly, exportDailyReport, exportMonthlyReport |
| `types/report.ts` | Modify — add WeeklyReportResponse, MonthlyReportResponse |
| `hooks/use-reports.ts` | Modify — add useWeeklyReport, useMonthlyReport |
| `types/medical-record.ts` | Modify — add petName to MedicalRecordListParams |
| `routes/admin/_layout/medical-records/index.tsx` | Modify — replace client-side filter with server-side petName param |
| `routes/admin/_layout/reports/index.tsx` | Rewrite — 3 tabs (Ngày/Tuần/Tháng) + export buttons |

---

## Task 1: Fix dashboard URL bug

**Files:**
- Modify: `phongkham-web/.tanstack/src/api/reports.api.ts`

- [ ] **Step 1: Fix the URL**

In `phongkham-web/.tanstack/src/api/reports.api.ts`, change line 6:
```typescript
// Before
const response = await api.get<DashboardSummary>('/admin/reports/dashboard');
// After
const response = await api.get<DashboardSummary>('/admin/reports/summary');
```

- [ ] **Step 2: Commit**
```bash
git add phongkham-web/.tanstack/src/api/reports.api.ts
git commit -m "fix: correct dashboard summary API endpoint URL"
```

---

## Task 2: Install backend libraries

**Files:**
- Modify: `phongkham-api/package.json` (via npm install)

- [ ] **Step 1: Install pdfkit, types, and exceljs**
```bash
cd phongkham-api
npm install pdfkit exceljs
npm install --save-dev @types/pdfkit
```

Expected output: 3 packages added.

- [ ] **Step 2: Add Roboto font for Vietnamese PDF support**

pdfkit's built-in Helvetica does not support Vietnamese diacritics. Download Roboto-Regular.ttf:
```bash
mkdir -p src/assets/fonts
curl -L "https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf" \
  -o src/assets/fonts/Roboto-Regular.ttf
```

If curl is not available, download from https://fonts.google.com/specimen/Roboto, extract `Roboto-Regular.ttf`, and place it at `phongkham-api/src/assets/fonts/Roboto-Regular.ttf`.

- [ ] **Step 3: Commit**
```bash
git add phongkham-api/package.json phongkham-api/package-lock.json phongkham-api/src/assets/fonts/Roboto-Regular.ttf
git commit -m "chore: add pdfkit, exceljs, and Roboto font for report export"
```

---

## Task 3: Medical records — backend petName search

**Files:**
- Modify: `phongkham-api/src/modules/medical-records/dto/list-medical-records.dto.ts`
- Modify: `phongkham-api/src/modules/medical-records/medical-records.service.ts`

- [ ] **Step 1: Add petName to DTO**

Replace the full content of `phongkham-api/src/modules/medical-records/dto/list-medical-records.dto.ts`:
```typescript
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListMedicalRecordsDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsString()
  petName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  requiresAttention?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
```

- [ ] **Step 2: Update service — add petName filter, fix count join, add totalPages, fix list response shape**

In `phongkham-api/src/modules/medical-records/medical-records.service.ts`:

**2a.** Add `ilike` to the drizzle-orm import at the top:
```typescript
import { SQL, and, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
```

**2b.** In the `list()` method, after the `requiresAttention` condition block (around line 169), add:
```typescript
    if (dto.petName !== undefined) {
      conditions.push(ilike(pets.name, `%${dto.petName}%`));
    }
```

**2c.** Update `whereClause` and both queries. Replace the entire `list()` method body from `const page = ...` to `return { data, total, page, limit };` with:

```typescript
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

    if (dto.petName !== undefined) {
      conditions.push(ilike(pets.name, `%${dto.petName}%`));
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
        .innerJoin(pets, eq(pets.id, medicalRecords.petId))
        .where(whereClause),
    ]);

    const total = countRows[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const data: MedicalRecordListItem[] = rows.map((r) => ({
      id: r.id,
      displayNumber: r.displayNumber,
      petId: r.petId,
      pet: {
        name: r.petName,
        species: r.petSpecies,
        ownerName: r.ownerName,
        ownerPhone: r.ownerPhone,
      },
      visitDate: r.visitDate,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      requiresAttention: r.requiresAttention,
      attentionReason: r.attentionReason,
      isSharedWithCustomer: r.isSharedWithCustomer,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data, total, page, limit, totalPages };
  }
```

**2d.** Update `MedicalRecordListItem` and `MedicalRecordListResponse` types in `phongkham-api/src/modules/medical-records/types/medical-record-response.type.ts`:

Replace the existing `MedicalRecordListItem` and `MedicalRecordListResponse` interfaces:
```typescript
export interface MedicalRecordListItem {
  id: string;
  displayNumber: string;
  petId: string;
  pet: {
    name: string;
    species: string;
    ownerName: string;
    ownerPhone: string;
  };
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string | null;
  requiresAttention: boolean;
  attentionReason: string | null;
  isSharedWithCustomer: boolean;
  createdAt: string;
}

export interface MedicalRecordListResponse {
  data: MedicalRecordListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

- [ ] **Step 3: Commit**
```bash
git add phongkham-api/src/modules/medical-records/
git commit -m "feat: add server-side petName search to medical records list"
```

---

## Task 4: Medical records — frontend search fix

**Files:**
- Modify: `phongkham-web/.tanstack/src/types/medical-record.ts`
- Modify: `phongkham-web/.tanstack/src/routes/admin/_layout/medical-records/index.tsx`

- [ ] **Step 1: Add petName to MedicalRecordListParams**

In `phongkham-web/.tanstack/src/types/medical-record.ts`, replace `MedicalRecordListParams`:
```typescript
export interface MedicalRecordListParams {
  petId?: string;
  petName?: string;
  requiresAttention?: boolean;
  page?: number;
  limit?: number;
}
```

Also update `MedicalRecord` to match the list item's `pet` shape (the API returns nested `pet` in list responses):
The existing `MedicalRecord.pet` field uses `MedicalRecordPet` which has more fields than list items return. This is fine — on the list page only `name`, `species`, `ownerName`, `ownerPhone` are accessed.

- [ ] **Step 2: Replace client-side filter with server-side search in the list route**

Replace the full content of `phongkham-web/.tanstack/src/routes/admin/_layout/medical-records/index.tsx`:

```typescript
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMedicalRecords } from '@/hooks/use-medical-records';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/admin/_layout/medical-records/')({
  component: MedicalRecordList,
});

const FIRST_PAGE = 1;

function MedicalRecordList() {
  const [petSearch, setPetSearch] = useState('');
  const [requiresAttention, setRequiresAttention] = useState(false);
  const [page, setPage] = useState(FIRST_PAGE);

  const debouncedPetName = useDebounce(petSearch, 300);

  const { data, isLoading, isError } = useMedicalRecords({
    petName: debouncedPetName || undefined,
    requiresAttention: requiresAttention || undefined,
    page,
  });

  function handlePetSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPetSearch(e.target.value);
    setPage(FIRST_PAGE);
  }

  function handleAttentionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRequiresAttention(e.target.checked);
    setPage(FIRST_PAGE);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh lý</h1>
        <Button asChild>
          <Link to="/admin/medical-records/new">Tạo hồ sơ</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Tìm theo tên thú cưng..."
          value={petSearch}
          onChange={handlePetSearchChange}
          className="max-w-xs"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={requiresAttention}
            onChange={handleAttentionChange}
            className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)]"
          />
          Chỉ hiện cần chú ý
        </label>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải hồ sơ bệnh lý. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hồ sơ</TableHead>
                  <TableHead>Thú cưng</TableHead>
                  <TableHead>Chủ</TableHead>
                  <TableHead>Ngày khám</TableHead>
                  <TableHead>Chẩn đoán</TableHead>
                  <TableHead>Cần chú ý</TableHead>
                  <TableHead>Chia sẻ</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-500">
                      Không có hồ sơ bệnh lý nào.
                    </TableCell>
                  </TableRow>
                )}
                {data.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {record.displayNumber}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">{record.pet.name}</p>
                      <p className="text-xs text-gray-500">{record.pet.species}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-900">{record.pet.ownerName}</p>
                      <p className="text-xs text-gray-500">{record.pet.ownerPhone}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {formatDate(record.visitDate)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-gray-700">
                      {record.diagnosis}
                    </TableCell>
                    <TableCell>
                      {record.requiresAttention && record.attentionReason ? (
                        <Badge variant="destructive">&#9888;&#65039; {record.attentionReason}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.isSharedWithCustomer ? (
                        <Badge className="bg-green-100 text-green-700">&#10003;</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/medical-records/$id" params={{ id: record.id }}>
                          Xem/Sửa
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>
                Trang {data.page} / {data.totalPages} — {data.total} hồ sơ
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= FIRST_PAGE}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add phongkham-web/.tanstack/src/types/medical-record.ts
git add phongkham-web/.tanstack/src/routes/admin/_layout/medical-records/index.tsx
git commit -m "feat: server-side pet name search for medical records list"
```

---

## Task 5: Frontend — report types, API functions, hooks

**Files:**
- Modify: `phongkham-web/.tanstack/src/types/report.ts`
- Modify: `phongkham-web/.tanstack/src/api/reports.api.ts`
- Modify: `phongkham-web/.tanstack/src/hooks/use-reports.ts`

- [ ] **Step 1: Add WeeklyReportResponse and MonthlyReportResponse to types**

Replace full content of `phongkham-web/.tanstack/src/types/report.ts`:
```typescript
export interface ReportSummary {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  newCustomers: number;
  totalRevenue: number;
  totalRevenueDisplay: string;
  paidRevenue: number;
  pendingRevenue: number;
}

export interface DailySummary {
  date: string;
  summary: ReportSummary;
  revenueByMethod: Record<string, number>;
  revenueByCategory: Record<string, number>;
}

export interface WeeklyDaySummary {
  date: string;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  revenueDisplay: string;
}

export interface WeeklyReportResponse {
  weekStart: string;
  weekEnd: string;
  summary: ReportSummary;
  byDay: WeeklyDaySummary[];
}

export interface MonthlyWeekSummary {
  weekStart: string;
  weekEnd: string;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  revenueDisplay: string;
}

export interface MonthlyReportResponse {
  year: number;
  month: number;
  summary: ReportSummary;
  byWeek: MonthlyWeekSummary[];
}

export interface DashboardAlert {
  type: string;
  message: string;
}

export interface ScheduleItem {
  time: string;
  displayNumber: string;
  petName: string;
  ownerName: string;
  service: string;
}

export interface DashboardSummary {
  today: {
    bookings: number;
    completed: number;
    revenue: number;
    revenueDisplay: string;
  };
  pendingActions: {
    bookingsToConfirm: number;
    invoicesToProcess: number;
    unpaidInvoices: number;
  };
  todaysSchedule: ScheduleItem[];
  alerts: DashboardAlert[];
}
```

- [ ] **Step 2: Add API functions**

Replace full content of `phongkham-web/.tanstack/src/api/reports.api.ts`:
```typescript
import { api } from '@/lib/api';
import type {
  DashboardSummary,
  DailySummary,
  WeeklyReportResponse,
  MonthlyReportResponse,
} from '@/types/report';

export async function getDashboard(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/admin/reports/summary');
  return response.data;
}

export async function getDaily(date: string): Promise<DailySummary> {
  const response = await api.get<DailySummary>('/admin/reports/daily', { params: { date } });
  return response.data;
}

export async function getWeekly(weekStart: string): Promise<WeeklyReportResponse> {
  const response = await api.get<WeeklyReportResponse>('/admin/reports/weekly', {
    params: { weekStart },
  });
  return response.data;
}

export async function getMonthly(year: number, month: number): Promise<MonthlyReportResponse> {
  const response = await api.get<MonthlyReportResponse>('/admin/reports/monthly', {
    params: { year, month },
  });
  return response.data;
}

export async function exportDailyReport(date: string): Promise<void> {
  const response = await api.get('/admin/reports/daily/export', {
    params: { date },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-ngay-${date}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportMonthlyReport(year: number, month: number): Promise<void> {
  const response = await api.get('/admin/reports/monthly/export', {
    params: { year, month },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-thang-${year}-${String(month).padStart(2, '0')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Add hooks**

Replace full content of `phongkham-web/.tanstack/src/hooks/use-reports.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '@/api/reports.api';

export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  daily: (date: string) => [...reportKeys.all, 'daily', date] as const,
  weekly: (weekStart: string) => [...reportKeys.all, 'weekly', weekStart] as const,
  monthly: (year: number, month: number) => [...reportKeys.all, 'monthly', year, month] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: () => reportsApi.getDashboard(),
  });
}

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: reportKeys.daily(date),
    queryFn: () => reportsApi.getDaily(date),
    enabled: Boolean(date),
  });
}

export function useWeeklyReport(weekStart: string) {
  return useQuery({
    queryKey: reportKeys.weekly(weekStart),
    queryFn: () => reportsApi.getWeekly(weekStart),
    enabled: Boolean(weekStart),
  });
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: reportKeys.monthly(year, month),
    queryFn: () => reportsApi.getMonthly(year, month),
    enabled: year > 0 && month > 0,
  });
}
```

- [ ] **Step 4: Commit**
```bash
git add phongkham-web/.tanstack/src/types/report.ts
git add phongkham-web/.tanstack/src/api/reports.api.ts
git add phongkham-web/.tanstack/src/hooks/use-reports.ts
git commit -m "feat: add weekly/monthly report types, API functions, and hooks"
```

---

## Task 6: Backend — export endpoints

**Files:**
- Modify: `phongkham-api/src/modules/reports/reports.service.ts`
- Modify: `phongkham-api/src/modules/reports/reports.controller.ts`

- [ ] **Step 1: Add export methods to reports.service.ts**

Add the following imports at the top of `phongkham-api/src/modules/reports/reports.service.ts`:
```typescript
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as path from 'path';
import { DailyReportDto } from './dto/daily-report.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';
```

Note: `DailyReportDto` and `MonthlyReportDto` are already imported — keep existing imports, just add the new ones (`PDFDocument`, `ExcelJS`, `path`).

Add these two methods at the end of the `ReportsService` class (before the closing `}`):

```typescript
  private get fontPath(): string {
    return path.join(__dirname, '../../../assets/fonts/Roboto-Regular.ttf');
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
```

- [ ] **Step 2: Add export endpoints to reports.controller.ts**

Replace the full content of `phongkham-api/src/modules/reports/reports.controller.ts`:
```typescript
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ReportsService } from './reports.service';
import { DailyReportDto } from './dto/daily-report.dto';
import { WeeklyReportDto } from './dto/weekly-report.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';

@Controller('admin/reports')
@UseGuards(AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  summary() {
    return this.reportsService.summary();
  }

  @Get('daily')
  daily(@Query() dto: DailyReportDto) {
    return this.reportsService.daily(dto);
  }

  @Get('weekly')
  weekly(@Query() dto: WeeklyReportDto) {
    return this.reportsService.weekly(dto);
  }

  @Get('monthly')
  monthly(@Query() dto: MonthlyReportDto) {
    return this.reportsService.monthly(dto);
  }

  @Get('daily/export')
  async exportDaily(
    @Query() dto: DailyReportDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const buffer = await this.reportsService.exportDailyPdf(dto);
    void reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="bao-cao-ngay-${dto.date}.pdf"`)
      .send(buffer);
  }

  @Get('monthly/export')
  async exportMonthly(
    @Query() dto: MonthlyReportDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const buffer = await this.reportsService.exportMonthlyExcel(dto);
    void reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header(
        'Content-Disposition',
        `attachment; filename="bao-cao-thang-${dto.year}-${String(dto.month).padStart(2, '0')}.xlsx"`,
      )
      .send(buffer);
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add phongkham-api/src/modules/reports/
git commit -m "feat: add PDF and Excel export endpoints for daily and monthly reports"
```

---

## Task 7: Frontend — reports page rewrite with tabs

**Files:**
- Modify: `phongkham-web/.tanstack/src/routes/admin/_layout/reports/index.tsx`

- [ ] **Step 1: Replace the full content of the reports route**

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useDailyReport, useWeeklyReport, useMonthlyReport } from '@/hooks/use-reports';
import * as reportsApi from '@/api/reports.api';
import { formatVND } from '@/lib/formatVND';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { ReportSummary } from '@/types/report';

export const Route = createFileRoute('/admin/_layout/reports/')({
  component: ReportsPage,
});

const TODAY_DATE = new Date().toISOString().slice(0, 10);
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function getMondayOf(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date.getTime() + diff * 86400000);
  return monday.toISOString().slice(0, 10);
}

const CHART_COLORS = ['#2d6e6e', '#4a9d9d', '#e8a24a', '#f5d5a0', '#6b7280', '#9ca3af'];

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

const MONTH_OPTIONS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
];

function SummaryKpiCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500">Tổng lịch hẹn</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{summary.totalBookings}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500">Hoàn thành</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{summary.completedBookings}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500">Tổng doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-gray-900">{summary.totalRevenueDisplay}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500">Chờ thu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-amber-600">{formatVND(summary.pendingRevenue)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function RevenueBarChart({
  data,
  title,
}: {
  data: { name: string; revenue: number }[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${v / 1000}K`
              }
            />
            <Tooltip formatter={(v: number) => [formatVND(v), 'Doanh thu']} />
            <Bar dataKey="revenue" fill="#2d6e6e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BookingsBarChart({
  data,
  title,
}: {
  data: { name: string; total: number; completed: number }[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" name="Tổng" fill="#4a9d9d" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Hoàn thành" fill="#2d6e6e" radius={[4, 4, 0, 0]} />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DailyView() {
  const [selectedDate, setSelectedDate] = useState(TODAY_DATE);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isError } = useDailyReport(selectedDate);

  const revenueByMethodData = data
    ? Object.entries(data.revenueByMethod).map(([key, value]) => ({
        name: PAYMENT_METHOD_LABELS[key] ?? key,
        value,
      }))
    : [];

  const revenueByCategoryData = data
    ? Object.entries(data.revenueByCategory).map(([key, value]) => ({
        name: CATEGORY_LABELS[key] ?? key,
        value,
      }))
    : [];

  async function handleExport() {
    setIsExporting(true);
    try {
      await reportsApi.exportDailyReport(selectedDate);
    } catch {
      toast({ title: 'Không thể xuất báo cáo', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="daily-date">Chọn ngày</Label>
          <Input
            id="daily-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 w-48"
          />
        </div>
        {data && (
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải báo cáo. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Tổng lịch hẹn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalBookings}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Hoàn thành</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{data.summary.completedBookings}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Đã huỷ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">{data.summary.cancelledBookings}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">KH mới</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{data.summary.newCustomers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-gray-900">{data.summary.totalRevenueDisplay}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Chờ thu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-600">{formatVND(data.summary.pendingRevenue)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {revenueByMethodData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Doanh thu theo phương thức thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={revenueByMethodData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${v / 1000}K`
                        }
                      />
                      <Tooltip formatter={(v: number) => [formatVND(v), 'Doanh thu']} />
                      <Bar dataKey="value" fill="#2d6e6e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {revenueByCategoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Doanh thu theo danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={revenueByCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {revenueByCategoryData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [formatVND(v), 'Doanh thu']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {revenueByMethodData.length === 0 && revenueByCategoryData.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Không có dữ liệu doanh thu cho ngày này.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function WeeklyView() {
  const [weekDate, setWeekDate] = useState(TODAY_DATE);
  const weekStart = getMondayOf(weekDate);

  const { data, isLoading, isError } = useWeeklyReport(weekStart);

  const revenueChartData = data?.byDay.map((d) => {
    const date = new Date(d.date + 'T00:00:00');
    const dayName = DAY_NAMES[date.getDay()];
    return { name: `${dayName} ${d.date.slice(8)}`, revenue: d.revenue };
  }) ?? [];

  const bookingsChartData = data?.byDay.map((d) => {
    const date = new Date(d.date + 'T00:00:00');
    const dayName = DAY_NAMES[date.getDay()];
    return {
      name: `${dayName} ${d.date.slice(8)}`,
      total: d.totalBookings,
      completed: d.completedBookings,
    };
  }) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="week-date">Chọn ngày trong tuần</Label>
        <Input
          id="week-date"
          type="date"
          value={weekDate}
          onChange={(e) => setWeekDate(e.target.value)}
          className="mt-1 w-48"
        />
        {data && (
          <p className="mt-1 text-xs text-gray-500">
            Tuần: {data.weekStart} → {data.weekEnd}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải báo cáo tuần. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <SummaryKpiCards summary={data.summary} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RevenueBarChart data={revenueChartData} title="Doanh thu theo ngày" />
            <BookingsBarChart data={bookingsChartData} title="Lịch hẹn theo ngày" />
          </div>
        </>
      )}
    </div>
  );
}

function MonthlyView() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isError } = useMonthlyReport(year, month);

  const revenueChartData = data?.byWeek.map((w, idx) => ({
    name: `T${idx + 1}`,
    revenue: w.revenue,
  })) ?? [];

  const bookingsChartData = data?.byWeek.map((w, idx) => ({
    name: `T${idx + 1}`,
    total: w.totalBookings,
    completed: w.completedBookings,
  })) ?? [];

  async function handleExport() {
    setIsExporting(true);
    try {
      await reportsApi.exportMonthlyReport(year, month);
    } catch {
      toast({ title: 'Không thể xuất báo cáo', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>Tháng</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="mt-1 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="monthly-year">Năm</Label>
          <Input
            id="monthly-year"
            type="number"
            value={year}
            min={2020}
            max={2100}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-28"
          />
        </div>
        {data && (
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải báo cáo tháng. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <SummaryKpiCards summary={data.summary} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RevenueBarChart data={revenueChartData} title="Doanh thu theo tuần" />
            <BookingsBarChart data={bookingsChartData} title="Lịch hẹn theo tuần" />
          </div>
        </>
      )}
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Ngày</TabsTrigger>
          <TabsTrigger value="weekly">Tuần</TabsTrigger>
          <TabsTrigger value="monthly">Tháng</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <DailyView />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyView />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add phongkham-web/.tanstack/src/routes/admin/_layout/reports/index.tsx
git commit -m "feat: add weekly/monthly tabs and PDF/Excel export to reports page"
```

---

## Self-Review

**Spec coverage:**
- ✅ Bug fix: dashboard URL `/admin/reports/dashboard` → `/admin/reports/summary`
- ✅ Weekly report UI: tab + date picker + KPI cards + 2 bar charts
- ✅ Monthly report UI: tab + month/year selectors + KPI cards + 2 bar charts + Excel export button
- ✅ Daily export: PDF button in daily tab
- ✅ Backend PDF: pdfkit with Roboto font, `GET /admin/reports/daily/export`
- ✅ Backend Excel: exceljs, `GET /admin/reports/monthly/export`
- ✅ Medical records backend: petName ILIKE filter + count join fix + totalPages + nested pet in response
- ✅ Medical records frontend: debounced petName passed to API, removed client-side filter

**Type consistency check:**
- `ReportSummary` defined in Task 5 Step 1, used in `SummaryKpiCards` in Task 7 — ✅ consistent
- `WeeklyReportResponse.byDay` uses `WeeklyDaySummary` type defined in same file — ✅
- `exportDailyReport()` / `exportMonthlyReport()` defined in Task 5, called in Task 7 — ✅
- `useWeeklyReport()` / `useMonthlyReport()` defined in Task 5, imported in Task 7 — ✅
- Backend `MedicalRecordListItem.pet` shape matches what frontend accesses (`pet.name`, `pet.species`, `pet.ownerName`, `pet.ownerPhone`) — ✅

**Notes:**
- pdfkit renders in ASCII-safe mode for Vietnamese labels (accents stripped) because pdfkit uses system fonts by default and font file must be present at `src/assets/fonts/Roboto-Regular.ttf`. If the font file is missing at runtime, the PDF service will throw — Task 2 Step 2 must be completed before Task 6.
- The weekly chart x-axis uses abbreviated day names (T2–CN) + day of month (e.g., "T3 15"). This fits in narrow bars.
