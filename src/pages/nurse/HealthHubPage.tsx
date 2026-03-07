import { useState } from 'react';
import { Globe, Shield, FileText, Pill, Stethoscope, CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, ContentTabs } from '@/design-system';

const hubs = [
  { id: 'cozo', name: 'CoZo', region: 'Flandre', status: 'connected' as const, lastSync: '06/03/2025 08:45' },
  { id: 'rsw', name: 'RSW', region: 'Wallonie', status: 'connected' as const, lastSync: '06/03/2025 08:45' },
  { id: 'brusafe', name: 'BruSafe+', region: 'Bruxelles', status: 'connected' as const, lastSync: '06/03/2025 08:45' },
];

const hubDocuments = [
  { id: '1', hub: 'cozo', type: 'SumEHR', title: 'SumEHR — Dr. Dupont', date: '28/02/2025', patient: 'Janssens Maria' },
  { id: '2', hub: 'cozo', type: 'Medication', title: 'Schéma médicamenteux', date: '06/03/2025', patient: 'Janssens Maria' },
  { id: '3', hub: 'rsw', type: 'Lab', title: 'Résultats labo — HbA1c', date: '20/02/2025', patient: 'Van Damme Pierre' },
  { id: '4', hub: 'rsw', type: 'Imaging', title: 'Radio thorax', date: '15/02/2025', patient: 'Dubois Françoise' },
  { id: '5', hub: 'brusafe', type: 'Letter', title: 'Lettre de sortie — CHU St-Pierre', date: '10/02/2025', patient: 'Peeters Jan' },
  { id: '6', hub: 'cozo', type: 'Vaccination', title: 'Vaccinnet+ — Grippe 2024', date: '01/11/2024', patient: 'Janssens Maria' },
];

const typeIcons: Record<string, React.ReactNode> = {
  SumEHR: <Stethoscope className="h-4 w-4 text-mc-blue-500" />,
  Medication: <Pill className="h-4 w-4 text-mc-green-500" />,
  Lab: <FileText className="h-4 w-4 text-mc-amber-500" />,
  Imaging: <FileText className="h-4 w-4 text-mc-blue-400" />,
  Letter: <FileText className="h-4 w-4 text-mc-red-500" />,
  Vaccination: <Shield className="h-4 w-4 text-mc-green-500" />,
};

export function HealthHubPage() {
  const [search, setSearch] = useState('');
  const filtered = search
    ? hubDocuments.filter(d => d.patient.toLowerCase().includes(search.toLowerCase()) || d.title.toLowerCase().includes(search.toLowerCase()))
    : hubDocuments;

  const hubStatusTab = (
    <div className="space-y-3">
      {hubs.map(hub => (
        <Card key={hub.id}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-mc-blue-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-mc-blue-500" />
              </div>
              <div>
                <p className="font-semibold">{hub.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{hub.region} · Sync: {hub.lastSync}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="green">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connecté
              </Badge>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-2 text-sm">
          <Shield className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div>
            <p className="font-medium">Hub-MetaHub</p>
            <p className="text-xs text-[var(--text-muted)]">
              Le réseau Hub-MetaHub connecte CoZo, RSW et BruSafe+ pour un accès unifié aux données de santé.
              L'accès nécessite le consentement éclairé du patient via le portail fédéral eHealth.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const documentsTab = (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text" placeholder="Rechercher par patient ou document..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
        />
      </div>

      {filtered.map(doc => (
        <Card key={doc.id} className="hover:ring-2 hover:ring-mc-blue-500/20 transition-all">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
              {typeIcons[doc.type]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{doc.title}</p>
                <Badge variant="default">{doc.hub.toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{doc.patient} · {doc.date}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const tabs = [
    { id: 'status', label: 'Connexions', content: hubStatusTab },
    { id: 'documents', label: `Documents (${hubDocuments.length})`, content: documentsTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Hubs de Santé</h1>
        <Badge variant="green">Hub-MetaHub</Badge>
      </div>
      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
