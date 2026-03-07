import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  Wifi,
  Play,
  Nfc,
  Mic,
  Phone,
  Sparkles,
  Brain,
  Activity,
  CheckCircle2,
  FileText,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';
import { Card, Badge, Avatar, Button, AnimatedPage, AnimatedList, AnimatedItem, GradientHeader, StatRing } from '@/design-system';
import { useHadEpisodes } from '@/hooks/useHadData';
import type { HadEpisodeListItem, HadEpisodeRow } from '@/lib/had';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { WeatherHealthAlert } from '@/components/nurse/WeatherHealthAlert';
import { ComplianceDashboard } from '@/components/nurse/ComplianceDashboard';

/* ── Mock data ── */
const todayStats = {
  visits: 12,
  completed: 5,
  km: 47,
  revenue: 842,
};

const schedulePreview = [
  { id: '1', time: '10:30', patient: 'Dubois Marie', type: 'Plaie + Pilulier', eta: '12 min', katz: 'B' },
  { id: '2', time: '11:15', patient: 'Van Damme Pierre', type: 'Injection insuline', eta: '35 min', katz: 'A' },
  { id: '3', time: '12:00', patient: 'Peeters Jan', type: 'Soins palliatifs', eta: '1h05', katz: 'C' },
  { id: '4', time: '14:00', patient: 'Claes Anne', type: 'Pansement + Paramètres', eta: '2h30', katz: 'B' },
];

const alerts = [
  { id: 1, type: 'vital' as const, message: 'Glycémie élevée — M. Janssen (312 mg/dL)', time: '08:45' },
  { id: 2, type: 'billing' as const, message: '3 rejets eFact lot de février', time: 'Hier' },
  { id: 3, type: 'expiry' as const, message: 'eAgreement Dubois Françoise expire dans 5j', time: '07:00' },
];

const aiInsights = [
  { icon: Brain, text: '3 patients nécessitent un renouvellement BelRAI cette semaine', color: 'text-mc-blue-500' },
  { icon: AlertTriangle, text: 'Mme Dubois — risque réhospitalisation en hausse (+12%)', color: 'text-mc-amber-500' },
];

const teamFeed = [
  { id: '1', nurse: 'Sophie L.', action: 'a terminé sa tournée', time: 'Il y a 15 min', icon: CheckCircle2 },
  { id: '2', nurse: 'Marc D.', action: 'a soumis BelRAI — Janssens Maria', time: 'Il y a 32 min', icon: FileText },
  { id: '3', nurse: 'Anne V.', action: 'a démarré une téléconsultation', time: 'Il y a 1h', icon: Stethoscope },
];

const quickActions = [
  { icon: Play, label: 'Démarrer\nvisite', path: '/nurse/tour', gradient: 'from-mc-blue-500 to-mc-blue-600' },
  { icon: Nfc, label: 'Scanner\neID', path: '/nurse/identify', gradient: 'from-mc-green-500 to-mc-green-600' },
  { icon: Mic, label: 'Note\nvocale', path: '/nurse/tour', gradient: 'from-mc-amber-500 to-mc-amber-600' },
  { icon: Phone, label: 'Télé-\nconsult.', path: '/nurse/teleconsultation', gradient: 'from-mc-blue-400 to-mc-blue-500' },
];

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

