import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Package,
  Plus,
  RefreshCw,
  Send,
  Wifi,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader, Modal, Tabs } from '@/design-system';
import {
  getBatchCompliance,
  getBatchSendBlockers,
  getBatchWarnings,
  getComplianceVariant,
} from '@/lib/inamiBillingCompliance';

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

const seedBatches: Batch[] = [
  { id: '1', reference: 'EF-2026-03-0445', date: '06/03/2026', invoiceCount: 12, totalAmount: 867.4, mutuelle: 'MC 200', status: 'sent', sentAt: '06/03 14:32' },
  { id: '2', reference: 'EF-2026-03-0444', date: '06/03/2026', invoiceCount: 8, totalAmount: 524.1, mutuelle: 'MC 100', status: 'draft' },
  { id: '3', reference: 'EF-2026-03-0443', date: '05/03/2026', invoiceCount: 15, totalAmount: 1089.55, mutuelle: 'MC 200', status: 'accepted', sentAt: '05/03 09:15', responseAt: '05/03 09:18', acceptedCount: 15, rejectedCount: 0 },
  { id: '4', reference: 'EF-2026-03-0442', date: '05/03/2026', invoiceCount: 10, totalAmount: 723.8, mutuelle: 'MC 300', status: 'accepted', sentAt: '05/03 09:12', responseAt: '05/03 09:14', acceptedCount: 10, rejectedCount: 0 },
  { id: '5', reference: 'EF-2026-03-0441', date: '04/03/2026', invoiceCount: 18, totalAmount: 1302.6, mutuelle: 'MC 200', status: 'partial', sentAt: '04/03 16:00', responseAt: '04/03 16:05', acceptedCount: 16, rejectedCount: 2, rejectReasons: ['Cumul non autorise', 'Prescription manquante'] },
  { id: '6', reference: 'EF-2026-03-0440', date: '04/03/2026', invoiceCount: 5, totalAmount: 362.15, mutuelle: 'MC 500', status: 'rejected', sentAt: '04/03 15:50', responseAt: '04/03 15:55', acceptedCount: 0, rejectedCount: 5, rejectReasons: ['Certificat eHealth expire'] },
  { id: '7', reference: 'EF-2026-03-0439', date: '03/03/2026', invoiceCount: 20, totalAmount: 1450.2, mutuelle: 'MC 100', status: 'accepted', sentAt: '03/03 10:00', responseAt: '03/03 10:02', acceptedCount: 20, rejectedCount: 0 },
];

const statusConfig: Record<BatchStatus, { label: string; variant: 'default' | 'blue' | 'green' | 'amber' | 'red' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  validated: { label: 'Valide', variant: 'blue' },
  sent: { label: 'Envoye', variant: 'blue' },
  accepted: { label: 'Accepte', variant: 'green' },
  partial: { label: 'Partiel', variant: 'amber' },
  rejected: { label: 'Rejete', variant: 'red' },
};

const statusIcon = {
  draft: <Clock className="h-5 w-5 text-[var(--text-muted)]" />,
  validated: <CheckCircle className="h-5 w-5 text-mc-blue-500" />,
  sent: <Send className="h-5 w-5 text-mc-blue-500" />,
  accepted: <CheckCircle className="h-5 w-5 text-mc-green-500" />,
  partial: <AlertTriangle className="h-5 w-5 text-mc-amber-500" />,
  rejected: <AlertTriangle className="h-5 w-5 text-mc-red-500" />,
};

