import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { supabase } from '@/lib/supabase';

type BelraiBadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'outline';
type BelraiRecordRole = 'prep' | 'official';

type RawBelraiPatient = {
  city: string;
  first_name: string;
  katz_category: string | null;
  last_name: string;
};

type RawBelraiAssessment = {
  id: string;
  next_due_at: string | null;
  official_received_at?: string | null;
  patient_id: string;
  patients: RawBelraiPatient | RawBelraiPatient[] | null;
  record_role?: string | null;
  shared_with_patient_at?: string | null;
  source_system?: string | null;
  status: string;
  sync_status: string;
  template_key: string;
  template_version: string;
  updated_at: string;
};

interface BelraiOperationsGroup {
  patient: RawBelraiPatient | null;
  patientId: string;
  latestUpdatedAt: string;
  official: RawBelraiAssessment | null;
  prep: RawBelraiAssessment | null;
}

export interface BelraiOperationsEntry {
  id: string;
  patientId: string;
  patientName: string;
  city: string;
  katzLabel: string;
  instrumentLabel: string;
  updatedLabel: string;
  dueLabel: string;
  dueSoon: boolean;
  overdue: boolean;
  statusLabel: string;
  statusVariant: BelraiBadgeVariant;
  syncLabel: string;
  syncVariant: BelraiBadgeVariant;
}

export interface BelraiOperationsSummary {
  attentionCount: number;
  dueSoonCount: number;
  inPrepCount: number;
  officialCount: number;
  overdueCount: number;
  queuedCount: number;
  syncedCount: number;
  totalCount: number;
}

const belraiOperationsQueryKey = ['belrai-operations'] as const;

function normalizePatient(row: RawBelraiAssessment['patients']) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

function getRecordRole(assessment: RawBelraiAssessment): BelraiRecordRole {
  return assessment.record_role === 'official' ? 'official' : 'prep';
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('fr-BE', {
    day: 'numeric',
    month: 'short',
  });
}

