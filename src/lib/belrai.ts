import type { Patient } from '@/lib/patients';

export type BelraiTone = 'blue' | 'green' | 'amber' | 'red';
export type BelraiPriority = 'low' | 'medium' | 'high';
export type BelraiDraftStatus =
  | 'draft'
  | 'in_review'
  | 'ready_for_sync'
  | 'synced'
  | 'sync_error';
export type BelraiSyncStatus = 'local_only' | 'queued' | 'processing' | 'synced' | 'error';
export type BelraiPersistenceMode = 'local' | 'supabase';

export interface BelraiOption {
  value: number;
  label: string;
}

export interface BelraiItem {
  id: string;
  sectionId: string;
  code: string;
  label: string;
  description: string;
  options: BelraiOption[];
  critical?: boolean;
}

export interface BelraiSection {
  id: string;
  title: string;
  icon: string;
  items: BelraiItem[];
}

export type BelraiEvidenceSource =
  | 'patient_profile'
  | 'clinical_history'
  | 'care_plan'
  | 'questionnaire'
  | 'schedule'
  | 'manual';

export interface BelraiEvidence {
  id: string;
  source: BelraiEvidenceSource;
  sourceLabel: string;
  summary: string;
  observedAt: string;
  confidence: number;
}

export interface BelraiSuggestedAnswer {
  value: number;
  label: string;
  confidence: number;
  rationale: string;
  evidence: BelraiEvidence[];
  tone: BelraiTone;
}

export interface StoredBelraiDraft {
  assessmentId: string;
  patientId: string;
  status: BelraiDraftStatus;
  syncStatus: BelraiSyncStatus;
  storage: BelraiPersistenceMode;
  answers: Record<string, number>;
  confirmedItemIds: string[];
  reviewNote: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface BelraiKatzEstimate {
  category: 'O' | 'A' | 'B' | 'C' | 'Cd';
  forfait: string;
  description: string;
  color: BelraiTone;
  total: number;
}

export interface BelraiScoreCard {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: BelraiTone;
}

export interface BelraiCap {
  id: string;
  title: string;
  detail: string;
  priority: BelraiPriority;
  tone: BelraiTone;
  rationale: string;
  linkedDiagnosis: string;
  suggestedInterventions: string[];
}

export interface BelraiCarePlanSuggestion {
  id: string;
  title: string;
  linkedCap: string;
  detail: string;
  diagnosisCode: string;
  interventions: string[];
  outcomes: string[];
  tone: BelraiTone;
}

export interface BelraiTwinSnapshot {
  patient: Patient;
  sections: BelraiSection[];
  draft: StoredBelraiDraft;
  suggestedAnswers: Record<string, BelraiSuggestedAnswer>;
  katz: BelraiKatzEstimate;
  scores: BelraiScoreCard[];
  caps: BelraiCap[];
  carePlanSuggestions: BelraiCarePlanSuggestion[];
  progress: {
    answeredItems: number;
    confirmedItems: number;
    totalItems: number;
    percent: number;
  };
  criticalMissingItems: BelraiItem[];
  dueDate: string;
  lastUpdatedLabel: string;
  statusLabel: string;
  statusTone: BelraiTone;
  syncLabel: string;
  persistenceMode: BelraiPersistenceMode;
  persistenceLabel: string;
  readyToSync: boolean;
  nextAction: string;
}

const belraiStoragePrefix = 'mc-belrai-draft:';
const offlineClinicalQueueEvent = 'mc-offline-clinical-queue';
const dateFormatter = new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const belraiSections: BelraiSection[] = [
  {
    id: 'cognition',
    title: 'A — Cognition',
    icon: '🧠',
    items: [
      {
        id: 'cps1',
        sectionId: 'cognition',
        code: 'A.1',
        label: 'Capacité de prise de décision quotidienne',
        description: 'Capacité du patient à prendre des décisions concernant les tâches de la vie quotidienne.',
        critical: true,
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Difficulté occasionnelle' },
          { value: 2, label: '2 — Aide limitée' },
          { value: 3, label: '3 — Aide modérée' },
          { value: 4, label: '4 — Aide importante' },
          { value: 5, label: '5 — Aucune capacité' },
        ],
      },
      {
        id: 'cps2',
        sectionId: 'cognition',
        code: 'A.2',
        label: 'Mémoire à court terme',
        description: 'Capacité de se souvenir d’événements récents.',
        options: [
          { value: 0, label: '0 — Mémoire intacte' },
          { value: 1, label: '1 — Problème de mémoire' },
        ],
      },
      {
        id: 'cps3',
        sectionId: 'cognition',
        code: 'A.3',
        label: 'Compréhension',
        description: 'Capacité de comprendre les autres en communication verbale.',
        options: [
          { value: 0, label: '0 — Comprend' },
          { value: 1, label: '1 — Comprend généralement' },
          { value: 2, label: '2 — Comprend souvent' },
          { value: 3, label: '3 — Comprend parfois' },
          { value: 4, label: '4 — Comprend rarement/jamais' },
        ],
      },
    ],
  },
  {
    id: 'adl',
    title: 'B — Activités de la Vie Quotidienne',
    icon: '🚶',
    items: [
      {
        id: 'adl1',
        sectionId: 'adl',
        code: 'B.1',
        label: 'Se laver',
        description: 'Capacité à se laver entièrement.',
        critical: true,
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Surveillance' },
          { value: 2, label: '2 — Aide limitée' },
          { value: 3, label: '3 — Aide importante' },
          { value: 4, label: '4 — Dépendance totale' },
        ],
      },
      {
        id: 'adl2',
        sectionId: 'adl',
        code: 'B.2',
        label: 'S’habiller',
        description: 'Capacité à s’habiller pour la partie supérieure et inférieure du corps.',
        critical: true,
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Surveillance' },
          { value: 2, label: '2 — Aide limitée' },
          { value: 3, label: '3 — Aide importante' },
          { value: 4, label: '4 — Dépendance totale' },
        ],
      },
      {
        id: 'adl3',
        sectionId: 'adl',
        code: 'B.3',
        label: 'Locomotion à l’intérieur',
        description: 'Déplacement dans le lieu de résidence.',
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Surveillance' },
          { value: 2, label: '2 — Aide limitée' },
          { value: 3, label: '3 — Aide importante' },
          { value: 4, label: '4 — Dépendance totale' },
          { value: 8, label: '8 — N’a pas lieu' },
        ],
      },
      {
        id: 'adl4',
        sectionId: 'adl',
        code: 'B.4',
        label: 'Transfert',
        description: 'Se déplacer entre les surfaces, lit et chaise.',
        critical: true,
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Surveillance' },
          { value: 2, label: '2 — Aide limitée' },
          { value: 3, label: '3 — Aide importante' },
          { value: 4, label: '4 — Dépendance totale' },
        ],
      },
      {
        id: 'adl5',
        sectionId: 'adl',
        code: 'B.5',
        label: 'Continence urinaire',
        description: 'Contrôle de la vessie.',
        critical: true,
        options: [
          { value: 0, label: '0 — Continent' },
          { value: 1, label: '1 — Habituellement continent' },
          { value: 2, label: '2 — Occasionnellement incontinent' },
          { value: 3, label: '3 — Fréquemment incontinent' },
          { value: 4, label: '4 — Incontinent' },
        ],
      },
    ],
  },
  {
    id: 'mood',
    title: 'C — Humeur et comportement',
    icon: '😔',
    items: [
      {
        id: 'mood1',
        sectionId: 'mood',
        code: 'C.1',
        label: 'Tristesse / dépression',
        description: 'Expressions de tristesse, de désespoir ou affect triste.',
        options: [
          { value: 0, label: '0 — Absent' },
          { value: 1, label: '1 — Présent hors 3 derniers jours' },
          { value: 2, label: '2 — Présent 1 à 2 jours' },
          { value: 3, label: '3 — Présent chaque jour' },
        ],
      },
      {
        id: 'mood2',
        sectionId: 'mood',
        code: 'C.2',
        label: 'Anxiété',
        description: 'Expressions d’inquiétude, de peur ou d’agitation.',
        options: [
          { value: 0, label: '0 — Absent' },
          { value: 1, label: '1 — Présent hors 3 derniers jours' },
          { value: 2, label: '2 — Présent 1 à 2 jours' },
          { value: 3, label: '3 — Présent chaque jour' },
        ],
      },
    ],
  },
  {
    id: 'iavq',
    title: 'D — Activités instrumentales',
    icon: '🍳',
    items: [
      {
        id: 'iavq1',
        sectionId: 'iavq',
        code: 'D.1',
        label: 'Préparation des repas',
        description: 'Planifier et préparer les repas.',
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Aide à la préparation' },
          { value: 2, label: '2 — Dépendance totale' },
        ],
      },
      {
        id: 'iavq2',
        sectionId: 'iavq',
        code: 'D.2',
        label: 'Gestion des médicaments',
        description: 'Capacité à gérer ses propres médicaments.',
        critical: true,
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Rappels nécessaires' },
          { value: 2, label: '2 — Administration par autrui' },
        ],
      },
      {
        id: 'iavq3',
        sectionId: 'iavq',
        code: 'D.3',
        label: 'Gestion financière',
        description: 'Gestion des finances personnelles.',
        options: [
          { value: 0, label: '0 — Indépendant' },
          { value: 1, label: '1 — Aide nécessaire' },
          { value: 2, label: '2 — Dépendance totale' },
        ],
      },
    ],
  },
];

