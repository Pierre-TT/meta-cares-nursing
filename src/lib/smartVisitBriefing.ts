import { getDaysUntilEAgreementEnd, getEAgreementPresentationStatus, type EAgreementRequest, type PatientConsentSnapshot } from '@/lib/eagreements';
import type { BelraiTwinSnapshot } from '@/lib/belrai';
import type { HadEpisodeDetail, HadEpisodeListItem } from '@/lib/had';
import type { NurseVisitSummary, NurseWoundAssessment } from '@/lib/nurseClinical';
import type { Patient } from '@/lib/patients';

export type SmartVisitTone = 'green' | 'blue' | 'amber' | 'red' | 'outline';

export interface SmartVisitMedicationReminder {
  id: string;
  name: string;
  scheduledFor: string;
  status: string;
  takenAt?: string;
}

export interface SmartVisitTimelineEvent {
  id: string;
  label: string;
  eventTime: string;
  status: string;
}

export interface SmartVisitBriefingItem {
  id: string;
  title: string;
  detail: string;
  tone: SmartVisitTone;
  when?: string;
  actionPath?: string;
}

export interface SmartVisitMedicationItem extends SmartVisitBriefingItem {
  source: 'had_order' | 'reminder';
  status: string;
}

export interface SmartVisitJournalEntry {
  id: string;
  recordedAt: string;
  title: string;
  excerpt: string;
  actsSummary: string;
  signed: boolean;
}

export interface SmartVisitBriefing {
  readiness: {
    label: string;
    tone: SmartVisitTone;
    detail: string;
  };
  summary: {
    riskCount: number;
    blockerCount: number;
    changeCount: number;
    medicationCount: number;
    noteCount: number;
  };
  riskItems: SmartVisitBriefingItem[];
  changes: SmartVisitBriefingItem[];
  adminBlockers: SmartVisitBriefingItem[];
  careFocus: SmartVisitBriefingItem[];
  medications: SmartVisitMedicationItem[];
  recentNotes: SmartVisitJournalEntry[];
}

export interface BuildSmartVisitBriefingInput {
  patient: Patient;
  visitHistory?: NurseVisitSummary[];
  woundAssessments?: NurseWoundAssessment[];
  activeEpisode?: HadEpisodeListItem | null;
  hadEpisodeDetail?: HadEpisodeDetail | null;
  consent?: PatientConsentSnapshot | null;
  agreementRequests?: EAgreementRequest[];
  medicationReminders?: SmartVisitMedicationReminder[];
  timelineEvents?: SmartVisitTimelineEvent[];
  belrai?: BelraiTwinSnapshot | null;
}

const tonePriority: Record<SmartVisitTone, number> = {
  red: 4,
  amber: 3,
  blue: 2,
  green: 1,
  outline: 0,
};

const activeMedicationStatuses = new Set(['active', 'scheduled', 'pending', 'administered', 'planned']);
const closedAlertStatuses = new Set(['resolved', 'closed']);
const closedTaskStatuses = new Set(['done', 'completed', 'cancelled']);

function trimText(value: string, maxLength = 160) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getDateValue(value?: string) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function sortByMostRecent<T>(items: T[], getDate: (item: T) => string | undefined) {
  return [...items].sort((left, right) => getDateValue(getDate(right)) - getDateValue(getDate(left)));
}

function summarizeVisitActs(visit: NurseVisitSummary) {
  if (visit.acts.length === 0) {
    return 'Aucun acte codé';
  }

  const labels = visit.acts.slice(0, 3).map((act) => act.label);
  return visit.acts.length > 3
    ? `${labels.join(' + ')} + ${visit.acts.length - 3} autre(s)`
    : labels.join(' + ');
}

function getVisitReferenceDate(visit: NurseVisitSummary) {
  return visit.completedAt ?? visit.scheduledEnd ?? visit.scheduledStart;
}

function compareItems(left: SmartVisitBriefingItem, right: SmartVisitBriefingItem) {
  const toneDelta = tonePriority[right.tone] - tonePriority[left.tone];

  if (toneDelta !== 0) {
    return toneDelta;
  }

  return getDateValue(right.when) - getDateValue(left.when);
}

function compareMedications(left: SmartVisitMedicationItem, right: SmartVisitMedicationItem) {
  const leftTime = getDateValue(left.when);
  const rightTime = getDateValue(right.when);

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return compareItems(left, right);
}

