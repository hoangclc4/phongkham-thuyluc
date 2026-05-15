import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useDailyReport } from '@/hooks/use-reports';
import { formatVND } from '@/lib/formatVND';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const TODAY_DATE = new Date().toISOString().slice(0, 10);

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

export const Route = createFileRoute('/admin/_layout/reports/')({
  component: ReportsPage,
});

function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(TODAY_DATE);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <Label htmlFor="report-date">Chọn ngày</Label>
          <Input
            id="report-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 w-48"
          />
        </div>
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
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Tổng lịch hẹn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.totalBookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Hoàn thành</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {data.summary.completedBookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Đã huỷ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">
                  {data.summary.cancelledBookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">KH mới</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {data.summary.newCustomers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-gray-900">
                  {data.summary.totalRevenueDisplay}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Chờ thu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-600">
                  {formatVND(data.summary.pendingRevenue)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
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
                      <Tooltip
                        formatter={(v: number) => [formatVND(v), 'Doanh thu']}
                      />
                      <Bar dataKey="value" fill="#2d6e6e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {revenueByCategoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Doanh thu theo danh mục
                  </CardTitle>
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
                          <Cell
                            key={index}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
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
