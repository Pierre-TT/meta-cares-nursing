import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Clock,
  HeartPulse,
  Layers,
  MapPin,
  Navigation,
} from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Button, Card, GradientHeader } from '@/design-system';
import { useHadEpisodes } from '@/hooks/useHadData';
import type { HadEpisodeListItem, HadEpisodeRow } from '@/lib/had';

const nursePositions = [
  {
    name: 'Marie Laurent',
    lat: 50.8292,
    lng: 4.3632,
    zone: 'Ixelles',
    currentPatient: 'Dubois M.',
    eta: '5min',
    nextPatient: 'Janssen P.',
    status: 'in-visit' as const,
  },
  {
    name: 'Sophie Dupuis',
    lat: 50.812,
    lng: 4.342,
    zone: 'Uccle',
    currentPatient: 'Lambert J.',
    eta: '12min',
    nextPatient: 'Martin C.',
    status: 'in-transit' as const,
  },
  {
    name: 'Laura Van Damme',
    lat: 50.818,
    lng: 4.398,
    zone: 'Watermael',
    currentPatient: 'Willems A.',
    eta: '2min',
    nextPatient: null,
    status: 'in-visit' as const,
  },
  {
    name: 'Thomas Maes',
    lat: 50.835,
    lng: 4.375,
    zone: 'Etterbeek',
    currentPatient: null,
    eta: null,
    nextPatient: null,
    status: 'done' as const,
  },
];

const zones = [
  { name: 'Ixelles', nurses: 1, patients: 12, color: 'bg-mc-blue-500' },
  { name: 'Uccle', nurses: 1, patients: 10, color: 'bg-mc-green-500' },
  { name: 'Etterbeek', nurses: 1, patients: 8, color: 'bg-mc-amber-500' },
  { name: 'Watermael', nurses: 1, patients: 9, color: 'bg-purple-500' },
  { name: 'Auderghem', nurses: 0, patients: 5, color: 'bg-mc-red-500' },
];

const hadPinAnchors = [
  { top: '62%', left: '24%' },
  { top: '36%', left: '50%' },
  { top: '58%', left: '72%' },
  { top: '28%', left: '83%' },
] as const;

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

function getHadMapPriorityScore(episode: HadEpisodeListItem) {
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

  if (episode.status === 'paused') {
    score += 15;
  }

  if (isTargetWithinHours(episode.targetEndAt, 48)) {
    score += 20;
  }

  return score;
}

