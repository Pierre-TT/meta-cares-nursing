import { useState } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, Search, Sparkles, TrendingUp } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader, Input } from '@/design-system';

interface Rejection {
  id: string;
  patient: string;
  nurse: string;
  date: string;
  code: string;
  reason: string;
  amount: number;
  status: 'open' | 'corrected' | 'abandoned';
  aiSuggestion?: string;
  aiConfidence?: number;
}

const seedRejections: Rejection[] = [
  { id: 'r1', patient: 'Martin Claudine', nurse: 'Sophie Dupuis', date: '04/03/2026', code: '425110', reason: 'Cumul non autorise - Code 425110 + 425132 le meme jour', amount: 37.29, status: 'open', aiSuggestion: 'Remplacer 425110 par 425154 (soins hygiene specifiques) - cumul autorise avec 425132', aiConfidence: 92 },
  { id: 'r2', patient: 'Peeters Henri', nurse: 'Laura Van Damme', date: '03/03/2026', code: '425375', reason: 'Prescription manquante pour injection', amount: 22.37, status: 'open', aiSuggestion: 'Demander la prescription au medecin traitant Dr. Janssens et rattacher au dossier', aiConfidence: 88 },
  { id: 'r3', patient: 'Dubois Marie', nurse: 'Marie Laurent', date: '28/02/2026', code: '425611', reason: 'Pansement complexe: accord prealable requis', amount: 37.29, status: 'corrected' },
  { id: 'r4', patient: 'Janssen Pierre', nurse: 'Marie Laurent', date: '25/02/2026', code: '425434', reason: 'Double facturation meme journee', amount: 26.1, status: 'corrected' },
  { id: 'r5', patient: 'Lambert Jeanne', nurse: 'Thomas Maes', date: '22/02/2026', code: '425110', reason: 'Patient non assure a la date de prestation', amount: 37.29, status: 'abandoned' },
];

const rejectPatterns = [
  { reason: 'Cumul non autorise', count: 12, pct: 38, trend: 'up' as const },
  { reason: 'Prescription manquante', count: 8, pct: 25, trend: 'stable' as const },
  { reason: 'Double facturation', count: 6, pct: 19, trend: 'down' as const },
  { reason: 'Accord prealable requis', count: 4, pct: 13, trend: 'stable' as const },
  { reason: 'Patient non assure', count: 2, pct: 5, trend: 'down' as const },
];

