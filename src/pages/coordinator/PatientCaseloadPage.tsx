import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CalendarClock,
  HeartPulse,
  History,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Avatar, Button, AnimatedPage, GradientHeader } from '@/design-system';
import { useHadEpisodeDetail, useHadEpisodes } from '@/hooks/useHadData';
import {
  buildHadSuggestionTrackingCode,
  getHadSuggestionOwnerLabel,
  getHadSuggestionProgressState,
  getHadSuggestionSourceLabel,
  listHadSuggestionTasks,
  type HadSuggestionProgressState,
} from '@/lib/hadSuggestionTracking';
import type { HadEpisodeListItem, HadEpisodeRow, HadEpisodeTask } from '@/lib/had';

const nurseLoads = [
  { name: 'Marie Laurent', patients: 12, katz: { O: 3, A: 4, B: 3, C: 2, Cd: 0 }, weightedLoad: 87, zone: 'Ixelles', balance: 'overloaded' as const },
  { name: 'Sophie Dupuis', patients: 10, katz: { O: 2, A: 3, B: 3, C: 1, Cd: 1 }, weightedLoad: 82, zone: 'Uccle', balance: 'optimal' as const },
  { name: 'Thomas Maes', patients: 8, katz: { O: 4, A: 2, B: 1, C: 1, Cd: 0 }, weightedLoad: 55, zone: 'Etterbeek', balance: 'light' as const },
  { name: 'Laura Van Damme', patients: 9, katz: { O: 2, A: 3, B: 2, C: 1, Cd: 1 }, weightedLoad: 78, zone: 'Watermael', balance: 'optimal' as const },
];

const katzWeights = { O: 1, A: 1.5, B: 2, C: 3, Cd: 4 };
const balanceLabels = { overloaded: 'Surchargé', optimal: 'Optimal', light: 'Léger' };
const balanceVariants = { overloaded: 'red' as const, optimal: 'green' as const, light: 'blue' as const };

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

interface NurseHadContext {
  assignedEpisodes: HadEpisodeListItem[];
  escalatedCount: number;
  highRiskCount: number;
  targetSoonCount: number;
  hadLoadScore: number;
  topEpisodes: HadEpisodeListItem[];
}
type SuggestionUrgency = 'high' | 'medium' | 'low';

interface CaseloadSuggestion {
  id: string;
  kind: 'assign' | 'rebalance';
  urgency: SuggestionUrgency;
  episode: HadEpisodeListItem;
  sourceNurse?: string;
  targetNurse: string;
  rationale: string;
  impactLabel: string;
}

const emptyHadContext: NurseHadContext = {
  assignedEpisodes: [],
  escalatedCount: 0,
  highRiskCount: 0,
  targetSoonCount: 0,
  hadLoadScore: 0,
  topEpisodes: [],
};

function getSuggestionUrgencyVariant(urgency: SuggestionUrgency): BadgeVariant {
  switch (urgency) {
    case 'high':
      return 'red';
    case 'medium':
      return 'amber';
    default:
      return 'blue';
  }
}

function getSuggestionUrgencyLabel(urgency: SuggestionUrgency) {
  switch (urgency) {
    case 'high':
      return 'Urgent';
    case 'medium':
      return 'À préparer';
    default:
      return 'À lisser';
  }
}

function getCaseloadSuggestionLabel(kind: CaseloadSuggestion['kind']) {
  return kind === 'assign' ? 'Affectation' : 'Rééquilibrage';
}

function getCaseloadActionLabel(kind: CaseloadSuggestion['kind']) {
  return kind === 'assign' ? 'Préparer affectation' : 'Préparer transfert';
}

