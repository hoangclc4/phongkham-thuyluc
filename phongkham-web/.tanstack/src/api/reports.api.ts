import { api } from '@/lib/api';
import type { DashboardSummary, DailySummary } from '@/types/report';

export async function getDashboard(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/admin/reports/dashboard');
  return response.data;
}

export async function getDaily(date: string): Promise<DailySummary> {
  const response = await api.get<DailySummary>('/admin/reports/daily', { params: { date } });
  return response.data;
}
