import { useState } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, Sparkles, TrendingUp, Search } from 'lucide-react';
import { Card, Badge, Button, Input, AnimatedPage, GradientHeader } from '@/design-system';

interface Rejection {
  id: string; patient: string; nurse: string; date: string; code: string; reason: string; amount: number;
  status: 'open' | 'corrected' | 'abandoned';
  aiSuggestion?: string;
  aiConfidence?: number;
}

const mockRejections: Rejection[] = [
  { id: 'r1', patient: 'Martin Claudine', nurse: 'Sophie Dupuis', date: '04/03/2026', code: '425110', reason: 'Cumul non autorisé — Code 425110 + 425132 le même jour', amount: 37.29, status: 'open', aiSuggestion: 'Remplacer 425110 par 425154 (soins hygiène spécifiques) — cumul autorisé avec 425132', aiConfidence: 92 },
  { id: 'r2', patient: 'Peeters Henri', nurse: 'Laura Van Damme', date: '03/03/2026', code: '425375', reason: 'Prescription manquante pour injection', amount: 22.37, status: 'open', aiSuggestion: 'Demander la prescription au médecin traitant Dr. Janssens et rattacher au dossier', aiConfidence: 88 },
  { id: 'r3', patient: 'Dubois Marie', nurse: 'Marie Laurent', date: '28/02/2026', code: '425611', reason: 'Pansement complexe: accord préalable requis', amount: 37.29, status: 'corrected' },
  { id: 'r4', patient: 'Janssen Pierre', nurse: 'Marie Laurent', date: '25/02/2026', code: '425434', reason: 'Double facturation même journée', amount: 26.10, status: 'corrected' },
  { id: 'r5', patient: 'Lambert Jeanne', nurse: 'Thomas Maes', date: '22/02/2026', code: '425110', reason: 'Patient non assuré à la date de prestation', amount: 37.29, status: 'abandoned' },
];

// Pattern analysis
const rejectPatterns = [
  { reason: 'Cumul non autorisé', count: 12, pct: 38, trend: 'up' as const },
  { reason: 'Prescription manquante', count: 8, pct: 25, trend: 'stable' as const },
  { reason: 'Double facturation', count: 6, pct: 19, trend: 'down' as const },
  { reason: 'Accord préalable requis', count: 4, pct: 13, trend: 'stable' as const },
  { reason: 'Patient non assuré', count: 2, pct: 5, trend: 'down' as const },
];

export function RejectionsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = mockRejections.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.patient.toLowerCase().includes(search.toLowerCase()) && !r.nurse.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const openCount = mockRejections.filter(r => r.status === 'open').length;
  const totalLoss = mockRejections.filter(r => r.status === 'open').reduce((s, r) => s + r.amount, 0);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Rejets eFact"
        subtitle={`${openCount} rejets à traiter`}
        badge={<Badge variant="red">{`€${totalLoss.toFixed(0)} en suspens`}</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{openCount}</p>
            <p className="text-[10px] text-white/60">À traiter</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mockRejections.filter(r => r.status === 'corrected').length}</p>
            <p className="text-[10px] text-white/60">Corrigés</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mockRejections.length}</p>
            <p className="text-[10px] text-white/60">Total</p>
          </div>
        </div>
      </GradientHeader>

      {/* Pattern analysis card */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-mc-blue-500" />
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Analyse des rejets (90 jours)</p>
        </div>
        <div className="space-y-2">
          {rejectPatterns.map(p => (
            <div key={p.reason} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium">{p.reason}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{p.count} ({p.pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className={`h-full rounded-full ${p.trend === 'up' ? 'bg-mc-red-500' : p.trend === 'down' ? 'bg-mc-green-500' : 'bg-mc-amber-500'}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
              <span className={`text-[10px] font-medium ${p.trend === 'up' ? 'text-mc-red-500' : p.trend === 'down' ? 'text-mc-green-500' : 'text-[var(--text-muted)]'}`}>
                {p.trend === 'up' ? '↑' : p.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Input placeholder="Rechercher..." icon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ v: 'all', l: 'Tous' }, { v: 'open', l: `À traiter (${openCount})` }, { v: 'corrected', l: 'Corrigés' }, { v: 'abandoned', l: 'Abandonnés' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === f.v ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          >{f.l}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(rej => (
          <Card key={rej.id} hover padding="sm" className="cursor-pointer">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                rej.status === 'open' ? 'bg-mc-red-50 dark:bg-red-900/30' :
                rej.status === 'corrected' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' :
                'bg-[var(--bg-tertiary)]'
              }`}>
                {rej.status === 'open' ? <AlertTriangle className="h-5 w-5 text-mc-red-500" /> :
                 rej.status === 'corrected' ? <CheckCircle className="h-5 w-5 text-mc-green-500" /> :
                 <RotateCcw className="h-5 w-5 text-[var(--text-muted)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{rej.patient}</p>
                  <Badge variant={rej.status === 'open' ? 'red' : rej.status === 'corrected' ? 'green' : 'outline'}>
                    {rej.status === 'open' ? 'À traiter' : rej.status === 'corrected' ? 'Corrigé' : 'Abandonné'}
                  </Badge>
                </div>
                <p className="text-xs text-mc-red-500 mt-0.5">{rej.reason}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{rej.nurse} • {rej.date} • Code {rej.code}</p>

                {/* AI suggestion */}
                {rej.aiSuggestion && rej.status === 'open' && (
                  <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-[#47B6FF]/5 to-[#4ABD33]/5 border border-[#47B6FF]/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3 w-3 text-mc-blue-500" />
                      <span className="text-[10px] font-semibold text-mc-blue-500">Suggestion IA</span>
                      {rej.aiConfidence && <Badge variant="blue">{rej.aiConfidence}%</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{rej.aiSuggestion}</p>
                    <div className="flex gap-2 mt-1.5">
                      <Button variant="primary" size="sm">Appliquer</Button>
                      <Button variant="ghost" size="sm">Ignorer</Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">€{rej.amount.toFixed(2)}</p>
                {rej.status === 'open' && !rej.aiSuggestion && (
                  <Button variant="outline" size="sm" className="mt-1"><RotateCcw className="h-3 w-3" />Corriger</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
