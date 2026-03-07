import { useState } from 'react';
import { Pill, Plus, X, AlertTriangle, CheckCircle, Info, Search, ExternalLink } from 'lucide-react';
import { GradientHeader, Card, Badge, AnimatedPage } from '@/design-system';

interface Drug {
  id: string;
  name: string;
  activeIngredient: string;
}

interface Interaction {
  drug1: string;
  drug2: string;
  severity: 'critical' | 'moderate' | 'mild' | 'none';
  description: string;
  recommendation: string;
}

const drugDatabase: Drug[] = [
  { id: '1', name: 'Dafalgan 1g', activeIngredient: 'Paracétamol' },
  { id: '2', name: 'Aspirine 100mg', activeIngredient: 'Acide acétylsalicylique' },
  { id: '3', name: 'Marcoumar', activeIngredient: 'Phénprocoumone' },
  { id: '4', name: 'Glucophage 850', activeIngredient: 'Metformine' },
  { id: '5', name: 'Amlor 5mg', activeIngredient: 'Amlodipine' },
  { id: '6', name: 'Lipitor 20mg', activeIngredient: 'Atorvastatine' },
  { id: '7', name: 'Pantomed 40mg', activeIngredient: 'Pantoprazole' },
  { id: '8', name: 'Lexotan 3mg', activeIngredient: 'Bromazépam' },
  { id: '9', name: 'Contramal 50mg', activeIngredient: 'Tramadol' },
  { id: '10', name: 'Clexane 40mg', activeIngredient: 'Énoxaparine' },
  { id: '11', name: 'Augmentin 875', activeIngredient: 'Amoxicilline/Ac. clavulanique' },
  { id: '12', name: 'Zolpidem 10mg', activeIngredient: 'Zolpidem' },
];

const knownInteractions: Interaction[] = [
  { drug1: '2', drug2: '3', severity: 'critical', description: 'Risque hémorragique majeur — potentialisation anticoagulante', recommendation: 'CONTRE-INDIQUÉ: Ne jamais associer aspirine et anticoagulant oral sans avis médical explicite' },
  { drug1: '2', drug2: '10', severity: 'critical', description: 'Double risque hémorragique — aspirine + HBPM', recommendation: 'Surveiller signes hémorragiques, contrôler anti-Xa' },
  { drug1: '3', drug2: '10', severity: 'critical', description: 'Association de deux anticoagulants — risque hémorragique très élevé', recommendation: 'Vérifier protocole relais avec le médecin prescripteur' },
  { drug1: '8', drug2: '9', severity: 'critical', description: 'Dépression respiratoire — benzodiazépine + opioïde', recommendation: 'Surveillance rapprochée, éviter association sauf protocole spécifique' },
  { drug1: '8', drug2: '12', severity: 'moderate', description: 'Sédation excessive — double sédation SNC', recommendation: 'Administrer à distance, surveiller somnolence' },
  { drug1: '9', drug2: '12', severity: 'moderate', description: 'Risque de sédation excessive et dépression respiratoire modérée', recommendation: 'Espacer les prises, surveiller la respiration' },
  { drug1: '4', drug2: '11', severity: 'mild', description: 'Risque faible de diminution d\'absorption de la metformine', recommendation: 'Surveiller glycémie, pas de contre-indication formelle' },
  { drug1: '5', drug2: '6', severity: 'mild', description: 'Légère augmentation des taux d\'amlodipine avec atorvastatine', recommendation: 'Surveillance clinique, ajustement posologique rarement nécessaire' },
];

const severityConfig = {
  critical: { label: 'Critique', variant: 'red' as const, bg: 'bg-mc-red-500/10', icon: <AlertTriangle className="h-4 w-4 text-mc-red-500" /> },
  moderate: { label: 'Modéré', variant: 'amber' as const, bg: 'bg-mc-amber-500/10', icon: <AlertTriangle className="h-4 w-4 text-mc-amber-500" /> },
  mild: { label: 'Faible', variant: 'blue' as const, bg: 'bg-mc-blue-500/10', icon: <Info className="h-4 w-4 text-mc-blue-500" /> },
  none: { label: 'Aucune', variant: 'green' as const, bg: 'bg-mc-green-500/10', icon: <CheckCircle className="h-4 w-4 text-mc-green-500" /> },
};

