import { useState } from 'react';
import { Send, CheckCircle, Clock, AlertTriangle, Plus, RefreshCw, ChevronDown, ChevronUp, Eye, Wifi, Package } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

type BatchStatus = 'draft' | 'validated' | 'sent' | 'accepted' | 'partial' | 'rejected';

interface Batch {
  id: string;
  reference: string;
  date: string;
  invoiceCount: number;
  totalAmount: number;
  mutuelle: string;
  status: BatchStatus;
  sentAt?: string;
  responseAt?: string;
  acceptedCount?: number;
  rejectedCount?: number;
  rejectReasons?: string[];
}

const batches: Batch[] = [
  { id: '1', reference: 'EF-2026-03-0445', date: '06/03/2026', invoiceCount: 12, totalAmount: 867.40, mutuelle: 'MC 200', status: 'sent', sentAt: '06/03 14:32' },
  { id: '2', reference: 'EF-2026-03-0444', date: '06/03/2026', invoiceCount: 8, totalAmount: 524.10, mutuelle: 'MC 100', status: 'draft' },
  { id: '3', reference: 'EF-2026-03-0443', date: '05/03/2026', invoiceCount: 15, totalAmount: 1089.55, mutuelle: 'MC 200', status: 'accepted', sentAt: '05/03 09:15', responseAt: '05/03 09:18', acceptedCount: 15, rejectedCount: 0 },
  { id: '4', reference: 'EF-2026-03-0442', date: '05/03/2026', invoiceCount: 10, totalAmount: 723.80, mutuelle: 'MC 300', status: 'accepted', sentAt: '05/03 09:12', responseAt: '05/03 09:14', acceptedCount: 10, rejectedCount: 0 },
  { id: '5', reference: 'EF-2026-03-0441', date: '04/03/2026', invoiceCount: 18, totalAmount: 1302.60, mutuelle: 'MC 200', status: 'partial', sentAt: '04/03 16:00', responseAt: '04/03 16:05', acceptedCount: 16, rejectedCount: 2, rejectReasons: ['Cumul non autorisé', 'Prescription manquante'] },
  { id: '6', reference: 'EF-2026-03-0440', date: '04/03/2026', invoiceCount: 5, totalAmount: 362.15, mutuelle: 'MC 500', status: 'rejected', sentAt: '04/03 15:50', responseAt: '04/03 15:55', acceptedCount: 0, rejectedCount: 5, rejectReasons: ['Certificat eHealth expiré'] },
  { id: '7', reference: 'EF-2026-03-0439', date: '03/03/2026', invoiceCount: 20, totalAmount: 1450.20, mutuelle: 'MC 100', status: 'accepted', sentAt: '03/03 10:00', responseAt: '03/03 10:02', acceptedCount: 20, rejectedCount: 0 },
];

const statusConfig: Record<BatchStatus, { label: string; variant: 'default' | 'blue' | 'green' | 'amber' | 'red' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  validated: { label: 'Validé', variant: 'blue' },
  sent: { label: 'Envoyé', variant: 'blue' },
  accepted: { label: 'Accepté', variant: 'green' },
  partial: { label: 'Partiel', variant: 'amber' },
  rejected: { label: 'Rejeté', variant: 'red' },
};

const statusIcon = {
  draft: <Clock className="h-5 w-5 text-[var(--text-muted)]" />,
  validated: <CheckCircle className="h-5 w-5 text-mc-blue-500" />,
  sent: <Send className="h-5 w-5 text-mc-blue-500" />,
  accepted: <CheckCircle className="h-5 w-5 text-mc-green-500" />,
  partial: <AlertTriangle className="h-5 w-5 text-mc-amber-500" />,
  rejected: <AlertTriangle className="h-5 w-5 text-mc-red-500" />,
};

