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
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  other: 'Khác',
};

const CATEGORY_LABELS: Record<string, string> = {
  examination: 'Phí khám',
  medication: 'Thuốc',
  lab: 'Xét nghiệm',
  surgery: 'Phẫu thuật',
  grooming: 'Grooming',
  other: 'Khác',
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

  const revenueChartData =
    data?.byDay.map((d) => {
      const date = new Date(d.date + 'T00:00:00');
      const dayName = DAY_NAMES[date.getDay()];
      return { name: `${dayName} ${d.date.slice(8)}`, revenue: d.revenue };
    }) ?? [];

  const bookingsChartData =
    data?.byDay.map((d) => {
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

  const revenueChartData =
    data?.byWeek.map((w, idx) => ({
      name: `T${idx + 1}`,
      revenue: w.revenue,
    })) ?? [];

  const bookingsChartData =
    data?.byWeek.map((w, idx) => ({
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
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
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
