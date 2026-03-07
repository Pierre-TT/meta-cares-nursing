import { useState } from 'react';
import { Siren, Phone, Search, ChevronDown, ChevronUp, Heart, Droplets, Brain, AlertTriangle, Wind, Bone } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage } from '@/design-system';

interface Protocol {
  id: string;
  title: string;
  icon: React.ReactNode;
  severity: 'critical' | 'urgent' | 'important';
  steps: string[];
  medications?: string[];
  notes?: string;
}

const protocols: Protocol[] = [
  {
    id: 'anaphylaxis', title: 'Anaphylaxie', icon: <AlertTriangle className="h-5 w-5" />, severity: 'critical',
    steps: ['Retirer l\'allergène si possible', 'Appeler le 112 immédiatement', 'Administrer adrénaline IM (Epipen) cuisse antérolatérale', 'Position allongée, jambes surélevées (sauf si dyspnée → position assise)', 'Surveiller voies aériennes, respiration, circulation', 'Si pas d\'amélioration après 5 min → 2e dose adrénaline', 'Préparer réanimation si arrêt'],
    medications: ['Adrénaline 0.3-0.5 mg IM (adulte)', 'Antihistaminique IV si disponible', 'Corticoïdes IV si disponible'],
  },
  {
    id: 'cardiac_arrest', title: 'Arrêt cardiaque', icon: <Heart className="h-5 w-5" />, severity: 'critical',
    steps: ['Vérifier conscience et respiration (10 sec max)', 'Appeler le 112 — demander DEA', 'Commencer RCP: 30 compressions / 2 insufflations', 'Compressions: 5-6 cm de profondeur, 100-120/min', 'Utiliser DEA dès disponible', 'Ne pas interrompre les compressions', 'Continuer jusqu\'à arrivée des secours'],
    notes: 'Ratio 30:2. Changer de réanimateur toutes les 2 minutes.',
  },
  {
    id: 'hypoglycemia', title: 'Hypoglycémie sévère', icon: <Droplets className="h-5 w-5" />, severity: 'urgent',
    steps: ['Contrôler glycémie capillaire', 'Si patient conscient: 15-20g de sucre rapide (3 morceaux de sucre, jus de fruit)', 'Recontrôler glycémie après 15 min', 'Si patient inconscient: NE PAS donner à boire', 'Appeler le 112', 'Position latérale de sécurité', 'Glucagon 1 mg IM/SC si disponible'],
    medications: ['Glucagon 1 mg IM ou SC', 'Glucose 30% IV (si accès veineux)'],
  },
  {
    id: 'fall', title: 'Chute avec traumatisme', icon: <Bone className="h-5 w-5" />, severity: 'urgent',
    steps: ['Ne pas mobiliser si suspicion de fracture du col ou rachis', 'Évaluer conscience, douleur (EVA), déformation', 'Vérifier pouls distaux, sensibilité, motricité', 'Immobiliser le membre si fracture suspectée', 'Appliquer glace si hématome', 'Appeler le 112 si fracture, perte de conscience ou trauma crânien', 'Déclarer l\'incident (formulaire obligatoire)'],
  },
  {
    id: 'stroke', title: 'AVC / AIT (FAST)', icon: <Brain className="h-5 w-5" />, severity: 'critical',
    steps: ['FAST: Face (asymétrie?), Arms (faiblesse?), Speech (trouble?), Time (noter l\'heure!)', 'Appeler le 112 — signaler suspicion AVC', 'Allonger avec tête surélevée à 30°', 'NE PAS donner à boire ni manger', 'NE PAS administrer d\'aspirine', 'Noter l\'heure exacte de début des symptômes', 'Préparer transfert vers stroke unit'],
    notes: 'Fenêtre thérapeutique thrombolyse: 4h30 max après début des symptômes.',
  },
  {
    id: 'hemorrhage', title: 'Hémorragie', icon: <Droplets className="h-5 w-5" />, severity: 'urgent',
    steps: ['Compression directe avec compresse stérile', 'Surélever le membre si possible', 'Si hémorragie ne cède pas: point de compression artérielle', 'Garrot en dernier recours (noter l\'heure!)', 'Appeler le 112 si hémorragie importante', 'Surveiller signes de choc (pâleur, tachycardie, hypotension)', 'Position de Trendelenburg si choc'],
  },
  {
    id: 'respiratory', title: 'Détresse respiratoire', icon: <Wind className="h-5 w-5" />, severity: 'critical',
    steps: ['Position assise ou semi-assise', 'Libérer les voies aériennes', 'Desserrer les vêtements', 'Administrer O₂ si disponible (2-4 L/min)', 'Vérifier SpO₂ si oxymètre disponible', 'Appeler le 112 si SpO₂ < 90% ou détresse sévère', 'Bronchodilatateur si prescrit (asthme/BPCO)'],
  },
];

