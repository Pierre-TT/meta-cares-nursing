type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type BelraiTone = 'blue' | 'green' | 'amber' | 'red';
type BelraiAssessmentRecordRole = 'prep' | 'official';
type BelraiSyncJobRow = { id: string };
type BelraiError = { code?: string | null; message?: string } | null;
type BelraiQueryResult<T = unknown> = { data: T | null; error: BelraiError };

type BelraiQueryBuilder<T = unknown> = BelraiQueryResult<T> & {
  delete: () => BelraiQueryBuilder<T>;
  eq: (column: string, value: unknown) => BelraiQueryBuilder<T>;
  insert: (values: unknown) => BelraiQueryBuilder<T>;
  limit: (count: number) => BelraiQueryBuilder<T>;
  maybeSingle: () => BelraiQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => BelraiQueryBuilder<T>;
  select: (columns?: string) => BelraiQueryBuilder<T>;
  single: () => BelraiQueryBuilder<T>;
  update: (values: unknown) => BelraiQueryBuilder<T>;
  upsert: (values: unknown, options?: { onConflict?: string }) => BelraiQueryBuilder<T>;
};

type BelraiClient = {
  from: (table: string) => unknown;
};

function belraiTable<T = unknown>(client: BelraiClient, table: string) {
  return client.from(table) as BelraiQueryBuilder<T>;
}

interface BelraiAssessmentRow {
  assessment_scope: string;
  completed_at: string | null;
  external_assessment_id: string | null;
  id: string;
  linked_prep_assessment_id: string | null;
  official_received_at: string | null;
  patient_id: string;
  record_role: BelraiAssessmentRecordRole;
  shared_with_patient_at: string | null;
  source: string;
  source_system: string;
  status: string;
  submitted_at: string | null;
  summary: Json;
  sync_status: string;
  template_key: string;
  template_version: string;
  updated_at: string;
}

interface BelraiCapInsert {
  assessment_id: string;
  cap_key: string;
  detail: string;
  metadata: Json;
  priority: 'low' | 'medium' | 'high';
  rationale: string;
  status: 'active' | 'watch' | 'dismissed';
  title: string;
}

interface BelraiScoreInsert {
  assessment_id: string;
  interpretation: string;
  label: string;
  metadata: Json;
  score_key: string;
  tone: BelraiTone;
  value_numeric: number | null;
  value_text: string;
}

export interface BelraiOfficialScoreInput {
  detail?: string;
  key: string;
  label: string;
  tone?: BelraiTone;
  value: number | string;
}

export interface BelraiOfficialCapInput {
  detail?: string;
  key: string;
  linkedDiagnosis?: string;
  priority?: 'low' | 'medium' | 'high';
  rationale?: string;
  status?: 'active' | 'watch' | 'dismissed';
  suggestedInterventions?: string[];
  title: string;
  tone?: BelraiTone;
}

export interface BelraiOfficialImportPayload {
  assessmentScope?: string;
  caps?: BelraiOfficialCapInput[];
  externalAssessmentId?: string;
  officialPayload?: Json;
  receivedAt?: string;
  scores?: BelraiOfficialScoreInput[];
  sharedWithPatientAt?: string;
  sourceSystem?: string;
  summary?: Json;
  templateKey?: string;
  templateVersion?: string;
}

export interface BelraiOfficialIngestResult {
  linkedPrepAssessmentId: string | null;
  officialAssessmentId: string;
  officialReceivedAt: string;
  sharedWithPatientAt: string | null;
  sourceSystem: string;
}

function getAssessmentRecordRole(
  assessment: Partial<BelraiAssessmentRow> | null | undefined,
): BelraiAssessmentRecordRole {
  return assessment?.record_role === 'official' ? 'official' : 'prep';
}

