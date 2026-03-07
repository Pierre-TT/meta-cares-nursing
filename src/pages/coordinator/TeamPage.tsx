import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Phone,
  Shield,
  Star,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CalendarClock,
  HeartPulse,
  History,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Avatar, Button, Input, AnimatedPage, GradientHeader } from '@/design-system';
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

interface NurseMember {
  name: string;
  inami: string;
  phone: string;
  status: 'active' | 'inactive';
  patients: number;
  specialities: string[];
  zone: string;
  visaExpiry: string;
  visaMonths: number;
  hoursWeek: number;
  maxHours: number;
  visitsWeek: number;
  avgDuration: number;
  acceptanceRate: number;
  satisfaction: number;
  certificates: { name: string; status: 'valid' | 'expiring' | 'expired' }[];
}

const team: NurseMember[] = [
  {
    name: 'Marie Laurent', inami: '5-12345-67-890', phone: '+32 470 12 34 56', status: 'active',
    patients: 12, specialities: ['Plaies', 'Stomie'], zone: 'Ixelles',
    visaExpiry: '15/09/2027', visaMonths: 18, hoursWeek: 35, maxHours: 38,
    visitsWeek: 48, avgDuration: 34, acceptanceRate: 98.5, satisfaction: 4.8,
    certificates: [
      { name: 'BLS/AED', status: 'valid' },
      { name: 'Soins palliatifs', status: 'valid' },
      { name: 'Wound care avancé', status: 'expiring' },
    ],
  },
  {
    name: 'Sophie Dupuis', inami: '5-23456-78-901', phone: '+32 471 23 45 67', status: 'active',
    patients: 10, specialities: ['Diabétologie', 'Gériatrie'], zone: 'Uccle',
    visaExpiry: '01/04/2026', visaMonths: 1, hoursWeek: 38, maxHours: 38,
    visitsWeek: 42, avgDuration: 38, acceptanceRate: 97.7, satisfaction: 4.6,
    certificates: [
      { name: 'BLS/AED', status: 'valid' },
      { name: 'Éducation diabète', status: 'valid' },
    ],
  },
  {
    name: 'Thomas Maes', inami: '5-34567-89-012', phone: '+32 472 34 56 78', status: 'active',
    patients: 8, specialities: ['Gériatrie'], zone: 'Etterbeek',
    visaExpiry: '30/11/2027', visaMonths: 21, hoursWeek: 30, maxHours: 38,
    visitsWeek: 35, avgDuration: 32, acceptanceRate: 100, satisfaction: 4.9,
    certificates: [
      { name: 'BLS/AED', status: 'valid' },
      { name: 'Démence avancé', status: 'valid' },
    ],
  },
  {
    name: 'Laura Van Damme', inami: '5-45678-90-123', phone: '+32 473 45 67 89', status: 'active',
    patients: 9, specialities: ['Soins palliatifs', 'Plaies'], zone: 'Watermael',
    visaExpiry: '28/02/2026', visaMonths: 0, hoursWeek: 36, maxHours: 38,
    visitsWeek: 40, avgDuration: 36, acceptanceRate: 96.5, satisfaction: 4.5,
    certificates: [
      { name: 'BLS/AED', status: 'expiring' },
      { name: 'Soins palliatifs', status: 'valid' },
      { name: 'Wound care avancé', status: 'expired' },
    ],
  },
  {
    name: 'Kevin Peeters', inami: '5-56789-01-234', phone: '+32 474 56 78 90', status: 'inactive',
    patients: 0, specialities: ['Généraliste'], zone: 'Auderghem',
    visaExpiry: '10/12/2027', visaMonths: 21, hoursWeek: 0, maxHours: 38,
    visitsWeek: 0, avgDuration: 0, acceptanceRate: 0, satisfaction: 0,
    certificates: [
      { name: 'BLS/AED', status: 'valid' },
    ],
  },
];

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

interface NurseHadContext {
  assignedEpisodes: HadEpisodeListItem[];
  escalatedCount: number;
  highRiskCount: number;
  targetSoonCount: number;
  hadPressureScore: number;
  topEpisodes: HadEpisodeListItem[];
}
type SuggestionUrgency = 'high' | 'medium' | 'low';
type EpisodeCareTag = 'Plaies' | 'Diabétologie' | 'Soins palliatifs' | 'Stomie' | 'Gériatrie';