function isDueSoon(value: string | null, days: number) {
  if (!value) {
    return false;
  }

  const diff = new Date(value).getTime() - Date.now();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function isOverdue(value: string | null) {
  return value ? new Date(value).getTime() < Date.now() : false;
}

function getInstrumentLabel(templateKey: string) {
  switch (templateKey) {
    case 'interrai_hc_screener':
      return 'Prep screener HC';
    default:
      return templateKey.replaceAll('_', ' ');
  }
}

function getKatzLabel(category: string | null) {
  return category ? `Katz ${category}` : 'Katz non renseigne';
}

function getPrepStatusMeta(status: string) {
  switch (status) {
    case 'synced':
      return { label: 'Partage legacy', variant: 'green' as const };
    case 'ready_for_sync':
      return { label: 'Pret a transmettre', variant: 'amber' as const };
    case 'sync_error':
      return { label: 'Blocage', variant: 'red' as const };
    case 'in_review':
      return { label: 'En revue', variant: 'blue' as const };
    default:
      return { label: 'Preparation locale', variant: 'outline' as const };
  }
}

function getPrepSyncMeta(syncStatus: string) {
  switch (syncStatus) {
    case 'synced':
      return { label: 'Source partagee (legacy)', variant: 'green' as const };
    case 'processing':
      return { label: 'Transmission en cours', variant: 'blue' as const };
    case 'queued':
      return { label: 'En file', variant: 'amber' as const };
    case 'error':
      return { label: 'Erreur passerelle', variant: 'red' as const };
    default:
      return { label: 'Local uniquement', variant: 'outline' as const };
  }
}

function getGroupStatusMeta(group: BelraiOperationsGroup) {
  if (group.official?.shared_with_patient_at) {
    return { label: 'Partage patient', variant: 'green' as const };
  }

  if (group.official) {
    return { label: 'Officiel recu', variant: 'blue' as const };
  }

  if (group.prep) {
    return getPrepStatusMeta(group.prep.status);
  }

  return { label: 'Aucun dossier', variant: 'outline' as const };
}

function getGroupSyncMeta(group: BelraiOperationsGroup) {
  if (group.official?.shared_with_patient_at) {
    return { label: 'Partage patient actif', variant: 'green' as const };
  }

  if (group.official) {
    return { label: 'Resultats officiels recus', variant: 'blue' as const };
  }

  if (group.prep) {
    return getPrepSyncMeta(group.prep.sync_status);
  }

  return { label: 'Aucune transmission', variant: 'outline' as const };
}

async function loadBelraiOperations(limit: number) {
  const { data, error } = await supabase
    .from('belrai_assessments')
    .select(`
      *,
      patients (
        first_name,
        last_name,
        city,
        katz_category
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(Math.max(limit * 6, 40));

  if (error) {
    if (error.code === '42P01') {
      return [] as RawBelraiAssessment[];
    }

    throw error;
  }

  queueDataAccessLog({
    tableName: 'belrai_assessments',
    action: 'read',
    resourceLabel: 'Vue coordination BelRAI',
    containsPii: true,
    severity: 'medium',
    metadata: {
      scope: 'coordinator-belrai-operations',
      requestedLimit: limit,
      resultCount: data?.length ?? 0,
    },
  });

  return (data ?? []) as RawBelraiAssessment[];
}

function compareIsoDateDesc(left: string, right: string) {
  return new Date(right).getTime() - new Date(left).getTime();
}

export function useBelraiOperations(limit = 8) {
  const query = useQuery({
    queryKey: [...belraiOperationsQueryKey, limit],
    queryFn: () => loadBelraiOperations(limit),
  });

  const entries = useMemo<BelraiOperationsEntry[]>(() => {
    const groups = new Map<string, BelraiOperationsGroup>();

    (query.data ?? []).forEach((assessment) => {
      const patient = normalizePatient(assessment.patients);
      const existing = groups.get(assessment.patient_id);
      const nextLatestUpdatedAt = existing
        ? compareIsoDateDesc(existing.latestUpdatedAt, assessment.updated_at) > 0
          ? assessment.updated_at
          : existing.latestUpdatedAt
        : assessment.updated_at;
      const nextGroup: BelraiOperationsGroup = existing ?? {
        patient: patient,
        patientId: assessment.patient_id,
        latestUpdatedAt: assessment.updated_at,
        official: null,
        prep: null,
      };

      nextGroup.latestUpdatedAt = nextLatestUpdatedAt;

      if (!nextGroup.patient && patient) {
        nextGroup.patient = patient;
      }

      if (getRecordRole(assessment) === 'official') {
        nextGroup.official ??= assessment;
      } else {
        nextGroup.prep ??= assessment;
      }

      groups.set(assessment.patient_id, nextGroup);
    });

    return Array.from(groups.values())
      .sort((left, right) => compareIsoDateDesc(left.latestUpdatedAt, right.latestUpdatedAt))
      .slice(0, limit)
      .map((group) => {
        const patient = group.patient;
        const currentAssessment = group.official ?? group.prep;
        const dueAt = group.prep?.next_due_at ?? group.official?.next_due_at ?? null;
        const overdue = isOverdue(dueAt);
        const dueSoon = !overdue && isDueSoon(dueAt, 14);
        const statusMeta = getGroupStatusMeta(group);
        const syncMeta = getGroupSyncMeta(group);
        const updatedAt =
          group.official?.official_received_at ??
          group.official?.updated_at ??
          group.prep?.updated_at ??
          group.latestUpdatedAt;

        return {
          id: currentAssessment?.id ?? group.patientId,
          patientId: group.patientId,
          patientName: patient
            ? `${patient.first_name} ${patient.last_name}`.trim()
            : 'Patient non relie',
          city: patient?.city ?? 'Ville indisponible',
          katzLabel: getKatzLabel(patient?.katz_category ?? null),
          instrumentLabel: currentAssessment
            ? `${getInstrumentLabel(currentAssessment.template_key)} · ${currentAssessment.template_version}`
            : 'Instrument indisponible',
          updatedLabel: `Mis a jour le ${formatShortDate(updatedAt)}`,
          dueLabel: dueAt
            ? overdue
              ? `Echeance depassee depuis le ${formatShortDate(dueAt)}`
              : `Revue prevue le ${formatShortDate(dueAt)}`
            : 'Aucune echeance encodee',
          dueSoon,
          overdue,
          statusLabel: statusMeta.label,
          statusVariant: overdue && statusMeta.variant !== 'red' ? 'red' : statusMeta.variant,
          syncLabel: syncMeta.label,
          syncVariant: syncMeta.variant,
        };
      });
  }, [limit, query.data]);

  const summary = useMemo<BelraiOperationsSummary>(() => {
    const totalCount = entries.length;
    const syncedCount = entries.filter((entry) => entry.syncVariant === 'green').length;
    const officialCount = entries.filter((entry) => entry.syncVariant === 'blue').length;
    const queuedCount = entries.filter((entry) => entry.syncVariant === 'amber').length + officialCount;
    const inPrepCount = entries.filter((entry) => entry.syncVariant === 'outline').length;
    const overdueCount = entries.filter((entry) => entry.overdue).length;
    const dueSoonCount = entries.filter((entry) => entry.dueSoon).length;
    const attentionCount = entries.filter((entry) =>
      entry.overdue ||
      entry.statusVariant === 'red' ||
      entry.syncVariant === 'red' ||
      entry.statusVariant === 'amber'
    ).length;

    return {
      attentionCount,
      dueSoonCount,
      inPrepCount,
      officialCount,
      overdueCount,
      queuedCount,
      syncedCount,
      totalCount,
    };
  }, [entries]);

  return {
    ...query,
    entries,
    summary,
  } as const;
}
