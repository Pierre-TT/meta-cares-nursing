import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Brain, Calendar, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Edit, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader } from '@/design-system';
import { BelRAILiveCard } from '@/components/nurse/BelRAILiveCard';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import { useHadEpisodeDetail, useHadPatientEpisodes } from '@/hooks/useHadData';
import { useNurseVisitHistory, useNurseWoundAssessments } from '@/hooks/useNurseClinicalData';
import { useNursePatient } from '@/hooks/useNursePatients';
import type { BelraiCarePlanSuggestion, BelraiTone, BelraiTwinSnapshot } from '@/lib/belrai';
import type { HadCarePlan, HadEpisodeDetail, HadMedicationOrder } from '@/lib/had';
import type { NurseVisitSummary, NurseWoundAssessment } from '@/lib/nurseClinical';

type DiagnosisStatus = 'active' | 'resolved' | 'monitoring';
type DiagnosisActionKind = 'belrai' | 'had' | 'visit' | 'wound';
type DiagnosisSourceVariant = 'green' | 'blue' | 'amber' | 'red' | 'outline';
type VisitActCategory = NurseVisitSummary['acts'][number]['category'];

interface NursingIntervention {
  id: string;
  label: string;
  frequency: string;
  completed: boolean;
}

interface NursingOutcome {
  id: string;
  label: string;
  target: string;
  current: string;
  trend: 'improving' | 'stable' | 'worsening';
}

interface NursingDiagnosis {
  id: string;
  code: string;
  label: string;
  domain: string;
  status: DiagnosisStatus;
  startDate?: string;
  reviewDate?: string;
  interventions: NursingIntervention[];
  outcomes: NursingOutcome[];
  relatedBelRAI?: string;
  sourceLabel?: string;
  sourceVariant?: DiagnosisSourceVariant;
  actionKind?: DiagnosisActionKind;
}

interface CarePlanVisitAct {
  id: string;
  label: string;
  category: VisitActCategory;
  date: string;
  completed: boolean;
}

type CarePlanSnapshot = Pick<BelraiTwinSnapshot, 'carePlanSuggestions' | 'draft' | 'dueDate' | 'katz' | 'statusLabel'>;

const exudateLabels: Record<string, string> = {
  none: 'Aucun',
  mild: 'Faible',
  moderate: 'Modéré',
  heavy: 'Abondant',
};

const trendIcons = {
  improving: { label: '↗ Amélioration', color: 'text-mc-green-500' },
  stable: { label: '→ Stable', color: 'text-mc-amber-500' },
  worsening: { label: '↘ Détérioration', color: 'text-mc-red-500' },
};

