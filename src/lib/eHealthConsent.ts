import type { Json, Tables, TablesInsert } from '@/lib/database.types';
import { queueDataAccessLog, logDataAccess } from '@/lib/dataAccess';
import { maskNiss } from '@/lib/niss';
import { supabase } from '@/lib/supabase';

export type ConsentStatus = 'active' | 'renewal' | 'missing';
export type TherapeuticLinkStatus = 'ok' | 'review' | 'blocked';
export type ConsentSyncType = 'consent' | 'therapeutic_link' | 'full';
export type ConsentSyncStatus = 'pending' | 'success' | 'fallback' | 'error';

type JsonObject = { [key: string]: Json | undefined };

type PatientNameRow = Pick<Tables<'patients'>, 'id' | 'first_name' | 'last_name' | 'niss' | 'is_active'>;
type ConsentRegistryPatientRow = Pick<Tables<'patients'>, 'id' | 'first_name' | 'last_name' | 'niss' | 'is_active'>;
type PatientConsentRow = Pick<
  Tables<'patient_consents'>,
  'id' | 'patient_id' | 'consent_status' | 'therapeutic_link_status' | 'exclusion_note' | 'last_sync_at' | 'source'
>;
type PatientAssignmentRow = Pick<Tables<'patient_assignments'>, 'patient_id'>;
type ConsentSyncLogTableRow = Pick<
  Tables<'ehealth_consent_sync_logs'>,
  'id' | 'patient_id' | 'sync_type' | 'status' | 'source' | 'response_code' | 'payload' | 'error_detail' | 'synced_at'
>;
type ConsentSyncLogRow = ConsentSyncLogTableRow & {
  patient: Pick<Tables<'patients'>, 'first_name' | 'last_name'> | null;
};

export interface ConsentRegistryEntry {
  patientId: string;
  patientName: string;
  patientNissMasked: string;
  consentStatus: ConsentStatus;
  therapeuticLinkStatus: TherapeuticLinkStatus;
  exclusionNote: string;
  lastSyncAt: string | null;
  source: string;
  latestSyncStatus: ConsentSyncStatus | null;
  latestResponseCode: string | null;
}

export interface ConsentHistoryEntry {
  id: string;
  patientId: string;
  patientName: string;
  syncType: ConsentSyncType;
  status: ConsentSyncStatus;
  source: string;
  responseCode: string | null;
  detail: string;
  payload: Json;
  syncedAt: string;
}

export interface TherapeuticLinkCheckResult {
  status: TherapeuticLinkStatus;
  assignmentCount: number;
  source: 'assignment' | 'patient_consents';
}

export interface SyncPatientConsentOptions {
  syncType?: ConsentSyncType;
  force?: boolean;
  reason?: string;
}

export interface SyncPatientConsentResult {
  patientId: string;
  consentStatus: ConsentStatus;
  therapeuticLinkStatus: TherapeuticLinkStatus;
  source: string;
  status: ConsentSyncStatus;
  responseCode: string | null;
  syncedAt: string;
}

interface EHealthConsentConnectorInput {
  patient: PatientNameRow;
  existingConsent: PatientConsentRow | null;
  assignmentCount: number;
  syncType: ConsentSyncType;
}

interface EHealthConsentConnectorResult {
  consentStatus?: ConsentStatus;
  therapeuticLinkStatus?: TherapeuticLinkStatus;
  exclusionNote?: string;
  source?: string;
  responseCode?: string | null;
  payload?: Json;
  status?: Exclude<ConsentSyncStatus, 'pending'>;
}

export interface EHealthConsentConnector {
  syncPatientConsent(input: EHealthConsentConnectorInput): Promise<EHealthConsentConnectorResult>;
}

let registeredConnector: EHealthConsentConnector | null = null;

function isMissingSchemaArtifact(error: { code?: string | null } | null) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

function normalizeConsentStatus(value: string | null | undefined): ConsentStatus {
  switch (value) {
    case 'active':
    case 'renewal':
      return value;
    default:
      return 'missing';
  }
}

