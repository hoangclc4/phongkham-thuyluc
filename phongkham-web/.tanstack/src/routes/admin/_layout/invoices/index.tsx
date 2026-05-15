import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useInvoices } from '@/hooks/use-invoices';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatVND } from '@/lib/formatVND';
import { formatDate } from '@/lib/formatDate';
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '@/types/invoice';

const PAGE_SIZE = 20;
const FIRST_PAGE = 1;

type StatusFilter = 'all' | PaymentStatus;

const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  partially_paid: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export const Route = createFileRoute('/admin/_layout/invoices/')({
  component: InvoicesPage,
});

function InvoicesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(FIRST_PAGE);

  const { data, isLoading, isError } = useInvoices({
    paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: PAGE_SIZE,
  });

  function handleStatusChange(value: string) {
    setStatusFilter(value as StatusFilter);
    setPage(FIRST_PAGE);
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hoá đơn</h1>
        <Button onClick={() => navigate({ to: '/admin/invoices/new' })}>
          + Tạo hoá đơn
        </Button>
      </div>

      <div className="w-52">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải danh sách hoá đơn. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số hoá đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Thú cưng</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <InvoiceSkeletonRows />}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                  Không có hoá đơn nào.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data?.data.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {invoice.displayNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.customer.fullName}</p>
                      <p className="text-xs text-gray-500">{invoice.customer.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.pet.name}</TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVND(invoice.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={PAYMENT_STATUS_BADGE_CLASS[invoice.paymentStatus]}
                    >
                      {PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/invoices/$id" params={{ id: invoice.id }}>
                      <Button variant="outline" size="sm">
                        Xem
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

function InvoiceSkeletonRows() {
  const SKELETON_COUNT = 8;
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32 font-mono" /></TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const MAX_VISIBLE_PAGES = 5;
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  const start = Math.max(FIRST_PAGE, page - half);
  const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= FIRST_PAGE}
        onClick={() => onPageChange(page - 1)}
      >
        Trước
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sau
      </Button>
    </div>
  );
}
