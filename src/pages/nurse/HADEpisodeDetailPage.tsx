import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ClipboardPlus,
  ClipboardList,
  HeartPulse,
  Route,
  Save,
  ShieldAlert,
  Stethoscope,
  Thermometer,
  Truck,
  UserRound,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, EmptyState, GradientHeader, Input } from '@/design-system';
import {
  useCreateHadRound,
  useHadDailyRound,
  useHadEpisodeDetail,
  useHadTodayMeasurements,
  useInsertHadMeasurement,
  useUpdateHadEpisode,
} from '@/hooks/useHadData';
import type { HadEpisodeRow } from '@/lib/had';
import { useAuthStore } from '@/stores/authStore';
type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const textareaClassName =
  'w-full min-h-[96px] px-3 py-2.5 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

function toLocalInputValue(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
}

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function getStatusVariant(status: HadEpisodeRow['status']): BadgeVariant {
  switch (status) {
    case 'active':
      return 'green';
    case 'escalated':
      return 'red';
    case 'planned':
    case 'eligible':
      return 'blue';
    case 'paused':
      return 'amber';
    default:
      return 'outline';
  }
}

function getRiskVariant(riskLevel: string): BadgeVariant {
  switch (riskLevel) {
    case 'critical':
    case 'high':
      return 'red';
    case 'moderate':
      return 'amber';
    default:
      return 'green';
  }
}

