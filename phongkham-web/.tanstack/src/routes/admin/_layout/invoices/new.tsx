import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCustomers, useCustomerPets } from '@/hooks/use-customers';
import { useCreateInvoice } from '@/hooks/use-invoices';
import { useToast } from '@/hooks/use-toast';
import { LineItemEditor } from '@/components/invoices/LineItemEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import type { LineItemCategory } from '@/types/invoice';

type LineItemDraft = {
  description: string;
  category: LineItemCategory;
  quantity: number;
  unitPrice: number;
};

const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  petId: z.string().min(1, 'Vui lòng chọn thú cưng'),
  discountAmount: z.number().min(0).optional(),
  discountReason: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof createInvoiceSchema>;

export const Route = createFileRoute('/admin/_layout/invoices/new')({
  component: NewInvoicePage,
});

function NewInvoicePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);

  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  const { data: customersData, isLoading: customersLoading } = useCustomers({
    search: debouncedCustomerSearch || undefined,
    limit: 20,
  });

  const createInvoice = useCreateInvoice();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      customerId: '',
      petId: '',
      discountAmount: 0,
    },
  });

  const selectedCustomerId = watch('customerId');

  const { data: customerPets, isLoading: petsLoading } = useCustomerPets(selectedCustomerId);

  async function onSubmit(values: FormValues) {
    if (lineItems.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng thêm ít nhất một dịch vụ/thuốc.' });
      return;
    }

    const result = await createInvoice.mutateAsync({
      customerId: values.customerId,
      petId: values.petId,
      lineItems,
      discountAmount: values.discountAmount || undefined,
      discountReason: values.discountReason || undefined,
      notes: values.notes || undefined,
    });

    toast({ title: 'Tạo hoá đơn thành công', description: result.displayNumber });
    navigate({ to: '/admin/invoices/$id', params: { id: result.id } });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/invoices" className="hover:text-gray-900">
          Hoá đơn
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tạo mới</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Tạo hoá đơn</h1>

      {createInvoice.isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tạo hoá đơn. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Thông tin khách hàng</h2>

          <div>
            <Label htmlFor="customer-search">
              Khách hàng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customer-search"
              placeholder="Tìm theo tên hoặc SĐT..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="mt-1"
            />
            {customersLoading && customerSearch && (
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <Spinner size="sm" /> Đang tìm...
              </div>
            )}
            {customersData && customersData.data.length > 0 && customerSearch && !selectedCustomerName && (
              <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {customersData.data.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        setValue('customerId', c.id, { shouldValidate: true });
                        setValue('petId', '');
                        setCustomerSearch(c.fullName);
                        setSelectedCustomerName(c.fullName);
                      }}
                    >
                      <span className="font-medium">{c.fullName}</span>
                      <span className="ml-2 text-gray-500">{c.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedCustomerName && (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-green-700">Đã chọn: {selectedCustomerName}</p>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setValue('customerId', '');
                    setValue('petId', '');
                    setCustomerSearch('');
                    setSelectedCustomerName('');
                  }}
                >
                  Đổi
                </button>
              </div>
            )}
            {errors.customerId && (
              <p className="mt-1 text-xs text-red-600">{errors.customerId.message}</p>
            )}
          </div>

          {selectedCustomerId && (
            <div>
              <Label>
                Thú cưng <span className="text-red-500">*</span>
              </Label>
              {petsLoading ? (
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Spinner size="sm" /> Đang tải thú cưng...
                </div>
              ) : (
                <Select
                  value={watch('petId')}
                  onValueChange={(v) => setValue('petId', v, { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn thú cưng" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerPets?.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} ({pet.speciesLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.petId && (
                <p className="mt-1 text-xs text-red-600">{errors.petId.message}</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Dịch vụ &amp; Thuốc</h2>
          <LineItemEditor value={lineItems} onChange={setLineItems} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Giảm giá &amp; Ghi chú</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="discountAmount">Giảm giá (₫)</Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                step="1000"
                {...register('discountAmount', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="discountReason">Lý do giảm giá</Label>
              <Input
                id="discountReason"
                {...register('discountReason')}
                placeholder="Thành viên thân thiết, khuyến mãi..."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="Ghi chú thêm về hoá đơn..."
              className="mt-1"
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/invoices">Huỷ</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || createInvoice.isPending}>
            {createInvoice.isPending ? (
              <>
                <Spinner size="sm" /> Đang lưu...
              </>
            ) : (
              'Tạo hoá đơn'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