const belraiItems = belraiSections.flatMap((section) => section.items);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatPatientText(patient: Patient) {
  return [
    patient.pathologies.join(' '),
    patient.notes ?? '',
    patient.prescribingDoctor,
    patient.mutuality,
  ]
    .join(' ')
    .toLowerCase();
}

function hasAnySignal(patient: Patient, keywords: string[]) {
  const haystack = formatPatientText(patient);
  return keywords.some((keyword) => haystack.includes(keyword));
}

function getAge(patient: Patient) {
  const birthDate = new Date(patient.dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function mapKatzSeverity(category?: Patient['katzCategory']) {
  switch (category) {
    case 'A':
      return 1;
    case 'B':
      return 2;
    case 'C':
      return 3;
    case 'Cd':
      return 4;
    default:
      return 0;
  }
}

function getKatzProfile(category: BelraiKatzEstimate['category']) {
  switch (category) {
    case 'O':
      return {
        forfait: 'Pas de forfait',
        description: 'Autonomie préservée ou dépendance faible.',
        color: 'green' as const,
      };
    case 'A':
      return {
        forfait: 'Forfait A',
        description: 'Dépendance légère nécessitant une aide ponctuelle.',
        color: 'blue' as const,
      };
    case 'B':
      return {
        forfait: 'Forfait B',
        description: 'Dépendance modérée avec plusieurs AVQ concernées.',
        color: 'amber' as const,
      };
    case 'C':
      return {
        forfait: 'Forfait C',
        description: 'Dépendance sévère sur les soins d’hygiène et les transferts.',
        color: 'amber' as const,
      };
    case 'Cd':
      return {
        forfait: 'Forfait C-démence',
        description: 'Dépendance sévère avec atteinte cognitive marquée.',
        color: 'red' as const,
      };
  }
}

function getObservedAt(patient: Patient) {
  return patient.lastVisit ?? patient.nextVisit ?? patient.createdAt ?? new Date().toISOString();
}

function createEvidence(
  id: string,
  source: BelraiEvidenceSource,
  sourceLabel: string,
  summary: string,
  observedAt: string,
  confidence: number
): BelraiEvidence {
  return {
    id,
    source,
    sourceLabel,
    summary,
    observedAt,
    confidence,
  };
}

function getKatzEvidence(patient: Patient, confidence: number) {
  return createEvidence(
    'katz',
    'patient_profile',
    'Historique Katz',
    patient.katzCategory
      ? `Katz actuel ${patient.katzCategory}${patient.katzScore ? ` · score ${patient.katzScore}` : ''}.`
      : 'Aucun Katz documenté localement.',
    getObservedAt(patient),
    confidence
  );
}

function getPathologyEvidence(patient: Patient, confidence: number) {
  return createEvidence(
    'pathologies',
    'clinical_history',
    'Pathologies actives',
    patient.pathologies.length > 0
      ? patient.pathologies.join(' · ')
      : 'Aucun antécédent structuré exploitable dans le dossier courant.',
    getObservedAt(patient),
    confidence
  );
}

function getScheduleEvidence(patient: Patient, confidence: number) {
  return createEvidence(
    'schedule',
    'schedule',
    'Cadence de suivi',
    patient.nextVisit
      ? `Une prochaine visite est planifiée pour le ${formatBelraiDateTime(patient.nextVisit)}.`
      : 'Aucune prochaine visite n’est encore planifiée dans le brouillon local.',
    patient.nextVisit ?? getObservedAt(patient),
    confidence
  );
}

function getCarePlanEvidence(patient: Patient, confidence: number) {
  return createEvidence(
    'care-plan',
    'care_plan',
    'Contexte de soins',
    patient.pathologies.length > 2
      ? 'Le volume de pathologies et la chronicité des soins suggèrent une aide structurée.'
      : 'Le contexte de soins actuel reste compatible avec une autonomie partielle.',
    getObservedAt(patient),
    confidence
  );
}

function getQuestionnaireEvidence(patient: Patient, confidence: number) {
  return createEvidence(
    'questionnaire',
    'questionnaire',
    'Apports patient / entourage',
    patient.phone
      ? 'Des micro-questions patient/entourage peuvent compléter les zones d’incertitude restantes.'
      : 'Aucun signal patient autonome n’est encore consolidé dans la phase locale.',
    getObservedAt(patient),
    confidence
  );
}

function toneFromConfidence(confidence: number): BelraiTone {
  if (confidence >= 0.85) {
    return 'green';
  }

  if (confidence >= 0.72) {
    return 'blue';
  }

  if (confidence >= 0.58) {
    return 'amber';
  }

  return 'red';
}

function getOptionLabel(item: BelraiItem, value: number) {
  return item.options.find((option) => option.value === value)?.label ?? String(value);
}

function inferSuggestedAnswer(patient: Patient, item: BelraiItem): BelraiSuggestedAnswer {
  const age = getAge(patient);
  const katzSeverity = mapKatzSeverity(patient.katzCategory);
  const hasDementia = hasAnySignal(patient, ['démence', 'demence', 'alzheimer']);
  const hasStroke = hasAnySignal(patient, ['avc']);
  const hasMobilityIssue = hasAnySignal(patient, ['avc', 'prothèse', 'prothese', 'hanche', 'ostéoporose', 'bpco']);
  const hasWound = hasAnySignal(patient, ['ulcère', 'ulcere', 'plaie', 'escarre']);
  const hasDiabetes = hasAnySignal(patient, ['diabète', 'diabete', 'insuline', 'glyc']);
  const hasCardioRespiratoryIssue = hasAnySignal(patient, ['insuffisance cardiaque', 'bpco']);

  let value = 0;
  let confidence = 0.62;
  let rationale = 'Compléter la réponse avec l’équipe soignante pour confirmer la proposition.';
  let evidence = [getKatzEvidence(patient, confidence), getPathologyEvidence(patient, confidence)];

  switch (item.id) {
    case 'cps1':
      value = hasDementia ? 4 : hasStroke ? 2 : Math.max(1, katzSeverity - 1);
      confidence = hasDementia ? 0.9 : hasStroke ? 0.78 : 0.66;
      rationale = hasDementia
        ? 'La présence de troubles cognitifs documentés justifie une aide importante pour la décision quotidienne.'
        : 'Le niveau d’autonomie actuel suggère une vigilance sur la prise de décision quotidienne.';
      evidence = [getPathologyEvidence(patient, confidence), getKatzEvidence(patient, confidence)];
      break;
    case 'cps2':
      value = hasDementia ? 1 : 0;
      confidence = hasDementia ? 0.92 : 0.68;
      rationale = hasDementia
        ? 'Le dossier clinique contient des éléments compatibles avec un trouble de mémoire récente.'
        : 'Aucun élément fort du dossier ne suggère une atteinte de la mémoire récente.';
      evidence = [getPathologyEvidence(patient, confidence), getQuestionnaireEvidence(patient, confidence)];
      break;
    case 'cps3':
      value = hasDementia ? 2 : hasStroke ? 2 : katzSeverity >= 3 ? 1 : 0;
      confidence = hasDementia || hasStroke ? 0.82 : 0.64;
      rationale = hasDementia || hasStroke
        ? 'Les antécédents neurologiques justifient de revalider la compréhension active du patient.'
        : 'Le dossier local ne montre pas de trouble majeur de compréhension.';
      evidence = [getPathologyEvidence(patient, confidence), getScheduleEvidence(patient, confidence)];
      break;
    case 'adl1':
      value = clamp(katzSeverity, 0, 4);
      confidence = patient.katzCategory ? 0.93 : 0.69;
      rationale = 'Le Katz actuel est le meilleur signal local pour estimer l’aide à la toilette.';
      evidence = [getKatzEvidence(patient, confidence), getCarePlanEvidence(patient, confidence)];
      break;
    case 'adl2':
      value = katzSeverity >= 3 ? 3 : Math.max(0, katzSeverity - 1);
      confidence = patient.katzCategory ? 0.88 : 0.66;
      rationale = 'Le niveau de dépendance déjà observé suggère une aide au moins partielle pour l’habillage.';
      evidence = [getKatzEvidence(patient, confidence), getCarePlanEvidence(patient, confidence)];
      break;
    case 'adl3':
      value = hasMobilityIssue ? Math.min(4, Math.max(2, katzSeverity)) : Math.max(0, katzSeverity - 1);
      confidence = hasMobilityIssue ? 0.84 : 0.68;
      rationale = hasMobilityIssue
        ? 'Les signaux de mobilité réduite justifient un dépistage prioritaire de la locomotion.'
        : 'Aucune limitation locomotrice majeure n’est visible hors Katz courant.';
      evidence = [getPathologyEvidence(patient, confidence), getScheduleEvidence(patient, confidence)];
      break;
    case 'adl4':
      value = hasMobilityIssue ? Math.min(4, Math.max(2, katzSeverity)) : Math.max(0, katzSeverity - 1);
      confidence = hasMobilityIssue ? 0.85 : 0.67;
      rationale = 'Les transferts sont à confirmer rapidement car ils conditionnent le risque de chute et l’aide requise.';
      evidence = [getPathologyEvidence(patient, confidence), getKatzEvidence(patient, confidence)];
      break;
    case 'adl5':
      value = hasDementia ? 3 : katzSeverity >= 3 ? 2 : age >= 80 ? 1 : 0;
      confidence = hasDementia ? 0.82 : katzSeverity >= 3 ? 0.74 : 0.6;
      rationale = 'Le profil gériatrique et l’autonomie globale suggèrent de revérifier la continence.';
      evidence = [getKatzEvidence(patient, confidence), getQuestionnaireEvidence(patient, confidence)];
      break;
    case 'mood1':
      value = hasWound || hasStroke ? 1 : 0;
      confidence = hasWound || hasStroke ? 0.66 : 0.55;
      rationale = hasWound || hasStroke
        ? 'La chronicité des soins peut majorer un vécu dépressif léger, à confirmer en entretien.'
        : 'Aucun indicateur d’humeur significatif n’est encore consolidé.';
      evidence = [getPathologyEvidence(patient, confidence), getQuestionnaireEvidence(patient, confidence)];
      break;
    case 'mood2':
      value = hasCardioRespiratoryIssue ? 1 : 0;
      confidence = hasCardioRespiratoryIssue ? 0.64 : 0.55;
      rationale = 'Les pathologies respiratoires et cardiaques justifient un dépistage simple de l’anxiété.';
      evidence = [getPathologyEvidence(patient, confidence), getQuestionnaireEvidence(patient, confidence)];
      break;
    case 'iavq1':
      value = katzSeverity >= 3 ? 2 : katzSeverity >= 1 || age >= 80 ? 1 : 0;
      confidence = katzSeverity >= 1 ? 0.76 : 0.6;
      rationale = 'Les difficultés d’AVQ se répercutent généralement sur la préparation des repas.';
      evidence = [getKatzEvidence(patient, confidence), getCarePlanEvidence(patient, confidence)];
      break;
    case 'iavq2':
      value = hasDiabetes || patient.pathologies.length >= 3 ? 2 : katzSeverity >= 1 ? 1 : 0;
      confidence = hasDiabetes ? 0.88 : patient.pathologies.length >= 3 ? 0.78 : 0.62;
      rationale = hasDiabetes
        ? 'Le contexte diabétique et la polymédication suggèrent une administration assistée.'
        : 'Le niveau de complexité clinique suggère de revalider la gestion autonome des médicaments.';
      evidence = [getPathologyEvidence(patient, confidence), getCarePlanEvidence(patient, confidence)];
      break;
    case 'iavq3':
      value = hasDementia || hasStroke ? 2 : age >= 85 || katzSeverity >= 2 ? 1 : 0;
      confidence = hasDementia || hasStroke ? 0.79 : 0.61;
      rationale = 'Les limitations cognitives ou l’autonomie globale peuvent impacter la gestion financière.';
      evidence = [getPathologyEvidence(patient, confidence), getQuestionnaireEvidence(patient, confidence)];
      break;
  }

  return {
    value,
    label: getOptionLabel(item, value),
    confidence,
    rationale,
    evidence,
    tone: toneFromConfidence(confidence),
  };
}

function addDays(baseDate: string | Date, days: number) {
  const value = new Date(baseDate);

  if (Number.isNaN(value.getTime())) {
    return new Date().toISOString();
  }

  value.setDate(value.getDate() + days);
  return value.toISOString();
}

function getAssessmentCadence(patient: Patient) {
  if (patient.katzCategory === 'Cd') {
    return 30;
  }

  if (patient.katzCategory === 'C') {
    return 45;
  }

  return 90;
}

export function formatBelraiDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}

export function formatBelraiDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed);
}

