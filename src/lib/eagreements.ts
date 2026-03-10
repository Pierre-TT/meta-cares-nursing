import type { Json, Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { supabase } from '@/lib/supabase';

type PatientSummaryRow = Pick<
  Tables<'patients'>,
  'id' | 'first_name' | 'last_name' | 'niss' | 'mutuality' | 'katz_category' | 'prescribing_doctor'
>;

type ProfileSummaryRow = Pick<
  Tables<'profiles'>,
  'id' | 'first_name' | 'last_name' | 'role'
>;

type HadEpisodeSummaryRow = Pick<Tables<'had_episodes'>, 'id' | 'reference'>;

type EAgreementRequestSelectRow = Tables<'eagreement_requests'> & {
  patient: PatientSummaryRow | null;
  created_by_profile: ProfileSummaryRow | null;
  reviewed_by_profile: ProfileSummaryRow | null;
  had_episode: HadEpisodeSummaryRow | null;
};

const eAgreementRequestSelect = `
  id,
  patient_id,
  belrai_assessment_id,
  had_episode_id,
  created_by_profile_id,
  reviewed_by_profile_id,
  care_type,
  nomenclature,
  katz_category,
  prescriber_name,
  start_at,
  end_at,
  status,
  mycarenet_reference,
  rejection_reason,
  required_attachments,
  supporting_context,
  submitted_at,
  decided_at,
  created_at,
  updated_at,
  patient:patients (
    id,
    first_name,
    last_name,
    niss,
    mutuality,
    katz_category,
    prescribing_doctor
  ),
  created_by_profile:profiles!eagreement_requests_created_by_profile_id_fkey (
    id,
    first_name,
    last_name,
    role
  ),
  reviewed_by_profile:profiles!eagreement_requests_reviewed_by_profile_id_fkey (
    id,
    first_name,
    last_name,
    role
  ),
  had_episode:had_episodes!eagreement_requests_had_episode_id_fkey (
    id,
    reference
  )
`;

function isRelationMissingError(error: { code?: string } | null | undefined) {
  return error?.code === '42P01';
}

function toFullName(profile?: ProfileSummaryRow | null) {
  if (!profile) {
    return undefined;
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  return fullName.length > 0 ? fullName : undefined;
}

function toStringArray(value: Json | null | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function toLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export type EAgreementRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type EAgreementPresentationStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'rejected'
  | 'cancelled';

export interface EAgreementPatientSummary {
  id: string;
  fullName: string;
  niss: string;
  mutuality: string;
  katzCategory?: Tables<'patients'>['katz_category'];
  prescribingDoctor: string;
}

export interface EAgreementProfileSummary {
  id: string;
  fullName: string;
  role: Tables<'profiles'>['role'];
}

export interface EAgreementRequest {
  id: string;
  patientId: string;
  patient: EAgreementPatientSummary;
  belraiAssessmentId?: string;
  hadEpisodeId?: string;
  hadEpisodeReference?: string;
  createdByProfileId?: string;
  reviewedByProfileId?: string;
  createdBy?: EAgreementProfileSummary;
  reviewedBy?: EAgreementProfileSummary;
  careType: string;
  nomenclature: string;
  katzCategory?: Tables<'patients'>['katz_category'];
  prescriberName: string;
  startAt: string;
  endAt: string;
  status: EAgreementRequestStatus;
  mycarenetReference?: string;
  rejectionReason?: string;
  requiredAttachments: string[];
  supportingContext: Json;
  submittedAt?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientConsentSnapshot {
  patientId: string;
  consentStatus: 'active' | 'renewal' | 'missing';
  therapeuticLinkStatus: 'ok' | 'review' | 'blocked';
  exclusionNote: string;
  lastSyncAt?: string;
  source: string;
}

export interface EAgreementListFilters {
  patientId?: string;
  statuses?: EAgreementRequestStatus[];
  limit?: number;
}

export interface CreateEAgreementRequestInput {
  patientId: string;
  careType: string;
  nomenclature: string;
  prescriberName: string;
  startAt: string;
  endAt: string;
  status?: EAgreementRequestStatus;
  katzCategory?: Tables<'patients'>['katz_category'] | null;
  belraiAssessmentId?: string | null;
  hadEpisodeId?: string | null;
  createdByProfileId?: string | null;
  reviewedByProfileId?: string | null;
  mycarenetReference?: string | null;
  rejectionReason?: string | null;
  requiredAttachments?: string[];
  supportingContext?: Json;
  submittedAt?: string | null;
  decidedAt?: string | null;
}

export interface UpdateEAgreementRequestInput {
  requestId: string;
  patch: Partial<CreateEAgreementRequestInput>;
}

function mapPatientSummary(patient: PatientSummaryRow | null): EAgreementPatientSummary {
  return {
    id: patient?.id ?? '',
    fullName: `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim(),
    niss: patient?.niss ?? '',
    mutuality: patient?.mutuality ?? '',
    katzCategory: patient?.katz_category ?? undefined,
    prescribingDoctor: patient?.prescribing_doctor ?? '',
  };
}

function mapProfileSummary(profile: ProfileSummaryRow | null): EAgreementProfileSummary | undefined {
  if (!profile) {
    return undefined;
  }

  const fullName = toFullName(profile);
  if (!fullName) {
    return undefined;
  }

  return {
    id: profile.id,
    fullName,
    role: profile.role,
  };
}

function mapEAgreementRequest(row: EAgreementRequestSelectRow): EAgreementRequest {
  return {
    id: row.id,
    patientId: row.patient_id,
    patient: mapPatientSummary(row.patient),
    belraiAssessmentId: row.belrai_assessment_id ?? undefined,
    hadEpisodeId: row.had_episode_id ?? undefined,
    hadEpisodeReference: row.had_episode?.reference ?? undefined,
    createdByProfileId: row.created_by_profile_id ?? undefined,
    reviewedByProfileId: row.reviewed_by_profile_id ?? undefined,
    createdBy: mapProfileSummary(row.created_by_profile),
    reviewedBy: mapProfileSummary(row.reviewed_by_profile),
    careType: row.care_type,
    nomenclature: row.nomenclature,
    katzCategory: row.katz_category ?? undefined,
    prescriberName: row.prescriber_name,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status as EAgreementRequestStatus,
    mycarenetReference: row.mycarenet_reference ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    requiredAttachments: toStringArray(row.required_attachments),
    supportingContext: row.supporting_context,
    submittedAt: row.submitted_at ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function queueEAgreementRegistryReadLog(
  requests: EAgreementRequest[],
  filters: EAgreementListFilters,
) {
  queueDataAccessLog({
    tableName: 'eagreement_requests',
    action: 'read',
    patientId: filters.patientId ?? null,
    resourceLabel: filters.patientId
      ? 'Consultation eAgreement patient'
      : 'Consultation du registre eAgreement',
    containsPii: true,
    severity: requests.length > 0 ? 'medium' : 'low',
    metadata: {
      patientScoped: Boolean(filters.patientId),
      requestCount: requests.length,
      patientCount: new Set(requests.map((request) => request.patientId)).size,
      statusFilters: filters.statuses ?? [],
      limit: filters.limit ?? null,
    },
  });
}

function toPersistedStatus(status?: string | null): EAgreementRequestStatus {
  switch (status) {
    case 'draft':
    case 'pending':
    case 'approved':
    case 'rejected':
    case 'cancelled':
      return status;
    default:
      return 'draft';
  }
}

export function getDaysUntilEAgreementEnd(request: Pick<EAgreementRequest, 'endAt'>, referenceDate = new Date()) {
  const endDate = toLocalDate(request.endAt);
  return Math.ceil((endDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function getEAgreementPresentationStatus(
  request: Pick<EAgreementRequest, 'status' | 'endAt'>,
  referenceDate = new Date(),
): EAgreementPresentationStatus {
  if (request.status === 'draft') {
    return 'draft';
  }

  if (request.status === 'pending') {
    return 'pending';
  }

  if (request.status === 'rejected') {
    return 'rejected';
  }

  if (request.status === 'cancelled') {
    return 'cancelled';
  }

  const daysLeft = getDaysUntilEAgreementEnd({ endAt: request.endAt }, referenceDate);

  if (daysLeft < 0) {
    return 'expired';
  }

  if (daysLeft <= 30) {
    return 'expiring';
  }

  return 'active';
}

export function getEAgreementPresentationLabel(status: EAgreementPresentationStatus) {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'expiring':
      return 'Expire bientôt';
    case 'expired':
      return 'Expiré';
    case 'pending':
      return 'En attente';
    case 'rejected':
      return 'Refusé';
    case 'cancelled':
      return 'Annulé';
    case 'draft':
    default:
      return 'Brouillon';
  }
}

export function getEAgreementPresentationVariant(status: EAgreementPresentationStatus) {
  switch (status) {
    case 'active':
      return 'green' as const;
    case 'expiring':
      return 'amber' as const;
    case 'expired':
    case 'rejected':
    case 'cancelled':
      return 'red' as const;
    case 'pending':
      return 'blue' as const;
    case 'draft':
    default:
      return 'default' as const;
  }
}

export async function getPatientConsentSnapshot(patientId: string) {
  const { data, error } = await supabase
    .from('patient_consents')
    .select('patient_id, consent_status, therapeutic_link_status, exclusion_note, last_sync_at, source')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    queueDataAccessLog({
      tableName: 'patient_consents',
      action: 'read',
      patientId,
      resourceLabel: 'Consultation snapshot consentement eAgreement',
      containsPii: true,
      severity: 'medium',
      metadata: {
        found: false,
      },
    });
    return null;
  }

  queueDataAccessLog({
    tableName: 'patient_consents',
    action: 'read',
    patientId,
    resourceLabel: 'Consultation snapshot consentement eAgreement',
    containsPii: true,
    severity: 'medium',
    metadata: {
      found: true,
      consentStatus: data.consent_status,
      therapeuticLinkStatus: data.therapeutic_link_status,
      source: data.source,
    },
  });

  return {
    patientId: data.patient_id,
    consentStatus: data.consent_status as PatientConsentSnapshot['consentStatus'],
    therapeuticLinkStatus: data.therapeutic_link_status as PatientConsentSnapshot['therapeuticLinkStatus'],
    exclusionNote: data.exclusion_note,
    lastSyncAt: data.last_sync_at ?? undefined,
    source: data.source,
  } satisfies PatientConsentSnapshot;
}

export async function listEAgreementRequests(filters: EAgreementListFilters = {}) {
  let query = supabase
    .from('eagreement_requests')
    .select(eAgreementRequestSelect)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  if (typeof filters.limit === 'number') {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    if (isRelationMissingError(error)) {
      return [];
    }

    throw error;
  }

  const requests = ((data ?? []) as EAgreementRequestSelectRow[]).map(mapEAgreementRequest);
  queueEAgreementRegistryReadLog(requests, filters);

  return requests;
}

export async function createEAgreementRequest(input: CreateEAgreementRequestInput) {
  const status = toPersistedStatus(input.status);
  const payload: TablesInsert<'eagreement_requests'> = {
    patient_id: input.patientId,
    belrai_assessment_id: input.belraiAssessmentId ?? null,
    had_episode_id: input.hadEpisodeId ?? null,
    created_by_profile_id: input.createdByProfileId ?? null,
    reviewed_by_profile_id: input.reviewedByProfileId ?? null,
    care_type: input.careType,
    nomenclature: input.nomenclature,
    katz_category: input.katzCategory ?? null,
    prescriber_name: input.prescriberName,
    start_at: input.startAt,
    end_at: input.endAt,
    status,
    mycarenet_reference: input.mycarenetReference ?? null,
    rejection_reason: input.rejectionReason ?? null,
    required_attachments: input.requiredAttachments ?? [],
    supporting_context: input.supportingContext ?? {},
    submitted_at: input.submittedAt ?? (status === 'draft' ? null : new Date().toISOString()),
    decided_at: input.decidedAt ?? null,
  };

  const { data, error } = await supabase
    .from('eagreement_requests')
    .insert(payload)
    .select(eAgreementRequestSelect)
    .single();

  if (error) {
    if (isRelationMissingError(error)) {
      throw new Error('La persistance eAgreement n’est pas encore disponible tant que la migration Supabase n’est pas appliquée.');
    }

    throw error;
  }

  const request = mapEAgreementRequest(data as EAgreementRequestSelectRow);

  queueDataAccessLog({
    tableName: 'eagreement_requests',
    action: 'insert',
    recordId: request.id,
    patientId: request.patientId,
    resourceLabel: `Création demande eAgreement · ${request.patient.fullName || 'Patient non résolu'}`,
    containsPii: true,
    severity: 'medium',
    metadata: {
      status: request.status,
      careType: request.careType,
      nomenclature: request.nomenclature,
    },
  });

  return request;
}

export async function updateEAgreementRequest({ requestId, patch }: UpdateEAgreementRequestInput) {
  const payload: TablesUpdate<'eagreement_requests'> = {
    belrai_assessment_id: patch.belraiAssessmentId ?? undefined,
    had_episode_id: patch.hadEpisodeId ?? undefined,
    created_by_profile_id: patch.createdByProfileId ?? undefined,
    reviewed_by_profile_id: patch.reviewedByProfileId ?? undefined,
    care_type: patch.careType ?? undefined,
    nomenclature: patch.nomenclature ?? undefined,
    katz_category: patch.katzCategory ?? undefined,
    prescriber_name: patch.prescriberName ?? undefined,
    start_at: patch.startAt ?? undefined,
    end_at: patch.endAt ?? undefined,
    status: patch.status ?? undefined,
    mycarenet_reference: patch.mycarenetReference ?? undefined,
    rejection_reason: patch.rejectionReason ?? undefined,
    required_attachments: patch.requiredAttachments ?? undefined,
    supporting_context: patch.supportingContext ?? undefined,
    submitted_at: patch.submittedAt ?? undefined,
    decided_at: patch.decidedAt ?? undefined,
  };

  const { data, error } = await supabase
    .from('eagreement_requests')
    .update(payload)
    .eq('id', requestId)
    .select(eAgreementRequestSelect)
    .single();

  if (error) {
    if (isRelationMissingError(error)) {
      throw new Error('La persistance eAgreement n’est pas encore disponible tant que la migration Supabase n’est pas appliquée.');
    }

    throw error;
  }
  const request = mapEAgreementRequest(data as EAgreementRequestSelectRow);

  queueDataAccessLog({
    tableName: 'eagreement_requests',
    action: 'update',
    recordId: request.id,
    patientId: request.patientId,
    resourceLabel: `Mise à jour demande eAgreement · ${request.patient.fullName || 'Patient non résolu'}`,
    containsPii: true,
    severity: 'medium',
    metadata: {
      status: request.status,
      careType: request.careType,
      nomenclature: request.nomenclature,
    },
  });

  return request;
}
