import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfDay } from 'date-fns';
import {
  completeHadTask,
  createHadEpisode,
  createHadTask,
  createHadRound,
  getHadDailyRound,
  getHadEpisodeDetail,
  insertHadMeasurement,
  listHadEpisodes,
  listHadPatientTasksToday,
  listHadTodayMeasurements,
  updateHadAlertStatus,
  updateHadEpisode,
  type CompleteHadTaskInput,
  type CreateHadEpisodeInput,
  type CreateHadMeasurementInput,
  type CreateHadTaskInput,
  type CreateHadRoundInput,
  type HadEpisodeListFilters,
  type UpdateHadAlertStatusInput,
  type UpdateHadEpisodeInput,
} from '@/lib/had';
import { useAuthStore } from '@/stores/authStore';

function toDayKey(date: Date) {
  return startOfDay(date).toISOString();
}

export const hadQueryKeys = {
  all: ['had'] as const,
  episodes: (filters: HadEpisodeListFilters) => ['had', 'episodes', filters] as const,
  patientEpisodes: (patientId: string, onlyOpen: boolean) =>
    ['had', 'patient-episodes', patientId, onlyOpen] as const,
  episodeDetail: (episodeId: string) => ['had', 'episode-detail', episodeId] as const,
  dailyRound: (episodeId: string, dayKey: string) => ['had', 'daily-round', episodeId, dayKey] as const,
  todayMeasurements: (episodeId: string, dayKey: string) =>
    ['had', 'today-measurements', episodeId, dayKey] as const,
  patientTasksToday: (dayKey: string) => ['had', 'patient-tasks-today', dayKey] as const,
};

export function useHadEpisodes(filters: HadEpisodeListFilters = {}) {
  return useQuery({
    queryKey: hadQueryKeys.episodes(filters),
    queryFn: () => listHadEpisodes(filters),
  });
}

export function useHadPatientEpisodes(patientId?: string, onlyOpen = true) {
  return useQuery({
    queryKey: hadQueryKeys.patientEpisodes(patientId ?? 'missing', onlyOpen),
    enabled: Boolean(patientId),
    queryFn: () => listHadEpisodes({ patientId: patientId!, onlyOpen }),
  });
}

export function useHadEpisodeDetail(episodeId?: string) {
  return useQuery({
    queryKey: hadQueryKeys.episodeDetail(episodeId ?? 'missing'),
    enabled: Boolean(episodeId),
    queryFn: () => getHadEpisodeDetail(episodeId!),
  });
}

export function useHadDailyRound(episodeId?: string, date = new Date()) {
  const dayKey = toDayKey(date);

  return useQuery({
    queryKey: hadQueryKeys.dailyRound(episodeId ?? 'missing', dayKey),
    enabled: Boolean(episodeId),
    queryFn: () => getHadDailyRound(episodeId!, date),
  });
}

export function useHadTodayMeasurements(episodeId?: string, date = new Date()) {
  const dayKey = toDayKey(date);

  return useQuery({
    queryKey: hadQueryKeys.todayMeasurements(episodeId ?? 'missing', dayKey),
    enabled: Boolean(episodeId),
    queryFn: () => listHadTodayMeasurements(episodeId!, date),
  });
}

export function useHadPatientTasksToday(date = new Date()) {
  const dayKey = toDayKey(date);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: hadQueryKeys.patientTasksToday(dayKey),
    enabled: Boolean(user && user.role === 'patient'),
    queryFn: () => listHadPatientTasksToday(date),
  });
}

export function useCreateHadEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHadEpisodeInput) => createHadEpisode(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
    },
  });
}

export function useCreateHadTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHadTaskInput) => createHadTask(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.episodeDetail(data.episodeId) });
    },
  });
}

export function useUpdateHadAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHadAlertStatusInput) => updateHadAlertStatus(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
    },
  });
}

export function useUpdateHadEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHadEpisodeInput) => updateHadEpisode(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.episodeDetail(data.episode.id) });
    },
  });
}

export function useCreateHadRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHadRoundInput) => createHadRound(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: hadQueryKeys.dailyRound(data.episodeId, toDayKey(new Date(data.roundAt))),
      });
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.episodeDetail(data.episodeId) });
    },
  });
}

export function useInsertHadMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHadMeasurementInput) => insertHadMeasurement(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: hadQueryKeys.todayMeasurements(data.episodeId, toDayKey(new Date(data.recordedAt))),
      });
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.episodeDetail(data.episodeId) });
    },
  });
}

export function useCompleteHadTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteHadTaskInput) => completeHadTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hadQueryKeys.all });
    },
  });
}
