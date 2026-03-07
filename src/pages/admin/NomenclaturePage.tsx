import { useState } from 'react';
import { Search, Edit3, RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Badge, Button, Card, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

const currentWValue = 7.2511;

const codes = [
  { code: '425110', label: 'Toilette complète', valueW: 1.657, article: 'Art.8 §1', category: 'hygiene', delta: '+0.018W', state: 'changed' as const, cumul: ['425375', '425596'] },
  { code: '425132', label: 'Toilette partielle', valueW: 0.829, article: 'Art.8 §1', category: 'hygiene', delta: '+0.011W', state: 'changed' as const, cumul: ['425434'] },
  { code: '425375', label: 'Injection SC/IM', valueW: 0.829, article: 'Art.8 §1', category: 'technique', delta: 'stable', state: 'synced' as const, cumul: ['425110', '425132'] },
  { code: '425596', label: 'Pansement simple', valueW: 0.829, article: 'Art.8 §1', category: 'wound', delta: 'stable', state: 'synced' as const, cumul: ['425110'] },
  { code: '425611', label: 'Pansement complexe', valueW: 1.657, article: 'Art.8 §1', category: 'wound', delta: 'nouveau libellé', state: 'new' as const, cumul: [] },
  { code: '425434', label: 'Préparation médicaments', valueW: 0.496, article: 'Art.8 §1', category: 'meds', delta: 'stable', state: 'synced' as const, cumul: ['425110', '425132'] },
  { code: '425692', label: 'Consultation infirmière', valueW: 0.829, article: 'Art.8 §1', category: 'consult', delta: '+0.005W', state: 'changed' as const, cumul: [] },
];

const tabs = [
  { id: 'all', label: 'Tous', count: codes.length },
  { id: 'hygiene', label: 'Hygiène', count: codes.filter((c) => c.category === 'hygiene').length },
  { id: 'wound', label: 'Plaies', count: codes.filter((c) => c.category === 'wound').length },
  { id: 'meds', label: 'Médicaments', count: codes.filter((c) => c.category === 'meds').length },
  { id: 'consult', label: 'Consult.', count: codes.filter((c) => c.category === 'consult').length },
];

export function NomenclaturePage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filtered = codes.filter((c) => {
    if (activeTab !== 'all' && c.category !== activeTab) return false;
    if (search && !c.code.includes(search) && !c.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Edit3 className="h-5 w-5" />}
        title="Gouvernance nomenclature"
        subtitle="Suivi INAMI Art.8, valeurs W et changements"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" />Sync INAMI</Button>}
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
            <p className="text-lg font-bold text-white">{codes.filter((c) => c.state !== 'synced').length}</p>
            <p className="text-[10px] text-white/60">Deltas</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">3 changements à valider</p>
            <p className="text-xs text-[var(--text-muted)]">Une variation de valeur W et un changement de libellé ont été détectés depuis la dernière revue du 4 mars 2026.</p>
          </div>
          <Button variant="outline" size="sm">Comparer</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-blue-500">06/03</p>
          <p className="text-[10px] text-[var(--text-muted)]">Dernière sync</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">4</p>
          <p className="text-[10px] text-[var(--text-muted)]">Catégories</p>
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

      <Input placeholder="Rechercher code ou libellé..." icon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-2">
        {filtered.map((c) => (
          <Card key={c.code} hover>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-mc-blue-50 dark:bg-mc-blue-900/30 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold font-mono text-mc-blue-500">{c.valueW.toFixed(3)}</span>
                <span className="text-[9px] text-[var(--text-muted)]">W</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <Badge variant="outline">{c.article}</Badge>
                  <Badge variant={c.state === 'synced' ? 'green' : c.state === 'changed' ? 'amber' : 'blue'}>
                    {c.state === 'synced' ? 'Synced' : c.state === 'changed' ? 'Modifié' : 'Nouveau'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">Code {c.code} · Catégorie {c.category}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium ${c.delta === 'stable' ? 'text-mc-green-500' : c.state === 'new' ? 'text-mc-blue-500' : 'text-mc-amber-500'}`}>
                    {c.delta}
                  </span>
                  {c.cumul.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)]">Cumuls: {c.cumul.join(', ')}</span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ArrowUpRight className="h-3 w-3" />
                Revoir
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
