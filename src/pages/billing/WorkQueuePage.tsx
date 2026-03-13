import { useState } from 'react';
import { AlertTriangle, CheckCheck, CheckCircle, Clock, FileText, Search, Send, Square, SquareCheck, Zap } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader, Input } from '@/design-system';
import {
  getComplianceVariant,
  getQueueCompliance,
  getQueueComplianceBlockers,
  getQueueComplianceWarnings,
} from '@/lib/inamiBillingCompliance';

type QueueStatus = 'pending' | 'validated' | 'error';

interface QueueItem {
  id: string;
  nurse: string;
  patient: string;
  date: string;
  acts: number;
  totalW: number;
  amount: number;
  status: QueueStatus;
  error?: string;
}

const seedQueue: QueueItem[] = [
  { id: 'q1', nurse: 'Marie Laurent', patient: 'Dubois Marie', date: '06/03/2026', acts: 3, totalW: 11.83, amount: 85.77, status: 'pending' },
  { id: 'q2', nurse: 'Marie Laurent', patient: 'Janssen Pierre', date: '06/03/2026', acts: 4, totalW: 14.4, amount: 104.4, status: 'pending' },
  { id: 'q3', nurse: 'Sophie Dupuis', patient: 'Lambert Jeanne', date: '06/03/2026', acts: 2, totalW: 8.23, amount: 59.67, status: 'validated' },
  { id: 'q4', nurse: 'Thomas Maes', patient: 'Willems Andre', date: '05/03/2026', acts: 3, totalW: 10.8, amount: 78.3, status: 'validated' },
  { id: 'q5', nurse: 'Sophie Dupuis', patient: 'Martin Claudine', date: '05/03/2026', acts: 2, totalW: 5.6, amount: 40.6, status: 'error', error: 'Cumul interdit 425110+425132' },
  { id: 'q6', nurse: 'Laura Van Damme', patient: 'Peeters Henri', date: '05/03/2026', acts: 5, totalW: 18.5, amount: 134.13, status: 'pending' },
  { id: 'q7', nurse: 'Marie Laurent', patient: 'Van den Berg Luc', date: '06/03/2026', acts: 2, totalW: 6.6, amount: 47.86, status: 'pending' },
  { id: 'q8', nurse: 'Thomas Maes', patient: 'Claessens Robert', date: '06/03/2026', acts: 3, totalW: 9.9, amount: 71.8, status: 'validated' },
  { id: 'q9', nurse: 'Thomas Maes', patient: 'De Smet Anna', date: '06/03/2026', acts: 4, totalW: 12.2, amount: 88.45, status: 'pending' },
];

