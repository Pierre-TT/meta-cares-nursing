import { useState } from 'react';
import { Scale, CheckCircle, AlertTriangle, Clock, Search, ArrowUpDown, DollarSign } from 'lucide-react';
import { Card, Badge, Button, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

type ReconcStatus = 'matched' | 'discrepancy' | 'pending' | 'partial';
interface ReconcItem {
  id: string;
  batch: string;
  mutuelle: string;
  invoicedAmount: number;
  paidAmount: number | null;
  status: ReconcStatus;
  date: string;
  paymentDate: string | null;
  discrepancyReason?: string;
  patientCount: number;
}

const reconcData: ReconcItem[] = [
  { id: 'R001', batch: 'LOT-2026-0089', mutuelle: 'Mutualité Chrétienne (100)', invoicedAmount: 3842.50, paidAmount: 3842.50, status: 'matched', date: '2026-02-28', paymentDate: '2026-03-05', patientCount: 24 },
  { id: 'R002', batch: 'LOT-2026-0088', mutuelle: 'Solidaris (300)', invoicedAmount: 2156.80, paidAmount: 2089.30, status: 'discrepancy', date: '2026-02-25', paymentDate: '2026-03-03', discrepancyReason: 'Rejet partiel — 3 prestations code 425110 refusées', patientCount: 16 },
  { id: 'R003', batch: 'LOT-2026-0087', mutuelle: 'Mutualités Libres (600)', invoicedAmount: 1567.20, paidAmount: null, status: 'pending', date: '2026-02-20', paymentDate: null, patientCount: 11 },
  { id: 'R004', batch: 'LOT-2026-0086', mutuelle: 'Partenamut (500)', invoicedAmount: 4210.90, paidAmount: 4210.90, status: 'matched', date: '2026-02-18', paymentDate: '2026-02-26', patientCount: 31 },
  { id: 'R005', batch: 'LOT-2026-0085', mutuelle: 'Mutualité Neutre (200)', invoicedAmount: 892.40, paidAmount: 750.00, status: 'discrepancy', date: '2026-02-15', paymentDate: '2026-02-24', discrepancyReason: 'Montant tiers payant réduit — patient sans accord', patientCount: 6 },
  { id: 'R006', batch: 'LOT-2026-0084', mutuelle: 'Solidaris (300)', invoicedAmount: 3100.00, paidAmount: 2800.00, status: 'partial', date: '2026-02-12', paymentDate: '2026-02-20', discrepancyReason: 'Paiement partiel — solde en cours de traitement', patientCount: 22 },
  { id: 'R007', batch: 'LOT-2026-0083', mutuelle: 'Mutualité Chrétienne (100)', invoicedAmount: 1945.60, paidAmount: null, status: 'pending', date: '2026-02-10', paymentDate: null, patientCount: 14 },
  { id: 'R008', batch: 'LOT-2026-0082', mutuelle: 'Partenamut (500)', invoicedAmount: 2678.30, paidAmount: 2678.30, status: 'matched', date: '2026-02-05', paymentDate: '2026-02-13', patientCount: 19 },
];

const statusConfig: Record<ReconcStatus, { label: string; variant: 'green' | 'red' | 'amber' | 'blue'; icon: React.ReactNode }> = {
  matched: { label: 'Rapproché', variant: 'green', icon: <CheckCircle className="h-4 w-4 text-mc-green-500" /> },
  discrepancy: { label: 'Écart', variant: 'red', icon: <AlertTriangle className="h-4 w-4 text-mc-red-500" /> },
  pending: { label: 'En attente', variant: 'amber', icon: <Clock className="h-4 w-4 text-mc-amber-500" /> },
  partial: { label: 'Partiel', variant: 'blue', icon: <DollarSign className="h-4 w-4 text-mc-blue-500" /> },
};

const tabs = [
  { id: 'all', label: 'Tous' },
  { id: 'discrepancy', label: 'Écarts' },
  { id: 'pending', label: 'En attente' },
  { id: 'matched', label: 'Rapprochés' },
];

function fmt(n: number) { return n.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' }); }

export function BillingReconciliationPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = reconcData.filter(r => {
    if (activeTab !== 'all' && r.status !== activeTab) return false;
    if (search && !r.batch.toLowerCase().includes(search.toLowerCase()) && !r.mutuelle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalInvoiced = reconcData.reduce((s, r) => s + r.invoicedAmount, 0);
  const totalPaid = reconcData.reduce((s, r) => s + (r.paidAmount ?? 0), 0);
  const totalPending = reconcData.filter(r => r.status === 'pending').reduce((s, r) => s + r.invoicedAmount, 0);
  const discrepancyTotal = reconcData.filter(r => r.status === 'discrepancy' || r.status === 'partial').reduce((s, r) => s + r.invoicedAmount - (r.paidAmount ?? 0), 0);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Scale className="h-5 w-5" />}
        title="Rapprochement"
        subtitle="Facturation vs. paiements reçus"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{fmt(totalInvoiced)}</p>
            <p className="text-[10px] text-white/60">Facturé</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{fmt(totalPaid)}</p>
            <p className="text-[10px] text-white/60">Reçu</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{fmt(totalPending)}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
        </div>
      </GradientHeader>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">{((totalPaid / totalInvoiced) * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Taux de recouvrement</p>
        </Card>
        <Card className="text-center">
          <p className={`text-2xl font-bold ${discrepancyTotal > 0 ? 'text-mc-red-500' : 'text-mc-green-500'}`}>{fmt(discrepancyTotal)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Écarts détectés</p>
        </Card>
      </div>

      <Input icon={<Search className="h-4 w-4" />} placeholder="Rechercher lot ou mutuelle…" value={search} onChange={e => setSearch(e.target.value)} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="text-center py-8">
            <Scale className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm">Aucun résultat</p>
          </Card>
        ) : filtered.map(item => {
          const cfg = statusConfig[item.status];
          const diff = item.paidAmount !== null ? item.invoicedAmount - item.paidAmount : null;
          return (
            <Card key={item.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
              <div className="flex items-start gap-3">
                {cfg.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{item.batch}</p>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{item.mutuelle}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Facturé</p>
                      <p className="text-sm font-semibold">{fmt(item.invoicedAmount)}</p>
                    </div>
                    <ArrowUpDown className="h-3 w-3 text-[var(--text-muted)]" />
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Reçu</p>
                      <p className={`text-sm font-semibold ${item.paidAmount === null ? 'text-mc-amber-500' : diff && diff > 0 ? 'text-mc-red-500' : 'text-mc-green-500'}`}>
                        {item.paidAmount !== null ? fmt(item.paidAmount) : '—'}
                      </p>
                    </div>
                    {diff !== null && diff > 0 && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Écart</p>
                        <p className="text-sm font-semibold text-mc-red-500">-{fmt(diff)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-[var(--text-muted)]">Date facturation:</span> <span className="font-medium">{item.date}</span></div>
                    <div><span className="text-[var(--text-muted)]">Date paiement:</span> <span className="font-medium">{item.paymentDate ?? '—'}</span></div>
                    <div><span className="text-[var(--text-muted)]">Patients:</span> <span className="font-medium">{item.patientCount}</span></div>
                    {item.paymentDate && item.date && (
                      <div><span className="text-[var(--text-muted)]">Délai:</span> <span className="font-medium">{Math.round((new Date(item.paymentDate).getTime() - new Date(item.date).getTime()) / 86400000)}j</span></div>
                    )}
                  </div>
                  {item.discrepancyReason && (
                    <div className="p-2 rounded-lg bg-mc-red-500/10 text-xs text-mc-red-600">
                      <strong>Raison:</strong> {item.discrepancyReason}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {item.status === 'discrepancy' && <Button variant="outline" size="sm">Créer réclamation</Button>}
                    {item.status === 'pending' && <Button variant="outline" size="sm">Relancer</Button>}
                    <Button variant="ghost" size="sm">Voir détail</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
