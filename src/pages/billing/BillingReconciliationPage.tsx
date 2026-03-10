import { useState } from 'react';
import { AlertTriangle, ArrowUpDown, CheckCircle, Clock, DollarSign, Scale } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader, Input, Modal, Tabs } from '@/design-system';

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

const seedReconciliationData: ReconcItem[] = [
  { id: 'R001', batch: 'LOT-2026-0089', mutuelle: 'Mutualite Chretienne (100)', invoicedAmount: 3842.5, paidAmount: 3842.5, status: 'matched', date: '2026-02-28', paymentDate: '2026-03-05', patientCount: 24 },
  { id: 'R002', batch: 'LOT-2026-0088', mutuelle: 'Solidaris (300)', invoicedAmount: 2156.8, paidAmount: 2089.3, status: 'discrepancy', date: '2026-02-25', paymentDate: '2026-03-03', discrepancyReason: 'Rejet partiel - 3 prestations code 425110 refusees', patientCount: 16 },
  { id: 'R003', batch: 'LOT-2026-0087', mutuelle: 'Mutualites Libres (600)', invoicedAmount: 1567.2, paidAmount: null, status: 'pending', date: '2026-02-20', paymentDate: null, patientCount: 11 },
  { id: 'R004', batch: 'LOT-2026-0086', mutuelle: 'Partenamut (500)', invoicedAmount: 4210.9, paidAmount: 4210.9, status: 'matched', date: '2026-02-18', paymentDate: '2026-02-26', patientCount: 31 },
  { id: 'R005', batch: 'LOT-2026-0085', mutuelle: 'Mutualite Neutre (200)', invoicedAmount: 892.4, paidAmount: 750, status: 'discrepancy', date: '2026-02-15', paymentDate: '2026-02-24', discrepancyReason: 'Montant tiers payant reduit - patient sans accord', patientCount: 6 },
  { id: 'R006', batch: 'LOT-2026-0084', mutuelle: 'Solidaris (300)', invoicedAmount: 3100, paidAmount: 2800, status: 'partial', date: '2026-02-12', paymentDate: '2026-02-20', discrepancyReason: 'Paiement partiel - solde en cours de traitement', patientCount: 22 },
  { id: 'R007', batch: 'LOT-2026-0083', mutuelle: 'Mutualite Chretienne (100)', invoicedAmount: 1945.6, paidAmount: null, status: 'pending', date: '2026-02-10', paymentDate: null, patientCount: 14 },
  { id: 'R008', batch: 'LOT-2026-0082', mutuelle: 'Partenamut (500)', invoicedAmount: 2678.3, paidAmount: 2678.3, status: 'matched', date: '2026-02-05', paymentDate: '2026-02-13', patientCount: 19 },
];

const statusConfig: Record<ReconcStatus, { label: string; variant: 'green' | 'red' | 'amber' | 'blue'; icon: React.ReactNode }> = {
  matched: { label: 'Rapproche', variant: 'green', icon: <CheckCircle className="h-4 w-4 text-mc-green-500" /> },
  discrepancy: { label: 'Ecart', variant: 'red', icon: <AlertTriangle className="h-4 w-4 text-mc-red-500" /> },
  pending: { label: 'En attente', variant: 'amber', icon: <Clock className="h-4 w-4 text-mc-amber-500" /> },
  partial: { label: 'Partiel', variant: 'blue', icon: <DollarSign className="h-4 w-4 text-mc-blue-500" /> },
};

const tabs = [
  { id: 'all', label: 'Tous' },
  { id: 'discrepancy', label: 'Ecarts' },
  { id: 'pending', label: 'En attente' },
  { id: 'matched', label: 'Rapproches' },
];

function fmt(value: number) {
  return value.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' });
}

