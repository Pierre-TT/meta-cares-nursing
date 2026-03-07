import { Euro, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Avatar, Button, AnimatedPage, GradientHeader } from '@/design-system';

const nurseRevenue = [
  { name: 'Marie Laurent', invoices: 52, revenue: 3840, pending: 245, rate: 98.1 },
  { name: 'Sophie Dupuis', invoices: 44, revenue: 3120, pending: 180, rate: 97.7 },
  { name: 'Thomas Maes', invoices: 38, revenue: 2680, pending: 0, rate: 100 },
  { name: 'Laura Van Damme', invoices: 41, revenue: 2810, pending: 120, rate: 96.5 },
];

export function CoordinatorBillingPage() {
  const totalRevenue = nurseRevenue.reduce((s, n) => s + n.revenue, 0);
  const totalPending = nurseRevenue.reduce((s, n) => s + n.pending, 0);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Euro className="h-5 w-5" />}
        title="Facturation Centralisée"
        subtitle="Mars 2026 · Toutes infirmières"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"><Send className="h-3.5 w-3.5" />Lot eFact</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-white/60">CA Mars</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalPending}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nurseRevenue.reduce((s, n) => s + n.invoices, 0)}</p>
            <p className="text-[10px] text-white/60">Factures</p>
          </div>
        </div>
      </GradientHeader>

      <Card>
        <CardHeader><CardTitle>Détail par infirmier</CardTitle></CardHeader>
        <div className="space-y-3">
          {nurseRevenue.map(n => (
            <div key={n.name} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
              <Avatar name={n.name} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{n.invoices} factures</p>
                {/* Mini sparkline bar */}
                <div className="h-1.5 w-24 rounded-full bg-[var(--bg-tertiary)] mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-mc-green-500" style={{ width: `${(n.revenue / 4000) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">€{n.revenue.toLocaleString()}</p>
                <Badge variant={n.rate >= 98 ? 'green' : 'amber'}>{n.rate}%</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rejection analysis */}
      <Card>
        <CardHeader><CardTitle>Analyse rejets</CardTitle><Badge variant="red">5 ce mois</Badge></CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Cumul interdit</span><span className="font-bold">2</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Prescription manquante</span><span className="font-bold">2</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Accord préalable requis</span><span className="font-bold">1</span></div>
        </div>
      </Card>

      {/* eFact submission timeline */}
      <Card>
        <CardHeader><CardTitle>Envois eFact récents</CardTitle></CardHeader>
        <div className="space-y-2">
          {[
            { date: '06/03/2026', invoices: 14, amount: 1042, status: 'envoyé' as const },
            { date: '05/03/2026', invoices: 18, amount: 1340, status: 'accepté' as const },
            { date: '04/03/2026', invoices: 12, amount: 890, status: 'accepté' as const },
          ].map(e => (
            <div key={e.date} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <div>
                <p className="text-xs font-medium">{e.date}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{e.invoices} factures</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">€{e.amount}</span>
                <Badge variant={e.status === 'accepté' ? 'green' : 'blue'}>{e.status === 'accepté' ? 'Accepté' : 'Envoyé'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