export function createBelraiDraft(patientId: string): StoredBelraiDraft {
  return {
    assessmentId: `local-${patientId}`,
    patientId,
    status: 'draft',
    syncStatus: 'local_only',
    storage: 'local',
    answers: {},
    confirmedItemIds: [],
    reviewNote: '',
    updatedAt: new Date().toISOString(),
  };
}

export function loadStoredBelraiDraft(patientId: string): StoredBelraiDraft {
  if (typeof localStorage === 'undefined') {
    return createBelraiDraft(patientId);
  }

  const raw = localStorage.getItem(`${belraiStoragePrefix}${patientId}`);

  if (!raw) {
    return createBelraiDraft(patientId);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredBelraiDraft>;
    return {
      assessmentId: typeof parsed.assessmentId === 'string' ? parsed.assessmentId : `local-${patientId}`,
      patientId,
      status:
        parsed.status === 'ready_for_sync' ||
        parsed.status === 'in_review' ||
        parsed.status === 'synced' ||
        parsed.status === 'sync_error'
          ? parsed.status
          : 'draft',
      syncStatus:
        parsed.syncStatus === 'queued' ||
        parsed.syncStatus === 'processing' ||
        parsed.syncStatus === 'synced' ||
        parsed.syncStatus === 'error'
          ? parsed.syncStatus
          : 'local_only',
      storage: parsed.storage === 'supabase' ? 'supabase' : 'local',
      answers: typeof parsed.answers === 'object' && parsed.answers ? parsed.answers as Record<string, number> : {},
      confirmedItemIds: Array.isArray(parsed.confirmedItemIds)
        ? parsed.confirmedItemIds.filter((itemId): itemId is string => typeof itemId === 'string')
        : [],
      reviewNote: typeof parsed.reviewNote === 'string' ? parsed.reviewNote : '',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      submittedAt: typeof parsed.submittedAt === 'string' ? parsed.submittedAt : undefined,
    };
  } catch {
    return createBelraiDraft(patientId);
  }
}

function notifyOfflineClinicalQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(offlineClinicalQueueEvent));
  }
}

export function isBelraiDraftPendingSync(draft: Pick<StoredBelraiDraft, 'status' | 'syncStatus'>) {
  return (
    draft.status === 'ready_for_sync' ||
    draft.syncStatus === 'queued' ||
    draft.syncStatus === 'processing' ||
    draft.syncStatus === 'error'
  );
}

export function listStoredBelraiDrafts() {
  if (typeof localStorage === 'undefined') {
    return [] as StoredBelraiDraft[];
  }

  const drafts: StoredBelraiDraft[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith(belraiStoragePrefix)) {
      continue;
    }

    drafts.push(loadStoredBelraiDraft(key.slice(belraiStoragePrefix.length)));
  }

  return drafts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function persistBelraiDraft(
  patientId: string,
  draft: StoredBelraiDraft,
  options?: { preserveUpdatedAt?: boolean }
): StoredBelraiDraft {
  const nextDraft = {
    ...draft,
    patientId,
    updatedAt: options?.preserveUpdatedAt ? draft.updatedAt : new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${belraiStoragePrefix}${patientId}`, JSON.stringify(nextDraft));
    notifyOfflineClinicalQueueChanged();
  }

  return nextDraft;
}

export function markBelraiDraftReady(patientId: string, draft: StoredBelraiDraft): StoredBelraiDraft {
  return persistBelraiDraft(patientId, {
    ...draft,
    status: 'ready_for_sync',
    syncStatus: draft.syncStatus ?? 'local_only',
    submittedAt: new Date().toISOString(),
  });
}

export function resetBelraiDraft(patientId: string): StoredBelraiDraft {
  const nextDraft = createBelraiDraft(patientId);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${belraiStoragePrefix}${patientId}`, JSON.stringify(nextDraft));
    notifyOfflineClinicalQueueChanged();
  }

  return nextDraft;
}

