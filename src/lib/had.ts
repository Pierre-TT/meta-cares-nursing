import { addDays, startOfDay } from 'date-fns';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type HadEpisodeRow = Tables<'had_episodes'>;
export type HadEpisodeTeamMemberRow = Tables<'had_episode_team_members'>;
export type HadEligibilityAssessmentRow = Tables<'had_eligibility_assessments'>;
export type HadCarePlanRow = Tables<'had_care_plans'>;
export type HadMedicationOrderRow = Tables<'had_medication_orders'>;
export type HadRoundRow = Tables<'had_rounds'>;
export type HadMeasurementRow = Tables<'had_measurements'>;
export type HadAlertRow = Tables<'had_alerts'>;
export type HadTaskRow = Tables<'had_tasks'>;
export type HadLogisticsItemRow = Tables<'had_logistics_items'>;

type ProfileSummaryRow = Pick<
  Tables<'profiles'>,
  'id' | 'first_name' | 'last_name' | 'role' | 'avatar_url' | 'phone' | 'inami_number'
>;

type PatientListSummaryRow = Pick<
  Tables<'patients'>,
  'id' | 'profile_id' | 'first_name' | 'last_name' | 'photo_url' | 'city' | 'mutuality' | 'next_visit_at'
>;

type PatientDetailRow = Pick<
  Tables<'patients'>,
  | 'id'
  | 'profile_id'
  | 'first_name'
  | 'last_name'
  | 'photo_url'
  | 'city'
  | 'mutuality'
  | 'next_visit_at'
  | 'phone'
  | 'email'
  | 'street'
  | 'house_number'
  | 'postal_code'
  | 'lat'
  | 'lng'
  | 'prescribing_doctor'
  | 'doctor_phone'
>;

type VisitSummaryRow = Pick<
  Tables<'visits'>,
  'id' | 'nurse_id' | 'scheduled_start' | 'scheduled_end' | 'status' | 'completed_at'
>;

type HadEpisodeListRow = Pick<
  Tables<'had_episodes'>,
  | 'id'
  | 'reference'
  | 'episode_type'
  | 'status'
  | 'origin'
  | 'risk_level'
  | 'hospital_reference'
  | 'originating_hospital'
  | 'originating_service'
  | 'diagnosis_summary'
  | 'admission_reason'
  | 'start_at'
  | 'target_end_at'
  | 'end_at'
  | 'last_round_at'
  | 'escalated_at'
> & {
  patient: PatientListSummaryRow | null;
  coordinator: ProfileSummaryRow | null;
  primary_nurse: ProfileSummaryRow | null;
};

type HadEpisodeTeamMemberSelectRow = Pick<
  Tables<'had_episode_team_members'>,
  | 'id'
  | 'role'
  | 'external_name'
  | 'external_phone'
  | 'external_email'
  | 'is_primary'
  | 'receives_alerts'
  | 'profile_id'
  | 'created_at'
  | 'updated_at'
> & {
  profile: ProfileSummaryRow | null;
};

type HadEpisodeDetailRow = Tables<'had_episodes'> & {
  patient: PatientDetailRow | null;
  specialist: ProfileSummaryRow | null;
  coordinator: ProfileSummaryRow | null;
  primary_nurse: ProfileSummaryRow | null;
  team_members: HadEpisodeTeamMemberSelectRow[] | null;
  eligibility_assessments: Tables<'had_eligibility_assessments'>[] | null;
  care_plans: Tables<'had_care_plans'>[] | null;
  medication_orders: Tables<'had_medication_orders'>[] | null;
  alerts: HadAlertSummaryRow[] | null;
  tasks: HadEpisodeTaskSelectRow[] | null;
  logistics_items: HadLogisticsItemSelectRow[] | null;
  visits: VisitSummaryRow[] | null;
};

type HadDailyRoundSelectRow = Tables<'had_rounds'> & {
  recorded_by_profile: ProfileSummaryRow | null;
};

type HadMeasurementSelectRow = Tables<'had_measurements'> & {
  captured_by: ProfileSummaryRow | null;
};
type HadAlertSummaryRow = Pick<
  Tables<'had_alerts'>,
  | 'id'
  | 'episode_id'
  | 'measurement_id'
  | 'severity'
  | 'status'
  | 'title'
  | 'description'
  | 'acknowledged_at'
  | 'resolved_at'
  | 'created_at'
  | 'updated_at'
>;

type HadEpisodeTaskSelectRow = Pick<
  Tables<'had_tasks'>,
  | 'id'
  | 'episode_id'
  | 'linked_alert_id'
  | 'owner_kind'
  | 'owner_profile_id'
  | 'owner_external_label'
  | 'visibility'
  | 'status'
  | 'task_type'
  | 'title'
  | 'description'
  | 'due_at'
  | 'completed_at'
  | 'completed_by_profile_id'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
>;

type HadLogisticsItemSelectRow = Pick<
  Tables<'had_logistics_items'>,
  | 'id'
  | 'episode_id'
  | 'item_type'
  | 'label'
  | 'quantity'
  | 'unit'
  | 'supplier'
  | 'cold_chain_required'
  | 'status'
  | 'scheduled_for'
  | 'completed_at'
  | 'tracking_reference'
  | 'notes'
  | 'created_at'
  | 'updated_at'