export function BillingReconciliationPage() {
  const [records] = useState(seedReconciliationData);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = records.filter((record) => {
    if (activeTab !== 'all' && record.status !== activeTab) return false;
    if (search && !record.batch.toLowerCase().includes(search.toLowerCase()) && !record.mutuelle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalInvoiced = records.reduce((sum, record) => sum + record.invoicedAmount, 0);
  const totalPaid = records.reduce((sum, record) => sum + (record.paidAmount ?? 0), 0);
  const totalPending = records.filter((record) => record.status === 'pending').reduce((sum, record) => sum + record.invoicedAmount, 0);
  const discrepancyTotal = records
    .filter((record) => record.status === 'discrepancy' || record.status === 'partial')
    .reduce((sum, record) => sum + record.invoicedAmount - (record.paidAmount ?? 0), 0);
  const detailItem = detailId ? records.find((record) => record.id === detailId) ?? null : null;

  function handleCreateClaim(item: ReconcItem) {
    setFeedback(`Reclamation preparee pour ${item.batch}.`);
  }

  function handleSendReminder(item: ReconcItem) {
    setFeedback(`Relance envoyee pour ${item.batch}.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader icon={<Scale className="h-5 w-5" />} title="Rapprochement" subtitle="Facturation vs. paiements recus">
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{fmt(totalInvoiced)}</p>
            <p className="text-[10px] text-white/60">Facture</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{fmt(totalPaid)}</p>
            <p className="text-[10px] text-white/60">Recu</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{fmt(totalPending)}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <Scale className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">{((totalPaid / totalInvoiced) * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Taux de recouvrement</p>
        </Card>
        <Card className="text-center">
          <p className={`text-2xl font-bold ${discrepancyTotal > 0 ? 'text-mc-red-500' : 'text-mc-green-500'}`}>{fmt(discrepancyTotal)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Ecarts detectes</p>
        </Card>
      </div>

      <Input icon={<AlertTriangle className="h-4 w-4" />} placeholder="Rechercher lot ou mutuelle..." value={search} onChange={(event) => setSearch(event.target.value)} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="text-center py-8">
            <Scale className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm">Aucun resultat</p>
          </Card>
        ) : (
          filtered.map((item) => {
            const cfg = statusConfig[item.status];
            const diff = item.paidAmount !== null ? item.invoicedAmount - item.paidAmount : null;
            const expanded = expandedId === item.id;

            return (
              <Card key={item.id} className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : item.id)}>
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
                        <p className="text-xs text-[var(--text-muted)]">Facture</p>
                        <p className="text-sm font-semibold">{fmt(item.invoicedAmount)}</p>
                      </div>
                      <ArrowUpDown className="h-3 w-3 text-[var(--text-muted)]" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Recu</p>
                        <p className={`text-sm font-semibold ${item.paidAmount === null ? 'text-mc-amber-500' : diff && diff > 0 ? 'text-mc-red-500' : 'text-mc-green-500'}`}>
                          {item.paidAmount !== null ? fmt(item.paidAmount) : '-'}
                        </p>
                      </div>
                      {diff !== null && diff > 0 && (
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">Ecart</p>
                          <p className="text-sm font-semibold text-mc-red-500">-{fmt(diff)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-[var(--text-muted)]">Date facturation:</span> <span className="font-medium">{item.date}</span></div>
                      <div><span className="text-[var(--text-muted)]">Date paiement:</span> <span className="font-medium">{item.paymentDate ?? '-'}</span></div>
                      <div><span className="text-[var(--text-muted)]">Patients:</span> <span className="font-medium">{item.patientCount}</span></div>
                      {item.paymentDate && (
                        <div><span className="text-[var(--text-muted)]">Delai:</span> <span className="font-medium">{Math.round((new Date(item.paymentDate).getTime() - new Date(item.date).getTime()) / 86400000)}j</span></div>
                      )}
                    </div>
                    {item.discrepancyReason && (
                      <div className="p-2 rounded-lg bg-mc-red-500/10 text-xs text-mc-red-600">
                        <strong>Raison:</strong> {item.discrepancyReason}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {item.status === 'discrepancy' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCreateClaim(item);
                          }}
                        >
                          Creer reclamation
                        </Button>
                      )}
                      {item.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSendReminder(item);
                          }}
                        >
                          Relancer
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetailId(item.id);
                        }}
                      >
                        Voir detail
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Modal open={Boolean(detailItem)} onClose={() => setDetailId(null)} title={detailItem ? `Detail ${detailItem.batch}` : 'Detail'}>
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Mutuelle</p>
                <p className="font-semibold">{detailItem.mutuelle}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Patients</p>
                <p className="font-semibold">{detailItem.patientCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Facture</p>
                <p className="font-semibold">{fmt(detailItem.invoicedAmount)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Recu</p>
                <p className="font-semibold">{detailItem.paidAmount !== null ? fmt(detailItem.paidAmount) : '-'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-[var(--text-muted)]">Date facturation:</span> {detailItem.date}</p>
              <p><span className="text-[var(--text-muted)]">Date paiement:</span> {detailItem.paymentDate ?? '-'}</p>
              {detailItem.discrepancyReason && <p><span className="text-[var(--text-muted)]">Raison:</span> {detailItem.discrepancyReason}</p>}
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setDetailId(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}