function buildBatchTimestamp(date = new Date()) {
  return date.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildBatchDate(date = new Date()) {
  return date.toLocaleDateString('fr-BE');
}

export function EFactBatchesPage() {
  const [batchRecords, setBatchRecords] = useState(seedBatches);
  const [tab, setTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const draftCount = batchRecords.filter((batch) => batch.status === 'draft').length;
  const totalPending = batchRecords
    .filter((batch) => batch.status === 'draft' || batch.status === 'validated')
    .reduce((sum, batch) => sum + batch.totalAmount, 0);
  const filtered = tab === 'all' ? batchRecords : batchRecords.filter((batch) => batch.status === tab);
  const detailBatch = detailId ? batchRecords.find((batch) => batch.id === detailId) ?? null : null;
  const blockedBatchCount = batchRecords.filter((batch) => getBatchSendBlockers(getBatchCompliance(batch.id)).length > 0).length;
  const warningBatchCount = batchRecords.filter((batch) => getBatchWarnings(getBatchCompliance(batch.id)).length > 0).length;

  function buildBatchReference() {
    const nextNumber =
      batchRecords.reduce((max, batch) => {
        const numericPart = Number.parseInt(batch.reference.split('-').pop() ?? '0', 10);
        return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
      }, 0) + 1;

    return `EF-2026-03-${String(nextNumber).padStart(4, '0')}`;
  }

  function toSentBatch(batch: Batch): Batch {
    return {
      ...batch,
      status: 'sent',
      sentAt: buildBatchTimestamp(),
      responseAt: undefined,
      acceptedCount: undefined,
      rejectedCount: undefined,
      rejectReasons: undefined,
    };
  }

  function handleCreateBatch() {
    const nextBatch: Batch = {
      id: `batch-${Date.now()}`,
      reference: buildBatchReference(),
      date: buildBatchDate(),
      invoiceCount: 6,
      totalAmount: 418.25,
      mutuelle: 'MC 900',
      status: 'draft',
    };

    setBatchRecords((previous) => [nextBatch, ...previous]);
    setExpandedId(nextBatch.id);
    setFeedback(`Nouveau lot cree: ${nextBatch.reference}.`);
  }

  function handleSendDrafts() {
    if (draftCount === 0) {
      setFeedback('Aucun brouillon a envoyer.');
      return;
    }

    const sendableBatchIds = batchRecords
      .filter((batch) => batch.status === 'draft')
      .filter((batch) => getBatchSendBlockers(getBatchCompliance(batch.id)).length === 0)
      .map((batch) => batch.id);
    const blockedCount = draftCount - sendableBatchIds.length;

    if (sendableBatchIds.length === 0) {
      setFeedback('Aucun brouillon conforme aux prerequis INAMI/MyCareNet.');
      return;
    }

    setBatchRecords((previous) => previous.map((batch) => (sendableBatchIds.includes(batch.id) ? toSentBatch(batch) : batch)));
    setExpandedId(null);
    setFeedback(
      `${sendableBatchIds.length} lot(s) envoye(s) vers MyCareNet.` +
      (blockedCount > 0 ? ` ${blockedCount} lot(s) restent bloques par les prerequis administratifs.` : '')
    );
  }

  function handleSendBatch(batchId: string) {
    const currentBatch = batchRecords.find((batch) => batch.id === batchId);
    if (!currentBatch) return;

    const blockers = getBatchSendBlockers(getBatchCompliance(batchId));
    if (blockers.length > 0) {
      setFeedback(`Lot ${currentBatch.reference} bloque: ${blockers[0]}.`);
      return;
    }

    setBatchRecords((previous) => previous.map((batch) => (batch.id === batchId ? toSentBatch(batch) : batch)));
    setFeedback(
      currentBatch.status === 'draft'
        ? `Lot ${currentBatch.reference} envoye.`
        : `Lot ${currentBatch.reference} resoumis a MyCareNet.`
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Package className="h-5 w-5" />}
        title="Lots eFact"
        subtitle="Gestion des lots de facturation electronique"
        badge={
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15">
            <Wifi className="h-3 w-3 text-mc-green-300" />
            <span className="text-[10px] font-medium text-white/80">MyCareNet</span>
          </div>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{batchRecords.length}</p>
            <p className="text-[10px] text-white/60">Lots</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{draftCount}</p>
            <p className="text-[10px] text-white/60">Brouillons</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">EUR {totalPending.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">A envoyer</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <Send className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['draft', 'sent', 'accepted', 'partial', 'rejected'] as BatchStatus[]).map((status) => {
          const count = batchRecords.filter((batch) => batch.status === status).length;
          const cfg = statusConfig[status];
          return (
            <div key={status} className="flex-1 min-w-[80px] text-center py-2 px-1 rounded-lg bg-[var(--bg-secondary)]">
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Conformite eFact infirmier</p>
            <p className="text-xs text-[var(--text-muted)]">
              Tiers payant via MyCareNet, paquet homologue, identity coverage, prescriptions archivees 5 ans, documents Medadmin et justificatifs patients sous 28 jours.
            </p>
          </div>
          <Badge variant={blockedBatchCount > 0 ? 'amber' : 'green'}>
            {blockedBatchCount > 0 ? `${blockedBatchCount} lot(s) bloques` : 'Lots prets'}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <p className="font-bold text-mc-green-500">{batchRecords.filter((batch) => getBatchSendBlockers(getBatchCompliance(batch.id)).length === 0).length}</p>
            <p className="text-[var(--text-muted)]">Eligibles</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <p className="font-bold text-mc-amber-500">{warningBatchCount}</p>
            <p className="text-[var(--text-muted)]">A surveiller</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <p className="font-bold text-mc-red-500">{blockedBatchCount}</p>
            <p className="text-[var(--text-muted)]">Bloques</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button className="gap-1" onClick={handleCreateBatch}>
          <Plus className="h-4 w-4" /> Nouveau lot
        </Button>
        {draftCount > 0 && (
          <Button variant="gradient" className="gap-1" onClick={handleSendDrafts}>
            <Send className="h-4 w-4" /> Envoyer {draftCount} brouillon{draftCount > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: `Tous (${batchRecords.length})` },
          { id: 'draft', label: `Brouillons (${draftCount})` },
          { id: 'sent', label: 'Envoyes' },
          { id: 'accepted', label: 'Acceptes' },
          { id: 'rejected', label: 'Rejetes' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="space-y-2">
        {filtered.map((batch) => {
          const cfg = statusConfig[batch.status];
          const expanded = expandedId === batch.id;
          const compliance = getBatchCompliance(batch.id);
          const blockers = getBatchSendBlockers(compliance);
          const warnings = getBatchWarnings(compliance);

          return (
            <Card key={batch.id} hover className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : batch.id)}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  {statusIcon[batch.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold font-mono">{batch.reference}</p>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    {blockers.length > 0 && <Badge variant="red">Bloque</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{batch.mutuelle} - {batch.invoiceCount} factures - {batch.date}</p>
                  {(blockers.length > 0 || warnings.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[compliance.approvedPackage, compliance.instructionSync, compliance.identityCoverage, compliance.prescriptionArchive, compliance.medadmin, compliance.patientJustificatif]
                        .filter((entry) => entry.state !== 'ready')
                        .map((entry) => (
                          <Badge key={`${batch.id}-${entry.label}`} variant={getComplianceVariant(entry.state)}>
                            {entry.label}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">EUR {batch.totalAmount.toFixed(2)}</p>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-muted)] mx-auto mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)] mx-auto mt-1" />
                  )}
                </div>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {batch.sentAt && <div><span className="text-[var(--text-muted)]">Envoye:</span> {batch.sentAt}</div>}
                    {batch.responseAt && <div><span className="text-[var(--text-muted)]">Reponse:</span> {batch.responseAt}</div>}
                    {batch.acceptedCount !== undefined && (
                      <div><span className="text-[var(--text-muted)]">Acceptes:</span> <span className="text-mc-green-500 font-medium">{batch.acceptedCount}</span></div>
                    )}
                    {batch.rejectedCount !== undefined && batch.rejectedCount > 0 && (
                      <div><span className="text-[var(--text-muted)]">Rejetes:</span> <span className="text-mc-red-500 font-medium">{batch.rejectedCount}</span></div>
                    )}
                  </div>
                  {batch.rejectReasons && batch.rejectReasons.length > 0 && (
                    <div className="p-2 rounded-lg bg-mc-red-500/10">
                      <p className="text-[10px] font-semibold text-mc-red-500 uppercase mb-1">Motifs de rejet</p>
                      {batch.rejectReasons.map((reason) => (
                        <p key={reason} className="text-xs text-mc-red-600">- {reason}</p>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[compliance.approvedPackage, compliance.identityCoverage, compliance.prescriptionArchive, compliance.patientJustificatif].map((entry) => (
                      <div key={`${batch.id}-detail-${entry.label}`} className="rounded-xl bg-[var(--bg-secondary)] p-2">
                        <Badge variant={getComplianceVariant(entry.state)}>{entry.label}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailId(batch.id);
                      }}
                    >
                      <Eye className="h-3 w-3" /> Detail
                    </Button>
                    {(batch.status === 'rejected' || batch.status === 'partial') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSendBatch(batch.id);
                        }}
                      >
                        <RefreshCw className="h-3 w-3" /> Resoumettre
                      </Button>
                    )}
                    {batch.status === 'draft' && (
                      <Button
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSendBatch(batch.id);
                        }}
                      >
                        <Send className="h-3 w-3" /> Envoyer
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(detailBatch)}
        onClose={() => setDetailId(null)}
        title={detailBatch ? `Lot ${detailBatch.reference}` : 'Lot'}
      >
        {detailBatch && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Mutuelle</p>
                <p className="font-semibold">{detailBatch.mutuelle}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Factures</p>
                <p className="font-semibold">{detailBatch.invoiceCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Montant</p>
                <p className="font-semibold">EUR {detailBatch.totalAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Statut</p>
                <p className="font-semibold">{statusConfig[detailBatch.status].label}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p><span className="text-[var(--text-muted)]">Date lot:</span> {detailBatch.date}</p>
              <p><span className="text-[var(--text-muted)]">Envoi:</span> {detailBatch.sentAt ?? 'Non envoye'}</p>
              <p><span className="text-[var(--text-muted)]">Reponse:</span> {detailBatch.responseAt ?? 'En attente'}</p>
            </div>

            {(() => {
              const compliance = getBatchCompliance(detailBatch.id);

              return (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Controle INAMI / MyCareNet</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {[compliance.approvedPackage, compliance.instructionSync, compliance.identityCoverage, compliance.prescriptionArchive, compliance.medadmin, compliance.patientJustificatif].map((entry) => (
                      <div key={`${detailBatch.id}-${entry.label}`} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                        <Badge variant={getComplianceVariant(entry.state)}>{entry.label}</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Les attestations papier et les prescriptions ne partent pas dans le lot tiers payant; les prescriptions restent archivees dans le dossier infirmier.
                  </p>
                </div>
              );
            })()}

            {detailBatch.rejectReasons && detailBatch.rejectReasons.length > 0 && (
              <div className="p-3 rounded-xl bg-mc-red-500/10">
                <p className="text-[10px] uppercase tracking-wide text-mc-red-500 mb-2">Motifs de rejet</p>
                {detailBatch.rejectReasons.map((reason) => (
                  <p key={reason} className="text-sm text-mc-red-600">{reason}</p>
                ))}
              </div>
            )}

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
