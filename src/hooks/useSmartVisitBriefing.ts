import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import { useHadEpisodeDetail, useHadPatientEpisodes } from '@/hooks/useHadData';
import { useNurseVisitHistory, useNurseWoundAssessments } from '@/hooks/useNurseClinicalData';
import { useNursePatient } from '@/hooks/useNursePatients';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { getPatientConsentSnapshot, listEAgreementRequests } from '@/lib/eagreements';
import { buildSmartVisitBriefing, type SmartVisitMedicationReminder, type SmartVisitTimelineEvent } from '@/lib/smartVisitBriefing';
import { supabase } from '@/lib/supabase';

async function listPatientMedicationReminders(patientId: string): Promise<SmartVisitMedicationReminder[]> {
  const { data, error } = await supabase
    .from('medication_reminders')
    .select('id, name, scheduled_for, status, taken_at')
    .eq('patient_id', patientId)
    .order('scheduled_for', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  queueDataAccessLog({
    tableName: 'medication_reminders',
    action: 'read',
    patientId,
    resourceLabel: 'Briefing visite - rappels médicaments',
    containsPii: true,
    severity: 'low',
    metadata: {
      reminderCount: data?.length ?? 0,
    },
  });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    scheduledFor: row.scheduled_for,
    status: row.status,
    takenAt: row.taken_at ?? undefined,
  }));
}

async function listPatientTimelineEvents(patientId: string): Promise<SmartVisitTimelineEvent[]> {
  const { data, error } = await supabase
    .from('patient_timeline_events')
    .select('id, label, event_time, status')
    .eq('patient_id', patientId)
    .order('event_time', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(6);

  if (error) {
    throw error;
  }

  queueDataAccessLog({
    tableName: 'patient_timeline_events',
    action: 'read',
    patientId,
    resourceLabel: 'Briefing visite - chronologie patient',
    containsPii: true,
    severity: 'low',
    metadata: {
      eventCount: data?.length ?? 0,
    },
  });

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    eventTime: row.event_time,
    status: row.status,
  }));
}

export function useSmartVisitBriefing(patientRouteId?: string) {
  const patientQuery = useNursePatient(patientRouteId);
  const patient = patientQuery.data ?? null;
  const databasePatientId = patient?.databaseId;

  const visitHistoryQuery = useNurseVisitHistory(databasePatientId, 6);
  const woundAssessmentsQuery = useNurseWoundAssessments(databasePatientId);
  const hadEpisodesQuery = useHadPatientEpisodes(databasePatientId, true);
  const activeEpisode = hadEpisodesQuery.data?.[0] ?? null;
  const hadEpisodeDetailQuery = useHadEpisodeDetail(activeEpisode?.id);
  const belraiQuery = useBelraiTwin(patientRouteId);

  const consentQuery = useQuery({
    queryKey: ['smart-visit-briefing', 'consent', databasePatientId ?? 'unknown'],
    enabled: Boolean(databasePatientId),
    queryFn: () => getPatientConsentSnapshot(databasePatientId!),
  });

  const agreementQuery = useQuery({
    queryKey: ['smart-visit-briefing', 'agreements', databasePatientId ?? 'unknown'],
    enabled: Boolean(databasePatientId),
    queryFn: () => listEAgreementRequests({ patientId: databasePatientId!, limit: 8 }),
  });

  const medicationQuery = useQuery({
    queryKey: ['smart-visit-briefing', 'medications', databasePatientId ?? 'unknown'],
    enabled: Boolean(databasePatientId),
    queryFn: () => listPatientMedicationReminders(databasePatientId!),
  });

  const timelineQuery = useQuery({
    queryKey: ['smart-visit-briefing', 'timeline', databasePatientId ?? 'unknown'],
    enabled: Boolean(databasePatientId),
    queryFn: () => listPatientTimelineEvents(databasePatientId!),
  });

  const briefing = useMemo(() => {
    if (!patient) {
      return null;
    }

    return buildSmartVisitBriefing({
      patient,
      visitHistory: visitHistoryQuery.data ?? [],
      woundAssessments: woundAssessmentsQuery.data ?? [],
      activeEpisode,
      hadEpisodeDetail: hadEpisodeDetailQuery.data ?? null,
      consent: consentQuery.data ?? null,
      agreementRequests: agreementQuery.data ?? [],
      medicationReminders: medicationQuery.data ?? [],
      timelineEvents: timelineQuery.data ?? [],
      belrai: belraiQuery.data ?? null,
    });
  }, [
    activeEpisode,
    agreementQuery.data,
    belraiQuery.data,
    consentQuery.data,
    hadEpisodeDetailQuery.data,
    medicationQuery.data,
    patient,
    timelineQuery.data,
    visitHistoryQuery.data,
    woundAssessmentsQuery.data,
  ]);

  const dataIssues = useMemo(() => {
    const issues: string[] = [];

    if (visitHistoryQuery.error) {
      issues.push('historique de visites');
    }

    if (woundAssessmentsQuery.error) {
      issues.push('suivi de plaies');
    }

    if (hadEpisodesQuery.error || hadEpisodeDetailQuery.error) {
      issues.push('données HAD');
    }

    if (consentQuery.error) {
      issues.push('consentements');
    }

    if (agreementQuery.error) {
      issues.push('eAgreement');
    }

    if (medicationQuery.error) {
      issues.push('rappels médicaments');
    }

    if (timelineQuery.error) {
      issues.push('chronologie patient');
    }

    if (belraiQuery.error) {
      issues.push('BelRAI Twin');
    }

    return issues;
  }, [
    agreementQuery.error,
    belraiQuery.error,
    consentQuery.error,
    hadEpisodeDetailQuery.error,
    hadEpisodesQuery.error,
    medicationQuery.error,
    timelineQuery.error,
    visitHistoryQuery.error,
    woundAssessmentsQuery.error,
  ]);

  const isLoading = patientQuery.isLoading
    || visitHistoryQuery.isLoading
    || woundAssessmentsQuery.isLoading
    || hadEpisodesQuery.isLoading
    || hadEpisodeDetailQuery.isLoading
    || consentQuery.isLoading
    || agreementQuery.isLoading
    || medicationQuery.isLoading
    || timelineQuery.isLoading;

  const refetchAll = async () => {
    await Promise.all([
      patientQuery.refetch(),
      visitHistoryQuery.refetch(),
      woundAssessmentsQuery.refetch(),
      hadEpisodesQuery.refetch(),
      hadEpisodeDetailQuery.refetch(),
      consentQuery.refetch(),
      agreementQuery.refetch(),
      medicationQuery.refetch(),
      timelineQuery.refetch(),
      belraiQuery.refetch(),
    ]);
  };

  return {
    patient,
    briefing,
    isLoading,
    notFound: !patientQuery.isLoading && !patientQuery.error && !patient,
    primaryError: patientQuery.error,
    dataIssues,
    refetchAll,
  } as const;
}
