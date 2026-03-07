import { useState } from 'react';
import { FileText, Download, Eye, Search, File, FileImage, FilePlus } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, ContentTabs, GradientHeader } from '@/design-system';

interface Document {
  id: string;
  name: string;
  type: 'prescription' | 'report' | 'invoice' | 'care_plan' | 'consent' | 'lab';
  date: string;
  author: string;
  size: string;
  format: string;
  read: boolean;
}

const documents: Document[] = [
  { id: '1', name: 'Prescription — Insuline Lantus', type: 'prescription', date: '01/03/2025', author: 'Dr. Janssen', size: '124 KB', format: 'PDF', read: true },
  { id: '2', name: 'Rapport de soins — Février 2025', type: 'report', date: '28/02/2025', author: 'Marie Lemaire', size: '256 KB', format: 'PDF', read: true },
  { id: '3', name: 'Facture — Février 2025', type: 'invoice', date: '01/03/2025', author: 'Bureau tarification', size: '89 KB', format: 'PDF', read: false },
  { id: '4', name: 'Plan de soins infirmiers', type: 'care_plan', date: '15/01/2025', author: 'Marie Lemaire', size: '312 KB', format: 'PDF', read: true },
  { id: '5', name: 'Consentement éclairé', type: 'consent', date: '01/01/2025', author: 'Admin', size: '45 KB', format: 'PDF', read: true },
  { id: '6', name: 'Résultats labo — Glycémie HbA1c', type: 'lab', date: '20/02/2025', author: 'Labo BioRef', size: '156 KB', format: 'PDF', read: false },
  { id: '7', name: 'Prescription — Metformine', type: 'prescription', date: '01/01/2025', author: 'Dr. Dupont', size: '118 KB', format: 'PDF', read: true },
  { id: '8', name: 'Facture — Janvier 2025', type: 'invoice', date: '01/02/2025', author: 'Bureau tarification', size: '92 KB', format: 'PDF', read: true },
];

const typeLabels: Record<Document['type'], string> = {
  prescription: 'Prescription',
  report: 'Rapport',
  invoice: 'Facture',
  care_plan: 'Plan de soins',
  consent: 'Consentement',
  lab: 'Labo',
};

const typeVariants: Record<Document['type'], string> = {
  prescription: 'blue',
  report: 'green',
  invoice: 'amber',
  care_plan: 'blue',
  consent: 'default',
  lab: 'green',
};

function DocList({ docs }: { docs: Document[] }) {
  const [search, setSearch] = useState('');
  const filtered = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher un document..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
        />
      </div>

      {filtered.map(doc => (
        <Card key={doc.id} className="hover:ring-2 hover:ring-mc-blue-500/20 transition-all">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-mc-blue-500/10 flex items-center justify-center shrink-0">
              {doc.type === 'lab' ? <FileImage className="h-5 w-5 text-mc-green-500" /> : <FileText className="h-5 w-5 text-mc-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm truncate">
                  {!doc.read && <span className="inline-block h-2 w-2 rounded-full bg-mc-blue-500 mr-1.5" />}
                  {doc.name}
                </p>
                <Badge variant={typeVariants[doc.type] as 'blue' | 'green' | 'amber' | 'default'}>
                  {typeLabels[doc.type]}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {doc.date} · {doc.author} · {doc.size} · {doc.format}
              </p>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <Eye className="h-3.5 w-3.5" /> Voir
                </Button>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <Download className="h-3.5 w-3.5" /> Télécharger
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[var(--text-muted)]">
          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun document trouvé</p>
        </div>
      )}
    </div>
  );
}

export function DocumentsPage() {
  const prescriptions = documents.filter(d => d.type === 'prescription');
  const reports = documents.filter(d => d.type === 'report' || d.type === 'lab');
  const invoices = documents.filter(d => d.type === 'invoice');
  const unread = documents.filter(d => !d.read).length;

  const tabs = [
    { id: 'all', label: `Tous (${documents.length})`, content: <DocList docs={documents} /> },
    { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, content: <DocList docs={prescriptions} /> },
    { id: 'reports', label: `Rapports (${reports.length})`, content: <DocList docs={reports} /> },
    { id: 'invoices', label: `Factures (${invoices.length})`, content: <DocList docs={invoices} /> },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<FileText className="h-5 w-5" />}
        title="Mes Documents"
        subtitle={`${documents.length} documents disponibles`}
        badge={unread > 0 ? <Badge variant="blue">{unread} nouveau{unread > 1 ? 'x' : ''}</Badge> : undefined}
      />
      <ContentTabs tabs={tabs} />

      {/* Digital signature request */}
      <Card className="flex items-center gap-3 border border-mc-blue-200 dark:border-mc-blue-800 bg-mc-blue-50 dark:bg-mc-blue-900/15">
        <FilePlus className="h-5 w-5 text-mc-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold">Signature numérique requise</p>
          <p className="text-[10px] text-[var(--text-muted)]">Consentement éclairé — nouveau traitement Insuline. Signez depuis votre appareil.</p>
        </div>
        <Button variant="primary" size="sm">Signer</Button>
      </Card>
    </AnimatedPage>
  );
}