function findInteractions(selectedIds: string[]): Interaction[] {
  const results: Interaction[] = [];
  for (let i = 0; i < selectedIds.length; i++) {
    for (let j = i + 1; j < selectedIds.length; j++) {
      const a = selectedIds[i], b = selectedIds[j];
      const found = knownInteractions.find(
        int => (int.drug1 === a && int.drug2 === b) || (int.drug1 === b && int.drug2 === a)
      );
      if (found) results.push(found);
    }
  }
  return results.sort((a, b) => {
    const order = { critical: 0, moderate: 1, mild: 2, none: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export function DrugInteractionCheckerPage() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const interactions = findInteractions(selectedDrugs);
  const criticalCount = interactions.filter(i => i.severity === 'critical').length;

  const filteredDrugs = drugDatabase.filter(d =>
    !selectedDrugs.includes(d.id) &&
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.activeIngredient.toLowerCase().includes(search.toLowerCase()))
  );

  const addDrug = (id: string) => {
    setSelectedDrugs(prev => [...prev, id]);
    setSearch('');
    setShowSearch(false);
  };

  const removeDrug = (id: string) => {
    setSelectedDrugs(prev => prev.filter(d => d !== id));
  };

  const getDrugName = (id: string) => drugDatabase.find(d => d.id === id)?.name ?? id;

  return (
    <AnimatedPage>
      <GradientHeader
        title="Interactions"
        subtitle="Vérificateur d'interactions médicamenteuses"
        icon={<Pill className="h-5 w-5 text-white" />}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{selectedDrugs.length}</p>
            <p className="text-[10px] text-white/60">Médicaments</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${criticalCount > 0 ? 'text-mc-red-300' : 'text-white'}`}>{interactions.length}</p>
            <p className="text-[10px] text-white/60">Interactions</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${criticalCount > 0 ? 'text-mc-red-300' : 'text-mc-green-300'}`}>{criticalCount}</p>
            <p className="text-[10px] text-white/60">Critiques</p>
          </div>
        </div>
      </GradientHeader>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Selected drugs */}
        <Card>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Médicaments sélectionnés</p>
          <div className="flex flex-wrap gap-2">
            {selectedDrugs.map(id => (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mc-blue-500/10 text-sm font-medium text-mc-blue-500">
                <Pill className="h-3 w-3" /> {getDrugName(id)}
                <button onClick={() => removeDrug(id)} className="ml-0.5 hover:text-mc-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setShowSearch(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[var(--border-default)] text-sm text-[var(--text-muted)] hover:border-mc-blue-500 hover:text-mc-blue-500 transition-colors"
            >
              <Plus className="h-3 w-3" /> Ajouter
            </button>
          </div>

          {showSearch && (
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un médicament..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredDrugs.map(drug => (
                  <button
                    key={drug.id}
                    onClick={() => addDrug(drug.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{drug.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{drug.activeIngredient}</p>
                    </div>
                    <Plus className="h-4 w-4 text-mc-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Results */}
        {selectedDrugs.length >= 2 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              {interactions.length > 0
                ? `${interactions.length} interaction${interactions.length > 1 ? 's' : ''} détectée${interactions.length > 1 ? 's' : ''}`
                : 'Aucune interaction connue'}
            </p>

            {interactions.length === 0 && (
              <Card className="bg-mc-green-500/10 border border-mc-green-500/30">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-mc-green-500" />
                  <div>
                    <p className="text-sm font-medium text-mc-green-600">Pas d'interaction détectée</p>
                    <p className="text-xs text-[var(--text-muted)]">Vérifiez toujours le BCFI pour confirmation</p>
                  </div>
                </div>
              </Card>
            )}

            {interactions.map((inter, idx) => {
              const cfg = severityConfig[inter.severity];
              return (
                <Card key={idx} className={`border-l-4 ${inter.severity === 'critical' ? 'border-l-mc-red-500' : inter.severity === 'moderate' ? 'border-l-mc-amber-500' : 'border-l-mc-blue-500'}`}>
                  <div className="flex items-start gap-3">
                    {cfg.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{getDrugName(inter.drug1)} + {getDrugName(inter.drug2)}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{inter.description}</p>
                      <div className="mt-2 p-2 rounded-lg bg-[var(--bg-secondary)]">
                        <p className="text-xs font-medium">💡 {inter.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* BCFI link */}
        <a
          href="https://www.bcfi.be"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-mc-blue-500/10 flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-mc-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">BCFI / CBIP</p>
                <p className="text-xs text-[var(--text-muted)]">Centre Belge d'Information Pharmacothérapeutique</p>
              </div>
            </div>
            <Badge variant="blue">Référence</Badge>
          </Card>
        </a>

        <p className="text-[10px] text-center text-[var(--text-muted)]">
          ⚠ Cet outil est une aide à la décision. Consultez toujours le BCFI et le médecin prescripteur pour confirmation.
        </p>
      </div>
    </AnimatedPage>
  );
}
