import type { Tables } from '@/lib/database.types';
import { queueDataAccessLog } from '@/lib/dataAccess';
import {
  getConsentHistory,
  hasTrackedExclusion,
  listConsentRegistry,
  type ConsentHistoryEntry,
  type ConsentRegistryEntry,
} from '@/lib/eHealthConsent';
import { supabase } from '@/lib/supabase';

type DataAccessLogRow = Pick<
  Tables<'data_access_logs'>,
  | 'id'
  | 'action'
  | 'table_name'
  | 'record_id'
  | 'patient_id'
  | 'resource_label'
  | 'ip_hint'
  | 'severity'
  | 'contains_pii'
  | 'system_generated'
  | 'created_at'
> & {
  actor: Pick<Tables<'profiles'>, 'first_name' | 'last_name' | 'role' | 'email'> | null;
  patient: Pick<Tables<'patients'>, 'first_name' | 'last_name'> | null;
};

export interface AdminEHealthComplianceSnapshot {
  summary: {
    userCount: number;
    alertCount: number;
    complianceScore: number;
  };
  recentActivity: {
    user: string;
    role: string;
    action: string;
    time: string;
  }[];
  audit: {
    auditLog: {
      id: string;
      time: string;
      date: string;
      user: string;
      action: string;
      resource: string;
      ip: string;
      severity: 'high' | 'low' | 'medium';
      pii: boolean;
      system: boolean;
    }[];
    suspiciousActivityNote: string;
  };
  consents: {
    patientConsents: {
      patientId: string;
      patient: string;
      consent: 'active' | 'missing' | 'renewal';
      therapeuticLink: 'blocked' | 'ok' | 'review';
      exclusion: string;
      lastSync: string;
    }[];
    syncGaps: {
      label: string;
      detail: string;
      severity: 'amber' | 'green' | 'red';
    }[];
    accessAudit: {
      label: string;
      value: string;
      tone: 'amber' | 'blue' | 'green';
    }[];
    syncNotice: string;
  };
  complianceHighlights: {
    label: string;
    value: string;
    tone: 'amber' | 'blue' | 'green' | 'red';
  }[];
  complianceNotice: string;
}

export const emptyAdminEHealthComplianceSnapshot: AdminEHealthComplianceSnapshot = {
  summary: {
    userCount: 0,
    alertCount: 0,
    complianceScore: 0,
  },
  recentActivity: [],
  audit: {
    auditLog: [],
    suspiciousActivityNote: 'Aucune donnée de journalisation eHealth disponible.',
  },
  consents: {
    patientConsents: [],
    syncGaps: [],
    accessAudit: [],
    syncNotice: 'Aucune synchronisation eHealth enregistrée.',
  },
  complianceHighlights: [],
  complianceNotice: 'Le module de conformité eHealth n’a pas encore collecté de données.',
};

function isMissingSchemaArtifact(error: { code?: string | null } | null) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isWithinHours(value: string, hours: number) {
  return Date.now() - new Date(value).getTime() <= hours * 60 * 60 * 1000;
}

function getActorLabel(log: DataAccessLogRow) {
  const fullName = `${log.actor?.first_name ?? ''} ${log.actor?.last_name ?? ''}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  if (log.actor?.email) {
    return log.actor.email;
  }

  return log.system_generated ? 'Système' : 'Utilisateur inconnu';
}

function getRoleLabel(log: DataAccessLogRow) {
  if (log.system_generated) {
    return 'Système';
  }

  switch (log.actor?.role ?? null) {
    case 'admin':
      return 'Admin';
    case 'billing_office':
      return 'Facturation';
    case 'coordinator':
      return 'Coordinateur';
    case 'nurse':
      return 'Infirmier·ère';
    case 'patient':
      return 'Patient';
    default:
      return 'Utilisateur';
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case 'delete':
      return 'DELETE';
    case 'insert':
    case 'update':
      return 'EDIT';
    case 'sync':
      return 'SYNC';
    default:
      return 'VIEW';
  }
}

function getResourceLabel(log: DataAccessLogRow) {
  const patientName = `${log.patient?.first_name ?? ''} ${log.patient?.last_name ?? ''}`.trim();
  const suffix = patientName.length > 0 ? ` · ${patientName}` : '';
  return `${log.resource_label || log.table_name}${suffix}`;
}

async function safeSelect<T>(
  promise: PromiseLike<{ data: T | null; error: { code?: string | null } | null }>,
  fallback: T,
) {
  const { data, error } = await promise;

  if (error) {
    if (isMissingSchemaArtifact(error)) {
      return fallback;
    }

    throw error;
  }

  return data ?? fallback;
}

async function safeCount(
  promise: PromiseLike<{ count: number | null; error: { code?: string | null } | null }>,
  fallback = 0,
) {
  const { count, error } = await promise;

  if (error) {
    if (isMissingSchemaArtifact(error)) {
      return fallback;
    }

    throw error;
  }

  return count ?? fallback;
}

async function getAuditRows() {
  const rows = await safeSelect(
    supabase
      .from('data_access_logs')
      .select(`
        id,
        action,
        table_name,
        record_id,
        patient_id,
        resource_label,
        ip_hint,
        severity,
        contains_pii,
        system_generated,
        created_at,
        actor:profiles!data_access_logs_actor_id_fkey (
          first_name,
          last_name,
          role,
          email
        ),
        patient:patients!data_access_logs_patient_id_fkey (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(80),
    [] as DataAccessLogRow[],
  );

  queueDataAccessLog({
    tableName: 'data_access_logs',
    action: 'read',
    resourceLabel: 'Consultation du journal d’audit eHealth',
    containsPii: false,
    severity: 'low',
    metadata: { count: rows.length },
  });

  return rows;
}

