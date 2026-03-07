import { useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  ClipboardPlus,
  HeartPulse,
  History,
  Search,
  ShieldAlert,
  Stethoscope,
  Truck,
  UserRound,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, EmptyState, GradientHeader, Input } from '@/design-system';
import {
  useCompleteHadTask,
  useCreateHadTask,
  useHadEpisodeDetail,
  useHadEpisodes,
  useUpdateHadAlertStatus,
  useUpdateHadEpisode,
} from '@/hooks/useHadData';
import type { HadAlertSummary, HadEpisodeRow, HadEpisodeTask, HadTaskRow } from '@/lib/had';
import {
  appendHadSuggestionTracking,
  extractHadSuggestionTrackingCode,
  getHadSuggestionKindLabel,
  getHadSuggestionOwnerLabel,
  getHadSuggestionProgressState,
  getHadSuggestionSourceLabel,
  getHadSuggestionTaskActivityAt,
  listHadSuggestionTasks,
  type HadSuggestionProgressState,
} from '@/lib/hadSuggestionTracking';
import { useAuthStore } from '@/stores/authStore';
type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';
type ImportedTaskDraft = {
  sourceSurface: string;
  noticeTitle: string;
  noticeBody: string;
  noticeVariant: BadgeVariant;
  trackingCode?: string;
  title: string;
  description?: string;
  dueAt?: string;
  taskType?: HadTaskRow['task_type'];
  visibility?: HadTaskRow['visibility'];
  ownerKind?: HadTaskRow['owner_kind'];
  ownerLabel?: string;
};

type HadCommandCenterNavigationState = {
  selectedEpisodeId?: string;
  taskDraft?: ImportedTaskDraft;
};

interface SuggestionJournalEntry {
  trackingCode: string;
  sourceLabel: string;
  kindLabel: string;
  latestTask: HadEpisodeTask;
  history: HadEpisodeTask[];
  progressState: HadSuggestionProgressState;
}

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const textareaClassName =
  'w-full min-h-[96px] px-3 py-2.5 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
      return 'green';
    case 'escalated':
      return 'red';
    case 'paused':
      return 'amber';
    default:
      return 'blue';
  }
}

function getAlertVariant(alert: HadAlertSummary): BadgeVariant {
  if (alert.status === 'resolved' || alert.status === 'dismissed') {
    return 'green';
  }

  switch (alert.severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'amber';
    default:
      return 'blue';
  }
}

