import type { Json, Tables, TablesInsert } from '@/lib/database.types';
import {
  createBelraiKatzEstimate,
  buildBelraiTwin,
  formatBelraiDateTime,
  isBelraiDraftPendingSync,
  listStoredBelraiDrafts,
  loadStoredBelraiDraft,
  persistBelraiDraft,
  resetBelraiDraft,
  type BelraiCap,
  type BelraiOfficialResult,
  type BelraiScoreCard,
  type BelraiTone,
  type BelraiTwinSnapshot,
  type StoredBelraiDraft,
} from '@/lib/belrai';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { mapPatientRecordToProfile } from '@/lib/platformData';
import { mockPatients, type Patient } from '@/lib/patients';
import {
  fetchRecentBelraiAssessments,
  findLatestBelraiAssessmentByRole,
  ingestBelraiOfficialResultRecord,
  type BelraiOfficialImportPayload,
} from '@/shared/belraiOfficialIngest';
import { supabase } from '@/lib/supabase';

interface ResolvedBelraiPatient {
  patient: Patient;
  databasePatientId: string | null;
}

type BelraiAssessmentRecordRole = 'prep' | 'official';
type BelraiAssessmentRow = Tables<'belrai_assessments'>;
type BelraiCapRow = Tables<'belrai_caps'>;
type BelraiScoreRow = Tables<'belrai_scores'>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

async function hydrateSupabasePatient(
  patientRow: Tables<'patients'>,
  routePatientId?: string,
): Promise<Patient> {
  const [allergiesResult, pathologiesResult] = await Promise.all([
    supabase
      .from('patient_allergies')
      .select('label')
      .eq('patient_id', patientRow.id)
      .order('label', { ascending: true }),
    supabase
      .from('patient_pathologies')
      .select('label')
      .eq('patient_id', patientRow.id)
      .order('label', { ascending: true }),
  ]);

  if (allergiesResult.error) {
    throw allergiesResult.error;
  }

  if (pathologiesResult.error) {
    throw pathologiesResult.error;
  }

  const profile = mapPatientRecordToProfile(
    patientRow,
    (allergiesResult.data ?? []).map((row) => row.label),
    (pathologiesResult.data ?? []).map((row) => row.label),
  );

  return routePatientId ? { ...profile, id: routePatientId } : profile;
}

