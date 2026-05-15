import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { usePets } from '@/hooks/use-pets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatDate } from '@/lib/formatDate';
import { useDebounce } from '@/hooks/use-debounce';
import {
  PET_SPECIES_LABELS,
  PET_STATUS_LABELS,
  type PetSpecies,
} from '@/types/pet';

const PAGE_SIZE = 20;
const FIRST_PAGE = 1;
const ALL_SPECIES = 'all';

export const Route = createFileRoute('/admin/_layout/pets/')({
  component: PetsPage,
});

function PetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<PetSpecies | typeof ALL_SPECIES>(ALL_SPECIES);
  const [page, setPage] = useState(FIRST_PAGE);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = usePets({
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const filteredData =
    speciesFilter === ALL_SPECIES
      ? data?.data
      : data?.data.filter((pet) => pet.species === speciesFilter);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(FIRST_PAGE);
  }

  function handleSpeciesChange(value: string) {
    setSpeciesFilter(value as PetSpecies | typeof ALL_SPECIES);
    setPage(FIRST_PAGE);
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thú cưng</h1>
        <Button onClick={() => navigate({ to: '/admin/pets/new' })}>
          + Thêm thú cưng
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Tìm theo tên hoặc chủ..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="w-44">
          <Select value={speciesFilter} onValueChange={handleSpeciesChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SPECIES}>Tất cả loài</SelectItem>
              {Object.entries(PET_SPECIES_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải danh sách thú cưng. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Chủ</TableHead>
              <TableHead>Loài</TableHead>
              <TableHead>Giống</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày khám cuối</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <PetSkeletonRows />}
            {!isLoading && (filteredData?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                  Không có thú cưng nào.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              filteredData?.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{pet.name}</span>
                      {pet.knownAllergies.length > 0 && (
                        <span title={`Dị ứng: ${pet.knownAllergies.join(', ')}`}>⚠️</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-gray-900">{pet.ownerName}</p>
                      <a
                        href={`tel:${pet.ownerPhone}`}
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        {pet.ownerPhone}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>{PET_SPECIES_LABELS[pet.species]}</TableCell>
                  <TableCell>{pet.breed ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        pet.status === 'healthy'
                          ? 'bg-green-100 text-green-700'
                          : pet.status === 'deceased'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {PET_STATUS_LABELS[pet.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pet.lastVisitDate ? formatDate(pet.lastVisitDate) : 'Chưa khám'}
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/pets/$id" params={{ id: pet.id }}>
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

function PetSkeletonRows() {
  const SKELETON_COUNT = 8;
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