export function HADEpisodeDetailPage() {
  const navigate = useNavigate();
  const { episodeId } = useParams<{ episodeId: string }>();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useHadEpisodeDetail(episodeId);
  const { data: dailyRound } = useHadDailyRound(episodeId);
  const { data: measurements = [] } = useHadTodayMeasurements(episodeId);
  const updateEpisode = useUpdateHadEpisode();
  const createRound = useCreateHadRound();
  const insertMeasurement = useInsertHadMeasurement();
  const [episodeFormState, setEpisodeFormState] = useState<{
    episodeId: string | null;
    status: HadEpisodeRow['status'];
    riskLevel: HadEpisodeRow['risk_level'];
    targetEndAt: string;
  }>({
    episodeId: null,
    status: 'planned',
    riskLevel: 'moderate',
    targetEndAt: '',
  });
  const [roundSummary, setRoundSummary] = useState('');
  const [roundRecommendation, setRoundRecommendation] = useState('');
  const [roundDecision, setRoundDecision] = useState<'continue_episode' | 'adapt_plan' | 'call_patient' | 'urgent_nurse_visit' | 'send_to_ed' | 'rehospitalize' | 'close_episode'>('continue_episode');
  const [measurementType, setMeasurementType] = useState('temperature');
  const [measurementValue, setMeasurementValue] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('°C');
  const [thresholdState, setThresholdState] = useState<'ok' | 'warning' | 'critical'>('ok');
  const activeEpisodeFormId = data?.episode.id ?? episodeId ?? null;
  const initialEpisodeFormState = useMemo(() => ({
    episodeId: activeEpisodeFormId,
    status: data?.episode.status ?? 'planned',
    riskLevel: data?.episode.riskLevel ?? 'moderate',
    targetEndAt: toLocalInputValue(data?.episode.targetEndAt),
  }), [activeEpisodeFormId, data?.episode.riskLevel, data?.episode.status, data?.episode.targetEndAt]);
  const episodeForm = useMemo(() => {
    return episodeFormState.episodeId === activeEpisodeFormId
      ? episodeFormState
      : initialEpisodeFormState;
  }, [activeEpisodeFormId, episodeFormState, initialEpisodeFormState]);
  const updateEpisodeForm = (
    updater: (current: typeof initialEpisodeFormState) => typeof initialEpisodeFormState,
  ) => {
    setEpisodeFormState((current) => {
      const base = current.episodeId === activeEpisodeFormId ? current : initialEpisodeFormState;
      return updater(base);
    });
  };
  const { status, riskLevel, targetEndAt } = episodeForm;

  const patientLabel = data?.patient.fullName || 'Patient';
  const carePlans = data?.carePlans ?? [];
  const activeCarePlan =
    carePlans.find((carePlan) => carePlan.status === 'active') ?? carePlans[carePlans.length - 1];
  const readinessChecks = [
    { label: 'Consentement', ok: Boolean(data?.episode.consentConfirmed) },
    { label: 'Domicile prêt', ok: Boolean(data?.episode.homeReady) },
    {
      label: 'Logistique',
      ok: Boolean(data?.latestEligibilityAssessment?.logisticsReady || (data?.logisticsItems.length ?? 0) > 0),
    },
    { label: 'MG informé', ok: Boolean(data?.latestEligibilityAssessment?.gpInformed) },
    ...(data?.episode.caregiverRequired
      ? [{ label: 'Aidant dispo', ok: Boolean(data?.episode.caregiverAvailable) }]
      : []),
  ];
  const eligibilityBlockers = Array.isArray(data?.latestEligibilityAssessment?.blockers)
    ? data?.latestEligibilityAssessment?.blockers
    : [];
  const stats = useMemo(() => {
    return {
      teamMembers: data?.teamMembers.length ?? 0,
      alerts: data?.alerts.length ?? 0,
      measurements: measurements.length,
    };
  }, [data?.alerts.length, data?.teamMembers.length, measurements.length]);

  async function handleUpdateEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!episodeId) {
      return;
    }

    await updateEpisode.mutateAsync({
      episodeId,
      patch: {
        status,
        risk_level: riskLevel,
        target_end_at: toIsoOrNull(targetEndAt),
        escalated_at: status === 'escalated' ? new Date().toISOString() : null,
        end_at: status === 'closed' ? new Date().toISOString() : null,
      },
    });
  }

  async function handleCreateRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!episodeId) {
      return;
    }

    await createRound.mutateAsync({
      episodeId,
      recordedBy: user?.id,
      summary: roundSummary,
      recommendation: roundRecommendation || undefined,
      decision: roundDecision,
    });

    setRoundSummary('');
    setRoundRecommendation('');
    setRoundDecision('continue_episode');
  }

  async function handleInsertMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!episodeId) {
      return;
    }

    await insertMeasurement.mutateAsync({
      episodeId,
      capturedByProfileId: user?.id,
      source: 'nurse',
      measurementType,
      valueNumeric: measurementValue ? Number(measurementValue) : undefined,
      unit: measurementUnit,
      thresholdState,
    });

    setMeasurementValue('');
  }

  if (!episodeId) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto">
        <Card>
          <EmptyState
            icon={<HeartPulse className="h-6 w-6" />}
            title="Episode HAD introuvable"
            description="L’identifiant d’épisode est manquant dans l’URL."
          />
        </Card>
      </AnimatedPage>
    );
  }

  if (!isLoading && !data) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto">
        <Card>
          <EmptyState
            icon={<HeartPulse className="h-6 w-6" />}
            title="Aucun épisode correspondant"
            description="Cet épisode HAD n’existe pas ou n’est pas accessible avec le contexte courant."
            action={
              <Button variant="outline" onClick={() => navigate('/nurse/had')} icon={<ArrowLeft className="h-4 w-4" />}>
                Retour à la liste
              </Button>
            }
          />
        </Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/nurse/had')} icon={<ArrowLeft className="h-4 w-4" />}>
          Retour HAD
        </Button>
        <Badge variant="outline">{data?.episode.reference ?? '...'}</Badge>
      </div>

      <GradientHeader
        icon={<Stethoscope className="h-5 w-5" />}
        title={patientLabel}
        subtitle={data ? `${data.episode.episodeType} · ${data.episode.hospital.name}` : 'Chargement de l’épisode HAD'}
        badge={data ? <Badge variant={getStatusVariant(data.episode.status)}>{data.episode.status}</Badge> : undefined}
      >
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{stats.teamMembers}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">intervenants</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{stats.alerts}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">alertes</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{stats.measurements}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">mesures du jour</p>
          </div>
        </div>
      </GradientHeader>

      {data && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={getRiskVariant(data.episode.riskLevel)}>{data.episode.riskLevel}</Badge>
            <Badge variant="blue">{data.patient.city}</Badge>
            {data.episode.targetEndAt && (
              <Badge variant="outline">Fin cible {new Date(data.episode.targetEndAt).toLocaleString('fr-BE')}</Badge>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Résumé clinique</p>
              <p className="text-[var(--text-secondary)]">{data.episode.diagnosisSummary}</p>
              <p className="text-xs text-[var(--text-muted)]">{data.episode.admissionReason}</p>
            </div>
            <div className="space-y-2 text-[var(--text-secondary)]">
              <p className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-mc-blue-500" /> {data.episode.hospital.name}</p>
              <p className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-mc-green-500" /> {data.episode.primaryNurse?.fullName ?? 'Infirmier non assigné'}</p>
              <p className="inline-flex items-center gap-2"><Route className="h-4 w-4 text-mc-amber-500" /> {data.patient.address.street} {data.patient.address.houseNumber}, {data.patient.address.postalCode} {data.patient.address.city}</p>
            </div>
          </div>
        </Card>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-mc-green-500" />
              <h2 className="text-sm font-semibold">Préparation HAD</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {readinessChecks.map((item) => (
                <Badge key={item.label} variant={item.ok ? 'green' : 'outline'}>
                  {item.label}
                </Badge>
              ))}
            </div>

            {data.latestEligibilityAssessment ? (
              <div className="rounded-2xl bg-[var(--bg-tertiary)] p-3 text-sm space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      data.latestEligibilityAssessment.result === 'eligible'
                        ? 'green'
                        : data.latestEligibilityAssessment.result === 'eligible_with_conditions'
                          ? 'amber'
                          : 'red'
                    }
                  >
                    {data.latestEligibilityAssessment.result}
                  </Badge>
                  <span className="text-xs text-[var(--text-muted)]">
                    Évalué le {new Date(data.latestEligibilityAssessment.assessedAt).toLocaleString('fr-BE')}
                  </span>
                </div>
                {eligibilityBlockers.length > 0 && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Bloquants : {eligibilityBlockers.join(' · ')}
                  </p>
                )}
                {data.latestEligibilityAssessment.notes && (
                  <p className="text-xs text-[var(--text-muted)]">{data.latestEligibilityAssessment.notes}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                Aucune évaluation d’éligibilité enregistrée pour l’instant.
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-mc-blue-500" />
              <h2 className="text-sm font-semibold">Plan actif</h2>
            </div>

            {activeCarePlan ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-[var(--bg-tertiary)] p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={activeCarePlan.status === 'active' ? 'green' : 'outline'}>
                      {activeCarePlan.status}
                    </Badge>
                    <Badge variant="outline">{activeCarePlan.protocolSlug}</Badge>
                  </div>
                  <p className="text-sm font-medium">{activeCarePlan.summary}</p>
                  {activeCarePlan.nextReviewAt && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Révision prévue le {new Date(activeCarePlan.nextReviewAt).toLocaleString('fr-BE')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                    <p className="text-base font-semibold">{data.medicationOrders.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">médicaments</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                    <p className="text-base font-semibold">{data.tasks.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">tâches</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                    <p className="text-base font-semibold">{data.logisticsItems.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">logistique</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                Aucun plan de soins HAD n’est encore activé pour cet épisode.
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Save className="h-4 w-4 text-mc-blue-500" />
              <h2 className="text-sm font-semibold">Mettre à jour l’épisode</h2>
            </div>
            <form className="space-y-3" onSubmit={handleUpdateEpisode}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Statut</label>
                  <select className={selectClassName} value={status} onChange={(event) => updateEpisodeForm((current) => ({ ...current, status: event.target.value as HadEpisodeRow['status'] }))}>
                    <option value="screening">screening</option>
                    <option value="eligible">eligible</option>
                    <option value="planned">planned</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="escalated">escalated</option>
                    <option value="closed">closed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Risque</label>
                  <select className={selectClassName} value={riskLevel} onChange={(event) => updateEpisodeForm((current) => ({ ...current, riskLevel: event.target.value as HadEpisodeRow['risk_level'] }))}>
                    <option value="low">Bas</option>
                    <option value="moderate">Modéré</option>
                    <option value="high">Élevé</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
                <Input
                  label="Fin cible"
                  type="datetime-local"
                  value={targetEndAt}
                  onChange={(event) => updateEpisodeForm((current) => ({ ...current, targetEndAt: event.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={updateEpisode.isPending} icon={<Save className="h-4 w-4" />}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardPlus className="h-4 w-4 text-mc-green-500" />
              <h2 className="text-sm font-semibold">Ronde quotidienne</h2>
            </div>

            {dailyRound ? (
              <div className="mb-4 rounded-2xl bg-[var(--bg-tertiary)] p-3 text-sm space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">{dailyRound.decision}</Badge>
                  {dailyRound.riskScore !== undefined && <Badge variant="amber">risque {dailyRound.riskScore}/100</Badge>}
                </div>
                <p className="font-medium">{dailyRound.summary}</p>
                {dailyRound.recommendation && <p className="text-[var(--text-secondary)]">{dailyRound.recommendation}</p>}
                <p className="text-xs text-[var(--text-muted)]">Dernière ronde : {new Date(dailyRound.roundAt).toLocaleString('fr-BE')}</p>
              </div>
            ) : (
              <div className="mb-4 rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                Aucune ronde enregistrée aujourd’hui.
              </div>
            )}

            <form className="space-y-3" onSubmit={handleCreateRound}>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Décision</label>
                <select className={selectClassName} value={roundDecision} onChange={(event) => setRoundDecision(event.target.value as typeof roundDecision)}>
                  <option value="continue_episode">continue_episode</option>
                  <option value="adapt_plan">adapt_plan</option>
                  <option value="call_patient">call_patient</option>
                  <option value="urgent_nurse_visit">urgent_nurse_visit</option>
                  <option value="send_to_ed">send_to_ed</option>
                  <option value="rehospitalize">rehospitalize</option>
                  <option value="close_episode">close_episode</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Résumé</label>
                <textarea
                  className={textareaClassName}
                  value={roundSummary}
                  onChange={(event) => setRoundSummary(event.target.value)}
                  placeholder="Ex: constantes stables, poursuite OPAT 24h supplémentaires."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Recommandation</label>
                <textarea
                  className={textareaClassName}
                  value={roundRecommendation}
                  onChange={(event) => setRoundRecommendation(event.target.value)}
                  placeholder="Adaptation posologie, appel MG, visite supplémentaire..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={createRound.isPending} icon={<ClipboardPlus className="h-4 w-4" />}>
                  Enregistrer la ronde
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="h-4 w-4 text-mc-amber-500" />
              <h2 className="text-sm font-semibold">Mesures du jour</h2>
            </div>

            <form className="space-y-3 mb-4" onSubmit={handleInsertMeasurement}>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Type</label>
                <select className={selectClassName} value={measurementType} onChange={(event) => setMeasurementType(event.target.value)}>
                  <option value="temperature">temperature</option>
                  <option value="heart_rate">heart_rate</option>
                  <option value="oxygen_saturation">oxygen_saturation</option>
                  <option value="weight">weight</option>
                  <option value="glycemia">glycemia</option>
                  <option value="pain">pain</option>
                </select>
              </div>
              <div className="grid grid-cols-[1fr,110px] gap-3">
                <Input
                  label="Valeur"
                  type="number"
                  step="0.1"
                  value={measurementValue}
                  onChange={(event) => setMeasurementValue(event.target.value)}
                  required
                />
                <Input
                  label="Unité"
                  value={measurementUnit}
                  onChange={(event) => setMeasurementUnit(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Seuil</label>
                <select className={selectClassName} value={thresholdState} onChange={(event) => setThresholdState(event.target.value as typeof thresholdState)}>
                  <option value="ok">ok</option>
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              <Button type="submit" loading={insertMeasurement.isPending} className="w-full" icon={<Thermometer className="h-4 w-4" />}>
                Ajouter une mesure
              </Button>
            </form>

            <div className="space-y-2">
              {measurements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                  Aucune mesure enregistrée aujourd’hui.
                </div>
              ) : (
                measurements.map((measurement) => (
                  <div key={measurement.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge variant={measurement.thresholdState === 'critical' ? 'red' : measurement.thresholdState === 'warning' ? 'amber' : 'green'}>
                        {measurement.thresholdState}
                      </Badge>
                      <Badge variant="outline">{measurement.measurementType}</Badge>
                    </div>
                    <p className="text-sm font-semibold">
                      {measurement.valueNumeric ?? measurement.valueText} {measurement.unit}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">{new Date(measurement.recordedAt).toLocaleString('fr-BE')}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-4 w-4 text-mc-red-500" />
              <h2 className="text-sm font-semibold">Alertes, tâches & équipe</h2>
            </div>
            <div className="space-y-2">
              {(data?.alerts ?? []).slice(0, 3).map((alert) => (
                <div key={alert.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'amber' : 'blue'}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline">{alert.status}</Badge>
                  </div>
                  <p className="text-sm font-medium">{alert.title}</p>
                  {alert.description && <p className="text-xs text-[var(--text-muted)]">{alert.description}</p>}
                </div>
              ))}
              {(data?.alerts.length ?? 0) === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                  Aucune alerte ouverte pour cet épisode.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-mc-blue-500" />
                <p className="text-sm font-medium">Tâches en cours</p>
              </div>
              {(data?.tasks ?? []).slice(0, 3).map((task) => (
                <div key={task.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant={task.status === 'done' ? 'green' : 'outline'}>{task.status}</Badge>
                    <Badge variant="outline">{task.taskType}</Badge>
                  </div>
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.dueAt && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Échéance {new Date(task.dueAt).toLocaleString('fr-BE')}
                    </p>
                  )}
                </div>
              ))}
              {(data?.tasks.length ?? 0) === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                  Aucune tâche opérationnelle ouverte.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-mc-amber-500" />
                <p className="text-sm font-medium">Logistique</p>
              </div>
              {(data?.logisticsItems ?? []).slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant={item.status === 'delivered' || item.status === 'installed' ? 'green' : 'amber'}>
                      {item.status}
                    </Badge>
                    <Badge variant="outline">{item.itemType}</Badge>
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {item.supplier ?? 'Fournisseur à confirmer'}
                    {item.scheduledFor ? ` · ${new Date(item.scheduledFor).toLocaleString('fr-BE')}` : ''}
                  </p>
                </div>
              ))}
              {(data?.logisticsItems.length ?? 0) === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                  Aucune logistique suivie pour cet épisode.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {(data?.teamMembers ?? []).map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{member.profile?.fullName ?? member.externalName ?? 'Intervenant externe'}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{member.role}</p>
                  </div>
                  {member.isPrimary && <Badge variant="blue">principal</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AnimatedPage>
  );
}
