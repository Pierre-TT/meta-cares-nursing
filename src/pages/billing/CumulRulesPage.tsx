import { useState } from 'react';
import { Layers, Plus, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, Badge, AnimatedPage, GradientHeader } from '@/design-system';

interface Code { id: string; code: string; description: string; }
type CumulResult = 'allowed' | 'forbidden' | 'conditional';

const codeList: Code[] = [
  { id: '1', code: '425110', description: 'Toilette complète' },
  { id: '2', code: '425132', description: 'Toilette partielle' },
  { id: '3', code: '425154', description: 'Soins d\'hygiène spécifiques' },
  { id: '4', code: '425375', description: 'Injection SC/IM/ID' },
  { id: '5', code: '425390', description: 'Injection IV (perfusion)' },
  { id: '6', code: '425434', description: 'Préparation médicaments' },
  { id: '7', code: '425596', description: 'Pansement simple' },
  { id: '8', code: '425611', description: 'Pansement complexe' },
  { id: '9', code: '425050', description: 'Forfait A' },
  { id: '10', code: '425072', description: 'Forfait B' },
  { id: '11', code: '425094', description: 'Forfait C' },
  { id: '12', code: '425516', description: 'Suppl. dimanche/férié' },
  { id: '13', code: '425531', description: 'Suppl. nuit' },
];

const rules: Record<string, Record<string, { result: CumulResult; note: string }>> = {
  '425110': {
    '425132': { result: 'forbidden', note: 'Toilette complète et partielle ne sont pas cumulables le même jour' },
    '425154': { result: 'forbidden', note: 'Hygiène spécifique non cumulable avec toilette complète' },
    '425375': { result: 'allowed', note: 'Injection cumulable avec toilette complète' },
    '425434': { result: 'allowed', note: 'Préparation médicaments cumulable' },
    '425596': { result: 'allowed', note: 'Pansement simple cumulable' },
    '425611': { result: 'allowed', note: 'Pansement complexe cumulable' },
    '425516': { result: 'allowed', note: 'Suppléments toujours cumulables' },
    '425531': { result: 'allowed', note: 'Suppléments toujours cumulables' },
  },
  '425132': {
    '425110': { result: 'forbidden', note: 'Toilette partielle et complète non cumulables' },
    '425154': { result: 'forbidden', note: 'Hygiène spécifique non cumulable avec toilette partielle' },
    '425375': { result: 'allowed', note: 'Injection cumulable avec toilette partielle' },
    '425434': { result: 'allowed', note: 'Préparation médicaments cumulable' },
  },
  '425596': {
    '425611': { result: 'forbidden', note: 'Pansement simple et complexe non cumulables le même jour' },
  },
  '425611': {
    '425596': { result: 'forbidden', note: 'Pansement complexe et simple non cumulables le même jour' },
  },
  '425050': {
    '425072': { result: 'forbidden', note: 'Forfaits A et B non cumulables' },
    '425094': { result: 'forbidden', note: 'Forfaits A et C non cumulables' },
    '425110': { result: 'conditional', note: 'Forfait A inclut la toilette — cumul conditionnel' },
    '425132': { result: 'conditional', note: 'Forfait A inclut la toilette — cumul conditionnel' },
  },
  '425072': {
    '425050': { result: 'forbidden', note: 'Forfaits B et A non cumulables' },
    '425094': { result: 'forbidden', note: 'Forfaits B et C non cumulables' },
  },
  '425094': {
    '425050': { result: 'forbidden', note: 'Forfaits C et A non cumulables' },
    '425072': { result: 'forbidden', note: 'Forfaits C et B non cumulables' },
  },
};

function checkCumul(a: string, b: string): { result: CumulResult; note: string } {
  if (a === b) return { result: 'forbidden', note: 'Même code — pas de cumul avec soi-même' };
  return rules[a]?.[b] ?? rules[b]?.[a] ?? { result: 'allowed', note: 'Aucune restriction connue' };
}

