import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Activity,
  FileText,
  Clock,
  Pill,
  Heart,
  Navigation,
  Hash,
  Shield,
  Droplets,
  Minus,
  Ruler,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, Avatar, ContentTabs, AnimatedPage, GradientHeader } from '@/design-system';
import { BelRAILiveCard } from '@/components/nurse/BelRAILiveCard';
import { QuickPatientActions } from '@/components/nurse/QuickPatientActions';
import { SmartVisitBriefingCard } from '@/components/nurse/SmartVisitBriefingCard';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import { useHadEpisodeDetail, useHadPatientEpisodes } from '@/hooks/useHadData';
import { useNurseVisitHistory, useNurseWoundAssessments } from '@/hooks/useNurseClinicalData';
import { useNursePatient } from '@/hooks/useNursePatients';
import type { NurseVisitSummary, NurseWoundAssessment } from '@/lib/nurseClinical';

const woundPathologyPattern = /ulc[eè]re|plaie|escarre/i;

const exudateLabels: Record<string, string> = {
  none: 'Aucun',
  mild: 'Faible',
  moderate: 'Modéré',
  heavy: 'Abondant',
};

const tissueTypeLabels: Record<string, string> = {
  granulation: 'Granulation',
  slough: 'Fibrine',
  necrosis: 'Nécrose',
  epithelialization: 'Épithélialisation',
  mixed: 'Mixte',
  other: 'Autre',
};

const bodyZoneLabels: Record<string, string> = {
  head: 'Tête',
  chest: 'Thorax',
  abdomen: 'Abdomen',
  'arm-l': 'Bras G',
  'arm-r': 'Bras D',
  'hand-l': 'Main G',
  'hand-r': 'Main D',
  'leg-l': 'Jambe G',
  'leg-r': 'Jambe D',
  'foot-l': 'Pied G',
  'foot-r': 'Pied D',
  sacrum: 'Sacrum',
};

type ClinicalBadgeVariant = 'green' | 'red' | 'blue' | 'amber' | 'outline';

type WoundTrend = {
  label: string;
  variant: ClinicalBadgeVariant;
  icon: React.ReactNode;
};

type LatestVitalCard = {
  label: string;
  value: string;
  unit: string;
  alert?: boolean;
};

type CareHighlight = {
  id: string;
  title: string;
  detail: string;
  badgeLabel: string;
  badgeVariant: ClinicalBadgeVariant;
  onClick?: () => void;
};

type CoordinationContact = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  badgeLabel?: string;
  badgeVariant?: ClinicalBadgeVariant;
};

type ClinicalArtifact = {
  id: string;
  name: string;
  typeLabel: string;
  variant: ClinicalBadgeVariant;
  dateLabel: string;
  sortDate: string;
  onClick?: () => void;
};

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('fr-BE');
}

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function formatTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getVisitReferenceDate(visit: NurseVisitSummary) {
  return visit.completedAt ?? visit.scheduledEnd ?? visit.scheduledStart;
}

function formatVisitWindow(visit: NurseVisitSummary) {
  const end = visit.completedAt ?? visit.scheduledEnd;

  if (!end) {
    return formatTime(visit.scheduledStart);
  }

  return `${formatTime(visit.scheduledStart)}-${formatTime(end)}`;
}

function summarizeVisitActs(visit: NurseVisitSummary) {
  if (visit.acts.length === 0) {
    return 'Aucun acte encodé';
  }

  const labels = visit.acts.slice(0, 3).map((act) => act.label);
  return visit.acts.length > 3
    ? `${labels.join(' + ')} + ${visit.acts.length - 3} autre(s)`
    : labels.join(' + ');
}

function getVisitStatusVariant(status: NurseVisitSummary['status']): ClinicalBadgeVariant {
  switch (status) {
    case 'completed':
      return 'green';
    case 'in_progress':
      return 'blue';
    case 'cancelled':
      return 'red';
    default:
      return 'outline';
  }
}

function getCarePlanStatusVariant(status?: string): ClinicalBadgeVariant {
  switch (status) {
    case 'active':
    case 'approved':
      return 'green';
    case 'paused':
      return 'amber';
    case 'cancelled':
      return 'red';
    case 'draft':
    case 'archived':
      return 'outline';
    default:
      return 'blue';
  }
}

