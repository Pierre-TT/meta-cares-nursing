import { useQuery } from '@tanstack/react-query';
import { getBillingAutopilotSnapshot } from '@/lib/billingAutopilot';

export const billingAutopilotQueryKey = ['billing-autopilot'] as const;

export function useBillingAutopilot() {
  return useQuery({
    queryKey: billingAutopilotQueryKey,
    queryFn: getBillingAutopilotSnapshot,
  });
}
