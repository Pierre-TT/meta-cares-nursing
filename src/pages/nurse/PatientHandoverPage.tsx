import { useState } from 'react';
import { ArrowRightLeft, Search, AlertTriangle, Clock, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { GradientHeader, Tabs, Card, Badge, Button, Avatar, AnimatedPage } from '@/design-system';

interface HandoverPatient {
  id: string;
  name: string;
  age: number;
  address: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  nextVisit: string;
  keyInfo: string;
  medications: string[];
  alerts: string[];
  lastNurse: string;
  lastVisitNotes: string;
}

const patients: HandoverPatient[] = [
  {
    id: '1', name: 'Mme Janssens Marie', age: 84, address: 'Rue de la Loi 12, 1000 Bruxelles',
    priority: 'critical', nextVisit: '08:00', keyInfo: 'Diabète insulino-dépendant, plaie chronique talon G',
    medications: ['Insuline Lantus 22U le soir', 'Dafalgan 1g 3x/j', 'Clexane 40mg 1x/j'],
    alerts: ['Glycémie instable — contrôle systématique', 'Plaie infectée — pansement Aquacel Ag+ à changer'],
    lastNurse: 'Sophie M.', lastVisitNotes: 'Glycémie 245 mg/dL à 18h. Plaie suintante, odeur. Médecin prévenu.'
  },
  {
    id: '2', name: 'M. Van den Berg Pierre', age: 72, address: 'Av. Louise 45, 1050 Ixelles',
    priority: 'high', nextVisit: '09:00', keyInfo: 'Post-op PTH gauche J+5, anticoagulant',
    medications: ['Clexane 40mg 1x/j', 'Paracétamol 1g 4x/j', 'Pantoprazole 40mg'],
    alerts: ['Risque TVP — surveiller mollets', 'Contrôler cicatrice et drain'],
    lastNurse: 'Sophie M.', lastVisitNotes: 'Mobilisation OK avec déambulateur. Cicatrice propre, pas de suintement.'
  },
  {
    id: '3', name: 'Mme Dupont Claire', age: 91, address: 'Chée de Waterloo 200, 1060 Saint-Gilles',
    priority: 'high', nextVisit: '10:30', keyInfo: 'Démence Alzheimer stade modéré, seule à domicile',
    medications: ['Aricept 10mg', 'Lexotan 1.5mg le soir', 'Oméprazole 20mg'],
    alerts: ['Risque de chute — vérifier environnement', 'Confusion vespérale fréquente'],
    lastNurse: 'Ahmed K.', lastVisitNotes: 'Patiente agitée, refus initial de soins. Calmée après 10 min. Repas préparé.'
  },
  {
    id: '4', name: 'M. Maes Johan', age: 67, address: 'Rue Neuve 88, 1000 Bruxelles',
    priority: 'medium', nextVisit: '11:30', keyInfo: 'BPCO stade III, oxygénothérapie nocturne',
    medications: ['Spiriva 18µg', 'Symbicort 200/6', 'Paracétamol si douleur'],
    alerts: ['SpO₂ cible > 88%', 'Exacerbation récente il y a 2 semaines'],
    lastNurse: 'Sophie M.', lastVisitNotes: 'SpO₂ 91% à l\'air ambiant. Pas de dyspnée au repos. Nébulisation effectuée.'
  },
  {
    id: '5', name: 'Mme Peeters Anna', age: 78, address: 'Bd du Midi 15, 1000 Bruxelles',
    priority: 'low', nextVisit: '14:00', keyInfo: 'Prise de sang mensuelle — contrôle INR',
    medications: ['Marcoumar selon INR', 'Amlodipine 5mg'],
    alerts: [],
    lastNurse: 'Ahmed K.', lastVisitNotes: 'INR 2.4 — dans la cible. Patiente en forme, pas de plainte.'
  },
  {
    id: '6', name: 'M. De Smet Luc', age: 55, address: 'Rue Haute 120, 1000 Bruxelles',
    priority: 'medium', nextVisit: '15:30', keyInfo: 'Stomie colostomie — soins + éducation thérapeutique',
    medications: ['Imodium si besoin', 'Crème péristomiale'],
    alerts: ['Peau péristomiale irritée — surveiller'],
    lastNurse: 'Sophie M.', lastVisitNotes: 'Appareillage changé. Rougeur péristomiale persistante. Conseils donnés.'
  },
];

const priorityConfig = {
  critical: { label: 'Critique', variant: 'red' as const, order: 0 },
  high: { label: 'Élevé', variant: 'amber' as const, order: 1 },
  medium: { label: 'Moyen', variant: 'blue' as const, order: 2 },
  low: { label: 'Faible', variant: 'green' as const, order: 3 },
};

export function PatientHandoverPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const criticalCount = patients.filter(p => p.priority === 'critical').length;
  const alertCount = patients.reduce((s, p) => s + p.alerts.length, 0);

  const filtered = patients
    .filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchTab = tab === 'all' || p.priority === tab;
      return matchSearch && matchTab;
    })
    .sort((a, b) => priorityConfig[a.priority].order - priorityConfig[b.priority].order);

  return (
    <AnimatedPage>
      <GradientHeader
        title="Transmission"
        subtitle="Relève infirmière — résumé patients"
        icon={<ArrowRightLeft className="h-5 w-5 text-white" />}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{patients.length}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-red-300">{criticalCount}</p>
            <p className="text-[10px] text-white/60">Critiques</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{alertCount}</p>
            <p className="text-[10px] text-white/60">Alertes</p>
          </div>
        </div>
      </GradientHeader>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un patient..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1 shrink-0">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>

        <Tabs
          tabs={[
            { id: 'all', label: 'Tous' },
            { id: 'critical', label: 'Critique' },
            { id: 'high', label: 'Élevé' },
            { id: 'medium', label: 'Moyen' },
            { id: 'low', label: 'Faible' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        <div className="space-y-3">
          {filtered.map(patient => {
            const expanded = expandedId === patient.id;
            const cfg = priorityConfig[patient.priority];
            return (
              <Card key={patient.id} className={`border-l-4 ${patient.priority === 'critical' ? 'border-l-mc-red-500' : patient.priority === 'high' ? 'border-l-mc-amber-500' : patient.priority === 'medium' ? 'border-l-mc-blue-500' : 'border-l-mc-green-500'}`}>
                <button className="w-full text-left" onClick={() => setExpandedId(expanded ? null : patient.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={patient.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold">{patient.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <span className="text-xs text-[var(--text-muted)]">{patient.age} ans</span>
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {patient.nextVisit}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{patient.keyInfo}</p>
                </button>

                {expanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3">
                    <p className="text-xs text-[var(--text-muted)]">📍 {patient.address}</p>

                    {/* Alerts */}
                    {patient.alerts.length > 0 && (
                      <div className="space-y-1">
                        {patient.alerts.map((alert, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-mc-red-500/10">
                            <AlertTriangle className="h-3.5 w-3.5 text-mc-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-mc-red-600">{alert}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Medications */}
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Médicaments</p>
                      <div className="space-y-0.5">
                        {patient.medications.map((med, i) => (
                          <p key={i} className="text-xs">💊 {med}</p>
                        ))}
                      </div>
                    </div>

                    {/* Last visit */}
                    <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-0.5">
                        Dernière visite — {patient.lastNurse}
                      </p>
                      <p className="text-xs">{patient.lastVisitNotes}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AnimatedPage>
  );
}
