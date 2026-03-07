import { BarChart3, TrendingUp, Clock, CheckCircle2, Users, Target, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, AnimatedPage, GradientHeader } from '@/design-system';

const weeklyVisits = [
  { day: 'Lun', count: 8, prev: 7 },
  { day: 'Mar', count: 7, prev: 8 },
  { day: 'Mer', count: 9, prev: 6 },
  { day: 'Jeu', count: 6, prev: 9 },
  { day: 'Ven', count: 8, prev: 7 },
  { day: 'Sam', count: 3, prev: 4 },
  { day: 'Dim', count: 0, prev: 0 },
];

const kpis = [
  { label: 'Durée moy. visite', value: '42 min', target: '40 min', trend: '+2 min', trendUp: true, icon: Clock, color: 'text-mc-blue-500' },
  { label: 'Ponctualité', value: '94%', target: '95%', trend: '+1%', trendUp: true, icon: Target, color: 'text-mc-green-500' },
  { label: 'Taux eFact accepté', value: '96.2%', target: '95%', trend: '+0.5%', trendUp: true, icon: CheckCircle2, color: 'text-mc-green-500' },
  { label: 'BelRAI complétés', value: '100%', target: '100%', trend: '0%', trendUp: true, icon: Activity, color: 'text-mc-blue-500' },
  { label: 'Journal signé', value: '93.8%', target: '100%', trend: '-2.2%', trendUp: false, icon: CheckCircle2, color: 'text-mc-amber-500' },
  { label: 'Satisfaction patient', value: '4.8/5', target: '4.5/5', trend: '+0.1', trendUp: true, icon: Users, color: 'text-mc-green-500' },
];

const teamComparison = [
  { metric: 'Visites/jour', you: 7.2, team: 6.8, better: true },
  { metric: 'Durée moy.', you: 42, team: 38, better: false },
  { metric: 'CA mensuel', you: 12450, team: 11200, better: true },
  { metric: 'Ponctualité', you: 94, team: 91, better: true },
  { metric: 'Taux eFact', you: 96.2, team: 94.8, better: true },
];

const monthlyRevenue = [
  { month: 'Oct', amount: 10800 },
  { month: 'Nov', amount: 11200 },
  { month: 'Déc', amount: 9800 },
  { month: 'Jan', amount: 11900 },
  { month: 'Fév', amount: 12100 },
  { month: 'Mar', amount: 12450 },
];

export function StatisticsPage() {
  const maxVisits = Math.max(...weeklyVisits.map(d => Math.max(d.count, d.prev)));
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.amount));

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Mes Statistiques"
        subtitle="Performance personnelle"
        badge={<Badge variant="green">Mars 2025</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">7.2</p>
            <p className="text-[10px] text-white/60">Visites/jour</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€12.4k</p>
            <p className="text-[10px] text-white/60">CA mensuel</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">4.8</p>
            <p className="text-[10px] text-white/60">Note qualité</p>
          </div>
        </div>
      </GradientHeader>

      {/* Weekly visits chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visites cette semaine</CardTitle>
          <Badge variant="blue">{weeklyVisits.reduce((s, d) => s + d.count, 0)} total</Badge>
        </CardHeader>
        <div className="flex items-end gap-2 h-28 mt-2">
          {weeklyVisits.map(day => (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full flex items-end justify-center gap-0.5" style={{ height: '80px' }}>
                {/* Previous week bar */}
                <div
                  className="w-2.5 rounded-t bg-[var(--border-default)] transition-all"
                  style={{ height: `${(day.prev / maxVisits) * 100}%` }}
                />
                {/* Current week bar */}
                <div
                  className="w-2.5 rounded-t bg-[image:var(--gradient-brand)] transition-all"
                  style={{ height: `${(day.count / maxVisits) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[image:var(--gradient-brand)]" /> Cette semaine</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[var(--border-default)]" /> Semaine précédente</span>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label} glass className="space-y-1">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[10px] text-[var(--text-muted)]">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold">{kpi.value}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)]">Cible: {kpi.target}</span>
              <span className={`text-[10px] font-medium ${kpi.trendUp ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
                {kpi.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Monthly revenue trend */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution CA mensuel</CardTitle>
          <Badge variant="green"><TrendingUp className="h-3 w-3 mr-1" />+15% sur 6 mois</Badge>
        </CardHeader>
        <div className="flex items-end gap-3 h-24 mt-2">
          {monthlyRevenue.map(m => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[image:var(--gradient-brand)] transition-all"
                style={{ height: `${(m.amount / maxRevenue) * 100}%` }}
              />
              <span className="text-[10px] text-[var(--text-muted)]">{m.month}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Team comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison équipe</CardTitle>
          <Badge variant="blue"><Users className="h-3 w-3 mr-1" />5 infirmiers</Badge>
        </CardHeader>
        <div className="space-y-2">
          {teamComparison.map(row => (
            <div key={row.metric} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0 text-sm">
              <span className="text-[var(--text-muted)]">{row.metric}</span>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${row.better ? 'text-mc-green-500' : 'text-mc-amber-500'}`}>
                  {typeof row.you === 'number' && row.you > 100 ? `€${row.you.toLocaleString()}` : row.you}{typeof row.you === 'number' && row.metric.includes('%') ? '%' : row.metric.includes('moy') ? ' min' : ''}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  moy: {typeof row.team === 'number' && row.team > 100 ? `€${row.team.toLocaleString()}` : row.team}{typeof row.team === 'number' && row.metric.includes('%') ? '%' : row.metric.includes('moy') ? ' min' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