function toLocalInputValue(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
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

function formatSuggestionJournalTimestamp(value?: string) {
  return value
    ? new Date(value).toLocaleString('fr-BE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'horodatage indisponible';
}

function getSuggestionProgressMeta(progressState: HadSuggestionProgressState) {
  switch (progressState) {
    case 'validated':
      return { label: 'Validée', variant: 'green' as const };
    case 'pending':
      return { label: 'En attente', variant: 'amber' as const };
    default:
      return { label: 'À envoyer', variant: 'outline' as const };
  }
}

function getSuggestionLastStateLabel(progressState: HadSuggestionProgressState, task?: HadEpisodeTask) {
  switch (progressState) {
    case 'validated':
      return task?.completedAt ? `validée le ${formatSuggestionJournalTimestamp(task.completedAt)}` : 'validée';
    case 'pending':
      if (!task) {
        return 'en attente';
      }

      return task.dueAt
        ? `envoyée le ${formatSuggestionJournalTimestamp(task.createdAt)} · échéance ${formatSuggestionJournalTimestamp(task.dueAt)}`
        : `envoyée le ${formatSuggestionJournalTimestamp(task.createdAt)}`;
    default:
      return 'non encore envoyée au centre HAD';
  }
}

export function HADCommandCenterPage() {
  const location = useLocation();
  const navigationState = location.state as HadCommandCenterNavigationState | null;
  const initialTaskDraft = navigationState?.taskDraft;
  const user = useAuthStore((state) => state.user);
  const { data: episodes = [], isLoading } = useHadEpisodes({ onlyOpen: true });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HadEpisodeRow['status']>('all');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(navigationState?.selectedEpisodeId ?? null);
  const [taskTitle, setTaskTitle] = useState(initialTaskDraft?.title ?? '');
  const [taskDescription, setTaskDescription] = useState(initialTaskDraft?.description ?? '');
  const [taskDueAt, setTaskDueAt] = useState(initialTaskDraft?.dueAt ? toLocalInputValue(initialTaskDraft.dueAt) : '');
  const [taskType, setTaskType] = useState<HadTaskRow['task_type']>(initialTaskDraft?.taskType ?? 'call');
  const [taskVisibility, setTaskVisibility] = useState<HadTaskRow['visibility']>(initialTaskDraft?.visibility ?? 'staff');
  const [taskOwnerKind, setTaskOwnerKind] = useState<HadTaskRow['owner_kind']>(initialTaskDraft?.ownerKind ?? 'coordinator');
  const [taskOwnerLabel, setTaskOwnerLabel] = useState(initialTaskDraft?.ownerLabel ?? '');
  const [linkedAlertId, setLinkedAlertId] = useState<string | undefined>(undefined);
  const [importedTaskDraft, setImportedTaskDraft] = useState<ImportedTaskDraft | null>(initialTaskDraft ?? null);
  const completeTask = useCompleteHadTask();
  const createTask = useCreateHadTask();
  const updateAlertStatus = useUpdateHadAlertStatus();
  const updateEpisode = useUpdateHadEpisode();

  const activeCount = episodes.filter((episode) => episode.status === 'active').length;
  const escalatedCount = episodes.filter((episode) => episode.status === 'escalated').length;
  const criticalCount = episodes.filter((episode) => ['high', 'critical'].includes(episode.riskLevel)).length;
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
              episode.hospital.service,
            ]
              .filter(Boolean)
              .some((value) => value?.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [episodes, search, statusFilter]);
  const selectedEpisode = useMemo(() => {
    if (filteredEpisodes.length === 0) {
      return null;
    }

    return filteredEpisodes.find((episode) => episode.id === selectedEpisodeId) ?? filteredEpisodes[0];
  }, [filteredEpisodes, selectedEpisodeId]);
  const { data: selectedDetail } = useHadEpisodeDetail(selectedEpisode?.id);
  const suggestionJournal = useMemo<SuggestionJournalEntry[]>(() => {
    if (!selectedDetail) {
      return [];
    }

    const trackingCodes = Array.from(
      new Set(
        selectedDetail.tasks
          .map((task) => extractHadSuggestionTrackingCode(task.description))
          .filter((trackingCode): trackingCode is string => Boolean(trackingCode))
      ),
    );

    return trackingCodes
      .map((trackingCode) => {
        const history = listHadSuggestionTasks(selectedDetail.tasks, trackingCode);
        const latestTask = history[0];

        if (!latestTask) {
          return null;
        }

        return {
          trackingCode,
          sourceLabel: getHadSuggestionSourceLabel(trackingCode),
          kindLabel: getHadSuggestionKindLabel(trackingCode),
          latestTask,
          history,
          progressState: getHadSuggestionProgressState(latestTask),
        };
      })
      .filter((entry): entry is SuggestionJournalEntry => Boolean(entry))
      .sort(
        (left, right) =>
          new Date(getHadSuggestionTaskActivityAt(right.latestTask)).getTime() -
          new Date(getHadSuggestionTaskActivityAt(left.latestTask)).getTime(),
      );
  }, [selectedDetail]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEpisode) {
      return;
    }
    const normalizedDescription = appendHadSuggestionTracking(taskDescription || undefined, importedTaskDraft?.trackingCode);

    await createTask.mutateAsync({
      episodeId: selectedEpisode.id,
      linkedAlertId,
      ownerKind: taskOwnerKind,
      ownerProfileId: taskOwnerKind === 'coordinator' ? user?.id : undefined,
      ownerExternalLabel:
        taskOwnerKind === 'coordinator' || taskOwnerKind === 'patient'
          ? undefined
          : taskOwnerLabel || undefined,
      visibility: taskVisibility,
      taskType,
      title: taskTitle,
      description: normalizedDescription,
      dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : undefined,
      createdBy: user?.id,
    });

    setTaskTitle('');
    setTaskDescription('');
    setTaskDueAt('');
    setTaskType('call');
    setTaskVisibility('staff');
    setTaskOwnerKind('coordinator');
    setTaskOwnerLabel('');
    setLinkedAlertId(undefined);
    setImportedTaskDraft(null);
  }

  async function handleCompleteTask(taskId: string) {
    await completeTask.mutateAsync({
      taskId,
      status: 'done',
      completedAt: new Date().toISOString(),
      completedByProfileId: user?.id,
    });
  }

  function primeTaskFromAlert(alert: HadAlertSummary) {
    setImportedTaskDraft(null);
    setLinkedAlertId(alert.id);
    setTaskTitle(`Suivi coordination · ${alert.title}`);
    setTaskDescription(alert.description ?? '');
    setTaskType(alert.severity === 'critical' ? 'visit' : 'call');
    setTaskVisibility('staff');
    setTaskOwnerKind('coordinator');
    setTaskOwnerLabel('');
    setTaskDueAt(toLocalInputValue(new Date().toISOString()));
  }

  async function handleEpisodeStatusChange(nextStatus: HadEpisodeRow['status']) {
    if (!selectedEpisode) {
      return;
    }

    const now = new Date().toISOString();

    await updateEpisode.mutateAsync({
      episodeId: selectedEpisode.id,
      patch: {
        status: nextStatus,
        escalated_at: nextStatus === 'escalated' ? now : null,
        end_at: nextStatus === 'closed' ? now : null,
      },
    });
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-5">
      <GradientHeader
        icon={<HeartPulse className="h-5 w-5" />}
        title="Centre HAD"
        subtitle="Command center des épisodes hospitalisation à domicile"
        badge={<Badge variant="blue">{episodes.length} épisodes ouverts</Badge>}
      >
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{episodes.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">ouverts</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{activeCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">actifs</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{escalatedCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">escaladés</p>
          </div>
        </div>
      </GradientHeader>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr,220px]">
          <Input
            label="Rechercher un épisode"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Patient, référence, hôpital, diagnostic..."
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

      {!isLoading && filteredEpisodes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="Aucun épisode HAD à afficher"
            description="Ajustez les filtres ou attendez l’ouverture d’un épisode par l’équipe clinique."
          />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card padding="sm" className="text-center">
                <p className="text-lg font-bold text-mc-blue-500">{filteredEpisodes.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">visibles</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-bold text-mc-red-500">{criticalCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">à risque</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-bold text-mc-amber-500">
                  {episodes.reduce((count, episode) => count + (episode.escalatedAt ? 1 : 0), 0)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">urgences</p>
              </Card>
            </div>

            {filteredEpisodes.map((episode) => (
              <Card
                key={episode.id}
                hover
                className={`cursor-pointer space-y-3 ${
                  selectedEpisode?.id === episode.id ? 'ring-2 ring-mc-blue-500/50 border-mc-blue-500/40' : ''
                }`}
                onClick={() => setSelectedEpisodeId(episode.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusVariant(episode.status)}>{episode.status}</Badge>
                  <Badge variant={getRiskVariant(episode.riskLevel)}>{episode.riskLevel}</Badge>
                  <Badge variant="outline">{episode.reference}</Badge>
                </div>

                <div>
                  <p className="text-base font-semibold">{episode.patient.fullName || 'Patient inconnu'}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{episode.diagnosisSummary}</p>
                </div>

                <div className="grid gap-2 text-xs text-[var(--text-muted)]">
                  <p className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-mc-blue-500" />
                    {episode.hospital.name} {episode.hospital.service ? `· ${episode.hospital.service}` : ''}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-mc-green-500" />
                    Infirmier référent : {episode.primaryNurse?.fullName ?? 'non assigné'}
                  </p>
                  {episode.lastRoundAt && (
                    <p className="inline-flex items-center gap-2">
                      <Stethoscope className="h-3.5 w-3.5 text-mc-amber-500" />
                      Dernière ronde : {new Date(episode.lastRoundAt).toLocaleString('fr-BE')}
                    </p>
                  )}
                </div>

                {episode.escalatedAt && (
                  <div className="rounded-2xl bg-mc-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-mc-red-600 dark:text-red-300 inline-flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Episode escaladé le {new Date(episode.escalatedAt).toLocaleString('fr-BE')}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {selectedEpisode && selectedDetail ? (
              <>
                <Card className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(selectedDetail.episode.status)}>
                          {selectedDetail.episode.status}
                        </Badge>
                        <Badge variant={getRiskVariant(selectedDetail.episode.riskLevel)}>
                          {selectedDetail.episode.riskLevel}
                        </Badge>
                        <Badge variant="outline">{selectedDetail.episode.reference}</Badge>
                      </div>
                      <p className="text-lg font-semibold">
                        {selectedDetail.patient.fullName || 'Patient inconnu'}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {selectedDetail.episode.diagnosisSummary}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={updateEpisode.isPending}
                        onClick={() => handleEpisodeStatusChange('active')}
                      >
                        Activer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={updateEpisode.isPending}
                        onClick={() => handleEpisodeStatusChange('paused')}
                      >
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={updateEpisode.isPending}
                        onClick={() => handleEpisodeStatusChange('escalated')}
                      >
                        Escalader
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="space-y-2 text-[var(--text-secondary)]">
                      <p className="inline-flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-mc-blue-500" />
                        {selectedDetail.episode.hospital.name}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-mc-green-500" />
                        Coordinateur : {selectedDetail.episode.coordinator?.fullName ?? 'non assigné'}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-mc-amber-500" />
                        Infirmier référent : {selectedDetail.episode.primaryNurse?.fullName ?? 'non assigné'}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                        <p className="text-base font-semibold">{selectedDetail.alerts.length}</p>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">alertes</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                        <p className="text-base font-semibold">{selectedDetail.tasks.length}</p>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">tâches</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                        <p className="text-base font-semibold">{selectedDetail.logisticsItems.length}</p>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">logistique</p>
                      </div>
                    </div>
                  </div>

                  {selectedDetail.episode.escalationReason && (
                    <div className="rounded-2xl bg-mc-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-mc-red-600 dark:text-red-300">
                      {selectedDetail.episode.escalationReason}
                    </div>
                  )}
                </Card>

                <Card className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-mc-red-500" />
                    <h2 className="text-sm font-semibold">Triage des alertes</h2>
                  </div>

                  {selectedDetail.alerts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                      Aucune alerte en attente sur cet épisode.
                    </div>
                  ) : (
                    selectedDetail.alerts.map((alert) => (
                      <div key={alert.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getAlertVariant(alert)}>{alert.severity}</Badge>
                          <Badge variant="outline">{alert.status}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{alert.title}</p>
                          {alert.description && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">{alert.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {alert.status === 'open' && (
                            <Button
                              size="xs"
                              variant="outline"
                              loading={updateAlertStatus.isPending}
                              onClick={() =>
                                updateAlertStatus.mutate({
                                  alertId: alert.id,
                                  status: 'acknowledged',
                                  actedByProfileId: user?.id,
                                  assignedToProfileId: user?.id,
                                })
                              }
                            >
                              Accuser réception
                            </Button>
                          )}
                          {alert.status !== 'resolved' && alert.status !== 'dismissed' && (
                            <Button
                              size="xs"
                              variant="secondary"
                              loading={updateAlertStatus.isPending}
                              onClick={() =>
                                updateAlertStatus.mutate({
                                  alertId: alert.id,
                                  status: 'resolved',
                                  actedByProfileId: user?.id,
                                  assignedToProfileId: user?.id,
                                  resolutionNote: 'Traité depuis le centre HAD.',
                                })
                              }
                            >
                              Résoudre
                            </Button>
                          )}
                          <Button size="xs" variant="ghost" onClick={() => primeTaskFromAlert(alert)}>
                            Créer tâche liée
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardPlus className="h-4 w-4 text-mc-blue-500" />
                    <h2 className="text-sm font-semibold">Créer une tâche de suivi</h2>
                  </div>
                  <form className="space-y-3" onSubmit={handleCreateTask}>
                    {importedTaskDraft && (
                      <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={importedTaskDraft.noticeVariant}>{importedTaskDraft.noticeTitle}</Badge>
                            <Badge variant="outline">{importedTaskDraft.sourceSurface}</Badge>
                          </div>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => setImportedTaskDraft(null)}
                          >
                            Masquer
                          </Button>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{importedTaskDraft.noticeBody}</p>
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        label="Titre"
                        value={taskTitle}
                        onChange={(event) => setTaskTitle(event.target.value)}
                        placeholder="Ex: rappeler le patient avant 14h"
                        required
                      />
                      <Input
                        label="Échéance"
                        type="datetime-local"
                        value={taskDueAt}
                        onChange={(event) => setTaskDueAt(event.target.value)}
                      />
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Type</label>
                        <select
                          className={selectClassName}
                          value={taskType}
                          onChange={(event) => setTaskType(event.target.value as HadTaskRow['task_type'])}
                        >
                          <option value="call">call</option>
                          <option value="visit">visit</option>
                          <option value="measurement">measurement</option>
                          <option value="delivery">delivery</option>
                          <option value="discharge">discharge</option>
                          <option value="other">other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Visibilité</label>
                        <select
                          className={selectClassName}
                          value={taskVisibility}
                          onChange={(event) =>
                            setTaskVisibility(event.target.value as HadTaskRow['visibility'])
                          }
                        >
                          <option value="staff">staff</option>
                          <option value="patient">patient</option>
                          <option value="both">both</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">
                          Propriétaire
                        </label>
                        <select
                          className={selectClassName}
                          value={taskOwnerKind}
                          onChange={(event) =>
                            setTaskOwnerKind(event.target.value as HadTaskRow['owner_kind'])
                          }
                        >
                          <option value="coordinator">coordinator</option>
                          <option value="nurse">nurse</option>
                          <option value="patient">patient</option>
                          <option value="logistics">logistics</option>
                          <option value="gp">gp</option>
                          <option value="other">other</option>
                        </select>
                      </div>
                      <Input
                        label="Libellé propriétaire"
                        value={taskOwnerLabel}
                        onChange={(event) => setTaskOwnerLabel(event.target.value)}
                        placeholder="Ex: permanence logistique, MG traitant..."
                        disabled={taskOwnerKind === 'coordinator' || taskOwnerKind === 'patient'}
                        required={
                          taskOwnerKind !== 'coordinator' &&
                          taskOwnerKind !== 'patient' &&
                          taskOwnerKind !== 'caregiver' &&
                          taskOwnerKind !== 'system'
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">Description</label>
                      <textarea
                        className={textareaClassName}
                        value={taskDescription}
                        onChange={(event) => setTaskDescription(event.target.value)}
                        placeholder="Contexte clinique, action attendue, fenêtre de rappel..."
                      />
                    </div>

                    {linkedAlertId && (
                      <div className="rounded-2xl bg-mc-blue-50 dark:bg-mc-blue-900/20 px-3 py-2 text-xs text-mc-blue-600 dark:text-blue-300">
                        Tâche liée à l’alerte sélectionnée.
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        loading={createTask.isPending}
                        icon={<ClipboardPlus className="h-4 w-4" />}
                      >
                        Ajouter la tâche
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-mc-blue-500" />
                      <h2 className="text-sm font-semibold">Journal des suggestions</h2>
                    </div>
                    <Badge variant="outline">{suggestionJournal.length}</Badge>
                  </div>

                  {suggestionJournal.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                      Aucune suggestion HAD persistée pour cet épisode.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestionJournal.map((entry) => {
                        const progressMeta = getSuggestionProgressMeta(entry.progressState);

                        return (
                          <div key={entry.trackingCode} className="rounded-2xl bg-[var(--bg-tertiary)] p-3 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="blue">{entry.kindLabel}</Badge>
                                  <Badge variant="outline">{entry.sourceLabel}</Badge>
                                  <Badge variant={progressMeta.variant}>{progressMeta.label}</Badge>
                                </div>
                                <p className="text-sm font-medium">{entry.latestTask.title}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  Pilotage : {getHadSuggestionOwnerLabel(entry.latestTask)} · {entry.history.length} trace(s)
                                </p>
                                <p
                                  className={`text-xs ${
                                    entry.progressState === 'validated'
                                      ? 'text-mc-green-500'
                                      : entry.progressState === 'pending'
                                        ? 'text-mc-amber-600'
                                        : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  Dernier état : {getSuggestionLastStateLabel(entry.progressState, entry.latestTask)}
                                </p>
                              </div>
                              {entry.progressState !== 'validated' && (
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  loading={completeTask.isPending}
                                  onClick={() => handleCompleteTask(entry.latestTask.id)}
                                >
                                  Valider
                                </Button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {entry.history.map((task) => (
                                <div
                                  key={task.id}
                                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 space-y-1"
                                >
                                  <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                                    {task.status === 'done'
                                      ? `Validation enregistrée le ${formatSuggestionJournalTimestamp(task.completedAt ?? task.updatedAt)}`
                                      : `Suggestion envoyée le ${formatSuggestionJournalTimestamp(task.createdAt)}`}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)]">
                                    Source {entry.sourceLabel} · Pilotage {getHadSuggestionOwnerLabel(task)}
                                  </p>
                                  {task.dueAt && task.status !== 'done' && (
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                      Échéance {formatSuggestionJournalTimestamp(task.dueAt)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardPlus className="h-4 w-4 text-mc-green-500" />
                        <h2 className="text-sm font-semibold">Tâches en cours</h2>
                      </div>
                      <Badge variant="outline">{selectedDetail.tasks.length}</Badge>
                    </div>

                    {selectedDetail.tasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                        Aucun suivi opérationnel n’est encore planifié.
                      </div>
                    ) : (
                      selectedDetail.tasks.slice(0, 4).map((task) => (
                        <div key={task.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <Badge variant={task.status === 'done' ? 'green' : 'outline'}>{task.status}</Badge>
                            <Badge variant="outline">{task.taskType}</Badge>
                            {extractHadSuggestionTrackingCode(task.description) && (
                              <Badge variant="blue">Suggestion</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.dueAt && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-1">
                              Échéance {new Date(task.dueAt).toLocaleString('fr-BE')}
                            </p>
                          )}
                          {task.completedAt && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-1">
                              Validée le {new Date(task.completedAt).toLocaleString('fr-BE')}
                            </p>
                          )}
                          {task.status !== 'done' && (
                            <div className="mt-3 flex justify-end">
                              <Button
                                size="xs"
                                variant={extractHadSuggestionTrackingCode(task.description) ? 'secondary' : 'outline'}
                                loading={completeTask.isPending}
                                onClick={() => handleCompleteTask(task.id)}
                              >
                                {extractHadSuggestionTrackingCode(task.description) ? 'Valider' : 'Marquer fait'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </Card>

                  <Card className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-mc-amber-500" />
                        <h2 className="text-sm font-semibold">Logistique</h2>
                      </div>
                      <Badge variant="outline">{selectedDetail.logisticsItems.length}</Badge>
                    </div>

                    {selectedDetail.logisticsItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-xs text-[var(--text-muted)]">
                        Aucun mouvement logistique suivi pour cet épisode.
                      </div>
                    ) : (
                      selectedDetail.logisticsItems.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <Badge variant={item.status === 'delivered' || item.status === 'installed' ? 'green' : 'amber'}>
                              {item.status}
                            </Badge>
                            <Badge variant="outline">{item.itemType}</Badge>
                          </div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1">
                            {item.supplier ?? 'Fournisseur à confirmer'}
                            {item.scheduledFor ? ` · ${new Date(item.scheduledFor).toLocaleString('fr-BE')}` : ''}
                          </p>
                        </div>
                      ))
                    )}
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <EmptyState
                  icon={<HeartPulse className="h-6 w-6" />}
                  title="Sélectionnez un épisode"
                  description="Choisissez un épisode à gauche pour piloter les alertes, les tâches et la logistique."
                />
              </Card>
            )}
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
