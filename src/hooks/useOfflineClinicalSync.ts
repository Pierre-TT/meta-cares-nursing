import { useSyncExternalStore } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nurseClinicalQueryKeys } from '@/hooks/useNurseClinicalData';
import {
  emitOfflineClinicalQueueChange,
  flushOfflineWoundQueue,
  getOfflineClinicalQueueSnapshot,
  subscribeToOfflineClinicalQueue,
} from '@/lib/offlineClinicalSync';
import { syncBelraiOfflineDrafts } from '@/lib/belraiSupabase';

export function useOfflineClinicalSync(patientId?: string) {
  const queryClient = useQueryClient();
  const snapshot = useSyncExternalStore(
    subscribeToOfflineClinicalQueue,
    () => getOfflineClinicalQueueSnapshot(patientId),
    () => getOfflineClinicalQueueSnapshot(patientId),
  );

  const refresh = () => {
    emitOfflineClinicalQueueChange();
  };

  const flushWoundQueueMutation = useMutation({
    mutationFn: async () => flushOfflineWoundQueue(patientId),
    onSuccess: async () => {
      if (patientId) {
        await queryClient.invalidateQueries({ queryKey: nurseClinicalQueryKeys.woundAssessments(patientId) });
      } else {
        await queryClient.invalidateQueries({ queryKey: nurseClinicalQueryKeys.all });
      }
      refresh();
    },
  });

  const syncBelraiQueueMutation = useMutation({
    mutationFn: async () => syncBelraiOfflineDrafts(patientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['belrai-twin'] });
      refresh();
    },
  });

  return {
    snapshot,
    refresh,
    flushWoundQueue: flushWoundQueueMutation.mutateAsync,
    syncBelraiQueue: syncBelraiQueueMutation.mutateAsync,
    isSyncing: flushWoundQueueMutation.isPending || syncBelraiQueueMutation.isPending,
  } as const;
}