export function WorkQueuePage() {
  const [queueItems, setQueueItems] = useState(seedQueue);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoValidation, setAutoValidation] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = queueItems.filter(
    (item) =>
      (filter === 'all' || item.status === filter) &&
      (!search || item.patient.toLowerCase().includes(search.toLowerCase()) || item.nurse.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingCount = queueItems.filter((item) => item.status === 'pending').length;
  const totalPending = queueItems.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
  const pendingItems = filtered.filter((item) => item.status === 'pending');
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every((item) => selected.has(item.id));
  const readyForBatchCount = queueItems.filter((item) => item.status === 'validated').length;
  const blockedPendingCount = queueItems.filter((item) => item.status === 'pending' && getQueueComplianceBlockers(getQueueCompliance(item.id)).length > 0).length;
  const warningPendingCount = queueItems.filter((item) => item.status === 'pending' && getQueueComplianceWarnings(getQueueCompliance(item.id)).length > 0).length;

  const dates = [...new Set(queueItems.map((item) => item.date))];
  const dailyTotals = dates.map((date) => ({
    date,
    count: queueItems.filter((item) => item.date === date).length,
    amount: queueItems.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0),
  }));

  function toggleSelect(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllPending() {
    if (allPendingSelected) {
      setSelected(new Set());
      return;
    }

    setSelected(new Set(pendingItems.map((item) => item.id)));
  }

  function handleValidateSelected() {
    const selectedPending = queueItems.filter((item) => selected.has(item.id) && item.status === 'pending');
    if (selectedPending.length === 0) {
      setFeedback('Aucune prestation en attente selectionnee.');
      return;
    }

    const validatableIds = selectedPending
      .filter((item) => getQueueComplianceBlockers(getQueueCompliance(item.id)).length === 0)
      .map((item) => item.id);
    const blockedCount = selectedPending.length - validatableIds.length;

    if (validatableIds.length === 0) {
      setFeedback('Aucune prestation conforme aux prerequis INAMI/MyCareNet.');
      return;
    }

    setQueueItems((previous) =>
      previous.map((item) => (
        validatableIds.includes(item.id) && item.status === 'pending'
          ? { ...item, status: 'validated' as const }
          : item
      ))
    );
    setSelected(new Set());
    setFeedback(
      `${validatableIds.length} prestation(s) validee(s) pour le prochain lot.` +
      (blockedCount > 0 ? ` ${blockedCount} dossier(s) reste(nt) bloques par les prerequis INAMI.` : '')
    );
  }

  function handleSendSelected() {
    const selectedPending = queueItems.filter((item) => selected.has(item.id) && item.status === 'pending');
    if (selectedPending.length === 0) {
      setFeedback('Selectionnez des prestations avant envoi.');
      return;
    }

    const validatableIds = selectedPending
      .filter((item) => getQueueComplianceBlockers(getQueueCompliance(item.id)).length === 0)
      .map((item) => item.id);
    const blockedCount = selectedPending.length - validatableIds.length;

    if (validatableIds.length === 0) {
      setFeedback('Le lot ne peut pas etre prepare tant que les prerequis INAMI restent ouverts.');
      return;
    }

    setQueueItems((previous) =>
      previous.map((item) => (
        validatableIds.includes(item.id) && item.status === 'pending'
          ? { ...item, status: 'validated' as const }
          : item
      ))
    );
    setSelected(new Set());
    setFeedback(
      `Lot eFact prepare avec ${validatableIds.length} prestation(s).` +
      (blockedCount > 0 ? ` ${blockedCount} dossier(s) restent en correction.` : '')
    );
  }

  function handlePrepareEFact() {
    if (readyForBatchCount === 0) {
      setFeedback('Aucune prestation validee a envoyer.');
      return;
    }

    setFeedback(`Lot eFact pret avec ${readyForBatchCount} prestation(s) validees.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<FileText className="h-5 w-5" />}
        title="File de travail"
        subtitle="Bureau de tarification"
        badge={
          <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={handlePrepareEFact}>
            <Send className="h-3.5 w-3.5" />
            Envoyer eFact
          </Button>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{pendingCount}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">EUR {totalPending.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Montant</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{queueItems.filter((item) => item.status === 'error').length}</p>
            <p className="text-[10px] text-white/60">Erreurs</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCheck className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {dailyTotals.map((day) => (
          <Card key={day.date} className="text-center">
            <p className="text-xs text-[var(--text-muted)]">{day.date}</p>
            <p className="text-lg font-bold">EUR {day.amount.toFixed(0)}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{day.count} prestations</p>
          </Card>
        ))}
      </div>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Controle INAMI / MyCareNet avant lot</p>
            <p className="text-xs text-[var(--text-muted)]">
              MyCareNet uniquement, identite tracee, MemberData suivi, Medadmin/eAgreement present, prescription archivee 5 ans et justificatif patient dans les 28 jours.
            </p>
          </div>
          <Badge variant={blockedPendingCount > 0 ? 'amber' : 'green'}>
            {blockedPendingCount > 0 ? `${blockedPendingCount} bloque(s)` : 'Conforme'}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <p className="font-bold text-mc-green-500">{readyForBatchCount}</p>
            <p className="text-[var(--text-muted)]">Prets</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <p className="font-bold text-mc-amber-500">{warningPendingCount}</p>
            <p className="text-[var(--text-muted)]">A surveiller</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <p className="font-bold text-mc-red-500">{blockedPendingCount}</p>
            <p className="text-[var(--text-muted)]">Bloques</p>
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${autoValidation ? 'text-mc-green-500' : 'text-[var(--text-muted)]'}`} />
          <div>
            <p className="text-sm font-medium">Auto-validation</p>
            <p className="text-[10px] text-[var(--text-muted)]">Valider automatiquement les prestations conformes</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAutoValidation(!autoValidation)}
          className={`w-11 h-6 rounded-full transition-colors ${autoValidation ? 'bg-mc-green-500' : 'bg-[var(--bg-secondary)]'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${autoValidation ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </button>
      </Card>

      <div className="flex gap-2">
        <Input placeholder="Rechercher..." icon={<Search className="h-4 w-4" />} value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1" />
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'pending', label: 'En attente' },
            { value: 'validated', label: 'Valides' },
            { value: 'error', label: 'Erreurs' },
          ].map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => setFilter(entry.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filter === entry.value ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCheck className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{selected.size} selectionne(s)</span>
          <div className="ml-auto flex gap-2">
            <Button variant="primary" size="sm" onClick={handleValidateSelected}>
              <CheckCircle className="h-3 w-3" /> Valider tout
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendSelected}>
              <Send className="h-3 w-3" /> Envoyer
            </Button>
          </div>
        </div>
      )}

      {pendingItems.length > 0 && (
        <button type="button" onClick={selectAllPending} className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-mc-blue-500 transition-colors">
          {allPendingSelected ? <SquareCheck className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {allPendingSelected ? 'Tout deselectionner' : `Selectionner tous les en attente (${pendingItems.length})`}
        </button>
      )}

      <div className="space-y-2">
        {filtered.map((item) => {
          const compliance = getQueueCompliance(item.id);
          const blockers = getQueueComplianceBlockers(compliance);
          const warnings = getQueueComplianceWarnings(compliance);

          return (
            <Card key={item.id} hover padding="sm" className="cursor-pointer">
              <div className="flex items-center gap-3">
                {item.status === 'pending' && (
                  <button type="button" onClick={(event) => { event.stopPropagation(); toggleSelect(item.id); }} className="shrink-0">
                    {selected.has(item.id) ? <SquareCheck className="h-5 w-5 text-mc-blue-500" /> : <Square className="h-5 w-5 text-[var(--text-muted)]" />}
                  </button>
                )}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'error' ? 'bg-mc-red-50 dark:bg-red-900/30' : item.status === 'validated' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' : blockers.length > 0 ? 'bg-mc-red-50 dark:bg-red-900/30' : 'bg-mc-amber-50 dark:bg-amber-900/30'}`}>
                  {item.status === 'error' || blockers.length > 0 ? <AlertTriangle className="h-5 w-5 text-mc-red-500" /> : item.status === 'validated' ? <CheckCircle className="h-5 w-5 text-mc-green-500" /> : <Clock className="h-5 w-5 text-mc-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{item.patient}</p>
                    <Badge variant={item.status === 'error' ? 'red' : item.status === 'validated' ? 'green' : blockers.length > 0 ? 'red' : 'amber'}>
                      {item.status === 'error' ? 'Erreur' : item.status === 'validated' ? 'Valide' : blockers.length > 0 ? 'Bloque INAMI' : 'En attente'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{item.nurse} - {item.date} - {item.acts} actes - {item.totalW.toFixed(1)}W</p>
                  {item.error && <p className="text-xs text-mc-red-500 mt-0.5">{item.error}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[compliance.identity, compliance.memberData, compliance.medadmin, compliance.prescriptionArchive, compliance.patientJustificatif]
                      .filter((entry) => entry.state !== 'ready')
                      .map((entry) => (
                        <Badge key={`${item.id}-${entry.label}`} variant={getComplianceVariant(entry.state)}>
                          {entry.label}
                        </Badge>
                      ))}
                  </div>
                  {warnings.length > 0 && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                      {warnings[0]}
                    </p>
                  )}
                </div>
                <p className="text-sm font-bold shrink-0">EUR {item.amount.toFixed(2)}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
