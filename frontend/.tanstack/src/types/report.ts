export interface ReportSummary {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  newCustomers: number;
  totalRevenue: number;
  totalRevenueDisplay: string;
  paidRevenue: number;
  pendingRevenue: number;
}

export interface DailySummary {
  date: string;
  summary: ReportSummary;
  revenueByMethod: Record<string, number>;
  revenueByCategory: Record<string, number>;
}

export interface WeeklyDaySummary {
  date: string;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  revenueDisplay: string;
}

export interface WeeklyReportResponse {
  weekStart: string;
  weekEnd: string;
  summary: ReportSummary;
  byDay: WeeklyDaySummary[];
}

export interface MonthlyWeekSummary {
  weekStart: string;
  weekEnd: string;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  revenueDisplay: string;
}

export interface MonthlyReportResponse {
  year: number;
  month: number;
  summary: ReportSummary;
  byWeek: MonthlyWeekSummary[];
}

export interface DashboardAlert {
  type: string;
  message: string;
}

export interface ScheduleItem {
  time: string;
  displayNumber: string;
  petName: string;
  ownerName: string;
  service: string;
}

export interface DashboardSummary {
  today: {
    bookings: number;
    completed: number;
    revenue: number;
    revenueDisplay: string;
  };
  pendingActions: {
    bookingsToConfirm: number;
    invoicesToProcess: number;
    unpaidInvoices: number;
  };
  todaysSchedule: ScheduleItem[];
  alerts: DashboardAlert[];
}