function formatHadEpisodeType(type: HadEpisodeRow['episode_type']) {
  switch (type) {
    case 'opat':
      return 'OPAT';
    case 'oncology_at_home':
      return 'Oncologie à domicile';
    case 'heart_failure_virtual_ward':
      return 'Insuffisance cardiaque';
    case 'post_acute_virtual_ward':
      return 'Virtual ward post-aigu';
    default:
      return 'Autre protocole';
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
    score += 40;
  } else if (episode.riskLevel === 'high') {
    score += 30;
  } else if (episode.riskLevel === 'moderate') {
    score += 15;
  }

  if (isTargetWithinHours(episode.targetEndAt, 48)) {
    score += 20;
  }

  if (episode.status === 'paused') {
    score += 10;
  }

  return score;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();
  const { data: hadEpisodes = [], isLoading: isHadLoading } = useHadEpisodes(
    user?.id ? { onlyOpen: true, primaryNurseProfileId: user.id } : { onlyOpen: true },
  );
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadHighRiskCount = hadEpisodes.filter((episode) => ['high', 'critical'].includes(episode.riskLevel)).length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length;
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
    .slice(0, 3);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <AnimatedPage className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      {/* ── Hero Gradient Header ── */}
      <GradientHeader
        icon={<Activity className="h-5 w-5" />}
        title={`${greeting}, ${user?.firstName ?? 'Infirmier(ère)'}`}
        subtitle={new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
        badge={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm">
              <Wifi className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white/80">Sync</span>
            </div>
          </div>
        }
      >
        {/* Stat Rings Row */}
        <div className="flex items-center justify-around mt-2 -mb-1">
          <StatRing value={todayStats.completed} max={todayStats.visits} label="Visites" color="gradient" size={68} strokeWidth={5} />
          <StatRing value={todayStats.km} max={80} label="km" suffix="" color="green" size={68} strokeWidth={5} />
          <StatRing value={todayStats.revenue} max={1200} label="CA €" color="blue" size={68} strokeWidth={5} />
          <StatRing value={12} max={30} label="+% mois" suffix="%" color="green" size={68} strokeWidth={5} />
        </div>
      </GradientHeader>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            onClick={() => navigate(qa.path)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${qa.gradient} flex items-center justify-center`}>
              <qa.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-medium text-center text-[var(--text-secondary)] leading-tight whitespace-pre-line">
              {qa.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Schedule Preview (horizontal scroll) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Prochaines visites</h3>
          <Button variant="ghost" size="xs" onClick={() => navigate('/nurse/tour')} iconRight={<ChevronRight className="h-3.5 w-3.5" />}>
            Voir tout
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {schedulePreview.map((visit, i) => (
            <Card
              key={visit.id}
              hover
              padding="sm"
              className={`min-w-[200px] max-w-[220px] snap-start cursor-pointer shrink-0 ${i === 0 ? 'border-l-4 border-l-mc-blue-500' : ''}`}
              onClick={() => navigate('/nurse/tour')}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={i === 0 ? 'blue' : 'outline'}>
                  <Clock className="h-3 w-3 mr-1" />
                  {visit.time}
                </Badge>
                <Badge variant="default">Katz {visit.katz}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={visit.patient} size="sm" />
                <p className="text-sm font-semibold truncate">{visit.patient}</p>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">{visit.type}</p>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-muted)]">
                <Navigation className="h-3 w-3" />
                <span>ETA: {visit.eta}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Weather & Compliance ── */}
      <WeatherHealthAlert />
      <ComplianceDashboard />

      {/* ── HAD Surface ── */}
      <Card className="space-y-4 border-l-4 border-l-mc-red-500">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <HeartPulse className="h-5 w-5 text-mc-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cellule HAD</p>
              <p className="text-xs text-[var(--text-muted)]">
                Hospitalisations à domicile qui te sont confiées aujourd’hui
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hadEscalatedCount > 0 ? 'red' : hadEpisodes.length > 0 ? 'blue' : 'outline'}>
              {hadEpisodes.length} ouvert{hadEpisodes.length > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/nurse/had')}
              iconRight={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Voir tout
            </Button>
          </div>
        </div>

        {isHadLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((placeholder) => (
              <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
            ))}
          </div>
        ) : hadEpisodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-4 space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Aucun épisode HAD actif ne t’est attribué pour le moment.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigate('/nurse/had')}>
                Ouvrir ou revoir les épisodes HAD
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 text-center">
                <p className="text-lg font-bold text-mc-blue-500">{hadEpisodes.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">ouverts</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 text-center">
                <p className="text-lg font-bold text-mc-red-500">{hadEscalatedCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">escaladés</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 text-center">
                <p className="text-lg font-bold text-mc-amber-500">{hadTargetSoonCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">sortie &lt;48h</p>
              </div>
            </div>

            <div className="space-y-2">
              {hadPriorityEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => navigate(`/nurse/had/${episode.id}`)}
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
                      <p className="text-xs text-[var(--text-muted)]">
                        {episode.reference} · {formatHadEpisodeType(episode.episodeType)}
                      </p>
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

            {hadHighRiskCount > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                {hadHighRiskCount} épisode{hadHighRiskCount > 1 ? 's' : ''} à risque élevé ou critique à garder en vue
                pendant la tournée.
              </p>
            )}
          </>
        )}
      </Card>

      {/* ── AI Insights ── */}
      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Insights IA</p>
            <p className="text-[10px] text-[var(--text-muted)]">Basé sur vos données des 7 derniers jours</p>
          </div>
        </div>
        <div className="space-y-2">
          {aiInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <insight.icon className={`h-4 w-4 mt-0.5 shrink-0 ${insight.color}`} />
              <span>{insight.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <AnimatedList stagger={0.06} delay={0.2}>
          <AnimatedItem>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-mc-amber-500" />
              Alertes ({alerts.length})
            </h3>
          </AnimatedItem>
          {alerts.map((alert) => (
            <AnimatedItem key={alert.id}>
              <Card hover className="flex items-center gap-3 cursor-pointer" padding="sm">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.type === 'vital'
                      ? 'bg-mc-red-50 dark:bg-red-900/30'
                      : alert.type === 'expiry'
                        ? 'bg-mc-blue-50 dark:bg-mc-blue-900/30'
                        : 'bg-mc-amber-50 dark:bg-amber-900/30'
                  }`}
                >
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      alert.type === 'vital' ? 'text-mc-red-500' : alert.type === 'expiry' ? 'text-mc-blue-500' : 'text-mc-amber-500'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.message}</p>
                  <p className="text-xs text-[var(--text-muted)]">{alert.time}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </Card>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      {/* ── Team Activity Feed ── */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Activité équipe</h3>
        <Card glass>
          <div className="space-y-3">
            {teamFeed.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <item.icon className="h-3.5 w-3.5 text-mc-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{item.nurse}</span>{' '}
                    <span className="text-[var(--text-muted)]">{item.action}</span>
                  </p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AnimatedPage>
  );
}
