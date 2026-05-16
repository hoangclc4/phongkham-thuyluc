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
            className="h-4 w-4 rounded border-gray-300 text-primary"
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
                    <TableCell className="max-w-50 truncate text-sm text-gray-700">
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
