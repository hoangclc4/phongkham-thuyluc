import { X, Plus } from 'lucide-react';
import { LINE_ITEM_CATEGORY_LABELS, type LineItemCategory } from '@/types/invoice';
import { formatVND } from '@/lib/formatVND';
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

type LineItemDraft = {
  description: string;
  category: LineItemCategory;
  quantity: number;
  unitPrice: number;
};

const DEFAULT_CATEGORY: LineItemCategory = 'examination';
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT_PRICE = 0;

const EMPTY_LINE_ITEM: LineItemDraft = {
  description: '',
  category: DEFAULT_CATEGORY,
  quantity: DEFAULT_QUANTITY,
  unitPrice: DEFAULT_UNIT_PRICE,
};

interface LineItemEditorProps {
  value: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
}

export function LineItemEditor({ value, onChange }: LineItemEditorProps) {
  function addItem() {
    onChange([...value, { ...EMPTY_LINE_ITEM }]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<LineItemDraft>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const total = value.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-gray-500">Chưa có dịch vụ/thuốc nào. Nhấn nút bên dưới để thêm.</p>
      )}

      {value.map((item, index) => (
        <div key={index} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="absolute right-3 top-3 rounded-sm p-0.5 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Xoá dịch vụ"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor={`desc-${index}`}>
                Mô tả <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`desc-${index}`}
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Tên dịch vụ hoặc thuốc"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Danh mục</Label>
              <Select
                value={item.category}
                onValueChange={(v) => updateItem(index, { category: v as LineItemCategory })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LINE_ITEM_CATEGORY_LABELS) as [LineItemCategory, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`qty-${index}`}>Số lượng</Label>
              <Input
                id={`qty-${index}`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`price-${index}`}>Đơn giá (₫)</Label>
              <Input
                id={`price-${index}`}
                type="number"
                min="0"
                step="1000"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(index, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <div className="w-full">
                <Label>Thành tiền</Label>
                <p className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900">
                  {formatVND(item.quantity * item.unitPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-4 w-4" />
          Thêm dịch vụ/thuốc
        </Button>

        {value.length > 0 && (
          <p className="text-sm font-medium text-gray-700">
            Tổng: <span className="text-gray-900">{formatVND(total)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
