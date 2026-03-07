import { addDays, startOfDay } from 'date-fns';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import {
  buildHourlyPilotVisitComputation,
  estimateForfaitAmount,
  type HourlyPilotBillingLineDraft,
  type HourlyPilotCareTransition,
  type HourlyPilotLocationEventInput,
  type HourlyPilotLocationEventRecord,
  type HourlyPilotPlaceOfService,
  type HourlyPilotSegmentDraft,
  type HourlyPilotSummaryDraft,
} from '@/lib/hourlyPilot';
import { supabase } from '@/lib/supabase';

type ProfileSummaryRow = Pick<Tables<'profiles'>, 'id' | 'first_name' | 'last_name'>;

type VisitSelectRow = Tables<'visits'> & {
  nurse: ProfileSummaryRow | null;
  visit_hourly_billing_lines: Tables<'visit_hourly_billing_lines'>[] | null;
  visit_hourly_billing_summaries:
    | Tables<'visit_hourly_billing_summaries'>
    | Tables<'visit_hourly_billing_summaries'>[]
    | null;
  visit_location_events: Tables<'visit_location_events'>[] | null;
  visit_acts: Tables<'visit_acts'>[] | null;
  visit_time_segments: Tables<'visit_time_segments'>[] | null;
  visit_vitals: Tables<'visit_vitals'> | Tables<'visit_vitals'>[] | null;
};

type VisitLookupRow = Pick<Tables<'visits'>, 'id' | 'had_episode_id'>;

const visitSummarySelect = `
  id,
  patient_id,
  nurse_id,
  had_episode_id,
  scheduled_start,
  scheduled_end,
  status,
  notes,
  signature,
  completed_at,
  created_at,
  updated_at,
  nurse:profiles!visits_nurse_id_fkey (
    id,
    first_name,
    last_name
  ),
  visit_acts (
    id,
    visit_id,
    code,
    label,
    value_w,
    category,
    created_at
  ),
  visit_vitals (
    visit_id,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    heart_rate,
    temperature,
    oxygen_saturation,
    glycemia,
    weight,
    pain,
    created_at,
    updated_at
  ),
  visit_location_events (
    id,
    visit_id,
    recorded_at,
    latitude,
    longitude,
    accuracy_meters,
    source,
    geofence_state,
    distance_to_patient_m,
    metadata,
    created_at
  ),
  visit_time_segments (
    id,
    visit_id,
    segment_type,
    source,
    place_of_service,
    started_at,
    ended_at,
    duration_minutes,
    is_billable,
    requires_manual_review,
    is_corrected,
    correction_reason,
    notes,
    metadata,
    created_at,
    updated_at
  ),
  visit_hourly_billing_summaries (
    visit_id,
    place_of_service,
    total_travel_minutes,
    total_direct_minutes,
    total_indirect_minutes,
    total_billable_minutes,
    travel_amount,
    direct_amount,
    indirect_amount,
    hourly_amount,
    estimated_forfait_amount,
    delta_amount,
    indirect_ratio,
    geofencing_enabled,
    geofencing_coverage_ratio,
    requires_manual_review,
    review_reasons,
    status,
    generated_at,
    validated_at,
    created_at,
    updated_at
  ),
  visit_hourly_billing_lines (
    id,
    visit_id,
    segment_id,
    code,
    label,
    segment_type,
    place_of_service,
    unit_minutes,
    hourly_rate,
    amount,
    is_weekend_or_holiday,
    line_status,
    justification,
    payload,
    created_at,
    updated_at
  )
`;

const openHadStatuses = ['screening', 'eligible', 'planned', 'active', 'paused', 'escalated'] as const;
const editableVisitStatuses = ['planned', 'in_progress'] as const;
const nurseMeasurementTypes = [
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'temperature',
  'oxygen_saturation',
  'glycemia',
  'weight',
  'pain',
] as const;

type NurseMeasurementType = (typeof nurseMeasurementTypes)[number];

export interface NurseVisitVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  glycemia?: number;
  weight?: number;
  pain?: number;
}