function formatSuggestionHistoryTimestamp(value?: string) {
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

function getSuggestionActionLabel(progressState: HadSuggestionProgressState, kind: CaseloadSuggestion['kind']) {
  if (progressState === 'draft') {
    return getCaseloadActionLabel(kind);
  }

  return progressState === 'pending' ? 'Ouvrir le suivi' : 'Voir validation';
}

function getSuggestionLastStateLabel(progressState: HadSuggestionProgressState, task?: HadEpisodeTask) {
  switch (progressState) {
    case 'validated':
      return task?.completedAt ? `validée le ${formatSuggestionHistoryTimestamp(task.completedAt)}` : 'validée';
    case 'pending':
      if (!task) {
        return 'en attente';
      }

      return task.dueAt
        ? `envoyée le ${formatSuggestionHistoryTimestamp(task.createdAt)} · échéance ${formatSuggestionHistoryTimestamp(task.dueAt)}`
        : `envoyée le ${formatSuggestionHistoryTimestamp(task.createdAt)}`;
    default:
      return 'non encore envoyée au centre HAD';
  }
}

function getCaseloadTrackingCode(suggestion: CaseloadSuggestion) {
  return buildHadSuggestionTrackingCode(
    'caseload',
    suggestion.kind,
    suggestion.episode.id,
    suggestion.sourceNurse,
    suggestion.targetNurse,
  );
}

interface CaseloadSuggestionCardProps {
  suggestion: CaseloadSuggestion;
  onPrepare: (suggestion: CaseloadSuggestion) => void;
  onOpen: (episodeId: string) => void;
}

function CaseloadSuggestionCard({ suggestion, onPrepare, onOpen }: CaseloadSuggestionCardProps) {
  const trackingCode = getCaseloadTrackingCode(suggestion);
  const { data: detail } = useHadEpisodeDetail(suggestion.episode.id);
  const matchingTasks = detail ? listHadSuggestionTasks(detail.tasks, trackingCode) : [];
  const matchingTask = matchingTasks[0];
  const progressState = getHadSuggestionProgressState(matchingTask);
  const progressMeta = getSuggestionProgressMeta(progressState);

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{suggestion.episode.patient.fullName}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {suggestion.sourceNurse
              ? `${suggestion.sourceNurse} → ${suggestion.targetNurse}`
              : `Affecter à ${suggestion.targetNurse}`}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <Badge variant="blue">{getCaseloadSuggestionLabel(suggestion.kind)}</Badge>
          <Badge variant={getSuggestionUrgencyVariant(suggestion.urgency)}>
            {getSuggestionUrgencyLabel(suggestion.urgency)}
          </Badge>
          <Badge variant={progressMeta.variant}>{progressMeta.label}</Badge>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{suggestion.rationale}</p>
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
          <History className="h-3.5 w-3.5 text-mc-blue-500" />
          <span>Historique</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          {matchingTask
            ? `${getHadSuggestionSourceLabel(trackingCode)} · journalisée le ${formatSuggestionHistoryTimestamp(matchingTask.createdAt)}`
            : `${getHadSuggestionSourceLabel(trackingCode)} · aucune trace persistée`}
          {matchingTasks.length > 1 ? ` · ${matchingTasks.length} traces` : ''}
        </p>
        {matchingTask && (
          <p className="text-[11px] text-[var(--text-muted)]">
            Pilotage : {getHadSuggestionOwnerLabel(matchingTask)}
          </p>
        )}
        <p
          className={`text-[11px] ${
            progressState === 'validated'
              ? 'text-mc-green-500'
              : progressState === 'pending'
                ? 'text-mc-amber-600'
                : 'text-[var(--text-muted)]'
          }`}
        >
          Dernier état : {getSuggestionLastStateLabel(progressState, matchingTask)}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-mc-blue-500">{suggestion.impactLabel}</span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (progressState === 'draft' ? onPrepare(suggestion) : onOpen(suggestion.episode.id))}
          >
            {getSuggestionActionLabel(progressState, suggestion.kind)}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpen(suggestion.episode.id)}>
            Centre HAD
          </Button>
        </div>
      </div>
    </div>
  );
}

function getHadStatusVariant(status: HadEpisodeRow['status']): BadgeVariant {
  switch (status) {
    case 'active':
      return 'green';
    case 'escalated':
      return 'red';
    case 'paused':
      return 'amber';
    case 'planned':
    case 'eligible':
      return 'blue';
    default:
      return 'outline';
  }
}