function normalizeTherapeuticLinkStatus(value: string | null | undefined): TherapeuticLinkStatus {
  switch (value) {
    case 'ok':
    case 'review':
      return value;
    default:
      return 'blocked';
  }
}

function formatPatientName(patient: Pick<Tables<'patients'>, 'first_name' | 'last_name'> | null | undefined) {
  const fullName = `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim();
  return fullName.length > 0 ? fullName : 'Patient non renseigné';
}

function isNeutralExclusion(note: string | null | undefined) {
  const value = (note ?? '').trim().toLowerCase();
  return value.length === 0 || value === 'aucune' || value === 'aucune exclusion synchronisée';
}

function buildFallbackConsent(
  existingConsent: PatientConsentRow | null,
  assignmentCount: number,
) {
  const hasAssignment = assignmentCount > 0;

  return {
    consentStatus: normalizeConsentStatus(
      existingConsent?.consent_status ?? (hasAssignment ? 'renewal' : 'missing'),
    ),
    therapeuticLinkStatus: normalizeTherapeuticLinkStatus(
      existingConsent?.therapeutic_link_status ?? (hasAssignment ? 'review' : 'blocked'),
    ),
    exclusionNote:
      existingConsent?.exclusion_note ??
      (hasAssignment
        ? 'Aucune exclusion synchronisée'
        : 'Aucune relation thérapeutique active détectée'),
    source: 'local-fallback',
    responseCode: 'LOCAL_FALLBACK',
    payload: {
      connectorConfigured: false,
      assignmentCount,
      existingSource: existingConsent?.source ?? null,
    } satisfies JsonObject,
    status: 'fallback' as const,
  };
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

async function loadPatient(patientId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, niss, is_active')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Patient introuvable.');
  }

  return data as PatientNameRow;
}

async function loadPatientConsent(patientId: string) {
  const { data, error } = await supabase
    .from('patient_consents')
    .select('id, patient_id, consent_status, therapeutic_link_status, exclusion_note, last_sync_at, source')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PatientConsentRow | null) ?? null;
}

async function countAssignments(patientId: string, profileId?: string) {
  let query = supabase
    .from('patient_assignments')
    .select('patient_id', { count: 'exact', head: true })
    .eq('patient_id', patientId);

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function registerEHealthConsentConnector(connector: EHealthConsentConnector | null) {
  registeredConnector = connector;
}

export async function checkTherapeuticLink(
  patientId: string,
  profileId?: string,
): Promise<TherapeuticLinkCheckResult> {
  const [consent, assignmentCount] = await Promise.all([
    loadPatientConsent(patientId),
    countAssignments(patientId, profileId),
  ]);

  if (consent?.therapeutic_link_status) {
    return {
      status: normalizeTherapeuticLinkStatus(consent.therapeutic_link_status),
      assignmentCount,
      source: 'patient_consents',
    };
  }

  return {
    status: assignmentCount > 0 ? 'review' : 'blocked',
    assignmentCount,
    source: 'assignment',
  };
}

export async function listConsentRegistry(): Promise<ConsentRegistryEntry[]> {
  const [patients, consents, assignments, history] = await Promise.all([
    safeSelect(
      supabase
        .from('patients')
        .select('id, first_name, last_name, niss, is_active')
        .eq('is_active', true)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true }),
      [] as ConsentRegistryPatientRow[],
    ),
    safeSelect(
      supabase
        .from('patient_consents')
        .select('id, patient_id, consent_status, therapeutic_link_status, exclusion_note, last_sync_at, source'),
      [] as PatientConsentRow[],
    ),
    safeSelect(
      supabase
        .from('patient_assignments')
        .select('patient_id')
        .order('patient_id', { ascending: true }),
      [] as PatientAssignmentRow[],
    ),
    safeSelect(
      supabase
        .from('ehealth_consent_sync_logs')
        .select(`
          id,
          patient_id,
          sync_type,
          status,
          source,
          response_code,
          payload,
          error_detail,
          synced_at,
          patient:patients!ehealth_consent_sync_logs_patient_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('synced_at', { ascending: false }),
      [] as ConsentSyncLogRow[],
    ),
  ]);

  queueDataAccessLog({
    tableName: 'patient_consents',
    action: 'read',
    resourceLabel: 'Registre des consentements eHealth',
    containsPii: true,
    severity: 'low',
    metadata: {
      patientCount: patients.length,
      consentCount: consents.length,
      syncLogCount: history.length,
    },
  });

  const consentByPatientId = new Map(consents.map((row) => [row.patient_id, row] as const));
  const assignmentCountByPatientId = new Map<string, number>();
  const latestHistoryByPatientId = new Map<string, ConsentSyncLogRow>();

  for (const assignment of assignments) {
    assignmentCountByPatientId.set(
      assignment.patient_id,
      (assignmentCountByPatientId.get(assignment.patient_id) ?? 0) + 1,
    );
  }

  for (const row of history) {
    if (!latestHistoryByPatientId.has(row.patient_id)) {
      latestHistoryByPatientId.set(row.patient_id, row);
    }
  }

  return patients.map((patient) => {
    const consent = consentByPatientId.get(patient.id) ?? null;
    const assignmentCount = assignmentCountByPatientId.get(patient.id) ?? 0;
    const latestHistory = latestHistoryByPatientId.get(patient.id) ?? null;
    const fallback = buildFallbackConsent(consent, assignmentCount);

    return {
      patientId: patient.id,
      patientName: formatPatientName(patient),
      patientNissMasked: maskNiss(patient.niss),
      consentStatus: consent
        ? normalizeConsentStatus(consent.consent_status)
        : fallback.consentStatus,
      therapeuticLinkStatus: consent
        ? normalizeTherapeuticLinkStatus(consent.therapeutic_link_status)
        : fallback.therapeuticLinkStatus,
      exclusionNote: consent?.exclusion_note ?? fallback.exclusionNote,
      lastSyncAt: consent?.last_sync_at ?? latestHistory?.synced_at ?? null,
      source: consent?.source ?? fallback.source,
      latestSyncStatus: latestHistory
        ? (latestHistory.status as ConsentSyncStatus)
        : null,
      latestResponseCode: latestHistory?.response_code ?? null,
    };
  });
}

