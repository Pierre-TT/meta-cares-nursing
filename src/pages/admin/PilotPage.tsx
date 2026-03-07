import { AlertTriangle, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { AnimatedPage, Badge, Card, CardHeader, CardTitle, GradientHeader, Button } from '@/design-system';
import { useHourlyPilotAdminOverview } from '@/hooks/useHourlyPilotData';
import { getHourlyPilotPlaceLabel } from '@/lib/hourlyPilot';

export function PilotPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useHourlyPilotAdminOverview();

  if (isLoading) {
    return (
      <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Chargement du pilotage horaire…</p>
        </Card>
      </AnimatedPage>
    );
  }

  if (error || !data) {
    return (
      <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Les indicateurs du pilote horaire n’ont pas pu être chargés.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      </AnimatedPage>
    );
  }

  const checklist = [
    {
      label: 'Catalogue officiel des pseudocodes chargé',
      ok: data.catalog.length >= 6,
    },
    {
      label: 'Synthèses horaires réellement générées',
      ok: data.totalVisits > 0,
    },
    {
      label: 'Lignes pilote utilisées sur des visites persistées',
      ok: data.activePseudocodeCount > 0,
    },
    {
      label: 'Couverture geofence mesurée',
      ok: data.avgGeofencingCoverage !== undefined,
    },
    {
      label: 'Backlog de revue manuelle sous contrôle',
      ok: data.reviewCount === 0,
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Clock className="h-5 w-5" />}
        title="Pilote facturation horaire"
        subtitle="Vue réelle du schéma pilote, du geofencing et des pseudocodes générés"
        badge={<Badge variant={data.readyRate >= 80 ? 'green' : 'amber'}>{data.readyRate}% prêts</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.totalVisits}</p>
            <p className="text-[10px] text-white/60">Visites pilotées</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.totalBillableHours.toFixed(1)}h</p>
            <p className="text-[10px] text-white/60">Temps facturable</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.activePseudocodeCount}/6</p>
            <p className="text-[10px] text-white/60">Codes utilisés</p>
          </div>
        </div>
      </GradientHeader>

      <Card gradient>
        <CardHeader>
          <CardTitle>Statut du pilote</CardTitle>
          <Badge variant={data.reviewCount === 0 ? 'green' : 'amber'}>
            {data.reviewCount === 0 ? 'Fluide' : `${data.reviewCount} revue(s)`}
          </Badge>
        </CardHeader>
        <p className="text-sm text-[var(--text-secondary)]">
          {data.totalVisits > 0
            ? `Le pipeline horaire est actif sur ${data.totalVisits} visite(s), avec ${data.totalBillableHours.toFixed(1)}h facturables et un delta cumulé de €${data.deltaAmount.toFixed(2)} contre le forfait.`
            : 'Aucune visite horaire persistée pour le moment: la structure est prête mais attend ses premières données terrain.'}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className={`text-2xl font-bold ${data.deltaAmount >= 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
            {data.deltaAmount >= 0 ? '+' : ''}€{data.deltaAmount.toFixed(0)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Écart cumulé vs forfait</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-blue-500">
            {data.avgGeofencingCoverage !== undefined ? `${Math.round(data.avgGeofencingCoverage * 100)}%` : '—'}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Couverture geofence moyenne</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de readiness</CardTitle>
          <Badge variant={data.readyRate >= 80 ? 'green' : 'amber'}>
            {checklist.filter((item) => item.ok).length}/{checklist.length} OK
          </Badge>
        </CardHeader>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
              <div className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle className="h-4 w-4 text-mc-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-mc-amber-500" />
                )}
                <span className="text-sm">{item.label}</span>
              </div>
              <Badge variant={item.ok ? 'green' : 'amber'}>{item.ok ? 'OK' : 'À surveiller'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par lieu</CardTitle>
            <Badge variant="outline">{data.placeBreakdown.length} lieu(x)</Badge>
          </CardHeader>
          <div className="space-y-2">
            {data.placeBreakdown.length > 0 ? data.placeBreakdown.map((row) => (
              <div key={row.placeOfService} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0 text-sm">
                <div>
                  <p className="font-medium">{getHourlyPilotPlaceLabel(row.placeOfService)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{row.visits} visite(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{row.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-[var(--text-muted)]">€{row.hourlyAmount.toFixed(2)}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--text-muted)]">Aucune synthèse horaire disponible.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalogue officiel chargé</CardTitle>
            <Badge variant="blue">{data.catalog.length} codes</Badge>
          </CardHeader>
          <div className="space-y-2">
            {data.catalog.map((entry) => (
              <div key={entry.code} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0 text-sm">
                <div>
                  <p className="font-medium">{entry.code}</p>
                  <p className="text-xs text-[var(--text-muted)]">{entry.label}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{entry.homeHourlyRate.toFixed(2)}/h</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    hors domicile €{entry.otherPlaceHourlyRate.toFixed(2)}/h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-2">
          <BarChart3 className="mt-0.5 h-4 w-4 text-mc-blue-500" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Lecture de gouvernance</p>
            <p className="text-[var(--text-muted)]">
              Le prochain levier de fiabilisation est la baisse des dossiers en revue manuelle, puis l’augmentation de la couverture GPS sur les visites déjà horodatées.
            </p>
          </div>
        </div>
      </Card>
    </AnimatedPage>
  );
}
