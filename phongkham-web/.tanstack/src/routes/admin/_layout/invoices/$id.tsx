import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInvoice, useProcessPayment } from '@/hooks/use-invoices';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/formatVND';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from '@/types/invoice';

const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  partially_paid: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

const paymentSchema = z.object({
  paymentMethod: z.string().min(1, 'Vui lòng chọn phương thức'),
  paidAmount: z.number().positive('Số tiền phải lớn hơn 0'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export const Route = createFileRoute('/admin/_layout/invoices/$id')({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { id } = Route.useParams();
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: invoice, isLoading, isError } = useInvoice(id);
  const processPayment = useProcessPayment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: '', paidAmount: 0 },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không tìm thấy hoá đơn. Vui lòng thử lại.</AlertDescription>
      </Alert>
    );
  }

  const isPaid = invoice.paymentStatus === 'paid';
  const remaining = invoice.totalAmount - invoice.paidAmount;

  async function onProcessPayment(values: PaymentFormValues) {
    await processPayment.mutateAsync({
      id,
      dto: {
        paymentMethod: values.paymentMethod as PaymentMethod,
        paidAmount: values.paidAmount,
      },
    });
    toast({ title: 'Cập nhật thanh toán thành công' });
    setPaymentDialogOpen(false);
    reset();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/invoices" className="hover:text-gray-900">
          Hoá đơn
        </Link>
        <span>/</span>
        <span className="text-gray-900">{invoice.displayNumber}</span>
      </nav>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            {invoice.displayNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{formatDateTime(invoice.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={PAYMENT_STATUS_BADGE_CLASS[invoice.paymentStatus]}>
            {PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
          </Badge>
          {!isPaid && (
            <Button onClick={() => setPaymentDialogOpen(true)}>
              Xử lý thanh toán
            </Button>
          )}
        </div>
      </div>

      {/* Customer + Pet */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-gray-900">{invoice.customer.fullName}</p>
            <a
              href={`tel:${invoice.customer.phone}`}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              {invoice.customer.phone}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Thú cưng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-gray-900">{invoice.pet.name}</p>
            <p className="text-sm text-gray-500">{invoice.pet.species}</p>
          </CardContent>
        </Card>
      </div>

      {/* Linked entities */}
      {(invoice.linkedBooking || invoice.linkedMedicalRecord) && (
        <Card>
          <CardContent className="pt-4 flex gap-6">
            {invoice.linkedBooking && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Lịch hẹn liên kết</p>
                <p className="text-sm font-mono font-medium">
                  {invoice.linkedBooking.displayNumber}
                </p>
                <p className="text-xs text-gray-500">{invoice.linkedBooking.serviceLabel}</p>
              </div>
            )}
            {invoice.linkedMedicalRecord && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Hồ sơ bệnh lý</p>
                <p className="text-sm font-mono font-medium">
                  {invoice.linkedMedicalRecord.displayNumber}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Chi tiết dịch vụ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mô tả</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-gray-500">{item.categoryLabel}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatVND(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatVND(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="px-6 py-4 space-y-1 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính</span>
              <span>{formatVND(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Giảm giá
                  {invoice.discountReason && ` (${invoice.discountReason})`}
                </span>
                <span className="text-green-600">-{formatVND(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
              <span>Tổng cộng</span>
              <span>{formatVND(invoice.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Thông tin thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Trạng thái</span>
            <Badge className={PAYMENT_STATUS_BADGE_CLASS[invoice.paymentStatus]}>
              {PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
            </Badge>
          </div>
          {invoice.paymentMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phương thức</span>
              <span>{PAYMENT_METHOD_LABELS[invoice.paymentMethod]}</span>
            </div>
          )}
          {invoice.paidAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Đã thanh toán</span>
              <span className="text-green-600 font-medium">{formatVND(invoice.paidAmount)}</span>
            </div>
          )}
          {!isPaid && remaining > 0 && (
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Còn lại</span>
              <span className="text-amber-600">{formatVND(remaining)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian thanh toán</span>
              <span>{formatDate(invoice.paidAt)}</span>
            </div>
          )}
          {invoice.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xử lý thanh toán</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onProcessPayment)} className="space-y-4 mt-2">
            <div>
              <Label>Phương thức thanh toán <span className="text-red-500">*</span></Label>
              <Select
                value={watch('paymentMethod')}
                onValueChange={(v) => setValue('paymentMethod', v, { shouldValidate: true })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="mt-1 text-xs text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="paidAmount">
                Số tiền thanh toán (₫) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paidAmount"
                type="number"
                min="1"
                step="1000"
                {...register('paidAmount', { valueAsNumber: true })}
                defaultValue={remaining}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Số tiền còn lại: {formatVND(remaining)}
              </p>
              {errors.paidAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.paidAmount.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  reset();
                }}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={processPayment.isPending}>
                {processPayment.isPending ? (
                  <>
                    <Spinner size="sm" /> Đang xử lý...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