export function applySuggestedAnswers(
  draft: StoredBelraiDraft,
  suggestedAnswers: Record<string, BelraiSuggestedAnswer>
): StoredBelraiDraft {
  const nextAnswers = { ...draft.answers };

  Object.entries(suggestedAnswers).forEach(([itemId, suggestion]) => {
    if (nextAnswers[itemId] === undefined) {
      nextAnswers[itemId] = suggestion.value;
    }
  });

  return {
    ...draft,
    answers: nextAnswers,
    status: 'in_review',
    syncStatus: 'local_only',
    updatedAt: new Date().toISOString(),
  };
}

export function computeKatzFromBelrai(
  answers: Record<string, number>,
  patient?: Patient
): BelraiKatzEstimate {
  const answeredAdlCount = ['adl1', 'adl2', 'adl3', 'adl4', 'adl5'].filter(
    (itemId) => answers[itemId] !== undefined
  ).length;

  if (answeredAdlCount < 2 && patient?.katzCategory) {
    const profile = getKatzProfile(patient.katzCategory);
    return {
      category: patient.katzCategory,
      forfait: profile.forfait,
      description: `${profile.description} Reprise du Katz historique en attendant plus de preuves.`,
      color: profile.color,
      total: patient.katzScore ?? 0,
    };
  }

  const wash = answers.adl1 ?? 0;
  const dress = answers.adl2 ?? 0;
  const locomotion = answers.adl3 ?? 0;
  const transfer = answers.adl4 ?? 0;
  const continence = answers.adl5 ?? 0;
  const total = wash + dress + locomotion + transfer + continence;
  const cognitiveSignal =
    (answers.cps1 ?? 0) >= 4 ||
    (answers.cps2 ?? 0) === 1 ||
    patient?.katzCategory === 'Cd' ||
    Boolean(patient && hasAnySignal(patient, ['démence', 'demence', 'alzheimer']));

  let category: BelraiKatzEstimate['category'] = 'O';

  if (total <= 2) {
    category = 'O';
  } else if (total <= 5) {
    category = 'A';
  } else if (total <= 9) {
    category = 'B';
  } else if (total <= 14) {
    category = 'C';
  } else {
    category = cognitiveSignal ? 'Cd' : 'C';
  }

  const profile = getKatzProfile(category);

  return {
    category,
    forfait: profile.forfait,
    description: profile.description,
    color: profile.color,
    total,
  };
}

