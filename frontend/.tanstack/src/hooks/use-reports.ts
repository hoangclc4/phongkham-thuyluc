import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '@/api/reports.api';

export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  daily: (date: string) => [...reportKeys.all, 'daily', date] as const,
  weekly: (weekStart: string) => [...reportKeys.all, 'weekly', weekStart] as const,
  monthly: (year: number, month: number) => [...reportKeys.all, 'monthly', year, month] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: () => reportsApi.getDashboard(),
  });
}

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: reportKeys.daily(date),
    queryFn: () => reportsApi.getDaily(date),
    enabled: Boolean(date),
  });
}

export function useWeeklyReport(weekStart: string) {
  return useQuery({
    queryKey: reportKeys.weekly(weekStart),
    queryFn: () => reportsApi.getWeekly(weekStart),
    enabled: Boolean(weekStart),
  });
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: reportKeys.monthly(year, month),
    queryFn: () => reportsApi.getMonthly(year, month),
    enabled: year > 0 && month > 0,
  });
}
