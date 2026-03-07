import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type StoredBelraiDraft,
} from '@/lib/belrai';
import {
  loadBelraiSnapshot,
  markBelraiSnapshotReady,
  resetBelraiSnapshot,
  saveBelraiSnapshot,
} from '@/lib/belraiSupabase';

function getBelraiQueryKey(patientId: string) {
  return ['belrai-twin', patientId] as const;
}

export function useBelraiTwin(patientId?: string) {
  const queryClient = useQueryClient();
  const enabled = Boolean(patientId);
  const resolvedPatientId = patientId ?? 'unknown';

  const query = useQuery({
    queryKey: getBelraiQueryKey(resolvedPatientId),
    enabled,
    queryFn: async () => loadBelraiSnapshot(patientId!),
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (draft: StoredBelraiDraft) => saveBelraiSnapshot(patientId!, draft),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(getBelraiQueryKey(resolvedPatientId), snapshot);
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: async (draft: StoredBelraiDraft) => markBelraiSnapshotReady(patientId!, draft),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(getBelraiQueryKey(resolvedPatientId), snapshot);
    },
  });

  const resetDraftMutation = useMutation({
    mutationFn: async () => resetBelraiSnapshot(patientId!),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(getBelraiQueryKey(resolvedPatientId), snapshot);
    },
  });

  return {
    ...query,
    saveDraft: saveDraftMutation.mutateAsync,
    markReadyForSync: markReadyMutation.mutateAsync,
    resetDraft: resetDraftMutation.mutateAsync,
    isSaving:
      saveDraftMutation.isPending || markReadyMutation.isPending || resetDraftMutation.isPending,
  } as const;
}
