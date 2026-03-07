import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Clock, Sparkles, AlertTriangle, Zap, HeartPulse, CalendarClock, Building2, MapPin } from 'lucide-react';
import { Card, Badge, Avatar, Button, AnimatedPage, GradientHeader } from '@/design-system';
import { useHadEpisodes } from '@/hooks/useHadData';
import type { HadEpisodeListItem, HadEpisodeRow } from '@/lib/had';

/* ── Mock data ── */

const days = ['Lun 03/03', 'Mar 04/03', 'Mer 05/03', 'Jeu 06/03', 'Ven 07/03', 'Sam 08/03', 'Dim 09/03'];

type VisitType = 'hygiene' | 'wound' | 'injection' | 'medication' | 'parameters' | 'consultation';
const typeColors: Record<VisitType, string> = {
  hygiene: 'bg-mc-blue-500',
  wound: 'bg-mc-green-500',
  injection: 'bg-mc-amber-500',
  medication: 'bg-purple-500',
  parameters: 'bg-pink-500',
  consultation: 'bg-cyan-500',
};
const typeLabels: Record<VisitType, string> = {
  hygiene: 'Hygiène',
  wound: 'Plaie',
  injection: 'Injection',
  medication: 'Pilulier',
  parameters: 'Paramètres',
  consultation: 'Consultation',
};

interface Visit {
  id: string;
  nurse: string;
  day: number;
  time: string;
  duration: number;
  patient: string;
  type: VisitType;
  conflict?: string;
}

const mockVisits: Visit[] = [
  { id: 'v1', nurse: 'Marie Laurent', day: 3, time: '08:00', duration: 45, patient: 'Dubois M.', type: 'hygiene' },
  { id: 'v2', nurse: 'Marie Laurent', day: 3, time: '09:15', duration: 30, patient: 'Janssen P.', type: 'parameters' },
  { id: 'v3', nurse: 'Marie Laurent', day: 3, time: '09:40', duration: 25, patient: 'Peeters H.', type: 'injection', conflict: 'Chevauchement: 5 min avec Janssen P.' },
  { id: 'v4', nurse: 'Marie Laurent', day: 3, time: '10:30', duration: 40, patient: 'Lambert J.', type: 'wound' },
  { id: 'v5', nurse: 'Sophie Dupuis', day: 3, time: '08:30', duration: 50, patient: 'Willems A.', type: 'hygiene' },
  { id: 'v6', nurse: 'Sophie Dupuis', day: 3, time: '10:00', duration: 35, patient: 'Martin C.', type: 'wound' },
  { id: 'v7', nurse: 'Thomas Maes', day: 3, time: '08:00', duration: 55, patient: 'Peeters H.', type: 'hygiene' },
  { id: 'v8', nurse: 'Thomas Maes', day: 3, time: '09:30', duration: 20, patient: 'Leclercq F.', type: 'medication' },
  { id: 'v9', nurse: 'Laura Van Damme', day: 3, time: '09:00', duration: 40, patient: 'Leclercq F.', type: 'parameters' },
  { id: 'v10', nurse: 'Laura Van Damme', day: 3, time: '10:15', duration: 30, patient: 'Vos M.', type: 'injection' },
];

const unassignedVisits = [
  { id: 'u1', patient: 'Hermans K.', time: '11:00', type: 'medication' as VisitType, zone: 'Ixelles' },
  { id: 'u2', patient: 'De Smet L.', time: '14:30', type: 'wound' as VisitType, zone: 'Etterbeek' },
];

const nurses = ['Marie Laurent', 'Sophie Dupuis', 'Thomas Maes', 'Laura Van Damme'];

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

