import { useQuery } from '@tanstack/react-query';
import {
  getHourlyPilotAdminOverview,
  getNurseHourlyPilotWeekComparison,
} from '@/lib/hourlyPilotData';

export const hourlyPilotQueryKeys = {
  all: ['hourly-pilot'] as const,
  nurseWeekComparison: (nurseId: string, days: number) =>
    ['hourly-pilot', 'nurse-week-comparison', nurseId, days] as const,
  adminOverview: ['hourly-pilot', 'admin-overview'] as const,
};

export function useNurseHourlyPilotWeekComparison(nurseId?: string, days = 7) {
  return useQuery({
    queryKey: hourlyPilotQueryKeys.nurseWeekComparison(nurseId ?? 'unknown', days),
    enabled: Boolean(nurseId),
    queryFn: () => getNurseHourlyPilotWeekComparison(nurseId!, days),
  });
}

export function useHourlyPilotAdminOverview() {
  return useQuery({
    queryKey: hourlyPilotQueryKeys.adminOverview,
    queryFn: getHourlyPilotAdminOverview,
  });
}