function buildCaps(patient: Patient, answers: Record<string, number>): BelraiCap[] {
  const caps: BelraiCap[] = [];
  const hasWound = hasAnySignal(patient, ['ulcère', 'ulcere', 'plaie', 'escarre']);
  const hasDiabetes = hasAnySignal(patient, ['diabète', 'diabete', 'insuline', 'glyc']);
  const hasDementia = hasAnySignal(patient, ['démence', 'demence', 'alzheimer']);
  const mobilitySignal =
    (answers.adl3 ?? 0) >= 2 ||
    (answers.adl4 ?? 0) >= 2 ||
    hasAnySignal(patient, ['avc', 'ostéoporose', 'hanche', 'prothèse', 'prothese', 'bpco']);

  if ((answers.adl1 ?? 0) >= 3 || (answers.adl2 ?? 0) >= 3) {
    caps.push({
      id: 'cap_hygiene',
      title: 'CAP Hygiène personnelle',
      detail: 'Une aide importante est probable pour la toilette et l’habillage.',
      priority: 'high',
      tone: 'amber',
      rationale: 'Les items AVQ signalent une dépendance significative sur l’hygiène.',
      linkedDiagnosis: 'Déficit de soins personnels : se laver',
      suggestedInterventions: [
        'Aide structurée à la toilette quotidienne.',
        'Stimulation de l’autonomie résiduelle à chaque passage.',
        'Réévaluation hebdomadaire du niveau d’assistance.',
      ],
    });
  }

  if (mobilitySignal) {
    caps.push({
      id: 'cap_mobility',
      title: 'CAP Mobilité & transferts',
      detail: 'Le profil nécessite une attention accrue sur les transferts et le risque de chute.',
      priority: 'high',
      tone: 'red',
      rationale: 'Les limitations locomotrices ou de transfert justifient une action prioritaire.',
      linkedDiagnosis: 'Risque de chute et besoin d’aide au transfert',
      suggestedInterventions: [
        'Standardiser la technique de transfert sur la feuille de tournée.',
        'Tracer tout incident ou quasi-chute.',
        'Vérifier les aides techniques disponibles au domicile.',
      ],
    });
  }

  if ((answers.iavq2 ?? 0) >= 2 || hasDiabetes) {
    caps.push({
      id: 'cap_medication',
      title: 'CAP Gestion médicamenteuse',
      detail: 'La complexité thérapeutique suggère un accompagnement serré de la médication.',
      priority: 'high',
      tone: 'blue',
      rationale: 'Le contexte diabétique ou la polymédication rendent l’administration plus sensible.',
      linkedDiagnosis: 'Risque de gestion thérapeutique inefficace',
      suggestedInterventions: [
        'Pilulier ou préparation assistée.',
        'Double contrôle des administrations sensibles.',
        'Coordination avec le médecin et la pharmacie si anomalies.',
      ],
    });
  }

  if ((answers.mood1 ?? 0) >= 2 || (answers.mood2 ?? 0) >= 2) {
    caps.push({
      id: 'cap_mood',
      title: 'CAP Humeur',
      detail: 'Des signes d’humeur altérée ou d’anxiété méritent une exploration clinique ciblée.',
      priority: 'medium',
      tone: 'amber',
      rationale: 'Le screener détecte un besoin de suivi émotionnel complémentaire.',
      linkedDiagnosis: 'Humeur altérée / isolement',
      suggestedInterventions: [
        'Entretien ciblé avec le patient et/ou les proches.',
        'Tracer l’évolution émotionnelle sur plusieurs visites.',
        'Escalader si aggravation ou retentissement fonctionnel.',
      ],
    });
  }

  if ((answers.cps1 ?? 0) >= 3 || hasDementia) {
    caps.push({
      id: 'cap_cognition',
      title: 'CAP Cognition & prise de décision',
      detail: 'Le dossier suggère un besoin d’aide pour les décisions quotidiennes et la compréhension.',
      priority: 'medium',
      tone: 'amber',
      rationale: 'Les signaux cognitifs doivent être confirmés et documentés dans la prise en charge.',
      linkedDiagnosis: 'Confusion chronique / déficit décisionnel',
      suggestedInterventions: [
        'Vérifier la compréhension des consignes à chaque visite.',
        'Identifier clairement le proche ou référent décisionnel.',
        'Renforcer les supports visuels et les routines de soins.',
      ],
    });
  }

  if (hasWound) {
    caps.push({
      id: 'cap_skin_integrity',
      title: 'CAP Intégrité de la peau',
      detail: 'Le contexte de plaie chronique justifie un suivi renforcé de l’évolution cutanée.',
      priority: 'high',
      tone: 'red',
      rationale: 'Le dossier clinique signale une surveillance active de l’intégrité cutanée.',
      linkedDiagnosis: 'Atteinte à l’intégrité cutanée',
      suggestedInterventions: [
        'Photo d’évolution selon protocole.',
        'Traçabilité de la douleur à chaque pansement.',
        'Contrôle des facteurs aggravants et des signes infectieux.',
      ],
    });
  }

  return caps.sort((left, right) => {
    const order: Record<BelraiPriority, number> = { high: 0, medium: 1, low: 2 };
    return order[left.priority] - order[right.priority];
  });
}

