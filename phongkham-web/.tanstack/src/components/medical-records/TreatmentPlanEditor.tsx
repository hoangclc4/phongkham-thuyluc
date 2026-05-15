import { X, Plus } from 'lucide-react';
import type { TreatmentItem } from '@/types/medical-record';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TreatmentDraft = Omit<TreatmentItem, 'id'>;

const FREQUENCY_OPTIONS = [
  { value: '1 lần/ngày', label: '1 lần/ngày' },
  { value: '2 lần/ngày', label: '2 lần/ngày' },
  { value: '3 lần/ngày', label: '3 lần/ngày' },
  { value: 'Khi cần', label: 'Khi cần' },
] as const;

const ROUTE_OPTIONS = [
  { value: 'uống', label: 'Uống' },
  { value: 'tiêm', label: 'Tiêm' },
  { value: 'bôi', label: 'Bôi' },
  { value: 'nhỏ mắt', label: 'Nhỏ mắt' },
  { value: 'nhỏ tai', label: 'Nhỏ tai' },
] as const;

const EMPTY_ITEM: TreatmentDraft = {
  drug: '',
  dosage: '',
  frequency: '1 lần/ngày',
  duration: '',
  route: 'uống',
  notes: null,
};

interface TreatmentPlanEditorProps {
  value: TreatmentDraft[];
  onChange: (items: TreatmentDraft[]) => void;
}

export function TreatmentPlanEditor({ value, onChange }: TreatmentPlanEditorProps) {
  function addItem() {
    onChange([...value, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<TreatmentDraft>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={index} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="absolute right-3 top-3 rounded-sm p-0.5 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Xoá thuốc"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor={`drug-${index}`}>
                Tên thuốc <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`drug-${index}`}
                value={item.drug}
                onChange={(e) => updateItem(index, { drug: e.target.value })}
                placeholder="Ví dụ: Amoxicillin"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`dosage-${index}`}>Liều lượng</Label>
              <Input
                id={`dosage-${index}`}
                value={item.dosage}
                onChange={(e) => updateItem(index, { dosage: e.target.value })}
                placeholder="Ví dụ: 50mg"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`duration-${index}`}>Thời gian</Label>
              <Input
                id={`duration-${index}`}
                value={item.duration}
                onChange={(e) => updateItem(index, { duration: e.target.value })}
                placeholder="Ví dụ: 7 ngày"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Tần suất</Label>
              <Select
                value={item.frequency}
                onValueChange={(v) => updateItem(index, { frequency: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Đường dùng</Label>
              <Select
                value={item.route}
                onValueChange={(v) => updateItem(index, { route: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor={`notes-${index}`}>Ghi chú</Label>
              <Input
                id={`notes-${index}`}
                value={item.notes ?? ''}
                onChange={(e) =>
                  updateItem(index, { notes: e.target.value || null })
                }
                placeholder="Ghi chú thêm (tuỳ chọn)"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1.5 h-4 w-4" />
        Thêm thuốc
      </Button>
    </div>
  );
}
