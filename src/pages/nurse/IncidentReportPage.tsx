import { useState } from 'react';
import { AlertTriangle, Plus, User, Calendar, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

type IncidentType = 'chute' | 'erreur_med' | 'piqure' | 'agression' | 'autre';
type Severity = 'mineur' | 'modéré' | 'grave';
type IncidentStatus = 'brouillon' | 'soumis' | 'en_traitement' | 'clôturé';

interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  patient: string;
  date: string;
  time: string;
  description: string;
  actions: string;
  status: IncidentStatus;
  submittedDate?: string;
}

const incidents: Incident[] = [
  { id: '1', type: 'chute', severity: 'modéré', patient: 'Dubois Françoise', date: '05/03/2025', time: '09:30', description: 'Chute lors du transfert lit → fauteuil. Patiente glissé sur tapis humide.', actions: 'Examen immédiat, pas de fracture visible. Glaçage hanche droite. Médecin traitant contacté.', status: 'soumis', submittedDate: '05/03/2025' },
  { id: '2', type: 'erreur_med', severity: 'mineur', patient: 'Van Damme Pierre', date: '03/03/2025', time: '08:15', description: 'Dose insuline Lantus administrée 30 min en retard (oubli lors de la toilette).', actions: 'Glycémie contrôlée 1h après — 148 mg/dL (acceptable). Noté au journal. Rappel ajouté.', status: 'clôturé', submittedDate: '03/03/2025' },
  { id: '3', type: 'piqure', severity: 'mineur', patient: 'Janssens Maria', date: '01/03/2025', time: '10:45', description: 'Piqûre accidentelle avec aiguille sous-cutanée lors du retrait.', actions: 'Protocole AES appliqué. Lavage immédiat, désinfection. Médecine du travail contactée. Sérologies programmées.', status: 'en_traitement', submittedDate: '01/03/2025' },
];

const typeLabels: Record<IncidentType, string> = {
  chute: '🚶 Chute',
  erreur_med: '💊 Erreur médicamenteuse',
  piqure: '🩸 Piqûre accidentelle (AES)',
  agression: '⚠ Agression',
  autre: '📋 Autre',
};

const severityConfig: Record<Severity, { label: string; variant: 'green' | 'amber' | 'red' }> = {
  mineur: { label: 'Mineur', variant: 'green' },
  modéré: { label: 'Modéré', variant: 'amber' },
  grave: { label: 'Grave', variant: 'red' },
};

const statusConfig: Record<IncidentStatus, { label: string; variant: 'default' | 'blue' | 'amber' | 'green' }> = {
  brouillon: { label: 'Brouillon', variant: 'default' },
  soumis: { label: 'Soumis', variant: 'blue' },
  en_traitement: { label: 'En traitement', variant: 'amber' },
  clôturé: { label: 'Clôturé', variant: 'green' },
};

export function IncidentReportPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<IncidentType>('chute');
  const [formSeverity, setFormSeverity] = useState<Severity>('mineur');

  const newTab = (
    <div className="space-y-4">
      {!showForm ? (
        <Button variant="gradient" className="w-full gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Nouvelle déclaration d'incident
        </Button>
      ) : (
        <Card className="border-mc-red-200 dark:border-red-800 space-y-3">
          <CardHeader><CardTitle>Déclaration d'incident</CardTitle></CardHeader>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Type d'incident</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {(Object.entries(typeLabels) as [IncidentType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFormType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${formType === key ? 'bg-mc-red-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Gravité</label>
            <div className="flex gap-2 mt-1">
              {(Object.entries(severityConfig) as [Severity, { label: string }][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFormSeverity(key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${formSeverity === key ? 'bg-mc-blue-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Patient concerné</label>
            <input type="text" placeholder="Nom du patient..." className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Date</label>
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Heure</label>
              <input type="time" className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Description de l'incident</label>
            <textarea className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm resize-none" rows={3} placeholder="Décrivez les circonstances..." />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Actions prises</label>
            <textarea className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm resize-none" rows={2} placeholder="Mesures immédiates prises..." />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Témoins (optionnel)</label>
            <input type="text" placeholder="Noms des témoins..." className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button variant="gradient" className="flex-1 gap-1"><Send className="h-3.5 w-3.5" /> Soumettre</Button>
          </div>
        </Card>
      )}
    </div>
  );

  const historyTab = (
    <div className="space-y-3">
      {incidents.map(inc => {
        const expanded = expandedId === inc.id;
        const sevCfg = severityConfig[inc.severity];
        const statCfg = statusConfig[inc.status];
        return (
          <Card key={inc.id} className={inc.severity === 'grave' ? 'border-l-4 border-l-mc-red-500' : inc.severity === 'modéré' ? 'border-l-4 border-l-mc-amber-500' : ''}>
            <button className="w-full flex items-start justify-between" onClick={() => setExpandedId(expanded ? null : inc.id)}>
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{typeLabels[inc.type]}</span>
                  <Badge variant={sevCfg.variant}>{sevCfg.label}</Badge>
                  <Badge variant={statCfg.variant}>{statCfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <User className="h-3 w-3" /> {inc.patient}
                  <span>·</span>
                  <Calendar className="h-3 w-3" /> {inc.date} à {inc.time}
                </div>
              </div>
              {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />}
            </button>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Description</p>
                  <p className="text-sm mt-0.5">{inc.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Actions prises</p>
                  <p className="text-sm mt-0.5">{inc.actions}</p>
                </div>
                {inc.submittedDate && (
                  <p className="text-[10px] text-[var(--text-muted)]">Soumis le {inc.submittedDate}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  const tabs = [
    { id: 'new', label: 'Nouveau', content: newTab },
    { id: 'history', label: `Mes déclarations (${incidents.length})`, content: historyTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Déclaration d'incidents"
        subtitle="Signalement obligatoire"
        badge={<Badge variant="red">Obligatoire</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{incidents.length}</p>
            <p className="text-[10px] text-white/60">Total</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{incidents.filter(i => i.status === 'en_traitement').length}</p>
            <p className="text-[10px] text-white/60">En cours</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{incidents.filter(i => i.status === 'clôturé').length}</p>
            <p className="text-[10px] text-white/60">Clôturés</p>
          </div>
        </div>
      </GradientHeader>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