export interface NurseVisitAct {
  code: string;
  label: string;
  valueW: number;
  category: Tables<'visit_acts'>['category'];
}

export interface NurseVisitHourlyPilot {
  locationEvents: HourlyPilotLocationEventRecord[];
  segments: HourlyPilotSegmentDraft[];
  lines: HourlyPilotBillingLineDraft[];
  summary?: HourlyPilotSummaryDraft;
}

export interface SaveNurseVisitHourlyPilotInput {
  placeOfService: HourlyPilotPlaceOfService;
  geofencingEnabled?: boolean;
  geofenceRadiusMeters?: number;
  patientLatitude?: number | null;
  patientLongitude?: number | null;
  locationEvents?: HourlyPilotLocationEventInput[];
  careTransitions?: HourlyPilotCareTransition[];
  manualCorrectionReason?: string | null;
}

export interface NurseVisitSummary {
  id: string;
  patientId: string;
  nurseId?: string;
  nurseName?: string;
  hadEpisodeId?: string;
  scheduledStart: string;
  scheduledEnd?: string;
  completedAt?: string;
  status: Tables<'visits'>['status'];
  notes?: string;
  signature?: string;
  acts: NurseVisitAct[];
  hourlyPilot?: NurseVisitHourlyPilot;
  vitals: NurseVisitVitals;
  totalW: number;
}

export interface SaveNurseVisitInput {
  visitId?: string;
  patientId: string;
  nurseId?: string;
  hadEpisodeId?: string | null;
  startedAt: string;
  completedAt?: string;
  notes?: string | null;
  acts: NurseVisitAct[];
  vitals: NurseVisitVitals;
  signature?: string | null;
  status?: Tables<'visits'>['status'];
  hourlyPilot?: SaveNurseVisitHourlyPilotInput;
}

interface VisitSignaturePayload {
  signedAt?: string;
  signedById?: string;
  signedByName?: string;
}

export interface ParsedNurseVisitSignature extends VisitSignaturePayload {
  raw: string;
}

export interface SignNurseVisitInput {
  visitId: string;
  signerId?: string;
  signerName?: string;
  signedAt?: string;
}

export interface NurseWoundAssessment {
  id: string;
  patientId: string;
  visitId?: string;
  hadEpisodeId?: string;
  recordedByProfileId?: string;
  woundLabel: string;
  woundType: string;
  zoneId: string;
  lengthCm?: number;
  widthCm?: number;
  depthCm?: number;
  exudateLevel: string;
  tissueType: string;
  pain?: number;
  notes?: string;
  metadata: Json;
  recordedAt: string;
}

export interface CreateNurseWoundAssessmentInput {
  patientId: string;
  visitId?: string | null;
  hadEpisodeId?: string | null;
  recordedByProfileId?: string;
  woundLabel: string;
  woundType: string;
  zoneId: string;
  lengthCm?: number;
  widthCm?: number;
  depthCm?: number;
  exudateLevel: string;
  tissueType: string;
  pain?: number;
  notes?: string | null;
  metadata?: Json;
  recordedAt?: string;
}