function getMedicationOrderVariant(status?: string): ClinicalBadgeVariant {
  switch (status) {
    case 'active':
    case 'administered':
      return 'green';
    case 'paused':
    case 'pending':
      return 'amber';
    case 'cancelled':
    case 'stopped':
      return 'red';
    case 'planned':
    case 'scheduled':
      return 'blue';
    default:
      return 'outline';
  }
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

function getArtifactSurfaceClasses(variant: ClinicalBadgeVariant) {
  switch (variant) {
    case 'green':
      return 'bg-mc-green-50 dark:bg-mc-green-900/30 text-mc-green-500';
    case 'red':
      return 'bg-mc-red-50 dark:bg-red-900/30 text-mc-red-500';
    case 'amber':
      return 'bg-mc-amber-500/10 text-mc-amber-500';
    case 'blue':
      return 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500';
    default:
      return 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]';
  }
}


function formatCompactDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getVisitStatusLabel(status: NurseVisitSummary['status']) {
  switch (status) {
    case 'completed':
      return 'Terminée';
    case 'in_progress':
      return 'En cours';
    case 'cancelled':
      return 'Annulée';
    default:
      return 'Planifiée';
  }
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
): WoundTrend {
  if (!latestAssessment || !previousAssessment) {
    return {
      label: 'Premier relevé',
      variant: 'outline',
      icon: <Minus className="h-3.5 w-3.5" />,
    };
  }

  const latestArea = getWoundArea(latestAssessment);
  const previousArea = getWoundArea(previousAssessment);

  if (latestArea === null || previousArea === null || previousArea <= 0) {
    return {
      label: 'Dimensions partielles',
      variant: 'outline',
      icon: <Minus className="h-3.5 w-3.5" />,
    };
  }

  const variation = (latestArea - previousArea) / previousArea;

  if (variation <= -0.05) {
    return {
      label: 'En amélioration',
      variant: 'green',
      icon: <TrendingDown className="h-3.5 w-3.5" />,
    };
  }

  if (variation >= 0.05) {
    return {
      label: 'À surveiller',
      variant: 'red',
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    };
  }

  return {
    label: 'Stable',
    variant: 'blue',
    icon: <Minus className="h-3.5 w-3.5" />,
  };
}

