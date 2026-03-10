import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, FileCheck, RefreshCw, Send, ShieldAlert, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, Tabs } from '@/design-system';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import { useCreateEAgreementRequest, useEAgreementRequests, usePatientConsentSnapshot } from '@/hooks/useEAgreementData';
import { useHadPatientEpisodes } from '@/hooks/useHadData';
import { useNursePatients, type NursePatient } from '@/hooks/useNursePatients';
import {
  getDaysUntilEAgreementEnd,
  getEAgreementPresentationLabel,
  getEAgreementPresentationStatus,
  getEAgreementPresentationVariant,
  type EAgreementPresentationStatus,
} from '@/lib/eagreements';
import { maskNiss } from '@/lib/niss';
import { useAuthStore } from '@/stores/authStore';

type EAgreementTab = 'list' | 'new';

type AgreementDraft = {
  patientRouteId: string;
  careType: string;
  nomenclature: string;
  katzCategory: string;
  prescriberName: string;
  startDate: string;
  endDate: string;
};

const careTypeOptions = [
  'Soins infirmiers forfaitaires',
  'Soins de plaies',
  'Soins palliatifs',
  'Diabète — Éducation et suivi',
] as const;

const katzOptions = ['O', 'A', 'B', 'C', 'Cd'] as const;

const statusIcons: Record<EAgreementPresentationStatus, typeof CheckCircle2> = {
  active: CheckCircle2,
  expiring: AlertTriangle,
  expired: AlertTriangle,
  pending: Clock,
  rejected: XCircle,
  cancelled: XCircle,
  draft: Clock,
};

function isUuid(value?: string | null) {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  const date = parseDateValue(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-BE');
}

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  const date = parseDateValue(value);
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

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToDateInput(days: number) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  return formatDateInput(nextDate);
}

function getDefaultCareType(patient: NursePatient, hadSummary?: { diagnosisSummary?: string; admissionReason?: string }) {
  const patientText = patient.pathologies.join(' ').toLowerCase();
  const hadText = `${hadSummary?.diagnosisSummary ?? ''} ${hadSummary?.admissionReason ?? ''}`.toLowerCase();

  if (/plaie|ulc[eè]re|escarre/.test(`${patientText} ${hadText}`)) {
    return 'Soins de plaies';
  }

  if (/palliat/.test(`${patientText} ${hadText}`)) {
    return 'Soins palliatifs';
  }

  if (/diab[eè]te|insuline/.test(`${patientText} ${hadText}`)) {
    return 'Diabète — Éducation et suivi';
  }

  return 'Soins infirmiers forfaitaires';
}

function getSuggestedNomenclature(careType: string, katzCategory?: string) {
  if (careType === 'Soins de plaies') {
    return 'Art. 8 §1,3° — Soins de plaies complexes';
  }

  if (careType === 'Soins palliatifs') {
    return 'Art. 8 — Forfait palliatif';
  }

  if (careType === 'Diabète — Éducation et suivi') {
    return 'Diabète — Éducation et suivi';
  }

  switch (katzCategory) {
    case 'A':
      return 'Art. 8 §1 — Forfait A';
    case 'B':
      return 'Art. 8 §1 — Forfait B';
    case 'C':
      return 'Art. 8 §1 — Forfait C';
    case 'Cd':
      return 'Art. 8 §1 — Forfait C-démence';
    default:
      return 'Art. 8 §1 — Forfait à confirmer';
  }
}

function getRequiredAttachments(careType: string) {
  if (careType === 'Soins de plaies') {
    return ['Prescription médicale signée', 'Évaluation de plaie', 'Plan de soins infirmiers'];
  }

  if (careType === 'Soins palliatifs') {
    return ['Prescription médicale signée', 'Évaluation palliative', 'Plan de soins infirmiers'];
  }

  if (careType === 'Diabète — Éducation et suivi') {
    return ['Prescription médicale signée', 'Schéma thérapeutique diabète', 'Plan éducatif infirmier'];
  }

  return ['Prescription médicale signée', 'BelRAI Screener ou Échelle de Katz', 'Plan de soins infirmiers'];
}

