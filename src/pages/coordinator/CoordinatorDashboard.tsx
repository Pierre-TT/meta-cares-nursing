import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle,
  CalendarDays,
  Map,
  MessageSquare,
  Heart,
  HeartPulse,
  Sparkles,
  Activity,
  Send,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, Badge, Avatar, Button, AnimatedPage, GradientHeader, StatRing, SwipeableCard } from '@/design-system';
import { useHadEpisodes } from '@/hooks/useHadData';
import type { HadEpisodeListItem, HadEpisodeRow } from '@/lib/had';
import { useCoordinatorDashboardData } from '@/hooks/usePlatformData';

const activityIcons = {
  check: CheckCircle,
  activity: Activity,
  send: Send,
  alert: AlertTriangle,
} as const;

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

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

function isTargetWithinHours(targetEndAt: string | undefined, hours: number) {
  if (!targetEndAt) {
    return false;
  }

  const diff = new Date(targetEndAt).getTime() - Date.now();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

function getHadPriorityScore(episode: HadEpisodeListItem) {
  let score = 0;

  if (episode.status === 'escalated') {
    score += 100;
  }

  if (episode.riskLevel === 'critical') {
    score += 45;
  } else if (episode.riskLevel === 'high') {
    score += 30;
  } else if (episode.riskLevel === 'moderate') {
    score += 15;
  }

  if (episode.status === 'paused') {
    score += 20;
  }

  if (episode.status === 'planned') {
    score += 10;
  }

  if (isTargetWithinHours(episode.targetEndAt, 48)) {
    score += 15;
  }

  return score;
}

export function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { data } = useCoordinatorDashboardData();
  const { data: hadEpisodes = [], isLoading: isHadLoading } = useHadEpisodes({ onlyOpen: true });
  const { teamMembers, alerts, activityFeed, aiInsights } = data;
  const totalVisits = teamMembers.reduce((s, m) => s + m.visits, 0);
  const totalCompleted = teamMembers.reduce((s, m) => s + m.completed, 0);
  const totalRevenue = teamMembers.reduce((s, m) => s + m.revenue, 0);
  const activeNurses = teamMembers.filter(m => m.status === 'active').length;
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadHighRiskCount = hadEpisodes.filter((episode) => ['high', 'critical'].includes(episode.riskLevel)).length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length;
  const hadCoordinationLoad = hadEpisodes.filter((episode) =>
    episode.status === 'planned' ||
    episode.status === 'paused' ||
    episode.status === 'eligible' ||
    isTargetWithinHours(episode.targetEndAt, 48)
  ).length;
  const hadPriorityEpisodes = [...hadEpisodes]
    .sort((left, right) => {
      const scoreDiff = getHadPriorityScore(right) - getHadPriorityScore(left);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const leftTarget = left.targetEndAt ? new Date(left.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTarget = right.targetEndAt ? new Date(right.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;

      return leftTarget - rightTarget;
    })
    .slice(0, 4);

  const quickActions = [
    { icon: CalendarDays, label: 'Planifier', path: '/coordinator/planning', color: 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500' },
    { icon: Heart, label: 'Affecter', path: '/coordinator/caseload', color: 'bg-mc-green-50 dark:bg-mc-green-900/30 text-mc-green-500' },
    { icon: MessageSquare, label: 'Message', path: '/coordinator/messages', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-500' },
    { icon: Map, label: 'Carte', path: '/coordinator/map', color: 'bg-mc-amber-50 dark:bg-amber-900/30 text-mc-amber-500' },
  ];

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-5">
      {/* ── Header ── */}
      <GradientHeader
        icon={<Zap className="h-5 w-5" />}
        title="Centre de Commande"
        subtitle={new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        badge={<Badge variant="green" dot>{activeNurses} en tournée</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalCompleted}/{totalVisits}</p>
            <p className="text-[10px] text-white/60">Visites</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-white/60">CA jour</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{alerts.length}</p>
            <p className="text-[10px] text-white/60">Alertes</p>
          </div>
        </div>
      </GradientHeader>

      {/* ── StatRings ── */}
      <div className="flex items-center justify-around">
        <StatRing value={totalCompleted} max={totalVisits} label="Visites" color="blue" size={72} strokeWidth={5} />
        <StatRing value={totalRevenue} max={3000} label="CA jour €" suffix="€" color="green" size={72} strokeWidth={5} />
        <StatRing value={98} max={100} label="eFact OK" suffix="%" color="gradient" size={72} strokeWidth={5} />
        <StatRing value={48} max={52} label="Couverture" color="amber" size={72} strokeWidth={5} />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map(qa => (
          <button
            key={qa.label}
            onClick={() => navigate(qa.path)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${qa.color}`}>
              <qa.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">{qa.label}</span>
          </button>
        ))}
      </div>

      {/* ── HAD Surface ── */}
      <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        <Card className="space-y-4 border-l-4 border-l-mc-red-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <HeartPulse className="h-5 w-5 text-mc-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pôle HAD</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Vue coordination des hospitalisations à domicile à piloter aujourd’hui
                </p>
              </div>
            </div>
            <Badge variant={hadEscalatedCount > 0 ? 'red' : hadEpisodes.length > 0 ? 'blue' : 'outline'}>
              {hadEpisodes.length} ouverte{hadEpisodes.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {isHadLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((placeholder) => (
                <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                  <p className="text-lg font-bold text-mc-blue-500">{hadEpisodes.length}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">ouvertes</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                  <p className="text-lg font-bold text-mc-red-500">{hadEscalatedCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">escaladées</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                  <p className="text-lg font-bold text-mc-amber-500">{hadHighRiskCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">haut risque</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3">
                  <p className="text-lg font-bold text-mc-green-500">{hadCoordinationLoad}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">à coordonner</p>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <p className="text-sm font-medium">Priorités de pilotage</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {hadEscalatedCount > 0
                    ? `${hadEscalatedCount} épisode(s) escaladé(s) nécessitent un suivi immédiat.`
                    : hadTargetSoonCount > 0
                      ? `${hadTargetSoonCount} sortie(s) cible(s) arrivent sous 48h.`
                      : 'Aucune tension HAD majeure détectée pour l’instant.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate('/coordinator/had-command-center')}>
                  Ouvrir le centre HAD
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/coordinator/had-command-center')}>
                  Revoir les épisodes prioritaires
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Episodes HAD prioritaires</p>
              <p className="text-xs text-[var(--text-muted)]">
                Escalades, risques élevés et sorties à préparer
              </p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/coordinator/had-command-center')}
              iconRight={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Centre HAD
            </Button>
          </div>

          {isHadLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((placeholder) => (
                <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              ))}
            </div>
          ) : hadPriorityEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-5 text-sm text-[var(--text-muted)]">
              Aucun épisode HAD ouvert à remonter au centre de commande pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {hadPriorityEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() =>
                    navigate('/coordinator/had-command-center', { state: { selectedEpisodeId: episode.id } })
                  }
                  className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                      <HeartPulse className="h-4 w-4 text-mc-red-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{episode.patient.fullName}</p>
                        <Badge variant={getHadStatusVariant(episode.status)}>{episode.status}</Badge>
                        <Badge variant={getHadRiskVariant(episode.riskLevel)}>{episode.riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{episode.reference}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{episode.diagnosisSummary}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatHadTargetEnd(episode.targetEndAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {episode.hospital.name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── AI Insights ── */}
      <Card glass className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-semibold">Insights IA</span>
          <Badge variant="blue">Live</Badge>
        </div>
        {aiInsights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
              insight.priority === 'high' ? 'bg-mc-red-500' : insight.priority === 'medium' ? 'bg-mc-amber-500' : 'bg-mc-green-500'
            }`} />
            <p className="text-xs text-[var(--text-secondary)]">{insight.text}</p>
          </div>
        ))}
      </Card>

      {/* ── Alerts (SwipeableCard) ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-mc-amber-500" />
            Alertes ({alerts.length})
          </h3>
          {alerts.map((alert) => (
            <SwipeableCard
              key={alert.id}
              rightActions={[
                { icon: <CheckCircle className="h-4 w-4" />, label: 'Acquitter', color: 'bg-mc-green-500', onClick: () => {} },
              ]}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.type === 'vital' ? 'bg-mc-red-50 dark:bg-red-900/30' : 'bg-mc-amber-50 dark:bg-amber-900/30'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${alert.type === 'vital' ? 'text-mc-red-500' : 'text-mc-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-[var(--text-muted)]">{alert.nurse} • {alert.time}</p>
                </div>
              </div>
            </SwipeableCard>
          ))}
        </div>
      )}

      {/* ── Team Strip ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Équipe en temps réel</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/coordinator/team')}>
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col items-center gap-1.5 min-w-[72px]">
              <div className="relative">
                <Avatar name={member.name} size="lg" />
                <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-primary)] ${
                  member.status === 'active' ? 'bg-mc-green-500' :
                  member.status === 'done' ? 'bg-mc-blue-500' : 'bg-[var(--text-muted)]'
                }`} />
              </div>
              <span className="text-[10px] font-medium text-center truncate w-full">{member.name.split(' ')[0]}</span>
              {member.currentPatient ? (
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5 text-mc-green-500" />
                  <span className="text-[9px] text-mc-green-500">{member.currentPatient}</span>
                </div>
              ) : (
                <span className="text-[9px] text-[var(--text-muted)]">{member.status === 'done' ? 'Terminé' : 'Repos'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-semibold">Activité en direct</span>
          <div className="h-2 w-2 rounded-full bg-mc-green-500 animate-pulse" />
        </div>
        <div className="space-y-3">
          {activityFeed.map((event) => (
            <div key={event.id} className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={event.nurse} size="sm" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                  {(() => {
                    const Icon = activityIcons[event.icon];
                    return <Icon className={`h-3 w-3 ${event.color}`} />;
                  })()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">
                  <span className="font-semibold">{event.nurse.split(' ')[0]}</span>
                  {' · '}{event.action}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">{event.patient}</p>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">{event.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
