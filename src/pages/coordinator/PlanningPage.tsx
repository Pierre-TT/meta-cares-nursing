import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Button, Card, GradientHeader, Input, Modal } from '@/design-system';
import { useHadEpisodes } from '@/hooks/useHadData';
import type { HadEpisodeListItem, HadEpisodeRow } from '@/lib/had';

type ViewMode = 'day' | 'week' | 'month';
type VisitType = 'hygiene' | 'wound' | 'injection' | 'medication' | 'parameters' | 'consultation';
type Tone = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

interface Visit {
  id: string;
  nurse: string;
  day: number;
  time: string;
  duration: number;
  patient: string;
  type: VisitType;
  zone: string;
  conflict?: string;
}

interface PendingVisit {
  id: string;
  patient: string;
  time: string;
  type: VisitType;
  zone: string;
  day: number;
}

interface VisitFormState {
  patient: string;
  time: string;
  duration: string;
  type: VisitType;
  nurse: string;
  zone: string;
}

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const typeLabels: Record<VisitType, string> = {
  hygiene: 'Hygiene',
  wound: 'Plaie',
  injection: 'Injection',
  medication: 'Pilulier',
  parameters: 'Parametres',
  consultation: 'Consultation',
};

const typeDots: Record<VisitType, string> = {
  hygiene: 'bg-mc-blue-500',
  wound: 'bg-mc-green-500',
  injection: 'bg-mc-amber-500',
  medication: 'bg-pink-500',
  parameters: 'bg-cyan-500',
  consultation: 'bg-purple-500',
};

const nurses = ['Marie Laurent', 'Sophie Dupuis', 'Thomas Maes', 'Laura Van Damme'];
const baseWeekStart = new Date('2026-03-03T00:00:00');

const seedVisits: Visit[] = [
  { id: 'v1', nurse: 'Marie Laurent', day: 3, time: '08:00', duration: 45, patient: 'Dubois M.', type: 'hygiene', zone: 'Ixelles' },
  { id: 'v2', nurse: 'Marie Laurent', day: 3, time: '09:15', duration: 30, patient: 'Janssen P.', type: 'parameters', zone: 'Ixelles' },
  { id: 'v3', nurse: 'Marie Laurent', day: 3, time: '09:40', duration: 25, patient: 'Peeters H.', type: 'injection', zone: 'Etterbeek', conflict: 'Chevauchement a arbitrer.' },
  { id: 'v4', nurse: 'Sophie Dupuis', day: 3, time: '08:30', duration: 50, patient: 'Willems A.', type: 'hygiene', zone: 'Uccle' },
  { id: 'v5', nurse: 'Thomas Maes', day: 3, time: '09:30', duration: 20, patient: 'Leclercq F.', type: 'medication', zone: 'Etterbeek' },
  { id: 'v6', nurse: 'Laura Van Damme', day: 3, time: '10:15', duration: 30, patient: 'Vos M.', type: 'injection', zone: 'Watermael' },
];

const seedPending: PendingVisit[] = [
  { id: 'u1', patient: 'Hermans K.', time: '11:00', type: 'medication', zone: 'Ixelles', day: 3 },
  { id: 'u2', patient: 'De Smet L.', time: '14:30', type: 'wound', zone: 'Etterbeek', day: 3 },
];

