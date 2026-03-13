export type ComplianceState = 'ready' | 'warning' | 'blocked';

export interface InamiRequirement {
  id: string;
  title: string;
  detail: string;
  source: string;
  state: ComplianceState;
}

export interface QueueComplianceRecord {
  itemId: string;
  identity: { state: ComplianceState; label: string };
  memberData: { state: ComplianceState; label: string };
  medadmin: { state: ComplianceState; label: string };
  agreement: { state: ComplianceState; label: string };
  prescriptionArchive: { state: ComplianceState; label: string };
  patientJustificatif: { state: ComplianceState; label: string };
  notes: string[];
}

export interface BatchComplianceRecord {
  batchId: string;
  approvedPackage: { state: ComplianceState; label: string };
  instructionSync: { state: ComplianceState; label: string };
  prescriptionArchive: { state: ComplianceState; label: string };
  identityCoverage: { state: ComplianceState; label: string };
  medadmin: { state: ComplianceState; label: string };
  patientJustificatif: { state: ComplianceState; label: string };
  notes: string[];
}

export interface PatientBillingComplianceRecord {
  patientId: string;
  patientJustificatif: { state: ComplianceState; label: string; dueDate: string; channel: string };
  memberData: { state: ComplianceState; label: string; checkedAt: string };
  identity: { state: ComplianceState; label: string };
  prescriptionArchive: { state: ComplianceState; label: string };
  medadmin: { state: ComplianceState; label: string };
  notes: string[];
}

export interface RejectionGuidance {
  code: string;
  title: string;
  detail: string;
  impact: string;
}

export const inamiElectronicBillingRequirements: InamiRequirement[] = [
  {
    id: 'mycarenet-third-party',
    title: 'Tiers payant via MyCareNet',
    detail: 'La facturation electronique infirmiere en tiers payant doit suivre le canal MyCareNet.',
    source: 'INAMI',
    state: 'ready',
  },
  {
    id: 'approved-package',
    title: 'Logiciel et connecteur approuves',
    detail: 'Le logiciel, le connecteur et les certificats doivent rester homologues pour produire.',
    source: 'MyCareNet',
    state: 'ready',
  },
  {
    id: 'identity-trace',
    title: 'Identite patient tracee a chaque contact',
    detail: 'Le support, la methode de lecture et le motif de fallback doivent etre journalises avant facturation.',
    source: 'INAMI',
    state: 'warning',
  },
  {
    id: 'medadmin-documents',
    title: 'Notifications et documents Medadmin',
    detail: 'Les notifications medico-administratives utiles a la facturation doivent etre disponibles dans le dossier.',
    source: 'INAMI',
    state: 'ready',
  },
  {
    id: 'prescription-retention',
    title: 'Prescription archivee 5 ans',
    detail: 'La prescription n est plus envoyee en papier mais doit rester archivee dans le dossier infirmier.',
    source: 'INAMI',
    state: 'ready',
  },
  {
    id: 'patient-justificatif',
    title: 'Justificatif patient sous 28 jours',
    detail: 'Le patient doit recevoir son justificatif mensuel rapidement et au plus tard 28 jours apres l envoi.',
    source: 'INAMI',
    state: 'warning',
  },
];