async function findSupabasePatientById(patientId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function findSupabasePatientByNiss(niss: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('niss', niss)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function resolveBelraiPatient(patientId: string): Promise<ResolvedBelraiPatient> {
  const mockPatient = mockPatients.find((entry) => entry.id === patientId);

  if (isUuid(patientId)) {
    const patientRow = await findSupabasePatientById(patientId);

    if (patientRow) {
      return {
        patient: await hydrateSupabasePatient(patientRow),
        databasePatientId: patientRow.id,
      };
    }
  }

  if (mockPatient) {
    try {
      const patientRow = mockPatient.niss
        ? await findSupabasePatientByNiss(mockPatient.niss)
        : null;

      if (patientRow) {
        return {
          patient: await hydrateSupabasePatient(patientRow, mockPatient.id),
          databasePatientId: patientRow.id,
        };
      }
    } catch {
      return {
        patient: mockPatient,
        databasePatientId: null,
      };
    }

    return {
      patient: mockPatient,
      databasePatientId: null,
    };
  }

  throw new Error('Patient introuvable pour le module BelRAI.');
}

function isJsonRecord(value: Json | null | undefined): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJsonString(value: Json | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readJsonNumber(value: Json | undefined) {
  return typeof value === 'number' ? value : undefined;
}

function readJsonStringArray(value: Json | undefined) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];
}

function getAssessmentRecordRole(
  assessment: Partial<BelraiAssessmentRow> | null | undefined,
): BelraiAssessmentRecordRole {
  return assessment?.record_role === 'official' ? 'official' : 'prep';
}

function isAssessmentSynced(
  assessment: Pick<BelraiAssessmentRow, 'status' | 'sync_status'> | null | undefined,
) {
  return Boolean(assessment && (
    assessment.status === 'synced' ||
    assessment.sync_status === 'synced'
  ));
}

function parseKatzCategory(value: string | undefined): Patient['katzCategory'] | undefined {
  switch (value) {
    case 'O':
    case 'A':
    case 'B':
    case 'C':
    case 'Cd':
      return value;
    default:
      return undefined;
  }
}

function mapBelraiTone(value: string | null | undefined): BelraiTone {
  switch (value) {
    case 'green':
    case 'amber':
    case 'red':
      return value;
    default:
      return 'blue';
  }
}

function readKatzSnapshot(payload: Json | null | undefined) {
  const record = isJsonRecord(payload) ? payload : null;
  const katz = record && isJsonRecord(record.katz) ? record.katz : null;

  return {
    category: parseKatzCategory(readJsonString(katz?.category)),
    total: readJsonNumber(katz?.total),
  };
}

function resolveAssessmentKatz(
  patient: Patient,
  assessment: BelraiAssessmentRow,
  scores: BelraiScoreCard[],
) {
  const scoreCategory = parseKatzCategory(scores.find((score) => score.key === 'katz')?.value);
  const officialSnapshot = readKatzSnapshot(assessment.official_payload);
  const summarySnapshot = readKatzSnapshot(assessment.summary);
  const category = scoreCategory ?? officialSnapshot.category ?? summarySnapshot.category ?? patient.katzCategory;
  const total = officialSnapshot.total ?? summarySnapshot.total ?? patient.katzScore ?? 0;

  if (category) {
    return createBelraiKatzEstimate(category, total);
  }

  return createBelraiKatzEstimate('O', total);
}

function mapBelraiScoreRow(row: BelraiScoreRow): BelraiScoreCard {
  return {
    key: row.score_key,
    label: row.label,
    value: row.value_text ?? (typeof row.value_numeric === 'number' ? String(row.value_numeric) : '—'),
    detail: row.interpretation ?? '',
    tone: mapBelraiTone(row.tone),
  };
}

function mapBelraiCapRow(row: BelraiCapRow): BelraiCap {
  const metadata = isJsonRecord(row.metadata) ? row.metadata : null;

  return {
    id: row.cap_key,
    title: row.title,
    detail: row.detail,
    priority: row.priority,
    tone: mapBelraiTone(readJsonString(metadata?.tone)),
    rationale: row.rationale,
    linkedDiagnosis: readJsonString(metadata?.linkedDiagnosis) ?? '',
    suggestedInterventions: readJsonStringArray(metadata?.suggestedInterventions),
  };
}

function findLatestLegacySharedPrepAssessment(assessments: BelraiAssessmentRow[]) {
  return assessments.find((assessment) =>
    getAssessmentRecordRole(assessment) === 'prep' &&
    isAssessmentSynced(assessment)
  ) ?? null;
}

async function loadAssessmentAnswers(assessmentId: string) {
  const { data: answers, error } = await supabase
    .from('belrai_answers')
    .select('item_id, response_value, is_confirmed')
    .eq('assessment_id', assessmentId);

  if (error) {
    throw error;
  }

  const nextAnswers: Record<string, number> = {};
  const confirmedItemIds: string[] = [];

  (answers ?? []).forEach((row) => {
    if (typeof row.response_value === 'number') {
      nextAnswers[row.item_id] = row.response_value;
    }

    if (row.is_confirmed) {
      confirmedItemIds.push(row.item_id);
    }
  });

  return {
    answers: nextAnswers,
    confirmedItemIds,
  };
}

async function loadAssessmentOutputs(assessmentId: string) {
  const [{ data: caps, error: capsError }, { data: scores, error: scoresError }] = await Promise.all([
    supabase
      .from('belrai_caps')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('priority', { ascending: false }),
    supabase
      .from('belrai_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true }),
  ]);

  if (capsError) {
    throw capsError;
  }

  if (scoresError) {
    throw scoresError;
  }

  return {
    caps: (caps ?? []) as BelraiCapRow[],
    scores: (scores ?? []) as BelraiScoreRow[],
  };
}

async function loadOfficialResult(
  patient: Patient,
  officialAssessment: BelraiAssessmentRow | null,
  legacySharedAssessment: BelraiAssessmentRow | null,
) {
  const assessment = officialAssessment ?? legacySharedAssessment;

  if (!assessment) {
    return null;
  }

  const { caps, scores } = await loadAssessmentOutputs(assessment.id);
  const mappedScores = scores.map(mapBelraiScoreRow);
  const mappedCaps = caps.map(mapBelraiCapRow);
  const isLegacyFallback = !officialAssessment;
  const receivedAt =
    assessment.official_received_at ??
    assessment.last_synced_at ??
    assessment.submitted_at ??
    assessment.updated_at;
  const sharedWithPatientAt = isLegacyFallback
    ? receivedAt
    : assessment.shared_with_patient_at ?? undefined;

  return {
    assessmentId: assessment.id,
    linkedPrepAssessmentId: assessment.linked_prep_assessment_id ?? undefined,
    templateKey: assessment.template_key,
    templateVersion: assessment.template_version,
    assessmentScope: assessment.assessment_scope,
    recordRole: isLegacyFallback ? 'legacy_synced_prep' : 'official',
    sourceSystem: assessment.source_system ?? assessment.source,
    receivedAt,
    receivedLabel: formatBelraiDateTime(receivedAt),
    sharedWithPatientAt,
    sharedLabel: formatBelraiDateTime(sharedWithPatientAt ?? receivedAt),
    isSharedWithPatient: isLegacyFallback ? true : Boolean(sharedWithPatientAt),
    statusLabel: isLegacyFallback
      ? 'Partage issu du flux prep historique'
      : sharedWithPatientAt
        ? 'Partage patient actif'
        : 'RÃ©sultats officiels en attente de partage',
    syncLabel: isLegacyFallback
      ? 'SynthÃ¨se visible via le dernier dossier prep synchronisÃ©.'
      : sharedWithPatientAt
        ? `RÃ©sultats officiels partagÃ©s le ${formatBelraiDateTime(sharedWithPatientAt)}.`
        : `RÃ©sultats officiels reÃ§us le ${formatBelraiDateTime(receivedAt)}.`,
    katz: resolveAssessmentKatz(patient, assessment, mappedScores),
    scores: mappedScores,
    caps: mappedCaps,
  } satisfies BelraiOfficialResult;
}

async function fetchLatestPrepAssessment(databasePatientId: string) {
  const assessments = await fetchRecentBelraiAssessments(supabase, databasePatientId);
  return findLatestBelraiAssessmentByRole(assessments, 'prep');
}

async function loadPersistedDraftFromAssessment(
  routePatientId: string,
  assessment: BelraiAssessmentRow,
): Promise<StoredBelraiDraft> {
  const answerState = await loadAssessmentAnswers(assessment.id);

  return {
    assessmentId: assessment.id,
    patientId: routePatientId,
    status: assessment.status,
    syncStatus: assessment.sync_status,
    storage: 'supabase',
    answers: answerState.answers,
    confirmedItemIds: answerState.confirmedItemIds,
    reviewNote: assessment.review_note ?? '',
    updatedAt: assessment.updated_at,
    submittedAt: assessment.submitted_at ?? undefined,
  };
}

async function fetchLatestAssessment(databasePatientId: string) {
  const { data, error } = await supabase
    .from('belrai_assessments')
    .select('*')
    .eq('patient_id', databasePatientId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // 42P01 → table not yet created; fall back gracefully so the twin
    // loads from localStorage instead of throwing.
    if (error.code === '42P01') {
      return null;
    }
    throw error;
  }

  return data;
}

async function loadPersistedDraft(
  routePatientId: string,
  databasePatientId: string,
): Promise<StoredBelraiDraft | null> {
  const assessment = await fetchLatestAssessment(databasePatientId);

  if (!assessment) {
    return null;
  }

  const { data: answers, error } = await supabase
    .from('belrai_answers')
    .select('item_id, response_value, is_confirmed')
    .eq('assessment_id', assessment.id);

  if (error) {
    throw error;
  }

  const nextAnswers: Record<string, number> = {};
  const confirmedItemIds: string[] = [];

  (answers ?? []).forEach((row) => {
    if (typeof row.response_value === 'number') {
      nextAnswers[row.item_id] = row.response_value;
    }

    if (row.is_confirmed) {
      confirmedItemIds.push(row.item_id);
    }
  });

  return {
    assessmentId: assessment.id,
    patientId: routePatientId,
    status: assessment.status,
    syncStatus: assessment.sync_status,
    storage: 'supabase',
    answers: nextAnswers,
    confirmedItemIds,
    reviewNote: assessment.review_note ?? '',
    updatedAt: assessment.updated_at,
    submittedAt: assessment.submitted_at ?? undefined,
  };
}

void loadPersistedDraft;

function buildCachedDraft(
  patientId: string,
  draft: StoredBelraiDraft,
  overrides?: Partial<StoredBelraiDraft>,
) {
  return {
    ...draft,
    patientId,
    ...overrides,
  } satisfies StoredBelraiDraft;
}

function attachOfficialResult(
  snapshot: BelraiTwinSnapshot,
  officialResult: BelraiOfficialResult | null,
): BelraiTwinSnapshot {
  return {
    ...snapshot,
    officialResult,
    sharedResultsReady: Boolean(officialResult?.isSharedWithPatient),
  };
}

function queueBelraiReadLog(
  snapshot: BelraiTwinSnapshot,
  patient: Patient,
  routePatientId: string,
  databasePatientId: string | null,
  source: 'local' | 'supabase' | 'local-fallback',
) {
  const patientLabel = `${patient.firstName} ${patient.lastName}`.trim() || 'Patient';

  queueDataAccessLog({
    tableName: 'belrai_assessments',
    action: 'read',
    patientId: databasePatientId,
    resourceLabel: `Consultation BelRAI · ${patientLabel}`,
    containsPii: true,
    severity: 'medium',
    metadata: {
      routePatientId,
      source,
      persistenceMode: snapshot.persistenceMode,
      status: snapshot.draft.status,
      syncStatus: snapshot.draft.syncStatus,
      progressPercent: snapshot.progress.percent,
      sharedResultsReady: snapshot.sharedResultsReady,
      officialRecordRole: snapshot.officialResult?.recordRole ?? null,
    },
  });
}

function toAssessmentSummary(snapshot: BelraiTwinSnapshot) {
  return {
    progress: snapshot.progress,
    katz: {
      category: snapshot.katz.category,
      forfait: snapshot.katz.forfait,
      total: snapshot.katz.total,
    },
    caps: snapshot.caps.map((cap) => ({
      id: cap.id,
      title: cap.title,
      priority: cap.priority,
      tone: cap.tone,
    })),
    carePlanSuggestions: snapshot.carePlanSuggestions.map((suggestion) => ({
      id: suggestion.id,
      title: suggestion.title,
      diagnosisCode: suggestion.diagnosisCode,
    })),
    persistenceMode: snapshot.persistenceMode,
  };
}

async function upsertAssessment(
  databasePatientId: string,
  draft: StoredBelraiDraft,
  snapshot: BelraiTwinSnapshot,
) {
  const payload: TablesInsert<'belrai_assessments'> = {
    ...(isUuid(draft.assessmentId) ? { id: draft.assessmentId } : {}),
    patient_id: databasePatientId,
    record_role: 'prep',
    template_key: 'interrai_hc_screener',
    template_version: 'local-v1',
    assessment_scope: 'screening',
    status: draft.status,
    sync_status: draft.syncStatus,
    source: 'meta_cares_prep',
    source_system: 'meta_cares_prep',
    review_note: draft.reviewNote || null,
    summary: toAssessmentSummary(snapshot),
    completed_at: draft.status === 'ready_for_sync' || draft.status === 'synced'
      ? draft.submittedAt ?? draft.updatedAt
      : null,
    submitted_at: draft.submittedAt ?? null,
  };

  const { data, error } = await supabase
    .from('belrai_assessments')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function buildAnswerRows(
  snapshot: BelraiTwinSnapshot,
  assessmentId: string,
): TablesInsert<'belrai_answers'>[] {
  return snapshot.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      const responseValue = snapshot.draft.answers[item.id];

      if (responseValue === undefined) {
        return [];
      }

      const suggestion = snapshot.suggestedAnswers[item.id];

      return [{
        assessment_id: assessmentId,
        item_id: item.id,
        section_id: section.id,
        item_code: item.code,
        item_label: item.label,
        response_value: responseValue,
        response_label: item.options.find((option) => option.value === responseValue)?.label ?? String(responseValue),
        is_suggested: responseValue === suggestion.value,
        is_confirmed: snapshot.draft.confirmedItemIds.includes(item.id),
        confidence: suggestion.confidence,
        observed_at: suggestion.evidence[0]?.observedAt ?? null,
        source: suggestion.evidence[0]?.source ?? 'manual',
        evidence_summary: suggestion.rationale,
        metadata: {
          suggested_value: suggestion.value,
          suggested_label: suggestion.label,
          deviation: responseValue !== suggestion.value,
        },
      }];
    }),
  );
}

