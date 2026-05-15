import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '@/api/reports.api';

export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  daily: (date: string) => [...reportKeys.all, 'daily', date] as const,
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