export async function getConsentHistory(patientId?: string): Promise<ConsentHistoryEntry[]> {
  let query = supabase
    .from('ehealth_consent_sync_logs')
    .select(`
      id,
      patient_id,
      sync_type,
      status,
      source,
      response_code,
      payload,
      error_detail,
      synced_at,
      patient:patients!ehealth_consent_sync_logs_patient_id_fkey (
        first_name,
        last_name
      )
    `)
    .order('synced_at', { ascending: false })
    .limit(50);

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const rows = await safeSelect(query, [] as ConsentSyncLogRow[]);

  queueDataAccessLog({
    tableName: 'ehealth_consent_sync_logs',
    action: 'read',
    recordId: patientId ?? null,
    patientId: patientId ?? null,
    resourceLabel: patientId
      ? 'Historique de synchronisation eHealth'
      : 'Historique global de synchronisation eHealth',
    containsPii: true,
    severity: 'low',
    metadata: { patientScoped: Boolean(patientId), count: rows.length },
  });

  return rows.map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    patientName: formatPatientName(row.patient),
    syncType: row.sync_type as ConsentSyncType,
    status: row.status as ConsentSyncStatus,
    source: row.source,
    responseCode: row.response_code ?? null,
    detail:
      row.error_detail ??
      (row.status === 'fallback'
        ? 'Synchronisation effectuée en mode local de secours.'
        : row.status === 'success'
          ? 'Synchronisation confirmée.'
          : 'Synchronisation en attente.'),
    payload: row.payload,
    syncedAt: row.synced_at,
  }));
}

