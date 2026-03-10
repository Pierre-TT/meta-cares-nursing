import { useQuery } from '@tanstack/react-query';
import { getConsentAccessAudit } from '@/lib/consentAccessAudit';

export function useConsentAccessAudit(patientId?: string) {
  return useQuery({
    queryKey: ['consent-access-audit', patientId ?? 'all'],
    queryFn: () => getConsentAccessAudit(patientId),
  });
}