const emptyVisitForm: VisitFormState = {
  patient: '',
  time: '11:00',
  duration: '30',
  type: 'consultation',
  nurse: 'unassigned',
  zone: 'Ixelles',
};

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function addMinutes(value: string, delta: number) {
  const total = parseMinutes(value) + delta;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDayLabel(value: Date) {
  const weekday = value.toLocaleDateString('fr-BE', { weekday: 'short' }).replace('.', '');
  return `${weekday} ${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}`;
}

function estimateDuration(type: VisitType) {
  return type === 'hygiene' ? 45 : type === 'wound' ? 40 : type === 'injection' ? 25 : type === 'medication' ? 20 : 30;
}

function isTargetSoon(targetEndAt?: string) {
  if (!targetEndAt) {
    return false;
  }

  const diff = new Date(targetEndAt).getTime() - Date.now();
  return diff >= 0 && diff <= 48 * 60 * 60 * 1000;
}

function statusTone(status: HadEpisodeRow['status']): Tone {
  if (status === 'escalated') {
    return 'red';
  }
  if (status === 'active') {
    return 'green';
  }
  if (status === 'paused') {
    return 'amber';
  }
  if (status === 'planned' || status === 'eligible') {
    return 'blue';
  }
  return 'outline';
}

function riskTone(level: HadEpisodeRow['risk_level']): Tone {
  if (level === 'critical' || level === 'high') {
    return 'red';
  }
  if (level === 'moderate') {
    return 'amber';
  }
  return 'green';
}

function priorityScore(episode: HadEpisodeListItem) {
  let score = episode.status === 'escalated' ? 100 : 0;
  score += episode.status === 'planned' ? 40 : episode.status === 'eligible' ? 35 : episode.status === 'paused' ? 30 : 0;
  score += episode.riskLevel === 'critical' ? 35 : episode.riskLevel === 'high' ? 25 : episode.riskLevel === 'moderate' ? 10 : 0;
  return score + (isTargetSoon(episode.targetEndAt) ? 20 : 0);
}

export function PlanningPage() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(3);
  const [view, setView] = useState<ViewMode>('day');
  const [weekOffset, setWeekOffset] = useState(0);
  const [visits, setVisits] = useState(seedVisits);
  const [pendingVisits, setPendingVisits] = useState(seedPending);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitForm, setVisitForm] = useState(emptyVisitForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { data: hadEpisodes = [], isLoading } = useHadEpisodes({ onlyOpen: true });

  const weekStart = useMemo(() => addDays(baseWeekStart, weekOffset * 7), [weekOffset]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const dayLabels = useMemo(() => Array.from({ length: 7 }, (_, index) => formatDayLabel(addDays(weekStart, index))), [weekStart]);
  const dayVisits = useMemo(() => visits.filter((visit) => visit.day === selectedDay).sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time)), [selectedDay, visits]);
  const visiblePendingVisits = useMemo(() => pendingVisits.filter((visit) => visit.day === selectedDay), [pendingVisits, selectedDay]);
  const conflictCount = dayVisits.filter((visit) => visit.conflict).length;
  const hadPriority = useMemo(() => [...hadEpisodes].sort((a, b) => priorityScore(b) - priorityScore(a)).slice(0, 3), [hadEpisodes]);
  const hadPlanningCount = hadEpisodes.filter((episode) => ['planned', 'eligible', 'paused'].includes(episode.status)).length;
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetSoon(episode.targetEndAt)).length;
  const hadCityLoad = useMemo(
    () =>
      Array.from(
        hadEpisodes.reduce((cities, episode) => {
          const city = episode.patient.city || 'Ville non renseignee';
          cities.set(city, (cities.get(city) ?? 0) + 1);
          return cities;
        }, new Map<string, number>())
      ).sort((a, b) => b[1] - a[1]).slice(0, 4),
    [hadEpisodes]
  );
  const nurseSchedules = useMemo(
    () =>
      nurses.map((nurse) => {
        const nurseVisits = dayVisits.filter((visit) => visit.nurse === nurse);
        return {
          nurse,
          visits: nurseVisits,
          duration: nurseVisits.reduce((sum, visit) => sum + visit.duration, 0),
          conflicts: nurseVisits.filter((visit) => visit.conflict).length,
        };
      }),
    [dayVisits]
  );

  function closeVisitModal() {
    setVisitModalOpen(false);
    setVisitForm(emptyVisitForm);
  }

  function handleMoveWeek(direction: -1 | 1) {
    setWeekOffset((previous) => previous + direction);
    setFeedback(direction === -1 ? 'Semaine precedente chargee.' : 'Semaine suivante chargee.');
  }

  function handleCreateVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const patient = visitForm.patient.trim();
    if (!patient) {
      setFeedback('Le patient est requis.');
      return;
    }

    if (visitForm.nurse === 'unassigned') {
      setPendingVisits((previous) => [
        ...previous,
        {
          id: `u${previous.length + visits.length + 1}`,
          patient,
          time: visitForm.time,
          type: visitForm.type,
          zone: visitForm.zone.trim() || 'Zone a confirmer',
          day: selectedDay,
        },
      ]);
      setFeedback(`Visite ajoutee en attente pour ${patient}.`);
      closeVisitModal();
      return;
    }

    const hasConflict = visits.some(
      (visit) =>
        visit.day === selectedDay &&
        visit.nurse === visitForm.nurse &&
        Math.abs(parseMinutes(visit.time) - parseMinutes(visitForm.time)) < 30
    );

    setVisits((previous) => [
      ...previous,
      {
        id: `v${previous.length + pendingVisits.length + 1}`,
        nurse: visitForm.nurse,
        day: selectedDay,
        time: visitForm.time,
        duration: Number.parseInt(visitForm.duration, 10) || estimateDuration(visitForm.type),
        patient,
        type: visitForm.type,
        zone: visitForm.zone.trim() || 'Zone a confirmer',
        conflict: hasConflict ? 'Conflit a arbitrer avec une visite existante.' : undefined,
      },
    ]);
    setFeedback(`Visite planifiee pour ${patient} avec ${visitForm.nurse}.`);
    closeVisitModal();
  }

  function handleAutoAssign() {
    if (pendingVisits.length === 0) {
      setFeedback('Aucune visite en attente a affecter.');
      return;
    }

    const nextVisits = [...visits];

    pendingVisits.forEach((pendingVisit) => {
      const targetNurse = [...nurses].sort((left, right) => {
        const leftLoad = nextVisits.filter((visit) => visit.day === pendingVisit.day && visit.nurse === left).length;
        const rightLoad = nextVisits.filter((visit) => visit.day === pendingVisit.day && visit.nurse === right).length;
        return leftLoad - rightLoad;
      })[0];
      const hasConflict = nextVisits.some(
        (visit) =>
          visit.day === pendingVisit.day &&
          visit.nurse === targetNurse &&
          Math.abs(parseMinutes(visit.time) - parseMinutes(pendingVisit.time)) < 30
      );

      nextVisits.push({
        id: `auto-${pendingVisit.id}`,
        nurse: targetNurse,
        day: pendingVisit.day,
        time: pendingVisit.time,
        duration: estimateDuration(pendingVisit.type),
        patient: pendingVisit.patient,
        type: pendingVisit.type,
        zone: pendingVisit.zone,
        conflict: hasConflict ? 'Conflit a arbitrer apres auto-assign.' : undefined,
      });
    });

    setVisits(nextVisits);
    setPendingVisits([]);
    setFeedback(`${pendingVisits.length} visite(s) assignee(s) automatiquement.`);
  }

  function handleOptimize() {
    if (conflictCount === 0) {
      setFeedback('Aucun conflit a optimiser.');
      return;
    }

    let resolved = 0;

    setVisits((previous) =>
      previous.map((visit) => {
        if (visit.day !== selectedDay || !visit.conflict) {
          return visit;
        }

        resolved += 1;
        return { ...visit, time: addMinutes(visit.time, 10 + (resolved - 1) * 5), conflict: undefined };
      })
    );
    setFeedback(`Planning optimise: ${conflictCount} conflit(s) resolu(s).`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Clock className="h-5 w-5" />}
        title="Planning Intelligent"
        subtitle={`Semaine du ${formatDate(weekStart)} au ${formatDate(weekEnd)}`}
        badge={
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" aria-label="Semaine precedente" icon={<ChevronLeft className="h-4 w-4" />} className="text-white border-white/30 hover:bg-white/10" onClick={() => handleMoveWeek(-1)} />
            <Button type="button" variant="outline" size="sm" aria-label="Semaine suivante" icon={<ChevronRight className="h-4 w-4" />} className="text-white border-white/30 hover:bg-white/10" onClick={() => handleMoveWeek(1)} />
          </div>
        }
      >
        <div className="mt-1 flex items-center justify-around">
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
            <p className="text-lg font-bold text-white">{pendingVisits.length}</p>
            <p className="text-[10px] text-white/60">Non assignes</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mc-blue-500/20 bg-mc-blue-500/10 p-3">
          <CalendarDays className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-[var(--bg-tertiary)] p-1">
          {(['day', 'week', 'month'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${view === value ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              {value === 'day' ? 'Jour' : value === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
        <Button type="button" variant="gradient" size="sm" onClick={() => setVisitModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nouvelle visite
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {dayLabels.map((day, index) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(index)}
            className={`rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap ${selectedDay === index ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          >
            {day}
          </button>
        ))}
      </div>

      {visiblePendingVisits.length > 0 && (
        <Card glass className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mc-red-50 dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-mc-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{visiblePendingVisits.length} visites non assignees</p>
            <p className="text-xs text-[var(--text-muted)]">{visiblePendingVisits.map((visit) => `${visit.patient} (${visit.zone})`).join(' · ')}</p>
          </div>
          <Button type="button" variant="gradient" size="sm" onClick={handleAutoAssign}>
            <Sparkles className="h-3.5 w-3.5" />
            Auto-assign
          </Button>
        </Card>
      )}

      {conflictCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-mc-red-200 bg-mc-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-mc-red-500" />
          <span className="text-xs font-medium text-mc-red-600 dark:text-mc-red-400">{conflictCount} conflit(s) detecte(s)</span>
        </div>
      )}

      <Card glass className="flex items-center gap-3">
        <Zap className="h-5 w-5 shrink-0 text-mc-blue-500" />
        <div className="flex-1">
          <p className="text-xs font-medium">Optimisation IA disponible</p>
          <p className="text-[10px] text-[var(--text-muted)]">Resolution des conflits et equilibrage des tournees</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleOptimize}>
          <Sparkles className="h-3.5 w-3.5" />
          Optimiser
        </Button>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4 border-l-4 border-l-mc-red-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mc-red-50 dark:bg-red-900/30">
                <HeartPulse className="h-5 w-5 text-mc-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Charge HAD du planning</p>
                <p className="text-xs text-[var(--text-muted)]">Episodes ouverts a integrer aux tournees</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="xs" onClick={() => navigate('/coordinator/had-command-center')} iconRight={<ChevronRight className="h-3.5 w-3.5" />}>
              Centre HAD
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((placeholder) => (
                <div key={placeholder} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-tertiary)]" />
              ))}
            </div>
          ) : hadEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-4 text-sm text-[var(--text-muted)]">
              Aucun episode HAD ouvert a refleter cette semaine.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-mc-blue-500">{hadEpisodes.length}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">ouverts</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-mc-amber-500">{hadPlanningCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">a planifier</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-mc-red-500">{hadEscalatedCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">escalades</p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3">
                <p className="text-sm font-medium">Hotspots HAD</p>
                <div className="flex flex-wrap gap-1.5">
                  {hadCityLoad.map(([city, count]) => (
                    <Badge key={city} variant="outline">
                      <MapPin className="mr-1 h-3 w-3" />
                      {city} · {count}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {hadTargetSoonCount > 0 ? `${hadTargetSoonCount} sortie(s) cible(s) arrivent sous 48h.` : 'Aucune sortie HAD imminente a absorber.'}
                </p>
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Episodes HAD prioritaires</p>
              <p className="text-xs text-[var(--text-muted)]">Escalades, capacite et sorties proches</p>
            </div>
            <Badge variant={hadEscalatedCount > 0 ? 'red' : 'blue'}>{hadTargetSoonCount} sortie(s) &lt;48h</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((placeholder) => (
                <div key={placeholder} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-tertiary)]" />
              ))}
            </div>
          ) : hadPriority.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-5 text-sm text-[var(--text-muted)]">
              Aucune priorite HAD particuliere a remonter.
            </div>
          ) : (
            <div className="space-y-2">
              {hadPriority.map((episode) => (
                <button
                  key={episode.id}
                  type="button"
                  onClick={() => navigate('/coordinator/had-command-center', { state: { selectedEpisodeId: episode.id } })}
                  className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)]">
                      <HeartPulse className="h-4 w-4 text-mc-red-500" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{episode.patient.fullName}</p>
                        <Badge variant={statusTone(episode.status)}>{episode.status}</Badge>
                        <Badge variant={riskTone(episode.riskLevel)}>{episode.riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{episode.reference}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{episode.patient.city}</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{episode.targetEndAt ? new Date(episode.targetEndAt).toLocaleString('fr-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Pas de sortie cible'}</span>
                        <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{episode.hospital.name}</span>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Tournees par infirmier</p>
              <p className="text-xs text-[var(--text-muted)]">Vue {view === 'day' ? 'detaillee' : 'synthetique'} sur le jour selectionne</p>
            </div>
            <Badge variant={conflictCount === 0 ? 'green' : conflictCount === 1 ? 'amber' : 'red'}>
              {conflictCount} conflit(s)
            </Badge>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {Object.entries(typeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                <span className={`h-2.5 w-2.5 rounded-full ${typeDots[type as VisitType]}`} />
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {nurseSchedules.map((schedule) => (
              <Card key={schedule.nurse} hover padding="sm" className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={schedule.nurse} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{schedule.nurse}</p>
                      <Badge variant={schedule.visits.length > 0 ? 'blue' : 'outline'}>{schedule.visits.length} visite(s)</Badge>
                      <Badge variant={schedule.conflicts === 0 ? 'green' : schedule.conflicts === 1 ? 'amber' : 'red'}>
                        {schedule.conflicts === 0 ? 'Stable' : `${schedule.conflicts} conflit(s)`}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{schedule.duration} min de soins programmes</p>
                  </div>
                </div>

                {schedule.visits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-default)] px-3 py-3 text-sm text-[var(--text-muted)]">
                    Aucune visite attribuee.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schedule.visits.map((visit) => (
                      <div key={visit.id} className={`rounded-xl border px-3 py-2 ${visit.conflict ? 'border-mc-red-200 bg-mc-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-[var(--border-default)] bg-[var(--bg-secondary)]'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${typeDots[visit.type]}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{visit.patient}</p>
                              <Badge variant="outline">{typeLabels[visit.type]}</Badge>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">{visit.time} · {visit.duration} min · {visit.zone}</p>
                          </div>
                        </div>
                        {visit.conflict && <p className="mt-2 text-xs font-medium text-mc-red-600 dark:text-mc-red-400">{visit.conflict}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <p className="text-sm font-semibold">File d attente du jour</p>
            <p className="text-xs text-[var(--text-muted)]">Visites a assigner ou a reequilibrer</p>
          </div>

          {visiblePendingVisits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-5 text-sm text-[var(--text-muted)]">
              Aucun acte en attente sur ce jour.
            </div>
          ) : (
            <div className="space-y-2">
              {visiblePendingVisits.map((visit) => (
                <div key={visit.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-3 w-3 rounded-full ${typeDots[visit.type]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{visit.patient}</p>
                        <Badge variant="amber">Non assignee</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{visit.time} · {typeLabels[visit.type]} · {visit.zone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-4">
            <p className="text-sm font-semibold">Lecture rapide</p>
            <div className="mt-3 space-y-2 text-xs text-[var(--text-muted)]">
              <p>{dayVisits.length} visites planifiees sur la journee selectionnee.</p>
              <p>{nurseSchedules.filter((schedule) => schedule.visits.length > 0).length} infirmier(s) mobilise(s).</p>
              <p>{visiblePendingVisits.length} visite(s) restent a ventiler.</p>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={visitModalOpen} onClose={closeVisitModal} title="Nouvelle visite" size="lg">
        <form className="space-y-3" onSubmit={handleCreateVisit}>
          <Input label="Patient" value={visitForm.patient} onChange={(event) => setVisitForm((previous) => ({ ...previous, patient: event.target.value }))} placeholder="Nom du patient" required />

          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Heure" type="time" value={visitForm.time} onChange={(event) => setVisitForm((previous) => ({ ...previous, time: event.target.value }))} required />
            <Input label="Duree (min)" type="number" min="15" step="5" value={visitForm.duration} onChange={(event) => setVisitForm((previous) => ({ ...previous, duration: event.target.value }))} required />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="visit-type">Type de soin</label>
              <select id="visit-type" className={selectClassName} value={visitForm.type} onChange={(event) => setVisitForm((previous) => ({ ...previous, type: event.target.value as VisitType }))}>
                {Object.entries(typeLabels).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="visit-nurse">Infirmier</label>
              <select id="visit-nurse" className={selectClassName} value={visitForm.nurse} onChange={(event) => setVisitForm((previous) => ({ ...previous, nurse: event.target.value }))}>
                <option value="unassigned">Non assigne</option>
                {nurses.map((nurse) => (
                  <option key={nurse} value={nurse}>{nurse}</option>
                ))}
              </select>
            </div>
          </div>

          <Input label="Zone" value={visitForm.zone} onChange={(event) => setVisitForm((previous) => ({ ...previous, zone: event.target.value }))} placeholder="Ixelles" required />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeVisitModal}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </AnimatedPage>
  );
}
