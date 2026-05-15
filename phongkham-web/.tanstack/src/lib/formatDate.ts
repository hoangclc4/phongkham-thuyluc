import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Ho_Chi_Minh';

export function formatDate(isoString: string, pattern = 'dd/MM/yyyy'): string {
  const zoned = toZonedTime(parseISO(isoString), TIMEZONE);
  return format(zoned, pattern);
}

export function formatDateTime(isoString: string): string {
  return formatDate(isoString, 'dd/MM/yyyy HH:mm');
}