function describeBloodPressure(systolic?: number, diastolic?: number) {
  if (systolic == null && diastolic == null) {
    return 'Tension non relevée';
  }

  return [systolic, diastolic].filter((value): value is number => value != null).join('/');
}

function getWoundArea(assessment?: NurseWoundAssessment | null) {
  if (assessment?.lengthCm == null || assessment.widthCm == null) {
    return null;
  }

  return assessment.lengthCm * assessment.widthCm;
}

function getWoundTrend(
  latestAssessment?: NurseWoundAssessment | null,
  previousAssessment?: NurseWoundAssessment | null,
) {
  const latestArea = getWoundArea(latestAssessment);
  const previousArea = getWoundArea(previousAssessment);

  if (latestArea == null || previousArea == null || previousArea <= 0) {
    return null;
  }

  const variation = (latestArea - previousArea) / previousArea;

  if (variation >= 0.05) {
    return {
      tone: 'red' as const,
      detail: `Surface de plaie en hausse (${Math.round(variation * 100)}%).`,
    };
  }

  if (variation <= -0.05) {
    return {
      tone: 'green' as const,
      detail: `Surface de plaie en baisse (${Math.abs(Math.round(variation * 100))}%).`,
    };
  }

  return {
    tone: 'blue' as const,
    detail: 'Dimensions de plaie stables depuis le dernier relevé.',
  };
}

