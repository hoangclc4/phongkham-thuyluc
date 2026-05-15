import { createFileRoute, Link } from '@tanstack/react-router';
import { useDashboard } from '@/hooks/use-reports';
import { formatVND } from '@/lib/formatVND';
import { formatDate } from '@/lib/formatDate';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/admin/_layout/')({
  component: AdminDashboard,
});

const TODAY_ISO = new Date().toISOString();

const ALERT_WARNING_TYPES = ['vaccine_due', 'followup_due'] as const;
type AlertWarningType = (typeof ALERT_WARNING_TYPES)[number];

function isWarningAlert(type: string): type is AlertWarningType {
  return (ALERT_WARNING_TYPES as readonly string[]).includes(type);
}

function AdminDashboard() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không thể tải dữ liệu dashboard. Vui lòng thử lại.</AlertDescription>
      </Alert>
    );
  }

  const hasPendingConfirm = data.pendingActions.bookingsToConfirm > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">{formatDate(TODAY_ISO)}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Lịch hẹn hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{data.today.bookings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Đã hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{data.today.completed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Doanh thu hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatVND(data.today.revenue)}</p>
          </CardContent>
        </Card>

        <Card className={hasPendingConfirm ? 'border-amber-300 bg-amber-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${hasPendingConfirm ? 'text-amber-700' : 'text-gray-500'}`}>
              Chờ xác nhận
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${hasPendingConfirm ? 'text-amber-700' : 'text-gray-900'}`}>
              {data.pendingActions.bookingsToConfirm}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, idx) => (
            <Alert key={idx} variant={isWarningAlert(alert.type) ? 'warning' : 'default'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Lịch khám hôm nay</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.todaysSchedule.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">Không có lịch khám hôm nay.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Mã lịch hẹn</TableHead>
                  <TableHead>Tên thú cưng</TableHead>
                  <TableHead>Chủ</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.todaysSchedule.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.time}</TableCell>
                    <TableCell className="font-mono text-xs">{item.displayNumber}</TableCell>
                    <TableCell>{item.petName}</TableCell>
                    <TableCell>{item.ownerName}</TableCell>
                    <TableCell>{item.service}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/admin/invoices">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Cần xử lý hoá đơn</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{data.pendingActions.invoicesToProcess}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/invoices">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Hoá đơn chưa thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{data.pendingActions.unpaidInvoices}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/bookings">
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${hasPendingConfirm ? 'border-amber-300' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Cần xác nhận lịch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${hasPendingConfirm ? 'text-amber-700' : 'text-gray-900'}`}>
                {data.pendingActions.bookingsToConfirm}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