export function buildCarePlanSuggestions(caps: BelraiCap[]): BelraiCarePlanSuggestion[] {
  return caps.map((cap) => {
    switch (cap.id) {
      case 'cap_skin_integrity':
        return {
          id: 'suggestion-skin-integrity',
          title: 'Atteinte à l’intégrité cutanée',
          linkedCap: cap.title,
          detail: 'Proposition dérivée du BelRAI Twin pour sécuriser les soins de plaie et la surveillance.',
          diagnosisCode: '00046',
          interventions: [
            'Soins de plaie protocolisés avec traçabilité photo.',
            'Évaluation douleur à chaque pansement.',
            'Revue conjointe si stagnation de l’évolution.',
          ],
          outcomes: ['Réduction de la surface de plaie', 'Douleur stabilisée ou en diminution'],
          tone: cap.tone,
        };
      case 'cap_medication':
        return {
          id: 'suggestion-medication',
          title: 'Risque de gestion thérapeutique inefficace',
          linkedCap: cap.title,
          detail: 'Proposition axée sur la sécurisation de la médication à domicile.',
          diagnosisCode: 'À confirmer',
          interventions: [
            'Pilulier ou check-list d’administration.',
            'Validation du schéma médicamenteux avec le patient.',
            'Alerte rapide en cas d’écart de prise.',
          ],
          outcomes: ['Aucune omission critique', 'Meilleure adhésion thérapeutique'],
          tone: cap.tone,
        };
      case 'cap_hygiene':
        return {
          id: 'suggestion-hygiene',
          title: 'Déficit de soins personnels : se laver',
          linkedCap: cap.title,
          detail: 'Proposition de diagnostic pour formaliser l’aide à la toilette et l’autonomie résiduelle.',
          diagnosisCode: '00108',
          interventions: [
            'Aide quotidienne graduée à la toilette.',
            'Stimulation de l’autonomie résiduelle.',
            'Réévaluation de la charge d’aide à chaque revue BelRAI.',
          ],
          outcomes: ['Hygiène personnelle maintenue', 'Autonomie résiduelle préservée'],
          tone: cap.tone,
        };
      case 'cap_mobility':
        return {
          id: 'suggestion-mobility',
          title: 'Risque de chute / besoin d’aide au transfert',
          linkedCap: cap.title,
          detail: 'Proposition centrée sur la sécurité des transferts et la prévention des événements indésirables.',
          diagnosisCode: 'À confirmer',
          interventions: [
            'Technique de transfert standardisée.',
            'Surveillance ciblée du risque de chute.',
            'Coordination pour aides techniques et adaptation du domicile.',
          ],
          outcomes: ['Transferts sécurisés', 'Absence de chute'],
          tone: cap.tone,
        };
      case 'cap_mood':
        return {
          id: 'suggestion-mood',
          title: 'Humeur altérée / isolement',
          linkedCap: cap.title,
          detail: 'Proposition de suivi psycho-social léger à confirmer par l’équipe.',
          diagnosisCode: 'À confirmer',
          interventions: [
            'Questionnement ciblé sur l’humeur sur plusieurs visites.',
            'Repérage des facteurs d’isolement.',
            'Escalade si aggravation clinique ou rupture d’adhésion.',
          ],
          outcomes: ['Symptômes émotionnels suivis', 'Pas d’aggravation non détectée'],
          tone: cap.tone,
        };
      case 'cap_cognition':
        return {
          id: 'suggestion-cognition',
          title: 'Confusion chronique / déficit décisionnel',
          linkedCap: cap.title,
          detail: 'Proposition pour structurer les supports cognitifs et la coordination avec les proches.',
          diagnosisCode: 'À confirmer',
          interventions: [
            'Consignes simples et répétées.',
            'Identification d’un proche ou référent décisionnel.',
            'Traçabilité des écarts de compréhension.',
          ],
          outcomes: ['Meilleure compréhension des soins', 'Décisions quotidiennes sécurisées'],
          tone: cap.tone,
        };
      default:
        return {
          id: `suggestion-${cap.id}`,
          title: cap.linkedDiagnosis,
          linkedCap: cap.title,
          detail: cap.detail,
          diagnosisCode: 'À confirmer',
          interventions: [...cap.suggestedInterventions],
          outcomes: ['Stabilisation clinique', 'Réévaluation à la prochaine revue'],
          tone: cap.tone,
        };
    }
  });
}

