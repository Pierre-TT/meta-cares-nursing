import { useState } from 'react';
import { BookOpen, Search, Info, Hash } from 'lucide-react';
import { Card, Badge, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

interface NomenclatureCode {
  code: string;
  description: string;
  wValue: number;
  rate: number;
  category: 'toilette' | 'injection' | 'pansement' | 'forfait' | 'supplement' | 'other';
  katzReq?: string;
  conditions?: string;
  cumuls?: string[];
  cumulForbidden?: string[];
}

const W_RATE = 7.2511; // €/W 2026

const codes: NomenclatureCode[] = [
  { code: '425110', description: 'Toilette complète — forfait journalier', wValue: 5.143, rate: 37.29, category: 'toilette', katzReq: 'Katz B, C ou Cd', conditions: 'Max 1x/jour. Prescription requise.', cumulForbidden: ['425132', '425154'] },
  { code: '425132', description: 'Toilette partielle — forfait journalier', wValue: 2.571, rate: 18.64, category: 'toilette', katzReq: 'Katz A, B, C ou Cd', conditions: 'Max 1x/jour. Prescription requise.', cumulForbidden: ['425110', '425154'] },
  { code: '425154', description: 'Soins d\'hygiène spécifiques', wValue: 1.286, rate: 9.33, category: 'toilette', conditions: 'Situation particulière justifiée', cumulForbidden: ['425110', '425132'] },
  { code: '425375', description: 'Injection SC, IM ou ID', wValue: 1.029, rate: 7.46, category: 'injection', conditions: 'Prescription médicale obligatoire', cumuls: ['425110', '425132', '425434'] },
  { code: '425390', description: 'Injection IV (perfusion)', wValue: 2.057, rate: 14.92, category: 'injection', conditions: 'Prescription + formation spécifique requise' },
  { code: '425434', description: 'Préparation et administration de médicaments', wValue: 1.543, rate: 11.19, category: 'forfait', katzReq: 'Katz A, B, C ou Cd', conditions: 'Pilulier hebdomadaire. Max 1x/semaine.', cumuls: ['425110', '425132', '425375'] },
  { code: '425596', description: 'Pansement simple', wValue: 1.543, rate: 11.19, category: 'pansement', conditions: 'Prescription requise', cumulForbidden: ['425611'] },
  { code: '425611', description: 'Pansement complexe', wValue: 5.143, rate: 37.29, category: 'pansement', conditions: 'Accord préalable requis. Prescription spécialisée.', cumulForbidden: ['425596'] },
  { code: '425633', description: 'Surveillance plaie chronique', wValue: 0.771, rate: 5.59, category: 'pansement', conditions: 'Suivi protocole plaie documenté' },
  { code: '425050', description: 'Forfait A — soins de base journalier', wValue: 3.086, rate: 22.38, category: 'forfait', katzReq: 'Katz A', conditions: 'Forfait journalier global' },
  { code: '425072', description: 'Forfait B — soins étendus journalier', wValue: 7.714, rate: 55.94, category: 'forfait', katzReq: 'Katz B', conditions: 'Forfait journalier global' },
  { code: '425094', description: 'Forfait C — soins intensifs journalier', wValue: 12.343, rate: 89.50, category: 'forfait', katzReq: 'Katz C ou Cd', conditions: 'Forfait journalier global' },
  { code: '425516', description: 'Supplément dimanche/jour férié', wValue: 0.857, rate: 6.21, category: 'supplement', conditions: 'Cumulable avec tout acte' },
  { code: '425531', description: 'Supplément nuit (20h-8h)', wValue: 1.714, rate: 12.43, category: 'supplement', conditions: 'Cumulable avec tout acte' },
  { code: '425553', description: 'Supplément urgence', wValue: 1.286, rate: 9.33, category: 'supplement', conditions: 'Urgence justifiée et documentée' },
];

const categoryLabels: Record<string, string> = {
  all: 'Tout',
  toilette: 'Toilette',
  injection: 'Injections',
  pansement: 'Pansements',
  forfait: 'Forfaits',
  supplement: 'Suppléments',
};

export function NomenclatureReferencePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const filtered = codes.filter(c => {
    const matchSearch = !search || c.code.includes(search) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<BookOpen className="h-5 w-5" />}
        title="Nomenclature INAMI"
        subtitle="Article 8 — Soins infirmiers à domicile"
        badge={<Badge variant="blue">W = €{W_RATE.toFixed(4)}</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{codes.length}</p>
            <p className="text-[10px] text-white/60">Codes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{W_RATE.toFixed(2)}</p>
            <p className="text-[10px] text-white/60">Valeur W</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">2026</p>
            <p className="text-[10px] text-white/60">Année</p>
          </div>
        </div>
      </GradientHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par code ou description..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
        />
      </div>

      <Tabs
        tabs={Object.entries(categoryLabels).map(([id, label]) => ({ id, label }))}
        activeTab={category}
        onChange={setCategory}
      />

      {/* W value info */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
        <Info className="h-4 w-4 text-mc-blue-500 shrink-0" />
        <p className="text-xs">
          <span className="font-medium">Valeur W 2026:</span> €{W_RATE.toFixed(4)} — Tarif = W × valeur_W. Forfaits incluent tous les actes de la catégorie.
        </p>
      </div>

      <div className="space-y-2">
        {filtered.map(code => {
          const expanded = expandedCode === code.code;
          return (
            <Card key={code.code} hover className="cursor-pointer" onClick={() => setExpandedCode(expanded ? null : code.code)}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-mc-blue-500/10 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-mc-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold font-mono">{code.code}</p>
                    <Badge variant="blue">{categoryLabels[code.category]}</Badge>
                    {code.katzReq && <Badge variant="default">{code.katzReq}</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{code.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-mc-green-500">€{code.rate.toFixed(2)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{code.wValue.toFixed(3)} W</p>
                </div>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  {code.conditions && (
                    <div className="flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-mc-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs">{code.conditions}</p>
                    </div>
                  )}
                  {code.cumuls && code.cumuls.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-mc-green-500 uppercase mb-1">Cumuls autorisés</p>
                      <div className="flex flex-wrap gap-1">
                        {code.cumuls.map(c => <Badge key={c} variant="green">{c}</Badge>)}
                      </div>
                    </div>
                  )}
                  {code.cumulForbidden && code.cumulForbidden.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-mc-red-500 uppercase mb-1">Cumuls interdits</p>
                      <div className="flex flex-wrap gap-1">
                        {code.cumulForbidden.map(c => <Badge key={c} variant="red">{c}</Badge>)}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="py-1.5 rounded-lg bg-[var(--bg-secondary)]">
                      <p className="text-xs font-bold">{code.wValue.toFixed(3)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">W</p>
                    </div>
                    <div className="py-1.5 rounded-lg bg-[var(--bg-secondary)]">
                      <p className="text-xs font-bold text-mc-green-500">€{code.rate.toFixed(2)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Tarif</p>
                    </div>
                    <div className="py-1.5 rounded-lg bg-[var(--bg-secondary)]">
                      <p className="text-xs font-bold">€{(code.rate * 0.75).toFixed(2)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Remb. 75%</p>
                    </div>
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
