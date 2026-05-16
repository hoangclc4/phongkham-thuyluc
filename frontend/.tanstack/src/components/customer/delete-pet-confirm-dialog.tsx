import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteMyPet } from '@/hooks/use-customer-portal';

interface DeletePetConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onDeleted: () => void;
}

export function DeletePetConfirmDialog({
  open,
  onClose,
  petId,
  petName,
  onDeleted,
}: DeletePetConfirmDialogProps) {
  const { toast } = useToast();
  const deletePet = useDeleteMyPet();

  async function handleDelete() {
    await deletePet.mutateAsync(petId);
    toast({ title: `Đã xoá ${petName}` });
    onDeleted();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xoá thú cưng</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Bạn có chắc muốn xoá <strong>{petName}</strong>? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={deletePet.isPending}>
            Huỷ
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={deletePet.isPending}
          >
            {deletePet.isPending ? 'Đang xoá...' : 'Xoá'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