interface TeamSuggestion {
  id: string;
  kind: 'assign' | 'backup';
  urgency: SuggestionUrgency;
  episode: HadEpisodeListItem;
  sourceMember?: string;
  targetMember: string;
  rationale: string;
  capacityLabel: string;
}

const emptyHadContext: NurseHadContext = {
  assignedEpisodes: [],
  escalatedCount: 0,
  highRiskCount: 0,
  targetSoonCount: 0,
  hadPressureScore: 0,
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

function getTeamSuggestionLabel(kind: TeamSuggestion['kind']) {
  return kind === 'assign' ? 'Affectation' : 'Renfort';
}

function getTeamActionLabel(kind: TeamSuggestion['kind']) {
  return kind === 'assign' ? 'Préparer affectation' : 'Préparer renfort';
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

function getSuggestionActionLabel(progressState: HadSuggestionProgressState, kind: TeamSuggestion['kind']) {
  if (progressState === 'draft') {
    return getTeamActionLabel(kind);
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

function getTeamTrackingCode(suggestion: TeamSuggestion) {
  return buildHadSuggestionTrackingCode(
    'team',
    suggestion.kind,
    suggestion.episode.id,
    suggestion.sourceMember,
    suggestion.targetMember,
  );
}

interface TeamSuggestionCardProps {
  suggestion: TeamSuggestion;
  onPrepare: (suggestion: TeamSuggestion) => void;
  onOpen: (episodeId: string) => void;
}

function TeamSuggestionCard({ suggestion, onPrepare, onOpen }: TeamSuggestionCardProps) {
  const trackingCode = getTeamTrackingCode(suggestion);
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
            {suggestion.sourceMember
              ? `${suggestion.sourceMember} → ${suggestion.targetMember}`
              : `Affecter à ${suggestion.targetMember}`}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <Badge variant="blue">{getTeamSuggestionLabel(suggestion.kind)}</Badge>
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
        <span className="text-[11px] font-medium text-mc-blue-500">{suggestion.capacityLabel}</span>
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

function inferEpisodeCareTags(episode: HadEpisodeListItem): EpisodeCareTag[] {
  const text = `${episode.diagnosisSummary} ${episode.admissionReason}`.toLowerCase();
  const tags = new Set<EpisodeCareTag>();

  if (text.includes('plaie') || text.includes('wound') || text.includes('ulc')) {
    tags.add('Plaies');
  }

  if (text.includes('diab') || text.includes('glyc') || text.includes('insulin')) {
    tags.add('Diabétologie');
  }

  if (text.includes('palliat')) {
    tags.add('Soins palliatifs');
  }

  if (text.includes('stomie') || text.includes('stoma')) {
    tags.add('Stomie');
  }

  if (text.includes('géri') || text.includes('demence') || text.includes('démence') || text.includes('alzheimer')) {
    tags.add('Gériatrie');
  }

  return Array.from(tags);
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

function getHadTeamPressure(episode: HadEpisodeListItem) {
  let score = 6;

  if (episode.status === 'escalated') {
    score += 22;
  } else if (episode.status === 'planned' || episode.status === 'paused') {
    score += 10;
  }

  if (episode.riskLevel === 'critical') {
    score += 18;
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
  const scoreDiff = getHadTeamPressure(right) - getHadTeamPressure(left);

  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  const leftTarget = left.targetEndAt ? new Date(left.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;
  const rightTarget = right.targetEndAt ? new Date(right.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;

  return leftTarget - rightTarget;
}

export function TeamPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedNurse, setExpandedNurse] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const { data: hadEpisodes = [], isLoading: isHadLoading } = useHadEpisodes({ onlyOpen: true });

  const filtered = useMemo(
    () =>
      team.filter((member) =>
        (filterStatus === 'all' || member.status === filterStatus) &&
        (
          !search ||
          member.name.toLowerCase().includes(search.toLowerCase()) ||
          member.specialities.some((speciality) => speciality.toLowerCase().includes(search.toLowerCase())) ||
          member.zone.toLowerCase().includes(search.toLowerCase())
        ),
      ),
    [filterStatus, search],
  );

  const activeCount = team.filter((member) => member.status === 'active').length;
  const visaAlerts = team.filter((member) => member.visaMonths <= 6).length;
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length;

  const teamHadContext = useMemo(
    () =>
      new Map<string, NurseHadContext>(
        team.map((member) => {
          const assignedEpisodes = hadEpisodes.filter((episode) => episode.primaryNurse?.fullName === member.name);

          return [
            member.name,
            {
              assignedEpisodes,
              escalatedCount: assignedEpisodes.filter((episode) => episode.status === 'escalated').length,
              highRiskCount: assignedEpisodes.filter((episode) => ['high', 'critical'].includes(episode.riskLevel)).length,
              targetSoonCount: assignedEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length,
              hadPressureScore: assignedEpisodes.reduce((score, episode) => score + getHadTeamPressure(episode), 0),
              topEpisodes: [...assignedEpisodes].sort(compareHadEpisodes).slice(0, 2),
            },
          ];
        }),
      ),
    [hadEpisodes],
  );

  const hadCoveredMembers = team.filter(
    (member) => (teamHadContext.get(member.name) ?? emptyHadContext).assignedEpisodes.length > 0,
  ).length;

  const hadHotspots = useMemo(
    () =>
      team
        .map((member) => ({
          member,
          hadContext: teamHadContext.get(member.name) ?? emptyHadContext,
        }))
        .filter(({ hadContext }) => hadContext.assignedEpisodes.length > 0)
        .sort((left, right) => right.hadContext.hadPressureScore - left.hadContext.hadPressureScore)
        .slice(0, 3),
    [teamHadContext],
  );

  const hadOutsideRoster = useMemo(
    () =>
      hadEpisodes
        .filter((episode) => {
          const nurseName = episode.primaryNurse?.fullName;
          return !nurseName || !team.some((member) => member.name === nurseName);
        })
        .sort(compareHadEpisodes)
        .slice(0, 3),
    [hadEpisodes],
  );
  const teamSuggestions = useMemo(() => {
    function getUrgency(episode: HadEpisodeListItem): SuggestionUrgency {
      if (episode.status === 'escalated' || episode.riskLevel === 'critical') {
        return 'high';
      }

      if (episode.riskLevel === 'high' || isTargetWithinHours(episode.targetEndAt, 48)) {
        return 'medium';
      }

      return 'low';
    }

    function findBestSupport(episode: HadEpisodeListItem, excludedName?: string) {
      const careTags = inferEpisodeCareTags(episode);

      return team
        .filter((member) => member.status === 'active' && member.name !== excludedName)
        .map((member) => {
          const hadContext = teamHadContext.get(member.name) ?? emptyHadContext;
          const hoursPct = (member.hoursWeek / member.maxHours) * 100;
          const matchingCareTags = careTags.filter((tag) => member.specialities.includes(tag));
          let score = 0;

          score += Math.max(0, 105 - hoursPct);
          score += Math.max(0, 34 - hadContext.hadPressureScore);

          if (member.zone === episode.patient.city) {
            score += 24;
          }

          if (matchingCareTags.length > 0) {
            score += 22;
          }

          if (hadContext.escalatedCount === 0) {
            score += 8;
          }

          if (member.visaMonths <= 0) {
            score -= 40;
          } else if (member.visaMonths <= 1) {
            score -= 15;
          }

          return { member, hadContext, hoursPct, matchingCareTags, score };
        })
        .sort((left, right) => right.score - left.score)[0];
    }

    const suggestions: TeamSuggestion[] = [];
    const usedEpisodeIds = new Set<string>();

    hadOutsideRoster.forEach((episode) => {
      if (suggestions.length >= 3 || usedEpisodeIds.has(episode.id)) {
        return;
      }

      const target = findBestSupport(episode);

      if (!target) {
        return;
      }

      suggestions.push({
        id: `assign-${episode.id}`,
        kind: 'assign',
        urgency: getUrgency(episode),
        episode,
        targetMember: target.member.name,
        rationale:
          target.matchingCareTags.length > 0
            ? `${target.member.name} matche ${target.matchingCareTags.join(', ')} pour absorber cette ouverture HAD.`
            : target.member.zone === episode.patient.city
              ? `${target.member.name} couvre déjà ${episode.patient.city} avec une disponibilité plus favorable.`
              : `${target.member.name} reste l’appui le plus disponible pour intégrer cet épisode au bon portefeuille.`,
        capacityLabel: `${Math.round(target.hoursPct)}% heures · ${target.hadContext.hadPressureScore} pts HAD`,
      });
      usedEpisodeIds.add(episode.id);
    });

    const stressedMembers = team
      .filter((member) => member.status === 'active')
      .map((member) => {
        const hadContext = teamHadContext.get(member.name) ?? emptyHadContext;
        const hoursPct = (member.hoursWeek / member.maxHours) * 100;
        const stressScore =
          hadContext.hadPressureScore +
          hadContext.escalatedCount * 18 +
          hadContext.targetSoonCount * 6 +
          (hoursPct >= 95 ? 18 : hoursPct >= 85 ? 10 : 0);

        return { member, hadContext, hoursPct, stressScore };
      })
      .filter(({ hadContext, stressScore }) => hadContext.assignedEpisodes.length > 0 && stressScore >= 24)
      .sort((left, right) => right.stressScore - left.stressScore);

    stressedMembers.forEach(({ member, hadContext, hoursPct }) => {
      if (suggestions.length >= 3) {
        return;
      }

      const episode = hadContext.topEpisodes.find((candidate) => !usedEpisodeIds.has(candidate.id));

      if (!episode) {
        return;
      }

      const target = findBestSupport(episode, member.name);

      if (!target || target.member.name === member.name) {
        return;
      }

      suggestions.push({
        id: `backup-${episode.id}`,
        kind: 'backup',
        urgency: getUrgency(episode),
        episode,
        sourceMember: member.name,
        targetMember: target.member.name,
        rationale:
          target.matchingCareTags.length > 0
            ? `${target.member.name} partage ${target.matchingCareTags.join(', ')} et peut sécuriser ${episode.patient.fullName}.`
            : `${member.name} monte à ${Math.round(hoursPct)}% d’occupation, alors que ${target.member.name} garde plus de marge pour du renfort HAD.`,
        capacityLabel: `${Math.round(target.hoursPct)}% heures · ${target.hadContext.hadPressureScore} pts HAD`,
      });
      usedEpisodeIds.add(episode.id);
    });

    return suggestions.slice(0, 3);
  }, [hadOutsideRoster, teamHadContext]);

  function openHadEpisode(episodeId: string) {
    navigate('/coordinator/had-command-center', { state: { selectedEpisodeId: episodeId } });
  }

  function openTeamSuggestion(suggestion: TeamSuggestion) {
    navigate('/coordinator/had-command-center', {
      state: {
        selectedEpisodeId: suggestion.episode.id,
        taskDraft: {
          sourceSurface: 'Gestion Équipe',
          noticeTitle: suggestion.kind === 'assign' ? 'Affectation suggérée' : 'Renfort suggéré',
          noticeBody: suggestion.rationale,
          noticeVariant: getSuggestionUrgencyVariant(suggestion.urgency),
          trackingCode: getTeamTrackingCode(suggestion),
          title:
            suggestion.kind === 'assign'
              ? `Affectation HAD · ${suggestion.episode.patient.fullName} → ${suggestion.targetMember}`
              : `Renfort HAD · ${suggestion.targetMember} pour ${suggestion.episode.patient.fullName}`,
          description: [
            suggestion.sourceMember
              ? `Préparer le renfort de ${suggestion.targetMember} pour soulager ${suggestion.sourceMember}.`
              : `Valider l’affectation de ${suggestion.targetMember} sur cet épisode HAD.`,
            suggestion.rationale,
            `Capacité estimée : ${suggestion.capacityLabel}.`,
            `Patient : ${suggestion.episode.patient.fullName} · ${suggestion.episode.patient.city}.`,
            `Épisode : ${suggestion.episode.reference}.`,
          ].join('\n'),
          taskType: suggestion.kind === 'backup' ? 'call' : 'visit',
          visibility: 'staff',
          ownerKind: 'nurse',
          ownerLabel: suggestion.targetMember,
        },
      },
    });
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Shield className="h-5 w-5" />}
        title="Gestion Équipe"
        subtitle={`${activeCount} actifs · ${team.length} total`}
        badge={
          <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 mt-1 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{activeCount}</p>
            <p className="text-[10px] text-white/60">Actifs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{team.reduce((sum, member) => sum + member.patients, 0)}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{hadEpisodes.length}</p>
            <p className="text-[10px] text-white/60">HAD ouvertes</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${visaAlerts > 0 ? 'text-mc-amber-300' : 'text-white'}`}>{visaAlerts}</p>
            <p className="text-[10px] text-white/60">Alertes visa</p>
          </div>
        </div>
      </GradientHeader>

      <div className="flex gap-2">
        <Input
          placeholder="Rechercher nom, spécialité, zone..."
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                filterStatus === status ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              {status === 'all' ? 'Tous' : status === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>
      </div>

      <Card className="space-y-4 border-l-4 border-l-mc-red-500">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <HeartPulse className="h-5 w-5 text-mc-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pôle HAD dans l’équipe</p>
              <p className="text-xs text-[var(--text-muted)]">
                Répartition de la pression HAD par infirmier et signaux de coordination à absorber.
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
            Aucun épisode HAD ouvert ne sollicite actuellement l’équipe coordinator.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                <p className="text-lg font-bold text-mc-blue-500">{hadEpisodes.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">ouvertes</p>
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
                <p className="text-lg font-bold text-mc-green-500">{hadCoveredMembers}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">infirmiers concernés</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-mc-amber-500" />
                <p className="text-sm font-medium">Renforts recommandés</p>
              </div>
              {teamSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {teamSuggestions.map((suggestion) => (
                    <TeamSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onPrepare={openTeamSuggestion}
                      onOpen={openHadEpisode}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-default)] px-3 py-3 text-xs text-[var(--text-muted)]">
                  Aucun binôme HAD supplémentaire n’est recommandé à ce stade.
                </div>
              )}
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-mc-red-500" />
                  <p className="text-sm font-medium">Hotspots HAD par infirmier</p>
                </div>
                <div className="space-y-2">
                  {hadHotspots.map(({ member, hadContext }) => (
                    <div key={member.name} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{member.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {member.zone} · {hadContext.assignedEpisodes.length} HAD · {hadContext.highRiskCount} haut risque
                          </p>
                        </div>
                        <Badge variant={hadContext.escalatedCount > 0 ? 'red' : 'blue'}>
                          +{hadContext.hadPressureScore} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-mc-amber-500" />
                  <p className="text-sm font-medium">Affectations HAD à confirmer</p>
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
                    Toutes les ouvertures HAD ouvertes sont déjà rattachées à un membre de l’équipe affichée.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="space-y-3">
        {filtered.map((member) => {
          const expanded = expandedNurse === member.name;
          const hoursPct = (member.hoursWeek / member.maxHours) * 100;
          const hoursColor = hoursPct >= 95 ? 'bg-mc-red-500' : hoursPct >= 80 ? 'bg-mc-amber-500' : 'bg-mc-green-500';
          const hadContext = teamHadContext.get(member.name) ?? emptyHadContext;

          return (
            <Card key={member.name} hover className="cursor-pointer" onClick={() => setExpandedNurse(expanded ? null : member.name)}>
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{member.name}</p>
                    <Badge variant={member.status === 'active' ? 'green' : 'outline'} dot>
                      {member.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                    {hadContext.assignedEpisodes.length > 0 && (
                      <Badge variant={hadContext.escalatedCount > 0 ? 'red' : 'blue'}>
                        {hadContext.assignedEpisodes.length} HAD
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {member.inami}
                    </span>
                    <span>·</span>
                    <span>{member.zone}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.specialities.map((speciality) => (
                      <span
                        key={speciality}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-600 dark:text-mc-blue-400 font-medium"
                      >
                        {speciality}
                      </span>
                    ))}
                  </div>
                  {hadContext.assignedEpisodes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <Badge variant="blue">{hadContext.highRiskCount} haut risque</Badge>
                      {hadContext.escalatedCount > 0 && <Badge variant="red">{hadContext.escalatedCount} escaladée(s)</Badge>}
                      {hadContext.targetSoonCount > 0 && <Badge variant="amber">{hadContext.targetSoonCount} sortie(s) 48h</Badge>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={member.visaMonths > 6 ? 'green' : member.visaMonths > 1 ? 'amber' : 'red'}>
                    Visa {member.visaMonths > 6 ? '✓' : member.visaMonths <= 0 ? '⚠ Expiré' : `${member.visaMonths}m`}
                  </Badge>
                  {hadContext.assignedEpisodes.length > 0 && (
                    <span className="text-[10px] font-semibold text-mc-red-500">+{hadContext.hadPressureScore} pts HAD</span>
                  )}
                  {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                </div>
              </div>

              {expanded && (
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{member.visitsWeek}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Visites/sem</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{member.avgDuration}m</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Durée moy.</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{member.acceptanceRate}%</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Acceptation</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold flex items-center justify-center gap-0.5">
                        <Star className="h-3.5 w-3.5 text-mc-amber-500 fill-mc-amber-500" />
                        {member.satisfaction}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Satisfaction</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Heures semaine
                      </span>
                      <span className="text-xs font-bold">{member.hoursWeek}/{member.maxHours}h</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${hoursColor}`} style={{ width: `${Math.min(hoursPct, 100)}%` }} />
                    </div>
                    {hoursPct >= 95 && (
                      <p className="text-[10px] text-mc-red-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Proche du maximum légal (Loi belge 38h/sem)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-tertiary)]">
                    <Shield className="h-4 w-4 text-mc-blue-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Visa INAMI N° {member.inami}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Expiration: {member.visaExpiry}</p>
                    </div>
                    <Badge variant={member.visaMonths > 6 ? 'green' : member.visaMonths > 1 ? 'amber' : 'red'}>
                      {member.visaMonths > 6 ? `${member.visaMonths} mois` : member.visaMonths <= 0 ? 'Expiré!' : `${member.visaMonths} mois`}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-medium flex items-center gap-1 mb-2">
                      <Award className="h-3.5 w-3.5" />
                      Certifications
                    </p>
                    <div className="space-y-1.5">
                      {member.certificates.map((certificate) => (
                        <div key={certificate.name} className="flex items-center justify-between py-1">
                          <span className="text-xs">{certificate.name}</span>
                          <Badge variant={certificate.status === 'valid' ? 'green' : certificate.status === 'expiring' ? 'amber' : 'red'}>
                            {certificate.status === 'valid' ? 'Valide' : certificate.status === 'expiring' ? 'Bientôt' : 'Expiré'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium flex items-center gap-1 mb-2">
                      <HeartPulse className="h-3.5 w-3.5 text-mc-red-500" />
                      Charge HAD
                    </p>
                    {hadContext.assignedEpisodes.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 text-center">
                          <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
                            <p className="text-sm font-bold">{hadContext.assignedEpisodes.length}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">HAD</p>
                          </div>
                          <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
                            <p className="text-sm font-bold text-mc-red-500">{hadContext.escalatedCount}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Escaladées</p>
                          </div>
                          <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
                            <p className="text-sm font-bold text-mc-amber-500">{hadContext.targetSoonCount}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Sorties &lt;48h</p>
                          </div>
                          <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
                            <p className="text-sm font-bold text-mc-blue-500">{hadContext.hadPressureScore}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Pression HAD</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {hadContext.topEpisodes.map((episode) => (
                            <button
                              key={episode.id}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openHadEpisode(episode.id);
                              }}
                              className="w-full text-left rounded-2xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
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
                      <div className="rounded-2xl bg-[var(--bg-tertiary)] px-3 py-3 text-xs text-[var(--text-muted)]">
                        Aucune coordination HAD rattachée à cet infirmier pour l’instant.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(event) => event.stopPropagation()}>
                      <Phone className="h-3.5 w-3.5" />
                      Appeler
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={(event) => event.stopPropagation()}>
                      Modifier
                    </Button>
                    {hadContext.assignedEpisodes.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          openHadEpisode(hadContext.topEpisodes[0]?.id ?? hadContext.assignedEpisodes[0].id);
                        }}
                      >
                        HAD
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