function getHadRiskVariant(riskLevel: HadEpisodeRow['risk_level']): BadgeVariant {
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

function isTargetWithinHours(targetEndAt: string | undefined, hours: number) {
  if (!targetEndAt) {
    return false;
  }

  const diff = new Date(targetEndAt).getTime() - Date.now();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

function formatHadTargetEnd(targetEndAt?: string) {
  if (!targetEndAt) {
    return 'Pas de sortie cible';
  }

  return new Date(targetEndAt).toLocaleString('fr-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getHadCaseloadScore(episode: HadEpisodeListItem) {
  let score = 8;

  if (episode.status === 'escalated') {
    score += 18;
  } else if (episode.status === 'planned' || episode.status === 'paused') {
    score += 10;
  }

  if (episode.riskLevel === 'critical') {
    score += 16;
  } else if (episode.riskLevel === 'high') {
    score += 12;
  } else if (episode.riskLevel === 'moderate') {
    score += 6;
  }

  if (isTargetWithinHours(episode.targetEndAt, 48)) {
    score += 8;
  }

  return score;
}

function compareHadEpisodes(left: HadEpisodeListItem, right: HadEpisodeListItem) {
  const scoreDiff = getHadCaseloadScore(right) - getHadCaseloadScore(left);

  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  const leftTarget = left.targetEndAt ? new Date(left.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;
  const rightTarget = right.targetEndAt ? new Date(right.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;

  return leftTarget - rightTarget;
}

export function PatientCaseloadPage() {
  const navigate = useNavigate();
  const { data: hadEpisodes = [], isLoading: isHadLoading } = useHadEpisodes({ onlyOpen: true });
  const totalPatients = nurseLoads.reduce((s, n) => s + n.patients, 0);
  const avgLoad = Math.round(nurseLoads.reduce((s, n) => s + n.weightedLoad, 0) / nurseLoads.length);
  const overloadedNurses = nurseLoads.filter((nurse) => nurse.balance === 'overloaded');
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length;

  const nurseHadContext = useMemo(
    () =>
      new Map<string, NurseHadContext>(
        nurseLoads.map((nurse) => {
          const assignedEpisodes = hadEpisodes.filter((episode) => episode.primaryNurse?.fullName === nurse.name);

          return [
            nurse.name,
            {
              assignedEpisodes,
              escalatedCount: assignedEpisodes.filter((episode) => episode.status === 'escalated').length,
              highRiskCount: assignedEpisodes.filter((episode) => ['high', 'critical'].includes(episode.riskLevel)).length,
              targetSoonCount: assignedEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length,
              hadLoadScore: assignedEpisodes.reduce((score, episode) => score + getHadCaseloadScore(episode), 0),
              topEpisodes: [...assignedEpisodes].sort(compareHadEpisodes).slice(0, 2),
            },
          ];
        }),
      ),
    [hadEpisodes],
  );

  const hadPriorityEpisodes = useMemo(
    () => [...hadEpisodes].sort(compareHadEpisodes).slice(0, 3),
    [hadEpisodes],
  );

  const hadOutsideRoster = useMemo(
    () =>
      hadEpisodes
        .filter((episode) => {
          const nurseName = episode.primaryNurse?.fullName;
          return !nurseName || !nurseLoads.some((nurse) => nurse.name === nurseName);
        })
        .sort(compareHadEpisodes)
        .slice(0, 3),
    [hadEpisodes],
  );

  const nursesWithHadCount = nurseLoads.filter(
    (nurse) => (nurseHadContext.get(nurse.name) ?? emptyHadContext).assignedEpisodes.length > 0,
  ).length;
  const caseloadSuggestions = useMemo(() => {
    function getUrgency(episode: HadEpisodeListItem): SuggestionUrgency {
      if (episode.status === 'escalated' || episode.riskLevel === 'critical') {
        return 'high';
      }

      if (episode.riskLevel === 'high' || isTargetWithinHours(episode.targetEndAt, 48)) {
        return 'medium';
      }

      return 'low';
    }

    function findBestTarget(episode: HadEpisodeListItem, excludedName?: string) {
      return nurseLoads
        .filter((nurse) => nurse.name !== excludedName)
        .map((nurse) => {
          const hadContext = nurseHadContext.get(nurse.name) ?? emptyHadContext;
          let score = 0;

          if (nurse.balance === 'light') {
            score += 35;
          } else if (nurse.balance === 'optimal') {
            score += 20;
          } else {
            score -= 20;
          }

          score += Math.max(0, 100 - nurse.weightedLoad);
          score += Math.max(0, 36 - hadContext.hadLoadScore);

          if (nurse.zone === episode.patient.city) {
            score += 26;
          }

          if (hadContext.escalatedCount === 0) {
            score += 6;
          }

          return { nurse, hadContext, score };
        })
        .sort((left, right) => right.score - left.score)[0];
    }

    const suggestions: CaseloadSuggestion[] = [];
    const usedEpisodeIds = new Set<string>();

    hadOutsideRoster.forEach((episode) => {
      if (suggestions.length >= 3 || usedEpisodeIds.has(episode.id)) {
        return;
      }

      const target = findBestTarget(episode);

      if (!target) {
        return;
      }

      suggestions.push({
        id: `assign-${episode.id}`,
        kind: 'assign',
        urgency: getUrgency(episode),
        episode,
        targetNurse: target.nurse.name,
        rationale:
          target.nurse.zone === episode.patient.city
            ? `${target.nurse.name} couvre déjà ${target.nurse.zone} avec une charge de ${target.nurse.weightedLoad}%.`
            : `${target.nurse.name} reste le meilleur point d’entrée avec une charge de ${target.nurse.weightedLoad}% et une pression HAD maîtrisée.`,
        impactLabel:
          target.nurse.zone === episode.patient.city
            ? 'Couverture zone directe'
            : `Capacité disponible ~${Math.max(8, 100 - target.nurse.weightedLoad)} pts`,
      });
      usedEpisodeIds.add(episode.id);
    });

    overloadedNurses.forEach((sourceNurse) => {
      if (suggestions.length >= 3) {
        return;
      }

      const sourceContext = nurseHadContext.get(sourceNurse.name) ?? emptyHadContext;
      const episode = sourceContext.topEpisodes.find((candidate) => !usedEpisodeIds.has(candidate.id));

      if (!episode) {
        return;
      }

      const target = findBestTarget(episode, sourceNurse.name);

      if (!target || target.nurse.name === sourceNurse.name) {
        return;
      }

      const estimatedRelief = Math.max(
        8,
        Math.round(
          (sourceNurse.weightedLoad - target.nurse.weightedLoad + sourceContext.hadLoadScore - target.hadContext.hadLoadScore) / 2,
        ),
      );

      suggestions.push({
        id: `rebalance-${episode.id}`,
        kind: 'rebalance',
        urgency: getUrgency(episode),
        episode,
        sourceNurse: sourceNurse.name,
        targetNurse: target.nurse.name,
        rationale:
          target.nurse.zone === episode.patient.city
            ? `${target.nurse.name} est mieux placé sur ${episode.patient.city} pour soulager ${sourceNurse.name}.`
            : `${sourceNurse.name} absorbe une surcharge à ${sourceNurse.weightedLoad}% alors que ${target.nurse.name} reste plus disponible à ${target.nurse.weightedLoad}%.`,
        impactLabel: `Allège ~${estimatedRelief} pts`,
      });
      usedEpisodeIds.add(episode.id);
    });

    if (suggestions.length === 0) {
      const stressedNurses = nurseLoads
        .map((nurse) => ({
          nurse,
          hadContext: nurseHadContext.get(nurse.name) ?? emptyHadContext,
        }))
        .filter(({ hadContext }) => hadContext.assignedEpisodes.length > 0)
        .sort(
          (left, right) =>
            right.hadContext.hadLoadScore + right.nurse.weightedLoad - (left.hadContext.hadLoadScore + left.nurse.weightedLoad),
        );

      stressedNurses.forEach(({ nurse, hadContext }) => {
        if (suggestions.length >= 2) {
          return;
        }

        const episode = hadContext.topEpisodes.find((candidate) => !usedEpisodeIds.has(candidate.id));

        if (!episode) {
          return;
        }

        const target = findBestTarget(episode, nurse.name);

        if (!target || target.nurse.name === nurse.name) {
          return;
        }

        suggestions.push({
          id: `smooth-${episode.id}`,
          kind: 'rebalance',
          urgency: 'low',
          episode,
          sourceNurse: nurse.name,
          targetNurse: target.nurse.name,
          rationale: `Lissage préventif conseillé avant tension supplémentaire sur ${episode.patient.fullName}.`,
          impactLabel: `Marge cible ${Math.max(6, 100 - target.nurse.weightedLoad)} pts`,
        });
        usedEpisodeIds.add(episode.id);
      });
    }

    return suggestions.slice(0, 3);
  }, [hadOutsideRoster, nurseHadContext, overloadedNurses]);

  function openHadEpisode(episodeId: string) {
    navigate('/coordinator/had-command-center', { state: { selectedEpisodeId: episodeId } });
  }

  function openCaseloadSuggestion(suggestion: CaseloadSuggestion) {
    navigate('/coordinator/had-command-center', {
      state: {
        selectedEpisodeId: suggestion.episode.id,
        taskDraft: {
          sourceSurface: 'Charge Patients',
          noticeTitle: suggestion.kind === 'assign' ? 'Affectation suggérée' : 'Rééquilibrage suggéré',
          noticeBody: suggestion.rationale,
          noticeVariant: getSuggestionUrgencyVariant(suggestion.urgency),
          trackingCode: getCaseloadTrackingCode(suggestion),
          title:
            suggestion.kind === 'assign'
              ? `Affectation HAD · ${suggestion.episode.patient.fullName} → ${suggestion.targetNurse}`
              : `Rééquilibrage HAD · ${suggestion.sourceNurse} → ${suggestion.targetNurse}`,
          description: [
            suggestion.kind === 'assign'
              ? `Valider l’affectation de ${suggestion.episode.patient.fullName} à ${suggestion.targetNurse}.`
              : `Organiser le transfert HAD de ${suggestion.sourceNurse} vers ${suggestion.targetNurse}.`,
            suggestion.rationale,
            `Impact attendu : ${suggestion.impactLabel}.`,
            `Patient : ${suggestion.episode.patient.fullName} · ${suggestion.episode.patient.city}.`,
            `Épisode : ${suggestion.episode.reference}.`,
          ].join('\n'),
          taskType: suggestion.kind === 'assign' ? 'visit' : 'call',
          visibility: 'staff',
          ownerKind: 'nurse',
          ownerLabel: suggestion.targetNurse,
        },
      },
    });
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Heart className="h-5 w-5" />}
        title="Charge Patients"
        subtitle="Distribution, équilibrage et pression HAD"
        badge={
          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={() => navigate('/coordinator/had-command-center')}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Rééquilibrer
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 mt-1 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalPatients}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{avgLoad}%</p>
            <p className="text-[10px] text-white/60">Charge moy.</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{hadEpisodes.length}</p>
            <p className="text-[10px] text-white/60">HAD ouvertes</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${hadEscalatedCount > 0 ? 'text-mc-red-200' : 'text-white'}`}>
              {hadEscalatedCount + hadOutsideRoster.length}
            </p>
            <p className="text-[10px] text-white/60">Tensions HAD</p>
          </div>
        </div>
      </GradientHeader>

      {(overloadedNurses.length > 0 || hadEscalatedCount > 0 || hadOutsideRoster.length > 0) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-mc-red-50 dark:bg-red-900/20 border border-mc-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-mc-red-500 shrink-0" />
          <span className="text-xs font-medium text-mc-red-600 dark:text-mc-red-400">
            {overloadedNurses.length > 0 ? `${overloadedNurses.map((nurse) => nurse.name).join(', ')} en surcharge` : 'Caseload global stable'}
            {hadEscalatedCount > 0 ? ` · ${hadEscalatedCount} épisode(s) HAD escaladé(s)` : ''}
            {hadOutsideRoster.length > 0 ? ` · ${hadOutsideRoster.length} épisode(s) à rattacher à un caseload infirmier` : ''}
          </span>
        </div>
      )}

      <Card className="space-y-4 border-l-4 border-l-mc-red-500">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <HeartPulse className="h-5 w-5 text-mc-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Impact HAD sur le caseload</p>
              <p className="text-xs text-[var(--text-muted)]">
                Visualiser les épisodes qui pèsent sur la répartition patients et les besoins de réaffectation.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/coordinator/had-command-center')}>
            Centre HAD
          </Button>
        </div>

        {isHadLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((placeholder) => (
              <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
            ))}
          </div>
        ) : hadEpisodes.length === 0 ? (
          <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-muted)]">
            Aucun épisode HAD ouvert n’impacte le caseload pour l’instant.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                <p className="text-lg font-bold text-mc-blue-500">{hadEpisodes.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">HAD ouvertes</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                <p className="text-lg font-bold text-mc-red-500">{hadEscalatedCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">escaladées</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                <p className="text-lg font-bold text-mc-amber-500">{hadTargetSoonCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">sorties &lt;48h</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                <p className="text-lg font-bold text-mc-green-500">{nursesWithHadCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">infirmiers exposés</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-mc-amber-500" />
                <p className="text-sm font-medium">Réaffectations recommandées</p>
              </div>
              {caseloadSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {caseloadSuggestions.map((suggestion) => (
                    <CaseloadSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onPrepare={openCaseloadSuggestion}
                      onOpen={openHadEpisode}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-default)] px-3 py-3 text-xs text-[var(--text-muted)]">
                  Aucun transfert HAD supplémentaire n’est recommandé à ce stade.
                </div>
              )}
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-mc-red-500" />
                  <p className="text-sm font-medium">Priorités HAD à répercuter sur la charge</p>
                </div>
                <div className="space-y-2">
                  {hadPriorityEpisodes.map((episode) => (
                    <button
                      key={episode.id}
                      type="button"
                      onClick={() => openHadEpisode(episode.id)}
                      className="w-full text-left rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{episode.patient.fullName}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {episode.primaryNurse?.fullName ?? 'Affectation infirmière à confirmer'} · {episode.patient.city}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          <Badge variant={getHadStatusVariant(episode.status)}>{episode.status}</Badge>
                          <Badge variant={getHadRiskVariant(episode.riskLevel)}>{episode.riskLevel}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-muted)]">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>{formatHadTargetEnd(episode.targetEndAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-mc-blue-500" />
                  <p className="text-sm font-medium">Épisodes à raccrocher au bon caseload</p>
                </div>
                {hadOutsideRoster.length > 0 ? (
                  <div className="space-y-2">
                    {hadOutsideRoster.map((episode) => (
                      <button
                        key={episode.id}
                        type="button"
                        onClick={() => openHadEpisode(episode.id)}
                        className="w-full text-left rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <p className="text-sm font-semibold">{episode.patient.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {episode.primaryNurse?.fullName ?? 'Aucun infirmier principal'} · {episode.hospital.name}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-default)] px-3 py-3 text-xs text-[var(--text-muted)]">
                    Tous les épisodes HAD ouverts sont déjà rattachés à un infirmier du portefeuille actuel.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="space-y-3">
        {nurseLoads.map((nurse) => {
          const hadContext = nurseHadContext.get(nurse.name) ?? emptyHadContext;

          return (
            <Card key={nurse.name} hover>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={nurse.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{nurse.name}</p>
                    <Badge variant={balanceVariants[nurse.balance]}>{balanceLabels[nurse.balance]}</Badge>
                    {hadContext.assignedEpisodes.length > 0 && (
                      <Badge variant={hadContext.escalatedCount > 0 ? 'red' : 'blue'}>
                        {hadContext.assignedEpisodes.length} HAD
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {nurse.zone} · {nurse.patients} patients
                    {hadContext.highRiskCount > 0 ? ` · ${hadContext.highRiskCount} HAD haut risque` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{nurse.weightedLoad}%</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Charge pondérée</p>
                  {hadContext.assignedEpisodes.length > 0 && (
                    <p className="text-[10px] text-mc-red-500">Impact HAD +{hadContext.hadLoadScore} pts</p>
                  )}
                </div>
              </div>

              <div className="h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    nurse.balance === 'overloaded' ? 'bg-mc-red-500' : nurse.balance === 'optimal' ? 'bg-mc-green-500' : 'bg-mc-blue-500'
                  }`}
                  style={{ width: `${Math.min(nurse.weightedLoad, 100)}%` }}
                />
              </div>

              <div className="flex gap-2">
                {Object.entries(nurse.katz).map(([cat, count]) => (
                  <div key={cat} className="flex-1 text-center p-1.5 rounded-lg bg-[var(--bg-tertiary)]">
                    <p className="text-sm font-bold">{count}</p>
                    <Badge variant={cat === 'Cd' ? 'red' : cat === 'C' ? 'amber' : 'blue'} className="text-[9px]">
                      {cat}
                    </Badge>
                  </div>
                ))}
              </div>

              {hadContext.assignedEpisodes.length > 0 ? (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                      <p className="text-sm font-bold">{hadContext.assignedEpisodes.length}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">HAD</p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                      <p className="text-sm font-bold text-mc-red-500">{hadContext.escalatedCount}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Escaladées</p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                      <p className="text-sm font-bold text-mc-amber-500">{hadContext.targetSoonCount}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Sorties &lt;48h</p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2 text-center">
                      <p className="text-sm font-bold text-mc-blue-500">{hadContext.hadLoadScore}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Pression HAD</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {hadContext.topEpisodes.map((episode) => (
                      <button
                        key={episode.id}
                        type="button"
                        onClick={() => openHadEpisode(episode.id)}
                        className="w-full text-left rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{episode.patient.fullName}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                              {episode.diagnosisSummary || episode.hospital.service || episode.hospital.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Badge variant={getHadStatusVariant(episode.status)}>{episode.status}</Badge>
                            <Badge variant={getHadRiskVariant(episode.riskLevel)}>{episode.riskLevel}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-muted)]">
                          <CalendarClock className="h-3.5 w-3.5" />
                          <span>{formatHadTargetEnd(episode.targetEndAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  Aucun épisode HAD actuellement rattaché à ce caseload infirmier.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Card glass>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-mc-blue-500" />
          <span className="text-xs font-semibold">Pondération Katz</span>
        </div>
        <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
          {Object.entries(katzWeights).map(([cat, w]) => (
            <span key={cat}>Cat.{cat} = ×{w}</span>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
