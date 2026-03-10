import { useQuery } from '@tanstack/react-query';
import {
  emptyAdminEHealthComplianceSnapshot,
  getAdminEHealthComplianceSnapshot,
} from '@/lib/eHealthCompliance';

export const eHealthComplianceQueryKeys = {
  all: ['ehealth-compliance'] as const,
  admin: ['ehealth-compliance', 'admin'] as const,
};

export function useAdminEHealthCompliance() {
  return useQuery({
    queryKey: eHealthComplianceQueryKeys.admin,
    initialData: emptyAdminEHealthComplianceSnapshot,
    initialDataUpdatedAt: 0,
    queryFn: getAdminEHealthComplianceSnapshot,
  });
}
