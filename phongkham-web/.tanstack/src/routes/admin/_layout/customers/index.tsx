import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useCustomers } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
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
import { useDebounce } from '@/hooks/use-debounce';

const PAGE_SIZE = 20;
const FIRST_PAGE = 1;

type ActiveFilter = 'all' | 'active' | 'inactive';

const ACTIVE_FILTER_MAP: Record<ActiveFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

export const Route = createFileRoute('/admin/_layout/customers/')({
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(FIRST_PAGE);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useCustomers({
    search: debouncedSearch || undefined,
    isActive: ACTIVE_FILTER_MAP[activeFilter],
    page,
    limit: PAGE_SIZE,
  });

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(FIRST_PAGE);
  }

  function handleActiveFilterChange(value: string) {
    setActiveFilter(value as ActiveFilter);
    setPage(FIRST_PAGE);
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
        <Button onClick={() => navigate({ to: '/admin/customers/new' })}>
          + Thêm khách hàng
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="w-44">
          <Select value={activeFilter} onValueChange={handleActiveFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải danh sách khách hàng. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Số thú cưng</TableHead>
              <TableHead>Lần khám cuối</TableHead>
              <TableHead>Tổng chi tiêu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <CustomerSkeletonRows />}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                  Không có khách hàng nào.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data?.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.fullName} size="sm" />
                      <span className="font-medium text-gray-900">{customer.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </TableCell>
                  <TableCell>{customer.stats.petsCount}</TableCell>
                  <TableCell>
                    {customer.stats.lastVisitDate
                      ? formatDate(customer.stats.lastVisitDate)
                      : 'Chưa khám'}
                  </TableCell>
                  <TableCell>{formatVND(customer.stats.totalSpent)}</TableCell>
                  <TableCell>
                    {customer.isActive ? (
                      <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Ngừng hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/customers/$id" params={{ id: customer.id }}>
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

function CustomerSkeletonRows() {
  const SKELETON_COUNT = 8;
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
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
