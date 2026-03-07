import { ShieldCheck, Star, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, AnimatedPage, GradientHeader, StatRing } from '@/design-system';

const incidents = [
  { id: 'i1', date: '05/03/2026', patient: 'Janssen P.', nurse: 'Marie Laurent', type: 'Alerte vitale', severity: 'high' as const, status: 'resolved' as const, description: 'Glycémie 312mg/dL — Médecin contacté' },
  { id: 'i2', date: '04/03/2026', patient: 'Willems A.', nurse: 'Laura Van Damme', type: 'Retard visite', severity: 'low' as const, status: 'resolved' as const, description: 'Retard 18min — embouteillage' },
  { id: 'i3', date: '03/03/2026', patient: 'Peeters H.', nurse: 'Sophie Dupuis', type: 'Chute patient', severity: 'medium' as const, status: 'open' as const, description: 'Chute lors du transfert — pas de blessure' },
];

const qualityTrends = [
  { month: 'Mars', punctuality: 94, planAdherence: 97, satisfaction: 4.7, incidents: 3 },
  { month: 'Février', punctuality: 92, planAdherence: 96, satisfaction: 4.6, incidents: 5 },
  { month: 'Janvier', punctuality: 89, planAdherence: 94, satisfaction: 4.4, incidents: 7 },
];

export function QualityPage() {
  const current = qualityTrends[0];

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Qualité des Soins"
        subtitle="Indicateurs & suivi"
        badge={<Badge variant="green">Score A</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{current.punctuality}%</p>
            <p className="text-[10px] text-white/60">Ponctualité</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{current.satisfaction}</p>
            <p className="text-[10px] text-white/60">Satisfaction</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{incidents.filter(i => i.status === 'open').length}</p>
            <p className="text-[10px] text-white/60">Incidents ouverts</p>
          </div>
        </div>
      </GradientHeader>

      {/* StatRings */}
      <div className="flex items-center justify-around">
        <StatRing value={current.punctuality} max={100} label="Ponctualité" suffix="%" color="blue" size={72} strokeWidth={5} />
        <StatRing value={current.planAdherence} max={100} label="Adhérence plan" suffix="%" color="green" size={72} strokeWidth={5} />
        <StatRing value={Math.round(current.satisfaction * 20)} max={100} label="Satisfaction" color="gradient" size={72} strokeWidth={5} />
        <StatRing value={100 - current.incidents * 5} max={100} label="Sécurité" color="amber" size={72} strokeWidth={5} />
      </div>

      {/* Trend */}
      <Card>
        <CardHeader><CardTitle>Évolution mensuelle</CardTitle></CardHeader>
        <div className="space-y-3">
          {qualityTrends.map((m, i) => (
            <div key={m.month} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
              <div>
                <p className="text-sm font-semibold">{m.month} 2026</p>
                <p className="text-xs text-[var(--text-muted)]">Ponctualité {m.punctuality}% · Plan {m.planAdherence}% · {m.incidents} incidents</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3.5 w-3.5 text-mc-amber-500 fill-mc-amber-500" />
                  <span className="text-sm font-bold">{m.satisfaction}</span>
                </div>
                {i > 0 && m.punctuality > qualityTrends[i - 1].punctuality && (
                  <TrendingUp className="h-4 w-4 text-mc-green-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Journal d'incidents</CardTitle>
          <Badge variant={incidents.some(i => i.status === 'open') ? 'amber' : 'green'}>
            {incidents.filter(i => i.status === 'open').length} ouvert(s)
          </Badge>
        </CardHeader>
        <div className="space-y-2">
          {incidents.map(inc => (
            <div key={inc.id} className="flex items-start gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                inc.severity === 'high' ? 'bg-mc-red-50 dark:bg-red-900/30' :
                inc.severity === 'medium' ? 'bg-mc-amber-50 dark:bg-amber-900/30' :
                'bg-mc-blue-50 dark:bg-mc-blue-900/30'
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  inc.severity === 'high' ? 'text-mc-red-500' : inc.severity === 'medium' ? 'text-mc-amber-500' : 'text-mc-blue-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{inc.type}</p>
                  <Badge variant={inc.status === 'open' ? 'amber' : 'green'}>{inc.status === 'open' ? 'Ouvert' : 'Résolu'}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{inc.description}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{inc.patient} · {inc.nurse} · {inc.date}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