function getLatestVitals(visit?: NurseVisitSummary | null): LatestVitalCard[] {
  if (!visit) {
    return [];
  }

  const { vitals } = visit;

  return [
    vitals.bloodPressureSystolic !== undefined && vitals.bloodPressureDiastolic !== undefined
      ? {
        label: 'Tension',
        value: `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`,
        unit: 'mmHg',
        alert: vitals.bloodPressureSystolic >= 140 || vitals.bloodPressureDiastolic >= 90,
      }
      : null,
    vitals.heartRate !== undefined
      ? {
        label: 'Pouls',
        value: String(vitals.heartRate),
        unit: 'bpm',
        alert: vitals.heartRate >= 110 || vitals.heartRate <= 50,
      }
      : null,
    vitals.glycemia !== undefined
      ? {
        label: 'Glycémie',
        value: String(vitals.glycemia),
        unit: 'mg/dL',
        alert: vitals.glycemia >= 180 || vitals.glycemia <= 70,
      }
      : null,
    vitals.temperature !== undefined
      ? {
        label: 'Température',
        value: String(vitals.temperature),
        unit: '°C',
        alert: vitals.temperature >= 38,
      }
      : null,
    vitals.oxygenSaturation !== undefined
      ? {
        label: 'SpO₂',
        value: String(vitals.oxygenSaturation),
        unit: '%',
        alert: vitals.oxygenSaturation < 94,
      }
      : null,
    vitals.weight !== undefined
      ? {
        label: 'Poids',
        value: String(vitals.weight),
        unit: 'kg',
      }
      : null,
    vitals.pain !== undefined
      ? {
        label: 'Douleur',
        value: String(vitals.pain),
        unit: '/10',
        alert: vitals.pain >= 5,
      }
      : null,
  ].filter((entry): entry is LatestVitalCard => Boolean(entry));
}

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading, error, refetch } = useNursePatient(id);
  const {
    data: belrai,
    isLoading: isBelraiLoading,
    error: belraiError,
    refetch: refetchBelrai,
  } = useBelraiTwin(patient?.id);
  const {
    data: visitHistory = [],
    isLoading: isVisitHistoryLoading,
    error: visitHistoryError,
    refetch: refetchVisitHistory,
  } = useNurseVisitHistory(patient?.databaseId, 6);
  const {
    data: woundHistory = [],
    isLoading: isWoundHistoryLoading,
    error: woundHistoryError,
    refetch: refetchWoundHistory,
  } = useNurseWoundAssessments(patient?.databaseId);
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

  if (error) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Patient indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Le dossier patient n’a pas pu être chargé.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement du dossier patient…</p>
      </AnimatedPage>
    );
  }

  if (!patient) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h2 className="text-lg font-bold mb-2">Patient introuvable</h2>
        <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
      </AnimatedPage>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  const latestVisit = visitHistory[0];
  const latestVitals = getLatestVitals(latestVisit);
  const latestWoundAssessment = woundHistory[0];
  const hasWoundTracking = woundHistory.length > 0 || patient.pathologies.some((pathology) => woundPathologyPattern.test(pathology));
  const latestWoundTrend = getWoundTrend(latestWoundAssessment, woundHistory[1]);
  const activeHadCarePlan =
    hadEpisodeDetail?.carePlans.find((carePlan) => carePlan.status === 'active')
    ?? hadEpisodeDetail?.carePlans[hadEpisodeDetail.carePlans.length - 1];
  const medicationOrders = (hadEpisodeDetail?.medicationOrders ?? []).slice(0, 3);
  const belraiSuggestions = belrai?.carePlanSuggestions.slice(0, 3) ?? [];
  const rawCareHighlights: Array<CareHighlight | null> = [
      latestWoundAssessment ? {
        id: `wound-${latestWoundAssessment.id}`,
        title: latestWoundAssessment.woundLabel,
        detail: `${bodyZoneLabels[latestWoundAssessment.zoneId] ?? latestWoundAssessment.zoneId} • ${formatWoundDimensions(latestWoundAssessment)}`,
        badgeLabel: latestWoundTrend.label,
        badgeVariant: latestWoundTrend.variant,
        onClick: () => navigate(`/nurse/wounds/${patient.id}`),
      } satisfies CareHighlight : null,
      ...visitHistory.flatMap((visit) =>
        visit.acts.map((act) => ({
          id: `${act.category}-${act.label}`,
          title: act.label,
          detail: `${formatDate(getVisitReferenceDate(visit))} • ${visit.nurseName ?? 'Infirmier·ère non renseigné·e'}`,
          badgeLabel:
            act.category === 'wound'
              ? 'Plaie'
              : act.category === 'medication'
                ? 'Médication'
                : 'Acte',
          badgeVariant:
            act.category === 'wound'
              ? 'red'
              : act.category === 'medication'
                ? 'blue'
                : 'outline',
          onClick: () => navigate(`/nurse/visit/${patient.id}/summary`, { state: { visitId: visit.id } }),
        } satisfies CareHighlight)),
      ),
    ];
  const careHighlights = dedupeByKey(rawCareHighlights.filter(isPresent), (item) => item.title).slice(0, 4);
  const rawCoordinationContacts: Array<CoordinationContact | null> = [
      patient.prescribingDoctor ? {
        id: `doctor-${patient.prescribingDoctor}`,
        name: patient.prescribingDoctor,
        role: 'Médecin prescripteur',
        phone: patient.doctorPhone ?? undefined,
        badgeLabel: 'Médecin',
        badgeVariant: 'blue',
      } satisfies CoordinationContact : null,
      activeHadEpisode?.primaryNurse ? {
        id: `had-primary-${activeHadEpisode.primaryNurse.id}`,
        name: activeHadEpisode.primaryNurse.fullName,
        role: 'Infirmier HAD référent',
        phone: activeHadEpisode.primaryNurse.phone,
        badgeLabel: 'HAD',
        badgeVariant: 'green',
      } satisfies CoordinationContact : null,
      activeHadEpisode?.coordinator ? {
        id: `had-coordinator-${activeHadEpisode.coordinator.id}`,
        name: activeHadEpisode.coordinator.fullName,
        role: 'Coordinateur HAD',
        phone: activeHadEpisode.coordinator.phone,
        badgeLabel: 'Coordination',
        badgeVariant: 'amber',
      } satisfies CoordinationContact : null,
      hadEpisodeDetail?.episode.specialist ? {
        id: `had-specialist-${hadEpisodeDetail.episode.specialist.id}`,
        name: hadEpisodeDetail.episode.specialist.fullName,
        role: 'Spécialiste HAD',
        phone: hadEpisodeDetail.episode.specialist.phone,
        badgeLabel: 'Spécialiste',
        badgeVariant: 'red',
      } satisfies CoordinationContact : null,
    ];
  const coordinationContacts = dedupeByKey(
    rawCoordinationContacts.filter(isPresent),
    (item) => `${item.name}-${item.role}`,
  );
  const clinicalArtifacts = [
    ...visitHistory.slice(0, 3).map((visit) => ({
      id: `visit-${visit.id}`,
      name: `Résumé de visite — ${summarizeVisitActs(visit)}`,
      typeLabel: 'Visite',
      variant: getVisitStatusVariant(visit.status),
      dateLabel: formatCompactDateTime(getVisitReferenceDate(visit)),
      sortDate: getVisitReferenceDate(visit),
      onClick: () => navigate(`/nurse/visit/${patient.id}/summary`, { state: { visitId: visit.id } }),
    } satisfies ClinicalArtifact)),
    ...woundHistory.slice(0, 2).map((assessment) => ({
      id: `wound-${assessment.id}`,
      name: `Évaluation de plaie — ${assessment.woundLabel}`,
      typeLabel: 'Plaie',
      variant: 'red',
      dateLabel: formatCompactDateTime(assessment.recordedAt),
      sortDate: assessment.recordedAt,
      onClick: () => navigate(`/nurse/wounds/${patient.id}`),
    } satisfies ClinicalArtifact)),
    ...(activeHadCarePlan && activeHadEpisode ? [{
      id: `had-care-plan-${activeHadCarePlan.id}`,
      name: `Plan HAD — ${activeHadCarePlan.summary}`,
      typeLabel: 'Plan HAD',
      variant: getCarePlanStatusVariant(activeHadCarePlan.status),
      dateLabel: formatCompactDateTime(activeHadCarePlan.approvedAt ?? activeHadCarePlan.createdAt),
      sortDate: activeHadCarePlan.approvedAt ?? activeHadCarePlan.createdAt,
      onClick: () => navigate(`/nurse/had/${activeHadEpisode.id}`),
    } satisfies ClinicalArtifact] : []),
    ...(belrai?.persistenceMode === 'supabase' ? [{
      id: `belrai-${patient.id}`,
      name: 'Synthèse BelRAI Twin',
      typeLabel: 'BelRAI',
      variant: belrai.statusTone,
      dateLabel: formatCompactDateTime(belrai.draft.updatedAt),
      sortDate: belrai.draft.updatedAt,
      onClick: () => navigate(`/nurse/belrai/${patient.id}`),
    } satisfies ClinicalArtifact] : []),
  ].sort((left, right) => new Date(right.sortDate).getTime() - new Date(left.sortDate).getTime());
  const isPlanContextLoading = isBelraiLoading || isHadEpisodesLoading || (Boolean(activeHadEpisode?.id) && isHadDetailLoading);

  const handleRefreshClinicalContext = () => {
    void refetchVisitHistory();
    void refetchWoundHistory();
    void refetchBelrai();
    void refetchHadEpisodes();
    if (activeHadEpisode?.id) {
      void refetchHadDetail();
    }
  };

  const tabs = [
    {
      label: 'Informations',
      content: (
        <div className="space-y-4">
          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Identité</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={<Hash className="h-4 w-4" />} label="NISS" value={patient.niss} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Né(e) le" value={`${patient.dateOfBirth} (${age} ans)`} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={patient.phone} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adresse" value={`${patient.address.street} ${patient.address.houseNumber}, ${patient.address.postalCode} ${patient.address.city}`} />
            </div>
          </Card>


          {/* Medical */}
          <Card>
            <CardHeader>
              <CardTitle>Données médicales</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <InfoRow icon={<Shield className="h-4 w-4" />} label="Mutualité" value={`${patient.mutuality} (${patient.mutualityNumber})`} />
              <InfoRow icon={<Stethoscope className="h-4 w-4" />} label="Médecin" value={patient.prescribingDoctor} />
              {patient.katzCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] w-20">Katz</span>
                  <Badge variant={patient.katzCategory === 'O' ? 'outline' : patient.katzCategory === 'Cd' ? 'red' : 'blue'}>
                    Catégorie {patient.katzCategory} — Score {patient.katzScore}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Allergies */}
          {patient.allergies.length > 0 && (
            <Card className="border-mc-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle>
                  <AlertTriangle className="h-4 w-4 text-mc-red-500 inline mr-2" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((a) => (
                  <Badge key={a} variant="red">{a}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Pathologies */}
          <Card>
            <CardHeader>
              <CardTitle>Pathologies actives</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {patient.pathologies.map((p) => (
                <Badge key={p} variant="outline">{p}</Badge>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      label: 'Soins',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan de soins actif</CardTitle>
              <Badge variant={activeHadCarePlan ? getCarePlanStatusVariant(activeHadCarePlan.status) : belraiSuggestions.length > 0 ? 'blue' : 'outline'} dot>
                {activeHadCarePlan ? formatStatusLabel(activeHadCarePlan.status) : belraiSuggestions.length > 0 ? 'BelRAI' : 'À structurer'}
              </Badge>
            </CardHeader>
            {activeHadCarePlan ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getCarePlanStatusVariant(activeHadCarePlan.status)}>
                      {formatStatusLabel(activeHadCarePlan.status)}
                    </Badge>
                    <Badge variant="outline">{activeHadCarePlan.protocolSlug}</Badge>
                    {activeHadEpisode && <Badge variant="blue">{activeHadEpisode.reference}</Badge>}
                  </div>
                  <p className="font-medium">{activeHadCarePlan.summary}</p>
                  {activeHadCarePlan.nextReviewAt && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Révision prévue le {formatDateTime(activeHadCarePlan.nextReviewAt)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard icon={<Pill className="h-4 w-4 text-mc-blue-500" />} label="Médicaments" value={String(hadEpisodeDetail?.medicationOrders.length ?? 0)} />
                  <MetricCard icon={<Clock className="h-4 w-4 text-mc-amber-500" />} label="Visites HAD" value={String(hadEpisodeDetail?.visits.length ?? 0)} />
                  <MetricCard icon={<Activity className="h-4 w-4 text-mc-green-500" />} label="Tâches" value={String(hadEpisodeDetail?.tasks.length ?? 0)} />
                </div>
                {activeHadEpisode && (
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/nurse/had/${activeHadEpisode.id}`)}>
                    Ouvrir l’épisode HAD
                  </Button>
                )}
              </div>
            ) : belraiSuggestions.length > 0 ? (
              <div className="space-y-2">
                {belraiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-xl bg-[var(--bg-tertiary)] p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{suggestion.title}</p>
                      <Badge variant={suggestion.tone}>{suggestion.linkedCap}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{suggestion.detail}</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate(`/nurse/care-plan?patientId=${patient.id}`)}>
                  Ouvrir le plan de soins
                </Button>
              </div>
            ) : careHighlights.length > 0 ? (
              <div className="space-y-2">
                {careHighlights.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.onClick?.()}
                    className="w-full text-left"
                    disabled={!item.onClick}
                  >
                    <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{item.detail}</p>
                        </div>
                        <Badge variant={item.badgeVariant}>{item.badgeLabel}</Badge>
                      </div>
                    </div>
                  </button>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate(`/nurse/care-plan?patientId=${patient.id}`)}>
                  Structurer un plan de soins
                </Button>
              </div>
            ) : isPlanContextLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement du plan de soins structuré…</p>
            ) : hadEpisodesError || hadDetailError || belraiError ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Le contexte structuré de soins n’a pas pu être chargé.
                </p>
                <Button variant="outline" onClick={handleRefreshClinicalContext}>
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Aucun plan de soins structuré n’est encore persistant pour ce patient.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/nurse/care-plan?patientId=${patient.id}`)}>
                  Ouvrir le plan de soins
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traitements et protocoles</CardTitle>
            </CardHeader>
            {medicationOrders.length > 0 ? (
              <div className="space-y-2">
                {medicationOrders.map((order) => (
                  <div key={order.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="text-sm min-w-0">
                      <p className="font-medium truncate">{order.medicationName} — {order.dose}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {order.route} • {order.frequency}
                        {order.nextDueAt ? ` • prochaine administration ${formatDateTime(order.nextDueAt)}` : ''}
                      </p>
                      {order.administrationInstructions && (
                        <p className="text-xs text-[var(--text-muted)] truncate">{order.administrationInstructions}</p>
                      )}
                    </div>
                    <Badge variant={getMedicationOrderVariant(order.status)}>
                      {formatStatusLabel(order.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : careHighlights.length > 0 ? (
              <div className="space-y-2">
                {careHighlights.map((item) => (
                  <button
                    key={`protocol-${item.id}`}
                    type="button"
                    onClick={() => item.onClick?.()}
                    className="w-full text-left"
                    disabled={!item.onClick}
                  >
                    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
                      <div className="text-sm min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{item.detail}</p>
                      </div>
                      <Badge variant={item.badgeVariant}>{item.badgeLabel}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : isHadEpisodesLoading || isHadDetailLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement des traitements structurés…</p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Aucun ordre thérapeutique structuré n’est encore disponible dans les données persistées.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts de coordination</CardTitle>
            </CardHeader>
            {coordinationContacts.length > 0 ? (
              <div className="space-y-2">
                {coordinationContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between py-1.5 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        {contact.badgeLabel && contact.badgeVariant && (
                          <Badge variant={contact.badgeVariant}>{contact.badgeLabel}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {contact.role}
                        {contact.phone ? ` • ${contact.phone}` : ' • téléphone non renseigné'}
                      </p>
                    </div>
                    {contact.phone && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(`tel:${contact.phone}`)}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : isHadEpisodesLoading || isHadDetailLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement des contacts cliniques…</p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Aucun contact de coordination supplémentaire n’est encore disponible dans les données partagées.
              </p>
            )}
          </Card>
        </div>
      ),
    },
    {
      label: 'Paramètres',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Derniers paramètres vitaux</CardTitle>
              <Badge variant="outline">{latestVisit ? formatDate(getVisitReferenceDate(latestVisit)) : 'Aucune visite'}</Badge>
            </CardHeader>
            {visitHistoryError ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Les paramètres persistés n’ont pas pu être chargés.
                </p>
                <Button variant="outline" onClick={() => refetchVisitHistory()}>
                  Réessayer
                </Button>
              </div>
            ) : isVisitHistoryLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement des paramètres vitaux…</p>
            ) : latestVitals.length > 0 && latestVisit ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {latestVitals.map((vital) => (
                    <VitalCard key={vital.label} label={vital.label} value={vital.value} unit={vital.unit} alert={vital.alert} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/nurse/visit/${patient.id}/summary`, { state: { visitId: latestVisit.id } })}
                  className="w-full text-left mt-3 pt-3 border-t border-[var(--border-subtle)]"
                >
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Dernière visite liée</p>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{summarizeVisitActs(latestVisit)}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {formatDate(getVisitReferenceDate(latestVisit))} • {formatVisitWindow(latestVisit)} • {latestVisit.nurseName ?? 'Infirmier·ère non renseigné·e'}
                      </p>
                    </div>
                    <Badge variant={getVisitStatusVariant(latestVisit.status)}>
                      {getVisitStatusLabel(latestVisit.status)}
                    </Badge>
                  </div>
                </button>
              </>
            ) : latestVisit ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  La dernière visite persistée ne contient pas encore de paramètres vitaux encodés.
                </p>
                <Button variant="outline" onClick={() => navigate(`/nurse/visit/${patient.id}/summary`, { state: { visitId: latestVisit.id } })}>
                  Voir le résumé de visite
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Aucun paramètre vital n’a encore été enregistré pour ce patient.
                </p>
                <Button variant="outline" onClick={() => navigate(`/nurse/visit/${patient.id}`)}>
                  Démarrer une visite
                </Button>
              </div>
            )}
          </Card>

          {hasWoundTracking && (
            <Card>
              <CardHeader>
                <CardTitle>Dernière évaluation de plaie</CardTitle>
                <Badge variant={latestWoundAssessment ? latestWoundTrend.variant : 'outline'}>
                  {latestWoundAssessment ? latestWoundTrend.label : 'À initier'}
                </Badge>
              </CardHeader>
              {woundHistoryError ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)]">
                    Les évaluations persistées de la plaie n’ont pas pu être chargées.
                  </p>
                  <Button variant="outline" onClick={() => refetchWoundHistory()}>
                    Réessayer
                  </Button>
                </div>
              ) : isWoundHistoryLoading ? (
                <p className="text-sm text-[var(--text-muted)]">Chargement du suivi de plaie…</p>
              ) : latestWoundAssessment ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{latestWoundAssessment.woundLabel}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDateTime(latestWoundAssessment.recordedAt)} • {bodyZoneLabels[latestWoundAssessment.zoneId] ?? latestWoundAssessment.zoneId}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      {latestWoundTrend.icon}
                      {latestWoundTrend.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard icon={<Ruler className="h-4 w-4 text-mc-blue-500" />} label="Dimensions" value={formatWoundDimensions(latestWoundAssessment)} />
                    <MetricCard icon={<Droplets className="h-4 w-4 text-mc-blue-500" />} label="Exsudat" value={exudateLabels[latestWoundAssessment.exudateLevel] ?? latestWoundAssessment.exudateLevel} />
                    <MetricCard icon={<Heart className="h-4 w-4 text-mc-red-500" />} label="Douleur" value={latestWoundAssessment.pain !== undefined ? `${latestWoundAssessment.pain}/10` : '—'} />
                    <MetricCard icon={<Activity className="h-4 w-4 text-mc-green-500" />} label="Tissu" value={tissueTypeLabels[latestWoundAssessment.tissueType] ?? latestWoundAssessment.tissueType} />
                  </div>
                  {latestWoundAssessment.notes && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {latestWoundAssessment.notes}
                    </p>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/nurse/wounds/${patient.id}`)}>
                    Ouvrir le suivi de plaie
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)]">
                    Aucun relevé de plaie persistant n’a encore été enregistré pour ce patient.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/nurse/wounds/${patient.id}`)}>
                    Créer un premier relevé
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      ),
    },
    {
      label: 'Historique',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visites récentes</CardTitle>
              <Badge variant="blue">{visitHistory.length}</Badge>
            </CardHeader>
            {visitHistoryError ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  L’historique des visites persistées n’a pas pu être chargé.
                </p>
                <Button variant="outline" onClick={() => refetchVisitHistory()}>
                  Réessayer
                </Button>
              </div>
            ) : isVisitHistoryLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement de l’historique des visites…</p>
            ) : visitHistory.length > 0 ? (
              <div className="space-y-2">
                {visitHistory.map((visit) => (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => navigate(`/nurse/visit/${patient.id}/summary`, { state: { visitId: visit.id } })}
                    className="w-full text-left"
                  >
                    <Card hover padding="sm" className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-mc-blue-50 dark:bg-mc-blue-900/30 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-mc-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{summarizeVisitActs(visit)}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {formatDate(getVisitReferenceDate(visit))} • {formatVisitWindow(visit)} • {visit.nurseName ?? 'Infirmier·ère non renseigné·e'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={getVisitStatusVariant(visit.status)}>
                            {getVisitStatusLabel(visit.status)}
                          </Badge>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {visit.totalW.toFixed(3)}W
                          </span>
                        </div>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Aucune visite persistée n’est encore disponible pour ce patient.
                </p>
                <Button variant="outline" onClick={() => navigate(`/nurse/visit/${patient.id}`)}>
                  Démarrer une visite
                </Button>
              </div>
            )}
          </Card>

          {hasWoundTracking && (
            <Card>
              <CardHeader>
                <CardTitle>Évolution de plaie</CardTitle>
                <Badge variant="outline">
                  {woundHistory.length} relevé{woundHistory.length > 1 ? 's' : ''}
                </Badge>
              </CardHeader>
              {woundHistoryError ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)]">
                    L’historique persistant de la plaie n’a pas pu être chargé.
                  </p>
                  <Button variant="outline" onClick={() => refetchWoundHistory()}>
                    Réessayer
                  </Button>
                </div>
              ) : isWoundHistoryLoading ? (
                <p className="text-sm text-[var(--text-muted)]">Chargement de l’historique de plaie…</p>
              ) : woundHistory.length > 0 ? (
                <div className="space-y-2">
                  {woundHistory.slice(0, 5).map((assessment, index) => {
                    const trend = getWoundTrend(assessment, woundHistory[index + 1]);

                    return (
                      <button
                        key={assessment.id}
                        type="button"
                        onClick={() => navigate(`/nurse/wounds/${patient.id}`)}
                        className="w-full text-left"
                      >
                        <Card hover padding="sm" className="cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-mc-green-50 dark:bg-mc-green-900/30 flex items-center justify-center">
                              <Heart className="h-5 w-5 text-mc-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{assessment.woundLabel}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">
                                {formatDateTime(assessment.recordedAt)} • {bodyZoneLabels[assessment.zoneId] ?? assessment.zoneId}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] truncate">
                                {formatWoundDimensions(assessment)} • {exudateLabels[assessment.exudateLevel] ?? assessment.exudateLevel}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={trend.variant}>{trend.label}</Badge>
                              <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                {trend.icon}
                                {assessment.pain !== undefined ? `${assessment.pain}/10` : 'Douleur —'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)]">
                    Aucun historique de plaie persistant n’est encore disponible.
                  </p>
                  <Button variant="outline" onClick={() => navigate(`/nurse/wounds/${patient.id}`)}>
                    Ouvrir le suivi de plaie
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      ),
    },
    {
      label: 'Documents',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pièces cliniques disponibles</CardTitle>
              <Badge variant="outline">{clinicalArtifacts.length}</Badge>
            </CardHeader>
            {clinicalArtifacts.length > 0 ? (
              <div className="space-y-2">
                {clinicalArtifacts.map((artifact) => (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => artifact.onClick?.()}
                    className="w-full text-left"
                    disabled={!artifact.onClick}
                  >
                    <Card hover padding="sm" className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${getArtifactSurfaceClasses(artifact.variant)}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{artifact.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {artifact.typeLabel} • {artifact.dateLabel}
                          </p>
                        </div>
                        <Badge variant={artifact.variant}>{artifact.typeLabel}</Badge>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            ) : isVisitHistoryLoading || isWoundHistoryLoading || isBelraiLoading || isHadEpisodesLoading || isHadDetailLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement des pièces cliniques…</p>
            ) : visitHistoryError || woundHistoryError || belraiError || hadEpisodesError || hadDetailError ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Les pièces cliniques n’ont pas pu être consolidées depuis les données persistées.
                </p>
                <Button variant="outline" onClick={handleRefreshClinicalContext}>
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Aucune pièce clinique persistée n’est encore disponible pour ce patient.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/nurse/visit/${patient.id}`)}>
                    Démarrer une visite
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/nurse/belrai/${patient.id}`)}>
                    Ouvrir BelRAI
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/nurse/patients')}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Patient hero header */}
      <GradientHeader
        icon={
          <Avatar name={`${patient.firstName} ${patient.lastName}`} size="md" />
        }
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={`${age} ans • ${patient.gender === 'F' ? 'Femme' : 'Homme'} • NISS: ${patient.niss}`}
        badge={
          <div className="flex flex-col items-end gap-1">
            {patient.katzCategory && (
              <Badge variant={patient.katzCategory === 'Cd' ? 'red' : 'blue'}>
                Katz {patient.katzCategory}
              </Badge>
            )}
            {patient.allergies.length > 0 && (
              <Badge variant="red" dot>
                {patient.allergies.length} allergie(s)
              </Badge>
            )}
          </div>
        }
      >
        {/* Quick actions inside hero */}
        <div className="flex gap-2 mt-1">
          <Button variant="outline" size="sm" className="flex-1 bg-white/15 border-white/20 text-white hover:bg-white/25" onClick={() => window.open(`tel:${patient.phone}`)}>
            <Phone className="h-4 w-4" />
            Appeler
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-white/15 border-white/20 text-white hover:bg-white/25">
            <Navigation className="h-4 w-4" />
            Itinéraire
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-white/20 border-white/25 text-white hover:bg-white/30 font-semibold" onClick={() => navigate(`/nurse/visit/${patient.id}`)}>
            <Stethoscope className="h-4 w-4" />
            Visite
          </Button>
        </div>
      </GradientHeader>
      <QuickPatientActions patient={patient} />
      <SmartVisitBriefingCard patientRouteId={patient.id} />
      <BelRAILiveCard patient={patient} />

      {/* Tabs */}
      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}

// ── Sub-components ──

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[var(--text-muted)] mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]">
      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
        {icon}
        <p className="text-[10px]">{label}</p>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function VitalCard({ label, value, unit, alert }: { label: string; value: string; unit: string; alert?: boolean }) {
  return (
    <div className={`p-3 rounded-xl ${alert ? 'bg-mc-red-50 dark:bg-red-900/20 border border-mc-red-200 dark:border-red-800' : 'bg-[var(--bg-tertiary)]'}`}>
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className={`text-lg font-bold ${alert ? 'text-mc-red-500' : ''}`}>
        {value}
        <span className="text-xs font-normal text-[var(--text-muted)] ml-1">{unit}</span>
      </p>
    </div>
  );
}