async function persistAnswersAndEvidence(snapshot: BelraiTwinSnapshot, assessmentId: string) {
  const answerRows = buildAnswerRows(snapshot, assessmentId);

  const { error: deleteAnswersError } = await supabase
    .from('belrai_answers')
    .delete()
    .eq('assessment_id', assessmentId);

  if (deleteAnswersError) {
    throw deleteAnswersError;
  }

  if (answerRows.length === 0) {
    return;
  }

  const { data: answers, error: answersError } = await supabase
    .from('belrai_answers')
    .insert(answerRows)
    .select('id, item_id');

  if (answersError) {
    throw answersError;
  }

  const answerIdByItemId = new Map((answers ?? []).map((row) => [row.item_id, row.id]));
  const evidenceRows: TablesInsert<'belrai_evidence_links'>[] = snapshot.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      const answerId = answerIdByItemId.get(item.id);

      if (!answerId || snapshot.draft.answers[item.id] === undefined) {
        return [];
      }

      return snapshot.suggestedAnswers[item.id].evidence.map((evidence) => ({
        assessment_id: assessmentId,
        answer_id: answerId,
        item_id: item.id,
        source: evidence.source,
        source_ref: evidence.id,
        label: evidence.sourceLabel,
        summary: evidence.summary,
        observed_at: evidence.observedAt,
        metadata: {
          confidence: evidence.confidence,
        },
      }));
    }),
  );

  if (evidenceRows.length === 0) {
    return;
  }

  const { error: evidenceError } = await supabase
    .from('belrai_evidence_links')
    .insert(evidenceRows);

  if (evidenceError) {
    throw evidenceError;
  }
}