const queueComplianceById: Record<string, QueueComplianceRecord> = {
  q1: {
    itemId: 'q1',
    identity: { state: 'ready', label: 'eID puce tracee le 06/03' },
    memberData: { state: 'ready', label: 'MemberData mars 2026 OK' },
    medadmin: { state: 'ready', label: 'Notification Medadmin rattachee' },
    agreement: { state: 'ready', label: 'Accord MyCareNet valide' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee' },
    patientJustificatif: { state: 'warning', label: 'Justificatif a remettre avant le 28/03' },
    notes: ['Dossier complet pour le prochain lot MyCareNet.'],
  },
  q2: {
    itemId: 'q2',
    identity: { state: 'ready', label: 'ISI+ puce tracee le 06/03' },
    memberData: { state: 'warning', label: 'MemberData a reverifier avant cloture mensuelle' },
    medadmin: { state: 'ready', label: 'Forfait technique notifie' },
    agreement: { state: 'ready', label: 'Accord non requis pour ce code' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee' },
    patientJustificatif: { state: 'ready', label: 'Justificatif deja programme en eBox' },
    notes: ['Verification assurabilite a reconfirmer si le sejour evolue.'],
  },
  q5: {
    itemId: 'q5',
    identity: { state: 'ready', label: 'Identite tracee' },
    memberData: { state: 'ready', label: 'MemberData OK' },
    medadmin: { state: 'ready', label: 'Notification rattachee' },
    agreement: { state: 'ready', label: 'Accord non requis' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee' },
    patientJustificatif: { state: 'ready', label: 'Justificatif remis' },
    notes: ['Le blocage actuel vient du cumul nomenclature, pas du prerequis administratif.'],
  },
  q6: {
    itemId: 'q6',
    identity: { state: 'ready', label: 'eID puce tracee le 05/03' },
    memberData: { state: 'ready', label: 'MemberData mars 2026 OK' },
    medadmin: { state: 'ready', label: 'Notification d injection disponible' },
    agreement: { state: 'ready', label: 'Accord non requis' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee' },
    patientJustificatif: { state: 'warning', label: 'Justificatif a publier en portail securise' },
    notes: ['Aucune dependance bloquante INAMI detectee.'],
  },
  q7: {
    itemId: 'q7',
    identity: { state: 'warning', label: 'Fallback manuel avec motif enregistre' },
    memberData: { state: 'ready', label: 'MemberData mars 2026 OK' },
    medadmin: { state: 'ready', label: 'Aucun document Medadmin attendu' },
    agreement: { state: 'ready', label: 'Accord non requis' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee' },
    patientJustificatif: { state: 'ready', label: 'Justificatif remis au patient' },
    notes: ['Fallback manuel autorise si le motif est trace.'],
  },
  q8: {
    itemId: 'q8',
    identity: { state: 'ready', label: 'Identite tracee' },
    memberData: { state: 'ready', label: 'MemberData OK' },
    medadmin: { state: 'ready', label: 'Notification non requise' },
    agreement: { state: 'ready', label: 'Accord non requis' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee' },
    patientJustificatif: { state: 'ready', label: 'Justificatif remis' },
    notes: [],
  },
  q9: {
    itemId: 'q9',
    identity: { state: 'blocked', label: 'Aucune preuve d identite rattachee' },
    memberData: { state: 'ready', label: 'MemberData mars 2026 OK' },
    medadmin: { state: 'blocked', label: 'Notification palliative absente' },
    agreement: { state: 'ready', label: 'Accord non requis' },
    prescriptionArchive: { state: 'blocked', label: 'Prescription non archivee' },
    patientJustificatif: { state: 'warning', label: 'Justificatif patient encore en attente' },
    notes: ['Le lot doit rester bloque tant que la preuve d identite et la notification Medadmin ne sont pas corrigees.'],
  },
};

const defaultQueueCompliance: QueueComplianceRecord = {
  itemId: 'default',
  identity: { state: 'warning', label: 'Trace d identite a confirmer' },
  memberData: { state: 'warning', label: 'MemberData a verifier' },
  medadmin: { state: 'ready', label: 'Aucun document manquant detecte' },
  agreement: { state: 'ready', label: 'Accord non requis' },
  prescriptionArchive: { state: 'warning', label: 'Archive prescription a confirmer' },
  patientJustificatif: { state: 'warning', label: 'Justificatif patient a planifier' },
  notes: [],
};

const batchComplianceById: Record<string, BatchComplianceRecord> = {
  '1': {
    batchId: '1',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Prescriptions archivees 5 ans' },
    identityCoverage: { state: 'ready', label: 'Couverture identite 100%' },
    medadmin: { state: 'ready', label: 'Notifications rattachees' },
    patientJustificatif: { state: 'warning', label: '3 justificatifs a remettre avant le 28/03' },
    notes: ['Le lot est en cours de reponse mutuelle.'],
  },
  '2': {
    batchId: '2',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Prescriptions archivees 5 ans' },
    identityCoverage: { state: 'ready', label: 'Couverture identite 100%' },
    medadmin: { state: 'ready', label: 'Notifications prêtes' },
    patientJustificatif: { state: 'ready', label: 'Justificatifs planifies dans le delai de 28 jours' },
    notes: ['Lot compatible avec le tiers payant infirmier via MyCareNet.'],
  },
  '3': {
    batchId: '3',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Archives presentes' },
    identityCoverage: { state: 'ready', label: 'Couverture identite 100%' },
    medadmin: { state: 'ready', label: 'Notifications cloturees' },
    patientJustificatif: { state: 'ready', label: 'Justificatifs remis' },
    notes: ['Lot accepte sans dependance ouverte.'],
  },
  '4': {
    batchId: '4',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Archives presentes' },
    identityCoverage: { state: 'ready', label: 'Couverture identite 100%' },
    medadmin: { state: 'ready', label: 'Notifications cloturees' },
    patientJustificatif: { state: 'ready', label: 'Justificatifs remis' },
    notes: [],
  },
  '5': {
    batchId: '5',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'blocked', label: '1 prescription non rattachee' },
    identityCoverage: { state: 'warning', label: '1 fallback identite a revuer' },
    medadmin: { state: 'warning', label: '1 document Medadmin en attente' },
    patientJustificatif: { state: 'blocked', label: '2 justificatifs en retard' },
    notes: ['Resoumission interdite tant que les pieces manquantes ne sont pas fermees.'],
  },
  '6': {
    batchId: '6',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Archives presentes' },
    identityCoverage: { state: 'ready', label: 'Couverture identite 100%' },
    medadmin: { state: 'ready', label: 'Notifications presentes' },
    patientJustificatif: { state: 'warning', label: 'Justificatif correctif encore a envoyer' },
    notes: ['Le rejet est lie au certificat et a deja ete pris en charge par l equipe admin.'],
  },
  '7': {
    batchId: '7',
    approvedPackage: { state: 'ready', label: 'Canal MyCareNet homologue' },
    instructionSync: { state: 'ready', label: 'Instruction set maj 09/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Archives presentes' },
    identityCoverage: { state: 'ready', label: 'Couverture identite 100%' },
    medadmin: { state: 'ready', label: 'Notifications presentes' },
    patientJustificatif: { state: 'ready', label: 'Justificatifs remis' },
    notes: [],
  },
};

const defaultBatchCompliance: BatchComplianceRecord = {
  batchId: 'default',
  approvedPackage: { state: 'warning', label: 'Statut package a confirmer' },
  instructionSync: { state: 'warning', label: 'Instruction set a resynchroniser' },
  prescriptionArchive: { state: 'warning', label: 'Archive prescriptions a verifier' },
  identityCoverage: { state: 'warning', label: 'Couverture identite a confirmer' },
  medadmin: { state: 'warning', label: 'Notifications a controler' },
  patientJustificatif: { state: 'warning', label: 'Justificatifs a planifier' },
  notes: [],
};

const patientComplianceById: Record<string, PatientBillingComplianceRecord> = {
  P001: {
    patientId: 'P001',
    patientJustificatif: { state: 'ready', label: 'Justificatif mars programme', dueDate: '2026-03-28', channel: 'eBox' },
    memberData: { state: 'ready', label: 'MemberData verifie', checkedAt: '2026-03-05' },
    identity: { state: 'ready', label: 'eID puce tracee le 05/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee 5 ans' },
    medadmin: { state: 'ready', label: 'Documents Medadmin OK' },
    notes: ['Dossier compatible avec une remise de justificatif numerique.'],
  },
  P002: {
    patientId: 'P002',
    patientJustificatif: { state: 'warning', label: 'Justificatif correctif a renvoyer', dueDate: '2026-03-29', channel: 'papier' },
    memberData: { state: 'ready', label: 'MemberData verifie', checkedAt: '2026-03-04' },
    identity: { state: 'warning', label: 'Fallback manuel trace sur le dernier contact' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee 5 ans' },
    medadmin: { state: 'warning', label: 'Relance accord / Medadmin ouverte' },
    notes: ['Le renouvellement d accord reste la prochaine etape avant prochaine emission.'],
  },
  P003: {
    patientId: 'P003',
    patientJustificatif: { state: 'ready', label: 'Justificatif remis', dueDate: '2026-03-28', channel: 'portail securise' },
    memberData: { state: 'ready', label: 'MemberData verifie', checkedAt: '2026-03-06' },
    identity: { state: 'ready', label: 'eID puce tracee le 06/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee 5 ans' },
    medadmin: { state: 'ready', label: 'Documents Medadmin OK' },
    notes: [],
  },
  P004: {
    patientId: 'P004',
    patientJustificatif: { state: 'warning', label: 'Justificatif a publier apres reponse mutuelle', dueDate: '2026-03-30', channel: 'papier' },
    memberData: { state: 'ready', label: 'MemberData verifie', checkedAt: '2026-03-03' },
    identity: { state: 'ready', label: 'ISI+ puce tracee le 03/03/2026' },
    prescriptionArchive: { state: 'ready', label: 'Prescription archivee 5 ans' },
    medadmin: { state: 'warning', label: 'Accord en cours de validation' },
    notes: ['Le justificatif final depend du retour accord.'],
  },
  P005: {
    patientId: 'P005',
    patientJustificatif: { state: 'ready', label: 'Justificatif remis', dueDate: '2026-02-28', channel: 'papier' },
    memberData: { state: 'warning', label: 'MemberData a rafraichir avant prochain lot', checkedAt: '2026-02-12' },
    identity: { state: 'warning', label: 'Aucune verification recente' },
    prescriptionArchive: { state: 'warning', label: 'Archive a confirmer avant reprise de soins' },
    medadmin: { state: 'ready', label: 'Aucun document Medadmin attendu' },
    notes: ['A controler avant toute reprise de tiers payant.'],
  },
};

const defaultPatientCompliance: PatientBillingComplianceRecord = {
  patientId: 'default',
  patientJustificatif: { state: 'warning', label: 'Justificatif a planifier', dueDate: '', channel: 'papier' },
  memberData: { state: 'warning', label: 'MemberData a verifier', checkedAt: '' },
  identity: { state: 'warning', label: 'Trace identite a confirmer' },
  prescriptionArchive: { state: 'warning', label: 'Archive a confirmer' },
  medadmin: { state: 'warning', label: 'Statut Medadmin a confirmer' },
  notes: [],
};

export const inamiRejectionGuidance: RejectionGuidance[] = [
  {
    code: 'ID-TRACE',
    title: 'Identite patient non tracee',
    detail: 'Aucune preuve de lecture eID/ISI+ ou de fallback motivee n est rattachee au dossier.',
    impact: 'Blocage du lot tant que la verification du contact patient n est pas reconstituee.',
  },
  {
    code: 'JUSTIF-28D',
    title: 'Justificatif patient hors delai',
    detail: 'Le justificatif mensuel n est pas encore remis alors que la fenetre des 28 jours approche ou est depassee.',
    impact: 'Correction administrative immediate avant nouvelle emission ou correction.',
  },
  {
    code: 'PRESC-5Y',
    title: 'Prescription non archivee',
    detail: 'La prescription n est pas envoyee avec le lot mais doit rester archivable 5 ans dans le dossier infirmier.',
    impact: 'Le lot doit etre bloque tant que la piece n est pas rattachee.',
  },
  {
    code: 'MEDADMIN',
    title: 'Notification Medadmin absente',
    detail: 'Le document medico-administratif attendu pour la prestation n est pas present dans le dossier.',
    impact: 'Le lot doit rester en file de correction avant passage MyCareNet.',
  },
];

export function getComplianceVariant(state: ComplianceState) {
  switch (state) {
    case 'ready':
      return 'green' as const;
    case 'warning':
      return 'amber' as const;
    case 'blocked':
      return 'red' as const;
    default:
      return 'outline' as const;
  }
}

export function getQueueCompliance(itemId: string) {
  return queueComplianceById[itemId] ?? { ...defaultQueueCompliance, itemId };
}

export function getQueueComplianceBlockers(record: QueueComplianceRecord) {
  return [
    record.identity,
    record.memberData,
    record.medadmin,
    record.agreement,
    record.prescriptionArchive,
    record.patientJustificatif,
  ]
    .filter((entry) => entry.state === 'blocked')
    .map((entry) => entry.label);
}

export function getQueueComplianceWarnings(record: QueueComplianceRecord) {
  return [
    record.identity,
    record.memberData,
    record.medadmin,
    record.agreement,
    record.prescriptionArchive,
    record.patientJustificatif,
  ]
    .filter((entry) => entry.state === 'warning')
    .map((entry) => entry.label);
}

export function getBatchCompliance(batchId: string) {
  return batchComplianceById[batchId] ?? { ...defaultBatchCompliance, batchId };
}

export function getBatchSendBlockers(record: BatchComplianceRecord) {
  return [
    record.approvedPackage,
    record.instructionSync,
    record.prescriptionArchive,
    record.identityCoverage,
    record.medadmin,
    record.patientJustificatif,
  ]
    .filter((entry) => entry.state === 'blocked')
    .map((entry) => entry.label);
}

export function getBatchWarnings(record: BatchComplianceRecord) {
  return [
    record.approvedPackage,
    record.instructionSync,
    record.prescriptionArchive,
    record.identityCoverage,
    record.medadmin,
    record.patientJustificatif,
  ]
    .filter((entry) => entry.state === 'warning')
    .map((entry) => entry.label);
}

export function getPatientBillingCompliance(patientId: string) {
  return patientComplianceById[patientId] ?? { ...defaultPatientCompliance, patientId };
}
