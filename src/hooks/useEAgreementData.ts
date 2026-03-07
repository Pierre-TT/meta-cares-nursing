import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEAgreementRequest,
  getPatientConsentSnapshot,
  listEAgreementRequests,
  updateEAgreementRequest,
  type EAgreementListFilters,
} from '@/lib/eagreements';

function getStatusesKey(statuses?: string[]) {
  return statuses && statuses.length > 0 ? statuses.join(',') : 'all';
}

export const eAgreementQueryKeys = {
  all: ['eagreements'] as const,
  requests: (filters: EAgreementListFilters = {}) =>
    [
      'eagreements',
      'requests',
      filters.patientId ?? 'all',
      getStatusesKey(filters.statuses),
      filters.limit ?? 'all',
    ] as const,
  patientConsent: (patientId: string) => ['eagreements', 'patient-consent', patientId] as const,
};

export function useEAgreementRequests(filters: EAgreementListFilters = {}) {
  return useQuery({
    queryKey: eAgreementQueryKeys.requests(filters),
    queryFn: () => listEAgreementRequests(filters),
  });
}

export function usePatientConsentSnapshot(patientId?: string) {
  return useQuery({
    queryKey: eAgreementQueryKeys.patientConsent(patientId ?? 'unknown'),
    enabled: Boolean(patientId),
    queryFn: () => getPatientConsentSnapshot(patientId!),
  });
}

export function useCreateEAgreementRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEAgreementRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eAgreementQueryKeys.all });
    },
  });
}

export function useUpdateEAgreementRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEAgreementRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eAgreementQueryKeys.all });
    },
  });
}