function getVitalRiskItems(visit: NurseVisitSummary, patientRouteId: string) {
  const items: SmartVisitBriefingItem[] = [];
  const { vitals } = visit;

  if (
    (vitals.bloodPressureSystolic != null && vitals.bloodPressureSystolic >= 180)
    || (vitals.bloodPressureDiastolic != null && vitals.bloodPressureDiastolic >= 110)
  ) {
    items.push({
      id: `${visit.id}-bp-critical`,
      title: 'Tension critique',
      detail: `${describeBloodPressure(vitals.bloodPressureSystolic, vitals.bloodPressureDiastolic)} mmHg lors de la dernière visite.`,
      tone: 'red',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  } else if (
    (vitals.bloodPressureSystolic != null && vitals.bloodPressureSystolic >= 140)
    || (vitals.bloodPressureDiastolic != null && vitals.bloodPressureDiastolic >= 90)
  ) {
    items.push({
      id: `${visit.id}-bp-warning`,
      title: 'Tension à surveiller',
      detail: `${describeBloodPressure(vitals.bloodPressureSystolic, vitals.bloodPressureDiastolic)} mmHg à recontrôler.`,
      tone: 'amber',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  }

  if (vitals.oxygenSaturation != null && vitals.oxygenSaturation < 90) {
    items.push({
      id: `${visit.id}-spo2-critical`,
      title: 'Desaturation critique',
      detail: `SpO2 à ${vitals.oxygenSaturation}% lors de la dernière visite.`,
      tone: 'red',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  } else if (vitals.oxygenSaturation != null && vitals.oxygenSaturation < 94) {
    items.push({
      id: `${visit.id}-spo2-warning`,
      title: 'SpO2 basse',
      detail: `SpO2 à ${vitals.oxygenSaturation}% à recontrôler.`,
      tone: 'amber',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  }

  if (vitals.glycemia != null && (vitals.glycemia >= 250 || vitals.glycemia <= 60)) {
    items.push({
      id: `${visit.id}-glycemia-critical`,
      title: 'Glycémie critique',
      detail: `Mesure à ${vitals.glycemia} mg/dL lors de la dernière visite.`,
      tone: 'red',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  } else if (vitals.glycemia != null && (vitals.glycemia >= 180 || vitals.glycemia <= 70)) {
    items.push({
      id: `${visit.id}-glycemia-warning`,
      title: 'Glycémie à surveiller',
      detail: `Mesure à ${vitals.glycemia} mg/dL avant de commencer les soins.`,
      tone: 'amber',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  }

  if (vitals.temperature != null && vitals.temperature >= 39) {
    items.push({
      id: `${visit.id}-temperature-critical`,
      title: 'Fièvre élevée',
      detail: `Température à ${vitals.temperature.toFixed(1)}°C.`,
      tone: 'red',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  } else if (vitals.temperature != null && vitals.temperature >= 38) {
    items.push({
      id: `${visit.id}-temperature-warning`,
      title: 'Fièvre à surveiller',
      detail: `Température à ${vitals.temperature.toFixed(1)}°C.`,
      tone: 'amber',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  }

  if (vitals.pain != null && vitals.pain >= 7) {
    items.push({
      id: `${visit.id}-pain-critical`,
      title: 'Douleur élevée',
      detail: `Douleur rapportée à ${vitals.pain}/10.`,
      tone: 'red',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  } else if (vitals.pain != null && vitals.pain >= 4) {
    items.push({
      id: `${visit.id}-pain-warning`,
      title: 'Douleur notable',
      detail: `Douleur rapportée à ${vitals.pain}/10.`,
      tone: 'amber',
      when: getVisitReferenceDate(visit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  }

  return items;
}

function getVitalChangeItems(
  latestVisit: NurseVisitSummary,
  previousVisit: NurseVisitSummary,
  patientRouteId: string,
) {
  const changes: SmartVisitBriefingItem[] = [];
  const latestVitals = latestVisit.vitals;
  const previousVitals = previousVisit.vitals;

  const numericComparisons = [
    { key: 'glycemia', label: 'Glycémie', unit: 'mg/dL', latest: latestVitals.glycemia, previous: previousVitals.glycemia, threshold: 20 },
    { key: 'systolic', label: 'Systolique', unit: 'mmHg', latest: latestVitals.bloodPressureSystolic, previous: previousVitals.bloodPressureSystolic, threshold: 15 },
    { key: 'spo2', label: 'SpO2', unit: '%', latest: latestVitals.oxygenSaturation, previous: previousVitals.oxygenSaturation, threshold: 2 },
    { key: 'temperature', label: 'Température', unit: '°C', latest: latestVitals.temperature, previous: previousVitals.temperature, threshold: 0.5 },
    { key: 'pain', label: 'Douleur', unit: '/10', latest: latestVitals.pain, previous: previousVitals.pain, threshold: 2 },
  ];

  for (const comparison of numericComparisons) {
    if (comparison.latest == null || comparison.previous == null) {
      continue;
    }

    const delta = comparison.latest - comparison.previous;
    if (Math.abs(delta) < comparison.threshold) {
      continue;
    }

    changes.push({
      id: `${latestVisit.id}-${comparison.key}-delta`,
      title: `${comparison.label} modifiée`,
      detail: `${comparison.latest}${comparison.unit} (${delta > 0 ? `+${delta}` : `${delta}`}${comparison.unit} vs dernière visite).`,
      tone: delta > 0 ? 'amber' : 'blue',
      when: getVisitReferenceDate(latestVisit),
      actionPath: `/nurse/patients/${patientRouteId}`,
    });
  }

  const latestActs = new Set(latestVisit.acts.map((act) => act.label));
  const previousActs = new Set(previousVisit.acts.map((act) => act.label));
  const addedActs = [...latestActs].filter((label) => !previousActs.has(label));

  if (addedActs.length > 0) {
    changes.push({
      id: `${latestVisit.id}-new-acts`,
      title: 'Actes modifiés',
      detail: `Nouveaux actes depuis le dernier passage: ${addedActs.slice(0, 3).join(', ')}.`,
      tone: 'blue',
      when: getVisitReferenceDate(latestVisit),
      actionPath: `/nurse/visit/${patientRouteId}`,
    });
  }

  return changes;
}

function getRecentTimelineChanges(
  timelineEvents: SmartVisitTimelineEvent[],
  previousVisit?: NurseVisitSummary,
) {
  const baseline = previousVisit ? getDateValue(getVisitReferenceDate(previousVisit)) : Number.NEGATIVE_INFINITY;

  return sortByMostRecent(timelineEvents, (event) => event.eventTime)
    .filter((event) => getDateValue(event.eventTime) >= baseline)
    .slice(0, 2)
    .map((event) => ({
      id: event.id,
      title: 'Nouvelle mise à jour patient',
      detail: event.label,
      tone: event.status === 'current' ? 'amber' : 'blue',
      when: event.eventTime,
    } satisfies SmartVisitBriefingItem));
}

function buildRiskItems(input: BuildSmartVisitBriefingInput) {
  const { patient, activeEpisode, hadEpisodeDetail, belrai } = input;
  const latestVisit = sortByMostRecent(input.visitHistory ?? [], getVisitReferenceDate)[0];
  const woundAssessments = sortByMostRecent(input.woundAssessments ?? [], (assessment) => assessment.recordedAt);
  const latestWound = woundAssessments[0];
  const previousWound = woundAssessments[1];
  const riskItems: SmartVisitBriefingItem[] = [];

  if (patient.allergies.length > 0) {
    riskItems.push({
      id: 'allergies',
      title: 'Allergies connues',
      detail: patient.allergies.join(', '),
      tone: patient.allergies.length > 1 ? 'red' : 'amber',
      actionPath: `/nurse/patients/${patient.id}`,
    });
  }

  if (latestVisit) {
    riskItems.push(...getVitalRiskItems(latestVisit, patient.id));
  }

  if (activeEpisode && (activeEpisode.riskLevel === 'critical' || activeEpisode.riskLevel === 'high')) {
    riskItems.push({
      id: `had-risk-${activeEpisode.id}`,
      title: 'Episode HAD prioritaire',
      detail: `${activeEpisode.diagnosisSummary || activeEpisode.admissionReason} en statut ${activeEpisode.riskLevel}.`,
      tone: activeEpisode.riskLevel === 'critical' ? 'red' : 'amber',
      when: activeEpisode.lastRoundAt ?? activeEpisode.startAt,
      actionPath: `/nurse/had/${activeEpisode.id}`,
    });
  }

  for (const alert of (hadEpisodeDetail?.alerts ?? []).filter((entry) => !closedAlertStatuses.has(entry.status)).slice(0, 2)) {
    riskItems.push({
      id: `had-alert-${alert.id}`,
      title: alert.title,
      detail: trimText(alert.description ?? 'Alerte HAD ouverte.'),
      tone: alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'amber' : 'blue',
      when: alert.createdAt,
      actionPath: hadEpisodeDetail ? `/nurse/had/${hadEpisodeDetail.episode.id}` : undefined,
    });
  }

  const woundTrend = getWoundTrend(latestWound, previousWound);
  if (latestWound && woundTrend && woundTrend.tone !== 'green') {
    riskItems.push({
      id: `wound-${latestWound.id}`,
      title: `Plaie: ${latestWound.woundLabel}`,
      detail: woundTrend.detail,
      tone: woundTrend.tone,
      when: latestWound.recordedAt,
      actionPath: `/nurse/wounds/${patient.id}`,
    });
  }

  for (const cap of (belrai?.caps ?? []).filter((entry) => entry.priority === 'high').slice(0, 2)) {
    riskItems.push({
      id: `belrai-cap-${cap.id}`,
      title: cap.title,
      detail: trimText(cap.detail, 140),
      tone: cap.tone,
      actionPath: `/nurse/belrai/${patient.id}`,
    });
  }

  return riskItems.sort(compareItems);
}

function buildAdminBlockers(input: BuildSmartVisitBriefingInput) {
  const { patient, consent, agreementRequests } = input;
  const visitHistory = sortByMostRecent(input.visitHistory ?? [], getVisitReferenceDate);
  const latestVisit = visitHistory[0];
  const blockers: SmartVisitBriefingItem[] = [];

  if (!consent) {
    blockers.push({
      id: 'consent-missing',
      title: 'Consentement eHealth manquant',
      detail: 'Le briefing ne trouve aucun snapshot de consentement synchronisé.',
      tone: 'red',
      actionPath: '/nurse/consent',
    });
  } else {
    if (consent.consentStatus === 'missing') {
      blockers.push({
        id: 'consent-status-missing',
        title: 'Consentement non actif',
        detail: 'Le consentement patient doit être activé avant les accès externes.',
        tone: 'red',
        when: consent.lastSyncAt,
        actionPath: '/nurse/consent',
      });
    } else if (consent.consentStatus === 'renewal') {
      blockers.push({
        id: 'consent-status-renewal',
        title: 'Consentement à renouveler',
        detail: 'Le dossier nécessite une reconfirmation du consentement.',
        tone: 'amber',
        when: consent.lastSyncAt,
        actionPath: '/nurse/consent',
      });
    }

    if (consent.therapeuticLinkStatus === 'blocked') {
      blockers.push({
        id: 'therapeutic-link-blocked',
        title: 'Lien thérapeutique bloqué',
        detail: 'Les accès MyCareNet/eHealth doivent être régularisés avant la visite.',
        tone: 'red',
        when: consent.lastSyncAt,
        actionPath: '/nurse/consent',
      });
    } else if (consent.therapeuticLinkStatus === 'review') {
      blockers.push({
        id: 'therapeutic-link-review',
        title: 'Lien thérapeutique à vérifier',
        detail: 'Le lien thérapeutique demande une confirmation avant d’utiliser les connecteurs externes.',
        tone: 'amber',
        when: consent.lastSyncAt,
        actionPath: '/nurse/consent',
      });
    }

    if (consent.exclusionNote) {
      blockers.push({
        id: 'consent-exclusion',
        title: 'Restriction d’accès signalée',
        detail: trimText(consent.exclusionNote),
        tone: 'amber',
        when: consent.lastSyncAt,
        actionPath: '/nurse/consent',
      });
    }
  }

  for (const request of sortByMostRecent(agreementRequests ?? [], (entry) => entry.updatedAt)) {
    const presentationStatus = getEAgreementPresentationStatus(request);

    if (presentationStatus === 'active') {
      continue;
    }

    let title = 'eAgreement à revoir';
    let detail = `${request.careType} - ${request.nomenclature}`;
    let tone: SmartVisitTone = 'blue';

    switch (presentationStatus) {
      case 'expiring':
        title = 'eAgreement proche de l’échéance';
        detail = `${request.careType} expire dans ${Math.max(getDaysUntilEAgreementEnd(request), 0)} jour(s).`;
        tone = 'amber';
        break;
      case 'expired':
        title = 'eAgreement expiré';
        detail = `${request.careType} n’est plus couvert pour la facturation.`;
        tone = 'red';
        break;
      case 'rejected':
        title = 'eAgreement refusé';
        detail = trimText(request.rejectionReason ?? 'La demande a été rejetée et doit être corrigée.');
        tone = 'red';
        break;
      case 'pending':
        title = 'eAgreement en attente';
        detail = `${request.careType} soumis, décision MyCareNet en attente.`;
        tone = 'amber';
        break;
      case 'cancelled':
        title = 'eAgreement annulé';
        detail = `${request.careType} doit être relancé avant la prochaine facturation.`;
        tone = 'red';
        break;
      case 'draft':
        title = 'eAgreement non soumis';
        detail = `${request.careType} est encore au statut brouillon.`;
        tone = 'amber';
        break;
      default:
        break;
    }

    blockers.push({
      id: `agreement-${request.id}`,
      title,
      detail,
      tone,
      when: request.updatedAt,
      actionPath: `/nurse/eagreement?patientId=${patient.id}`,
    });
  }

  if (latestVisit?.status === 'completed' && !latestVisit.signature) {
    blockers.push({
      id: `visit-signature-${latestVisit.id}`,
      title: 'Dernière visite non signée',
      detail: 'La validation finale manque et peut bloquer la chaîne de facturation.',
      tone: 'amber',
      when: getVisitReferenceDate(latestVisit),
      actionPath: `/nurse/patients/${patient.id}`,
    });
  }

  if (latestVisit?.status === 'completed' && latestVisit.acts.length === 0) {
    blockers.push({
      id: `visit-acts-${latestVisit.id}`,
      title: 'Dernière visite sans actes codés',
      detail: 'Le résumé de visite doit être complété avant consolidation.',
      tone: 'amber',
      when: getVisitReferenceDate(latestVisit),
      actionPath: `/nurse/visit/${patient.id}`,
    });
  }

  return blockers.sort(compareItems).slice(0, 6);
}

function buildChanges(input: BuildSmartVisitBriefingInput) {
  const { patient, timelineEvents } = input;
  const visitHistory = sortByMostRecent(input.visitHistory ?? [], getVisitReferenceDate);
  const woundAssessments = sortByMostRecent(input.woundAssessments ?? [], (assessment) => assessment.recordedAt);
  const latestVisit = visitHistory[0];
  const previousVisit = visitHistory[1];
  const latestWound = woundAssessments[0];
  const previousWound = woundAssessments[1];
  const changes: SmartVisitBriefingItem[] = [];

  if (latestVisit && previousVisit) {
    changes.push(...getVitalChangeItems(latestVisit, previousVisit, patient.id));
  }

  const woundTrend = getWoundTrend(latestWound, previousWound);
  if (latestWound && woundTrend) {
    changes.push({
      id: `wound-change-${latestWound.id}`,
      title: 'Evolution de plaie',
      detail: woundTrend.detail,
      tone: woundTrend.tone,
      when: latestWound.recordedAt,
      actionPath: `/nurse/wounds/${patient.id}`,
    });
  }

  changes.push(...getRecentTimelineChanges(timelineEvents ?? [], previousVisit));

  return changes.sort(compareItems).slice(0, 6);
}

function buildCareFocus(input: BuildSmartVisitBriefingInput) {
  const { patient, hadEpisodeDetail, belrai } = input;
  const visitHistory = sortByMostRecent(input.visitHistory ?? [], getVisitReferenceDate);
  const latestVisit = visitHistory[0];
  const focus: SmartVisitBriefingItem[] = [];
  const activeCarePlan = hadEpisodeDetail?.carePlans.find((carePlan) => carePlan.status === 'active')
    ?? hadEpisodeDetail?.carePlans[0];
  const activeMedicationCount = (hadEpisodeDetail?.medicationOrders ?? []).filter((order) => activeMedicationStatuses.has(order.status)).length;
  const openTasks = (hadEpisodeDetail?.tasks ?? []).filter((task) => !closedTaskStatuses.has(task.status));

  if (activeCarePlan) {
    focus.push({
      id: `care-plan-${activeCarePlan.id}`,
      title: 'Plan de soins actif',
      detail: trimText(activeCarePlan.summary),
      tone: activeCarePlan.status === 'active' ? 'green' : 'blue',
      when: activeCarePlan.nextReviewAt ?? activeCarePlan.approvedAt ?? activeCarePlan.createdAt,
      actionPath: `/nurse/care-plan?patientId=${patient.id}`,
    });
  }

  if (activeMedicationCount > 0) {
    focus.push({
      id: 'medication-orders',
      title: 'Therapeutique du jour',
      detail: `${activeMedicationCount} ligne(s) de traitement a vérifier avant administration.`,
      tone: 'blue',
      actionPath: `/nurse/patients/${patient.id}`,
    });
  }

  if (openTasks.length > 0) {
    focus.push({
      id: 'had-open-tasks',
      title: 'Taches HAD en attente',
      detail: trimText(openTasks.slice(0, 2).map((task) => task.title).join(' - ')),
      tone: 'amber',
      when: openTasks[0]?.dueAt,
      actionPath: hadEpisodeDetail ? `/nurse/had/${hadEpisodeDetail.episode.id}` : undefined,
    });
  }

  if (belrai?.nextAction) {
    focus.push({
      id: 'belrai-next-action',
      title: 'Action BelRAI recommandée',
      detail: trimText(belrai.nextAction),
      tone: belrai.statusTone,
      actionPath: `/nurse/belrai/${patient.id}`,
    });
  }

  for (const pathology of patient.pathologies.slice(0, 2)) {
    focus.push({
      id: `pathology-${pathology}`,
      title: 'Contexte clinique',
      detail: pathology,
      tone: 'outline',
      actionPath: `/nurse/patients/${patient.id}`,
    });
  }

  if (latestVisit) {
    focus.push({
      id: `latest-visit-${latestVisit.id}`,
      title: 'Derniers soins réalisés',
      detail: summarizeVisitActs(latestVisit),
      tone: 'outline',
      when: getVisitReferenceDate(latestVisit),
      actionPath: `/nurse/patients/${patient.id}`,
    });
  }

  return focus.sort(compareItems).slice(0, 5);
}

function buildMedications(input: BuildSmartVisitBriefingInput) {
  const hadMedications = (input.hadEpisodeDetail?.medicationOrders ?? [])
    .filter((order) => activeMedicationStatuses.has(order.status))
    .map((order) => {
      const dueSoon = order.nextDueAt
        ? getDateValue(order.nextDueAt) - Date.now() <= 4 * 60 * 60 * 1000
        : false;

      return {
        id: `had-order-${order.id}`,
        title: order.medicationName,
        detail: `${order.dose} - ${order.route} - ${order.frequency}`,
        tone: dueSoon ? 'amber' : order.requiresNurse ? 'blue' : 'green',
        when: order.nextDueAt ?? order.startAt,
        status: order.status,
        source: 'had_order' as const,
      } satisfies SmartVisitMedicationItem;
    });

  const reminders = (input.medicationReminders ?? []).map((reminder) => ({
    id: `reminder-${reminder.id}`,
    title: reminder.name,
    detail:
      reminder.status === 'taken'
        ? 'Déjà administré ou confirmé'
        : reminder.status === 'upcoming'
          ? 'Dose prévue prochainement'
          : 'Dose attendue avant ou pendant la visite',
    tone: reminder.status === 'taken' ? 'green' : reminder.status === 'upcoming' ? 'blue' : 'amber',
    when: reminder.scheduledFor,
    status: reminder.status,
    source: 'reminder' as const,
  } satisfies SmartVisitMedicationItem));

  return [...hadMedications, ...reminders].sort(compareMedications).slice(0, 6);
}

function buildRecentNotes(input: BuildSmartVisitBriefingInput) {
  const visitNotes = sortByMostRecent(input.visitHistory ?? [], getVisitReferenceDate)
    .filter((visit) => Boolean(visit.notes?.trim()))
    .slice(0, 3)
    .map((visit) => ({
      id: visit.id,
      recordedAt: getVisitReferenceDate(visit),
      title: visit.nurseName ? `Transmission de ${visit.nurseName}` : 'Transmission infirmière',
      excerpt: trimText(visit.notes ?? ''),
      actsSummary: summarizeVisitActs(visit),
      signed: Boolean(visit.signature),
    } satisfies SmartVisitJournalEntry));

  if (visitNotes.length > 0) {
    return visitNotes;
  }

  return sortByMostRecent(input.timelineEvents ?? [], (event) => event.eventTime)
    .slice(0, 3)
    .map((event) => ({
      id: event.id,
      recordedAt: event.eventTime,
      title: 'Mise à jour patient',
      excerpt: trimText(event.label),
      actsSummary: 'Chronologie patient',
      signed: true,
    } satisfies SmartVisitJournalEntry));
}

function buildReadiness(
  riskItems: SmartVisitBriefingItem[],
  blockers: SmartVisitBriefingItem[],
  changes: SmartVisitBriefingItem[],
) {
  const criticalSignals = [...riskItems, ...blockers].filter((item) => item.tone === 'red').length;
  const attentionSignals = [...riskItems, ...blockers].filter((item) => item.tone === 'amber').length;

  if (criticalSignals > 0) {
    return {
      label: 'Revue requise',
      tone: 'red' as const,
      detail: 'Le briefing remonte au moins un point critique a arbitrer avant de lancer les soins.',
    };
  }

  if (blockers.length > 0 || attentionSignals > 1) {
    return {
      label: 'Preparation incomplete',
      tone: 'amber' as const,
      detail: 'Quelques points medico-administratifs demandent une verification juste avant la visite.',
    };
  }

  if (changes.length > 0) {
    return {
      label: 'Mise a jour disponible',
      tone: 'blue' as const,
      detail: 'Le contexte a evolue depuis le dernier passage. Lis les changements avant d entrer.',
    };
  }

  return {
    label: 'Pret pour la visite',
    tone: 'green' as const,
    detail: 'Aucun signal bloquant n a ete detecte dans le dossier consolide.',
  };
}

export function buildSmartVisitBriefing(input: BuildSmartVisitBriefingInput): SmartVisitBriefing {
  const riskItems = buildRiskItems(input);
  const adminBlockers = buildAdminBlockers(input);
  const changes = buildChanges(input);
  const medications = buildMedications(input);
  const careFocus = buildCareFocus(input);
  const recentNotes = buildRecentNotes(input);
  const readiness = buildReadiness(riskItems, adminBlockers, changes);

  return {
    readiness,
    summary: {
      riskCount: riskItems.length,
      blockerCount: adminBlockers.length,
      changeCount: changes.length,
      medicationCount: medications.length,
      noteCount: recentNotes.length,
    },
    riskItems,
    changes,
    adminBlockers,
    careFocus,
    medications,
    recentNotes,
  };
}
