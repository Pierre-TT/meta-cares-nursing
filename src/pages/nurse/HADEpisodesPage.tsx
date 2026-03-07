import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronRight,
  ClipboardPlus,
  HeartPulse,
  ListTodo,
  MapPin,
  Phone,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, EmptyState, GradientHeader, Input } from '@/design-system';
import { useCreateHadEpisode, useHadEpisodes } from '@/hooks/useHadData';
import { useNursePatients } from '@/hooks/useNursePatients';
import type { HadEpisodeRow } from '@/lib/had';
import { useAuthStore } from '@/stores/authStore';
type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const textareaClassName =
  'w-full min-h-[88px] px-3 py-2.5 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

function toIsoOrUndefined(value: string) {
  return value ? new Date(value).toISOString() : undefined;
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

export function HADEpisodesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: episodes = [], isLoading } = useHadEpisodes({ onlyOpen: true });
  const { data: patients = [], isLoading: isPatientsLoading, error: patientsError } = useNursePatients();
  const createEpisode = useCreateHadEpisode();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [episodeType, setEpisodeType] = useState<HadEpisodeRow['episode_type']>('opat');
  const [riskLevel, setRiskLevel] = useState<HadEpisodeRow['risk_level']>('moderate');
  const [originatingHospital, setOriginatingHospital] = useState('Hôpital partenaire');
  const [diagnosisSummary, setDiagnosisSummary] = useState('');
  const [admissionReason, setAdmissionReason] = useState('');
  const [startAt, setStartAt] = useState('');
  const [targetEndAt, setTargetEndAt] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HadEpisodeRow['status']>('all');

  const summary = useMemo(() => {
    return {
      total: episodes.length,
      active: episodes.filter((episode) => episode.status === 'active').length,
      escalated: episodes.filter((episode) => episode.status === 'escalated').length,
    };
  }, [episodes]);
  const openEpisodeByPatientId = useMemo(
    () => new Map(episodes.map((episode) => [episode.patient.id, episode])),
    [episodes],
  );
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.databaseId === selectedPatientId),
    [patients, selectedPatientId],
  );
  const selectedPatientOpenEpisode = selectedPatient
    ? openEpisodeByPatientId.get(selectedPatient.databaseId)
    : undefined;
  const filteredPatientOptions = useMemo(() => {
    const normalizedSearch = patientSearch.trim().toLowerCase();

    return patients
      .filter((patient) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          `${patient.firstName} ${patient.lastName}`,
          patient.niss,
          patient.address.city,
          patient.phone,
          patient.mutuality,
          ...patient.pathologies,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .slice(0, 6);
  }, [patients, patientSearch]);
  const canCreateEpisode = Boolean(selectedPatient) && !selectedPatientOpenEpisode;
  const filteredEpisodes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return episodes.filter((episode) => {
      const matchesStatus = statusFilter === 'all' ? true : episode.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              episode.reference,
              episode.patient.fullName,
              episode.diagnosisSummary,
              episode.hospital.name,
            ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [episodes, search, statusFilter]);

  async function handleCreateEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPatient || selectedPatientOpenEpisode) {
      return;
    }

    const createdEpisode = await createEpisode.mutateAsync({
      patientId: selectedPatient.databaseId,
      episodeType,
      riskLevel,
      diagnosisSummary,
      admissionReason,
      originatingHospital,
      primaryNurseProfileId: user?.id,
      createdBy: user?.id,
      startAt: toIsoOrUndefined(startAt),
      targetEndAt: toIsoOrUndefined(targetEndAt),
    });
    setSelectedPatientId('');
    setPatientSearch('');
    setEpisodeType('opat');
    setRiskLevel('moderate');
    setDiagnosisSummary('');
    setAdmissionReason('');
    setStartAt('');
    setTargetEndAt('');

    navigate(`/nurse/had/${createdEpisode.id}`);
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <GradientHeader
        icon={<HeartPulse className="h-5 w-5" />}
        title="Episodes HAD"
        subtitle="Vue infirmière des hospitalisations à domicile actives"
        badge={<Badge variant="blue">{summary.total} épisode{summary.total > 1 ? 's' : ''}</Badge>}
      >
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{summary.total}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">ouverts</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{summary.active}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">actifs</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{summary.escalated}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">escaladés</p>
          </div>
        </div>
      </GradientHeader>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardPlus className="h-4 w-4 text-mc-blue-500" />
          <h2 className="text-sm font-semibold">Créer un épisode HAD</h2>
        </div>
        <form className="space-y-3" onSubmit={handleCreateEpisode}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Patient</label>
              {selectedPatient ? (
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          {selectedPatient.lastName} {selectedPatient.firstName}
                        </p>
                        {selectedPatient.katzCategory && (
                          <Badge variant="outline">Katz {selectedPatient.katzCategory}</Badge>
                        )}
                        <Badge variant={selectedPatientOpenEpisode ? 'amber' : 'green'}>
                          {selectedPatientOpenEpisode ? 'Épisode HAD déjà ouvert' : 'Prêt pour ouverture HAD'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {selectedPatient.address.postalCode} {selectedPatient.address.city}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {selectedPatient.phone}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatientId('');
                        setPatientSearch('');
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Changer
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{selectedPatient.mutuality}</Badge>
                    {selectedPatient.pathologies.slice(0, 3).map((pathology) => (
                      <span
                        key={pathology}
                        className="rounded-full bg-[var(--bg-tertiary)] px-2 py-1 text-[10px] text-[var(--text-muted)]"
                      >
                        {pathology}
                      </span>
                    ))}
                    {selectedPatient.pathologies.length > 3 && (
                      <span className="self-center text-[10px] text-[var(--text-muted)]">
                        +{selectedPatient.pathologies.length - 3}
                      </span>
                    )}
                  </div>

                  {selectedPatientOpenEpisode ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              Un épisode HAD ouvert existe déjà pour ce patient.
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {selectedPatientOpenEpisode.reference} · {selectedPatientOpenEpisode.status} ·{' '}
                              {selectedPatientOpenEpisode.diagnosisSummary}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/nurse/had/${selectedPatientOpenEpisode.id}`)}
                          >
                            Voir l’épisode existant
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                      Aucun épisode HAD ouvert détecté. L’ouverture utilisera automatiquement l’identifiant patient
                      interne, sans saisie d’UUID.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Rechercher par nom, NISS, ville, pathologie…"
                    icon={<Search className="h-4 w-4" />}
                  />

                  {patientsError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-500">
                      Impossible de charger la liste des patients pour le moment.
                    </div>
                  ) : isPatientsLoading ? (
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3">
                      <div className="h-20 animate-pulse rounded-xl bg-[var(--bg-tertiary)]" />
                    </div>
                  ) : filteredPatientOptions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-3 py-4 text-sm text-[var(--text-muted)]">
                      Aucun patient actif ne correspond à cette recherche.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPatientOptions.map((patient) => {
                        const existingEpisode = openEpisodeByPatientId.get(patient.databaseId);

                        return (
                          <button
                            key={patient.databaseId}
                            type="button"
                            className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-left transition hover:border-mc-blue-500/40 hover:bg-[var(--bg-tertiary)]"
                            onClick={() => {
                              setSelectedPatientId(patient.databaseId);
                              setPatientSearch('');
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">
                                <UserRound className="h-4 w-4 text-mc-blue-500" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {patient.lastName} {patient.firstName}
                                  </p>
                                  {patient.katzCategory && (
                                    <Badge variant="outline">Katz {patient.katzCategory}</Badge>
                                  )}
                                  <Badge variant={existingEpisode ? 'amber' : 'green'}>
                                    {existingEpisode ? 'HAD ouverte' : 'Disponible'}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {patient.address.postalCode} {patient.address.city}
                                  </span>
                                  <span>{patient.mutuality}</span>
                                </div>
                                {patient.pathologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {patient.pathologies.slice(0, 2).map((pathology) => (
                                      <span
                                        key={pathology}
                                        className="rounded-full bg-[var(--bg-tertiary)] px-2 py-1 text-[10px] text-[var(--text-muted)]"
                                      >
                                        {pathology}
                                      </span>
                                    ))}
                                    {patient.pathologies.length > 2 && (
                                      <span className="self-center text-[10px] text-[var(--text-muted)]">
                                        +{patient.pathologies.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Type d’épisode</label>
              <select
                className={selectClassName}
                value={episodeType}
                onChange={(event) => setEpisodeType(event.target.value as HadEpisodeRow['episode_type'])}
              >
                <option value="opat">Antibiothérapie / OPAT</option>
                <option value="oncology_at_home">Oncologie à domicile</option>
                <option value="heart_failure_virtual_ward">Insuffisance cardiaque</option>
                <option value="post_acute_virtual_ward">Virtual ward post-aigu</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Risque</label>
              <select
                className={selectClassName}
                value={riskLevel}
                onChange={(event) => setRiskLevel(event.target.value as HadEpisodeRow['risk_level'])}
              >
                <option value="low">Bas</option>
                <option value="moderate">Modéré</option>
                <option value="high">Élevé</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            <Input
              label="Hôpital d’origine"
              value={originatingHospital}
              onChange={(event) => setOriginatingHospital(event.target.value)}
              placeholder="CHU / service source"
              required
            />
            <Input
              label="Début prévu"
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
            <Input
              label="Fin cible"
              type="datetime-local"
              value={targetEndAt}
              onChange={(event) => setTargetEndAt(event.target.value)}
            />
          </div>

          <Input
            label="Résumé diagnostique"
            value={diagnosisSummary}
            onChange={(event) => setDiagnosisSummary(event.target.value)}
            placeholder="Ex: cellulite jambe droite nécessitant OPAT"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Motif d’admission HAD</label>
            <textarea
              className={textareaClassName}
              value={admissionReason}
              onChange={(event) => setAdmissionReason(event.target.value)}
              placeholder="Contexte clinique, raison du switch hôpital → domicile, objectif de surveillance..."
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={createEpisode.isPending}
              disabled={!canCreateEpisode}
              icon={<ClipboardPlus className="h-4 w-4" />}
            >
              Ouvrir l’épisode HAD
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr,220px]">
          <Input
            label="Rechercher un épisode"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Patient, référence, diagnostic, hôpital..."
            icon={<Search className="h-4 w-4" />}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Filtrer par statut</label>
            <select
              className={selectClassName}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | HadEpisodeRow['status'])}
            >
              <option value="all">Tous les statuts</option>
              <option value="planned">planned</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="escalated">escalated</option>
              <option value="eligible">eligible</option>
              <option value="screening">screening</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-mc-green-500" />
            <h2 className="text-sm font-semibold">Episodes en cours</h2>
          </div>
          <Badge variant="outline">{filteredEpisodes.length} résultats</Badge>
        </div>

        {!isLoading && filteredEpisodes.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Building2 className="h-6 w-6" />}
              title={episodes.length === 0 ? 'Aucun épisode HAD actif' : 'Aucun épisode ne correspond aux filtres'}
              description={
                episodes.length === 0
                  ? 'Crée le premier épisode depuis le formulaire ci-dessus pour démarrer la chambre virtuelle.'
                  : 'Ajuste la recherche ou le filtre de statut pour retrouver un épisode existant.'
              }
            />
          </Card>
        ) : (
          filteredEpisodes.map((episode) => (
            <Card
              key={episode.id}
              hover
              className="cursor-pointer"
              onClick={() => navigate(`/nurse/had/${episode.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <UserRound className="h-5 w-5 text-mc-blue-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{episode.patient.fullName || 'Patient inconnu'}</p>
                    <Badge variant={getStatusVariant(episode.status)}>{episode.status}</Badge>
                    <Badge variant={getRiskVariant(episode.riskLevel)}>{episode.riskLevel}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{episode.reference} · {episode.episodeType}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{episode.diagnosisSummary}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {episode.hospital.name}
                    </span>
                    {episode.targetEndAt && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        cible {new Date(episode.targetEndAt).toLocaleString('fr-BE')}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-1" />
              </div>
            </Card>
          ))
        )}
      </div>
    </AnimatedPage>
  );
}