export function buildBelraiTwin(
  patient: Patient,
  draftInput?: StoredBelraiDraft | null
): BelraiTwinSnapshot {
  const baseDraft = draftInput ?? loadStoredBelraiDraft(patient.id);
  const confirmedItemIds = baseDraft.confirmedItemIds.filter(
    (itemId) => baseDraft.answers[itemId] !== undefined
  );
  const draft: StoredBelraiDraft = {
    ...baseDraft,
    confirmedItemIds,
  };
  const suggestedAnswers = Object.fromEntries(
    belraiItems.map((item) => [item.id, inferSuggestedAnswer(patient, item)])
  ) as Record<string, BelraiSuggestedAnswer>;
  const answeredItems = belraiItems.filter((item) => draft.answers[item.id] !== undefined).length;
  const confirmedItems = confirmedItemIds.length;
  const totalItems = belraiItems.length;
  const percent = Math.round((answeredItems / totalItems) * 100);
  const criticalMissingItems = belraiItems.filter(
    (item) => item.critical && draft.answers[item.id] === undefined
  );
  const katz = computeKatzFromBelrai(draft.answers, patient);
  const caps = buildCaps(patient, draft.answers);
  const carePlanSuggestions = buildCarePlanSuggestions(caps);
  const cognitionTotal = (draft.answers.cps1 ?? 0) + (draft.answers.cps2 ?? 0) + (draft.answers.cps3 ?? 0);
  const adlTotal =
    (draft.answers.adl1 ?? 0) +
    (draft.answers.adl2 ?? 0) +
    (draft.answers.adl3 ?? 0) +
    (draft.answers.adl4 ?? 0) +
    (draft.answers.adl5 ?? 0);
  const moodTotal = (draft.answers.mood1 ?? 0) + (draft.answers.mood2 ?? 0);
  const iavqTotal =
    (draft.answers.iavq1 ?? 0) + (draft.answers.iavq2 ?? 0) + (draft.answers.iavq3 ?? 0);
  const dueAnchor = draft.submittedAt ?? patient.lastVisit ?? patient.nextVisit ?? patient.createdAt;
  const dueDate = formatBelraiDate(addDays(dueAnchor, getAssessmentCadence(patient)));
  const readyToSync =
    percent >= 75 &&
    criticalMissingItems.length === 0 &&
    confirmedItems >= Math.min(5, totalItems);

  let statusLabel = 'À initier';
  let statusTone: BelraiTone = 'blue';
  if (draft.status === 'synced' || draft.syncStatus === 'synced') {
    statusLabel = 'Synchronisé';
    statusTone = 'green';
  } else if (draft.status === 'sync_error' || draft.syncStatus === 'error') {
    statusLabel = 'Erreur de synchronisation';
    statusTone = 'red';
  } else if (draft.status === 'ready_for_sync') {
    statusLabel = 'Prêt pour synchronisation';
    statusTone = 'green';
  } else if (answeredItems === 0) {
    statusLabel = 'À initier';
    statusTone = 'blue';
  } else if (criticalMissingItems.length > 0) {
    statusLabel = 'Collecte incomplète';
    statusTone = 'amber';
  } else if (confirmedItems < Math.min(5, answeredItems)) {
    statusLabel = 'Revue clinique en cours';
    statusTone = 'amber';
  } else {
    statusLabel = 'Brouillon consolidé';
    statusTone = 'blue';
  }

  let syncLabel = 'Brouillon local non transmis';

  switch (draft.syncStatus) {
    case 'queued':
      syncLabel = 'Synchronisation BelRAI en file d’attente';
      break;
    case 'processing':
      syncLabel = 'Synchronisation BelRAI en cours';
      break;
    case 'synced':
      syncLabel = 'Évaluation synchronisée avec la couche backend BelRAI';
      break;
    case 'error':
      syncLabel = 'Échec de synchronisation — reprise manuelle requise';
      break;
    default:
      syncLabel =
        draft.status === 'ready_for_sync'
          ? draft.storage === 'supabase'
            ? 'Évaluation persistée, en attente de prise en charge par la passerelle BelRAI'
            : 'Évaluation prête localement mais non encore transmise'
          : draft.storage === 'supabase'
            ? 'Brouillon persisté dans Supabase'
            : 'Brouillon local non transmis';
  }

  const persistenceLabel =
    draft.storage === 'supabase'
      ? 'Persisté dans Supabase'
      : 'Brouillon local / reprise offline';

  let nextAction = 'Compléter les zones sans preuve suffisante.';

  if (criticalMissingItems.length > 0) {
    nextAction = `Compléter d’abord ${criticalMissingItems.length} item(s) critiques pour fiabiliser le screener.`;
  } else if (!readyToSync) {
    nextAction = 'Confirmer davantage de réponses avant de marquer l’évaluation prête.';
  } else if (draft.status === 'ready_for_sync') {
    nextAction = 'L’évaluation locale est prête pour une future synchronisation via la passerelle backend.';
  }

  const scores: BelraiScoreCard[] = [
    {
      key: 'katz',
      label: 'Katz estimé',
      value: katz.category,
      detail: katz.forfait,
      tone: katz.color,
    },
    {
      key: 'adl-load',
      label: 'Charge AVQ',
      value: `${adlTotal}/20`,
      detail: 'Mesure l’aide probable sur les actes essentiels.',
      tone: adlTotal >= 12 ? 'red' : adlTotal >= 7 ? 'amber' : 'green',
    },
    {
      key: 'cognition',
      label: 'Signal cognitif',
      value: `${cognitionTotal}/10`,
      detail: 'Oriente la revue des décisions et de la compréhension.',
      tone: cognitionTotal >= 5 ? 'amber' : 'blue',
    },
    {
      key: 'proofs',
      label: 'Preuves confirmées',
      value: `${confirmedItems}/${totalItems}`,
      detail: 'Plus le nombre est haut, plus la synchronisation future sera fiable.',
      tone: confirmedItems >= 5 ? 'green' : confirmedItems >= 2 ? 'amber' : 'blue',
    },
    {
      key: 'mood',
      label: 'Charge psycho-sociale',
      value: `${moodTotal + iavqTotal}/10`,
      detail: 'Combine humeur, anxiété et activités instrumentales.',
      tone: moodTotal + iavqTotal >= 5 ? 'amber' : 'blue',
    },
  ];

  return {
    patient,
    sections: belraiSections,
    draft,
    suggestedAnswers,
    katz,
    scores,
    caps,
    carePlanSuggestions,
    progress: {
      answeredItems,
      confirmedItems,
      totalItems,
      percent,
    },
    criticalMissingItems,
    dueDate,
    lastUpdatedLabel: formatBelraiDateTime(draft.updatedAt),
    statusLabel,
    statusTone,
    syncLabel,
    persistenceMode: draft.storage,
    persistenceLabel,
    readyToSync,
    nextAction,
  };
}