async function replaceCapsAndScores(snapshot: BelraiTwinSnapshot, assessmentId: string) {
  const [{ error: deleteCapsError }, { error: deleteScoresError }] = await Promise.all([
    supabase.from('belrai_caps').delete().eq('assessment_id', assessmentId),
    supabase.from('belrai_scores').delete().eq('assessment_id', assessmentId),
  ]);

  if (deleteCapsError) {
    throw deleteCapsError;
  }

  if (deleteScoresError) {
    throw deleteScoresError;
  }

  const capRows: TablesInsert<'belrai_caps'>[] = snapshot.caps.map((cap) => ({
    assessment_id: assessmentId,
    cap_key: cap.id,
    title: cap.title,
    detail: cap.detail,
    priority: cap.priority,
    status: 'active',
    rationale: cap.rationale,
    metadata: {
      tone: cap.tone,
      linkedDiagnosis: cap.linkedDiagnosis,
      suggestedInterventions: cap.suggestedInterventions,
    },
  }));

  const scoreRows: TablesInsert<'belrai_scores'>[] = snapshot.scores.map((score) => ({
    assessment_id: assessmentId,
    score_key: score.key,
    label: score.label,
    value_numeric: toNumericScore(score),
    value_text: score.value,
    interpretation: score.detail,
    tone: score.tone,
    metadata: {},
  }));

  if (capRows.length > 0) {
    const { error } = await supabase.from('belrai_caps').insert(capRows);

    if (error) {
      throw error;
    }
  }

  if (scoreRows.length > 0) {
    const { error } = await supabase.from('belrai_scores').insert(scoreRows);

    if (error) {
      throw error;
    }
  }
}