export async function syncPatientConsent(
  patientId: string,
  options: SyncPatientConsentOptions = {},
): Promise<SyncPatientConsentResult> {
  const syncType = options.syncType ?? 'full';
  const syncedAt = new Date().toISOString();
  const [patient, existingConsent, assignmentCount] = await Promise.all([
    loadPatient(patientId),
    loadPatientConsent(patientId),
    countAssignments(patientId),
  ]);
  const fallback = buildFallbackConsent(existingConsent, assignmentCount);

  let consentStatus = fallback.consentStatus;
  let therapeuticLinkStatus = fallback.therapeuticLinkStatus;
  let exclusionNote = fallback.exclusionNote;
  let source = fallback.source;
  let responseCode: string | null = fallback.responseCode;
  let payload: Json = fallback.payload;
  let status: ConsentSyncStatus = fallback.status;
  let errorDetail: string | null = null;

  if (registeredConnector) {
    try {
      const connectorResult = await registeredConnector.syncPatientConsent({
        patient,
        existingConsent,
        assignmentCount,
        syncType,
      });

      consentStatus = connectorResult.consentStatus ?? fallback.consentStatus;
      therapeuticLinkStatus =
        connectorResult.therapeuticLinkStatus ?? fallback.therapeuticLinkStatus;
      exclusionNote = connectorResult.exclusionNote ?? fallback.exclusionNote;
      source = connectorResult.source ?? 'ehealth-api';
      responseCode = connectorResult.responseCode ?? 'OK';
      status = connectorResult.status ?? 'success';
      payload = {
        fallback: fallback.payload,
        connector: connectorResult.payload ?? null,
      } satisfies JsonObject;
    } catch (error) {
      status = 'error';
      source = 'ehealth-api';
      responseCode = 'CONNECTOR_ERROR';
      payload = {
        fallback: fallback.payload,
        connector: null,
      } satisfies JsonObject;
      errorDetail = error instanceof Error ? error.message : 'Synchronisation eHealth en erreur.';
    }
  }

  const consentPayload = {
    patient_id: patientId,
    consent_status: consentStatus,
    therapeutic_link_status: therapeuticLinkStatus,
    exclusion_note: exclusionNote,
    last_sync_at: syncedAt,
    source,
  } satisfies TablesInsert<'patient_consents'>;

  const { error: consentError } = await supabase
    .from('patient_consents')
    .upsert(consentPayload, { onConflict: 'patient_id' });

  if (consentError) {
    throw consentError;
  }

  const { error: syncLogError } = await supabase
    .from('ehealth_consent_sync_logs')
    .insert({
      patient_id: patientId,
      sync_type: syncType,
      status,
      source,
      response_code: responseCode,
      payload: {
        request: {
          reason: options.reason ?? null,
          force: options.force ?? false,
        },
        response: payload,
      } satisfies JsonObject,
      error_detail: errorDetail,
      synced_at: syncedAt,
    });

  if (syncLogError) {
    throw syncLogError;
  }

  await logDataAccess({
    tableName: 'patient_consents',
    action: 'sync',
    patientId,
    recordId: existingConsent?.id ?? null,
    resourceLabel: `Synchronisation consentement eHealth · ${formatPatientName(patient)}`,
    severity: status === 'error' ? 'high' : status === 'fallback' ? 'medium' : 'low',
    containsPii: true,
    metadata: {
      syncType,
      status,
      responseCode,
      connectorConfigured: Boolean(registeredConnector),
    },
  });

  return {
    patientId,
    consentStatus,
    therapeuticLinkStatus,
    source,
    status,
    responseCode,
    syncedAt,
  };
}

export async function syncConsentRegistry(
  patientIds: string[],
  options: SyncPatientConsentOptions = {},
) {
  const results: SyncPatientConsentResult[] = [];

  for (const patientId of patientIds) {
    results.push(await syncPatientConsent(patientId, options));
  }

  return results;
}

export function hasTrackedExclusion(entry: Pick<ConsentRegistryEntry, 'exclusionNote'>) {
  return !isNeutralExclusion(entry.exclusionNote);
}
