import { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Send, Search, FileText, Zap, CheckCheck, SquareCheck, Square } from 'lucide-react';
import { Card, Badge, Button, Input, AnimatedPage, GradientHeader } from '@/design-system';

const mockQueue = [
  { id: 'q1', nurse: 'Marie Laurent', patient: 'Dubois Marie', date: '06/03/2026', acts: 3, totalW: 11.83, amount: 85.77, status: 'pending' as const },
  { id: 'q2', nurse: 'Marie Laurent', patient: 'Janssen Pierre', date: '06/03/2026', acts: 4, totalW: 14.40, amount: 104.40, status: 'pending' as const },
  { id: 'q3', nurse: 'Sophie Dupuis', patient: 'Lambert Jeanne', date: '06/03/2026', acts: 2, totalW: 8.23, amount: 59.67, status: 'validated' as const },
  { id: 'q4', nurse: 'Thomas Maes', patient: 'Willems André', date: '05/03/2026', acts: 3, totalW: 10.80, amount: 78.30, status: 'validated' as const },
  { id: 'q5', nurse: 'Sophie Dupuis', patient: 'Martin Claudine', date: '05/03/2026', acts: 2, totalW: 5.60, amount: 40.60, status: 'error' as const, error: 'Cumul interdit 425110+425132' },
  { id: 'q6', nurse: 'Laura Van Damme', patient: 'Peeters Henri', date: '05/03/2026', acts: 5, totalW: 18.50, amount: 134.13, status: 'pending' as const },
  { id: 'q7', nurse: 'Marie Laurent', patient: 'Van den Berg Luc', date: '06/03/2026', acts: 2, totalW: 6.60, amount: 47.86, status: 'pending' as const },
  { id: 'q8', nurse: 'Thomas Maes', patient: 'Claessens Robert', date: '06/03/2026', acts: 3, totalW: 9.90, amount: 71.80, status: 'validated' as const },
];

export function WorkQueuePage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoValidation, setAutoValidation] = useState(false);

  const filtered = mockQueue.filter(i =>
    (filter === 'all' || i.status === filter) &&
    (!search || i.patient.toLowerCase().includes(search.toLowerCase()) || i.nurse.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingCount = mockQueue.filter(i => i.status === 'pending').length;
  const totalPending = mockQueue.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const pendingItems = filtered.filter(i => i.status === 'pending');
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every(i => selected.has(i.id));

  // Daily totals
  const dates = [...new Set(mockQueue.map(i => i.date))];
  const dailyTotals = dates.map(d => ({
    date: d,
    count: mockQueue.filter(i => i.date === d).length,
    amount: mockQueue.filter(i => i.date === d).reduce((s, i) => s + i.amount, 0),
  }));

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }
  function selectAllPending() {
    if (allPendingSelected) setSelected(new Set());
    else setSelected(new Set(pendingItems.map(i => i.id)));
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<FileText className="h-5 w-5" />}
        title="File de travail"
        subtitle="Bureau de tarification"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"><Send className="h-3.5 w-3.5" />Envoyer eFact</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{pendingCount}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{totalPending.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Montant</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mockQueue.filter(i => i.status === 'error').length}</p>
            <p className="text-[10px] text-white/60">Erreurs</p>
          </div>
        </div>
      </GradientHeader>

      {/* Daily totals */}
      <div className="grid grid-cols-2 gap-3">
        {dailyTotals.map(d => (
          <Card key={d.date} className="text-center">
            <p className="text-xs text-[var(--text-muted)]">{d.date}</p>
            <p className="text-lg font-bold">€{d.amount.toFixed(0)}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{d.count} prestations</p>
          </Card>
        ))}
      </div>

      {/* Auto-validation toggle */}
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${autoValidation ? 'text-mc-green-500' : 'text-[var(--text-muted)]'}`} />
          <div>
            <p className="text-sm font-medium">Auto-validation</p>
            <p className="text-[10px] text-[var(--text-muted)]">Valider automatiquement les prestations conformes</p>
          </div>
        </div>
        <button
          onClick={() => setAutoValidation(!autoValidation)}
          className={`w-11 h-6 rounded-full transition-colors ${autoValidation ? 'bg-mc-green-500' : 'bg-[var(--bg-secondary)]'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${autoValidation ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </button>
      </Card>

      <div className="flex gap-2">
        <Input placeholder="Rechercher..." icon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <div className="flex gap-1">
          {[{ v: 'all', l: 'Tous' }, { v: 'pending', l: 'En attente' }, { v: 'validated', l: 'Validés' }, { v: 'error', l: 'Erreurs' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filter === f.v ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >{f.l}</button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCheck className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{selected.size} sélectionné(s)</span>
          <div className="ml-auto flex gap-2">
            <Button variant="primary" size="sm"><CheckCircle className="h-3 w-3" /> Valider tout</Button>
            <Button variant="outline" size="sm"><Send className="h-3 w-3" /> Envoyer</Button>
          </div>
        </div>
      )}

      {/* Select all pending */}
      {pendingItems.length > 0 && (
        <button onClick={selectAllPending} className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-mc-blue-500 transition-colors">
          {allPendingSelected ? <SquareCheck className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {allPendingSelected ? 'Tout désélectionner' : `Sélectionner tous les en attente (${pendingItems.length})`}
        </button>
      )}

      <div className="space-y-2">
        {filtered.map(item => (
          <Card key={item.id} hover padding="sm" className="cursor-pointer">
            <div className="flex items-center gap-3">
              {item.status === 'pending' && (
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="shrink-0">
                  {selected.has(item.id)
                    ? <SquareCheck className="h-5 w-5 text-mc-blue-500" />
                    : <Square className="h-5 w-5 text-[var(--text-muted)]" />
                  }
                </button>
              )}
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                item.status === 'error' ? 'bg-mc-red-50 dark:bg-red-900/30' :
                item.status === 'validated' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' :
                'bg-mc-amber-50 dark:bg-amber-900/30'
              }`}>
                {item.status === 'error' ? <AlertTriangle className="h-5 w-5 text-mc-red-500" /> :
                 item.status === 'validated' ? <CheckCircle className="h-5 w-5 text-mc-green-500" /> :
                 <Clock className="h-5 w-5 text-mc-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{item.patient}</p>
                  <Badge variant={item.status === 'error' ? 'red' : item.status === 'validated' ? 'green' : 'amber'}>
                    {item.status === 'error' ? 'Erreur' : item.status === 'validated' ? 'Validé' : 'En attente'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{item.nurse} • {item.date} • {item.acts} actes • {item.totalW.toFixed(1)}W</p>
                {item.error && <p className="text-xs text-mc-red-500 mt-0.5">{item.error}</p>}
              </div>
              <p className="text-sm font-bold shrink-0">€{item.amount.toFixed(2)}</p>
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