export function RejectionsPage() {
  const [rejections, setRejections] = useState(seedRejections);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = rejections.filter((rejection) => {
    if (filter !== 'all' && rejection.status !== filter) return false;
    if (search && !rejection.patient.toLowerCase().includes(search.toLowerCase()) && !rejection.nurse.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const openCount = rejections.filter((rejection) => rejection.status === 'open').length;
  const totalLoss = rejections.filter((rejection) => rejection.status === 'open').reduce((sum, rejection) => sum + rejection.amount, 0);

  function handleApplySuggestion(rejectionId: string) {
    const rejection = rejections.find((item) => item.id === rejectionId);
    if (!rejection) return;

    setRejections((previous) =>
      previous.map((item) =>
        item.id === rejectionId
          ? { ...item, status: 'corrected', aiSuggestion: undefined, aiConfidence: undefined }
          : item
      )
    );
    setFeedback(`Correction appliquee pour ${rejection.patient}.`);
  }

  function handleIgnoreSuggestion(rejectionId: string) {
    const rejection = rejections.find((item) => item.id === rejectionId);
    if (!rejection) return;

    setRejections((previous) =>
      previous.map((item) =>
        item.id === rejectionId ? { ...item, aiSuggestion: undefined, aiConfidence: undefined } : item
      )
    );
    setFeedback(`Suggestion ignoree pour ${rejection.patient}.`);
  }

  function handleManualCorrection(rejectionId: string) {
    const rejection = rejections.find((item) => item.id === rejectionId);
    if (!rejection) return;

    setRejections((previous) =>
      previous.map((item) => (item.id === rejectionId ? { ...item, status: 'corrected' } : item))
    );
    setFeedback(`Correction manuelle preparee pour ${rejection.patient}.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Rejets eFact"
        subtitle={`${openCount} rejets a traiter`}
        badge={<Badge variant="red">{`EUR ${totalLoss.toFixed(0)} en suspens`}</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{openCount}</p>
            <p className="text-[10px] text-white/60">A traiter</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{rejections.filter((rejection) => rejection.status === 'corrected').length}</p>
            <p className="text-[10px] text-white/60">Corriges</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{rejections.length}</p>
            <p className="text-[10px] text-white/60">Total</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-mc-blue-500" />
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Analyse des rejets (90 jours)</p>
        </div>
        <div className="space-y-2">
          {rejectPatterns.map((pattern) => (
            <div key={pattern.reason} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium">{pattern.reason}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{pattern.count} ({pattern.pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className={`h-full rounded-full ${pattern.trend === 'up' ? 'bg-mc-red-500' : pattern.trend === 'down' ? 'bg-mc-green-500' : 'bg-mc-amber-500'}`} style={{ width: `${pattern.pct}%` }} />
                </div>
              </div>
              <span className={`text-[10px] font-medium ${pattern.trend === 'up' ? 'text-mc-red-500' : pattern.trend === 'down' ? 'text-mc-green-500' : 'text-[var(--text-muted)]'}`}>
                {pattern.trend === 'up' ? 'up' : pattern.trend === 'down' ? 'down' : 'stable'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Input placeholder="Rechercher..." icon={<Search className="h-4 w-4" />} value={search} onChange={(event) => setSearch(event.target.value)} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: 'all', label: 'Tous' },
          { value: 'open', label: `A traiter (${openCount})` },
          { value: 'corrected', label: 'Corriges' },
          { value: 'abandoned', label: 'Abandonnes' },
        ].map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => setFilter(entry.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === entry.value ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((rejection) => (
          <Card key={rejection.id} hover padding="sm" className="cursor-pointer">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${rejection.status === 'open' ? 'bg-mc-red-50 dark:bg-red-900/30' : rejection.status === 'corrected' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' : 'bg-[var(--bg-tertiary)]'}`}>
                {rejection.status === 'open' ? <AlertTriangle className="h-5 w-5 text-mc-red-500" /> : rejection.status === 'corrected' ? <CheckCircle className="h-5 w-5 text-mc-green-500" /> : <RotateCcw className="h-5 w-5 text-[var(--text-muted)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{rejection.patient}</p>
                  <Badge variant={rejection.status === 'open' ? 'red' : rejection.status === 'corrected' ? 'green' : 'outline'}>
                    {rejection.status === 'open' ? 'A traiter' : rejection.status === 'corrected' ? 'Corrige' : 'Abandonne'}
                  </Badge>
                </div>
                <p className="text-xs text-mc-red-500 mt-0.5">{rejection.reason}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{rejection.nurse} - {rejection.date} - Code {rejection.code}</p>

                {rejection.aiSuggestion && rejection.status === 'open' && (
                  <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-[#47B6FF]/5 to-[#4ABD33]/5 border border-[#47B6FF]/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3 w-3 text-mc-blue-500" />
                      <span className="text-[10px] font-semibold text-mc-blue-500">Suggestion IA</span>
                      {rejection.aiConfidence && <Badge variant="blue">{rejection.aiConfidence}%</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{rejection.aiSuggestion}</p>
                    <div className="flex gap-2 mt-1.5">
                      <Button variant="primary" size="sm" onClick={() => handleApplySuggestion(rejection.id)}>
                        Appliquer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleIgnoreSuggestion(rejection.id)}>
                        Ignorer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">EUR {rejection.amount.toFixed(2)}</p>
                {rejection.status === 'open' && !rejection.aiSuggestion && (
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => handleManualCorrection(rejection.id)}>
                    <RotateCcw className="h-3 w-3" />Corriger
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