function buildDraft(patient: NursePatient, hadSummary?: { diagnosisSummary?: string; admissionReason?: string }) {
  const careType = getDefaultCareType(patient, hadSummary);
  const katzCategory = patient.katzCategory ?? '';

  return {
    patientRouteId: patient.routeId,
    careType,
    nomenclature: getSuggestedNomenclature(careType, katzCategory),
    katzCategory,
    prescriberName: patient.prescribingDoctor,
    startDate: formatDateInput(new Date()),
    endDate: addDaysToDateInput(90),
  } satisfies AgreementDraft;
}

function createEmptyDraft(patientRouteId = '') {
  return {
    patientRouteId,
    careType: 'Soins infirmiers forfaitaires',
    nomenclature: getSuggestedNomenclature('Soins infirmiers forfaitaires'),
    katzCategory: '',
    prescriberName: '',
    startDate: formatDateInput(new Date()),
    endDate: addDaysToDateInput(90),
  } satisfies AgreementDraft;
}

export function EAgreementPage() {
  const [searchParams] = useSearchParams();
  const requestedPatientRouteId = searchParams.get('patientId') ?? '';
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<EAgreementTab>(() => (requestedPatientRouteId ? 'new' : 'list'));
  const [patientSelection, setPatientSelection] = useState('');
  const [draftState, setDraftState] = useState<{ patientRouteId: string; values: Partial<AgreementDraft> }>({
    patientRouteId: '',
    values: {},
  });
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    data: patients = [],
    isLoading: isPatientsLoading,
    error: patientsError,
  } = useNursePatients();
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useEAgreementRequests();
  const createRequestMutation = useCreateEAgreementRequest();

  const selectedPatientRouteId = useMemo(() => {
    const preferredRouteId = patientSelection || requestedPatientRouteId;

    if (preferredRouteId && patients.some((patient) => patient.routeId === preferredRouteId)) {
      return preferredRouteId;
    }

    return patients[0]?.routeId ?? preferredRouteId;
  }, [patientSelection, patients, requestedPatientRouteId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.routeId === selectedPatientRouteId) ?? null,
    [patients, selectedPatientRouteId],
  );

  const {
    data: belraiSnapshot,
    isLoading: isBelraiLoading,
    error: belraiError,
  } = useBelraiTwin(selectedPatient?.routeId);
  const {
    data: hadEpisodes = [],
    isLoading: isHadLoading,
    error: hadError,
  } = useHadPatientEpisodes(selectedPatient?.databaseId);
  const {
    data: patientConsent,
    isLoading: isConsentLoading,
    error: patientConsentError,
  } = usePatientConsentSnapshot(selectedPatient?.databaseId);

  const activeHadEpisode = hadEpisodes[0];
  const baseDraft = selectedPatient
    ? buildDraft(selectedPatient, activeHadEpisode)
    : createEmptyDraft(selectedPatientRouteId);

  const draft = useMemo(() => {
    if (draftState.patientRouteId !== selectedPatientRouteId) {
      return baseDraft;
    }

    return {
      ...baseDraft,
      ...draftState.values,
      patientRouteId: selectedPatientRouteId,
    };
  }, [baseDraft, draftState, selectedPatientRouteId]);

  const selectedPatientRequests = useMemo(
    () => requests.filter((request) => request.patientId === selectedPatient?.databaseId),
    [requests, selectedPatient?.databaseId],
  );

  const counts = useMemo(() => {
    return requests.reduce(
      (summary, request) => {
        const status = getEAgreementPresentationStatus(request);

        if (status === 'active') {
          summary.active += 1;
        } else if (status === 'pending' || status === 'draft') {
          summary.pending += 1;
        } else if (status === 'rejected' || status === 'cancelled') {
          summary.rejected += 1;
        } else if (status === 'expired') {
          summary.expired += 1;
        } else if (status === 'expiring') {
          summary.expiring += 1;
        }

        return summary;
      },
      { active: 0, pending: 0, rejected: 0, expired: 0, expiring: 0 },
    );
  }, [requests]);

  const derivedKatzCategory = belraiSnapshot?.katz.category ?? selectedPatient?.katzCategory ?? undefined;
  const requiredAttachments = useMemo(() => getRequiredAttachments(draft.careType), [draft.careType]);

  const blockingReasons = useMemo(() => {
    const reasons: string[] = [];

    if (!selectedPatient) {
      reasons.push('Sélectionnez un patient pour préparer la demande.');
    }

    if (!draft.prescriberName.trim()) {
      reasons.push('Le prescripteur doit être renseigné.');
    }

    if (!draft.startDate || !draft.endDate) {
      reasons.push('La période de validité doit être complète.');
    }

    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      reasons.push('La date de fin doit être postérieure à la date de début.');
    }

    if (!draft.katzCategory && !derivedKatzCategory) {
      reasons.push('Une catégorie Katz ou une estimation BelRAI est requise.');
    }

    if (!isConsentLoading && !patientConsent) {
      reasons.push('Le consentement patient n’est pas encore synchronisé.');
    }

    if (patientConsent?.consentStatus === 'missing') {
      reasons.push('Le consentement eHealth/MyCareNet est manquant.');
    }

    if (patientConsent?.therapeuticLinkStatus === 'blocked') {
      reasons.push('Le lien thérapeutique est bloqué pour ce patient.');
    }

    return reasons;
  }, [derivedKatzCategory, draft.endDate, draft.katzCategory, draft.prescriberName, draft.startDate, isConsentLoading, patientConsent, selectedPatient]);

  const advisoryItems = useMemo(() => {
    const items: string[] = [];

    if (patientConsent?.consentStatus === 'renewal') {
      items.push('Le consentement approche du renouvellement.');
    }

    if (patientConsent?.therapeuticLinkStatus === 'review') {
      items.push('Le lien thérapeutique nécessite une vérification administrative.');
    }

    if (belraiSnapshot && !belraiSnapshot.readyToSync) {
      items.push(`${belraiSnapshot.statusLabel} — ${belraiSnapshot.nextAction}`);
    }

    if (!activeHadEpisode) {
      items.push('Aucun épisode HAD ouvert n’est actuellement relié à cette demande.');
    }

    return items;
  }, [activeHadEpisode, belraiSnapshot, patientConsent]);

  const isSubmitDisabled =
    createRequestMutation.isPending ||
    blockingReasons.length > 0 ||
    isPatientsLoading ||
    isBelraiLoading ||
    isConsentLoading;

  const tabs = [
    { id: 'list', label: 'Demandes', count: requests.length },
    { id: 'new', label: 'Nouvelle demande' },
  ];

  const handleDraftChange = <K extends keyof AgreementDraft>(field: K, value: AgreementDraft[K]) => {
    setDraftState((current) => {
      const currentValues = current.patientRouteId === selectedPatientRouteId ? current.values : {};
      const nextValues: Partial<AgreementDraft> = {
        ...currentValues,
        [field]: value,
      };

      if (field === 'careType' || field === 'katzCategory') {
        nextValues.nomenclature = getSuggestedNomenclature(
          field === 'careType' ? String(value) : String(nextValues.careType ?? baseDraft.careType),
          field === 'katzCategory'
            ? String(value) || undefined
            : String(nextValues.katzCategory ?? baseDraft.katzCategory) || undefined,
        );
      }

      return {
        patientRouteId: selectedPatientRouteId,
        values: nextValues,
      };
    });
  };

  const handlePatientChange = (routeId: string) => {
    setPatientSelection(routeId);
    setDraftState({ patientRouteId: routeId, values: {} });
    setSubmissionMessage(null);
    setSubmissionError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPatient) {
      return;
    }

    try {
      setSubmissionError(null);

      const createdRequest = await createRequestMutation.mutateAsync({
        patientId: selectedPatient.databaseId,
        belraiAssessmentId: isUuid(belraiSnapshot?.draft.assessmentId) ? belraiSnapshot?.draft.assessmentId : null,
        hadEpisodeId: activeHadEpisode?.id ?? null,
        createdByProfileId: user?.id ?? null,
        careType: draft.careType,
        nomenclature: draft.nomenclature,
        katzCategory: (draft.katzCategory || derivedKatzCategory) as NursePatient['katzCategory'] | undefined,
        prescriberName: draft.prescriberName.trim(),
        startAt: draft.startDate,
        endAt: draft.endDate,
        status: 'pending',
        requiredAttachments,
        supportingContext: {
          source: 'nurse_eagreement_page',
          patientRouteId: selectedPatient.routeId,
          belrai: belraiSnapshot
            ? {
                assessmentId: belraiSnapshot.draft.assessmentId,
                statusLabel: belraiSnapshot.statusLabel,
                readyToSync: belraiSnapshot.readyToSync,
                katzCategory: belraiSnapshot.katz.category,
                persistenceMode: belraiSnapshot.persistenceMode,
              }
            : null,
          consent: patientConsent
            ? {
                status: patientConsent.consentStatus,
                therapeuticLinkStatus: patientConsent.therapeuticLinkStatus,
                source: patientConsent.source,
                lastSyncAt: patientConsent.lastSyncAt ?? null,
              }
            : null,
          hadEpisode: activeHadEpisode
            ? {
                id: activeHadEpisode.id,
                reference: activeHadEpisode.reference,
                episodeType: activeHadEpisode.episodeType,
                riskLevel: activeHadEpisode.riskLevel,
              }
            : null,
        },
      });

      setSubmissionMessage(`Demande enregistrée pour ${createdRequest.patient.fullName}.`);
      setActiveTab('list');
      setDraftState({ patientRouteId: selectedPatient.routeId, values: {} });
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'La demande eAgreement n’a pas pu être enregistrée.',
      );
    }
  };

  const listContent = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">{requests.length} demande(s) synchronisée(s)</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => void refetchRequests()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </Button>
          <Button variant="gradient" size="sm" className="gap-1" onClick={() => setActiveTab('new')}>
            <Send className="h-3.5 w-3.5" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      {submissionMessage && (
        <Card glass className="border-l-4 border-l-mc-green-500">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-mc-green-500" />
            <span>{submissionMessage}</span>
          </div>
        </Card>
      )}

      {isRequestsLoading ? (
        <Card className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm">Chargement des demandes eAgreement…</p>
        </Card>
      ) : requestsError ? (
        <Card className="border border-mc-red-500/20">
          <div className="flex items-start gap-3 text-sm text-mc-red-600">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Impossible de charger les demandes.</p>
              <p className="text-xs text-[var(--text-muted)]">
                {(requestsError as Error).message}
              </p>
            </div>
          </div>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="text-center py-8">
          <FileCheck className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium">Aucune demande persistée pour le moment.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Utilisez l’onglet de création pour initier le premier workflow MyCareNet.
          </p>
        </Card>
      ) : (
        requests.map((request) => {
          const presentationStatus = getEAgreementPresentationStatus(request);
          const Icon = statusIcons[presentationStatus];
          const daysLeft = getDaysUntilEAgreementEnd(request);

          return (
            <Card key={request.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{request.patient.fullName || 'Patient non résolu'}</p>
                    {request.katzCategory && <Badge variant="default">Katz {request.katzCategory}</Badge>}
                    {request.patientId === selectedPatient?.databaseId && (
                      <Badge variant="blue">Patient sélectionné</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    NISS: {maskNiss(request.patient.niss)} · Mutuelle: {request.patient.mutuality || '—'}
                  </p>
                  <p className="text-sm">{request.nomenclature}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {request.careType} · Prescrit par {request.prescriberName || '—'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-muted)]">
                    <span>Période: {formatDate(request.startAt)} → {formatDate(request.endAt)}</span>
                    {(presentationStatus === 'active' || presentationStatus === 'expiring') && (
                      <Badge variant={presentationStatus === 'expiring' ? 'amber' : 'green'}>
                        {daysLeft}j restants
                      </Badge>
                    )}
                    {request.hadEpisodeReference && <Badge variant="outline">{request.hadEpisodeReference}</Badge>}
                  </div>
                  {request.mycarenetReference && (
                    <p className="text-xs font-mono text-mc-blue-500">Réf. MyCareNet: {request.mycarenetReference}</p>
                  )}
                  {request.rejectionReason && (
                    <div className="flex items-start gap-1.5 p-2 rounded bg-mc-red-500/10 text-xs">
                      <XCircle className="h-3.5 w-3.5 text-mc-red-500 mt-0.5 shrink-0" />
                      <span>{request.rejectionReason}</span>
                    </div>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">
                    Créée le {formatDateTime(request.submittedAt ?? request.createdAt)}
                    {request.createdBy?.fullName ? ` par ${request.createdBy.fullName}` : ''}
                  </p>
                </div>
                <Badge variant={getEAgreementPresentationVariant(presentationStatus)}>
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {getEAgreementPresentationLabel(presentationStatus)}
                </Badge>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  const newRequestContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Préparer une nouvelle demande</CardTitle>
        </CardHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Patient</label>
            <select
              value={selectedPatientRouteId}
              onChange={(event) => handlePatientChange(event.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              disabled={isPatientsLoading}
            >
              <option value="">Sélectionner un patient…</option>
              {patients.map((patient) => (
                <option key={patient.routeId} value={patient.routeId}>
                  {patient.firstName} {patient.lastName} — {maskNiss(patient.niss)}
                </option>
              ))}
            </select>
            {patientsError && (
              <p className="text-xs text-mc-red-600 mt-1">{(patientsError as Error).message}</p>
            )}
          </div>

          {selectedPatient && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                <p className="text-xs text-[var(--text-muted)]">Patient</p>
                <p className="text-sm font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  NISS {maskNiss(selectedPatient.niss)} · {selectedPatient.mutuality}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Prescripteur dossier: {selectedPatient.prescribingDoctor || '—'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Pré-requis cliniques</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={
                      patientConsent?.consentStatus === 'active'
                        ? 'green'
                        : patientConsent?.consentStatus === 'renewal'
                          ? 'amber'
                          : 'red'
                    }
                  >
                    Consentement: {patientConsent?.consentStatus ?? (isConsentLoading ? 'chargement' : 'absent')}
                  </Badge>
                  <Badge
                    variant={
                      patientConsent?.therapeuticLinkStatus === 'ok'
                        ? 'green'
                        : patientConsent?.therapeuticLinkStatus === 'review'
                          ? 'amber'
                          : 'red'
                    }
                  >
                    Lien thérapeutique: {patientConsent?.therapeuticLinkStatus ?? 'non sync'}
                  </Badge>
                  <Badge variant={belraiSnapshot?.readyToSync ? 'green' : belraiSnapshot ? 'blue' : 'outline'}>
                    BelRAI: {belraiSnapshot?.statusLabel ?? (isBelraiLoading ? 'chargement' : 'non disponible')}
                  </Badge>
                  <Badge variant={activeHadEpisode ? 'blue' : isHadLoading ? 'default' : 'outline'}>
                    HAD: {isHadLoading ? 'chargement' : activeHadEpisode?.reference ?? 'aucun épisode ouvert'}
                  </Badge>
                </div>
                {patientConsent?.lastSyncAt && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Dernière synchro consentement: {formatDateTime(patientConsent.lastSyncAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Type de soins</label>
              <select
                value={draft.careType}
                onChange={(event) => handleDraftChange('careType', event.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              >
                {careTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Nomenclature</label>
              <input
                type="text"
                value={draft.nomenclature}
                onChange={(event) => handleDraftChange('nomenclature', event.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Catégorie Katz</label>
              <select
                value={draft.katzCategory}
                onChange={(event) => handleDraftChange('katzCategory', event.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              >
                <option value="">À confirmer</option>
                {katzOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {derivedKatzCategory && derivedKatzCategory !== draft.katzCategory && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Suggestion BelRAI/dossier: {derivedKatzCategory}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Prescripteur</label>
              <input
                type="text"
                value={draft.prescriberName}
                onChange={(event) => handleDraftChange('prescriberName', event.target.value)}
                placeholder="Dr. …"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Date de début</label>
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) => handleDraftChange('startDate', event.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Date de fin</label>
              <input
                type="date"
                value={draft.endDate}
                onChange={(event) => handleDraftChange('endDate', event.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-mc-blue-500/10 text-sm space-y-2">
            <p className="font-medium text-mc-blue-500">Pièces jointes requises</p>
            <ul className="text-xs space-y-0.5 text-[var(--text-muted)]">
              {requiredAttachments.map((attachment) => (
                <li key={attachment}>• {attachment}</li>
              ))}
            </ul>
          </div>

          {blockingReasons.length > 0 && (
            <div className="p-3 rounded-lg bg-mc-red-500/10 space-y-1">
              <p className="text-sm font-medium text-mc-red-600">Pré-requis bloquants</p>
              <ul className="text-xs text-[var(--text-muted)] space-y-1">
                {blockingReasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          {advisoryItems.length > 0 && (
            <div className="p-3 rounded-lg bg-mc-amber-500/10 space-y-1">
              <p className="text-sm font-medium text-mc-amber-600">Points de vigilance</p>
              <ul className="text-xs text-[var(--text-muted)] space-y-1">
                {advisoryItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {submissionError && (
            <div className="p-3 rounded-lg bg-mc-red-500/10 text-sm text-mc-red-600">
              {submissionError}
            </div>
          )}

          <Button type="submit" variant="gradient" className="w-full gap-2" disabled={isSubmitDisabled}>
            <Send className="h-4 w-4" />
            {createRequestMutation.isPending ? 'Envoi en cours…' : 'Enregistrer la demande MyCareNet'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique du patient sélectionné</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {selectedPatient ? (
            selectedPatientRequests.length > 0 ? (
              selectedPatientRequests.map((request) => {
                const presentationStatus = getEAgreementPresentationStatus(request);
                const Icon = statusIcons[presentationStatus];

                return (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{request.nomenclature}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatDate(request.startAt)} → {formatDate(request.endAt)}
                        </p>
                      </div>
                      <Badge variant={getEAgreementPresentationVariant(presentationStatus)}>
                        <Icon className="h-3.5 w-3.5 mr-1" />
                        {getEAgreementPresentationLabel(presentationStatus)}
                      </Badge>
                    </div>
                    {request.rejectionReason && (
                      <p className="text-xs text-mc-red-600 mt-2">{request.rejectionReason}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-sm font-medium">Aucune demande persistée pour ce patient.</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Le formulaire ci-dessus est prérempli à partir du dossier patient, du consentement et du contexte clinique disponible.
                </p>
              </div>
            )
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Sélectionnez d’abord un patient.</p>
          )}
        </div>
      </Card>

      {(patientConsentError || belraiError || hadError) && (
        <Card className="border border-mc-amber-500/20">
          <div className="flex items-start gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-mc-amber-500 shrink-0" />
            <div>
              <p className="font-medium">Une partie du contexte clinique reste indisponible.</p>
              <p className="text-xs text-[var(--text-muted)]">
                {[patientConsentError, belraiError, hadError]
                  .filter(Boolean)
                  .map((error) => (error as Error).message)
                  .join(' · ')}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <AnimatedPage className="px-4 py-6 max-w-4xl mx-auto space-y-4">
      <GradientHeader
        icon={<FileCheck className="h-5 w-5" />}
        title="eAgreement"
        subtitle="Accords préalables MyCareNet"
        badge={<Badge variant="blue">MyCareNet</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{counts.active}</p>
            <p className="text-[10px] text-white/60">Actifs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{counts.pending}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{counts.rejected}</p>
            <p className="text-[10px] text-white/60">Refusés</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{counts.expired}</p>
            <p className="text-[10px] text-white/60">Expirés</p>
          </div>
        </div>
      </GradientHeader>

      {counts.expiring > 0 && (
        <Card glass className="border-l-4 border-l-mc-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-mc-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Accords à renouveler</p>
              <p className="text-xs text-[var(--text-muted)]">
                {counts.expiring} demande(s) actives arrivent à échéance dans les 30 jours.
              </p>
            </div>
            <Button variant="gradient" size="sm" className="gap-1" onClick={() => setActiveTab('list')}>
              <RefreshCw className="h-3.5 w-3.5" />
              Suivre
            </Button>
          </div>
        </Card>
      )}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as EAgreementTab)}
      />

      {activeTab === 'list' ? listContent : newRequestContent}
    </AnimatedPage>
  );
}