function toNumericScore(score: BelraiScoreCard) {
  return /^-?\d+(\.\d+)?$/.test(score.value) ? Number(score.value) : null;
}

async function upsertSyncJob(snapshot: BelraiTwinSnapshot, assessmentId: string) {
  const requestPayload = {
    assessmentId,
    patient: {
      routeId: snapshot.patient.id,
      niss: snapshot.patient.niss,
      firstName: snapshot.patient.firstName,
      lastName: snapshot.patient.lastName,
    },
    progress: snapshot.progress,
    katz: {
      category: snapshot.katz.category,
      total: snapshot.katz.total,
    },
    caps: snapshot.caps.map((cap) => ({
      key: cap.id,
      title: cap.title,
      priority: cap.priority,
    })),
  };

  const { data: existingJobs, error: existingError } = await supabase
    .from('belrai_sync_jobs')
    .select('id')
    .eq('assessment_id', assessmentId)
    .order('requested_at', { ascending: false })
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  if (existingJobs && existingJobs.length > 0) {
    const { error } = await supabase
      .from('belrai_sync_jobs')
      .update({
        status: 'queued',
        target: 'official_gateway',
        request_payload: requestPayload,
        response_payload: {},
        error_message: null,
        requested_at: new Date().toISOString(),
        processed_at: null,
      })
      .eq('id', existingJobs[0].id);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from('belrai_sync_jobs').insert({
    assessment_id: assessmentId,
    status: 'queued',
    target: 'official_gateway',
    request_payload: requestPayload,
    response_payload: {},
  });

  if (error) {
    throw error;
  }
}

export async function ingestBelraiOfficialResult(
  patientId: string,
  payload: BelraiOfficialImportPayload,
): Promise<BelraiTwinSnapshot> {
  const resolved = await resolveBelraiPatient(patientId);

  if (!resolved.databasePatientId) {
    throw new Error('Impossible d importer un resultat officiel BelRAI sans dossier Supabase relie.');
  }

  await ingestBelraiOfficialResultRecord(supabase, resolved.databasePatientId, payload);

  return loadBelraiSnapshot(patientId);
}

async function persistBelraiGraph(
  databasePatientId: string,
  draft: StoredBelraiDraft,
  snapshot: BelraiTwinSnapshot,
  options?: { queueSync?: boolean },
) {
  const assessment = await upsertAssessment(databasePatientId, draft, snapshot);

  await persistAnswersAndEvidence(snapshot, assessment.id);
  await replaceCapsAndScores(snapshot, assessment.id);

  if (options?.queueSync && draft.syncStatus === 'queued') {
    await upsertSyncJob(snapshot, assessment.id);
  }

  return buildCachedDraft(draft.patientId, draft, {
    assessmentId: assessment.id,
    storage: 'supabase',
    status: assessment.status,
    syncStatus: assessment.sync_status,
    updatedAt: assessment.updated_at,
    submittedAt: assessment.submitted_at ?? undefined,
  });
}

async function clearPersistedAssessment(
  routePatientId: string,
  databasePatientId: string,
): Promise<StoredBelraiDraft | null> {
  const assessment = await fetchLatestPrepAssessment(databasePatientId);

  if (!assessment) {
    return null;
  }

  const [{ error: deleteAnswersError }, { error: deleteCapsError }, { error: deleteScoresError }, { error: deleteJobsError }] = await Promise.all([
    supabase.from('belrai_answers').delete().eq('assessment_id', assessment.id),
    supabase.from('belrai_caps').delete().eq('assessment_id', assessment.id),
    supabase.from('belrai_scores').delete().eq('assessment_id', assessment.id),
    supabase.from('belrai_sync_jobs').delete().eq('assessment_id', assessment.id),
  ]);

  if (deleteAnswersError) {
    throw deleteAnswersError;
  }

  if (deleteCapsError) {
    throw deleteCapsError;
  }

  if (deleteScoresError) {
    throw deleteScoresError;
  }

  if (deleteJobsError) {
    throw deleteJobsError;
  }

  const { data, error } = await supabase
    .from('belrai_assessments')
    .update({
      status: 'draft',
      sync_status: 'local_only',
      review_note: null,
      summary: {},
      completed_at: null,
      submitted_at: null,
    })
    .eq('id', assessment.id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    assessmentId: data.id,
    patientId: routePatientId,
    status: 'draft',
    syncStatus: 'local_only',
    storage: 'supabase',
    answers: {},
    confirmedItemIds: [],
    reviewNote: '',
    updatedAt: data.updated_at,
    submittedAt: undefined,
  };
}

export async function loadBelraiSnapshot(patientId: string): Promise<BelraiTwinSnapshot> {
  const resolved = await resolveBelraiPatient(patientId);
  const cachedDraft = loadStoredBelraiDraft(patientId);

  if (!resolved.databasePatientId) {
    const snapshot = attachOfficialResult(buildBelraiTwin(
      resolved.patient,
      buildCachedDraft(patientId, cachedDraft, { storage: 'local' }),
    ), null);
    queueBelraiReadLog(snapshot, resolved.patient, patientId, null, 'local');
    return snapshot;
  }

  try {
    const assessments = await fetchRecentBelraiAssessments(supabase, resolved.databasePatientId);
    const prepAssessment = findLatestBelraiAssessmentByRole(assessments, 'prep');
    const officialAssessment = findLatestBelraiAssessmentByRole(assessments, 'official');
    const legacySharedAssessment = officialAssessment
      ? null
      : findLatestLegacySharedPrepAssessment(assessments);
    const officialResult = await loadOfficialResult(
      resolved.patient,
      officialAssessment,
      legacySharedAssessment,
    );

    if (!prepAssessment) {
      const snapshot = attachOfficialResult(buildBelraiTwin(
        resolved.patient,
        buildCachedDraft(patientId, cachedDraft, { storage: 'local' }),
      ), officialResult);
      queueBelraiReadLog(
        snapshot,
        resolved.patient,
        patientId,
        resolved.databasePatientId,
        'local-fallback',
      );
      return snapshot;
    }

    const persistedDraft = await loadPersistedDraftFromAssessment(patientId, prepAssessment);
    persistBelraiDraft(patientId, persistedDraft, { preserveUpdatedAt: true });
    const snapshot = attachOfficialResult(
      buildBelraiTwin(resolved.patient, persistedDraft),
      officialResult,
    );
    queueBelraiReadLog(
      snapshot,
      resolved.patient,
      patientId,
      resolved.databasePatientId,
      'supabase',
    );
    return snapshot;
  } catch {
    const snapshot = attachOfficialResult(buildBelraiTwin(
      resolved.patient,
      buildCachedDraft(patientId, cachedDraft, { storage: 'local' }),
    ), null);
    queueBelraiReadLog(
      snapshot,
      resolved.patient,
      patientId,
      resolved.databasePatientId,
      'local-fallback',
    );
    return snapshot;
  }
}

export async function saveBelraiSnapshot(
  patientId: string,
  draft: StoredBelraiDraft,
): Promise<BelraiTwinSnapshot> {
  const resolved = await resolveBelraiPatient(patientId);
  const localDraft = persistBelraiDraft(patientId, buildCachedDraft(patientId, draft, { storage: 'local' }));

  if (!resolved.databasePatientId) {
    return buildBelraiTwin(resolved.patient, localDraft);
  }

  try {
    const remoteDraft = buildCachedDraft(patientId, draft, { storage: 'supabase' });
    const remoteSnapshot = buildBelraiTwin(resolved.patient, remoteDraft);
    const persistedDraft = await persistBelraiGraph(resolved.databasePatientId, remoteDraft, remoteSnapshot);
    persistBelraiDraft(patientId, persistedDraft, { preserveUpdatedAt: true });
    return buildBelraiTwin(resolved.patient, persistedDraft);
  } catch {
    return buildBelraiTwin(resolved.patient, localDraft);
  }
}

export async function markBelraiSnapshotReady(
  patientId: string,
  draft: StoredBelraiDraft,
): Promise<BelraiTwinSnapshot> {
  const resolved = await resolveBelraiPatient(patientId);
  const nextDraft = buildCachedDraft(patientId, draft, {
    status: 'ready_for_sync',
    syncStatus: resolved.databasePatientId ? 'queued' : 'local_only',
    storage: resolved.databasePatientId ? 'supabase' : 'local',
    submittedAt: draft.submittedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  persistBelraiDraft(patientId, nextDraft, { preserveUpdatedAt: true });

  if (!resolved.databasePatientId) {
    return buildBelraiTwin(resolved.patient, nextDraft);
  }

  try {
    const remoteSnapshot = buildBelraiTwin(resolved.patient, nextDraft);
    const persistedDraft = await persistBelraiGraph(
      resolved.databasePatientId,
      nextDraft,
      remoteSnapshot,
      { queueSync: true },
    );

    persistBelraiDraft(patientId, persistedDraft, { preserveUpdatedAt: true });
    return buildBelraiTwin(resolved.patient, persistedDraft);
  } catch {
    return buildBelraiTwin(
      resolved.patient,
      buildCachedDraft(patientId, nextDraft, { storage: 'local', syncStatus: 'local_only' }),
    );
  }
}

export interface BelraiOfflineSyncResult {
  patientId: string;
  synced: boolean;
  message: string;
}

export async function syncBelraiOfflineDrafts(patientId?: string): Promise<BelraiOfflineSyncResult[]> {
  const pendingDrafts = listStoredBelraiDrafts()
    .filter((draft) => isBelraiDraftPendingSync(draft))
    .filter((draft) => (patientId ? draft.patientId === patientId : true));

  const results: BelraiOfflineSyncResult[] = [];

  for (const draft of pendingDrafts) {
    const resolved = await resolveBelraiPatient(draft.patientId);

    if (!resolved.databasePatientId) {
      results.push({
        patientId: draft.patientId,
        synced: false,
        message: 'Aucune persistance distante disponible pour ce patient.',
      });
      continue;
    }

    try {
      const nextDraft = buildCachedDraft(draft.patientId, draft, {
        status: 'ready_for_sync',
        syncStatus: 'queued',
        storage: 'supabase',
        submittedAt: draft.submittedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const snapshot = buildBelraiTwin(resolved.patient, nextDraft);
      const persistedDraft = await persistBelraiGraph(
        resolved.databasePatientId,
        nextDraft,
        snapshot,
        { queueSync: true },
      );

      persistBelraiDraft(draft.patientId, persistedDraft, { preserveUpdatedAt: true });
      results.push({
        patientId: draft.patientId,
        synced: true,
        message: 'Brouillon BelRAI remis dans la file de synchronisation.',
      });
    } catch {
      persistBelraiDraft(draft.patientId, buildCachedDraft(draft.patientId, draft, {
        status: 'ready_for_sync',
        syncStatus: 'error',
        storage: 'local',
      }));
      results.push({
        patientId: draft.patientId,
        synced: false,
        message: 'La reprise BelRAI a echoue. Le brouillon reste local.',
      });
    }
  }

  return results;
}

export async function resetBelraiSnapshot(patientId: string): Promise<BelraiTwinSnapshot> {
  const resolved = await resolveBelraiPatient(patientId);
  const localDraft = resetBelraiDraft(patientId);

  if (!resolved.databasePatientId) {
    return buildBelraiTwin(resolved.patient, localDraft);
  }

  try {
    const clearedDraft = await clearPersistedAssessment(patientId, resolved.databasePatientId);

    if (!clearedDraft) {
      return buildBelraiTwin(resolved.patient, localDraft);
    }

    persistBelraiDraft(patientId, clearedDraft, { preserveUpdatedAt: true });
    return buildBelraiTwin(resolved.patient, clearedDraft);
  } catch {
    return buildBelraiTwin(resolved.patient, localDraft);
  }
}
