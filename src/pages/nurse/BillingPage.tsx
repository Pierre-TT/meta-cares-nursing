import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Euro,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, ContentTabs, AnimatedPage, GradientHeader } from '@/design-system';
import { featureFlags } from '@/lib/featureFlags';
import { MockFeatureNotice } from '@/components/MockFeatureNotice';

const mockInvoices = [
  { id: 'inv1', patient: 'Dubois Marie', date: '05/03/2026', acts: 3, totalW: 11.8, amount: 85.55, status: 'ready' as const },
  { id: 'inv2', patient: 'Janssen Pierre', date: '05/03/2026', acts: 4, totalW: 14.4, amount: 104.40, status: 'ready' as const },
  { id: 'inv3', patient: 'Lambert Jeanne', date: '05/03/2026', acts: 3, totalW: 13.9, amount: 100.78, status: 'sent' as const },
  { id: 'inv4', patient: 'Willems André', date: '04/03/2026', acts: 2, totalW: 6.6, amount: 47.85, status: 'accepted' as const },
  { id: 'inv5', patient: 'Martin Claudine', date: '03/03/2026', acts: 2, totalW: 5.6, amount: 40.60, status: 'rejected' as const, rejectReason: 'Cumul non autorisé — Code 425110 + 425132' },
];

const statusConfig = {
  ready: { label: 'À envoyer', color: 'amber' as const, icon: Clock },
  sent: { label: 'Envoyée', color: 'blue' as const, icon: Send },
  accepted: { label: 'Acceptée', color: 'green' as const, icon: CheckCircle },
  rejected: { label: 'Rejetée', color: 'red' as const, icon: AlertTriangle },
};

export function BillingPage() {
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  if (!featureFlags.enableHealthcareMocks) {
    return <MockFeatureNotice feature="Facturation eHealth / MyCareNet" />;
  }

  const filtered = filter === 'all' ? mockInvoices : mockInvoices.filter(inv => inv.status === filter);

  const totalReady = mockInvoices.filter(i => i.status === 'ready').reduce((s, i) => s + i.amount, 0);
  const totalSent = mockInvoices.filter(i => i.status === 'sent' || i.status === 'accepted').reduce((s, i) => s + i.amount, 0);

  const tabs = [
    {
      label: 'Prestations',
      content: (
        <div className="space-y-3">
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { value: 'all', label: 'Toutes' },
              { value: 'ready', label: 'À envoyer' },
              { value: 'sent', label: 'Envoyées' },
              { value: 'accepted', label: 'Acceptées' },
              { value: 'rejected', label: 'Rejetées' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-[image:var(--gradient-brand)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Invoice list */}
          {filtered.map(inv => {
            const config = statusConfig[inv.status];
            const StatusIcon = config.icon;
            return (
              <Card key={inv.id} hover padding="sm" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    inv.status === 'rejected' ? 'bg-mc-red-50 dark:bg-red-900/30' :
                    inv.status === 'accepted' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' :
                    'bg-mc-blue-50 dark:bg-mc-blue-900/30'
                  }`}>
                    <StatusIcon className={`h-5 w-5 ${
                      inv.status === 'rejected' ? 'text-mc-red-500' :
                      inv.status === 'accepted' ? 'text-mc-green-500' :
                      'text-mc-blue-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{inv.patient}</p>
                      <Badge variant={config.color}>{config.label}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {inv.date} • {inv.acts} actes • {inv.totalW.toFixed(1)}W
                    </p>
                    {inv.rejectReason && (
                      <p className="text-xs text-mc-red-500 mt-0.5">{inv.rejectReason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">€{inv.amount.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ),
    },
    {
      label: 'Synthèse',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card glass className="text-center">
              <p className="text-2xl font-bold text-mc-green-500">€{totalSent.toFixed(0)}</p>
              <p className="text-xs text-[var(--text-muted)]">Envoyé ce mois</p>
            </Card>
            <Card glass className="text-center">
              <p className="text-2xl font-bold text-mc-amber-500">€{totalReady.toFixed(0)}</p>
              <p className="text-xs text-[var(--text-muted)]">À envoyer</p>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Cumuls fréquents</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Toilette + Pilulier</span><span className="font-mono text-mc-green-500">OK</span></div>
              <div className="flex justify-between"><span>Toilette complète + partielle</span><span className="font-mono text-mc-red-500">INTERDIT</span></div>
              <div className="flex justify-between"><span>Pansement + Injection</span><span className="font-mono text-mc-green-500">OK</span></div>
              <div className="flex justify-between"><span>2× Toilette même jour</span><span className="font-mono text-mc-red-500">INTERDIT</span></div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      label: 'eFact',
      content: (
        <div className="space-y-4">
          <Card gradient>
            <CardHeader><CardTitle>Envoi eFact</CardTitle></CardHeader>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {mockInvoices.filter(i => i.status === 'ready').length} prestation(s) prête(s) pour envoi via MyCareNet
            </p>
            <Button variant="gradient" size="lg" className="w-full">
              <Send className="h-4 w-4" />
              Envoyer le lot eFact
            </Button>
          </Card>

          <Card>
            <CardHeader><CardTitle>Historique envois</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              {[
                { date: '04/03/2026', count: 8, accepted: 7, rejected: 1 },
                { date: '03/03/2026', count: 6, accepted: 6, rejected: 0 },
                { date: '28/02/2026', count: 12, accepted: 11, rejected: 1 },
              ].map((lot, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-[var(--text-muted)]">{lot.date}</span>
                  <div className="flex gap-2">
                    <Badge variant="green">{lot.accepted} OK</Badge>
                    {lot.rejected > 0 && <Badge variant="red">{lot.rejected} rejet</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <GradientHeader
        icon={<Euro className="h-5 w-5" />}
        title="Facturation"
        subtitle="Mars 2025 · Art. 8 Nomenclature"
        badge={<Badge variant="green">{mockInvoices.filter(i => i.status === 'accepted').length} acceptées</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{(totalReady + totalSent).toFixed(0)}</p>
            <p className="text-[10px] text-white/60">CA mensuel</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mockInvoices.filter(i => i.status === 'rejected').length}</p>
            <p className="text-[10px] text-white/60">Rejet(s)</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">96%</p>
            <p className="text-[10px] text-white/60">Taux accept.</p>
          </div>
        </div>
      </GradientHeader>

      {/* WE/Night tariff & ASD link */}
      <div className="grid grid-cols-2 gap-3">
        <Card glass className="text-center">
          <p className="text-xs font-medium text-[var(--text-muted)]">Supplément WE/Férié</p>
          <p className="text-lg font-bold text-mc-amber-500">+€32.40</p>
          <p className="text-[10px] text-[var(--text-muted)]">W=1.543 × 3 visites</p>
        </Card>
        <Card glass className="text-center cursor-pointer hover:ring-2 hover:ring-mc-blue-500/20" onClick={() => navigate('/nurse/asd')}>
          <p className="text-xs font-medium text-[var(--text-muted)]">ASD à générer</p>
          <p className="text-lg font-bold text-mc-blue-500">1</p>
          <p className="text-[10px] text-mc-blue-500">Voir les attestations →</p>
        </Card>
      </div>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
