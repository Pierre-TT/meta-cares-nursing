import { useState } from 'react';
import { Send, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, ContentTabs, GradientHeader } from '@/design-system';

interface EFactBatch {
  id: string;
  date: string;
  patient: string;
  acts: number;
  totalW: number;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  reference?: string;
  rejectReason?: string;
}

const batches: EFactBatch[] = [
  { id: '1', date: '06/03/2025', patient: 'Janssens Maria', acts: 3, totalW: 11.8, amount: 85.55, status: 'draft' },
  { id: '2', date: '06/03/2025', patient: 'Van Damme Pierre', acts: 2, totalW: 6.17, amount: 44.73, status: 'draft' },
  { id: '3', date: '05/03/2025', patient: 'Dubois Françoise', acts: 4, totalW: 14.4, amount: 104.40, status: 'sent', reference: 'EF-2025-03-0423' },
  { id: '4', date: '05/03/2025', patient: 'Peeters Jan', acts: 2, totalW: 6.17, amount: 44.73, status: 'accepted', reference: 'EF-2025-03-0422' },
  { id: '5', date: '04/03/2025', patient: 'Claes Anne', acts: 3, totalW: 10.8, amount: 78.30, status: 'rejected', reference: 'EF-2025-03-0415', rejectReason: 'Accord préalable expiré' },
];

const statusConfig = {
  draft: { label: 'Brouillon', variant: 'default' as const },
  sent: { label: 'Envoyé', variant: 'blue' as const },
  accepted: { label: 'Accepté', variant: 'green' as const },
  rejected: { label: 'Rejeté', variant: 'red' as const },
};

export function EFactPage() {
  const [sending, setSending] = useState(false);
  const drafts = batches.filter(b => b.status === 'draft');
  const totalDraftAmount = drafts.reduce((s, b) => s + b.amount, 0);

  const handleSendAll = () => {
    setSending(true);
    setTimeout(() => setSending(false), 2000);
  };

  const readyTab = (
    <div className="space-y-3">
      <Card glass>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{drafts.length} factures prêtes</p>
            <p className="text-xs text-[var(--text-muted)]">Montant total: €{totalDraftAmount.toFixed(2)}</p>
          </div>
          <Button variant="gradient" size="sm" className="gap-1" onClick={handleSendAll} disabled={sending}>
            {sending ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? 'Envoi…' : 'Envoyer tout'}
          </Button>
        </div>
      </Card>

      {drafts.map(b => (
        <Card key={b.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{b.patient}</p>
              <p className="text-xs text-[var(--text-muted)]">{b.date} · {b.acts} actes · {b.totalW.toFixed(2)} W</p>
            </div>
            <div className="text-right">
              <p className="font-bold">€{b.amount.toFixed(2)}</p>
              <Badge variant="default">Brouillon</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const historyTab = (
    <div className="space-y-3">
      {batches.filter(b => b.status !== 'draft').map(b => {
        const cfg = statusConfig[b.status];
        return (
          <Card key={b.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{b.patient}</p>
                <p className="text-xs text-[var(--text-muted)]">{b.date} · {b.reference}</p>
                {b.rejectReason && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-mc-red-500">
                    <AlertTriangle className="h-3 w-3" /> {b.rejectReason}
                  </div>
                )}
                {b.status === 'rejected' && (
                  <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs">
                    <RefreshCw className="h-3 w-3" /> Resoumettre
                  </Button>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">€{b.amount.toFixed(2)}</p>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const tabs = [
    { id: 'ready', label: `À envoyer (${drafts.length})`, content: readyTab },
    { id: 'history', label: 'Historique', content: historyTab },
  ];

  const totalMonthly = batches.reduce((s, b) => s + b.amount, 0);
  const acceptedAmount = batches.filter(b => b.status === 'accepted').reduce((s, b) => s + b.amount, 0);

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Send className="h-5 w-5" />}
        title="eFact"
        subtitle="Facturation électronique MyCareNet"
        badge={<Badge variant="blue">MyCareNet</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalMonthly.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Total mars</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{acceptedAmount.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Accepté</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{batches.filter(b => b.status === 'rejected').length}</p>
            <p className="text-[10px] text-white/60">Rejet(s)</p>
          </div>
        </div>
      </GradientHeader>
      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