function getDayBounds(date = new Date()) {
  const start = startOfDay(date);
  const end = addDays(start, 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function toFullName(profile?: ProfileSummaryRow | null) {
  if (!profile) {
    return undefined;
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  return fullName.length > 0 ? fullName : undefined;
}

function normalizeToSingleRow<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapVisitVitals(row: Tables<'visit_vitals'> | null): NurseVisitVitals {
  return {
    bloodPressureSystolic: row?.blood_pressure_systolic ?? undefined,
    bloodPressureDiastolic: row?.blood_pressure_diastolic ?? undefined,
    heartRate: row?.heart_rate ?? undefined,
    temperature: row?.temperature ?? undefined,
    oxygenSaturation: row?.oxygen_saturation ?? undefined,
    glycemia: row?.glycemia ?? undefined,
    weight: row?.weight ?? undefined,
    pain: row?.pain ?? undefined,
  };
}

function toReviewReasons(value: Json): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function mapHourlyPilotLocationEvent(row: Tables<'visit_location_events'>): HourlyPilotLocationEventRecord {
  return {
    recordedAt: row.recorded_at,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyMeters: row.accuracy_meters ?? undefined,
    source: row.source as HourlyPilotLocationEventRecord['source'],
    geofenceState: row.geofence_state as HourlyPilotLocationEventRecord['geofenceState'],
    distanceToPatientMeters: row.distance_to_patient_m ?? undefined,
    metadata: (row.metadata as Record<string, Json>) ?? {},
  };
}

function mapHourlyPilotSegment(row: Tables<'visit_time_segments'>): HourlyPilotSegmentDraft {
  return {
    segmentType: row.segment_type as HourlyPilotSegmentDraft['segmentType'],
    source: row.source as HourlyPilotSegmentDraft['source'],
    placeOfService: row.place_of_service as HourlyPilotSegmentDraft['placeOfService'],
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    isBillable: row.is_billable,
    requiresManualReview: row.requires_manual_review,
    isCorrected: row.is_corrected,
    correctionReason: row.correction_reason ?? undefined,
    notes: row.notes ?? undefined,
    metadata: row.metadata,
  };
}

function mapHourlyPilotLine(row: Tables<'visit_hourly_billing_lines'>): HourlyPilotBillingLineDraft {
  return {
    code: row.code,
    label: row.label,
    segmentType: row.segment_type as HourlyPilotBillingLineDraft['segmentType'],
    placeOfService: row.place_of_service as HourlyPilotBillingLineDraft['placeOfService'],
    unitMinutes: row.unit_minutes,
    hourlyRate: row.hourly_rate,
    amount: row.amount,
    isWeekendOrHoliday: row.is_weekend_or_holiday,
    justification: row.justification ?? undefined,
    payload: row.payload,
  };
}

function mapHourlyPilotSummary(row: Tables<'visit_hourly_billing_summaries'>): HourlyPilotSummaryDraft {
  return {
    placeOfService: row.place_of_service as HourlyPilotSummaryDraft['placeOfService'],
    totalTravelMinutes: row.total_travel_minutes,
    totalDirectMinutes: row.total_direct_minutes,
    totalIndirectMinutes: row.total_indirect_minutes,
    totalBillableMinutes: row.total_billable_minutes,
    travelAmount: row.travel_amount,
    directAmount: row.direct_amount,
    indirectAmount: row.indirect_amount,
    hourlyAmount: row.hourly_amount,
    estimatedForfaitAmount: row.estimated_forfait_amount,
    deltaAmount: row.delta_amount,
    indirectRatio: row.indirect_ratio ?? undefined,
    geofencingEnabled: row.geofencing_enabled,
    geofencingCoverageRatio: row.geofencing_coverage_ratio ?? undefined,
    requiresManualReview: row.requires_manual_review,
    reviewReasons: toReviewReasons(row.review_reasons),
    status: row.status as HourlyPilotSummaryDraft['status'],
    generatedAt: row.generated_at,
  };
}

function mapVisitSummary(row: VisitSelectRow): NurseVisitSummary {
  const vitalsRow = normalizeToSingleRow(row.visit_vitals);
  const acts = (row.visit_acts ?? []).map((act) => ({
    code: act.code,
    label: act.label,
    valueW: act.value_w,
    category: act.category,
  }));
  const hourlySummaryRow = normalizeToSingleRow(row.visit_hourly_billing_summaries);
  const locationEvents = (row.visit_location_events ?? []).map(mapHourlyPilotLocationEvent);
  const segments = (row.visit_time_segments ?? []).map(mapHourlyPilotSegment);
  const lines = (row.visit_hourly_billing_lines ?? []).map(mapHourlyPilotLine);
  const hourlyPilot = hourlySummaryRow || locationEvents.length > 0 || segments.length > 0 || lines.length > 0
    ? {
      locationEvents,
      segments,
      lines,
      summary: hourlySummaryRow ? mapHourlyPilotSummary(hourlySummaryRow) : undefined,
    }
    : undefined;

  return {
    id: row.id,
    patientId: row.patient_id,
    nurseId: row.nurse_id ?? undefined,
    nurseName: toFullName(row.nurse),
    hadEpisodeId: row.had_episode_id ?? undefined,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end ?? undefined,
    completedAt: row.completed_at ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    signature: row.signature ?? undefined,
    acts,
    hourlyPilot,
    vitals: mapVisitVitals(vitalsRow),
    totalW: acts.reduce((sum, act) => sum + act.valueW, 0),
  };
}

function mapWoundAssessment(row: Tables<'wound_assessments'>): NurseWoundAssessment {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitId: row.visit_id ?? undefined,
    hadEpisodeId: row.had_episode_id ?? undefined,
    recordedByProfileId: row.recorded_by_profile_id ?? undefined,
    woundLabel: row.wound_label,
    woundType: row.wound_type,
    zoneId: row.zone_id,
    lengthCm: row.length_cm ?? undefined,
    widthCm: row.width_cm ?? undefined,
    depthCm: row.depth_cm ?? undefined,
    exudateLevel: row.exudate_level,
    tissueType: row.tissue_type,
    pain: row.pain ?? undefined,
    notes: row.notes ?? undefined,
    metadata: row.metadata,
    recordedAt: row.recorded_at,
  };
}

function toVisitVitalsPayload(
  visitId: string,
  vitals: NurseVisitVitals,
): TablesInsert<'visit_vitals'> {
  return {
    visit_id: visitId,
    blood_pressure_systolic: vitals.bloodPressureSystolic ?? null,
    blood_pressure_diastolic: vitals.bloodPressureDiastolic ?? null,
    heart_rate: vitals.heartRate ?? null,
    temperature: vitals.temperature ?? null,
    oxygen_saturation: vitals.oxygenSaturation ?? null,
    glycemia: vitals.glycemia ?? null,
    weight: vitals.weight ?? null,
    pain: vitals.pain ?? null,
  };
}

function toVisitLocationEventPayload(
  visitId: string,
  event: HourlyPilotLocationEventRecord,
): TablesInsert<'visit_location_events'> {
  return {
    visit_id: visitId,
    recorded_at: event.recordedAt,
    latitude: event.latitude,
    longitude: event.longitude,
    accuracy_meters: event.accuracyMeters ?? null,
    source: event.source ?? 'device',
    geofence_state: event.geofenceState,
    distance_to_patient_m: event.distanceToPatientMeters ?? null,
    metadata: event.metadata ?? {},
  };
}

function toVisitTimeSegmentPayload(
  visitId: string,
  segment: HourlyPilotSegmentDraft,
): TablesInsert<'visit_time_segments'> {
  return {
    visit_id: visitId,
    segment_type: segment.segmentType,
    source: segment.source,
    place_of_service: segment.placeOfService,
    started_at: segment.startedAt,
    ended_at: segment.endedAt,
    duration_minutes: segment.durationMinutes,
    is_billable: segment.isBillable,
    requires_manual_review: segment.requiresManualReview,
    is_corrected: segment.isCorrected,
    correction_reason: segment.correctionReason ?? null,
    notes: segment.notes ?? null,
    metadata: segment.metadata,
  };
}

function toVisitHourlySummaryPayload(
  visitId: string,
  summary: HourlyPilotSummaryDraft,
): TablesInsert<'visit_hourly_billing_summaries'> {
  return {
    visit_id: visitId,
    place_of_service: summary.placeOfService,
    total_travel_minutes: summary.totalTravelMinutes,
    total_direct_minutes: summary.totalDirectMinutes,
    total_indirect_minutes: summary.totalIndirectMinutes,
    total_billable_minutes: summary.totalBillableMinutes,
    travel_amount: summary.travelAmount,
    direct_amount: summary.directAmount,
    indirect_amount: summary.indirectAmount,
    hourly_amount: summary.hourlyAmount,
    estimated_forfait_amount: summary.estimatedForfaitAmount,
    delta_amount: summary.deltaAmount,
    indirect_ratio: summary.indirectRatio ?? null,
    geofencing_enabled: summary.geofencingEnabled,
    geofencing_coverage_ratio: summary.geofencingCoverageRatio ?? null,
    requires_manual_review: summary.requiresManualReview,
    review_reasons: summary.reviewReasons,
    status: summary.status,
    generated_at: summary.generatedAt,
  };
}

function toVisitHourlyLinePayload(
  visitId: string,
  line: HourlyPilotBillingLineDraft,
): TablesInsert<'visit_hourly_billing_lines'> {
  return {
    visit_id: visitId,
    segment_id: null,
    code: line.code,
    label: line.label,
    segment_type: line.segmentType,
    place_of_service: line.placeOfService,
    unit_minutes: line.unitMinutes,
    hourly_rate: line.hourlyRate,
    amount: line.amount,
    is_weekend_or_holiday: line.isWeekendOrHoliday,
    line_status: 'draft',
    justification: line.justification ?? null,
    payload: line.payload,
  };
}

function getMeasurementUnit(type: NurseMeasurementType) {
  switch (type) {
    case 'blood_pressure_systolic':
    case 'blood_pressure_diastolic':
      return 'mmHg';
    case 'heart_rate':
      return 'bpm';
    case 'temperature':
      return '°C';
    case 'oxygen_saturation':
      return '%';
    case 'glycemia':
      return 'mg/dL';
    case 'weight':
      return 'kg';
    case 'pain':
      return '/10';
    default:
      return '';
  }
}

function getMeasurementThresholdState(
  type: NurseMeasurementType,
  value: number,
): Tables<'had_measurements'>['threshold_state'] {
  switch (type) {
    case 'blood_pressure_systolic':
      return value >= 180 ? 'critical' : value >= 140 ? 'warning' : 'ok';
    case 'blood_pressure_diastolic':
      return value >= 110 ? 'critical' : value >= 90 ? 'warning' : 'ok';
    case 'heart_rate':
      return value >= 130 || value <= 40 ? 'critical' : value >= 110 || value <= 50 ? 'warning' : 'ok';
    case 'temperature':
      return value >= 39 ? 'critical' : value >= 38 ? 'warning' : 'ok';
    case 'oxygen_saturation':
      return value < 90 ? 'critical' : value < 94 ? 'warning' : 'ok';
    case 'glycemia':
      return value <= 60 || value >= 250 ? 'critical' : value <= 70 || value >= 180 ? 'warning' : 'ok';
    case 'weight':
      return 'ok';
    case 'pain':
      return value >= 8 ? 'critical' : value >= 5 ? 'warning' : 'ok';
    default:
      return 'ok';
  }
}

function toHadMeasurementRows(
  visitId: string,
  hadEpisodeId: string,
  recordedAt: string,
  vitals: NurseVisitVitals,
  nurseId?: string,
): TablesInsert<'had_measurements'>[] {
  const numericValues: Record<NurseMeasurementType, number | undefined> = {
    blood_pressure_systolic: vitals.bloodPressureSystolic,
    blood_pressure_diastolic: vitals.bloodPressureDiastolic,
    heart_rate: vitals.heartRate,
    temperature: vitals.temperature,
    oxygen_saturation: vitals.oxygenSaturation,
    glycemia: vitals.glycemia,
    weight: vitals.weight,
    pain: vitals.pain,
  };

  return nurseMeasurementTypes.flatMap((measurementType) => {
    const value = numericValues[measurementType];

    if (typeof value !== 'number' || Number.isNaN(value)) {
      return [];
    }

    return [{
      episode_id: hadEpisodeId,
      visit_id: visitId,
      captured_by_profile_id: nurseId ?? null,
      source: 'nurse',
      measurement_type: measurementType,
      value_numeric: value,
      value_text: null,
      unit: getMeasurementUnit(measurementType),
      threshold_state: getMeasurementThresholdState(measurementType, value),
      recorded_at: recordedAt,
      notes: null,
    }];
  });
}

async function getVisitById(visitId: string) {
  const { data, error } = await supabase
    .from('visits')
    .select(visitSummarySelect)
    .eq('id', visitId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapVisitSummary(data as VisitSelectRow) : null;
}

export async function listNurseVisitSummaries(patientId: string, limit?: number) {
  const query = supabase
    .from('visits')
    .select(visitSummarySelect)
    .eq('patient_id', patientId)
    .order('scheduled_start', { ascending: false });
  const { data, error } = typeof limit === 'number'
    ? await query.limit(limit)
    : await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapVisitSummary(row as VisitSelectRow));
}

async function getLatestVisitByPatientId(patientId: string) {
  const { data, error } = await supabase
    .from('visits')
    .select(visitSummarySelect)
    .eq('patient_id', patientId)
    .order('scheduled_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapVisitSummary(data as VisitSelectRow) : null;
}

async function getEditableVisitForPatient(patientId: string) {
  const { startIso, endIso } = getDayBounds();
  const { data, error } = await supabase
    .from('visits')
    .select('id, had_episode_id')
    .eq('patient_id', patientId)
    .in('status', [...editableVisitStatuses])
    .gte('scheduled_start', startIso)
    .lt('scheduled_start', endIso)
    .order('scheduled_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as VisitLookupRow | null) ?? null;
}

async function getLatestOpenHadEpisodeId(patientId: string) {
  const { data, error } = await supabase
    .from('had_episodes')
    .select('id')
    .eq('patient_id', patientId)
    .in('status', [...openHadStatuses])
    .order('start_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function replaceVisitActs(visitId: string, acts: NurseVisitAct[]) {
  const { error: deleteError } = await supabase
    .from('visit_acts')
    .delete()
    .eq('visit_id', visitId);

  if (deleteError) {
    throw deleteError;
  }

  if (acts.length === 0) {
    return;
  }

  const payload: TablesInsert<'visit_acts'>[] = acts.map((act) => ({
    visit_id: visitId,
    code: act.code,
    label: act.label,
    value_w: act.valueW,
    category: act.category,
  }));

  const { error: insertError } = await supabase
    .from('visit_acts')
    .insert(payload);

  if (insertError) {
    throw insertError;
  }
}

async function replaceVisitLocationEvents(
  visitId: string,
  events: HourlyPilotLocationEventRecord[],
) {
  const { error: deleteError } = await supabase
    .from('visit_location_events')
    .delete()
    .eq('visit_id', visitId);

  if (deleteError) {
    throw deleteError;
  }

  if (events.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('visit_location_events')
    .insert(events.map((event) => toVisitLocationEventPayload(visitId, event)));

  if (insertError) {
    throw insertError;
  }
}

async function replaceVisitTimeSegments(
  visitId: string,
  segments: HourlyPilotSegmentDraft[],
) {
  const { error: deleteError } = await supabase
    .from('visit_time_segments')
    .delete()
    .eq('visit_id', visitId);

  if (deleteError) {
    throw deleteError;
  }

  if (segments.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('visit_time_segments')
    .insert(segments.map((segment) => toVisitTimeSegmentPayload(visitId, segment)));

  if (insertError) {
    throw insertError;
  }
}

async function replaceVisitHourlyLines(
  visitId: string,
  lines: HourlyPilotBillingLineDraft[],
) {
  const { error: deleteError } = await supabase
    .from('visit_hourly_billing_lines')
    .delete()
    .eq('visit_id', visitId);

  if (deleteError) {
    throw deleteError;
  }

  if (lines.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('visit_hourly_billing_lines')
    .insert(lines.map((line) => toVisitHourlyLinePayload(visitId, line)));

  if (insertError) {
    throw insertError;
  }
}

async function upsertVisitHourlySummary(
  visitId: string,
  summary: HourlyPilotSummaryDraft,
) {
  const { error } = await supabase
    .from('visit_hourly_billing_summaries')
    .upsert(toVisitHourlySummaryPayload(visitId, summary), {
      onConflict: 'visit_id',
    });

  if (error) {
    throw error;
  }
}

async function syncHourlyPilotForVisit(visitId: string, input: SaveNurseVisitInput) {
  if (!input.hourlyPilot) {
    return;
  }

  const totalW = input.acts.reduce((sum, act) => sum + act.valueW, 0);
  const computation = buildHourlyPilotVisitComputation({
    visitStartAt: input.startedAt,
    visitEndAt: input.completedAt ?? new Date().toISOString(),
    placeOfService: input.hourlyPilot.placeOfService,
    geofencingEnabled: input.hourlyPilot.geofencingEnabled,
    geofenceRadiusMeters: input.hourlyPilot.geofenceRadiusMeters,
    patientLatitude: input.hourlyPilot.patientLatitude,
    patientLongitude: input.hourlyPilot.patientLongitude,
    locationEvents: input.hourlyPilot.locationEvents,
    careTransitions: input.hourlyPilot.careTransitions,
    estimatedForfaitAmount: estimateForfaitAmount(totalW),
    manualCorrectionReason: input.hourlyPilot.manualCorrectionReason,
  });

  await Promise.all([
    replaceVisitLocationEvents(visitId, computation.locationEvents),
    replaceVisitTimeSegments(visitId, computation.segments),
    replaceVisitHourlyLines(visitId, computation.lines),
    upsertVisitHourlySummary(visitId, computation.summary),
  ]);
}

async function syncHadMeasurementsForVisit(
  visitId: string,
  hadEpisodeId: string | null,
  recordedAt: string,
  vitals: NurseVisitVitals,
  nurseId?: string,
) {
  if (!hadEpisodeId) {
    return;
  }

  const { error: deleteError } = await supabase
    .from('had_measurements')
    .delete()
    .eq('visit_id', visitId)
    .eq('episode_id', hadEpisodeId)
    .eq('source', 'nurse')
    .in('measurement_type', [...nurseMeasurementTypes]);

  if (deleteError) {
    throw deleteError;
  }

  const measurementRows = toHadMeasurementRows(visitId, hadEpisodeId, recordedAt, vitals, nurseId);

  if (measurementRows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('had_measurements')
    .insert(measurementRows);

  if (insertError) {
    throw insertError;
  }
}

async function updatePatientLastVisit(patientId: string, completedAt?: string) {
  if (!completedAt) {
    return;
  }

  const payload: TablesUpdate<'patients'> = {
    last_visit_at: completedAt,
  };

  const { error } = await supabase
    .from('patients')
    .update(payload)
    .eq('id', patientId);

  if (error) {
    throw error;
  }
}

export async function getNurseVisitSummary(patientId: string, visitId?: string) {
  if (visitId) {
    const visit = await getVisitById(visitId);

    if (visit && visit.patientId === patientId) {
      return visit;
    }
  }

  return getLatestVisitByPatientId(patientId);
}

export async function saveNurseVisit(input: SaveNurseVisitInput) {
  const existingVisit = input.visitId
    ? { id: input.visitId, had_episode_id: null }
    : await getEditableVisitForPatient(input.patientId);
  const resolvedVisitId = existingVisit?.id;
  const resolvedHadEpisodeId =
    input.hadEpisodeId === undefined
      ? existingVisit?.had_episode_id ?? (await getLatestOpenHadEpisodeId(input.patientId))
      : input.hadEpisodeId;
  const scheduledEnd = input.completedAt ?? null;
  const visitPayload: TablesInsert<'visits'> = {
    patient_id: input.patientId,
    nurse_id: input.nurseId ?? null,
    had_episode_id: resolvedHadEpisodeId ?? null,
    scheduled_start: input.startedAt,
    scheduled_end: scheduledEnd,
    status: input.status ?? 'completed',
    notes: input.notes ?? null,
    signature: input.signature ?? null,
    completed_at: (input.status ?? 'completed') === 'completed' ? scheduledEnd : null,
  };

  if (resolvedVisitId) {
    const { error: visitError } = await supabase
      .from('visits')
      .update(visitPayload)
      .eq('id', resolvedVisitId);

    if (visitError) {
      throw visitError;
    }
  } else {
    const { data, error } = await supabase
      .from('visits')
      .insert(visitPayload)
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    if (!data?.id) {
      throw new Error('Visite persistée introuvable.');
    }

    input.visitId = data.id;
  }

  const persistedVisitId = resolvedVisitId ?? input.visitId;

  if (!persistedVisitId) {
    throw new Error('Identifiant de visite manquant après sauvegarde.');
  }

  await Promise.all([
    replaceVisitActs(persistedVisitId, input.acts),
    supabase.from('visit_vitals').upsert(toVisitVitalsPayload(persistedVisitId, input.vitals), {
      onConflict: 'visit_id',
    }).then(({ error }) => {
      if (error) {
        throw error;
      }
    }),
    syncHadMeasurementsForVisit(
      persistedVisitId,
      resolvedHadEpisodeId ?? null,
      input.completedAt ?? input.startedAt,
      input.vitals,
      input.nurseId,
    ),
    syncHourlyPilotForVisit(persistedVisitId, input),
    updatePatientLastVisit(input.patientId, input.completedAt),
  ]);

  const visit = await getVisitById(persistedVisitId);

  if (!visit) {
    throw new Error('Résumé de visite introuvable après sauvegarde.');
  }

  return visit;
}

export function parseNurseVisitSignature(signature: string | null | undefined): ParsedNurseVisitSignature | null {
  if (!signature) {
    return null;
  }

  try {
    const payload = JSON.parse(signature) as Partial<VisitSignaturePayload>;

    if (typeof payload.signedAt === 'string') {
      return {
        raw: signature,
        signedAt: payload.signedAt,
        signedById: typeof payload.signedById === 'string' ? payload.signedById : undefined,
        signedByName: typeof payload.signedByName === 'string' ? payload.signedByName : undefined,
      };
    }
  } catch {
    return { raw: signature, signedAt: undefined, signedById: undefined, signedByName: undefined };
  }

  return { raw: signature, signedAt: undefined, signedById: undefined, signedByName: undefined };
}

export async function signNurseVisit(input: SignNurseVisitInput) {
  const signedAt = input.signedAt ?? new Date().toISOString();
  const payload: TablesUpdate<'visits'> = {
    signature: JSON.stringify({
      signedAt,
      signedById: input.signerId,
      signedByName: input.signerName,
    } satisfies VisitSignaturePayload),
  };

  const { error } = await supabase
    .from('visits')
    .update(payload)
    .eq('id', input.visitId);

  if (error) {
    throw error;
  }

  const visit = await getVisitById(input.visitId);

  if (!visit) {
    throw new Error('Visite introuvable après signature.');
  }

  return visit;
}

export async function listNurseWoundAssessments(patientId: string) {
  const { data, error } = await supabase
    .from('wound_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapWoundAssessment);
}

export async function createNurseWoundAssessment(input: CreateNurseWoundAssessmentInput) {
  const payload: TablesInsert<'wound_assessments'> = {
    patient_id: input.patientId,
    visit_id: input.visitId ?? null,
    had_episode_id: input.hadEpisodeId ?? null,
    recorded_by_profile_id: input.recordedByProfileId ?? null,
    wound_label: input.woundLabel,
    wound_type: input.woundType,
    zone_id: input.zoneId,
    length_cm: input.lengthCm ?? null,
    width_cm: input.widthCm ?? null,
    depth_cm: input.depthCm ?? null,
    exudate_level: input.exudateLevel,
    tissue_type: input.tissueType,
    pain: input.pain ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
    recorded_at: input.recordedAt ?? undefined,
  };

  const { data, error } = await supabase
    .from('wound_assessments')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapWoundAssessment(data);
}