const resultConfig = {
  allowed: { label: 'Autorisé', variant: 'green' as const, icon: <CheckCircle className="h-4 w-4 text-mc-green-500" />, bg: 'bg-mc-green-500/10' },
  forbidden: { label: 'Interdit', variant: 'red' as const, icon: <AlertTriangle className="h-4 w-4 text-mc-red-500" />, bg: 'bg-mc-red-500/10' },
  conditional: { label: 'Conditionnel', variant: 'amber' as const, icon: <Info className="h-4 w-4 text-mc-amber-500" />, bg: 'bg-mc-amber-500/10' },
};

export function CumulRulesPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const interactions: { codeA: string; codeB: string; result: CumulResult; note: string }[] = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const check = checkCumul(selected[i], selected[j]);
      interactions.push({ codeA: selected[i], codeB: selected[j], ...check });
    }
  }
  interactions.sort((a, b) => {
    const order = { forbidden: 0, conditional: 1, allowed: 2 };
    return order[a.result] - order[b.result];
  });

  const forbiddenCount = interactions.filter(i => i.result === 'forbidden').length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Layers className="h-5 w-5" />}
        title="Règles de cumul"
        subtitle="Vérificateur de compatibilité INAMI"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{selected.length}</p>
            <p className="text-[10px] text-white/60">Codes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${forbiddenCount > 0 ? 'text-mc-red-300' : 'text-mc-green-300'}`}>{interactions.length}</p>
            <p className="text-[10px] text-white/60">Paires</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${forbiddenCount > 0 ? 'text-mc-red-300' : 'text-mc-green-300'}`}>{forbiddenCount}</p>
            <p className="text-[10px] text-white/60">Interdits</p>
          </div>
        </div>
      </GradientHeader>

      {/* Selected codes */}
      <Card>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Codes sélectionnés</p>
        <div className="flex flex-wrap gap-2">
          {selected.map(code => {
            return (
              <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mc-blue-500/10 text-sm font-medium text-mc-blue-500">
                {code}
                <button onClick={() => setSelected(prev => prev.filter(s => s !== code))} className="ml-0.5 hover:text-mc-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[var(--border-default)] text-sm text-[var(--text-muted)] hover:border-mc-blue-500 hover:text-mc-blue-500 transition-colors"
          >
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        </div>

        {showPicker && (
          <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
            {codeList.filter(c => !selected.includes(c.code)).map(c => (
              <button
                key={c.id}
                onClick={() => { setSelected(prev => [...prev, c.code]); setShowPicker(false); }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left transition-colors"
              >
                <div>
                  <span className="text-sm font-mono font-medium">{c.code}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">{c.description}</span>
                </div>
                <Plus className="h-4 w-4 text-mc-blue-500" />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Results */}
      {selected.length >= 2 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">
            {forbiddenCount > 0
              ? `⚠ ${forbiddenCount} cumul${forbiddenCount > 1 ? 's' : ''} interdit${forbiddenCount > 1 ? 's' : ''} détecté${forbiddenCount > 1 ? 's' : ''}`
              : '✓ Tous les cumuls sont autorisés'
            }
          </p>

          {interactions.map((inter, idx) => {
            const cfg = resultConfig[inter.result];
            return (
              <Card key={idx} className={`border-l-4 ${inter.result === 'forbidden' ? 'border-l-mc-red-500' : inter.result === 'conditional' ? 'border-l-mc-amber-500' : 'border-l-mc-green-500'}`}>
                <div className="flex items-start gap-3">
                  {cfg.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-semibold">{inter.codeA}</span>
                      <span className="text-xs text-[var(--text-muted)]">+</span>
                      <span className="text-sm font-mono font-semibold">{inter.codeB}</span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{inter.note}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected.length < 2 && (
        <Card className="text-center py-8">
          <Layers className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium">Sélectionnez au moins 2 codes INAMI</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">pour vérifier les règles de cumul</p>
        </Card>
      )}

      <div className="p-3 rounded-xl bg-mc-blue-500/5 border border-mc-blue-500/20">
        <p className="text-[10px] text-center text-[var(--text-muted)]">
          ⚠ Cet outil est une aide à la décision basée sur la nomenclature Art.8 en vigueur. Consultez toujours les circulaires INAMI pour les cas complexes.
        </p>
      </div>
    </AnimatedPage>
  );
}