>;

type HadPatientTaskSelectRow = Pick<
  Tables<'had_tasks'>,
  | 'id'
  | 'episode_id'
  | 'linked_alert_id'
  | 'owner_kind'
  | 'owner_profile_id'
  | 'owner_external_label'
  | 'visibility'
  | 'status'
  | 'task_type'
  | 'title'
  | 'description'
  | 'due_at'
  | 'completed_at'
  | 'completed_by_profile_id'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
> & {
  episode: Pick<Tables<'had_episodes'>, 'id' | 'reference' | 'episode_type' | 'status'> | null;
};

export interface HadPersonSummary {
  id: string;
  fullName: string;
  role: Tables<'profiles'>['role'];
  avatarUrl?: string;
  phone?: string;
  inamiNumber?: string;
}

export interface HadPatientSummary {
  id: string;
  profileId?: string;
  fullName: string;
  city: string;
  mutuality: string;
  photoUrl?: string;
  nextVisitAt?: string;
}

export interface HadEpisodePatientDetail extends HadPatientSummary {
  phone: string;
  email?: string;
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  prescribingDoctor: string;
  doctorPhone?: string;
}

export interface HadEpisodeListItem {
  id: string;
  reference: string;
  episodeType: HadEpisodeRow['episode_type'];
  status: HadEpisodeRow['status'];
  origin: HadEpisodeRow['origin'];
  riskLevel: HadEpisodeRow['risk_level'];
  diagnosisSummary: string;
  admissionReason: string;
  startAt?: string;
  targetEndAt?: string;
  endAt?: string;
  lastRoundAt?: string;
  escalatedAt?: string;
  hospital: {
    name: string;
    service?: string;
    reference?: string;
  };
  patient: HadPatientSummary;
  coordinator?: HadPersonSummary;
  primaryNurse?: HadPersonSummary;
}

export interface HadEpisodeTeamMember {
  id: string;
  role: HadEpisodeTeamMemberRow['role'];
  isPrimary: boolean;
  receivesAlerts: boolean;
  externalName?: string;
  externalPhone?: string;
  externalEmail?: string;
  profile?: HadPersonSummary;
  createdAt: string;
  updatedAt: string;
}

export interface HadEligibilityAssessment {
  id: string;
  assessedAt: string;
  assessedById?: string;
  clinicalStability: boolean;
  requires247Monitoring: boolean;
  needsImmediateTechnicalPlatform: boolean;
  homeEnvironmentAdequate: boolean;
  patientConsentObtained: boolean;
  gpInformed: boolean;
  caregiverAvailable?: boolean;
  logisticsReady: boolean;
  caregiverBurdenRisk: boolean;
  result: HadEligibilityAssessmentRow['result'];
  blockers: HadEligibilityAssessmentRow['blockers'];
  recommendations: HadEligibilityAssessmentRow['recommendations'];
  notes?: string;
}

