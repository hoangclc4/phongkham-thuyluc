import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types/booking';
import type { BookingStatus } from '@/types/booking';

interface Props {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: Props) {
  return (
    <Badge
      style={{ backgroundColor: BOOKING_STATUS_COLORS[status], color: '#fff' }}
    >
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
