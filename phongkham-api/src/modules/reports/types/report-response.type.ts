export interface DailySummary {
  totalBookings:      number;
  completedBookings:  number;
  cancelledBookings:  number;
  noShowBookings:     number;
  newCustomers:       number;
  totalRevenue:       number;
  totalRevenueDisplay: string;
  paidRevenue:        number;
  pendingRevenue:     number;
}

export interface RevenueByMethod {
  cash:          number;
  bank_transfer: number;
  momo:          number;
  zalopay:       number;
  other:         number;
}

export interface RevenueByCategory {
  examination: number;
  medication:  number;
  lab:         number;
  surgery:     number;
  grooming:    number;
  other:       number;
}

export interface DailyReportResponse {
  date:             string;
  summary:          DailySummary;
  revenueByMethod:  RevenueByMethod;
  revenueByCategory: RevenueByCategory;
}

export interface WeeklyDaySummary {
  date:             string;
  totalBookings:    number;
  completedBookings: number;
  revenue:          number;
  revenueDisplay:   string;
}

export interface WeeklyReportResponse {
  weekStart: string;
  weekEnd:   string;
  summary:   DailySummary;
  byDay:     WeeklyDaySummary[];
}

export interface MonthlyWeekSummary {
  weekStart:         string;
  weekEnd:           string;
  totalBookings:     number;
  completedBookings: number;
  revenue:           number;
  revenueDisplay:    string;
}

export interface MonthlyReportResponse {
  year:    number;
  month:   number;
  summary: DailySummary;
  byWeek:  MonthlyWeekSummary[];
}

export interface ScheduleItem {
  time:         string;
  displayNumber: string;
  petName:      string;
  ownerName:    string;
  service:      string;
}

export interface Alert {
  type:    string;
  message: string;
}

export interface PendingActions {
  bookingsToConfirm:  number;
  invoicesToProcess:  number;
  unpaidInvoices:     number;
}

export interface TodayStats {
  bookings:       number;
  completed:      number;
  revenue:        number;
  revenueDisplay: string;
}

export interface SummaryResponse {
  today:          TodayStats;
  pendingActions: PendingActions;
  todaysSchedule: ScheduleItem[];
  alerts:         Alert[];
}