function buildConsentScore(consents: ConsentRegistryEntry[], history: ConsentHistoryEntry[], auditRows: DataAccessLogRow[]) {
  const total = consents.length;
  const activeConsents = consents.filter((entry) => entry.consentStatus === 'active').length;
  const okLinks = consents.filter((entry) => entry.therapeuticLinkStatus === 'ok').length;
  const patientScopedLogs = auditRows.filter((row) => row.patient_id).length;
  const recentSyncs = history.filter((entry) => isWithinHours(entry.syncedAt, 24)).length;

  if (total === 0) {
    return 0;
  }

  const consentCoverage = (activeConsents / total) * 100;
  const therapeuticCoverage = (okLinks / total) * 100;
  const auditCoverage = Math.min(100, (patientScopedLogs / total) * 100);
  const syncFreshness = Math.min(100, (recentSyncs / total) * 100);

  return clamp(
    Math.round(
      consentCoverage * 0.4 +
        therapeuticCoverage * 0.25 +
        auditCoverage * 0.2 +
        syncFreshness * 0.15,
    ),
    0,
    100,
  );
}

export async function getAdminEHealthComplianceSnapshot(): Promise<AdminEHealthComplianceSnapshot> {
  const [auditRows, consentRegistry, consentHistory, userCount] = await Promise.all([
    getAuditRows(),
    listConsentRegistry(),
    getConsentHistory(),
    safeCount(supabase.from('profiles').select('*', { count: 'exact', head: true }), 0),
  ]);

  const highSeverityCount = auditRows.filter(
    (row) => row.severity === 'high' && isWithinHours(row.created_at, 24),
  ).length;
  const blockedLinks = consentRegistry.filter(
    (entry) => entry.therapeuticLinkStatus === 'blocked',
  ).length;
  const nonActiveConsents = consentRegistry.filter(
    (entry) => entry.consentStatus !== 'active',
  ).length;
  const fallbackSyncs = consentHistory.filter((entry) => entry.status === 'fallback').length;
  const recentSyncErrors = consentHistory.filter(
    (entry) => entry.status === 'error' && isWithinHours(entry.syncedAt, 24),
  ).length;
  const recentSyncs = consentHistory.filter((entry) => isWithinHours(entry.syncedAt, 24)).length;
  const complianceScore = buildConsentScore(consentRegistry, consentHistory, auditRows);
  const alertCount = highSeverityCount + blockedLinks + recentSyncErrors;
  const coveredAccesses = auditRows.filter((row) => row.patient_id || row.contains_pii).length;
  const exclusionsTracked = consentRegistry.filter(hasTrackedExclusion).length;

  const auditLog = auditRows.map((row) => ({
    id: row.id,
    time: formatTime(row.created_at),
    date: formatDate(row.created_at),
    user: getActorLabel(row),
    action: getActionLabel(row.action),
    resource: getResourceLabel(row),
    ip: row.ip_hint ?? 'client-web',
    severity: row.severity as 'high' | 'low' | 'medium',
    pii: row.contains_pii,
    system: row.system_generated,
  }));

  const syncGaps: AdminEHealthComplianceSnapshot['consents']['syncGaps'] = [
    {
      label: 'Consentements à régulariser',
      detail:
        nonActiveConsents > 0
          ? `${nonActiveConsents} patient(s) sans consentement actif ou à renouveler.`
          : 'Tous les consentements enregistrés sont actifs.',
      severity:
        nonActiveConsents === 0 ? 'green' : nonActiveConsents >= 3 ? 'red' : 'amber',
    },
    {
      label: 'Liens thérapeutiques bloqués',
      detail:
        blockedLinks > 0
          ? `${blockedLinks} accès sont bloqués tant que la relation thérapeutique n’est pas confirmée.`
          : 'Aucun lien thérapeutique bloqué.',
      severity: blockedLinks === 0 ? 'green' : blockedLinks >= 2 ? 'red' : 'amber',
    },
    {
      label: 'Synchronisations locales de secours',
      detail:
        fallbackSyncs > 0
          ? `${fallbackSyncs} synchronisation(s) ont utilisé le fallback local faute de connecteur eHealth actif.`
          : 'Aucune synchronisation en mode fallback.',
      severity: fallbackSyncs === 0 ? 'green' : 'amber',
    },
    {
      label: 'Erreurs de synchronisation récentes',
      detail:
        recentSyncErrors > 0
          ? `${recentSyncErrors} tentative(s) en erreur sur les dernières 24h.`
          : 'Aucune erreur de synchronisation sur les dernières 24h.',
      severity: recentSyncErrors === 0 ? 'green' : 'red',
    },
  ];

  return {
    summary: {
      userCount,
      alertCount,
      complianceScore,
    },
    recentActivity: auditRows.slice(0, 8).map((row) => ({
      user: getActorLabel(row),
      role: getRoleLabel(row),
      action: `${getActionLabel(row.action)} · ${row.resource_label || row.table_name}`,
      time: formatDateTime(row.created_at),
    })),
    audit: {
      auditLog,
      suspiciousActivityNote:
        highSeverityCount > 0
          ? `${highSeverityCount} accès sensibles critiques ont été détectés sur les dernières 24h.`
          : auditRows.length > 0
            ? 'Aucune anomalie critique détectée sur les dernières 24h.'
            : 'Le journal d’audit ne contient pas encore d’évènement récent.',
    },
    consents: {
      patientConsents: consentRegistry.map((entry) => ({
        patientId: entry.patientId,
        patient: entry.patientName,
        consent: entry.consentStatus,
        therapeuticLink: entry.therapeuticLinkStatus,
        exclusion: entry.exclusionNote,
        lastSync: entry.lastSyncAt ? formatDateTime(entry.lastSyncAt) : 'Jamais',
      })),
      syncGaps,
      accessAudit: [
        {
          label: 'Accès patients couverts',
          value: String(coveredAccesses),
          tone: coveredAccesses > 0 ? 'green' : 'amber',
        },
        {
          label: "Règles d'exclusion suivies",
          value: String(exclusionsTracked),
          tone: exclusionsTracked > 0 ? 'blue' : 'amber',
        },
        {
          label: 'Synchronisations eHealth 24h',
          value: String(recentSyncs),
          tone: recentSyncs > 0 ? 'green' : 'amber',
        },
      ],
      syncNotice:
        fallbackSyncs > 0
          ? `${fallbackSyncs} synchronisation(s) utilisent encore le fallback local. Le connecteur eHealth réel reste à brancher.`
          : recentSyncs > 0
            ? `Dernière activité de synchronisation enregistrée le ${formatDateTime(
                consentHistory[0]?.syncedAt ?? new Date().toISOString(),
              )}.`
            : 'Aucune synchronisation eHealth n’a encore été enregistrée.',
    },
    complianceHighlights: [
      {
        label: 'Consentements actifs',
        value: `${consentRegistry.filter((entry) => entry.consentStatus === 'active').length}/${consentRegistry.length}`,
        tone: nonActiveConsents === 0 ? 'green' : 'amber',
      },
      {
        label: 'Liens thérapeutiques OK',
        value: `${consentRegistry.filter((entry) => entry.therapeuticLinkStatus === 'ok').length}/${consentRegistry.length}`,
        tone: blockedLinks === 0 ? 'green' : 'amber',
      },
      {
        label: 'Synchronisations 24h',
        value: String(recentSyncs),
        tone: recentSyncs > 0 ? 'blue' : 'amber',
      },
      {
        label: 'Évènements critiques',
        value: String(highSeverityCount),
        tone: highSeverityCount === 0 ? 'green' : 'red',
      },
    ],
    complianceNotice:
      nonActiveConsents > 0 || blockedLinks > 0
        ? `${nonActiveConsents} consentement(s) non actifs et ${blockedLinks} lien(s) thérapeutiques bloqués doivent encore être régularisés.`
        : 'Le registre eHealth, la journalisation d’accès et la traçabilité de synchronisation sont opérationnels.',
  };
}
