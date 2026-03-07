import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNurseWoundAssessment,
  getNurseVisitSummary,
  listNurseVisitSummaries,
  listNurseWoundAssessments,
  saveNurseVisit,
  signNurseVisit,
} from '@/lib/nurseClinical';

export const nurseClinicalQueryKeys = {
  all: ['nurse-clinical'] as const,
  visitSummary: (patientId: string, visitId?: string) =>
    ['nurse-clinical', 'visit-summary', patientId, visitId ?? 'latest'] as const,
  visitHistory: (patientId: string, limit?: number) =>
    ['nurse-clinical', 'visit-history', patientId, limit ?? 'all'] as const,
  woundAssessments: (patientId: string) =>
    ['nurse-clinical', 'wound-assessments', patientId] as const,
};

export function useNurseVisitSummary(patientId?: string, visitId?: string) {
  return useQuery({
    queryKey: nurseClinicalQueryKeys.visitSummary(patientId ?? 'unknown', visitId),
    enabled: Boolean(patientId),
    queryFn: () => getNurseVisitSummary(patientId!, visitId),
  });
}

export function useNurseVisitHistory(patientId?: string, limit?: number) {
  return useQuery({
    queryKey: nurseClinicalQueryKeys.visitHistory(patientId ?? 'unknown', limit),
    enabled: Boolean(patientId),
    queryFn: () => listNurseVisitSummaries(patientId!, limit),
  });
}

export function useSaveNurseVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveNurseVisit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nurseClinicalQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['nurse-patients'] });
      void queryClient.invalidateQueries({ queryKey: ['hourly-pilot'] });
    },
  });
}

export function useSignNurseVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signNurseVisit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nurseClinicalQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['nurse-patients'] });
    },
  });
}

export function useNurseWoundAssessments(patientId?: string) {
  return useQuery({
    queryKey: nurseClinicalQueryKeys.woundAssessments(patientId ?? 'unknown'),
    enabled: Boolean(patientId),
    queryFn: () => listNurseWoundAssessments(patientId!),
  });
}

export function useCreateNurseWoundAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNurseWoundAssessment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nurseClinicalQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['nurse-patients'] });
    },
  });
}
