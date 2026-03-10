import { useMemo, useState } from 'react';
import { Search, Edit3, RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Badge, Button, Card, Input, AnimatedPage, GradientHeader, Modal, Tabs } from '@/design-system';

const currentWValue = 7.2511;

const codes = [
  { code: '425110', label: 'Toilette complete', valueW: 1.657, article: 'Art.8 §1', category: 'hygiene', delta: '+0.018W', state: 'changed' as const, cumul: ['425375', '425596'] },
  { code: '425132', label: 'Toilette partielle', valueW: 0.829, article: 'Art.8 §1', category: 'hygiene', delta: '+0.011W', state: 'changed' as const, cumul: ['425434'] },
  { code: '425375', label: 'Injection SC/IM', valueW: 0.829, article: 'Art.8 §1', category: 'technique', delta: 'stable', state: 'synced' as const, cumul: ['425110', '425132'] },
  { code: '425596', label: 'Pansement simple', valueW: 0.829, article: 'Art.8 §1', category: 'wound', delta: 'stable', state: 'synced' as const, cumul: ['425110'] },
  { code: '425611', label: 'Pansement complexe', valueW: 1.657, article: 'Art.8 §1', category: 'wound', delta: 'nouveau libelle', state: 'new' as const, cumul: [] },
  { code: '425434', label: 'Preparation medicaments', valueW: 0.496, article: 'Art.8 §1', category: 'meds', delta: 'stable', state: 'synced' as const, cumul: ['425110', '425132'] },
  { code: '425692', label: 'Consultation infirmiere', valueW: 0.829, article: 'Art.8 §1', category: 'consult', delta: '+0.005W', state: 'changed' as const, cumul: [] },
];

export function NomenclaturePage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [reviewCode, setReviewCode] = useState<typeof codes[number] | null>(null);

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Tous', count: codes.length },
      { id: 'hygiene', label: 'Hygiene', count: codes.filter((code) => code.category === 'hygiene').length },
      { id: 'wound', label: 'Plaies', count: codes.filter((code) => code.category === 'wound').length },
      { id: 'meds', label: 'Medicaments', count: codes.filter((code) => code.category === 'meds').length },
      { id: 'consult', label: 'Consult.', count: codes.filter((code) => code.category === 'consult').length },
    ],
    []
  );

  const changedCodes = codes.filter((code) => code.state !== 'synced');
  const filtered = codes.filter((code) => {
    if (activeTab !== 'all' && code.category !== activeTab) return false;
    if (search && !code.code.includes(search) && !code.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Edit3 className="h-5 w-5" />}
        title="Gouvernance nomenclature"
        subtitle="Suivi INAMI Art.8, valeurs W et changements"
        badge={
          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={() => setFeedback('Synchronisation INAMI simulee. Les deltas restent a confirmer.')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync INAMI
          </Button>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{codes.length}</p>
            <p className="text-[10px] text-white/60">Codes suivis</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{currentWValue}</p>
            <p className="text-[10px] text-white/60">Valeur W</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{changedCodes.length}</p>
            <p className="text-[10px] text-white/60">Deltas</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <RefreshCw className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">3 changements a valider</p>
            <p className="text-xs text-[var(--text-muted)]">
              Une variation de valeur W et un changement de libelle ont ete detectes depuis la derniere revue du 4 mars 2026.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setComparisonOpen(true)}>
            Comparer
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-blue-500">06/03</p>
          <p className="text-[10px] text-[var(--text-muted)]">Derniere sync</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">4</p>
          <p className="text-[10px] text-[var(--text-muted)]">Categories</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-amber-500">2</p>
          <p className="text-[10px] text-[var(--text-muted)]">Revues ouvertes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-red-500">1</p>
          <p className="text-[10px] text-[var(--text-muted)]">Conflit cumul</p>
        </Card>
      </div>

      <Input
        placeholder="Rechercher code ou libelle..."
        icon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-2">
        {filtered.map((code) => (
          <Card key={code.code} hover>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-mc-blue-50 dark:bg-mc-blue-900/30 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold font-mono text-mc-blue-500">{code.valueW.toFixed(3)}</span>
                <span className="text-[9px] text-[var(--text-muted)]">W</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{code.label}</p>
                  <Badge variant="outline">{code.article}</Badge>
                  <Badge variant={code.state === 'synced' ? 'green' : code.state === 'changed' ? 'amber' : 'blue'}>
                    {code.state === 'synced' ? 'Synced' : code.state === 'changed' ? 'Modifie' : 'Nouveau'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">Code {code.code} · Categorie {code.category}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium ${code.delta === 'stable' ? 'text-mc-green-500' : code.state === 'new' ? 'text-mc-blue-500' : 'text-mc-amber-500'}`}>
                    {code.delta}
                  </span>
                  {code.cumul.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)]">Cumuls: {code.cumul.join(', ')}</span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReviewCode(code)}>
                <ArrowUpRight className="h-3 w-3" />
                Revoir
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={comparisonOpen} onClose={() => setComparisonOpen(false)} title="Comparatif INAMI">
        <div className="space-y-4">
          <div className="space-y-3">
            {changedCodes.map((code) => (
              <div key={code.code} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{code.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">Code {code.code} · {code.article}</p>
                  </div>
                  <Badge variant={code.state === 'new' ? 'blue' : 'amber'}>{code.delta}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setComparisonOpen(false)}>Fermer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(reviewCode)} onClose={() => setReviewCode(null)} title={reviewCode ? `Revue ${reviewCode.code}` : 'Revue'}>
        {reviewCode && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
              <p className="text-sm font-medium">{reviewCode.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{reviewCode.article} · Valeur {reviewCode.valueW.toFixed(3)}W</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm">Delta detecte: {reviewCode.delta}</p>
              <p className="text-sm">Cumuls surveilles: {reviewCode.cumul.length > 0 ? reviewCode.cumul.join(', ') : 'Aucun'}</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewCode(null)}>
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setFeedback(`Revue preparee pour ${reviewCode.code}.`);
                  setReviewCode(null);
                }}
              >
                Marquer pret
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}
