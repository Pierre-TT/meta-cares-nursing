import { ArrowRightLeft, BarChart3, Clock, Info, Route } from 'lucide-react';
import { AnimatedPage, Badge, Card, CardHeader, CardTitle, ContentTabs, Button } from '@/design-system';
import { useNurseHourlyPilotWeekComparison } from '@/hooks/useHourlyPilotData';
import {
  FORFAIT_W_EURO_RATE,
  HOURLY_PILOT_HOME_CARE_RATE,
  HOURLY_PILOT_OTHER_PLACE_CARE_RATE,
  HOURLY_PILOT_TRAVEL_RATE,
} from '@/lib/hourlyPilot';
import { useAuthStore } from '@/stores/authStore';

export function HourlyComparisonPage() {
  const user = useAuthStore((state) => state.user);
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useNurseHourlyPilotWeekComparison(user?.id, 7);

  if (isLoading) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Chargement des comparatifs horaire vs forfait…</p>
        </Card>
      </AnimatedPage>
    );
  }

  if (error || !data) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Les données comparatives du pilote horaire n’ont pas pu être chargées.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      </AnimatedPage>
    );
  }

  const comparisonTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card glass className="text-center">
          <p className="text-xs text-[var(--text-muted)]">Forfait nomenclature</p>
          <p className="text-xl font-bold">€{data.totalForfaitEuro.toFixed(0)}</p>
          <p className="text-xs text-[var(--text-muted)]">{data.totalVisits} visites comparées</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-xs text-[var(--text-muted)]">Horaire pilote</p>
          <p className="text-xl font-bold text-mc-green-500">€{data.totalHourlyEuro.toFixed(0)}</p>
          <p className="text-xs text-[var(--text-muted)]">{(data.totalMinutes / 60).toFixed(1)}h facturables</p>
        </Card>
      </div>

      <Card className={`border-l-4 ${data.totalDelta >= 0 ? 'border-l-mc-green-500' : 'border-l-mc-red-500'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Écart observé sur 7 jours</p>
            <p className="text-sm text-[var(--text-muted)]">
              {data.totalDelta >= 0
                ? 'Le mode horaire dépasse le forfait sur la période.'
                : 'Le forfait reste supérieur sur la période.'}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${data.totalDelta >= 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
              {data.totalDelta >= 0 ? '+' : ''}€{data.totalDelta.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {data.totalForfaitEuro > 0
                ? `${data.totalDelta >= 0 ? '+' : ''}${((data.totalDelta / data.totalForfaitEuro) * 100).toFixed(1)}%`
                : '—'}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Détail par jour</CardTitle></CardHeader>
        <div className="space-y-2">
          {data.days.map((day) => (
            <div key={day.dayKey} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0 text-sm">
              <div>
                <p className="font-medium">{day.date}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {day.visits} visites · {Math.floor(day.totalMinutes / 60)}h{Math.round(day.totalMinutes % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)]">€{day.forfaitEuro.toFixed(0)}</span>
                  <ArrowRightLeft className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className="text-xs font-medium">€{day.hourlyEuro.toFixed(0)}</span>
                </div>
                <Badge variant={day.delta >= 0 ? 'green' : 'red'} className="mt-0.5">
                  {day.delta >= 0 ? '+' : ''}€{day.delta.toFixed(0)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pseudocodes observés</CardTitle></CardHeader>
        {data.previewCodes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.previewCodes.map((code) => (
              <Badge key={code} variant="outline">{code}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Aucun pseudocode horaire n’a encore été généré sur cette période.</p>
        )}
      </Card>
    </div>
  );

  const insightsTab = (
    <div className="space-y-4">
      <Card glass>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold">Analyse opérationnelle</p>
            <p className="text-xs text-[var(--text-muted)]">Basée sur les visites réellement persistées cette semaine</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Indicateurs clés</CardTitle></CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm">Temps moyen par visite</span>
            <span className="text-sm font-bold">{data.avgMinutesPerVisit} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Seuil d’équilibre horaire</span>
            <span className="text-sm font-bold">{data.breakEvenMinutesPerVisit} min/visite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">% visites au-dessus du seuil</span>
            <span className="text-sm font-bold text-mc-green-500">{data.visitsAboveBreakEvenRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Visites à revoir</span>
            <span className="text-sm font-bold text-mc-amber-500">{data.reviewCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Couverture GPS moyenne</span>
            <span className="text-sm font-bold">
              {data.avgGeofencingCoverage !== undefined
                ? `${Math.round(data.avgGeofencingCoverage * 100)}%`
                : '—'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Lecture de la période</p>
            <p className="text-[var(--text-muted)]">
              {data.totalDelta >= 0
                ? `Le pilote horaire surperforme actuellement de €${data.totalDelta.toFixed(2)}.`
                : `Le forfait garde un avantage de €${Math.abs(data.totalDelta).toFixed(2)}.`}
              {' '}Le prochain levier est la baisse des visites en revue manuelle et l’amélioration de la couverture geofence.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Profil par Katz</CardTitle></CardHeader>
        <div className="space-y-2">
          {data.katzBreakdown.length > 0 ? data.katzBreakdown.map((row) => (
            <div key={row.katz} className="flex items-center justify-between py-1.5 text-sm">
              <Badge variant="default">Katz {row.katz}</Badge>
              <span className="text-[var(--text-muted)]">{row.avgMinutes} min</span>
              <span>€{row.hourlyEuro.toFixed(0)}</span>
              <Badge variant={row.delta >= 0 ? 'green' : 'red'}>
                {row.delta >= 0 ? '+' : ''}€{row.delta.toFixed(0)}
              </Badge>
            </div>
          )) : (
            <p className="text-sm text-[var(--text-muted)]">Aucun historique exploitable par catégorie Katz sur la période.</p>
          )}
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'comparison', label: 'Comparaison', content: comparisonTab },
    { id: 'insights', label: 'Analyse', content: insightsTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Forfait vs Horaire</h1>
        <Badge variant="blue">Pilote INAMI 2026</Badge>
      </div>

      <Card glass>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-mc-blue-500" />
            <span>Valeur W: <strong>€{FORFAIT_W_EURO_RATE.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-mc-green-500" />
            <span>Direct/indirect domicile: <strong>€{HOURLY_PILOT_HOME_CARE_RATE.toFixed(2)}/h</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-mc-blue-500" />
            <span>Direct/indirect hors domicile: <strong>€{HOURLY_PILOT_OTHER_PLACE_CARE_RATE.toFixed(2)}/h</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-mc-amber-500" />
            <span>Déplacement lié au patient: <strong>€{HOURLY_PILOT_TRAVEL_RATE.toFixed(2)}/h</strong></span>
          </div>
        </div>
      </Card>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
