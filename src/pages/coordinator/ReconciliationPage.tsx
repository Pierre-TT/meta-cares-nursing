import { useState } from 'react';
import { ArrowRightLeft, Download, Landmark } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, CardHeader, CardTitle, ContentTabs, GradientHeader } from '@/design-system';
import { downloadTextFile } from '@/lib/download';

interface Payment {
  id: string;
  date: string;
  reference: string;
  mutuality: string;
  amount: number;
  matchedInvoices: number;
  status: 'matched' | 'partial' | 'unmatched';
}

const payments: Payment[] = [
  { id: '1', date: '05/03/2025', reference: 'VIRT-MC200-2025-0312', mutuality: 'MC 200', amount: 4523.8, matchedInvoices: 42, status: 'matched' },
  { id: '2', date: '04/03/2025', reference: 'VIRT-MC400-2025-0287', mutuality: 'MC 400', amount: 2187.5, matchedInvoices: 18, status: 'matched' },
  { id: '3', date: '03/03/2025', reference: 'VIRT-MC300-2025-0195', mutuality: 'MC 300', amount: 1892.3, matchedInvoices: 15, status: 'partial' },
  { id: '4', date: '01/03/2025', reference: 'VIRT-CAAMI-2025-0044', mutuality: 'CAAMI 600', amount: 345.2, matchedInvoices: 0, status: 'unmatched' },
];

const statusConfig = {
  matched: { label: 'Rapproché', variant: 'green' as const },
  partial: { label: 'Partiel', variant: 'amber' as const },
  unmatched: { label: 'Non rapproché', variant: 'red' as const },
};

function buildCsv(rows: string[][]) {
  return rows.map((columns) => columns.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function ReconciliationPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const matchedAmount = payments.filter((payment) => payment.status === 'matched').reduce((sum, payment) => sum + payment.amount, 0);
  const exportRows = [
    ['date', 'reference', 'mutuality', 'amount', 'matched_invoices', 'status'],
    ...payments.map((payment) => [
      payment.date,
      payment.reference,
      payment.mutuality,
      payment.amount.toFixed(2),
      String(payment.matchedInvoices),
      payment.status,
    ]),
  ];

  function handleExport() {
    const success = downloadTextFile(
      'coordinator-bank-reconciliation.csv',
      buildCsv(exportRows),
      'text/csv;charset=utf-8'
    );

    setFeedback(success ? 'Export rapprochement préparé.' : 'Export indisponible dans cet environnement.');
  }

  const paymentsTab = (
    <div className="space-y-3">
      <Card glass>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold">€{totalReceived.toFixed(0)}</p>
            <p className="text-xs text-[var(--text-muted)]">Reçu</p>
          </div>
          <div>
            <p className="text-lg font-bold text-mc-green-500">€{matchedAmount.toFixed(0)}</p>
            <p className="text-xs text-[var(--text-muted)]">Rapproché</p>
          </div>
          <div>
            <p className="text-lg font-bold text-mc-amber-500">€{(totalReceived - matchedAmount).toFixed(0)}</p>
            <p className="text-xs text-[var(--text-muted)]">En attente</p>
          </div>
        </div>
      </Card>

      {payments.map((payment) => {
        const status = statusConfig[payment.status];

        return (
          <Card key={payment.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-mc-blue-500" />
                  <p className="font-semibold text-sm">{payment.mutuality}</p>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{payment.date} · Réf: {payment.reference}</p>
                {payment.matchedInvoices > 0 && (
                  <p className="text-xs text-[var(--text-muted)]">{payment.matchedInvoices} factures rapprochées</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">€{payment.amount.toFixed(2)}</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const summaryTab = (
    <div className="space-y-3">
      <Card>
        <CardHeader><CardTitle>Résumé mensuel - Mars 2025</CardTitle></CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Factures envoyées</span><span className="font-bold">156</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Montant facturé</span><span className="font-bold">€12 845.60</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Paiements reçus</span><span className="font-bold text-mc-green-500">€{totalReceived.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">En attente de paiement</span><span className="font-bold text-mc-amber-500">€{(12845.6 - totalReceived).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Rejets non corrigés</span><span className="font-bold text-mc-red-500">3</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Délai moyen paiement</span><span className="font-bold">18 jours</span></div>
        </div>
      </Card>

      <Button type="button" variant="outline" className="w-full gap-2" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Exporter rapprochement (CSV)
      </Button>
    </div>
  );

  const tabs = [
    { id: 'payments', label: 'Paiements', content: paymentsTab },
    { id: 'summary', label: 'Synthèse', content: summaryTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<ArrowRightLeft className="h-5 w-5" />}
        title="Rapprochement Bancaire"
        subtitle="Mutualités · Mars 2025"
        badge={<Badge variant="blue">Mars 2025</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalReceived.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Reçu</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{matchedAmount.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Rapproché</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{payments.filter((payment) => payment.status === 'unmatched').length}</p>
            <p className="text-[10px] text-white/60">Non rapp.</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mc-blue-500/20 bg-mc-blue-500/10 p-3">
          <Download className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