const emergencyNumbers = [
  { name: '🚑 Urgences', number: '112' },
  { name: '☠ Centre Anti-Poisons', number: '070 245 245' },
  { name: '🔥 Pompiers', number: '112' },
  { name: '👮 Police', number: '101' },
  { name: '🧒 Child Focus', number: '116 000' },
  { name: '🆘 Aide suicide', number: '0800 32 123' },
];

const severityConfig = {
  critical: { label: 'Critique', variant: 'red' as const, bg: 'bg-mc-red-500/10', border: 'border-l-mc-red-500' },
  urgent: { label: 'Urgent', variant: 'amber' as const, bg: 'bg-mc-amber-500/10', border: 'border-l-mc-amber-500' },
  important: { label: 'Important', variant: 'blue' as const, bg: 'bg-mc-blue-500/10', border: 'border-l-mc-blue-500' },
};

export function EmergencyProtocolsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search
    ? protocols.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : protocols;

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="bg-mc-red-500 rounded-2xl px-4 py-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Siren className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Protocoles d'urgence</h1>
            <p className="text-xs text-white/70">Référence rapide — soins infirmiers à domicile</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {emergencyNumbers.slice(0, 3).map(n => (
            <a key={n.number} href={`tel:${n.number.replace(/\s/g, '')}`} className="text-center py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
              <p className="text-lg font-bold">{n.number}</p>
              <p className="text-[10px] text-white/70">{n.name}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un protocole..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-red-500/50"
        />
      </div>

      {/* Protocols */}
      <div className="space-y-3">
        {filtered.map(protocol => {
          const expanded = expandedId === protocol.id;
          const cfg = severityConfig[protocol.severity];
          return (
            <Card key={protocol.id} className={`border-l-4 ${cfg.border}`}>
              <button className="w-full flex items-center justify-between" onClick={() => setExpandedId(expanded ? null : protocol.id)}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                    {protocol.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{protocol.title}</p>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </div>
                {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
              </button>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Étapes</p>
                    <div className="space-y-2">
                      {protocol.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-mc-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {protocol.medications && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Médicaments</p>
                      <div className="space-y-1">
                        {protocol.medications.map((med, i) => (
                          <p key={i} className="text-sm text-mc-blue-500">💊 {med}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {protocol.notes && (
                    <div className="p-2 rounded-lg bg-mc-amber-500/10 text-xs">
                      <p className="font-medium text-mc-amber-600">⚠ Note: {protocol.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* All emergency numbers */}
      <Card>
        <CardHeader><CardTitle>Numéros d'urgence</CardTitle></CardHeader>
        <div className="space-y-2">
          {emergencyNumbers.map(n => (
            <a key={n.name} href={`tel:${n.number.replace(/\s/g, '')}`} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-sm">{n.name}</span>
              <Button variant="outline" size="sm" className="gap-1">
                <Phone className="h-3 w-3" /> {n.number}
              </Button>
            </a>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
