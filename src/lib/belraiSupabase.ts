import type { Tables, TablesInsert } from '@/lib/database.types';
import {
  buildBelraiTwin,
  isBelraiDraftPendingSync,
  listStoredBelraiDrafts,
  loadStoredBelraiDraft,
  persistBelraiDraft,
  resetBelraiDraft,
  type BelraiScoreCard,
  type BelraiTwinSnapshot,
  type StoredBelraiDraft,
} from '@/lib/belrai';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { mapPatientRecordToProfile } from '@/lib/platformData';
import { mockPatients, type Patient } from '@/lib/patients';
import { supabase } from '@/lib/supabase';

interface ResolvedBelraiPatient {
  patient: Patient;
  databasePatientId: string | null;
}

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
    template_key: 'interrai_hc_screener',
    template_version: 'local-v1',
    assessment_scope: 'screening',
    status: draft.status,
    sync_status: draft.syncStatus,
    source: 'meta_cares_twin',
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
  const assessment = await fetchLatestAssessment(databasePatientId);

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
    const snapshot = buildBelraiTwin(
      resolved.patient,
      buildCachedDraft(patientId, cachedDraft, { storage: 'local' }),
    );
    queueBelraiReadLog(snapshot, resolved.patient, patientId, null, 'local');
    return snapshot;
  }

  try {
    const persistedDraft = await loadPersistedDraft(patientId, resolved.databasePatientId);

    if (!persistedDraft) {
      const snapshot = buildBelraiTwin(
        resolved.patient,
        buildCachedDraft(patientId, cachedDraft, { storage: 'local' }),
      );
      queueBelraiReadLog(
        snapshot,
        resolved.patient,
        patientId,
        resolved.databasePatientId,
        'local-fallback',
      );
      return snapshot;
    }

    persistBelraiDraft(patientId, persistedDraft, { preserveUpdatedAt: true });
    const snapshot = buildBelraiTwin(resolved.patient, persistedDraft);
    queueBelraiReadLog(
      snapshot,
      resolved.patient,
      patientId,
      resolved.databasePatientId,
      'supabase',
    );
    return snapshot;
  } catch {
    const snapshot = buildBelraiTwin(
      resolved.patient,
      buildCachedDraft(patientId, cachedDraft, { storage: 'local' }),
    );
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