const statusConfig = {
  active: { label: 'Actif', variant: 'green' as const },
  resolved: { label: 'Résolu', variant: 'default' as const },
  monitoring: { label: 'Surveillance', variant: 'amber' as const },
};

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('fr-BE');
}

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatusLabel(value?: string) {
  if (!value) {
    return '—';
  }

  return value.replace(/_/g, ' ');
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getVisitReferenceDate(visit: NurseVisitSummary) {
  return visit.completedAt ?? visit.scheduledEnd ?? visit.scheduledStart;
}

function getEarliestDate(values: Array<string | undefined>) {
  const validDates = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({
      value,
      timestamp: new Date(value).getTime(),
    }))
    .filter((item) => !Number.isNaN(item.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  return validDates[0]?.value;
}

function compareMaybeDate(left?: string, right?: string) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return new Date(left).getTime() - new Date(right).getTime();
}

function collectVisitActs(
  visitHistory: NurseVisitSummary[],
  category?: VisitActCategory,
): CarePlanVisitAct[] {
  return visitHistory.flatMap((visit) =>
    visit.acts
      .filter((act) => !category || act.category === category)
      .map((act, index) => ({
        id: `${visit.id}-${act.category}-${index}`,
        label: act.label,
        category: act.category,
        date: getVisitReferenceDate(visit),
        completed: visit.status === 'completed',
      })),
  );
}

function matchesWoundSuggestion(suggestion: BelraiCarePlanSuggestion) {
  return /intégrité cutanée|peau|plaie/i.test(`${suggestion.title} ${suggestion.linkedCap}`);
}

function matchesMedicationSuggestion(suggestion: BelraiCarePlanSuggestion) {
  return /médic|thérapeut|gestion/i.test(`${suggestion.title} ${suggestion.linkedCap}`);
}

function matchesHygieneSuggestion(suggestion: BelraiCarePlanSuggestion) {
  return /toilette|se laver|hygi/i.test(`${suggestion.title} ${suggestion.linkedCap}`);
}

function inferDiagnosisDomain(suggestion: BelraiCarePlanSuggestion) {
  const text = `${suggestion.title} ${suggestion.linkedCap}`.toLowerCase();

  if (text.match(/cutan|peau|plaie/)) {
    return 'Sécurité/Protection';
  }

  if (text.match(/médic|thérapeut|gestion/)) {
    return 'Gestion thérapeutique';
  }

  if (text.match(/toilette|hygiène|se laver/)) {
    return 'Activité/Repos';
  }

  if (text.match(/mobilit|transfert|chute/)) {
    return 'Sécurité/Mobilité';
  }

  if (text.match(/cognition|décision|confusion/)) {
    return 'Perception/Cognition';
  }

  if (text.match(/humeur|isolement/)) {
    return 'Coping/Soutien';
  }

  return 'Coordination clinique';
}

function mapBelraiToneToDiagnosisStatus(tone: BelraiTone): DiagnosisStatus {
  switch (tone) {
    case 'red':
    case 'amber':
      return 'active';
    case 'green':
    case 'blue':
    default:
      return 'monitoring';
  }
}

function mapBelraiToneToOutcomeTrend(tone: BelraiTone): NursingOutcome['trend'] {
  switch (tone) {
    case 'green':
      return 'improving';
    case 'red':
      return 'worsening';
    case 'amber':
    case 'blue':
    default:
      return 'stable';
  }
}

function mapCarePlanStatusToDiagnosisStatus(status?: string): DiagnosisStatus {
  switch (status) {
    case 'active':
    case 'approved':
      return 'active';
    case 'archived':
    case 'cancelled':
      return 'resolved';
    default:
      return 'monitoring';
  }
}

function isMedicationOrderCompleted(status?: string) {
  return status === 'administered';
}

function isTaskCompleted(status?: string) {
  return status === 'done' || status === 'completed';
}

function formatWoundDimensions(assessment?: NurseWoundAssessment | null) {
  if (
    assessment?.lengthCm === undefined
    && assessment?.widthCm === undefined
    && assessment?.depthCm === undefined
  ) {
    return '—';
  }

  const dimensions = [
    assessment?.lengthCm,
    assessment?.widthCm,
    assessment?.depthCm,
  ].map((value) => (typeof value === 'number' ? value.toFixed(1) : '—'));

  return `${dimensions[0]} × ${dimensions[1]} × ${dimensions[2]} cm`;
}

function getWoundArea(assessment?: NurseWoundAssessment | null) {
  if (assessment?.lengthCm === undefined || assessment.widthCm === undefined) {
    return null;
  }

  return assessment.lengthCm * assessment.widthCm;
}

function getWoundTrend(
  latestAssessment?: NurseWoundAssessment | null,
  previousAssessment?: NurseWoundAssessment | null,
) {
  if (!latestAssessment || !previousAssessment) {
    return {
      label: 'Premier relevé',
      trend: 'stable' as const,
    };
  }

  const latestArea = getWoundArea(latestAssessment);
  const previousArea = getWoundArea(previousAssessment);

  if (latestArea === null || previousArea === null || previousArea <= 0) {
    return {
      label: 'Dimensions partielles',
      trend: 'stable' as const,
    };
  }

  const variation = (latestArea - previousArea) / previousArea;

  if (variation <= -0.05) {
    return {
      label: 'En amélioration',
      trend: 'improving' as const,
    };
  }

  if (variation >= 0.05) {
    return {
      label: 'À surveiller',
      trend: 'worsening' as const,
    };
  }

  return {
    label: 'Stable',
    trend: 'stable' as const,
  };
}

function buildHadDiagnosis(
  carePlan: HadCarePlan,
  hadEpisodeDetail?: HadEpisodeDetail | null,
): NursingDiagnosis {
  const openTasks = (hadEpisodeDetail?.tasks ?? []).filter((task) => !isTaskCompleted(task.status));
  const dischargeCriteria = toStringArray(carePlan.dischargeCriteria);
  const monitoringPlan = isRecord(carePlan.monitoringPlan) ? carePlan.monitoringPlan : null;
  const interventions: NursingIntervention[] = [];

  for (const [index, item] of toStringArray(monitoringPlan?.patient).entries()) {
    interventions.push({
      id: `${carePlan.id}-patient-${index}`,
      label: item,
      frequency: 'Auto-suivi patient',
      completed: false,
    });
  }

  for (const [index, item] of toStringArray(monitoringPlan?.nurse).entries()) {
    interventions.push({
      id: `${carePlan.id}-nurse-${index}`,
      label: item,
      frequency: 'Passage infirmier',
      completed: false,
    });
  }

  if (typeof monitoringPlan?.round === 'string') {
    interventions.push({
      id: `${carePlan.id}-round`,
      label: `Ronde clinique ${monitoringPlan.round}`,
      frequency: `Toutes les ${carePlan.reviewFrequencyHours} h`,
      completed: false,
    });
  }

  for (const task of openTasks.slice(0, 2)) {
    interventions.push({
      id: task.id,
      label: task.title,
      frequency: task.dueAt ? `Échéance ${formatDateTime(task.dueAt)}` : 'À planifier',
      completed: isTaskCompleted(task.status),
    });
  }

  if (interventions.length === 0) {
    interventions.push({
      id: `${carePlan.id}-summary`,
      label: carePlan.summary,
      frequency: `Revue toutes les ${carePlan.reviewFrequencyHours} h`,
      completed: carePlan.status === 'approved',
    });
  }

  return {
    id: `had-${carePlan.id}`,
    code: `HAD-${carePlan.version}`,
    label: carePlan.summary,
    domain: 'Coordination HAD',
    status: mapCarePlanStatusToDiagnosisStatus(carePlan.status),
    startDate: carePlan.approvedAt ?? carePlan.createdAt,
    reviewDate: carePlan.nextReviewAt,
    sourceLabel: 'HAD',
    sourceVariant: 'green',
    actionKind: 'had',
    interventions: interventions.slice(0, 4),
    outcomes: [
      {
        id: `${carePlan.id}-status`,
        label: 'Plan HAD',
        target: 'Suivi structuré actif',
        current: formatStatusLabel(carePlan.status),
        trend: carePlan.status === 'active' || carePlan.status === 'approved' ? 'stable' : 'worsening',
      },
      {
        id: `${carePlan.id}-review`,
        label: 'Prochaine revue',
        target: `Réévaluation toutes les ${carePlan.reviewFrequencyHours} h`,
        current: carePlan.nextReviewAt ? formatDateTime(carePlan.nextReviewAt) : 'À planifier',
        trend: 'stable',
      },
      {
        id: `${carePlan.id}-discharge`,
        label: 'Critères de sortie',
        target: 'Atteindre les critères de fin de parcours',
        current: dischargeCriteria[0] ?? `${openTasks.length} tâche(s) ouverte(s)`,
        trend: openTasks.length > 2 ? 'worsening' : 'stable',
      },
    ],
  };
}

function buildWoundDiagnosis({
  suggestion,
  woundHistory,
  visitHistory,
  reviewDate,
}: {
  suggestion?: BelraiCarePlanSuggestion;
  woundHistory: NurseWoundAssessment[];
  visitHistory: NurseVisitSummary[];
  reviewDate?: string;
}): NursingDiagnosis | null {
  const latestAssessment = woundHistory[0];
  if (!latestAssessment) {
    return null;
  }

  const previousAssessment = woundHistory[1];
  const woundTrend = getWoundTrend(latestAssessment, previousAssessment);
  const oldestAssessment = woundHistory[woundHistory.length - 1];
  const woundActs = collectVisitActs(visitHistory, 'wound');
  const interventions: NursingIntervention[] = [];

  for (const act of woundActs.slice(0, 2)) {
    interventions.push({
      id: act.id,
      label: act.label,
      frequency: formatDate(act.date),
      completed: act.completed,
    });
  }

  for (const [index, intervention] of (suggestion?.interventions ?? []).entries()) {
    interventions.push({
      id: `${latestAssessment.id}-suggestion-${index}`,
      label: intervention,
      frequency: 'Selon protocole de plaie',
      completed: false,
    });
  }

  interventions.push({
    id: `${latestAssessment.id}-tracking`,
    label: `Surveillance ${formatWoundDimensions(latestAssessment)}`,
    frequency: formatDateTime(latestAssessment.recordedAt),
    completed: true,
  });

  return {
    id: `wound-${latestAssessment.id}`,
    code: suggestion?.diagnosisCode ?? '00046',
    label: suggestion?.title ?? 'Atteinte à l’intégrité cutanée',
    domain: 'Sécurité/Protection',
    status: 'active',
    startDate: oldestAssessment?.recordedAt ?? latestAssessment.recordedAt,
    reviewDate: reviewDate ?? latestAssessment.recordedAt,
    relatedBelRAI: suggestion?.linkedCap,
    sourceLabel: 'Plaie',
    sourceVariant: 'red',
    actionKind: 'wound',
    interventions,
    outcomes: [
      {
        id: `${latestAssessment.id}-dimensions`,
        label: 'Dimensions de plaie',
        target: 'Réduction progressive',
        current: formatWoundDimensions(latestAssessment),
        trend: woundTrend.trend,
      },
      {
        id: `${latestAssessment.id}-pain`,
        label: 'Douleur EVA',
        target: '≤ 3/10',
        current: latestAssessment.pain !== undefined ? `${latestAssessment.pain}/10` : 'Non documentée',
        trend:
          latestAssessment.pain === undefined
            ? 'stable'
            : latestAssessment.pain <= 3
              ? 'improving'
              : latestAssessment.pain >= 6
                ? 'worsening'
                : 'stable',
      },
      {
        id: `${latestAssessment.id}-exudate`,
        label: 'Exsudat',
        target: 'Faible ou contrôlé',
        current: exudateLabels[latestAssessment.exudateLevel] ?? latestAssessment.exudateLevel,
        trend:
          latestAssessment.exudateLevel === 'heavy'
            ? 'worsening'
            : latestAssessment.exudateLevel === 'none' || latestAssessment.exudateLevel === 'mild'
              ? 'improving'
              : 'stable',
      },
    ],
  };
}

function buildMedicationDiagnosis({
  suggestion,
  medicationOrders,
  visitHistory,
  reviewDate,
}: {
  suggestion?: BelraiCarePlanSuggestion;
  medicationOrders: HadMedicationOrder[];
  visitHistory: NurseVisitSummary[];
  reviewDate?: string;
}): NursingDiagnosis | null {
  const medicationActs = collectVisitActs(visitHistory, 'medication');
  if (medicationOrders.length === 0 && medicationActs.length === 0 && !suggestion) {
    return null;
  }

  const activeMedicationCount = medicationOrders.filter(
    (order) => !['cancelled', 'stopped'].includes(order.status),
  ).length;
  const earliestDueAt = getEarliestDate(medicationOrders.map((order) => order.nextDueAt));
  const interventions: NursingIntervention[] = [];

  for (const order of medicationOrders.slice(0, 3)) {
    interventions.push({
      id: order.id,
      label: `${order.medicationName} ${order.dose}`,
      frequency: [
        order.route,
        order.frequency,
        order.nextDueAt ? `prochaine ${formatDateTime(order.nextDueAt)}` : null,
      ].filter(Boolean).join(' • '),
      completed: isMedicationOrderCompleted(order.status),
    });
  }

  for (const act of medicationActs.slice(0, 2)) {
    interventions.push({
      id: act.id,
      label: act.label,
      frequency: formatDate(act.date),
      completed: act.completed,
    });
  }

  for (const [index, intervention] of (suggestion?.interventions ?? []).entries()) {
    interventions.push({
      id: `medication-suggestion-${index}`,
      label: intervention,
      frequency: 'Selon protocole thérapeutique',
      completed: false,
    });
  }

  const sourceLabel =
    medicationOrders.length > 0 && medicationActs.length > 0
      ? 'HAD + visites'
      : medicationOrders.length > 0
        ? 'HAD'
        : 'Visites';

  return {
    id: `medication-${medicationOrders[0]?.id ?? suggestion?.id ?? 'visits'}`,
    code: suggestion?.diagnosisCode ?? 'À confirmer',
    label: suggestion?.title ?? 'Sécurisation thérapeutique à domicile',
    domain: 'Gestion thérapeutique',
    status: activeMedicationCount > 0 ? 'active' : 'monitoring',
    startDate: medicationOrders[0]?.startAt,
    reviewDate: earliestDueAt ?? reviewDate,
    relatedBelRAI: suggestion?.linkedCap,
    sourceLabel,
    sourceVariant: medicationOrders.length > 0 ? 'green' : 'blue',
    actionKind: medicationOrders.length > 0 ? 'had' : 'visit',
    interventions,
    outcomes: [
      {
        id: 'medication-active',
        label: 'Traitements actifs',
        target: 'Schéma thérapeutique validé',
        current: `${activeMedicationCount} ligne(s) active(s)`,
        trend: activeMedicationCount > 0 ? 'stable' : 'worsening',
      },
      {
        id: 'medication-next',
        label: 'Prochaine administration',
        target: 'Respect des échéances',
        current: earliestDueAt ? formatDateTime(earliestDueAt) : 'À planifier',
        trend: 'stable',
      },
      {
        id: 'medication-trace',
        label: 'Traçabilité des passages',
        target: 'Aucune omission critique',
        current: medicationActs.length > 0 ? `${medicationActs.length} acte(s) récent(s)` : 'Aucun acte récent',
        trend: medicationActs.length > 0 ? 'improving' : 'stable',
      },
    ],
  };
}

function buildHygieneDiagnosis({
  suggestion,
  visitHistory,
  katzCategory,
  reviewDate,
  startDate,
}: {
  suggestion?: BelraiCarePlanSuggestion;
  visitHistory: NurseVisitSummary[];
  katzCategory?: string;
  reviewDate?: string;
  startDate?: string;
}): NursingDiagnosis | null {
  const hygieneActs = collectVisitActs(visitHistory, 'toilette');
  if (hygieneActs.length === 0 && !suggestion) {
    return null;
  }

  const interventions: NursingIntervention[] = [];

  for (const act of hygieneActs.slice(0, 2)) {
    interventions.push({
      id: act.id,
      label: act.label,
      frequency: formatDate(act.date),
      completed: act.completed,
    });
  }

  for (const [index, intervention] of (suggestion?.interventions ?? []).entries()) {
    interventions.push({
      id: `hygiene-suggestion-${index}`,
      label: intervention,
      frequency: 'Routine quotidienne',
      completed: false,
    });
  }

  return {
    id: suggestion?.id ?? 'hygiene-visits',
    code: suggestion?.diagnosisCode ?? '00108',
    label: suggestion?.title ?? 'Déficit de soins personnels : se laver',
    domain: 'Activité/Repos',
    status: hygieneActs.length > 0 ? 'active' : mapBelraiToneToDiagnosisStatus(suggestion?.tone ?? 'blue'),
    startDate: startDate ?? hygieneActs[hygieneActs.length - 1]?.date,
    reviewDate,
    relatedBelRAI: suggestion?.linkedCap,
    sourceLabel: suggestion ? (hygieneActs.length > 0 ? 'BelRAI + visites' : 'BelRAI') : 'Visites',
    sourceVariant: suggestion ? 'blue' : 'outline',
    actionKind: suggestion ? 'belrai' : 'visit',
    interventions,
    outcomes: [
      {
        id: 'hygiene-katz',
        label: 'Autonomie résiduelle',
        target: 'Maintien maximal',
        current: katzCategory ? `Katz ${katzCategory}` : 'À évaluer',
        trend: 'stable',
      },
      {
        id: 'hygiene-routine',
        label: 'Aides structurées',
        target: 'Routine quotidienne sécurisée',
        current: hygieneActs.length > 0 ? `${hygieneActs.length} acte(s) récent(s)` : 'À structurer',
        trend: hygieneActs.length > 0 ? 'improving' : 'stable',
      },
    ],
  };
}

function buildGenericBelraiDiagnosis({
  suggestion,
  belrai,
  reviewDate,
}: {
  suggestion: BelraiCarePlanSuggestion;
  belrai?: CarePlanSnapshot | null;
  reviewDate?: string;
}): NursingDiagnosis {
  return {
    id: suggestion.id,
    code: suggestion.diagnosisCode,
    label: suggestion.title,
    domain: inferDiagnosisDomain(suggestion),
    status: mapBelraiToneToDiagnosisStatus(suggestion.tone),
    startDate: belrai?.draft.updatedAt,
    reviewDate,
    relatedBelRAI: suggestion.linkedCap,
    sourceLabel: 'BelRAI',
    sourceVariant: 'blue',
    actionKind: 'belrai',
    interventions: suggestion.interventions.map((intervention, index) => ({
      id: `${suggestion.id}-intervention-${index}`,
      label: intervention,
      frequency: 'À consolider avec l’équipe',
      completed: false,
    })),
    outcomes: suggestion.outcomes.map((outcome, index) => ({
      id: `${suggestion.id}-outcome-${index}`,
      label: outcome,
      target: 'À confirmer avec l’équipe',
      current: belrai?.statusLabel ?? 'À initier',
      trend: mapBelraiToneToOutcomeTrend(suggestion.tone),
    })),
  };
}

function buildCarePlanDiagnoses({
  belrai,
  activeHadCarePlan,
  hadEpisodeDetail,
  visitHistory,
  woundHistory,
  patientKatzCategory,
}: {
  belrai?: CarePlanSnapshot | null;
  activeHadCarePlan?: HadCarePlan;
  hadEpisodeDetail?: HadEpisodeDetail | null;
  visitHistory: NurseVisitSummary[];
  woundHistory: NurseWoundAssessment[];
  patientKatzCategory?: string;
}) {
  const diagnoses: NursingDiagnosis[] = [];
  const coveredSuggestionIds = new Set<string>();
  const suggestions = belrai?.carePlanSuggestions ?? [];
  const woundSuggestion = suggestions.find(matchesWoundSuggestion);
  const medicationSuggestion = suggestions.find(matchesMedicationSuggestion);
  const hygieneSuggestion = suggestions.find(matchesHygieneSuggestion);
  const medicationOrders = hadEpisodeDetail?.medicationOrders ?? [];
  const reviewDate =
    activeHadCarePlan?.nextReviewAt
    ?? getEarliestDate(medicationOrders.map((order) => order.nextDueAt))
    ?? visitHistory[0]?.scheduledStart
    ?? woundHistory[0]?.recordedAt
    ?? belrai?.draft.updatedAt;

  if (activeHadCarePlan) {
    diagnoses.push(buildHadDiagnosis(activeHadCarePlan, hadEpisodeDetail));
  }

  const woundDiagnosis = buildWoundDiagnosis({
    suggestion: woundSuggestion,
    woundHistory,
    visitHistory,
    reviewDate,
  });
  if (woundDiagnosis) {
    diagnoses.push(woundDiagnosis);
    if (woundSuggestion) {
      coveredSuggestionIds.add(woundSuggestion.id);
    }
  }

  const medicationDiagnosis = buildMedicationDiagnosis({
    suggestion: medicationSuggestion,
    medicationOrders,
    visitHistory,
    reviewDate,
  });
  if (medicationDiagnosis) {
    diagnoses.push(medicationDiagnosis);
    if (medicationSuggestion) {
      coveredSuggestionIds.add(medicationSuggestion.id);
    }
  }

  const hygieneDiagnosis = buildHygieneDiagnosis({
    suggestion: hygieneSuggestion,
    visitHistory,
    katzCategory: belrai?.katz.category ?? patientKatzCategory,
    reviewDate,
    startDate: belrai?.draft.updatedAt,
  });
  if (hygieneDiagnosis) {
    diagnoses.push(hygieneDiagnosis);
    if (hygieneSuggestion) {
      coveredSuggestionIds.add(hygieneSuggestion.id);
    }
  }

  for (const suggestion of suggestions) {
    if (coveredSuggestionIds.has(suggestion.id)) {
      continue;
    }

    diagnoses.push(buildGenericBelraiDiagnosis({
      suggestion,
      belrai,
      reviewDate,
    }));
  }

  const diagnosisOrder: Record<DiagnosisStatus, number> = {
    active: 0,
    monitoring: 1,
    resolved: 2,
  };

  return dedupeByKey(
    diagnoses.map((diagnosis) => ({
      ...diagnosis,
      interventions: dedupeByKey(diagnosis.interventions, (intervention) => intervention.label.toLowerCase()).slice(0, 4),
      outcomes: dedupeByKey(diagnosis.outcomes, (outcome) => outcome.label.toLowerCase()).slice(0, 3),
    })),
    (diagnosis) => diagnosis.label.toLowerCase(),
  ).sort((left, right) =>
    diagnosisOrder[left.status] - diagnosisOrder[right.status]
    || compareMaybeDate(left.reviewDate, right.reviewDate)
    || compareMaybeDate(left.startDate, right.startDate),
  );
}

export function CarePlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routePatientId = searchParams.get('patientId') ?? 'p1';
  const { data: patient, isLoading, error, refetch } = useNursePatient(routePatientId);
  const {
    data: belrai,
    isLoading: isBelraiLoading,
    error: belraiError,
    refetch: refetchBelrai,
  } = useBelraiTwin(patient?.id ?? routePatientId);
  const {
    data: hadEpisodes = [],
    isLoading: isHadEpisodesLoading,
    error: hadEpisodesError,
    refetch: refetchHadEpisodes,
  } = useHadPatientEpisodes(patient?.databaseId, true);
  const activeHadEpisode = hadEpisodes[0];
  const {
    data: hadEpisodeDetail,
    isLoading: isHadDetailLoading,
    error: hadDetailError,
    refetch: refetchHadDetail,
  } = useHadEpisodeDetail(activeHadEpisode?.id);
  const {
    data: visitHistory = [],
    isLoading: isVisitHistoryLoading,
    error: visitHistoryError,
    refetch: refetchVisitHistory,
  } = useNurseVisitHistory(patient?.databaseId, 8);
  const {
    data: woundHistory = [],
    isLoading: isWoundHistoryLoading,
    error: woundHistoryError,
    refetch: refetchWoundHistory,
  } = useNurseWoundAssessments(patient?.databaseId);
  const [expandedDiag, setExpandedDiag] = useState<string | null>(null);

  if (error) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Plan de soins indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Le patient lié à ce plan de soins n’a pas pu être chargé.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
            Retour aux patients
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement du plan de soins…</p>
      </AnimatedPage>
    );
  }

  if (!patient) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Patient introuvable</h2>
        <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
          Retour aux patients
        </Button>
      </AnimatedPage>
    );
  }

  const activeHadCarePlan =
    hadEpisodeDetail?.carePlans.find((carePlan) => carePlan.status === 'active')
    ?? (hadEpisodeDetail && hadEpisodeDetail.carePlans.length > 0
      ? hadEpisodeDetail.carePlans[hadEpisodeDetail.carePlans.length - 1]
      : undefined);
  const carePlanDiagnoses = buildCarePlanDiagnoses({
    belrai: belrai ?? null,
    activeHadCarePlan,
    hadEpisodeDetail,
    visitHistory,
    woundHistory,
    patientKatzCategory: patient.katzCategory,
  });
  const activeDiag = carePlanDiagnoses.filter((diagnosis) => diagnosis.status === 'active').length;
  const totalInterventions = carePlanDiagnoses.reduce((sum, diagnosis) => sum + diagnosis.interventions.length, 0);
  const completedInterventions = carePlanDiagnoses.reduce(
    (sum, diagnosis) => sum + diagnosis.interventions.filter((intervention) => intervention.completed).length,
    0,
  );
  const nextReviewAt = getEarliestDate(carePlanDiagnoses.map((diagnosis) => diagnosis.reviewDate));
  const hasClinicalContextError = Boolean(
    belraiError
    || hadEpisodesError
    || hadDetailError
    || visitHistoryError
    || woundHistoryError,
  );
  const isClinicalContextLoading = Boolean(
    isBelraiLoading
    || isHadEpisodesLoading
    || (activeHadEpisode?.id && isHadDetailLoading)
    || isVisitHistoryLoading
    || isWoundHistoryLoading,
  );
  const headerReviewLabel = nextReviewAt ? formatDate(nextReviewAt) : belrai?.dueDate ?? 'À planifier';

  const handleRefreshClinicalContext = () => {
    void refetchBelrai();
    void refetchHadEpisodes();
    void refetchHadDetail();
    void refetchVisitHistory();
    void refetchWoundHistory();
  };

  const handleDiagnosisAction = (actionKind?: DiagnosisActionKind) => {
    if (!actionKind) {
      return;
    }

    if (actionKind === 'had' && activeHadEpisode?.id) {
      navigate(`/nurse/had/${activeHadEpisode.id}`);
      return;
    }

    if (actionKind === 'wound') {
      navigate(`/nurse/wounds/${patient.id}`);
      return;
    }

    if (actionKind === 'visit') {
      navigate(`/nurse/visit/${patient.id}`);
      return;
    }

    navigate(`/nurse/belrai/${patient.id}`);
  };

  const getDiagnosisActionLabel = (actionKind?: DiagnosisActionKind) => {
    switch (actionKind) {
      case 'had':
        return 'Ouvrir HAD';
      case 'wound':
        return 'Ouvrir plaie';
      case 'visit':
        return 'Ouvrir visite';
      case 'belrai':
      default:
        return 'Revoir BelRAI';
    }
  };

  const primaryAction = activeHadEpisode?.id
    ? {
      label: 'Ouvrir l’épisode HAD',
      icon: Brain,
      onClick: () => navigate(`/nurse/had/${activeHadEpisode.id}`),
    }
    : {
      label: 'Consolider avec BelRAI',
      icon: Sparkles,
      onClick: () => navigate(`/nurse/belrai/${patient.id}`),
    };
  const PrimaryActionIcon = primaryAction.icon;

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title="Plan de Soins Infirmiers"
        subtitle={`NANDA-I / NIC / NOC · ${patient.firstName} ${patient.lastName}`}
        badge={<Badge variant="blue">{carePlanDiagnoses.length} diagnostic(s)</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{activeDiag}</p>
            <p className="text-[10px] text-white/60">Diagnostics</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{completedInterventions}/{totalInterventions}</p>
            <p className="text-[10px] text-white/60">Interventions</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{headerReviewLabel}</p>
            <p className="text-[10px] text-white/60">Prochaine revue</p>
          </div>
        </div>
      </GradientHeader>

      <Button variant="outline" className="w-full gap-2" onClick={primaryAction.onClick}>
        <PrimaryActionIcon className="h-4 w-4" />
        {primaryAction.label}
      </Button>
      <BelRAILiveCard patient={patient} />

      {hasClinicalContextError && (
        <Card className="border-l-4 border-l-mc-amber-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Consolidation partielle du plan</p>
              <p className="text-xs text-[var(--text-muted)]">
                Une ou plusieurs sources cliniques n’ont pas répondu. Le plan affiché peut être incomplet.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshClinicalContext}>
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      <Card className="border-l-4 border-l-mc-blue-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-mc-blue-500" />
            <CardTitle>Propositions issues du BelRAI Twin</CardTitle>
          </div>
          <Badge variant="blue">{belrai?.carePlanSuggestions.length ?? 0} suggestion(s)</Badge>
        </CardHeader>

        {belrai?.carePlanSuggestions.length ? (
          <div className="space-y-3">
            {belrai.carePlanSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{suggestion.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{suggestion.detail}</p>
                  </div>
                  <Badge variant={suggestion.tone}>{suggestion.linkedCap}</Badge>
                </div>

                <div className="mt-3 space-y-2 text-xs text-[var(--text-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Interventions proposées</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      {suggestion.interventions.map((intervention) => (
                        <li key={intervention}>{intervention}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Outcomes</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      {suggestion.outcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isBelraiLoading ? (
          <p className="text-sm text-[var(--text-muted)]">
            Consolidation du BelRAI Twin en cours…
          </p>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Aucune proposition n’est encore activée. Complétez ou confirmez le BelRAI Twin pour obtenir des actions de plan de soins.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => navigate(`/nurse/belrai/${patient.id}`)}
          >
            <Sparkles className="h-4 w-4" /> Revoir BelRAI
          </Button>
          <Button
            variant="gradient"
            size="sm"
            className="justify-start"
            onClick={() => navigate(`/nurse/belrai/${patient.id}`)}
          >
            <Brain className="h-4 w-4" /> Consolider les preuves
          </Button>
        </div>
      </Card>

      {carePlanDiagnoses.length === 0 ? (
        <Card>
          {isClinicalContextLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Chargement du plan de soins structuré…</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">
                Aucun diagnostic structuré n’est encore disponible dans les données persistées.
              </p>
              <Button variant="outline" onClick={() => navigate(`/nurse/belrai/${patient.id}`)}>
                Ouvrir BelRAI
              </Button>
            </div>
          )}
        </Card>
      ) : (
        carePlanDiagnoses.map((diagnosis) => {
          const expanded = expandedDiag === diagnosis.id;
          const status = statusConfig[diagnosis.status];

          return (
            <Card
              key={diagnosis.id}
              className={diagnosis.status === 'active' ? 'border-l-4 border-l-mc-green-500' : ''}
            >
              <button
                type="button"
                className="w-full flex items-start justify-between"
                onClick={() => setExpandedDiag(expanded ? null : diagnosis.id)}
              >
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{diagnosis.label}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {diagnosis.sourceLabel && diagnosis.sourceVariant && (
                      <Badge variant={diagnosis.sourceVariant}>{diagnosis.sourceLabel}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    NANDA {diagnosis.code} · {diagnosis.domain}
                  </p>
                  {diagnosis.relatedBelRAI && (
                    <p className="text-[10px] text-mc-blue-500 mt-0.5">🔗 {diagnosis.relatedBelRAI}</p>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                )}
              </button>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Interventions (NIC)</p>
                    <div className="space-y-1.5">
                      {diagnosis.interventions.map((intervention) => (
                        <div key={intervention.id} className="flex items-start gap-2 text-sm">
                          <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${intervention.completed ? 'bg-mc-green-500 text-white' : 'border border-[var(--border-default)]'}`}>
                            {intervention.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={intervention.completed ? 'text-[var(--text-muted)]' : ''}>{intervention.label}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{intervention.frequency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Résultats attendus (NOC)</p>
                    <div className="space-y-2">
                      {diagnosis.outcomes.map((outcome) => {
                        const trend = trendIcons[outcome.trend];

                        return (
                          <div key={outcome.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[var(--bg-tertiary)]">
                            <div className="min-w-0">
                              <p className="font-medium">{outcome.label}</p>
                              <p className="text-xs text-[var(--text-muted)]">Cible: {outcome.target}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold">{outcome.current}</p>
                              <p className={`text-xs ${trend.color}`}>{trend.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] min-w-0">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {diagnosis.startDate ? `Actif depuis ${formatDate(diagnosis.startDate)}` : 'Source clinique consolidée'}
                        {diagnosis.reviewDate ? ` · Revue prévue ${formatDate(diagnosis.reviewDate)}` : ''}
                      </span>
                    </div>
                    {diagnosis.actionKind && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 shrink-0"
                        onClick={() => handleDiagnosisAction(diagnosis.actionKind)}
                      >
                        <Edit className="h-3 w-3" />
                        {getDiagnosisActionLabel(diagnosis.actionKind)}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </AnimatedPage>
  );
}