export interface HadCarePlan {
  id: string;
  version: number;
  status: HadCarePlanRow['status'];
  protocolSlug: string;
  summary: string;
  monitoringPlan: HadCarePlanRow['monitoring_plan'];
  escalationRules: HadCarePlanRow['escalation_rules'];
  dischargeCriteria: HadCarePlanRow['discharge_criteria'];
  reviewFrequencyHours: number;
  nextReviewAt?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface HadMedicationOrder {
  id: string;
  carePlanId?: string;
  lineNumber: number;
  medicationName: string;
  dose: string;
  route: string;
  frequency: string;
  administrationInstructions?: string;
  requiresNurse: boolean;
  supplier: string;
  status: HadMedicationOrderRow['status'];
  startAt?: string;
  endAt?: string;
  nextDueAt?: string;
  lastAdministeredAt?: string;
}

export interface HadAlertSummary {
  id: string;
  severity: HadAlertRow['severity'];
  status: HadAlertRow['status'];
  title: string;
  description?: string;
  measurementId?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface HadVisitSummary {
  id: string;
  nurseId?: string;
  scheduledStart: string;
  scheduledEnd?: string;
  status: Tables<'visits'>['status'];
  completedAt?: string;
}
export interface HadEpisodeTask {
  id: string;
  episodeId: string;
  linkedAlertId?: string;
  ownerKind: HadTaskRow['owner_kind'];
  ownerProfileId?: string;
  ownerExternalLabel?: string;
  visibility: HadTaskRow['visibility'];
  status: HadTaskRow['status'];
  taskType: HadTaskRow['task_type'];
  title: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
  completedByProfileId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HadLogisticsItem {
  id: string;
  episodeId: string;
  itemType: HadLogisticsItemRow['item_type'];
  label: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
  coldChainRequired: boolean;
  status: HadLogisticsItemRow['status'];
  scheduledFor?: string;
  completedAt?: string;
  trackingReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HadEpisodeDetail {
  episode: HadEpisodeListItem & {
    consentConfirmed: boolean;
    homeReady: boolean;
    caregiverRequired: boolean;
    caregiverAvailable?: boolean;
    inclusionNotes?: string;
    exclusionNotes?: string;
    escalationReason?: string;
    dischargeSummary?: string;
    specialist?: HadPersonSummary;
    sourceVisitId?: string;
    createdAt: string;
    updatedAt: string;
  };
  patient: HadEpisodePatientDetail;
  teamMembers: HadEpisodeTeamMember[];
  latestEligibilityAssessment?: HadEligibilityAssessment;
  carePlans: HadCarePlan[];
  medicationOrders: HadMedicationOrder[];
  alerts: HadAlertSummary[];
  tasks: HadEpisodeTask[];
  logisticsItems: HadLogisticsItem[];
  visits: HadVisitSummary[];
}

export interface HadDailyRound {
  id: string;
  episodeId: string;
  roundAt: string;
  recordedBy?: HadPersonSummary;
  riskScore?: number;
  summary: string;
  overnightEvents?: string;
  recommendation?: string;
  decision: HadRoundRow['decision'];
  decisionReason?: string;
  nextRoundAt?: string;
}

export interface HadMeasurement {
  id: string;
  episodeId: string;
  visitId?: string;
  source: HadMeasurementRow['source'];
  measurementType: string;
  valueNumeric?: number;
  valueText?: string;
  unit: string;
  thresholdState: HadMeasurementRow['threshold_state'];
  recordedAt: string;
  notes?: string;
  capturedBy?: HadPersonSummary;
}

export interface HadPatientTaskToday {
  id: string;
  episodeId: string;
  episodeReference?: string;
  episodeType?: HadEpisodeRow['episode_type'];
  episodeStatus?: HadEpisodeRow['status'];
  linkedAlertId?: string;
  ownerKind: HadTaskRow['owner_kind'];
  ownerProfileId?: string;
  ownerExternalLabel?: string;
  visibility: HadTaskRow['visibility'];
  status: HadTaskRow['status'];
  taskType: HadTaskRow['task_type'];
  title: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HadEpisodeListFilters {
  status?: HadEpisodeRow['status'] | HadEpisodeRow['status'][];
  episodeType?: HadEpisodeRow['episode_type'] | HadEpisodeRow['episode_type'][];
  patientId?: string;
  coordinatorProfileId?: string;
  primaryNurseProfileId?: string;
  onlyOpen?: boolean;
}

export interface CreateHadEpisodeInput {
  patientId: string;
  episodeType: HadEpisodeRow['episode_type'];
  status?: HadEpisodeRow['status'];
  origin?: HadEpisodeRow['origin'];
  riskLevel?: HadEpisodeRow['risk_level'];
  diagnosisSummary: string;
  admissionReason: string;
  originatingHospital: string;
  originatingService?: string;
  hospitalReference?: string;
  specialistProfileId?: string;
  coordinatorProfileId?: string;
  primaryNurseProfileId?: string;
  createdBy?: string;
  sourceVisitId?: string;
  consentConfirmed?: boolean;
  homeReady?: boolean;
  caregiverRequired?: boolean;
  caregiverAvailable?: boolean;
  startAt?: string;
  targetEndAt?: string;
  inclusionNotes?: string;
  exclusionNotes?: string;
}

export interface UpdateHadEpisodeInput {
  episodeId: string;
  patch: TablesUpdate<'had_episodes'>;
}

export interface CreateHadRoundInput {
  episodeId: string;
  recordedBy?: string;
  riskScore?: number;
  summary: string;
  overnightEvents?: string;
  recommendation?: string;
  decision?: HadRoundRow['decision'];
  decisionReason?: string;
  nextRoundAt?: string;
  roundAt?: string;
}

export interface CreateHadMeasurementInput {
  episodeId: string;
  measurementType: string;
  source?: HadMeasurementRow['source'];
  capturedByProfileId?: string;
  visitId?: string;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  thresholdState?: HadMeasurementRow['threshold_state'];
  notes?: string;
  recordedAt?: string;
}

export interface CompleteHadTaskInput {
  taskId: string;
  completedByProfileId?: string;
  completedAt?: string;
  status?: HadTaskRow['status'];
}
export interface CreateHadTaskInput {
  episodeId: string;
  linkedAlertId?: string;
  ownerKind: HadTaskRow['owner_kind'];
  ownerProfileId?: string;
  ownerExternalLabel?: string;
  visibility?: HadTaskRow['visibility'];
  status?: HadTaskRow['status'];
  taskType: HadTaskRow['task_type'];
  title: string;
  description?: string;
  dueAt?: string;
  createdBy?: string;
}

export interface UpdateHadAlertStatusInput {
  alertId: string;
  status: HadAlertRow['status'];
  actedByProfileId?: string;
  assignedToProfileId?: string;
  resolutionNote?: string;
}

const hadEpisodeListSelect = `
  id,
  reference,
  episode_type,
  status,
  origin,
  risk_level,
  hospital_reference,
  originating_hospital,
  originating_service,
  diagnosis_summary,
  admission_reason,
  start_at,
  target_end_at,
  end_at,
  last_round_at,
  escalated_at,
  patient:patients (
    id,
    profile_id,
    first_name,
    last_name,
    photo_url,
    city,
    mutuality,
    next_visit_at
  ),
  coordinator:profiles!had_episodes_coordinator_profile_id_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  ),
  primary_nurse:profiles!had_episodes_primary_nurse_profile_id_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  )
`;

const hadAlertsSummarySelect = `
  id,
  episode_id,
  measurement_id,
  severity,
  status,
  title,
  description,
  acknowledged_at,
  resolved_at,
  created_at,
  updated_at
`;

const hadEpisodeTasksSelect = `
  id,
  episode_id,
  linked_alert_id,
  owner_kind,
  owner_profile_id,
  owner_external_label,
  visibility,
  status,
  task_type,
  title,
  description,
  due_at,
  completed_at,
  completed_by_profile_id,
  created_by,
  created_at,
  updated_at
`;

const hadLogisticsItemsSelect = `
  id,
  episode_id,
  item_type,
  label,
  quantity,
  unit,
  supplier,
  cold_chain_required,
  status,
  scheduled_for,
  completed_at,
  tracking_reference,
  notes,
  created_at,
  updated_at
`;
const hadEpisodeDetailSelect = `
  id,
  patient_id,
  reference,
  episode_type,
  status,
  origin,
  risk_level,
  hospital_reference,
  source_visit_id,
  specialist_profile_id,
  coordinator_profile_id,
  primary_nurse_profile_id,
  originating_hospital,
  originating_service,
  diagnosis_summary,
  admission_reason,
  inclusion_notes,
  exclusion_notes,
  consent_confirmed,
  home_ready,
  caregiver_required,
  caregiver_available,
  start_at,
  target_end_at,
  end_at,
  last_round_at,
  escalated_at,
  escalation_reason,
  discharge_summary,
  created_by,
  created_at,
  updated_at,
  patient:patients (
    id,
    profile_id,
    first_name,
    last_name,
    photo_url,
    city,
    mutuality,
    next_visit_at,
    phone,
    email,
    street,
    house_number,
    postal_code,
    lat,
    lng,
    prescribing_doctor,
    doctor_phone
  ),
  specialist:profiles!had_episodes_specialist_profile_id_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  ),
  coordinator:profiles!had_episodes_coordinator_profile_id_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  ),
  primary_nurse:profiles!had_episodes_primary_nurse_profile_id_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  ),
  team_members:had_episode_team_members (
    id,
    role,
    external_name,
    external_phone,
    external_email,
    is_primary,
    receives_alerts,
    profile_id,
    created_at,
    updated_at,
    profile:profiles!had_episode_team_members_profile_id_fkey (
      id,
      first_name,
      last_name,
      role,
      avatar_url,
      phone,
      inami_number
    )
  ),
  eligibility_assessments:had_eligibility_assessments (
    id,
    assessed_at,
    assessed_by,
    clinical_stability,
    requires_24_7_monitoring,
    needs_immediate_technical_platform,
    home_environment_adequate,
    patient_consent_obtained,
    gp_informed,
    caregiver_available,
    logistics_ready,
    caregiver_burden_risk,
    result,
    blockers,
    recommendations,
    notes,
    created_at,
    updated_at
  ),
  care_plans:had_care_plans (
    id,
    episode_id,
    version,
    status,
    protocol_slug,
    summary,
    monitoring_plan,
    escalation_rules,
    discharge_criteria,
    review_frequency_hours,
    next_review_at,
    created_by,
    approved_by,
    approved_at,
    created_at,
    updated_at
  ),
  medication_orders:had_medication_orders (
    id,
    episode_id,
    care_plan_id,
    line_number,
    medication_name,
    dose,
    route,
    frequency,
    administration_instructions,
    requires_nurse,
    supplier,
    status,
    start_at,
    end_at,
    next_due_at,
    last_administered_at,
    created_at,
    updated_at
  ),
  alerts:had_alerts (
    ${hadAlertsSummarySelect}
  ),
  tasks:had_tasks (
    ${hadEpisodeTasksSelect}
  ),
  logistics_items:had_logistics_items (
    ${hadLogisticsItemsSelect}
  ),
  visits:visits!visits_had_episode_id_fkey (
    id,
    nurse_id,
    scheduled_start,
    scheduled_end,
    status,
    completed_at
  )
`;

const hadDailyRoundSelect = `
  id,
  episode_id,
  round_at,
  recorded_by,
  risk_score,
  summary,
  overnight_events,
  recommendation,
  decision,
  decision_reason,
  next_round_at,
  created_at,
  updated_at,
  recorded_by_profile:profiles!had_rounds_recorded_by_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  )
`;

const hadMeasurementsSelect = `
  id,
  episode_id,
  visit_id,
  captured_by_profile_id,
  source,
  measurement_type,
  value_numeric,
  value_text,
  unit,
  threshold_state,
  recorded_at,
  notes,
  created_at,
  updated_at,
  captured_by:profiles!had_measurements_captured_by_profile_id_fkey (
    id,
    first_name,
    last_name,
    role,
    avatar_url,
    phone,
    inami_number
  )
`;

const hadPatientTasksSelect = `
  id,
  episode_id,
  linked_alert_id,
  owner_kind,
  owner_profile_id,
  owner_external_label,
  visibility,
  status,
  task_type,
  title,
  description,
  due_at,
  completed_at,
  completed_by_profile_id,
  created_by,
  created_at,
  updated_at,
  episode:had_episodes (
    id,
    reference,
    episode_type,
    status
  )
`;

function toDayBounds(date: Date) {
  const start = startOfDay(date);
  const end = addDays(start, 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function toFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function toTimestamp(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function sortByDateDesc<T>(rows: T[], getValue: (row: T) => string | null | undefined) {
  return [...rows].sort((left, right) => toTimestamp(getValue(right)) - toTimestamp(getValue(left)));
}
function sortByDateAsc<T>(rows: T[], getValue: (row: T) => string | null | undefined) {
  return [...rows].sort((left, right) => toTimestamp(getValue(left)) - toTimestamp(getValue(right)));
}

function sortByNumberAsc<T>(rows: T[], getValue: (row: T) => number) {
  return [...rows].sort((left, right) => getValue(left) - getValue(right));
}

function normalizeToArray<T>(value?: T | T[]) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function mapProfileSummary(profile: ProfileSummaryRow | null | undefined): HadPersonSummary | undefined {
  if (!profile) {
    return undefined;
  }

  return {
    id: profile.id,
    fullName: toFullName(profile.first_name, profile.last_name),
    role: profile.role,
    avatarUrl: profile.avatar_url ?? undefined,
    phone: profile.phone ?? undefined,
    inamiNumber: profile.inami_number ?? undefined,
  };
}

function mapPatientSummary(patient: PatientListSummaryRow | null | undefined): HadPatientSummary {
  return {
    id: patient?.id ?? '',
    profileId: patient?.profile_id ?? undefined,
    fullName: toFullName(patient?.first_name ?? '', patient?.last_name ?? ''),
    city: patient?.city ?? '',
    mutuality: patient?.mutuality ?? '',
    photoUrl: patient?.photo_url ?? undefined,
    nextVisitAt: patient?.next_visit_at ?? undefined,
  };
}

function mapPatientDetail(patient: PatientDetailRow | null | undefined): HadEpisodePatientDetail {
  return {
    ...mapPatientSummary(patient),
    phone: patient?.phone ?? '',
    email: patient?.email ?? undefined,
    address: {
      street: patient?.street ?? '',
      houseNumber: patient?.house_number ?? '',
      postalCode: patient?.postal_code ?? '',
      city: patient?.city ?? '',
      lat: patient?.lat ?? undefined,
      lng: patient?.lng ?? undefined,
    },
    prescribingDoctor: patient?.prescribing_doctor ?? '',
    doctorPhone: patient?.doctor_phone ?? undefined,
  };
}

export function mapHadEpisodeListItem(row: HadEpisodeListRow): HadEpisodeListItem {
  return {
    id: row.id,
    reference: row.reference,
    episodeType: row.episode_type,
    status: row.status,
    origin: row.origin,
    riskLevel: row.risk_level,
    diagnosisSummary: row.diagnosis_summary,
    admissionReason: row.admission_reason,
    startAt: row.start_at ?? undefined,
    targetEndAt: row.target_end_at ?? undefined,
    endAt: row.end_at ?? undefined,
    lastRoundAt: row.last_round_at ?? undefined,
    escalatedAt: row.escalated_at ?? undefined,
    hospital: {
      name: row.originating_hospital,
      service: row.originating_service ?? undefined,
      reference: row.hospital_reference ?? undefined,
    },
    patient: mapPatientSummary(row.patient),
    coordinator: mapProfileSummary(row.coordinator),
    primaryNurse: mapProfileSummary(row.primary_nurse),
  };
}

function mapHadEpisodeTeamMember(row: HadEpisodeTeamMemberSelectRow): HadEpisodeTeamMember {
  return {
    id: row.id,
    role: row.role,
    isPrimary: row.is_primary,
    receivesAlerts: row.receives_alerts,
    externalName: row.external_name ?? undefined,
    externalPhone: row.external_phone ?? undefined,
    externalEmail: row.external_email ?? undefined,
    profile: mapProfileSummary(row.profile),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHadEligibilityAssessment(row: Tables<'had_eligibility_assessments'>): HadEligibilityAssessment {
  return {
    id: row.id,
    assessedAt: row.assessed_at,
    assessedById: row.assessed_by ?? undefined,
    clinicalStability: row.clinical_stability,
    requires247Monitoring: row.requires_24_7_monitoring,
    needsImmediateTechnicalPlatform: row.needs_immediate_technical_platform,
    homeEnvironmentAdequate: row.home_environment_adequate,
    patientConsentObtained: row.patient_consent_obtained,
    gpInformed: row.gp_informed,
    caregiverAvailable: row.caregiver_available ?? undefined,
    logisticsReady: row.logistics_ready,
    caregiverBurdenRisk: row.caregiver_burden_risk,
    result: row.result,
    blockers: row.blockers,
    recommendations: row.recommendations,
    notes: row.notes ?? undefined,
  };
}

function mapHadCarePlan(row: Tables<'had_care_plans'>): HadCarePlan {
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    protocolSlug: row.protocol_slug,
    summary: row.summary,
    monitoringPlan: row.monitoring_plan,
    escalationRules: row.escalation_rules,
    dischargeCriteria: row.discharge_criteria,
    reviewFrequencyHours: row.review_frequency_hours,
    nextReviewAt: row.next_review_at ?? undefined,
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? undefined,
  };
}

function mapHadMedicationOrder(row: Tables<'had_medication_orders'>): HadMedicationOrder {
  return {
    id: row.id,
    carePlanId: row.care_plan_id ?? undefined,
    lineNumber: row.line_number,
    medicationName: row.medication_name,
    dose: row.dose,
    route: row.route,
    frequency: row.frequency,
    administrationInstructions: row.administration_instructions ?? undefined,
    requiresNurse: row.requires_nurse,
    supplier: row.supplier,
    status: row.status,
    startAt: row.start_at ?? undefined,
    endAt: row.end_at ?? undefined,
    nextDueAt: row.next_due_at ?? undefined,
    lastAdministeredAt: row.last_administered_at ?? undefined,
  };
}

function mapHadAlertSummary(row: HadAlertSummaryRow): HadAlertSummary {
  return {
    id: row.id,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description ?? undefined,
    measurementId: row.measurement_id ?? undefined,
    createdAt: row.created_at,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

function mapHadEpisodeTask(row: HadEpisodeTaskSelectRow): HadEpisodeTask {
  return {
    id: row.id,
    episodeId: row.episode_id,
    linkedAlertId: row.linked_alert_id ?? undefined,
    ownerKind: row.owner_kind,
    ownerProfileId: row.owner_profile_id ?? undefined,
    ownerExternalLabel: row.owner_external_label ?? undefined,
    visibility: row.visibility,
    status: row.status,
    taskType: row.task_type,
    title: row.title,
    description: row.description ?? undefined,
    dueAt: row.due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    completedByProfileId: row.completed_by_profile_id ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHadLogisticsItem(row: HadLogisticsItemSelectRow): HadLogisticsItem {
  return {
    id: row.id,
    episodeId: row.episode_id,
    itemType: row.item_type,
    label: row.label,
    quantity: row.quantity ?? undefined,
    unit: row.unit ?? undefined,
    supplier: row.supplier ?? undefined,
    coldChainRequired: row.cold_chain_required,
    status: row.status,
    scheduledFor: row.scheduled_for ?? undefined,
    completedAt: row.completed_at ?? undefined,
    trackingReference: row.tracking_reference ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function mapHadVisitSummary(row: VisitSummaryRow): HadVisitSummary {
  return {
    id: row.id,
    nurseId: row.nurse_id ?? undefined,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end ?? undefined,
    status: row.status,
    completedAt: row.completed_at ?? undefined,
  };
}

export function mapHadEpisodeDetail(row: HadEpisodeDetailRow): HadEpisodeDetail {
  const listItem = mapHadEpisodeListItem({
    id: row.id,
    reference: row.reference,
    episode_type: row.episode_type,
    status: row.status,
    origin: row.origin,
    risk_level: row.risk_level,
    hospital_reference: row.hospital_reference,
    originating_hospital: row.originating_hospital,
    originating_service: row.originating_service,
    diagnosis_summary: row.diagnosis_summary,
    admission_reason: row.admission_reason,
    start_at: row.start_at,
    target_end_at: row.target_end_at,
    end_at: row.end_at,
    last_round_at: row.last_round_at,
    escalated_at: row.escalated_at,
    patient: row.patient,
    coordinator: row.coordinator,
    primary_nurse: row.primary_nurse,
  });

  const eligibilityAssessments = sortByDateDesc(
    row.eligibility_assessments ?? [],
    (assessment) => assessment.assessed_at
  ).map(mapHadEligibilityAssessment);

  return {
    episode: {
      ...listItem,
      consentConfirmed: row.consent_confirmed,
      homeReady: row.home_ready,
      caregiverRequired: row.caregiver_required,
      caregiverAvailable: row.caregiver_available ?? undefined,
      inclusionNotes: row.inclusion_notes ?? undefined,
      exclusionNotes: row.exclusion_notes ?? undefined,
      escalationReason: row.escalation_reason ?? undefined,
      dischargeSummary: row.discharge_summary ?? undefined,
      specialist: mapProfileSummary(row.specialist),
      sourceVisitId: row.source_visit_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    patient: mapPatientDetail(row.patient),
    teamMembers: (row.team_members ?? []).map(mapHadEpisodeTeamMember),
    latestEligibilityAssessment: eligibilityAssessments[0],
    carePlans: sortByNumberAsc(row.care_plans ?? [], (carePlan) => carePlan.version).map(mapHadCarePlan),
    medicationOrders: sortByNumberAsc(
      row.medication_orders ?? [],
      (medicationOrder) => medicationOrder.line_number
    ).map(mapHadMedicationOrder),
    alerts: sortByDateDesc(row.alerts ?? [], (alert) => alert.created_at).map(mapHadAlertSummary),
    tasks: sortByDateAsc(row.tasks ?? [], (task) => task.due_at).map(mapHadEpisodeTask),
    logisticsItems: sortByDateAsc(
      row.logistics_items ?? [],
      (logisticsItem) => logisticsItem.scheduled_for
    ).map(mapHadLogisticsItem),
    visits: sortByDateDesc(row.visits ?? [], (visit) => visit.scheduled_start).map(mapHadVisitSummary),
  };
}

export function mapHadDailyRound(row: HadDailyRoundSelectRow): HadDailyRound {
  return {
    id: row.id,
    episodeId: row.episode_id,
    roundAt: row.round_at,
    recordedBy: mapProfileSummary(row.recorded_by_profile),
    riskScore: row.risk_score ?? undefined,
    summary: row.summary,
    overnightEvents: row.overnight_events ?? undefined,
    recommendation: row.recommendation ?? undefined,
    decision: row.decision,
    decisionReason: row.decision_reason ?? undefined,
    nextRoundAt: row.next_round_at ?? undefined,
  };
}

export function mapHadMeasurement(row: HadMeasurementSelectRow): HadMeasurement {
  return {
    id: row.id,
    episodeId: row.episode_id,
    visitId: row.visit_id ?? undefined,
    source: row.source,
    measurementType: row.measurement_type,
    valueNumeric: row.value_numeric ?? undefined,
    valueText: row.value_text ?? undefined,
    unit: row.unit,
    thresholdState: row.threshold_state,
    recordedAt: row.recorded_at,
    notes: row.notes ?? undefined,
    capturedBy: mapProfileSummary(row.captured_by),
  };
}

export function mapHadPatientTaskToday(row: HadPatientTaskSelectRow): HadPatientTaskToday {
  return {
    id: row.id,
    episodeId: row.episode_id,
    episodeReference: row.episode?.reference ?? undefined,
    episodeType: row.episode?.episode_type ?? undefined,
    episodeStatus: row.episode?.status ?? undefined,
    linkedAlertId: row.linked_alert_id ?? undefined,
    ownerKind: row.owner_kind,
    ownerProfileId: row.owner_profile_id ?? undefined,
    ownerExternalLabel: row.owner_external_label ?? undefined,
    visibility: row.visibility,
    status: row.status,
    taskType: row.task_type,
    title: row.title,
    description: row.description ?? undefined,
    dueAt: row.due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listHadEpisodes(filters: HadEpisodeListFilters = {}) {
  let query = supabase
    .from('had_episodes')
    .select(hadEpisodeListSelect)
    .order('created_at', { ascending: false });

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  if (filters.coordinatorProfileId) {
    query = query.eq('coordinator_profile_id', filters.coordinatorProfileId);
  }

  if (filters.primaryNurseProfileId) {
    query = query.eq('primary_nurse_profile_id', filters.primaryNurseProfileId);
  }

  if (filters.onlyOpen) {
    query = query.in('status', ['screening', 'eligible', 'planned', 'active', 'paused', 'escalated']);
  }

  const statuses = normalizeToArray(filters.status);
  if (statuses.length > 0) {
    query = query.in('status', statuses);
  }

  const episodeTypes = normalizeToArray(filters.episodeType);
  if (episodeTypes.length > 0) {
    query = query.in('episode_type', episodeTypes);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as HadEpisodeListRow[]).map(mapHadEpisodeListItem);
}

export async function getHadEpisodeDetail(episodeId: string) {
  const { data, error } = await supabase
    .from('had_episodes')
    .select(hadEpisodeDetailSelect)
    .eq('id', episodeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapHadEpisodeDetail(data as HadEpisodeDetailRow);
}

export async function getHadDailyRound(episodeId: string, date = new Date()) {
  const { startIso, endIso } = toDayBounds(date);
  const { data, error } = await supabase
    .from('had_rounds')
    .select(hadDailyRoundSelect)
    .eq('episode_id', episodeId)
    .gte('round_at', startIso)
    .lt('round_at', endIso)
    .order('round_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapHadDailyRound(data as HadDailyRoundSelectRow) : null;
}

export async function listHadTodayMeasurements(episodeId: string, date = new Date()) {
  const { startIso, endIso } = toDayBounds(date);
  const { data, error } = await supabase
    .from('had_measurements')
    .select(hadMeasurementsSelect)
    .eq('episode_id', episodeId)
    .gte('recorded_at', startIso)
    .lt('recorded_at', endIso)
    .order('recorded_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as HadMeasurementSelectRow[]).map(mapHadMeasurement);
}

export async function listHadPatientTasksToday(date = new Date()) {
  const { startIso, endIso } = toDayBounds(date);
  const { data, error } = await supabase
    .from('had_tasks')
    .select(hadPatientTasksSelect)
    .in('visibility', ['patient', 'both'])
    .in('status', ['todo', 'in_progress'])
    .gte('due_at', startIso)
    .lt('due_at', endIso)
    .order('due_at', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as HadPatientTaskSelectRow[]).map(mapHadPatientTaskToday);
}

export async function createHadEpisode(input: CreateHadEpisodeInput) {
  const payload: TablesInsert<'had_episodes'> = {
    patient_id: input.patientId,
    episode_type: input.episodeType,
    status: input.status ?? 'planned',
    origin: input.origin ?? 'step_down',
    risk_level: input.riskLevel ?? 'moderate',
    diagnosis_summary: input.diagnosisSummary,
    admission_reason: input.admissionReason,
    originating_hospital: input.originatingHospital,
    originating_service: input.originatingService ?? null,
    hospital_reference: input.hospitalReference ?? null,
    specialist_profile_id: input.specialistProfileId ?? null,
    coordinator_profile_id: input.coordinatorProfileId ?? null,
    primary_nurse_profile_id: input.primaryNurseProfileId ?? null,
    created_by: input.createdBy ?? null,
    source_visit_id: input.sourceVisitId ?? null,
    consent_confirmed: input.consentConfirmed ?? false,
    home_ready: input.homeReady ?? false,
    caregiver_required: input.caregiverRequired ?? false,
    caregiver_available: input.caregiverAvailable ?? null,
    start_at: input.startAt ?? null,
    target_end_at: input.targetEndAt ?? null,
    inclusion_notes: input.inclusionNotes ?? null,
    exclusion_notes: input.exclusionNotes ?? null,
  };

  const { data, error } = await supabase
    .from('had_episodes')
    .insert(payload)
    .select(hadEpisodeListSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadEpisodeListItem(data as HadEpisodeListRow);
}

export async function updateHadEpisode({ episodeId, patch }: UpdateHadEpisodeInput) {
  const { data, error } = await supabase
    .from('had_episodes')
    .update(patch)
    .eq('id', episodeId)
    .select(hadEpisodeDetailSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadEpisodeDetail(data as HadEpisodeDetailRow);
}

export async function createHadRound(input: CreateHadRoundInput) {
  const payload: TablesInsert<'had_rounds'> = {
    episode_id: input.episodeId,
    recorded_by: input.recordedBy ?? null,
    risk_score: input.riskScore ?? null,
    summary: input.summary,
    overnight_events: input.overnightEvents ?? null,
    recommendation: input.recommendation ?? null,
    decision: input.decision ?? 'continue_episode',
    decision_reason: input.decisionReason ?? null,
    next_round_at: input.nextRoundAt ?? null,
    round_at: input.roundAt ?? undefined,
  };

  const { data, error } = await supabase
    .from('had_rounds')
    .insert(payload)
    .select(hadDailyRoundSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadDailyRound(data as HadDailyRoundSelectRow);
}

export async function insertHadMeasurement(input: CreateHadMeasurementInput) {
  const payload: TablesInsert<'had_measurements'> = {
    episode_id: input.episodeId,
    measurement_type: input.measurementType,
    source: input.source ?? 'nurse',
    captured_by_profile_id: input.capturedByProfileId ?? null,
    visit_id: input.visitId ?? null,
    value_numeric: input.valueNumeric ?? null,
    value_text: input.valueText ?? null,
    unit: input.unit ?? '',
    threshold_state: input.thresholdState ?? 'ok',
    notes: input.notes ?? null,
    recorded_at: input.recordedAt ?? undefined,
  };

  const { data, error } = await supabase
    .from('had_measurements')
    .insert(payload)
    .select(hadMeasurementsSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadMeasurement(data as HadMeasurementSelectRow);
}
export async function createHadTask(input: CreateHadTaskInput) {
  const payload: TablesInsert<'had_tasks'> = {
    episode_id: input.episodeId,
    linked_alert_id: input.linkedAlertId ?? null,
    owner_kind: input.ownerKind,
    owner_profile_id: input.ownerProfileId ?? null,
    owner_external_label: input.ownerExternalLabel ?? null,
    visibility: input.visibility ?? 'staff',
    status: input.status ?? 'todo',
    task_type: input.taskType,
    title: input.title,
    description: input.description ?? null,
    due_at: input.dueAt ?? null,
    created_by: input.createdBy ?? null,
  };

  const { data, error } = await supabase
    .from('had_tasks')
    .insert(payload)
    .select(hadEpisodeTasksSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadEpisodeTask(data as HadEpisodeTaskSelectRow);
}

export async function completeHadTask(input: CompleteHadTaskInput) {
  const payload: TablesUpdate<'had_tasks'> = {
    status: input.status ?? 'done',
    completed_at: input.completedAt ?? new Date().toISOString(),
    completed_by_profile_id: input.completedByProfileId ?? null,
  };

  const { data, error } = await supabase
    .from('had_tasks')
    .update(payload)
    .eq('id', input.taskId)
    .select(hadPatientTasksSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadPatientTaskToday(data as HadPatientTaskSelectRow);
}

export async function updateHadAlertStatus(input: UpdateHadAlertStatusInput) {
  const now = new Date().toISOString();
  const payload: TablesUpdate<'had_alerts'> = {
    status: input.status,
    assigned_to_profile_id: input.assignedToProfileId ?? null,
  };

  if (input.status === 'acknowledged') {
    payload.acknowledged_at = now;
    payload.acknowledged_by = input.actedByProfileId ?? null;
    payload.resolved_at = null;
    payload.resolution_note = null;
  }

  if (input.status === 'resolved' || input.status === 'dismissed') {
    payload.resolved_at = now;
    payload.resolution_note = input.resolutionNote ?? null;
  }

  const { data, error } = await supabase
    .from('had_alerts')
    .update(payload)
    .eq('id', input.alertId)
    .select(hadAlertsSummarySelect)
    .single();

  if (error) {
    throw error;
  }

  return mapHadAlertSummary(data as HadAlertSummaryRow);
}