function toNumericOfficialScoreValue(value: number | string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildOfficialScoreRows(
  assessmentId: string,
  scores: BelraiOfficialScoreInput[],
): BelraiScoreInsert[] {
  return scores.map((score) => ({
    assessment_id: assessmentId,
    score_key: score.key,
    label: score.label,
    value_numeric: toNumericOfficialScoreValue(score.value),
    value_text: typeof score.value === 'string' ? score.value : String(score.value),
    interpretation: score.detail ?? '',
    tone: score.tone ?? 'blue',
    metadata: {},
  }));
}

function buildOfficialCapRows(
  assessmentId: string,
  caps: BelraiOfficialCapInput[],
): BelraiCapInsert[] {
  return caps.map((cap) => ({
    assessment_id: assessmentId,
    cap_key: cap.key,
    title: cap.title,
    detail: cap.detail ?? '',
    priority: cap.priority ?? 'medium',
    status: cap.status ?? 'active',
    rationale: cap.rationale ?? '',
    metadata: {
      linkedDiagnosis: cap.linkedDiagnosis ?? null,
      suggestedInterventions: cap.suggestedInterventions ?? [],
      tone: cap.tone ?? 'blue',
    },
  }));
}

function buildOfficialAssessmentSummary(payload: BelraiOfficialImportPayload) {
  if (payload.summary) {
    return payload.summary;
  }

  return {
    caps: (payload.caps ?? []).map((cap) => ({
      key: cap.key,
      title: cap.title,
      priority: cap.priority ?? 'medium',
      tone: cap.tone ?? 'blue',
    })),
    scores: (payload.scores ?? []).map((score) => ({
      key: score.key,
      label: score.label,
      value: String(score.value),
      tone: score.tone ?? 'blue',
    })),
  } satisfies Json;
}

export async function fetchRecentBelraiAssessments(
  client: BelraiClient,
  patientId: string,
): Promise<BelraiAssessmentRow[]> {
  const { data, error }: BelraiQueryResult<BelraiAssessmentRow[]> = await belraiTable<BelraiAssessmentRow[]>(client, 'belrai_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('updated_at', { ascending: false })
    .limit(12);

  if (error) {
    if (error.code === '42P01') {
      return [];
    }

    throw error;
  }

  return (data ?? []) as BelraiAssessmentRow[];
}

export function findLatestBelraiAssessmentByRole(
  assessments: BelraiAssessmentRow[],
  role: BelraiAssessmentRecordRole,
) {
  return assessments.find((assessment) => getAssessmentRecordRole(assessment) === role) ?? null;
}

async function findOfficialAssessmentByExternalId(
  client: BelraiClient,
  externalAssessmentId: string,
) {
  const { data, error }: BelraiQueryResult<BelraiAssessmentRow | null> = await belraiTable<BelraiAssessmentRow | null>(client, 'belrai_assessments')
    .select('*')
    .eq('external_assessment_id', externalAssessmentId)
    .eq('record_role', 'official')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as BelraiAssessmentRow | null;
}

async function replaceAssessmentOutputs(
  client: BelraiClient,
  assessmentId: string,
  caps: BelraiCapInsert[],
  scores: BelraiScoreInsert[],
) {
  const [{ error: deleteCapsError }, { error: deleteScoresError }]: [
    BelraiQueryResult<null>,
    BelraiQueryResult<null>,
  ] = await Promise.all([
    belraiTable<null>(client, 'belrai_caps').delete().eq('assessment_id', assessmentId),
    belraiTable<null>(client, 'belrai_scores').delete().eq('assessment_id', assessmentId),
  ]);

  if (deleteCapsError) {
    throw deleteCapsError;
  }

  if (deleteScoresError) {
    throw deleteScoresError;
  }

  if (caps.length > 0) {
    const { error }: BelraiQueryResult<null> = await belraiTable<null>(client, 'belrai_caps').insert(caps);

    if (error) {
      throw error;
    }
  }

  if (scores.length > 0) {
    const { error }: BelraiQueryResult<null> = await belraiTable<null>(client, 'belrai_scores').insert(scores);

    if (error) {
      throw error;
    }
  }
}

export async function ingestBelraiOfficialResultRecord(
  client: BelraiClient,
  databasePatientId: string,
  payload: BelraiOfficialImportPayload,
): Promise<BelraiOfficialIngestResult> {
  const recentAssessments = await fetchRecentBelraiAssessments(client, databasePatientId);
  const prepAssessment = findLatestBelraiAssessmentByRole(recentAssessments, 'prep');
  const linkedOfficialAssessment = recentAssessments.find((assessment) => (
    getAssessmentRecordRole(assessment) === 'official' &&
    prepAssessment &&
    assessment.linked_prep_assessment_id === prepAssessment.id
  )) ?? null;
  const existingOfficialAssessment = (
    payload.externalAssessmentId
      ? await findOfficialAssessmentByExternalId(client, payload.externalAssessmentId)
      : null
  ) ?? linkedOfficialAssessment;
  const receivedAt = payload.receivedAt ?? new Date().toISOString();
  const sourceSystem = payload.sourceSystem ?? 'official_gateway';
  const summary = buildOfficialAssessmentSummary(payload);
  const officialPayload = payload.officialPayload ?? payload.summary ?? summary;

  const { data: officialAssessment, error: officialAssessmentError }: BelraiQueryResult<BelraiAssessmentRow> = await belraiTable<BelraiAssessmentRow>(client, 'belrai_assessments')
    .upsert({
      ...(existingOfficialAssessment ? { id: existingOfficialAssessment.id } : {}),
      patient_id: databasePatientId,
      linked_prep_assessment_id:
        prepAssessment?.id ?? existingOfficialAssessment?.linked_prep_assessment_id ?? null,
      external_assessment_id:
        payload.externalAssessmentId ?? existingOfficialAssessment?.external_assessment_id ?? null,
      record_role: 'official',
      template_key:
        payload.templateKey ??
        prepAssessment?.template_key ??
        existingOfficialAssessment?.template_key ??
        'interrai_hc_screener',
      template_version:
        payload.templateVersion ??
        prepAssessment?.template_version ??
        existingOfficialAssessment?.template_version ??
        'official-v1',
      assessment_scope:
        payload.assessmentScope ??
        prepAssessment?.assessment_scope ??
        existingOfficialAssessment?.assessment_scope ??
        'screening',
      status: 'synced',
      sync_status: 'synced',
      source: sourceSystem,
      source_system: sourceSystem,
      summary,
      official_payload: officialPayload,
      official_received_at: receivedAt,
      shared_with_patient_at:
        payload.sharedWithPatientAt ?? existingOfficialAssessment?.shared_with_patient_at ?? null,
      last_synced_at: receivedAt,
      completed_at: receivedAt,
      submitted_at:
        prepAssessment?.submitted_at ?? existingOfficialAssessment?.submitted_at ?? receivedAt,
    }, { onConflict: 'id' })
    .select('*')
    .single();

  if (officialAssessmentError) {
    throw officialAssessmentError;
  }

  if (!officialAssessment) {
    throw new Error('Official BelRAI assessment import did not return a record.');
  }

  if (payload.caps || payload.scores) {
    await replaceAssessmentOutputs(
      client,
      officialAssessment.id,
      buildOfficialCapRows(officialAssessment.id, payload.caps ?? []),
      buildOfficialScoreRows(officialAssessment.id, payload.scores ?? []),
    );
  }

  if (prepAssessment) {
    const { error: prepUpdateError }: BelraiQueryResult<null> = await belraiTable<null>(client, 'belrai_assessments')
      .update({
        status: 'synced',
        sync_status: 'synced',
        last_synced_at: receivedAt,
        completed_at: prepAssessment.completed_at ?? receivedAt,
      })
      .eq('id', prepAssessment.id);

    if (prepUpdateError) {
      throw prepUpdateError;
    }

    const { data: syncJobs, error: syncJobsError }: BelraiQueryResult<BelraiSyncJobRow[]> = await belraiTable<BelraiSyncJobRow[]>(client, 'belrai_sync_jobs')
      .select('id')
      .eq('assessment_id', prepAssessment.id)
      .order('requested_at', { ascending: false })
      .limit(1);

    if (syncJobsError) {
      throw syncJobsError;
    }

    if (syncJobs && syncJobs.length > 0) {
      const { error: syncJobUpdateError }: BelraiQueryResult<null> = await belraiTable<null>(client, 'belrai_sync_jobs')
        .update({
          status: 'synced',
          response_payload: officialPayload,
          error_message: null,
          processed_at: receivedAt,
        })
        .eq('id', syncJobs[0].id);

      if (syncJobUpdateError) {
        throw syncJobUpdateError;
      }
    }
  }

  return {
    linkedPrepAssessmentId: officialAssessment.linked_prep_assessment_id ?? null,
    officialAssessmentId: officialAssessment.id,
    officialReceivedAt: receivedAt,
    sharedWithPatientAt: officialAssessment.shared_with_patient_at ?? null,
    sourceSystem,
  };
}