function getHadPlanningPriorityScore(episode: HadEpisodeListItem) {
  let score = 0;

  if (episode.status === 'escalated') {
    score += 100;
  }

  if (episode.status === 'planned') {
    score += 40;
  } else if (episode.status === 'eligible') {
    score += 35;
  } else if (episode.status === 'paused') {
    score += 30;
  }

  if (episode.riskLevel === 'critical') {
    score += 35;
  } else if (episode.riskLevel === 'high') {
    score += 25;
  } else if (episode.riskLevel === 'moderate') {
    score += 10;
  }

  if (isTargetWithinHours(episode.targetEndAt, 48)) {
    score += 20;
  }

  return score;
}

export function PlanningPage() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(3);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const { data: hadEpisodes = [], isLoading: isHadLoading } = useHadEpisodes({ onlyOpen: true });

  const dayVisits = mockVisits.filter(v => v.day === selectedDay);
  const conflictCount = dayVisits.filter(v => v.conflict).length;
  const hadPlanningCount = hadEpisodes.filter((episode) =>
    episode.status === 'planned' || episode.status === 'eligible' || episode.status === 'paused',
  ).length;
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length;
  const hadPriorityEpisodes = useMemo(
    () =>
      [...hadEpisodes]
        .sort((left, right) => {
          const scoreDiff = getHadPlanningPriorityScore(right) - getHadPlanningPriorityScore(left);

          if (scoreDiff !== 0) {
            return scoreDiff;
          }

          const leftTarget = left.targetEndAt ? new Date(left.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;
          const rightTarget = right.targetEndAt ? new Date(right.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;

          return leftTarget - rightTarget;
        })
        .slice(0, 3),
    [hadEpisodes],
  );
  const hadCityLoad = useMemo(
    () =>
      Array.from(
        hadEpisodes.reduce((cities, episode) => {
          const key = episode.patient.city || 'Ville non renseignée';
          cities.set(key, (cities.get(key) ?? 0) + 1);
          return cities;
        }, new Map<string, number>()),
      )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4),
    [hadEpisodes],
  );

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Clock className="h-5 w-5" />}
        title="Planning Intelligent"
        subtitle="Semaine du 03/03/2026"
        badge={
          <div className="flex gap-1">
            <Button variant="outline" size="sm" icon={<ChevronLeft className="h-4 w-4" />} className="text-white border-white/30 hover:bg-white/10" />
            <Button variant="outline" size="sm" icon={<ChevronRight className="h-4 w-4" />} className="text-white border-white/30 hover:bg-white/10" />
          </div>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{dayVisits.length}</p>
            <p className="text-[10px] text-white/60">Visites</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nurses.length}</p>
            <p className="text-[10px] text-white/60">Infirmiers</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{unassignedVisits.length}</p>
            <p className="text-[10px] text-white/60">Non assignés</p>
          </div>
        </div>
      </GradientHeader>

      {/* ── View switcher ── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)]">
          {(['day', 'week', 'month'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === v ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
            >
              {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
        <Button variant="gradient" size="sm"><Plus className="h-3.5 w-3.5" />Visite</Button>
      </div>

      {/* ── Day selector ── */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${selectedDay === i ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          >{day}</button>
        ))}
      </div>

      {/* ── Unassigned visits banner ── */}
      {unassignedVisits.length > 0 && (
        <Card glass className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-mc-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{unassignedVisits.length} visites non assignées</p>
            <p className="text-xs text-[var(--text-muted)]">{unassignedVisits.map(v => `${v.patient} (${v.zone})`).join(' · ')}</p>
          </div>
          <Button variant="gradient" size="sm"><Sparkles className="h-3.5 w-3.5" />Auto-assign</Button>
        </Card>
      )}

      {/* ── Conflict warnings ── */}
      {conflictCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-mc-red-50 dark:bg-red-900/20 border border-mc-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-mc-red-500" />
          <span className="text-xs font-medium text-mc-red-600 dark:text-mc-red-400">{conflictCount} conflit(s) de planning détecté(s)</span>
        </div>
      )}

      {/* ── AI Optimization ── */}
      <Card glass className="flex items-center gap-3">
        <Zap className="h-5 w-5 text-mc-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium">Optimisation IA disponible</p>
          <p className="text-[10px] text-[var(--text-muted)]">Réduire ~12km et 35min de trajet estimé</p>
        </div>
        <Button variant="outline" size="sm"><Sparkles className="h-3.5 w-3.5" />Optimiser</Button>
      </Card>

      {/* ── HAD planning surface ── */}
      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4 border-l-4 border-l-mc-red-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <HeartPulse className="h-5 w-5 text-mc-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Charge HAD du planning</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Episodes à intégrer dans les arbitrages de tournée et de capacité
                </p>
              </div>
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
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((placeholder) => (
                <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              ))}
            </div>
          ) : hadEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-4 text-sm text-[var(--text-muted)]">
              Aucun épisode HAD ouvert à refléter dans le planning cette semaine.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-mc-blue-500">{hadEpisodes.length}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">ouvertes</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-mc-amber-500">{hadPlanningCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">à planifier</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-mc-red-500">{hadEscalatedCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">escaladées</p>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <p className="text-sm font-medium">Hotspots HAD</p>
                <div className="flex flex-wrap gap-1.5">
                  {hadCityLoad.map(([city, count]) => (
                    <Badge key={city} variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {city} · {count}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {hadTargetSoonCount > 0
                    ? `${hadTargetSoonCount} sortie(s) cible(s) arrivent sous 48h.`
                    : 'Aucune sortie HAD imminente à absorber dans les tournées.'}
                </p>
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Episodes HAD prioritaires</p>
              <p className="text-xs text-[var(--text-muted)]">
                Escalades, épisodes à préparer et sorties proches
              </p>
            </div>
            <Badge variant={hadEscalatedCount > 0 ? 'red' : 'blue'}>
              {hadTargetSoonCount} sortie{hadTargetSoonCount > 1 ? 's' : ''} &lt;48h
            </Badge>
          </div>

          {isHadLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((placeholder) => (
                <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              ))}
            </div>
          ) : hadPriorityEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-5 text-sm text-[var(--text-muted)]">
              Aucune priorité HAD particulière à remonter dans le planning.
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
                          <MapPin className="h-3.5 w-3.5" />
                          {episode.patient.city}
                        </span>
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

      {/* ── Type legend ── */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(typeLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${typeColors[key as VisitType]}`} />
            <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Nurse timelines ── */}
      <div className="space-y-4">
        {nurses.map(nurse => {
          const nurseVisits = dayVisits.filter(v => v.nurse === nurse);
          return (
            <Card key={nurse}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={nurse} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{nurse}</p>
                  <p className="text-xs text-[var(--text-muted)]">{nurseVisits.length} visites · {nurseVisits.reduce((s, v) => s + v.duration, 0)}min planifiées</p>
                </div>
                <Badge variant={nurseVisits.length > 0 ? 'green' : 'outline'}>
                  {nurseVisits.length > 0 ? 'Actif' : 'Repos'}
                </Badge>
              </div>
              {nurseVisits.length > 0 ? (
                <div className="space-y-1.5 relative">
                  {/* Timeline line */}
                  <div className="absolute left-[23px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />
                  {nurseVisits.map((visit) => (
                    <div key={visit.id} className={`flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)] transition-colors relative ${
                      visit.conflict ? 'ring-1 ring-mc-red-500/50' : 'hover:bg-[var(--border-subtle)]'
                    }`}>
                      {/* Type dot on timeline */}
                      <div className="relative z-10">
                        <div className={`h-3 w-3 rounded-full ${typeColors[visit.type]} ring-2 ring-[var(--bg-tertiary)]`} />
                      </div>
                      <span className="text-xs font-mono font-bold text-mc-blue-500 w-12">{visit.time}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate">{visit.patient}</p>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{typeLabels[visit.type]}</Badge>
                        </div>
                        {visit.conflict && (
                          <p className="text-[10px] text-mc-red-500 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />{visit.conflict}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{visit.duration}min</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] text-center py-3">Aucune visite planifiée</p>
              )}
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