export function LiveMapPage() {
  const navigate = useNavigate();
  const { data: hadEpisodes = [], isLoading: isHadLoading } = useHadEpisodes({ onlyOpen: true });
  const activeNurses = nursePositions.filter((nurse) => nurse.status !== 'done').length;
  const hadEscalatedCount = hadEpisodes.filter((episode) => episode.status === 'escalated').length;
  const hadHighRiskCount = hadEpisodes.filter((episode) => ['high', 'critical'].includes(episode.riskLevel)).length;
  const hadTargetSoonCount = hadEpisodes.filter((episode) => isTargetWithinHours(episode.targetEndAt, 48)).length;
  const hadPriorityEpisodes = useMemo(
    () =>
      [...hadEpisodes]
        .sort((left, right) => {
          const scoreDiff = getHadMapPriorityScore(right) - getHadMapPriorityScore(left);

          if (scoreDiff !== 0) {
            return scoreDiff;
          }

          const leftTarget = left.targetEndAt ? new Date(left.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;
          const rightTarget = right.targetEndAt ? new Date(right.targetEndAt).getTime() : Number.MAX_SAFE_INTEGER;

          return leftTarget - rightTarget;
        })
        .slice(0, 4),
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
  const hadMapPins = hadPriorityEpisodes.map((episode, index) => ({
    episode,
    anchor: hadPinAnchors[index % hadPinAnchors.length],
  }));

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<MapPin className="h-5 w-5" />}
        title="Carte en Direct"
        subtitle="Positions GPS temps réel"
        badge={<Badge variant="green" dot>{activeNurses} en déplacement</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{activeNurses}</p>
            <p className="text-[10px] text-white/60">En tournée</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{zones.length}</p>
            <p className="text-[10px] text-white/60">Zones</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{zones.filter((zone) => zone.nurses === 0).length}</p>
            <p className="text-[10px] text-white/60">Non couvertes</p>
          </div>
        </div>
      </GradientHeader>

      <div className="relative h-64 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-mc-blue-500 mx-auto" />
            <p className="text-sm font-medium text-[var(--text-muted)]">Carte interactive</p>
            <p className="text-xs text-[var(--text-muted)]">Bruxelles — {activeNurses} infirmiers actifs</p>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <Badge variant={hadEscalatedCount > 0 ? 'red' : hadEpisodes.length > 0 ? 'blue' : 'outline'}>
            {hadEpisodes.length} HAD
          </Badge>
          {hadTargetSoonCount > 0 && <Badge variant="amber">{hadTargetSoonCount} sortie(s) &lt;48h</Badge>}
        </div>

        {nursePositions.map((nurse, index) => (
          <div
            key={nurse.name}
            className="absolute"
            style={{ top: `${20 + index * 15}%`, left: `${15 + index * 20}%` }}
          >
            <div
              className={`h-6 w-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-bold ${
                nurse.status === 'in-visit'
                  ? 'bg-mc-green-500'
                  : nurse.status === 'in-transit'
                    ? 'bg-mc-blue-500'
                    : 'bg-[var(--text-muted)]'
              }`}
            >
              {nurse.name[0]}
            </div>
          </div>
        ))}

        {hadMapPins.map(({ episode, anchor }) => (
          <button
            key={episode.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
            style={{ top: anchor.top, left: anchor.left }}
            onClick={() => navigate('/coordinator/had-command-center', { state: { selectedEpisodeId: episode.id } })}
          >
            <div className="space-y-1">
              <div
                className={`h-7 w-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white ${
                  episode.status === 'escalated' ? 'bg-mc-red-500' : 'bg-mc-amber-500'
                }`}
              >
                <HeartPulse className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-lg bg-[var(--bg-primary)] backdrop-blur-sm border border-[var(--border-default)] px-2 py-1 shadow-sm">
                <p className="text-[9px] font-semibold leading-none">{episode.patient.fullName.split(' ')[0]}</p>
                <p className="text-[8px] text-[var(--text-muted)] leading-none mt-1">{episode.patient.city}</p>
              </div>
            </div>
          </button>
        ))}

        <div className="absolute bottom-3 left-3 rounded-xl bg-[var(--bg-primary)] backdrop-blur-sm border border-[var(--border-default)] px-3 py-2">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-mc-green-500" />
              Infirmier en visite
            </span>
            <span className="inline-flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-mc-blue-500" />
              Infirmier en route
            </span>
            <span className="inline-flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-mc-amber-500" />
              Patient HAD
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4 border-l-4 border-l-mc-red-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <HeartPulse className="h-5 w-5 text-mc-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pôle HAD sur la carte</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Repérage spatial des épisodes HAD à surveiller dans la couverture terrain
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
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((placeholder) => (
                <div key={placeholder} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              ))}
            </div>
          ) : hadEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-4 text-sm text-[var(--text-muted)]">
              Aucun épisode HAD ouvert à visualiser sur la carte.
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
                  <p className="text-lg font-bold text-mc-green-500">{hadCityLoad.length}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">communes</p>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-3 space-y-2">
                <p className="text-sm font-medium">Clusters HAD</p>
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
                    ? `${hadTargetSoonCount} épisode(s) arrivent sur une fenêtre de sortie proche.`
                    : 'Pas de sortie HAD imminente détectée sur les clusters affichés.'}
                </p>
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Patients HAD prioritaires</p>
              <p className="text-xs text-[var(--text-muted)]">
                Episodes remontés sur la carte pour arbitrage rapide
              </p>
            </div>
            <Badge variant={hadEscalatedCount > 0 ? 'red' : 'blue'}>
              {hadPriorityEpisodes.length} visible{hadPriorityEpisodes.length > 1 ? 's' : ''}
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
              Aucun patient HAD prioritaire à afficher sur cette vue.
            </div>
          ) : (
            <div className="space-y-2">
              {hadPriorityEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => navigate('/coordinator/had-command-center', { state: { selectedEpisodeId: episode.id } })}
                  className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                      {episode.status === 'escalated' ? (
                        <AlertTriangle className="h-4 w-4 text-mc-red-500" />
                      ) : (
                        <HeartPulse className="h-4 w-4 text-mc-amber-500" />
                      )}
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
                          <Clock className="h-3.5 w-3.5" />
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

      <Card glass>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-semibold">Couverture zones</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {zones.map((zone) => (
            <div key={zone.name} className="text-center p-2 rounded-xl bg-[var(--bg-tertiary)]">
              <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1 ${zone.color} ${zone.nurses === 0 ? 'opacity-30' : ''}`} />
              <p className="text-[10px] font-medium">{zone.name}</p>
              <p className="text-[9px] text-[var(--text-muted)]">{zone.nurses}inf · {zone.patients}pat</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Positions infirmiers</h3>
        {nursePositions.map((nurse) => (
          <Card key={nurse.name} hover padding="sm" className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={nurse.name} size="md" />
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-primary)] ${
                    nurse.status === 'in-visit'
                      ? 'bg-mc-green-500'
                      : nurse.status === 'in-transit'
                        ? 'bg-mc-blue-500'
                        : 'bg-[var(--text-muted)]'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{nurse.name}</p>
                  <Badge variant={nurse.status === 'in-visit' ? 'green' : nurse.status === 'in-transit' ? 'blue' : 'outline'}>
                    {nurse.status === 'in-visit' ? 'En visite' : nurse.status === 'in-transit' ? 'En route' : 'Terminé'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {nurse.zone}
                  </span>
                  {nurse.currentPatient && <span>· Chez {nurse.currentPatient}</span>}
                  {nurse.eta && (
                    <span className="flex items-center gap-1">
                      · <Clock className="h-3 w-3" />
                      ETA {nurse.eta}
                    </span>
                  )}
                </div>
                {nurse.nextPatient && (
                  <p className="text-[10px] text-mc-blue-500 mt-0.5">Suivant: {nurse.nextPatient}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
