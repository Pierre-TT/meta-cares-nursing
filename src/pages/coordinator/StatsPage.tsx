import { Users, Euro, Activity, Clock, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader } from '@/design-system';

export function StatsPage() {
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Statistiques Cabinet"
        subtitle="Données temps réel"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">Exporter</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">48</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€12.4k</p>
            <p className="text-[10px] text-white/60">CA mensuel</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">187</p>
            <p className="text-[10px] text-white/60">Visites</p>
          </div>
        </div>
      </GradientHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card glass className="text-center"><Users className="h-5 w-5 text-mc-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold">48</p><p className="text-xs text-[var(--text-muted)]">Patients actifs</p></Card>
        <Card glass className="text-center"><Activity className="h-5 w-5 text-mc-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">187</p><p className="text-xs text-[var(--text-muted)]">Visites/mois</p></Card>
        <Card glass className="text-center"><Euro className="h-5 w-5 text-mc-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">€12.4k</p><p className="text-xs text-[var(--text-muted)]">CA mensuel</p></Card>
        <Card glass className="text-center"><Clock className="h-5 w-5 text-mc-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold">34m</p><p className="text-xs text-[var(--text-muted)]">Durée moy.</p></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Répartition des actes</CardTitle></CardHeader>
        <div className="space-y-2">
          {[
            { label: 'Toilettes', pct: 38, color: 'bg-mc-blue-500' },
            { label: 'Pansements', pct: 22, color: 'bg-mc-green-500' },
            { label: 'Injections', pct: 18, color: 'bg-mc-amber-500' },
            { label: 'Pilulier', pct: 15, color: 'bg-purple-500' },
            { label: 'Paramètres', pct: 7, color: 'bg-mc-red-500' },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-3">
              <span className="text-xs w-20 text-[var(--text-muted)]">{a.label}</span>
              <div className="flex-1 h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className={`h-full rounded-full ${a.color}`} style={{ width: `${a.pct}%` }} />
              </div>
              <span className="text-xs font-bold w-10 text-right">{a.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Profil patients (Katz)</CardTitle></CardHeader>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[{ cat: 'O', count: 12 }, { cat: 'A', count: 15 }, { cat: 'B', count: 11 }, { cat: 'C', count: 7 }, { cat: 'Cd', count: 3 }].map(k => (
            <div key={k.cat} className="p-2 rounded-xl bg-[var(--bg-tertiary)]">
              <p className="text-lg font-bold">{k.count}</p>
              <Badge variant={k.cat === 'Cd' ? 'red' : k.cat === 'C' ? 'amber' : 'blue'}>{k.cat}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Nurse productivity comparison */}
      <Card>
        <CardHeader><CardTitle>Productivité par infirmier</CardTitle></CardHeader>
        <div className="space-y-2">
          {[
            { name: 'Marie Laurent', visits: 48, target: 45 },
            { name: 'Sophie Dupuis', visits: 42, target: 45 },
            { name: 'Thomas Maes', visits: 35, target: 45 },
            { name: 'Laura Van Damme', visits: 40, target: 45 },
          ].map(n => (
            <div key={n.name} className="flex items-center gap-3">
              <span className="text-xs w-24 truncate">{n.name.split(' ')[0]}</span>
              <div className="flex-1 h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className={`h-full rounded-full ${n.visits >= n.target ? 'bg-mc-green-500' : 'bg-mc-amber-500'}`} style={{ width: `${(n.visits / 50) * 100}%` }} />
              </div>
              <span className="text-xs font-bold w-10 text-right">{n.visits}/{n.target}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Patient outcomes */}
      <Card>
        <CardHeader><CardTitle>Résultats patients</CardTitle></CardHeader>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-xl bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-mc-green-500">2.1%</p>
            <p className="text-[10px] text-[var(--text-muted)]">Réhospitalisation</p>
          </div>
          <div className="p-2 rounded-xl bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-mc-blue-500">87%</p>
            <p className="text-[10px] text-[var(--text-muted)]">Cicatrisation plaies</p>
          </div>
          <div className="p-2 rounded-xl bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-mc-amber-500">4.7</p>
            <p className="text-[10px] text-[var(--text-muted)]">Satisfaction moy.</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tendance mensuelle</CardTitle></CardHeader>
        <div className="space-y-2 text-sm">
          {[
            { month: 'Mars 2026', visits: 187, revenue: 12450, delta: +8 },
            { month: 'Février 2026', visits: 210, revenue: 14200, delta: +12 },
            { month: 'Janvier 2026', visits: 195, revenue: 13100, delta: -3 },
          ].map(m => (
            <div key={m.month} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span>{m.month}</span>
              <div className="flex items-center gap-3">
                <span>{m.visits} visites</span>
                <span className="font-bold">€{m.revenue.toLocaleString()}</span>
                <Badge variant={m.delta >= 0 ? 'green' : 'red'}>{m.delta >= 0 ? '+' : ''}{m.delta}%</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
