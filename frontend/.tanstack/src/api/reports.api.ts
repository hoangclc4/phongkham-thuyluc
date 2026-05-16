import { api } from '@/lib/api';
import type {
  DashboardSummary,
  DailySummary,
  WeeklyReportResponse,
  MonthlyReportResponse,
} from '@/types/report';

export async function getDashboard(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/admin/reports/summary');
  return response.data;
}

export async function getDaily(date: string): Promise<DailySummary> {
  const response = await api.get<DailySummary>('/admin/reports/daily', { params: { date } });
  return response.data;
}

export async function getWeekly(weekStart: string): Promise<WeeklyReportResponse> {
  const response = await api.get<WeeklyReportResponse>('/admin/reports/weekly', {
    params: { weekStart },
  });
  return response.data;
}

export async function getMonthly(year: number, month: number): Promise<MonthlyReportResponse> {
  const response = await api.get<MonthlyReportResponse>('/admin/reports/monthly', {
    params: { year, month },
  });
  return response.data;
}

export async function exportDailyReport(date: string): Promise<void> {
  const response = await api.get('/admin/reports/daily/export', {
    params: { date },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-ngay-${date}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportMonthlyReport(year: number, month: number): Promise<void> {
  const response = await api.get('/admin/reports/monthly/export', {
    params: { year, month },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-thang-${year}-${String(month).padStart(2, '0')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
