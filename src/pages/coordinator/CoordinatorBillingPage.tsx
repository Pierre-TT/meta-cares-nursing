import { useState } from 'react';
import { Euro, Send } from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Button, Card, CardHeader, CardTitle, GradientHeader } from '@/design-system';

interface NurseRevenue {
  name: string;
  invoices: number;
  revenue: number;
  pending: number;
  rate: number;
}

interface SubmissionEvent {
  date: string;
  invoices: number;
  amount: number;
  status: 'sent' | 'accepted';
}

const seedNurseRevenue: NurseRevenue[] = [
  { name: 'Marie Laurent', invoices: 52, revenue: 3840, pending: 245, rate: 98.1 },
  { name: 'Sophie Dupuis', invoices: 44, revenue: 3120, pending: 180, rate: 97.7 },
  { name: 'Thomas Maes', invoices: 38, revenue: 2680, pending: 0, rate: 100 },
  { name: 'Laura Van Damme', invoices: 41, revenue: 2810, pending: 120, rate: 96.5 },
];

const seedSubmissionEvents: SubmissionEvent[] = [
  { date: '06/03/2026', invoices: 14, amount: 1042, status: 'sent' },
  { date: '05/03/2026', invoices: 18, amount: 1340, status: 'accepted' },
  { date: '04/03/2026', invoices: 12, amount: 890, status: 'accepted' },
];

function getCurrentDateLabel(date = new Date()) {
  return date.toLocaleDateString('fr-BE');
}

export function CoordinatorBillingPage() {
  const [revenueRecords, setRevenueRecords] = useState<NurseRevenue[]>(seedNurseRevenue);
  const [submissionEvents, setSubmissionEvents] = useState<SubmissionEvent[]>(seedSubmissionEvents);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalRevenue = revenueRecords.reduce((sum, nurse) => sum + nurse.revenue, 0);
  const totalPending = revenueRecords.reduce((sum, nurse) => sum + nurse.pending, 0);

  function handleSendBatch() {
    const pendingMembers = revenueRecords.filter((nurse) => nurse.pending > 0);

    if (pendingMembers.length === 0) {
      setFeedback('Aucun lot eFact en attente.');
      return;
    }

    const pendingAmount = pendingMembers.reduce((sum, nurse) => sum + nurse.pending, 0);
    const pendingInvoices = pendingMembers.reduce((sum, nurse) => sum + nurse.invoices, 0);

    setRevenueRecords((previous) => previous.map((nurse) => ({ ...nurse, pending: 0 })));
    setSubmissionEvents((previous) => [
      {
        date: getCurrentDateLabel(),
        invoices: pendingInvoices,
        amount: pendingAmount,
        status: 'sent',
      },
      ...previous,
    ]);
    setFeedback(`Lot eFact envoyé pour ${pendingMembers.length} infirmier(s).`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Euro className="h-5 w-5" />}
        title="Facturation Centralisée"
        subtitle="Mars 2026 · Toutes infirmières"
        badge={
          <Button type="button" variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={handleSendBatch}>
            <Send className="h-3.5 w-3.5" />
            Lot eFact
          </Button>
        }
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
            <p className="text-lg font-bold text-white">{revenueRecords.reduce((sum, nurse) => sum + nurse.invoices, 0)}</p>
            <p className="text-[10px] text-white/60">Factures</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mc-blue-500/20 bg-mc-blue-500/10 p-3">
          <Send className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Détail par infirmier</CardTitle></CardHeader>
        <div className="space-y-3">
          {revenueRecords.map((nurse) => (
            <div key={nurse.name} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
              <Avatar name={nurse.name} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{nurse.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{nurse.invoices} factures</p>
                <div className="h-1.5 w-24 rounded-full bg-[var(--bg-tertiary)] mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-mc-green-500" style={{ width: `${(nurse.revenue / 4000) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">€{nurse.revenue.toLocaleString()}</p>
                <Badge variant={nurse.rate >= 98 ? 'green' : 'amber'}>{nurse.rate}%</Badge>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">En attente: €{nurse.pending}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Analyse rejets</CardTitle><Badge variant="red">5 ce mois</Badge></CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Cumul interdit</span><span className="font-bold">2</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Prescription manquante</span><span className="font-bold">2</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Accord préalable requis</span><span className="font-bold">1</span></div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Envois eFact récents</CardTitle></CardHeader>
        <div className="space-y-2">
          {submissionEvents.map((event) => (
            <div key={`${event.date}-${event.amount}`} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <div>
                <p className="text-xs font-medium">{event.date}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{event.invoices} factures</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">€{event.amount}</span>
                <Badge variant={event.status === 'accepted' ? 'green' : 'blue'}>
                  {event.status === 'accepted' ? 'Accepté' : 'Envoyé'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