export function EFactBatchesPage() {
  const [tab, setTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const draftCount = batches.filter(b => b.status === 'draft').length;
  const totalPending = batches.filter(b => b.status === 'draft' || b.status === 'validated').reduce((s, b) => s + b.totalAmount, 0);

  const filtered = tab === 'all' ? batches : batches.filter(b => b.status === tab);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Package className="h-5 w-5" />}
        title="Lots eFact"
        subtitle="Gestion des lots de facturation électronique"
        badge={
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15">
            <Wifi className="h-3 w-3 text-mc-green-300" />
            <span className="text-[10px] font-medium text-white/80">MyCareNet</span>
          </div>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{batches.length}</p>
            <p className="text-[10px] text-white/60">Lots</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{draftCount}</p>
            <p className="text-[10px] text-white/60">Brouillons</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalPending.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">À envoyer</p>
          </div>
        </div>
      </GradientHeader>

      {/* Pipeline summary */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {['draft', 'sent', 'accepted', 'partial', 'rejected'].map(s => {
          const count = batches.filter(b => b.status === s).length;
          const cfg = statusConfig[s as BatchStatus];
          return (
            <div key={s} className="flex-1 min-w-[80px] text-center py-2 px-1 rounded-lg bg-[var(--bg-secondary)]">
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button className="gap-1"><Plus className="h-4 w-4" /> Nouveau lot</Button>
        {draftCount > 0 && (
          <Button variant="gradient" className="gap-1"><Send className="h-4 w-4" /> Envoyer {draftCount} brouillon{draftCount > 1 ? 's' : ''}</Button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: `Tous (${batches.length})` },
          { id: 'draft', label: `Brouillons (${draftCount})` },
          { id: 'sent', label: 'Envoyés' },
          { id: 'accepted', label: 'Acceptés' },
          { id: 'rejected', label: 'Rejetés' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="space-y-2">
        {filtered.map(batch => {
          const cfg = statusConfig[batch.status];
          const expanded = expandedId === batch.id;
          return (
            <Card key={batch.id} hover className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : batch.id)}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  {statusIcon[batch.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold font-mono">{batch.reference}</p>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{batch.mutuelle} • {batch.invoiceCount} factures • {batch.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">€{batch.totalAmount.toFixed(2)}</p>
                  {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)] mx-auto mt-1" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)] mx-auto mt-1" />}
                </div>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {batch.sentAt && <div><span className="text-[var(--text-muted)]">Envoyé:</span> {batch.sentAt}</div>}
                    {batch.responseAt && <div><span className="text-[var(--text-muted)]">Réponse:</span> {batch.responseAt}</div>}
                    {batch.acceptedCount !== undefined && <div><span className="text-[var(--text-muted)]">Acceptés:</span> <span className="text-mc-green-500 font-medium">{batch.acceptedCount}</span></div>}
                    {batch.rejectedCount !== undefined && batch.rejectedCount > 0 && <div><span className="text-[var(--text-muted)]">Rejetés:</span> <span className="text-mc-red-500 font-medium">{batch.rejectedCount}</span></div>}
                  </div>
                  {batch.rejectReasons && batch.rejectReasons.length > 0 && (
                    <div className="p-2 rounded-lg bg-mc-red-500/10">
                      <p className="text-[10px] font-semibold text-mc-red-500 uppercase mb-1">Motifs de rejet</p>
                      {batch.rejectReasons.map((r, i) => (
                        <p key={i} className="text-xs text-mc-red-600">• {r}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="gap-1 text-xs"><Eye className="h-3 w-3" /> Détail</Button>
                    {(batch.status === 'rejected' || batch.status === 'partial') && (
                      <Button variant="outline" size="sm" className="gap-1 text-xs"><RefreshCw className="h-3 w-3" /> Resoumettre</Button>
                    )}
                    {batch.status === 'draft' && (
                      <Button size="sm" className="gap-1 text-xs"><Send className="h-3 w-3" /> Envoyer</Button>
                    )}
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
